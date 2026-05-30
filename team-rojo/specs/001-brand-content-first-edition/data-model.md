# Data Model: Brand & Content — 1st Edition

**Date:** 2026-04-10

---

## Overview

This is a **content and localization feature** with no database, API, or data structure changes. The "data model" consists of:

1. **i18n Message Files** — all visible text organized by language
2. **Component Props** — configuration for dates, locations, links
3. **Asset References** — logo paths and alt text

---

## i18n Message Structure

### File: `src/messages/es.json` (Spanish - Source)

```json
{
  "metadata": {
    "title": "Ship For Good — 1ª Edición",
    "description": "Devs, Product Managers y Designers trabajando juntos para crear soluciones reales. 29–30 de mayo de 2026 en 42 Barcelona."
  },
  "navbar": {
    "logo_alt": "Ship For Good",
    "language": "Idioma"
  },
  "hero": {
    "headline": "No es otra hackathon. Es la primera que se construye para quien de verdad lo necesita.",
    "subheadline": "Devs, Product Managers y Designers trabajando juntos para crear soluciones reales para equipos con impacto. Sin premios. Sin humo. Solo impacto.",
    "tagline": "think · build · help",
    "tags": "product · IA · people",
    "cta": "Quiero construir algo que se use →"
  },
  "info_bar": {
    "dates": "29–30 de mayo de 2026",
    "location": "42 Barcelona",
    "day1_time": "18:00–21:00",
    "day2_time": "9:00–21:00"
  },
  "schedule": {
    "day1_title": "Viernes 29 de mayo",
    "day1_description": "Los retos en vivo. Se forman equipos. Primeras soluciones. Networking.",
    "day2_title": "Sábado 30 de mayo",
    "day2_description": "Día completo de trabajo. Charlas paralelas por perfil. Mentoring. Showcase final."
  },
  "civio_section": {
    "title": "Partner: Fundación Civio",
    "description": "Fundación Civio es una fundación independiente que vela por el poder público, combate la opacidad institucional y utiliza el periodismo, la tecnología y los datos abiertos para dar a los ciudadanos acceso a información.",
    "quote": "Los retos que trabajaremos son suyos. El impacto, de todos."
  },
  "how_it_works": {
    "title": "¿Qué obtienes?",
    "benefits": [
      "Trabajo con impacto real, no es un ejercicio.",
      "Product + IA + people — métricas reales, desarrollo de producto asistido por IA.",
      "Charlas específicas para devs, PMs y diseñadores.",
      "Mentoring durante el evento.",
      "Showcase de soluciones ambiciosas construidas con IA.",
      "Comunidad de personas que quieren construir cosas que importen."
    ]
  },
  "who_for": {
    "title": "¿Para quién es?",
    "description": "Para desarrolladores, product managers y diseñadores. No importa tu experiencia, lo que importa es tu actitud. think · build · help"
  },
  "faq": [
    {
      "question": "¿Necesito venir con un equipo?",
      "answer": "No. Puedes formar uno el viernes."
    },
    {
      "question": "¿Hay premios?",
      "answer": "No. El premio es que lo que construyas se use de verdad."
    },
    {
      "question": "¿Necesito experiencia en hackathons?",
      "answer": "No."
    },
    {
      "question": "¿Qué pasa con lo que construimos?",
      "answer": "El objetivo es que las soluciones tengan vida más allá del evento."
    },
    {
      "question": "¿Es gratis?",
      "answer": "Sí."
    },
    {
      "question": "¿Necesito asistir los dos días?",
      "answer": "Idealmente sí."
    }
  ],
  "footer": {
    "tagline": "think · build · help",
    "closing": "Lo que hagas aquí puede cambiar algo de verdad.",
    "year": "2026",
    "venue": "42 Barcelona",
    "register_cta": "Quiero registrarme →"
  }
}
```

### File: `src/messages/ca.json` (Catalan - Derived from Spanish)

Structure identical to `es.json`; values translated to Catalan.

Example:
```json
{
  "hero": {
    "headline": "No és una altra hackathon. És la primera que es construeix per a qui realment ho necessita.",
    "subheadline": "Devs, Product Managers i Designers treballant junts per crear solucions reals per a equips amb impacte. Sense premis. Sense fum. Només impacte.",
    ...
  },
  ...
}
```

### File: `src/messages/en.json` (English - Derived from Spanish)

Structure identical to `es.json`; values translated to English.

Example:
```json
{
  "hero": {
    "headline": "It's not another hackathon. It's the first one built for those who truly need it.",
    "subheadline": "Devs, Product Managers and Designers working together to create real solutions for teams with impact. No prizes. No hype. Only impact.",
    ...
  },
  ...
}
```

---

## Component Props & Configuration

### Logo Configuration

```typescript
// src/components/navbar.tsx
interface LogoProps {
  src: string; // "/logo.svg" or "/civio-logo.svg"
  alt: string; // From i18n messages
  width: number;
  height: number;
}
```

**Assets:**
- `public/logo.svg` — Ship For Good official logo (provided by user)
- `public/civio-logo.svg` — Fundación Civio logo (from their website)

### Locale Configuration

