'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;

export interface GardenZone {
  key: string;
  title: string;
  text: string;
}

/* ── Top-down landscape plan (viewBox 720×520) in the gold line idiom.
   Six zone groups in prop order: greenery, automation, paths, leisure,
   utilities, other. Draw-in is staged by raw `delay` (scaled ×0.6):
   boundary → house/terrace → walkway → pond/trees/beds → lamps/irrigation. */

interface Stroke {
  d: string;
  /** Raw draw-in stage delay in seconds (multiplied by 0.6 at render). */
  delay: number;
  dashed?: boolean;
  width?: number;
}

interface Dot {
  x: number;
  y: number;
  delay: number;
}

const circle = (cx: number, cy: number, r: number) =>
  `M${cx + r} ${cy} a${r} ${r} 0 1 1 -0.1 0`;

function roundedRect(x: number, y: number, w: number, h: number, r: number): string {
  return [
    `M${x + r} ${y} H${x + w - r}`,
    `Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r}`,
    `Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r}`,
    `Q${x} ${y + h} ${x} ${y + h - r} V${y + r}`,
    `Q${x} ${y} ${x + r} ${y} Z`,
  ].join(' ');
}

/** Tree: crown circle + four tiny radial ticks. */
function tree(cx: number, cy: number, r: number, delay: number): Stroke[] {
  const out: Stroke[] = [{ d: circle(cx, cy, r), delay, width: r > 17 ? 1.5 : 1.2 }];
  [30, 120, 210, 300].forEach((deg, i) => {
    const a = (deg * Math.PI) / 180;
    const c = Math.cos(a);
    const s = Math.sin(a);
    out.push({
      d: `M${(cx + c * (r + 3)).toFixed(1)} ${(cy + s * (r + 3)).toFixed(1)} L${(cx + c * (r + 9)).toFixed(1)} ${(cy + s * (r + 9)).toFixed(1)}`,
      delay: delay + 0.14 + i * 0.04,
      width: 0.9,
    });
  });
  return out;
}

/** Lamp post: small circle + four light-ray cross ticks. */
function lamp(cx: number, cy: number, delay: number): Stroke[] {
  return [
    { d: circle(cx, cy, 5), delay, width: 1.2 },
    {
      d: `M${cx} ${cy - 14} v5 M${cx} ${cy + 9} v5 M${cx - 14} ${cy} h5 M${cx + 9} ${cy} h5`,
      delay: delay + 0.08,
      width: 1,
    },
  ];
}

/** Flower bed: rounded rect with vertical planting-row hatching. */
function bed(x: number, y: number, delay: number): Stroke[] {
  const out: Stroke[] = [{ d: roundedRect(x, y, 104, 30, 4), delay, width: 1.1 }];
  for (let i = 0; i < 5; i++) {
    out.push({
      d: `M${x + 16 + i * 18} ${y + 7} V${y + 23}`,
      delay: delay + 0.15 + i * 0.03,
      width: 0.6,
    });
  }
  return out;
}

