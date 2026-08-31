'use client';

import { motion, useReducedMotion } from 'motion/react';
import { site } from '@/lib/site';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;

/** Emblem path extracted from public/logo.svg (viewBox 7 19 291 382). */
const EMBLEM_D =
  'M124.21,399.81 L123.98,399.62 L124.02,394.88 C124.04,392.27 124.15,379.40 124.27,366.28 C124.39,353.16 124.45,342.29 124.41,342.13 C124.23,341.48 123.94,341.33 121.82,340.85 C90.94,333.86 63.81,318.19 43.46,295.62 C29.35,279.96 19.11,261.52 13.34,241.41 C8.67,225.14 7.10,208.72 8.54,191.15 C10.94,161.90 21.90,133.01 38.91,111.10 C45.30,102.86 52.91,95.13 60.91,88.76 C78.27,74.92 99.02,66.19 122.46,62.85 C123.72,62.67 123.98,62.57 124.26,62.19 C124.50,61.87 124.50,63.31 124.23,41.01 C123.96,19.52 123.97,20.43 124.18,20.19 C124.36,20.00 124.47,20.00 134.75,20.02 L145.13,20.05 L145.36,20.27 L145.58,20.50 L145.58,42.79 C145.58,64.73 145.58,65.08 145.77,65.21 C145.93,65.33 146.67,65.35 150.04,65.35 C159.52,65.35 168.48,66.01 175.72,67.22 C181.24,68.15 189.40,69.93 194.22,71.24 C220.98,78.56 244.52,94.06 262.07,115.91 C286.35,146.16 297.16,186.09 291.64,225.22 C287.39,255.42 274.47,281.62 251.50,306.64 C246.74,311.82 243.12,315.40 239.99,318.01 C228.53,327.55 212.39,336.15 198.25,340.27 C185.70,343.91 170.25,344.98 149.11,343.65 C146.00,343.45 145.97,343.45 145.82,343.64 C145.68,343.81 145.65,344.96 145.59,354.61 C145.52,365.24 145.45,372.13 145.23,390.33 L145.12,399.56 L144.88,399.78 L144.64,400.00 L134.54,400.00 C124.75,400.00 124.44,399.99 124.21,399.81 Z M166.64,336.45 C173.15,336.01 180.16,335.17 184.23,334.33 C198.70,331.33 210.89,323.21 219.03,311.15 C227.00,299.33 230.51,284.62 228.87,269.88 C227.27,255.57 220.97,242.20 210.84,231.63 C207.36,228.00 203.63,224.74 199.18,221.43 C194.26,217.78 189.62,214.76 178.56,208.04 C171.66,203.84 171.01,203.42 170.87,203.13 C170.61,202.55 170.82,201.99 171.40,201.75 C171.66,201.64 172.04,201.63 173.42,201.71 C185.37,202.37 198.08,206.61 210.57,214.10 C223.58,221.91 235.14,233.13 241.96,244.59 C246.64,252.43 249.08,259.54 249.97,267.85 C250.40,271.84 250.42,272.47 250.42,282.42 L250.42,292.01 L250.64,292.23 C251.05,292.65 251.40,292.53 252.18,291.71 C256.57,287.13 261.32,280.69 264.90,274.49 C279.65,248.96 285.93,219.30 282.71,190.32 C278.63,153.53 259.86,120.29 231.12,98.93 C214.57,86.63 195.29,78.63 174.54,75.47 C169.91,74.77 166.87,74.49 161.63,74.29 C158.14,74.16 146.05,73.97 145.82,74.04 C145.63,74.10 145.63,75.96 145.63,204.94 L145.63,335.79 L145.87,335.97 C146.14,336.19 146.42,336.22 149.80,336.44 C153.35,336.66 153.25,336.66 158.98,336.63 C162.46,336.61 165.14,336.55 166.64,336.45 Z M123.87,333.22 C124.02,333.11 124.04,332.14 124.13,319.45 C124.52,264.08 124.51,188.74 124.11,134.80 C123.95,113.04 123.95,90.90 124.10,86.80 C124.17,85.07 124.28,82.32 124.34,80.68 L124.46,77.69 L124.18,77.45 C123.81,77.14 123.86,77.13 119.86,78.45 C110.17,81.67 101.67,85.54 93.40,90.48 C70.44,104.22 52.90,124.68 42.19,150.22 C35.73,165.62 32.02,182.21 30.85,200.87 C30.69,203.45 30.70,212.33 30.86,214.96 C32.05,234.38 36.66,252.00 44.94,268.70 C60.68,300.46 87.06,323.12 118.73,332.07 C120.44,332.55 123.40,333.32 123.60,333.34 C123.65,333.34 123.78,333.29 123.87,333.22 Z';

/**
 * The official company stamp, redrawn in the site's line language: double
 * bronze frame, emblem watermark, registration data. Settles in with a short
 * "pressed on" motion (scale down + slight tilt); plain fade under reduced
 * motion.
 */
export function CompanySeal({ caption }: { caption: string }) {
  const reduce = useReducedMotion() ?? false;

  return (
    <figure className="w-full max-w-sm">
      <motion.div
        className="rounded-sm border-2 border-bronze-500/70 p-1.5"
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.12, rotate: -7 }}
        whileInView={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: -2 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.55, ease: EASE_LUXE }}
      >
        <div className="relative overflow-hidden rounded-[2px] border border-bronze-500/45 px-7 py-6 text-center sm:px-9 sm:py-7">
          {/* Emblem watermark */}
          <svg
            aria-hidden
            viewBox="7 19 291 382"
            className="pointer-events-none absolute top-1/2 left-1/2 h-[135%] w-auto -translate-x-1/2 -translate-y-1/2 text-bronze-500 opacity-[0.09]"
          >
            <path d={EMBLEM_D} fill="currentColor" fillRule="evenodd" />
          </svg>

          <p className="font-display text-xl font-semibold tracking-[0.16em] text-bronze-300 sm:text-2xl">
            QUALITY BUILD
          </p>
          <p className="mt-1 text-[0.68rem] font-medium tracking-[0.28em] uppercase text-bronze-400">
            &amp; Management Sp. z o.o.
          </p>

          <span aria-hidden className="mx-auto mt-4 block h-px w-24 bg-bronze-500/50" />

          <p className="mt-4 text-[0.8rem] leading-relaxed text-sand-300">
            {site.address.street} · {site.address.zip} {site.address.city}
          </p>
          <p className="tnum mt-1.5 text-[0.8rem] text-sand-300">
            NIP {site.nip} · REGON {site.regon}
          </p>
          <p className="mt-1.5 text-[0.72rem] tracking-[0.18em] uppercase text-bronze-400">
            {site.email}
          </p>
        </div>
      </motion.div>
      <figcaption className="sr-only">{caption}</figcaption>
    </figure>
  );
}
