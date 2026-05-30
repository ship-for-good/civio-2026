# Transparencia Assistant · Team Naranja

Asistente conversacional que ayuda a ciudadanos a encontrar información pública en el ecosistema de transparencia española, o a iniciar una solicitud de acceso cuando no está publicada.

**Demo:** _[URL Lovable — completar tras Publish]_

---

## Problema

El portal de transparencia funciona como un directorio de enlaces sin curación. Los ciudadanos no saben qué información existe, dónde buscarla ni cómo solicitarla si no está publicada.

## Solución

Un asistente alimentado por un catálogo (`catalog.json`) que clasifica temas del portal de transparencia y responde con informes estructurados o guía de solicitud.

---

## Prerequisites

- Cuenta [Lovable](https://lovable.dev) con token Pro del hackathon
- Proyecto Supabase (creado desde Lovable → Integrations)
- Node.js 18+ (solo si desarrollo local fuera de Lovable)

---

## Setup · Lovable

1. Crear proyecto en Lovable: **Transparencia Assistant**
2. Conectar Supabase + GitHub (rama `team-naranja`)
3. Importar/sync archivos de `src/`, `supabase/`
4. Desplegar Edge Function `ask`
5. Configurar secrets en Supabase (opcional): `OPENAI_API_KEY`
6. **Publish** en Lovable → copiar URL demo

Ver prompts detallados en [prompts/lovable-ui.md](./prompts/lovable-ui.md).

---

## Variables de entorno

Ver [.env.example](./.env.example). Nombres:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_USE_MOCK`
- `OPENAI_API_KEY` (Supabase secret, opcional)

---

## Estructura

```
team-naranja/
├── catalog.json             ← fuente de verdad
├── src/
│   ├── data/catalog.json
│   ├── components/          ← UI chat + cards
│   ├── hooks/useAskAssistant.ts
│   ├── types/
│   └── pages/Index.tsx
├── supabase/functions/ask/  ← Edge Function
├── prompts/                 ← prompts Lovable + LLM
├── demo-questions.md        ← tests manuales
└── plan-mvp-equipo.md       ← plan del equipo
```

---

## Sincronizar catálogo

Tras editar `catalog.json` en `team-naranja/`:

```bash
cd team-naranja
chmod +x scripts/sync-catalog.sh
./scripts/sync-catalog.sh
```

Redesplegar Edge Function en Supabase.

---

## Probar

```bash
# Edge Function
curl -X POST 'https://<PROJECT>.supabase.co/functions/v1/ask' \
  -H 'Authorization: Bearer <ANON_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"query":"¿Cuánto cobran los ministros?"}'
```

Ver [demo-questions.md](./demo-questions.md) para casos completos.

---

## Tecnologías

- **UI:** React, Tailwind, shadcn (Lovable)
- **Backend:** Supabase Edge Functions (Deno/TypeScript)
- **Datos:** JSON estático (`catalog.json`)
- **LLM:** OpenAI (opcional, enriquece texto)

---

## Equipo

Team Naranja · Ship for Good 2026 · Civio

---

## Roadmap

1. Discovery automatizado de más portales
2. Monitorización de cambios en catálogo
3. Integración con flujo de solicitudes Civio
4. Análisis sobre datasets descargados

Ver [plan-mvp-equipo.md](./plan-mvp-equipo.md).
