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

/* Gold line-art palette (matches HouseRise / GardenScene) */
const GOLD = '#a98b56';
const GOLD_HI = '#d0b586';

/* Phase base delays, seconds: request / offer / execution / acceptance */
const PHASE = [0, 1.1, 2.2, 3.3] as const;

/* ── Flow geometry (viewBox 640×400): four stations on a dashed baseline ── */
const BASE_Y = 250;
const BASE_X0 = 40;
const BASE_X1 = 620;
const STATION_X = [90, 250, 410, 570] as const;
const CHEVRON_X = [170, 330, 490] as const;
const CAPTION_Y = 290;
const STAMP = { cx: 286, cy: 214 } as const;
const SEAL = { cx: 570, cy: 205.5 } as const;
const DOT_TRAVEL = STATION_X[3] - STATION_X[0];
const IDLE_DELAY = PHASE[3] + 1.7; // the traveller starts after the last station settles

function chevron(x: number): string {
  return `M${x - 3.5} ${BASE_Y - 7} l7 7 l-7 7`;
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

  /* ── Baseline + resting chevrons: fade in with phase 1 ── */
  s.push({
    d: `M${BASE_X0} ${BASE_Y} H${BASE_X1}`,
    delay: b1,
    width: 1,
    dashed: true,
    faint: true,
  });
  CHEVRON_X.forEach((x, i) => {
    s.push({ d: chevron(x), delay: b1 + 0.3 + i * 0.1, width: 1.5, faint: true });
  });

  /* ── Phase 1 · Anfrage: specification sheet (4 list rows) + paper plane leaving ── */
  s.push({ d: 'M52 112 H112 L128 128 V228 H52 Z', delay: b1 + 0.15, width: 1.4 });
  s.push({ d: 'M112 112 V128 H128', delay: b1 + 0.35, width: 1.1 });
  s.push({ d: 'M64 130 h28', delay: b1 + 0.42, width: 1.8, hi: true });
  [150, 166, 182, 198].forEach((y, i) => {
    s.push({ d: `M64 ${y} h7`, delay: b1 + 0.5 + i * 0.09, width: 1.4, hi: true });
    s.push({ d: `M77 ${y} h39`, delay: b1 + 0.54 + i * 0.09, width: 1 });
  });
  s.push({
    d: 'M179 93 L168.5 123 L162.5 109.5 L149 106.5 Z',
    delay: b1 + 0.86,
    width: 1.3,
    hi: true,
  });
  s.push({ d: 'M179 93 L162.5 109.5', delay: b1 + 0.98, width: 1.1, hi: true });
  s.push({ d: 'M134 118 l9 -3', delay: b1 + 1.02, width: 1, faint: true });
  s.push({ d: 'M140 130 l10 -4', delay: b1 + 1.06, width: 1, faint: true });

  /* ── Phase 2 · Angebot: calculator sheet (display + key grid); stamp pops separately ── */
  s.push({ d: 'M212 112 H288 V228 H212 Z', delay: b2 + 0.15, width: 1.4 });
  s.push({ d: 'M222 122 H278 V138 H222 Z', delay: b2 + 0.3, width: 1.1 });
  s.push({ d: 'M256 130 h16', delay: b2 + 0.38, width: 1.6, hi: true });
  [148, 168, 188].forEach((y, r) => {
    [222, 244, 266].forEach((x, c) => {
      s.push({
        d: `M${x} ${y} h12 v12 h-12 Z`,
        delay: b2 + 0.42 + (r * 3 + c) * 0.045,
        width: 1,
      });
    });
  });

  /* ── Phase 3 · Ausführung: two hard hats, crane hook, wall rising row by row ── */
  s.push({ d: 'M373 172 a15 15 0 0 1 30 0', delay: b3 + 0.12, width: 1.4 });
  s.push({ d: 'M367 172 h42', delay: b3 + 0.2, width: 1.4 });
  s.push({ d: 'M421 178 a13 13 0 0 1 26 0', delay: b3 + 0.26, width: 1.3 });
  s.push({ d: 'M416 178 h36', delay: b3 + 0.34, width: 1.3 });
  s.push({ d: 'M404 88 h12 v10 h-12 Z', delay: b3 + 0.3, width: 1.1 });
  s.push({ d: 'M410 98 V124', delay: b3 + 0.38, width: 1.2 });
  s.push({ d: 'M410 124 a8 8 0 0 1 -16 0 V118', delay: b3 + 0.46, width: 1.4, hi: true });
  const rows = [
    { d: 'M372 228 H448 V214 H372 Z', joints: [397, 423], y0: 214, y1: 228 },
    { d: 'M372 214 V200 H448 V214', joints: [385, 410, 435], y0: 200, y1: 214 },
    { d: 'M372 200 V186 H448 V200', joints: [397, 423], y0: 186, y1: 200 },
  ];
  rows.forEach((row, i) => {
    const t = b3 + 0.36 + i * 0.26;
    s.push({ d: row.d, delay: t, width: 1.3 });
    row.joints.forEach((x, j) => {
      s.push({ d: `M${x} ${row.y0} V${row.y1}`, delay: t + 0.12 + j * 0.04, width: 1 });
    });
  });

  /* ── Phase 4 · Abnahme: clipboard with three ticks + handshake ── */
  s.push({ d: 'M556 118 H532 V228 H608 V118 H584', delay: b4 + 0.15, width: 1.4 });
  s.push({ d: 'M556 110 h28 v14 h-28 Z', delay: b4 + 0.3, width: 1.2 });
  [146, 166, 186].forEach((y, i) => {
    s.push({ d: `M566 ${y - 1} h30`, delay: b4 + 0.38 + i * 0.16, width: 1 });
    s.push({ d: `M544 ${y} l4 4 l9 -10`, delay: b4 + 0.46 + i * 0.16, width: 1.6, hi: true });
  });
  // two mirrored hands (arcs) reaching over each other, with short cuffs
  s.push({ d: 'M546 212 V222', delay: b4 + 0.86, width: 1.2 });
  s.push({ d: 'M594 212 V222', delay: b4 + 0.9, width: 1.2 });
  s.push({ d: 'M546 218 q12 -22 28 -10', delay: b4 + 0.94, width: 1.6, hi: true });
  s.push({ d: 'M594 218 q-12 -22 -28 -10', delay: b4 + 1.02, width: 1.6, hi: true });

  return s;
}

