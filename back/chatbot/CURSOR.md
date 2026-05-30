# CURSOR.md — Módulo Chatbot / Query Layer
# Transparencia Navigator — Civio Hackathon 2026

## Qué es este módulo

Backend en Go que expone un endpoint `/chat`. Recibe una pregunta en lenguaje natural,
busca en el grafo de transparencia.gob.es, y devuelve una respuesta estructurada
indicando si la información existe y cómo llegar a ella.

Este módulo NO hace scraping. Lee el JSON del grafo producido por el scraper (Go, repo hermano).

---

## Stack

- **Lenguaje:** Go 1.22+
- **Framework HTTP:** net/http estándar (sin frameworks externos)
- **LLM:** Gemini Flash via Google AI API (API key en variable de entorno)
- **Datos:** JSON del grafo cargado en memoria al arrancar
- **Autenticación:** ninguna en v0 (localhost only)

---

## Fuente de datos — JSON del grafo

El grafo se carga una vez al arrancar desde `graph.json` (path configurable via env var `GRAPH_PATH`).
Se asume que el fichero siempre está actualizado — no hay watcher ni reload automático en v0.

### Tipos Go exactos del JSON

```go
type GraphExport struct {
    Meta  ExportMeta   `json:"meta"`
    Nodes []ExportNode `json:"nodes"`
    Edges []ExportEdge `json:"edges"`
}

type ExportMeta struct {
    ScrapedAt string `json:"scraped_at"`
    NodeCount int    `json:"node_count"`
    EdgeCount int    `json:"edge_count"`
}

type ExportNode struct {
    ID              int64          `json:"id"`
    URL             string         `json:"url"`
    Title           string         `json:"title"`
    Description     string         `json:"description"`
    Path            string         `json:"path"`
    Depth           int            `json:"depth"`
    PageType        string         `json:"page_type"`   // "navigation" | "leaf_static"
    ParentID        *int64         `json:"parent_id"`   // null en nodos raíz
    ChildContents   []ChildContent `json:"child_contents,omitempty"`
    ScrapedAt       string         `json:"scraped_at,omitempty"`
    HTTPLastModified string        `json:"http_last_modified,omitempty"`
    HTTPEtag        string         `json:"http_etag,omitempty"`
}

type ChildContent struct {
    Title       string `json:"title"`
    URL         string `json:"url"`
    PageType    string `json:"page_type"`
    ContentKind string `json:"content_kind"`
    Description string `json:"description"`
}

type ExportEdge struct {
    From  int64  `json:"from"`
    To    int64  `json:"to"`
    Label string `json:"label"`
}
```

---

## Lógica de búsqueda — SIN base de datos, TODO en memoria

Al arrancar, el servidor construye dos índices en memoria desde el JSON:

```go
// Acceso rápido por ID
nodeByID map[int64]*ExportNode

// Índice de búsqueda: cada nodo genera tokens de title + description + child_contents[].title + child_contents[].description
searchIndex []SearchEntry  // slice ordenable por score
```

### Algoritmo de búsqueda

1. Gemini Flash extrae 2-4 keywords de la pregunta del usuario
2. Se busca en `searchIndex` por coincidencia en `title`, `description` y `child_contents`
3. Se devuelven los top-3 resultados por score (número de matches)
4. Para cada resultado, se reconstruye el path hasta la raíz

### Reconstrucción del path (breadcrumb)

```
nodo encontrado
    → busca parent_id en nodeByID
        → busca su parent_id
            → ... hasta parent_id == null
→ devuelve []PathStep{title, url} ordenado raíz → hoja
```

---

## Caso "no encontrado"

Cuando la búsqueda no devuelve resultados:
- Se busca el nodo del formulario de derecho de acceso
  (title contiene "derecho de acceso" o URL contiene "derecho-acceso")
- Se reconstruye su path igual que en el caso positivo
- La respuesta indica `found: false` y proporciona la ruta al formulario

---

## API — único endpoint

### `POST /chat`

**Request:**
```json
{
  "question": "¿Dónde puedo ver las retribuciones de los altos cargos?"
}
```

