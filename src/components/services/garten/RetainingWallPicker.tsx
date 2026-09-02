'use client';

import { useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;

/* Gold line-art palette (matches HouseRise / ThermoLayers) */
const GOLD = '#a98b56';
const GOLD_HI = '#d0b586';
const HUD_MUTED = '#9b9b9b';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const WALL_KEYS = ['winkel', 'naturstein', 'gabionen', 'pflanzsteine'] as const;
type WallKey = (typeof WALL_KEYS)[number];
const isWallKey = (k: string): k is WallKey => (WALL_KEYS as readonly string[]).includes(k);

/* ── Geometry: side-view cross-section (viewBox 640×420) ─────────────
   High ground on the left (y 150) drops to low ground on the right
   (y 330); the wall stands at the step, x ≈ 300..360. Constant parts
   (terrain, backfill hatch, foundation, drain, pressure arrows, context)
   draw once on scroll-in; the wall body is built per type and swapped
   through AnimatePresence (exit fade → staggered draw-in). */
const VB_W = 640;
const VB_H = 420;
const Y_HIGH = 150;
const Y_LOW = 330;
const X_BACK = 300;
const X_FRONT = 360;
/** The constant high-ground line stops here; each wall type closes the
    gap to its own back face (the L-wall heel runs under the backfill). */
const X_HIGH_END = 256;

interface Stroke {
  d: string;
  /** Draw delay in seconds, relative to its group start. */
  delay: number;
  width?: number;
  /** '3 7' dash — fades via opacity (a pathLength draw would erase the pattern). */
  dashed?: boolean;
  /** Tiny marks (dots, ticks) fade in instead of drawing. */
  fade?: boolean;
  /** Settled opacity (default 1). */
  alpha?: number;
  /** Brighter bronze accent. */
  hi?: boolean;
}

const f = (n: number) => n.toFixed(1);

/** Deterministic jitter in [0, 1) — keeps stone shapes stable across renders. */
function rnd(n: number): number {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

const circle = (cx: number, cy: number, r: number) =>
  `M${f(cx + r)} ${f(cy)} a${r} ${r} 0 1 1 ${-2 * r} 0 a${r} ${r} 0 1 1 ${2 * r} 0`;

function roundedRect(x: number, y: number, w: number, h: number, r: number): string {
  return [
    `M${x + r} ${y} H${x + w - r}`,
    `Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r}`,
    `Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r}`,
    `Q${x} ${y + h} ${x} ${y + h - r} V${y + r}`,
    `Q${x} ${y} ${x + r} ${y} Z`,
  ].join(' ');
}

/** Diagonal (slope 1) hatch lines clipped to a rectangle. */
function hatch(x0: number, y0: number, x1: number, y1: number, step: number): string[] {
  const out: string[] = [];
  for (let c = x0 - y1 + step; c < x1 - y0; c += step) {
    const xs = Math.max(x0, y0 + c);
    const xe = Math.min(x1, y1 + c);
    if (xe - xs < 8) continue;
    out.push(`M${f(xs)} ${f(xs - c)} L${f(xe)} ${f(xe - c)}`);
  }
  return out;
}

/** Irregular six-sided stone blob around a centre. */
function blob(cx: number, cy: number, r: number, seed: number): string {
  const n = 6;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd(seed + i) * 0.4;
    const rr = r * (0.75 + rnd(seed + 7 + i) * 0.45);
    pts.push(`${i ? 'L' : 'M'}${f(cx + Math.cos(a) * rr)} ${f(cy + Math.sin(a) * rr)}`);
  }
  return `${pts.join(' ')} Z`;
}

/* ── Constant scene ─────────────────────────────────────────────────── */
function buildScene(): Stroke[] {
  const s: Stroke[] = [];

  // terrain: high plateau (left) and low level (right)
  s.push({ d: `M20 ${Y_HIGH} H${X_HIGH_END}`, delay: 0, width: 1.6 });
  s.push({ d: `M352 ${Y_LOW} H620`, delay: 0.12, width: 1.6 });
  (
    [
      [44, Y_HIGH],
      [96, Y_HIGH],
      [214, Y_HIGH],
      [404, Y_LOW],
      [446, Y_LOW],
      [608, Y_LOW],
    ] as [number, number][]
  ).forEach(([x, y], i) => {
    s.push({ d: `M${x} ${y} l-2 -6 M${x + 3} ${y} l2 -5`, delay: 0.25 + i * 0.04, width: 0.8, fade: true });
  });
  // section-cut boundary (faint)
  s.push({ d: `M20 ${Y_HIGH} V396`, delay: 0.2, width: 0.6, dashed: true, alpha: 0.35 });
  s.push({ d: `M620 ${Y_LOW} V396`, delay: 0.25, width: 0.6, dashed: true, alpha: 0.35 });
  s.push({ d: 'M20 396 H620', delay: 0.3, width: 0.6, dashed: true, alpha: 0.35 });

  // context: tiny house on the plateau (top-left)
  s.push({ d: `M70 ${Y_HIGH} V108 H146 V${Y_HIGH}`, delay: 0.3, width: 1.2 });
  s.push({ d: 'M62 110 L108 76 L154 110', delay: 0.42, width: 1.4 });
  s.push({ d: 'M128 90 V80 H138 V98', delay: 0.55, width: 1 });
  s.push({ d: `M102 ${Y_HIGH} V128 H114 V${Y_HIGH}`, delay: 0.6, width: 0.9 });
  s.push({ d: 'M124 120 H136 V131 H124 Z', delay: 0.66, width: 0.9 });

  // context: bench + tree on the low level (top-right)
  s.push({ d: 'M460 314 H512', delay: 0.4, width: 1.4 });
  s.push({ d: `M468 314 V${Y_LOW} M504 314 V${Y_LOW}`, delay: 0.48, width: 1.1 });
  s.push({ d: 'M466 300 H506 M470 300 V314 M502 300 V314', delay: 0.54, width: 1 });
  s.push({ d: `M582 ${Y_LOW} V274`, delay: 0.5, width: 1.4 });
  s.push({ d: 'M582 300 L596 286', delay: 0.58, width: 1 });
  s.push({
    d: 'M554 258 C540 234 560 212 582 220 C600 208 620 232 608 254 C612 272 566 280 554 258 Z',
    delay: 0.64,
    width: 1.3,
  });

  // strip foundation under the wall
  s.push({ d: `M266 ${Y_LOW} H380 V352 H266 Z`, delay: 0.35, width: 1.4 });

  // backfill: faint dashed earth hatch behind the wall
  hatch(176, 158, 256, 316, 22).forEach((d, i) => {
    s.push({ d, delay: 0.6 + i * 0.04, width: 0.8, dashed: true, alpha: 0.4 });
  });
  // filter layer between backfill and gravel column
  s.push({ d: 'M262 158 V292', delay: 0.85, width: 0.8, dashed: true, alpha: 0.7 });

  // drainage pipe at the wall foot + gravel bed around it
  s.push({ d: circle(286, 306, 6), delay: 0.95, width: 1.4 });
  s.push({ d: circle(286, 306, 2), delay: 1.05, width: 0.9, fade: true });
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      const k = r * 4 + c;
      const x = 268 + c * 10 + (rnd(k) - 0.5) * 4;
      const y = 288 + r * 12 + (rnd(k + 9) - 0.5) * 4;
      if (Math.hypot(x - 286, y - 306) < 10) continue;
      s.push({ d: circle(x, y, 1.6), delay: 1.0 + k * 0.03, width: 1, fade: true });
    }
  }

  // water path: seepage from the backfill down to the pipe
  s.push({ d: 'M236 184 C244 228 260 266 278 298', delay: 1.2, width: 1, dashed: true, alpha: 0.75 });
  s.push({ d: 'M271 296 L279 300 L276 291', delay: 1.35, width: 1, hi: true });

  // earth pressure: two faint arrows from the high side (larger with depth)
  s.push({ d: 'M226 222 H274', delay: 1.3, width: 1.1, alpha: 0.45 });
  s.push({ d: 'M268 216 L276 222 L268 228', delay: 1.4, width: 1.1, alpha: 0.45 });
  s.push({ d: 'M214 272 H288', delay: 1.36, width: 1.1, alpha: 0.45 });
  s.push({ d: 'M282 266 L290 272 L282 278', delay: 1.46, width: 1.1, alpha: 0.45 });

  // leader tick from the wall face to the HUD label
  s.push({ d: 'M364 172 H372', delay: 1.5, width: 1, hi: true });

  return s;
}

