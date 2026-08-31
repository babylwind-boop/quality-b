import { cn } from '@/lib/utils';
import { Reveal } from './Reveal';

/**
 * Standard section opener: bronze eyebrow with hairline, display title, subtitle.
 * `align` defaults to centered; use 'start' for editorial sections.
 */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  as: Tag = 'h2',
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  align?: 'center' | 'start';
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
}) {
  const centered = align === 'center';
  return (
    <Reveal
      className={cn(
        'mb-12 max-w-3xl md:mb-16',
        centered ? 'mx-auto text-center' : 'text-start',
        className,
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            'mb-4 flex items-center gap-3 text-[0.8rem] font-medium tracking-[0.28em] uppercase text-bronze-500',
            centered && 'justify-center',
          )}
        >
          <span aria-hidden className="h-px w-7 bg-bronze-500/60" />
          {eyebrow}
          {centered && <span aria-hidden className="h-px w-7 bg-bronze-500/60" />}
        </p>
      )}
      <Tag className="font-display text-3xl leading-[1.15] font-semibold sm:text-4xl md:text-5xl">
        {title}
      </Tag>
      {subtitle && (
        <p className="mt-5 text-base leading-relaxed text-sand-400 sm:text-lg">
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}
