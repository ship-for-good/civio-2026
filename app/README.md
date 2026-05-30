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

## Authentication flow

The login screen supports **email + password** authentication with two modes:

- **Login** — enter your email and password and click "Entrar".
- **Sign up** — switch to sign-up mode, enter your email and password and click "Crear cuenta". If email confirmation is enabled in your Supabase project, a confirmation email will be sent before access is granted.

To manage users: **Supabase → Authentication → Users → Invite user** (or users can self-register from the login screen).

---

## Loading data

The app ships with Civio's dataset embedded (`src/data/csvData.js`). To load an updated CSV:

- **Drag and drop** a `.csv` file anywhere on the screen, or
- Use the upload button in the header.

The CSV must follow the format of `Solicitudes_anonimizado.csv` (columns: `Id`, `Ámbito`, `Fecha`, `Estado`, `Asunto`, `Ministerio`, `Vencimiento`, `Resolución`, `Reclamación`, etc.).

---

## Main technologies

| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI and state |
| Vite | 6 | Build tool and dev server |
| Supabase JS | 2 | Authentication (email + password) |
