# Transparencia Crawler

Crawler en Go que construye localmente el grafo de navegación de **Publicidad Activa** en [transparencia.gob.es](https://transparencia.gob.es/publicidad-activa).

## Problema

El portal de transparencia es un directorio jerárquico difícil de explorar. Este tool descubre automáticamente la estructura de URLs, la persiste en SQLite y exporta JSON para una UI futura.

## Prerrequisitos

- Go 1.23+ (desarrollo local)
- Docker + Docker Compose (recomendado)

## Quick start con Docker

```bash
# Build
docker compose build

# Crawl completo
docker compose run --rm crawler crawl \
  --seed https://transparencia.gob.es/publicidad-activa \
  --db /data/graph.db \
  --rate 3

# Estadísticas
docker compose run --rm crawler stats --db /data/graph.db

# Export JSON (contrato para UI)
docker compose run --rm crawler export \
  --db /data/graph.db \
  --format json \
  --out /data/graph.json
```

Los datos quedan en `./data/graph.db` y `./data/graph.json` en el host.

## Desarrollo local

```bash
go mod download
go test ./...
go run ./cmd/transparencia crawl --db data/graph.db
go run ./cmd/transparencia stats --db data/graph.db
go run ./cmd/transparencia export --db data/graph.db --out data/graph.json
```

## Tecnologías

- Go, Cobra, goquery
- SQLite (`modernc.org/sqlite`, sin CGO)
- Docker multi-stage (Alpine)

## Modelo de datos

| Tabla | Descripción |
|-------|-------------|
| `nodes` | URL, título, **descripción**, profundidad, tipo de página |
| `edges` | Relaciones padre→hijo del árbol |
| `crawl_runs` | Trazabilidad de ejecuciones |

Tipos de página: `navigation`, `leaf_static`, `leaf_dynamic`, `external`, `buscador_entry`.

## Descripciones de nodos

Cada nodo incluye un campo `description` para indexación y contexto en la UI:

1. **Página visitada:** meta `description`, texto introductorio del `<main>` (`.cmp-text`), o párrafos principales.
2. **Nodo descubierto en nav (aún no visitado):** descripción contextual generada (`"{título} — sección dentro de {padre}..."`).
3. Al crawlear la página real, la descripción extraída **reemplaza** la provisional si es más completa.

## Timestamps y re-scrape inteligente

El portal expone **varias señales de cambio**, con distinta cobertura:

| Señal | Disponibilidad | Uso |
|-------|----------------|-----|
| `Last-Modified` (HTTP) | Casi todas las páginas | Fecha técnica de última modificación del recurso |
| `ETag` (HTTP) | Casi todas las páginas | Fingerprint para detectar cambios sin comparar HTML |
| `Última actualización: DD/MM/YYYY` (HTML) | Solo algunas páginas | Fecha editorial visible al ciudadano |
| `html_hash` (SHA256) | Siempre (calculado) | Fallback si headers no cambian pero el body sí |
| `scraped_at` | Siempre (calculado) | Cuándo crawleamos nosotros, no cuándo publicó el portal |

**No hay fecha de publicación original** de forma sistemática en el HTML estático.

Campos guardados en SQLite / JSON export:

- `content_updated_at` — del bloque HTML `div.date`
- `http_last_modified` — header HTTP
- `http_etag` — header HTTP
- `scraped_at` — timestamp del último crawl exitoso

### Skip de páginas sin cambios

Por defecto el crawl usa `--skip-unchanged`: si `ETag`, `Last-Modified` o `html_hash` coinciden con lo guardado, **no re-procesa** el nodo (pero sigue extrayendo links del nav para descubrir URLs nuevas).

```bash
# Re-crawl incremental (rápido)
docker compose run --rm crawler crawl --db /data/graph.db

# Forzar re-scrape completo
docker compose run --rm crawler crawl --db /data/graph.db --force
```

## Formato JSON de export

```json
{
  "meta": { "scraped_at": "...", "node_count": 510, "edge_count": 550 },
  "nodes": [{ "id": 1, "url": "...", "title": "...", "description": "...", "depth": 2, "page_type": "navigation" }],
  "edges": [{ "from": 1, "to": 14, "label": "Retribuciones de altos cargos" }]
}
```

## Roadmap

- Fase 2: scrape del buscador paginado (`servicios-buscador/buscar.htm`)
- Fase 2b: hojas dinámicas con Playwright (Agenda AACC, retribuciones)
- Fase 3: detección de cambios (OPP-1b)
