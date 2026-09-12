# Convención estudiantes

Estructura obligatoria:

```
estudiantes/{nombre-estudiante}/{tarea}/*.sql
```

Ejemplo:
```
estudiantes/andres/tarea-01-clientes/Andres_Clientes-Gam.sql
```

Reglas:
1. Un archivo `.sql` por entrega.
2. Nombre archivo: `{Nombre}_{Tema}.sql`
3. Hacer `push` a rama `entrega/nombre` + PR a `main`.
4. El `push` / PR es el trigger que dispara el webhook -> Cloud Function -> Composer -> BigQuery.
