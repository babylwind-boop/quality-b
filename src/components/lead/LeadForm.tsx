'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { BronzeButton } from '@/components/ui/BronzeButton';
import { SERVICES } from '@/lib/services';
import { cn } from '@/lib/utils';
import type { LeadType } from './LeadModalContext';
import { Field, inputCls, Select } from './fields';

/** Which fields each lead type collects. */
const FIELDSETS: Record<LeadType, string[]> = {
  consultation: ['name', 'phone', 'email', 'service', 'message'],
  contact: ['name', 'phone', 'email', 'message'],
  callback: ['name', 'phone'],
  visit: ['name', 'phone', 'service', 'preferredDate', 'message'],
};

/**
 * Universal lead form with per-type fields and a service select.
 * Posts to /api/lead.
 */
export function LeadForm({
  type,
  context,
  className,
  onSuccess,
}: {
  type: LeadType;
  context?: string;
  className?: string;
  onSuccess?: () => void;
}) {
  const t = useTranslations('common');
  const tf = useTranslations('contactPopup.form');
  const tn = useTranslations('nav');
  const locale = useLocale();
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [fields, setFields] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
    service: '',
    preferredDate: '',
  });
  const [hp, setHp] = useState('');
  const wanted = FIELDSETS[type];
  const has = (f: string) => wanted.includes(f);

  const set = (k: keyof typeof fields) => (v: string) =>
    setFields((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formType: type,
          website: hp,
          locale,
          page: typeof window !== 'undefined' ? window.location.pathname : undefined,
          formData: { ...fields, context },
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus('success');
      onSuccess?.();
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={cn('flex flex-col items-center gap-4 py-10 text-center', className)}
        role="status"
      >
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
        >
          <CheckCircle2 className="size-12 text-bronze-400" aria-hidden />
        </motion.span>
        <p className="font-display text-xl text-sand-50">{tf('successTitle')}</p>
        <p className="max-w-sm text-sand-300">{tf('successMessage')}</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} className={cn('space-y-3', className)}>
      {/* Honeypot — must stay empty */}
      <input
        type="text"
        name="website"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <Field id={`${type}-name`} label={tf('name')} required>
        <input
          id={`${type}-name`}
          required
          autoComplete="name"
          placeholder={tf('namePlaceholder')}
          value={fields.name}
          onChange={(e) => set('name')(e.target.value)}
          className={inputCls}
        />
      </Field>

      {has('phone') && (
        <Field id={`${type}-phone`} label={tf('phone')} required>
          <input
            id={`${type}-phone`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            placeholder={tf('phonePlaceholder')}
            value={fields.phone}
            onChange={(e) => set('phone')(e.target.value)}
            className={inputCls}
            dir="ltr"
          />
        </Field>
      )}

      {has('email') && (
        <Field id={`${type}-email`} label={tf('email')}>
          <input
            id={`${type}-email`}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={tf('emailPlaceholder')}
            value={fields.email}
            onChange={(e) => set('email')(e.target.value)}
            className={inputCls}
            dir="ltr"
          />
        </Field>
      )}

      <div className={cn('grid gap-3', has('service') && has('preferredDate') && 'sm:grid-cols-2')}>
        {has('service') && (
          <Field id={`${type}-service`} label={tf('service')}>
            <Select
              id={`${type}-service`}
              value={fields.service}
              onChange={set('service')}
              placeholder={tf('servicePlaceholder')}
              options={SERVICES.map(({ key }) => ({
                value: tn(`serviceItems.${key}`),
                label: tn(`serviceItems.${key}`),
              }))}
            />
          </Field>
        )}
        {has('preferredDate') && (
          <Field id={`${type}-date`} label={tf('preferredDate')}>
            <input
              id={`${type}-date`}
              type="date"
              value={fields.preferredDate}
              onChange={(e) => set('preferredDate')(e.target.value)}
              className={cn(inputCls, 'cursor-pointer')}
              min={new Date().toISOString().split('T')[0]}
            />
          </Field>
        )}
      </div>

      {has('message') && (
        <Field id={`${type}-message`} label={tf('question')}>
          <textarea
            id={`${type}-message`}
            rows={2}
            placeholder={tf('questionPlaceholder')}
            value={fields.message}
            onChange={(e) => set('message')(e.target.value)}
            className={cn(inputCls, 'min-h-16 resize-y')}
          />
        </Field>
      )}

      <AnimatePresence>
        {status === 'error' && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="text-sm text-red-400"
          >
            {t('error')}
          </motion.p>
        )}
      </AnimatePresence>

      <BronzeButton type="submit" disabled={status === 'sending'} className="w-full">
        {status === 'sending' ? tf('submitting') : tf('submit')}
        <ArrowRight aria-hidden className="size-4" />
      </BronzeButton>
      <p className="text-center text-xs leading-relaxed text-sand-500">
        {t.rich('privacyNote', {
          link: (chunks) => (
            <Link
              href="/datenschutz"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 transition-colors hover:text-bronze-300"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
    </form>
  );
}
