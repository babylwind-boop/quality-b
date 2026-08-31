import Image from 'next/image';
import { Clock, MapPin } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { LeadForm } from '@/components/lead/LeadForm';
import { site } from '@/lib/site';

/**
 * Sitewide closing CTA section: heading + direct phone contact on the left,
 * inline contact lead form in a premium card on the right. Every page renders
 * this right before the footer.
 */
export async function ContactCta({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'contactCta' });

  return (
    <section
      id="kontakt-cta"
      className="relative isolate overflow-hidden bg-ink-950 py-24 lg:py-32"
    >
      {/* ── Section background photo + scrim (blends into page above, footer below) ── */}
      <Image
        src="/images/style-klassisch.jpg"
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        className="-z-20 object-cover"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-ink-950/87" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-900 via-transparent to-ink-950"
      />

      <Container className="relative">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              align="start"
              eyebrow={t('eyebrow')}
              title={t('title')}
              subtitle={t('subtitle')}
              className="mb-8 lg:mb-10"
            />
            <Reveal delay={0.1} className="space-y-6">
              <div>
                <p className="text-sm font-medium tracking-[0.18em] uppercase text-sand-400">
                  {t('orCall')}
                </p>
                <a
                  href={`tel:${site.phoneHref}`}
                  dir="ltr"
                  className="mt-3 inline-flex min-h-11 items-center font-display text-3xl font-semibold tracking-wide text-bronze-300 transition-colors hover:text-bronze-200 sm:text-4xl"
                >
                  {site.phones[0]}
                </a>
              </div>
              <ul className="space-y-2.5 text-sm text-sand-500">
                <li className="flex items-center gap-2.5">
                  <Clock className="size-4 shrink-0 text-bronze-500" aria-hidden />
                  <span>{site.hours}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-bronze-500" aria-hidden />
                  <span>
                    {site.address.company}, {site.address.street},{' '}
                    {site.address.zip} {site.address.city}
                  </span>
                </li>
              </ul>
            </Reveal>
          </div>

          <Reveal delay={0.15}>
            {/* card-luxe is slightly translucent; force a solid-enough bg over the photo */}
            <div className="card-luxe rounded-sm bg-ink-900/90! p-6 sm:p-8">
              <LeadForm type="contact" />
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
