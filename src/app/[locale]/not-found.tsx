import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/ui/Container';

export default async function NotFound() {
  const t = await getTranslations('notFound');
  return (
    <Container className="flex min-h-[70dvh] flex-col items-center justify-center py-32 text-center">
      <p className="font-display text-8xl font-semibold text-bronze-500">404</p>
      <h1 className="mt-6 font-display text-2xl text-sand-50 sm:text-3xl">
        {t('title')}
      </h1>
      <p className="mt-3 max-w-md text-sand-400">{t('description')}</p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-12 items-center justify-center gap-2.5 border border-sand-50/30 bg-ink-900/40 px-8 py-3 text-[0.82rem] font-bold tracking-[0.12em] uppercase underline underline-offset-4 decoration-1 text-sand-50 transition-colors hover:border-bronze-400 hover:text-bronze-300"
      >
        {t('backHome')}
      </Link>
    </Container>
  );
}
