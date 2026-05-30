# Transparencia Crawler — Documentación técnica

> Guía de referencia del crawler. Para instalación, demo y entrega del hackathon ver [README.md](./README.md).

Crawler en Go que construye localmente el grafo de navegación de **Publicidad Activa** en [transparencia.gob.es](https://transparencia.gob.es/publicidad-activa).

---

## Pipeline completo

```bash
docker compose build

# Fase 1: árbol estático (~3 min, ~510 nodos)
docker compose run --rm crawler crawl --db /data/graph.db --rate 3 --force

# Fase 2: contenido dinámico (~3 min, ~39 nodos, 5 workers)
docker compose run --rm crawler-playwright scrape-dynamic \
  --db /data/graph.db \
  --types leaf_dynamic,buscador_entry \
  --workers 5 --force

# Export para front
docker compose run --rm crawler export --db /data/graph.db --out /data/graph.json
docker compose run --rm crawler stats --db /data/graph.db
```

---

## Servicios Docker

| Servicio | Dockerfile | Tamaño aprox. | Comandos |
|----------|------------|---------------|----------|
| `crawler` | `Dockerfile` | ~15 MB | `crawl`, `stats`, `export`, `enrich` |
| `crawler-playwright` | `Dockerfile.playwright` | ~1,5 GB | `scrape-dynamic` |

`docker-compose.yml` monta `./data:/data`. Playwright usa `shm_size: 1gb`.

---

## CLI — referencia de flags

### `crawl`

| Flag | Default | Descripción |
|------|---------|-------------|
| `--db` | `data/graph.db` | Ruta SQLite |
| `--seed` | `/publicidad-activa` | URL inicial |
| `--rate` | `3` | Peticiones HTTP/s |
| `--max-pages` | `10000` | Tope de páginas |
| `--skip-unchanged` | `true` | Skip si ETag/hash coinciden |
| `--force` | `false` | Re-scrape aunque no haya cambios |

### `scrape-dynamic`

| Flag | Default | Descripción |
|------|---------|-------------|
| `--types` | `leaf_dynamic` | Tipos separados por coma |
| `--workers` | `5` | Goroutines Playwright (máx. 10) |
| `--limit` | `0` | Máx. nodos (0 = todos) |
| `--timeout` | `45` | Timeout por página (s) |
| `--skip-unchanged` | `true` | Skip si `dynamic_hash` igual |
| `--force` | `false` | Re-scrape forzado |

### `export`

| Flag | Default | Descripción |
|------|---------|-------------|
| `--out` | `data/graph.json` | Archivo de salida |
| `--format` | `json` | Formato (solo json) |

---

## Desarrollo local

```bash
go mod download
go test ./...
go run ./cmd/transparencia crawl --db data/graph.db --force
go run ./cmd/transparencia scrape-dynamic --db data/graph.db  # requiere Playwright instalado
go run ./cmd/transparencia export --db data/graph.db --out data/graph.json
```

Instalar driver Playwright (solo para scrape-dynamic local):

```bash
go run github.com/playwright-community/playwright-go/cmd/playwright@v0.5200.0 install
```

---

## Modelo de datos SQLite

### Tabla `nodes`

| Columna | Descripción |
|---------|-------------|
| `url`, `path`, `title` | Identidad del nodo |
| `description` | Texto para indexación/UI |
| `depth`, `page_type`, `parent_id` | Estructura del grafo |
| `html_hash` | SHA256 del HTML estático |
| `content_updated_at` | Fecha editorial (`div.date`) |
| `http_last_modified`, `http_etag` | Headers HTTP |
| `scraped_at` | Último crawl HTTP |
| `child_contents` | JSON: temas hijos directos |
| `dynamic_content` | JSON: tablas/texto Playwright |
| `dynamic_hash`, `dynamic_scraped_at` | Fingerprint y fecha scrape dinámico |

### Tabla `edges`

Aristas `from_id → to_id` con `label` (texto del enlace en sidebar).

### Tabla `crawl_runs`

Trazabilidad de ejecuciones (`started_at`, `finished_at`, contadores).

---

## Tipos de página

| `page_type` | Origen | Scrape |
|-------------|--------|--------|
| `navigation` | Sidebar con hijos | HTTP |
| `leaf_static` | Hoja con HTML en `<main>` | HTTP |
| `leaf_dynamic` | Hoja con JS/placeholder | Playwright |
| `buscador_entry` | Embed/iframe buscador | Playwright |
| `external` | URL fuera del dominio | Solo registro |

---

## Descripciones (`description`)

1. Meta `description` o texto `.cmp-text` del `<main>`.
2. Si no hay: descripción contextual (`"{título} — sección dentro de {padre}..."`).
3. Al visitar la página, la descripción extraída reemplaza la provisional si es más completa.

---

## Contenidos hijos (`child_contents`)

Lista en nodos padre con: `title`, `url`, `page_type`, `content_kind`, `description`.

Recalculado al final de `crawl`, antes de `export`, o con `enrich`.

| `page_type` | `content_kind` |
|-------------|----------------|
| `navigation` | índice de secciones |
| `leaf_static` | contenido estático |
| `leaf_dynamic` | datos interactivos |
| `buscador_entry` | buscador de registros |
| `external` | enlace externo |

---

## Timestamps y re-scrape incremental

| Señal | Fuente | Campo |
|-------|--------|-------|
| Editorial | HTML `Última actualización: DD/MM/YYYY` | `content_updated_at` |
| HTTP | `Last-Modified` | `http_last_modified` |
| HTTP | `ETag` | `http_etag` |
| Calculado | SHA256 body | `html_hash` |
| Crawl | Timestamp local | `scraped_at` |

`--skip-unchanged` evita re-procesar nodos sin cambios (sigue descubriendo URLs nuevas en nav).

---

## Scrape dinámico (Playwright)

- **1 browser Chromium** compartido, **N pestañas** en paralelo (goroutines).
- Extrae: `text`, `tables[]`, `iframe_srcs[]`.
- Escrituras SQLite serializadas con mutex.
- Performance medida: 39 páginas en **~3,5 min** con 5 workers (vs ~17 min secuencial).

Limitación conocida: contenido dentro de **iframes** del buscador aún no se extrae (siguiente iteración).

---

## Formato JSON export

```json
{
  "meta": {
    "scraped_at": "2026-05-30T14:26:26Z",
    "node_count": 510,
    "edge_count": 550
  },
  "nodes": [
    {
      "id": 1,
      "url": "https://transparencia.gob.es/publicidad-activa/por-materias",
      "title": "Publicidad activa por Materias",
      "description": "Elementos de información de Publicidad Activa agrupados en seis materias...",
      "path": "/publicidad-activa/por-materias",
      "depth": 2,
      "page_type": "navigation",
      "parent_id": null,
      "content_updated_at": "2026-01-27T00:00:00Z",
      "http_last_modified": "2026-05-30T03:37:05Z",
      "http_etag": "W/\"6a18c-65300ace03f17\"",
      "scraped_at": "2026-05-30T14:22:43Z",
      "child_contents": [
        {
          "title": "Organización y Empleo Público",
          "url": "https://transparencia.gob.es/publicidad-activa/por-materias/organizacion-empleo",
          "page_type": "navigation",
          "content_kind": "índice de secciones",
          "description": "..."
        }
      ],
      "dynamic_content": null
    }
  ],
  "edges": [
    { "from": 1, "to": 14, "label": "Organización y Empleo Público" }
  ]
}
```

---

## Roadmap técnico

1. **UI** — explorador del grafo consumiendo `graph.json`.
2. **Buscador SSR** — `servicios-buscador/buscar.htm?pag=N` (segunda dimensión del grafo, ~900k registros).
3. **Iframes** — seguir `iframe_srcs` en `buscador_entry`.
4. **Clasificador** — marcar más páginas como `leaf_dynamic` (agenda AACC, retribuciones).
5. **Monitorización (OPP-1b)** — diff periódico por hash/timestamp.

---

## Estructura del código

```
cmd/transparencia/main.go       # CLI Cobra
internal/crawler/               # BFS, fetcher, classifier
internal/dynamic/               # Playwright, extract, worker pool
internal/graph/                 # SQLite, export, child_contents
internal/parser/                # Sidebar AEM, normalize, description, timestamps
internal/models/                # Node, Edge, DynamicContent, ChildContent
```
