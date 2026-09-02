'use client';

import { useId, useMemo, useRef } from 'react';
import {
  motion,
  useInView,
  useReducedMotion,
  type TargetAndTransition,
  type Transition,
} from 'motion/react';
import { cn } from '@/lib/utils';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;

/* Gold line-art palette (matches GardenScene / HouseRise) */
const GOLD = '#a98b56';
const GOLD_HI = '#d0b586';

/* Phase base delays, seconds: excavation / shell / technology / finished */
const PHASE = [0, 1.1, 2.2, 3.3] as const;

/* ── Cross-section geometry (viewBox 640×420): house wall left, pit centre, tech shaft right ── */
const GROUND = 200;
/* pit opening: trapezoid from the ground line down to its floor */
const PIT = { x0: 220, x1: 520, fx0: 244, fx1: 496, floor: 340 } as const;
/* concrete shell: vertical walls + floor inside the pit */
const SHELL = { x0: 252, x1: 488, floor: 326 } as const;
const WATER_Y = 214;
const PIPE_Y = 248;
const LAMP = { cx: 480, cy: 300 } as const;
/* flow chevrons on the pipe, listed in flow direction (shaft → pool) */
const ARROW_X = [540, 524, 508] as const;
/* deck slabs: two on the terrace side, three on the shaft side */
const DECK_X = [202, 230, 492, 520, 548] as const;

