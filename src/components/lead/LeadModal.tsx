'use client';

import { useEffect, useRef } from 'react';
import type Lenis from 'lenis';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LeadForm } from './LeadForm';
import { useLeadModal, type LeadType } from './LeadModalContext';

/** Lead types mapped to their title+description keys in contactPopup. */
const POPUP_COPY: Record<LeadType, 'consultation' | 'contact' | 'callback' | 'visit'> = {
  consultation: 'consultation',
  contact: 'contact',
  callback: 'callback',
  visit: 'visit',
};

/** Global lead modal — opened from anywhere via useLeadModal(). */
export function LeadModal() {
  const { current, close } = useLeadModal();
  const tn = useTranslations('nav');
  const tc = useTranslations('contactPopup');
  const reduce = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!current) return;
    const opener =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]',
        ),
      ).filter((el) => el.tabIndex !== -1);
      if (focusable.length === 0) {
        e.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || active === dialog || !dialog.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !dialog.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    lenis?.stop();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
      lenis?.start();
      opener?.focus();
    };
  }, [current, close]);

  const copyKey = current ? POPUP_COPY[current.type] : 'consultation';

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key="lead-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-x-0 top-0 z-100 flex h-[100dvh] items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={close}
        >
          <motion.div
            key="lead-dialog"
            ref={dialogRef}
            tabIndex={-1}
            data-lenis-prevent
            role="dialog"
            aria-modal="true"
            aria-label={tc(`${copyKey}.title`)}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 48, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 32, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="card-luxe max-h-[94dvh] w-full overflow-y-auto rounded-t-md p-5 sm:max-w-lg sm:rounded-md sm:p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl text-sand-50 sm:text-2xl">
                  {tc(`${copyKey}.title`)}
                </h2>
                <p className="mt-1.5 text-[0.83rem] leading-snug text-sand-400">
                  {tc(`${copyKey}.description`)}
                </p>
                {current.context && (
                  <p className="mt-2 inline-block rounded-sm border border-bronze-500/30 bg-bronze-500/8 px-3 py-1 text-xs font-medium text-bronze-300">
                    {current.context}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={close}
                aria-label={tn('close')}
                className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border border-sand-50/12 text-sand-300 transition-colors hover:border-bronze-500/50 hover:text-bronze-300"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <LeadForm type={current.type} context={current.context} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
