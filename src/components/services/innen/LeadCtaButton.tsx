'use client';

import { ArrowRight } from 'lucide-react';
import { BronzeButton } from '@/components/ui/BronzeButton';
import { useLeadModal, type LeadType } from '@/components/lead/LeadModalContext';

/**
 * Small client bridge so server-rendered sections can open the lead modal.
 * The label is translated server-side and passed down as a plain string.
 */
export function LeadCtaButton({
  label,
  context,
  type = 'consultation',
  variant = 'solid',
  className,
}: {
  label: string;
  context?: string;
  type?: LeadType;
  variant?: 'solid' | 'outline' | 'ghost';
  className?: string;
}) {
  const { open } = useLeadModal();
  return (
    <BronzeButton
      variant={variant}
      className={className}
      onClick={() => open(type, context)}
    >
      {label}
      <ArrowRight aria-hidden className="size-4" />
    </BronzeButton>
  );
}
