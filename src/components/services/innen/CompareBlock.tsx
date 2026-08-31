'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion, type Variants } from 'motion/react';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as const;

export interface CompareRow {
  key: string;
  aspect: string;
  diy: string;
  pro: string;
}

/** Small self-drawing cross / check marks for the comparison cells. */
function Mark({ kind, delay }: { kind: 'x' | 'check'; delay: number }) {
  const reduce = useReducedMotion() ?? false;
  const d = kind === 'x' ? ['M5 5 L15 15', 'M15 5 L5 15'] : ['M4 11 L8.5 15.5 L16 5.5'];
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-full border',
        kind === 'x'
          ? 'border-red-400/30 bg-red-400/10 text-red-300/90'
          : 'border-bronze-500/40 bg-bronze-500/15 text-bronze-300',
      )}
    >
      <svg viewBox="0 0 20 20" className="size-3.5">
        {d.map((path, i) => (
          <motion.path
            key={path}
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={
              reduce
                ? { duration: 0 }
                : { duration: 0.45, delay: delay + i * 0.12, ease: EASE }
            }
          />
        ))}
      </svg>
    </span>
  );
}

/**
 * "DIY vs. professionals" comparison. Desktop: a three-column ledger with
 * hairline rows; the DIY column carries drawing red crosses, ours bronze
 * checks. Mobile: one card per aspect with both verdicts stacked.
 */
export function CompareBlock({
  rows,
  diyHead,
  proHead,
  aspectHead,
}: {
  rows: CompareRow[];
  diyHead: string;
  proHead: string;
  aspectHead: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const reduce = useReducedMotion();

  const list: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 22 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
  };

  return (
    <div ref={ref}>
      {/* Desktop ledger */}
      <motion.div
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        variants={list}
        className="hairline hidden border-t md:block"
        role="table"
        aria-label={`${diyHead} / ${proHead}`}
      >
        <motion.div
          variants={item}
          role="row"
          className="grid grid-cols-[1fr_1.4fr_1.4fr] gap-6 py-4"
        >
          <span role="columnheader" className="text-[0.72rem] font-medium tracking-[0.24em] uppercase text-sand-500">
            {aspectHead}
          </span>
          <span role="columnheader" className="text-[0.72rem] font-medium tracking-[0.24em] uppercase text-red-300/80">
            {diyHead}
          </span>
          <span role="columnheader" className="text-[0.72rem] font-medium tracking-[0.24em] uppercase text-bronze-400">
            {proHead}
          </span>
        </motion.div>
        {rows.map((row, i) => (
          <motion.div
            key={row.key}
            variants={item}
            role="row"
            className="hairline grid grid-cols-[1fr_1.4fr_1.4fr] gap-6 border-t py-6"
          >
            <span role="cell" className="font-display text-lg leading-snug font-semibold text-sand-50">
              {row.aspect}
            </span>
            <span role="cell" className="flex items-start gap-3.5">
              <Mark kind="x" delay={0.3 + i * 0.12} />
              <span className="text-sm leading-relaxed text-sand-400">{row.diy}</span>
            </span>
            <span role="cell" className="flex items-start gap-3.5">
              <Mark kind="check" delay={0.45 + i * 0.12} />
              <span className="text-sm leading-relaxed text-sand-300">{row.pro}</span>
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* Mobile cards */}
      <motion.div
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        variants={list}
        className="space-y-4 md:hidden"
      >
        {rows.map((row, i) => (
          <motion.article key={row.key} variants={item} className="card-luxe rounded-sm p-5">
            <h3 className="font-display text-lg leading-snug font-semibold">{row.aspect}</h3>
            <div className="mt-4 space-y-3.5">
              <p className="flex items-start gap-3">
                <Mark kind="x" delay={0.2 + i * 0.08} />
                <span className="text-sm leading-relaxed text-sand-400">{row.diy}</span>
              </p>
              <p className="flex items-start gap-3">
                <Mark kind="check" delay={0.35 + i * 0.08} />
                <span className="text-sm leading-relaxed text-sand-300">{row.pro}</span>
              </p>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </div>
  );
}
