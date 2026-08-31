'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion, type Variants } from 'motion/react';
import { cn } from '@/lib/utils';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;

/**
 * Vertical numbered timeline (01, 02, …). A start-side connector line grows
 * downwards while the steps stagger in, Reveal-style.
 */
export function ProcessSteps({
  steps,
  className,
}: {
  steps: { title: string; text: string }[];
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const reduce = useReducedMotion();

  const list: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 26 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_LUXE } },
  };

  return (
    <div ref={ref} className={cn('relative', className)}>
      {/* Connector line growing behind the step numbers */}
      <motion.span
        aria-hidden
        className="absolute inset-y-6 start-6 w-px origin-top bg-gradient-to-b from-bronze-500/50 via-bronze-500/25 to-transparent"
        initial={{ scaleY: 0 }}
        animate={inView ? { scaleY: 1 } : undefined}
        transition={
          reduce
            ? { duration: 0 }
            : { duration: 1.4, ease: EASE_LUXE, delay: 0.15 }
        }
      />
      <motion.ol
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        variants={list}
        className="space-y-10 sm:space-y-12"
      >
        {steps.map((step, i) => (
          <motion.li key={step.title} variants={item} className="flex gap-5 sm:gap-7">
            <span className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full bg-ink-850 font-display text-lg font-semibold text-bronze-400 ring-1 ring-bronze-500/35">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="pt-1.5">
              <h3 className="font-display text-xl font-semibold text-sand-50">
                {step.title}
              </h3>
              <p className="mt-2 max-w-prose leading-relaxed text-sand-400">
                {step.text}
              </p>
            </div>
          </motion.li>
        ))}
      </motion.ol>
    </div>
  );
}
