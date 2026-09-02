import Image from 'next/image';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import { cn } from '@/lib/utils';
import { STROKE_ICONS } from '@/lib/icon-strokes';
import { Container } from '@/components/ui/Container';
import { Reveal, RevealItem } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { InteriorScene } from '@/components/services/innen/InteriorScene';
import { DrawIcon } from '@/components/ui/DrawIcon';
import { JsonLd, serviceJsonLd } from '@/components/seo/JsonLd';
import { ServiceHero } from '@/components/services/ServiceHero';
import { OtherServices } from '@/components/services/OtherServices';
import { ContactCta } from '@/components/home/ContactCta';
import { LeadCtaButton } from '@/components/services/innen/LeadCtaButton';
import { RepairTypesShowcase } from '@/components/services/innen/RepairTypesShowcase';
import { CompareBlock } from '@/components/services/innen/CompareBlock';

type Props = { params: Promise<{ locale: string }> };

const PATH = '/leistungen/innenrenovierung';
const SERVICE_IMAGE = '/images/service-innen.jpg';


const USP_ITEMS = [
  { key: 'u1', icon: STROKE_ICONS.layers },
  { key: 'u2', icon: STROKE_ICONS.eye },
  { key: 'u3', icon: STROKE_ICONS.keyHandover },
] as const;

const STYLE_ITEMS = [
  { key: 'klassik', image: '/images/innen-klassik.jpg' },
  { key: 'modern', image: '/images/innen-wohnen.jpg' },
  { key: 'skandinavisch', image: '/images/innen-kueche.jpg' },
  { key: 'minimalismus', image: '/images/project-3.jpg' },
  { key: 'rustikal', image: '/images/project-2.jpg' },
  { key: 'industriell', image: '/images/innen-loft.jpg' },
] as const;

const SERVICE_KEYS = ['l1', 'l2', 'l3', 'l4'] as const;

const REPAIR_ITEMS = [
  { key: 'r1', image: '/images/innen-arbeit.jpg' },
  { key: 'r2', image: '/images/innen-wohnen.jpg' },
  { key: 'r3', image: '/images/innen-kueche.jpg' },
  { key: 'r4', image: '/images/innen-bad.jpg' },
  { key: 'r5', image: '/images/innen-heizung.jpg' },
] as const;

const COMPARE_KEYS = ['c1', 'c2', 'c3', 'c4'] as const;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({
    locale: locale as Locale,
    path: PATH,
    title: t('innen.title'),
    description: t('innen.description'),
    image: SERVICE_IMAGE,
  });
}

