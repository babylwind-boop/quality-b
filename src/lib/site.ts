/** Site-wide constants. Single source of truth for brand, contacts, URLs. */
export const site = {
  name: 'Quality Build',
  /** Full brand line used in the header/footer. */
  brandLine: 'Quality Build & Management',
  legalName: 'Quality Build & Management Sp. z o.o.',
  domain: 'quality-b.com',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://quality-b.com',
  email: 'info@quality-b.com',
  phones: ['+49 (0) 151 270 39 320'],
  phoneHref: '+4915127039320',
  whatsapp: 'https://wa.me/4915127039320',
  address: {
    company: 'Quality Build & Management Sp. z o.o.',
    street: 'Plac Przyjaźni 18/12',
    zip: '69-100',
    city: 'Słubice',
    country: 'Polska',
    countryCode: 'PL',
  },
  /** Official registration identifiers (as on the company stamp). */
  nip: '5981661547',
  regon: '54288397100000',
  hours: 'Mo–Fr 08:00–18:00, Sa 08:00–12:00',
} as const;

export function absoluteUrl(path: string): string {
  const base = site.url.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
