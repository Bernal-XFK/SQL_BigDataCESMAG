import hmac
import hashlib
import os
import json
import base64
import requests
from google.cloud import storage, secretmanager

# Config via env vars (con fallbacks para que nunca queden vacíos)
GITHUB_TOKEN_SECRET = os.getenv("GITHUB_TOKEN_SECRET", "github-token")
WEBHOOK_SECRET_NAME = os.getenv("WEBHOOK_SECRET_NAME", "github-webhook-secret")
PROJECT_ID = os.getenv("GCP_PROJECT") or os.getenv("GOOGLE_CLOUD_PROJECT") or os.getenv("PROJECT_ID") or "infrabigdataces"
RAW_BUCKET = os.getenv("RAW_BUCKET") or "cesmag-sql-raw"
COMPOSER_ENV = os.getenv("COMPOSER_ENV") or "cesmag-composer"
COMPOSER_REGION = os.getenv("COMPOSER_REGION") or "us-central1"
DAG_ID = os.getenv("DAG_ID") or "sql_validation_dag"
AIRFLOW_WEBSERVER_URL = os.getenv("AIRFLOW_WEBSERVER_URL") or "https://b7addde4a0c4cd8aae13f1e316487fd-dot-us-central1.composer.googleusercontent.com"
# API de lectura para el dashboard (no rompe github_webhook)
RESULTS_TABLE = os.getenv("RESULTS_TABLE", "validaciones.resultados")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")


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
    """Dispara el DAG en Composer 2 mediante executeAirflowCommand o Airflow REST API."""
    conf_payload = {
        "gcs_path": gcs_path,
        "commit_sha": commit_sha,
        "author": author,
        "repo_file": repo_file,
    }

    # Metodo 1: Airflow REST API (si se configuro AIRFLOW_WEBSERVER_URL)
    if AIRFLOW_WEBSERVER_URL:
        try:
            import google.auth
            from google.auth.transport.requests import Request

            auth_req = Request()
            credentials, _ = google.auth.default()
            credentials.refresh(auth_req)

            url = f"{AIRFLOW_WEBSERVER_URL.rstrip('/')}/api/v1/dags/{DAG_ID}/dagRuns"
            headers = {
                "Authorization": f"Bearer {credentials.token}",
                "Content-Type": "application/json",
            }
            resp = requests.post(url, json={"conf": conf_payload}, headers=headers, timeout=20)
            if resp.status_code in (200, 201):
                print(f"Trigger exitoso via Airflow REST API para {repo_file}: {resp.status_code}")
                return
            else:
                print(f"Airflow REST API respondio {resp.status_code}: {resp.text}")
        except Exception as e:
            print(f"Error al invocar Airflow REST API: {e}")

    # Metodo 2: Google Cloud Composer executeAirflowCommand API (Usa IAM de GCP)
    if COMPOSER_ENV and PROJECT_ID:
        try:
            import google.auth
            from google.auth.transport.requests import Request

            credentials, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
            credentials.refresh(Request())

            cmd_url = (
                f"https://composer.googleapis.com/v1/projects/{PROJECT_ID}/"
                f"locations/{COMPOSER_REGION}/environments/{COMPOSER_ENV}:executeAirflowCommand"
            )
            headers = {
                "Authorization": f"Bearer {credentials.token}",
                "Content-Type": "application/json",
            }
            body = {
                "command": "dags",
                "subcommand": "trigger",
                "parameters": [
                    DAG_ID,
                    "-c",
                    json.dumps(conf_payload),
                ],
            }
            resp = requests.post(cmd_url, json=body, headers=headers, timeout=30)
            if resp.status_code == 200:
                print(f"DAG {DAG_ID} disparado exitosamente via Composer API para {repo_file}")
                return
            else:
                print(f"Composer executeAirflowCommand respondio {resp.status_code}: {resp.text}")
        except Exception as e:
            print(f"Error al disparar via Composer executeAirflowCommand: {e}")

    print(f"WARN: No se pudo disparar el DAG. Archivo guardado en {gcs_path}")


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
        parts = repo_file.split("/")
        student_author = parts[1] if len(parts) > 1 and parts[0] == "estudiantes" else author
        _trigger_dag(f"gs://{RAW_BUCKET}/{dest}", commit_sha, student_author, repo_file)

    return (f"processed {len(sql_files)} files", 200)


