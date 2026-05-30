# Technical Plan: Brand & Content — 1st Edition

**Branch:** `001-brand-content-first-edition`  
**Created:** 2026-04-10

---

## Overview

Update the Ship For Good website with official 1st edition branding, content, and language support. This is a **frontend-only content and localization update** with no backend, database, or API changes.

**Tech Stack:**
- Next.js 16.1.6 (App Router with i18n via next-intl)
- React 19.2.3
- Localization: next-intl (currently ES/CA → add EN)

---

## Phase 0: Research & Decisions

### Language Support (next-intl)

**Decision:** Add `en` locale to existing next-intl routing.

**Rationale:**
- Current setup already supports multiple locales (ES, CA) via next-intl.
- Adding EN requires only: (1) add `en` to `routing.locales` array, (2) create `messages/en.json` with translations, (3) update Navbar locale toggle.
- Follows established project pattern — minimal footprint, no architecture changes.

**Implementation:**
1. Update `src/i18n/routing.ts`: add `"en"` to `locales` array
2. Create `src/messages/en.json` with all Spanish copy translated to English
3. Update `Navbar` component: change toggle from ES/CA to ES/CA/EN

### Logo Assets Storage

**Decision:** Store logos in `public/` directory as static SVG files.

**Rationale:**
- Project already stores static assets in `public/` (file.svg, globe.svg, next.svg, vercel.svg).
- Standard Next.js convention for static files that don't need build-time processing.
- Ship For Good logo provided by user as SVG; Civio logo can be exported/saved as SVG from their website.

**Implementation:**
1. Save Ship For Good logo → `public/logo.svg`
2. Download/save Civio logo → `public/civio-logo.svg`
3. Update components to reference: `<img src="/logo.svg" alt="Ship For Good" />`

### Sponsors Section Removal

**Decision:** Delete `sponsors.tsx` component and all references from `page.tsx`.

**Rationale:**
- Component is self-contained with no cross-dependencies from other components.
- User explicitly confirmed removal.
- Keeping dead code adds confusion.
- Clean deletion preferred over hidden/conditional rendering.

**Implementation:**
1. Remove import and usage from `src/app/[locale]/page.tsx`
2. Delete file: `src/components/sponsors.tsx`

---

## Phase 1: Component Updates & Localization

### Components to Update

| Component | Changes | Scope |
|-----------|---------|-------|
| `hero.tsx` | Update headline, subheadline, CTA text to match kit; add tagline & tags | Moderate |
| `navbar.tsx` | Add Ship For Good logo; update language toggle to ES/CA/EN | Small |
| `info-bar.tsx` | Update event dates (29-30 May 2026), location (42 Barcelona) | Small |
| `schedule.tsx` | Update Day 1 (18:00-21:00) and Day 2 (9:00-17:00) schedules with new copy | Moderate |
| `how-it-works.tsx` | Add "What you get" section with 6 benefits; "Who is it for?" section | Moderate |
| `faq.tsx` | Update FAQ with 6 official questions & answers from kit | Moderate |
| `civio-section.tsx` | **NEW** — Dedicated Civio partner section with logo & copy | Small |
| `footer.tsx` | Update tagline, closing CTA, footer copy, dates, venue | Small |
| `page.tsx` | Remove sponsors section; ensure all components render correctly | Small |

### Localization (i18n)

**Files to Create/Update:**
- `src/messages/en.json` — NEW, full English translation
- `src/messages/es.json` — UPDATE with official kit copy
- `src/messages/ca.json` — UPDATE with Catalan translations (inferred from Spanish)

**Scope:**
- All user-facing text on page (hero, info, schedule, FAQ, footer, CTAs)
- Meta tags (page title, description) if present
- Alt text for logos

### Data Model (Component Props & Content Structure)

No database changes. Content is managed via:
1. **i18n messages files** (`messages/*.json`) — all visible text
2. **Component props** — configuration (dates, times, locations)
3. **Asset paths** — logo references in `public/`

Example structure for schedule data:

```typescript
// Schedule entry: derived from kit, hardcoded in component or imported from config
interface ScheduleDay {
  date: string; // "29 de mayo de 2026"
  day: "Friday" | "Saturday";
  time: string; // "18:00–21:00"
  activities: Activity[];
}

interface Activity {
  time?: string;
  title: string;
  description: string;
}
```

---

## Phase 2: Tasks & Breakdown

### Block 1: Foundation (Logos & i18n)
1. Add Ship For Good logo to navbar
2. Extend next-intl: add EN locale, create messages/en.json
3. Update navbar language toggle

### Block 2: Hero & Info
4. Update hero copy (headline, subheadline, tagline, tags)
5. Update info bar (dates, location, times)
6. Update main CTA copy

### Block 3: Content Sections
7. Add Civio partner section (with logo & copy)
8. Update schedule with Day 1 & Day 2 details
9. Update "What you get" section (6 benefits)
10. Update "Who is it for?" section with tagline
11. Update FAQ with 6 Q&A pairs

### Block 4: Cleanup & Footer
12. Remove sponsors section and imports
13. Update footer (tagline, closing copy, dates, venue)
14. Verify all CTAs have pending href="#" marker

### Block 5: Localization
15. Complete Catalan translations (ca.json)
16. Review and finalize English translations (en.json)
17. Test language toggle (ES / CA / EN) across all sections

### Block 6: Quality & Testing
18. Visual review on desktop & mobile
19. Verify no placeholder or old content remains
20. Spot-check meta tags and page title

---

## Quality Gates

✅ **Before Build:**
- Spec fully understood; clarifications complete (no outstanding ambiguities)
- All 11 user stories mapped to component updates or new sections
- i18n structure extends cleanly with no breaking changes to existing code
- All copy matches official kit verbatim (no rewrites)
- Logo files (Ship For Good + Civio) confirmed available

✅ **Before Merge:**
- All visible text updated to match spec
- Language toggle works for ES / CA / EN (spot-check key sections)
- Sponsors section completely removed
- No old dates, generic text, or placeholder content remains
- Page renders correctly on desktop & mobile
- All CTAs marked as pending (href="#")

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Civio logo not available as suitable SVG | Check Civio's website; export as SVG if needed; fallback to text-only section if unavailable |
| Translation inconsistencies across languages | Use consistent terminology; review all three languages side-by-side before merge |
| CTA URLs still pending → users click to nowhere | Mark all pending CTAs with `href="#"` or `disabled` attribute; add comment in code |
| Old dates/content slip through | Systematic find-and-replace; review all sections before merge; test page content |

---

## Success Criteria

1. ✅ All visible text updated to official kit copy (Spanish)
2. ✅ Page fully functional in ES, CA, and EN
3. ✅ Logos (Ship For Good + Civio) displayed correctly
4. ✅ No placeholder or old content visible
5. ✅ Sponsors section completely removed
6. ✅ Page renders correctly on desktop and mobile
7. ✅ All CTAs marked as pending; no dead links

---

## Dependencies & Blockers

- **Civio logo:** Need to obtain from their official website (not blocking; can fallback)
- **Registration URLs:** Pending from product team (already accounted for; CTAs marked as href="#")
- **Catalan & English translations:** Derived from Spanish; no external review required

---

## Effort Estimate

**Scope:** ~8 hours of development
- Logo setup & i18n extension: ~1.5h
- Component updates & copy replacements: ~4h
- Localization (ES, CA, EN): ~1.5h
- QA & testing: ~1h

**Complexity:** Low (content/localization update; no architectural changes)
