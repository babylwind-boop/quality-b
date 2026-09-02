'use client';

import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;

/* Gold line-art palette (matches HouseRise / ThermoLayers) */
const GOLD = '#a98b56';
const GOLD_HI = '#d0b586';
const HUD_MUTED = '#9b9b9b';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ── Geometry: wide fence strip (viewBox 960×300) ───────────────────
   Ground at y 250, five posts (x 120 … 840) rising to y 90. The three
   left bays carry the swappable infill; the last bay holds a garden gate.
   A hedge row sits behind the far-left post, a lamp post at the far right. */
const VB_W = 960;
const VB_H = 300;
const GROUND = 250;
const POST_TOP = 90;
const POST_HALF = 5;
const POSTS = [120, 300, 480, 660, 840] as const;
const BAY_W = 180;
const INSET = 9; // gap between a post face and the infill
const INFILL_TOP = 100;
const INFILL_BOTTOM = 246;
/** Bays (left → right) that receive the swappable infill. */
const INFILL_BAYS = [0, 1, 2] as const;
/** Each bay starts drawing a little after the previous one. */
const BAY_STAGGER = 0.18;
/** On the first reveal the infill waits for the posts to rise. */
const FIRST_BASE = 0.45;

interface Stroke {
  d: string;
  /** Draw delay in seconds, relative to the group start. */
  delay: number;
  width?: number;
  dashed?: boolean;
  /** Settles at reduced opacity (context / texture lines). */
  faint?: boolean;
  /** Uses the brighter bronze. */
  hi?: boolean;
}

const f = (x: number, y: number) => `${x.toFixed(1)} ${y.toFixed(1)}`;

const circle = (cx: number, cy: number, r: number) =>
  `M${cx + r} ${cy} a${r} ${r} 0 1 1 -0.1 0`;

/** Irregular six-point stone outline (deterministic jitter, no randomness). */
function stone(cx: number, cy: number, r: number, seed: number): string {
  const n = 6;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const jitter = ((seed * 7 + i * 5) % 29) - 14; // ±14°
    const a = ((i * 60 + jitter) * Math.PI) / 180;
    const rr = r * (0.72 + (((seed * 11 + i * 13) % 9) / 9) * 0.43);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  const mid = (i: number): [number, number] => {
    const p = pts[i]!;
    const q = pts[(i + 1) % n]!;
    return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  };
  const [mx, my] = mid(n - 1);
  let d = `M${f(mx, my)}`;
  for (let i = 0; i < n; i++) {
    const [px, py] = pts[i]!;
    const [qx, qy] = mid(i);
    d += ` Q${f(px, py)} ${f(qx, qy)}`;
  }
  return `${d} Z`;
}

/* ── Constant scene: ground, posts + caps, gate, hedge, lamp ─────────── */
function buildScene(): Stroke[] {
  const s: Stroke[] = [];

  s.push({ d: `M16 ${GROUND} H${VB_W - 16}`, delay: 0, width: 1.6 });
  s.push({ d: `M16 ${GROUND + 8} H${VB_W - 16}`, delay: 0.3, width: 1.2, dashed: true, faint: true });

  POSTS.forEach((x, i) => {
    s.push({
      d: `M${x - POST_HALF} ${GROUND} V${POST_TOP} H${x + POST_HALF} V${GROUND}`,
      delay: 0.12 + i * 0.1,
      width: 1.7,
    });
    // small pyramid cap
    s.push({
      d: `M${x - 8} ${POST_TOP} L${x - 4} ${POST_TOP - 7} H${x + 4} L${x + 8} ${POST_TOP}`,
      delay: 0.3 + i * 0.1,
      width: 1.4,
    });
  });

  /* garden gate in the last bay (660 … 840) */
  const gx0 = POSTS[3] + POST_HALF + 7; // 672
  const gx1 = POSTS[4] - POST_HALF - 7; // 828
  const gTop = 112;
  const gBottom = 242;
  const gMid = (gTop + gBottom) / 2;
  s.push({ d: `M${gx0} ${gBottom} V${gTop} H${gx1} V${gBottom} Z`, delay: 0.7, width: 1.8 });
  s.push({ d: `M${gx0} ${gMid} H${gx1}`, delay: 0.85, width: 1.2 });
  s.push({ d: `M${gx0} ${gBottom} L${gx1} ${gTop}`, delay: 0.9, width: 1.4 });
  // hinges bridging post face and frame
  s.push({ d: `M${POSTS[3] + POST_HALF} ${gTop + 18} H${gx0}`, delay: 0.98, width: 1.6 });
  s.push({ d: `M${POSTS[3] + POST_HALF} ${gBottom - 18} H${gx0}`, delay: 1.02, width: 1.6 });
  // round handle on the latch side
  s.push({ d: circle(gx1 - 22, gMid - 16, 5.5), delay: 1.08, width: 1.5, hi: true });

  /* faint hedge row behind the far-left post */
  (
    [
      [26, 24],
      [66, 28],
      [104, 22],
      [46, 16],
      [88, 14],
    ] as [number, number][]
  ).forEach(([cx, r], i) => {
    s.push({
      d: `M${cx - r} ${GROUND} A${r} ${r} 0 0 1 ${cx + r} ${GROUND}`,
      delay: 1.1 + i * 0.06,
      width: 1.2,
      faint: true,
    });
  });

  /* lamp post at the far right */
  const lx = 912;
  s.push({ d: `M${lx - 8} ${GROUND} V${GROUND - 5} H${lx + 8} V${GROUND}`, delay: 1.15, width: 1.4 });
  s.push({ d: `M${lx} ${GROUND - 5} V152`, delay: 1.2, width: 1.6 });
  s.push({ d: `M${lx - 10} 152 H${lx + 10} L${lx + 6} 132 H${lx - 6} Z`, delay: 1.32, width: 1.4, hi: true });
  s.push({ d: `M${lx} 132 V125`, delay: 1.4, width: 1.2 });

  return s;
}

