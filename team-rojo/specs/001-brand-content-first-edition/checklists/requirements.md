# Specification Quality Checklist: Brand & Content — 1st Edition

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-04-10
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- All [NEEDS CLARIFICATION] items resolved via gathered context (product clarifications answered by user before spec was written)
- Technical decisions extracted to `technical-context.md` — not in the spec
- Registration URLs intentionally left as pending (confirmed by user)

---

# Pre-Build Requirements Quality Checklist

**Purpose**: Validate that spec, plan, and tasks are complete and unambiguous enough to implement without PM involvement
**Created**: 2026-04-10
**Phase**: Post-plan · Post-tasks · Pre-implementation

---

## Requirement Completeness

- [x] CHK001 Are requirements defined for all 11 user stories (US-01 to US-11) — none missing or underspecified? [Completeness, Spec §User Stories] — spec.md define US-01 a US-11 con ACs completos
- [x] CHK002 Are all 9 i18n message namespaces (`navbar`, `hero`, `info_bar`, `schedule`, `civio_section`, `how_it_works`, `who_for`, `faq`, `footer`) fully specified in data-model.md? [Completeness, data-model.md] — todos los namespaces con claves y valores definidos
- [x] CHK003 Are the page `<title>` and meta description copy requirements specified? [Gap resuelto, Spec §US-01] — `metadata.title = "Ship For Good — 1ª Edición"` añadido a data-model.md
- [x] CHK004 Are requirements for the new `civio-section.tsx` complete — logo, title, description, quote, and its position in the page layout? [Completeness, Spec §US-05] — logo, textos y posición (después de schedule) definidos en spec + data-model + tasks T013
- [x] CHK005 Are all 6 benefit strings for the "What you get" section (US-06) explicitly provided in the data model? [Completeness, Spec §US-06] — `how_it_works.benefits` array con los 6 ítems en data-model.md

## Requirement Clarity

- [x] CHK006 Is "legible and correctly proportioned" (US-01 logo AC) quantified? [Claridad aceptable] — SVG tiene proporciones intrínsecas; revisión visual durante QA es suficiente para una actualización de contenido
- [x] CHK007 Is "accurate translations" (US-09 EN/CA ACs) defined — who determines accuracy? [Clarity, Spec §US-09] — spec §Assumptions confirma que el equipo de desarrollo las crea sin revisión externa; confirmado por el PM en gathered-context
- [x] CHK008 Is "consistent across all sections" (US-03 dates) mapped to specific sections? [Clarity, Spec §US-03] — US-03 AC enumera explícitamente: info bar, schedule, footer y metadata
- [x] CHK009 Is it specified whether pending CTAs should look disabled or active? [Gap resuelto, Spec §US-02, US-11] — PM confirmó: botones activos normales con `href="#"` y comentario en código
- [x] CHK010 Is the exact page `<title>` copy specified? [Gap resuelto, Spec §US-01] — resuelto en CHK003: "Ship For Good — 1ª Edición"

## Requirement Consistency

- [x] CHK011 Are dates 29–30 mayo 2026 consistent across US-03, US-04, US-11, and data model? [Consistency] — verificado: US-03 AC, US-04 schedule, US-11 footer y `info_bar.dates` en data-model.md usan la misma fecha
- [x] CHK012 Is `think · build · help` consistently required in hero (US-02), who-for (US-07), and footer (US-11)? [Consistency] — los tres ACs lo mencionan explícitamente
- [x] CHK013 Is hero CTA text consistent between US-02 AC and `hero.cta` in data-model.md? [Consistency] — US-02: "Quiero construir algo que se use →" = data-model.md `hero.cta`; coinciden exactamente

## Acceptance Criteria Quality

- [x] CHK014 Can "no placeholder content remains" be objectively measured? [Gap resuelto] — lista definida: `"abril de 2025"`, `"17 de abril"`, `"18 de abril"`, `"Tu logo aquí"`, `"ONG"`, `"Barcelona, 2025"`
- [x] CHK015 Are US-09 language toggle ACs measurable — which sections must update? [Measurability, Spec §US-09] — US-09 AC enumera: hero, info bar, schedule, FAQ, footer
- [x] CHK016 Is US-10 sponsors removal AC complete — imports, JSX, and file deletion? [Completeness, Spec §US-10] — research.md §3 especifica explícitamente: eliminar import, eliminar `<Sponsors />`, borrar el archivo

## Edge Case Coverage

- [x] CHK017 Is fallback specified when `civio-logo.svg` is unavailable? [Edge Case] — research.md §2 documenta: sección solo texto como fallback aceptable; confirmado en spec §Assumptions
- [x] CHK018 Is behavior defined for missing translation keys in `ca.json` / `en.json`? [Edge Case] — next-intl usa `defaultLocale = "es"` como fallback estándar del framework; no requiere especificación adicional
- [x] CHK019 Are special characters (`·`, `→`, `–`) defined consistently? [Edge Case] — los caracteres están en data-model.md con valores verbatim; UTF-8 estándar en navegadores modernos

## Dependencies & Assumptions

- [x] CHK020 Is "no external translation review" accepted by the product owner? [Assumption] — spec §Assumptions + gathered-context confirman: PM aceptó que el equipo de desarrollo crea las traducciones sin revisión externa
- [x] CHK021 Is "42 Barcelona = Edificio Telefónica" traceable? [Assumption] — spec §Assumptions lo documenta explícitamente; es la misma sede del site base que se está actualizando
- [x] CHK022 Are all 11 user stories traceable to at least one task in tasks.md? [Traceability] — US-01→T007, US-02→T009, US-03→T010, US-04→T011, US-05→T012/T013, US-06→T014, US-07→T015, US-08→T016, US-09→T001/T005/T006/T008, US-10→T017/T018, US-11→T019

---

## Summary

**Critical gaps — RESOLVED:**
- CHK003 ✅ Page title: "Ship For Good — 1ª Edición" — added to data-model.md `metadata.title` key
- CHK009 ✅ Pending CTAs render as normal active buttons with `href="#"` and inline code comment
- CHK014 ✅ Placeholder strings to replace: `"abril de 2025"`, `"17 de abril"`, `"18 de abril"`, `"Tu logo aquí"`, `"ONG"` references, `"Barcelona, 2025"`, `"edificio Telefónica"` in old context

**Deferred (acceptable to resolve during implementation):**
- CHK006 — Logo dimensions (developer can follow visual inspection; proportions visible in SVG)
- CHK017 — Civio logo fallback (research.md already documents text-only as acceptable)
- CHK018 — next-intl fallback behavior (framework default is ES; acceptable)
