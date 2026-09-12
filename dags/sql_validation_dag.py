"""DAG skeleton: sql_validation_dag.

Recibe por conf: gcs_path, commit_sha, author.
1. Descarga SQL desde GCS
2. Dry Run en BigQuery
3. Ejecución en sandbox
4. Validaciones + resultados
"""
from airflow import DAG
from datetime import datetime

with DAG(
    dag_id="sql_validation_dag",
    start_date=datetime(2026, 1, 1),
    schedule=None,
    catchup=False,
    tags=["cesmag", "bigquery", "validacion"],
) as dag:
    pass
