import Image from 'next/image';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import { STROKE_ICONS } from '@/lib/icon-strokes';
import { JsonLd, serviceJsonLd } from '@/components/seo/JsonLd';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal, RevealItem } from '@/components/ui/Reveal';
import { DrawIcon } from '@/components/ui/DrawIcon';
import { IllustratedSteps } from '@/components/ui/IllustratedSteps';
import { ServiceHero } from '@/components/services/ServiceHero';
import { OtherServices } from '@/components/services/OtherServices';
import { ContactCta } from '@/components/home/ContactCta';
import { LeadCtaButton } from '@/components/lead/LeadCtaButton';
import { BuildingProblems } from '@/components/services/restaurierung/BuildingProblems';

const PATH = '/leistungen/kernsanierung';
const HERO_IMAGE = '/images/service-restaurierung.jpg';

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({
    locale: locale as Locale,
    path: PATH,
    title: t('restaurierung.title'),
    description: t('restaurierung.description'),
    image: HERO_IMAGE,
  });
}

const APPROACH_ICONS = [
  STROKE_ICONS.helmet,
  STROKE_ICONS.magnifier,
  STROKE_ICONS.materials,
  STROKE_ICONS.gear,
] as const;

const BENEFIT_ICONS = [
  STROKE_ICONS.bulb,
  STROKE_ICONS.layers,
  STROKE_ICONS.checkSeal,
  STROKE_ICONS.coins,
  STROKE_ICONS.shieldCheck,
  STROKE_ICONS.frames,
] as const;

export default async function RestaurierungPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  setRequestLocale(rawLocale);
  const locale = rawLocale as Locale;

  const t = await getTranslations({ locale, namespace: 'restaurierung' });
  const tService = await getTranslations({ locale, namespace: 'servicePage' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });
  const tMeta = await getTranslations({ locale, namespace: 'meta' });

  const breadcrumbs = [
    { name: tNav('breadcrumbHome'), path: '/' },
    { name: tNav('services'), path: '/leistungen' },
    { name: tNav('serviceItems.restaurierung'), path: PATH },
  ];

  const problems = (['p1', 'p2', 'p3', 'p4'] as const).map((k) => ({
    title: t(`problems.items.${k}.title`),
    text: t(`problems.items.${k}.text`),
  }));

  const approachSteps = (['a1', 'a2', 'a3', 'a4'] as const).map((k, i) => ({
    title: t(`approach.items.${k}.title`),
    text: t(`approach.items.${k}.text`),
    icon: APPROACH_ICONS[i],
  }));

  const benefits = (['b1', 'b2', 'b3', 'b4', 'b5', 'b6'] as const).map((k, i) => ({
    key: k,
    icon: BENEFIT_ICONS[i],
    title: t(`benefits.items.${k}.title`),
    text: t(`benefits.items.${k}.text`),
  }));

  return (
    <>
      <JsonLd
        data={serviceJsonLd(locale, {
          path: PATH,
          name: t('hero.title'),
          description: tMeta('restaurierung.description'),
          image: HERO_IMAGE,
        })}
      />

      <ServiceHero
        kicker={t('hero.kicker')}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
        media={{ image: HERO_IMAGE }}
        locale={locale}
        breadcrumbs={breadcrumbs}
      />

      {/* 2 — Intro Q&A: definition + the free photo-assessment offer */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="grid items-start gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <SectionHeading
                eyebrow={t('intro.kicker')}
                title={t('intro.title')}
                align="start"
                className="mb-8 md:mb-10"
              />
              <Reveal>
                <p className="max-w-prose leading-relaxed text-sand-300">
                  {t('intro.p1')}
                </p>
              </Reveal>
              <Reveal delay={0.12} className="card-luxe mt-9 rounded-sm p-7 sm:p-9">
                <h3 className="font-display text-xl leading-snug font-semibold text-bronze-300 sm:text-2xl">
                  {t('intro.question')}
                </h3>
                <p className="mt-5 leading-relaxed text-sand-300">{t('intro.p2')}</p>
                <p className="mt-4 leading-relaxed text-sand-300">{t('intro.p3')}</p>
                <div className="mt-8">
                  <LeadCtaButton
                    type="consultation"
                    context={tNav('serviceItems.restaurierung')}
                    label={tService('requestCta')}
                  />
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.1} className="relative md:pb-14">
              <div className="relative aspect-[4/5] overflow-hidden rounded-sm border border-bronze-500/15">
                <Image
                  src="/images/restaurierung-alt.jpg"
                  alt={t('hero.title')}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 45vw, 100vw"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-ink-950/45 via-transparent to-transparent"
                />
              </div>
              <div className="absolute -bottom-4 -start-3 hidden w-60 overflow-hidden rounded-sm border border-bronze-500/25 md:block lg:-start-8">
                <div className="relative aspect-[4/3]">
                  <Image
                    src="/images/restaurierung-innen.jpg"
                    alt={t('intro.title')}
                    fill
                    className="object-cover"
                    sizes="240px"
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* 3 — Typical problems: interactive building diagram */}
      <section className="hairline border-y bg-ink-950 py-20 sm:py-28">
        <Container>
          <SectionHeading title={t('problems.title')} subtitle={t('problems.hint')} />
          <BuildingProblems items={problems} />
        </Container>
      </section>

      {/* 4 — Our approach: illustrated timeline */}
      <section className="py-20 sm:py-28">
        <Container>
          <SectionHeading title={t('approach.title')} />
          <IllustratedSteps steps={approachSteps} className="mx-auto max-w-3xl" />
        </Container>
      </section>

      {/* 5 — Why band */}
      <section className="relative overflow-hidden bg-ink-950 py-24 sm:py-32">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <Image
            src="/images/restaurierung-klassik.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-[0.14]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-900 via-transparent to-ink-900" />
        </div>
        <Container className="relative">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl leading-tight font-semibold sm:text-4xl">
              <span className="text-bronze-sheen">{t('why.title')}</span>
            </h2>
            <p className="mt-6 leading-relaxed text-sand-300">{t('why.text')}</p>
            <div className="mt-9 flex justify-center">
              <LeadCtaButton
                type="consultation"
                context={tNav('serviceItems.restaurierung')}
                label={t('why.cta')}
              />
            </div>
          </Reveal>
        </Container>
      </section>

      {/* 6 — What professional restoration delivers */}
      <section className="py-20 sm:py-28">
        <Container>
          <SectionHeading title={t('benefits.title')} />
          <Reveal stagger={0.08} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map(({ key, icon, title, text }, i) => (
              <RevealItem key={key} className="group card-luxe rounded-sm p-7">
                <div className="flex items-start justify-between">
                  <span className="flex size-14 items-center justify-center rounded-sm border border-bronze-500/25 bg-bronze-500/10 text-bronze-300 transition-colors duration-500 group-hover:bg-bronze-500/20">
                    <DrawIcon icon={icon} delay={(i % 3) * 0.12} className="size-8" />
                  </span>
                  <span
                    aria-hidden
                    className="font-display text-lg text-sand-600 transition-colors duration-500 group-hover:text-bronze-400"
                  >
                    /{i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-sand-50">
                  {title}
                </h3>
                <span
                  aria-hidden
                  className="mt-3 block h-px w-10 bg-bronze-500/50 transition-all duration-500 group-hover:w-16 group-hover:bg-bronze-400"
                />
                <p className="mt-3 leading-relaxed text-sand-400">{text}</p>
              </RevealItem>
            ))}
          </Reveal>
        </Container>
      </section>

      <OtherServices locale={locale} currentKey="restaurierung" />
      <ContactCta locale={locale} />
    </>
  );
}
