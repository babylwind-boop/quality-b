'use client';

import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;

/* ── Geometry: exploded axonometric wall section ────────────────────
   Each layer is a parallelogram panel — the wall-plane face spanned by
   the receding direction (DW right, DH up) and the vertical height PH —
   extruded by its own thickness along +x. Panels explode horizontally
   with even gaps; a dashed leader drops to a numbered tag underneath. */
const VB_W = 560;
const VB_H = 400;
const DW = 112; // receding run (px)
const DH = 68; // receding rise (px)
const PH = 210; // panel height (px)
const YB = 320; // y of the front-bottom-left corner
const X0 = 48; // left margin
const RIGHT_PAD = 24;
const MIN_GAP = 12;
/** Layer thicknesses in px, cycled: brick, glue, insulation, mesh, render. */
const THICKNESS = [56, 16, 48, 12, 18] as const;

type Pt = (u: number, v: number) => [number, number];

interface SlabStroke {
  d: string;
  /** Extra draw delay within its slab, seconds (scaled by 0.6 like ProcessStory). */
  delay: number;
  width?: number;
  dashed?: boolean;
}

interface Slab {
  strokes: SlabStroke[];
  /** Invisible filled hull so hover/click work across the whole panel. */
  hit: string;
  leader: string;
  numX: number;
  numY: number;
}

/** Wavy insulation strand along the receding direction at face height v. */
function wavy(pt: Pt, v: number): string {
  const u0 = 0.08;
  const u1 = 0.92;
  const seg = 6;
  const amp = 7;
  const at = (u: number, dv: number) => {
    const [x, y] = pt(u, v + dv);
    return `${x.toFixed(1)} ${y.toFixed(1)}`;
  };
  let d = `M${at(u0, 0)}`;
  for (let j = 1; j <= seg; j++) {
    const u = u0 + ((u1 - u0) * j) / seg;
    const um = u0 + ((u1 - u0) * (j - 0.5)) / seg;
    d += ` Q${at(um, j % 2 ? amp : -amp)} ${at(u, 0)}`;
  }
  return d;
}

function buildSlab(X: number, t: number, kind: number): Slab {
  const pt: Pt = (u, v) => [X + u * DW, YB - u * DH - v];
  const P = (u: number, v: number, dx = 0) => {
    const [px, py] = pt(u, v);
    return `${(px + dx).toFixed(1)} ${py.toFixed(1)}`;
  };
  const strokes: SlabStroke[] = [];

  // face outline + thickness strips (top and right)
  strokes.push({ d: `M${P(0, 0)} L${P(1, 0)} L${P(1, PH)} L${P(0, PH)} Z`, delay: 0, width: 1.6 });
  strokes.push({ d: `M${P(0, PH)} L${P(1, PH)} L${P(1, PH, t)} L${P(0, PH, t)} Z`, delay: 0.12, width: 1.1 });
  strokes.push({ d: `M${P(1, 0)} L${P(1, 0, t)} L${P(1, PH, t)} L${P(1, PH)} Z`, delay: 0.18, width: 1.1 });

  if (kind === 0) {
    // masonry: bed-joint courses + staggered head joints (small rectangles grid)
    [42, 84, 126, 168].forEach((v, i) => {
      strokes.push({ d: `M${P(0.06, v)} L${P(0.94, v)}`, delay: 0.3 + i * 0.07, width: 0.9 });
    });
    for (let b = 0; b < 5; b++) {
      const v0 = b * 42 + 6;
      const v1 = Math.min((b + 1) * 42, PH) - 6;
      (b % 2 ? [0.45, 0.78] : [0.24, 0.6]).forEach((u, j) => {
        strokes.push({ d: `M${P(u, v0)} L${P(u, v1)}`, delay: 0.42 + b * 0.06 + j * 0.03, width: 0.9 });
      });
    }
  } else if (kind === 1) {
    // adhesive: dabs of glue as a dot grid
    [0.24, 0.52, 0.8].forEach((u, c) => {
      [30, 75, 120, 165].forEach((v, r) => {
        const [cx, cy] = pt(u, v);
        strokes.push({
          d: `M${(cx - 2.2).toFixed(1)} ${cy.toFixed(1)} a2.2 2.2 0 1 0 4.4 0 a2.2 2.2 0 1 0 -4.4 0`,
          delay: 0.3 + (c * 4 + r) * 0.04,
          width: 1.1,
        });
      });
    });
  } else if (kind === 2) {
    // insulation board: soft wavy strands
    [35, 85, 135, 185].forEach((v, i) => {
      strokes.push({ d: wavy(pt, v), delay: 0.3 + i * 0.09, width: 1 });
    });
  } else if (kind === 3) {
    // reinforcement mesh: diagonal cross-hatch
    ([
      [110, 15],
      [155, 60],
      [200, 105],
    ] as const).forEach(([a, b], i) => {
      strokes.push({ d: `M${P(0.06, a)} L${P(0.94, b)}`, delay: 0.3 + i * 0.07, width: 0.9 });
      strokes.push({ d: `M${P(0.06, b)} L${P(0.94, a)}`, delay: 0.34 + i * 0.07, width: 0.9 });
    });
  } else {
    // render + paint: solid double edge (inset outline)
    strokes.push({
      d: `M${P(0.06, 14)} L${P(0.94, 14)} L${P(0.94, PH - 14)} L${P(0.06, PH - 14)} Z`,
      delay: 0.32,
      width: 1,
    });
  }

  const lx = X + t / 2;
  return {
    strokes,
    hit: `M${P(0, 0)} L${P(1, 0)} L${P(1, 0, t)} L${P(1, PH, t)} L${P(0, PH, t)} L${P(0, PH)} Z`,
    leader: `M${lx.toFixed(1)} ${YB + 8} V${YB + 34}`,
    numX: lx,
    numY: YB + 56,
  };
}

