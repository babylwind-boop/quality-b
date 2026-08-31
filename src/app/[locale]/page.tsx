import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import { Hero } from '@/components/home/Hero';
import { ServicesStrip } from '@/components/home/ServicesStrip';
import { WhoWeAre } from '@/components/home/WhoWeAre';
import { QualityPromise } from '@/components/home/QualityPromise';
import { ProcessHome } from '@/components/home/ProcessHome';
import { OfferTabsSection } from '@/components/home/OfferTabsSection';
import { Offers } from '@/components/home/Offers';
import { ContactCta } from '@/components/home/ContactCta';

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({
    locale: locale as Locale,
    path: '/',
    title: t('home.title'),
    description: t('home.description'),
  });
}

export default async function HomePage({ params }: Props) {
  const { locale: rawLocale } = await params;
  setRequestLocale(rawLocale);
  const locale = rawLocale as Locale;

  return (
    <>
      {/* Section order mirrors the original site's homepage */}
      <Hero />
      <WhoWeAre />
      <QualityPromise locale={locale} />
      <ServicesStrip />
      <ProcessHome locale={locale} />
      <OfferTabsSection locale={locale} />
      <Offers />
      <ContactCta locale={locale} />
    </>
  );
}
