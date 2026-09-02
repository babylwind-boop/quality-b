'use client';

import { useMemo, useRef, type ReactNode } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;

/* Gold line-art palette (matches ProcessStory / HouseRise) */
const GOLD = '#a98b56';
const GOLD_HI = '#d0b586';

/* Phase base delays, seconds: outline / insulation / render / coating */
const PHASE = [0, 1.1, 2.2, 3.2] as const;

/* ── Front elevation (viewBox 640×480) ─────────────────────────────── */
interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const P = (n: number) => n.toFixed(1);
const line = (x0: number, y0: number, x1: number, y1: number) =>
  `M${P(x0)} ${P(y0)} L${P(x1)} ${P(y1)}`;
const rect = ({ x0, y0, x1, y1 }: Rect) =>
  `M${P(x0)} ${P(y0)} H${P(x1)} V${P(y1)} H${P(x0)} Z`;

const WALL: Rect = { x0: 160, y0: 120, x1: 520, y1: 420 };
const GROUND_Y = 440;

/* Insulation grid: 6 × 8 panels in brick bond, rows counted from the plinth up */
const PW = 60;
const ROWS = 8;
const COLS = (WALL.x1 - WALL.x0) / PW;
const PH = (WALL.y1 - WALL.y0) / ROWS;
const rowTop = (r: number) => WALL.y1 - (r + 1) * PH;
const rowMid = (r: number) => rowTop(r) + PH / 2;

/* Openings sit on the panel grid: windows and door are two rows tall */
const WIN_W = 64;
const WINDOWS: Rect[] = [rowTop(6), rowTop(3)].flatMap((y0) =>
  [208, 408].map((x0) => ({ x0, y0, x1: x0 + WIN_W, y1: y0 + 2 * PH })),
);
const DOOR: Rect = { x0: 316, y0: rowTop(1), x1: 364, y1: WALL.y1 };
const OPENINGS: Rect[] = [...WINDOWS, DOOR];

/* Work bands are one panel row each: render on row 4, coating on row 7 */
const RENDER_ROW = 4;
const COAT_ROW = 7;
const RENDER_Y = rowMid(RENDER_ROW);
const COAT_Y = rowMid(COAT_ROW);

/* Tools sweep the band left → right; trailing strokes draw in lockstep */
const SWEEP = { from: 176, to: 494, lead: 0.1, duration: 0.8 } as const;
const BAND_X0 = 186;
const BAND_X1 = 484;
const TOOL_REST = 0.55;

/** Moment (seconds) at which a sweep starting at `base` passes screen x. */
function passAt(base: number, x: number): number {
  const p = (x - SWEEP.from) / (SWEEP.to - SWEEP.from);
  return base + SWEEP.lead + p * SWEEP.duration;
}

/* Scaffold over the left half: two standards, three decks, X-braces */
const SCAFFOLD = { x0: 176, x1: 324, top: 112, decks: [rowTop(6), rowTop(4), rowTop(1)] };

interface Stroke {
  d: string;
  /** Absolute draw delay in seconds (phase base + stagger). */
  delay: number;
  width?: number;
  /** Draw duration; default 0.65. */
  duration?: number;
  /** Linear draw so the stroke keeps pace with a sweeping tool. */
  linear?: boolean;
  dashed?: boolean;
  /** Settled opacity; scaffold and guides sit at 0.45, panels at 0.6. */
  opacity?: number;
  /** Later dip to `to` at `at` seconds — panels disappearing under render. */
  fade?: { at: number; to: number };
  /** Highlight strokes use the brighter bronze. */
  hi?: boolean;
}

