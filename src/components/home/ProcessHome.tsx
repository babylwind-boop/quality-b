import { getTranslations } from 'next-intl/server';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ProcessStory } from './ProcessStory';
import type { Locale } from '@/i18n/routing';

const STEP_KEYS = ['s1', 's2', 's3', 's4', 's5'] as const;

/**
 * Home process section as a scroll story: the 5 interactive steps drive a
 * sticky gold line-art scene in which the house is briefed, surveyed,
 * calculated, built and handed over. Sits on a concrete-work photograph
 * behind a heavy dark scrim (original image-backed section pattern).
 */
export async function ProcessHome({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'process' });

  const steps = STEP_KEYS.map((key) => ({
    title: t(`steps.${key}.title`),
    text: t(`steps.${key}.text`),
    hud: t(`hud.${key}`),
  }));

  return (
    <section className="relative isolate py-20 sm:py-24 lg:py-32">
      <Container>
        <SectionHeading align="start" eyebrow={t('eyebrow')} title={t('title')} />
      </Container>
      <ProcessStory steps={steps} />
    </section>
  );
}
