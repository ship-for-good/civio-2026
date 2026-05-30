# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # dev server at localhost:3000
pnpm build        # static export to out/
pnpm lint         # ESLint
```

No test suite exists. Type-check with `tsc --noEmit`.

## Architecture

Single-page landing site for Ship For Good hackathon. Statically exported Next.js (App Router) deployed to GitHub Pages via GitHub Actions on every push to main.

**Stack:** Next.js + React 19 + TypeScript + Tailwind CSS v4 + next-intl + motion (animations)

**Static export:** `output: "export"` in `next.config.ts`. Builds to `out/`. Images must use `unoptimized`. No server-side features.

**Routing:** `src/app/[locale]/` handles all three locales (es, ca, en). Root redirects to `/es`. Middleware in `src/proxy.ts` handles locale detection. Always use i18n-aware `Link`/`useRouter` from `src/i18n/navigation.ts`, not Next.js directly.

**i18n:** All user-visible strings live in `src/messages/{es,ca,en}.json`. Components call `useTranslations('Namespace')` — namespace must exist in all three files. Type safety via `src/types/next-intl.d.ts`.

**Components:** One file per landing page section in `src/components/`. All marked `"use client"` — no server components in use. Page assembly in `src/app/[locale]/page.tsx`.

**Styling:** Tailwind v4 via PostCSS. Design tokens (colors, fonts) defined as CSS custom properties in `src/app/globals.css` using `@theme inline`. Use these tokens (`--color-accent`, etc.) rather than hardcoded values.

**Fonts:** Instrument Serif (headings) and GeistPixelSquare (accent/mono) — imported in `src/lib/fonts.ts`.

**Asset paths:** Use `src/lib/asset.ts` resolver for public assets (handles base path for GitHub Pages).

**Animations:** Use `motion` library (`motion/react`) — not framer-motion. Scroll-triggered entrances via `whileInView`.

## Adding content

When adding a new section: create component in `src/components/`, add translation keys to all three message files, import in `page.tsx`.