/* ── Infill builders, one per fence type (x0 = left post centre) ─────── */
type InfillBuilder = (x0: number) => Stroke[];

/** Double-rod mesh: thin verticals every 24 units + six horizontal pairs. */
const doppelstab: InfillBuilder = (x0) => {
  const s: Stroke[] = [];
  const ix0 = x0 + INSET;
  const ix1 = x0 + BAY_W - INSET;
  for (let k = 0; k < 7; k++) {
    const x = ix0 + 9 + k * 24;
    s.push({ d: `M${x} ${INFILL_TOP} V${INFILL_BOTTOM}`, delay: k * 0.04, width: 1.2 });
  }
  for (let i = 0; i < 6; i++) {
    const y = 108 + i * 26;
    s.push({ d: `M${ix0} ${y - 2} H${ix1}`, delay: 0.24 + i * 0.05, width: 1.3 });
    s.push({ d: `M${ix0} ${y + 2} H${ix1}`, delay: 0.27 + i * 0.05, width: 1.3 });
  }
  return s;
};

/** Timber privacy screen: six boards (20 wide, 6 gaps) + a top rail. */
const holz: InfillBuilder = (x0) => {
  const s: Stroke[] = [];
  const ix0 = x0 + INSET;
  const ix1 = x0 + BAY_W - INSET;
  for (let k = 0; k < 6; k++) {
    const x = ix0 + 6 + k * 26;
    s.push({
      d: `M${x} ${INFILL_TOP} H${x + 20} V${INFILL_BOTTOM} H${x} Z`,
      delay: k * 0.06,
      width: 1.3,
    });
  }
  s.push({ d: `M${ix0} 112 H${ix1}`, delay: 0.42, width: 1.4, hi: true });
  s.push({ d: `M${ix0} 120 H${ix1}`, delay: 0.46, width: 1.4, hi: true });
  return s;
};

/** Gabion: low wide cage (16-unit mesh) filled with ~30 stones. */
const gabione: InfillBuilder = (x0) => {
  const s: Stroke[] = [];
  const cx0 = x0 + INSET + 1;
  const cx1 = cx0 + 160; // 10 cells
  const cTop = GROUND - 112; // 7 cells
  s.push({ d: `M${cx0} ${GROUND} V${cTop} H${cx1} V${GROUND} Z`, delay: 0, width: 1.7 });
  const vert: string[] = [];
  for (let x = cx0 + 16; x < cx1; x += 16) vert.push(`M${x} ${cTop} V${GROUND}`);
  s.push({ d: vert.join(' '), delay: 0.1, width: 1.2, faint: true });
  const horiz: string[] = [];
  for (let y = cTop + 16; y < GROUND; y += 16) horiz.push(`M${cx0} ${y} H${cx1}`);
  s.push({ d: horiz.join(' '), delay: 0.16, width: 1.2, faint: true });
  // stones: alternating rows of 8 / 7 → 30 per bay
  for (let row = 0; row < 4; row++) {
    const odd = row % 2 === 1;
    const count = odd ? 7 : 8;
    const cy = cTop + 14 + row * 28;
    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      const seed = row * 8 + i + Math.round(x0 / 60);
      const dx = ((seed * 5) % 5) - 2;
      const dy = ((seed * 7) % 5) - 2;
      const r = 7.5 + ((seed * 3) % 4) * 0.6;
      const cx = cx0 + (odd ? 23 : 13) + i * 19.2 + dx;
      parts.push(stone(cx, cy + dy, r, seed));
    }
    s.push({ d: parts.join(' '), delay: 0.28 + row * 0.09, width: 1.2 });
  }
  return s;
};

