'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Check } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { LeadCtaButton } from '@/components/lead/LeadCtaButton';

const EASE = [0.22, 1, 0.36, 1] as const;

/** Mirrors BronzeButton's flat rectangular solid look for internal links (i18n Link keeps <a> semantics). */
const linkButtonClasses =
  'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2.5 bg-bronze-500 px-8 py-3 text-[0.82rem] font-bold tracking-[0.12em] uppercase underline underline-offset-4 decoration-1 text-ink-950 transition-colors duration-300 select-none hover:bg-bronze-400';

export type OfferIconKind = 'construction' | 'repair' | 'design';

export interface OfferTab {
  key: string;
  label: string;
  title: string;
  bullets: string[];
  cta: { label: string; href?: string; lead?: boolean };
  image: string;
  icon: OfferIconKind;
}

/* Gold line-art icons (same drawing language as the process scene);
   paths draw in with a stagger whenever the tab becomes active. */
const ICON_PATHS: Record<OfferIconKind, string[]> = {
  construction: [
    'M5 25 L24 10 L43 25', // roof
    'M10 22 v18 h28 v-18', // walls
    'M20 40 v-9 h8 v9', // door
    'M33 12 v-5 h5 v9', // chimney
  ],
  repair: [
    'M7 9 h22 v9 H7 Z', // roller sleeve
    'M29 13 h7 v9 h-7', // frame to stem
    'M36 22 v9', // stem
    'M32 31 h8 v9 h-8 Z', // grip
    'M9 26 h8 M9 32 h12 M9 38 h6', // fresh strokes on the wall
  ],
  design: [
    'M24 8 L13 40', // compass leg A
    'M24 8 L35 40', // compass leg B
    'M24 5 a3.2 3.2 0 1 1 -0.1 0', // hinge
    'M16 32 A 13.5 13.5 0 0 0 32 32', // drawn arc
  ],
};

function OfferIcon({ kind, active }: { kind: OfferIconKind; active: boolean }) {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 48 48" className="size-14 sm:size-16" aria-hidden>
      {ICON_PATHS[kind].map((d, i) => (
        <motion.path
          key={d}
          d={d}
          fill="none"
          stroke="#bc9d68"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: active ? 1 : 0, opacity: active ? 1 : 0 }}
          transition={
            reduce
              ? { duration: 0 }
              : { duration: 0.7, delay: 0.15 + i * 0.12, ease: EASE }
          }
        />
      ))}
    </svg>
  );
}

/**
 * Tabbed advantages block: segmented switcher on top, below it a wide split
 * card — animated line-art icon, title, staggered check list and CTA on one
 * side, a crossfading photograph with the inset bronze frame on the other.
 */
export function OfferTabs({ tabs }: { tabs: OfferTab[] }) {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const tab = tabs[active];
  if (!tab) return null;

  const focusTab = (index: number) => {
    const next = (index + tabs.length) % tabs.length;
    setActive(next);
    document.getElementById(`offer-tab-${tabs[next]!.key}`)?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusTab(active + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusTab(active - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusTab(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusTab(tabs.length - 1);
    }
  };

  const list = {
    hidden: {},
    visible: { transition: { staggerChildren: reduce ? 0 : 0.09, delayChildren: 0.25 } },
  };
  const item = {
    hidden: { opacity: 0, x: reduce ? 0 : -18 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: EASE } },
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Segmented tab bar */}
      <div
        role="tablist"
        className="hairline mx-auto flex w-full max-w-xl rounded-sm border bg-ink-850/80 p-1.5"
      >
        {tabs.map((entry, index) => {
          const selected = index === active;
          return (
            <button
              key={entry.key}
              type="button"
              role="tab"
              id={`offer-tab-${entry.key}`}
              aria-selected={selected}
              aria-controls={`offer-panel-${entry.key}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
              onKeyDown={onKeyDown}
              className={cn(
                'relative min-h-11 flex-1 cursor-pointer rounded-sm px-3 text-sm font-semibold tracking-wide transition-colors duration-300 sm:px-5',
                selected ? 'text-ink-950' : 'text-sand-300 hover:text-sand-50',
              )}
            >
              {selected && (
                <motion.span
                  layoutId="offer-tab-pill"
                  aria-hidden
                  className="absolute inset-0 rounded-sm bg-bronze-500"
                  transition={
                    reduce ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 28 }
                  }
                />
              )}
              <span className="relative z-10">{entry.label}</span>
            </button>
          );
        })}
      </div>

      {/* Wide split panel */}
      <div className="mt-10 md:mt-12">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab.key}
            role="tabpanel"
            id={`offer-panel-${tab.key}`}
            aria-labelledby={`offer-tab-${tab.key}`}
            initial={{ opacity: 0, y: reduce ? 0 : 14 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } }}
            exit={{ opacity: 0, y: reduce ? 0 : -10, transition: { duration: 0.18, ease: EASE } }}
            className="card-luxe grid overflow-hidden rounded-sm lg:grid-cols-[1.05fr_1fr]"
          >
            {/* Content side */}
            <div className="flex flex-col justify-center gap-6 p-7 sm:p-10 xl:p-14">
              <OfferIcon kind={tab.icon} active />
              <h3 className="font-display text-2xl font-semibold sm:text-3xl">{tab.title}</h3>

              <motion.ul
                className="space-y-3.5"
                variants={list}
                initial="hidden"
                animate="visible"
              >
                {tab.bullets.map((bullet) => (
                  <motion.li
                    key={bullet}
                    variants={item}
                    className="flex items-start gap-3.5 leading-relaxed text-sand-200"
                  >
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-bronze-500">
                      <Check aria-hidden className="size-3.5 text-sand-50" strokeWidth={3} />
                    </span>
                    <span className="pt-0.5">{bullet}</span>
                  </motion.li>
                ))}
              </motion.ul>

              <motion.div
                className="mt-2"
                initial={{ opacity: 0, y: reduce ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5, ease: EASE }}
              >
                {tab.cta.lead ? (
                  <LeadCtaButton type="consultation" context="offerTabs" label={tab.cta.label} />
                ) : (
                  <Link href={tab.cta.href ?? '/leistungen'} className={linkButtonClasses}>
                    {tab.cta.label}
                    <ArrowRight aria-hidden className="size-4" />
                  </Link>
                )}
              </motion.div>
            </div>

            {/* Image side with the inset bronze frame */}
            <div className="relative order-first aspect-[16/9] lg:order-none lg:aspect-auto lg:h-full">
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0, scale: reduce ? 1 : 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: EASE }}
              >
                <Image
                  src={tab.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 46vw, 100vw"
                  className="object-cover"
                />
              </motion.div>
              <div
                aria-hidden
                className="absolute inset-0 hidden bg-gradient-to-r from-ink-900/40 via-transparent to-transparent lg:block"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-3 rounded-[2px] border border-bronze-400/50"
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
