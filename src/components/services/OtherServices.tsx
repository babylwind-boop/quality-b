import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { SERVICES, type ServiceKey } from '@/lib/services';
import { Container } from '@/components/ui/Container';
import { Reveal, RevealItem } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';

const SERVICE_IMAGES: Record<ServiceKey, string> = {
  hausbau: '/images/service-hausbau.jpg',
  fassadenarbeiten: '/images/service-fassade-2.jpg',
  innenrenovierung: '/images/service-innen.jpg',
  restaurierung: '/images/service-restaurierung.jpg',
  garten: '/images/service-garten.jpg',
};

/**
 * Cross-linking strip at the bottom of each service landing: image cards for
 * the other four services. Hover (image zoom + arrow slide) is pure CSS.
 */
export async function OtherServices({
  locale,
  currentKey,
}: {
  locale: Locale;
  currentKey: ServiceKey;
}) {
  const [t, tn] = await Promise.all([
    getTranslations({ locale, namespace: 'servicePage' }),
    getTranslations({ locale, namespace: 'nav' }),
  ]);
  const others = SERVICES.filter((s) => s.key !== currentKey);

  return (
    <section className="py-24 lg:py-28">
      <Container>
        <SectionHeading title={t('otherServices')} />
        <Reveal stagger={0.08} className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {others.map(({ key, href }) => (
            <RevealItem key={key}>
              <Link
                href={href}
                className="group relative block overflow-hidden rounded-sm"
              >
                <div className="relative aspect-[3/4]">
                  <Image
                    src={SERVICE_IMAGES[key]}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover transition-transform duration-700 ease-luxe group-hover:scale-105"
                  />
                </div>
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/25 to-transparent"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">
                  <span className="min-w-0 font-display text-base leading-snug font-semibold break-words hyphens-auto text-sand-50 sm:text-lg">
                    {tn(`serviceItems.${key}`)}
                  </span>
                  <ArrowRight
                    aria-hidden
                    className="mb-1 size-4 shrink-0 text-bronze-300 transition-transform duration-500 ease-luxe group-hover:translate-x-1.5"
                  />
                </div>
              </Link>
            </RevealItem>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
