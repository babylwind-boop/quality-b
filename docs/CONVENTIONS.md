# Quality Build — Build Conventions (for all builders)

Next.js 16 App Router + React 19 + TS strict + Tailwind 4 (CSS-first) + next-intl 4 + motion 12.
Dark-only premium design: warm charcoal + bronze. Language: DE (root) + PL (/pl). Site of a
construction company "Quality Build & Management" (Hausbau, Fassade, Renovierung, Restaurierung, Garten).

## Hard rules

1. **Imports**: `motion` from `'motion/react'` (NOT framer-motion). Icons from `lucide-react` (never emoji).
   `cn()` from `@/lib/utils`. Internal links via `Link` from `@/i18n/navigation` (never next/link).
2. **Server-first**: pages and static sections are server components using
   `getTranslations` from `next-intl/server`. `'use client'` ONLY for motion/state/effects.
   Client components use `useTranslations` — allowed namespaces on the client:
   `nav, common, hero, contactPopup, whoWeAre, offers, projectsExplorer` (whitelisted in layout).
   For any OTHER namespace in a client component: translate in the parent server component and
   pass strings/arrays as props.
3. **Every page** (`app/[locale]/**/page.tsx`):
   ```tsx
   import { setRequestLocale, getTranslations } from 'next-intl/server';
   import { routing, type Locale } from '@/i18n/routing';
   import { pageMetadata } from '@/lib/seo';

   type Props = { params: Promise<{ locale: string }> };
   export function generateStaticParams() {
     return routing.locales.map((locale) => ({ locale }));
   }
   export async function generateMetadata({ params }: Props) {
     const { locale } = await params;
     const t = await getTranslations({ locale, namespace: 'meta' });
     return pageMetadata({
       locale: locale as Locale,
       path: '/…',                 // route path without locale prefix
       title: t('….title'),
       description: t('….description'),
     });
   }
   export default async function Page({ params }: Props) {
     const { locale } = await params;
     setRequestLocale(locale);
     …
   }
   ```
4. **Translations**: ALL copy comes from `messages/de.json` — read it to see exact keys.
   Never hardcode copy. Never invent keys — if a key is missing, use the closest existing one.
   next-intl API: `t('key')`, `t('nested.key')`; there is no t.raw over arrays here — namespaces
   use objects with s1/s2/… keys; iterate with explicit key lists, e.g.
   `(['s1','s2','s3','s4','s5'] as const).map((k) => t(`steps.${k}.title`))`.
5. **Accessibility**: real buttons/links, aria-labels on icon-only controls, focus-visible styles
   come free from globals. Touch targets ≥ 44px (`min-h-11`/`size-11`). `cursor-pointer` on clickables.
   All images get meaningful `alt`. Decorative icons get `aria-hidden`.
6. **Reduced motion**: every client animation must respect `useReducedMotion()` (skip transforms,
   keep opacity) — globals.css also has a global kill-switch.
7. **Performance**: animate only `transform`/`opacity`. No `backdrop-filter` on scroll-animated
   nodes. `next/image` for all images with proper `sizes`; hero/LCP images get `priority`.
   Videos: `<video autoPlay muted loop playsInline preload="metadata" poster=…>` and MUST be
   paused under reduced motion (small client wrapper) — use the shared `AmbientVideo` component.

## Design tokens (globals.css @theme) — FAITHFUL TO THE ORIGINAL SITE

The visual language mirrors the old quality-b.com: neutral COOL dark grays, FLAT bronze,
white sentence-case headings, RECTANGULAR controls. No gradients on UI, no warm tint,
no decorative glows, no grain.

- Backgrounds: `bg-ink-950 #141719` `bg-ink-900 #1b1e21` (page) `bg-ink-850` `bg-ink-800` `bg-ink-700`
- Brand: `bronze-500 #a98b56` (original flat button tone; primary), `bronze-600 #906e49` (kit), text on bronze = `text-ink-950`
- Text: `text-sand-50 #f5f6f7` (body/headings) `text-sand-300/400` (muted neutral grays)
- Fonts: `font-display` = Oswald (sentence-case section headings), `font-body` = Roboto (original body font; hero H1 uses font-body bold)
- Ease: `--ease-luxe: cubic-bezier(0.22,1,0.36,1)` → in motion: `const EASE = [0.22, 1, 0.36, 1] as const`
- Utility classes: `.glass` (frosted card over media), `.glass-soft` (chip), `.card-luxe` (flat dark panel),
  `.text-bronze-sheen` (now a FLAT bronze accent color, no gradient), `.hairline`, `.tnum`, `.no-scrollbar`
