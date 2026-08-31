'use client';

import { useEffect } from 'react';
import { useReducedMotion } from 'motion/react';
import Lenis from 'lenis';

/**
 * Sitewide gentle scroll smoothing (Lenis on native window scroll — sticky
 * sections keep working). Deliberately light: lerp 0.12 gives a soft ease
 * without the floaty feel. Disabled under prefers-reduced-motion; touch
 * scrolling stays fully native.
 */
export function SmoothScroll() {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const lenis = new Lenis({
      lerp: 0.12,
      wheelMultiplier: 1,
      smoothWheel: true,
      syncTouch: false,
    });
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
      lenis.destroy();
    };
  }, [reduce]);

  return null;
}
