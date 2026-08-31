'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';
import { BronzeButton } from '@/components/ui/BronzeButton';
import { useLeadModal } from '@/components/lead/LeadModalContext';
import { cn } from '@/lib/utils';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;

export interface FacadeCheckProps {
  /** 5 facade symptoms the visitor can tick. */
  items: { key: string; label: string }[];
  copy: {
    /** Small label above the counter, e.g. "Zutreffend". */
    counterLabel: string;
    /** Prefix for the lead-modal context, e.g. "Fassaden-Check". */
    contextLabel: string;
    /** Verdict texts: [0 checked, 1–2 checked, 3+ checked]. */
    verdicts: [string, string, string];
    cta: string;
    hint: string;
  };
  className?: string;
}

/* Interactive facade self-diagnosis: tick the symptoms you recognise, watch
   the verdict sharpen, then hand the selection to the lead modal. */
export function FacadeCheck({ items, copy, className }: FacadeCheckProps) {
  const reduce = useReducedMotion() ?? false;
  const { open } = useLeadModal();
  const [checked, setChecked] = useState<ReadonlySet<string>>(() => new Set());

  const count = checked.size;
  const total = items.length;
  const verdictIdx = count === 0 ? 0 : count <= 2 ? 1 : 2;
  const verdict = copy.verdicts[verdictIdx];

  const toggle = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleCta = () => {
    const checkedLabels = items
      .filter((it) => checked.has(it.key))
      .map((it) => it.label);
    open('consultation', copy.contextLabel + ': ' + checkedLabels.join(', '));
  };

  return (
    <div
      className={cn(
        'grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,23rem)] lg:items-stretch',
        className,
      )}
    >
      {/* ── Symptom checklist ── */}
      <div className="card-luxe rounded-sm">
        {items.map((it) => {
          const isOn = checked.has(it.key);
          return (
            <button
              key={it.key}
              type="button"
              role="checkbox"
              aria-checked={isOn}
              onClick={() => toggle(it.key)}
              className="hairline group flex min-h-11 w-full cursor-pointer items-center gap-3.5 border-b px-4 py-3.5 text-start last:border-b-0 sm:gap-4 sm:px-5 sm:py-4"
            >
              <span
                aria-hidden
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-sm border transition-colors duration-300',
                  isOn
                    ? 'border-bronze-500 bg-bronze-500'
                    : 'border-sand-50/25 bg-transparent group-hover:border-bronze-500/60',
                )}
              >
                <AnimatePresence initial={false}>
                  {isOn && (
                    <motion.span
                      className="flex text-white"
                      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.3 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.3 }}
                      transition={
                        reduce
                          ? { duration: 0.15 }
                          : { type: 'spring', stiffness: 300, damping: 22 }
                      }
                    >
                      <Check className="size-4" strokeWidth={3} aria-hidden />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
              <span
                className={cn(
                  'text-sm leading-snug transition-colors duration-300 sm:text-[0.95rem]',
                  isOn ? 'text-sand-50' : 'text-sand-400 group-hover:text-sand-200',
                )}
              >
                {it.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Summary / verdict panel ── */}
      <div className="card-luxe flex flex-col rounded-sm p-6 sm:p-7">
        <span className="flex items-center gap-2 font-mono text-[0.62rem] tracking-[0.3em] text-sand-400 uppercase">
          <motion.span
            aria-hidden
            className="inline-block size-1.5 bg-bronze-400"
            animate={reduce ? undefined : { opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          {copy.counterLabel}
        </span>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="relative inline-flex overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={count}
                className="tnum font-display text-5xl leading-none font-semibold text-sand-50 sm:text-6xl"
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -18 }}
                transition={
                  reduce
                    ? { duration: 0.15 }
                    : {
                        y: { type: 'spring', stiffness: 300, damping: 22 },
                        opacity: { duration: 0.2 },
                      }
                }
              >
                {count}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="tnum font-display text-2xl text-sand-500">/ {total}</span>
        </div>

        {/* Segmented bronze progress bar */}
        <div aria-hidden className="mt-4 flex gap-1.5">
          {items.map((it, i) => (
            <span
              key={it.key}
              className="h-[3px] flex-1 overflow-hidden rounded-sm bg-sand-50/10"
            >
              <motion.span
                className="block h-full w-full origin-left bg-bronze-500"
                initial={false}
                animate={{ scaleX: count > i ? 1 : 0 }}
                transition={
                  reduce ? { duration: 0 } : { duration: 0.45, ease: EASE_LUXE }
                }
              />
            </span>
          ))}
        </div>

        {/* Verdict (fixed min-height so the CTA never jumps) */}
        <div aria-live="polite" className="mt-5 min-h-24">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={verdictIdx}
              className="text-sm leading-relaxed text-sand-300"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: EASE_LUXE }}
            >
              {verdict}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="mt-auto pt-6">
          <BronzeButton onClick={handleCta} className="w-full">
            {copy.cta}
          </BronzeButton>
          <p className="mt-3 text-xs leading-relaxed text-sand-500">{copy.hint}</p>
        </div>
      </div>
    </div>
  );
}
