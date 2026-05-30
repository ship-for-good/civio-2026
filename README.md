# Team Verde — Transparencia Graph Crawler

**Ship for Good 2026 · [Civio](https://civio.es/) · OPP-1a**

## Problema

El [Portal de Transparencia](https://transparencia.gob.es/publicidad-activa) es un directorio jerárquico de enlaces difícil de explorar: el conocimiento de dónde buscar cada tipo de información es **tácito** (solo lo tiene quien conoce la administración). Civio y los ciudadanos pierden tiempo navegando 8 niveles de profundidad sin saber qué hay en cada sección.

## Solución

Crawler en Go que descubre automáticamente el **grafo de Publicidad Activa**, enriquece cada nodo con descripción, timestamps, contenidos hijos y (opcionalmente) datos extraídos con Playwright, y exporta **JSON** listo para una UI de exploración.

---

## Prerrequisitos

| Requisito | Versión |
|-----------|---------|
| **Docker** + **Docker Compose** | Recomendado (forma principal de ejecutar) |
| **Go** | 1.23+ (solo desarrollo local) |
| **Git** | Para clonar el repo |

No se requieren API keys ni credenciales: todo el contenido es público.

---

## Instalación

```bash
git clone https://github.com/ship-for-good/civio-2026
cd civio-2026
git checkout team-verde

# Build imágenes Docker
docker compose build
```

Desarrollo local (opcional):

```bash
go mod download
go test ./...
go build -o bin/transparencia ./cmd/transparencia
```

---

## Variables de entorno

| Variable | Descripción | Obligatoria |
|----------|-------------|-------------|
| `DB_PATH` | Ruta SQLite en contenedor (referencia; la CLI usa `--db`) | No |

No hay variables sensibles. La ruta de la base de datos se pasa por flag `--db` (default: `data/graph.db`).

---

## Uso rápido (demo)

```bash
# 1. Crawl estático del árbol (~510 nodos, ~3 min)
docker compose run --rm crawler crawl --db /data/graph.db --rate 3 --force

# 2. Scrape dinámico con Playwright (~39 nodos, ~3 min, 5 workers)
docker compose run --rm crawler-playwright scrape-dynamic \
  --db /data/graph.db \
  --types leaf_dynamic,buscador_entry \
  --workers 5 --force

# 3. Export JSON para front
docker compose run --rm crawler export --db /data/graph.db --out /data/graph.json

# 4. Ver estadísticas
docker compose run --rm crawler stats --db /data/graph.db
```

**Salida:** `./data/graph.db` (SQLite) y `./data/graph.json` (~1,2 MB, 510 nodos, 550 aristas).

Servir el JSON en local para el equipo de front:

```bash
cd data && python3 -m http.server 8080
# → http://localhost:8080/graph.json
```

---

## Tecnologías principales

| Capa | Stack |
|------|-------|
| Lenguaje | **Go 1.23** |
| CLI | Cobra |
| HTTP / parsing | net/http, goquery |
| Base de datos | SQLite (`modernc.org/sqlite`, sin CGO) |
| Scraping dinámico | Playwright (`playwright-go`) + Chromium |
| Contenedores | Docker multi-stage (Alpine + Playwright Noble) |

---

## Arquitectura

```
transparencia.gob.es
        │
        ▼
┌───────────────────┐     ┌────────────────────────┐
│  crawler (HTTP)   │     │ crawler-playwright     │
│  BFS + sidebar    │     │ scrape-dynamic         │
│  goquery          │     │ Chromium + goroutines  │
└─────────┬─────────┘     └───────────┬────────────┘
          │                             │
          └──────────┬──────────────────┘
                     ▼
              ┌─────────────┐
              │  graph.db   │  SQLite (nodes, edges, crawl_runs)
              └──────┬──────┘
                     │ export
                     ▼
              ┌─────────────┐
              │ graph.json  │  → UI / front (pendiente)
              └─────────────┘
```

**Dos fases desacopladas:**

1. **Crawl HTTP** — ~90% del árbol es HTML estático (sidebar AEM). BFS con dedup por URL, rate limit y skip incremental (`ETag` / `Last-Modified` / hash).
2. **Scrape dinámico** — nodos `leaf_dynamic` y `buscador_entry` renderizados con Playwright; extracción de tablas, texto e iframes; 5 workers en paralelo.

Documentación técnica detallada: **[TRANSPARENCIA-CRAWLER.md](./TRANSPARENCIA-CRAWLER.md)**

---

## Chatbot — Query Layer

El módulo de chatbot añade una capa de consulta en lenguaje natural sobre el grafo exportado (`graph.json`): recibe una pregunta ciudadana, busca nodos relevantes en memoria y devuelve una respuesta estructurada con:

- una coincidencia directa (`found: true`) con `url` y ruta navegable (`path`), o
- una respuesta de no encontrado (`found: false`) con explicación, hint de navegación y alternativa de derecho de acceso.

Además, aplica una verificación LLM sobre los mejores candidatos para reducir falsos positivos antes de confirmar la respuesta.

### Stack del módulo

- **Go** (`net/http`) para API y lógica del handler.
- **Anthropic Claude API** para extracción/validación/hints en lenguaje natural.
- **BFS sobre `graph.json` en memoria** para ranking de nodos sin base de datos en tiempo de consulta.

### Cómo arrancarlo

Desde la raíz del proyecto, con `.env` configurado:

```bash
cd back
go run ./chatbot/main.go
```

Servidor por defecto: `http://localhost:8080`.

### Variables de entorno necesarias

| Variable | Descripción |
|----------|-------------|
| `ANTHROPIC_API_KEY` | API key para llamadas a Claude |
| `GRAPH_PATH` | Ruta al `graph.json` que cargará el chatbot |
| `PORT` | Puerto HTTP del servicio (por defecto `8080`) |

### Contrato del endpoint

`POST /chat`

**Request**

```json
{
  "question": "¿Dónde puedo ver las retribuciones de los altos cargos?"
}
```

**Response — `found:true`**

```json
{
  "found": true,
  "message": "✅ Sí, esa información está disponible en el **Portal de Transparencia**.",
  "hint": "",
  "url": "https://transparencia.gob.es/publicidad-activa/por-materias/altos-cargos/retribuciones",
  "path": [
    { "title": "Publicidad Activa", "url": "https://transparencia.gob.es/publicidad-activa" },
    { "title": "Altos Cargos", "url": "https://transparencia.gob.es/publicidad-activa/por-materias/altos-cargos" },
    { "title": "Retribuciones de Altos Cargos", "url": "https://transparencia.gob.es/publicidad-activa/por-materias/altos-cargos/retribuciones" }
  ],
  "matched_node": {
    "title": "Retribuciones de Altos Cargos",
    "description": "...",
    "page_type": "navigation"
  }
}
```

**Response — `found:false`**

```json
{
  "found": false,
  "message": "🔎 Esa información no está publicada directamente. Puedes solicitarla mediante el **derecho de acceso** en https://transparencia.gob.es/derecho-acceso/solicite-informacion-publica",
  "hint": "👉 – En la página actual, busca el bloque de **retribuciones** o el enlace de **altos cargos**.",
  "url": "https://transparencia.gob.es/derecho-acceso/solicite-informacion-publica",
  "path": [],
  "matched_node": null
}
```

### Tests del módulo

```bash
go test ./back/chatbot/...
```

---

## Decisiones técnicas clave

| Decisión | Motivo |
|----------|--------|
| **Go + SQLite** | Binario único, sin CGO, persistencia local embebida, fácil de contenerizar |
| **Sidebar AEM como fuente del grafo** | Cada página incluye el árbol completo de navegación en HTML estático |
| **Dos imágenes Docker** | Crawl HTTP ligero (~15 MB) vs Playwright pesado (~1,5 GB) solo cuando hace falta |
| **Goroutines en scrape-dynamic** | ~4,5× más rápido (39 páginas: 17 min → 3,5 min con 5 workers) |
| **JSON como contrato con front** | UI desacoplada; consume `graph.json` sin depender del crawler |
| **Skip incremental** | Re-crawls baratos comparando `ETag`, `Last-Modified` y `html_hash` |

---

## Modelo de datos (resumen)

Cada **nodo** incluye: `url`, `title`, `description`, `page_type`, `depth`, timestamps (`content_updated_at`, `http_last_modified`, `scraped_at`), `child_contents` (temas hijos) y opcionalmente `dynamic_content` (tablas/texto Playwright).

Tipos de página: `navigation`, `leaf_static`, `leaf_dynamic`, `buscador_entry`, `external`.

Ver esquema completo y ejemplos JSON en [TRANSPARENCIA-CRAWLER.md](./TRANSPARENCIA-CRAWLER.md).

---

## Comandos CLI

| Comando | Servicio Docker | Descripción |
|---------|-----------------|-------------|
| `crawl` | `crawler` | BFS del árbol de Publicidad Activa |
| `stats` | `crawler` | Estadísticas del grafo |
| `export` | `crawler` | Exporta `graph.json` |
| `enrich` | `crawler` | Recalcula `child_contents` en nodos padre |
| `scrape-dynamic` | `crawler-playwright` | Playwright para páginas dinámicas |

Flags relevantes: `--db`, `--rate`, `--force`, `--skip-unchanged`, `--workers` (scrape-dynamic), `--types`.

---

## Roadmap

| Fase | Estado | Descripción |
|------|--------|-------------|
| Grafo de navegación + JSON | **Hecho** | ~510 nodos, descripciones, child_contents |
| Scrape dinámico Playwright | **Hecho** | 39 nodos, tablas/texto, workers paralelos |
| UI de exploración | Pendiente | Consumir `graph.json` |
| Scrape buscador SSR | Pendiente | `servicios-buscador/buscar.htm?pag=N` (~900k registros) |
| Scrape iframes del buscador | Pendiente | Contenido real de `buscador_entry` |
| Detección de cambios (OPP-1b) | Pendiente | Diff por `html_hash` / timestamps |

---

## Demo en vivo

1. `docker compose run --rm crawler stats --db /data/graph.db` — mostrar 510 nodos.
2. Abrir `data/graph.json` — nodo con `description`, `child_contents`, `dynamic_content`.
3. (Opcional) Re-ejecutar `scrape-dynamic --limit 3` en una página concreta.

El proyecto **ejecuta y produce datos reales** del portal de transparencia; no es mockup.

---

## Estructura del repo

```
cmd/transparencia/          # CLI (crawl, export, scrape-dynamic, …)
internal/crawler/           # BFS HTTP, fetcher, clasificador
internal/dynamic/           # Playwright + extracción
internal/graph/             # SQLite, export JSON
internal/parser/            # Sidebar AEM, URLs, descripciones
internal/models/            # Tipos de dominio
data/                       # graph.db, graph.json (gitignored)
Dockerfile                  # Imagen ligera HTTP
Dockerfile.playwright       # Imagen con Chromium
docker-compose.yml
TRANSPARENCIA-CRAWLER.md    # Documentación técnica extendida
```

---

# Ship for Good · Información del evento

**May 29–30, 2026 · [42 Barcelona](https://www.42barcelona.com/es/) · [shipforgood.org/es](https://www.shipforgood.org/es)**

| Documento | Descripción |
|-----------|-------------|
| [challenge-discovery.md](./challenge-discovery.md) | Contexto Civio y oportunidades OPP-1a/1b, OPP-2 |
| [how-to-submit-project.md](./how-to-submit-project.md) | Reglas de entrega del hackathon |
| [how-to-work-team-branch.md](./how-to-work-team-branch.md) | Trabajo en rama `team-verde` |
| [AUTHORSHIP.md](./AUTHORSHIP.md) | Licencia MIT, reuso por Civio |

**Rama del equipo:** `team-verde`

```bash
git clone https://github.com/ship-for-good/civio-2026
cd civio-2026 && git checkout team-verde
```

**Slack:** [announcements](https://ship-for-good.slack.com/archives/C0B1GNT77QB) · [ask-civio](https://ship-for-good.slack.com/archives/C0B6YE9GYSG) · [tech-support](https://ship-for-good.slack.com/archives/C0B6RERAELV)
