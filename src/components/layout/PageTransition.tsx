'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';

/**
 * Full fade-out → fade-in route transitions.
 *
 * App Router unmounts the old page instantly, so exit animations are faked
 * the only reliable way: a capture-phase click handler intercepts internal
 * links, fades the whole page out (~160ms), then performs the navigation;
 * the new page (keyed by pathname) fades back in.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [leaving, setLeaving] = useState(false);
  const navigatingTo = useRef<string | null>(null);

  // Intercept internal link clicks for the exit phase
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      const dest = url.pathname + url.search + url.hash;
      const here = window.location.pathname + window.location.search;
      if (url.pathname + url.search === here) return; // same page (or pure hash change)

      e.preventDefault();
      if (navigatingTo.current === dest) return;
      navigatingTo.current = dest;

      if (reduce) {
        router.push(dest);
        return;
      }
      setLeaving(true);
      window.setTimeout(() => router.push(dest), 170);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [router, reduce]);

  // New route mounted — reset and let the enter animation play
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setLeaving(false);
  }
  useEffect(() => {
    navigatingTo.current = null;
  }, [pathname]);

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={
        leaving
          ? { duration: 0.16, ease: 'easeIn' }
          : { duration: 0.34, ease: 'easeOut' }
      }
    >
      {children}
    </motion.div>
  );
}
