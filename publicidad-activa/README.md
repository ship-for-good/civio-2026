# Publicidad Activa (Rails)

App Rails del equipo, dentro del monorepo [civio-2026](https://github.com/ship-for-good/civio-2026) (el repositorio Git está en la raíz del repo, no dentro de esta carpeta).

**Stack:** Rails 8 · SQLite · TypeScript · Tailwind CSS · Hotwire (Turbo + Stimulus)

## Arrancar

Desde la raíz del repo:

```bash
cd publicidad-activa
bin/setup
bin/dev
```

La app queda en http://localhost:3000 (health check: `/up`).

## Estructura del monorepo

```
civio-2026/              ← repositorio Git (raíz)
├── dashboard/           ← Next.js (otro equipo/stack)
├── publicidad-activa/   ← esta app Rails
├── docs/
└── ...
```
