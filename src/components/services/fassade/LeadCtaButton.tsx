'use client';

import { ArrowRight } from 'lucide-react';
import { BronzeButton } from '@/components/ui/BronzeButton';
import { useLeadModal, type LeadType } from '@/components/lead/LeadModalContext';

/**
 * Small client CTA for server-rendered service sections: the label is
 * translated in the parent server component and passed down; clicking opens
 * the shared lead modal with the given type + context.
 */
export function LeadCtaButton({
  label,
  type = 'consultation',
  context,
  className,
}: {
  label: string;
  type?: LeadType;
  context?: string;
  className?: string;
}) {
  const { open } = useLeadModal();
  return (
    <BronzeButton onClick={() => open(type, context)} className={className}>
      {label}
      <ArrowRight aria-hidden className="size-4" />
    </BronzeButton>
  );
}
