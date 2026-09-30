# Despliegue Cloud Function github-to-composer

```bash
# 1. Secretos
echo -n "TU_WEBHOOK_SECRET" | gcloud secrets create github-webhook-secret --data-file=- --project=TU_PROJECT
echo -n "TU_GITHUB_PAT" | gcloud secrets create github-token --data-file=- --project=TU_PROJECT

# 2. Deploy (2nd gen)
gcloud functions deploy github-to-composer \
  --gen2 --runtime=python311 --region=us-central1 \
  --source=. --entry-point=github_webhook --trigger-http \
  --set-env-vars=GCP_PROJECT=TU_PROJECT,RAW_BUCKET=cesmag-sql-raw,COMPOSER_ENV=TU_COMPOSER,COMPOSER_REGION=us-central1,DAG_ID=sql_validation_dag \
  --no-allow-unauthenticated \
  --project=TU_PROJECT

# 3. Copia la URL https y pégala en GitHub > Settings > Webhooks
# Payload URL = URL de la función, Content-Type json, Secret = TU_WEBHOOK_SECRET
# Events: push + pull requests
```
SA de la función necesita: `Secret Manager Secret Accessor`, `Storage Object Creator`, `Cloud Composer User`.

---

## API de lectura executions-api (dashboard → BigQuery real)

Nueva función `executions_api` en `main.py` (convive con `github_webhook`, no la rompe).
Maneja `GET + OPTIONS` con CORS por env `ALLOWED_ORIGINS` y lee BigQuery:

```sql
SELECT commit_sha, author, repo_file, gcs_path, job_id, estimated_bytes, validated_at, status
FROM `TU_PROJECT.validaciones.resultados`
ORDER BY validated_at DESC LIMIT 100
```

### 1. Crear (o migrar) tabla BigQuery

```bash
bq --project_id=TU_PROJECT mk --dataset validaciones 2>/dev/null || true

bq --project_id=TU_PROJECT mk --table validaciones.resultados \
  commit_sha:STRING,author:STRING,repo_file:STRING,gcs_path:STRING,job_id:STRING,estimated_bytes:INTEGER,validated_at:TIMESTAMP,status:STRING
```

#### Migración v2 (OBLIGATORIA si la tabla ya existía)

Sin estas columnas el DAG registra `ERROR-PUBLISH` y las entregas **se pierden**
(`insert_rows_json` rechaza en silencio el JSON con campos desconocidos):

```sql
ALTER TABLE `TU_PROJECT.validaciones.resultados`
  ADD COLUMN IF NOT EXISTS error_message STRING,
  ADD COLUMN IF NOT EXISTS error_type STRING,
  ADD COLUMN IF NOT EXISTS step_failed STRING,
  ADD COLUMN IF NOT EXISTS sql_text STRING,
  ADD COLUMN IF NOT EXISTS result_rows STRING;
```

Nuevo shape que devuelve la API por entrega:

```json
{
  "id": 1, "studentName": "Ana Ramírez", "folderName": "estudiantes/ana/tarea-01/Ana_Clientes.sql",
  "queryStatus": "success", "timestamp": "2026-09-29 10:00 AM",
  "commitSha": "9eb729c...", "estimatedBytes": 12000000,
  "sqlText": "-- Estudiante: Ana Ramírez\nSELECT * ...;",
  "errorMessage": "", "errorType": "",
  "resultRows": [{ "nombre": "Carlos", "email": "c@x.com" }]
}
```

### 2. Deploy de la API

```bash
gcloud functions deploy executions-api \
  --gen2 --runtime=python311 --region=us-central1 \
  --source=. --entry-point=executions_api --trigger-http \
  --set-env-vars=GCP_PROJECT=TU_PROJECT,RESULTS_TABLE=TU_PROJECT.validaciones.resultados,ALLOWED_ORIGINS=https://tu-dashboard.web.app,http://localhost:5173 \
  --allow-unauthenticated \
  --project=TU_PROJECT
```

