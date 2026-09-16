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
        conf = context.get("dag_run").conf or {} if context.get("dag_run") else {}
        result = {
            "conf": conf,
            "sql": None,
            "status": "SUCCESS",
            "error_message": None,
            "step_failed": None,
        }
        try:
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
            result["sql"] = sql
            return result
        except Exception as e:
            print(f"ERROR en download_sql: {e}")
            result["status"] = "FAILED"
            result["error_message"] = str(e)
            result["step_failed"] = "download_sql"
            return result

    @task
    def dry_run(data: dict):
        if data.get("status") == "FAILED":
            return data
        sql = data["sql"]
        client = bigquery.Client()
        job_cfg = bigquery.QueryJobConfig(dry_run=True, use_query_cache=False)
        try:
            job = client.query(sql, job_config=job_cfg)
            print(f"dry-run OK, bytes estimados: {job.total_bytes_processed}")
            return {**data, "estimated_bytes": job.total_bytes_processed}
        except Exception as e:
            print(f"ERROR en dry_run: {e}")
            return {
                **data,
                "status": "FAILED",
                "error_message": f"Error de sintaxis o referencia BigQuery: {e}",
                "step_failed": "dry_run",
            }

    @task
    def run_sandbox(data: dict):
        if data.get("status") == "FAILED":
            return data
        sql = data["sql"]
        conf = data.get("conf", {})
        client = bigquery.Client()
        job_cfg = bigquery.QueryJobConfig(
            maximum_bytes_billed=MAX_BYTES_BILLED,
            labels={"author": re.sub(r"[^a-z0-9_-]", "-", conf.get("author", "unknown").lower())[:32],
                    "commit": (conf.get("commit_sha", "x")[:16])},
        )
        try:
            job = client.query(sql, job_config=job_cfg)
            rows = list(job.result(max_results=100))
            print(f"run OK: {len(rows)} filas (muestra), job={job.job_id}")
            return {**data, "job_id": job.job_id, "row_count_sample": len(rows),
                    "schema": [f.name for f in job.result().schema] if rows else []}
        except Exception as e:
            print(f"ERROR en run_sandbox: {e}")
            return {
                **data,
                "status": "FAILED",
                "error_message": f"Error en ejecución BigQuery: {e}",
                "step_failed": "run_sandbox",
            }

    @task
    def publish(data: dict):
        client = bigquery.Client()
        conf = data.get("conf", {})
        status = data.get("status", "SUCCESS")
        error_message = data.get("error_message")
        step_failed = data.get("step_failed")

        row = {
            "commit_sha": conf.get("commit_sha", "unknown"),
            "author": conf.get("author", "unknown"),
            "repo_file": conf.get("repo_file", "unknown"),
            "gcs_path": conf.get("gcs_path", ""),
            "job_id": data.get("job_id"),
            "estimated_bytes": data.get("estimated_bytes"),
            "validated_at": datetime.utcnow().isoformat(),
            "status": status,
            "error_message": error_message,
            "step_failed": step_failed,
        }
        errors = client.insert_rows_json(RESULTS_TABLE, [row])
        if errors:
            print(f"WARN no se pudo publicar en {RESULTS_TABLE}: {errors}")
        else:
            print(f"Publicación exitosa en {RESULTS_TABLE} con estado: {status}")
        return row

    @task
    def notify(result: dict):
        status = result.get("status", "UNKNOWN")
        author = result.get("author", "unknown")
        repo_file = result.get("repo_file", "unknown")
        error = result.get("error_message")
        step = result.get("step_failed")
        if status == "SUCCESS":
            print(f"NOTIFY: ✅ Exitoso | Autor={author} | Archivo={repo_file}")
        else:
            print(f"NOTIFY: ❌ Falló en {step} | Autor={author} | Archivo={repo_file} | Error={error}")

    notify(publish(run_sandbox(dry_run(download_sql()))))
