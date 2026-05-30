# AIna de Transparència

**Equip:** Team Aina  
**Hackathon:** [Ship for Good 2026](https://www.shipforgood.org/es) × [Civio](https://civio.es/)

> La transparència pública, al teu abast.  
> Pregunta. Descobreix. Entén.

## Què és

**AIna de Transparència** és un prototip web en català per facilitar l'accés ciutadà a dades públiques.  
Neix per reduir les barreres actuals de transparència: informació dispersa, llenguatge tècnic i dependència de coneixement expert per trobar dades rellevants.

L'aplicació ofereix una experiència de consulta simple amb tres blocs de contingut:

- **Què passa a prop meu?** (mapa + taula)
- **Temes populars**
- **Potser t'has perdut això**

## Estat actual del producte

- UI funcional en català.
- Xat de portada amb efecte typewriter i enviament de preguntes.
- **No hi ha IA real connectada**: la resposta del xat és un missatge local de prototip.
- Dades carregades des de SQLite local (`data/aina.db`) amb fallback estàtic si la base de dades no està disponible.

## Arquitectura (resum)

- **Frontend:** React 19 + TypeScript
- **Routing i server functions:** TanStack Router / TanStack Start
- **Estils i UI:** Tailwind CSS 4 + shadcn/ui
- **Dades:** SQLite via `sql.js` (fitxer local)
- **Capa de dades client:** TanStack Query
- **Tooling:** Vite 7, ESLint, Prettier

Flux simplificat:

1. Els components UI consumeixen hooks de `src/hooks/use-aina-queries.ts`.
2. Els hooks invoquen `createServerFn` de `src/lib/api/aina.functions.ts`.
3. Les queries de servidor llegeixen SQLite a `src/lib/db/client.server.ts`.
4. Si falla la DB, els hooks retornen dades de `src/data/fallback.ts`.

## Estructura principal

```text
src/
	components/aina/         # Components de la pàgina principal
	hooks/                   # Hooks de consulta (TanStack Query)
	lib/api/                 # Server functions (createServerFn)
	lib/db/                  # Accés SQLite + seed data
	data/fallback.ts         # Dades alternatives si la DB no respon
	routes/index.tsx         # Landing principal
scripts/
	seed.mjs                 # Generació de data/aina.db
docs/
	AI_CONTEXT.md            # Context de producte i tècnic
	lovable-stack.md         # Flux de treball Lovable -> repo
```

## Requisits

- Node.js **>= 20.19** (recomanat **>= 22.12**)
- npm (o bun)

## Instal·lació i execució

### Opció A: npm

```bash
git clone https://github.com/ship-for-good/civio-2026
cd civio-2026
git checkout team-aina
npm install
npm run db:seed
npm run dev
```

### Opció B: bun

```bash
bun install
bun run db:seed
bun run dev
```

Per defecte, Vite arrenca a `http://localhost:5173`.

## Scripts disponibles

| Script | Descripció |
|---|---|
| `npm run dev` | Arrenca el servidor de desenvolupament |
| `npm run build` | Build de producció |
| `npm run build:dev` | Build en mode development |
| `npm run preview` | Serveix la build localment |
| `npm run db:seed` | Regenera `data/aina.db` amb dades de demo |
| `npm run lint` | Executa ESLint |
| `npm run format` | Formata el codi amb Prettier |
| `npm run format:check` | Comprova format sense escriure |

## Variables d'entorn

Existeix un exemple a `.env.example`.

| Variable | Obligatòria | Descripció |
|---|---|---|
| `VITE_GOOGLE_MAPS_EMBED_URL` | No | URL d'embed de Google Maps per al panell «Què passa a prop meu?» |

Important:

- Les variables `VITE_*` són públiques (arriben al client).
- No guardis secrets ni claus privades en variables amb prefix `VITE_`.

## Endpoints interns (server functions)

Definits a `src/lib/api/aina.functions.ts`:

- `getHealth`: comprovació bàsica de la DB
- `getExampleQuestions`: preguntes d'exemple del xat
- `getTopics`: llistat de temes populars
- `getFeatured`: llistat de destacats
- `getNearby`: dades del panell «a prop meu»

## Base de dades de demo

El seed (`scripts/seed.mjs`) crea `data/aina.db` i les taules:

- `example_questions`
- `topics`
- `featured_items`
- `nearby_items`

Si no existeix `data/aina.db`, la capa servidor pot fallar; la capa client té fallback per mantenir la UI operativa.

## Demo ràpida

1. Obre la landing.
2. Escriu una pregunta i envia-la (Enter o botó).
3. Revisa el missatge de resposta de prototip.
4. Obre cadascuna de les tres targetes per veure contingut de transparència.

## Línies de continuació suggerides

- Connectar el xat a fonts públiques reals i/o un motor RAG.
- Afegir filtres avançats per territori, organisme i data.
- Persistir consultes recents i historial d'usuari.
- Incorporar tests (actualment no hi ha suite de tests definida als scripts).

## Documentació relacionada

- [docs/AI_CONTEXT.md](docs/AI_CONTEXT.md)
- [docs/lovable-stack.md](docs/lovable-stack.md)
- [src/routes/README.md](src/routes/README.md)
- [sfg/challenge-discovery.md](sfg/challenge-discovery.md)
- [sfg/how-to-work-team-branch.md](sfg/how-to-work-team-branch.md)
- [sfg/how-to-submit-project.md](sfg/how-to-submit-project.md)

## Llicència i autoria

- Llicència: [MIT](sfg/LICENSE)
- Autoria i ús del codi: [sfg/AUTHORSHIP.md](sfg/AUTHORSHIP.md)
