import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { OfferTabs, type OfferTab } from './OfferTabs';

/**
 * Server wrapper for the tabbed advantages block. Translates the
 * (non-client-whitelisted) `offerTabs` namespace and hands plain strings
 * to the interactive client component.
 */
export async function OfferTabsSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'offerTabs' });

  const tabs: OfferTab[] = [
    {
      key: 'construction',
      label: t('tabs.construction.label'),
      title: t('tabs.construction.title'),
      bullets: (['b1', 'b2', 'b3', 'b4'] as const).map((k) =>
        t(`tabs.construction.bullets.${k}`),
      ),
      cta: { label: t('tabs.construction.cta'), href: '/leistungen/hausbau' },
      image: '/images/service-hausbau.jpg',
      icon: 'construction',
    },
    {
      key: 'repair',
      label: t('tabs.repair.label'),
      title: t('tabs.repair.title'),
      bullets: (['b1', 'b2', 'b3'] as const).map((k) => t(`tabs.repair.bullets.${k}`)),
      cta: { label: t('tabs.repair.cta'), href: '/leistungen/innenrenovierung' },
      image: '/images/restaurierung-work.jpg',
      icon: 'repair',
    },
  ];

  return (
    <section className="relative isolate overflow-hidden py-20 lg:py-28">
      {/* ── Subtle tool-texture photo + strong scrim (edges blend into ink-900) ── */}
      <Image
        src="/images/innen-werkzeug.jpg"
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        className="-z-20 object-cover"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-ink-900/90" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-900 via-transparent to-ink-900"
      />

      <Container>
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} />
        <OfferTabs tabs={tabs} />
      </Container>
    </section>
  );
}
