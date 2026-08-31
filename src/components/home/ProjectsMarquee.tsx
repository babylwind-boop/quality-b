'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Client wrapper for the home projects marquee strip (WCAG 2.2.2 pause
 * mechanism). Hover pause stays pure CSS via the `group` class; this adds a
 * pointerdown/click toggle for touch users and pauses while focus is inside
 * the strip for keyboard users. The photo cells arrive server-rendered as
 * children.
 */
export function ProjectsMarquee({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);

  return (
    <div
      tabIndex={0}
      onPointerDown={() => setPaused((p) => !p)}
      onClick={(e) => {
        // Keyboard "clicks" (Enter/Space) have no pointerdown — toggle here.
        if (e.detail === 0) setPaused((p) => !p);
      }}
      className="group relative"
    >
      <div
        className={cn(
          'flex w-max animate-marquee group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]',
          paused && '[animation-play-state:paused]',
        )}
      >
        {children}
      </div>
      {/* Edge fades into the page background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 start-0 w-16 bg-gradient-to-r from-ink-900 to-transparent sm:w-28"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 end-0 w-16 bg-gradient-to-l from-ink-900 to-transparent sm:w-28"
      />
    </div>
  );
}
