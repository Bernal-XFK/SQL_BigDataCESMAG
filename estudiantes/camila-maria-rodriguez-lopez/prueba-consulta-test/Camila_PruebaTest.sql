-- Estudiante: Camila Maria Rodriguez Lopez
-- Tarea: prueba-consulta-test
-- Fecha: 01/10/2026
-- Descripcion: Consulta de prueba para validar el pipeline de despliegue.
--   Cuenta registros simples y calcula una suma basica usando CTE.

WITH datos_prueba AS (
  SELECT 1 AS id, 'Producto A' AS nombre, 100 AS valor UNION ALL
  SELECT 2, 'Producto B', 200 UNION ALL
  SELECT 3, 'Producto C', 150 UNION ALL
  SELECT 4, 'Producto D', 300
)

SELECT
  COUNT(*) AS total_registros,
  SUM(valor) AS suma_valores,
  AVG(valor) AS promedio_valor,
  MIN(valor) AS valor_minimo,
  MAX(valor) AS valor_maximo
FROM datos_prueba;