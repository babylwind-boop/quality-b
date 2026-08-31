'use client';

import { Fragment, useRef } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from 'motion/react';
import { ArrowRight, Phone } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/ui/Container';
import { site } from '@/lib/site';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;

/** Solid CTA link styled to match BronzeButton's flat rectangular solid variant (keeps <a> semantics). */
const solidLink =
  'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2.5 bg-bronze-500 px-8 py-3 text-center text-[0.82rem] font-bold tracking-[0.12em] uppercase underline underline-offset-4 decoration-1 text-ink-950 transition-colors duration-300 select-none hover:bg-bronze-400';

/**
 * "Who we are" — the attention-focus scroll section. Media column is
 * scroll-driven (parallax + settle-scale + drawing hairline frame); the
 * content's focus moment is the word-staggered H2. Reduced motion:
 * transforms off, plain opacity reveals.
 */
export function WhoWeAre() {
  const t = useTranslations('whoWeAre');
  const reduce = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ['-4%', '4%']);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.08, 1]);

  const words = t('title').split(' ');

  const titleStagger: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.045, delayChildren: 0.1 } },
  };
  const word: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 1, y: '110%' },
    visible: { opacity: 1, y: '0%', transition: { duration: 0.7, ease: EASE_LUXE } },
  };
  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.4 } as const,
    transition: { duration: 0.8, ease: EASE_LUXE, delay },
  });

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-ink-900 py-20 sm:py-28">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Media */}
          <div className="relative">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-ink-850">
              {/* Oversized so parallax + settle-scale never expose edges */}
              <motion.div
                className="absolute -inset-[6%] will-change-transform"
                style={reduce ? undefined : { y: imageY, scale: imageScale }}
              >
                <Image
                  src="/images/engineer-plan.jpg"
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 44vw, (min-width: 640px) 84vw, 100vw"
                  className="object-cover"
                />
              </motion.div>

              {/* Inset bronze hairline frame, always exactly matching the box */}
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-3 z-10 rounded-[2px] border border-bronze-400/70 sm:inset-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.9, ease: EASE_LUXE, delay: 0.2 }}
              />
            </div>
          </div>

          {/* Content */}
          <div>
            {/* Kicker */}
            <motion.p
              className="mb-5 flex items-center gap-3 text-[0.8rem] font-medium tracking-[0.28em] uppercase text-bronze-500"
              {...fadeUp(0)}
            >
              <span aria-hidden className="h-px w-10 bg-bronze-500/60" />
              {t('kicker')}
            </motion.p>

            {/* H2 — the focus moment: words stagger-rise from clips */}
            <motion.h2
              className="font-display text-[1.65rem] leading-[1.15] font-semibold text-sand-50 sm:text-3xl lg:text-4xl"
              variants={titleStagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
            >
              {words.map((w, i) => (
                <Fragment key={`${w}-${i}`}>
                  <span className="inline-block overflow-hidden pb-[0.1em] -mb-[0.1em] align-bottom">
                    <motion.span className="inline-block will-change-transform" variants={word}>
                      {w}
                    </motion.span>
                  </span>
                  {i < words.length - 1 ? ' ' : null}
                </Fragment>
              ))}
            </motion.h2>

            {/* Paragraph fades up after the words */}
            <motion.p
              className="mt-6 max-w-prose text-base leading-relaxed text-sand-400 sm:text-lg"
              {...fadeUp(0.55)}
            >
              {t('text')}
            </motion.p>

            {/* CTA + phone chip */}
            <motion.div
              className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5"
              {...fadeUp(0.75)}
            >
              <Link href="/ueber-uns" className={solidLink}>
                {t('cta')}
                <ArrowRight aria-hidden className="size-4" />
              </Link>

              <a
                href={`tel:${site.phoneHref}`}
                className="glass-soft flex min-h-12 items-center gap-3 rounded-sm py-2 ps-2.5 pe-5 transition-colors duration-300 hover:border-bronze-400/50"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bronze-500/15">
                  <Phone aria-hidden className="size-4 text-bronze-300" />
                </span>
                <span className="flex flex-col">
                  <span className="text-[0.65rem] font-medium tracking-[0.24em] uppercase text-sand-400">
                    {t('callLabel')}
                  </span>
                  <span className="tnum text-sm font-semibold text-sand-50">{site.phones[0]}</span>
                </span>
              </a>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}
