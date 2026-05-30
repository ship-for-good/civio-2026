# ¿Dónde Está? — Refined Multi-Version Plan (v1–v4)

**Date:** 2026-05-30 · **Team:** Red · **Deadline:** 19:00 same day

---

## Executive Summary

**Vision shift:** from "guide users to portals" → "automate derecho de acceso requests." We're building a progressive escalation:

- **v1 (core, required):** Classify query → generate pre-filled **derecho de acceso request** (email draft or PDF) ready to submit to the relevant ministry
- **v2 (stretch):** Add interactive form automation (Playwright/autocomplete) + capture user contact → pre-fill actual Portal de Transparencia form
- **v3 (stretch):** Integrate cert backend → unlock digital signature step
- **v4 (moonshot):** Cursor AI natural-language queries against published data (search existing info, don't request it)

**Effort allocation for 19:00 deadline:**
- **v1: 4–5 hours** (core, must ship)
- **v2: 3–4 hours** (interactive, if v1 solid by ~15:00)
- **v3: 2–3 hours** (cert integration, if v2 lands)
- **v4: 1–2 hours** (AI search, polish)

---

## v1: Derecho de Acceso Request Generator (Core)

**What:** User types question → classify → **generate pre-filled request** ready to send to the relevant ministry/entity.

**Instead of:** "Click Portal → Search for CPV codes → etc."

**Outputs:** 
1. Request metadata (ministry, information type, deadline, legal basis)
2. Email draft with request content (user copy-paste to email client or auto-launch mailto:)
3. PDF ready to download and email/submit

### v1 Scope

**Classification (reuse current):**
- Portal enum: PLACE, BDNS, TRANSPARENCIA, BOE, MEDIOAMBIENTAL
- Keyword-based classifier (fast, deterministic)

**Request Generator (new):**
- `lib/solicitud.ts` — build a `SolicitudAcceso` type:
  ```ts
  type SolicitudAcceso = {
    ministerio: string;           // e.g. "Ministerio de Transportes"
    email: string;                // target email
    tipoInformacion: string;      // e.g. "Contratos de limpieza"
    descripcion: string;          // 2–3 sentences, plain Spanish
    plazoRespuesta: string;       // "30 días hábiles"
    fundamentoLegal: string;      // Ley 19/2013, art. 12
    ciudadanoNombre?: string;
    ciudadanoEmail?: string;
  };
  ```

- `lib/solicitud-builders.ts` — per-portal functions to map Classification → SolicitudAcceso:
  ```ts
  export function buildPlaceSolicitud(query: string, classification: Classification): SolicitudAcceso
  export function buildBdnsSolicitud(query: string, classification: Classification): SolicitudAcceso
  // etc.
  ```

- `lib/email-draft.ts` — render email body:
  ```ts
  export function renderEmailDraft(solicitud: SolicitudAcceso): string
  export function renderPdf(solicitud: SolicitudAcceso): Buffer // use jsPDF or pdfkit
  ```

**UI changes:**
- Replace `ResultCard` with `SolicitudCard`:
  - Ministry name + target email
  - Request description (auto-generated from query)
  - "Copy email draft" button (copy-to-clipboard)
  - "Download PDF" button
  - Legal footer (Ley 19/2013)

**Tests:**
- Unit: `solicitud-builders.test.ts` — BDD scenarios per portal (e.g. "given query about PLACE contracts, expect ministerio=transportes")
- Integration: render email/PDF, verify fields populated

### v1 Success Criteria

- [ ] Classify query → identify correct ministry
- [ ] Generate email draft with legal request structure (fundamento legal, plazo, etc.)
- [ ] Email draft is copy-paste-ready and includes all required fields
- [ ] PDF generates without external service (use pdfkit or jsPDF)
- [ ] Tested against real queries (e.g. Barcelona school contracts → Ministerio de Educación email)

### v1 Effort Estimate
- Research ministry emails + legal structure: **0.5h**
- Build `SolicitudAcceso` + builders: **1.5h**
- Email/PDF rendering: **1h**
- UI swap (ResultCard → SolicitudCard): **0.75h**
- Tests + manual validation: **1h**
- **Total: ~5h**

### v1 Go/No-Go Gate
By **15:30:** v1 must be shipping on vercel. If not, drop v2–v4 and perfect v1 for demo.

---

## v2: Interactive Form Automation (Stretch)

**What:** User types question → classify → collect name + email + phone → **auto-fill Portal de Transparencia form** and advance steps via Playwright/browser automation.

**Key question (for v2 planning only):**
- Do we auto-fill server-side and return a pre-signed form, or embed Playwright in the client?
- Should we automate the Cl@ve/certificate authentication step, or just the form fields?
- What's the acceptable UX: "watch the bot fill your form" vs. "click here to auto-open pre-filled form"?

**Files to create (v2 only):**
- `components/contact-form.tsx` — collect ciudadano name, email, phone
- `lib/portal-form-automation.ts` — Playwright scripts per portal
- `app/api/automate/route.ts` — server-side form submission (if async route needed)

**Tests:**
- Mock Playwright interactions
- Verify form field mapping
- Test edge cases (optional fields, prefilled data)

### v2 Effort Estimate (if doing)
**3–4 hours** (depends on form structure complexity and Playwright setup)

### v2 Go/No-Go Gate
Only start v2 if v1 is passing tests and shipped to staging by **15:30**.

---

## v3: Certificate Backend Integration (Moonshot)

**What:** Integrate government cert backend → unlock digital signature step → approach actual Portal submission (not just form pre-fill).

**Dependencies:** v2 must work first.

**Key unknowns:**
- Which cert backend? (Cl@ve, Autofirma, fnmt.es, etc.)
- API availability?
- Can we programmatically sign documents, or only guide users?

**Scope: TBD post-v2** (only if time allows).

### v3 Effort Estimate
**2–3 hours** (heavily dependent on backend API maturity)

### v3 Go/No-Go Gate
Only start v3 if v2 is working and integrated by **17:30**.

---

## v4: Natural-Language Search on Published Data (Moonshot)

**What:** User can query "show me all Barcelona school construction contracts >100k euros" → search existing published data (PLACE, BDNS, etc.) rather than request it.

**Integration:** Cursor AI (or Claude API) + structured search against portal APIs/data exports.

**Files (if doing):**
- `app/api/search/route.ts` — forward query to AI → generate portal-specific search
- `lib/search-parsers.ts` — parse AI response into PLACE/BDNS/etc. queries
- `components/search-result-grid.tsx` — display results from portal APIs

**Dependencies:** v1 working, time available.

### v4 Effort Estimate
**1–2 hours** (if APIs are well-documented)

### v4 Go/No-Go Gate
Only start v4 if v1 + v2 are rock-solid by **18:00**.

---

## Timeline to 19:00

```
now → +1h     kickoff + refine v1 scope + ministry email research
+1h → +3h     build solicitud builders + email/PDF rendering
+3h → +4h     UI swap (ResultCard → SolicitudCard) + tests
+4h → +5h     v1 passing, deploy to staging
            ↳ GO/NO-GO: v1 shipping? → move to v2 if yes

+5h → +7h     v2: contact form + Playwright setup (if doing)
+7h → +8h     v2: form automation + integration tests
+8h → +9h     v2 deployed + manual testing
            ↳ GO/NO-GO: v2 working? → consider v3 if yes

+9h → +11h    v3: cert backend research + integration (if time + dependencies clear)
+11h → +12h   v3 testing + deployment

+12h → +13h   v4: AI search setup (if time allows)

17:00–18:00   final polish, README, recording demo script
18:00–19:00   buffer + demo rehearsal
```

---

## Architecture (v1–v4 progression)

```
[Classify] (reuse current)
    ↓
[Solicitud Builder] (NEW in v1)
    ↓
[Email/PDF Generator] (NEW in v1)
    ↓ (v2)
[Contact Form] → [Playwright Automation] → [Form Submission Tracking]
    ↓ (v3)
[Cert Backend] → [Digital Signature] → [Official Portal Submission]
    ↓ (v4)
[AI Search Parser] → [Portal API Queries] → [Result Grid]
```

---

## Key Decisions (v1 critical path)

**Ministry/Entity Mapping**

We need a lookup table: Portal Enum → Ministry email + contact. Example:

```ts
const MINISTRY_CONTACTS: Record<PortalId, { name: string; email: string; phone?: string }> = {
  PLACE: { 
    name: "Ministerio de Transportes y Movilidad Sostenible", 
    email: "solicitud@mitma.gob.es",
    phone: "+34 91 597 8000"
  },
  BDNS: { 
    name: "Ministerio de Hacienda", 
    email: "solicitud@hacienda.gob.es"
  },
  // ... etc
};
```

**Question for Civio:** Are these ministry emails correct? Should requests go to each ministry directly, or to a centralized hub?

**Email vs. PDF**

- **Email draft (mailto:):** Fastest. User clicks → opens their email client with pre-filled body.
- **PDF download:** More formal. User can edit locally before sending.
- **Recommendation:** Start with both. Email as primary, PDF as fallback.

**Legal Boilerplate**

All requests should include:
- Reference to Ley 19/2013 (transparency law)
- 30-day response deadline
- Right to appeal to Consejo de Transparencia
- Optional: reference to AEPD if personal data involved

---

## Out of Scope (v1–v4)

- OPP-2 integration (request tracking after submission) — let pideinfo.es handle it
- Autonomous submissions (we don't submit on user's behalf; they do)
- Scraping live portal data (v4 is search only, not ingestion)
- Mobile app (web only)

---

## Deliverables at 19:00

**At minimum (v1):**
- [ ] Deployed web app on vercel
- [ ] Classify query → generate email draft
- [ ] "Copy to clipboard" + "Download PDF" buttons
- [ ] README with example queries
- [ ] Demo script (3 min: type query → generate request → show email draft)

**Stretch (v1 + v2):**
- [ ] Interactive contact form
- [ ] Partial form auto-fill on Portal de Transparencia (if Playwright stable)

**Moonshot (v1 + v2 + v3 + v4):**
- [ ] Full automation pipeline
- [ ] AI search on published data

---

## Notes for Implementation

1. **Reuse current structure:** Keep the Classify domain logic. Just swap out the Result UI.
2. **Move fast:** v1 is simple (classification + email generation). Don't gold-plate.
3. **Test with real queries:** Before 19:00, test 3–5 real citizen questions (e.g. Barcelona contracts, school budgets, minister salary).
4. **Civio validation:** If time allows, sit down with Civio person to validate ministry emails + request structure. This is high-leverage.
5. **Bill of Rights:** Every request should remind the user that this is a legal right, not a favor. Include links to pideinfo.es and appeal procedures.

---

## Next Steps

1. **Kickoff (~15 min):** Agree on v1 scope + ministry email sources
2. **Research (~30 min):** Validate ministry emails + legal language for Ley 19/2013
3. **Implement v1 (~3 hours):** Build solicitud builders + email/PDF rendering + UI
4. **Deploy + test (~1 hour):** Vercel + manual demo
5. **v2+ (if time allows):** Follow gates above

**Ready to start?**
