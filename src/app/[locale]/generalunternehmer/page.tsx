import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { routing, type Locale } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';
import { STROKE_ICONS } from '@/lib/icon-strokes';
import { JsonLd, serviceJsonLd } from '@/components/seo/JsonLd';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal, RevealItem } from '@/components/ui/Reveal';
import { DrawIcon } from '@/components/ui/DrawIcon';
import { BronzeLink } from '@/components/ui/BronzeButton';
import { ServiceHero } from '@/components/services/ServiceHero';
import { CompanySeal } from '@/components/about/CompanySeal';
import { PartnerFlowScene } from '@/components/partner/PartnerFlowScene';
import { PartnerWizard } from '@/components/partner/PartnerWizard';

const PATH = '/generalunternehmer';
const HERO_IMAGE = '/images/site-team.jpg';

const FACT_ICONS = [STROKE_ICONS.helmet, STROKE_ICONS.chat, STROKE_ICONS.clock] as const;
const TRADE_KEYS = ['rohbau', 'fassade', 'innen', 'sanierung', 'aussen'] as const;
const TRADE_ICONS = [
  STROKE_ICONS.crane,
  STROKE_ICONS.layers,
  STROKE_ICONS.draft,
  STROKE_ICONS.frames,
  STROKE_ICONS.materials,
] as const;
const MODEL_KEYS = ['m1', 'm2', 'm3', 'm4'] as const;
const TERM_KEYS = ['t1', 't2', 't3', 't4', 't5', 't6'] as const;
const WHY_KEYS = ['w1', 'w2', 'w3', 'w4'] as const;
const WHY_ICONS = [
  STROKE_ICONS.helmet,
  STROKE_ICONS.clock,
  STROKE_ICONS.coins,
  STROKE_ICONS.docEuro,
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
    title: t('partner.title'),
    description: t('partner.description'),
    image: HERO_IMAGE,
  });
}

