# ¿Dónde Está? — Buscador de Información Pública

**Date:** 2026-05-30 · **Team:** Red · **Challenge:** Civio OPP-1a (acceso y descubrimiento de información pública)

## Problem (README version)

Citizens and journalists who want public information in Spain face an invisible maze: the
transparency portal is mostly a directory of links, each real portal uses different technical
vocabulary (CPV codes, tipos de contrato), and the knowledge of *which portal to use for what*
lives only in the heads of experts like Civio. This tool externalizes that tacit knowledge:
type a question in plain Spanish, get told the right portal and exactly how to search it.

## Why this challenge

- Highest team-fit: it's a UX/knowledge problem, not a backend/cert-auth problem. (OPP-2, the request-tracking challenge, is owned by another team — we don't touch it.)
- The moat is Civio's tacit knowledge, not the framework — see the routing table below.
- Civio's AI policy explicitly *permits* this use (classification / routing / data normalization);
  it forbids generating journalistic or legal text, which we never do.

## User flow

```
[Landing] big search input + 5 example query chips
   ↓ user types a question in plain Spanish
[AI classify] ~1–2s skeleton
   ↓
[Result card]
  ├─ Portal identificado   (badge: name + logo + URL)
  ├─ Por qué aquí          (2–3 plain-Spanish sentences)
  ├─ Cómo buscarlo         (3–5 numbered steps)
  ├─ [→ Ir al portal]      (deep link, pre-filled params where possible)  ← the wow moment
  └─ ¿No es esto?          (retry / try another query)
```

## The moat — portal routing knowledge

This table is the product. Encode it as a typed constant in `lib/portals.ts` AND in the
classifier system prompt so the model cannot invent a wrong portal.

| Tipo de información            | Portal real                  | ¿En el portal de transparencia? |
| ------------------------------ | ---------------------------- | ------------------------------- |
| Contratos, licitaciones, obras | PLACE (contrataciondelestado)| ✗ |
| Subvenciones, ayudas           | BDNS / SNPSAP                | ✗ |
| Retribuciones de altos cargos  | Portal de Transparencia      | ✓ (único caso que sí aloja) |
| Declaraciones de bienes        | BOE                          | ✗ (el portal solo linkea) |
| Información medioambiental      | Email / formulario especial  | ✗ |
| (no encaja)                    | UNKNOWN → guía genérica      | — |

**CRITICAL FIRST TASK:** validate this table and the deep-link URLs against the live portals.
The demo lives or dies on "Ir al portal" actually opening the right place with the search
pre-filled. Verify the real query-param structure for at least PLACE before building UI around
it. If deep-linking proves impossible for a portal, degrade gracefully to step-by-step guidance.

## Architecture

**IDE / agent:** the team builds with **AI**. Treat the spec + plan in this repo as the source of truth the team's AI tools work from.

**Stack:** team's choice. Two viable paths, both fine — the spec value (knowledge base + flow +
classify contract) is stack-agnostic.
- **Next.js + Vercel** — `/api/classify` route hides the key; reuse fonts/tokens/motion from
  `ship-for-good-web` for brand consistency.
- **Lovable** — fastest to a live demo; Supabase edge function hides the key.

Recommended: spike fast to get the full flow on screen early, then harden. One flow working
end-to-end ASAP beats perfect architecture before 19:00.

**AI layer:** single classify endpoint, key server-side, fast cheap model (e.g. claude-haiku-4-5
or gpt-4o-mini). Structured JSON output:

```ts
type Classification = {
  portal: "PLACE" | "BDNS" | "TRANSPARENCIA" | "BOE" | "MEDIOAMBIENTAL" | "UNKNOWN";
  portalName: string;
  portalUrl: string;
  explanation: string;   // 2–3 sentences, plain Spanish
  steps: string[];       // 3–5 plain-language steps
  deepLink?: string;     // pre-filled search URL when possible
  searchTip?: string;    // e.g. "CPV 90910000 para limpieza"
};
```

