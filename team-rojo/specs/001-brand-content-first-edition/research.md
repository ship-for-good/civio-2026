# Research: Brand & Content — 1st Edition

**Date:** 2026-04-10

---

## Context

This is a content and branding update for the Ship For Good website. The feature involves:
- Updating all visible text to match the official 1st edition communication kit
- Adding Fundación Civio branding and copy
- Extending language support to include English
- Removing the sponsors section

No architectural changes, no backend work, no database modifications.

---

## Decisions & Findings

### 1. Language Support: Adding English Locale to next-intl

**Question:** How do we add English (EN) to the existing next-intl setup (currently ES/CA)?

**Alternatives Considered:**

A. **Extend next-intl routing with EN locale (CHOSEN)**
   - Add `"en"` to `routing.locales` array in `src/i18n/routing.ts`
   - Create `src/messages/en.json` with English translations
   - Update Navbar component to show ES / CA / EN toggle
   - Minimal changes; follows existing pattern exactly

B. Use a separate i18n library for English
   - Would require adding a second library (complexity)
   - Inconsistent with project design (redundant)
   - Not recommended

C. Hardcode English content without i18n
   - Violates consistency principle
   - Makes future maintenance harder
   - Not recommended

**Decision:** **A** — Extend next-intl with `"en"` locale.

**Rationale:**
- Project already uses next-intl for ES and CA; extending it is the natural next step.
- next-intl is designed for multi-locale support; adding one more locale is trivial.
- Keeps all translations in one place (`messages/*.json`); easy to maintain.
- The Navbar language toggle already exists and can be extended from 2 to 3 options.
- Zero architectural changes; zero risk of breaking existing functionality.

**Implementation Details:**
- File: `src/i18n/routing.ts`
  - Line: `locales: ["es", "ca"]` → `locales: ["es", "ca", "en"]`
- File: Create `src/messages/en.json`
  - Copy structure from `es.json` (if exists) or infer from `ca.json`
  - All keys identical; values translated to English
  - Include all hero text, schedule, FAQ, footer copy, CTAs
- File: `src/components/navbar.tsx`
  - Update locale toggle to render 3 buttons: ES / CA / EN
  - No logic changes; just one more option in the list

**Dependencies:** None.

**Risks:** None identified.

---

### 2. Asset Storage: Logos in `public/` Directory

**Question:** Where should we store the official logos (Ship For Good + Civio)?

**Alternatives Considered:**

A. **Store in `public/` directory (CHOSEN)**
   - Create `public/logo.svg` for Ship For Good
   - Create `public/civio-logo.svg` for Civio
   - Serve as static files via Next.js
   - Standard Next.js convention

B. Store in `src/assets/` and bundle at build time
   - Unnecessary; logos don't need build-time processing
   - Adds complexity
   - Not standard for Next.js projects with static assets
   - Not recommended

C. Use external CDN
   - Out of scope for this feature
   - Introduces external dependency
   - Not recommended

**Decision:** **A** — Store in `public/` directory.

**Rationale:**
- Project already stores static assets in `public/` (file.svg, globe.svg, next.svg, vercel.svg).
- Next.js documentation recommends `public/` for static files.
- Logos are immutable (provided by user and partner); no build-time processing needed.
- Simple path: `<img src="/logo.svg" />` works out of the box.
- No configuration changes required.

