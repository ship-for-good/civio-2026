# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## What this project is

A hackathon project built during **Ship for Good 2026** (May 29–30, Barcelona) for **Civio**, an independent journalism foundation. The goal: reduce manual admin work on transparency-request monitoring.

**Branch:** `team-IT_Power`. Never commit to `main`.  
**Deadline:** Saturday May 30th at 19:00 — push to `team-IT_Power`.

## App

React + Vite + TypeScript SPA ("Tracker de Solicitudes de Transparencia") in `app/`.

**Tech stack:** React 18, Vite 6, TypeScript 6, Supabase (`@supabase/supabase-js`), Vitest

**Run locally:** `cd app && npm install && npm run dev` — needs `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### Key source files (`app/src/`)

| File | Role |
|------|------|
| `App.tsx` | Root: auth guard, CSV state, drag-and-drop, filters, sort, Supabase merge on load |
| `components/LoginPage.tsx` | Magic-link login (Supabase OTP) |
| `components/Header.tsx` | Top bar: CSV file-input + "Nuevo expediente" button |
| `components/StatsBar.tsx` | Summary counts by urgency/estado |
| `components/DigestSection.tsx` | Daily digest: silencio administrativo, reclamadas, contencioso |
| `components/FiltersBar.tsx` | Filter controls (estado, autor, ámbito, urgencia, free text) |
| `components/RequestsTable.tsx` | Sortable table of all requests |
| `components/NewExpedienteModal.tsx` | Modal to create a new expediente with file attachments |
| `components/Toast.tsx` | Ephemeral notification |
| `contexts/AuthContext.tsx` | Supabase session provider (`useAuth` hook) |
| `lib/supabase.ts` | Supabase client |
| `lib/expedientesRepo.ts` | Supabase DB/storage: `fetchExpedientes`, `insertExpediente`, `uploadAttachments` |
| `utils/urgency.ts` | `enrichRequests` / `computeUrgency` |
| `utils/expediente.ts` | `buildExpediente`, `validateExpediente`, `mergeById`, `slugifyFilename` |
| `utils/csv.ts` | CSV parser |
| `utils/dates.ts` | Date helpers (`TODAY`, `toISODate`) |
| `data/csvData.ts` | Bundled CSV dataset (`CSV_RAW`) |

### Data flow

1. On mount, `App` loads the bundled CSV (`CSV_RAW`) as the initial state.
2. Then fetches from Supabase `expedientes` table and merges via `mergeById` (Supabase rows override CSV by `Id`; Supabase-only rows are prepended).
3. Users can also drag-and-drop or load a new CSV file.
4. New expedientes are created via `NewExpedienteModal` → `insertExpediente` (Supabase) + optional file upload to `expediente-adjuntos` storage bucket.

### Auth flow

Unauthenticated users see `LoginPage`. They enter an email → receive a magic link (Supabase OTP) → redirected back → session set.

## Data

`Solicitudes_anonimizado.csv` — 22 real Civio transparency requests.

CSV columns: `Id`, `Ámbito`, `Fecha`, `Estado`, `Asunto`, `Ministerio`, `Inicio tramitación`, `Art 20.1 (volumen)`, `Vencimiento normal`, `Vencimiento 20.1`, `Vencimiento`, `Resolución`, `Notificación`, `Días para respuesta`, `Días para reclamar por silencio administrativo`, `Días para reclamar resolución`, `Notas`, `Autor`, `Reclamación`.

Key domain concepts:
- **Silencio administrativo** — response deadline (`Vencimiento`) passed with no resolution; Civio has ~30 days (`CLAIM_WINDOW_DAYS`) to file with CTBG.
- **CTBG** — Consejo de Transparencia y Buen Gobierno, the oversight body.
- **Estados**: `En tramitación`, `Reclamada`, `Contencioso`, `Resuelta`.

## Tests

`npm test` runs Vitest. Unit tests exist for `utils/dates.ts` and `utils/expediente.ts`.

## Civio AI policy (non-negotiable)

**Forbidden:** generating journalistic text, legal claims, images; acting as an information source for investigations; communicating directly with readers or partners.

**Allowed:** format conversion/data cleaning, programming assistance, internal management automation, exploratory queries on their own databases.

## Git conventions

Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`. Push with `git push origin team-IT_Power`.
