'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;

/* Gold line-art palette (matches HouseRise / ThermoLayers) */
const GOLD = '#a98b56';
const GOLD_HI = '#d0b586';

/* ── Top-down parking bay (viewBox 640×400) ────────────────────────
   The bay is a rounded rectangle with a kerb around three sides (the
   bottom stays open as the entry), a gutter channel along the right
   edge and a car parked in the middle. The surface pattern inside the
   bay is swapped per selection; the bay, kerb and car draw once. */
const VB_W = 640;
const VB_H = 400;
const BAY = { x: 90, y: 60, w: 460, h: 280, r: 10 } as const;
const BAY_R = BAY.x + BAY.w;
const BAY_B = BAY.y + BAY.h;
/** The car starts drawing once the bay and the first surface have settled. */
const CAR_BASE = 0.9;
/** The first surface waits for the bay outline; later swaps start at once. */
const FIRST_DRAW_BASE = 0.35;

const SURFACE_KEYS = ['pflaster', 'rasengitter', 'naturstein', 'asphalt'] as const;
type SurfaceKey = (typeof SURFACE_KEYS)[number];
const isSurfaceKey = (k: string): k is SurfaceKey =>
  (SURFACE_KEYS as readonly string[]).includes(k);

interface Surface {
  key: string;
  label: string;
  text: string;
  facts: string[];
}

interface Stroke {
  d: string;
  /** Draw delay in seconds (absolute for the frame/car, per swap for patterns). */
  delay: number;
  width?: number;
  dashed?: boolean;
  /** Faint strokes settle at reduced opacity. */
  faint?: boolean;
  /** Highlight strokes use the brighter bronze. */
  hi?: boolean;
}

const f = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function rrect(x: number, y: number, w: number, h: number, r: number): string {
  const x1 = x + w;
  const y1 = y + h;
  return (
    `M${f(x + r)} ${f(y)} H${f(x1 - r)} Q${f(x1)} ${f(y)} ${f(x1)} ${f(y + r)}` +
    ` V${f(y1 - r)} Q${f(x1)} ${f(y1)} ${f(x1 - r)} ${f(y1)} H${f(x + r)}` +
    ` Q${f(x)} ${f(y1)} ${f(x)} ${f(y1 - r)} V${f(y + r)} Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)} Z`
  );
}

/* ── Bay outline, kerb, entry line and gutter (drawn once) ── */
function buildFrame(): Stroke[] {
  const s: Stroke[] = [];
  s.push({ d: rrect(BAY.x, BAY.y, BAY.w, BAY.h, BAY.r), delay: 0, width: 1.6 });
  // kerb around left, top and right — the bottom is the open entry side
  s.push({ d: 'M80 348 V66 Q80 52 94 52 H562 Q576 52 576 66 V348', delay: 0.15, width: 0.9 });
  s.push({ d: 'M80 348 H576', delay: 0.55, width: 0.8, dashed: true, faint: true });
  // gutter channel with three drain ticks along the right edge
  s.push({ d: 'M556 66 V334', delay: 0.25, width: 1 });
  s.push({ d: 'M566 66 V334', delay: 0.32, width: 1 });
  [120, 200, 280].forEach((y, i) => {
    s.push({ d: `M556 ${y} H566`, delay: 0.5 + i * 0.08, width: 1.3, hi: true });
  });
  return s;
}