/** Rendered wall base with coping, topped by slim bars and a cap line. */
const mauer: InfillBuilder = (x0) => {
  const s: Stroke[] = [];
  const ix0 = x0 + INSET;
  const ix1 = x0 + BAY_W - INSET;
  const wallTop = 174;
  const copingTop = 166;
  s.push({ d: `M${ix0} ${GROUND} V${wallTop} H${ix1} V${GROUND}`, delay: 0, width: 1.6 });
  s.push({
    d: `M${ix0 - 3} ${copingTop} H${ix1 + 3} V${wallTop} H${ix0 - 3} Z`,
    delay: 0.12,
    width: 1.5,
  });
  s.push({
    d: [194, 214, 234].map((y) => `M${ix0 + 4} ${y} H${ix1 - 4}`).join(' '),
    delay: 0.18,
    width: 1.2,
    faint: true,
  });
  for (let k = 0; k < 8; k++) {
    const x = ix0 + 11 + k * 20;
    s.push({ d: `M${x} ${copingTop} V110`, delay: 0.28 + k * 0.04, width: 1.4 });
  }
  s.push({ d: `M${ix0} 110 H${ix1}`, delay: 0.64, width: 1.6, hi: true });
  return s;
};

/** Builders in the prop order (doppelstab, holz, gabione, mauer). */
const BUILDERS = [doppelstab, holz, gabione, mauer] as const;
const BUILDER_BY_KEY: Record<string, InfillBuilder> = { doppelstab, holz, gabione, mauer };

/** Infill for the three left bays, bay-staggered. */
function buildInfill(build: InfillBuilder): Stroke[] {
  return INFILL_BAYS.flatMap((bay) =>
    build(POSTS[bay]).map((st) => ({ ...st, delay: st.delay + bay * BAY_STAGGER })),
  );
}

const SCENE = buildScene();

/* ── Interactive fence-type strip ───────────────────────────────────────
   The posts, gate and context draw in once on scroll; the infill of the
   three left bays swaps per selected type (exit fade, staggered draw-in).
   Real chip buttons below drive the state; a stacked caption panel
   crossfades the description of the active type. */
