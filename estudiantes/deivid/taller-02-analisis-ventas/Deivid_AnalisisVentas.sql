-- Estudiante: Deivid Cardenas
-- Taller: taller-02-analisis-ventas
-- Fecha: 29/09/2026
-- Descripcion: Taller 2 — Analisis de ventas por categoria de producto.
--   Se calcula el total de ventas, el promedio por transaccion y
--   el numero de ordenes por categoria usando datos ficticios.
--   Objetivo: practicar GROUP BY, agregaciones y ORDER BY en BigQuery.

WITH ventas_simuladas AS (
  SELECT 'Electronica'   AS categoria, 1250000 AS valor_venta, 'ORD-001' AS orden_id UNION ALL
  SELECT 'Electronica',                  980000,               'ORD-002'              UNION ALL
  SELECT 'Ropa',                         340000,               'ORD-003'              UNION ALL
  SELECT 'Ropa',                         210000,               'ORD-004'              UNION ALL
  SELECT 'Ropa',                         175000,               'ORD-005'              UNION ALL
  SELECT 'Alimentos',                     95000,               'ORD-006'              UNION ALL
  SELECT 'Alimentos',                    120000,               'ORD-007'              UNION ALL
  SELECT 'Electronica',                  560000,               'ORD-008'              UNION ALL
  SELECT 'Hogar',                        430000,               'ORD-009'              UNION ALL
  SELECT 'Hogar',                        315000,               'ORD-010'
)

SELECT
  categoria,
  COUNT(orden_id)                              AS numero_ordenes,
  SUM(valor_venta)                             AS total_ventas_cop,
  ROUND(AVG(valor_venta), 2)                   AS promedio_por_orden_cop,
  MAX(valor_venta)                             AS venta_maxima_cop,
  MIN(valor_venta)                             AS venta_minima_cop
FROM ventas_simuladas
GROUP BY categoria
ORDER BY total_ventas_cop DESC;