/* ── Car seen from above, nose to the right (drawn once) ── */
function buildCar(): Stroke[] {
  const b = CAR_BASE;
  const s: Stroke[] = [];
  s.push({ d: rrect(195, 135, 250, 130, 30), delay: b, width: 1.6 });
  // cabin glass: windshield arc + rear-window arc joined by the roof edges
  s.push({ d: 'M290 150 H360 Q394 200 360 250 H290 Q256 200 290 150 Z', delay: b + 0.2, width: 1.1 });
  s.push({ d: rrect(298, 158, 54, 84, 5), delay: b + 0.34, width: 1 });
  // wheels peek out of the body as small rounded tabs
  const wheel = (x: number, top: boolean) =>
    top
      ? `M${x} 135 V127 Q${x} 124 ${x + 3} 124 H${x + 33} Q${x + 36} 124 ${x + 36} 127 V135`
      : `M${x} 265 V273 Q${x} 276 ${x + 3} 276 H${x + 33} Q${x + 36} 276 ${x + 36} 273 V265`;
  (
    [
      [222, true],
      [380, true],
      [222, false],
      [380, false],
    ] as const
  ).forEach(([x, top], i) => {
    s.push({ d: wheel(x, top), delay: b + 0.5 + i * 0.07, width: 1.3 });
  });
  // mirrors at the windshield base
  s.push({ d: 'M366 135 V128 H378 V133', delay: b + 0.78, width: 1.1 });
  s.push({ d: 'M366 265 V272 H378 V267', delay: b + 0.84, width: 1.1 });
  // headlights
  s.push({ d: 'M440 158 V172', delay: b + 0.92, width: 1.4, hi: true });
  s.push({ d: 'M440 228 V242', delay: b + 0.97, width: 1.4, hi: true });
  return s;
}

/** Footprint that hides the surface pattern under the parked car. */
const CAR_SHADOW = [
  rrect(189, 129, 262, 142, 34),
  'M216 118 H264 V131 H216 Z',
  'M374 118 H422 V131 H374 Z',
  'M216 269 H264 V282 H216 Z',
  'M374 269 H422 V282 H374 Z',
  'M360 122 H384 V131 H360 Z',
  'M360 269 H384 V278 H360 Z',
].join(' ');

/* ── Surface patterns (clipped to the bay, swapped per selection) ── */

/** Running-bond concrete pavers: course lines + staggered head joints. */
function buildPflaster(): Stroke[] {
  const s: Stroke[] = [];
  const BW = 56;
  const BH = 28;
  const rows = BAY.h / BH;
  for (let k = 0; k < rows; k++) {
    const y0 = BAY.y + k * BH;
    const y1 = y0 + BH;
    if (k < rows - 1) {
      s.push({ d: `M${BAY.x} ${y1} H${BAY_R}`, delay: k * 0.06, width: 0.9 });
    }
    let d = '';
    for (let x = BAY.x + (k % 2 ? BW / 2 : BW); x < BAY_R; x += BW) {
      d += `M${x} ${y0} V${y1} `;
    }
    s.push({ d: d.trim(), delay: k * 0.06 + 0.05, width: 0.9 });
  }
  return s;
}

/** Grass grid: open cells, each with a tiny three-blade tuft. */
function buildRasengitter(): Stroke[] {
  const s: Stroke[] = [];
  const cols = 10;
  const rows = 6;
  const cw = BAY.w / cols;
  const ch = BAY.h / rows;
  for (let j = 1; j < cols; j++) {
    const x = BAY.x + j * cw;
    s.push({ d: `M${f(x)} ${BAY.y} V${BAY_B}`, delay: j * 0.04, width: 0.9 });
  }
  for (let i = 1; i < rows; i++) {
    const y = BAY.y + i * ch;
    s.push({ d: `M${BAY.x} ${f(y)} H${BAY_R}`, delay: 0.36 + i * 0.05, width: 0.9 });
  }
  for (let i = 0; i < rows; i++) {
    const cy = BAY.y + (i + 0.5) * ch + 5;
    let d = '';
    for (let c = 0; c < cols; c++) {
      const cx = BAY.x + (c + 0.5) * cw;
      d += `M${f(cx - 2)} ${f(cy)} l-4 -8 M${f(cx)} ${f(cy)} v-11 M${f(cx + 2)} ${f(cy)} l4 -8 `;
    }
    s.push({ d: d.trim(), delay: 0.6 + i * 0.06, width: 1.1, hi: true });
  }
  return s;
}

/* Fixed seed — the cobble layout must be identical on server and client. */
const SEED = [
  0.13, 0.71, 0.42, 0.88, 0.27, 0.59, 0.95, 0.04, 0.66, 0.33, 0.81, 0.19, 0.48, 0.74, 0.09, 0.62,
  0.37, 0.91, 0.23, 0.55, 0.78, 0.16, 0.44, 0.85, 0.31, 0.68, 0.02, 0.5, 0.97, 0.26, 0.63, 0.39,
  0.83, 0.11, 0.57, 0.72, 0.21, 0.46, 0.93, 0.35, 0.79, 0.07, 0.6, 0.29, 0.86, 0.17, 0.52, 0.99,
] as const;
const seed = (i: number) => SEED[i % SEED.length]!;