/* ── Wall bodies, one per type ──────────────────────────────────────── */

/** Betonwinkelstützwand: thin stem + long heel running under the backfill. */
function buildWinkel(): Stroke[] {
  return [
    { d: `M336 140 H352 V${Y_LOW} H266 V316 H336 Z`, delay: 0, width: 1.8 },
    { d: 'M336 316 H352', delay: 0.3, width: 0.8 },
    { d: `M${X_HIGH_END} ${Y_HIGH} H336`, delay: 0.35, width: 1.6 },
    // reinforcement hints in stem and heel
    { d: 'M344 148 V322', delay: 0.45, width: 0.8, dashed: true, alpha: 0.7 },
    { d: 'M272 323 H346', delay: 0.55, width: 0.8, dashed: true, alpha: 0.7 },
  ];
}

/** Natursteinmauer: slightly battered face, five courses of irregular stones. */
function buildNaturstein(): Stroke[] {
  const out: Stroke[] = [{ d: `M${X_HIGH_END} ${Y_HIGH} H${X_BACK}`, delay: 0, width: 1.6 }];
  const xf = (y: number) => X_FRONT - ((Y_LOW - y) * 12) / (Y_LOW - 140); // battered front face
  const heights = [40, 36, 40, 36, 38];
  const perCourse = [3, 2, 3, 3, 3];
  const g = 2; // half joint
  let yb = Y_LOW;
  let k = 0;
  heights.forEach((h, c) => {
    const yt = yb - h;
    const n = perCourse[c] ?? 3;
    const wb = xf(yb) - X_BACK;
    const wt = xf(yt) - X_BACK;
    const cuts = [0];
    for (let i = 1; i < n; i++) cuts.push(i / n + (rnd(c * 11 + i) - 0.5) * 0.12);
    cuts.push(1);
    for (let i = 0; i < n; i++, k++) {
      const f0 = cuts[i] ?? 0;
      const f1 = cuts[i + 1] ?? 1;
      const xlb = X_BACK + f0 * wb + g;
      const xrb = X_BACK + f1 * wb - g;
      const xlt = X_BACK + f0 * wt + g;
      const xrt = X_BACK + f1 * wt - g;
      const jb = (rnd(k * 5 + 1) - 0.5) * 3;
      const jt = (rnd(k * 5 + 2) - 0.5) * 3;
      const bl = rnd(k * 5 + 3) * 1.5;
      const br = rnd(k * 5 + 4) * 1.5;
      const ym = (yb + yt) / 2 + (rnd(k * 5) - 0.5) * 8;
      out.push({
        d: [
          `M${f(xlb)} ${f(yb - g + jb)}`,
          `L${f(xrb)} ${f(yb - g - jb)}`,
          `L${f((xrb + xrt) / 2 + br)} ${f(ym)}`,
          `L${f(xrt)} ${f(yt + g + jt)}`,
          `L${f(xlt)} ${f(yt + g - jt)}`,
          `L${f((xlb + xlt) / 2 - bl)} ${f(ym)} Z`,
        ].join(' '),
        delay: 0.1 + k * 0.05,
        width: 1.2,
      });
    }
    yb = yt;
  });
  return out;
}

