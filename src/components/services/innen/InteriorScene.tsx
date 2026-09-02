'use client';

import { useMemo, useRef } from 'react';
import { motion, useInView, useReducedMotion, type SVGMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;

/* Gold line-art palette (matches ProcessStory / HouseRise) */
const GOLD = '#a98b56';
const GOLD_HI = '#d0b586';

/* Phase base delays, seconds: room / demolition / installation & fit-out / finish */
const PHASE = [0, 1.1, 2.2, 3.2] as const;

/* ── One-point perspective room (viewBox 640×480) ──────────────────── */
const WALL = { x1: 190, y1: 110, x2: 450, y2: 330 } as const; // back wall
const OUTER = { x1: 40, y1: 20, x2: 600, y2: 470 } as const; // where the room edges leave the canvas
const VP_Y = 220; // eye height — floor depth converges towards it

const fmt = (n: number) => n.toFixed(1);
const P = (x: number, y: number) => `${fmt(x)} ${fmt(y)}`;

/** Floor: screen x of the left / right floor edge at screen height y. */
function floorEdge(y: number): [number, number] {
  const spread = ((y - WALL.y2) * (WALL.x1 - OUTER.x1)) / (OUTER.y2 - WALL.y2);
  return [WALL.x1 - spread, WALL.x2 + spread];
}

/** Floor: screen y at depth t (0 = back wall, 1 = front edge), foreshortened like a real floor. */
function floorDepth(t: number): number {
  const near = (WALL.y2 - VP_Y) / (OUTER.y2 - VP_Y); // relative distance of the front edge
  return VP_Y + (WALL.y2 - VP_Y) / (1 + (near - 1) * t);
}

/** Right side wall: screen y at column x and height fraction f (0 = floor line, 1 = ceiling line). */
function rightWallY(x: number, f: number): number {
  const k = (x - WALL.x2) / (OUTER.x2 - WALL.x2);
  const floor = WALL.y2 + k * (OUTER.y2 - WALL.y2);
  const ceiling = WALL.y1 - k * (WALL.y1 - OUTER.y1);
  return floor - f * (floor - ceiling);
}

/* Roller passes on the back wall: three parallel diagonals, painted one after another */
const PAINT_X0 = 358;
const PAINT_Y0 = 150;
const PAINT_GAP = 22;
const PAINT_DX = 26;
const PAINT_DY = 56;
const PAINT_DUR = 0.4;
const PAINT_STEP = 0.42;
const PAINT: [number, number][] = [0, 1, 2].map((i) => [PAINT_X0 + i * PAINT_GAP, PAINT_Y0]);

const BROOM_DELAY = PHASE[1] + 0.1;
const ROLLER_DELAY = PHASE[2] + 0.3;
const GLOW_DELAY = PHASE[3] + 0.45;
const GLOW_LOOP_DELAY = PHASE[3] + 1.6; // idle loop starts after the finish settles

/* The roller tip follows each pass while it draws, hopping to the next start in between */
const ROLLER_X = PAINT.flatMap(([x]) => [x, x + PAINT_DX]);
const ROLLER_Y = PAINT.flatMap(([, y]) => [y, y + PAINT_DY]);
const ROLLER_TOTAL = PAINT_STEP * (PAINT.length - 1) + PAINT_DUR;
const ROLLER_TIMES = PAINT.flatMap((_, i) => [
  (i * PAINT_STEP) / ROLLER_TOTAL,
  (i * PAINT_STEP + PAINT_DUR) / ROLLER_TOTAL,
]);
const ROLLER_EASE = PAINT.flatMap((_, i) => (i === 0 ? [EASE_LUXE] : ['linear' as const, EASE_LUXE]));

interface Stroke {
  d: string;
  /** Absolute draw delay in seconds (phase base + stagger). */
  delay: number;
  width?: number;
  dashed?: boolean;
  /** Faint strokes settle at reduced opacity. */
  faint?: boolean;
  /** Highlight strokes use the brighter bronze. */
  hi?: boolean;
  /** Custom draw duration (paint passes stay in step with the roller). */
  dur?: number;
  /** Absolute time at which a temporary element fades away again (the rubble). */
  out?: number;
}

function buildScene(): Stroke[] {
  const s: Stroke[] = [];
  const [b1, b2, b3, b4] = PHASE;

  /* ── Phase 1 · Room: perspective edges, back wall, window, door, old rubble ── */
  const edges: [number, number, number, number][] = [
    [WALL.x1, WALL.y2, OUTER.x1, OUTER.y2],
    [WALL.x2, WALL.y2, OUTER.x2, OUTER.y2],
    [WALL.x1, WALL.y1, OUTER.x1, OUTER.y1],
    [WALL.x2, WALL.y1, OUTER.x2, OUTER.y1],
  ];
  edges.forEach(([x0, y0, x1, y1], i) => {
    s.push({ d: `M${x0} ${y0} L${x1} ${y1}`, delay: b1 + i * 0.08, width: 1.2 });
  });
  s.push({
    d: `M${WALL.x1} ${WALL.y1} H${WALL.x2} V${WALL.y2} H${WALL.x1} Z`,
    delay: b1 + 0.3,
    width: 1.6,
  });
  // window with cross mullions and a sill
  s.push({ d: 'M206 150 h86 v98 h-86 Z', delay: b1 + 0.55, width: 1.2 });
  s.push({ d: 'M249 150 V248', delay: b1 + 0.72, width: 0.9 });
  s.push({ d: 'M206 199 H292', delay: b1 + 0.8, width: 0.9 });
  s.push({ d: 'M201 251 h96', delay: b1 + 0.88, width: 1 });
  // door on the right side wall (verticals stay vertical in one-point perspective)
  const dx0 = 500;
  const dx1 = 545;
  s.push({
    d: `M${dx0} ${fmt(rightWallY(dx0, 0))} V${fmt(rightWallY(dx0, 0.72))} L${dx1} ${fmt(rightWallY(dx1, 0.72))} V${fmt(rightWallY(dx1, 0))}`,
    delay: b1 + 0.62,
    width: 1.2,
  });
  s.push({ d: `M${dx1 - 6} ${fmt(rightWallY(dx1, 0.34))} v9`, delay: b1 + 0.9, width: 1.6 });
  // leftover boards and rubble in the front-left corner — cleared in phase 2
  const rubbleOut = b2 + 0.45;
  [
    'M96 446 l54 -16',
    'M112 456 l58 -10',
    'M128 438 l26 -22',
    'M100 458 l7 -5 l6 5 Z',
    'M164 452 a4 4 0 1 1 -0.1 0',
    'M150 462 l14 -4',
  ].forEach((d, i) => {
    s.push({ d, delay: b1 + 0.7 + i * 0.05, width: 1, out: rubbleOut });
  });

  /* ── Phase 2 · Demontage: the broom sweeps (separate group); cable + sockets go in ── */
  s.push({ d: 'M444 116 H196 V302 H208', delay: b2 + 0.55, width: 1.1, dashed: true });
  ['M208 296 h12 v12 h-12 Z', 'M230 296 h12 v12 h-12 Z'].forEach((d, i) => {
    s.push({ d, delay: b2 + 0.8 + i * 0.15, width: 1.1 });
  });
  ['M211 302 h6', 'M233 302 h6'].forEach((d, i) => {
    s.push({ d, delay: b2 + 0.95 + i * 0.15, width: 1 });
  });

  /* ── Phase 3 · Installation / Ausbau: stepladder, roller passes, floorboards ── */
  const apex: [number, number] = [168, 262];
  const feetY = 440;
  const legL = 140;
  const legR = 198;
  s.push({ d: `M${apex[0]} ${apex[1]} L${legL} ${feetY}`, delay: b3, width: 1.3 });
  s.push({ d: `M${apex[0]} ${apex[1]} L${legR} ${feetY}`, delay: b3 + 0.08, width: 1.3 });
  s.push({ d: 'M172 260 L204 434', delay: b3 + 0.14, width: 0.8, faint: true });
  s.push({ d: 'M161 258 h14', delay: b3 + 0.2, width: 1.4 });
  [302, 340, 378, 416].forEach((y, i) => {
    const t = (y - apex[1]) / (feetY - apex[1]);
    s.push({
      d: `M${fmt(apex[0] + (legL - apex[0]) * t)} ${y} L${fmt(apex[0] + (legR - apex[0]) * t)} ${y}`,
      delay: b3 + 0.24 + i * 0.07,
      width: 1,
    });
  });
  // three roller passes on the back wall (the roller itself is a separate group)
  PAINT.forEach(([x, y], i) => {
    s.push({
      d: `M${x} ${y} l${PAINT_DX} ${PAINT_DY}`,
      delay: ROLLER_DELAY + i * PAINT_STEP,
      width: 2.2,
      hi: true,
      dur: PAINT_DUR,
    });
  });
  // floorboards, laid from the back wall forward — each a foreshortened slab
  for (let i = 0; i < 6; i++) {
    const gap = 1.2 + (i / 5) * 1.6;
    const yT = floorDepth(i / 6) + gap;
    const yB = floorDepth((i + 1) / 6) - gap;
    const [l0, r0] = floorEdge(yT);
    const [l1, r1] = floorEdge(yB);
    s.push({
      d: `M${P(l0 + 3, yT)} L${P(r0 - 3, yT)} L${P(r1 - 3, yB)} L${P(l1 + 3, yB)} Z`,
      delay: b3 + 0.35 + i * 0.14,
      width: 0.9,
    });
  }

  /* ── Phase 4 · Fertig: pendant lamp, plant in the back corner, sparkles ── */
  s.push({ d: 'M314 64 h12', delay: b4, width: 1.2 });
  s.push({ d: 'M320 64 V146', delay: b4 + 0.06, width: 1 });
  s.push({ d: 'M304 148 q16 -26 32 0', delay: b4 + 0.2, width: 1.4 });
  s.push({ d: 'M300 148 h40', delay: b4 + 0.3, width: 1.2 });
  s.push({ d: 'M320 155 a3.5 3.5 0 1 1 -0.1 0', delay: b4 + 0.4, width: 1, hi: true });
  // plant: pot + three leaf arcs
  s.push({ d: 'M426 342 h30 l-4 18 h-22 Z', delay: b4 + 0.3, width: 1.2 });
  ['M441 342 q-6 -22 -24 -30', 'M441 342 q1 -26 4 -42', 'M441 342 q8 -18 26 -24'].forEach(
    (d, i) => {
      s.push({ d, delay: b4 + 0.45 + i * 0.1, width: 1.2 });
    },
  );
  // sparkle plus-marks
  s.push({ d: 'M476 230 v-14 m-7 7 h14', delay: b4 + 0.7, width: 1.2, hi: true });
  s.push({ d: 'M258 136 v-12 m-6 6 h12', delay: b4 + 0.82, width: 1, hi: true });
  s.push({ d: 'M482 318 v-10 m-5 5 h10', delay: b4 + 0.94, width: 1, hi: true });

  return s;
}

type PathMotion = Pick<SVGMotionProps<SVGPathElement>, 'animate' | 'transition'>;

/** animate/transition for one stroke: draw on inView, settle, fade temporary bits out again. */
function strokeMotion(s: Stroke, on: boolean, reduce: boolean): PathMotion {
  const settle = s.faint ? 0.45 : 1;
  // motion draws pathLength via stroke-dasharray, which would erase a
  // dashed pattern — dashed strokes never get pathLength and fade in instead.
  const draw = s.dashed ? {} : { pathLength: reduce || on ? 1 : 0 };

  if (reduce) {
    return {
      animate: { ...draw, opacity: on && s.out === undefined ? settle : 0 },
      transition: {
        pathLength: { duration: 0 },
        opacity: { duration: 0.4, delay: s.delay, ease: 'easeOut' },
      },
    };
  }
  if (!on) {
    return { animate: { ...draw, opacity: 0 }, transition: { duration: 0 } };
  }
  const pathLength = { duration: s.dur ?? 0.65, delay: s.delay, ease: EASE_LUXE };
  if (s.out !== undefined) {
    // draw in, hold, then fade out when the sweep reaches it
    const total = s.out + 0.5 - s.delay;
    return {
      animate: { ...draw, opacity: [0, settle, settle, 0] },
      transition: {
        pathLength,
        opacity: {
          duration: total,
          delay: s.delay,
          times: [0, 0.3 / total, (s.out - s.delay) / total, 1],
          ease: 'easeOut',
        },
      },
    };
  }
  return {
    animate: { ...draw, opacity: settle },
    transition: {
      pathLength,
      opacity: { duration: s.dashed ? 0.5 : 0.3, delay: s.delay },
    },
  };
}

/* Caption anchor points, one per phase, near the part being worked on */
const LABEL_SPOTS = [
  { x: 48, y: 214, anchor: 'start' }, // room — on the left wall
  { x: 48, y: 346, anchor: 'start' }, // demolition — above the rubble corner
  { x: 596, y: 118, anchor: 'end' }, // installation — right wall, beside the roller passes
  { x: 320, y: 46, anchor: 'middle' }, // finish — on the ceiling above the pendant
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

/* Tool glyphs: broom (scene coordinates, swept sideways) and roller (drawn around its tip) */
const BROOM = [
  { d: 'M198 356 L156 418', width: 1.4 },
  { d: 'M142 408.5 L170 427.5', width: 2 },
  { d: 'M146 411 l-12.3 18 M153 415.5 l-12.3 18 M160 420 l-12.3 18 M167 424.5 l-12.3 18', width: 0.9 },
] as const;
const ROLLER = [
  { d: 'M8.3 -8.3 L11.7 -1 L-8.3 8.3 L-11.7 1 Z', width: 1.2 },
  { d: 'M0 0 L8 -16 L22 -24', width: 1.2 },
  { d: 'M22 -24 l6 -3', width: 2 },
] as const;

/* ── Self-running room renovation: room → demolition → fit-out → finish ── */
export function InteriorScene({
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
  const live = !reduce && inView;

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <svg
        viewBox="0 0 640 480"
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full"
        aria-hidden
      >
        {/* Pendant glow: fades in with the finish, then breathes gently forever */}
        <motion.g
          initial={false}
          animate={{ opacity: inView ? 1 : 0 }}
          transition={inView ? { duration: 0.6, delay: GLOW_DELAY, ease: 'easeOut' } : { duration: 0 }}
        >
          <motion.circle
            cx={320}
            cy={164}
            r={38}
            fill={GOLD_HI}
            initial={false}
            animate={{ opacity: live ? [0.15, 0.25, 0.1, 0.15] : 0.15 }}
            transition={
              live
                ? { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: GLOW_LOOP_DELAY }
                : { duration: 0 }
            }
          />
        </motion.g>

        {strokes.map((s, i) => {
          const m = strokeMotion(s, inView, reduce);
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
              animate={m.animate}
              transition={m.transition}
            />
          );
        })}

        {/* Broom: appears in phase 2, sweeps across the rubble, leaves again */}
        <motion.g
          initial={false}
          animate={live ? { x: [-34, 42], opacity: [0, 1, 1, 0] } : { x: -34, opacity: 0 }}
          transition={
            live
              ? {
                  x: { duration: 0.9, delay: BROOM_DELAY + 0.08, ease: 'easeInOut' },
                  opacity: { duration: 1, delay: BROOM_DELAY, times: [0, 0.15, 0.78, 1], ease: 'easeOut' },
                }
              : { duration: 0 }
          }
        >
          {BROOM.map((p) => (
            <path
              key={p.d}
              d={p.d}
              fill="none"
              stroke={GOLD}
              strokeWidth={p.width}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </motion.g>

        {/* Roller: rides the tip of each paint pass, then hops to the next one */}
        <motion.g
          initial={false}
          animate={
            live
              ? { x: ROLLER_X, y: ROLLER_Y, opacity: [0, 1, 1, 0] }
              : { x: PAINT_X0, y: PAINT_Y0, opacity: 0 }
          }
          transition={
            live
              ? {
                  x: { duration: ROLLER_TOTAL, delay: ROLLER_DELAY, times: ROLLER_TIMES, ease: ROLLER_EASE },
                  y: { duration: ROLLER_TOTAL, delay: ROLLER_DELAY, times: ROLLER_TIMES, ease: ROLLER_EASE },
                  opacity: {
                    duration: ROLLER_TOTAL + 0.5,
                    delay: ROLLER_DELAY - 0.15,
                    times: [0, 0.1, 0.85, 1],
                    ease: 'easeOut',
                  },
                }
              : { duration: 0 }
          }
        >
          {ROLLER.map((p) => (
            <path
              key={p.d}
              d={p.d}
              fill="none"
              stroke={GOLD}
              strokeWidth={p.width}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </motion.g>

        {/* Phase captions: appear with their phase, dim to 40% when superseded */}
        {phaseLabels.map((label, i) => {
          const spot = LABEL_SPOTS[i] ?? LABEL_SPOTS[0];
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
            className="flex items-center gap-1.5 font-mono text-[0.62rem] tracking-[0.18em] text-sand-400 uppercase"
          >
            <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-bronze-500" />
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
}
