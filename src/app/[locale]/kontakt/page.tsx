import Image from 'next/image';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Clock, Mail, MapPin, Phone, type LucideIcon } from 'lucide-react';
import { routing, type Locale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';
import { Container } from '@/components/ui/Container';
import { Reveal, RevealItem } from '@/components/ui/Reveal';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { LeadForm } from '@/components/lead/LeadForm';

type CardKey = 'phone' | 'email' | 'address' | 'hours';

const CARDS: { key: CardKey; Icon: LucideIcon; lines: string[]; href?: string }[] = [
  {
    key: 'phone',
    Icon: Phone,
    lines: [site.phones[0]],
    href: `tel:${site.phoneHref}`,
  },
  {
    key: 'email',
    Icon: Mail,
    lines: [site.email],
    href: `mailto:${site.email}`,
  },
  {
    key: 'address',
    Icon: MapPin,
    lines: [
      site.address.company,
      site.address.street,
      `${site.address.zip} ${site.address.city}`,
    ],
  },
  { key: 'hours', Icon: Clock, lines: [site.hours] },
];

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({
    locale: locale as Locale,
    path: '/kontakt',
    title: t('kontakt.title'),
    description: t('kontakt.description'),
  });
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'kontakt' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  return (
    <>
      {/* Hero band */}
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
                { name: tNav('contact'), path: '/kontakt' },
              ]}
            />
          </Reveal>
        </Container>
      </section>

      {/* Contact cards */}
      <section className="py-16 sm:py-20">
        <Container>
          <Reveal as="ul" stagger={0.08} className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
            {CARDS.map(({ key, Icon, lines, href }) => {
              const inner = (
                <>
                  <span className="flex size-12 items-center justify-center rounded-sm bg-bronze-500/12 text-bronze-300">
                    <Icon aria-hidden className="size-6" />
                  </span>
                  <p className="mt-4 text-[0.8rem] font-medium tracking-[0.28em] uppercase text-bronze-500">
                    {t(`cards.${key}`)}
                  </p>
                  <div className="mt-2 space-y-0.5">
                    {lines.map((line) => (
                      <p key={line} className="text-sm leading-relaxed text-sand-100">
                        {line}
                      </p>
                    ))}
                  </div>
                </>
              );
              return (
                <RevealItem key={key} as="li" className="h-full">
                  {href ? (
                    <a
                      href={href}
                      className="card-luxe block h-full cursor-pointer rounded-sm p-6 transition-colors duration-300 hover:border-bronze-500/40"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div className="card-luxe h-full rounded-sm p-6">{inner}</div>
                  )}
                </RevealItem>
              );
            })}
          </Reveal>
        </Container>
      </section>

      {/* Form + visual column */}
      <section className="pb-20 sm:pb-24 lg:pb-28">
        <Container>
          <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-10">
            <Reveal className="card-luxe rounded-sm p-6 sm:p-8">
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">
                {t('form.title')}
              </h2>
              <LeadForm type="contact" className="mt-6" />
            </Reveal>
            <Reveal delay={0.12} className="space-y-6">
              <div className="relative overflow-hidden rounded-sm">
                <div className="relative aspect-[4/3]">
                  <Image
                    src="/images/engineer-plan.jpg"
                    alt={site.brandLine}
                    fill
                    sizes="(min-width:1024px) 45vw, 100vw"
                    className="object-cover"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-ink-950/50 to-transparent"
                  />
                </div>
              </div>
              <div className="card-luxe rounded-sm p-6 sm:p-7">
                <ul className="space-y-5">
                  <li className="flex gap-4">
                    <MapPin aria-hidden className="mt-0.5 size-5 shrink-0 text-bronze-400" />
                    <div>
                      <p className="text-[0.8rem] font-medium tracking-[0.28em] uppercase text-bronze-500">
                        {t('cards.address')}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-sand-300">
                        {site.address.company}, {site.address.street},{' '}
                        {site.address.zip} {site.address.city}
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <Clock aria-hidden className="mt-0.5 size-5 shrink-0 text-bronze-400" />
                    <div>
                      <p className="text-[0.8rem] font-medium tracking-[0.28em] uppercase text-bronze-500">
                        {t('cards.hours')}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-sand-300">
                        {site.hours}
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
