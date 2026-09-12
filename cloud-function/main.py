import hmac
import hashlib
import os
import json
import base64
import requests
from google.cloud import storage, secretmanager

# Config via env vars (ver README despliegue)
GITHUB_TOKEN_SECRET = os.getenv("GITHUB_TOKEN_SECRET", "github-token")
WEBHOOK_SECRET_NAME = os.getenv("WEBHOOK_SECRET_NAME", "github-webhook-secret")
PROJECT_ID = os.getenv("GCP_PROJECT", "")
RAW_BUCKET = os.getenv("RAW_BUCKET", "cesmag-sql-raw")
COMPOSER_ENV = os.getenv("COMPOSER_ENV", "")
COMPOSER_REGION = os.getenv("COMPOSER_REGION", "us-central1")
DAG_ID = os.getenv("DAG_ID", "sql_validation_dag")


def _get_secret(secret_id: str) -> str:
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{PROJECT_ID}/secrets/{secret_id}/versions/latest"
    return client.access_secret_version(name=name).payload.data.decode()


def _valid_signature(secret: str, payload: bytes, header_sig: str) -> bool:
    if not header_sig or not header_sig.startswith("sha256="):
        return False
    mac = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(f"sha256={mac}", header_sig)


def _trigger_dag(gcs_path: str, commit_sha: str, author: str, repo_file: str):
    # Composer 2 Airflow REST API via IAP / public endpoint
    # Se obtiene URL del environment fuera de aquí y se llama con token de SA
    # Simplificado: esta función solo deja el archivo en GCS y Airflow lo detecta
    # vía sensor, o descomenta el POST si tienes endpoint público + token.
    print(f"TRIGGER {DAG_ID} conf={gcs_path} sha={commit_sha} author={author} file={repo_file}")
    # Ejemplo POST:
    # url = f"https://.../api/v1/dags/{DAG_ID}/dagRuns"
    # requests.post(url, json={"conf": {...}}, headers={...})


def github_webhook(request):
    payload = request.get_data()
    sig = request.headers.get("X-Hub-Signature-256", "")
    event = request.headers.get("X-GitHub-Event", "")

    try:
        webhook_secret = _get_secret(WEBHOOK_SECRET_NAME)
        github_token = _get_secret(GITHUB_TOKEN_SECRET)
    except Exception as e:
        return (f"secret error: {e}", 500)

    if not _valid_signature(webhook_secret, payload, sig):
        return ("invalid signature", 403)

    data = json.loads(payload or b"{}")

    # Solo push y pull_request
    if event not in ("push", "pull_request", "ping"):
        return ("ignored event", 200)
    if event == "ping":
        return ("pong", 200)

    commit_sha = data.get("after") or data.get("pull_request", {}).get("head", {}).get("sha", "unknown")
    repo = data.get("repository", {}).get("full_name", "")
    commits = data.get("commits", [])

    # Recolecta archivos .sql bajo estudiantes/
    sql_files = set()
    for c in commits:
        for k in ("added", "modified"):
            for f in c.get(k, []):
                if f.startswith("estudiantes/") and f.endswith(".sql"):
                    sql_files.add(f)
    # Caso PR: lista via API si viene vacío
    if event == "pull_request" and not sql_files:
        pr_files_url = data.get("pull_request", {}).get("url", "") + "/files"
        r = requests.get(pr_files_url, headers={"Authorization": f"Bearer {github_token}"}, timeout=15)
        if r.ok:
            for f in r.json():
                name = f.get("filename", "")
                if name.startswith("estudiantes/") and name.endswith(".sql"):
                    sql_files.add(name)

    if not sql_files:
        return ("no sql files", 200)

    storage_client = storage.Client()
    bucket = storage_client.bucket(RAW_BUCKET)
    author = (data.get("pusher", {}) or {}).get("name", "unknown")

    for repo_file in sorted(sql_files):
        # Descarga contenido crudo desde GitHub
        raw_url = f"https://api.github.com/repos/{repo}/contents/{repo_file}?ref={commit_sha}"
        r = requests.get(raw_url, headers={"Authorization": f"Bearer {github_token}",
                                            "Accept": "application/vnd.github.raw"}, timeout=20)
        if not r.ok:
            print(f"download fail {repo_file}: {r.status_code}")
            continue
        dest = f"sha={commit_sha}/{repo_file}"
        bucket.blob(dest).upload_from_string(r.text, content_type="text/plain")
        _trigger_dag(f"gs://{RAW_BUCKET}/{dest}", commit_sha, author, repo_file)

    return (f"processed {len(sql_files)} files", 200)
