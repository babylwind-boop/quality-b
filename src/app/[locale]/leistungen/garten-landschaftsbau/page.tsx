import Image from 'next/image';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import { STROKE_ICONS } from '@/lib/icon-strokes';
import { JsonLd, serviceJsonLd } from '@/components/seo/JsonLd';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { IllustratedSteps } from '@/components/ui/IllustratedSteps';
import { ServiceHero } from '@/components/services/ServiceHero';
import { OtherServices } from '@/components/services/OtherServices';
import { ContactCta } from '@/components/home/ContactCta';
import { LeadCtaButton } from '@/components/lead/LeadCtaButton';
import { GardenMap } from '@/components/services/garten/GardenMap';
import { GardenScene } from '@/components/services/garten/GardenScene';
import { RetainingWallPicker } from '@/components/services/garten/RetainingWallPicker';
import { SurfacePicker } from '@/components/services/garten/SurfacePicker';
import { PoolBuildScene } from '@/components/services/garten/PoolBuildScene';
import { FenceBuilder } from '@/components/services/garten/FenceBuilder';
import { OutdoorConfigurator } from '@/components/services/garten/OutdoorConfigurator';

const PATH = '/leistungen/garten-landschaftsbau';
const HERO_IMAGE = '/images/service-garten.jpg';

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
    title: t('garten.title'),
    description: t('garten.description'),
    image: HERO_IMAGE,
  });
}

/** GardenMap zone order is fixed: greenery, automation, paths, leisure, utilities, other. */
const ZONE_KEYS = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'] as const;
const WALL_TYPES = ['winkel', 'naturstein', 'gabionen', 'pflanzsteine'] as const;
const SURFACES = ['pflaster', 'rasengitter', 'naturstein', 'asphalt'] as const;
const FENCE_TYPES = ['doppelstab', 'holz', 'gabione', 'mauer'] as const;
const LAYERS = ['rasen', 'bewaesserung', 'drainage', 'beleuchtung', 'pflege'] as const;
const STEP_ICONS = [STROKE_ICONS.eye, STROKE_ICONS.docEuro] as const;

/** Bronze-square bullet list used for the block facts. */
function FactList({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={className}>
      {items.map((f) => (
        <li key={f} className="flex items-start gap-3 text-sm leading-relaxed text-sand-300">
          <span aria-hidden className="mt-2 size-1.5 shrink-0 bg-bronze-500" />
          {f}
        </li>
      ))}
    </ul>
  );
}

