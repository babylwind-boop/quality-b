'use client';

import { useEffect, useId, useRef, useState } from 'react';
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type Variants,
} from 'motion/react';
import { cn } from '@/lib/utils';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;
const DURATION = 1.3;
const STAGGER = 0.15;
const HOVER = { duration: 0.4, ease: EASE_LUXE };

const BRONZE = '#a98b56'; // bronze-500 — resting arc / dial ticks
const BRONZE_LIGHT = '#d0b586'; // bronze-300 — dot, hovered arc
const BRONZE_LIGHTER = '#e3cfa8'; // bronze-200 — hovered dot
const TRACK = 'rgba(245,246,247,0.10)';

const CENTER = 60;
const RADIUS = 50;
const DOT_RADIUS = 3;

/**
 * 36 short radial ticks (r 56→60, every 10°) drawn as one path — the thin
 * "dial" that sits just outside the ring. Coordinates are rounded so the
 * server and client render identical markup.
 */
const TICKS = Array.from({ length: 36 }, (_, i) => {
  const angle = (i * Math.PI) / 18;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const x1 = (CENTER + 56 * cos).toFixed(2);
  const y1 = (CENTER + 56 * sin).toFixed(2);
  const x2 = (CENTER + 60 * cos).toFixed(2);
  const y2 = (CENTER + 60 * sin).toFixed(2);
  return `M${x1} ${y1}L${x2} ${y2}`;
}).join('');

// Hover state propagates from the gauge wrapper down to these variants.
const dialVariants: Variants = {
  rest: { scale: 1, transition: HOVER },
  hover: { scale: 1.03, transition: HOVER },
};
const arcVariants: Variants = {
  rest: { stroke: BRONZE, transition: HOVER },
  hover: { stroke: BRONZE_LIGHT, transition: HOVER },
};
const dotVariants: Variants = {
  rest: { fill: BRONZE_LIGHT, transition: HOVER },
  hover: { fill: BRONZE_LIGHTER, transition: HOVER },
};

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function Gauge({
  label,
  value,
  inView,
  delay,
}: {
  label: string;
  value: number;
  inView: boolean;
  delay: number;
}) {
  const reduce = useReducedMotion() ?? false;
  const labelId = useId();
  const clamped = clampPercent(value);
  const target = clamped / 100;

  // One motion value drives the arc, the travelling dot and the counter, so
  // the three can never drift out of sync.
  const progress = useMotionValue(0);
  const rotate = useTransform(progress, (p) => p * 360);
  const [display, setDisplay] = useState(0);
  useMotionValueEvent(progress, 'change', (p) => {
    setDisplay(Math.round(p * 100));
  });

  useEffect(() => {
    // Reduced motion: jump straight to the final state, no viewport wait.
    if (reduce) {
      progress.set(target);
      return;
    }
    if (!inView) return;
    const controls = animate(progress, target, {
      duration: DURATION,
      delay,
      ease: EASE_LUXE,
    });
    return () => controls.stop();
  }, [inView, reduce, target, delay, progress]);

  return (
    <motion.div
      className="flex flex-col items-center"
      initial="rest"
      animate="rest"
      whileHover={reduce ? undefined : 'hover'}
    >
      <motion.div
        role="meter"
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        variants={dialVariants}
        className="relative size-28 cursor-default sm:size-32"
      >
        <svg
          viewBox="0 0 120 120"
          aria-hidden
          className="size-full overflow-visible"
        >
          {/* Faint track */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke={TRACK}
            strokeWidth={3}
          />
          {/* Dial ticks */}
          <path
            d={TICKS}
            fill="none"
            stroke={BRONZE}
            strokeWidth={1}
            strokeLinecap="round"
            opacity={0.35}
          />
          {/* Progress arc — rotated so it starts at 12 o'clock */}
          <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
            <motion.circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              strokeWidth={3}
              strokeLinecap="round"
              variants={arcVariants}
              style={{ pathLength: progress }}
            />
          </g>
          {/* Bronze dot riding the arc tip. `transformBox: view-box` makes the
              50% 50% origin the centre of the viewBox instead of the dot. */}
          <motion.g style={{ rotate, transformBox: 'view-box' }}>
            <motion.circle
              cx={CENTER}
              cy={CENTER - RADIUS}
              r={DOT_RADIUS}
              variants={dotVariants}
            />
          </motion.g>
        </svg>
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="tnum font-display text-3xl leading-none font-semibold text-sand-50">
            {display}
            <span className="text-base text-bronze-400">%</span>
          </span>
        </div>
      </motion.div>
      <span
        id={labelId}
        className="mt-3 text-center text-sm leading-snug text-sand-300"
      >
        {label}
      </span>
    </motion.div>
  );
}

/**
 * Animated ring gauges in the site's gold line-art language — the successor
 * to the percentage bars. Each gauge draws its bronze arc from 12 o'clock on
 * first viewport entry (staggered by index) while a small dot rides the arc
 * tip and the centred number counts up in sync. Hovering brightens the arc
 * and dot and lifts the dial slightly; reduced motion renders the final
 * state instantly with no hover transforms.
 */
export function SkillGauges({
  skills,
  className,
}: {
  skills: { label: string; value: number }[];
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <div ref={ref} className={cn('grid grid-cols-2 gap-6 sm:gap-8', className)}>
      {skills.map((skill, i) => (
        <Gauge
          key={`${skill.label}-${i}`}
          label={skill.label}
          value={skill.value}
          inView={inView}
          delay={i * STAGGER}
        />
      ))}
    </div>
  );
}