- Registered CSS animations: `animate-marquee`, `animate-fade-up`, `animate-shimmer`

## Typography & shape rules (original identity)

- Headings are SENTENCE CASE (never force `uppercase` on font-display headings).
- Hero H1: `font-body font-bold text-5xl…lg:text-7xl text-sand-50` — plain white, like the old hero.
- Section titles via shared `SectionHeading`. Body: `text-sand-300/400`, `leading-relaxed`.
- Eyebrow/kicker: `text-[0.8rem] font-medium tracking-[0.28em] uppercase text-bronze-500` (kickers DO stay uppercase).
- Buttons/CTAs: FLAT RECTANGULAR (BronzeButton) — `bg-bronze-500 text-ink-950`, uppercase UNDERLINED label,
  no rounding, no gradients, no shine sweeps.
- Corners: cards/images/chips use `rounded-sm`/`rounded-md` at most; `rounded-full` only for circular
  icon badges and dots. Check bullets = filled `bg-bronze-500` circles with white Check.

## Existing shared modules (import — do not recreate)

- `@/components/ui/Container` — `<Container className?>` max-w-7xl px wrapper
- `@/components/ui/Reveal` — `<Reveal delay? stagger? as? className?>` scroll reveal;
  `<RevealItem as? className?>` child of a staggered Reveal
- `@/components/ui/SectionHeading` — `{eyebrow?, title, subtitle?, align?: 'center'|'start', as?, className?}`
- `@/components/ui/BronzeButton` — `<BronzeButton variant?: 'solid'|'outline'|'ghost' onClick? type? className?>`,
  `<BronzeLink href variant?>` (plain <a>, for tel:/mailto:/anchors)
- `@/components/lead/LeadModalContext` — `useLeadModal().open('consultation'|'contact'|'callback'|'visit', context?)`
  (client-only; from server sections render a small client CTA button component instead)
- `@/components/lead/LeadForm` — `<LeadForm type=… className? onSuccess?>` inline form (client)
- `@/components/seo/JsonLd` — `JsonLd`, `breadcrumbJsonLd(locale, items)`, `serviceJsonLd(locale, {...})`, `faqJsonLd`
- `@/lib/site` — `site.{name, brandLine, email, phones[0], phoneHref, whatsapp, address{company,street,zip,city}, hours}`
- `@/lib/services` — `SERVICES: [{key, href}]` (5 services), `HOUSE_STYLES` (10 style keys)
- `@/i18n/navigation` — `Link, usePathname, useRouter, getPathname`

## Shared modules being built in this same run (import by these EXACT APIs)

- `@/components/ui/Breadcrumbs` — server; `{locale: Locale, items: {name: string; path: string}[]}` —
  renders visual trail + BreadcrumbList JSON-LD. Last item = current page (not a link).
- Context scenes (client, no numbers anywhere): `home/QualityScene` `{items: string[]; sealText}`, `services/fassade/FacadeScene`,
  `services/innen/InteriorScene`, `services/garten/GardenScene` `{phaseLabels: [4 strings]}` — gold line-art scenes replacing the old % bars.
- `@/components/ui/StatCounter` — client; `{value: string; label: string; className?}` — counts up the
  numeric part of `value` (e.g. "150+") when in view; large display digits.
- `@/components/ui/ProcessSteps` — client; `{steps: {title: string; text: string}[]; className?}` —
  vertical numbered (01…) timeline with staggered reveal + growing connector line.
- `@/components/ui/AmbientVideo` — client; `{src: string; poster: string; className?}` — bg video,
  autoplay muted loop playsInline, pauses under reduced motion, object-cover fill.
