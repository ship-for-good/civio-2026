# Tasks: Brand & Content — 1st Edition

**Branch:** `001-brand-content-first-edition`
**Generated:** 2026-04-10

---

## Summary

- **Total tasks:** 22
- **Phases:** 8 (Setup · Foundational · 5 Story phases · Polish)
- **Parallelizable tasks:** marked with `[P]`

---

## Dependencies

```
Phase 1 (Setup)
  └─► Phase 2 (Foundational — i18n files)
        └─► Phases 3–7 (User Stories — can run in parallel)
              └─► Phase 8 (Polish)
```

---

## Phase 1 — Setup

> Project initialization: logos and i18n wiring before any component work.

- [x] T001 Add `"en"` to `locales` array in `src/i18n/routing.ts`
- [x] T002 Save official Ship For Good logo SVG (provided by user) to `public/logo.svg`
- [x] T003 Download Civio official logo SVG from civio.es and save to `public/civio-logo.svg`

---

## Phase 2 — Foundational (i18n Message Files)

> All components depend on these files. Must complete before starting story phases.

Depends on: Phase 1

- [x] T004 Update `src/messages/es.json` with full official kit content — keys: `navbar`, `hero`, `info_bar`, `schedule`, `civio_section`, `how_it_works`, `who_for`, `faq`, `footer`
- [x] T005 [P] Create `src/messages/ca.json` with Catalan translations matching structure of `es.json`
- [x] T006 [P] Create `src/messages/en.json` with English translations matching structure of `es.json`

---

## Phase 3 — US-01 + US-09: Navbar (Logo + Language Toggle)

> Navbar needs both logo (US-01) and language toggle (US-09) updated together — same file.

Depends on: T001, T002, T004, T005, T006

- [x] T007 [US1] Update `src/components/navbar.tsx` to display Ship For Good logo (`/logo.svg`) with alt text from `navbar.logo_alt`
- [x] T008 [US9] Update language toggle in `src/components/navbar.tsx` from ES/CA to ES/CA/EN

---

## Phase 4 — US-02 + US-03: Hero + Info Bar

> Hero copy and event dates/location — independent components, can run in parallel.

Depends on: T004, T005, T006

- [x] T009 [P] [US2] Update `src/components/hero.tsx` with headline, subheadline, tagline (`think · build · help`), tags (`product · IA · people`), and CTA button reading `hero.cta` with `href="#"`
- [x] T010 [P] [US3] Update `src/components/info-bar.tsx` with dates, location, day1_time, and day2_time from `info_bar.*` i18n keys

---

## Phase 5 — US-04 + US-05: Schedule + Civio Section

> Schedule content update and new Civio partner section.

Depends on: T004, T005, T006

- [x] T011 [P] [US4] Update `src/components/schedule.tsx` with Day 1 (Viernes 29 mayo, 18:00–21:00) and Day 2 (Sábado 30 mayo, 9:00–17:00) using `schedule.*` i18n keys
- [x] T012 [P] [US5] Create new component `src/components/civio-section.tsx` displaying Civio logo (`/civio-logo.svg`), title, description, and quote from `civio_section.*` i18n keys
- [x] T013 [US5] Add `<CivioSection />` import and render in `src/app/[locale]/page.tsx` (after schedule section)

---

## Phase 6 — US-06 + US-07: How It Works + Who It's For

> Both user stories live in the same component.

Depends on: T004, T005, T006

- [x] T014 [US6] Update `src/components/how-it-works.tsx` to render 6 benefits from `how_it_works.benefits` array
- [x] T015 [US7] Add "Who is it for?" block to `src/components/how-it-works.tsx` using `who_for.title` and `who_for.description` (includes tagline `think · build · help`)

---

## Phase 7 — US-08 + US-10 + US-11: FAQ + Sponsors Removal + Footer

> Three independent stories, all components separate — all parallelizable.

Depends on: T004, T005, T006

- [x] T016 [P] [US8] Update `src/components/faq.tsx` to render 6 Q&A pairs from `faq` array in i18n messages
- [x] T017 [P] [US10] Remove `Sponsors` import and `<Sponsors />` usage from `src/app/[locale]/page.tsx`
- [x] T018 [P] [US10] Delete file `src/components/sponsors.tsx`
- [x] T019 [P] [US11] Update `src/components/footer.tsx` with tagline, closing copy, register CTA (`href="#"`), year (2026), and venue (42 Barcelona) using `footer.*` i18n keys

---

## Phase 8 — Polish & Quality

> Cross-cutting verification. Run after all story phases are complete.

Depends on: All previous phases

- [x] T020 Search codebase for leftover placeholder content (`"abril"`, `"2025"`, `"Tu logo"`, generic NGO text) and confirm all replaced
- [ ] T021 [P] Visual review of full page on desktop and mobile for all three languages (ES / CA / EN)
- [ ] T022 [P] Verify language toggle correctly switches content across all sections (hero, info bar, schedule, Civio, FAQ, footer)

---

## Parallel Execution Examples

**After Phase 2 completes, these can run in parallel:**

```
Worker A: T007 → T008 (Navbar)
Worker B: T009 → T010 (Hero + Info Bar)
Worker C: T011 → T012 → T013 (Schedule + Civio)
Worker D: T014 → T015 (How It Works)
Worker E: T016 + T017 + T018 + T019 (FAQ, Sponsors, Footer)
```

**Final sync:** T020 → T021 + T022 (can run in parallel)
