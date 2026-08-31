import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['de', 'pl'],
  defaultLocale: 'de',
  // DE lives at the domain root; PL gets a URL prefix.
  localePrefix: 'as-needed',
});

export type Locale = (typeof routing.locales)[number];