function buildScene(): Stroke[] {
  const s: Stroke[] = [];
  const [b1, b2, b3, b4] = PHASE;

  /* ── Phase 1 · Outline: plinth, wall, roof, windows, door, scaffold ── */
  s.push({ d: line(120, GROUND_Y, 570, GROUND_Y), delay: b1, width: 1.8 });
  s.push({ d: rect(WALL), delay: b1 + 0.1 });
  s.push({ d: line(WALL.x0, WALL.y1, WALL.x0, GROUND_Y), delay: b1 + 0.2, width: 1 });
  s.push({ d: line(WALL.x1, WALL.y1, WALL.x1, GROUND_Y), delay: b1 + 0.24, width: 1 });
  s.push({ d: 'M138 128 L340 40 L542 128', delay: b1 + 0.3, width: 1.8 });
  s.push({ d: 'M450 88 V60 H468 V96 M447 60 H471', delay: b1 + 0.5, width: 1.1 });
  WINDOWS.forEach((w, i) => {
    const cx = (w.x0 + w.x1) / 2;
    const cy = (w.y0 + w.y1) / 2;
    s.push({ d: rect(w), delay: b1 + 0.42 + i * 0.08, width: 1.2 });
    s.push({
      d: `${line(cx, w.y0, cx, w.y1)} ${line(w.x0, cy, w.x1, cy)}`,
      delay: b1 + 0.55 + i * 0.08,
      width: 0.8,
    });
  });
  s.push({
    d: `M${P(DOOR.x0)} ${P(DOOR.y1)} V${P(DOOR.y0)} H${P(DOOR.x1)} V${P(DOOR.y1)}`,
    delay: b1 + 0.7,
    width: 1.2,
  });
  s.push({ d: 'M324 353 h32 v16 h-32 Z', delay: b1 + 0.8, width: 0.8 });
  s.push({ d: 'M354 386 a2 2 0 1 1 -0.1 0', delay: b1 + 0.86, width: 1 });
  // scaffold (faint, in front of the left half)
  const { x0: sx0, x1: sx1, top, decks } = SCAFFOLD;
  s.push({ d: line(sx0, GROUND_Y, sx0, top), delay: b1 + 0.5, width: 0.9, opacity: 0.45 });
  s.push({ d: line(sx1, GROUND_Y, sx1, top), delay: b1 + 0.56, width: 0.9, opacity: 0.45 });
  decks.forEach((y, i) => {
    s.push({ d: line(sx0 - 8, y, sx1 + 8, y), delay: b1 + 0.64 + i * 0.06, width: 0.9, opacity: 0.45 });
  });
  [...decks, GROUND_Y].slice(1).forEach((y1, i) => {
    const y0 = decks[i];
    s.push({
      d: `${line(sx0, y0, sx1, y1)} ${line(sx0, y1, sx1, y0)}`,
      delay: b1 + 0.8 + i * 0.05,
      width: 0.7,
      opacity: 0.45,
    });
  });

  /* ── Phase 2 · Insulation: brick-bond panels fill the wall bottom-left up,
        trimmed around windows and door; band rows dip later under the tools ── */
  for (let r = 0; r < ROWS; r++) {
    const y0 = rowTop(r);
    const y1 = y0 + PH;
    const shift = r % 2 ? PW / 2 : 0;
    const fadeBase = r === RENDER_ROW ? b3 : r === COAT_ROW ? b4 : undefined;
    for (let c = 0; c <= COLS; c++) {
      const x0 = Math.max(WALL.x0, WALL.x0 + c * PW - shift);
      const x1 = Math.min(WALL.x1, WALL.x0 + (c + 1) * PW - shift);
      if (x1 - x0 < 6) continue;
      let pieces: [number, number][] = [[x0, x1]];
      for (const o of OPENINGS) {
        if (o.y1 <= y0 || o.y0 >= y1) continue;
        pieces = pieces.flatMap(([px0, px1]): [number, number][] => {
          if (o.x1 <= px0 || o.x0 >= px1) return [[px0, px1]];
          const out: [number, number][] = [];
          if (o.x0 - px0 >= 6) out.push([px0, o.x0]);
          if (px1 - o.x1 >= 6) out.push([o.x1, px1]);
          return out;
        });
      }
      pieces.forEach(([px0, px1], k) => {
        s.push({
          d: rect({ x0: px0, y0, x1: px1, y1 }),
          delay: b2 + r * 0.09 + c * 0.02 + k * 0.01,
          width: 0.8,
          duration: 0.4,
          opacity: 0.6,
          ...(fadeBase === undefined
            ? {}
            : { fade: { at: passAt(fadeBase, (px0 + px1) / 2) + 0.05, to: 0.18 } }),
        });
      });
    }
  }

  /* ── Phase 3 · Render: snapped guide, wet band trailing the float ── */
  s.push({
    d: line(SWEEP.from, RENDER_Y, SWEEP.to, RENDER_Y),
    delay: b3,
    width: 0.9,
    dashed: true,
    opacity: 0.35,
  });
  const bt = RENDER_Y - 13;
  const bb = RENDER_Y + 13;
  s.push({
    d: `M${P(BAND_X0)} ${P(bt)} h-3 a7 7 0 0 0 -7 7 v12 a7 7 0 0 0 7 7 h3`,
    delay: b3 + 0.06,
    width: 1,
    opacity: 0.55,
  });
  [bt, bb].forEach((y) => {
    s.push({
      d: line(BAND_X0, y, BAND_X1, y),
      delay: b3 + SWEEP.lead,
      duration: SWEEP.duration,
      linear: true,
      width: 1,
      opacity: 0.55,
    });
  });
  s.push({
    d: `M${P(BAND_X1)} ${P(bt)} h3 a7 7 0 0 1 7 7 v12 a7 7 0 0 1 -7 7 h-3`,
    delay: passAt(b3, BAND_X1) - 0.1,
    duration: 0.3,
    width: 1,
    opacity: 0.55,
  });
  // trowel marks surface behind the float
  [224, 300, 376, 452].forEach((x) => {
    s.push({
      d: `M${P(x - 10)} ${P(RENDER_Y + 1)} q5 -4 10 0 t10 0`,
      delay: passAt(b3, x),
      duration: 0.3,
      width: 0.8,
      opacity: 0.4,
    });
  });

  /* ── Phase 4 · Coating: three highlight strokes trail the roller, sparkles ── */
  [-6, 0, 6].forEach((dy, i) => {
    s.push({
      d: line(BAND_X0 - 2, COAT_Y + dy, BAND_X1 + 2, COAT_Y + dy),
      delay: b4 + SWEEP.lead,
      duration: SWEEP.duration,
      linear: true,
      width: i === 1 ? 1.8 : 1.4,
      hi: true,
    });
  });
  s.push({ d: 'M250 64 v-16 m-8 8 h16', delay: b4 + 0.85, width: 1.2, hi: true });
  s.push({ d: 'M600 108 v-12 m-6 6 h12', delay: b4 + 0.95, width: 1, hi: true });
  s.push({ d: 'M556 306 v-12 m-6 6 h12', delay: b4 + 1.05, width: 1, hi: true });

  return s;
}

