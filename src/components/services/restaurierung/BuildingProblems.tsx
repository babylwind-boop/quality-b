'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;
const BRONZE = '#a98b56';
const BRONZE_HI = '#d0b586';

/* ── Facade line art (viewBox 640×520) ──────────────────────────────
   Front elevation of a classic old townhouse: plinth, two floors with
   four arched windows, entrance door with steps, cornice bands, a
   triangular pediment with a round attic window and a chimney. The
   building draws itself in (~2s staged), then the damage overlays
   appear dashed at 55% opacity; the active problem zone lights up. */

interface FacadeStroke {
  d: string;
  /** Raw stagger delay in seconds (rendered as delay × 0.6). */
  delay: number;
  width?: number;
}

interface DamageStroke {
  d: string;
  /** Problem index (0–3) this stroke belongs to. */
  zone: number;
  /** Extra delay after the building has drawn, seconds. */
  delay: number;
  width?: number;
}

const FACADE: FacadeStroke[] = [
  // ground line + plinth with masonry joints
  { d: 'M96 490 H544', delay: 0, width: 1 },
  { d: 'M134 490 V430 H506 V490', delay: 0.1 },
  { d: 'M134 460 H262 M378 460 H506', delay: 0.25, width: 0.7 },
  { d: 'M230 430 V460 M410 430 V460 M180 460 V490 M460 460 V490', delay: 0.3, width: 0.7 },
  // side walls
  { d: 'M140 430 V180', delay: 0.35 },
  { d: 'M500 430 V180', delay: 0.45 },
  // entrance door (arched, split leaf, transom) + widening steps
  { d: 'M288 430 V350 Q288 332 320 332 Q352 332 352 350 V430', delay: 0.5 },
  { d: 'M320 430 V336', delay: 0.62, width: 1 },
  { d: 'M292 356 H348', delay: 0.68, width: 1 },
  { d: 'M284 444 H356', delay: 0.55, width: 1 },
  { d: 'M276 458 H364', delay: 0.6, width: 1 },
  { d: 'M268 472 H372', delay: 0.65, width: 1 },
  // ground-floor arched windows with double sill lines + glazing bar
  { d: 'M187 420 V350 Q187 330 215 330 Q243 330 243 350 V420', delay: 0.75 },
  { d: 'M181 420 H249 M184 426 H246', delay: 0.85, width: 1 },
  { d: 'M215 336 V416', delay: 0.9, width: 0.7 },
  { d: 'M397 420 V350 Q397 330 425 330 Q453 330 453 350 V420', delay: 0.8 },
  { d: 'M391 420 H459 M394 426 H456', delay: 0.9, width: 1 },
  { d: 'M425 336 V416', delay: 0.95, width: 0.7 },
  { d: 'M215 330 V322 M425 330 V322', delay: 1.0, width: 1 }, // keystones
  // cornice band between floors with dentil ticks
  { d: 'M132 310 H508', delay: 1.05 },
  { d: 'M136 300 H504', delay: 1.15, width: 1 },
  { d: 'M168 300 V310 M232 300 V310 M296 300 V310 M344 300 V310 M408 300 V310 M472 300 V310', delay: 1.25, width: 0.7 },
  // upper-floor arched windows
  { d: 'M187 290 V230 Q187 210 215 210 Q243 210 243 230 V290', delay: 1.2 },
  { d: 'M181 290 H249 M184 296 H246', delay: 1.3, width: 1 },
  { d: 'M215 216 V286', delay: 1.35, width: 0.7 },
  { d: 'M397 290 V230 Q397 210 425 210 Q453 210 453 230 V290', delay: 1.3 },
  { d: 'M391 290 H459 M394 296 H456', delay: 1.4, width: 1 },
  { d: 'M425 216 V286', delay: 1.45, width: 0.7 },
  { d: 'M215 210 V202 M425 210 V202', delay: 1.5, width: 1 },
  // top cornice
  { d: 'M128 180 H512', delay: 1.55 },
  { d: 'M136 170 H504', delay: 1.6, width: 1 },
  // pediment raking cornice — the right slope is drawn with a built-in
  // gap (the missing piece belongs to problem zone 4)
  { d: 'M128 170 L320 88 L400 122', delay: 1.7 },
  { d: 'M440 139 L512 170', delay: 1.85 },
  { d: 'M156 162 L320 100 L395 131', delay: 1.8, width: 1 },
  { d: 'M435 147 L484 162', delay: 1.9, width: 1 },
  // round attic window with mullions
  { d: 'M320 121 a15 15 0 1 1 -0.1 0', delay: 1.95, width: 1.2 },
  { d: 'M320 122 V150 M306 136 H334', delay: 2.05, width: 0.7 },
  // chimney on the left roof slope
  { d: 'M200 139 V72 M228 127 V72', delay: 2.1, width: 1.2 },
  { d: 'M194 72 H234 V62 H194 Z', delay: 2.2, width: 1.2 },
];

