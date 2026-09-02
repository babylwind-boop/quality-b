import Image from 'next/image';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { SERVICES } from '@/lib/services';
import { site } from '@/lib/site';

/**
 * Footer doubles as the sitewide internal-linking hub (SEO):
 * every service landing and key page is crawlable from every page.
 */
export async function Footer() {
  const [t, tn] = await Promise.all([
    getTranslations('footer'),
    getTranslations('nav'),
  ]);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-sand-50/8 bg-ink-950">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {/* Brand + contacts */}
          <div className="space-y-5">
            <Link href="/" className="inline-flex" aria-label={site.brandLine}>
              <Image
                src="/logo.svg"
                alt={site.brandLine}
                width={311}
                height={100}
                unoptimized
                className="h-16 w-auto"
              />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-sand-400">
              {t('tagline')}
            </p>
            <ul className="space-y-3 text-sm text-sand-400">
              <li>
                <a
                  href={`tel:${site.phoneHref}`}
                  className="flex items-center gap-2.5 transition-colors hover:text-bronze-300"
                  dir="ltr"
                >
                  <Phone className="size-4 shrink-0 text-bronze-500" aria-hidden />
                  <span>{site.phones[0]}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="flex items-center gap-2.5 transition-colors hover:text-bronze-300"
                >
                  <Mail className="size-4 shrink-0 text-bronze-500" aria-hidden />
                  {site.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-bronze-500" aria-hidden />
                <span>
                  {site.address.company}, {site.address.street},
                  <br />
                  {site.address.zip} {site.address.city}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 size-4 shrink-0 text-bronze-500" aria-hidden />
                <span>{site.hours}</span>
              </li>
            </ul>
          </div>

          {/* Services hub */}
          <nav aria-label={tn('services')}>
            <h2 className="mb-4 text-sm font-semibold tracking-[0.18em] uppercase text-sand-300">
              {tn('services')}
            </h2>
            <ul className="text-sm">
              {SERVICES.map(({ key, href }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className="inline-flex min-h-11 items-center py-2 text-sand-400 transition-colors hover:text-bronze-300"
                  >
                    {tn(`serviceItems.${key}`)}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/leistungen"
                  className="inline-flex min-h-11 items-center py-2 font-medium text-bronze-400 transition-colors hover:text-bronze-300"
                >
                  {tn('services')} →
                </Link>
              </li>
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label={tn('about')}>
            <h2 className="mb-4 text-sm font-semibold tracking-[0.18em] uppercase text-sand-300">
              Quality Build
            </h2>
            <ul className="text-sm">
              {(
                [
                  ['/ueber-uns', tn('about')],
                  ['/generalunternehmer', tn('partner')],
                  ['/kontakt', tn('contact')],
                ] as const
              ).map(([href, label]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="inline-flex min-h-11 items-center py-2 text-sand-400 transition-colors hover:text-bronze-300"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-sand-50/8 pt-6 text-xs text-sand-500 sm:flex-row">
          <p>© {year} {site.brandLine}. {t('copyright')}</p>
          <Link
            href="/datenschutz"
            className="inline-flex min-h-11 items-center py-2 transition-colors hover:text-bronze-300"
          >
            {t('privacyPolicy')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
