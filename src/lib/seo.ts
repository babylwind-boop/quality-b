import type { Metadata } from 'next';
import { getPathname } from '@/i18n/navigation';
import { localeMeta } from '@/i18n/locale-meta';
import { routing, type Locale } from '@/i18n/routing';
import { absoluteUrl, site } from './site';

interface PageMetaInput {
  locale: Locale;
  /** Route path without locale prefix, e.g. '/leistungen/hausbau' */
  path: string;
  title: string;
  description: string;
  /** Optional OG image path (absolute or site-relative). */
  image?: string;
  noIndex?: boolean;
}

/**
 * Builds complete page metadata: canonical URL, full hreflang matrix
 * (all locales + x-default), Open Graph and Twitter cards.
 */
export function pageMetadata({
  locale: requestedLocale,
  path,
  title,
  description,
  image,
  noIndex,
}: PageMetaInput): Metadata {
  // Requests like /favicon.ico can reach generateMetadata as a bogus "locale"
  // before the layout's notFound() fires — clamp to a valid locale.
  const locale = routing.locales.includes(requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;
  const canonical = absoluteUrl(getPathname({ locale, href: path }));

  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[localeMeta[l].lang] = absoluteUrl(getPathname({ locale: l, href: path }));
  }
  languages['x-default'] = absoluteUrl(
    getPathname({ locale: routing.defaultLocale, href: path }),
  );

  const ogImage = image ?? '/og-default.jpg';

  return {
    title,
    description,
    alternates: { canonical, languages },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: site.name,
      locale: localeMeta[locale].ogLocale,
      alternateLocale: routing.locales
        .filter((l) => l !== locale)
        .map((l) => localeMeta[l].ogLocale),
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}
