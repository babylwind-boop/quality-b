import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { SERVICES } from '@/lib/services';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { ServicesCarousel, type ServiceCardData } from './ServicesCarousel';

/**
 * Services section, structured like the original homepage: an image-backed
 * dark section with the black service-card carousel (4-up on desktop).
 */
export async function ServicesStrip() {
  const t = await getTranslations('servicesStrip');

  // Card order mirrors the original homepage teaser (/1 … /5)
  const ORDER = [
    'hausbau',
    'restaurierung',
    'innenrenovierung',
    'fassadenarbeiten',
    'garten',
  ] as const;
  const byKey = new Map(SERVICES.map((s) => [s.key, s] as const));
  const items: ServiceCardData[] = ORDER.map((key) => ({
    key,
    href: byKey.get(key)!.href,
    title: t(`items.${key}.title`),
    description: t(`items.${key}.description`),
    readMore: t('readMore'),
  }));

  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      {/* Section background image + heavy dark overlay (original pattern) */}
      <Image
        src="/images/style-raffiniert.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div aria-hidden className="absolute inset-0 bg-ink-950/88" />

      <Container className="relative">
        <Reveal className="mb-10 sm:mb-12">
          <p className="mb-3 flex items-center gap-3 text-[0.8rem] font-medium tracking-[0.28em] uppercase text-bronze-500">
            <span aria-hidden className="h-px w-7 bg-bronze-500/60" />
            {t('eyebrow')}
          </p>
          <h2 className="font-display text-3xl leading-[1.15] font-semibold sm:text-4xl">
            {t('title')}
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <ServicesCarousel
            items={items}
            prevLabel={t('prev')}
            nextLabel={t('next')}
          />
        </Reveal>
      </Container>
    </section>
  );
}
