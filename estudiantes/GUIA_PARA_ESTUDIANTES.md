# Guía para Estudiantes — Laboratorio Big Data CESMAG

Esta guía te explica, paso a paso, cómo subir tus tareas SQL al repositorio del curso. No necesitas tener conocimientos previos de GitHub ni de la consola de comandos. Solo sigue los pasos en orden.

---

## ¿Qué es GitHub y para qué lo usamos?

GitHub es una plataforma donde se guardan archivos de código en la nube. Funciona parecido a Google Drive, pero con una ventaja clave: registra todos los cambios que se hacen, quién los hizo y cuándo. Por eso es muy usada en el mundo del desarrollo y de los datos.

En este curso lo usamos porque el proceso de entrega es automático. Cuando subes tu archivo `.sql`, el sistema lo detecta solo, lo valida en BigQuery (Google Cloud) y el resultado aparece en el dashboard del curso sin que el profesor tenga que hacer nada manualmente.

Lo que necesitas aprender son solo **4 comandos**. Nada más.

---

## Contenido

1. [Instalar las herramientas](#1-instalar-las-herramientas)
2. [Crear tu cuenta de GitHub](#2-crear-tu-cuenta-de-github)
3. [Descargar el repositorio del curso](#3-descargar-el-repositorio-del-curso)
4. [Crear tu carpeta personal](#4-crear-tu-carpeta-personal)
5. [Crear tu archivo SQL](#5-crear-tu-archivo-sql)
6. [Subir tu tarea (los 4 comandos)](#6-subir-tu-tarea-los-4-comandos)
7. [Revisar tu resultado en el dashboard](#7-revisar-tu-resultado-en-el-dashboard)
8. [Reglas que debe cumplir tu SQL](#8-reglas-que-debe-cumplir-tu-sql)
9. [Errores frecuentes y cómo resolverlos](#9-errores-frecuentes-y-cómo-resolverlos)
10. [Referencia rápida de comandos](#10-referencia-rápida-de-comandos)

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
   - Usa un nombre que el profesor te pueda identificar fácilmente, por ejemplo: `deivid-cardenas`
4. Verifica tu correo cuando GitHub te lo pida
5. Selecciona el plan gratuito ("Free")

---

## 3. Descargar el repositorio del curso

"Clonar" significa descargar el repositorio a tu computador para poder trabajar desde allí.

### Configura tu identidad (solo la primera vez)

Abre la consola (`cmd`) y escribe estos dos comandos con tus datos reales:

```bash
git config --global user.name "Nombre1 Nombre2 Apellido1 Apellido2"
git config --global user.email "tucorreo@cesmag.edu.co"
```

**Ejemplo real:**

```bash
git config --global user.name "Deivid Andres Cardenas Lopez"
git config --global user.email "deivid.cardenas@cesmag.edu.co"
```

> **Importante:** Escribe tus **2 nombres y 2 apellidos completos** tal como aparecen en tus documentos. Esto es lo que identificará tu entrega en el dashboard del curso.

Este paso solo se hace **una vez** en tu computador.

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

Ejemplo real (estudiante: Deivid Andres Cardenas Lopez):

```
estudiantes/
  └── deivid/
        └── taller-02-analisis-ventas/
              └── Deivid_AnalisisVentas.sql
```

**Para crear las carpetas desde el Explorador de Windows:**

1. Abre la carpeta `SQL_BigDataCESMAG > estudiantes`
2. Clic derecho → Nueva carpeta → escribe tu primer nombre en minúsculas (sin espacios, sin acentos)
3. Entra a tu carpeta y crea otra con el nombre de la tarea o taller (ej. `taller-02-analisis-ventas`)

> **Reglas para los nombres de carpetas:**
> - Solo letras minúsculas
> - Usa guión `-` en lugar de espacios
> - Sin acentos ni caracteres especiales (nada de ñ, á, @, etc.)

---

## 5. Crear tu archivo SQL

### Nombre del archivo

El formato es: `TuPrimerNombre_Tema.sql`

Ejemplos válidos:
- `Deivid_AnalisisVentas.sql`
- `Maria_ConsultaClientes.sql`
- `Juan_ReporteVentas.sql`

### Contenido del archivo

Empieza siempre con estos comentarios de encabezado. En SQL, los comentarios empiezan con `--`:

```sql
-- Estudiante: Nombre1 Nombre2 Apellido1 Apellido2
-- Taller/Tarea: nombre-de-la-tarea
-- Fecha: DD/MM/AAAA
-- Descripcion: Breve descripcion de lo que hace la consulta

SELECT
  ...
```

**Ejemplo completo listo para usar:**

```sql
-- Estudiante: Deivid Andres Cardenas Lopez
-- Taller: taller-02-analisis-ventas
-- Fecha: 29/09/2026
-- Descripcion: Consulta que retorna datos de ventas agrupados por categoria

SELECT
  101 AS id_venta,
  'Electronica' AS categoria,
  1250000 AS valor_venta_cop,
  CURRENT_TIMESTAMP() AS fecha_registro;
```

**Para guardar el archivo:** En VS Code ve a Archivo → Guardar como → navega hasta tu carpeta de tarea → escribe el nombre con extensión `.sql` → Guardar.

---

## 6. Subir tu tarea (los 4 comandos)

Con el archivo `.sql` guardado en la carpeta correcta, abre la consola y asegúrate de estar dentro de la carpeta `SQL_BigDataCESMAG`. Luego ejecuta estos 4 pasos en orden:

---

**Paso 1 — Verificar qué archivos cambiaron**

```bash
git status
```

Tu archivo debería aparecer en rojo bajo "Untracked files". Por ejemplo:

```
Untracked files:
    estudiantes/deivid/taller-02-analisis-ventas/Deivid_AnalisisVentas.sql
```

---

**Paso 2 — Agregar el archivo**

```bash
git add estudiantes/tu-nombre/nombre-tarea/TuNombre_Tema.sql
```

Ejemplo:

```bash
git add estudiantes/deivid/taller-02-analisis-ventas/Deivid_AnalisisVentas.sql
```

Si quieres agregar todos los archivos nuevos de una vez:

```bash
git add .
```

---

**Paso 3 — Guardar los cambios con un mensaje**

```bash
git commit -m "Entrega: nombre-taller - Tu Nombre Completo"
```

Ejemplo:

```bash
git commit -m "Entrega: taller-02-analisis-ventas - Deivid Andres Cardenas Lopez"
```

Verás un mensaje como: `[main abc1234] Entrega: taller-02-analisis-ventas - Deivid Andres Cardenas Lopez`

---

**Paso 4 — Subir a GitHub**

```bash
git push origin main
```

GitHub puede pedirte tu usuario y contraseña. Ingrésalos.

Si todo salió bien verás algo como:

```
To https://github.com/Bernal-XFK/SQL_BigDataCESMAG.git
   abc1234..def5678  main -> main
```

En ese momento el sistema detecta automáticamente tu archivo `.sql` y empieza la validación. No necesitas hacer nada más.

---

**Paso 5 — Verificar en GitHub**

1. Entra a https://github.com/Bernal-XFK/SQL_BigDataCESMAG
2. Navega a `estudiantes > tu-nombre > tu-tarea`
3. Confirma que tu archivo `.sql` aparece ahí con el contenido correcto

---

## 7. Revisar tu resultado en el dashboard

Espera unos minutos después del `push` y luego entra al dashboard del curso:

**https://sql-big-data-cesmag.vercel.app**

Busca tu nombre. Verás uno de estos dos estados:

| Estado | Color | Qué significa |
|--------|-------|---------------|
| Ejecución Exitosa | Verde | Tu SQL se ejecutó correctamente en BigQuery |
| Fallo en Sintaxis/Ejecución | Rojo | Hubo un error. Hay un mensaje que te dice dónde falló |

Si aparece error, corrige el archivo `.sql`, guárdalo y repite los 4 comandos del paso 6. No pierdas tiempo esperando — puedes corregir y volver a hacer push cuantas veces necesites.

> El dashboard se actualiza cada 30 segundos. Si acabas de hacer push, espera 2 o 3 minutos antes de revisar.

---

## 8. Reglas que debe cumplir tu SQL

El sistema revisa automáticamente tu código antes de ejecutarlo. Si encuentra algo prohibido, rechaza la entrega.

### Lo que sí puedes usar

| Comando | Para qué sirve |
|---------|----------------|
| `SELECT` | Consultar datos |
| `CREATE TABLE` | Crear una tabla nueva |
| `WITH` | Consultas con CTE (consultas anidadas) |
| `INSERT INTO` | Insertar datos |

### Lo que está bloqueado

| Comando | Por qué no se permite |
|---------|-----------------------|
| `DROP TABLE` | Eliminaría tablas del entorno compartido |
| `TRUNCATE` | Borraría todos los datos de una tabla |
| `DELETE FROM` sin `WHERE` | Borraría todos los registros sin filtro |

Estos comandos están bloqueados para proteger el entorno de todos. Si los usas, tu entrega será rechazada automáticamente.

---

## 9. Errores frecuentes y cómo resolverlos

**"fatal: not a git repository"**

Estás ejecutando Git desde la carpeta equivocada. Navega al proyecto:
```bash
cd Desktop\SQL_BigDataCESMAG
```

---

**"error: pathspec did not match any files"**

La ruta del archivo está mal escrita. Primero usa `git status` para ver exactamente cómo aparece el archivo, y copia ese texto directamente en el `git add`.

---

**"Fallo en Sintaxis/Ejecución" en el dashboard — "SQL bloqueado"**

Tu consulta tiene un comando prohibido (`DROP`, `TRUNCATE`, `DELETE`). Elimínalo del archivo, guarda y vuelve a hacer los 4 pasos.

---

**"Fallo en Sintaxis/Ejecución" en el dashboard — "Error de sintaxis"**

Hay un error de escritura en tu SQL (por ejemplo `SELECET` en lugar de `SELECT`). Revisa el mensaje de error, corrige el archivo y vuelve a hacer push.

---

**"rejected — non-fast-forward" al hacer push**

Alguien más subió cambios antes que tú. Primero actualiza tu copia local:

```bash
git pull origin main
```

Luego repite el `push`.

---

**No aparezco en el dashboard**

Verifica que:
1. El archivo `.sql` está en la ruta correcta: `estudiantes/tu-nombre/nombre-tarea/TuNombre_Tema.sql`
2. El `git push` completó sin errores
3. Han pasado al menos 3 minutos desde el push

---

## 10. Referencia rápida de comandos

```bash
# ── SOLO LA PRIMERA VEZ EN TU COMPUTADOR ─────────────────────────────
git config --global user.name "Nombre1 Nombre2 Apellido1 Apellido2"
git config --global user.email "tucorreo@cesmag.edu.co"

# ── SOLO LA PRIMERA VEZ PARA DESCARGAR EL PROYECTO ───────────────────
git clone https://github.com/Bernal-XFK/SQL_BigDataCESMAG.git
cd SQL_BigDataCESMAG

# ── CADA VEZ QUE ENTREGUES UNA TAREA (los 4 pasos) ───────────────────
git status
git add estudiantes/tu-nombre/nombre-tarea/TuNombre_Tema.sql
git commit -m "Entrega: nombre-tarea - Nombre1 Nombre2 Apellido1 Apellido2"
git push origin main
```

---

## Convención de nombres — resumen

| Qué | Formato | Ejemplo |
|-----|---------|---------|
| Nombre en git config | 2 nombres + 2 apellidos | `Deivid Andres Cardenas Lopez` |
| Tu carpeta | primer nombre, minúsculas | `deivid` |
| Carpeta de tarea | minúsculas con guiones | `taller-02-analisis-ventas` |
| Archivo SQL | `TuNombre_Tema.sql` | `Deivid_AnalisisVentas.sql` |
| Encabezado del SQL | 2 nombres + 2 apellidos | `-- Estudiante: Deivid Andres Cardenas Lopez` |
| Mensaje de commit | nombre completo en el texto | `Entrega: taller-02 - Deivid Andres Cardenas Lopez` |

---

## ¿Algo no te funciona?

Toma una captura de pantalla del error (en la consola o en el dashboard) y envíasela al profesor con una descripción de en qué paso estabas. El dashboard también le muestra al profesor exactamente qué archivo subiste, cuándo y cuál fue el resultado.

---

*Laboratorio de Big Data · Universidad CESMAG*
*Dashboard del curso: https://sql-big-data-cesmag.vercel.app*