- `@/components/home/ContactCta` — server; `{locale: Locale}` — full-width closing CTA section:
  SectionHeading (contactCta ns) + inline `<LeadForm type="contact">` in a card-luxe + phone link.
  EVERY page ends with `<ContactCta locale={locale} />` before the footer.
- `@/components/services/ServiceHero` — server; `{kicker, title, subtitle, media: {video?: string; image: string},
  locale, breadcrumbs: {name; path}[]}` — page hero for service landings: full-bleed media +
  gradient scrim + glass breadcrumb bar + H1; min-h ~[60dvh].
- `@/components/services/OtherServices` — server; `{locale: Locale, currentKey: ServiceKey}` — strip
  linking to the other 4 service landings (uses `nav.serviceItems.*` + service images).
- `@/components/ui/DrawIcon` — client; `{icon: DrawIconSpec, delay?, className?}` — gold line-art
  icon that draws its paths on inView (currentColor stroke; size via className).
- `@/lib/icon-strokes` — `STROKE_ICONS` dictionary of 48×48 `DrawIconSpec`s (key, shieldCheck, gear,
  coins, chat, draft, crane, keyHandover, magnifier, docEuro, scaffold, checkSeal, helmet, materials,
  layers, eye, bulb, frames). Plain data — safe to pass from server pages into client components.
- `@/components/ui/IllustratedSteps` — client; `{steps: {title, text, icon: DrawIconSpec}[], className?}` —
  numbered vertical timeline with drawing pictogram badges (replaces ProcessSteps on service landings).
- Service-landing interactive blocks (all client, all copy via props): `hausbau/HouseRise` (isometric
  build-up animation), `hausbau/HausKonfigurator` (3-step lead wizard → /api/lead),
  `fassade/ThermoLayers` (exploded insulation layers), `fassade/WorkPanels` (expanding photo panels),
  `fassade/FacadeCheck` (symptom checklist → lead modal), `innen/RepairTypesShowcase` (photo tabs /
  mobile accordion), `innen/CompareBlock` (DIY vs pro ledger), `garten/GardenMap` (interactive plan),
  `restaurierung/BuildingProblems` (facade with problem hotspots).

## Assets

Images live in `/public/images` (reference as `/images/<name>.jpg`):
hero-home, who-we-are (two engineers with plans), planning (hands on blueprint), blueprint,
process-site (sunset silhouette), consult (hands+laptop), team-engineer, visit-workers (timber frame),
concrete-work, service-hausbau, service-fassade, service-innen, service-restaurierung, service-garten,
style-townhouse, style-hitech, style-minimalismus, style-skandinavisch, style-klassisch, style-preiswert,
style-bueros, style-gewerbe, style-raffiniert, style-nichtstandard, fassade-crane, fassade-after,
innen-kueche, innen-bad, innen-wohnen, innen-klassik, innen-loft, innen-arbeit, innen-heizung,
innen-werkzeug, restaurierung-innen (gutted room), restaurierung-alt (old cottage), restaurierung-klassik,
restaurierung-work (ladder+paint), garten-teich (pond), garten-detail, garten-blumen, garten-villa (pool villa),
garten-luft (aerial), about-team (office team), about-house (stone house dusk), project-1…project-8.

Videos in `/public/videos` (1280×720 mp4, use with AmbientVideo + a matching image poster):
hero-home.mp4 (drone villa), hausbau.mp4 (aerial timber frame build), fassade.mp4 (plaster on wall),
innen.mp4 (wall skimming), garten.mp4 (garden walkway).

## Motion grammar

EASE_LUXE `[0.22,1,0.36,1]`, reveals 0.7–1.0s, stagger 0.06–0.12s, springs only for micro-interaction
(stiffness 300±, damping 22±). Exit ≈ 60% of enter. Hover scale ≤1.04, tap 0.98. One hero-level
statement animation per page; the rest are quiet reveals. Never animate width/height/top/left.

## Quality bar

Zero TS/ESLint errors (`npx tsc --noEmit` must pass), responsive from 360px (no horizontal scroll),
uses logical properties (`ps-/pe-/ms-/me-/start/end`), no layout shift (aspect ratios on media).
