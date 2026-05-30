# Buscador v1 — Hacienda Entity Link Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** For a prompt that resolves to a *derecho de acceso* request, attach the target ministry's public **portada** URL to the classification and render a CTA so the user lands on that page and is prompted to select an authentication type (Cl@ve / certificado / DNI-e). Demo entity: **Ministerio de Hacienda (idAmb 101514)**.

**Architecture:** Add an entity-lookup module that reads `scripts/explore-urls-output.json` and returns an entity by `idAmb`. Attach an optional `entityMatch` to the existing `Classification` inside `buildClassificationFromTopicId` (the single point where every classification — LLM route *and* deterministic fallback — is built). The `ResultCard` renders a CTA linking to the entity's **`portadaUrl`** (NOT `certAuthUrl`). Validation confirms the live portada prompts for auth-type selection.

**Tech Stack:** Next.js (App Router), TypeScript, Vitest + Testing Library, React 19.

---

## Ground-Truth Findings (validated against the live portal, 2026-05-30)

These were verified with `curl` and **must** be respected by the implementation:

- `https://transparencia.sede.gob.es/procedimiento/formulario?idProc=133628&idAmb=101514` → **HTTP 302 to `/error/401`** when hit without a session. This is the `certAuthUrl` / `formEndpoint`. **Do NOT send users here.** It is reserved for the future authenticated-agent flow (v2+).
- `https://transparencia.sede.gob.es/procedimiento/portada?idProc=133628&idAmb=101514` → **HTTP 200**, a real public page titled *"Sede Electrónica del Portal de la Transparencia… - Portada"*. Its HTML contains `Acceder al procedimiento`, the strings `Cl@ve` / `certificado` / `DNI`, and a link to `/claveproxy/clave/authenticate?returnUrl=<portada>`.
- Clicking **"Acceder al procedimiento"** on the portada drives the user to the Cl@ve gateway where they **select an auth type**. This is exactly the objective.

**Conclusion:** the user-facing link is the entity's **`portadaUrl`**.

---

## File Structure

**Create:**
- `src/domain/buscador/entities.ts` — entity-lookup module (load JSON, `findEntityById`, `HACIENDA_ID_AMB`, `EntityMatch` type exposing `accessUrl = portadaUrl`).
- `src/domain/buscador/entities.test.ts` — unit tests for the lookup.
- `src/domain/buscador/classification.test.ts` — unit tests asserting `entityMatch` is attached for `derecho_acceso`.

**Modify:**
- `src/domain/buscador/types.ts` — add optional `entityMatch` to `Classification`.
- `src/domain/buscador/classification.ts` — attach `entityMatch` (demo: Hacienda) when `topicId === "derecho_acceso"`.
- `src/components/buscador/result-card.tsx` — render the entity CTA when `entityMatch` is present.
- `src/components/buscador/buscador-flow.test.tsx` — assert the rendered link points at the portada URL.

**Reference only (do not change in v1):**
- `scripts/explore-urls-output.json` — `certAuthUrl`/`formEndpoint`/`signingEndpoint` stay as-is for the v2 agent.

---

## Task 1: Entity Lookup Module + Unit Tests

**Files:**
- Create: `src/domain/buscador/entities.ts`
- Create: `src/domain/buscador/entities.test.ts`

- [ ] **Step 1: Create `src/domain/buscador/entities.ts`**

```typescript
// Path mirrors knowledge-graph.ts which imports "../../../docs/keywords.json".
// From src/domain/buscador/ → repo root is ../../../, then scripts/.
import entitiesData from "../../../scripts/explore-urls-output.json";

/** idAmb of Ministerio de Hacienda — the v1 demo entity. */
export const HACIENDA_ID_AMB = 101514;

/**
 * What v1 needs to route a user to the right ministry.
 * `accessUrl` is the PUBLIC portada page (200 OK) that leads to auth-type
 * selection. We deliberately do NOT expose certAuthUrl/formEndpoint here:
 * the /formulario endpoint 302-redirects to /error/401 without a session and
 * is reserved for the v2 authenticated-agent flow.
 */
export type EntityMatch = {
  idAmb: number;
  name: string;
  accessUrl: string;
};

type RawEntity = {
  idAmb: number;
  name: string;
  portadaUrl: string;
};

const ENTITIES = entitiesData.entities as RawEntity[];

/** Find an entity by its idAmb. Returns null when not found. */
export function findEntityById(idAmb: number): EntityMatch | null {
  const entity = ENTITIES.find((e) => e.idAmb === idAmb);
  if (!entity) return null;
  return {
    idAmb: entity.idAmb,
    name: entity.name,
    accessUrl: entity.portadaUrl,
  };
}

/** All entities (debug/reference). */
export function getAllEntities(): EntityMatch[] {
  return ENTITIES.map((e) => ({
    idAmb: e.idAmb,
    name: e.name,
    accessUrl: e.portadaUrl,
  }));
}
```

