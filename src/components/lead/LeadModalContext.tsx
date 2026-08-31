'use client';

import { createContext, useCallback, useContext, useState } from 'react';

export type LeadType = 'consultation' | 'contact' | 'callback' | 'visit';

interface LeadModalState {
  open: (type: LeadType, context?: string) => void;
  close: () => void;
  current: { type: LeadType; context?: string } | null;
}

const Ctx = createContext<LeadModalState | null>(null);

export function LeadModalProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<LeadModalState['current']>(null);
  const open = useCallback(
    (type: LeadType, context?: string) => setCurrent({ type, context }),
    [],
  );
  const close = useCallback(() => setCurrent(null), []);
  return <Ctx.Provider value={{ open, close, current }}>{children}</Ctx.Provider>;
}

export function useLeadModal(): LeadModalState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLeadModal must be used within LeadModalProvider');
  return ctx;
}
