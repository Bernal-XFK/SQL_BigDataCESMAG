-- Estudiante: Camila Maria Rodriguez Lopez
-- Tarea: prueba-correcta-validacion
-- Fecha: 02/10/2026
-- Descripcion: Consulta CORRECTA para probar validacion exitosa.
--   Agrupa por categoria y calcula metricas basicas.

WITH ventas AS (
  SELECT 'Electronica' AS categoria, 500000 AS monto UNION ALL
  SELECT 'Ropa', 150000 UNION ALL
  SELECT 'Electronica', 750000 UNION ALL
  SELECT 'Hogar', 300000 UNION ALL
  SELECT 'Ropa', 200000
)

SELECT
  categoria,
  COUNT(*) AS total_ventas,
  SUM(monto) AS ingreso_total,
  ROUND(AVG(monto), 2) AS ticket_promedio
FROM ventas
GROUP BY categoria
ORDER BY ingreso_total DESC;