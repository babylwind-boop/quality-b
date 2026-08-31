'use client';

import { useId, useTransition } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import { localeMeta } from '@/i18n/locale-meta';
import { routing, type Locale } from '@/i18n/routing';
import { cn } from '@/lib/utils';

/**
 * Two-button segmented language toggle (DE / PL) with flags. With exactly two
 * locales a visible toggle beats a dropdown: one tap, both options always
 * discoverable. Switching preserves the current route (incl. dynamic params).
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [, startTransition] = useTransition();
  // Per-instance layoutId: two switchers mount at once (header + mobile
  // drawer) and a shared id would make the pill fly between them.
  const pillId = useId();

  function switchTo(next: Locale) {
    if (next === locale) return;
    startTransition(() => {
      // @ts-expect-error params are validated by the routes themselves
      router.replace({ pathname, params }, { locale: next });
    });
  }

  return (
    <div
      role="group"
      aria-label="Sprache / Język"
      className={cn(
        'relative flex items-center gap-0.5 rounded-sm border border-sand-50/12 bg-ink-900/55 p-0.5',
        className,
      )}
    >
      {routing.locales.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            lang={localeMeta[l].lang}
            aria-pressed={active}
            aria-label={localeMeta[l].nativeName}
            onClick={() => switchTo(l)}
            className={cn(
              'relative flex min-h-6 cursor-pointer items-center gap-1 rounded-sm px-2 py-1 text-[0.65rem] font-semibold tracking-wide transition-colors duration-300',
              active ? 'text-ink-950' : 'text-sand-300 hover:text-bronze-200',
            )}
          >
            {active && (
              <motion.span
                layoutId={`lang-pill-${pillId}`}
                aria-hidden
                className="absolute inset-0 rounded-sm bg-bronze-500"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <Image
              src={`/flags/${l}.svg`}
              alt=""
              aria-hidden
              width={14}
              height={10}
              unoptimized
              className="relative z-10 h-2.5 w-3.5 rounded-[1px] object-cover"
            />
            <span className="relative z-10">{localeMeta[l].short}</span>
          </button>
        );
      })}
    </div>
  );
}
