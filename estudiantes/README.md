# Convención estudiantes

Estructura obligatoria:

```
estudiantes/{nombre-estudiante}/{tarea}/*.sql
```

Ejemplo:
```
estudiantes/deivid/taller-02-analisis-ventas/Deivid_AnalisisVentas.sql
```

Reglas:
1. Un archivo `.sql` por entrega.
2. Nombre de carpeta: solo minúsculas, sin espacios, sin acentos (usa `-` como separador).
3. Nombre de archivo: `{Nombre}_{Tema}.sql`
4. El encabezado del archivo debe incluir el nombre completo del estudiante con 2 nombres y 2 apellidos.
5. Hacer `push` directamente a la rama `main` — sin crear ramas adicionales.
6. El `push` dispara automáticamente el webhook → Cloud Function → Composer → BigQuery.
