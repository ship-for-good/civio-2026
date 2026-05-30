# Demo local — buscador + Cursor

La demo usa un **agente Cursor** que lee [`keywords.json`](./keywords.json) y devuelve el `topicId` según la pregunta. La app rellena textos y enlaces desde el código.

## Requisitos

- Cuenta Cursor **Pro**
- API key en [Dashboard → Integrations](https://cursor.com/dashboard/integrations)

## Configuración

```bash
cd team-rojo
cp env.example .env.local
# Edita .env.local (una línea, sin comillas extra):
# CURSOR_API_KEY=crsr_tu_clave_aqui
npm run cursor:ping   # lee .env.local automáticamente
npm run dev           # Next también lee .env.local
```

**Importante:** el archivo debe llamarse `.env.local` y estar dentro de `team-rojo/`, no en la raíz del monorepo. Ejecuta los comandos desde `team-rojo`.

Abre [http://localhost:3000/es/buscador](http://localhost:3000/es/buscador).

Tras cambiar `keywords.json`, **reinicia** `npm run dev`.

## Guion sugerido (inputs controlados)

| Frase | `topicId` esperado |
|-------|------------------|
| Subvenciones a una asociación cultural | `subvenciones` |
| Cuánto cobra un ministro | `retribuciones` |
| Contratos de limpieza del Ayuntamiento de Madrid | `contratacion` |
| Declaración de bienes de un diputado | `bienes_patrimonio` |
| Cómo solicitar acceso a documentos de un ministerio | `derecho_acceso` |

Usa los chips de ejemplo o escribe estas frases en el buscador.

## Probar la API con curl

```bash
curl -s -X POST http://localhost:3000/api/buscador/classify \
  -H "Content-Type: application/json" \
  -d '{"query":"Cuánto cobra un ministro"}' | jq .
```

## Notas

- Solo funciona con **`npm run dev`** (no en el build estático de GitHub Pages).
- El agente tarda unos segundos; verás «Clasificando con el agente…».
- Si falla, revisa `.env.local` y que `npm run cursor:ping` funcione.
