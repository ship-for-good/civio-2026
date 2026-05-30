# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A hackathon project built during **Ship for Good 2026** (May 29–30, Barcelona) for **Civio**, an independent journalism foundation. The challenge is to improve Civio's ability to access, monitor, and manage public information — reducing manual administrative work and increasing investigative coverage.

The team branch is `team-IT_Power`. Work stays on this branch; never commit to `main`.

## Current app

A React + Vite single-page application ("Tracker de Solicitudes de Transparencia") located in `app/`. It requires Node.js and a Supabase project for authentication.

**Tech stack:** React 18, Vite 6, Supabase (`@supabase/supabase-js`)

**Key components (`app/src/`):**
- `App.jsx` — root component; wires auth guard, CSV state, drag-and-drop, filters, and sort
- `components/LoginPage.jsx` — magic-link login form (Supabase OTP)
- `components/Header.jsx` — top bar with CSV file-input loader
- `components/StatsBar.jsx` — summary counts by urgency/estado
- `components/DigestSection.jsx` — daily digest: silencio administrativo, reclamadas ante CTBG, contencioso
- `components/FiltersBar.jsx` — filter controls (estado, autor, ámbito, urgencia, free text)
- `components/RequestsTable.jsx` — sortable table of all requests
- `components/Toast.jsx` — ephemeral notification
- `contexts/AuthContext.jsx` — Supabase session provider (`useAuth` hook)
- `lib/supabase.js` — Supabase client (reads `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- `utils/urgency.js` — `enrichRequests` / `computeUrgency` logic
- `utils/csv.js` — CSV parser
- `utils/dates.js` — date helpers
- `data/csvData.js` — bundled CSV dataset (`CSV_RAW`)

**Auth flow:** unauthenticated users see `LoginPage`; they enter an email and receive a magic link (Supabase OTP). On click, Supabase redirects back to the app and the session is set.

**To run locally:** see `app/README.md`.

## Data

`Solicitudes_anonimizado.csv` (and `Datos/Solicitudes_anonimizado.csv`) — the real dataset of Civio's transparency requests (22 rows). CSV columns: `Id`, `Ámbito`, `Fecha`, `Estado`, `Asunto`, `Ministerio`, `Inicio tramitación`, `Art 20.1 (volumen)`, `Vencimiento normal`, `Vencimiento 20.1`, `Vencimiento`, `Resolución`, `Notificación`, `Días para respuesta`, `Días para reclamar por silencio administrativo`, `Días para reclamar resolución`, `Notas`, `Autor`, `Reclamación`.

Key domain concepts:
- **Silencio administrativo** — when the response deadline (`Vencimiento`) passes without a resolution, Civio has ~30 days (`CLAIM_WINDOW_DAYS`) to file a claim with the CTBG.
- **CTBG** — Consejo de Transparencia y Buen Gobierno, the oversight body for transparency claims.
- **Estados**: `En tramitación` (active, response pending), `Reclamada` (claim filed with CTBG), `Contencioso` (judicial proceedings), `Resuelta` (resolved).

## Civio AI policy (non-negotiable constraints)

**Vetado (forbidden):** generating journalistic text, legal claims/resources, images; acting as an information source for investigations; communicating directly with readers or partners.

**Permitido (allowed):** format conversion and data cleaning (PDF → CSV, normalisation), local interview transcription, programming assistance, internal management automation, exploratory queries on their own databases.

## Submission

- Deadline: **Saturday May 30th at 19:00** — all work pushed to `team-IT_Power`
- Demo format: 3 minutes demo + 3 minutes jury feedback
- The project must be working (deployed or running locally), not a mockup
- README on the branch must describe: team/project name, problem solved, prerequisites, setup instructions, env vars, main technologies

## Git conventions

Conventional Commits recommended: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`. Push to `team-IT_Power` with `git push origin team-IT_Power`.