export default async function GartenPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  setRequestLocale(rawLocale);
  const locale = rawLocale as Locale;

  const t = await getTranslations({ locale, namespace: 'garten' });
  const tService = await getTranslations({ locale, namespace: 'servicePage' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });
  const tMeta = await getTranslations({ locale, namespace: 'meta' });

  const serviceName = tNav('serviceItems.garten');
  const breadcrumbs = [
    { name: tNav('breadcrumbHome'), path: '/' },
    { name: tNav('services'), path: '/leistungen' },
    { name: serviceName, path: PATH },
  ];

  const zones = ZONE_KEYS.map((k) => ({
    key: k,
    title: t(`scope.items.${k}.title`),
    text: t(`scope.items.${k}.text`),
  }));

  const scenePhases: [string, string, string, string] = [
    t('scene.phases.p1'),
    t('scene.phases.p2'),
    t('scene.phases.p3'),
    t('scene.phases.p4'),
  ];

  const wallTypes = WALL_TYPES.map((k) => ({
    key: k,
    label: t(`blocks.stuetzwand.types.${k}.label`),
    text: t(`blocks.stuetzwand.types.${k}.text`),
  }));

  const surfaces = SURFACES.map((k) => ({
    key: k,
    label: t(`blocks.parken.surfaces.${k}.label`),
    text: t(`blocks.parken.surfaces.${k}.text`),
    facts: (['f1', 'f2', 'f3'] as const).map((f) => t(`blocks.parken.surfaces.${k}.facts.${f}`)),
  }));

  const poolPhases: [string, string, string, string] = [
    t('blocks.pool.phases.p1'),
    t('blocks.pool.phases.p2'),
    t('blocks.pool.phases.p3'),
    t('blocks.pool.phases.p4'),
  ];

  const fenceTypes = FENCE_TYPES.map((k) => ({
    key: k,
    label: t(`blocks.zaun.types.${k}.label`),
    text: t(`blocks.zaun.types.${k}.text`),
  }));

  const layers = LAYERS.map((k) => ({
    key: k,
    label: t(`blocks.aussen.layers.${k}.label`),
    text: t(`blocks.aussen.layers.${k}.text`),
  }));

  const processSteps = (['s1', 's2'] as const).map((k, i) => ({
    title: t(`process.items.${k}.title`),
    text: t(`process.items.${k}.text`),
    icon: STEP_ICONS[i],
  }));

  const whyRows = [
    { text: t('why.p1'), image: '/images/garten-teich.jpg', alt: t('scope.items.g4.title') },
    { text: t('why.p2'), image: '/images/garten-blumen.jpg', alt: t('scope.items.g1.title') },
    { text: t('why.p3'), image: '/images/garten-detail.jpg', alt: t('scope.items.g3.title') },
  ];

  return (
    <>
      <JsonLd
        data={serviceJsonLd(locale, {
          path: PATH,
          name: t('hero.title'),
          description: tMeta('garten.description'),
          image: HERO_IMAGE,
        })}
      />

      <ServiceHero
        kicker={t('hero.kicker')}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
        media={{ video: '/videos/garten.mp4', image: HERO_IMAGE }}
        locale={locale}
        breadcrumbs={breadcrumbs}
      />

      {/* 2 — Approach: editorial text + garden build-up scene */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <SectionHeading
                eyebrow={tService('ourApproach')}
                title={t('approach.title')}
                align="start"
                className="mb-8 md:mb-10"
              />
              <Reveal>
                <p className="max-w-prose leading-relaxed text-sand-300">
                  {t('approach.text')}
                </p>
                <div className="mt-9">
                  <LeadCtaButton
                    type="consultation"
                    context={serviceName}
                    label={tService('requestCta')}
                  />
                </div>
              </Reveal>
            </div>
            <Reveal delay={0.15} className="card-luxe rounded-sm p-4 sm:p-6">
              <GardenScene phaseLabels={scenePhases} />
            </Reveal>
          </div>
        </Container>
      </section>

      {/* 3 — Scope: interactive landscape plan */}
      <section className="hairline border-y bg-ink-950 py-20 sm:py-28">
        <Container>
          <SectionHeading title={t('scope.title')} subtitle={t('scope.hint')} />
          <GardenMap zones={zones} />
        </Container>
      </section>

      {/* 4 — Stützwandbau: retaining-wall cross-section picker */}
      <section className="py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow={t('blocks.stuetzwand.kicker')}
            title={t('blocks.stuetzwand.title')}
            subtitle={t('blocks.stuetzwand.text')}
          />
          <Reveal>
            <RetainingWallPicker types={wallTypes} hint={t('blocks.stuetzwand.hint')} />
          </Reveal>
          <Reveal
            delay={0.1}
            className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between"
          >
            <FactList
              items={(['f1', 'f2', 'f3'] as const).map((f) => t(`blocks.stuetzwand.facts.${f}`))}
              className="grid gap-3 sm:grid-cols-3 sm:gap-6"
            />
            <LeadCtaButton
              type="consultation"
              context={`${serviceName} · ${t('blocks.stuetzwand.kicker')}`}
              label={t('blocks.stuetzwand.cta')}
            />
          </Reveal>
        </Container>
      </section>

      {/* 5 — Parkplätze & Zufahrten: surface picker */}
      <section className="hairline border-y bg-ink-950 py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow={t('blocks.parken.kicker')}
            title={t('blocks.parken.title')}
            subtitle={t('blocks.parken.text')}
          />
          <Reveal>
            <SurfacePicker surfaces={surfaces} hint={t('blocks.parken.hint')} />
          </Reveal>
          <Reveal
            delay={0.1}
            className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between"
          >
            <FactList
              items={(['f1', 'f2', 'f3'] as const).map((f) => t(`blocks.parken.facts.${f}`))}
              className="grid gap-3 sm:grid-cols-3 sm:gap-6"
            />
            <LeadCtaButton
              type="consultation"
              context={`${serviceName} · ${t('blocks.parken.kicker')}`}
              label={t('blocks.parken.cta')}
            />
          </Reveal>
        </Container>
      </section>

      {/* 6 — Poolbau: copy + self-running build scene */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <SectionHeading
                eyebrow={t('blocks.pool.kicker')}
                title={t('blocks.pool.title')}
                align="start"
                className="mb-6 md:mb-8"
              />
              <Reveal>
                <p className="max-w-prose leading-relaxed text-sand-300">
                  {t('blocks.pool.text')}
                </p>
                <FactList
                  items={(['f1', 'f2', 'f3', 'f4'] as const).map((f) => t(`blocks.pool.facts.${f}`))}
                  className="mt-7 space-y-3"
                />
                <div className="mt-9">
                  <LeadCtaButton
                    type="consultation"
                    context={`${serviceName} · ${t('blocks.pool.kicker')}`}
                    label={t('blocks.pool.cta')}
                  />
                </div>
              </Reveal>
            </div>
            <Reveal delay={0.15} className="card-luxe rounded-sm p-4 sm:p-6">
              <PoolBuildScene phaseLabels={poolPhases} />
            </Reveal>
          </div>
        </Container>
      </section>

      {/* 7 — Zäune & Einfriedungen: fence builder strip */}
      <section className="hairline border-y bg-ink-950 py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow={t('blocks.zaun.kicker')}
            title={t('blocks.zaun.title')}
            subtitle={t('blocks.zaun.text')}
          />
          <Reveal>
            <FenceBuilder types={fenceTypes} hint={t('blocks.zaun.hint')} />
          </Reveal>
          <Reveal delay={0.1} className="mt-10 flex justify-center">
            <LeadCtaButton
              type="consultation"
              context={`${serviceName} · ${t('blocks.zaun.kicker')}`}
              label={t('blocks.zaun.cta')}
            />
          </Reveal>
        </Container>
      </section>

      {/* 8 — Außenanlagen komplett: compose-your-garden configurator */}
      <section className="py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow={t('blocks.aussen.kicker')}
            title={t('blocks.aussen.title')}
            subtitle={t('blocks.aussen.text')}
          />
          <Reveal>
            <OutdoorConfigurator
              layers={layers}
              copy={{
                hint: t('blocks.aussen.hint'),
                cta: t('blocks.aussen.cta'),
                contextLabel: `${serviceName} · ${t('blocks.aussen.contextLabel')}`,
                selectedLabel: t('blocks.aussen.selectedLabel'),
                emptyText: t('blocks.aussen.emptyText'),
              }}
            />
          </Reveal>
        </Container>
      </section>

      {/* 9 — Why it pays off: alternating editorial rhythm */}
      <section className="hairline border-y bg-ink-950 py-20 sm:py-28">
        <Container>
          <SectionHeading title={t('why.title')} />
          <div className="space-y-16 lg:space-y-24">
            {whyRows.map(({ text, image, alt }, i) => {
              const flipped = i % 2 === 1;
              return (
                <div
                  key={image}
                  className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16"
                >
                  <Reveal className={flipped ? 'lg:order-last' : undefined}>
                    <p className="max-w-prose border-s-2 border-bronze-500/40 ps-6 text-lg leading-relaxed text-sand-300">
                      {text}
                    </p>
                  </Reveal>
                  <Reveal delay={0.1}>
                    <div className="group relative aspect-[4/3] overflow-hidden rounded-sm border border-bronze-500/15">
                      <Image
                        src={image}
                        alt={alt}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                        sizes="(min-width: 1024px) 45vw, 100vw"
                      />
                      <div
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-t from-ink-950/40 via-transparent to-transparent"
                      />
                    </div>
                  </Reveal>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* 10 — How the collaboration starts */}
      <section className="py-20 sm:py-28">
        <Container>
          <SectionHeading title={t('process.title')} />
          <IllustratedSteps steps={processSteps} className="mx-auto max-w-3xl" />
        </Container>
      </section>

      <OtherServices locale={locale} currentKey="garten" />
      <ContactCta locale={locale} />
    </>
  );
}
