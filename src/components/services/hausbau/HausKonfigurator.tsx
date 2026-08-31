'use client';

import { Fragment, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { BronzeButton } from '@/components/ui/BronzeButton';
import { Field, inputCls } from '@/components/lead/fields';
import { cn } from '@/lib/utils';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;

const AREA_MIN = 60;
const AREA_MAX = 400;
const AREA_STEP = 10;
const AREA_DEFAULT = 140;

type Status = 'idle' | 'sending' | 'success' | 'error';

export interface HausKonfiguratorCopy {
  stepLabels: [string, string, string];
  styleTitle: string;
  areaTitle: string;
  areaUnit: string;
  contactTitle: string;
  name: string;
  namePlaceholder: string;
  phone: string;
  phonePlaceholder: string;
  back: string;
  next: string;
  submit: string;
  submitting: string;
  successTitle: string;
  successText: string;
  errorText: string;
  privacyNote: string;
  privacyLinkLabel: string;
  summaryTitle: string;
}

/**
 * 3-step Hausbau mini-wizard ("plan your house in 60 seconds"):
 * style -> living area -> contact, ending in a lead submit to /api/lead.
 * All copy comes in via props; parent translates on the server.
 */
export function HausKonfigurator({
  styles,
  copy,
  className,
}: {
  styles: { key: string; label: string }[];
  copy: HausKonfiguratorCopy;
  className?: string;
}) {
  const reduce = useReducedMotion() ?? false;
  const locale = useLocale();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [styleKey, setStyleKey] = useState<string | null>(null);
  const [area, setArea] = useState(AREA_DEFAULT);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [hp, setHp] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const styleLabel = styles.find((s) => s.key === styleKey)?.label ?? '';

  const goBack = () => {
    if (step === 0) return;
    setDir(-1);
    setStep((s) => s - 1);
  };
  const goNext = () => {
    if (step >= 2 || (step === 0 && !styleKey)) return;
    setDir(1);
    setStep((s) => s + 1);
  };

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step !== 2 || status === 'sending') return;
    setStatus('sending');
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formType: 'consultation',
          website: hp,
          locale,
          page: typeof window !== 'undefined' ? window.location.pathname : undefined,
          formData: {
            name,
            phone,
            message: `Konfigurator: ${styleLabel}, ~${area} ${copy.areaUnit}`,
            service: 'Hausbau',
            context: 'Haus-Konfigurator',
          },
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  /* Step content slides in from the travel direction; reduced motion keeps
     the crossfade only (no transforms). */
  const variants = {
    enter: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * 24 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * -24 }),
  };

  const squareCls = (i: number) =>
    cn(
      'tnum flex size-9 shrink-0 items-center justify-center rounded-sm border font-display text-xs transition-colors duration-500',
      i < step && 'border-bronze-500 bg-bronze-500 text-ink-950',
      i === step && 'border-bronze-400 text-bronze-300',
      i > step && 'border-sand-50/15 text-sand-500',
    );

  if (status === 'success') {
    return (
      <div className={cn('card-luxe rounded-sm p-5 sm:p-6 lg:p-8', className)}>
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: EASE_LUXE }}
          role="status"
          className="flex flex-col items-center gap-4 py-10 text-center"
        >
          <motion.span
            initial={reduce ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { scale: 1, opacity: 1 }}
            transition={
              reduce
                ? { duration: 0.3 }
                : { type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }
            }
          >
            <CheckCircle2 className="size-12 text-bronze-400" aria-hidden />
          </motion.span>
          <p
            tabIndex={-1}
            ref={(el) => {
              // move keyboard focus off the just-unmounted submit button
              el?.focus({ preventScroll: true });
            }}
            className="font-display text-xl text-sand-50 outline-none"
          >
            {copy.successTitle}
          </p>
          <p className="max-w-sm text-sand-300">{copy.successText}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className={cn('card-luxe rounded-sm p-5 sm:p-6 lg:p-8', className)}
    >
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

      {/* ── Step indicator: numbered squares joined by hairlines ── */}
      <div aria-hidden className="flex items-center gap-3">
        {([0, 1, 2] as const).map((i) => (
          <Fragment key={i}>
            <span className={squareCls(i)}>0{i + 1}</span>
            {i < 2 && <span className="hairline flex-1 border-t" />}
          </Fragment>
        ))}
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        {copy.stepLabels.map((label, i) => (
          <span
            key={label}
            aria-current={i === step ? 'step' : undefined}
            className={cn(
              'min-w-0 font-mono text-[0.6rem] tracking-[0.2em] uppercase transition-colors duration-500',
              i === 1 && 'text-center',
              i === 2 && 'text-end',
              i === step
                ? 'text-bronze-400'
                : i < step
                  ? 'text-sand-400'
                  : 'text-sand-500/60',
            )}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Thin progress bar */}
      <div className="mt-4 h-0.5 w-full bg-sand-50/10">
        <motion.div
          aria-hidden
          className="h-full w-full origin-left bg-bronze-500"
          initial={false}
          animate={{ scaleX: (step + 1) / 3 }}
          transition={reduce ? { duration: 0 } : { duration: 0.5, ease: EASE_LUXE }}
        />
      </div>

      {/* ── Step content ── */}
      <div className="mt-7 overflow-x-clip">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={step}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: EASE_LUXE }}
          >
            {step === 0 && (
              <fieldset className="m-0 border-0 p-0">
                <legend className="mb-4 p-0 font-display text-xl text-sand-50">
                  {copy.styleTitle}
                </legend>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  {styles.map((s) => {
                    const selected = styleKey === s.key;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setStyleKey(s.key)}
                        className={cn(
                          'min-h-11 cursor-pointer rounded-sm border px-4 py-2 text-sm leading-snug transition-colors duration-300',
                          selected
                            ? 'border-bronze-500 bg-bronze-500 font-medium text-ink-950'
                            : 'border-sand-50/15 bg-ink-950/40 text-sand-300 hover:border-bronze-500/50 hover:text-sand-50',
                        )}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {step === 1 && (
              <div>
                <h3 className="font-display text-xl text-sand-50">{copy.areaTitle}</h3>
                <p className="mt-6 text-center" aria-live="polite">
                  <motion.span
                    key={area}
                    initial={{ scale: 1 }}
                    animate={reduce ? undefined : { scale: [1, 1.06, 1] }}
                    transition={{ duration: 0.35, ease: EASE_LUXE }}
                    className="tnum inline-block font-display text-5xl text-sand-50 sm:text-6xl"
                  >
                    {area}
                    <span className="ms-2 text-2xl text-bronze-400 sm:text-3xl">
                      {copy.areaUnit}
                    </span>
                  </motion.span>
                </p>
                <input
                  id="hk-area"
                  type="range"
                  min={AREA_MIN}
                  max={AREA_MAX}
                  step={AREA_STEP}
                  value={area}
                  onChange={(e) => setArea(Number(e.target.value))}
                  aria-label={copy.areaTitle}
                  aria-valuetext={`${area} ${copy.areaUnit}`}
                  className="mt-5 h-11 w-full cursor-pointer accent-bronze-500"
                />
                <div className="tnum flex justify-between font-mono text-[0.7rem] text-sand-500">
                  <span>{AREA_MIN}</span>
                  <span>{(AREA_MIN + AREA_MAX) / 2}</span>
                  <span>{AREA_MAX}</span>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-display text-xl text-sand-50">{copy.contactTitle}</h3>
                <div className="rounded-sm border border-sand-50/10 bg-ink-950/40 px-3.5 py-2.5">
                  <p className="font-mono text-[0.62rem] tracking-[0.28em] text-sand-500 uppercase">
                    {copy.summaryTitle}
                  </p>
                  <p className="tnum mt-1 font-mono text-sm text-bronze-300">
                    {styleLabel} &middot; ~{area} {copy.areaUnit}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field id="hk-name" label={copy.name} required>
                    <input
                      id="hk-name"
                      required
                      autoComplete="name"
                      placeholder={copy.namePlaceholder}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field id="hk-phone" label={copy.phone} required>
                    <input
                      id="hk-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      required
                      placeholder={copy.phonePlaceholder}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={inputCls}
                      dir="ltr"
                    />
                  </Field>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {status === 'error' && (
          <motion.p
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="mt-4 text-sm text-red-400"
          >
            {copy.errorText}
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Back / Next controls ── */}
      <div className="mt-7 flex items-center justify-between gap-3">
        <BronzeButton
          variant="ghost"
          onClick={goBack}
          disabled={step === 0 || status === 'sending'}
        >
          <ArrowLeft aria-hidden className="size-4" />
          {copy.back}
        </BronzeButton>
        {step < 2 ? (
          <BronzeButton onClick={goNext} disabled={step === 0 && !styleKey}>
            {copy.next}
            <ArrowRight aria-hidden className="size-4" />
          </BronzeButton>
        ) : (
          <BronzeButton type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? copy.submitting : copy.submit}
            <ArrowRight aria-hidden className="size-4" />
          </BronzeButton>
        )}
      </div>

      {step === 2 && (
        <p className="mt-4 text-center text-xs leading-relaxed text-sand-500">
          {copy.privacyNote}{' '}
          <Link
            href="/datenschutz"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors hover:text-bronze-300"
          >
            {copy.privacyLinkLabel}
          </Link>
        </p>
      )}
    </form>
  );
}
