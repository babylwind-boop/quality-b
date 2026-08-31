'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;
const DURATION = 1.4;

/** "150+" → { num: 150, … suffix: "+" }; null when there is no leading number. */
function parseValue(value: string) {
  const match = /^(\d+(?:[.,]\d+)?)(.*)$/.exec(value.trim());
  if (!match) return null;
  const numStr = match[1];
  const suffix = match[2];
  const separator = numStr.includes(',') ? ',' : '.';
  const decimals = numStr.split(/[.,]/)[1]?.length ?? 0;
  return {
    num: Number.parseFloat(numStr.replace(',', '.')),
    decimals,
    separator,
    suffix,
  };
}

/**
 * Big display stat ("150+", "100%", "25"). The numeric part counts up once the
 * element first enters the viewport; any suffix is kept verbatim. Values
 * without a leading number are rendered statically.
 */
export function StatCounter({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const parsed = parseValue(value);
  const target = parsed?.num ?? 0;
  const hasNumber = parsed !== null;

  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView || !hasNumber) return;
    // Reduced motion: a zero-duration run jumps straight to the final value.
    const controls = animate(0, target, {
      duration: reduce ? 0 : DURATION,
      ease: EASE_LUXE,
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, reduce, hasNumber, target]);

  const formatted = parsed
    ? parsed.decimals > 0
      ? display.toFixed(parsed.decimals).replace('.', parsed.separator)
      : String(Math.round(display))
    : value;

  return (
    <div ref={ref} className={cn('flex flex-col', className)}>
      <span className="tnum font-display text-4xl font-semibold tracking-wide sm:text-5xl">
        {parsed ? (
          <>
            <span aria-hidden className="text-bronze-sheen">
              {formatted}
              {parsed.suffix}
            </span>
            <span className="sr-only">{value}</span>
          </>
        ) : (
          <span className="text-bronze-sheen">{value}</span>
        )}
      </span>
      <span className="mt-2 text-sm leading-relaxed text-sand-400">{label}</span>
    </div>
  );
}
