import Image from 'next/image';
import type { Locale } from '@/i18n/routing';
import { AmbientVideo } from '@/components/ui/AmbientVideo';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Container } from '@/components/ui/Container';

/**
 * Full-bleed media hero for the service landings: ambient video (or a
 * priority image), dark scrim, glass breadcrumb bar, kicker and display H1.
 */
export function ServiceHero({
  kicker,
  title,
  subtitle,
  media,
  locale,
  breadcrumbs,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  media: { video?: string; image: string };
  locale: Locale;
  breadcrumbs: { name: string; path: string }[];
}) {
  return (
    <section className="relative flex min-h-[62dvh] flex-col justify-end overflow-hidden bg-ink-950">
      <div className="absolute inset-0">
        {media.video ? (
          <AmbientVideo src={media.video} poster={media.image} />
        ) : (
          <Image
            src={media.image}
            alt={title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        )}
      </div>

      {/* Scrim: bottom-to-top gradient + side vignette for text legibility */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/45 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-ink-950/55 via-transparent to-ink-950/35"
      />

      <Container className="relative z-10 pt-[calc(var(--header-h)+4rem)] pb-12 sm:pb-16 lg:pb-20">
        <div className="animate-fade-up">
          <div className="glass mb-7 inline-flex max-w-full rounded-sm px-5 py-2.5">
            <Breadcrumbs locale={locale} items={breadcrumbs} />
          </div>
          <p className="mb-4 flex items-center gap-3 text-[0.8rem] font-medium tracking-[0.28em] uppercase text-bronze-500">
            <span aria-hidden className="h-px w-7 bg-bronze-500/60" />
            {kicker}
          </p>
          <h1 className="font-display text-4xl leading-[1.05] font-semibold sm:text-5xl lg:text-7xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-sand-300 sm:text-lg">
            {subtitle}
          </p>
        </div>
      </Container>
    </section>
  );
}
