import type { DrawIconSpec } from '@/components/ui/DrawIcon';

/**
 * Shared 48×48 gold line-art icon set for the service landings, consumed by
 * `DrawIcon`. Kept as plain data so server pages can pass specs to client
 * components as props.
 */
export const STROKE_ICONS = {
  /** Key — turnkey handover. */
  key: {
    paths: [
      { d: 'M20 24 a6 6 0 1 1 -12 0 a6 6 0 1 1 12 0' },
      { d: 'M20 24 H40', delay: 0.25 },
      { d: 'M34 24 V30 M40 24 V32', delay: 0.45, width: 1.8 },
    ],
  },
  /** Shield with a check — quality guarantee. */
  shieldCheck: {
    paths: [
      { d: 'M24 6 L38 11 V24 C38 34 31 40 24 42 C17 40 10 34 10 24 V11 Z' },
      { d: 'M17 24 L22 29 L31 18', delay: 0.4, width: 2.4 },
    ],
  },
  /** Gear — service & maintenance. */
  gear: {
    paths: [
      { d: 'M31 24 a7 7 0 1 1 -14 0 a7 7 0 1 1 14 0' },
      { d: 'M24 9 V14 M24 34 V39 M9 24 H14 M34 24 H39', delay: 0.3, width: 1.8 },
      {
        d: 'M13.5 13.5 L17 17 M31 31 L34.5 34.5 M34.5 13.5 L31 17 M17 31 L13.5 34.5',
        delay: 0.5,
        width: 1.8,
      },
    ],
  },
  /** Coin stack — effective costs. */
  coins: {
    paths: [
      { d: 'M12 14 a12 5 0 1 1 24 0 a12 5 0 1 1 -24 0' },
      { d: 'M12 14 V34 M36 14 V34', delay: 0.25 },
      { d: 'M12 34 a12 5 0 0 0 24 0', delay: 0.4 },
      { d: 'M12 24 a12 5 0 0 0 24 0', delay: 0.55, width: 1.5 },
    ],
  },
  /** Speech bubble — communication. */
  chat: {
    paths: [
      { d: 'M10 10 H38 V30 H22 L14 38 V30 H10 Z' },
      { d: 'M17 20 h2 M23 20 h2 M29 20 h2', delay: 0.45, width: 2.4 },
    ],
  },
  /** Drafting sheet — design & estimate. */
  draft: {
    paths: [
      { d: 'M12 6 H30 L36 12 V42 H12 Z' },
      { d: 'M30 6 V12 H36', delay: 0.3 },
      { d: 'M17 20 H31 M17 26 H31 M17 32 H26', delay: 0.45, width: 1.5 },
    ],
  },
  /** Tower crane — execution phase. */
  crane: {
    paths: [
      { d: 'M14 42 V12 M10 42 H18' },
      { d: 'M14 12 H40 M14 12 L8 18', delay: 0.3 },
      { d: 'M34 12 V24', delay: 0.55, dashed: true, width: 1.5 },
      { d: 'M31 24 H37 V29 H31 Z', delay: 0.7, width: 1.8 },
    ],
  },
  /** Roof + key — handover. */
  keyHandover: {
    paths: [
      { d: 'M8 22 L24 8 L40 22' },
      { d: 'M20 32 a4 4 0 1 1 -8 0 a4 4 0 1 1 8 0', delay: 0.3 },
      { d: 'M20 32 H36 M31 32 V36 M36 32 V35', delay: 0.5, width: 1.8 },
    ],
  },
  /** Magnifier over a crack — assessment. */
  magnifier: {
    paths: [
      { d: 'M30 20 a10 10 0 1 1 -20 0 a10 10 0 1 1 20 0' },
      { d: 'M27 28 L40 41', delay: 0.3, width: 2.4 },
      { d: 'M15 24 l3 -5 l2 3 l4 -7', delay: 0.5, width: 1.5 },
    ],
  },
  /** Document with sum — transparent offer. */
  docEuro: {
    paths: [
      { d: 'M12 6 H36 V42 H12 Z' },
      { d: 'M17 14 H31 M17 20 H31', delay: 0.3, width: 1.5 },
      { d: 'M31 29 a6 6 0 1 0 0 9', delay: 0.5 },
      { d: 'M21 31.5 h8 M21 34.5 h7', delay: 0.7, width: 1.5 },
    ],
  },
  /** Scaffolding — site work. */
  scaffold: {
    paths: [
      { d: 'M12 42 V10 M36 42 V10' },
      { d: 'M12 16 H36 M12 28 H36 M12 40 H36', delay: 0.3, width: 1.5 },
      { d: 'M12 28 L36 16 M12 40 L36 28', delay: 0.55, width: 1.2 },
    ],
  },
  /** Seal with check — acceptance. */
  checkSeal: {
    paths: [
      { d: 'M38 24 a14 14 0 1 1 -28 0 a14 14 0 1 1 28 0' },
      { d: 'M17 24 L22 29 L31 18', delay: 0.35, width: 2.4 },
      { d: 'M24 4 V8 M24 40 V44 M4 24 H8 M40 24 H44', delay: 0.55, width: 1.5 },
    ],
  },
  /** Hard hat — experienced team. */
  helmet: {
    paths: [
      { d: 'M10 30 a14 14 0 0 1 28 0' },
      { d: 'M6 30 H42', delay: 0.3 },
      { d: 'M24 12 V20', delay: 0.5, width: 1.8 },
    ],
  },
  /** Material slabs — careful selection. */
  materials: {
    paths: [
      { d: 'M8 38 l10 -5 h22 l-10 5 Z' },
      { d: 'M8 31 l10 -5 h22 l-10 5 Z', delay: 0.25 },
      { d: 'M8 24 l10 -5 h22 l-10 5 Z', delay: 0.5 },
    ],
  },
  /** Stacked planes — full scope. */
  layers: {
    paths: [
      { d: 'M24 8 L40 17 L24 26 L8 17 Z' },
      { d: 'M8 24 l16 9 l16 -9', delay: 0.3 },
      { d: 'M8 31 l16 9 l16 -9', delay: 0.55 },
    ],
  },
  /** Eye — visualization before work starts. */
  eye: {
    paths: [
      { d: 'M6 24 C12 14 36 14 42 24 C36 34 12 34 6 24 Z' },
      { d: 'M29 24 a5 5 0 1 1 -10 0 a5 5 0 1 1 10 0', delay: 0.35 },
    ],
  },
  /** Bulb — guidance. */
  bulb: {
    paths: [
      {
        d: 'M24 6 a10 10 0 0 1 6 18 c-2 2 -2 3 -2 5 h-8 c0 -2 0 -3 -2 -5 a10 10 0 0 1 6 -18 Z',
      },
      { d: 'M20 34 h8 M21 38 h6', delay: 0.35, width: 1.8 },
      { d: 'M10 10 l3 3 M38 10 l-3 3', delay: 0.55, width: 1.5 },
    ],
  },
  /** Stopwatch — speed / on-time delivery. */
  clock: {
    paths: [
      { d: 'M37 27 a13 13 0 1 1 -26 0 a13 13 0 1 1 26 0' },
      { d: 'M24 14 V8 M20 8 H28', delay: 0.3, width: 1.8 },
      { d: 'M24 27 L31 20', delay: 0.5, width: 2.2 },
      { d: 'M36 12 l3 3', delay: 0.6, width: 1.5 },
    ],
  },
  /** Overlapping frames — matching the original look. */
  frames: {
    paths: [
      { d: 'M10 14 H30 V34 H10 Z' },
      { d: 'M18 10 H38 V30 H18 Z', delay: 0.3, dashed: true, width: 1.5 },
    ],
  },
} satisfies Record<string, DrawIconSpec>;

export type StrokeIconName = keyof typeof STROKE_ICONS;