def _allowed_origin(request):
    """Resuelve el origen CORS permitido (env ALLOWED_ORIGINS, coma-separada)."""
    configured = [o.strip() for o in ALLOWED_ORIGINS.split(",") if o.strip()] or ["http://localhost:5173"]
    origin = request.headers.get("Origin", "")
    if origin in configured:
        return origin
    if "*" in configured:
        return "*"
    return configured[0]


def _cors_headers(request):
    origin = _allowed_origin(request)
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "3600",
    }


def _format_timestamp(value):
    """Formato dashboard '2023-10-25 10:00 AM'; si no se puede, devuelve ISO/str."""
    if value is None:
        return ""
    # BigQuery puede devolver datetime/date o string ISO.
    try:
        from datetime import datetime, date
        if isinstance(value, datetime):
            dt = value
        elif isinstance(value, date):
            dt = datetime(value.year, value.month, value.day)
        else:
            text = str(value).strip()
            if not text:
                return ""
            # Soporta '2023-10-25T10:00:00', con Z o con offset.
            candidate = text.replace("Z", "+00:00")
            try:
                dt = datetime.fromisoformat(candidate)
            except ValueError:
                # Ya viene en formato display u otro string: devolver tal cual.
                return text
        return dt.strftime("%Y-%m-%d %I:%M %p")
    except Exception:
        return str(value)


def executions_api(request):
    """API de lectura para el dashboard. GET + OPTIONS con CORS.

    Env:
      RESULTS_TABLE (default validaciones.resultados)
      ALLOWED_ORIGINS (default http://localhost:5173, coma-separada)
      GCP_PROJECT (proyecto para el cliente BigQuery)
    """
    headers = _cors_headers(request)
    headers["Content-Type"] = "application/json"

    # Preflight CORS
    if request.method == "OPTIONS":
        return ("", 204, headers)

    if request.method != "GET":
        return (json.dumps({"error": "method_not_allowed",
                            "hint": "Usa GET (u OPTIONS para preflight CORS)."}),
                405, headers)

    table = os.getenv("RESULTS_TABLE", RESULTS_TABLE)
    query = (
        "SELECT commit_sha, author, repo_file, gcs_path, job_id, "
        "estimated_bytes, validated_at, status "
        f"FROM `{table}` ORDER BY validated_at DESC LIMIT 100"
    )
    try:
        from google.cloud import bigquery
        client_kwargs = {"project": PROJECT_ID} if PROJECT_ID else {}
        client = bigquery.Client(**client_kwargs)
        rows = list(client.query(query).result())
    except ImportError:
        return (json.dumps({"error": "bigquery_lib_missing",
                            "hint": "Falta google-cloud-bigquery en requirements.txt. "
                                    "Añade 'google-cloud-bigquery' y redespliega."}),
                500, headers)
    except Exception:
        # Sin stacktrace: mensaje genérico + hint accionable.
        return (json.dumps({"error": "bigquery_query_failed",
                            "hint": f"No se pudo leer BigQuery. Verifica GCP_PROJECT, "
                                    f"que exista la tabla {table} "
                                    f"(ver DEPLOY.md sección API) y que la Service Account "
                                    f"tenga BigQuery Job User + Data Viewer."}),
                500, headers)

    # Tabla vacía -> [] para que el frontend use su fallback local solo en dev.
    data = []
    for i, row in enumerate(rows):
        get = row.get if hasattr(row, "get") else lambda k, d=None: row[k] if k in row else d
        try:
            author = get("author") or "Desconocido"
            repo_file = get("repo_file") or get("gcs_path") or ""
            status = (get("status") or "")
            data.append({
                "id": i + 1,
                "studentName": author,
                "folderName": repo_file,
                "queryStatus": "success" if str(status).upper() == "SUCCESS" else "error",
                "timestamp": _format_timestamp(get("validated_at")),
            })
        except Exception:
            continue
    return (json.dumps(data), 200, headers)