export function FenceBuilder({
  types,
  hint,
  className,
}: {
  types: { key: string; label: string; text: string }[];
  hint: string;
  className?: string;
}) {
  const reduce = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const started = useInView(rootRef, { once: true, amount: 0.25 });
  const [selected, setSelected] = useState(0);
  // The first reveal waits for the posts; later swaps draw right away.
  const [swapped, setSwapped] = useState(false);

  const n = types.length;
  const sel = Math.min(selected, Math.max(n - 1, 0));
  const active = types[sel];

  const infill = useMemo(() => {
    if (!active) return [];
    const build = BUILDER_BY_KEY[active.key] ?? BUILDERS[sel % BUILDERS.length]!;
    return buildInfill(build);
  }, [active, sel]);

  if (!active) return null;

  const select = (i: number) => {
    if (i === sel) return;
    setSelected(i);
    setSwapped(true);
  };

  const base = swapped ? 0.05 : FIRST_BASE;

  return (
    <div ref={rootRef} className={cn('flex flex-col gap-4', className)}>
      {/* ── Fence strip ── */}
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
          {/* constant scene — draws once on scroll */}
          {SCENE.map((s, i) => (
            <motion.path
              key={i}
              d={s.d}
              fill="none"
              stroke={s.hi ? GOLD_HI : GOLD}
              strokeWidth={s.width ?? 1.5}
              strokeDasharray={s.dashed ? '3 7' : undefined}
              initial={false}
              // dashed strokes fade in — a pathLength draw would erase
              // the dash pattern (motion drives it via stroke-dasharray)
              animate={
                s.dashed
                  ? { opacity: started ? (s.faint ? 0.45 : 1) : 0 }
                  : {
                      pathLength: reduce ? 1 : started ? 1 : 0,
                      opacity: started ? (s.faint ? 0.5 : 1) : 0,
                    }
              }
              transition={
                reduce
                  ? { pathLength: { duration: 0 }, opacity: { duration: 0.35 } }
                  : {
                      pathLength: started
                        ? { duration: 0.65, delay: s.delay, ease: EASE_LUXE }
                        : { duration: 0 },
                      opacity: started
                        ? { duration: s.dashed ? 0.5 : 0.3, delay: s.delay }
                        : { duration: 0 },
                    }
              }
            />
          ))}

          {/* swappable infill of the three left bays */}
          <AnimatePresence initial={false}>
            <motion.g
              key={active.key}
              initial={false}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {infill.map((s, i) => (
                <motion.path
                  key={i}
                  d={s.d}
                  fill="none"
                  stroke={s.hi ? GOLD_HI : GOLD}
                  strokeWidth={s.width ?? 1.4}
                  initial={{ pathLength: reduce ? 1 : 0, opacity: 0 }}
                  animate={{
                    pathLength: reduce ? 1 : started ? 1 : 0,
                    opacity: started ? (s.faint ? 0.55 : 1) : 0,
                  }}
                  transition={
                    reduce
                      ? { pathLength: { duration: 0 }, opacity: { duration: 0.35 } }
                      : {
                          pathLength: started
                            ? { duration: 0.6, delay: base + s.delay, ease: EASE_LUXE }
                            : { duration: 0 },
                          opacity: started
                            ? { duration: 0.25, delay: base + s.delay }
                            : { duration: 0 },
                        }
                  }
                />
              ))}
            </motion.g>
          </AnimatePresence>

          {/* HUD: hint top-left (with a pulsing marker), active label bottom-right.
              Too small on phones — the legend below the drawing takes over there. */}
          <motion.rect
            x={28}
            y={30}
            width={6}
            height={6}
            fill={GOLD_HI}
            className="hidden sm:inline"
            initial={false}
            animate={{ opacity: started ? (reduce ? 1 : [1, 0.2, 1]) : 0 }}
            transition={
              started && !reduce
                ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }
                : { duration: 0.3 }
            }
          />
          <motion.text
            x={44}
            y={37}
            fontSize={13}
            letterSpacing={2.2}
            fill={HUD_MUTED}
            className="hidden sm:inline"
            style={{ fontFamily: MONO }}
            initial={false}
            animate={{ opacity: started ? 1 : 0 }}
            transition={{ duration: 0.4, delay: reduce ? 0 : 0.6 }}
          >
            {hint}
          </motion.text>
          <AnimatePresence initial={false}>
            <motion.text
              key={active.key}
              x={VB_W - 28}
              y={286}
              textAnchor="end"
              fontSize={15}
              letterSpacing={2.2}
              fill={GOLD_HI}
              className="hidden sm:inline"
              style={{ fontFamily: MONO }}
              initial={{ opacity: 0 }}
              animate={{ opacity: started ? 1 : 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: started && !swapped && !reduce ? 1.2 : 0 }}
            >
              {active.label}
            </motion.text>
          </AnimatePresence>
        </svg>

        {/* Mobile legend — the in-SVG HUD scales below legibility on phones */}
        <div className="flex items-baseline justify-between gap-3 px-4 pb-3 font-mono text-[0.62rem] tracking-[0.18em] text-sand-400 uppercase sm:hidden">
          <span className="min-w-0 truncate">{hint}</span>
          <span className="min-w-0 shrink-0 text-bronze-300">{active.label}</span>
        </div>
      </div>

      {/* ── Type chips: edge-bleed scroll row on phones, grid from sm ── */}
      <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
        <div className="flex w-max gap-2.5 pb-1 sm:grid sm:w-auto sm:grid-cols-2 sm:pb-0 lg:grid-cols-4">
          {types.map((t, i) => {
            const isActive = i === sel;
            return (
              <button
                key={t.key}
                type="button"
                aria-pressed={isActive}
                onClick={(e) => {
                  select(i);
                  e.currentTarget.scrollIntoView({
                    behavior: reduce ? 'auto' : 'smooth',
                    block: 'nearest',
                    inline: 'center',
                  });
                }}
                className={cn(
                  'inline-flex min-h-11 cursor-pointer items-center whitespace-nowrap rounded-sm border px-5 py-2 font-display text-sm uppercase transition-colors duration-300 sm:justify-center sm:text-center sm:whitespace-normal',
                  isActive
                    ? 'border-bronze-500 bg-bronze-500 text-ink-950'
                    : 'border-sand-50/10 bg-ink-850 text-sand-400 hover:border-sand-50/25 hover:text-sand-100',
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Caption panel — grid-stacked crossfade, tallest text sets the height ── */}
      <div aria-live="polite" className="card-luxe relative grid min-h-24 overflow-hidden rounded-sm">
        <AnimatePresence initial={false}>
          <motion.div
            key={active.key}
            initial={{ opacity: 0, y: reduce ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 0 }}
            transition={{ duration: 0.3, ease: EASE_LUXE }}
            className="col-start-1 row-start-1 flex flex-col gap-2 p-5 sm:p-6"
          >
            <h3 className="font-display text-lg leading-snug font-semibold text-sand-50">
              {active.label}
            </h3>
            <p className="text-sm leading-relaxed text-sand-300">{active.text}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
