# Guía para Estudiantes — Laboratorio Big Data CESMAG

Esta guía te explica, paso a paso, cómo subir tus tareas SQL al repositorio del curso. No necesitas tener conocimientos previos de GitHub ni de la consola de comandos. Solo sigue los pasos en orden.

---

## ¿Qué es GitHub y para qué lo usamos?

GitHub es una plataforma donde se guardan archivos de código en la nube. Funciona parecido a Google Drive, pero con una ventaja clave: registra todos los cambios que se hacen, quién los hizo y cuándo. Por eso es muy usada en el mundo del desarrollo y de los datos.

En este curso lo usamos porque el proceso de entrega es automático. Cuando subes tu archivo `.sql`, el sistema lo detecta solo, lo valida en BigQuery (Google Cloud) y el resultado aparece en el dashboard del curso sin que el profesor tenga que hacer nada manualmente.

Lo que necesitas aprender para usar el repositorio son solo **5 comandos**. Nada más.

---

## Contenido

1. [Instalar las herramientas](#1-instalar-las-herramientas)
2. [Crear tu cuenta de GitHub](#2-crear-tu-cuenta-de-github)
3. [Descargar el repositorio del curso](#3-descargar-el-repositorio-del-curso)
4. [Crear tu carpeta personal](#4-crear-tu-carpeta-personal)
5. [Crear tu archivo SQL](#5-crear-tu-archivo-sql)
6. [Subir tu tarea (los 5 comandos)](#6-subir-tu-tarea-los-5-comandos)
7. [Crear el Pull Request (la entrega oficial)](#7-crear-el-pull-request-la-entrega-oficial)
8. [Revisar tu resultado en el dashboard](#8-revisar-tu-resultado-en-el-dashboard)
9. [Reglas que debe cumplir tu SQL](#9-reglas-que-debe-cumplir-tu-sql)
10. [Errores frecuentes y cómo resolverlos](#10-errores-frecuentes-y-cómo-resolverlos)
11. [Referencia rápida de comandos](#11-referencia-rápida-de-comandos)

---

## 1. Instalar las herramientas

### Git

Git es el programa que permite que tu computador se comunique con GitHub. Es gratuito.

**Cómo instalarlo en Windows:**

1. Entra a: https://git-scm.com/download/win
2. Descarga el instalador haciendo clic en "Click here to download"
3. Ábrelo y deja todas las opciones como están (simplemente haz clic en "Next" hasta el final y luego en "Install")

**Para verificar que quedó instalado:**

Abre la consola de Windows (`Windows + R`, escribe `cmd`, presiona Enter) y escribe:

```
git --version
```

Si ves algo como `git version 2.43.0`, está listo.

---

### Visual Studio Code (opcional pero recomendado)

Es un editor de texto que resalta los errores en el código SQL antes de que los subas. Puedes usar el Bloc de Notas si prefieres, pero VS Code ayuda bastante.

Descárgalo gratis en: https://code.visualstudio.com/

---

## 2. Crear tu cuenta de GitHub

Si ya tienes cuenta, pasa al punto 3.

1. Entra a https://github.com
2. Haz clic en "Sign up"
3. Ingresa tu correo, una contraseña y un nombre de usuario
   - Usa un nombre que el profesor te pueda identificar fácilmente, por ejemplo: `juan-hernandez-cesmag`
4. Verifica tu correo cuando GitHub te lo pida
5. Selecciona el plan gratuito ("Free")

---

## 3. Descargar el repositorio del curso

"Clonar" significa descargar el repositorio a tu computador para poder trabajar desde allí.

### Configura tu identidad (solo la primera vez)

Abre la consola (`cmd`) y escribe estos dos comandos con tus datos reales:

```bash
git config --global user.name "Tu Nombre Completo"
git config --global user.email "tucorreo@cesmag.edu.co"
```

Este paso solo se hace una vez en tu computador.

### Descarga el repositorio

1. El profesor te enviará un enlace de invitación al repositorio. Acéptalo.
2. En la consola, navega al lugar donde quieres guardar los archivos. Por ejemplo, al Escritorio:

```bash
cd Desktop
```

3. Clona el repositorio:

```bash
git clone https://github.com/Bernal-XFK/SQL_BigDataCESMAG.git
```

4. Entra a la carpeta que se acaba de crear:

```bash
cd SQL_BigDataCESMAG
```

Listo. Ya tienes el proyecto en tu computador.

---

## 4. Crear tu carpeta personal

> **Importante:** La carpeta debe estar en la ubicación correcta y con el nombre correcto. Si no, el sistema no reconocerá tu entrega.

### Cómo debe quedar organizado

```
estudiantes/
  └── tu-nombre/
        └── nombre-de-la-tarea/
              └── TuNombre_Tema.sql
```

Ejemplo real:

```
estudiantes/
  └── juan/
        └── tarea-01-clientes/
              └── Juan_Clientes.sql
```

### Antes de crear la carpeta: crea tu rama

Una rama es tu espacio de trabajo personal. Evita que tus cambios choquen con los de tus compañeros.

En la consola, dentro de la carpeta del proyecto, escribe:

```bash
git checkout -b entrega/tu-nombre
```

Por ejemplo, si te llamas Juan:

```bash
git checkout -b entrega/juan
```

Verás el mensaje: `Switched to a new branch 'entrega/juan'`

### Crea las carpetas

La forma más fácil es desde el Explorador de Windows:

1. Abre la carpeta `SQL_BigDataCESMAG > estudiantes`
2. Clic derecho → Nueva carpeta → escribe tu nombre en minúsculas (sin espacios, sin acentos)
3. Entra a tu carpeta y crea otra con el nombre de la tarea (ej. `tarea-01-clientes`)

> **Reglas para los nombres de carpetas:**
> - Solo letras minúsculas
> - Usa guión `-` en lugar de espacios
> - Sin acentos ni caracteres especiales (nada de ñ, á, @, etc.)

---

## 5. Crear tu archivo SQL

### Nombre del archivo

El formato es: `TuNombre_Tema.sql`

Ejemplos válidos:
- `Juan_Clientes.sql`
- `Maria_ConsultaVentas.sql`
- `Carlos_CrearTabla.sql`

### Contenido del archivo

Empieza siempre con comentarios que identifiquen tu entrega. En SQL, los comentarios empiezan con `--`:

```sql
-- Estudiante: Juan Pablo Hernández
-- Tarea: tarea-01-clientes
-- Fecha: 29/09/2026
-- Descripción: Consulta que retorna datos básicos de un cliente

SELECT
  1 AS id_cliente,
  'Juan Pablo Hernández' AS nombre,
  'juan.hernandez@cesmag.edu.co' AS correo;
```

Aquí hay otro ejemplo más completo que ya fue aprobado por el sistema:

```sql
-- Estudiante: Carlos Pérez
-- Tarea: tarea-01-clientes
-- Fecha: 29/09/2026
-- Descripción: Datos de cliente con timestamp de registro

SELECT
  101 AS id_cliente,
  'Carlos Perez' AS nombre_completo,
  'carlos.perez@cesmag.edu.co' AS correo_institucional,
  CURRENT_TIMESTAMP() AS fecha_registro;
```

**Para guardar el archivo:** En VS Code ve a Archivo → Guardar como → navega hasta tu carpeta de tarea → escribe el nombre con extensión `.sql` → Guardar.

---

## 6. Subir tu tarea (los 5 comandos)

Con el archivo `.sql` guardado en la carpeta correcta, abre la consola y asegúrate de estar dentro de la carpeta `SQL_BigDataCESMAG`. Luego ejecuta estos 5 pasos en orden:

---

**Paso 1 — Ver qué archivos cambiaron**

```bash
git status
```

Tu archivo debería aparecer en rojo bajo "Untracked files". Por ejemplo:

```
Untracked files:
    estudiantes/juan/tarea-01-clientes/Juan_Clientes.sql
```

---

**Paso 2 — Agregar el archivo**

```bash
git add estudiantes/tu-nombre/nombre-tarea/TuNombre_Tema.sql
```

Ejemplo:

```bash
git add estudiantes/juan/tarea-01-clientes/Juan_Clientes.sql
```

Si quieres agregar todos los archivos nuevos de una vez:

```bash
git add .
```

---

**Paso 3 — Guardar los cambios con un mensaje**

```bash
git commit -m "Entrega: tarea-01-clientes - Juan"
```

Verás un mensaje como: `[entrega/juan abc1234] Entrega: tarea-01-clientes - Juan`

---

**Paso 4 — Subir a GitHub**

```bash
git push origin entrega/tu-nombre
```

Ejemplo:

```bash
git push origin entrega/juan
```

GitHub puede pedirte tu usuario y contraseña. Ingrésalos.

Si todo salió bien verás algo como:

```
* [new branch]      entrega/juan -> entrega/juan
```

---

**Paso 5 — Verificar en GitHub**

1. Entra a https://github.com/Bernal-XFK/SQL_BigDataCESMAG
2. Haz clic en el menú "main" (arriba a la izquierda)
3. Busca tu rama `entrega/juan` en la lista
4. Entra y navega hasta tu archivo para confirmar que está ahí

---

## 7. Crear el Pull Request (la entrega oficial)

El Pull Request (PR) es la acción que le indica al sistema que tu entrega está lista. Es lo que dispara la validación automática en BigQuery.

1. Entra al repositorio en GitHub: https://github.com/Bernal-XFK/SQL_BigDataCESMAG

2. Verás un aviso amarillo que dice algo como:
   > *"entrega/juan had recent pushes — Compare & pull request"*

3. Haz clic en el botón verde **"Compare & pull request"**

4. Completa el formulario:
   - **Título:** `Entrega tarea-01-clientes - Juan Hernández`
   - **Descripción:** Explica brevemente qué hace tu consulta. Ejemplo:
     > "Consulta que retorna id, nombre y correo institucional de un cliente de prueba."

5. Confirma que abajo se muestra tu archivo SQL con líneas verdes (eso significa que el sistema detectó los cambios)

6. Haz clic en **"Create pull request"**

Después de esto, el sistema hace automáticamente:
1. Descarga tu archivo SQL
2. Verifica que no tenga comandos prohibidos
3. Valida la sintaxis en BigQuery
4. Guarda el resultado en el dashboard del curso

---

## 8. Revisar tu resultado en el dashboard

Espera unos minutos después de crear el Pull Request y luego entra al dashboard:

**https://sql-big-data-cesmag.vercel.app**

Busca tu nombre. Verás uno de estos dos estados:

| Estado | Color | Qué significa |
|--------|-------|---------------|
| SUCCESS | Verde | Tu SQL se ejecutó correctamente en BigQuery |
| FAILED | Rojo | Hubo un error. Hay un mensaje que te dice dónde falló |

Si aparece FAILED, corrige el archivo `.sql`, guárdalo y repite los 5 comandos del paso 6. No necesitas crear un Pull Request nuevo, el mismo se actualiza solo.

> El dashboard se actualiza cada 30 segundos. Si acabas de hacer push, espera 2 o 3 minutos antes de revisar.

---

## 9. Reglas que debe cumplir tu SQL

El sistema revisa automáticamente tu código antes de ejecutarlo. Si encuentra algo prohibido, rechaza la entrega con estado FAILED.

### Lo que sí puedes usar

| Comando | Para qué sirve |
|---------|----------------|
| `SELECT` | Consultar datos |
| `CREATE TABLE` | Crear una tabla nueva |
| `WITH` | Consultas avanzadas (CTEs) |
| `INSERT INTO` | Insertar datos |

### Lo que está bloqueado

| Comando | Por qué no se permite |
|---------|-----------------------|
| `DROP TABLE` | Eliminaría tablas del entorno compartido |
| `TRUNCATE` | Borraría todos los datos de una tabla |
| `DELETE FROM` sin `WHERE` | Borraría todos los registros sin filtro |

Estos comandos están bloqueados para proteger el entorno de todos. Si los usas, tu entrega será rechazada automáticamente.

---

## 10. Errores frecuentes y cómo resolverlos

**"fatal: not a git repository"**

Estás ejecutando Git desde la carpeta equivocada. Navega al proyecto:
```bash
cd Desktop\SQL_BigDataCESMAG
```

---

**"error: pathspec did not match any files"**

La ruta del archivo está mal escrita. Primero usa `git status` para ver exactamente cómo aparece el archivo, y copia ese texto directamente en el `git add`.

---

**FAILED en el dashboard: "SQL bloqueado"**

Tu consulta tiene un comando prohibido (`DROP`, `TRUNCATE`, `DELETE`). Elimínalo del archivo, guarda y vuelve a hacer los 5 pasos del push.

---

**FAILED en el dashboard: "Error de sintaxis"**

Hay un error de escritura en tu SQL (por ejemplo `SELECET` en lugar de `SELECT`). Revisa el mensaje de error, corrige el archivo y vuelve a hacer push.

---

**"No sé en qué rama estoy"**

```bash
git branch
```

La rama marcada con `*` es en la que estás. Para cambiar a la tuya:

```bash
git checkout entrega/tu-nombre
```

---

**"Ya hice el Pull Request pero necesito corregir algo"**

No hace falta crear uno nuevo. Solo corrige el archivo, guárdalo, y vuelve a ejecutar los 5 comandos del paso 6. El Pull Request existente se actualiza automáticamente.

---

## 11. Referencia rápida de comandos

```bash
# Solo la primera vez en tu computador
git config --global user.name "Tu Nombre"
git config --global user.email "tucorreo@cesmag.edu.co"

# Solo la primera vez para descargar el proyecto
git clone https://github.com/Bernal-XFK/SQL_BigDataCESMAG.git
cd SQL_BigDataCESMAG
git checkout -b entrega/tu-nombre

# Cada vez que entregues una tarea (los 5 pasos)
git status
git add estudiantes/tu-nombre/tarea/TuNombre_Tema.sql
git commit -m "Entrega: nombre-tarea - TuNombre"
git push origin entrega/tu-nombre
# Luego ir a GitHub.com y crear el Pull Request
```

---

## Convención de nombres — resumen

| Qué | Formato | Ejemplo |
|-----|---------|---------|
| Tu carpeta | minúsculas, sin espacios | `juan` |
| Carpeta de tarea | minúsculas con guiones | `tarea-01-clientes` |
| Archivo SQL | `TuNombre_Tema.sql` | `Juan_Clientes.sql` |
| Rama de Git | `entrega/tu-nombre` | `entrega/juan` |
| Mensaje de commit | breve y en español | `Entrega: tarea-01-clientes - Juan` |

---

## ¿Algo no te funciona?

Toma una captura de pantalla del error (en la consola o en el dashboard) y envíasela al profesor con una descripción de en qué paso estabas. El dashboard también le muestra al profesor exactamente qué archivo subiste, cuándo y cuál fue el resultado, así que no necesitas escribir todo desde cero.

---

*Laboratorio de Big Data · Universidad CESMAG*
*Dashboard del curso: https://sql-big-data-cesmag.vercel.app*