The system prompt embeds the routing table and forbids inventing portals outside the enum.

## Engineering practices (DDD / TDD / BDD)

These are deliberately chosen and reinforce the integration-readiness goal above: a clean domain
with a stable contract is exactly what lets another team build on us.

**DDD (Domain-Driven Design) — the domain is the moat.**
- The ubiquitous language is the public-info domain itself: *Portal, Solicitud, Publicidad activa,
  Derecho de acceso, Expediente, CPV*. Use these names in code, not generic ones (`item`, `data`).
- The domain model lives in `lib/` and is **framework-free** — pure TypeScript, no React, no
  Next imports. `lib/portals.ts` (the routing knowledge) and `lib/types.ts` (`Classification`)
  are the domain core. UI and the API route are adapters around it.
- `Classification` is the published-language contract at our boundary — keep it pure data so the
  OPP-2 team (or anyone) can consume it.

**BDD (Behaviour-Driven Development) — describe behaviour in the domain language.**
- Write scenarios as Given/When/Then, in plain Spanish, anchored to real citizen questions:
  ```
  Dado que un ciudadano pregunta "contratos de limpieza del Ayuntamiento de Madrid"
  Cuando el sistema clasifica la consulta
  Entonces el portal identificado es PLACE
  Y se ofrece un enlace que abre la búsqueda ya rellenada
  ```
- These scenarios double as our **demo script** and our acceptance tests — write them WITH the
  Civio person so the behaviour reflects real journalism workflows, not our assumptions.

**TDD (Test-Driven Development) — red/green per unit.**
- Start with the pure domain (`lib/portals.ts` deep-link builders, classification mapping): fast,
  deterministic unit tests, no network. This is where TDD pays off most.
- The LLM call itself isn't unit-tested (non-deterministic) — test the deterministic mapping
  around it (parse → enum → portal metadata → deep link) by feeding it stub classifier output.
- The implementation plan already follows red→green→commit per task; keep that rhythm.

## Prep for the Civio conversation

We will sit down with the Civio person for a focused session. Their tacit knowledge is the moat —
this is the highest-leverage input we get, so come prepared and time-box it. Goals: validate the
routing table, lock the deep links, and source real demo queries.

**Bring to the table:**
- The routing table (above) printed/visible, ready to mark up live.
- A laptop on the live portals so we can verify deep links together in real time.
- The `Classification` shape, to confirm the fields we expose match how they think.

**Questions to ask (prioritised — get through the 🔴 ones even if time runs short):**
- 🔴 **Validate the moat table.** "Is this mapping correct? What's wrong, what's missing? Are
  there exceptions beyond *retribuciones* living in the transparency portal?"
- 🔴 **Deep links.** "For PLACE / BDNS / BOE — can a search be reached by URL with parameters
  pre-filled? Do you have an example URL? Which portals are hopeless for deep-linking?"
- 🔴 **Demo queries.** "What's a real question a citizen or journalist asked you that perfectly
  shows the wrong-portal problem?" (e.g. the Barcelona school-construction contracts.)
- 🟠 **Vocabulary traps.** "Which technical terms block ordinary people most — CPV, tipos de
  contrato (servicio/suministro/menor), órgano de contratación? What should we translate?"
- 🟠 **Boundary with OPP-2.** "When does 'find it' become 'request it'? What signals that info
  isn't proactively published and a *derecho de acceso* is the next step?"
- 🟢 **Edge / failure cases.** "What does our tool get dangerously wrong if it guesses? Where
  would a confident-but-wrong portal suggestion actively mislead someone?"

Capture answers directly into this spec (update the routing table, add verified deep links, paste
the demo queries) — **this document feeds a more refined plan after the conversation.**

## Components

- `SearchInput` + `QueryChips` (example queries that show the wrong-portal problem)
- `useClassify` hook → calls classify endpoint, handles loading/error
- `ResultCard` → `PortalBadge`, `StepGuide`, `GoToPortalButton`, retry
- `lib/portals.ts` → typed routing table + deep-link builders

