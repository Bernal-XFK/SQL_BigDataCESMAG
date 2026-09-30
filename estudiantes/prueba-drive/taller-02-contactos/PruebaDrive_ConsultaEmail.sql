-- Estudiante: Prueba Drive Datos CESMAG
-- Taller: 02 - Consulta de correos de contacto

SELECT
  nombre,
  email,
  estudiante
FROM `infrabigdataces.BRONCE.GOOGLE_SHEETS_BASE_CONTACTOS`
WHERE email IS NOT NULL
LIMIT 5;
