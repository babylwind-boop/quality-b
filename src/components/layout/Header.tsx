'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type Lenis from 'lenis';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronDown, Menu, Phone, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { site } from '@/lib/site';
import { SERVICES } from '@/lib/services';
import { cn } from '@/lib/utils';
import { BronzeButton } from '@/components/ui/BronzeButton';
import { useLeadModal } from '@/components/lead/LeadModalContext';
import { LanguageSwitcher } from './LanguageSwitcher';

const NAV = [
  { key: 'home', href: '/' },
  { key: 'about', href: '/ueber-uns' },
  { key: 'services', href: '/leistungen', children: SERVICES },
  { key: 'partner', href: '/generalunternehmer' },
  { key: 'contact', href: '/kontakt' },
] as const;

export function Header() {
  const t = useTranslations('nav');
  const { open } = useLeadModal();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [prevPath, setPrevPath] = useState(pathname);
  const reduce = useReducedMotion();
  const servicesRef = useRef<HTMLLIElement>(null);
  const closeTimer = useRef<number | null>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const drawerNavRef = useRef<HTMLElement>(null);
  const servicesMenuId = useId();

  // Close menus on navigation (state adjusted during render — compiler-safe)
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setMenuOpen(false);
    setServicesOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock scroll while the drawer is open (incl. the Lenis smooth-scroll loop)
  useEffect(() => {
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    document.documentElement.style.overflow = menuOpen ? 'hidden' : '';
    if (menuOpen) lenis?.stop();
    else lenis?.start();
    return () => {
      document.documentElement.style.overflow = '';
      lenis?.start();
    };
  }, [menuOpen]);

  // Drawer a11y: move focus into the drawer, close on Escape (returning focus
  // to the burger button) and make the page content behind the overlay inert.
  useEffect(() => {
    if (!menuOpen) return;
    drawerNavRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        burgerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const behind = [document.querySelector('main'), document.querySelector('footer')];
    behind.forEach((el) => el?.setAttribute('inert', ''));
    return () => {
      document.removeEventListener('keydown', onKey);
      behind.forEach((el) => el?.removeAttribute('inert'));
    };
  }, [menuOpen]);

  // Close the services dropdown on outside pointerdown / Escape
  useEffect(() => {
    if (!servicesOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!servicesRef.current?.contains(e.target as Node)) setServicesOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setServicesOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [servicesOpen]);

  function scheduleClose() {
    closeTimer.current = window.setTimeout(() => setServicesOpen(false), 140);
  }
  function cancelClose() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-90 border-b backdrop-blur-xl transition-[background-color,border-color] duration-500',
          scrolled || menuOpen
            ? 'border-white/10 bg-ink-900/72'
            : 'border-white/5 bg-ink-900/40',
        )}
      >
        <div className="relative mx-auto grid h-[var(--header-h)] w-full max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6 lg:px-8 xl:grid-cols-[1fr_auto_1fr]">
          {/* Original site logo (vectorized, tagline updated to Management) */}
          <Link href="/" aria-label={site.brandLine} className="flex shrink-0 items-center">
            <Image
              src="/logo.svg"
              alt={site.brandLine}
              width={311}
              height={100}
              priority
              unoptimized
              className="h-12 w-auto sm:h-14 lg:h-16"
            />
          </Link>

          <nav aria-label="Main" className="hidden items-center justify-center justify-self-center xl:flex">
            <ul className="flex items-center gap-5 2xl:gap-6">
              {NAV.map((item) => {
                const active = isActive(item.href);
                if (!('children' in item)) {
                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'relative py-2 text-[0.88rem] font-medium whitespace-nowrap transition-colors hover:text-bronze-300',
                          active ? 'text-bronze-400' : 'text-sand-100',
                        )}
                      >
                        {t(item.key)}
                        {active && (
                          <motion.span
                            layoutId={reduce ? undefined : 'nav-underline'}
                            className="absolute inset-x-0 -bottom-px h-px bg-bronze-500"
                          />
                        )}
                      </Link>
                    </li>
                  );
                }
                return (
                  <li
                    key={item.key}
                    ref={servicesRef}
                    className="relative"
                    onPointerEnter={(e) => {
                      if (e.pointerType === 'mouse') {
                        cancelClose();
                        setServicesOpen(true);
                      }
                    }}
                    onPointerLeave={(e) => {
                      if (e.pointerType === 'mouse') scheduleClose();
                    }}
                  >
                    <div className="flex items-center">
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'relative py-2 text-[0.88rem] font-medium whitespace-nowrap transition-colors hover:text-bronze-300',
                          active ? 'text-bronze-400' : 'text-sand-100',
                        )}
                      >
                        {t(item.key)}
                        {active && (
                          <motion.span
                            layoutId={reduce ? undefined : 'nav-underline'}
                            className="absolute inset-x-0 -bottom-px h-px bg-bronze-500"
                          />
                        )}
                      </Link>
                      <button
                        type="button"
                        aria-label={t('services')}
                        aria-expanded={servicesOpen}
                        aria-controls={servicesMenuId}
                        onClick={() => setServicesOpen((v) => !v)}
                        className="grid min-h-9 cursor-pointer place-items-center px-1.5 text-sand-100 transition-colors hover:text-bronze-300"
                      >
                        <ChevronDown
                          aria-hidden
                          className={cn(
                            'size-3.5 transition-transform duration-300',
                            servicesOpen && 'rotate-180',
                          )}
                        />
                      </button>
                    </div>

                    <AnimatePresence>
                      {servicesOpen && (
                        <motion.ul
                          id={servicesMenuId}
                          aria-label={t('services')}
                          initial={{ opacity: 0, y: reduce ? 0 : 10, scale: reduce ? 1 : 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: reduce ? 0 : 8, scale: reduce ? 1 : 0.98 }}
                          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                          className="glass-card absolute start-1/2 top-[calc(100%+0.75rem)] z-50 min-w-64 -translate-x-1/2 overflow-hidden rounded-sm py-2 shadow-2xl shadow-black/50"
                        >
                          {item.children.map(({ key, href }) => (
                            <li key={key}>
                              <Link
                                href={href}
                                className={cn(
                                  'block px-5 py-2.5 text-sm transition-colors hover:bg-bronze-500/12 hover:text-bronze-200',
                                  isActive(href) ? 'text-bronze-300' : 'text-sand-100',
                                )}
                              >
                                {t(`serviceItems.${key}`)}
                              </Link>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center justify-end gap-3 justify-self-end">
            <a
              href={`tel:${site.phoneHref}`}
              className="hidden min-h-11 items-center gap-2 text-sm whitespace-nowrap text-sand-100 transition-colors hover:text-bronze-300 2xl:flex"
              dir="ltr"
            >
              <Phone className="size-4 text-bronze-400" aria-hidden />
              <span>{site.phones[0]}</span>
            </a>
            <LanguageSwitcher className="hidden sm:flex" />
            <div className="hidden md:block">
              <BronzeButton
                onClick={() => open('consultation')}
                className="min-h-11 px-5 py-2.5 text-sm whitespace-nowrap"
              >
                {t('getConsultation')}
              </BronzeButton>
            </div>
            <button
              ref={burgerRef}
              type="button"
              aria-label={menuOpen ? t('close') : t('menu')}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="grid size-11 cursor-pointer place-items-center rounded-full border border-sand-50/12 text-sand-100 transition-colors hover:border-bronze-500/50 hover:text-bronze-300 xl:hidden"
            >
              {menuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="drawer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            data-lenis-prevent
            className="fixed inset-0 z-80 overflow-y-auto bg-ink-950/97 backdrop-blur-xl xl:hidden"
          >
            <motion.nav
              ref={drawerNavRef}
              tabIndex={-1}
              aria-label="Mobile"
              className="flex min-h-full flex-col justify-between px-6 pt-[calc(var(--header-h)+1.25rem)] pb-10 outline-none"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{
                visible: { transition: { staggerChildren: reduce ? 0 : 0.05 } },
                hidden: {},
              }}
            >
              <ul className="space-y-1">
                {NAV.map((item) => (
                  <motion.li
                    key={item.key}
                    variants={{
                      hidden: { opacity: 0, y: reduce ? 0 : 18 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
                    }}
                  >
                    {'children' in item ? (
                      <div>
                        <div className="flex items-center justify-between">
                          <Link
                            href={item.href}
                            className={cn(
                              'block py-3 font-display text-2xl transition-colors hover:text-bronze-300',
                              isActive(item.href) ? 'text-bronze-400' : 'text-sand-50',
                            )}
                          >
                            {t(item.key)}
                          </Link>
                          <button
                            type="button"
                            aria-label={`${t('services')} — ${t('menu')}`}
                            aria-expanded={mobileServicesOpen}
                            onClick={() => setMobileServicesOpen((v) => !v)}
                            className="grid size-11 cursor-pointer place-items-center rounded-full border border-sand-50/12 text-sand-100"
                          >
                            <ChevronDown
                              aria-hidden
                              className={cn(
                                'size-4 transition-transform duration-300',
                                mobileServicesOpen && 'rotate-180',
                              )}
                            />
                          </button>
                        </div>
                        <AnimatePresence initial={false}>
                          {mobileServicesOpen && (
                            <motion.ul
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                              className="overflow-hidden border-s border-bronze-500/25 ps-4"
                            >
                              {item.children.map(({ key, href }) => (
                                <li key={key}>
                                  <Link
                                    href={href}
                                    className={cn(
                                      'block py-2.5 text-base transition-colors hover:text-bronze-300',
                                      isActive(href) ? 'text-bronze-300' : 'text-sand-200',
                                    )}
                                  >
                                    {t(`serviceItems.${key}`)}
                                  </Link>
                                </li>
                              ))}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className={cn(
                          'block py-3 font-display text-2xl transition-colors hover:text-bronze-300',
                          isActive(item.href) ? 'text-bronze-400' : 'text-sand-50',
                        )}
                      >
                        {t(item.key)}
                      </Link>
                    )}
                  </motion.li>
                ))}
              </ul>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: reduce ? 0 : 18 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
                }}
                className="mt-8 space-y-4"
              >
                <div className="flex justify-center sm:hidden">
                  <LanguageSwitcher />
                </div>
                <BronzeButton
                  onClick={() => {
                    setMenuOpen(false);
                    open('consultation');
                  }}
                  className="w-full"
                >
                  {t('getConsultation')}
                </BronzeButton>
                <a
                  href={`tel:${site.phoneHref}`}
                  className="flex items-center justify-center gap-2 py-2 text-sand-200"
                  dir="ltr"
                >
                  <Phone className="size-4 text-bronze-400" aria-hidden />
                  <span>{site.phones[0]}</span>
                </a>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