/** Natural stone: irregular polygon cobbles on a jittered, half-offset grid. */
function buildNaturstein(): Stroke[] {
  const s: Stroke[] = [];
  const cols = 8;
  const rows = 5;
  const cw = BAY.w / cols;
  const ch = BAY.h / rows;
  const R = Math.min(cw, ch) * 0.46;
  let n = 0;
  for (let r = 0; r < rows; r++) {
    const shift = r % 2 ? -cw * 0.4 : 0;
    const count = r % 2 ? cols + 1 : cols;
    for (let c = 0; c < count; c++) {
      const i = n++;
      const cx = BAY.x + (c + 0.5) * cw + shift + (seed(i * 3) - 0.5) * 8;
      const cy = BAY.y + (r + 0.5) * ch + (seed(i * 3 + 1) - 0.5) * 8;
      const verts = 5 + Math.floor(seed(i * 3 + 2) * 3);
      let d = '';
      for (let k = 0; k < verts; k++) {
        const a = ((k + (seed(i * 7 + k) - 0.5) * 0.5) / verts) * Math.PI * 2;
        const rad = R * (0.72 + 0.28 * seed(i * 5 + k + 2));
        d += `${k ? 'L' : 'M'}${f(cx + rad * Math.cos(a))} ${f(cy + rad * Math.sin(a))} `;
      }
      const sweep = ((cx - BAY.x) / BAY.w) * 0.5 + ((cy - BAY.y) / BAY.h) * 0.25;
      s.push({ d: `${d}Z`, delay: Math.max(0, sweep), width: 1 });
    }
  }
  return s;
}

/** Asphalt with gravel edge: inset outline, edge-stone ring, faint texture. */
function buildAsphalt(): Stroke[] {
  const s: Stroke[] = [];
  const IN = 12;
  s.push({
    d: rrect(BAY.x + IN, BAY.y + IN, BAY.w - 2 * IN, BAY.h - 2 * IN, 6),
    delay: 0,
    width: 1.2,
  });
  const STEP = 24;
  let top = '';
  let bottom = '';
  let left = '';
  let right = '';
  for (let x = BAY.x + STEP; x < BAY_R; x += STEP) {
    top += `M${x} ${BAY.y} V${BAY.y + IN} `;
    bottom += `M${x} ${BAY_B - IN} V${BAY_B} `;
  }
  for (let y = BAY.y + STEP; y < BAY_B; y += STEP) {
    left += `M${BAY.x} ${y} H${BAY.x + IN} `;
    right += `M${BAY_R - IN} ${y} H${BAY_R} `;
  }
  s.push({ d: top.trim(), delay: 0.15, width: 0.8 });
  s.push({ d: right.trim(), delay: 0.3, width: 0.8 });
  s.push({ d: bottom.trim(), delay: 0.45, width: 0.8 });
  s.push({ d: left.trim(), delay: 0.6, width: 0.8 });
  // faint diagonal texture, placed outside the car's footprint
  (
    [
      [120, 300],
      [152, 118],
      [160, 250],
      [300, 108],
      [400, 96],
      [470, 300],
      [500, 200],
      [330, 312],
      [480, 118],
      [250, 316],
    ] as const
  ).forEach(([x, y], k) => {
    s.push({ d: `M${x} ${y} l22 -22`, delay: 0.5 + k * 0.04, width: 0.8, faint: true });
  });
  return s;
}

function buildPatterns(): Record<SurfaceKey, Stroke[]> {
  return {
    pflaster: buildPflaster(),
    rasengitter: buildRasengitter(),
    naturstein: buildNaturstein(),
    asphalt: buildAsphalt(),
  };
}

/* ── Stroke primitives ─────────────────────────────────────────────── */

