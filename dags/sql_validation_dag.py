"""DAG sql_validation_dag.

Trigger: Cloud Function github-to-composer pasa conf:
  {gcs_path, commit_sha, author, repo_file, student_name}

Flujo:
  download_sql -> dry_run -> run_sandbox -> publish -> notify

Reglas clave:
- Clasifica errores: IAM 403 (permisos) vs sintaxis BigQuery vs bloqueado.
- Persiste en validaciones.resultados: sql_text, error_message, step_failed y
  result_rows (JSON serializado, max 50 filas) para que el dashboard las pinte.
"""
import json
import re
from datetime import datetime

from airflow import DAG
from airflow.decorators import task
from google.auth import default as default_credentials
from google.cloud import storage, bigquery
from google.api_core.exceptions import Forbidden, NotFound
from bigquery_auth import create_bigquery_client

RAW_BUCKET_FALLBACK = "cesmag-sql-raw"
SANDBOX_DATASET = "sandbox_estudiantes"
RESULTS_TABLE = "validaciones.resultados"
MAX_BYTES_BILLED = 1_000_000_000  # 1 GB por query estudiante
MAX_RESULT_ROWS = 50              # filas que viajan al dashboard

FORBIDDEN = re.compile(r"\b(DROP\s+TABLE|DELETE\s+FROM(?!\s+\S+\s+WHERE)|TRUNCATE)\b", re.I)
STUDENT_RE = re.compile(r"^\s*--\s*Estudiante:\s*(.+?)\s*$", re.I | re.M)


def _bigquery_client() -> bigquery.Client:
    """Build a BigQuery client able to query Google Drive external tables."""
    return create_bigquery_client(
        project="infrabigdataces",
        credentials_factory=default_credentials,
        client_factory=bigquery.Client,
    )


def _parse_gcs(uri: str):
    assert uri.startswith("gs://"), f"GCS uri inválida: {uri}"
    rest = uri[5:]
    bucket, _, key = rest.partition("/")
    return bucket, key


def _extract_student(sql: str) -> str | None:
    """Saca el nombre completo del encabezado '-- Estudiante: Nombre Apellido'."""
    m = STUDENT_RE.search(sql or "")
    return m.group(1) if m else None


def _classify_error(exc: Exception) -> tuple[str, str]:
    """Devuelve (error_type, mensaje amigable) y loguea explícito en consola."""
    msg = str(exc)
    if isinstance(exc, Forbidden) or "403" in msg and "Forbidden" in msg:
        print(f"[ERROR-IAM-403] La Service Account NO tiene permisos: {msg}")
        print("[ERROR-IAM-403] Revisa roles: bigquery.dataViewer en el dataset y "
              "bigquery.jobUser en el proyecto infrabigdataces.")
        return ("IAM_PERMISSIONS",
                "Sin permisos para consultar esta tabla (error 403 de IAM). "
                "Avisa al profesor: falta 'BigQuery Data Viewer' en el dataset.")
    if isinstance(exc, NotFound):
        print(f"[ERROR-NOT-FOUND] Tabla/dataset inexistente: {msg}")
        return ("TABLA_NO_EXISTE",
                "La tabla o dataset no existe. Revisa el nombre en tu consulta.")
    lowered = msg.lower()
    if "syntax error" in lowered or "expected" in lowered and "at" in lowered:
        print(f"[ERROR-SINTAXIS-SQL] Error de sintaxis en la consulta: {msg}")
        return ("SINTAXIS_SQL", f"Error de sintaxis SQL: {msg}")
    print(f"[ERROR-EJECUCION] Error genérico de BigQuery: {msg}")
    return ("EJECUCION", f"Error de BigQuery: {msg}")


