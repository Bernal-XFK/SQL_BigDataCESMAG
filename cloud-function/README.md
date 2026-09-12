# Cloud Function intermediaria: github-to-composer
# 1. Valida firma X-Hub-Signature-256 con WEBHOOK_SECRET
# 2. Descarga .sql del payload y lo sube a gs://cesmag-sql-raw/
# 3. Dispara DAG sql_validation_dag via Airflow REST API
# Ver Secret Manager: github-webhook-secret
