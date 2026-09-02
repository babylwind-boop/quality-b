import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { SkillGauges } from '@/components/ui/SkillGauges';
import { QualityMedia } from './QualityMedia';
import type { Locale } from '@/i18n/routing';

/**
 * Skill values mirror `quality.skills.*.value` in messages/de.json. next-intl
 * `t()` only returns strings here, so the numbers are kept in code — keep both
 * in sync if the copy ever changes.
 */
const SKILLS = [
  ['s1', 75],
  ['s2', 100],
  ['s3', 80],
  ['s4', 90],
] as const;

/**
 * Quality promise, structured like the original homepage: manifesto copy with
 * the interactive skill bars on the start side, the foreman photograph (taken
 * from the old site) with parallax on the end side. The section sits on a
 * blueprint photograph behind a dark scrim so it reads as imagery, not as
 * another flat grey band.
 */
export async function QualityPromise({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'quality' });

  const skills = SKILLS.map(([key, value]) => ({
    label: t(`skills.${key}.label`),
    value,
  }));

  return (
    <section className="relative isolate overflow-hidden py-20 sm:py-24 lg:py-28">
      {/* ── Blueprint background + scrim (edges blend into ink-900) ── */}
      <Image
        src="/images/blueprint.jpg"
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        className="-z-20 object-cover"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-ink-900/82" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-900 via-transparent to-ink-900"
      />

      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              align="start"
              eyebrow={t('eyebrow')}
              title={t('title')}
              className="mb-7 md:mb-8"
            />
            <Reveal delay={0.1} className="space-y-4">
              <p className="max-w-prose leading-relaxed text-sand-300">{t('p1')}</p>
              <p className="max-w-prose leading-relaxed text-sand-300">{t('p2')}</p>
            </Reveal>
            <Reveal delay={0.2} className="mt-9">
              <SkillGauges skills={skills} className="max-w-xl" />
            </Reveal>
          </div>

          <Reveal delay={0.15}>
            <QualityMedia />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