## Team split (everyone owns real product, not just chrome)

- **Kickoff together (~30 min):** whole team walks the moat — the wrong-portal problem and a
  real citizen anecdote (e.g. the Barcelona school-construction contracts). Shared mental model
  before splitting. Use discovery doc + live portals to build context.
- **Backend ownership:** classify endpoint + `useClassify` + key handling
- **Input/discovery ownership:** `SearchInput`, `QueryChips`, demo query content
- **Result/integration ownership:** `ResultCard` + `GoToPortalButton` + deep-link wiring (owns the wow moment)
- **`lib/portals.ts`:** built collaboratively — each team member verifies the deep links for their portals
- **Design:** visual system + rapid critique loops on whatever's on screen
- **Coordination:** sync, integration checkpoints, demo script (built with team input)

## Timeline to 19:00

```
now → +1h    setup + kickoff + verify PLACE deep link + scaffold/spike
+1h → +4h    core build, parallel; integrate as early as possible
+4h → +5h    first full end-to-end working demo
+5h → 18:00  polish: example queries, edge cases, mobile, UNKNOWN fallback
18:00–18:30  README + submission
18:30–19:00  buffer + demo rehearsal (3-min flow, live "Ir al portal")
```

## Integration-readiness with the OPP-2 team (cherry on top — comes for free with good practices)

**We don't build the integration. We just don't make it impossible.** Our tool answers *"where
is this public info?"*; when info isn't published, the next step is a *derecho de acceso* request
— the OPP-2 team's domain. The two compose into one citizen journey:

```
[¿Dónde Está?]  →  info published?  ──yes──→  Ir al portal (deep link)
                                    ──no───→  [OPP-2 tool] solicitar acceso + seguimiento
```

The key insight: **if we follow good practices from the start, the connection is almost free —
all we need to expose is the result, and they take it from there.** Concretely:

- **The `Classification` object IS the integration contract.** It's already a clean, typed,
  serializable result (see Architecture). Keep it pure data — no UI concerns leaking in, no
  fields that only make sense inside our app. Anyone who can read that JSON can build on top of us.
- **Keep the result reachable, not buried in component state.** The classify endpoint already
  returns it as JSON over HTTP — that's the seam. Don't entangle the result so tightly with our
  rendering that it can't be handed off. The hook holds it; the API exposes it.
- **Stable shape > extra features.** Don't rename or reshape `Classification` fields late in the
  day. A stable contract is what makes their side trivial.

That's all. If both tools are working at the end, hooking their app to consume our result becomes
a small CTA, not a project. Pursue the actual hook-up only once our own flow is solid and
demo-ready — but the discipline above costs nothing and keeps the door open. A joint find→request
demo would land strongly with the jury; the readiness is the cherry, never at the cost of our
core flow by 19:00.

## Out of scope (YAGNI for today)

