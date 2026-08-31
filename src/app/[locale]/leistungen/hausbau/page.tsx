import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import { HOUSE_STYLES } from '@/lib/services';
import { STROKE_ICONS } from '@/lib/icon-strokes';
import { JsonLd, serviceJsonLd } from '@/components/seo/JsonLd';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal, RevealItem } from '@/components/ui/Reveal';
import { SkillBars } from '@/components/ui/SkillBars';
import { StatCounter } from '@/components/ui/StatCounter';
import { DrawIcon } from '@/components/ui/DrawIcon';
import { IllustratedSteps } from '@/components/ui/IllustratedSteps';
import { ServiceHero } from '@/components/services/ServiceHero';
import { OtherServices } from '@/components/services/OtherServices';
import { ContactCta } from '@/components/home/ContactCta';
import { LeadCtaButton } from '@/components/services/hausbau/LeadCtaButton';
import { StylesExplorer } from '@/components/services/hausbau/StylesExplorer';
import { HouseRise } from '@/components/services/hausbau/HouseRise';
import { HausKonfigurator } from '@/components/services/hausbau/HausKonfigurator';

const PATH = '/leistungen/hausbau';
const HERO_IMAGE = '/images/service-hausbau.jpg';

const SKILL_KEYS = ['s1', 's2', 's3', 's4'] as const;
const SKILL_VALUES = [100, 90, 80, 77] as const;
const REASON_KEYS = ['r1', 'r2', 'r3', 'r4'] as const;
const REASON_ICONS = [
  STROKE_ICONS.keyHandover,
  STROKE_ICONS.shieldCheck,
  STROKE_ICONS.gear,
  STROKE_ICONS.coins,
] as const;
const STEP_KEYS = ['s1', 's2', 's3', 's4'] as const;
const STEP_ICONS = [
  STROKE_ICONS.chat,
  STROKE_ICONS.draft,
  STROKE_ICONS.crane,
  STROKE_ICONS.keyHandover,
] as const;

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
    title: t('hausbau.title'),
    description: t('hausbau.description'),
    image: HERO_IMAGE,
  });
}

