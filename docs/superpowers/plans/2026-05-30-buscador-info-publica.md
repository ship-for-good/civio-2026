# ¿Dónde Está? Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** A web app where a citizen types a plain-Spanish question and gets routed to the correct Spanish public-info portal with a working pre-filled deep link and step-by-step guidance.

**Architecture:** Next.js App Router. A pure `lib/portals.ts` encodes Civio's tacit routing knowledge + deep-link builders. A serverless `/api/classify` route calls an LLM (key server-side) to map the question to a portal enum + explanation + steps. Client renders search → result card. The deep link is the demo's wow moment.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind v4, Vitest, Anthropic SDK (or OpenAI), Vercel.

---

## File Structure

- `lib/portals.ts` — typed routing table + deep-link builder functions (pure, tested)
- `lib/portals.test.ts` — unit tests for deep-link builders
- `lib/classify-prompt.ts` — system prompt embedding the routing table
- `app/api/classify/route.ts` — serverless classify endpoint
- `lib/types.ts` — `Classification` type (shared client/server)
- `hooks/use-classify.ts` — client hook, loading/error states
- `components/search-input.tsx` — input + submit
- `components/query-chips.tsx` — example queries
- `components/result-card.tsx` — composes badge + steps + button
- `components/portal-badge.tsx`, `components/step-guide.tsx`, `components/go-to-portal-button.tsx`
- `app/page.tsx` — assembly + state machine (idle → loading → result/error)

---

### Task 0: Scaffold + deploy skeleton

**Files:** Create project root.

- [ ] **Step 1: Create the app**
```bash
npx create-next-app@latest dondeesta --typescript --tailwind --app --no-src-dir --eslint
cd dondeesta
npm i @anthropic-ai/sdk
npm i -D vitest
```

- [ ] **Step 2: Add test script** to `package.json` scripts:
```json
"test": "vitest run"
```

- [ ] **Step 3: Deploy empty app to Vercel** (proves the pipeline before building)
```bash
npx vercel --yes
```
Expected: a live URL serving the default Next page.

- [ ] **Step 4: Commit**
```bash
git add -A && git commit -m "chore: scaffold next app + vercel deploy"
```

---

### Task 1: Knowledge base + deep-link builders (THE MOAT — do first)

**Files:**
- Create: `lib/types.ts`, `lib/portals.ts`, `lib/portals.test.ts`

- [ ] **Step 1: Define the shared type** in `lib/types.ts`
```ts
export type PortalId = "PLACE" | "BDNS" | "TRANSPARENCIA" | "BOE" | "MEDIOAMBIENTAL" | "UNKNOWN";

export type Classification = {
  portal: PortalId;
  portalName: string;
  portalUrl: string;
  explanation: string;
  steps: string[];
  deepLink?: string;
  searchTip?: string;
};
```

- [ ] **Step 2: Write the failing test** in `lib/portals.test.ts`
```ts
import { describe, it, expect } from "vitest";
import { buildPlaceDeepLink, PORTALS } from "./portals";

describe("PORTALS table", () => {
  it("has an entry for every portal id", () => {
    expect(PORTALS.PLACE.portalName).toMatch(/Contrataci/i);
    expect(PORTALS.TRANSPARENCIA).toBeDefined();
  });
});

describe("buildPlaceDeepLink", () => {
  it("encodes the search text into the query string", () => {
    const url = buildPlaceDeepLink("limpieza ayuntamiento madrid");
    expect(url).toContain("limpieza");
    expect(url.startsWith("https://")).toBe(true);
  });
});
```

- [ ] **Step 3: Run test, verify it fails**
Run: `npm test`
Expected: FAIL — `portals.ts` has no exports.

