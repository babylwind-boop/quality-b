'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;
const DURATION = 1.1;
const STAGGER = 0.08;

function SkillBar({
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
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const clamped = Math.max(0, Math.min(100, value));

  useEffect(() => {
    if (!inView) return;
    // Reduced motion: a zero-duration run jumps straight to the final value.
    const controls = animate(0, clamped, {
      duration: reduce ? 0 : DURATION,
      delay: reduce ? 0 : delay,
      ease: EASE_LUXE,
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduce, clamped, delay]);

  return (
    <div className="group cursor-default py-1">
      <div className="mb-2.5 flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium tracking-wide text-sand-100 transition-colors duration-300 group-hover:text-sand-50">
          {label}
        </span>
        <span className="tnum text-sm text-bronze-300 transition-all duration-300 group-hover:text-base group-hover:text-bronze-200">
          {display}%
        </span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        className="relative h-[3px] overflow-hidden bg-sand-50/10 transition-[height] duration-300 group-hover:h-[6px]"
      >
        <motion.div
          aria-hidden
          className="absolute inset-0 origin-left overflow-hidden bg-bronze-500 transition-colors duration-300 group-hover:bg-bronze-400"
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: clamped / 100 } : undefined}
          transition={
            reduce
              ? { duration: 0 }
              : { duration: DURATION, delay, ease: EASE_LUXE }
          }
        />
        {/* Sheen sweep across the filled part on hover */}
        <span
          aria-hidden
          style={{ width: `${clamped}%` }}
          className="pointer-events-none absolute inset-y-0 start-0 overflow-hidden"
        >
          <span className="absolute inset-y-0 start-0 w-1/3 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[400%]" />
        </span>
      </div>
    </div>
  );
}

/**
 * Animated bronze skill/progress bars: label + counting-up percentage over a
 * hairline track whose bar scales in from the start on first viewport entry.
 * Hovering a row thickens the track, brightens the bar and sweeps a sheen
 * across the filled portion.
 */
export function SkillBars({
  skills,
  className,
}: {
  skills: { label: string; value: number }[];
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });

  return (
    <div ref={ref} className={cn('space-y-5', className)}>
      {skills.map((skill, i) => (
        <SkillBar
          key={skill.label}
          label={skill.label}
          value={skill.value}
          inView={inView}
          delay={i * STAGGER}
        />
      ))}
    </div>
  );
}
