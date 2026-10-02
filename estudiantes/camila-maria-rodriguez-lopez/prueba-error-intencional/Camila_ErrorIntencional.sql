-- Estudiante: Camila Maria Rodriguez Lopez
-- Tarea: prueba-error-intencional
-- Fecha: 02/10/2026
-- Descripcion: Consulta CON ERROR intencional para probar validacion.
--   Error: columna inexistente 'columna_que_no_existe' en SELECT.

WITH datos AS (
  SELECT 1 AS id, 'A' AS nombre, 100 AS valor
)

SELECT
  id,
  nombre,
  columna_que_no_existe,
  valor
FROM datos;