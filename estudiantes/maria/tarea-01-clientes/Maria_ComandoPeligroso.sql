-- Caso de Prueba 2: Violacion de regla de seguridad (comando destructivo)
-- Estudiante: maria
-- Tarea: tarea-01-clientes
-- Resultado esperado: Fallo (FAILED) en step download_sql
-- Error esperado: SQL bloqueado: DROP/DELETE sin WHERE/TRUNCATE no permitido

DROP TABLE `infrabigdataces.sandbox_estudiantes.tabla_segura`;