/** Frame/car stroke: draws once when the block scrolls into view. */
function DrawnStroke({ s, on, reduce }: { s: Stroke; on: boolean; reduce: boolean }) {
  const target = on ? (s.faint ? 0.45 : 1) : 0;
  return (
    <motion.path
      d={s.d}
      fill="none"
      stroke={s.hi ? GOLD_HI : GOLD}
      strokeWidth={s.width ?? 1.5}
      strokeDasharray={s.dashed ? '3 7' : undefined}
      initial={false}
      // motion draws pathLength via stroke-dasharray, which would erase a
      // dashed pattern — dashed strokes fade in instead.
      animate={
        s.dashed ? { opacity: target } : { pathLength: reduce ? 1 : on ? 1 : 0, opacity: target }
      }
      transition={
        reduce
          ? { pathLength: { duration: 0 }, opacity: { duration: 0.4, ease: 'easeOut' } }
          : {
              pathLength: on ? { duration: 0.65, delay: s.delay, ease: EASE_LUXE } : { duration: 0 },
              opacity: on ? { duration: s.dashed ? 0.5 : 0.3, delay: s.delay } : { duration: 0 },
            }
      }
    />
  );
}

/** Pattern stroke: draws in on mount (each swap mounts a fresh group). */
function PatternStroke({ s, base, reduce }: { s: Stroke; base: number; reduce: boolean }) {
  const target = s.faint ? 0.45 : 1;
  const fadeOnly = s.dashed || reduce;
  return (
    <motion.path
      d={s.d}
      fill="none"
      stroke={s.hi ? GOLD_HI : GOLD}
      strokeWidth={s.width ?? 1}
      strokeDasharray={s.dashed ? '3 7' : undefined}
      initial={fadeOnly ? { opacity: 0 } : { pathLength: 0, opacity: 0 }}
      animate={fadeOnly ? { opacity: target } : { pathLength: 1, opacity: target }}
      transition={
        reduce
          ? { duration: 0.3, ease: 'easeOut' }
          : {
              pathLength: { duration: 0.55, delay: base + s.delay, ease: EASE_LUXE },
              opacity: { duration: 0.25, delay: base + s.delay },
            }
      }
    />
  );
}

