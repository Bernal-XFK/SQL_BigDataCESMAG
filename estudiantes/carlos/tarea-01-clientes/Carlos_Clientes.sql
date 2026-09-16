-- Caso de Prueba 1: Consulta SQL valida
-- Estudiante: carlos
-- Tarea: tarea-01-clientes
-- Resultado esperado: Aprobado (SUCCESS)

SELECT
  101 AS id_cliente,
  'Carlos Perez' AS nombre_completo,
  'carlos.perez@cesmag.edu.co' AS correo_institucional,
  CURRENT_TIMESTAMP() AS fecha_registro;
