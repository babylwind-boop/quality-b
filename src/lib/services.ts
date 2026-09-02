/**
 * Service landing registry. Single source of truth for navigation, the
 * services hub, the footer and the sitemap. Message keys live under the
 * `services.items.<key>` namespace.
 */
export const SERVICES = [
  { key: 'hausbau', href: '/leistungen/hausbau' },
  { key: 'fassadenarbeiten', href: '/leistungen/fassadenarbeiten' },
  { key: 'innenrenovierung', href: '/leistungen/innenrenovierung' },
  { key: 'restaurierung', href: '/leistungen/kernsanierung' },
  { key: 'garten', href: '/leistungen/garten-landschaftsbau' },
] as const;

export type ServiceKey = (typeof SERVICES)[number]['key'];

/**
 * House styles shown on the Hausbau landing and used as project filters.
 * Multi-family housing (Mehrfamilienhäuser) intentionally removed.
 */
export const HOUSE_STYLES = [
  'townhouse',
  'hitech',
  'minimalismus',
  'skandinavisch',
  'klassisch',
  'preiswert',
  'bueros',
  'gewerbe',
  'raffiniert',
  'nichtstandard',
] as const;

export type HouseStyleKey = (typeof HOUSE_STYLES)[number];
