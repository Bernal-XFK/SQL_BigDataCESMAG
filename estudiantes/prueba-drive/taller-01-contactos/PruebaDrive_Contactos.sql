-- Estudiante: Prueba Drive Datos CESMAG
-- Taller: 01 - Lectura de base de contactos

SELECT
  nombre,
  email,
  estudiante,
  marca_temporal
FROM `infrabigdataces.BRONCE.GOOGLE_SHEETS_BASE_CONTACTOS`
WHERE email IS NOT NULL
LIMIT 5;