- [ ] **Step 2: Create `src/domain/buscador/entities.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { findEntityById, getAllEntities, HACIENDA_ID_AMB } from "./entities";

describe("entities — entity lookup", () => {
  it("Given Hacienda idAmb, Then returns Hacienda with its portada accessUrl", () => {
    const entity = findEntityById(HACIENDA_ID_AMB);
    expect(entity).not.toBeNull();
    expect(entity?.name).toBe("Ministerio de Hacienda");
    expect(entity?.idAmb).toBe(101514);
    expect(entity?.accessUrl).toBe(
      "https://transparencia.sede.gob.es/procedimiento/portada?idProc=133628&idAmb=101514"
    );
  });

  it("accessUrl is the portada endpoint, never the formulario endpoint", () => {
    const entity = findEntityById(HACIENDA_ID_AMB);
    expect(entity?.accessUrl).toContain("/procedimiento/portada");
    expect(entity?.accessUrl).not.toContain("/procedimiento/formulario");
  });

  it("Given unknown idAmb, Then returns null", () => {
    expect(findEntityById(999999)).toBeNull();
  });

  it("getAllEntities returns the 25 entities with unique idAmbs", () => {
    const all = getAllEntities();
    expect(all.length).toBe(25);
    const ids = all.map((e) => e.idAmb);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(HACIENDA_ID_AMB);
  });
});
```

- [ ] **Step 3: Run the tests — expect FAIL (module exists, but confirm green path)**

Run: `pnpm test -- src/domain/buscador/entities.test.ts`
Expected: All 4 tests PASS (module and JSON are already in place).

> If `findEntityById` is accidentally returning the wrong field, the "accessUrl is the portada endpoint" test catches it.

- [ ] **Step 4: Commit**

```bash
git add src/domain/buscador/entities.ts src/domain/buscador/entities.test.ts
git commit -m "feat(buscador): entity lookup returning public portada URL per ministry"
```

---

## Task 2: Extend `Classification` with `entityMatch`

**Files:**
- Modify: `src/domain/buscador/types.ts`

- [ ] **Step 1: Add `entityMatch` to the `Classification` type**

In `src/domain/buscador/types.ts`, replace the `Classification` type with:

```typescript
export type Classification = {
  topicId: TopicId;
  label: string;
  portalUrl: string;
  routingType: RoutingType;
  isSpecialSection: boolean;
  explanation: string;
  steps: string[];
  deepLink?: string;
  searchTip?: string;
  /**
   * Present when the request targets a specific government entity (a
   * derecho-de-acceso request). `accessUrl` is the public portada page that
   * leads the user to auth-type selection. Demo: Ministerio de Hacienda.
   */
  entityMatch?: {
    idAmb: number;
    name: string;
    accessUrl: string;
  };
};
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: PASS (adding an optional field breaks nothing).

- [ ] **Step 3: Commit**

```bash
git add src/domain/buscador/types.ts
git commit -m "feat(buscador): add optional entityMatch to Classification"
```

---

## Task 3: Attach `entityMatch` in `buildClassificationFromTopicId`

This is the single integration point used by **both** the LLM route (`/api/buscador/classify` → `buildClassificationFromTopicId`) and the deterministic `classify()` fallback.

**Files:**
- Modify: `src/domain/buscador/classification.ts`
- Create: `src/domain/buscador/classification.test.ts`

- [ ] **Step 1: Import the entity lookup at the top of `classification.ts`**

Add below the existing imports:

```typescript
import { findEntityById, HACIENDA_ID_AMB } from "./entities";
```

- [ ] **Step 2: Attach `entityMatch` for `derecho_acceso` in `buildClassification`**

In `src/domain/buscador/classification.ts`, change the `return` at the end of the private `buildClassification` function. Current:

```typescript
  return {
    topicId,
    label: copy.label,
    portalUrl: resolvedUrl,
    routingType: node?.type ?? "interno",
    isSpecialSection: node?.is_special_section ?? false,
    explanation: copy.explanation,
    steps: copy.steps,
    ...(copy.searchTip !== undefined && { searchTip: copy.searchTip }),
    ...(copy.buildDeepLink !== undefined && { deepLink: copy.buildDeepLink(query) }),
  };