export default async function HausbauPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  setRequestLocale(rawLocale);
  const locale = rawLocale as Locale;

  const [t, tService, tMeta, tNav, tForm, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: 'hausbau' }),
    getTranslations({ locale, namespace: 'servicePage' }),
    getTranslations({ locale, namespace: 'meta' }),
    getTranslations({ locale, namespace: 'nav' }),
    getTranslations({ locale, namespace: 'contactPopup' }),
    getTranslations({ locale, namespace: 'common' }),
  ]);

  const breadcrumbs = [
    { name: tNav('breadcrumbHome'), path: '/' },
    { name: tNav('services'), path: '/leistungen' },
    { name: t('hero.title'), path: PATH },
  ];

  const skills = SKILL_KEYS.map((k, i) => ({
    label: t(`approach.skills.${k}.label`),
    value: SKILL_VALUES[i],
  }));

  const styles = HOUSE_STYLES.map((key) => ({
    key,
    title: t(`styles.items.${key}.title`),
    text: t(`styles.items.${key}.text`),
    image: `/images/style-${key}.jpg`,
  }));

  const steps = STEP_KEYS.map((k, i) => ({
    title: t(`steps.items.${k}.title`),
    text: t(`steps.items.${k}.text`),
    icon: STEP_ICONS[i],
  }));

  const phaseLabels: [string, string, string, string] = [
    t('build.phases.p1'),
    t('build.phases.p2'),
    t('build.phases.p3'),
    t('build.phases.p4'),
  ];

  return (
    <>
      <JsonLd
        data={serviceJsonLd(locale, {
          path: PATH,
          name: tMeta('hausbau.title'),
          description: tMeta('hausbau.description'),
          image: HERO_IMAGE,
        })}
      />

      <ServiceHero
        kicker={t('hero.kicker')}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
        media={{ video: '/videos/hausbau.mp4', image: HERO_IMAGE }}
        locale={locale}
        breadcrumbs={breadcrumbs}
      />

      {/* 2 — Approach: manifesto + skills | animated house line-art */}
      <section className="py-20 md:py-28">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <SectionHeading
                align="start"
                eyebrow={tService('ourApproach')}
                title={t('approach.title')}
                className="mb-6 md:mb-8"
              />
              <Reveal delay={0.08}>
                <p className="max-w-2xl leading-relaxed text-sand-400">
                  {t('approach.text')}
                </p>
                <SkillBars skills={skills} className="mt-10 max-w-xl" />
                <div className="mt-10">
                  <LeadCtaButton
                    label={tService('requestCta')}
                    type="consultation"
                    context={tNav('serviceItems.hausbau')}
                  />
                </div>
              </Reveal>
            </div>
            <Reveal delay={0.14} className="card-luxe rounded-sm p-4 sm:p-6">
              <HouseRise phaseLabels={phaseLabels} className="w-full" />
            </Reveal>
          </div>
        </Container>
      </section>

      {/* 3 — Reasons with drawing icons */}
      <section className="hairline border-y bg-ink-950 py-20 md:py-28">
        <Container>
          <SectionHeading title={t('reasons.title')} subtitle={t('reasons.subtitle')} />
          <Reveal stagger={0.09} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {REASON_KEYS.map((key, i) => (
              <RevealItem key={key} className="group card-luxe rounded-sm p-6 sm:p-7">
                <div className="flex items-start justify-between">
                  <span className="inline-flex size-14 items-center justify-center rounded-sm border border-bronze-500/25 bg-bronze-500/10 text-bronze-300 transition-colors duration-500 group-hover:bg-bronze-500/20">
                    <DrawIcon icon={REASON_ICONS[i]} delay={i * 0.12} className="size-8" />
                  </span>
                  <span
                    aria-hidden
                    className="font-display text-lg text-sand-600 transition-colors duration-500 group-hover:text-bronze-400"
                  >
                    /{i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold">
                  {t(`reasons.items.${key}.title`)}
                </h3>
                <span
                  aria-hidden
                  className="mt-3 block h-px w-10 bg-bronze-500/50 transition-all duration-500 group-hover:w-16 group-hover:bg-bronze-400"
                />
                <p className="mt-3 text-sm leading-relaxed text-sand-400">
                  {t(`reasons.items.${key}.text`)}
                </p>
              </RevealItem>
            ))}
          </Reveal>
        </Container>
      </section>

      {/* 4 — House styles explorer */}
      <section className="py-20 md:py-28">
        <Container>
          <SectionHeading title={t('styles.title')} subtitle={t('styles.subtitle')} />
          <StylesExplorer styles={styles} />
        </Container>
      </section>

      {/* 5 — Configurator: plan your house in 60 seconds */}
      <section className="hairline border-y bg-ink-950 py-20 md:py-28">
        <Container>
          <SectionHeading
            eyebrow={t('konfigurator.kicker')}
            title={t('konfigurator.title')}
            subtitle={t('konfigurator.subtitle')}
          />
          <Reveal className="mx-auto max-w-3xl">
            <HausKonfigurator
              styles={HOUSE_STYLES.map((key) => ({
                key,
                label: t(`styles.items.${key}.title`),
              }))}
              copy={{
                stepLabels: [
                  t('konfigurator.steps.s1'),
                  t('konfigurator.steps.s2'),
                  t('konfigurator.steps.s3'),
                ],
                styleTitle: t('konfigurator.styleTitle'),
                areaTitle: t('konfigurator.areaTitle'),
                areaUnit: t('konfigurator.areaUnit'),
                contactTitle: t('konfigurator.contactTitle'),
                name: tForm('form.name'),
                namePlaceholder: tForm('form.namePlaceholder'),
                phone: tForm('form.phone'),
                phonePlaceholder: tForm('form.phonePlaceholder'),
                back: t('konfigurator.back'),
                next: t('konfigurator.next'),
                submit: tForm('form.submit'),
                submitting: tForm('form.submitting'),
                successTitle: tForm('form.successTitle'),
                successText: tForm('form.successMessage'),
                errorText: tCommon('error'),
                privacyNote: t('konfigurator.privacyNote'),
                privacyLinkLabel: t('konfigurator.privacyLink'),
                summaryTitle: t('konfigurator.summaryTitle'),
              }}
            />
          </Reveal>
        </Container>
      </section>

      {/* 6 — Cooperation steps with pictograms */}
      <section className="py-20 md:py-28">
        <Container>
          <SectionHeading title={t('steps.title')} />
          <IllustratedSteps steps={steps} className="mx-auto max-w-3xl" />
        </Container>
      </section>

      {/* 7 — Numbers band */}
      <section className="hairline border-t bg-ink-950 py-16 sm:py-20">
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

      <OtherServices locale={locale} currentKey="hausbau" />
      <ContactCta locale={locale} />
    </>
  );
}
