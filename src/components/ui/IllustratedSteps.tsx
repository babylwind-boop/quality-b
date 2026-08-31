'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion, type Variants } from 'motion/react';
import { cn } from '@/lib/utils';
import { DrawIcon, type DrawIconSpec } from '@/components/ui/DrawIcon';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;

/**
 * Numbered vertical timeline whose badges are drawing line-art pictograms —
 * the illustrated big brother of ProcessSteps. A bronze connector grows down
 * the start side while the steps stagger in.
 */
export function IllustratedSteps({
  steps,
  className,
}: {
  steps: { title: string; text: string; icon: DrawIconSpec }[];
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.12 });
  const reduce = useReducedMotion();

  const list: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 26 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_LUXE } },
  };

  return (
    <div ref={ref} className={cn('relative', className)}>
      <motion.span
        aria-hidden
        className="absolute inset-y-8 start-7 w-px origin-top bg-gradient-to-b from-bronze-500/50 via-bronze-500/25 to-transparent sm:start-8"
        initial={{ scaleY: 0 }}
        animate={inView ? { scaleY: 1 } : undefined}
        transition={
          reduce ? { duration: 0 } : { duration: 1.6, ease: EASE_LUXE, delay: 0.2 }
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
            <span className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-sm border border-bronze-500/30 bg-ink-850 text-bronze-300 sm:size-16">
              <DrawIcon icon={step.icon} delay={0.25 + i * 0.1} className="size-8 sm:size-9" />
              <span className="tnum absolute -top-2 -end-2 flex size-6 items-center justify-center rounded-sm bg-bronze-500 font-display text-[0.65rem] font-semibold text-ink-950">
                {String(i + 1).padStart(2, '0')}
              </span>
            </span>
            <div className="pt-1">
              <h3 className="font-display text-xl font-semibold text-sand-50">
                {step.title}
              </h3>
              <p className="mt-2 max-w-prose leading-relaxed text-sand-400">{step.text}</p>
            </div>
          </motion.li>
        ))}
      </motion.ol>
    </div>
  );
}
