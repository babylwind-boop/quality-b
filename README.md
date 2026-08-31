# Quality Build & Management — Website

Premium dark website of the construction company **Quality Build & Management**
(Hausbau, Fassadenarbeiten, Innenrenovierung, Restaurierung, Garten- & Landschaftsbau).

Complete rebuild of the old WordPress site (quality-b.com) as a fully static
Next.js application, mirroring the architecture of the `pikfine-website` project.

## Stack

- **Next.js 16** (App Router, React 19, TypeScript strict)
- **Tailwind CSS 4** — CSS-first config, all design tokens in `src/app/globals.css`
- **next-intl 4** — two locales: `de` (root, default) and `pl` (`/pl/...`)
- **motion 12** (`motion/react`) — reveals, hero choreography, interactive components
- **lucide-react** icons, `clsx` + `tailwind-merge`

## Commands

```bash
npm run dev     # dev server
npm run build   # production build (fully static prerender)
npm run lint    # eslint
```

## Environment

Copy `.env.example` → `.env.local`:

- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` — lead form notifications (`/api/lead`)
- `NEXT_PUBLIC_SITE_URL` — canonical origin (defaults to `https://quality-b.com`)

## Structure

- `src/app/[locale]/…` — pages (home, leistungen + 5 service mini-landings,
  projekte, ueber-uns, kontakt, datenschutz)
- `src/components/{ui,layout,home,services,projects,about,lead,seo}` — components
- `messages/{de,pl}.json` — all site copy
- `docs/CONVENTIONS.md` — design tokens, component APIs and build conventions
- `public/images`, `public/videos` — optimized stock assets (Pexels, free license)

## Deploy

Netlify-ready (`netlify.toml`, Node 20). Any Node host works: `npm run build && npm start`.
