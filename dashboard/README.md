# Dashboard — Monitor de Ejecución SQL

Frontend estático del Laboratorio de Big Data - CESMAG. Muestra el estado de las
entregas `.sql` de los estudiantes validadas en BigQuery. No interfiere con el
trigger del backend, que solo observa `estudiantes/**/*.sql`.

## Cómo correr en desarrollo

```bash
cd dashboard
npm install
npm run dev
```

Abre http://localhost:5173 en el navegador.

## Cómo conectar la API real

1. Crea un archivo `dashboard/.env.local` (no se versiona) con:
   ```bash
   VITE_API_URL=https://tu-api.com/api/executions
   ```
2. El endpoint debe devolver un arreglo JSON con este shape:
   ```json
   [
     { "id": 1, "studentName": "Ana Pérez", "folderName": "tarea_01_select", "queryStatus": "success", "timestamp": "2023-10-25 10:00 AM" }
   ]
   ```
   `queryStatus` solo admite `"success"` o `"error"`.
3. Reinicia `npm run dev` para que Vite tome la variable.

El único punto de fetch es `src/api.js` (hook `useExecutions`), en MODO 100%
EN VIVO y sin datos de prueba. `VITE_API_URL` es requerido (sin default que
enmascare) y si falta o el fetch falla, el hook devuelve `error` visible +
`executions=[]` — nunca filas inventadas. `[]` real de BigQuery se respeta
como vacío válido. Soporta polling con `VITE_REFRESH_MS` (default 30000 ms,
con cleanup del `setInterval` al desmontar) y normaliza cada fila a
`queryStatus: 'success' | 'error'` aceptando `timestamp` ISO o string display.
Retorna `{ executions, loading, error, usingFallback: false }`
(`usingFallback` queda en `false` solo por compatibilidad; el badge "datos
locales" ya no se muestra).

## Modo 100% en vivo (sin mockData)

El modo prueba se quitó: `src/api.js` ya no importa `src/mockData.js` ni usa
temporizador de fallback. `src/mockData.js` se conserva en el repo solo como
referencia de shape, pero nada lo importa.

Estados reales del dashboard:

- API caída o sin `VITE_API_URL` → banner rojo con el mensaje
  `"No se pudo conectar a la API en vivo (VITE_API_URL). Revisa .env.local y
  que executions-api esté desplegada."` + botón **Reintentar**
  (`window.location.reload()`).
- Tabla vacía en BigQuery (`[]`) → EmptyState real
  `"Sin entregas en BigQuery todavía — haz push de un .sql en estudiantes/"`.
- Con filtro/búsqueda sin coincidencias → `"Sin resultados"` + limpiar filtros.

Configuración viva:

```bash
cp .env.example .env.local
# Edita VITE_API_URL con la URL https de executions-api (trigger URL)
# Opcional: VITE_REFRESH_MS=30000
npm run dev
```

## Conexión GCP real

El dashboard lee la tabla BigQuery que llena el DAG (`validaciones.resultados`)
a través de la Cloud Function `executions_api` (ver `cloud-function/main.py`).

### 1. Crear la tabla BigQuery

```sql
CREATE SCHEMA IF NOT EXISTS `TU_PROJECT.validaciones`;

CREATE TABLE IF NOT EXISTS `TU_PROJECT.validaciones.resultados` (
  commit_sha STRING,
  author STRING,
  repo_file STRING,
  gcs_path STRING,
  job_id STRING,
  estimated_bytes INT64,
  validated_at TIMESTAMP,
  status STRING
);
```

> `RESULTS_TABLE` admite `validaciones.resultados` o nombre fully-qualified
> `TU_PROJECT.validaciones.resultados`. El DAG publica con esos mismos campos.

### 2. Desplegar la API de lectura

```bash
gcloud functions deploy executions-api \
  --gen2 --runtime=python311 --region=us-central1 \
  --source=../cloud-function --entry-point=executions_api --trigger-http \
  --set-env-vars=GCP_PROJECT=TU_PROJECT,RESULTS_TABLE=TU_PROJECT.validaciones.resultados,ALLOWED_ORIGINS=https://tu-dashboard.web.app,http://localhost:5173 \
  --allow-unauthenticated \
  --project=TU_PROJECT
```

### 3. ¿Pública o con IAM? (elige una, no adivines)

- **Opción segura recomendada (clase/producción): API con IAM + CORS.**
  Despliega con `--no-allow-unauthenticated` y otorga al visor
  `roles/cloudfunctions.invoker`. El dashboard debe entonces pedir token
  (o pasar por un backend propio con IAP); CORS sigue controlado por
  `ALLOWED_ORIGINS`. Nada sensible queda en el frontend.
- **Opción simple (demo): pública con validación.**
  Despliega con `--allow-unauthenticated`. La función solo hace `GET`
  (lectura `SELECT ... LIMIT 100`), no expone secretos y valida origen vía
  `ALLOWED_ORIGINS`. No pongas nunca tokens ni claves en `VITE_*`
  (Vite las incrusta en el bundle público).

### 4. Conectar el dashboard

```bash
cp .env.example .env.local
# Edita VITE_API_URL con la URL https de la función (trigger URL)
npm run dev
```

Sin secretos hardcodeados en el frontend: solo URL pública + intervalo.

## Build de producción

```bash
cd dashboard
npm run build   # genera dashboard/dist/
npm run preview # sirve el build para verificación
```
