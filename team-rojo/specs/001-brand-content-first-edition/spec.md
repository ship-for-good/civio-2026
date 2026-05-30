# Spec: Brand & Content — 1st Edition

**Branch:** `001-brand-content-first-edition`
**Created:** 2026-04-10
**Status:** Draft

---

## Goal

Update the Ship For Good website so that all visible content — texts, logos, dates, and language options — reflect the official 1st edition of the event. Visitors should land on a page that accurately represents Ship For Good 1ª Edición, including the partnership with Fundación Civio, the official tagline, and the correct event dates.

---

## Background

The current website is a fork of a generic base template. It contains placeholder content (incorrect dates, generic NGO references, no official logo, no Civio branding) and is missing English as a supported language. This feature brings the site up to date with the official communication kit before the event is publicly promoted.

---

## User Stories

### US-01 — Visitor sees the official logo

**As a** website visitor,
**I want to** see the official Ship For Good logo in the navigation bar and page header,
**So that** I immediately recognise the event brand.

**Acceptance Criteria:**
- The Ship For Good logo (golden heart + sparkles + "shipforgood" wordmark) appears in the navbar.
- The logo is legible and correctly proportioned on desktop and mobile.
- The page tab/title bar shows a relevant page title for the event.

---

### US-02 — Visitor reads the correct hero copy

**As a** potential participant,
**I want to** read a clear headline and description that accurately explains what Ship For Good is,
**So that** I understand why this event is different and feel compelled to register.

**Acceptance Criteria:**
- The hero headline reads: *"No es otra hackathon. Es la primera que se construye para quien de verdad lo necesita."*
- The subheadline reads: *"Devs, Product Managers y Designers trabajando juntos para crear soluciones reales para equipos con impacto. Sin premios. Sin humo. Solo impacto."*
- The tagline `think · build · help` and tags `product · IA · people` are visible in the hero.
- The primary CTA reads: *"Quiero construir algo que se use →"*
- The CTA is present but its destination URL is marked as pending (not yet active).

---

### US-03 — Visitor sees the correct event dates and location

**As a** potential participant,
**I want to** immediately see when and where the event takes place,
**So that** I can plan my attendance.

**Acceptance Criteria:**
- The event dates shown are **29–30 de mayo de 2026**.
- The location shown is **42 Barcelona**.
- Dates and location appear in the info bar and are consistent across all sections (schedule, footer, metadata).
- Day 1 (Friday 29 May) is described as an evening session: **18:00–21:00**.
- Day 2 (Saturday 30 May) is described as a full day: **9:00–17:00**.

---

### US-04 — Visitor understands the schedule

**As a** potential participant,
**I want to** see what will happen each day,
**So that** I know what to expect and can decide if I want to attend both days.

**Acceptance Criteria:**

**Day 1 — Friday 29 May (18:00–21:00):**
- Civio presents real problems to work on.
- Teams are formed (attendees can bring a team or join one).
- First solutions are sketched.
- Ends with networking and drinks.

**Day 2 — Saturday 30 May (9:00–17:00):**
- Full-day work session: dev, design, and product all running in parallel.
- Profile-specific talks (dev, PM, design) throughout the day.
- Continuous mentoring to unblock and advance.
- Ends with a showcase of the most ambitious AI-powered product solutions built during the event.

---

### US-05 — Visitor learns about Fundación Civio

**As a** potential participant,
**I want to** understand who Fundación Civio is and why they are the partner for this edition,
**So that** I understand the context and impact of the challenges I'll be working on.

**Acceptance Criteria:**
- A dedicated section or block presents Civio as the partner organisation for this edition.
- The description communicates that Civio is an independent foundation that monitors public power, fights institutional opacity, and uses journalism, technology, and open data to give citizens access to information.
- The Civio logo is visible alongside or within this section.
- The copy matches the official kit: *"Los retos que trabajaremos son suyos. El impacto, de todos."*

---

### US-06 — Visitor understands the value proposition