function buildPlan(): { strokes: Stroke[][]; dots: Dot[] } {
  const greenery: Stroke[] = [];
  const automation: Stroke[] = [];
  const paths: Stroke[] = [];
  const leisure: Stroke[] = [];
  const utilities: Stroke[] = [];
  const other: Stroke[] = [];

  /* ── other: property boundary, house, gate, compass, scale bar ── */
  other.push({ d: roundedRect(20, 20, 680, 480, 14), delay: 0, dashed: true });
  // house walls (double line) with a door notch on the south wall
  other.push({ d: 'M212 230 H280 V70 H80 V230 H176', delay: 0.5, width: 1.9 });
  other.push({ d: 'M212 223 H273 V77 H87 V223 H176', delay: 0.7, width: 1 });
  other.push({ d: 'M160 77 V150 H273', delay: 0.85, width: 0.7 });
  // door swing (arc) + open leaf
  other.push({ d: 'M212 230 A36 36 0 0 1 176 266', delay: 0.95, dashed: true, width: 0.9 });
  other.push({ d: 'M176 230 V266', delay: 1.05, width: 1.1 });
  // garden gate at the bottom-right boundary
  other.push({ d: 'M614 500 V486', delay: 1.5, width: 1.8 });
  other.push({ d: 'M658 500 V486', delay: 1.55, width: 1.8 });
  other.push({ d: 'M614 492 H658', delay: 1.6, dashed: true, width: 1 });
  // north arrow (pure line art, no lettering)
  other.push({ d: circle(668, 46, 14), delay: 1.7, width: 1 });
  other.push({ d: 'M664 54 L668 34 L672 54 L668 48 Z', delay: 1.8, width: 1.1 });
  // scale bar
  other.push({ d: 'M40 474 H100 M40 470 V478 M70 470 V478 M100 470 V478', delay: 1.85, width: 1 });

  /* ── leisure: terrace grid beside the house + pond with ripples ── */
  leisure.push({ d: 'M296 86 H400 V214 H296 Z', delay: 0.9, width: 1.3 });
  [322, 348, 374].forEach((x, i) =>
    leisure.push({ d: `M${x} 86 V214`, delay: 1.0 + i * 0.06, width: 0.6 }),
  );
  [118, 150, 182].forEach((y, i) =>
    leisure.push({ d: `M296 ${y} H400`, delay: 1.1 + i * 0.06, width: 0.6 }),
  );
  leisure.push({
    d: 'M498 196 C498 158 536 138 574 148 C614 158 642 190 632 226 C622 260 574 276 538 262 C506 250 498 230 498 196 Z',
    delay: 2.0,
    width: 1.7,
  });
  leisure.push({ d: 'M542 196 Q564 182 588 196', delay: 2.3, width: 0.9 });
  leisure.push({ d: 'M534 222 Q566 204 598 222', delay: 2.4, width: 0.9 });

  /* ── paths: curved walkway (two parallel beziers) door → gate ── */
  paths.push({
    d: 'M180 236 C182 320 292 352 408 392 C512 428 596 458 618 500',
    delay: 1.4,
    width: 1.4,
  });
  paths.push({
    d: 'M210 236 C214 306 316 332 428 370 C536 406 632 446 652 500',
    delay: 1.5,
    width: 1.4,
  });
  // paving joints across the walkway
  paths.push({ d: 'M296 340 L308 320', delay: 1.7, width: 0.7 });
  paths.push({ d: 'M430 396 L442 374', delay: 1.78, width: 0.7 });
  paths.push({ d: 'M556 452 L570 428', delay: 1.86, width: 0.7 });

  /* ── greenery: tree clusters (top-right + left) and flower beds ── */
  (
    [
      [472, 66, 16],
      [528, 98, 22],
      [596, 62, 18],
      [652, 104, 14],
      [64, 292, 14],
      [104, 338, 20],
      [58, 388, 12],
    ] as [number, number, number][]
  ).forEach(([cx, cy, r], i) => greenery.push(...tree(cx, cy, r, 2.0 + i * 0.1)));
  [384, 424, 464].forEach((y, i) => greenery.push(...bed(150, y, 2.3 + i * 0.15)));

  /* ── utilities: lamp posts along the walkway ── */
  (
    [
      [268, 372],
      [352, 404],
      [470, 452],
      [566, 472],
    ] as [number, number][]
  ).forEach(([x, y], i) => utilities.push(...lamp(x, y, 2.9 + i * 0.1)));

  /* ── automation: controller box + dashed supply line (dots are separate) ── */
  automation.push({ d: 'M92 234 H108 V246 H92 Z', delay: 3.0, width: 1 });
  automation.push({ d: 'M100 246 V308 H360', delay: 3.1, dashed: true, width: 0.9 });
  const dots: Dot[] = [130, 170, 210, 250, 290, 330].map((x, i) => ({
    x,
    y: 308,
    delay: 3.2 + i * 0.06,
  }));

  return { strokes: [greenery, automation, paths, leisure, utilities, other], dots };
}

const PLAN = buildPlan();

/** Hotspot anchor per zone, in SVG user units (order = zone prop order). */
const HOTSPOTS: [number, number][] = [
  [104, 338], // greenery — left tree cluster
  [230, 308], // automation — irrigation row
  [428, 388], // paths — mid walkway
  [566, 206], // leisure — pond
  [566, 472], // utilities — last lamp
  [180, 150], // other — house
];

const AUTOMATION_ZONE = 1;

