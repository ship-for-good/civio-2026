# AIna de Transparència

**Equip:** Team Aina · [Ship for Good](https://www.shipforgood.org/es) × [Civio](https://civio.es/)

> La transparència pública, al teu abast. · Pregunta. Descobreix. Entén.

## Problema

Els ciutadans tenen dificultat per trobar i entendre la informació pública: portals fragmentats, vocabulari tècnic i coneixement tàcit que només tenen els periodistes. AIna ofereix una interfície clara per explorar temes de transparència (prototip per a la hackathon).

## Tecnologies

- React 19 + TypeScript + Vite 7
- TanStack Router / Start (plantilla Lovable)
- Tailwind CSS 4 + shadcn/ui
- SQLite (`sql.js`) — dades de demostració per a la UI
- ESLint + Prettier

## Requisits

- Node.js **≥ 22.12** (recomanat per TanStack Start) o **≥ 20.19**
- npm

## Instal·lació

```bash
git clone https://github.com/ship-for-good/civio-2026
cd civio-2026
git checkout team-aina
npm install
npm run db:seed
npm run dev
```

Obre l'URL que mostra la terminal (per defecte `http://localhost:5173`).

## Scripts

| Script | Descripció |
|--------|------------|
| `npm run dev` | Servidor de desenvolupament |
| `npm run build` | Build de producció |
| `npm run preview` | Previsualitzar build |
| `npm run db:seed` | Crear/actualitzar `data/aina.db` |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Variables d'entorn

Copia `.env.example` si cal (opcional):

| Nom | Descripció |
|-----|------------|
| `VITE_GOOGLE_MAPS_EMBED_URL` | URL d'embed de Google Maps per al panell «A prop meu» |

No incloure claus API reals al repositori.

## Demo

1. Hero amb xat i preguntes d'exemple animades
2. Enviar una pregunta → missatge de prototip (sense IA)
3. Obrir les tres targetes: mapa + taula, temes populars, destacats (dades SQLite)

## Documentació interna

- [docs/AI_CONTEXT.md](docs/AI_CONTEXT.md) — context per a Cursor / IA
- [docs/lovable-stack.md](docs/lovable-stack.md) — treballar amb Lovable
- [sfg/challenge-discovery.md](sfg/challenge-discovery.md) — context Civio

## Llicència

MIT — veure [sfg/LICENSE](sfg/LICENSE) i [sfg/AUTHORSHIP.md](sfg/AUTHORSHIP.md).
