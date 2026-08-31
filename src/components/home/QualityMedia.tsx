'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;

/**
 * Media column of the quality-promise section: a stock photograph of an engineer checking
 * drawings on site with a gentle scroll parallax and the inset bronze hairline
 * frame used across the site.
 */
export function QualityMedia() {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion() ?? false;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ['4%', '-4%']);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.08, 1]);

  return (
    <div ref={ref} className="relative">
      <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-ink-850">
        <motion.div
          className="absolute -inset-[6%] will-change-transform"
          style={reduce ? undefined : { y: imageY, scale: imageScale }}
        >
          <Image
            src="/images/quality-check.jpg"
            alt=""
            fill
            sizes="(min-width: 1024px) 44vw, (min-width: 640px) 84vw, 100vw"
            className="object-cover"
          />
        </motion.div>

        {/* Inset bronze hairline frame, always exactly matching the box */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-3 z-10 rounded-[2px] border border-bronze-400/70 sm:inset-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, ease: EASE_LUXE, delay: 0.2 }}
        />
      </div>
    </div>
  );
}
