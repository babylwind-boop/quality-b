import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { routing, type Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { pageMetadata } from '@/lib/seo';
import { Container } from '@/components/ui/Container';

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({
    locale: locale as Locale,
    path: '/datenschutz',
    title: t('datenschutz.title'),
    description: t('datenschutz.description'),
  });
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'datenschutz' });

  return (
    <>
      <section className="hairline relative overflow-hidden border-b bg-ink-950 pt-[calc(var(--header-h)+4rem)] pb-12 sm:pb-14">
        <Container className="relative">
          <div className="mx-auto max-w-3xl">
            <h1 className="font-display text-3xl leading-[1.1] font-semibold sm:text-4xl lg:text-5xl">
              {t('title')}
            </h1>
            <p className="mt-4 text-sm text-sand-500">{t('updated')}</p>
          </div>
        </Container>
      </section>

      <section className="py-14 sm:py-16">
        <Container>
          <div className="mx-auto max-w-3xl">
            {(['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10'] as const).map((k) => (
              <section key={k} className="mt-10 first:mt-0">
                <h2 className="font-display text-xl font-semibold text-sand-50 sm:text-2xl">
                  {t(`sections.${k}.title`)}
                </h2>
                <p className="mt-3 leading-relaxed text-sand-300">
                  {t(`sections.${k}.text`)}
                </p>
              </section>
            ))}

            <div className="hairline mt-14 border-t pt-8">
              <Link
                href="/"
                className="inline-flex min-h-11 items-center gap-2 font-medium text-bronze-300 transition-colors duration-300 hover:text-bronze-200"
              >
                <ArrowLeft aria-hidden className="size-4" />
                {t('backHome')}
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
