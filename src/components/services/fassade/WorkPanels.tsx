'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/ui/Reveal';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;

export interface WorkPanel {
  key: string;
  title: string;
  text: string;
  image: string;
}

/**
 * Expanding photo panels for the main kinds of facade work. Desktop: a row of
 * flex panels — the active one grows and reveals its description over the
 * photo (hover or click/focus). Mobile: a vertical stack of photo cards with
 * the copy always visible.
 */
export function WorkPanels({ panels }: { panels: WorkPanel[] }) {
  const reduce = useReducedMotion() ?? false;
  const [active, setActive] = useState(0);

  return (
    <Reveal>
      {/* Desktop: expanding row */}
      <div className="hidden h-[27rem] gap-3 lg:flex">
        {panels.map((p, i) => {
          const isActive = i === active;
          return (
            <button
              key={p.key}
              type="button"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              className={cn(
                'group relative min-w-0 cursor-pointer overflow-hidden rounded-sm text-start transition-[flex-grow] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
                isActive ? 'grow-[2.6]' : 'grow',
              )}
              style={{ flexBasis: 0 }}
            >
              <Image
                src={p.image}
                alt={p.title}
                fill
                sizes="(min-width:1024px) 40vw, 100vw"
                className={cn(
                  'object-cover transition-[filter,transform] duration-700',
                  isActive ? 'scale-[1.03] brightness-90' : 'brightness-[0.45] grayscale-[0.35]',
                )}
              />
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/25 to-transparent"
              />
              <span
                aria-hidden
                className={cn(
                  'absolute inset-0 border transition-colors duration-500',
                  isActive ? 'border-bronze-400/60' : 'border-sand-50/10',
                )}
              />
              <span className="tnum absolute top-4 start-4 font-mono text-[0.68rem] tracking-[0.3em] text-bronze-300">
                {`0${i + 1}`}
              </span>

              <span className="absolute inset-x-0 bottom-0 flex flex-col p-5">
                <span
                  className={cn(
                    'hyphens-auto font-display text-lg leading-snug font-semibold break-words transition-colors duration-500',
                    isActive ? 'text-sand-50' : 'text-sand-300',
                  )}
                >
                  {p.title}
                </span>
                <motion.span
                  initial={false}
                  animate={{
                    height: isActive ? 'auto' : 0,
                    opacity: isActive ? 1 : 0,
                  }}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : {
                          height: { duration: 0.55, ease: EASE_LUXE },
                          opacity: { duration: 0.35, delay: isActive ? 0.15 : 0 },
                        }
                  }
                  className="overflow-hidden"
                >
                  <span className="block pt-2.5 text-sm leading-relaxed text-sand-300">
                    {p.text}
                  </span>
                  <span
                    aria-hidden
                    className="mt-4 block h-px w-12 bg-bronze-400/80"
                  />
                </motion.span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile / tablet: photo cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
        {panels.map((p, i) => (
          <article key={p.key} className="card-luxe overflow-hidden rounded-sm">
            <div className="relative aspect-[16/9]">
              <Image
                src={p.image}
                alt={p.title}
                fill
                sizes="(min-width:640px) 50vw, 100vw"
                className="object-cover"
              />
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-ink-900/85 to-transparent"
              />
              <span className="tnum absolute top-3 start-3 font-mono text-[0.65rem] tracking-[0.3em] text-bronze-300">
                {`0${i + 1}`}
              </span>
            </div>
            <div className="p-5">
              <h3 className="font-display text-lg leading-snug font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-sand-400">{p.text}</p>
            </div>
          </article>
        ))}
      </div>

    </Reveal>
  );
}