/* Window glint (upper-right window) — drawn with phase 4, pulses afterwards */
const GLINT = WINDOWS[1];
const GLINT_D = `M${P(GLINT.x0 + 6)} ${P(GLINT.y1 - 6)} V${P(GLINT.y0 + 6)} H${P(GLINT.x1 - 6)}`;
const GLINT_DELAY = PHASE[3] + 0.75;
const IDLE_DELAY = PHASE[3] + 1.6; // idle loop starts after the coating settles

/* Caption moments: insulation / render / coating / finished */
const CAPTION_AT = [PHASE[1] + 0.4, PHASE[2] + 0.4, PHASE[3] + 0.4, PHASE[3] + 1.0] as const;

/* Caption anchor points, one per phase, beside the part being worked on */
const LABEL_SPOTS = [
  { x: 150, y: rowMid(0) + 5, anchor: 'end' }, // insulation — beside the first panel row
  { x: 150, y: RENDER_Y + 5, anchor: 'end' }, // render — beside the wet band
  { x: 150, y: COAT_Y + 5, anchor: 'end' }, // coating — beside the roller band
  { x: 632, y: 78, anchor: 'end' }, // finished — top right, by the sparkles
] as const;

function labelTiming(i: number): {
  frames: number[];
  times?: number[];
  duration: number;
  delay: number;
} {
  const appear = CAPTION_AT[i] ?? 0;
  const nextAppear = CAPTION_AT[i + 1];
  if (nextAppear === undefined) return { frames: [0, 1], duration: 0.4, delay: appear };
  // fade in, hold, then dim to 40% when the next phase caption appears
  const hold = nextAppear - appear;
  const duration = hold + 0.5;
  return {
    frames: [0, 1, 1, 0.4],
    times: [0, 0.4 / duration, hold / duration, 1],
    duration,
    delay: appear,
  };
}

/* Tool opacity: fade in with its phase, rest dimmed once the sweep is done */
function toolTiming(): { frames: number[]; times: number[]; duration: number } {
  const settle = SWEEP.lead + SWEEP.duration + 0.1;
  const duration = settle + 0.4;
  return {
    frames: [0, 1, 1, TOOL_REST],
    times: [0, 0.3 / duration, settle / duration, 1],
    duration,
  };
}

/* One stroke of the drawing: pathLength draw-in, opacity settle, optional dip.
   Motion draws pathLength via stroke-dasharray, which would erase a dashed
   pattern — dashed strokes fade in instead. */