- [ ] **Step 4: Implement `lib/portals.ts`**
> NOTE: The exact PLACE query-param structure MUST be verified against the live portal
> (contrataciondelestado.es búsqueda avanzada) before relying on it in the demo. The builder
> below is the agreed shape; adjust the param name once verified. If a real deep link is not
> achievable, return the portal search page URL and rely on `steps`.
```ts
import type { PortalId } from "./types";

export const PORTALS: Record<PortalId, { portalName: string; portalUrl: string }> = {
  PLACE:          { portalName: "Plataforma de Contratación del Sector Público", portalUrl: "https://contrataciondelestado.es" },
  BDNS:           { portalName: "Base de Datos Nacional de Subvenciones", portalUrl: "https://www.pap.hacienda.gob.es/bdnstrans/" },
  TRANSPARENCIA:  { portalName: "Portal de Transparencia", portalUrl: "https://transparencia.gob.es" },
  BOE:            { portalName: "Boletín Oficial del Estado", portalUrl: "https://www.boe.es" },
  MEDIOAMBIENTAL: { portalName: "Información Medioambiental (solicitud por email/formulario)", portalUrl: "https://www.miteco.gob.es" },
  UNKNOWN:        { portalName: "No identificado", portalUrl: "https://transparencia.gob.es" },
};

// TODO-VERIFY: confirm param against live PLACE advanced search before demo.
export function buildPlaceDeepLink(query: string): string {
  const q = encodeURIComponent(query.trim());
  return `https://contrataciondelestado.es/wps/portal/plataforma?text=${q}`;
}
```

- [ ] **Step 5: Run test, verify it passes**
Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**
```bash
git add lib/types.ts lib/portals.ts lib/portals.test.ts
git commit -m "feat: portal knowledge base + place deep-link builder"
```

---

### Task 2: Classify system prompt

**Files:** Create `lib/classify-prompt.ts`

- [ ] **Step 1: Write the prompt** embedding the routing table and forbidding invented portals
```ts
export const SYSTEM_PROMPT = `Eres un enrutador de información pública española. Dada la pregunta de un ciudadano, identifica EN QUÉ PORTAL OFICIAL está esa información. Reglas no negociables:

- Contratos, licitaciones, obras públicas → PLACE
- Subvenciones, ayudas públicas → BDNS
- Retribuciones de altos cargos → TRANSPARENCIA (único caso que aloja el dato)
- Declaraciones de bienes de cargos → BOE (el portal de transparencia solo enlaza)
- Información medioambiental → MEDIOAMBIENTAL
- Si no encaja → UNKNOWN

NUNCA inventes un portal fuera de esa lista. NO redactes textos periodísticos ni legales.
Responde SOLO con JSON válido con esta forma:
{"portal": "...", "explanation": "2-3 frases en español llano de por qué la info está ahí",
 "steps": ["paso 1", "paso 2", "paso 3"], "searchTip": "consejo opcional, p.ej. código CPV"}`;
```

- [ ] **Step 2: Commit**
```bash
git add lib/classify-prompt.ts && git commit -m "feat: classifier system prompt with routing table"
```

---

### Task 3: Classify API route

**Files:** Create `app/api/classify/route.ts`

- [ ] **Step 1: Implement the route** (key from `process.env.ANTHROPIC_API_KEY`)
```ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "@/lib/classify-prompt";
import { PORTALS, buildPlaceDeepLink } from "@/lib/portals";
import type { Classification, PortalId } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "missing query" }, { status: 400 });
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: query }],
  });
  const text = msg.content.find((c) => c.type === "text")?.text ?? "{}";
  const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
  const portal = (parsed.portal ?? "UNKNOWN") as PortalId;
  const meta = PORTALS[portal] ?? PORTALS.UNKNOWN;

  const result: Classification = {
    portal,
    portalName: meta.portalName,
    portalUrl: meta.portalUrl,
    explanation: parsed.explanation ?? "",
    steps: parsed.steps ?? [],
    searchTip: parsed.searchTip,
    deepLink: portal === "PLACE" ? buildPlaceDeepLink(query) : undefined,
  };
  return NextResponse.json(result);
}
```

- [ ] **Step 2: Add env var** to `.env.local` (names only in README):
```
ANTHROPIC_API_KEY=sk-ant-...
```

- [ ] **Step 3: Manual smoke test**
Run: `npm run dev`, then:
```bash
curl -s localhost:3000/api/classify -X POST -H 'content-type: application/json' \
  -d '{"query":"contratos de limpieza del ayuntamiento de madrid"}'