def _fail(data: dict, exc: Exception, step: str) -> dict:
    error_type, friendly = _classify_error(exc)
    return {
        **data,
        "status": "FAILED",
        "error_message": friendly,
        "error_type": error_type,
        "step_failed": step,
    }


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
            "error_type": None,
            "step_failed": None,
            "result_rows": None,
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
            result["sql"] = sql
            # Si el webhook no mandó student_name, lo sacamos del encabezado
            if not conf.get("student_name"):
                student = _extract_student(sql)
                if student:
                    conf["student_name"] = student
                    print(f"Estudiante identificado desde encabezado: {student}")
            return result
        except Exception as e:
            print(f"[ERROR-DOWNLOAD] {e}")
            result["status"] = "FAILED"
            result["error_message"] = str(e)
            result["error_type"] = "DESCARGA"
            result["step_failed"] = "download_sql"
            return result

    @task
    def dry_run(data: dict):
        if data.get("status") == "FAILED":
            return data
        sql = data["sql"]
        client = _bigquery_client()
        job_cfg = bigquery.QueryJobConfig(dry_run=True, use_query_cache=False)
        try:
            job = client.query(sql, job_config=job_cfg)
            print(f"dry-run OK, bytes estimados: {job.total_bytes_processed}")
            return {**data, "estimated_bytes": job.total_bytes_processed}
        except Exception as e:
            return _fail(data, e, "dry_run")

    @task
    def run_sandbox(data: dict):
        if data.get("status") == "FAILED":
            return data
        sql = data["sql"]
        conf = data.get("conf", {})
        client = _bigquery_client()
        job_cfg = bigquery.QueryJobConfig(
            maximum_bytes_billed=MAX_BYTES_BILLED,
            labels={"author": re.sub(r"[^a-z0-9_-]", "-", conf.get("author", "unknown").lower())[:32],
                    "commit": (conf.get("commit_sha", "x")[:16])},
        )
        try:
            job = client.query(sql, job_config=job_cfg)
            iterator = job.result(max_results=MAX_RESULT_ROWS)
            rows = []
            for row in iterator:
                rows.append({f.name: row[f.name] for f in iterator.schema})
            print(f"run OK: {len(rows)} filas capturadas para dashboard, job={job.job_id}")
            # Serializamos a JSON seguro (datetimes/bytes -> str)
            result_rows = json.dumps(rows, default=str)
            return {**data, "job_id": job.job_id, "row_count_sample": len(rows),
                    "schema": [f.name for f in iterator.schema],
                    "result_rows": result_rows}
        except Exception as e:
            return _fail(data, e, "run_sandbox")

    @task
    def publish(data: dict):
        client = _bigquery_client()
        conf = data.get("conf", {})
        status = data.get("status", "SUCCESS")

        gcs_path = conf.get("gcs_path")
        author = conf.get("student_name") or conf.get("author", "unknown")
        repo_file = conf.get("repo_file", "unknown")

        if not gcs_path or (author == "unknown" and repo_file == "unknown"):
            print("WARN: Omitiendo publicación en BigQuery. Ejecución sin conf/gcs_path válido.")
            return {"status": "SKIPPED", "message": "Ejecución de prueba manual omitida"}

        row = {
            "commit_sha": conf.get("commit_sha", "unknown"),
            "author": author,
            "repo_file": repo_file,
            "gcs_path": gcs_path or "",
            "job_id": data.get("job_id"),
            "estimated_bytes": data.get("estimated_bytes"),
            "validated_at": datetime.utcnow().isoformat(),
            "status": status,
            "error_message": data.get("error_message"),
            "error_type": data.get("error_type"),
            "step_failed": data.get("step_failed"),
            "sql_text": (data.get("sql") or "")[:65536],  # límite prudencial
            "result_rows": data.get("result_rows"),
        }
        errors = client.insert_rows_json(RESULTS_TABLE, [row])
        if errors:
            print(f"ERROR-PUBLISH no se pudo insertar en {RESULTS_TABLE}: {errors}")
            print("ERROR-PUBLISH Posible esquema desactualizado: ejecuta el "
                  "ALTER TABLE para agregar sql_text/result_rows/error_message/step_failed.")
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