export function GardenMap({
  zones,
  className,
}: {
  zones: GardenZone[];
  className?: string;
}) {
  const reduce = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const started = useInView(rootRef, { once: true, amount: 0.2 });
  const [sel, setSel] = useState(0);
  // Zones dim only after the first explicit selection, so the staged
  // draw-in presents the full plan at equal brightness.
  const [engaged, setEngaged] = useState(false);

  const select = (i: number) => {
    setSel(i);
    setEngaged(true);
  };

  const current = zones[sel] ?? zones[0];

  const card = current ? (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={current.key}
        initial={{ opacity: 0, y: reduce ? 0 : 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: reduce ? 0 : -10 }}
        transition={{ duration: reduce ? 0.3 : 0.45, ease: EASE_LUXE }}
        className="glass-soft rounded-sm p-5 sm:p-6"
      >
        <p className="tnum font-mono text-[0.68rem] tracking-[0.3em] text-bronze-400">
          0{sel + 1} <span className="text-sand-500">/ 0{zones.length}</span>
        </p>
        <h3 className="mt-2.5 font-display text-xl leading-snug text-sand-50">
          {current.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-sand-300">{current.text}</p>
      </motion.div>
    </AnimatePresence>
  ) : null;

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      {/* ── Plan panel (SVG + hotspot layer share one box for % anchors) ── */}
      <div className="relative rounded-sm border border-sand-50/10 bg-ink-950/60 lg:me-[22rem]">
        {(
          [
            'top-2 start-2 border-t border-s',
            'top-2 end-2 border-t border-e',
            'bottom-2 start-2 border-b border-s',
            'bottom-2 end-2 border-b border-e',
          ] as const
        ).map((c) => (
          <span
            key={c}
            aria-hidden
            className={cn('pointer-events-none absolute z-10 size-3.5 border-bronze-500/60', c)}
          />
        ))}

        <svg viewBox="0 0 720 520" className="block h-auto w-full" aria-hidden>
          {PLAN.strokes.map((strokes, zi) => {
            const isActive = zi === sel;
            const dim = engaged && !isActive;
            return (
              <motion.g
                key={zi}
                initial={false}
                animate={{ opacity: dim ? 0.4 : 1 }}
                transition={{ duration: 0.45, ease: EASE_LUXE }}
              >
                {strokes.map((s, i) => (
                  <motion.path
                    key={i}
                    d={s.d}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={s.dashed ? '3 7' : undefined}
                    initial={false}
                    // dashed strokes fade in — a pathLength draw would erase
                    // the dash pattern (motion drives it via stroke-dasharray)
                    animate={{
                      ...(s.dashed ? {} : { pathLength: started ? 1 : 0 }),
                      opacity: started ? 1 : 0,
                      stroke: isActive ? '#d0b586' : '#a98b56',
                      strokeWidth: (s.width ?? 1.5) + (isActive ? 0.4 : 0),
                    }}
                    transition={
                      reduce
                        ? {
                            pathLength: { duration: 0 },
                            strokeWidth: { duration: 0 },
                            opacity: { duration: 0.35 },
                            stroke: { duration: 0.35 },
                          }
                        : {
                            pathLength: { duration: 0.65, delay: s.delay * 0.6, ease: EASE_LUXE },
                            opacity: { duration: 0.3, delay: s.delay * 0.6 },
                            stroke: { duration: 0.4 },
                            strokeWidth: { duration: 0.4 },
                          }
                    }
                  />
                ))}
                {zi === AUTOMATION_ZONE &&
                  PLAN.dots.map((p, i) => (
                    <motion.circle
                      key={`dot${i}`}
                      cx={p.x}
                      cy={p.y}
                      r={2.5}
                      initial={false}
                      animate={{
                        opacity: started ? 1 : 0,
                        fill: isActive ? '#d0b586' : '#a98b56',
                      }}
                      transition={{
                        opacity: { duration: 0.3, delay: reduce ? 0 : p.delay * 0.6 },
                        fill: { duration: 0.4 },
                      }}
                    />
                  ))}
              </motion.g>
            );
          })}
        </svg>

        {/* ── Numbered hotspots (real buttons, % anchored over the SVG) ── */}
        {zones.slice(0, HOTSPOTS.length).map((zn, i) => {
          const [hx, hy] = HOTSPOTS[i]!;
          const isActive = i === sel;
          return (
            <button
              key={zn.key}
              type="button"
              aria-pressed={isActive}
              aria-label={zn.title}
              onClick={() => select(i)}
              onFocus={() => select(i)}
              className="absolute z-10 flex size-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center"
              style={{
                left: `${((hx / 720) * 100).toFixed(2)}%`,
                top: `${((hy / 520) * 100).toFixed(2)}%`,
              }}
            >
              {!reduce && (
                <motion.span
                  aria-hidden
                  className="absolute size-7 rounded-full border border-bronze-400/70"
                  animate={{ scale: [1, 1.6], opacity: [0.7, 0] }}
                  transition={{
                    duration: 1.9,
                    repeat: Infinity,
                    ease: 'easeOut',
                    delay: i * 0.3,
                    repeatDelay: 0.2,
                  }}
                />
              )}
              <span
                className={cn(
                  'tnum flex size-7 items-center justify-center rounded-full border font-mono text-[0.7rem] transition-colors duration-300',
                  isActive
                    ? 'border-bronze-300 bg-bronze-400 text-ink-950'
                    : 'border-bronze-500/70 bg-ink-950/85 text-bronze-300',
                )}
              >
                {i + 1}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Desktop: info card floats at the right side of the map ── */}
      <div
        aria-live="polite"
        className="pointer-events-none absolute inset-y-0 end-0 z-20 hidden w-[21rem] items-center lg:flex"
      >
        <div className="pointer-events-auto w-full">{card}</div>
      </div>

      {/* ── Mobile: chip row (edge bleed, hidden scrollbar) ── */}
      <div className="no-scrollbar -mx-4 mt-5 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:hidden">
        <div className="flex w-max gap-2.5 pb-1">
          {zones.map((zn, i) => {
            const isActive = i === sel;
            return (
              <button
                key={zn.key}
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
                  'inline-flex min-h-11 cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-sm border px-4 font-display text-sm uppercase transition-colors duration-300',
                  isActive
                    ? 'border-bronze-500 bg-bronze-500 text-ink-950'
                    : 'border-sand-50/10 bg-ink-850 text-sand-400 hover:border-sand-50/25 hover:text-sand-100',
                )}
              >
                <span className="tnum font-mono text-[0.65rem]">{i + 1}</span>
                {zn.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Mobile: info card below the chips ── */}
      <div aria-live="polite" className="mt-4 lg:hidden">
        {card}
      </div>
    </div>
  );
}
