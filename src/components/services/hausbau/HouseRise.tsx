'use client';

import { useMemo, useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;

/* Gold line-art palette (matches ProcessStory) */
const GOLD = '#a98b56';
const GOLD_HI = '#d0b586';

/* Phase base delays, seconds: foundation / shell / roof / finishing */
const PHASE = [0, 1.1, 2.2, 3.2] as const;

/* ── Isometric projection (viewBox 640×480) ────────────────────────── */
const U = 48;
function iso(x: number, y: number, z: number): [number, number] {
  return [320 + (x - y) * 0.866 * U, 300 + (x + y) * 0.5 * U - z * 0.92 * U];
}
function pts(...list: [number, number, number][]): string {
  return list
    .map(([x, y, z], i) => {
      const [px, py] = iso(x, y, z);
      return `${i === 0 ? 'M' : 'L'}${px.toFixed(1)} ${py.toFixed(1)}`;
    })
    .join(' ');
}
const loop = (...list: [number, number, number][]) => `${pts(...list)} Z`;

const H = 1.9; // wall height
const RZ = 2.9; // ridge height
const F = 0.22; // foundation slab top
const CT = 3.2; // chimney top
const CORNERS = [
  [0, 0],
  [4, 0],
  [4, 3],
  [0, 3],
] as [number, number][];

interface Stroke {
  d: string;
  /** Absolute draw delay in seconds (phase base + stagger). */
  delay: number;
  width?: number;
  dashed?: boolean;
  /** Plot-grid strokes settle at reduced opacity. */
  faint?: boolean;
  /** Highlight strokes use the brighter bronze. */
  hi?: boolean;
}

function buildScene(): Stroke[] {
  const s: Stroke[] = [];
  const [b1, b2, b3, b4] = PHASE;

  /* ── Phase 1 · Fundament: plot grid (5×4 faint lines) + slab ── */
  for (let i = 0; i < 5; i++) {
    const y = -1.2 + i * 1.1;
    s.push({ d: pts([-1.4, y, 0], [4.2, y, 0]), delay: b1 + i * 0.06, width: 0.6, faint: true });
  }
  for (let j = 0; j < 4; j++) {
    const x = -1.4 + (j * 5.6) / 3;
    s.push({ d: pts([x, -1.2, 0], [x, 3.2, 0]), delay: b1 + 0.14 + j * 0.06, width: 0.6, faint: true });
  }
  s.push({ d: loop([0, 0, 0], [4, 0, 0], [4, 3, 0], [0, 3, 0]), delay: b1 + 0.38 });
  s.push({ d: pts([0, 0, 0], [4, 3, 0]), delay: b1 + 0.82, width: 0.8, dashed: true, faint: true });
  CORNERS.forEach(([x, y], i) => {
    s.push({ d: pts([x, y, 0], [x, y, F]), delay: b1 + 0.55 + i * 0.05, width: 1 });
  });
  s.push({ d: loop([0, 0, F], [4, 0, F], [4, 3, F], [0, 3, F]), delay: b1 + 0.72 });

  /* ── Phase 2 · Rohbau: corner columns, wall top, door + windows ── */
  CORNERS.forEach(([x, y], i) => {
    s.push({ d: pts([x, y, F], [x, y, H]), delay: b2 + i * 0.1 });
  });
  s.push({ d: loop([0, 0, H], [4, 0, H], [4, 3, H], [0, 3, H]), delay: b2 + 0.45 });
  // door on the front face (y = 3)
  s.push({
    d: pts([1.6, 3, 0.2], [1.6, 3, 1.4], [2.3, 3, 1.4], [2.3, 3, 0.2]),
    delay: b2 + 0.6,
    width: 1.2,
  });
  // two windows on the right face (x = 4)
  ([
    [0.5, 1.1],
    [1.8, 2.4],
  ] as [number, number][]).forEach(([y0, y1], i) => {
    s.push({
      d: loop([4, y0, 0.85], [4, y1, 0.85], [4, y1, 1.5], [4, y0, 1.5]),
      delay: b2 + 0.72 + i * 0.12,
      width: 1.2,
    });
  });

  /* ── Phase 3 · Dach: gables, ridge, battens on the front plane ── */
  s.push({ d: pts([0, 0, H], [0, 1.5, RZ], [0, 3, H]), delay: b3 });
  s.push({ d: pts([4, 0, H], [4, 1.5, RZ], [4, 3, H]), delay: b3 + 0.15 });
  s.push({ d: pts([0, 1.5, RZ], [4, 1.5, RZ]), delay: b3 + 0.3, width: 1.8 });
  [0.45, 0.85].forEach((f, i) => {
    s.push({
      d: pts([0, 3 - 1.5 * f, H + (RZ - H) * f], [4, 3 - 1.5 * f, H + (RZ - H) * f]),
      delay: b3 + 0.45 + i * 0.12,
      width: 0.9,
    });
  });

  /* ── Phase 4 · Fertig: chimney, flag pole, sparkles ── */
  const zA = H + (RZ - H) * ((3 - 1.9) / 1.5); // roof height under chimney back edge
  const zB = H + (RZ - H) * ((3 - 2.3) / 1.5); // roof height under chimney front edge
  s.push({ d: pts([2.9, 2.3, zB], [3.4, 2.3, zB]), delay: b4, width: 1.1 });
  s.push({ d: pts([3.4, 2.3, zB], [3.4, 1.9, zA]), delay: b4 + 0.06, width: 1.1 });
  s.push({ d: pts([2.9, 2.3, zB], [2.9, 2.3, CT]), delay: b4 + 0.12, width: 1.1 });
  s.push({ d: pts([3.4, 2.3, zB], [3.4, 2.3, CT]), delay: b4 + 0.16, width: 1.1 });
  s.push({ d: pts([3.4, 1.9, zA], [3.4, 1.9, CT]), delay: b4 + 0.2, width: 1.1 });
  s.push({
    d: loop([2.9, 1.9, CT], [3.4, 1.9, CT], [3.4, 2.3, CT], [2.9, 2.3, CT]),
    delay: b4 + 0.26,
    width: 1.1,
  });
  // flag pole on the ridge (the pennant sways separately)
  s.push({ d: pts([2, 1.5, RZ], [2, 1.5, RZ + 0.7]), delay: b4 + 0.3, width: 1.2 });
  // sparkle plus-marks
  s.push({ d: 'M180 200 v-16 m-8 8 h16', delay: b4 + 0.5, width: 1.2, hi: true });
  s.push({ d: 'M505 258 v-12 m-6 6 h12', delay: b4 + 0.62, width: 1, hi: true });

  return s;
}

const FLAG_TIP = iso(2, 1.5, RZ + 0.7);
const PENNANT_DELAY = PHASE[3] + 0.38;
const SWAY_DELAY = PHASE[3] + 1.4; // idle loop starts after the build settles

/* Caption anchor points, one per phase, near the part being built */
const LABEL_SPOTS = [
  { x: 278, y: 446, anchor: 'middle' }, // foundation — below the front face
  { x: 496, y: 296, anchor: 'start' }, // shell — beside the right wall
  { x: 244, y: 192, anchor: 'end' }, // roof — beside the left gable apex
  { x: 388, y: 212, anchor: 'start' }, // finish — beside the ridge flag
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

/* ── Self-running isometric build: foundation → shell → roof → finish ── */
export function HouseRise({
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
  const [flagX, flagY] = FLAG_TIP;

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <svg
        viewBox="0 0 640 480"
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full"
        aria-hidden
      >
        {strokes.map((s, i) => {
          const on = inView;
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
              animate={
                // motion draws pathLength via stroke-dasharray, which would
                // erase a dashed pattern — dashed strokes fade in instead.
                s.dashed
                  ? { opacity: on ? (s.faint ? 0.45 : 1) : 0 }
                  : {
                      pathLength: reduce ? 1 : on ? 1 : 0,
                      opacity: on ? (s.faint ? 0.45 : 1) : 0,
                    }
              }
              transition={
                reduce
                  ? {
                      pathLength: { duration: 0 },
                      opacity: { duration: 0.4, delay: s.delay, ease: 'easeOut' },
                    }
                  : {
                      pathLength: on
                        ? { duration: 0.65, delay: s.delay, ease: EASE_LUXE }
                        : { duration: 0 },
                      opacity: on
                        ? { duration: s.dashed ? 0.5 : 0.3, delay: s.delay }
                        : { duration: 0 },
                    }
              }
            />
          );
        })}

        {/* Ridge pennant: draws in with phase 4, then sways gently forever */}
        <motion.g
          style={{ originX: 0, originY: 0 }}
          animate={!reduce && inView ? { rotate: [0, 4, -4, 0] } : { rotate: 0 }}
          transition={
            !reduce && inView
              ? { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: SWAY_DELAY }
              : { duration: 0 }
          }
        >
          <motion.path
            d={`M${flagX.toFixed(1)} ${flagY.toFixed(1)} l 18 5 l -18 7 Z`}
            fill="none"
            stroke={GOLD_HI}
            strokeWidth={1.1}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: reduce ? 1 : inView ? 1 : 0, opacity: inView ? 1 : 0 }}
            transition={
              reduce
                ? {
                    pathLength: { duration: 0 },
                    opacity: { duration: 0.4, delay: PENNANT_DELAY, ease: 'easeOut' },
                  }
                : {
                    pathLength: inView
                      ? { duration: 0.65, delay: PENNANT_DELAY, ease: EASE_LUXE }
                      : { duration: 0 },
                    opacity: inView ? { duration: 0.3, delay: PENNANT_DELAY } : { duration: 0 },
                  }
            }
          />
        </motion.g>

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
