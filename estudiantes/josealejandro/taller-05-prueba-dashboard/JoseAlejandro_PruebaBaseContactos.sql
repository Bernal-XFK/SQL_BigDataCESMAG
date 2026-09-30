-- Estudiante: Jose Alejandro Bernal Figueroa
-- Taller: 05 - Prueba del dashboard con base de contactos

SELECT
  marca_temporal,
  nombre,
  email,
  estudiante
FROM `infrabigdataces.BRONCE.GOOGLE_SHEETS_BASE_CONTACTOS`
WHERE email IS NOT NULL
ORDER BY marca_temporal DESC
LIMIT 20;
