# CLAUDE.md

Guidance for working in this repository.

## Project

Personal portfolio site for Timofei Arefev. Static, content-driven, deployed on Vercel.

## Stack

- **Next.js 15** (App Router) + **React 19**, TypeScript (strict)
- **Tailwind CSS v4** — CSS-first config. There is **no `tailwind.config.ts`**; all
  theme tokens, fonts, keyframes and the shadcn-style color variables live in
  `app/globals.css` (`@theme` / `@theme inline` / `:root`).
- **radix-ui** unified package for primitives, wrapped in `components/ui/*`
- **motion** (`motion/react`, formerly framer-motion) for animation
- **lucide-react** for icons
- **@vercel/analytics**
- Fonts via `next/font/google`: Taviraj (body), Playfair Display (`font-serif`), Inter
  (`font-sans`) — loaded once in `app/layout.tsx`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (flat config, `next/core-web-vitals` + `next/typescript`) |
| `npm run typecheck` | `tsc --noEmit` |

## Layout

```
app/
  layout.tsx              # single root layout: <html>/<body>, fonts, metadata, Analytics
  globals.css             # Tailwind v4 entry + all design tokens
  not-found.tsx, error.tsx
  (main)/                 # pages with the standard nav + background chrome
    layout.tsx            # chrome only — no <html>/<body>
    page.tsx              # home
    projects/…
  (no-layout)/            # standalone project pages (minimal nav)
    layout.tsx
    covali-bag/, group-management-bot/
components/
  ui/                     # radix wrappers (card, hover-card, aspect-ratio)
  motion/Reveal.tsx       # client wrapper around motion.div for server pages
  main-page/, projects/, …
lib/utils.ts              # cn()
```

## Conventions

- **Server components by default.** Add `"use client"` only for hooks / event handlers,
  and keep the boundary as low in the tree as possible (see `components/motion/Reveal.tsx`,
  `components/projects/CovaliBagContent.tsx`).
- **Page titles / SEO** come from the Metadata API (`export const metadata` /
  `generateMetadata`) — never `document.title`. The root layout defines the
  `%s | Timofei Arefev` title template, so pages export just their own `title`.
- **Images**: always `next/image`. Use `fill` + a sized parent for responsive art,
  explicit `width`/`height` otherwise.
- **Links/navigation**: `next/link`, not `router.push` on a `<button>`.
- Prefer arrow-function components, destructured props, no `any`, no unused `import React`.
- Tests are not set up; don't add them unless asked.

## Notes

- `npm audit` reports issues in `postcss` pulled in transitively by `next`; resolving
  them needs a Next major bump — leave unless explicitly asked.