/* ── Shapes that pop in instead of drawing ── */
const MARKERS = [
  ...STATION_X.map((x, i) => ({ cx: x, cy: BASE_Y, r: 3.2, delay: PHASE[i] + 0.1 })),
  { cx: SEAL.cx, cy: SEAL.cy, r: 2.4, delay: PHASE[3] + 1.12 },
];

/* Highlight chevrons light up the moment the next phase begins */
const LIT_CHEVRONS = CHEVRON_X.map((x, i) => ({
  d: chevron(x),
  delay: PHASE[i + 1] ?? PHASE[3],
}));

const STAMP_DELAY = PHASE[1] + 0.9;

/* Caption anchor points, one per station, below the baseline */
const LABEL_SPOTS = STATION_X.map((x) => ({ x, y: CAPTION_Y }));

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
function popAnim(delay: number, on: boolean, reduce: boolean): Anim {
  if (reduce) {
    return {
      animate: { scale: 1, opacity: on ? 1 : 0 },
      transition: on ? { duration: 0.4, delay, ease: 'easeOut' } : { duration: 0 },
    };
  }
  return {
    animate: { scale: on ? [0, 1.06, 1] : 0, opacity: on ? 1 : 0 },
    transition: on
      ? {
          scale: { duration: 0.55, delay, ease: EASE_LUXE },
          opacity: { duration: 0.25, delay },
        }
      : { duration: 0 },
  };
}

