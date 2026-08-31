import Image from 'next/image';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ArrowUpRight } from 'lucide-react';
import { routing, type Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { pageMetadata } from '@/lib/seo';
import { SERVICES, type ServiceKey } from '@/lib/services';
import { cn } from '@/lib/utils';
import { Container } from '@/components/ui/Container';
import { Reveal, RevealItem } from '@/components/ui/Reveal';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ContactCta } from '@/components/home/ContactCta';

const SERVICE_IMAGES: Record<ServiceKey, string> = {
  hausbau: '/images/service-hausbau.jpg',
  fassadenarbeiten: '/images/service-fassade-2.jpg',
  innenrenovierung: '/images/service-innen.jpg',
  restaurierung: '/images/service-restaurierung.jpg',
  garten: '/images/service-garten.jpg',
};

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({
    locale: locale as Locale,
    path: '/leistungen',
    title: t('services.title'),
    description: t('services.description'),
  });
}

export default async function ServicesHubPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'servicesHub' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  return (
    <>
      {/* Hero band — no media, flat ink-950 */}
      <section className="hairline relative overflow-hidden border-b bg-ink-950 pt-[calc(var(--header-h)+4rem)] pb-14 sm:pb-16 lg:pt-[calc(var(--header-h)+5.5rem)] lg:pb-20">
        <Container className="relative">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="mb-4 flex items-center justify-center gap-3 text-[0.8rem] font-medium tracking-[0.28em] uppercase text-bronze-500">
              <span aria-hidden className="h-px w-7 bg-bronze-500/60" />
              {t('hero.kicker')}
              <span aria-hidden className="h-px w-7 bg-bronze-500/60" />
            </p>
            <h1 className="font-display text-4xl leading-[1.05] font-semibold sm:text-5xl lg:text-7xl">
              <span className="text-bronze-sheen">{t('hero.title')}</span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-sand-300 sm:text-lg">
              {t('hero.subtitle')}
            </p>
          </Reveal>
          <Reveal delay={0.15} className="mt-8 flex justify-center">
            <Breadcrumbs
              locale={locale as Locale}
              items={[
                { name: tNav('breadcrumbHome'), path: '/' },
                { name: tNav('services'), path: '/leistungen' },
              ]}
            />
          </Reveal>
        </Container>
      </section>

      {/* Service tiles — bento: first tile spans 2 cols on lg */}
      <section className="py-16 sm:py-20 lg:py-24">
        <Container>
          <Reveal as="ul" stagger={0.1} className="grid gap-4 sm:gap-5 lg:grid-cols-2 lg:gap-6">
            {SERVICES.map(({ key, href }, i) => (
              <RevealItem key={key} as="li" className={cn(i === 0 && 'lg:col-span-2')}>
                <Link
                  href={href}
                  className={cn(
                    'group relative block overflow-hidden rounded-sm',
                    i === 0
                      ? 'aspect-[16/10] sm:aspect-[21/10]'
                      : 'aspect-[16/10] sm:aspect-[4/3]',
                  )}
                >
                  <Image
                    src={SERVICE_IMAGES[key]}
                    alt=""
                    fill
                    priority={i === 0}
                    sizes={
                      i === 0
                        ? '(min-width:1280px) 1216px, 100vw'
                        : '(min-width:1024px) 45vw, 100vw'
                    }
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/25 to-ink-950/5"
                  />
                  <div className="absolute inset-x-3 bottom-3 sm:inset-x-4 sm:bottom-4">
                    <div className="glass flex items-center justify-between gap-4 rounded-sm p-4 sm:p-5">
                      <div className="min-w-0">
                        <h2 className="font-display text-lg leading-tight font-semibold text-sand-50 sm:text-xl">
                          {t(`items.${key}.title`)}
                        </h2>
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-sand-300">
                          {t(`items.${key}.description`)}
                        </p>
                      </div>
                      <span
                        aria-hidden
                        className="flex size-11 shrink-0 items-center justify-center rounded-full border border-bronze-500/40 text-bronze-300 transition-colors duration-300 group-hover:bg-bronze-500 group-hover:text-ink-950"
                      >
                        <ArrowUpRight className="size-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </RevealItem>
            ))}
          </Reveal>
        </Container>
      </section>

      <ContactCta locale={locale as Locale} />
    </>
  );
}
