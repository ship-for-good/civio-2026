# AIna de Transparència — context per a IA (Cursor)

## Producte

Portal ciutadà per **accedir i entendre informació pública** (hackathon Ship for Good × Civio).

- **Nom:** AIna de Transparència
- **Tagline:** La transparència pública, al teu abast. · Pregunta. Descobreix. Entén.
- **Idioma UI:** català
- **Xat:** prototip visual; en enviar mostra missatge local, sense LLM

## Problema (OPP-1a)

Els ciutadans no saben on buscar dades públiques: el portal de transparencia és un agregador d'enllaços, vocabulari tècnic (CPV, etc.) i coneixement tàcit del periodista. Veure `sfg/challenge-discovery.md`.

## Stack

| Capa | Tecnologia |
|------|------------|
| Frontend | React 19, TanStack Router/Start, Tailwind 4, shadcn/ui |
| Build | Vite 7, `@lovable.dev/vite-tanstack-config` |
| Dades | SQLite (`sql.js`), fitxer `data/aina.db` |
| API | `createServerFn` — `src/lib/api/aina.functions.ts` |
| Client data | TanStack Query — `src/hooks/use-aina-queries.ts` |

## Endpoints (server functions)

| Funció | Dades |
|--------|--------|
| `getHealth` | estat DB |
| `getExampleQuestions` | placeholder del xat |
| `getTopics` | Temes populars |
| `getFeatured` | Potser t'has perdut això |
| `getNearby` | Taula + mapa a prop |

Fallback estàtic: `src/data/fallback.ts` si la DB no està disponible.

## Prompt semilla (enganxa al iniciar sessió)

```
Estic al projecte AIna de Transparència (rama team-aina).
Stack: React + TanStack Start + Tailwind + SQLite (sql.js).
UI en català. El xat és prototip sense IA real.
Llegeix docs/AI_CONTEXT.md i sfg/challenge-discovery.md abans de canvis grans.
Components a src/components/aina/. No migrar a Vue.
```

## Política IA Civio

Permès: assistència a programació, consultes sobre dades pròpies del projecte.
Vetat: generació de text periodístic, documents legals, imatges per comunicació externa.
