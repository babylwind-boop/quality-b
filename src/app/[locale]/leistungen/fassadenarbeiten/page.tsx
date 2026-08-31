import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import { STROKE_ICONS } from '@/lib/icon-strokes';
import { JsonLd, serviceJsonLd } from '@/components/seo/JsonLd';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { SkillBars } from '@/components/ui/SkillBars';
import { IllustratedSteps } from '@/components/ui/IllustratedSteps';
import { ServiceHero } from '@/components/services/ServiceHero';
import { OtherServices } from '@/components/services/OtherServices';
import { ContactCta } from '@/components/home/ContactCta';
import { ThermoLayers } from '@/components/services/fassade/ThermoLayers';
import { WorkPanels } from '@/components/services/fassade/WorkPanels';
import { FacadeCheck } from '@/components/services/fassade/FacadeCheck';
import { LeadCtaButton } from '@/components/services/fassade/LeadCtaButton';

const PATH = '/leistungen/fassadenarbeiten';
const HERO_IMAGE = '/images/service-fassade-2.jpg';

/** Values mirror `fassade.approach.skills.*` labels in messages. */
const SKILLS = [
  ['s1', 100],
  ['s2', 80],
  ['s3', 75],
  ['s4', 83],
] as const;

const WORK_IMAGES: Record<'w1' | 'w2' | 'w3' | 'w4', string> = {
  w1: '/images/restaurierung-work.jpg',
  w2: '/images/concrete-work.jpg',
  w3: '/images/fassade-crane.jpg',
  w4: '/images/fassade-after.jpg',
};

const STEP_ICONS = [
  STROKE_ICONS.magnifier,
  STROKE_ICONS.docEuro,
  STROKE_ICONS.scaffold,
  STROKE_ICONS.checkSeal,
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
    title: t('fassade.title'),
    description: t('fassade.description'),
    image: HERO_IMAGE,
  });
}

export default async function FassadenarbeitenPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  setRequestLocale(rawLocale);
  const locale = rawLocale as Locale;

  const [t, tService, tNav, tMeta] = await Promise.all([
    getTranslations({ locale, namespace: 'fassade' }),
    getTranslations({ locale, namespace: 'servicePage' }),
    getTranslations({ locale, namespace: 'nav' }),
    getTranslations({ locale, namespace: 'meta' }),
  ]);

  const skills = SKILLS.map(([key, value]) => ({
    label: t(`approach.skills.${key}.label`),
    value,
  }));

  const layers = (['l1', 'l2', 'l3', 'l4', 'l5'] as const).map((k) => ({
    label: t(`layers.items.${k}.label`),
    text: t(`layers.items.${k}.text`),
  }));

  const panels = (['w1', 'w2', 'w3', 'w4'] as const).map((key) => ({
    key,
    title: t(`works.items.${key}.title`),
    text: t(`works.items.${key}.text`),
    image: WORK_IMAGES[key],
  }));

  const checkItems = (['c1', 'c2', 'c3', 'c4', 'c5'] as const).map((k) => ({
    key: k,
    label: t(`check.items.${k}`),
  }));

  const steps = (['s1', 's2', 's3', 's4'] as const).map((key, i) => ({
    title: t(`process.items.${key}.title`),
    text: t(`process.items.${key}.text`),
    icon: STEP_ICONS[i],
  }));

  return (
    <>
      <JsonLd
        data={serviceJsonLd(locale, {
          path: PATH,
          name: t('hero.title'),
          description: tMeta('fassade.description'),
          image: HERO_IMAGE,
        })}
      />

      <ServiceHero
        kicker={t('hero.kicker')}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
        media={{ video: '/videos/fassade.mp4', image: HERO_IMAGE }}
        locale={locale}
        breadcrumbs={[
          { name: tNav('breadcrumbHome'), path: '/' },
          { name: tNav('services'), path: '/leistungen' },
          { name: t('hero.title'), path: PATH },
        ]}
      />

      {/* 2 — Approach: manifesto + animated skill bars */}
      <section className="py-20 sm:py-24 lg:py-32">
        <Container>
          <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <SectionHeading
                align="start"
                eyebrow={tService('ourApproach')}
                title={t('approach.title')}
                className="mb-8 md:mb-10"
              />
              <Reveal delay={0.1} className="space-y-8">
                <p className="max-w-prose leading-relaxed text-sand-400">
                  {t('approach.text')}
                </p>
                <LeadCtaButton
                  label={tService('requestCta')}
                  type="consultation"
                  context={tNav('serviceItems.fassadenarbeiten')}
                />
              </Reveal>
            </div>
            <Reveal delay={0.15} className="card-luxe rounded-sm p-8">
              <SkillBars skills={skills} />
            </Reveal>
          </div>
        </Container>
      </section>

      {/* 3 — Insulation system: interactive layer diagram */}
      <section className="hairline border-y bg-ink-950 py-20 sm:py-24 lg:py-32">
        <Container>
          <SectionHeading
            eyebrow={t('layers.kicker')}
            title={t('layers.title')}
            subtitle={t('layers.subtitle')}
          />
          <Reveal>
            <ThermoLayers layers={layers} hint={t('layers.hint')} />
          </Reveal>
        </Container>
      </section>

      {/* 4 — Main kinds of work: expanding photo panels */}
      <section className="py-20 sm:py-24 lg:py-32">
        <Container>
          <SectionHeading eyebrow={t('works.kicker')} title={t('works.title')} />
          <WorkPanels panels={panels} />
        </Container>
      </section>

      {/* 5 — Facade self-diagnosis checklist */}
      <section className="hairline border-y bg-ink-950 py-20 sm:py-24 lg:py-32">
        <Container>
          <SectionHeading
            eyebrow={t('check.kicker')}
            title={t('check.title')}
            subtitle={t('check.subtitle')}
          />
          <Reveal className="mx-auto max-w-5xl">
            <FacadeCheck
              items={checkItems}
              copy={{
                counterLabel: t('check.counterLabel'),
                contextLabel: t('check.contextLabel'),
                verdicts: [
                  t('check.verdicts.v0'),
                  t('check.verdicts.v1'),
                  t('check.verdicts.v2'),
                ],
                cta: t('check.cta'),
                hint: t('check.hint'),
              }}
            />
          </Reveal>
        </Container>
      </section>

      {/* 6 — Recommended way to start */}
      <section className="py-20 sm:py-24 lg:py-32">
        <Container>
          <SectionHeading title={t('process.title')} />
          <IllustratedSteps steps={steps} className="mx-auto max-w-3xl" />
        </Container>
      </section>

      <OtherServices locale={locale} currentKey="fassadenarbeiten" />
      <ContactCta locale={locale} />
    </>
  );
}
