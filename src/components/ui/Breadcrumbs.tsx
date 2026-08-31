import { ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { breadcrumbJsonLd, JsonLd } from '@/components/seo/JsonLd';

/**
 * Visual breadcrumb trail + BreadcrumbList JSON-LD (server component).
 * The last item is the current page and is rendered as plain text.
 */
export function Breadcrumbs({
  locale,
  items,
}: {
  locale: Locale;
  items: { name: string; path: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <JsonLd data={breadcrumbJsonLd(locale, items)} />
      <ol className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        {items.map((item, i) => {
          const isCurrent = i === items.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-2.5">
              {i > 0 && (
                <ChevronRight aria-hidden className="size-3.5 shrink-0 text-sand-500" />
              )}
              {isCurrent ? (
                <span aria-current="page" className="font-medium text-bronze-300">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.path}
                  className="inline-flex items-center py-2 text-sand-300 transition-colors hover:text-bronze-300"
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
