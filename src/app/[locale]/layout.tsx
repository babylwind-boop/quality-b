import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider, type Messages } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { Oswald, Roboto } from 'next/font/google';
import { routing } from '@/i18n/routing';
import { localeMeta } from '@/i18n/locale-meta';
import { site } from '@/lib/site';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LeadModalProvider } from '@/components/lead/LeadModalContext';
import { LeadModal } from '@/components/lead/LeadModal';
import { JsonLd, constructionCompanyJsonLd } from '@/components/seo/JsonLd';
import { PageTransition } from '@/components/layout/PageTransition';
import { SmoothScroll } from '@/components/layout/SmoothScroll';
import '../globals.css';

const oswald = Oswald({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-oswald',
  display: 'swap',
});
const roboto = Roboto({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
});

const fontVars = [oswald.variable, roboto.variable].join(' ');

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.brandLine,
    template: `%s | ${site.name}`,
  },
  applicationName: site.name,
  formatDetection: { telephone: false },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const meta = localeMeta[locale];
  const tNav = await getTranslations('nav');

  // Only the namespaces used by client components are shipped to the browser;
  // everything else stays server-side (keeps HTML payload lean).
  const all = await getMessages();
  const CLIENT_NS = [
    'nav',
    'common',
    'hero',
    'contactPopup',
    'whoWeAre',
    'offers',
  ] as const;
  const clientMessages = Object.fromEntries(
    CLIENT_NS.filter((ns) => ns in all).map((ns) => [ns, all[ns as keyof typeof all]]),
  ) as Messages;

  return (
    <html lang={meta.lang} dir={meta.dir} className={fontVars}>
      <body className="min-h-dvh bg-ink-900 text-sand-50 antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-100 focus:rounded-full focus:bg-bronze-500 focus:px-5 focus:py-3 focus:text-ink-950"
        >
          {tNav('skipToContent')}
        </a>
        <JsonLd data={constructionCompanyJsonLd()} />
        <NextIntlClientProvider messages={clientMessages}>
          <SmoothScroll />
          <LeadModalProvider>
            <Header />
            <main id="main" tabIndex={-1}>
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
            <LeadModal />
          </LeadModalProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