export default async function InnenrenovierungPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  setRequestLocale(rawLocale);
  const locale = rawLocale as Locale;

  const t = await getTranslations('innen');
  const tPage = await getTranslations('servicePage');
  const tNav = await getTranslations('nav');
  const tMeta = await getTranslations('meta');

  const scenePhases: [string, string, string, string] = [
    t('scene.phases.p1'),
    t('scene.phases.p2'),
    t('scene.phases.p3'),
    t('scene.phases.p4'),
  ];

  const repairItems = REPAIR_ITEMS.map(({ key, image }) => ({
    key,
    image,
    title: t(`repairTypes.items.${key}.title`),
    text: t(`repairTypes.items.${key}.text`),
  }));

  const compareRows = COMPARE_KEYS.map((k) => ({
    key: k,
    aspect: t(`compare.rows.${k}.aspect`),
    diy: t(`compare.rows.${k}.diy`),
    pro: t(`compare.rows.${k}.pro`),
  }));

  return (
    <>
      <JsonLd
        data={serviceJsonLd(locale, {
          path: PATH,
          name: t('hero.title'),
          description: tMeta('innen.description'),
          image: SERVICE_IMAGE,
        })}
      />

      {/* 1 — Hero */}
      <ServiceHero
        kicker={t('hero.kicker')}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
        media={{ video: '/videos/innen.mp4', image: SERVICE_IMAGE }}
        locale={locale}
        breadcrumbs={[
          { name: tNav('breadcrumbHome'), path: '/' },
          { name: tNav('services'), path: '/leistungen' },
          { name: tNav('serviceItems.innenrenovierung'), path: PATH },
        ]}
      />

      {/* 2 — Approach + skill bars */}
      <section className="py-20 md:py-28">
        <Container>
          <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <SectionHeading
                align="start"
                eyebrow={tPage('ourApproach')}
                title={t('approach.title')}
                className="mb-6 md:mb-8"
              />
              <Reveal delay={0.08}>
                <p className="max-w-prose leading-relaxed text-sand-400">
                  {t('approach.text')}
                </p>
                <div className="mt-9">
                  <LeadCtaButton label={tPage('requestCta')} context={tNav('serviceItems.innenrenovierung')} />
                </div>
              </Reveal>
            </div>
            <Reveal delay={0.15} className="card-luxe rounded-sm p-4 sm:p-6">
              <InteriorScene phaseLabels={scenePhases} />
            </Reveal>
          </div>
        </Container>
      </section>

      {/* 3 — USP cards with drawing icons */}
      <section className="pb-20 md:pb-28">
        <Container>
          <Reveal stagger={0.1} className="grid gap-5 md:grid-cols-3 md:gap-6">
            {USP_ITEMS.map(({ key, icon }, i) => (
              <RevealItem key={key} className="group card-luxe rounded-sm p-7 md:p-8">
                <div className="flex items-start justify-between">
                  <span className="flex size-14 items-center justify-center rounded-sm bg-bronze-500/10 text-bronze-300 transition-colors duration-500 group-hover:bg-bronze-500/20">
                    <DrawIcon icon={icon} delay={i * 0.15} className="size-8" />
                  </span>
                  <span
                    aria-hidden
                    className="font-display text-lg text-sand-600 transition-colors duration-500 group-hover:text-bronze-400"
                  >
                    /{i + 1}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-xl leading-snug font-semibold">
                  {t(`usp.items.${key}.title`)}
                </h3>
                <span
                  aria-hidden
                  className="mt-3 block h-px w-10 bg-bronze-500/50 transition-all duration-500 group-hover:w-16 group-hover:bg-bronze-400"
                />
                <p className="mt-3 leading-relaxed text-sand-400">
                  {t(`usp.items.${key}.text`)}
                </p>
              </RevealItem>
            ))}
          </Reveal>
        </Container>
      </section>

      {/* 4 — Interior styles gallery */}
      <section className="hairline border-y bg-ink-950 py-20 md:py-28">
        <Container>
          <SectionHeading title={t('styles.title')} subtitle={t('styles.subtitle')} />
          <Reveal stagger={0.08} className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3">
            {STYLE_ITEMS.map(({ key, image }, i) => (
              <RevealItem
                key={key}
                className={cn(
                  'group relative aspect-[4/3] overflow-hidden rounded-sm',
                  i % 3 === 1 && 'lg:mt-10',
                )}
              >
                <Image
                  src={image}
                  alt={t(`styles.items.${key}`)}
                  fill
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-ink-950/55 via-transparent to-transparent"
                />
                <span className="glass-soft absolute bottom-3 start-3 rounded-sm px-3.5 py-1.5 text-xs font-medium tracking-wide text-sand-50 sm:text-sm">
                  {t(`styles.items.${key}`)}
                </span>
              </RevealItem>
            ))}
          </Reveal>
        </Container>
      </section>

      {/* 5 — Full service spectrum (specification ledger) */}
      <section className="py-20 md:py-28">
        <Container>
          <SectionHeading
            eyebrow={t('services.kicker')}
            title={t('services.title')}
            align="start"
          />
          <Reveal stagger={0.08} className="hairline border-t">
            {SERVICE_KEYS.map((k, i) => (
              <RevealItem
                key={k}
                className="group hairline grid gap-2 border-b py-8 transition-colors duration-500 hover:bg-ink-950/40 md:grid-cols-[4.5rem_1fr_2fr] md:gap-8 md:py-10"
              >
                <span
                  aria-hidden
                  className="tnum font-display text-2xl font-semibold text-bronze-500/70 transition-colors duration-500 group-hover:text-bronze-400"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="font-display text-xl leading-snug font-semibold md:text-2xl">
                  {t(`services.items.${k}.title`)}
                </h3>
                <p className="max-w-prose leading-relaxed text-sand-400">
                  {t(`services.items.${k}.text`)}
                </p>
              </RevealItem>
            ))}
          </Reveal>
        </Container>
      </section>

      {/* 6 — Repair types: photo tabs / accordion */}
      <section className="hairline border-y bg-ink-950 py-20 md:py-28">
        <Container>
          <SectionHeading title={t('repairTypes.title')} />
          <RepairTypesShowcase items={repairItems} />
        </Container>
      </section>

      {/* 7 — DIY vs professionals comparison */}
      <section className="py-20 md:py-28">
        <Container>
          <SectionHeading eyebrow={t('compare.kicker')} title={t('compare.title')} />
          <CompareBlock
            rows={compareRows}
            aspectHead={t('compare.aspectHead')}
            diyHead={t('compare.diyHead')}
            proHead={t('compare.proHead')}
          />
        </Container>
      </section>

      {/* 8 — Guide card */}
      <section className="pb-20 md:pb-28">
        <Container>
          <Reveal>
            <div className="card-luxe flex flex-col gap-6 rounded-sm p-8 md:flex-row md:gap-10 md:p-12">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-sm border border-bronze-500/25 bg-bronze-500/10 text-bronze-300">
                <DrawIcon icon={STROKE_ICONS.bulb} className="size-9" />
              </span>
              <div>
                <h2 className="font-display text-2xl leading-snug font-semibold sm:text-3xl">
                  {t('guide.title')}
                </h2>
                <p className="mt-4 max-w-3xl leading-relaxed text-sand-400">
                  {t('guide.text')}
                </p>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* 9 — Other services + closing CTA */}
      <OtherServices locale={locale} currentKey="innenrenovierung" />
      <ContactCta locale={locale} />
    </>
  );
}