- **OPP-2 request tracking — owned by another team.** Don't build it. If our flow hits a case
  where the info isn't published and the user must file a *derecho de acceso* request, point
  them toward that (the other team's tool / pideinfo.es) rather than handling it ourselves.
- OPP-1b change detection
- Autonomic/local portals beyond national — national only
- Accounts, persistence, history

## Success criteria

- A citizen types a plain-Spanish question and reaches the correct portal.
- "Ir al portal" opens the real portal, ideally with the search pre-filled — live, in the demo.
- Routing is correct for the demo queries (verified against the moat table).
- Deployed and running (not a mockup) by 19:00.

## Useful skills / agents

The team builds in Cursor, but these skills/agents (available in the Claude Code environment)
support the workflow. Critical path: **writing-plans** (after Civio talk) → **TDD** for the domain
→ **subagent-driven-development** to execute → **verification-before-completion** before submission,
with **frontend-design** running alongside for the UI.

**Core (project critical path):**
- `superpowers:writing-plans` — regenerate the refined plan after the Civio conversation.
- `superpowers:test-driven-development` — red→green→commit on `lib/portals.ts` + classification mapping.
- `superpowers:subagent-driven-development` — execute the plan task-by-task, fresh subagent per task.
- `superpowers:executing-plans` — alternative: inline batch execution with checkpoints (pick one).
- `frontend-design` — distinctive search UI / result card; pair with the designer.

**Supporting / situational:**
- `superpowers:verification-before-completion` — prove the demo works before 19:00 (run it, don't assume).
- `code-review` / `superpowers:requesting-code-review` — quick pass before submission if time allows.
- `Explore` (agent) — fast read-only sweep of `ship-for-good-web` for reusable components/tokens.
- `feature-dev:code-explorer` (agent) — map existing codebase patterns if we extend it.
- `claude-api` (skill) — proper Anthropic SDK setup + caching if classify uses Claude.
- `context7` (MCP) — live Next.js 15 / Tailwind v4 / Anthropic SDK docs while building.
- `playwright` (MCP) — verify "Ir al portal" deep links actually open the right portal, live.

**Skip today:** `brainstorming` (done), `using-git-worktrees` (overkill for one-day team branch),
`systematic-debugging` (only if something breaks).

## Reference links

> **AGENT: read this first.** Owner's raw discovery notes (Spanish) live at
> `/home/catsb/Documents/CIVIO.txt` — read them in full before working on this spec. They contain
> the unfiltered context behind the moat: pain points, Ley 19/2013 (publicidad activa vs. derecho
> de acceso), who/what/when of requests, the Consejo de Transparencia, the 1→21 redistribution
> case, and María's core pain (fragmentation + inaccessibility for ordinary citizens). The spec
> distils these notes; when in doubt, the notes are the ground truth.

**Civio (challenge owner):**
- https://civio.es/ — organización contra la opacidad; periodismo de datos
- https://civio.es/curso-newsletter-derecho-de-acceso/ — curso gratuito de derecho de acceso (onboarding existente)

**Portals — the moat (verify deep links against these):**
- https://contrataciondelestado.es/ — Plataforma de Contratación del Sector Público (PLACE, contratos)
  - Detalle de ejemplo: https://contrataciondelestado.es/wps/portal/plataforma/buscadores/detalle/!ut/p/z1/hVDLcoJAEPwajmGHBVbMDXkTjRgeyl6oJUGkilctxO_PYjyaOLee6e7pGUTRCdGeXZuazc3Qs1bgnJJCc_aW5foYjFi1AW_tNCX-AjHK0PEZhYox_FEmCD29UXTV0rIwi0gceACB79rbVNHBw-RO-McjFxlWhZk5BzNYq7DffIgMYbRLIg8rAASl_cA7cU-8eDVfzrVFOQYdE8C6hu96z4NA2XigKW_vNpBo5YTOIVlWPNOHiNbtUP4-zOxL1agR5dW54hWXv7loX-Z5nF4lkGDmrJ9Gxqv-s2FyPZRyNUnwSHgZphmdHvHR2Lnr4CXvil1y7o7G9APz2bpZ/dz/d5/L2dBISEvZ0FBIS9nQSEh/
- https://transparencia.gob.es/inicio — Portal de Transparencia nacional (retribuciones de altos cargos)
- https://datos.gob.es/es/ — catálogo de datos abiertos del Estado
- https://superboe.es/ — buscador mejorado del BOE (referencia de UX para info del BOE)

**Related tools / prior art (derecho de acceso — OPP-2, owned by another team; useful as a handoff target):**
- https://pideinfo.es/ — gestiona solicitudes de acceso, plazos y reclamaciones
- https://github.com/Naroh091/PideInfo — código fuente de PideInfo

**Government announcement:**
- https://digital.gob.es/comunicacion/notas-prensa/secretaria-estado-funcion-publica/2026/05/el-gobierno-presenta-el-nuevo-portal-de-la-transparencia--basado — nuevo Portal de la Transparencia (vigilar cambios que afecten al routing)
