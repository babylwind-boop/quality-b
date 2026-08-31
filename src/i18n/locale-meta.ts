import type { Locale } from './routing';

/** Per-locale metadata: BCP-47 codes for SEO, text direction, native names. */
export const localeMeta: Record<
  Locale,
  {
    /** Correct hreflang / html lang value (ISO 639-1). */
    lang: string;
    /** Open Graph locale. */
    ogLocale: string;
    dir: 'ltr' | 'rtl';
    /** Native language name for the switcher. */
    nativeName: string;
    /** Short label for compact switcher. */
    short: string;
  }
> = {
  de: { lang: 'de', ogLocale: 'de_DE', dir: 'ltr', nativeName: 'Deutsch', short: 'DE' },
  pl: { lang: 'pl', ogLocale: 'pl_PL', dir: 'ltr', nativeName: 'Polski', short: 'PL' },
};