**Response — encontrado:**
```json
{
  "found": true,
  "message": "Sí, esa información está disponible en el Portal de Transparencia.",
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

**Response — no encontrado:**
```json
{
  "found": false,
  "message": "Esa información no está publicada directamente. Puedes solicitarla mediante el derecho de acceso.",
  "url": "https://transparencia.gob.es/derecho-acceso/solicite-informacion-publica",
  "path": [
    { "title": "Derecho de acceso", "url": "https://transparencia.gob.es/derecho-acceso" },
    { "title": "Solicite información", "url": "https://transparencia.gob.es/derecho-acceso/solicite-informacion-publica" }
  ],
  "matched_node": null
}
```

**Errores:**
```json
{ "error": "mensaje descriptivo" }
```
HTTP 400 para input inválido, 500 para errores internos.

---

## Integración con Gemini Flash

### Variables de entorno requeridas

```
GEMINI_API_KEY=tu_api_key
GRAPH_PATH=./graph.json        # path al JSON del grafo
PORT=8080                      # opcional, default 8080
```

### Prompt a Gemini

El LLM tiene DOS responsabilidades:

1. **Extracción de keywords** — recibe la pregunta y devuelve 2-4 términos de búsqueda
2. **Generación de mensaje** — recibe los resultados y genera la respuesta en lenguaje natural

El módulo NO delega la búsqueda al LLM. El LLM solo procesa lenguaje. La búsqueda
la hace el código Go sobre el índice en memoria. Esto garantiza que las respuestas
sean deterministas y trazables.

### Ejemplo de prompt para extracción de keywords

```
Eres un asistente que ayuda a encontrar información en el Portal de Transparencia español.
Dada la siguiente pregunta de un ciudadano, extrae entre 2 y 4 palabras clave
para buscar en el índice del portal. Devuelve SOLO las palabras separadas por comas,
sin explicaciones.

Pregunta: "{{question}}"
Keywords:
```

---

## Estructura de ficheros de este módulo

```
chatbot/
├── main.go                  ← servidor HTTP, carga del grafo, rutas
├── graph/
│   ├── types.go             ← ExportNode, ChildContent, GraphExport, etc.
│   ├── loader.go            ← carga y parsea graph.json
│   ├── index.go             ← construye índice en memoria
│   └── search.go            ← búsqueda por keywords + reconstrucción de path
├── llm/
│   └── gemini.go            ← cliente Gemini Flash (keywords + mensaje final)
├── handlers/
│   └── chat.go              ← handler POST /chat
└── CURSOR.md                ← este fichero
```

---

## Invariantes — Cursor NO debe violar estos puntos

- **No usar base de datos.** Todo en memoria desde el JSON.
- **No delegar la búsqueda al LLM.** El LLM extrae keywords y genera texto, nada más.
- **El path siempre se reconstruye desde el grafo**, nunca lo genera el LLM.
- **No modificar el JSON del grafo.** Este módulo es read-only.
- **CORS habilitado** — el front estará en un origen distinto.
- **El endpoint devuelve siempre JSON**, nunca HTML ni texto plano.
- **Sin autenticación en v0** — el servidor escucha solo en localhost.

---

## Lo que NO hace este módulo (out of scope v0)

- Historial de conversación (cada `/chat` es stateless)
- Autenticación o rate limiting
- Búsqueda en la base de datos SQLite del scraper
- Recargar el grafo en caliente sin reiniciar el servidor
- Soporte multi-idioma
- Más de un portal (solo transparencia.gob.es en v0)

---

## Orden de implementación recomendado

1. `graph/types.go` — tipos Go del JSON
2. `graph/loader.go` — carga el JSON, construye `nodeByID`
3. `graph/index.go` — construye `searchIndex` desde los nodos
4. `graph/search.go` — búsqueda por keywords + `buildPath(nodeID)`
5. `llm/gemini.go` — cliente Gemini (keywords + mensaje)
6. `handlers/chat.go` — orquesta búsqueda + LLM + respuesta
7. `main.go` — servidor, rutas, CORS, env vars