const DAMAGE: DamageStroke[] = [
  // zone 0 · botched DIY work: moisture streaks under the upper-left window
  { zone: 0, d: 'M181 246 q4 8 0 16 t0 14', delay: 0 },
  { zone: 0, d: 'M196 296 q5 9 0 18 t0 14', delay: 0.12 },
  { zone: 0, d: 'M215 296 q-5 9 0 18 t0 16', delay: 0.2 },
  { zone: 0, d: 'M234 296 q5 9 0 18', delay: 0.28 },
  // zone 1 · foundation: jagged crack from the plinth up through floor 1
  { zone: 1, d: 'M164 488 L172 462 L160 440 L176 412 L166 384 L180 356 L172 330', delay: 0.1 },
  { zone: 1, d: 'M176 412 L192 400 L188 386', delay: 0.3 },
  { zone: 1, d: 'M172 462 L156 452', delay: 0.4 },
  // zone 2 · wrong materials: flaking plaster patches on the right wall
  { zone: 2, d: 'M458 352 q14 -10 26 -2 q8 8 2 16 q-10 10 -22 4 q-10 -6 -6 -18 Z', delay: 0.15 },
  { zone: 2, d: 'M466 386 q10 -8 20 0 q6 6 0 12 q-10 8 -18 0 q-6 -6 -2 -12 Z', delay: 0.3 },
  { zone: 2, d: 'M472 410 q8 -6 14 0 q4 6 -2 10 q-8 4 -12 -2 q-2 -6 0 -8 Z', delay: 0.42 },
  { zone: 2, d: 'M466 356 q8 -4 14 2', delay: 0.5, width: 0.8 },
  // zone 3 · lost original look: break edges at the cornice gap, a small
  // crack, the fall trajectory and the fallen piece on the ground
  { zone: 3, d: 'M400 122 l5 8 l-8 4', delay: 0.1 },
  { zone: 3, d: 'M440 139 l-6 -7 l8 -5', delay: 0.2 },
  { zone: 3, d: 'M414 132 l6 10 l-8 8', delay: 0.3 },
  { zone: 3, d: 'M444 152 Q492 300 534 462', delay: 0.45, width: 0.8 },
  { zone: 3, d: 'M522 476 l26 -10 l10 14 l-26 10 Z', delay: 0.55 },
  { zone: 3, d: 'M530 478 l20 -8', delay: 0.65, width: 0.8 },
];

/** Hotspot centers in % of the 640×520 viewBox, index = problem index. */
const HOTSPOTS: { x: number; y: number }[] = [
  { x: 33.6, y: 60.8 },
  { x: 26.6, y: 86.2 },
  { x: 74.1, y: 73.5 },
  { x: 65.8, y: 25.2 },
];

/* Building draw ends around 2s (max raw delay 2.2 × 0.6 + 0.65). */
const DAMAGE_START = 2.05;
const SETTLE_MS = 3300;

