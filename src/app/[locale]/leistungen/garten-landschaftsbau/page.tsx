import Image from 'next/image';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import { cn } from '@/lib/utils';
import { STROKE_ICONS } from '@/lib/icon-strokes';
import { JsonLd, serviceJsonLd } from '@/components/seo/JsonLd';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal, RevealItem } from '@/components/ui/Reveal';
import { SkillGauges } from '@/components/ui/SkillGauges';
import { IllustratedSteps } from '@/components/ui/IllustratedSteps';
import { ServiceHero } from '@/components/services/ServiceHero';
import { OtherServices } from '@/components/services/OtherServices';
import { ContactCta } from '@/components/home/ContactCta';
import { LeadCtaButton } from '@/components/lead/LeadCtaButton';
import { GardenMap } from '@/components/services/garten/GardenMap';

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

const SKILL_VALUES = { s1: 70, s2: 90, s3: 85, s4: 80 } as const;

/** GardenMap zone order is fixed: greenery, automation, paths, leisure, utilities, other. */
const ZONE_KEYS = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'] as const;

/** altKey points at the scope zone whose title best describes the photo. */
const GALLERY = [
  { image: '/images/garten-villa.jpg', span: 'sm:col-span-2 sm:row-span-2', altKey: 'g1' },
  { image: '/images/garten-teich.jpg', span: '', altKey: 'g4' },
  { image: '/images/garten-blumen.jpg', span: '', altKey: 'g1' },
  { image: '/images/garten-detail.jpg', span: '', altKey: 'g3' },
  { image: '/images/garten-luft.jpg', span: '', altKey: 'g6' },
] as const;

const STEP_ICONS = [STROKE_ICONS.eye, STROKE_ICONS.docEuro] as const;

export default async function GartenPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  setRequestLocale(rawLocale);
  const locale = rawLocale as Locale;

  const t = await getTranslations({ locale, namespace: 'garten' });
  const tService = await getTranslations({ locale, namespace: 'servicePage' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });
  const tMeta = await getTranslations({ locale, namespace: 'meta' });

  const breadcrumbs = [
    { name: tNav('breadcrumbHome'), path: '/' },
    { name: tNav('services'), path: '/leistungen' },
    { name: tNav('serviceItems.garten'), path: PATH },
  ];

  const skills = (['s1', 's2', 's3', 's4'] as const).map((k) => ({
    label: t(`approach.skills.${k}.label`),
    value: SKILL_VALUES[k],
  }));

  const zones = ZONE_KEYS.map((k) => ({
    key: k,
    title: t(`scope.items.${k}.title`),
    text: t(`scope.items.${k}.text`),
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

      {/* 2 — Approach: editorial text + animated skill bars */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="grid items-start gap-14 lg:grid-cols-2 lg:gap-20">
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
                    context={tNav('serviceItems.garten')}
                    label={tService('requestCta')}
                  />
                </div>
              </Reveal>
            </div>
            <Reveal delay={0.15} className="card-luxe rounded-sm p-7 sm:p-9 lg:mt-4">
              <SkillGauges skills={skills} />
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

      {/* 4 — Why it pays off: alternating editorial rhythm */}
      <section className="py-20 sm:py-28">
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

      {/* 5 — Gallery of finished outdoor spaces */}
      <section className="hairline border-y bg-ink-950 py-20 sm:py-28">
        <Container>
          <SectionHeading title={t('gallery.title')} />
          <Reveal stagger={0.08} className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:gap-5">
            {GALLERY.map(({ image, span, altKey }, i) => (
              <RevealItem
                key={image}
                className={cn('group relative overflow-hidden rounded-sm', span)}
              >
                <div className={cn('relative h-full w-full', i === 0 ? 'aspect-[4/3] sm:aspect-auto' : 'aspect-[4/3]')}>
                  <Image
                    src={image}
                    alt={`${t('gallery.title')} — ${t(`scope.items.${altKey}.title`)}`}
                    fill
                    sizes={i === 0 ? '(min-width:640px) 50vw, 100vw' : '(min-width:640px) 25vw, 50vw'}
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-ink-950/45 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  />
                </div>
              </RevealItem>
            ))}
          </Reveal>
        </Container>
      </section>

      {/* 6 — How the collaboration starts */}
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