**As a** developer, PM, or designer considering attendance,
**I want to** see a clear "What's in it for me" section,
**So that** I understand what I will gain by participating.

**Acceptance Criteria:**

The "What you get" section includes all six benefits from the kit:
1. Real-impact work — not an exercise.
2. Product + AI + people — real metrics, AI-assisted product development.
3. Profile-specific talks — content for devs, PMs, and designers.
4. Mentoring during the event.
5. Showcase of ambitious AI-built solutions.
6. Community of people who want to build things that matter.

---

### US-07 — Visitor understands who the event is for

**As a** potential participant,
**I want to** quickly confirm the event is relevant to my profile,
**So that** I don't waste time reading if it's not for me.

**Acceptance Criteria:**
- A "Who is it for?" section explicitly targets developers, product managers, and designers.
- The copy communicates that experience level doesn't matter — attitude does.
- The tagline `think · build · help` is present in this section.

---

### US-08 — Visitor reads the updated FAQ

**As a** potential participant,
**I want to** find answers to common questions in the FAQ,
**So that** I can resolve doubts before registering.

**Acceptance Criteria:**

The FAQ includes answers to the following questions (content from kit):
1. Do I need to come with a team? → No, you can form one on Friday.
2. Are there prizes? → No. The prize is that what you build actually gets used.
3. Do I need prior hackathon experience? → No.
4. What happens to what we build? → The goal is that solutions have life beyond the event.
5. Is it free? → Yes.
6. Do I need to attend both days? → Ideally yes.

---

### US-09 — Visitor can read the site in Spanish, Catalan, or English

**As a** visitor who prefers Spanish, Catalan, or English,
**I want to** switch the site language,
**So that** I can read all content in my preferred language.

**Acceptance Criteria:**
- A language toggle is visible in the navbar.
- The toggle offers three options: ES / CA / EN.
- All page content (hero, info bar, schedule, FAQ, footer) updates when a language is selected.
- The English version contains accurate translations of all official Spanish copy.
- The Catalan version contains accurate translations of all official Spanish copy.

---

### US-10 — Visitor does not see a sponsors section

**As a** visitor,
**I want to** see a clean, focused page,
**So that** I'm not confused by empty placeholder sponsor logos.

**Acceptance Criteria:**
- The sponsors section is not present on the page.
- No placeholder "Tu logo aquí" boxes appear.

---

### US-11 — Visitor sees the correct footer

**As a** visitor scrolling to the bottom,
**I want to** see a closing CTA with the event tagline and registration button,
**So that** I can register after reading the full page.

**Acceptance Criteria:**
- The footer includes the tagline `think · build · help`.
- The footer copy: *"Lo que hagas aquí puede cambiar algo de verdad."*
- A register CTA button is present (URL pending, href="#").
- The footer shows the correct year (2026) and venue (42 Barcelona).

---

## Out of Scope

- Connecting registration CTAs to a real URL (pending — separate task).
- Building new page sections not present in the current site.
- Changing the visual design system (colors, typography, layout structure).
- Any backend, form, or database work.
- Social media post publishing.

---

## Assumptions

- The official logo SVG provided by the user is final and approved for production use.
- Civio's logo is available on their public website in a format suitable for web use.
- The Catalan and English translations will be created by the development team based on the official Spanish kit — no separate translation review process is required before launch.
- The 42 Barcelona venue remains "edificio Telefónica" as in the current site.
- Specific schedule time slots for Day 1 and Day 2 beyond the start/end times will be inferred from the kit description and can be refined later.

---

## Success Criteria

1. All visible text on the page matches the official 1st edition communication kit.
2. The correct event dates (29–30 May 2026) appear consistently in every section.
3. Fundación Civio is presented as the partner organisation with their logo visible.
4. The page is fully readable in Spanish, Catalan, and English via the language toggle.
5. No placeholder or template content remains on the page (no "Tu logo aquí", no April 2025 dates, no generic NGO references).
6. The sponsors section does not appear on any language version of the page.
7. The official Ship For Good logo replaces any previous placeholder in the navbar.
