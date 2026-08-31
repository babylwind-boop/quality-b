import { getPathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { absoluteUrl, site } from '@/lib/site';

/** Renders a JSON-LD script tag. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD must be embedded raw; escape closing tags defensively.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replaceAll('</', '<\\/'),
      }}
    />
  );
}

/** Sitewide construction-company organization entity. */
export function constructionCompanyJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'GeneralContractor',
    '@id': `${site.url}/#organization`,
    name: site.brandLine,
    legalName: site.legalName,
    url: site.url,
    logo: absoluteUrl('/icon.png'),
    image: absoluteUrl('/og-default.jpg'),
    email: site.email,
    telephone: site.phones[0],
    taxID: site.nip,
    vatID: `PL${site.nip}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      postalCode: site.address.zip,
      addressLocality: site.address.city,
      addressCountry: site.address.countryCode,
    },
    openingHours: site.hours,
    areaServed: [
      { '@type': 'Country', name: 'Deutschland' },
      { '@type': 'Country', name: 'Polska' },
    ],
    knowsLanguage: ['de', 'pl'],
    sameAs: [site.whatsapp],
  };
}

export function breadcrumbJsonLd(
  locale: Locale,
  items: { name: string; path: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(getPathname({ locale, href: item.path })),
    })),
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

/** Service entity for each service mini-landing. */
export function serviceJsonLd(locale: Locale, opts: {
  path: string;
  name: string;
  description: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(getPathname({ locale, href: opts.path })),
    image: opts.image ? absoluteUrl(opts.image) : undefined,
    provider: { '@id': `${site.url}/#organization` },
    areaServed: [
      { '@type': 'Country', name: 'Deutschland' },
      { '@type': 'Country', name: 'Polska' },
    ],
  };
}