/** Gabionen: two stacked wire baskets (upper one set back) filled with rubble. */
function buildGabionen(): Stroke[] {
  const out: Stroke[] = [{ d: `M${X_HIGH_END} ${Y_HIGH} H${X_BACK}`, delay: 0, width: 1.6 }];
  const baskets = [
    { x: X_BACK, y: 236, w: 60, h: 94 },
    { x: X_BACK, y: 142, w: 52, h: 94 },
  ];
  const spots: [number, number][] = [
    [0.22, 0.2],
    [0.66, 0.24],
    [0.4, 0.5],
    [0.78, 0.62],
    [0.26, 0.8],
  ];
  baskets.forEach((b, bi) => {
    const t0 = 0.05 + bi * 0.4;
    out.push({ d: `M${b.x} ${b.y} H${b.x + b.w} V${b.y + b.h} H${b.x} Z`, delay: t0, width: 1.7 });
    const vert: string[] = [];
    for (let x = b.x + 12; x < b.x + b.w - 5; x += 12) vert.push(`M${x} ${b.y} V${b.y + b.h}`);
    const horiz: string[] = [];
    for (let y = b.y + 12; y < b.y + b.h - 5; y += 12) horiz.push(`M${b.x} ${y} H${b.x + b.w}`);
    out.push({ d: vert.join(' '), delay: t0 + 0.15, width: 0.55, alpha: 0.6 });
    out.push({ d: horiz.join(' '), delay: t0 + 0.25, width: 0.55, alpha: 0.6 });
    spots.forEach(([u, v], i) => {
      out.push({
        d: blob(b.x + u * b.w, b.y + v * b.h, 7, bi * 20 + i * 3),
        delay: t0 + 0.3 + i * 0.07,
        width: 1,
      });
    });
  });
  return out;
}

