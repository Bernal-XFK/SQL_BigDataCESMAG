-- Estudiante: Deivid Julian Cardenas Melo
-- Taller: taller-04-prueba-gcp-detalle
-- Fecha: 18/10/2026
-- Descripcion: Prueba REAL contra GCP (segunda consulta). Lee la tabla real
--   de contactos (infrabigdataces.BRONCE.GOOGLE_SHEETS_BASE_CONTACTOS) y
--   escribe/actualiza una tabla de DETALLE (no agregada) en BigQuery dentro
--   del dataset sandbox_estudiantes. A diferencia de Deivid_PruebaGCP.sql
--   (que agrega por estudiante), esta consulta deja un registro por cada
--   contacto, marca el mas reciente por estudiante y valida el formato
--   basico del email.
--   Al hacer push esto dispara: webhook -> Cloud Function -> Composer ->
--   BigQuery, y la tabla prueba_deivid_detalle queda creada/actualizada en GCP.

CREATE OR REPLACE TABLE `infrabigdataces.sandbox_estudiantes.prueba_deivid_detalle` AS
SELECT
  estudiante,
  nombre,
  email,
  marca_temporal,
  email IS NOT NULL AND email LIKE '%_@_%._%'   AS email_formato_valido,
  ROW_NUMBER() OVER (
    PARTITION BY estudiante
    ORDER BY marca_temporal DESC
  ) = 1                                          AS es_contacto_mas_reciente
FROM `infrabigdataces.BRONCE.GOOGLE_SHEETS_BASE_CONTACTOS`
ORDER BY estudiante, marca_temporal DESC;
