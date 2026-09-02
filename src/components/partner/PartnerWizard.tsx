'use client';

import { Fragment, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { BronzeButton } from '@/components/ui/BronzeButton';
import { Field, Select, inputCls } from '@/components/lead/fields';
import { cn } from '@/lib/utils';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;

type Status = 'idle' | 'sending' | 'success' | 'error';
type Option = { key: string; label: string };

export interface PartnerWizardCopy {
  stepLabels: [string, string, string];
  tradesTitle: string;
  tradesHint: string;
  projectTitle: string;
  objectType: string;
  objectTypePlaceholder: string;
  volume: string;
  volumePlaceholder: string;
  start: string;
  startPlaceholder: string;
  location: string;
  locationPlaceholder: string;
  message: string;
  messagePlaceholder: string;
  contactTitle: string;
  company: string;
  companyPlaceholder: string;
  name: string;
  namePlaceholder: string;
  phone: string;
  phonePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  summaryTitle: string;
  summaryEmpty: string;
  back: string;
  next: string;
  submit: string;
  submitting: string;
  successTitle: string;
  successText: string;
  errorText: string;
  privacyNote: string;
  privacyLinkLabel: string;
}

const toSelectOptions = (list: Option[]) =>
  list.map((o) => ({ value: o.key, label: o.label }));

/**
 * 3-step B2B project-request wizard for general contractors:
 * trades (multi-select) -> project facts -> contact, ending in a lead submit
 * to /api/lead. A live summary panel mirrors the choices as they are made.
 * All copy comes in via props; parent translates on the server.
 */
export function PartnerWizard({
  trades,
  objectTypes,
  volumes,
  starts,
  copy,
  className,
}: {
  trades: Option[];
  objectTypes: Option[];
  volumes: Option[];
  starts: Option[];
  copy: PartnerWizardCopy;
  className?: string;
}) {
  const reduce = useReducedMotion() ?? false;
  const locale = useLocale();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [objectType, setObjectType] = useState('');
  const [volume, setVolume] = useState('');
  const [start, setStart] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [hp, setHp] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  /* Derived labels (prop order is kept so the summary reads like the list) */
  const chosenTrades = trades.filter((t) => selectedTrades.includes(t.key));
  const objectTypeLabel = objectTypes.find((o) => o.key === objectType)?.label ?? '';
  const volumeLabel = volumes.find((o) => o.key === volume)?.label ?? '';
  const startLabel = starts.find((o) => o.key === start)?.label ?? '';
  const locationValue = location.trim();

  const summaryLines = [
    { key: 'objectType', label: copy.objectType, value: objectTypeLabel },
    { key: 'volume', label: copy.volume, value: volumeLabel },
    { key: 'start', label: copy.start, value: startLabel },
    { key: 'location', label: copy.location, value: locationValue },
  ].filter((l) => l.value !== '');
  const summaryEmpty = chosenTrades.length === 0 && summaryLines.length === 0;
  const compactSummary = [
    ...chosenTrades.map((t) => t.label),
    ...summaryLines.map((l) => l.value),
  ].join(' · ');

  const canLeaveStep = step !== 0 || selectedTrades.length > 0;

  const toggleTrade = (key: string) =>
    setSelectedTrades((list) =>
      list.includes(key) ? list.filter((k) => k !== key) : [...list, key],
    );

  const goBack = () => {
    if (step === 0 || status === 'sending') return;
    setDir(-1);
    setStep((s) => s - 1);
  };
  const goNext = () => {
    if (step >= 2 || !canLeaveStep) return;
    setDir(1);
    setStep((s) => s + 1);
  };

  async function send() {
    setStatus('sending');
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formType: 'partner',
          website: hp,
          locale,
          page: typeof window !== 'undefined' ? window.location.pathname : undefined,
          formData: {
            company,
            name,
            phone,
            email,
            message,
            service: 'Generalunternehmer',
            context: 'GU-Partneranfrage',
            trades: chosenTrades.map((t) => t.label).join(', '),
            objectType: objectTypeLabel,
            volume: volumeLabel,
            start: startLabel,
            location: locationValue,
          },
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  /* Enter inside a field on steps 1-2 advances instead of submitting. */
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step < 2) {
      goNext();
      return;
    }
    if (status === 'sending') return;
    void send();
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

  const summaryKicker = (
    <p className="font-mono text-[0.62rem] tracking-[0.28em] text-sand-500 uppercase">
      {copy.summaryTitle}
    </p>
  );

  return (
    <form
      onSubmit={onSubmit}
      className={cn('card-luxe relative rounded-sm p-5 sm:p-6 lg:p-8', className)}
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

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr] lg:gap-10">
        {/* ── Left column: stepper + step content ── */}
        <div className="min-w-0">
          {/* Step indicator: numbered squares joined by hairlines */}
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

          {/* Compact summary line (mobile / tablet only) */}
          <div className="mt-4 rounded-sm border border-sand-50/10 bg-ink-950/40 px-3.5 py-2.5 lg:hidden">
            {summaryKicker}
            <p
              className={cn(
                'mt-1 line-clamp-2 font-mono text-xs leading-relaxed',
                summaryEmpty ? 'text-sand-500' : 'text-bronze-300',
              )}
            >
              {summaryEmpty ? copy.summaryEmpty : compactSummary}
            </p>
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
                    <legend className="p-0 font-display text-xl text-sand-50">
                      {copy.tradesTitle}
                    </legend>
                    <p className="mt-1 mb-4 text-sm text-sand-400">{copy.tradesHint}</p>
                    <div className="flex flex-wrap gap-2">
                      {trades.map((t) => {
                        const selected = selectedTrades.includes(t.key);
                        return (
                          <button
                            key={t.key}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => toggleTrade(t.key)}
                            className={cn(
                              'flex min-h-11 cursor-pointer items-center gap-2.5 rounded-sm border px-3.5 py-2 text-start text-sm leading-snug transition-colors duration-300',
                              selected
                                ? 'border-bronze-500 bg-bronze-500 font-medium text-ink-950'
                                : 'border-sand-50/15 bg-ink-950/40 text-sand-300 hover:border-bronze-500/50 hover:text-sand-50',
                            )}
                          >
                            {/* Fixed-size check slot keeps the chip width stable */}
                            <span
                              aria-hidden
                              className={cn(
                                'flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors duration-300',
                                selected ? 'border-ink-950/40' : 'border-sand-50/25',
                              )}
                            >
                              <AnimatePresence initial={false}>
                                {selected && (
                                  <motion.span
                                    key="check"
                                    className="flex"
                                    initial={reduce ? { opacity: 0 } : { scale: 0, opacity: 0 }}
                                    animate={reduce ? { opacity: 1 } : { scale: 1, opacity: 1 }}
                                    exit={reduce ? { opacity: 0 } : { scale: 0, opacity: 0 }}
                                    transition={
                                      reduce
                                        ? { duration: 0.15 }
                                        : { type: 'spring', stiffness: 420, damping: 20 }
                                    }
                                  >
                                    <Check className="size-3.5" strokeWidth={3} />
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </span>
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                )}

                {step === 1 && (
                  <div className="space-y-4">
                    <h3 className="font-display text-xl text-sand-50">{copy.projectTitle}</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field id="pw-object-type" label={copy.objectType}>
                        <Select
                          id="pw-object-type"
                          value={objectType}
                          onChange={setObjectType}
                          placeholder={copy.objectTypePlaceholder}
                          options={toSelectOptions(objectTypes)}
                        />
                      </Field>
                      <Field id="pw-volume" label={copy.volume}>
                        <Select
                          id="pw-volume"
                          value={volume}
                          onChange={setVolume}
                          placeholder={copy.volumePlaceholder}
                          options={toSelectOptions(volumes)}
                        />
                      </Field>
                      <Field id="pw-start" label={copy.start}>
                        <Select
                          id="pw-start"
                          value={start}
                          onChange={setStart}
                          placeholder={copy.startPlaceholder}
                          options={toSelectOptions(starts)}
                        />
                      </Field>
                      <Field id="pw-location" label={copy.location}>
                        <input
                          id="pw-location"
                          type="text"
                          autoComplete="postal-code"
                          placeholder={copy.locationPlaceholder}
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className={inputCls}
                        />
                      </Field>
                      <div className="sm:col-span-2">
                        <Field id="pw-message" label={copy.message}>
                          <textarea
                            id="pw-message"
                            rows={3}
                            placeholder={copy.messagePlaceholder}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className={cn(inputCls, 'min-h-24 resize-y')}
                          />
                        </Field>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <h3 className="font-display text-xl text-sand-50">{copy.contactTitle}</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Field id="pw-company" label={copy.company} required>
                          <input
                            id="pw-company"
                            type="text"
                            required
                            autoComplete="organization"
                            placeholder={copy.companyPlaceholder}
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            className={inputCls}
                          />
                        </Field>
                      </div>
                      <Field id="pw-name" label={copy.name} required>
                        <input
                          id="pw-name"
                          type="text"
                          required
                          autoComplete="name"
                          placeholder={copy.namePlaceholder}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={inputCls}
                        />
                      </Field>
                      <Field id="pw-phone" label={copy.phone} required>
                        <input
                          id="pw-phone"
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
                      <div className="sm:col-span-2">
                        <Field id="pw-email" label={copy.email} required>
                          <input
                            id="pw-email"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            required
                            placeholder={copy.emailPlaceholder}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={inputCls}
                            dir="ltr"
                          />
                        </Field>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Back / Next controls ── */}
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
            <BronzeButton
              variant="ghost"
              onClick={goBack}
              disabled={step === 0 || status === 'sending'}
            >
              <ArrowLeft aria-hidden className="size-4" />
              {copy.back}
            </BronzeButton>
            {step < 2 ? (
              <BronzeButton onClick={goNext} disabled={!canLeaveStep}>
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
        </div>

        {/* ── Right column: live summary (desktop) ── */}
        <aside className="hidden min-w-0 lg:block">
          <div className="glass-soft rounded-sm p-5 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
            {summaryKicker}

            {summaryEmpty ? (
              <p className="mt-3 text-sm leading-relaxed text-sand-500">{copy.summaryEmpty}</p>
            ) : (
              <>
                {chosenTrades.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    <AnimatePresence initial={false}>
                      {chosenTrades.map((t) => (
                        <motion.li
                          key={t.key}
                          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
                          transition={{ duration: 0.25, ease: EASE_LUXE }}
                          className="rounded-sm border border-bronze-500/45 bg-bronze-500/12 px-2 py-1 text-xs leading-snug text-bronze-300"
                        >
                          {t.label}
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}

                {summaryLines.length > 0 && (
                  <dl
                    className={cn(
                      'space-y-2.5',
                      chosenTrades.length > 0 ? 'hairline mt-4 border-t pt-4' : 'mt-3',
                    )}
                  >
                    {summaryLines.map((l) => (
                      <div key={l.key} className="min-w-0">
                        <dt className="text-[0.7rem] tracking-[0.12em] text-sand-500 uppercase">
                          {l.label}
                        </dt>
                        <dd className="mt-0.5 text-sm leading-snug break-words text-sand-50">
                          {l.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </>
            )}
          </div>
        </aside>
      </div>
    </form>
  );
}
