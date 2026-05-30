# Lovable + React — guia per a l'equip AIna

Aquest projecte **és el export de Lovable** (plantilla TanStack Start). No cal convertir React → Vue.

## Flux de treball

1. Prototipar UI a [lovable.dev](https://lovable.dev) (React + Tailwind).
2. Sincronitzar / copiar canvis al repo `team-aina`.
3. Connectar components nous a dades via `createServerFn` i hooks a `src/hooks/use-aina-queries.ts`.

## On va cada cosa

| Lovable / UI | Repo |
|--------------|------|
| Pàgina principal | `src/routes/index.tsx` |
| Hero + xat | `src/components/aina/ChatHero.tsx` |
| Targetes | `src/components/aina/FeatureCards.tsx` |
| Panells expandibles | `NearbyPanel`, `PopularPanel`, `MissedPanel` |
| Design tokens | `src/styles.css` (`:root`, `@theme inline`) |
| shadcn | `src/components/ui/*` |

## Dades

```bash
npm run db:seed   # crea data/aina.db
npm run dev       # frontend + server functions
```

## Variables d'entorn

| Variable | Ús |
|----------|-----|
| `VITE_GOOGLE_MAPS_EMBED_URL` | iframe del mapa (opcional) |

## Afegir un endpoint nou

1. Taula + seed a `scripts/seed.mjs` i `src/lib/db/seed-data.ts`
2. Query a `src/lib/db/client.server.ts`
3. `createServerFn` a `src/lib/api/aina.functions.ts`
4. Hook a `src/hooks/use-aina-queries.ts` + fallback

## Config Vite

No afegis manualment plugins que ja porta `@lovable.dev/vite-tanstack-config` (veure comentaris a `vite.config.ts`).
