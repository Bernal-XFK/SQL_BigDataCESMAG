-- Ejemplo: Andres_Clientes-Gam.sql
-- Estudiante: andres
-- Tarea: tarea-01-clientes
-- Este push dispara el webhook -> GCS -> BigQuery

SELECT
  id_cliente,
  nombre,
  email
FROM `proyecto.dataset.clientes`
LIMIT 100;
-- prueba e2e
-- prueba e2e