export default async function PartnerPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  setRequestLocale(rawLocale);
  const locale = rawLocale as Locale;

  const [t, tNav, tMeta, tForm, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: 'partner' }),
    getTranslations({ locale, namespace: 'nav' }),
    getTranslations({ locale, namespace: 'meta' }),
    getTranslations({ locale, namespace: 'contactPopup' }),
    getTranslations({ locale, namespace: 'common' }),
  ]);

  const trades = TRADE_KEYS.map((k) => ({ key: k, label: t(`trades.items.${k}.title`) }));
  const flowPhases: [string, string, string, string] = [
    t('models.phases.p1'),
    t('models.phases.p2'),
    t('models.phases.p3'),
    t('models.phases.p4'),
  ];

  return (
    <>
      <JsonLd
        data={serviceJsonLd(locale, {
          path: PATH,
          name: tMeta('partner.title'),
          description: tMeta('partner.description'),
          image: HERO_IMAGE,
        })}
      />

      <ServiceHero
        kicker={t('hero.kicker')}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
        media={{ video: '/videos/hausbau.mp4', image: HERO_IMAGE }}
        locale={locale}
        breadcrumbs={[
          { name: tNav('breadcrumbHome'), path: '/' },
          { name: tNav('partner'), path: PATH },
        ]}
      />

      {/* 2 — Three quick facts */}
      <section className="hairline border-b bg-ink-950 py-10 sm:py-12">
        <Container>
          <Reveal stagger={0.1} className="grid gap-6 sm:grid-cols-3 sm:gap-8">
            {(['f1', 'f2', 'f3'] as const).map((k, i) => (
              <RevealItem key={k} className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-sm border border-bronze-500/25 bg-bronze-500/10 text-bronze-300">
                  <DrawIcon icon={FACT_ICONS[i]} delay={i * 0.12} className="size-7" />
                </span>
                <div>
                  <h2 className="font-display text-lg leading-snug font-semibold">
                    {t(`facts.${k}.title`)}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-sand-400">
                    {t(`facts.${k}.text`)}
                  </p>
                </div>
              </RevealItem>
            ))}
          </Reveal>
        </Container>
      </section>

      {/* 3 — Trades we take over */}
      <section className="py-20 sm:py-28">
        <Container>
          <SectionHeading title={t('trades.title')} subtitle={t('trades.subtitle')} />
          <Reveal stagger={0.08} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {TRADE_KEYS.map((k, i) => (
              <RevealItem key={k} className="group card-luxe rounded-sm p-6">
                <div className="flex items-start justify-between">
                  <span className="flex size-12 items-center justify-center rounded-sm bg-bronze-500/10 text-bronze-300 transition-colors duration-500 group-hover:bg-bronze-500/20">
                    <DrawIcon icon={TRADE_ICONS[i]} delay={i * 0.1} className="size-7" />
                  </span>
                  <span
                    aria-hidden
                    className="font-display text-lg text-sand-600 transition-colors duration-500 group-hover:text-bronze-400"
                  >
                    /{i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg leading-snug font-semibold">
                  {t(`trades.items.${k}.title`)}
                </h3>
                <span
                  aria-hidden
                  className="mt-3 block h-px w-10 bg-bronze-500/50 transition-all duration-500 group-hover:w-16 group-hover:bg-bronze-400"
                />
                <p className="mt-3 text-sm leading-relaxed text-sand-400">
                  {t(`trades.items.${k}.text`)}
                </p>
              </RevealItem>
            ))}
          </Reveal>
        </Container>
      </section>

      {/* 4 — Cooperation models + flow scene */}
      <section className="hairline border-y bg-ink-950 py-20 sm:py-28">
        <Container>
          <SectionHeading title={t('models.title')} subtitle={t('models.subtitle')} />
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            <Reveal as="ol" stagger={0.1} className="hairline border-t">
              {MODEL_KEYS.map((k, i) => (
                <RevealItem
                  key={k}
                  as="li"
                  className="group hairline flex gap-5 border-b py-6 transition-colors duration-500 hover:bg-ink-900/40"
                >
                  <span className="tnum pt-1 font-display text-2xl font-semibold text-bronze-500/70 transition-colors duration-500 group-hover:text-bronze-400">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="font-display text-xl leading-snug font-semibold">
                      {t(`models.items.${k}.title`)}
                    </h3>
                    <p className="mt-2 max-w-prose text-sm leading-relaxed text-sand-400">
                      {t(`models.items.${k}.text`)}
                    </p>
                  </div>
                </RevealItem>
              ))}
            </Reveal>
            <Reveal delay={0.15} className="card-luxe rounded-sm p-4 sm:p-6">
              <PartnerFlowScene phaseLabels={flowPhases} />
            </Reveal>
          </div>
        </Container>
      </section>

      {/* 5 — Terms by agreement + company seal */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
            <Reveal>
              <SectionHeading
                align="start"
                eyebrow={t('terms.kicker')}
                title={t('terms.title')}
                className="mb-6"
              />
              <p className="max-w-prose leading-relaxed text-sand-300">{t('terms.text')}</p>
              <dl className="hairline mt-8 border-t">
                {TERM_KEYS.map((k) => (
                  <div
                    key={k}
                    className="hairline flex flex-col gap-1 border-b py-4 sm:flex-row sm:gap-6"
                  >
                    <dt className="w-44 shrink-0 pt-0.5 text-[0.72rem] font-medium tracking-[0.2em] uppercase text-sand-500">
                      {t(`terms.rows.${k}.label`)}
                    </dt>
                    <dd className="text-sm leading-relaxed text-sand-100">
                      {t(`terms.rows.${k}.text`)}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
            <Reveal delay={0.12} className="flex justify-center lg:justify-end">
              <CompanySeal caption={t('terms.sealCaption')} />
            </Reveal>
          </div>
        </Container>
      </section>

      {/* 6 — Why GU work with us */}
      <section className="hairline border-y bg-ink-950 py-20 sm:py-28">
        <Container>
          <SectionHeading title={t('why.title')} />
          <Reveal stagger={0.09} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_KEYS.map((k, i) => (
              <RevealItem key={k} className="group card-luxe rounded-sm p-6 sm:p-7">
                <span className="inline-flex size-14 items-center justify-center rounded-sm border border-bronze-500/25 bg-bronze-500/10 text-bronze-300 transition-colors duration-500 group-hover:bg-bronze-500/20">
                  <DrawIcon icon={WHY_ICONS[i]} delay={i * 0.12} className="size-8" />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold">{t(`why.items.${k}.title`)}</h3>
                <span
                  aria-hidden
                  className="mt-3 block h-px w-10 bg-bronze-500/50 transition-all duration-500 group-hover:w-16 group-hover:bg-bronze-400"
                />
                <p className="mt-3 text-sm leading-relaxed text-sand-400">
                  {t(`why.items.${k}.text`)}
                </p>
              </RevealItem>
            ))}
          </Reveal>
        </Container>
      </section>

      {/* 7 — Project request wizard */}
      <section className="py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow={t('wizard.kicker')}
            title={t('wizard.title')}
            subtitle={t('wizard.subtitle')}
          />
          <Reveal className="mx-auto max-w-5xl">
            <PartnerWizard
              trades={trades}
              objectTypes={(['efh', 'mfh', 'gewerbe', 'bestand'] as const).map((k) => ({
                key: k,
                label: t(`wizard.objectTypes.${k}`),
              }))}
              volumes={(['v1', 'v2', 'v3', 'v4'] as const).map((k) => ({
                key: k,
                label: t(`wizard.volumes.${k}`),
              }))}
              starts={(['s1', 's2', 's3', 's4'] as const).map((k) => ({
                key: k,
                label: t(`wizard.starts.${k}`),
              }))}
              copy={{
                stepLabels: [t('wizard.steps.s1'), t('wizard.steps.s2'), t('wizard.steps.s3')],
                tradesTitle: t('wizard.tradesTitle'),
                tradesHint: t('wizard.tradesHint'),
                projectTitle: t('wizard.projectTitle'),
                objectType: t('wizard.objectType'),
                objectTypePlaceholder: t('wizard.objectTypePlaceholder'),
                volume: t('wizard.volume'),
                volumePlaceholder: t('wizard.volumePlaceholder'),
                start: t('wizard.start'),
                startPlaceholder: t('wizard.startPlaceholder'),
                location: t('wizard.location'),
                locationPlaceholder: t('wizard.locationPlaceholder'),
                message: t('wizard.message'),
                messagePlaceholder: t('wizard.messagePlaceholder'),
                contactTitle: t('wizard.contactTitle'),
                company: t('wizard.company'),
                companyPlaceholder: t('wizard.companyPlaceholder'),
                name: tForm('form.name'),
                namePlaceholder: tForm('form.namePlaceholder'),
                phone: tForm('form.phone'),
                phonePlaceholder: tForm('form.phonePlaceholder'),
                email: tForm('form.email'),
                emailPlaceholder: tForm('form.emailPlaceholder'),
                summaryTitle: t('wizard.summaryTitle'),
                summaryEmpty: t('wizard.summaryEmpty'),
                back: t('wizard.back'),
                next: t('wizard.next'),
                submit: t('wizard.submit'),
                submitting: tForm('form.submitting'),
                successTitle: t('wizard.successTitle'),
                successText: t('wizard.successText'),
                errorText: tCommon('error'),
                privacyNote: t('wizard.privacyNote'),
                privacyLinkLabel: t('wizard.privacyLink'),
              }}
            />
          </Reveal>
        </Container>
      </section>

      {/* 8 — Direct contact band */}
      <section className="hairline border-t bg-ink-950 py-16 sm:py-20">
        <Container>
          <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
            <Reveal className="max-w-xl">
              <h2 className="font-display text-3xl leading-tight font-semibold sm:text-4xl">
                {t('contact.title')}
              </h2>
              <p className="mt-4 leading-relaxed text-sand-300">{t('contact.text')}</p>
            </Reveal>
            <Reveal delay={0.1} className="flex flex-wrap gap-3">
              <BronzeLink href={`tel:${site.phoneHref}`}>
                <Phone aria-hidden className="size-4" />
                {site.phones[0]}
              </BronzeLink>
              <BronzeLink href={`mailto:${site.email}`} variant="outline">
                <Mail aria-hidden className="size-4" />
                {site.email}
              </BronzeLink>
              <BronzeLink href={site.whatsapp} variant="outline">
                <MessageCircle aria-hidden className="size-4" />
                WhatsApp
              </BronzeLink>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
