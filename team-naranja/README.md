# Team Naranja

# PRISMA · Transparencia Activa

Asistente de navegación del ecosistema de transparencia española. Ayuda a localizar dónde se publica cada tipo de información pública (presupuestos, retribuciones, contratos, agendas, etc.).

## Problema que resuelve
La información pública está dispersa, desordenada y es difícil de entender. La herramienta la unifica, la aclara y la hace accesible para cualquiera.

## Prerequisites
- Node.js (v18 o superior)  
- npm o yarn  
- React  
- TailwindCSS  

## Installation and setup instructions

## Stack

- [React](https://react.dev/) 19
- [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router)
- [Vite](https://vite.dev/) 7
- [Tailwind CSS](https://tailwindcss.com/) 4

En desarrollo, las respuestas del asistente se generan en el cliente a partir de `src/data/catalog.json` (El MVP fue desarrollado sin base de datos ni API externa).

## Requisitos

- **Node.js ≥ 22.12** (requerido por TanStack Start). Comprueba tu versión:

  ```bash
  node -v
  ```

- **Gestor de paquetes**: npm (incluido con Node) o [Bun](https://bun.sh/) (el repo incluye `bun.lock`).

## Ejecución en local

### 1. Clonar e entrar en el proyecto

```bash
git clone https://github.com/ship-for-good/civio-2026.git
git checkout team-naranja
cd team-naranja
```

### 2. Instalar dependencias

Con npm:

```bash
npm install
```

Con Bun:

```bash
bun install
```

### 3. Arrancar el servidor de desarrollo

```bash
npm run dev
```

(o `bun run dev`)

La salida indicará la URL local, normalmente:

```text
Local: http://localhost:8080/
```

### 4. Abrir en el navegador

Visita **http://localhost:8080/** y prueba las consultas sugeridas o escribe la tuya.

**Guía de ejemplos:** [docs/ejemplos-busqueda.md](./docs/ejemplos-busqueda.md) — 5 preguntas detalladas que cubren los estados verde, ámbar y rojo.

### 5. Detener el servidor

En la terminal donde corre el proceso, pulsa **Ctrl + C**.

## Variables de entorno

No es necesario crear un archivo `.env` para desarrollo básico: no hay base de datos ni claves de API configuradas.

Si más adelante añades configuración:

- Secretos y valores solo de servidor: variables sin prefijo en `.env` (ver `src/lib/config.server.ts`).
- Valores públicos accesibles desde el cliente: prefijo `VITE_` en `.env` (nunca pongas secretos ahí).

## Scripts disponibles

| Comando            | Descripción                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Servidor de desarrollo con hot reload |
| `npm run build`    | Build de producción                  |
| `npm run preview`  | Previsualizar el build localmente    |
| `npm run lint`     | ESLint                               |
| `npm run format`   | Prettier (formatear el código)       |

## Estructura relevante

```text
src/
  routes/           # Rutas (file-based routing de TanStack)
  data/catalog.json # Catálogo de temas y fuentes de transparencia
  lib/matching.ts   # Lógica de emparejamiento de consultas
  hooks/            # Hook del asistente (mock en cliente)
```

`src/routeTree.gen.ts` se genera automáticamente; no lo edites a mano.

## Arquitectura del sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        Navegador                            │
│                                                             │
│  ┌──────────────┐     ┌──────────────────────────────────┐  │
│  │   Chat UI    │────▶│     useAssistant (hook)          │  │
│  │  (TanStack   │     │                                  │  │
│  │   Router)    │◀────│  1. Recibe query del usuario     │  │
│  └──────────────┘     │  2. matching.ts → top topics     │  │
│                       │  3. Devuelve status + payload    │  │
│                       └──────────────┬───────────────────┘  │
│                                      │                      │
│                       ┌──────────────▼───────────────────┐  │
│                       │        catalog.json               │  │
│                       │  (fuente de datos estática)      │  │
│                       │                                  │  │
│                       │  availability:                   │  │
│                       │   hosted → FoundReportCard       │  │
│                       │   linked → ExternalPortalCard    │  │
│                       │   external_portal → redirect     │  │
│                       │   not_published → RequestWizard  │  │
│                       └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Estado MVP (sin servidor):** toda la lógica corre en el cliente. No hay llamadas a API externas ni base de datos; el matching es local contra `catalog.json`.

**Arquitectura objetivo (post-hackathon):**

```
Usuario → Chat UI (React)
               │
               ▼
         POST /api/ask
               │
               ▼
   ┌───────────────────────┐
   │   Backend (API)       │
   │  1. Match semántico   │──▶ Vector DB / RAG
   │  2. Llamada LLM       │──▶ Claude / OpenAI
   │  3. JSON tipado       │
   └───────────┬───────────┘
               │
       catalog.json / DB
        (actualizado por
         scraper/cron)
```

---

## Decisiones técnicas clave

| Decisión | Alternativa | Motivo |
|----------|------------------------|--------|
| **Todo en cliente, sin backend** | API + LLM | Permite demo funcional sin API keys ni deploy de servidor en el tiempo del hackathon |
| **`catalog.json` estático** | Base de datos relacional | Simplicidad para el MVP; el esquema ya está diseñado para migrar a DB |
| **Matching por palabras clave (`matching.ts`)** | Embeddings + búsqueda vectorial | Sin latencia de red, sin coste de inferencia, suficiente para ≤20 temas |
| **`availability` como campo discriminante** | Lógica en el cliente | El catálogo declara el flujo; la UI solo renderiza según el valor recibido — fácil de migrar a API |

---

## Roadmap

### 1. Mantener el catálogo actualizado automáticamente

El `catalog.json` es el corazón del sistema. Para que no quede obsoleto hay dos vías:

- **Scraping periódico:** un script (Python/Node) que visite cada `source_url` del catálogo, detecte cambios en los datasets publicados (nuevos archivos, fechas de actualización, enlaces rotos) y actualice `last_crawled` y los metadatos. Se puede ejecutar con un cron diario.
- **APIs oficiales:** algunos portales ya exponen APIs REST o endpoints SPARQL (p. ej. `datos.gob.es`, Portal de Contratación del Estado). Donde existan, es preferible consultarlas directamente en lugar de hacer scraping frágil sobre HTML.

El objetivo es que el campo `last_crawled` y el estado `availability` se actualicen solos, sin intervención manual.

### 2. Conectar con un LLM y construir un RAG

El matching actual es por palabras clave y solo cubre temas que están en el catálogo. Los siguientes pasos:

- **Integrar Claude o GPT-4o** en el backend para interpretar preguntas en lenguaje natural ambiguas y generar respuestas enriquecidas (resumen del dataset, contexto legal, limitaciones).
- **RAG sobre el catálogo:** convertir cada entrada de `catalog.json` en un embedding y almacenarlo en una base de datos vectorial (pgvector, Pinecone, Qdrant). La búsqueda semántica reemplaza al matching por keywords y mejora la cobertura para preguntas no exactas.
- Limitar la IA a extracción y resumen estructurado, nunca a generar texto periodístico o legal (política Civio).

### 3. Añadir una base de datos

Migrar de `catalog.json` a una base de datos relacional (PostgreSQL) o documental permite:

- Histórico de cambios por tema (cuándo se publicó algo, cuándo desapareció).
- Búsqueda full-text nativa.
- Gestión de múltiples portales y jurisdicciones sin que el JSON crezca indefinidamente.

### 4. Ampliar cobertura de portales

- Portales autonómicos (17 CCAA tienen portales propios con distintos niveles de apertura).
- Portal de Contratación del Estado (PLACE) con integración de códigos CPV.
- Portales de ayuntamientos de las principales ciudades.
- La arquitectura de `catalog.json` ya está diseñada para esto: añadir un campo `jurisdiction` por entrada basta para soportar multi-ámbito.

### 5. Monitorización y alertas

Detectar automáticamente cuando un dataset que antes estaba publicado desaparece, o cuando se publica por primera vez información que no estaba disponible. Esto permite alertar a periodistas o ciudadanos interesados en un tema concreto (oportunidad OPP-1b del challenge Civio).

---

## Solución de problemas

| Problema | Qué hacer |
| -------- | --------- |
| Avisos `EBADENGINE` o errores de TanStack Start | Actualiza Node a ≥ 22.12 |
| Puerto 8080 en uso | Cierra el otro proceso o libera el puerto |
| Dependencias inconsistentes | Borra `node_modules` y ejecuta de nuevo `npm install` |

## Resumen rápido

```bash
npm install
npm run dev
# Abre http://localhost:8080/
```
