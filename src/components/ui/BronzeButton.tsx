'use client';

import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

type Variant = 'solid' | 'outline' | 'ghost';

/* Rectangular flat buttons with an underlined uppercase label — the original
   site's CTA style (flat #A98B56, dark text, no rounding, no gradients). */
const base =
  'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2.5 px-8 py-3 text-[0.82rem] font-bold tracking-[0.12em] uppercase underline underline-offset-4 decoration-1 transition-colors duration-300 select-none';

const variants: Record<Variant, string> = {
  solid: 'bg-bronze-500 text-ink-950 hover:bg-bronze-400',
  outline:
    'border border-sand-50/30 text-sand-50 hover:border-bronze-400 hover:text-bronze-300 bg-ink-900/40',
  ghost: 'text-sand-100 no-underline hover:text-bronze-300',
};

export function BronzeButton({
  children,
  variant = 'solid',
  className,
  onClick,
  type = 'button',
  disabled,
  ariaLabel,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type={type}
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className={cn(base, variants[variant], disabled && 'opacity-50 pointer-events-none', className)}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
    >
      <span className="inline-flex items-center gap-2.5">{children}</span>
    </motion.button>
  );
}

/** Anchor-styled variant for links (keeps <a> semantics for SEO). */
export function BronzeLink({
  children,
  href,
  variant = 'solid',
  className,
}: {
  children: React.ReactNode;
  href: string;
  variant?: Variant;
  className?: string;
}) {
  return (
    <a href={href} className={cn(base, variants[variant], className)}>
      <span className="inline-flex items-center gap-2.5">{children}</span>
    </a>
  );
}
