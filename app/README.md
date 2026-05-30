# Civio · Tracker de Solicitudes de Transparencia

Herramienta interna para que el equipo de Civio monitorice, filtre y gestione sus solicitudes de acceso a la información pública, automatizando el seguimiento de plazos (silencio administrativo, reclamaciones ante el CTBG, contencioso-administrativo).

---

## Requisitos

- Node.js ≥ 18
- npm ≥ 9
- Un proyecto en [Supabase](https://supabase.com) con autenticación por magic link habilitada

---

## Variables de entorno

Crea un archivo `.env.local` en la carpeta `app/` con:

```
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
```

Ambos valores están en **Supabase → Project Settings → API**.

---

## Instalación y arranque en local

```bash
# Desde la carpeta app/
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173`.

---

## Build para producción

```bash
npm run build     # genera dist/
npm run preview   # sirve el build localmente para verificarlo
```

---

## Flujo de autenticación

1. El usuario introduce su correo en la pantalla de login.
2. Supabase envía un magic link al correo.
3. Al hacer clic en el enlace, Supabase redirige de vuelta a la app y la sesión queda activa.

Solo cuentas registradas en Supabase pueden acceder. Para añadir usuarios: **Supabase → Authentication → Users → Invite user**.

---

## Cargar datos

La app incluye el dataset de Civio embebido (`src/data/csvData.js`). Para cargar un CSV actualizado:

- **Arrastrar y soltar** el archivo `.csv` sobre cualquier parte de la pantalla, o
- Usar el botón de carga en la cabecera.

El CSV debe seguir el formato de `Solicitudes_anonimizado.csv` (columnas: `Id`, `Ámbito`, `Fecha`, `Estado`, `Asunto`, `Ministerio`, `Vencimiento`, `Resolución`, `Reclamación`, etc.).

---

## Tecnologías principales

| Tecnología | Versión | Uso |
|---|---|---|
| React | 18 | UI y estado |
| Vite | 6 | Build y dev server |
| Supabase JS | 2 | Autenticación (magic link) |
