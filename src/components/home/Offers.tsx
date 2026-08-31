'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { StatCounter } from '@/components/ui/StatCounter';
import { LeadCtaButton } from '@/components/lead/LeadCtaButton';
import type { LeadType } from '@/components/lead/LeadModalContext';

const EASE = [0.22, 1, 0.36, 1] as const;
const STAT_KEYS = ['s1', 's2', 's3', 's4'] as const;

/* Gold line-art icons in the site's drawing language, drawn in on scroll. */
const CARD_ICONS: Record<'consultation' | 'visit', string[]> = {
  consultation: [
    'M8 10 h32 v22 h-18 l-8 8 v-8 h-6 Z', // speech bubble
    'M16 19 h16 M16 25 h10', // conversation lines
    'M35 38 a6 6 0 1 1 -0.1 0', // small seal
    'M32.6 41 l1.8 2 l3.4 -4', // check in seal
  ],
  visit: [
    'M24 6 a12 12 0 0 1 12 12 c0 8 -12 22 -12 22 s-12 -14 -12 -22 a12 12 0 0 1 12 -12 Z', // pin
    'M18 20 L24 15 L30 20', // roof inside pin
    'M20 20 v6 h8 v-6', // house body inside pin
    'M12 42 h24', // ground line
  ],
};

function CardIcon({ kind }: { kind: 'consultation' | 'visit' }) {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 48 48" className="size-14 sm:size-16" aria-hidden>
      {CARD_ICONS[kind].map((d, i) => (
        <motion.path
          key={d}
          d={d}
          fill="none"
          stroke="#bc9d68"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={
            reduce ? { duration: 0 } : { duration: 0.8, delay: 0.2 + i * 0.15, ease: EASE }
          }
        />
      ))}
    </svg>
  );
}

function SplitOfferCard({
  image,
  kicker,
  title,
  text,
  bullets,
  ctaLabel,
  leadType,
  icon,
  mirrored = false,
}: {
  image: string;
  kicker: string;
  title: string;
  text: string;
  bullets: string[];
  ctaLabel: string;
  leadType: LeadType;
  icon: 'consultation' | 'visit';
  mirrored?: boolean;
}) {
  const reduce = useReducedMotion();

  const list = {
    hidden: {},
    visible: { transition: { staggerChildren: reduce ? 0 : 0.1 } },
  };
  const item = {
    hidden: { opacity: 0, x: reduce ? 0 : -16 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: EASE } },
  };

  return (
    <Reveal>
      <article className="card-luxe group grid overflow-hidden rounded-sm lg:grid-cols-2">
        <div
          className={cn(
            'relative aspect-[4/3] overflow-hidden lg:aspect-auto lg:h-full',
            mirrored && 'lg:order-last',
          )}
        >
          <Image
            src={image}
            alt={title}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-luxe)] group-hover:scale-[1.04]"
          />
          {/* Soft blend toward the text side on wide screens */}
          <div
            aria-hidden
            className={cn(
              'absolute inset-0 hidden from-transparent via-transparent to-ink-900/35 lg:block',
              mirrored ? 'bg-gradient-to-l' : 'bg-gradient-to-r',
            )}
          />
          {/* Inset bronze hairline frame (site pattern) */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-3 rounded-[2px] border border-bronze-400/50"
          />
        </div>

        <div className="flex flex-col justify-center gap-5 p-7 sm:p-10 xl:p-14">
          <CardIcon kind={icon} />
          <p className="flex items-center gap-3 text-[0.8rem] font-medium tracking-[0.28em] uppercase text-bronze-500">
            <span aria-hidden className="h-px w-7 bg-bronze-500/60" />
            {kicker}
          </p>
          <h3 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h3>
          <p className="max-w-prose leading-relaxed text-sand-400">{text}</p>

          <motion.ul
            className="space-y-3.5"
            variants={list}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
          >
            {bullets.map((bullet) => (
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

          <div className="mt-3">
            <LeadCtaButton type={leadType} context="offers" label={ctaLabel} />
          </div>
        </div>
      </article>
    </Reveal>
  );
}

/**
 * Restructured offers block: free-consultation split card, a full-width
 * animated stats band (photo behind a heavy ink-950 scrim), then the
 * mirrored on-site-visit split card. No Visualisierung card by client request.
 */
export function Offers() {
  const t = useTranslations('offers');
  const reduce = useReducedMotion();

  const statsList = {
    hidden: {},
    visible: { transition: { staggerChildren: reduce ? 0 : 0.12 } },
  };
  const statsItem = {
    hidden: { opacity: 0, y: reduce ? 0 : 26 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
  };

  return (
    <section className="py-4 lg:py-8">
      {/* (a) Consultation card */}
      <Container>
        <SplitOfferCard
          image="/images/consult-expert.jpg"
          kicker={t('consultation.kicker')}
          title={t('consultation.title')}
          text={t('consultation.text')}
          bullets={(['b1', 'b2', 'b3'] as const).map((k) => t(`consultation.bullets.${k}`))}
          ctaLabel={t('consultation.cta')}
          leadType="consultation"
          icon="consultation"
        />
      </Container>

      {/* (b) Mid block: full-width stats band on a photo behind a heavy scrim */}
      <div className="relative isolate my-16 overflow-hidden bg-ink-950 py-16 sm:py-20 lg:my-24">
        <Image
          src="/images/about-house.jpg"
          alt=""
          aria-hidden
          fill
          sizes="100vw"
          className="-z-20 object-cover"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-ink-950/85" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-900 via-transparent to-ink-900"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-bronze-500/40 to-transparent"
        />
        <Container className="relative">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="mb-4 flex items-center justify-center gap-3 text-[0.8rem] font-medium tracking-[0.28em] uppercase text-bronze-500">
              <span aria-hidden className="h-px w-7 bg-bronze-500/60" />
              {t('midBlock.eyebrow')}
              <span aria-hidden className="h-px w-7 bg-bronze-500/60" />
            </p>
            <h3 className="font-display text-2xl font-semibold sm:text-3xl md:text-4xl">
              {t('midBlock.title')}
            </h3>
            <p className="mt-5 leading-relaxed text-sand-400">{t('midBlock.text')}</p>
          </Reveal>

          <motion.div
            className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4"
            variants={statsList}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.35 }}
          >
            {STAT_KEYS.map((k) => (
              <motion.div key={k} variants={statsItem} className="group">
                <StatCounter
                  value={t(`midBlock.stats.${k}.value`)}
                  label={t(`midBlock.stats.${k}.label`)}
                />
                {/* Animated bronze underline per stat */}
                <motion.span
                  aria-hidden
                  className="mt-4 block h-px w-16 origin-left bg-bronze-500/70 transition-colors duration-300 group-hover:bg-bronze-400"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.9, delay: 0.35, ease: EASE }}
                />
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </div>

      {/* (c) Visit card, mirrored */}
      <Container>
        <SplitOfferCard
          image="/images/site-team.jpg"
          kicker={t('visit.kicker')}
          title={t('visit.title')}
          text={t('visit.text')}
          bullets={(['b1', 'b2', 'b3'] as const).map((k) => t(`visit.bullets.${k}`))}
          ctaLabel={t('visit.cta')}
          leadType="visit"
          icon="visit"
          mirrored
        />
      </Container>
    </section>
  );
}
