'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/ui/Reveal';

const EASE = [0.22, 1, 0.36, 1] as const;

export interface RepairType {
  key: string;
  title: string;
  text: string;
  image: string;
}

/**
 * The five most common repair types. Desktop: numbered tab list with a bronze
 * progress rail on the right, large crossfading photo panel on the left.
 * Mobile: accordion where the open item reveals its photo and copy.
 */
export function RepairTypesShowcase({ items }: { items: RepairType[] }) {
  const reduce = useReducedMotion() ?? false;
  const [active, setActive] = useState(0);
  const current = items[active] ?? items[0];

  return (
    <Reveal>
      {/* Desktop */}
      <div className="hidden gap-14 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-center">
        <div aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.figure
              key={current.key}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.6, ease: EASE } }}
              exit={{ opacity: 0, transition: { duration: 0.35, ease: EASE } }}
              className="relative overflow-hidden rounded-sm bg-ink-850"
            >
              <motion.div
                initial={{ scale: reduce ? 1 : 1.04 }}
                animate={{ scale: 1, transition: { duration: 0.85, ease: EASE } }}
                className="relative aspect-[3/2]"
              >
                <Image
                  src={current.image}
                  alt={current.title}
                  fill
                  sizes="(min-width:1024px) 55vw, 100vw"
                  className="object-cover"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/10 to-transparent"
                />
              </motion.div>
              <figcaption className="absolute inset-x-0 bottom-0 p-6">
                <p className="max-w-xl text-sm leading-relaxed text-sand-200">
                  {current.text}
                </p>
              </figcaption>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-3 rounded-[2px] border border-bronze-400/40"
              />
            </motion.figure>
          </AnimatePresence>
        </div>

        <ol className="relative">
          <span aria-hidden className="absolute inset-y-2 start-0 w-px bg-sand-50/10" />
          <motion.span
            aria-hidden
            className="absolute start-0 top-2 w-px bg-bronze-400"
            style={{ height: `calc((100% - 1rem) / ${items.length})` }}
            animate={{ y: `${active * 100}%` }}
            transition={
              reduce ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 28 }
            }
          />
          {items.map((item, i) => {
            const isActive = i === active;
            return (
              <li key={item.key}>
                <button
                  type="button"
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => setActive(i)}
                  className="group flex min-h-11 w-full cursor-pointer items-baseline gap-4 py-3 ps-6 text-start"
                >
                  <span
                    className={cn(
                      'tnum font-mono text-[0.7rem] tracking-[0.2em] transition-colors duration-400',
                      isActive ? 'text-bronze-400' : 'text-sand-600',
                    )}
                  >
                    {`0${i + 1}`}
                  </span>
                  <span
                    className={cn(
                      'font-display text-lg leading-snug font-semibold transition-colors duration-400',
                      isActive
                        ? 'text-sand-50'
                        : 'text-sand-500 group-hover:text-sand-200',
                    )}
                  >
                    {item.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Mobile / tablet: accordion with photo inside (tap again to close) */}
      <ol className="hairline border-t lg:hidden">
        {items.map((item, i) => {
          const open = i === active;
          return (
            <li key={item.key} className="hairline border-b">
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`repair-panel-${item.key}`}
                onClick={() => setActive(open ? -1 : i)}
                className="flex min-h-12 w-full cursor-pointer items-baseline gap-4 py-4 text-start"
              >
                <span
                  className={cn(
                    'tnum font-mono text-[0.7rem] tracking-[0.2em]',
                    open ? 'text-bronze-400' : 'text-sand-600',
                  )}
                >
                  {`0${i + 1}`}
                </span>
                <span
                  className={cn(
                    'flex-1 font-display text-lg leading-snug font-semibold',
                    open ? 'text-sand-50' : 'text-sand-400',
                  )}
                >
                  {item.title}
                </span>
                <motion.span
                  aria-hidden
                  animate={{ rotate: open ? 45 : 0 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.3, ease: EASE }}
                  className={cn('self-center', open ? 'text-bronze-400' : 'text-sand-500')}
                >
                  <Plus className="size-5" />
                </motion.span>
              </button>
              <motion.div
                id={`repair-panel-${item.key}`}
                initial={false}
                animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : {
                        height: { duration: 0.5, ease: EASE },
                        opacity: { duration: 0.3, delay: open ? 0.1 : 0 },
                      }
                }
                className="overflow-hidden"
              >
                <div className="pb-5 ps-9">
                  <div className="relative mb-4 aspect-[16/9] overflow-hidden rounded-sm">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="100vw"
                      className="object-cover"
                    />
                  </div>
                  <p className="text-sm leading-relaxed text-sand-400">{item.text}</p>
                </div>
              </motion.div>
            </li>
          );
        })}
      </ol>
    </Reveal>
  );
}
