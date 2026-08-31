import Image from 'next/image';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Award, Leaf, Palette, Phone, type LucideIcon } from 'lucide-react';
import { routing, type Locale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';
import { Container } from '@/components/ui/Container';
import { Reveal, RevealItem } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { StatCounter } from '@/components/ui/StatCounter';
import { LeadCtaButton } from '@/components/lead/LeadCtaButton';
import { ContactCta } from '@/components/home/ContactCta';
import { CompanySeal } from '@/components/about/CompanySeal';

const STRENGTHS: { key: 's1' | 's2' | 's3'; Icon: LucideIcon }[] = [
  { key: 's1', Icon: Award },
  { key: 's2', Icon: Leaf },
  { key: 's3', Icon: Palette },
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
    path: '/ueber-uns',
    title: t('about.title'),
    description: t('about.description'),
  });
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'about' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  const legalRows = [
    { key: 'company', value: site.address.company },
    {
      key: 'address',
      value: `${site.address.street}, ${site.address.zip} ${site.address.city}, ${site.address.country}`,
    },
    { key: 'nip', value: site.nip, tnum: true },
    { key: 'regon', value: site.regon, tnum: true },
    { key: 'email', value: site.email, href: `mailto:${site.email}` },
  ] as const;

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
                { name: tNav('about'), path: '/ueber-uns' },
              ]}
            />
          </Reveal>
        </Container>
      </section>

      {/* Team intro — image collage + text (structure of the old Über-uns page) */}
      <section className="py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
            {/* Collage: main photo + overlapping detail + experience badge */}
            <Reveal className="relative mt-5 me-5 mb-10 sm:me-8 sm:mb-12">
              <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-ink-850">
                <Image
                  src="/images/about-team.jpg"
                  alt={t('hero.title')}
                  fill
                  sizes="(min-width:1024px) 45vw, 100vw"
                  className="object-cover"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-3 z-10 rounded-[2px] border border-bronze-400/70 sm:inset-4"
                />
              </div>

              <div className="absolute -end-5 -bottom-10 w-[46%] overflow-hidden rounded-sm border-4 border-ink-900 sm:-end-8 sm:-bottom-12">
                <div className="relative aspect-[4/3] bg-ink-850">
                  <Image
                    src="/images/site-team.jpg"
                    alt=""
                    fill
                    sizes="(min-width:1024px) 22vw, 46vw"
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="absolute -top-5 start-4 rounded-sm bg-bronze-500 px-5 py-3.5 text-ink-950">
                <span className="tnum block font-display text-3xl leading-none font-semibold">
                  {t('badge.value')}
                </span>
                <span className="mt-1 block text-[0.62rem] font-bold tracking-[0.2em] uppercase">
                  {t('badge.label')}
                </span>
              </div>
            </Reveal>

            {/* Content */}
            <Reveal delay={0.12}>
              <p className="mb-5 flex items-center gap-3 text-[0.8rem] font-medium tracking-[0.28em] uppercase text-bronze-500">
                <span aria-hidden className="h-px w-10 bg-bronze-500/60" />
                {t('intro.kicker')}
              </p>
              <h2 className="font-display text-3xl leading-[1.12] font-semibold sm:text-4xl">
                {t('intro.title')}
              </h2>
              <p className="mt-5 max-w-prose text-base leading-relaxed text-sand-300">
                {t('intro.text')}
              </p>
              <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
                <LeadCtaButton
                  type="consultation"
                  label={tNav('getConsultation')}
                  context="about"
                />
                <a
                  href={`tel:${site.phoneHref}`}
                  className="glass-soft flex min-h-12 items-center gap-3 rounded-sm py-2 ps-2.5 pe-5 transition-colors duration-300 hover:border-bronze-400/50"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bronze-500/15">
                    <Phone aria-hidden className="size-4 text-bronze-300" />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-[0.65rem] font-medium tracking-[0.24em] uppercase text-sand-400">
                      {tCommon('contactUs')}
                    </span>
                    <span className="tnum text-sm font-semibold text-sand-50">
                      {site.phones[0]}
                    </span>
                  </span>
                </a>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Strengths — numbered cards, as on the old site's "Unsere Stärken" */}
      <section className="pb-16 sm:pb-20 lg:pb-24">
        <Container>
          <SectionHeading title={t('strengths.title')} />
          <Reveal as="ul" stagger={0.1} className="grid gap-4 sm:gap-5 md:grid-cols-3 md:gap-6">
            {STRENGTHS.map(({ key, Icon }, i) => (
              <RevealItem key={key} as="li" className="group card-luxe rounded-sm p-7">
                <div className="flex items-start justify-between">
                  <span className="flex size-12 items-center justify-center rounded-sm bg-bronze-500/12 text-bronze-300 transition-colors duration-300 group-hover:bg-bronze-500/22">
                    <Icon aria-hidden className="size-6" />
                  </span>
                  <span
                    aria-hidden
                    className="font-display text-lg text-sand-600 transition-colors duration-300 group-hover:text-bronze-400"
                  >
                    /{i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-sand-50">
                  {t(`strengths.items.${key}.title`)}
                </h3>
                <span
                  aria-hidden
                  className="mt-3 block h-px w-10 bg-bronze-500/50 transition-all duration-300 group-hover:w-16 group-hover:bg-bronze-400"
                />
                <p className="mt-3 text-sm leading-relaxed text-sand-400">
                  {t(`strengths.items.${key}.text`)}
                </p>
              </RevealItem>
            ))}
          </Reveal>
        </Container>
      </section>

      {/* Numbers band */}
      <section className="hairline border-y bg-ink-950 py-16 sm:py-20">
        <Container>
          <SectionHeading title={t('numbers.title')} />
          <Reveal stagger={0.08} className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
            {(['s1', 's2', 's3', 's4'] as const).map((k) => (
              <RevealItem key={k} className="text-center">
                <StatCounter
                  value={t(`numbers.stats.${k}.value`)}
                  label={t(`numbers.stats.${k}.label`)}
                />
              </RevealItem>
            ))}
          </Reveal>
        </Container>
      </section>

      {/* Legal data + company seal */}
      <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24">
        {/* Faint blueprint backdrop behind the text column, blended into the page bg */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 start-0 w-full lg:w-[56%]"
        >
          <Image
            src="/images/blueprint.jpg"
            alt=""
            fill
            sizes="(min-width:1024px) 56vw, 100vw"
            className="object-cover opacity-[0.12]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-900 via-transparent to-ink-900" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-900 via-transparent to-ink-900" />
        </div>
        <Container className="relative">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <Reveal>
              <p className="mb-5 flex items-center gap-3 text-[0.8rem] font-medium tracking-[0.28em] uppercase text-bronze-500">
                <span aria-hidden className="h-px w-10 bg-bronze-500/60" />
                {t('legal.kicker')}
              </p>
              <h2 className="font-display text-3xl leading-[1.12] font-semibold sm:text-4xl">
                {t('legal.title')}
              </h2>
              <p className="mt-5 max-w-prose text-base leading-relaxed text-sand-300">
                {t('legal.text')}
              </p>
              <dl className="hairline mt-9 border-t">
                {legalRows.map((row) => (
                  <div
                    key={row.key}
                    className="hairline flex flex-col gap-1 border-b py-3.5 sm:flex-row sm:items-baseline sm:gap-6"
                  >
                    <dt className="w-32 shrink-0 text-[0.72rem] font-medium tracking-[0.2em] uppercase text-sand-500">
                      {t(`legal.rows.${row.key}`)}
                    </dt>
                    <dd className={'text-sm text-sand-100' + ('tnum' in row && row.tnum ? ' tnum' : '')}>
                      {'href' in row ? (
                        <a
                          href={row.href}
                          className="underline decoration-bronze-500/60 underline-offset-4 transition-colors hover:text-bronze-300"
                        >
                          {row.value}
                        </a>
                      ) : (
                        row.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
            <Reveal delay={0.12} className="flex justify-center lg:justify-end">
              <CompanySeal caption={t('legal.sealCaption')} />
            </Reveal>
          </div>
        </Container>
      </section>

      <ContactCta locale={locale as Locale} />
    </>
  );
}
