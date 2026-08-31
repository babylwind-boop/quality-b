'use client';

import { ArrowRight } from 'lucide-react';
import { BronzeButton } from '@/components/ui/BronzeButton';
import { useLeadModal, type LeadType } from '@/components/lead/LeadModalContext';

/**
 * Small client bridge so server-rendered sections can open the lead modal.
 * The label is pre-translated in the parent server component (the
 * `servicePage` namespace is not whitelisted on the client).
 */
export function LeadCtaButton({
  label,
  type = 'consultation',
  context,
  variant = 'solid',
  className,
}: {
  label: string;
  type?: LeadType;
  context?: string;
  variant?: 'solid' | 'outline' | 'ghost';
  className?: string;
}) {
  const { open } = useLeadModal();
  return (
    <BronzeButton variant={variant} className={className} onClick={() => open(type, context)}>
      {label}
      <ArrowRight aria-hidden className="size-5" />
    </BronzeButton>
  );
}
