'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/ui/Reveal';

const EASE = [0.22, 1, 0.36, 1] as const;

export interface StyleEntry {
  key: string;
  title: string;
  text: string;
  image: string;
}

/**
 * Interactive house-style explorer. Receives pre-translated entries (the
 * `hausbau` namespace is not whitelisted on the client).
 *
 * Desktop: vertical list of style names with a shared-layout bronze indicator
 * line; large preview panel crossfades between styles (AnimatePresence).
 * Mobile: horizontal chip bar (edge-bleed scroll) with the preview below.
 */
export function StylesExplorer({ styles }: { styles: StyleEntry[] }) {
  const reduce = useReducedMotion();
  const [activeKey, setActiveKey] = useState<string>(styles[0]?.key ?? '');

  if (styles.length === 0) return null;
  const active = styles.find((s) => s.key === activeKey) ?? styles[0];

  const preview = (
    <div aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.figure
          key={active.key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.7, ease: EASE } }}
          exit={{ opacity: 0, transition: { duration: 0.42, ease: EASE } }}
          className="relative overflow-hidden rounded-sm bg-ink-850"
        >
          {/* Scale lives on an inner node so the frosted caption itself is
              never transformed (backdrop-filter stays cheap). */}
          <motion.div
            initial={{ scale: reduce ? 1 : 1.045 }}
            animate={{ scale: 1, transition: { duration: 0.9, ease: EASE } }}
            className="relative aspect-[4/3]"
          >
            <Image
              src={active.image}
              alt={active.title}
              fill
              sizes="(min-width: 1024px) 56vw, 100vw"
              className="object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-ink-950/75 via-ink-950/10 to-transparent"
            />
          </motion.div>
          <figcaption className="glass absolute inset-x-4 bottom-4 rounded-sm p-5 sm:inset-x-6 sm:bottom-6 sm:p-6">
            <h3 className="font-display text-xl font-semibold sm:text-2xl">
              {active.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-sand-300 sm:text-base">
              {active.text}
            </p>
          </figcaption>
        </motion.figure>
      </AnimatePresence>
    </div>
  );

  return (
    <Reveal>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-center lg:gap-14">
        {/* Mobile: horizontal chip bar (edge bleed, hidden scrollbar) */}
        <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:hidden">
          <div className="flex w-max gap-2.5 pb-1">
            {styles.map((s) => {
              const isActive = s.key === active.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={(e) => {
                    setActiveKey(s.key);
                    e.currentTarget.scrollIntoView({
                      behavior: reduce ? 'auto' : 'smooth',
                      block: 'nearest',
                      inline: 'center',
                    });
                  }}
                  className={cn(
                    'inline-flex min-h-11 cursor-pointer items-center whitespace-nowrap rounded-sm border px-5 font-display text-sm uppercase transition-colors duration-300',
                    isActive
                      ? 'border-bronze-500 bg-bronze-500 text-ink-950'
                      : 'border-sand-50/10 bg-ink-850 text-sand-400 hover:border-sand-50/25 hover:text-sand-100',
                  )}
                >
                  {s.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop: vertical name list with shared-layout indicator line */}
        <ul className="hairline hidden border-s lg:block">
          {styles.map((s) => {
            const isActive = s.key === active.key;
            return (
              <li key={s.key} className="relative">
                {isActive && (
                  <motion.span
                    layoutId="hausbau-style-indicator"
                    aria-hidden
                    className="absolute -start-px top-1.5 bottom-1.5 w-0.5 bg-bronze-400"
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 300, damping: 26 }
                    }
                  />
                )}
                <button
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveKey(s.key)}
                  className={cn(
                    'flex min-h-11 w-full cursor-pointer items-center py-2.5 pe-3 ps-6 text-start font-display text-lg uppercase tracking-wider transition-colors duration-300',
                    isActive ? 'text-bronze-300' : 'text-sand-500 hover:text-sand-200',
                  )}
                >
                  {s.title}
                </button>
              </li>
            );
          })}
        </ul>

        {preview}
      </div>
    </Reveal>
  );
}
