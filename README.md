# SQL_BigDataCESMAG
Repo para guardar las consultas generadas en SQL para el uso de google console

## 🌐 Demo en vivo
**Dashboard de Monitoreo Académico:** https://sql-big-data-cesmag.vercel.app
(API: `executions-api` en `europe-west1` → BigQuery `infrabigdataces.validaciones.resultados`)

## Estructura
```
estudiantes/{nombre}/{tarea}/*.sql
dags/sql_validation_dag.py
cloud-function/
tests/
```

## Trigger
El `git push` / PR del estudiante dispara el webhook GitHub -> Cloud Function -> Composer (Airflow) -> GCS -> BigQuery.

Ver `estudiantes/README.md` para la convención de nombres. 
