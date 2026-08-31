'use client';

import { motion, useReducedMotion, type Variants } from 'motion/react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check, ChevronDown } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/ui/Container';
import { AmbientVideo } from '@/components/ui/AmbientVideo';
import { useLeadModal } from '@/components/lead/LeadModalContext';
import { BronzeButton } from '@/components/ui/BronzeButton';
import { cn } from '@/lib/utils';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;
const POINTS = ['p1', 'p2', 'p3', 'p4'] as const;

/** Outline CTA link styled to match BronzeButton's outline variant. */
const outlineLink =
  'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2.5 border border-sand-50/30 bg-ink-900/40 px-8 py-3 text-center text-[0.82rem] font-bold tracking-[0.12em] uppercase underline underline-offset-4 decoration-1 text-sand-50 transition-colors duration-300 select-none hover:border-bronze-400 hover:text-bronze-300';

/** One H1 line rising out of an overflow-hidden clip (the hero statement). */
function ClipLine({
  children,
  delay,
  reduce,
  className,
}: {
  children: React.ReactNode;
  delay: number;
  reduce: boolean;
  className?: string;
}) {
  return (
    <span className="block overflow-hidden pb-[0.06em] -mb-[0.06em]">
      <motion.span
        className={cn('block will-change-transform', className)}
        initial={reduce ? { opacity: 0 } : { y: '110%' }}
        animate={reduce ? { opacity: 1 } : { y: '0%' }}
        transition={{ duration: 0.9, ease: EASE_LUXE, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/**
 * Full-screen video hero, faithful to the original site: a workman painting a
 * facade behind a cool dark scrim, plain white bold headline in sentence case,
 * a vertical checklist with filled bronze check circles and a flat rectangular
 * bronze CTA. One statement animation (the two H1 lines rising).
 */
export function Hero() {
  const t = useTranslations('hero');
  const { open } = useLeadModal();
  const reduce = useReducedMotion() ?? false;

  const fade = (delay: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: EASE_LUXE, delay },
  });

  const list: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.09, delayChildren: 0.45 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_LUXE } },
  };

  return (
    <section className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-ink-950">
      {/* Background video + poster */}
      <AmbientVideo
        src="/videos/hero-home.mp4"
        poster="/images/hero-home.jpg"
        className="absolute inset-0"
      />

      {/* Cool slate scrim, like the original hero overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[#1d252d]/72"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/85 via-transparent to-ink-950/35"
      />

      <Container className="relative z-10 flex flex-1 flex-col justify-center pt-[calc(var(--header-h)+2.5rem)] pb-16 sm:pb-20">
        {/* H1 — two clipped lines rising; plain white bold, sentence case */}
        <h1 className="font-body text-5xl leading-[1.06] font-bold text-sand-50 sm:text-6xl lg:text-7xl">
          <ClipLine delay={0.12} reduce={reduce}>{t('title1')}</ClipLine>
          <ClipLine delay={0.25} reduce={reduce}>{t('title2')}</ClipLine>
        </h1>

        {/* Subtitle */}
        <motion.p
          className="mt-6 max-w-xl text-base leading-relaxed text-sand-100 sm:text-lg"
          {...fade(0.4)}
        >
          {t('subtitle')}
        </motion.p>

        {/* Checklist — vertical list, filled bronze circles (original style) */}
        <motion.ul
          className="mt-9 flex max-w-xl flex-col gap-4"
          variants={list}
          initial="hidden"
          animate="visible"
        >
          {POINTS.map((k) => (
            <motion.li key={k} variants={item} className="flex items-center gap-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bronze-500">
                <Check aria-hidden className="size-4 text-sand-50" strokeWidth={3} />
              </span>
              <span className="text-[0.95rem] leading-snug text-sand-50 sm:text-base">
                {t(`points.${k}`)}
              </span>
            </motion.li>
          ))}
        </motion.ul>

        {/* CTAs */}
        <motion.div
          className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4"
          {...fade(0.75)}
        >
          <BronzeButton onClick={() => open('consultation', 'hero')}>
            {t('ctaPrimary')}
          </BronzeButton>
          <Link href="/leistungen" className={outlineLink}>
            {t('ctaSecondary')}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </motion.div>
      </Container>

      {/* Scroll hint — hidden under reduced motion and on short screens */}
      {!reduce && (
        <div className="pointer-events-none absolute inset-x-0 bottom-5 z-10 hidden justify-center [@media(min-height:680px)]:flex">
          <motion.div
            className="flex flex-col items-center gap-2 text-sand-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: EASE_LUXE, delay: 1.4 }}
          >
            <span className="text-[0.65rem] font-medium tracking-[0.3em] uppercase">
              {t('scrollHint')}
            </span>
            <motion.span
              aria-hidden
              animate={{ y: [0, 7, 0] }}
              transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ChevronDown className="size-4 text-bronze-400" />
            </motion.span>
          </motion.div>
        </div>
      )}
    </section>
  );
}
