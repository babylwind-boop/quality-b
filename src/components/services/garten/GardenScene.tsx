'use client';

import { useMemo, useRef } from 'react';
import {
  motion,
  useInView,
  useReducedMotion,
  type TargetAndTransition,
  type Transition,
} from 'motion/react';
import { cn } from '@/lib/utils';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;

/* Gold line-art palette (matches HouseRise / ProcessStory) */
const GOLD = '#a98b56';
const GOLD_HI = '#d0b586';

/* Phase base delays, seconds: planning / earthworks / planting / technology */
const PHASE = [0, 1.1, 2.2, 3.2] as const;

/* ── Elevation geometry (viewBox 640×480): house left, path leading right, pond ── */
const GROUND = 380;
const PATH_X0 = 300;
const PATH_X1 = 560;
const STAKES = [268, 456, 598] as const;
const TRUNK_X = 470;
const TRUNK_TOP = 284;
const LAMP_X = [334, 424, 546] as const;
const LAMP_HEAD_Y = 300;
const SPRINKLER = { x: 406, y: 366 } as const;
/* flower bed: [x, stem height] */
const FLOWERS = [
  [352, 16],
  [360, 22],
  [368, 14],
  [376, 20],
  [384, 17],
] as const;

/** Foreground edge of the path: converges towards the ground line to the right. */
function pathBottom(x: number): number {
  return GROUND + 18 - (8 * (x - PATH_X0)) / (PATH_X1 - PATH_X0);
}
function circ(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy} a${r} ${r} 0 1 1 ${2 * r} 0 a${r} ${r} 0 1 1 ${-2 * r} 0`;
}

interface Stroke {
  d: string;
  /** Absolute draw delay in seconds (phase base + stagger). */
  delay: number;
  width?: number;
  dashed?: boolean;
  /** Guide strokes settle at reduced opacity. */
  faint?: boolean;
  /** Highlight strokes use the brighter bronze. */
  hi?: boolean;
}

function buildScene(): Stroke[] {
  const s: Stroke[] = [];
  const [b1, b2, b3, b4] = PHASE;

  /* ── Phase 1 · Planung: ground line, existing house, plan roll, survey string ── */
  s.push({ d: `M20 ${GROUND} H620`, delay: b1, width: 1.2 });
  // gable end of the house with door and attic window
  s.push({ d: `M60 ${GROUND} V254`, delay: b1 + 0.08 });
  s.push({ d: `M220 ${GROUND} V254`, delay: b1 + 0.14 });
  s.push({ d: 'M44 266 L140 170 L236 266', delay: b1 + 0.22, width: 1.8 });
  s.push({ d: 'M60 254 H220', delay: b1 + 0.3, width: 0.8, faint: true });
  s.push({ d: `M126 ${GROUND} V324 H156 V${GROUND}`, delay: b1 + 0.36, width: 1.2 });
  s.push({ d: 'M126 200 h28 v26 h-28 Z', delay: b1 + 0.42, width: 1 });
  s.push({ d: 'M140 200 v26 M126 213 h28', delay: b1 + 0.5, width: 0.7, faint: true });
  // rolled plan sheet, top-left
  s.push({ d: 'M64 62 H146 V112 H64 Z', delay: b1 + 0.2, width: 1.4 });
  s.push({ d: 'M146 62 a10 25 0 0 1 0 50', delay: b1 + 0.34, width: 1.4 });
  s.push({ d: 'M146 112 a6 14 0 0 1 0 -28', delay: b1 + 0.42, width: 1 });
  s.push({ d: 'M76 76 h20 v14 h-20 Z', delay: b1 + 0.5, width: 0.8 });
  ['M104 84 h30', 'M76 98 h58', 'M76 106 h40'].forEach((d, i) => {
    s.push({ d, delay: b1 + 0.56 + i * 0.06, width: 0.8, faint: true });
  });
  // survey stakes with pennants; the string between them is dashed → fades in
  STAKES.forEach((x, i) => {
    s.push({ d: `M${x} ${GROUND} V346`, delay: b1 + 0.4 + i * 0.1, width: 1.2 });
    s.push({ d: `M${x} 346 l10 3 l-10 4 Z`, delay: b1 + 0.48 + i * 0.1, width: 1 });
  });
  s.push({
    d: `M${STAKES[0]} 350 H${STAKES[2]}`,
    delay: b1 + 0.72,
    width: 0.9,
    dashed: true,
    faint: true,
  });

  /* ── Phase 2 · Erdarbeiten: terrace slabs, path, pond basin, spoil heaps ── */
  [226, 250, 274].forEach((x, i) => {
    s.push({ d: `M${x} ${GROUND} h22 v12 h-22 Z`, delay: b2 + i * 0.1, width: 1.1 });
  });
  s.push({ d: `M${PATH_X0} ${GROUND} H${PATH_X1}`, delay: b2 + 0.28, width: 1.3 });
  s.push({
    d: `M${PATH_X0} ${pathBottom(PATH_X0)} L${PATH_X1} ${pathBottom(PATH_X1)}`,
    delay: b2 + 0.34,
    width: 1.1,
  });
  for (let i = 0; i < 6; i++) {
    const x = 322 + i * 44;
    s.push({
      d: `M${x} ${GROUND} V${pathBottom(x).toFixed(1)}`,
      delay: b2 + 0.42 + i * 0.07,
      width: 0.9,
    });
  }
  // pond: shallow basin below the ground line, two ripples
  s.push({ d: `M570 ${GROUND} a32 13 0 0 0 64 0`, delay: b2 + 0.6, width: 1.3 });
  s.push({ d: 'M580 386 q7 -4 14 0 t14 0 t12 0', delay: b2 + 0.82, width: 0.9, hi: true });
  s.push({ d: 'M592 379 q6 -4 12 0 t10 0', delay: b2 + 0.92, width: 0.9, hi: true });
  // spoil heaps
  s.push({ d: `M30 ${GROUND} q8 -10 16 0`, delay: b2 + 0.5, width: 1 });
  s.push({ d: `M46 ${GROUND} q6 -7 12 0`, delay: b2 + 0.58, width: 1 });
  s.push({ d: `M556 ${GROUND} q7 -10 14 0`, delay: b2 + 0.7, width: 1 });

  /* ── Phase 3 · Bepflanzung: trunk grows upward, branches, flower stems ── */
  s.push({ d: `M${TRUNK_X} ${GROUND} V${TRUNK_TOP}`, delay: b3, width: 2.2 });
  s.push({ d: `M${TRUNK_X} 322 l-15 -17`, delay: b3 + 0.32, width: 1.3 });
  s.push({ d: `M${TRUNK_X} 308 l16 -18`, delay: b3 + 0.4, width: 1.3 });
  FLOWERS.forEach(([x, h], i) => {
    s.push({ d: `M${x} ${GROUND} v${-h}`, delay: b3 + 0.55 + i * 0.06, width: 1 });
  });

  /* ── Phase 4 · Technik: lamp posts, sprinkler ── */
  LAMP_X.forEach((x, i) => {
    const t = b4 + i * 0.14;
    s.push({ d: `M${x} ${GROUND} V${LAMP_HEAD_Y + 6}`, delay: t, width: 1.4 });
    s.push({ d: `M${x - 5} ${GROUND} h10`, delay: t + 0.04, width: 1.2 });
    s.push({ d: circ(x, LAMP_HEAD_Y, 5), delay: t + 0.12, width: 1.2 });
  });
  s.push({ d: `M${SPRINKLER.x} ${GROUND} V${SPRINKLER.y}`, delay: b4 + 0.4, width: 1.2 });
  s.push({ d: `M${SPRINKLER.x - 5} ${SPRINKLER.y} h10`, delay: b4 + 0.48, width: 1.4 });

  return s;
}

/* ── Shapes that scale in from a transform origin instead of drawing ── */
const CANOPY = [
  { cx: 450, cy: 278, r: 26, delay: PHASE[2] + 0.5 },
  { cx: 470, cy: 254, r: 34, delay: PHASE[2] + 0.62 },
  { cx: 496, cy: 276, r: 28, delay: PHASE[2] + 0.74 },
] as const;

/* fill-box fractions of the canopy group so the idle sway pivots on the trunk top */
const CANOPY_BOX = CANOPY.reduce(
  (b, c) => ({
    x0: Math.min(b.x0, c.cx - c.r),
    x1: Math.max(b.x1, c.cx + c.r),
    y0: Math.min(b.y0, c.cy - c.r),
    y1: Math.max(b.y1, c.cy + c.r),
  }),
  { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity },
);
const SWAY_ORIGIN = {
  x: (TRUNK_X - CANOPY_BOX.x0) / (CANOPY_BOX.x1 - CANOPY_BOX.x0),
  y: (TRUNK_TOP - CANOPY_BOX.y0) / (CANOPY_BOX.y1 - CANOPY_BOX.y0),
};

/* shrubs along the path: [x, radius] → half-circle arcs on the ground line */
const SHRUBS = (
  [
    [306, 8],
    [431, 9],
    [498, 10],
    [522, 6],
  ] as const
).map(([x, r], i) => ({
  d: `M${x} ${GROUND} a${r} ${r} 0 0 1 ${2 * r} 0`,
  delay: PHASE[2] + 0.3 + i * 0.12,
}));

/* filled dots: flower heads on their stems + the door knob */
const DOTS = [
  ...FLOWERS.map(([x, h], i) => ({
    cx: x,
    cy: GROUND - h,
    r: 2.2,
    delay: PHASE[2] + 0.8 + i * 0.06,
  })),
  { cx: 150, cy: 352, r: 1.6, delay: PHASE[0] + 0.5 },
];

const GLOWS = LAMP_X.map((x, i) => ({ cx: x, cy: LAMP_HEAD_Y, delay: PHASE[3] + 0.3 + i * 0.14 }));

/* sprinkler water arcs, fanning left over the flower bed */
const SPRAY = ['q-10 -14 -24 -2', 'q-16 -28 -44 -4', 'q-22 -42 -62 -6'].map((tail, i) => ({
  d: `M${SPRINKLER.x} ${SPRINKLER.y} ${tail}`,
  delay: PHASE[3] + 0.58 + i * 0.13,
}));

const IDLE_DELAY = PHASE[3] + 1.7; // idle loops start after the scene settles

/* Caption anchor points, one per phase, near the part being laid out */
const LABEL_SPOTS = [
  { x: 188, y: 92, anchor: 'start' }, // planning — beside the plan roll
  { x: 430, y: 428, anchor: 'middle' }, // earthworks — below the path
  { x: 416, y: 226, anchor: 'end' }, // planting — beside the canopy
  { x: 620, y: 268, anchor: 'end' }, // technology — above the last lamp
] as const;

function labelTiming(i: number): {
  frames: number[];
  times?: number[];
  duration: number;
  delay: number;
} {
  const appear = (PHASE[i] ?? 0) + 0.45;
  const nextBase = PHASE[i + 1];
  if (nextBase === undefined) return { frames: [0, 1], duration: 0.4, delay: appear };
  // fade in, hold, then dim to 40% when the next phase caption appears
  const hold = nextBase + 0.45 - appear;
  const duration = hold + 0.5;
  return {
    frames: [0, 1, 1, 0.4],
    times: [0, 0.4 / duration, hold / duration, 1],
    duration,
    delay: appear,
  };
}

interface Anim {
  animate: TargetAndTransition;
  transition: Transition;
}

/* Line strokes draw via pathLength. motion writes stroke-dasharray for that,
   which would erase a dashed pattern — dashed strokes fade in instead. */
function drawAnim(s: Stroke, on: boolean, reduce: boolean): Anim {
  const opacity = on ? (s.faint ? 0.45 : 1) : 0;
  if (s.dashed) {
    return {
      animate: { opacity },
      transition: on ? { duration: 0.5, delay: s.delay } : { duration: 0 },
    };
  }
  if (reduce) {
    return {
      animate: { pathLength: 1, opacity },
      transition: {
        pathLength: { duration: 0 },
        opacity: on ? { duration: 0.4, delay: s.delay, ease: 'easeOut' } : { duration: 0 },
      },
    };
  }
  return {
    animate: { pathLength: on ? 1 : 0, opacity },
    transition: on
      ? {
          pathLength: { duration: 0.65, delay: s.delay, ease: EASE_LUXE },
          opacity: { duration: 0.3, delay: s.delay },
        }
      : { duration: 0 },
  };
}

/* Shapes that pop in with a small overshoot (opacity-only under reduced motion). */
function popAnim(delay: number, on: boolean, reduce: boolean, opacity = 1): Anim {
  if (reduce) {
    return {
      animate: { scale: 1, opacity: on ? opacity : 0 },
      transition: on ? { duration: 0.4, delay, ease: 'easeOut' } : { duration: 0 },
    };
  }
  return {
    animate: { scale: on ? [0, 1.06, 1] : 0, opacity: on ? opacity : 0 },
    transition: on
      ? {
          scale: { duration: 0.55, delay, ease: EASE_LUXE },
          opacity: { duration: 0.25, delay },
        }
      : { duration: 0 },
  };
}

/* ── Self-running garden lay-out: planning → earthworks → planting → technology ── */
export function GardenScene({
  className,
  phaseLabels,
}: {
  className?: string;
  phaseLabels: [string, string, string, string];
}) {
  const reduce = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.3 });
  const strokes = useMemo(() => buildScene(), []);
  const idle = !reduce && inView;

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <svg
        viewBox="0 0 640 480"
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full"
        aria-hidden
      >
        {strokes.map((s, i) => {
          const a = drawAnim(s, inView, reduce);
          return (
            <motion.path
              key={i}
              d={s.d}
              fill="none"
              stroke={s.hi ? GOLD_HI : GOLD}
              strokeWidth={s.width ?? 1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={s.dashed ? '3 7' : undefined}
              initial={false}
              animate={a.animate}
              transition={a.transition}
            />
          );
        })}

        {/* Shrubs pop up from the ground line */}
        {SHRUBS.map((p, i) => {
          const a = popAnim(p.delay, inView, reduce);
          return (
            <motion.path
              key={i}
              d={p.d}
              fill="none"
              stroke={GOLD}
              strokeWidth={1.2}
              strokeLinecap="round"
              style={{ originX: 0.5, originY: 1 }}
              initial={false}
              animate={a.animate}
              transition={a.transition}
            />
          );
        })}

        {/* Canopy: three circles grow from their centres, then sway gently around the trunk top */}
        <motion.g
          style={{ originX: SWAY_ORIGIN.x, originY: SWAY_ORIGIN.y }}
          animate={idle ? { rotate: [0, 1.5, -1.5, 0] } : { rotate: 0 }}
          transition={
            idle
              ? { duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: IDLE_DELAY }
              : { duration: 0 }
          }
        >
          {CANOPY.map((c, i) => {
            const a = popAnim(c.delay, inView, reduce);
            return (
              <motion.circle
                key={i}
                cx={c.cx}
                cy={c.cy}
                r={c.r}
                fill="none"
                stroke={GOLD}
                strokeWidth={1.4}
                initial={false}
                animate={a.animate}
                transition={a.transition}
              />
            );
          })}
        </motion.g>

        {/* Flower heads + door knob */}
        {DOTS.map((d, i) => {
          const a = popAnim(d.delay, inView, reduce);
          return (
            <motion.circle
              key={i}
              cx={d.cx}
              cy={d.cy}
              r={d.r}
              fill={GOLD_HI}
              initial={false}
              animate={a.animate}
              transition={a.transition}
            />
          );
        })}

        {/* Faint lamp glows switch on after each head is drawn */}
        {GLOWS.map((g, i) => {
          const a = popAnim(g.delay, inView, reduce, 0.2);
          return (
            <motion.circle
              key={i}
              cx={g.cx}
              cy={g.cy}
              r={12}
              fill={GOLD_HI}
              initial={false}
              animate={a.animate}
              transition={a.transition}
            />
          );
        })}

        {/* Sprinkler arcs: fade in with phase 4, then pulse one after another */}
        {SPRAY.map((w, i) => (
          <motion.g
            key={i}
            initial={false}
            animate={{ opacity: inView ? 1 : 0 }}
            transition={inView ? { duration: 0.5, delay: w.delay, ease: 'easeOut' } : { duration: 0 }}
          >
            <motion.path
              d={w.d}
              fill="none"
              stroke={GOLD_HI}
              strokeWidth={1}
              strokeLinecap="round"
              initial={false}
              animate={idle ? { opacity: [0.9, 0.35, 0.9] } : { opacity: 0.9 }}
              transition={
                idle
                  ? {
                      duration: 2.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: IDLE_DELAY + i * 0.8,
                    }
                  : { duration: 0 }
              }
            />
          </motion.g>
        ))}

        {/* Phase captions: appear with their phase, dim to 40% when superseded */}
        {phaseLabels.map((label, i) => {
          const spot = LABEL_SPOTS[i]!;
          const timing = labelTiming(i);
          return (
            <motion.text
              key={`${i}-${label}`}
              x={spot.x}
              y={spot.y}
              textAnchor={spot.anchor}
              fontSize={15}
              letterSpacing={2.2}
              fill={GOLD_HI}
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
              initial={false}
              animate={{ opacity: inView ? timing.frames : 0 }}
              transition={
                inView
                  ? {
                      duration: timing.duration,
                      delay: timing.delay,
                      ease: 'easeOut',
                      ...(timing.times ? { times: timing.times } : {}),
                    }
                  : { duration: 0 }
              }
            >
              {label}
            </motion.text>
          );
        })}
      </svg>

      {/* The in-SVG captions scale below legibility on phones; this visible
          legend also gives screen readers the phase names. */}
      <ol className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 sm:hidden">
        {phaseLabels.map((label, i) => (
          <li
            key={label}
            className="tnum flex items-baseline gap-1.5 font-mono text-[0.62rem] tracking-[0.18em] text-sand-400 uppercase"
          >
            <span aria-hidden className="text-bronze-400">{`0${i + 1}`}</span>
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
}
