'use client';

import { useId, useMemo, useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { BadgeCheck, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;

/* Gold line-art palette (matches HouseRise / ProcessStory) */
const GOLD = '#a98b56';
const GOLD_HI = '#d0b586';
const SAND = '#f5f6f7';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* Phase base delays, seconds: draw-in / rows 1–2 / rows 3–4 / seal */
const PHASE = [0, 1.1, 2.2, 3.2] as const;
const ROW_DELAY = [PHASE[1], PHASE[1] + 0.4, PHASE[2], PHASE[2] + 0.4] as const;
const BUBBLE_DELAY = PHASE[1] + 0.5; // spirit level settles with the first ticks
const SEAL_DELAY = PHASE[3] + 0.1;
const IDLE_DELAY = PHASE[3] + 1.4; // idle loop starts after the stamp settles

/* ── Layout (viewBox 640×480): clipboard on the start side, wall + level on the end side ── */
const BOX_X = 52; // checkbox column on the sheet
const BOX = 16; // checkbox size
const LABEL_X = 84; // row label start
const ROW_Y0 = 140;
const ROW_GAP = 56;
const rowTop = (i: number) => ROW_Y0 + i * ROW_GAP;

const VIAL_CX = 512; // spirit-level centre
const VIAL_CY = 249;
const SEAL_X = 296; // stamp centre, bottom-right of the sheet
const SEAL_Y = 388;
const SEAL_TEXT_R = 25.5; // baseline radius of the curved seal text

/* ── Path helpers ── */
function rrect(x: number, y: number, w: number, h: number, r: number): string {
  const iw = w - 2 * r;
  const ih = h - 2 * r;
  return (
    `M${x + r} ${y} h${iw} a${r} ${r} 0 0 1 ${r} ${r} v${ih} a${r} ${r} 0 0 1 -${r} ${r} ` +
    `h-${iw} a${r} ${r} 0 0 1 -${r} -${r} v-${ih} a${r} ${r} 0 0 1 ${r} -${r} Z`
  );
}
function circ(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 -${2 * r} 0`;
}
/** Bold tick inside a 16px checkbox whose top-left corner is (x, y). */
function tick(x: number, y: number): string {
  return `M${x + 3.5} ${y + 8.5} l3.5 3.5 l6.5 -8`;
}

/* Seal text runs from 7 o'clock over the top to 5 o'clock (local coords, centre 0 0) */
const SEAL_ARC = (() => {
  const a = (145 * Math.PI) / 180;
  const x = SEAL_TEXT_R * Math.cos(a);
  const y = SEAL_TEXT_R * Math.sin(a);
  return `M${x.toFixed(1)} ${y.toFixed(1)} A${SEAL_TEXT_R} ${SEAL_TEXT_R} 0 1 1 ${(-x).toFixed(1)} ${y.toFixed(1)}`;
})();

interface Stroke {
  d: string;
  /** Absolute draw delay in seconds (phase base + stagger). */
  delay: number;
  width?: number;
  dashed?: boolean;
  /** Brick joints, row rules and guides settle at reduced opacity. */
  faint?: boolean;
  /** Highlight strokes use the brighter bronze. */
  hi?: boolean;
}

function buildScene(rowCount: number): Stroke[] {
  const s: Stroke[] = [];
  const [b1, , b3, b4] = PHASE;

  /* ── Phase 1 · Clipboard: board, clip, sheet with a dog-ear, header ── */
  s.push({ d: rrect(16, 40, 356, 412, 10), delay: b1, width: 1.8 });
  s.push({ d: rrect(150, 30, 88, 34, 5), delay: b1 + 0.12, width: 1.4 });
  s.push({ d: 'M174 30 v-4 a20 20 0 0 1 40 0 v4', delay: b1 + 0.2, width: 1.4 });
  s.push({ d: 'M34 68 H354 V416 L336 434 H34 Z', delay: b1 + 0.28, width: 1.2 });
  s.push({ d: 'M354 416 H336 V434', delay: b1 + 0.4, width: 1 });
  s.push({ d: 'M52 100 H172', delay: b1 + 0.48, width: 2 });
  s.push({ d: 'M52 120 H336', delay: b1 + 0.54, width: 0.8, faint: true });
  for (let i = 0; i < rowCount; i++) {
    s.push({
      d: `M${LABEL_X} ${rowTop(i) + 24} H340`,
      delay: b1 + 0.6 + i * 0.06,
      width: 0.8,
      faint: true,
    });
  }

  /* ── Phase 1 · Wall block: outline, two courses, running-bond joints, ground ── */
  s.push({ d: 'M404 268 H620 V376 H404 Z', delay: b1 + 0.3, width: 1.2 });
  [304, 340].forEach((y, i) => {
    s.push({ d: `M404 ${y} H620`, delay: b1 + 0.46 + i * 0.06, width: 0.8, faint: true });
  });
  ([
    [268, [476, 548]],
    [304, [440, 512, 584]],
    [340, [476, 548]],
  ] as [number, number[]][]).forEach(([y, xs], row) => {
    xs.forEach((x, j) => {
      s.push({
        d: `M${x} ${y} v36`,
        delay: b1 + 0.58 + row * 0.1 + j * 0.04,
        width: 0.8,
        faint: true,
      });
    });
  });
  s.push({ d: 'M384 392 H636', delay: b1 + 0.86, width: 0.8, dashed: true, faint: true });

  /* ── Phase 1 · Spirit level laid on the wall: body, end caps, vial, calibration ticks ── */
  s.push({ d: rrect(394, 236, 236, 26, 3), delay: b1 + 0.4, width: 1.5 });
  s.push({ d: 'M406 236 v26', delay: b1 + 0.55, width: 0.8, faint: true });
  s.push({ d: 'M618 236 v26', delay: b1 + 0.6, width: 0.8, faint: true });
  s.push({ d: rrect(486, 241, 52, 16, 8), delay: b1 + 0.66, width: 1.2 });
  s.push({ d: 'M505 237 v4 M519 237 v4', delay: b1 + 0.74, width: 0.8 });
  s.push({ d: 'M505 257 v4 M519 257 v4', delay: b1 + 0.8, width: 0.8 });

  /* ── Phase 2 / 3 · Checklist rows: box draws, then a bold tick inside ── */
  for (let i = 0; i < rowCount; i++) {
    const top = rowTop(i);
    const at = ROW_DELAY[i] ?? b3 + 0.4;
    s.push({ d: `M${BOX_X} ${top} h${BOX} v${BOX} h-${BOX} Z`, delay: at, width: 1.2 });
    s.push({ d: tick(BOX_X, top), delay: at + 0.32, width: 2.6, hi: true });
  }

  /* ── Phase 4 · Sparkle plus-marks beside the seal ── */
  s.push({ d: 'M356 346 v-14 m-7 7 h14', delay: b4 + 0.5, width: 1.2, hi: true });
  s.push({ d: 'M244 442 v-10 m-5 5 h10', delay: b4 + 0.62, width: 1, hi: true });

  return s;
}

function labelTiming(
  row: number,
  reduce: boolean,
): {
  frames: number[];
  times?: number[];
  duration: number;
  delay: number;
} {
  const appear = (ROW_DELAY[row] ?? PHASE[2]) + 0.2;
  // Rows 3–4 (and every row under reduced motion) simply fade in.
  if (reduce || row >= 2) return { frames: [0, 1], duration: 0.4, delay: appear };
  // Rows 1–2: fade in, hold, step back to 40% while rows 3–4 are ticked,
  // then return to full when the seal confirms the whole list.
  const dim = PHASE[2] + 0.2;
  const restore = SEAL_DELAY + 0.45;
  const duration = restore + 0.4 - appear;
  return {
    frames: [0, 1, 1, 0.4, 0.4, 1],
    times: [
      0,
      0.4 / duration,
      (dim - appear) / duration,
      (dim - appear + 0.5) / duration,
      (restore - appear) / duration,
      1,
    ],
    duration,
    delay: appear,
  };
}

/* ── Self-running quality check: clipboard → ticks → level settles → seal ── */
export function QualityScene({
  items,
  sealText,
  className,
}: {
  items: string[];
  sealText: string;
  className?: string;
}) {
  const reduce = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.3 });
  const rows = useMemo(() => items.slice(0, 4), [items]);
  const strokes = useMemo(() => buildScene(rows.length), [rows.length]);
  const rawId = useId();
  const arcId = `qs-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}-seal`;

  // SVG text cannot wrap: long criteria drop the whole list one size so it stays on the sheet.
  const labelSize = rows.some((label) => label.length > 24) ? 14 : 16;
  const sealSize = sealText.length > 8 ? 11 : 13;

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <svg
        viewBox="0 0 640 480"
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full"
        aria-hidden
      >
        <defs>
          <path id={arcId} d={SEAL_ARC} fill="none" />
        </defs>

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

        {/* Level bubble: draws with phase 1, slides to centre with the first
            ticks, then breathes ±2px forever once the scene has settled */}
        <motion.g
          animate={!reduce && inView ? { x: [0, 2, 0, -2, 0] } : { x: 0 }}
          transition={
            !reduce && inView
              ? { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: IDLE_DELAY }
              : { duration: 0 }
          }
        >
          <motion.g
            initial={false}
            animate={{ x: reduce || inView ? 0 : -13 }}
            transition={
              !reduce && inView
                ? { duration: 0.9, delay: BUBBLE_DELAY, ease: EASE_LUXE }
                : { duration: 0 }
            }
          >
            <motion.path
              d={circ(VIAL_CX, VIAL_CY, 4.5)}
              fill="none"
              stroke={GOLD_HI}
              strokeWidth={1.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={false}
              animate={{ pathLength: reduce ? 1 : inView ? 1 : 0, opacity: inView ? 1 : 0 }}
              transition={
                reduce
                  ? {
                      pathLength: { duration: 0 },
                      opacity: { duration: 0.4, delay: PHASE[0] + 0.9, ease: 'easeOut' },
                    }
                  : {
                      pathLength: inView
                        ? { duration: 0.65, delay: PHASE[0] + 0.9, ease: EASE_LUXE }
                        : { duration: 0 },
                      opacity: inView ? { duration: 0.3, delay: PHASE[0] + 0.9 } : { duration: 0 },
                    }
              }
            />
          </motion.g>
        </motion.g>

        {/* Checklist labels: appear with their row; rows 1–2 step back while
            rows 3–4 are ticked and return to full when the seal lands */}
        {rows.map((label, i) => {
          const timing = labelTiming(i, reduce);
          return (
            <motion.text
              key={`${i}-${label}`}
              x={LABEL_X}
              y={rowTop(i) + BOX / 2 + labelSize * 0.36}
              fontSize={labelSize}
              letterSpacing={1.5}
              fill={SAND}
              style={{ fontFamily: MONO }}
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

        {/* Seal: double ring, curved caption, big tick — stamps in over the sheet */}
        <g transform={`translate(${SEAL_X} ${SEAL_Y}) rotate(-12)`}>
          <motion.g
            style={{ originX: 0.5, originY: 0.5 }}
            initial={false}
            animate={{ scale: reduce || inView ? 1 : 1.35, opacity: inView ? 0.95 : 0 }}
            transition={
              reduce
                ? {
                    scale: { duration: 0 },
                    opacity: { duration: 0.4, delay: SEAL_DELAY, ease: 'easeOut' },
                  }
                : inView
                  ? {
                      scale: { type: 'spring', stiffness: 320, damping: 20, delay: SEAL_DELAY },
                      opacity: { duration: 0.22, delay: SEAL_DELAY },
                    }
                  : { duration: 0 }
            }
          >
            <path d={circ(0, 0, 44)} fill="none" stroke={GOLD_HI} strokeWidth={2} />
            <path d={circ(0, 0, 36)} fill="none" stroke={GOLD_HI} strokeWidth={1} />
            <text
              fontSize={sealSize}
              letterSpacing={3}
              fill={GOLD_HI}
              textAnchor="middle"
              style={{ fontFamily: MONO, textTransform: 'uppercase' }}
            >
              <textPath href={`#${arcId}`} startOffset="50%">
                {sealText}
              </textPath>
            </text>
            <path
              d="M-14 2 l8.5 8.5 l19.5 -20"
              fill="none"
              stroke={GOLD_HI}
              strokeWidth={3.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M0 24 l3 3 l-3 3 l-3 -3 Z"
              fill="none"
              stroke={GOLD_HI}
              strokeWidth={1}
              strokeLinejoin="round"
            />
          </motion.g>
        </g>
      </svg>

      {/* The in-SVG labels scale below legibility on phones; this visible
          legend also gives screen readers the criteria and the seal. */}
      <ol className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 sm:hidden">
        {rows.map((label, i) => (
          <li
            key={`${i}-${label}`}
            className="flex items-center gap-1.5 font-mono text-[0.62rem] tracking-[0.18em] text-sand-400 uppercase"
          >
            <Check aria-hidden className="size-3 shrink-0 text-bronze-400" strokeWidth={2.5} />
            {label}
          </li>
        ))}
        <li className="flex items-center gap-1.5 font-mono text-[0.62rem] tracking-[0.18em] text-bronze-300 uppercase">
          <BadgeCheck aria-hidden className="size-3 shrink-0" strokeWidth={2} />
          {sealText}
        </li>
      </ol>
    </div>
  );
}