/* The approval stamp comes down onto the sheet: large → settle. */
function stampAnim(delay: number, on: boolean, reduce: boolean): Anim {
  if (reduce) {
    return {
      animate: { scale: 1, opacity: on ? 1 : 0 },
      transition: on ? { duration: 0.4, delay, ease: 'easeOut' } : { duration: 0 },
    };
  }
  return {
    animate: { scale: on ? [1.5, 0.94, 1] : 1.5, opacity: on ? 1 : 0 },
    transition: on
      ? {
          scale: { duration: 0.5, delay, ease: EASE_LUXE },
          opacity: { duration: 0.2, delay },
        }
      : { duration: 0 },
  };
}

/* ── Self-running partner flow: request → offer → execution → acceptance ── */
export function PartnerFlowScene({
  phaseLabels,
  className,
}: {
  phaseLabels: [string, string, string, string];
  className?: string;
}) {
  const reduce = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.3 });
  const strokes = useMemo(() => buildScene(), []);
  const idle = !reduce && inView;
  const stamp = stampAnim(STAMP_DELAY, inView, reduce);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <svg
        viewBox="0 0 640 400"
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

        {/* Station markers on the baseline + the seal dot on the handshake */}
        {MARKERS.map((m, i) => {
          const a = popAnim(m.delay, inView, reduce);
          return (
            <motion.circle
              key={i}
              cx={m.cx}
              cy={m.cy}
              r={m.r}
              fill={GOLD_HI}
              initial={false}
              animate={a.animate}
              transition={a.transition}
            />
          );
        })}

        {/* Chevrons light up as each following phase begins */}
        {LIT_CHEVRONS.map((c, i) => {
          const a = popAnim(c.delay, inView, reduce);
          return (
            <motion.path
              key={i}
              d={c.d}
              fill="none"
              stroke={GOLD_HI}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ originX: 0.5, originY: 0.5 }}
              initial={false}
              animate={a.animate}
              transition={a.transition}
            />
          );
        })}

        {/* Approval stamp on the offer sheet */}
        <motion.g
          style={{ originX: 0.5, originY: 0.5 }}
          initial={false}
          animate={stamp.animate}
          transition={stamp.transition}
        >
          <circle cx={STAMP.cx} cy={STAMP.cy} r={17} fill="none" stroke={GOLD_HI} strokeWidth={1.5} />
          <circle
            cx={STAMP.cx}
            cy={STAMP.cy}
            r={12.5}
            fill="none"
            stroke={GOLD_HI}
            strokeWidth={0.8}
            opacity={0.6}
          />
          <path
            d={`M${STAMP.cx - 8} ${STAMP.cy} l5.5 5.5 l11 -12`}
            fill="none"
            stroke={GOLD_HI}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.g>

        {/* Idle loop: a bronze dot travels the baseline from the first to the last station */}
        <motion.circle
          cx={STATION_X[0]}
          cy={BASE_Y}
          r={4}
          fill={GOLD_HI}
          initial={false}
          animate={idle ? { x: [0, DOT_TRAVEL], opacity: [0, 1, 1, 0] } : { x: 0, opacity: 0 }}
          transition={
            idle
              ? {
                  x: {
                    duration: 4,
                    repeat: Infinity,
                    repeatDelay: 0.8,
                    ease: 'linear',
                    delay: IDLE_DELAY,
                  },
                  opacity: {
                    duration: 4,
                    repeat: Infinity,
                    repeatDelay: 0.8,
                    ease: 'linear',
                    times: [0, 0.06, 0.86, 1],
                    delay: IDLE_DELAY,
                  },
                }
              : { duration: 0 }
          }
        />

        {/* Phase captions: appear with their phase, dim to 40% when superseded */}
        {phaseLabels.map((label, i) => {
          const spot = LABEL_SPOTS[i] ?? { x: 0, y: CAPTION_Y };
          const timing = labelTiming(i);
          return (
            <motion.text
              key={`${i}-${label}`}
              x={spot.x}
              y={spot.y}
              textAnchor="middle"
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
            key={`${i}-${label}`}
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
