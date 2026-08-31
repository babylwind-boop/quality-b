'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  Building2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Landmark,
  Paintbrush,
  Trees,
  type LucideIcon,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

const ICONS: Record<string, LucideIcon> = {
  hausbau: Compass,
  restaurierung: Landmark,
  innenrenovierung: Paintbrush,
  fassadenarbeiten: Building2,
  garten: Trees,
};

export interface ServiceCardData {
  key: string;
  href: string;
  title: string;
  description: string;
  readMore: string;
}

/**
 * Faithful rebuild of the original site's service carousel (pxl_service_carousel
 * layout-1): black cards on an image-backed section, "/ 1" number top-end,
 * bronze icon, uppercase letter-spaced title over a hairline, description —
 * and on hover a bronze flood with the underlined "Mehr lesen" button.
 * Refreshed implementation: scroll-snap track, arrow controls, gentle autoplay
 * (paused on hover/interaction/reduced-motion), keyboard accessible.
 */
export function ServicesCarousel({
  items,
  prevLabel,
  nextLabel,
}: {
  items: ServiceCardData[];
  prevLabel: string;
  nextLabel: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const reduce = useReducedMotion() ?? false;
  const [paused, setPaused] = useState(false);
  const interacted = useRef(false);

  const step = useCallback((dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector('li');
    if (!card) return;
    const delta = (card.getBoundingClientRect().width + 26) * dir;
    track.scrollBy({ left: delta, behavior: 'smooth' });
  }, []);

  // Autoplay like the original (5s), stopping permanently on any interaction.
  useEffect(() => {
    if (reduce || paused) return;
    const id = window.setInterval(() => {
      const track = trackRef.current;
      if (!track || interacted.current) return;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
      if (atEnd) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        step(1);
      }
    }, 5000);
    return () => window.clearInterval(id);
  }, [reduce, paused, step]);

  const stopAutoplay = () => {
    interacted.current = true;
  };

  return (
    <div
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onPointerDown={stopAutoplay}
      onKeyDown={stopAutoplay}
    >
      <ul
        ref={trackRef}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-[26px] overflow-x-auto scroll-smooth px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
      >
        {items.map(({ key, href, title, description, readMore }, i) => {
          const Icon = ICONS[key] ?? Compass;
          return (
            <li
              key={key}
              className="w-[82%] max-w-[320px] shrink-0 snap-start sm:w-[46%] lg:w-[calc((100%-3*26px)/4)] lg:max-w-none"
            >
              <Link
                href={href}
                className="glass-card group relative block h-full overflow-hidden px-[30px] pt-14 pb-10"
              >
                {/* Bronze flood on hover (original .pxl-overlay) */}
                <span
                  aria-hidden
                  className="absolute inset-0 scale-50 bg-bronze-600 opacity-0 transition-[opacity,transform] duration-300 ease-out group-hover:scale-105 group-hover:opacity-100"
                />

                <span className="relative block">
                  {/* Number top-end, heading font, like the original */}
                  <span
                    aria-hidden
                    className="absolute -top-8 end-0 font-display text-lg tracking-[0.1em] text-[#bcbcbc]"
                  >
                    / {i + 1}
                  </span>

                  <Icon
                    aria-hidden
                    className="mb-5 size-12 text-bronze-500 transition-[color,transform] duration-300 group-hover:-translate-y-2 group-hover:text-sand-50"
                    strokeWidth={1.25}
                  />

                  <span className="block border-b border-white/15 pb-4 font-display text-lg leading-[1.65] tracking-[0.1em] text-sand-50 uppercase">
                    {title}
                  </span>

                  {/* Description ⇄ read-more swap (original hover behaviour);
                      on touch/no-hover both stay visible stacked. */}
                  <span className="relative mt-5 block min-h-24">
                    <span className="block text-sm leading-relaxed text-sand-300 transition-[opacity,transform] duration-300 [@media(hover:hover)]:group-hover:scale-75 [@media(hover:hover)]:group-hover:opacity-0">
                      {description}
                    </span>
                    <span
                      className={cn(
                        'mt-4 inline-flex items-center gap-2 text-[0.8rem] font-bold tracking-[0.12em] text-sand-50 uppercase underline underline-offset-4',
                        '[@media(hover:hover)]:absolute [@media(hover:hover)]:top-1/2 [@media(hover:hover)]:start-0 [@media(hover:hover)]:mt-0 [@media(hover:hover)]:-translate-y-1/2 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:transition-opacity [@media(hover:hover)]:duration-300 [@media(hover:hover)]:group-hover:opacity-100',
                      )}
                    >
                      {readMore}
                      <ArrowRight aria-hidden className="size-3.5" />
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Arrows (original carousel had them) */}
      <div className="mt-8 flex justify-center gap-3 lg:justify-end">
        <button
          type="button"
          aria-label={prevLabel}
          onClick={() => {
            stopAutoplay();
            step(-1);
          }}
          className="flex size-11 cursor-pointer items-center justify-center border border-sand-50/25 text-sand-100 transition-colors hover:border-bronze-400 hover:text-bronze-300"
        >
          <ChevronLeft aria-hidden className="size-5" />
        </button>
        <button
          type="button"
          aria-label={nextLabel}
          onClick={() => {
            stopAutoplay();
            step(1);
          }}
          className="flex size-11 cursor-pointer items-center justify-center border border-sand-50/25 text-sand-100 transition-colors hover:border-bronze-400 hover:text-bronze-300"
        >
          <ChevronRight aria-hidden className="size-5" />
        </button>
      </div>
    </div>
  );
}
