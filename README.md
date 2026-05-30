# Civio · Tracker de Solicitudes de Transparencia

**Team IT_Power · Ship for Good 2026**

Herramienta interna para el equipo de Civio que automatiza el seguimiento de plazos en solicitudes de información pública: silencio administrativo, reclamaciones ante el CTBG y procedimientos contenciosos.

---

## Problema que resuelve

Civio gestiona decenas de solicitudes de transparencia simultáneas, con plazos críticos y diferenciados para cada una. Hasta ahora, este seguimiento se hacía manualmente con hojas de cálculo. Esta herramienta centraliza el estado de cada expediente, calcula automáticamente la urgencia y alerta sobre los plazos que vencen próximamente.

---

## Funcionalidades principales

- **Dashboard de expedientes** — tabla ordenable y filtrable con todos los expedientes activos
- **Urgencia automática** — calcula si un expediente está en riesgo según los días restantes hasta el vencimiento
- **Digest diario** — sección resumen de silencio administrativo inminente, reclamadas y contenciosos
- **Nuevo expediente** — formulario modal con adjuntos (almacenados en Supabase Storage)
- **Edición de expedientes** — clic en fila abre modal de edición completa
- **Carga de CSV** — arrastrar y soltar o subir un `.csv` actualizado desde el header
- **Autenticación** — acceso restringido por email y contraseña (Supabase Auth)
- **Persistencia** — los expedientes creados se almacenan en Supabase y se fusionan con el CSV base al cargar

---

## Requisitos previos

- Node.js ≥ 18
- npm ≥ 9
- Proyecto en [Supabase](https://supabase.com) con autenticación por email activada

---

## Variables de entorno

Crear un archivo `.env.local` dentro de la carpeta `app/`:

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
```

Ambos valores están en **Supabase → Project Settings → API**.

---

## Instalación y arranque local

```bash
cd app
npm install
npm run dev
```

La app estará disponible en `http://localhost:5173`.

---

## Build de producción

```bash
cd app
npm run build    # genera dist/
npm run preview  # sirve el build localmente
```

---

## Tests

```bash
cd app
npm test
```

---

## Tecnologías principales

| Tecnología | Versión | Uso |
|---|---|---|
| React | 18 | UI y estado |
| Vite | 6 | Build tool y dev server |
| TypeScript | 6 | Tipado estático |
| Supabase JS | 2 | Auth, base de datos y storage |
| Vitest | 4 | Tests unitarios |

---

## Arquitectura

```
app/src/
├── components/     # UI: tabla, modales, filtros, header, digest
├── contexts/       # AuthContext (sesión Supabase)
├── lib/            # Cliente Supabase + repositorio de expedientes
├── utils/          # Lógica de urgencia, fechas, CSV, validación
└── data/           # Dataset CSV de Civio embebido
```

Los expedientes se cargan del CSV embebido al iniciar y se fusionan con los registros de Supabase (los de Supabase tienen precedencia por `Id`).

---

## Próximos pasos

- Notificaciones automáticas por email cuando un plazo se acerca
- Historial de cambios por expediente
- Exportación filtrada a CSV
- Integración con el portal de transparencia para importar solicitudes automáticamente

---
---

# Ship for Good · 1st Edition

think · build · help

**May 29–30, 2026 · [42 Barcelona](https://www.42barcelona.com/es/)**

**Official website:** [shipforgood.org/es](https://www.shipforgood.org/es)

A hackathon with purpose: helping social organizations and benefiting society
through technology. No smoke. No prizes. Just impact.

---

## The Challenge

In this first edition we work with **[Civio](https://civio.es/)**, an independent
foundation that fights institutional opacity and uses journalism, technology and
open data to give citizens access to information.

The challenges we work on are theirs. The impact belongs to all of us.

---

## Challenge Discovery

More info: [challenge-discovery.md](./challenge-discovery.md)

## Lovable Tokens

More info: [lovable-tokens.md](./lovable-tokens.md)

## Cursor Tokens

More info: [cursor-tokens.md](./cursor-tokens.md)

## Schedule

### Friday, May 29th

| Time | Activity |
|------|----------|
| 17:45 | Check-in |
| 18:00 | Opening and discovery |
| 21:00 | Closing |

### Saturday, May 30th

| Time | Activity |
|------|----------|
| 09:30 | Check-in starts |
| 10:00 | Opening |
| 10:30 | Optional talk - AI augmented development |
| 15:00 | Optional talk - Debate "The ethics of Artificial Intelligence" with Civio |
| 21:00 | Closing |

---

## Slack Channels

- announcements: https://ship-for-good.slack.com/archives/C0B1GNT77QB
- q&a (questions for the hackathon organizers): https://ship-for-good.slack.com/archives/C0B1M3UCQS2
- ask-civio (ask the people at Civil about the problem): https://ship-for-good.slack.com/archives/C0B6YE9GYSG
- tech-support (questions and help on technical topics): https://ship-for-good.slack.com/archives/C0B6RERAELV

---

## Wi-Fi

Use the 42 Barcelona network:

- UID: `42barcelona`
- PASS: `bienvenido42BCN`

---

## Team Branches

Each team works on their own dedicated branch:

| Team | Branch |
|------|--------|
| Delfos | `team-delfos` |
| IT_Power | `team-it-power` |
| Team Aina | `team-aina` |
| Team Azul | `team-azul` |
| Team Verde | `team-verde` |
| Team Rojo | `team-rojo` |
| Team Amarillo | `team-amarillo` |
| Team Naranja | `team-naranja` |
| Team Morado | `team-morado` |
| Team Rosa | `team-rosa` |
| Team Turquesa | `team-turquesa` |

To get started:

```bash
git clone https://github.com/ship-for-good/civio-2026 
cd civio-2026
git checkout team-your-team-name
```

---

## Repository Docs

| Document | Description |
|----------|-------------|
| [how-to-submit-project.md](./how-to-submit-project.md) | Delivery rules, README requirements and demo format |
| [how-to-work-team-branch.md](./how-to-work-team-branch.md) | How to work in this repo, branch rules and commit conventions |
| [AUTHORSHIP.md](./AUTHORSHIP.md) | How projects will remain open source and usable by Civio |

---

## Code of Conduct

All attendees, speakers, sponsors and volunteers must accept our
[Code of Conduct](https://softwarecrafters.barcelona/coc.html).
The organization will enforce it throughout the event.
We count on everyone's cooperation to ensure a safe environment.

---

## Partners & Sponsors

**Organized with:**

- [Civio](https://civio.es/) — challenge owner and partner organization
- [42 Barcelona](https://www.42barcelona.com/es/) — venue
- [Software Crafters Barcelona](https://softwarecrafters.barcelona/) — community

**Sponsors:** [Manfred](https://www.getmanfred.com/) ·
[QualityClouds](https://qualityclouds.ai/) ·
[Plain Concepts](https://www.plainconcepts.com/) ·
[Next Digital](https://www.nextdigital.es/)

**Supporting:** [Lovable](https://lovable.dev/) ·
[Cursor](https://cursor.com/) ·
[Falca](https://falca.com/)

---

## FAQ

[Ship for Good FAQ](https://www.shipforgood.org/es#faq)