```typescript
// src/i18n/routing.ts
export const routing = defineRouting({
  locales: ["es", "ca", "en"], // Added "en"
  defaultLocale: "es",
  localePrefix: "always",
  localeDetection: true,
});
```

### Schedule Configuration

No new database table needed. Schedule data embedded in component or i18n:

```typescript
// src/components/schedule.tsx
interface ScheduleDay {
  date: string; // "29 de mayo de 2026" (from i18n)
  day: "Friday" | "Saturday"; // (from i18n)
  timeRange: string; // "18:00–21:00" or "9:00–17:00" (from i18n)
  description: string; // (from i18n)
}
```

---

## Content Entities (i18n Keys)

All visible content is stored in `messages/*.json` with the following structure:

| Entity | Keys | Type | Source |
|--------|------|------|--------|
| Navbar | `navbar.logo_alt`, `navbar.language` | String | Kit |
| Hero | `hero.headline`, `hero.subheadline`, `hero.tagline`, `hero.tags`, `hero.cta` | String/Array | Kit |
| Info Bar | `info_bar.*` (dates, location, times) | String | Kit |
| Schedule | `schedule.day1_*`, `schedule.day2_*` | String | Kit |
| Civio Section | `civio_section.*` (title, description, quote) | String | Kit |
| How It Works | `how_it_works.benefits` | Array[String] | Kit |
| Who For | `who_for.*` (title, description) | String | Kit |
| FAQ | `faq[*]` (question, answer pairs) | Array[Object] | Kit |
| Footer | `footer.*` (tagline, closing, year, venue, CTA) | String | Kit |

---

## Localization Rules

1. **Key Consistency:** Same key used in all three message files (es.json, ca.json, en.json)
2. **No Rewrites:** All copy taken directly from official kit; no paraphrasing
3. **Markup in Keys:** HTML/JSX markup kept minimal; most formatting in CSS
4. **Pluralization:** Not applicable for this feature (no dynamic pluralization)
5. **Date/Time Format:** Hardcoded as strings (e.g., "29–30 de mayo de 2026") — no i18n date formatting needed

---

## Asset References

### Logo Assets

| Asset | Path | Format | Size | Alt Text Key |
|-------|------|--------|------|--------------|
| Ship For Good Logo | `public/logo.svg` | SVG | User-provided | `navbar.logo_alt` → "Ship For Good" |
| Civio Logo | `public/civio-logo.svg` | SVG | From civio.es | `civio_section.logo_alt` → "Fundación Civio" |

### Usage in Components

```jsx
// navbar.tsx
import { useTranslations } from 'next-intl';

export default function Navbar() {
  const t = useTranslations();
  return (
    <nav>
      <img src="/logo.svg" alt={t('navbar.logo_alt')} width={200} height={60} />
      {/* language toggle: ES / CA / EN */}
    </nav>
  );
}

// civio-section.tsx
<section>
  <img src="/civio-logo.svg" alt="Fundación Civio" width={150} height={150} />
  <h2>{t('civio_section.title')}</h2>
  <p>{t('civio_section.description')}</p>
  <blockquote>{t('civio_section.quote')}</blockquote>
</section>
```

---

## No Database or API Changes

This feature introduces **zero** changes to:
- Database schema
- API endpoints
- Data persistence
- Server-side logic
- Authentication/Authorization

All changes are **frontend/content only**.

---

## Validation & Constraints

### Acceptance Criteria (from Spec)

1. ✅ All visible text matches official kit copy (no rewrites)
2. ✅ Page fully readable in ES, CA, EN (via language toggle)
3. ✅ Logos (Ship For Good + Civio) displayed correctly with alt text
4. ✅ No placeholder or old content visible (all replaced)
5. ✅ Sponsors section removed (component deleted)
6. ✅ Page renders on desktop and mobile
7. ✅ Pending CTAs marked with `href="#"` and code comments

### Consistency Rules

- ✅ Same terminology used across all three languages (build glossary while translating)
- ✅ All visible text extracted to message files (no hardcoded strings in components)
- ✅ Logo paths consistent across components (`/logo.svg`, `/civio-logo.svg`)
- ✅ Dates/locations/times consistent across all sections (info bar, schedule, footer)

### Edge Cases

1. **Missing Translation:** Default to English fallback (next-intl standard behavior)
2. **Logo Not Found:** Page still renders; user sees broken image icon (acceptable fallback)
3. **Language Toggle:** All major sections update when language is switched (test required)

---

## Effort Breakdown

| Task | Effort |
|------|--------|
| Create i18n files (es.json, ca.json, en.json) | ~1.5h |
| Update components (hero, navbar, schedule, footer, etc.) | ~3.5h |
| Add Civio section (new component) | ~1h |
| Remove sponsors section | ~0.5h |
| Testing & QA | ~1h |
| **Total** | **~7.5h** |

---

## Dependencies

- **next-intl** — already in project; no version change needed
- **Civio logo** — external dependency (download from website)
- **Ship For Good logo** — provided by user

---

## Success Metrics

- ✅ All 11 user stories satisfied
- ✅ Page renders without errors in all three languages
- ✅ Language toggle works (ES / CA / EN)
- ✅ All old content replaced with kit copy
- ✅ No broken links (CTAs marked as pending)
- ✅ Desktop and mobile layouts render correctly