```

Replace with:

```typescript
  // v1 demo: a derecho-de-acceso request targets a specific ministry. Until the
  // entity classifier (teammate) supplies the idAmb, we default to Hacienda.
  // Swap `HACIENDA_ID_AMB` for the classifier-provided idAmb when available.
  const entity =
    topicId === "derecho_acceso" ? findEntityById(HACIENDA_ID_AMB) : null;

  return {
    topicId,
    label: copy.label,
    portalUrl: resolvedUrl,
    routingType: node?.type ?? "interno",
    isSpecialSection: node?.is_special_section ?? false,
    explanation: copy.explanation,
    steps: copy.steps,
    ...(copy.searchTip !== undefined && { searchTip: copy.searchTip }),
    ...(copy.buildDeepLink !== undefined && { deepLink: copy.buildDeepLink(query) }),
    ...(entity !== null && {
      entityMatch: {
        idAmb: entity.idAmb,
        name: entity.name,
        accessUrl: entity.accessUrl,
      },
    }),
  };
```

- [ ] **Step 3: Create `src/domain/buscador/classification.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { buildClassificationFromTopicId } from "./classification";

describe("buildClassificationFromTopicId — entityMatch", () => {
  it("Given derecho_acceso, Then attaches Hacienda entityMatch with portada URL", () => {
    const result = buildClassificationFromTopicId(
      "solicitar acceso a documentos del ministerio",
      "derecho_acceso"
    );
    expect(result.topicId).toBe("derecho_acceso");
    expect(result.entityMatch).toBeDefined();
    expect(result.entityMatch?.idAmb).toBe(101514);
    expect(result.entityMatch?.name).toBe("Ministerio de Hacienda");
    expect(result.entityMatch?.accessUrl).toBe(
      "https://transparencia.sede.gob.es/procedimiento/portada?idProc=133628&idAmb=101514"
    );
  });

  it("Given a non-derecho_acceso topic, Then no entityMatch", () => {
    const result = buildClassificationFromTopicId("contratos de limpieza", "contratacion");
    expect(result.entityMatch).toBeUndefined();
  });

  it("Given unknown, Then no entityMatch", () => {
    const result = buildClassificationFromTopicId("", "unknown");
    expect(result.entityMatch).toBeUndefined();
  });
});
```

- [ ] **Step 4: Run the new tests + existing classify tests (no regression)**

Run: `pnpm test -- src/domain/buscador/classification.test.ts src/domain/buscador/classify.test.ts`
Expected: All PASS. (`classify.test.ts` checks `topicId` only, so the added field is non-breaking.)

- [ ] **Step 5: Commit**

```bash
git add src/domain/buscador/classification.ts src/domain/buscador/classification.test.ts
git commit -m "feat(buscador): attach Hacienda entityMatch for derecho_acceso (v1 demo)"
```

---

## Task 4: Render the Entity CTA in `ResultCard`

**Files:**
- Modify: `src/components/buscador/result-card.tsx`
- Modify: `src/components/buscador/buscador-flow.test.tsx`

- [ ] **Step 1: Render the entity CTA in `result-card.tsx`**

In `src/components/buscador/result-card.tsx`, insert an entity block immediately after the `<PortalBadge data={data} />` line:

```tsx
      {data.entityMatch && (
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 space-y-3">
          <p className="text-sm text-foreground-muted">
            Tu solicitud va dirigida a{" "}
            <span className="font-semibold text-foreground">{data.entityMatch.name}</span>.
          </p>
          <a
            href={data.entityMatch.accessUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-5 py-2.5 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-colors"
          >
            → Iniciar solicitud en {data.entityMatch.name}
          </a>
          <p className="text-xs text-foreground-muted">
            Te llevamos a la sede electrónica. Allí elegirás tu método de
            identificación (Cl@ve, certificado o DNI electrónico).
          </p>
        </div>
      )}
```

- [ ] **Step 2: Hide the generic portal button when an entity CTA is shown**

In the same file, change the actions row so `GoToPortalButton` only renders without an entity match. Current:

```tsx
      <div className="flex flex-wrap items-center gap-4 pt-2">
        <GoToPortalButton data={data} />
```

Replace with:

```tsx
      <div className="flex flex-wrap items-center gap-4 pt-2">
        {!data.entityMatch && <GoToPortalButton data={data} />}
```

- [ ] **Step 3: Add a component test for the Hacienda flow in `buscador-flow.test.tsx`**

Append this test inside the existing `describe("Buscador — demo con API Cursor (mock)", ...)` block:

```tsx
  it("When la API devuelve derecho_acceso, Then el CTA enlaza a la portada de Hacienda", async () => {
    const classification = buildClassificationFromTopicId(
      "solicitar acceso a documentos del ministerio",
      "derecho_acceso"
    );
    vi.stubGlobal("fetch", mockClassifyApi(classification));

    const user = userEvent.setup();
    render(<Buscador />);

    const input = screen.getByRole("textbox", {
      name: /Pregunta de información pública/i,
    });
    await user.type(input, "solicitar acceso a documentos del ministerio");
    await user.click(screen.getByRole("button", { name: /Buscar/i }));

    const link = await screen.findByRole("link", {
      name: /Iniciar solicitud en Ministerio de Hacienda/i,
    });
    expect(link).toHaveAttribute(
      "href",
      "https://transparencia.sede.gob.es/procedimiento/portada?idProc=133628&idAmb=101514"
    );
    expect(link).toHaveAttribute("target", "_blank");
  });
```

- [ ] **Step 4: Run component tests + full suite**

Run: `pnpm test -- src/components/buscador/buscador-flow.test.tsx`
Expected: All PASS, including the new Hacienda test.

Run: `pnpm test`
Expected: Entire suite PASS.

- [ ] **Step 5: Lint + type-check**

Run: `pnpm lint && pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/buscador/result-card.tsx src/components/buscador/buscador-flow.test.tsx
git commit -m "feat(buscador): entity CTA linking to ministry portada (auth-type selection)"
```

---

## Task 5: Validate the Live Auth-Type Prompt (the core objective)

This task confirms the end goal: landing on the entity link prompts the user to select an auth type. The data layer is already validated (see Ground-Truth Findings). This task documents a repeatable check.

**Files:** none (validation only).

- [ ] **Step 1: Confirm the portada is reachable and advertises auth-type selection**

Run:
```bash
curl -s -A "Mozilla/5.0" "https://transparencia.sede.gob.es/procedimiento/portada?idProc=133628&idAmb=101514" --max-time 25 \
  | grep -ioE "(acceder al procedimiento|cl@ve|certificado|dni|/claveproxy/clave/authenticate)" | sort -u
```
Expected output includes: `acceder al procedimiento`, `cl@ve`, `certificado`, `dni`, and a `/claveproxy/clave/authenticate` reference.

- [ ] **Step 2: Confirm the formulario endpoint is NOT user-facing (guards the regression)**

Run:
```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" -A "Mozilla/5.0" \
  "https://transparencia.sede.gob.es/procedimiento/formulario?idProc=133628&idAmb=101514" --max-time 25
```
Expected: `302 .../error/401...` — confirming we correctly route users to `portadaUrl` instead.

- [ ] **Step 3: Manual browser confirmation (one-time, human)**

Open the portada URL in a browser, click **"Acceder al procedimiento"**, and confirm the Cl@ve gateway offers **Cl@ve / certificado electrónico / DNIe** as selectable auth methods. Capture a screenshot for the demo.

> Optional automation: if a Playwright browser is installed (`pnpm exec playwright install chromium`), a script can navigate the portada, click the CTA, and assert the auth-selection page renders. Not required for v1 sign-off — the curl checks above already prove the page advertises the auth methods.

- [ ] **Step 4: Record the result in the entity-mapping doc**

Add a short "Validated 2026-05-30: portada prompts Cl@ve/cert/DNIe; formulario 401s without session" note to `docs/entity-mapping.md`, then commit:

```bash
git add docs/entity-mapping.md
git commit -m "docs: record live validation of Hacienda auth-type prompt"
```

---

## V1 Acceptance Criteria

1. `findEntityById(101514)` returns `{ idAmb: 101514, name: "Ministerio de Hacienda", accessUrl: <portada URL> }`.
2. A `derecho_acceso` classification carries `entityMatch` with the Hacienda **portada** URL (never the formulario URL).
3. `ResultCard` renders "→ Iniciar solicitud en Ministerio de Hacienda" linking to that portada URL, opening in a new tab.
4. Live validation: the portada page advertises and leads to Cl@ve / certificado / DNIe selection; the formulario endpoint 401s without a session.
5. `pnpm test`, `pnpm lint`, and `pnpm exec tsc --noEmit` all pass.

## Explicitly OUT of scope for v1

- The entity *classifier* (teammate-owned) — we hardcode Hacienda for `derecho_acceso`.
- Certificate handling / Cl@ve automation — the user authenticates manually.
- Auto-filling, submitting, or signing the form; extracting `expedienteRef`; webhooks — all v2+.