/** Pflanzsteine: four stepped rings climbing the slope, sprigs on the exposed tops. */
function buildPflanzsteine(): Stroke[] {
  const W = 46;
  const H = 47;
  const STEP = 15;
  const out: Stroke[] = [
    { d: `M${X_HIGH_END} ${Y_HIGH} H${314 - 3 * STEP}`, delay: 0, width: 1.6 },
  ];
  for (let i = 0; i < 4; i++) {
    const x = 314 - i * STEP;
    const y = Y_LOW - (i + 1) * H;
    out.push({ d: roundedRect(x, y, W, H, 4), delay: 0.05 + i * 0.18, width: 1.6 });
    out.push({ d: roundedRect(x + 6, y + 6, W - 12, H - 12, 2), delay: 0.15 + i * 0.18, width: 0.9 });
  }
  (
    [
      [353, Y_LOW - H],
      [323, Y_LOW - 3 * H],
      [292, Y_LOW - 4 * H],
    ] as [number, number][]
  ).forEach(([x, y], i) => {
    out.push({
      d: `M${x} ${y} v-13 M${x} ${y - 5} q-5 -2 -7 -8 M${x} ${y - 8} q5 -2 7 -8`,
      delay: 0.85 + i * 0.1,
      width: 1,
      hi: true,
    });
  });
  return out;
}

const SCENE = buildScene();
const WALLS: Record<WallKey, Stroke[]> = {
  winkel: buildWinkel(),
  naturstein: buildNaturstein(),
  gabionen: buildGabionen(),
  pflanzsteine: buildPflanzsteine(),
};

const num = (i: number) => String(i).padStart(2, '0');

/* ── Interactive retaining-wall cross-section ────────────────────────
   The terrain, foundation and drainage draw in on scroll; the wall body
   swaps per selected type (exit fade, staggered draw-in). Real buttons
   (rows on lg, chips on mobile) drive the selection; a grid-stacked
   caption panel crossfades the type text. */