function circ(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy} a${r} ${r} 0 1 1 ${2 * r} 0 a${r} ${r} 0 1 1 ${-2 * r} 0`;
}
/** Short diagonal rebar ticks, one subpath per point (drawn tick by tick). */
function ticks(points: [number, number][]): string {
  return points.map(([x, y]) => `M${x - 3.5} ${y + 3.5} l7 -7`).join(' ');
}
/** Water surface: a gentle wave wider than the pool, clipped to its interior. */
function wave(): string {
  let d = `M${SHELL.x0 - 14} ${WATER_Y} q8 -5 16 0`;
  for (let i = 0; i < 17; i++) d += ' t16 0';
  return d;
}

interface Stroke {
  d: string;
  /** Absolute draw delay in seconds (phase base + stagger). */
  delay: number;
  width?: number;
  /** Draw duration override, seconds (long outlines). */
  dur?: number;
  dashed?: boolean;
  /** Opacity-only entry instead of a pathLength draw (dashed strokes always fade). */
  fadeIn?: boolean;
  /** Leaves the scene at this time, seconds — site equipment, spoil, markers. */
  fadeAt?: number;
  /** Guide strokes settle at reduced opacity. */
  faint?: boolean;
  /** Highlight strokes use the brighter bronze. */
  hi?: boolean;
}

function buildScene(): Stroke[] {
  const s: Stroke[] = [];
  const [b1, b2, b3, b4] = PHASE;

  /* ── Phase 1 · Aushub: ground, house wall + terrace, pit, excavator arm, depth marker, spoil ── */
  s.push({ d: `M20 ${GROUND} H${PIT.x0}`, delay: b1, width: 1.2 });
  s.push({ d: `M${PIT.x1} ${GROUND} H620`, delay: b1 + 0.06, width: 1.2 });
  s.push({ d: `M40 ${GROUND} V90 H70 V${GROUND}`, delay: b1 + 0.1, width: 1.8 });
  s.push({
    d: 'M44 122 l22 -22 M44 152 l22 -22 M44 182 l22 -22',
    delay: b1 + 0.22,
    width: 0.8,
    faint: true,
  });
  s.push({ d: `M70 192 H198 V${GROUND}`, delay: b1 + 0.24, width: 1.3 });
  s.push({
    d: `M${PIT.x0} ${GROUND} L${PIT.fx0} ${PIT.floor} H${PIT.fx1} L${PIT.x1} ${GROUND}`,
    delay: b1 + 0.34,
    width: 1.6,
    dur: 0.9,
  });
  // excavator arm reaching in from the right edge — leaves once the shell goes in
  const gone = b2 + 0.1;
  s.push({ d: circ(632, 146, 3), delay: b1 + 0.5, width: 1.2, fadeAt: gone });
  s.push({ d: 'M632 146 L578 108', delay: b1 + 0.56, width: 1.6, fadeAt: gone });
  s.push({ d: 'M578 108 L540 172', delay: b1 + 0.68, width: 1.6, fadeAt: gone });
  s.push({ d: 'M540 172 L526 192', delay: b1 + 0.8, width: 1.3, fadeAt: gone });
  s.push({ d: 'M526 192 l-14 4 l4 14 l16 -4 Z', delay: b1 + 0.88, width: 1.4, fadeAt: gone });
  // depth marker down the middle of the pit
  s.push({
    d: `M370 ${GROUND + 4} V${PIT.floor - 4}`,
    delay: b1 + 0.82,
    width: 0.9,
    dashed: true,
    faint: true,
    fadeAt: gone,
  });
  s.push({
    d: `M364 ${GROUND} h12 M364 ${PIT.floor} h12`,
    delay: b1 + 0.92,
    width: 0.9,
    faint: true,
    fadeAt: gone,
  });
  // spoil heap right of the pit — cleared before the deck goes down
  s.push({
    d: `M545 ${GROUND} q30 -40 60 0`,
    delay: b1 + 0.7,
    width: 1.2,
    fadeIn: true,
    fadeAt: b4 + 0.5,
  });

  /* ── Phase 2 · Becken: U-shaped shell, entry steps, rebar hatch ── */
  s.push({
    d: `M${SHELL.x0} ${GROUND} V${SHELL.floor} H${SHELL.x1} V${GROUND}`,
    delay: b2,
    width: 2.2,
    dur: 0.9,
  });
  s.push({ d: `M${SHELL.x0} 232 H276 V264`, delay: b2 + 0.5, width: 1.4 });
  s.push({ d: 'M276 264 H300 V296', delay: b2 + 0.6, width: 1.4 });
  s.push({ d: `M300 296 H324 V${SHELL.floor}`, delay: b2 + 0.7, width: 1.4 });
  s.push({
    d: ticks([218, 242, 266, 290, 314].map((y) => [246, y])),
    delay: b2 + 0.55,
    width: 0.8,
    faint: true,
  });
  s.push({
    d: ticks([268, 296, 324, 352, 380, 408, 436, 464].map((x) => [x, 332])),
    delay: b2 + 0.7,
    width: 0.8,
    faint: true,
  });
  s.push({
    d: ticks([232, 258, 284, 310].map((y) => [494, y])),
    delay: b2 + 0.85,
    width: 0.8,
    faint: true,
  });

  /* ── Phase 3 · Technik: buried tech shaft (pump + filter), pipe run, inlet, skimmer ── */
  s.push({ d: 'M552 216 H612 V276 H552 Z', delay: b3, width: 1.4 });
  s.push({ d: `M576 216 V${GROUND} M588 216 V${GROUND}`, delay: b3 + 0.15, width: 1.1 });
  s.push({ d: circ(570, 250, 9), delay: b3 + 0.25, width: 1.2 });
  s.push({ d: circ(570, 250, 3), delay: b3 + 0.35, width: 1 });
  s.push({ d: 'M588 232 V262 a8 3 0 0 0 16 0 V232', delay: b3 + 0.4, width: 1.2 });
  s.push({ d: 'M588 232 a8 3 0 0 1 16 0 a8 3 0 0 1 -16 0', delay: b3 + 0.5, width: 1 });
  s.push({ d: `M552 ${PIPE_Y} H494`, delay: b3 + 0.55, width: 1.1, dashed: true });
  s.push({ d: circ(491, PIPE_Y, 3.5), delay: b3 + 0.7, width: 1.2 });
  s.push({ d: `M${SHELL.x1} 208 H500 V220 H${SHELL.x1}`, delay: b3 + 0.8, width: 1.2 });

  /* ── Phase 4 · Fertig: deck slabs, ladder, sparkles (water is filled separately) ── */
  DECK_X.forEach((x, i) => {
    s.push({ d: `M${x} 192 h24 v8 h-24 Z`, delay: b4 + 1 + i * 0.08, width: 1.1 });
  });
  s.push({ d: 'M466 270 V198 a10 10 0 0 1 10 -10 H500', delay: b4 + 1.35, width: 1.4 });
  s.push({ d: 'M478 270 V198 a10 10 0 0 1 10 -10 H500', delay: b4 + 1.45, width: 1.4 });
  s.push({ d: 'M466 218 H478 M466 238 H478 M466 258 H478', delay: b4 + 1.55, width: 1.2 });
  s.push({ d: 'M300 190 v-14 m-7 7 h14', delay: b4 + 1.7, width: 1.2, hi: true });
  s.push({ d: 'M424 186 v-10 m-5 5 h10', delay: b4 + 1.82, width: 1, hi: true });

  return s;
}

const FILL_DELAY = PHASE[3] + 0.05;
const WAVE: Stroke = { d: wave(), delay: PHASE[3] + 0.85, width: 1.1, dur: 0.8, hi: true };
const LAMP_DELAY = PHASE[2] + 0.95;
const ARROW_DELAY = PHASE[2] + 1.15; // flow starts once the pipe run is in
const IDLE_DELAY = PHASE[3] + 2.2; // idle loops start after the scene settles

/* Caption anchor points, one per phase, near the part being built */
const LABEL_SPOTS = [
  { x: 370, y: 374, anchor: 'middle' }, // excavation — below the pit floor
  { x: 204, y: 296, anchor: 'end' }, // shell — beside the left pit wall
  { x: 614, y: 302, anchor: 'end' }, // technology — under the tech shaft
  { x: 356, y: 168, anchor: 'middle' }, // finished — above the water
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
   which would erase a dashed pattern — dashed strokes fade in instead.
   Transient strokes (fadeAt) fade in, hold, then leave the scene. */
function drawAnim(s: Stroke, on: boolean, reduce: boolean): Anim {
  const level = s.faint ? 0.45 : 1;
  const fadeOnly = s.dashed || s.fadeIn;
  const rise = fadeOnly ? 0.5 : 0.3;
  let opacity: number | number[] = on ? level : 0;
  let opacityT: Transition = on
    ? { duration: rise, delay: s.delay, ease: 'easeOut' }
    : { duration: 0 };
  if (on && s.fadeAt !== undefined) {
    const total = s.fadeAt + 0.5 - s.delay;
    opacity = [0, level, level, 0];
    opacityT = {
      duration: total,
      delay: s.delay,
      times: [0, rise / total, (s.fadeAt - s.delay) / total, 1],
      ease: 'easeOut',
    };
  }
  if (fadeOnly) return { animate: { opacity }, transition: opacityT };
  return {
    animate: { pathLength: reduce || on ? 1 : 0, opacity },
    transition: {
      pathLength:
        on && !reduce
          ? { duration: s.dur ?? 0.65, delay: s.delay, ease: EASE_LUXE }
          : { duration: 0 },
      opacity: opacityT,
    },
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

/* ── Self-running pool cross-section: excavation → shell → technology → finished ── */
export function PoolBuildScene({
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
  const clipId = `pool-water-${useId().replace(/[^\w-]/g, '')}`;
  const idle = !reduce && inView;

  const waveAnim = drawAnim(WAVE, inView, reduce);
  const glowAnim = popAnim(LAMP_DELAY, inView, reduce, 0.18);
  const dotAnim = popAnim(LAMP_DELAY, inView, reduce);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <svg
        viewBox="0 0 640 420"
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full"
        aria-hidden
      >
        <defs>
          <clipPath id={clipId}>
            <rect
              x={SHELL.x0 + 1}
              y={GROUND}
              width={SHELL.x1 - SHELL.x0 - 2}
              height={SHELL.floor - GROUND}
            />
          </clipPath>
        </defs>

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

        {/* Water: the body rises from the floor to the water line inside the shell,
            then the surface draws in and drifts sideways forever */}
        <g clipPath={`url(#${clipId})`}>
          <motion.rect
            x={SHELL.x0 + 1}
            y={WATER_Y}
            width={SHELL.x1 - SHELL.x0 - 2}
            height={SHELL.floor - WATER_Y}
            fill={GOLD}
            style={{ originX: 0.5, originY: 1 }}
            initial={false}
            animate={{ scaleY: reduce || inView ? 1 : 0, opacity: inView ? 0.12 : 0 }}
            transition={
              inView
                ? {
                    scaleY: reduce
                      ? { duration: 0 }
                      : { duration: 1.2, delay: FILL_DELAY, ease: EASE_LUXE },
                    opacity: { duration: 0.3, delay: FILL_DELAY },
                  }
                : { duration: 0 }
            }
          />
          <motion.g
            animate={idle ? { x: [0, 6, 0, -6, 0] } : { x: 0 }}
            transition={
              idle
                ? { duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: IDLE_DELAY }
                : { duration: 0 }
            }
          >
            <motion.path
              d={WAVE.d}
              fill="none"
              stroke={GOLD_HI}
              strokeWidth={WAVE.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={false}
              animate={waveAnim.animate}
              transition={waveAnim.transition}
            />
          </motion.g>
        </g>

        {/* Flow chevrons on the pipe: fade in with the run, then light up in sequence */}
        {ARROW_X.map((x, i) => (
          <motion.g
            key={x}
            initial={false}
            animate={{ opacity: inView ? 1 : 0 }}
            transition={
              inView
                ? { duration: 0.5, delay: PHASE[2] + 0.75 + i * 0.1, ease: 'easeOut' }
                : { duration: 0 }
            }
          >
            <motion.path
              d={`M${x} ${PIPE_Y - 5} l-5 5 l5 5`}
              fill="none"
              stroke={GOLD_HI}
              strokeWidth={1.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={false}
              animate={idle ? { opacity: [0.35, 1, 0.35, 0.35] } : { opacity: reduce ? 0.85 : 0.35 }}
              transition={
                idle
                  ? {
                      duration: 1.6,
                      times: [0, 0.22, 0.5, 1],
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: ARROW_DELAY + i * 0.3,
                    }
                  : { duration: 0 }
              }
            />
          </motion.g>
        ))}

        {/* Wall lamp: glow + dot pop in with the technology, then pulse gently */}
        <motion.g
          animate={idle ? { opacity: [1, 0.45, 1] } : { opacity: 1 }}
          transition={
            idle
              ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: IDLE_DELAY }
              : { duration: 0 }
          }
        >
          <motion.circle
            cx={LAMP.cx}
            cy={LAMP.cy}
            r={9}
            fill={GOLD_HI}
            initial={false}
            animate={glowAnim.animate}
            transition={glowAnim.transition}
          />
          <motion.circle
            cx={LAMP.cx}
            cy={LAMP.cy}
            r={3}
            fill={GOLD_HI}
            initial={false}
            animate={dotAnim.animate}
            transition={dotAnim.transition}
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
            key={`${i}-${label}`}
            className="flex items-center gap-2 font-mono text-[0.62rem] tracking-[0.18em] text-sand-400 uppercase"
          >
            <span aria-hidden className="size-1.5 shrink-0 bg-bronze-400" />
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
}
