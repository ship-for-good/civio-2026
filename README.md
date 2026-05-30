# Delfos — Civio Hackathon · Ship for Good 2026

Vault de documentación y código del **equipo Delfos** para el hackathon de Civio (Ship for Good, mayo 2026).

**Docs-first, scaffold-second.** Este repositorio contiene:

- **`packages/`** — scraper de Publicidad Activa del Portal de Transparencia (`data/`) + servidor MCP curado (`mcp-transparencia/`)
- **`vault-context/`** — vault Obsidian con el contexto completo: por qué, qué y cómo
- **`docs/`** — documentación SDD, presentaciones y flujo de trabajo
- **`docker-compose.yml`** — PostgreSQL 16 + contenedor Python para datos

## Quick start

```bash
# 1. Configurar variables locales
cp .env.example .env
# Editar .env si necesitás valores distintos

# 2. Arrancar servicios
docker compose up -d

# 3. Verificar conexión (smoke test)
docker compose exec data python -m pytest tests/smoke/ -v
```

## Servicios

| Servicio | Imagen | Puerto | Propósito |
|----------|--------|--------|-----------|
| `postgres` | `postgres:16` | 5432 | Base de datos local con persistencia en volumen nombrado |
| `data` | `python:3.12-slim` (build) | 8000 | Stack de datos (psycopg, polars, duckdb) + scrapers |

## Paquetes

| Paquete | Ruta | Descripción |
|---------|------|-------------|
| `data` | `packages/data/` | Scraper BFS del Portal de Transparencia (HTTP + selectolax) |
| `mcp-transparencia` | `packages/mcp-transparencia/` | Servidor MCP read-only con schema Postgres y ETL |

## Contexto del proyecto

El vault Obsidian (`vault-context/delfos-context/`) tiene la narrativa completa:

| Documento | Responde |
|-----------|----------|
| `00-por-que.md` | **Por qué** — problema de Civio, política de IA, decisión del equipo |
| `01-que.md` | **Qué** — scraper + base de datos + MCP, alcance y estado real |
| `02-como.md` | **Cómo** — arquitectura, modelo de datos, decisiones técnicas |

## Servidor MCP

El paquete `mcp-transparencia` expone 6 tools read-only para agentes (OpenCode / Claude Code):

- `execute_sql()` — SQL directo en transacción restringida
- `get_page()` — página completa con secciones, acordeones y enlaces
- `search_pages()` — búsqueda full-text en castellano
- `list_organisms()` — resumen por materia
- `get_external_links()` — enlaces salientes por dominio
- `get_links_by_category()` — enlaces por categoría curada

Configurado en `opencode.json` y `.mcp.json`.

## Rollback del scaffold Docker

```bash
docker compose down -v
rm -rf docker-compose.yml .env.example packages/data/
```

El vault de contexto (`vault-context/`) queda intacto.
