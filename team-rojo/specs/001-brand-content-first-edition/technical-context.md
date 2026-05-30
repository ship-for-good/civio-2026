# Technical Context

> Extracted from the original feature description. Use this as a starting point for research.md in the planning phase — do not copy it into the spec.

## Details provided by the user

- Translation files: `src/messages/es.json`, `src/messages/ca.json` — update both; create `src/messages/en.json`
- i18n routing config: `src/i18n/routing.ts` — add `'en'` to the locales array
- Navbar component: `src/components/navbar.tsx` — add EN option to language toggle
- Logo: SVG provided by user at `/Users/davidvalero/Documents/shipForGoodLogo.svg` — copy to `public/logo.svg`
- Civio logo: obtain from civio.es official website — save to `public/civio-logo.svg`
- Remove sponsors section: delete `src/components/sponsors.tsx` and its import+usage in `src/app/[locale]/page.tsx`
- CTAs: leave registration URLs as `href="#"` (pending real URLs)
- Official content source: `/Users/davidvalero/Downloads/ship_for_good_kit_actualizado (1).md`
