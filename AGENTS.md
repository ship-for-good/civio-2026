# AGENTS.md — Delfos · Ship for Good 2026

## Descripción del proyecto

Proyecto del **equipo Delfos** en el hackathon Ship for Good para [Civio](https://civio.es).

Construimos un **pipeline de datos del Portal de Transparencia**: scraper BFS → Postgres → servidor MCP. Convierte un agregador de enlaces opaco en un corpus estructurado y consultable por agentes de IA.

## Componentes

| Paquete | Ruta | Stack |
|---|---|---|
| Scraper | `packages/data/scrapers/transparencia/` | Python 3.12, httpx, selectolax, Polars |
| MCP server | `packages/mcp-transparencia/` | Python 3.12, FastMCP, psycopg |
| Docker | `docker-compose.yml` | Postgres 16 + Python 3.12 |

## Contexto del proyecto

`vault-context/delfos-context/` tiene la narrativa completa en tres documentos:

| Documento | Responde |
|---|---|
| `00-por-que.md` | **Por qué** — problema de Civio, política de IA, decisión del equipo |
| `01-que.md` | **Qué** — scraper + base de datos + MCP, alcance y estado real |
| `02-como.md` | **Cómo** — arquitectura, modelo de datos, decisiones técnicas |

Material histórico en `archivo/`, fuentes read-only en `fuentes/`.

## Servidor MCP

Registrado en `opencode.json` y `.mcp.json` como `transparencia`. Tools:

- `execute_sql(query, limit)` — SQL read-only en transacción restringida
- `get_page(url)` — página + secciones + acordeones + enlaces clasificados
- `search_pages(query, limit)` — búsqueda full-text (spanish)
- `list_organisms()` — resumen por materia
- `get_external_links(domain, limit)` — enlaces salientes por host
- `get_links_by_category(category, materia_slug, limit)` — enlaces por categoría

## Convenciones

- **Idioma**: Español
- **Commits**: Conventional Commits en español (`feat:`, `fix:`, `refactor:`, `chore:`)
- **Git**: feature branches desde `main`, PR a `main`