```
Expected: JSON with `"portal":"PLACE"` and a non-empty `deepLink`.

- [ ] **Step 4: Commit**
```bash
git add app/api/classify/route.ts && git commit -m "feat: classify api route"
```

---

### Task 4: useClassify hook

**Files:** Create `hooks/use-classify.ts`

- [ ] **Step 1: Implement**
```ts
"use client";
import { useState } from "react";
import type { Classification } from "@/lib/types";

type State = { status: "idle" | "loading" | "done" | "error"; data?: Classification; error?: string };

export function useClassify() {
  const [state, setState] = useState<State>({ status: "idle" });
  async function classify(query: string) {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error("request failed");
      setState({ status: "done", data: await res.json() });
    } catch (e) {
      setState({ status: "error", error: (e as Error).message });
    }
  }
  return { ...state, classify };
}
```

- [ ] **Step 2: Commit**
```bash
git add hooks/use-classify.ts && git commit -m "feat: useClassify hook"
```

---

### Task 5: UI components

**Files:** Create `components/search-input.tsx`, `query-chips.tsx`, `portal-badge.tsx`, `step-guide.tsx`, `go-to-portal-button.tsx`, `result-card.tsx`

- [ ] **Step 1: `search-input.tsx`**
```tsx
"use client";
import { useState } from "react";
export function SearchInput({ onSubmit, disabled }: { onSubmit: (q: string) => void; disabled?: boolean }) {
  const [q, setQ] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) onSubmit(q); }} className="flex gap-2 w-full max-w-2xl">
      <input value={q} onChange={(e) => setQ(e.target.value)} disabled={disabled}
        placeholder="¿Qué información pública buscas?"
        className="flex-1 rounded-lg border px-4 py-3 text-lg" />
      <button disabled={disabled} className="rounded-lg bg-black text-white px-5 py-3">Buscar</button>
    </form>
  );
}
```

- [ ] **Step 2: `query-chips.tsx`** (example queries that expose the wrong-portal problem)
```tsx
"use client";
const EXAMPLES = [
  "Contratos de limpieza del Ayuntamiento de Madrid",
  "Subvenciones a una asociación cultural",
  "Cuánto cobra un ministro",
  "Declaración de bienes de un diputado",
  "Calidad del aire en mi ciudad",
];
export function QueryChips({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
      {EXAMPLES.map((e) => (
        <button key={e} onClick={() => onPick(e)} className="rounded-full border px-3 py-1 text-sm hover:bg-gray-100">{e}</button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: `portal-badge.tsx`**
```tsx
import type { Classification } from "@/lib/types";
export function PortalBadge({ data }: { data: Classification }) {
  return (
    <div className="flex items-center gap-3">
      <span className="rounded-md bg-blue-100 text-blue-800 px-3 py-1 font-semibold">{data.portalName}</span>
      <a href={data.portalUrl} target="_blank" className="text-sm text-gray-500 underline">{data.portalUrl}</a>
    </div>
  );
}
```

- [ ] **Step 4: `step-guide.tsx`**
```tsx
export function StepGuide({ steps, tip }: { steps: string[]; tip?: string }) {
  return (
    <div>
      <ol className="list-decimal pl-5 space-y-1">{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
      {tip && <p className="mt-2 text-sm text-amber-700">💡 {tip}</p>}
    </div>
  );
}
```

- [ ] **Step 5: `go-to-portal-button.tsx`**
```tsx
import type { Classification } from "@/lib/types";
export function GoToPortalButton({ data }: { data: Classification }) {
  const href = data.deepLink ?? data.portalUrl;
  return <a href={href} target="_blank" className="inline-block rounded-lg bg-green-600 text-white px-5 py-3 font-semibold">→ Ir al portal{data.deepLink ? " (búsqueda lista)" : ""}</a>;
}
```

- [ ] **Step 6: `result-card.tsx`** (composes the above)
```tsx
import type { Classification } from "@/lib/types";
import { PortalBadge } from "./portal-badge";
import { StepGuide } from "./step-guide";
import { GoToPortalButton } from "./go-to-portal-button";
export function ResultCard({ data, onReset }: { data: Classification; onReset: () => void }) {
  return (
    <div className="w-full max-w-2xl rounded-xl border p-6 space-y-4 shadow-sm">
      <PortalBadge data={data} />
      <p className="text-gray-800">{data.explanation}</p>
      <StepGuide steps={data.steps} tip={data.searchTip} />
      <div className="flex gap-3 items-center">
        <GoToPortalButton data={data} />
        <button onClick={onReset} className="text-sm text-gray-500 underline">¿No es esto? Probar otra</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Commit**
```bash
git add components/ && git commit -m "feat: ui components"
```

---

### Task 6: Page assembly (state machine)

**Files:** Modify `app/page.tsx`

- [ ] **Step 1: Implement**
```tsx
"use client";
import { useClassify } from "@/hooks/use-classify";
import { SearchInput } from "@/components/search-input";
import { QueryChips } from "@/components/query-chips";
import { ResultCard } from "@/components/result-card";

export default function Home() {
  const { status, data, error, classify } = useClassify();
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-4xl font-bold text-center">¿Dónde está esa información pública?</h1>
      <p className="text-gray-600 text-center max-w-xl">Pregunta en lenguaje normal. Te decimos el portal correcto y cómo encontrarlo.</p>
      <SearchInput onSubmit={classify} disabled={status === "loading"} />
      {status === "idle" && <QueryChips onPick={classify} />}
      {status === "loading" && <div className="animate-pulse text-gray-400">Buscando el portal correcto…</div>}
      {status === "error" && <p className="text-red-600">Algo falló: {error}. Inténtalo de nuevo.</p>}
      {status === "done" && data && <ResultCard data={data} onReset={() => location.reload()} />}
    </main>
  );
}
```

- [ ] **Step 2: Full manual run** — `npm run dev`, click each chip, confirm correct portal + the PLACE deep link opens the live portal.

- [ ] **Step 3: Commit**
```bash
git add app/page.tsx && git commit -m "feat: page assembly + state machine"
```

---

### Task 7: Deploy + README + submission

- [ ] **Step 1: Set the API key in Vercel**
```bash
npx vercel env add ANTHROPIC_API_KEY production
```

- [ ] **Step 2: Deploy to production**
```bash
npx vercel --prod
```

- [ ] **Step 3: Write README** with: project + team name, one-line problem, prerequisites (Node 20+), install (`npm i`), `ANTHROPIC_API_KEY` (name only), run (`npm run dev`), tech stack. Verify the live URL works end-to-end.

- [ ] **Step 4: Commit + push to team branch before 19:00**
```bash
git add README.md && git commit -m "docs: readme" && git push origin <team-branch>
```

---

## Self-Review

- **Spec coverage:** search→classify→result flow (Tasks 4–6), moat table (Task 1), deep link wow (Tasks 1,3,5), AI policy compliance — prompt forbids prose (Task 2), deployed-not-mockup (Tasks 0,7). UNKNOWN fallback handled in route + button. ✓
- **Types:** `Classification`/`PortalId` defined once in `lib/types.ts`, imported everywhere. `buildPlaceDeepLink` name consistent across Tasks 1/3. ✓
- **Known risk (flagged, not a placeholder):** PLACE deep-link param must be verified against the live portal — Task 1 Step 4 notes the graceful-degradation path if it can't be done.