export function RetainingWallPicker({
  types,
  hint,
  className,
}: {
  types: { key: string; label: string; text: string }[];
  hint: string;
  className?: string;
}) {
  const reduce = useReducedMotion() ?? false;
  const uid = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.25 });
  const [selected, setSelected] = useState(0);
  // The first wall draws after the terrain; later swaps start at once.
  const [engaged, setEngaged] = useState(false);

  const n = types.length;
  if (n === 0) return null;

  const sel = Math.min(selected, n - 1);
  const active = types[sel] ?? types[0]!;
  const wallKey: WallKey = isWallKey(active.key)
    ? active.key
    : (WALL_KEYS[sel % WALL_KEYS.length] ?? 'winkel');
  const wallBase = engaged ? 0.05 : 0.5;

  const select = (i: number) => {
    setSelected(i);
    setEngaged(true);
  };

  const strokeAnim = (s: Stroke, base: number, mounted: boolean) => {
    const alpha = s.alpha ?? 1;
    const draw = !reduce && !s.dashed && !s.fade;
    const delay = reduce ? 0 : base + s.delay;
    return {
      initial: mounted ? (draw ? { pathLength: 0, opacity: 0 } : { opacity: 0 }) : false,
      animate: draw
        ? { pathLength: inView ? 1 : 0, opacity: inView ? alpha : 0 }
        : { opacity: inView ? alpha : 0 },
      transition: reduce
        ? { duration: 0.35 }
        : {
            pathLength: { duration: 0.55, delay, ease: EASE_LUXE },
            opacity: { duration: s.dashed || s.fade ? 0.45 : 0.25, delay },
          },
    } as const;
  };

  return (
    <div
      ref={rootRef}
      className={cn('flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-12', className)}
    >
      {/* ── Cross-section drawing ── */}
      <div className="min-w-0 lg:w-[58%]">
        <div className="relative rounded-sm border border-sand-50/10 bg-ink-950/40">
          {(
            [
              'top-2.5 start-2.5 border-t border-s',
              'top-2.5 end-2.5 border-t border-e',
              'bottom-2.5 start-2.5 border-b border-s',
              'bottom-2.5 end-2.5 border-b border-e',
            ] as const
          ).map((c) => (
            <span
              key={c}
              aria-hidden
              className={cn('pointer-events-none absolute size-4 border-bronze-500/60', c)}
            />
          ))}

          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid meet"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="block h-auto w-full select-none"
            aria-hidden
          >
            {/* HUD: hint line top-left */}
            <motion.rect
              x={24}
              y={41}
              width={5}
              height={5}
              fill={GOLD_HI}
              initial={false}
              animate={{ opacity: inView ? 1 : 0 }}
              transition={{ duration: 0.4, delay: reduce ? 0 : 0.2 }}
            />
            <motion.text
              x={36}
              y={48}
              fontSize={12}
              letterSpacing={2}
              fill={HUD_MUTED}
              style={{ fontFamily: MONO, textTransform: 'uppercase' }}
              initial={false}
              animate={{ opacity: inView ? 1 : 0 }}
              transition={{ duration: 0.4, delay: reduce ? 0 : 0.2 }}
            >
              {hint}
            </motion.text>

            {/* Constant scene */}
            {SCENE.map((s, i) => (
              <motion.path
                key={i}
                d={s.d}
                fill="none"
                stroke={s.hi ? GOLD_HI : GOLD}
                strokeWidth={s.width ?? 1.5}
                strokeDasharray={s.dashed ? '3 7' : undefined}
                {...strokeAnim(s, 0, false)}
              />
            ))}

            {/* Wall body — swapped per type */}
            <AnimatePresence mode="wait">
              <motion.g
                key={wallKey}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                {WALLS[wallKey].map((s, i) => (
                  <motion.path
                    key={i}
                    d={s.d}
                    fill="none"
                    stroke={s.hi ? GOLD_HI : GOLD}
                    strokeWidth={s.width ?? 1.5}
                    strokeDasharray={s.dashed ? '3 7' : undefined}
                    {...strokeAnim(s, wallBase, true)}
                  />
                ))}
              </motion.g>
            </AnimatePresence>

            {/* HUD: active type label beside the wall face */}
            {types.map((t, i) => (
              <motion.text
                key={`${i}-${t.key}`}
                x={378}
                y={176}
                fontSize={12}
                letterSpacing={1.6}
                fill={GOLD_HI}
                style={{ fontFamily: MONO, textTransform: 'uppercase' }}
                initial={false}
                animate={{ opacity: inView && i === sel ? 1 : 0 }}
                transition={{
                  duration: 0.3,
                  delay: i === sel && !reduce ? wallBase + 0.35 : 0,
                }}
              >
                {t.label}
              </motion.text>
            ))}
          </svg>
        </div>

        {/* The in-SVG hint scales below legibility on phones; this line is
            visible there and stays available to screen readers elsewhere. */}
        <p className="mt-3 flex items-center gap-2 font-mono text-[0.62rem] tracking-[0.3em] text-sand-400 uppercase sm:sr-only">
          <span aria-hidden className="inline-block size-1.5 shrink-0 bg-bronze-400" />
          {hint}
        </p>
      </div>

      {/* ── Type selection + caption ── */}
      <div className="min-w-0 flex-1 lg:pt-1">
        {/* Mobile: chip row (edge bleed, hidden scrollbar) */}
        <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:hidden">
          <div className="flex w-max gap-2.5 pb-1">
            {types.map((t, i) => {
              const isSel = i === sel;
              return (
                <button
                  key={`${i}-${t.key}`}
                  type="button"
                  aria-pressed={isSel}
                  onFocus={() => select(i)}
                  onClick={(e) => {
                    select(i);
                    e.currentTarget.scrollIntoView({
                      behavior: reduce ? 'auto' : 'smooth',
                      block: 'nearest',
                      inline: 'center',
                    });
                  }}
                  className={cn(
                    'inline-flex min-h-11 cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-sm border px-4 font-display text-sm uppercase transition-colors duration-300',
                    isSel
                      ? 'border-bronze-500 bg-bronze-500 text-ink-950'
                      : 'border-sand-50/10 bg-ink-850 text-sand-400 hover:border-sand-50/25 hover:text-sand-100',
                  )}
                >
                  <span className="tnum font-mono text-[0.65rem]">{num(i + 1)}</span>
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop: list rows — active = bronze text + left bronze bar */}
        <ol className="hidden lg:block">
          {types.map((t, i) => {
            const isSel = i === sel;
            return (
              <li
                key={`${i}-${t.key}`}
                className="relative border-b border-sand-50/10 first:border-t"
              >
                {isSel && (
                  <motion.span
                    layoutId={`${uid}-bar`}
                    aria-hidden
                    className="absolute start-0 top-2 bottom-2 w-0.5 bg-bronze-500"
                    transition={
                      reduce ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 26 }
                    }
                  />
                )}
                <button
                  type="button"
                  aria-pressed={isSel}
                  onClick={() => select(i)}
                  onFocus={() => select(i)}
                  className="group flex min-h-11 w-full cursor-pointer items-center gap-4 py-3 pe-1.5 ps-4 text-start sm:gap-5"
                >
                  <span
                    className={cn(
                      'tnum font-mono text-[0.65rem] tracking-[0.28em] transition-colors duration-300',
                      isSel ? 'text-bronze-400' : 'text-sand-500',
                    )}
                  >
                    {num(i + 1)}
                  </span>
                  <span
                    className={cn(
                      'min-w-0 flex-1 font-display text-base leading-snug transition-colors duration-300 sm:text-lg',
                      isSel ? 'text-bronze-300' : 'text-sand-400 group-hover:text-sand-200',
                    )}
                  >
                    {t.label}
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      'h-px w-5 shrink-0 transition-colors duration-300 sm:w-7',
                      isSel ? 'bg-bronze-500' : 'bg-sand-50/15 group-hover:bg-bronze-500/40',
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ol>

        {/* Caption panel — grid-stacked so the tallest text sets the height;
            crossfades to the selected type (nothing clips in DE/PL). */}
        <div
          aria-live="polite"
          className="card-luxe relative mt-4 grid min-h-36 overflow-hidden rounded-sm lg:mt-6"
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={`${sel}-${active.key}`}
              initial={{ opacity: 0, y: reduce ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 0 }}
              transition={{ duration: 0.3, ease: EASE_LUXE }}
              className="col-start-1 row-start-1 flex flex-col gap-2.5 p-5 sm:p-6"
            >
              <div className="flex items-baseline gap-3">
                <span className="tnum font-mono text-[0.65rem] tracking-[0.28em] text-bronze-400">
                  {num(sel + 1)}
                </span>
                <h3 className="font-display text-lg leading-snug font-semibold text-sand-50">
                  {active.label}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-sand-300">{active.text}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