> `--allow-unauthenticated` es solo para demo (la función es solo lectura).
> Para clase/producción usa `--no-allow-unauthenticated` + rol
> `roles/cloudfunctions.invoker` a los visores (opción segura: API con IAM + CORS).
> CORS siempre se controla con `ALLOWED_ORIGINS` (coma-separada, default `http://localhost:5173`).

### 3. Probar

```bash
curl -i "https://us-central1-TU_PROJECT.cloudfunctions.net/executions-api"
curl -i -X OPTIONS "https://us-central1-TU_PROJECT.cloudfunctions.net/executions-api" \
  -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: GET"
```

Respuesta esperada (shape exacto del mock del dashboard):

```json
[
  { "id": 1, "studentName": "Ana Sofía Ramírez", "folderName": "estudiantes/ana/tarea_01_select.sql", "queryStatus": "success", "timestamp": "2023-10-25 10:00 AM" }
]
```

Tabla vacía → `[]` (el frontend usa su fallback local solo en dev).
Sin credencial/tabla → `500 {"error": ..., "hint": ...}` sin stacktrace.

### 4. Service Account mínima (principio de menor privilegio)

| Función | Roles |
|---|---|
| `github_webhook` (ya existente) | `Secret Manager Secret Accessor` + `Storage Object Creator` + `Cloud Composer User` |
| `executions_api` (nueva, solo lectura) | `BigQuery Job User` (`roles/bigquery.jobUser`) + `BigQuery Data Viewer` (`roles/bigquery.dataViewer` en el dataset `validaciones`) |
| SA del entorno **Composer** (la que ejecuta los DAGs) | `roles/bigquery.jobUser` (proyecto) + `roles/bigquery.dataViewer` en datasets de estudiantes (`BRONCE`, `PRACTICA`, `RETOS_SQL`, `TEST`, `sandbox_estudiantes`) + `roles/bigquery.dataEditor` en `validaciones` + `roles/storage.objectViewer` en `gs://cesmag-sql-raw` |

> El error **403 Forbidden** en el DAG casi siempre es falta de
> `roles/bigquery.dataViewer` en el dataset consultado o de
> `roles/bigquery.jobUser` a nivel proyecto, asignados a la SA del entorno
> Composer (normalmente
> `service-<PROJECT_NUMBER>@cloudcomposer-accounts.iam.gserviceaccount.com`).
> No es un problema de sintaxis SQL.

```bash
COMPOSER_SA="service-<PROJECT_NUMBER>@cloudcomposer-accounts.iam.gserviceaccount.com"
gcloud projects add-iam-policy-binding TU_PROJECT \
  --member="serviceAccount:$COMPOSER_SA" --role="roles/bigquery.jobUser"

for DS in BRONCE PRACTICA RETOS_SQL TEST; do
  bq add-iam-policy-binding --project_id=TU_PROJECT TU_PROJECT:$DS \
    --member="serviceAccount:$COMPOSER_SA" --role="roles/bigquery.dataViewer"
done
bq add-iam-policy-binding --project_id=TU_PROJECT TU_PROJECT:validaciones \
  --member="serviceAccount:$COMPOSER_SA" --role="roles/bigquery.dataEditor"
```

La API **no** necesita `Secret Accessor` ni acceso a Storage/Composer.
Ejemplo:

```bash
SA=$(gcloud functions describe executions-api --gen2 --region=us-central1 --project=TU_PROJECT --format='value(serviceConfig.serviceAccountEmail)')
gcloud projects add-iam-policy-binding TU_PROJECT --member="serviceAccount:$SA" --role="roles/bigquery.jobUser"
bq add-iam-policy-binding --project_id=TU_PROJECT TU_PROJECT:validaciones --member="serviceAccount:$SA" --role="roles/bigquery.dataViewer"
```

### 5. Conectar el dashboard

En `dashboard/.env.local`:

```bash
VITE_API_URL=https://us-central1-TU_PROJECT.cloudfunctions.net/executions-api
VITE_REFRESH_MS=30000
```

Ver `dashboard/.env.example` y `dashboard/README.md` sección "Conexión GCP real".
