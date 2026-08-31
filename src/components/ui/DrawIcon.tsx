'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;

export interface DrawIconSpec {
  /** Defaults to "0 0 48 48". */
  viewBox?: string;
  paths: { d: string; width?: number; delay?: number; dashed?: boolean }[];
}

/**
 * Gold line-art icon that draws itself in when scrolled into view — the small
 * sibling of the ProcessStory scenes. Color comes from `currentColor`, size
 * from the className (e.g. `size-12 text-bronze-300`).
 */
export function DrawIcon({
  icon,
  delay = 0,
  className,
}: {
  icon: DrawIconSpec;
  /** Extra base delay in seconds (used by staggered card grids). */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion() ?? false;

  return (
    <svg
      ref={ref}
      viewBox={icon.viewBox ?? '0 0 48 48'}
      aria-hidden
      className={cn('overflow-visible', className)}
    >
      {icon.paths.map((p, i) => {
        // motion drives pathLength via stroke-dasharray, which would override a
        // dashed stroke — dashed paths therefore fade in instead of drawing.
        const on = inView || reduce;
        const target = p.dashed
          ? { opacity: on ? 1 : 0 }
          : { pathLength: on ? 1 : 0, opacity: on ? 1 : 0 };
        return (
          <motion.path
            key={i}
            d={p.d}
            fill="none"
            stroke="currentColor"
            strokeWidth={p.width ?? 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={p.dashed ? '2 5' : undefined}
            initial={false}
            animate={target}
            transition={
              reduce
                ? { duration: 0.3 }
                : {
                    pathLength: {
                      duration: 0.6,
                      delay: delay + (p.delay ?? i * 0.12),
                      ease: EASE_LUXE,
                    },
                    opacity: {
                      duration: p.dashed ? 0.45 : 0.2,
                      delay: delay + (p.delay ?? i * 0.12),
                    },
                  }
            }
          />
        );
      })}
    </svg>
  );
}