/**
 * Old-building facade in the gold line idiom with four clickable problem
 * hotspots. Clicking/focusing a hotspot (or, on mobile, opening an
 * accordion item) highlights the matching damage strokes and shows the
 * problem's title + text.
 */
export function BuildingProblems({
  items,
  className,
}: {
  items: { title: string; text: string }[];
  className?: string;
}) {
  const reduce = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.25 });
  const [active, setActive] = useState(0);
  // Once the intro (build + damage fade-in) has played, zone toggles must
  // react instantly instead of re-applying the intro delays.
  const [settled, setSettled] = useState(false);
  const baseId = useId();

  // An explicit activation must react instantly, even mid-intro.
  const activate = (i: number) => {
    setActive(i);
    setSettled(true);
  };

  useEffect(() => {
    if (!inView) return;
    const t = window.setTimeout(() => setSettled(true), reduce ? 400 : SETTLE_MS);
    return () => window.clearTimeout(t);
  }, [inView, reduce]);

  const activeItem = items[active] ?? null;

  return (
    <div
      ref={rootRef}
      className={cn('grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-12', className)}
    >
      {/* ── Facade panel with corner brackets ── */}
      <div className="relative rounded-sm border border-sand-50/10 bg-ink-950/60 p-4 sm:p-6">
        {(['top-3 start-3 border-t border-s', 'top-3 end-3 border-t border-e', 'bottom-3 start-3 border-b border-s', 'bottom-3 end-3 border-b border-e'] as const).map((c) => (
          <span key={c} aria-hidden className={cn('pointer-events-none absolute size-4 border-bronze-500/60', c)} />
        ))}

        <div className="relative">
          <svg viewBox="0 0 640 520" preserveAspectRatio="xMidYMid meet" className="h-auto w-full" aria-hidden>
            {FACADE.map((s, i) => (
              <motion.path
                key={i}
                d={s.d}
                fill="none"
                stroke={BRONZE}
                strokeWidth={s.width ?? 1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={false}
                animate={{ pathLength: inView ? 1 : 0, opacity: inView ? 1 : 0 }}
                transition={
                  reduce
                    ? { pathLength: { duration: 0 }, opacity: { duration: 0.3 } }
                    : {
                        pathLength: { duration: 0.65, delay: s.delay * 0.6, ease: EASE_LUXE },
                        opacity: { duration: 0.3, delay: s.delay * 0.6 },
                      }
                }
              />
            ))}
            {DAMAGE.map((s, i) => {
              const on = active === s.zone;
              return (
                <motion.path
                  key={`d${i}`}
                  d={s.d}
                  fill="none"
                  strokeWidth={s.width ?? 1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  // Damage stays dashed, so it fades in (a pathLength draw
                  // would override the dash pattern) after the building.
                  strokeDasharray="3 7"
                  initial={false}
                  animate={{
                    opacity: inView ? (on ? 1 : 0.55) : 0,
                    stroke: on ? BRONZE_HI : BRONZE,
                  }}
                  transition={{
                    opacity: settled
                      ? { duration: 0.4, ease: EASE_LUXE }
                      : reduce
                        ? { duration: 0.4 }
                        : { duration: 0.55, delay: DAMAGE_START + s.delay, ease: EASE_LUXE },
                    stroke: { duration: 0.4 },
                  }}
                />
              );
            })}
          </svg>

          {/* ── Numbered pulsing hotspots ── */}
          <motion.div
            initial={false}
            animate={{ opacity: inView ? 1 : 0 }}
            transition={{ duration: 0.5, delay: reduce ? 0 : DAMAGE_START }}
            className={cn('absolute inset-0', !inView && 'pointer-events-none')}
          >
            {HOTSPOTS.map((spot, i) => {
              const item = items[i];
              if (!item) return null;
              const on = active === i;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`0${i + 1} — ${item.title}`}
                  aria-pressed={on}
                  onClick={() => activate(i)}
                  onFocus={() => activate(i)}
                  style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                  className="group absolute grid min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center"
                >
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 m-auto size-8 rounded-full border border-bronze-400/50"
                    animate={reduce ? undefined : { scale: [1, 1.7], opacity: [0.6, 0] }}
                    transition={
                      reduce
                        ? undefined
                        : { duration: 2, repeat: Infinity, ease: 'easeOut', delay: i * 0.35 }
                    }
                  />
                  <span
                    className={cn(
                      'relative grid size-7 place-items-center rounded-full border font-mono text-[0.6rem] transition-colors duration-300',
                      on
                        ? 'border-bronze-300 bg-bronze-500 text-ink-950'
                        : 'border-bronze-500/60 bg-ink-950/80 text-bronze-300 group-hover:border-bronze-400 group-hover:text-bronze-200',
                    )}
                  >
                    0{i + 1}
                  </span>
                </button>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* ── Desktop: fixed-height detail card (crossfade, no layout jump) ── */}
      <div className="hidden lg:block">
        <div className="card-luxe relative min-h-[18rem] rounded-sm p-8 xl:p-10">
          <AnimatePresence mode="wait" initial={false}>
            {activeItem && (
              <motion.div
                key={active}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={
                  reduce ? { duration: 0.15 } : { duration: 0.35, ease: EASE_LUXE }
                }
              >
                <span className="tnum font-mono text-[0.68rem] tracking-[0.3em] text-bronze-400">
                  0{active + 1} <span className="text-sand-500">/ 0{items.length}</span>
                </span>
                <h3 className="pt-3 font-display text-2xl font-semibold text-sand-50 xl:text-3xl">
                  {activeItem.title}
                </h3>
                <p className="max-w-prose pt-4 leading-relaxed text-sand-300">
                  {activeItem.text}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Mobile: accordion — opening an item also activates its hotspot ── */}
      <div className="card-luxe divide-y divide-sand-50/8 rounded-sm lg:hidden">
        {items.map((item, i) => {
          const open = active === i;
          const headerId = `${baseId}-header-${i}`;
          const panelId = `${baseId}-panel-${i}`;
          return (
            <div key={item.title}>
              <h3>
                <button
                  type="button"
                  id={headerId}
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => activate(i)}
                  className={cn(
                    'flex min-h-11 w-full cursor-pointer items-center gap-4 px-5 py-4 text-start transition-colors duration-300',
                    open ? 'text-bronze-300' : 'text-sand-50 hover:text-bronze-200',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'grid size-11 shrink-0 place-items-center rounded-full border font-mono text-xs transition-colors duration-300',
                      open
                        ? 'border-bronze-400 bg-bronze-500 text-ink-950'
                        : 'border-sand-50/10 bg-ink-850 text-bronze-300',
                    )}
                  >
                    0{i + 1}
                  </span>
                  <span className="flex-1 font-display text-lg font-semibold">{item.title}</span>
                  <motion.span
                    aria-hidden
                    className="shrink-0 text-sand-400"
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={reduce ? { duration: 0 } : { duration: 0.4, ease: EASE_LUXE }}
                  >
                    <ChevronDown className="size-5" />
                  </motion.span>
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    key="panel"
                    id={panelId}
                    role="region"
                    aria-labelledby={headerId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{
                      height: 0,
                      opacity: 0,
                      // Exit ≈ 60% of enter (motion grammar).
                      transition: reduce
                        ? { duration: 0.01 }
                        : {
                            height: { duration: 0.3, ease: EASE_LUXE },
                            opacity: { duration: 0.2, ease: EASE_LUXE },
                          },
                    }}
                    transition={
                      reduce
                        ? { duration: 0.01 }
                        : {
                            height: { duration: 0.5, ease: EASE_LUXE },
                            opacity: { duration: 0.35, ease: EASE_LUXE },
                          }
                    }
                    className="overflow-hidden"
                  >
                    <p className="pb-6 pe-5 ps-20 text-sm leading-relaxed text-sand-400">
                      {item.text}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