function DrawPath({ s, on, reduce }: { s: Stroke; on: boolean; reduce: boolean }) {
  const settle = s.opacity ?? 1;
  const fade = s.fade;
  const fadeDuration = fade ? fade.at + 0.35 - s.delay : 0;
  const opacity = !on ? 0 : !fade ? settle : reduce ? fade.to : [0, settle, settle, fade.to];
  const opacityTransition = !on
    ? { duration: 0 }
    : reduce
      ? { duration: 0.4, delay: s.delay, ease: 'easeOut' as const }
      : fade
        ? {
            duration: fadeDuration,
            delay: s.delay,
            times: [0, 0.3 / fadeDuration, (fade.at - s.delay) / fadeDuration, 1],
            ease: 'easeOut' as const,
          }
        : { duration: s.dashed ? 0.5 : 0.3, delay: s.delay };

  return (
    <motion.path
      d={s.d}
      fill="none"
      stroke={s.hi ? GOLD_HI : GOLD}
      strokeWidth={s.width ?? 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={s.dashed ? '3 7' : undefined}
      initial={false}
      animate={s.dashed ? { opacity } : { pathLength: reduce ? 1 : on ? 1 : 0, opacity }}
      transition={{
        pathLength:
          on && !reduce
            ? { duration: s.duration ?? 0.65, delay: s.delay, ease: s.linear ? 'linear' : EASE_LUXE }
            : { duration: 0 },
        opacity: opacityTransition,
      }}
    />
  );
}

/* A hand tool that draws in with its phase, then sweeps its band left → right */
function SweepTool({
  base,
  y,
  on,
  reduce,
  children,
}: {
  base: number;
  y: number;
  on: boolean;
  reduce: boolean;
  children: ReactNode;
}) {
  const timing = toolTiming();
  return (
    <g transform={`translate(0 ${P(y)})`}>
      <motion.g
        initial={false}
        animate={{
          x: reduce || on ? SWEEP.to : SWEEP.from,
          opacity: !on ? 0 : reduce ? TOOL_REST : timing.frames,
        }}
        transition={{
          x:
            on && !reduce
              ? { duration: SWEEP.duration, delay: base + SWEEP.lead, ease: 'linear' }
              : { duration: 0 },
          opacity: !on
            ? { duration: 0 }
            : reduce
              ? { duration: 0.4, delay: base, ease: 'easeOut' }
              : { duration: timing.duration, delay: base, times: timing.times, ease: 'easeOut' },
        }}
      >
        {children}
      </motion.g>
    </g>
  );
}

/* ── Self-running WDVS facade: outline → insulation → render → coating ── */
export function FacadeScene({
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

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <svg
        viewBox="0 0 640 480"
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full"
        aria-hidden
      >
        {strokes.map((s, i) => (
          <DrawPath key={i} s={s} on={inView} reduce={reduce} />
        ))}

        {/* Plastering float: tilted blade with a grip, sweeps the render band */}
        <SweepTool base={PHASE[2]} y={RENDER_Y} on={inView} reduce={reduce}>
          <g transform="rotate(-14)">
            <DrawPath s={{ d: 'M-16 -3 h32 v6 h-32 Z', delay: PHASE[2], width: 1.2 }} on={inView} reduce={reduce} />
            <DrawPath
              s={{ d: 'M-7 -3 v-3 q7 -7 14 0 v3', delay: PHASE[2] + 0.08, width: 1.1 }}
              on={inView}
              reduce={reduce}
            />
          </g>
        </SweepTool>

        {/* Paint roller: cylinder, frame and grip, sweeps the coating band */}
        <SweepTool base={PHASE[3]} y={COAT_Y} on={inView} reduce={reduce}>
          <DrawPath
            s={{
              d: 'M-14 -5.5 h28 a5.5 5.5 0 0 1 0 11 h-28 a5.5 5.5 0 0 1 0 -11 Z',
              delay: PHASE[3],
              width: 1.2,
            }}
            on={inView}
            reduce={reduce}
          />
          <DrawPath s={{ d: 'M14 0 h5 v6 h-9', delay: PHASE[3] + 0.08, width: 1 }} on={inView} reduce={reduce} />
          <DrawPath s={{ d: 'M10 6 v9', delay: PHASE[3] + 0.14, width: 2.2 }} on={inView} reduce={reduce} />
        </SweepTool>

        {/* Window glint: draws in at the finish, then breathes gently forever */}
        <motion.g
          initial={false}
          animate={!reduce && inView ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
          transition={
            !reduce && inView
              ? { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: IDLE_DELAY }
              : { duration: 0 }
          }
        >
          <DrawPath s={{ d: GLINT_D, delay: GLINT_DELAY, width: 1.4, hi: true }} on={inView} reduce={reduce} />
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
              fontSize={14}
              letterSpacing={2}
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
        {phaseLabels.map((label) => (
          <li
            key={label}
            className="flex items-center gap-1.5 font-mono text-[0.62rem] tracking-[0.18em] text-sand-400 uppercase"
          >
            <span aria-hidden className="size-1.5 shrink-0 bg-bronze-500" />
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
}
