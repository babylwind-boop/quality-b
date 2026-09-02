'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';
import { BronzeButton } from '@/components/ui/BronzeButton';
import { useLeadModal } from '@/components/lead/LeadModalContext';
import { cn } from '@/lib/utils';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;

/* Gold line-art palette (matches HouseRise / ThermoLayers) */
const GOLD = '#a98b56';
const GOLD_HI = '#d0b586';

/* The pre-selected layer waits for the base scene to finish drawing. */
const BASE_SETTLE = 1.05;

/* ── Side-view garden scene (viewBox 640×360, ground line at y 260) ──
   House gable end x 40..200 · paved path 200..404 · lawn 410..565 ·
   tree at x 520 · hedge 570..624 · soil below the ground line. */
interface Stroke {
  d: string;
  /** Draw delay in seconds (relative to the scene or its layer). */
  delay: number;
  width?: number;
  /** Dashed strokes fade in — a pathLength draw would erase the pattern. */
  dashed?: boolean;
  /** Bright bronze accent. */
  hi?: boolean;
  /** Filled glow shape (no stroke) — fades in to `opacity`. */
  fill?: boolean;
  /** Settled opacity (default 1). */
  opacity?: number;
}

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0`;

/** Upper arc of a spray fan, centred on the sprinkler head. */
function fan(cx: number, cy: number, r: number): string {
  const dx = r * 0.866;
  const y = (cy - r * 0.5).toFixed(1);
  return `M${(cx - dx).toFixed(1)} ${y} A${r} ${r} 0 0 1 ${(cx + dx).toFixed(1)} ${y}`;
}

function buildBase(): Stroke[] {
  return [
    // ground line
    { d: 'M8 260 H632', delay: 0, width: 1.6 },
    // house gable end: walls + gable, roof overhang, door, window
    { d: 'M40 260 V150 L120 92 L200 150 V260', delay: 0.1, width: 1.6 },
    { d: 'M30 156 L120 86 L210 156', delay: 0.24, width: 2 },
    { d: 'M160 260 V208 H188 V260', delay: 0.36, width: 1.2 },
    { d: 'M72 172 H104 V202 H72 Z M88 172 V202', delay: 0.42, width: 1 },
    // path: far edge, end cap, paver joints
    { d: 'M200 248 H404', delay: 0.5, width: 1.2 },
    { d: 'M404 248 V260', delay: 0.6, width: 1 },
    {
      d: 'M240 248 V260 M280 248 V260 M320 248 V260 M360 248 V260',
      delay: 0.62,
      width: 0.8,
      opacity: 0.5,
    },
    // tree: trunk + two canopy circles
    { d: 'M516 260 V222 M524 260 V226', delay: 0.68, width: 1.4 },
    { d: circle(520, 194, 36), delay: 0.76, width: 1.4 },
    { d: circle(536, 168, 24), delay: 0.86, width: 1.2 },
    // hedge row: three scallops
    {
      d: 'M570 260 V236 a9 9 0 0 1 18 0 a9 9 0 0 1 18 0 a9 9 0 0 1 18 0 V260',
      delay: 0.94,
      width: 1.4,
    },
  ];
}

function buildRasen(): Stroke[] {
  const s: Stroke[] = [];
  // mowing stripes: alternating faint diagonal bands across the lawn
  for (let i = 0; i < 8; i++) {
    const x = 414 + i * 19;
    s.push({
      d: `M${x} 258 L${x + 14} 238`,
      delay: i * 0.05,
      width: 0.9,
      opacity: i % 2 ? 0.3 : 0.6,
    });
  }
  // grass tufts along the far edge of the path
  [220, 262, 292, 336, 366, 398].forEach((x, i) => {
    s.push({
      d: `M${x} 248 l-4 -7 M${x} 248 v-9 M${x} 248 l4 -7`,
      delay: 0.42 + i * 0.05,
      width: 1,
    });
  });
  return s;
}

function buildBewaesserung(): Stroke[] {
  const s: Stroke[] = [];
  // two pop-up sprinklers: stem, head, three spray arcs
  [424, 547].forEach((x, i) => {
    const base = i * 0.28;
    s.push({ d: `M${x} 260 V249`, delay: base, width: 1.4 });
    s.push({ d: `M${x - 4} 249 H${x + 4}`, delay: base + 0.08, width: 1.2 });
    [7, 12, 17].forEach((r, j) => {
      s.push({ d: fan(x, 248, r), delay: base + 0.16 + j * 0.08, width: 1, hi: true });
    });
  });
  // drip line along the hedge base (dashed → fades)
  s.push({ d: 'M564 254 H630', delay: 0.62, width: 1, dashed: true });
  // controller box on the house wall
  s.push({ d: 'M174 168 h14 v18 h-14 Z M178 180 h6', delay: 0.78, width: 1 });
  return s;
}

function buildDrainage(): Stroke[] {
  const s: Stroke[] = [];
  // sloped drain pipe into a sump (dashed → fades)
  s.push({ d: 'M214 282 L588 304', delay: 0.05, width: 1.4, dashed: true });
  s.push({ d: circle(600, 308, 13), delay: 0.3, width: 1.4 });
  // seepage arrows pointing down into the pipe
  [300, 420, 520].forEach((x, i) => {
    s.push({
      d: `M${x} 265 V277 M${x - 4} 273 L${x} 278 L${x + 4} 273`,
      delay: 0.5 + i * 0.1,
      width: 1,
      hi: true,
    });
  });
  return s;
}

function buildBeleuchtung(): Stroke[] {
  const s: Stroke[] = [];
  // three lamp posts along the path, each with a faint glow
  [240, 310, 380].forEach((x, i) => {
    const base = i * 0.18;
    s.push({ d: circle(x, 202, 15), delay: base + 0.2, fill: true, opacity: 0.18 });
    s.push({ d: `M${x} 248 V206`, delay: base, width: 1.3 });
    s.push({ d: `M${x - 5} 206 h10 v-8 h-10 Z`, delay: base + 0.12, width: 1.1 });
  });
  // uplight under the tree: fixture + faint cone
  s.push({ d: 'M520 258 L496 204 L544 204 Z', delay: 0.72, fill: true, opacity: 0.12 });
  s.push({ d: 'M515 258 h10', delay: 0.62, width: 1.2, hi: true });
  return s;
}

function buildPflege(): Stroke[] {
  return [
    // lawn mower: body, two wheels, handle
    { d: 'M452 252 V242 H488 V252 Z', delay: 0, width: 1.3 },
    { d: circle(458, 255, 5), delay: 0.12, width: 1.1 },
    { d: circle(484, 255, 5), delay: 0.18, width: 1.1 },
    { d: 'M486 243 L506 224 H512', delay: 0.26, width: 1.2 },
    // trimmed hedge top + shear marks
    { d: 'M566 231 H628', delay: 0.42, width: 1.3, hi: true },
    { d: 'M584 231 v-5 M606 231 v-5', delay: 0.56, width: 0.9, hi: true },
    // calendar chip beside the house
    { d: 'M12 228 h20 v16 h-20 Z M12 233 h20', delay: 0.68, width: 1 },
    { d: 'M17 225 v6 M27 225 v6', delay: 0.8, width: 1 },
  ];
}

const BASE = buildBase();
const OVERLAYS: Readonly<Record<string, readonly Stroke[]>> = {
  rasen: buildRasen(),
  bewaesserung: buildBewaesserung(),
  drainage: buildDrainage(),
  beleuchtung: buildBeleuchtung(),
  pflege: buildPflege(),
};

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/** One overlay stroke: draws in (pathLength) or fades in (dashed / fill). */
function LayerStroke({ s, offset, reduce }: { s: Stroke; offset: number; reduce: boolean }) {
  const target = s.opacity ?? 1;
  const delay = offset + s.delay;
  if (s.fill) {
    return (
      <motion.path
        d={s.d}
        fill={GOLD_HI}
        stroke="none"
        initial={{ opacity: 0 }}
        animate={{ opacity: target }}
        transition={reduce ? { duration: 0.3 } : { duration: 0.6, delay, ease: 'easeOut' }}
      />
    );
  }
  const common = {
    d: s.d,
    fill: 'none',
    stroke: s.hi ? GOLD_HI : GOLD,
    strokeWidth: s.width ?? 1.5,
  };
  if (s.dashed || reduce) {
    return (
      <motion.path
        {...common}
        strokeDasharray={s.dashed ? '3 7' : undefined}
        initial={{ opacity: 0 }}
        animate={{ opacity: target }}
        transition={reduce ? { duration: 0.3 } : { duration: 0.5, delay }}
      />
    );
  }
  return (
    <motion.path
      {...common}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: target }}
      transition={{
        pathLength: { duration: 0.6, delay, ease: EASE_LUXE },
        opacity: { duration: 0.25, delay },
      }}
    />
  );
}

/* ── "Compose your outdoor area": side-view garden scene + layer checklist ──
   The base scene draws once on inView; every ticked layer draws its own
   overlay in and fades it out when unticked. Hovering a ticked row lifts
   that overlay above the others. The CTA hands the selection to the lead
   modal. */
export function OutdoorConfigurator({
  layers,
  copy,
  className,
}: {
  layers: { key: string; label: string; text: string }[];
  copy: {
    hint: string;
    cta: string;
    contextLabel: string;
    selectedLabel: string;
    emptyText: string;
  };
  className?: string;
}) {
  const reduce = useReducedMotion() ?? false;
  const { open } = useLeadModal();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.25 });
  // The first layer (lawn) is the natural starting point — pre-ticked.
  const [on, setOn] = useState<ReadonlySet<string>>(
    () => new Set(layers[0] ? [layers[0].key] : []),
  );
  const [hovered, setHovered] = useState<string | null>(null);
  const [lastToggled, setLastToggled] = useState<string | null>(layers[0]?.key ?? null);
  const [touched, setTouched] = useState(false);

  const toggle = (key: string) => {
    setTouched(true);
    setLastToggled(key);
    setOn((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const hoverIn = (key: string) => setHovered(key);
  const hoverOut = (key: string) => setHovered((h) => (h === key ? null : h));

  const selected = layers.filter((l) => on.has(l.key));
  const selectedLabels = selected.map((l) => l.label);
  // Only a ticked row lifts its overlay; hovering an unticked row changes nothing.
  const lifted = hovered !== null && on.has(hovered) ? hovered : null;
  const captionKey = hovered ?? lastToggled;
  const caption = layers.find((l) => l.key === captionKey)?.label ?? null;
  // Layers ticked before any interaction wait for the base scene to settle.
  const offset = touched ? 0 : BASE_SETTLE;

  const handleCta = () => {
    open(
      'consultation',
      selectedLabels.length
        ? copy.contextLabel + ': ' + selectedLabels.join(', ')
        : copy.contextLabel,
    );
  };

  return (
    <div
      ref={rootRef}
      className={cn('flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12', className)}
    >
      {/* ── Scene panel ── */}
      <div className="min-w-0 lg:w-[58%]">
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

          {/* Layer status strip: one square per layer, filled when ticked */}
          <div aria-hidden className="flex items-center gap-1.5 px-5 pt-4">
            {layers.map((l) => (
              <span
                key={l.key}
                className={cn(
                  'inline-block size-1.5 transition-colors duration-300',
                  on.has(l.key) ? 'bg-bronze-400' : 'bg-sand-50/15',
                )}
              />
            ))}
          </div>

          <svg
            viewBox="0 0 640 360"
            preserveAspectRatio="xMidYMid meet"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="block h-auto w-full select-none"
            aria-hidden
          >
            {/* Base scene: draws once on inView */}
            {BASE.map((s, i) => (
              <motion.path
                key={i}
                d={s.d}
                fill="none"
                stroke={GOLD}
                strokeWidth={s.width ?? 1.5}
                initial={false}
                animate={{
                  pathLength: reduce ? 1 : inView ? 1 : 0,
                  opacity: inView ? (s.opacity ?? 1) : 0,
                }}
                transition={
                  reduce
                    ? {
                        pathLength: { duration: 0 },
                        opacity: { duration: 0.4, delay: s.delay, ease: 'easeOut' },
                      }
                    : {
                        pathLength: inView
                          ? { duration: 0.65, delay: s.delay, ease: EASE_LUXE }
                          : { duration: 0 },
                        opacity: inView ? { duration: 0.3, delay: s.delay } : { duration: 0 },
                      }
                }
              />
            ))}

            {/* Layer overlays: mount → draw in, unmount → fade out */}
            <AnimatePresence>
              {inView &&
                layers.map((l) => {
                  if (!on.has(l.key)) return null;
                  const strokes = OVERLAYS[l.key] ?? [];
                  const dim = lifted !== null && lifted !== l.key;
                  return (
                    <motion.g
                      key={l.key}
                      initial={{ opacity: 1 }}
                      animate={{ opacity: dim ? 0.45 : 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {strokes.map((s, i) => (
                        <LayerStroke key={i} s={s} offset={offset} reduce={reduce} />
                      ))}
                    </motion.g>
                  );
                })}
            </AnimatePresence>

            {/* HUD caption: hovered / last toggled layer (scales below
                legibility on phones — the list below is the legend there) */}
            <AnimatePresence initial={false}>
              {caption && (
                <motion.text
                  key={captionKey}
                  x={624}
                  y={44}
                  textAnchor="end"
                  fontSize={13}
                  letterSpacing={2}
                  fill={GOLD_HI}
                  className="hidden sm:block"
                  style={{ fontFamily: MONO }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: inView ? 1 : 0 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: inView && !touched ? BASE_SETTLE : 0,
                    ease: 'easeOut',
                  }}
                >
                  {caption}
                </motion.text>
              )}
            </AnimatePresence>
          </svg>
        </div>
      </div>

      {/* ── Layer checklist + summary + CTA ── */}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-mono text-[0.62rem] tracking-[0.3em] text-sand-400 uppercase">
          <motion.span
            aria-hidden
            className="inline-block size-1.5 shrink-0 bg-bronze-400"
            animate={reduce ? undefined : { opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          {copy.hint}
        </p>

        <div className="mt-3">
          {layers.map((l) => {
            const isOn = on.has(l.key);
            return (
              <button
                key={l.key}
                type="button"
                role="checkbox"
                aria-checked={isOn}
                onClick={() => toggle(l.key)}
                onPointerEnter={() => hoverIn(l.key)}
                onPointerLeave={() => hoverOut(l.key)}
                onFocus={() => hoverIn(l.key)}
                onBlur={() => hoverOut(l.key)}
                className="hairline group flex min-h-11 w-full cursor-pointer items-start gap-4 border-b px-1.5 py-3.5 text-start first:border-t sm:gap-5"
              >
                <span
                  aria-hidden
                  className={cn(
                    'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-sm border transition-colors duration-300',
                    isOn
                      ? 'border-bronze-500 bg-bronze-500'
                      : 'border-sand-50/25 bg-transparent group-hover:border-bronze-500/60',
                  )}
                >
                  <AnimatePresence initial={false}>
                    {isOn && (
                      <motion.span
                        className="flex text-white"
                        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.3 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.3 }}
                        transition={
                          reduce
                            ? { duration: 0.15 }
                            : { type: 'spring', stiffness: 300, damping: 22 }
                        }
                      >
                        <Check className="size-4" strokeWidth={3} aria-hidden />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block font-display text-base leading-snug transition-colors duration-300 sm:text-lg',
                      isOn ? 'text-sand-50' : 'text-sand-400 group-hover:text-sand-200',
                    )}
                  >
                    {l.label}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-sand-400">
                    {l.text}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Summary line — announces the current selection */}
        <p aria-live="polite" className="mt-5 text-sm leading-relaxed text-sand-300">
          <span className="font-mono text-[0.62rem] tracking-[0.28em] text-sand-500 uppercase">
            {copy.selectedLabel}
            {': '}
          </span>
          {selectedLabels.length ? selectedLabels.join(' · ') : copy.emptyText}
        </p>

        <BronzeButton onClick={handleCta} className="mt-5 w-full sm:w-auto">
          {copy.cta}
        </BronzeButton>
      </div>
    </div>
  );
}