**Implementation Details:**
- Place user-provided Ship For Good SVG at: `public/logo.svg`
- Download/export Civio logo from [https://www.civio.es/](https://www.civio.es/) and save as: `public/civio-logo.svg`
- Reference in components:
  ```jsx
  <img src="/logo.svg" alt="Ship For Good" />
  <img src="/civio-logo.svg" alt="Fundación Civio" />
  ```

**Dependencies:** Civio logo availability (public website).

**Risks:** If Civio logo unavailable as SVG, fallback to text-only section (acceptable per spec, not blocking).

---

### 3. Removing Sponsors Section

**Question:** How do we cleanly remove the sponsors section?

**Alternatives Considered:**

A. **Delete component and all references (CHOSEN)**
   - Remove import from `src/app/[locale]/page.tsx`
   - Delete file `src/components/sponsors.tsx`
   - No conditional logic; clean removal

B. Hide with CSS or conditional rendering
   - Leaves dead code in codebase
   - Adds maintenance burden
   - If truly unwanted, deletion is better
   - Not recommended

C. Keep file but render null
   - Still dead code
   - Confusing to future developers
   - Not recommended

**Decision:** **A** — Delete component entirely.

**Rationale:**
- User confirmed the sponsors section should be removed entirely (not just hidden).
- The component is self-contained with no dependencies from other components.
- Keeping unused code clutters the codebase and increases maintenance burden.
- Clean deletion is simpler than hidden/conditional rendering.

**Implementation Details:**
- In `src/app/[locale]/page.tsx`:
  - Remove line: `import Sponsors from '@/components/sponsors';`
  - Remove line: `<Sponsors />`
- Delete file: `src/components/sponsors.tsx`
- No database or API changes needed.

**Dependencies:** None.

**Risks:** None identified (component is isolated).

---

### 4. Component Update Strategy

**Pattern:** Direct text replacement + new sections.

**Approach:**
- For existing components (hero, schedule, FAQ, footer): replace placeholder/old text with official kit copy.
- For new content (Civio section, "What you get", "Who is it for?"): add new components or extend existing ones.
- All text sourced from official kit (user-provided); no rewrites or paraphrasing.
- All text extracted to `messages/*.json` for localization.

**Key Components:**
- **hero.tsx** — Update headline, subheadline, CTA, tagline
- **navbar.tsx** — Add logo; extend language toggle
- **info-bar.tsx** — Update dates, location, times
- **schedule.tsx** — Update activities and descriptions
- **civio-section.tsx** (NEW) — Partner info with logo
- **how-it-works.tsx** — Add/update benefit cards and "Who is it for?" section
- **faq.tsx** — Update all 6 Q&A pairs
- **footer.tsx** — Update tagline and closing copy

---

### 5. Localization Strategy

**Languages:** Spanish (ES), Catalan (CA), English (EN)

**Approach:**
1. Spanish (`es.json`) is the source — provided via official kit
2. Catalan (`ca.json`) — translated from Spanish (using domain knowledge; no external review required per spec)
3. English (`en.json`) — translated from Spanish (same; no external review required per spec)

**Content Scope:**
- All visible text (headings, descriptions, CTAs, labels)
- Meta tags (page title, description)
- Alt text for images/logos

**Consistency Rules:**
- Use same terminology across all three languages (build glossary while translating)
- Tag all content with consistent keys in message files
- Test language toggle on all major sections

---

### 6. CTA & Registration URLs

**Question:** What should we do with CTAs that link to registration (URL pending)?

**Decision:** Mark all pending CTAs with `href="#"` and add code comments.

**Rationale:**
- User confirmed registration URLs are not yet available.
- Using `href="#"` prevents broken links while placeholders are in place.
- Code comment flags that this is pending (easy to find & update later).
- No blocking issue for this feature.

---

## Summary of Technical Decisions

| Decision | Chosen | Rationale |
|----------|--------|-----------|
| Add EN locale to next-intl | Yes | Extends existing pattern; minimal risk |
| Store logos in `public/` | Yes | Standard Next.js convention; project precedent |
| Delete sponsors section | Yes | User confirmed; component is isolated |
| Mark pending CTAs with `href="#"` | Yes | Prevents broken links; easy to update later |
| No backend/database changes | Confirmed | Feature is content-only |

---

## Unknowns Resolved

- ✅ How to add EN locale to next-intl → Extend routing.locales array + new messages/en.json
- ✅ Where to store logos → `public/` directory (project standard)
- ✅ How to remove sponsors → Delete component entirely
- ✅ How to handle pending URLs → Use `href="#"` with code comment

---

## Unresolved Questions

None. All technical unknowns resolved autonomously based on project context.

---

## External Dependencies

1. **Civio Logo** — Download from https://www.civio.es/
   - Status: Not blocking; fallback to text-only section if unavailable
2. **Official Kit Copy** — Provided by user (ready to use)
   - Status: Available; referenced in gathered-context.md

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Civio logo unavailable as SVG | Low | Use text-only section; acceptable per spec |
| Translation inconsistencies | Low | Review all three languages side-by-side before merge |
| Old dates/content slip through | Low | Systematic find-and-replace; verify before merge |
| Broken links from pending CTAs | Low | Mark with `href="#"`; add code comments for future update |

---

## Quality Signals

- ✅ All decisions made autonomously (no PM involvement needed)
- ✅ Decisions align with existing project patterns
- ✅ No architectural changes required
- ✅ No new dependencies introduced
- ✅ Feature is purely frontend/content; zero backend impact
- ✅ Existing code can remain; changes are additive or replacements
