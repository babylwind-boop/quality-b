'use client';

import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const inputCls =
  'w-full min-h-11 rounded-sm border border-sand-50/12 bg-ink-950/55 px-3.5 py-2.5 text-[0.92rem] text-sand-50 placeholder:text-sand-500 transition-colors focus:border-bronze-500/60 focus:outline-none';

export function Field({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[0.83rem] text-sand-300">
        {label} {required && <span className="text-bronze-500">*</span>}
      </label>
      {children}
    </div>
  );
}

/** Styled native select — keyboard/screen-reader friendly out of the box. */
export function Select({
  id,
  value,
  onChange,
  placeholder,
  options,
  required,
  className,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <select
        id={id}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          inputCls,
          'cursor-pointer appearance-none pe-10',
          !value && 'text-sand-500',
        )}
      >
        <option value="" disabled hidden>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-ink-900 text-sand-50">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-sand-500"
      />
    </div>
  );
}
