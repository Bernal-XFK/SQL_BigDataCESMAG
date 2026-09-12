"""DAG sql_validation_dag.

Trigger: Cloud Function github-to-composer pasa conf:
  {gcs_path, commit_sha, author, repo_file}

Flujo:
  download_sql -> dry_run -> run_sandbox -> validate -> publish -> notify
"""
import re
from datetime import datetime
from airflow import DAG
from airflow.decorators import task
from google.cloud import storage, bigquery

RAW_BUCKET_FALLBACK = "cesmag-sql-raw"
SANDBOX_DATASET = "sandbox_estudiantes"
RESULTS_TABLE = "validaciones.resultados"
MAX_BYTES_BILLED = 1_000_000_000  # 1 GB por query estudiante

FORBIDDEN = re.compile(r"\b(DROP\s+TABLE|DELETE\s+FROM(?!\s+\S+\s+WHERE)|TRUNCATE)\b", re.I)


def _parse_gcs(uri: str):
    assert uri.startswith("gs://"), f"GCS uri inválida: {uri}"
    rest = uri[5:]
    bucket, _, key = rest.partition("/")
    return bucket, key


with DAG(
    dag_id="sql_validation_dag",
    start_date=datetime(2026, 1, 1),
    schedule=None,
    catchup=False,
    tags=["cesmag", "bigquery", "validacion"],
) as dag:

    @task
    def download_sql(**context):
        conf = context["dag_run"].conf or {}
        gcs_path = conf.get("gcs_path")
        if not gcs_path:
            raise ValueError("conf.gcs_path requerido (lo envía la Cloud Function)")
        bucket_name, key = _parse_gcs(gcs_path)
        sql = storage.Client().bucket(bucket_name).blob(key).download_as_text()
        if not sql.strip():
            raise ValueError(f"SQL vacío: {gcs_path}")
        if FORBIDDEN.search(sql):
            raise ValueError("SQL bloqueado: DROP/DELETE sin WHERE/TRUNCATE no permitido")
        if re.search(r"SELECT\s+\*", sql, re.I):
            print("WARN: SELECT * detectado, se permite pero se reporta")
        return {"sql": sql, "conf": conf}

    @task
    def dry_run(data: dict):
        sql = data["sql"]
        client = bigquery.Client()
        job_cfg = bigquery.QueryJobConfig(dry_run=True, use_query_cache=False)
        try:
            job = client.query(sql, job_config=job_cfg)
            print(f"dry-run OK, bytes estimados: {job.total_bytes_processed}")
            return {**data, "estimated_bytes": job.total_bytes_processed}
        except Exception as e:
            raise ValueError(f"dry-run BigQuery falló: {e}")

    @task
    def run_sandbox(data: dict):
        sql = data["sql"]
        conf = data["conf"]
        client = bigquery.Client()
        job_cfg = bigquery.QueryJobConfig(
            maximum_bytes_billed=MAX_BYTES_BILLED,
            labels={"author": re.sub(r"[^a-z0-9_-]", "-", conf.get("author", "unknown").lower())[:32],
                    "commit": (conf.get("commit_sha", "x")[:16])},
        )
        job = client.query(sql, job_config=job_cfg)
        rows = list(job.result(max_results=100))
        print(f"run OK: {len(rows)} filas (muestra), job={job.job_id}")
        return {**data, "job_id": job.job_id, "row_count_sample": len(rows),
                "schema": [f.name for f in job.result().schema] if rows else []}

    @task
    def publish(data: dict):
        client = bigquery.Client()
        conf = data["conf"]
        row = {
            "commit_sha": conf.get("commit_sha"),
            "author": conf.get("author"),
            "repo_file": conf.get("repo_file"),
            "gcs_path": conf.get("gcs_path"),
            "job_id": data.get("job_id"),
            "estimated_bytes": data.get("estimated_bytes"),
            "validated_at": datetime.utcnow().isoformat(),
            "status": "SUCCESS",
        }
        errors = client.insert_rows_json(RESULTS_TABLE, [row])
        if errors:
            print(f"WARN no se pudo publicar en {RESULTS_TABLE}: {errors}")
        return row

    @task
    def notify(result: dict):
        # Aquí: Commit Status API / comentario PR vía GitHub PAT
        # Se deja como log para no requerir token en Composer
        print(f"NOTIFY GitHub sha={result['commit_sha']} status={result['status']} file={result['repo_file']}")

    notify(publish(run_sandbox(dry_run(download_sql()))))
