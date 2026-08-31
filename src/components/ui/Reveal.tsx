'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { cn } from '@/lib/utils';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;

/**
 * Scroll-reveal wrapper. Unlike a bare `whileInView`, this also checks the
 * element's position on mount and shows it immediately if it's already in the
 * viewport — which guarantees above-the-fold content is visible right after a
 * client-side navigation (the IntersectionObserver-on-mount race otherwise
 * leaves it hidden until the user scrolls).
 */
function useRevealed<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;

    const inView = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      return r.top < vh * 0.92 && r.bottom > 0;
    };

    // Already visible on mount → reveal now (fixes post-navigation hidden state)
    if (inView()) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  return { ref, shown };
}

export function Reveal({
  children,
  className,
  delay = 0,
  stagger = 0,
  as = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Seconds between children; 0 = animate as one block. */
  stagger?: number;
  as?: 'div' | 'section' | 'ul' | 'span';
}) {
  const reduce = useReducedMotion();
  const { ref, shown } = useRevealed<HTMLDivElement>();
  const Tag = motion[as];

  const parent: Variants = {
    hidden: {},
    visible: {
      transition: stagger
        ? { staggerChildren: stagger, delayChildren: delay }
        : undefined,
    },
  };

  const block: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_LUXE, delay } },
  };

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={cn(className)}
      initial="hidden"
      animate={shown ? 'visible' : 'hidden'}
      variants={stagger ? parent : block}
    >
      {children}
    </Tag>
  );
}

/** Child item for a staggered Reveal parent (inherits the parent's state). */
export function RevealItem({
  children,
  className,
  as = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'li' | 'span';
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={cn(className)}
      variants={{
        hidden: { opacity: 0, y: reduce ? 0 : 26 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_LUXE } },
      }}
    >
      {children}
    </Tag>
  );
}