function Caption({ label, text, facts }: Omit<Surface, 'key'>) {
  return (
    <>
      <h3 className="font-display text-lg leading-snug font-semibold text-sand-50">{label}</h3>
      <p className="text-sm leading-relaxed text-sand-300">{text}</p>
      <ul className="mt-1 flex flex-col gap-1.5">
        {facts.map((fact) => (
          <li key={fact} className="flex items-start gap-2.5 text-sm leading-relaxed text-sand-300">
            <span aria-hidden className="mt-2 size-1.5 shrink-0 bg-bronze-500" />
            <span className="min-w-0">{fact}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ── Interactive driveway surface picker ────────────────────────────
   Gold line-art parking bay seen from above with a parked car; four
   chip buttons swap the surface pattern inside the bay (draw-in sweep,
   fade-out) and cross-fade a caption with the surface's facts. */
export function SurfacePicker({
  surfaces,
  hint,
  className,
}: {
  surfaces: Surface[];
  hint: string;
  className?: string;
}) {
  const reduce = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.25 });
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  const clipId = `sp-${uid}-bay`;
  const maskId = `sp-${uid}-car`;
  const [selected, setSelected] = useState(0);
  const [swapped, setSwapped] = useState(false);

  const frame = useMemo(() => buildFrame(), []);
  const car = useMemo(() => buildCar(), []);
  const patterns = useMemo(() => buildPatterns(), []);

  const n = surfaces.length;
  if (n === 0) return null;

  const sel = Math.min(selected, n - 1);
  const active = surfaces[sel]!;
  const kind: SurfaceKey = isSurfaceKey(active.key)
    ? active.key
    : SURFACE_KEYS[sel % SURFACE_KEYS.length]!;
  const pattern = patterns[kind];
  const on = reduce || inView;
  const base = swapped ? 0 : FIRST_DRAW_BASE;

  const select = (i: number) => {
    setSelected(i);
    setSwapped(true);
  };

  return (
    <div
      ref={rootRef}
      className={cn('flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12', className)}
    >
      {/* ── Top-down bay drawing with HUD ── */}
      <div className="min-w-0 flex-1">
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

          {/* HUD · hint (top-left) */}
          <div className="pointer-events-none absolute inset-x-5 top-3.5 flex min-w-0 items-center gap-2 font-mono text-[0.62rem] tracking-[0.3em] text-sand-400 uppercase">
            <motion.span
              aria-hidden
              className="inline-block size-1.5 shrink-0 bg-bronze-400"
              animate={reduce ? undefined : { opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span className="truncate">{hint}</span>
          </div>

          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid meet"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="block h-auto w-full select-none py-1.5"
            aria-hidden
          >
            <defs>
              <clipPath id={clipId}>
                <path d={rrect(BAY.x, BAY.y, BAY.w, BAY.h, BAY.r)} />
              </clipPath>
              {/* The car's footprint clears the pattern as the car arrives */}
              <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={VB_W} height={VB_H}>
                <rect x={0} y={0} width={VB_W} height={VB_H} fill="#fff" />
                <motion.path
                  d={CAR_SHADOW}
                  fill="#000"
                  initial={false}
                  animate={{ opacity: on ? 1 : 0 }}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { duration: 0.6, delay: CAR_BASE + 0.3, ease: EASE_LUXE }
                  }
                />
              </mask>
            </defs>

            {/* Surface pattern — clipped to the bay, swapped per selection */}
            <g clipPath={`url(#${clipId})`}>
              <g mask={`url(#${maskId})`}>
                {on && (
                  <AnimatePresence>
                    <motion.g
                      key={active.key}
                      exit={{ opacity: 0 }}
                      transition={{ duration: reduce ? 0.2 : 0.3, ease: 'easeOut' }}
                    >
                      {pattern.map((s, j) => (
                        <PatternStroke key={j} s={s} base={base} reduce={reduce} />
                      ))}
                    </motion.g>
                  </AnimatePresence>
                )}
              </g>
            </g>

            {/* Bay, kerb, gutter — then the car */}
            {frame.map((s, i) => (
              <DrawnStroke key={`f${i}`} s={s} on={on} reduce={reduce} />
            ))}
            {car.map((s, i) => (
              <DrawnStroke key={`c${i}`} s={s} on={on} reduce={reduce} />
            ))}
          </svg>

          {/* HUD · active surface (bottom-right) */}
          <div className="pointer-events-none absolute inset-x-5 bottom-3.5 grid justify-items-end font-mono text-[0.62rem] tracking-[0.3em] text-bronze-400 uppercase">
            <AnimatePresence initial={false}>
              <motion.span
                key={active.key}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE_LUXE }}
                className="col-start-1 row-start-1 max-w-full truncate"
              >
                {active.label}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Surface chips + caption ── */}
      <div className="min-w-0 lg:w-[22rem] lg:shrink-0">
        <div role="group" aria-label={hint} className="grid grid-cols-2 gap-2.5">
          {surfaces.map((s, i) => {
            const isSel = i === sel;
            return (
              <button
                key={s.key}
                type="button"
                aria-pressed={isSel}
                onClick={() => select(i)}
                className={cn(
                  'inline-flex min-h-11 cursor-pointer items-center justify-center rounded-sm border px-3 py-2 text-center font-display text-[0.8rem] leading-tight uppercase transition-colors duration-300 sm:text-sm',
                  isSel
                    ? 'border-bronze-500 bg-bronze-500 text-ink-950'
                    : 'border-sand-50/10 bg-ink-850 text-sand-400 hover:border-sand-50/25 hover:text-sand-100',
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Caption panel — crossfades to the selected surface; grid-stacked with
            invisible sizers so the tallest caption fixes the height (no shift) */}
        <div
          aria-live="polite"
          className="card-luxe relative mt-4 grid min-h-52 overflow-hidden rounded-sm"
        >
          {surfaces.map((s) => (
            <div
              key={s.key}
              aria-hidden
              className="invisible col-start-1 row-start-1 flex flex-col gap-2.5 p-5 sm:p-6"
            >
              <Caption label={s.label} text={s.text} facts={s.facts} />
            </div>
          ))}
          <AnimatePresence initial={false}>
            <motion.div
              key={active.key}
              initial={{ opacity: 0, y: reduce ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 0 }}
              transition={{ duration: 0.3, ease: EASE_LUXE }}
              className="col-start-1 row-start-1 flex flex-col gap-2.5 p-5 sm:p-6"
            >
              <Caption label={active.label} text={active.text} facts={active.facts} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
