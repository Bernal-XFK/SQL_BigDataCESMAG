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
