-- Estudiante: Deivid Julian Cardenas Melo
-- Taller: taller-03-prueba-gcp
-- Fecha: 18/10/2026
-- Descripcion: Prueba REAL contra GCP. Lee la tabla real de contactos
--   (infrabigdataces.BRONCE.GOOGLE_SHEETS_BASE_CONTACTOS, conectada a un
--   Google Sheet real) y escribe/actualiza una tabla real en BigQuery
--   dentro del dataset sandbox_estudiantes, que es el espacio seguro para
--   que cada estudiante persista resultados sin afectar datos de otros.
--   Al hacer push esto dispara: webhook -> Cloud Function -> Composer ->
--   BigQuery, y la tabla prueba_deivid queda creada/actualizada en GCP.

CREATE OR REPLACE TABLE `infrabigdataces.sandbox_estudiantes.prueba_deivid` AS
SELECT
  estudiante,
  COUNT(*)                          AS total_contactos,
  COUNTIF(email IS NOT NULL)        AS contactos_con_email,
  MAX(marca_temporal)               AS ultimo_registro,
  CURRENT_TIMESTAMP()               AS actualizado_en
FROM `infrabigdataces.BRONCE.GOOGLE_SHEETS_BASE_CONTACTOS`
GROUP BY estudiante
ORDER BY total_contactos DESC;