function buildSlabs(n: number): Slab[] {
  const th = Array.from({ length: n }, (_, i) => THICKNESS[i % THICKNESS.length]!);
  const sumT = th.reduce((a, b) => a + b, 0);
  const usable = VB_W - RIGHT_PAD - DW - X0;
  let gap = n > 1 ? (usable - sumT) / (n - 1) : 0;
  let scale = 1;
  if (n > 1 && gap < MIN_GAP) {
    gap = MIN_GAP;
    scale = Math.max(0.15, (usable - gap * (n - 1)) / sumT);
  }
  const slabs: Slab[] = [];
  let x = X0;
  for (let i = 0; i < n; i++) {
    const t = th[i]! * scale;
    slabs.push(buildSlab(x, t, i % THICKNESS.length));
    x += t + gap;
  }
  return slabs;
}

const num = (i: number) => String(i).padStart(2, '0');

/* ── Interactive exploded facade-insulation section ─────────────────
   Gold line-art slabs slide in from the right one after another; hover,
   click or focus (slab or its label row) highlights a layer and cross-
   fades its description into a fixed-height caption panel. */
export function ThermoLayers({
  layers,
  hint,
  className,
}: {
  layers: { label: string; text: string }[];
  hint: string;
  className?: string;
}) {
  const reduce = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.25 });
  // Insulation is the hero layer of the section — pre-selected.
  const [selected, setSelected] = useState(2);
  const [hovered, setHovered] = useState<number | null>(null);

  const n = layers.length;
  const slabs = useMemo(() => buildSlabs(n), [n]);

  if (n === 0) return null;

  const sel = Math.min(selected, n - 1);
  const shown = hovered ?? sel;
  const shownLayer = layers[shown]!;

  const hoverIn = (i: number) => setHovered(i);
  const hoverOut = (i: number) => setHovered((h) => (h === i ? null : h));

  return (
    <div
      ref={rootRef}
      className={cn('flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12', className)}
    >
      {/* ── Exploded section drawing + caption ── */}
      <div className="min-w-0 lg:w-[55%]">
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

          <div className="flex items-baseline justify-between gap-4 px-5 pt-4 font-mono text-[0.62rem] tracking-[0.3em] text-sand-400 uppercase">
            <span className="flex min-w-0 items-center gap-2">
              <motion.span
                aria-hidden
                className="inline-block size-1.5 shrink-0 bg-bronze-400"
                animate={reduce ? undefined : { opacity: [1, 0.2, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              />
              {hint}
            </span>
            <span className="tnum shrink-0 text-sand-500">
              {num(shown + 1)} / {num(n)}
            </span>
          </div>

          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid meet"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="block h-auto max-h-[340px] w-full select-none lg:max-h-none"
            aria-hidden
          >
            {slabs.map((slab, i) => {
              const hi = i === shown;
              return (
                // Outer group: entry only — slide in from the right, staggered.
                <motion.g
                  key={i}
                  initial={false}
                  animate={{
                    x: reduce || inView ? 0 : 40,
                    opacity: inView ? 1 : 0,
                  }}
                  transition={
                    reduce
                      ? { duration: 0.35, delay: i * 0.1 }
                      : { duration: 0.55, delay: 0.1 + i * 0.35, ease: EASE_LUXE }
                  }
                >
                  {/* Inner group: highlight state — bronze glow vs 45% dim. */}
                  <motion.g
                    className="cursor-pointer"
                    onPointerEnter={() => hoverIn(i)}
                    onPointerLeave={() => hoverOut(i)}
                    onClick={() => setSelected(i)}
                    initial={false}
                    animate={{
                      opacity: hi ? 1 : 0.45,
                      stroke: hi ? '#d0b586' : '#a98b56',
                    }}
                    transition={{ duration: 0.35 }}
                  >
                    <path d={slab.hit} fill="transparent" stroke="none" />
                    {slab.strokes.map((s, j) => (
                      <motion.path
                        key={j}
                        d={s.d}
                        fill="none"
                        strokeWidth={s.width ?? 1.5}
                        strokeDasharray={s.dashed ? '3 7' : undefined}
                        initial={false}
                        // dashed strokes fade in (a pathLength draw would
                        // overwrite the dash pattern)
                        animate={
                          s.dashed
                            ? { opacity: inView ? 1 : 0 }
                            : { pathLength: inView ? 1 : 0 }
                        }
                        transition={
                          reduce
                            ? { duration: 0 }
                            : {
                                duration: 0.65,
                                delay: 0.1 + i * 0.35 + s.delay * 0.6,
                                ease: EASE_LUXE,
                              }
                        }
                      />
                    ))}
                    <motion.path
                      d={slab.leader}
                      fill="none"
                      strokeWidth={1}
                      strokeDasharray="3 7"
                      initial={false}
                      animate={{ opacity: inView ? 1 : 0 }}
                      transition={
                        reduce
                          ? { duration: 0 }
                          : { duration: 0.45, delay: 0.45 + i * 0.35, ease: EASE_LUXE }
                      }
                    />
                    <motion.text
                      x={slab.numX}
                      y={slab.numY}
                      textAnchor="middle"
                      fontSize={11}
                      letterSpacing={2.4}
                      stroke="none"
                      style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                      initial={false}
                      animate={{ fill: hi ? '#d0b586' : '#9b9b9b' }}
                      transition={{ duration: 0.3 }}
                    >
                      {num(i + 1)}
                    </motion.text>
                  </motion.g>
                </motion.g>
              );
            })}
          </svg>
        </div>

        {/* Caption panel — crossfades to the highlighted layer; grid-stacked so
            the tallest text defines the height (nothing clips in DE/PL) */}
        <div className="card-luxe relative mt-4 grid min-h-36 overflow-hidden rounded-sm">
          <AnimatePresence initial={false}>
            <motion.div
              key={shown}
              initial={{ opacity: 0, y: reduce ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 0 }}
              transition={{ duration: 0.3, ease: EASE_LUXE }}
              className="col-start-1 row-start-1 flex flex-col gap-2.5 p-5 sm:p-6"
            >
              <div className="flex items-baseline gap-3">
                <span className="tnum font-mono text-[0.65rem] tracking-[0.28em] text-bronze-400">
                  {num(shown + 1)}
                </span>
                <h3 className="font-display text-lg leading-snug font-semibold text-sand-50">
                  {shownLayer.label}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-sand-300">{shownLayer.text}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Layer list: real buttons drive the same highlight state ── */}
      <div className="min-w-0 flex-1 lg:pt-1">
        <ol>
          {layers.map((l, i) => {
            const isSel = i === sel;
            const hi = i === shown;
            return (
              <li key={`${i}-${l.label}`} className="border-b border-sand-50/10 first:border-t">
                <button
                  type="button"
                  aria-pressed={isSel}
                  onClick={() => setSelected(i)}
                  onPointerEnter={() => hoverIn(i)}
                  onPointerLeave={() => hoverOut(i)}
                  onFocus={() => hoverIn(i)}
                  onBlur={() => hoverOut(i)}
                  className="group flex min-h-11 w-full cursor-pointer items-center gap-4 px-1.5 py-3 text-start sm:gap-5"
                >
                  <span
                    className={cn(
                      'tnum font-mono text-[0.65rem] tracking-[0.28em] transition-colors duration-300',
                      hi ? 'text-bronze-400' : 'text-sand-500',
                    )}
                  >
                    {num(i + 1)}
                  </span>
                  <span
                    className={cn(
                      'min-w-0 flex-1 font-display text-base leading-snug transition-colors duration-300 sm:text-lg',
                      hi ? 'text-sand-50' : 'text-sand-400 group-hover:text-sand-200',
                    )}
                  >
                    {l.label}
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
      </div>
    </div>
  );
}
