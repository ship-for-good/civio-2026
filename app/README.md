# Civio · Transparency Request Tracker

Internal tool for the Civio team to monitor, filter, and manage public information requests, automating deadline tracking (administrative silence, CTBG claims, judicial proceedings).

---

## Requirements

- Node.js ≥ 18
- npm ≥ 9
- A [Supabase](https://supabase.com) project with email/password authentication enabled

---

## Environment variables

Create a `.env.local` file inside the `app/` folder:

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
```

Both values are available at **Supabase → Project Settings → API**.

---

## Local setup

```bash
# From the app/ folder
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Production build

```bash
npm run build     # outputs to dist/
npm run preview   # serves the build locally for verification
```

---

## Tests

```bash
npm test
```

---

## Authentication flow

The login screen supports **email + password** authentication:

- **Login** — enter your email and password and click "Entrar".
- **Sign up** — switch to sign-up mode, enter your email and password and click "Crear cuenta". If email confirmation is enabled in your Supabase project, a confirmation email will be sent before access is granted.

To manage users: **Supabase → Authentication → Users → Invite user**.

---

## Loading data

The app ships with Civio's dataset embedded (`src/data/csvData.ts`). To load an updated CSV:

- **Drag and drop** a `.csv` file anywhere on the screen, or
- Use the upload button in the header.

The CSV must follow the format of `Solicitudes_anonimizado.csv` (columns: `Id`, `Ámbito`, `Fecha`, `Estado`, `Asunto`, `Ministerio`, `Vencimiento`, `Resolución`, `Reclamación`, etc.).

On load, the app fetches rows from the Supabase `expedientes` table and merges them with the CSV (Supabase rows take precedence by `Id`; Supabase-only rows are prepended).

---

## Supabase schema

Table: **`expedientes`** — stores manually created or edited requests.  
Storage bucket: **`expediente-adjuntos`** — stores file attachments uploaded via the new-expediente modal.

---

## Main technologies

| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI and state |
| Vite | 6 | Build tool and dev server |
| TypeScript | 6 | Static typing |
| Supabase JS | 2 | Auth, database, and file storage |
| Vitest | 4 | Unit tests |
