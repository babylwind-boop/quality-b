'use client';

import { ArrowRight } from 'lucide-react';
import { BronzeButton } from '@/components/ui/BronzeButton';
import { useLeadModal, type LeadType } from './LeadModalContext';

type CommonProps = {
  type?: LeadType;
  context?: string;
  variant?: 'solid' | 'outline' | 'ghost';
  className?: string;
  /** Set to false to omit the trailing arrow after `label`. */
  icon?: boolean;
};

/**
 * Small client CTA that opens the lead modal — for use inside server
 * sections (the copy arrives pre-translated from the parent). Accepts
 * either a `label` string (gets a trailing arrow) or custom `children`.
 */
export function LeadCtaButton({
  label,
  children,
  type = 'consultation',
  context,
  variant = 'solid',
  className,
  icon,
}: CommonProps &
  (
    | { label: string; children?: never }
    | { label?: never; children: React.ReactNode }
  )) {
  const { open } = useLeadModal();
  return (
    <BronzeButton
      variant={variant}
      className={className}
      onClick={() => open(type, context)}
    >
      {label !== undefined ? (
        <>
          {label}
          {icon !== false && <ArrowRight aria-hidden className="size-4" />}
        </>
      ) : (
        children
      )}
    </BronzeButton>
  );
}
