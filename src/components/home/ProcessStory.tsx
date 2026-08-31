'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import type Lenis from 'lenis';
import { motion, useReducedMotion } from 'motion/react';
import { Container } from '@/components/ui/Container';
import { cn } from '@/lib/utils';

const EASE_LUXE = [0.22, 1, 0.36, 1] as const;

export interface StoryStep {
  title: string;
  text: string;
  hud: string;
}

/* ── Isometric helpers ──────────────────────────────────────────────
   Five distinct gold line-art scenes on one plot (viewBox 900×640):
   every step draws its own picture; the previous one un-draws. The
   house itself is built in step 4 and stays for the handover. */
const U = 52;
const CX = 462;
const CY = 376;
const ZS = 0.92;

function iso(x: number, y: number, z: number): [number, number] {
  return [CX + (x - y) * 0.866 * U, CY + (x + y) * 0.5 * U - z * ZS * U];
}
function pts(...list: [number, number, number][]): string {
  return list
    .map(([x, y, z], i) => {
      const [px, py] = iso(x, y, z);
      return `${i === 0 ? 'M' : 'L'}${px.toFixed(1)} ${py.toFixed(1)}`;
    })
    .join(' ');
}
const loop = (...list: [number, number, number][]) => `${pts(...list)} Z`;

interface Stroke {
  d: string;
  /** Step (1–5) this stroke belongs to; 0 = base plot. */
  grp: number;
  /** Extra draw delay within its step, seconds. */
  delay?: number;
  dashed?: boolean;
  /** Structural strokes persist once built (house); others show only in their step. */
  structural?: boolean;
  width?: number;
}

interface HudText {
  x: number;
  y: number;
  t: string;
  grp: number;
  structural?: boolean;
  size?: number;
  bronze?: boolean;
  anchor?: 'start' | 'middle' | 'end';
}

function buildScene(): { strokes: Stroke[]; texts: HudText[] } {
  const strokes: Stroke[] = [];
  const texts: HudText[] = [];
  const H = 2.1; // wall height
  const RZ = 3.3; // ridge height

  /* ── grp 0: plot grid (always) ── */
  strokes.push({ d: loop([-1.6, -1.2, 0], [5.6, -1.2, 0], [5.6, 4.2, 0], [-1.6, 4.2, 0]), grp: 0, structural: true });
  for (let i = 0; i <= 4; i++) {
    strokes.push({ d: pts([-1.6, -0.2 + i * 1.1, 0], [5.6, -0.2 + i * 1.1, 0]), grp: 0, delay: 0.15 + i * 0.05, structural: true, width: 0.5 });
  }
  for (let i = 0; i <= 5; i++) {
    strokes.push({ d: pts([-1.2 + i * 1.35, -1.2, 0], [-1.2 + i * 1.35, 4.2, 0]), grp: 0, delay: 0.2 + i * 0.05, structural: true, width: 0.5 });
  }

  /* ── Scene 1 · Briefing: large brief sheet + pencil over the empty plot ── */
  const dx = 128, dy = 96, dw = 210, dh = 268, fold = 26;
  strokes.push({
    d: `M${dx} ${dy} L${dx + dw - fold} ${dy} L${dx + dw} ${dy + fold} L${dx + dw} ${dy + dh} L${dx} ${dy + dh} Z`,
    grp: 1, width: 1.8,
  });
  strokes.push({ d: `M${dx + dw - fold} ${dy} L${dx + dw - fold} ${dy + fold} L${dx + dw} ${dy + fold}`, grp: 1, delay: 0.2 });
  [0, 1, 2].forEach((i) => {
    strokes.push({ d: `M${dx + 26} ${dy + 48 + i * 26} L${dx + dw - 34} ${dy + 48 + i * 26}`, grp: 1, delay: 0.3 + i * 0.12, width: 1 });
  });
  [0, 1, 2].forEach((i) => {
    const bx = dx + 26, by = dy + 146 + i * 36;
    strokes.push({ d: `M${bx} ${by} h18 v18 h-18 Z`, grp: 1, delay: 0.55 + i * 0.15 });
    strokes.push({ d: `M${bx + 4} ${by + 9} l5 6 l8 -12`, grp: 1, delay: 0.85 + i * 0.2, width: 2.2 });
    strokes.push({ d: `M${bx + 32} ${by + 9} L${dx + dw - 34} ${by + 9}`, grp: 1, delay: 0.65 + i * 0.15, width: 1 });
  });
  // pencil beside the sheet
  strokes.push({ d: `M${dx + dw + 26} ${dy + 60} l26 118 l8 24 l-16 -20 Z`, grp: 1, delay: 0.9, width: 1.4 });
  // leader from sheet to the plot
  {
    const [pcx, pcy] = iso(0, 0, 0);
    strokes.push({ d: `M${dx + dw / 2} ${dy + dh} V${pcy - 22} L${pcx - 10} ${pcy - 6}`, grp: 1, delay: 1.1, dashed: true, width: 1 });
    strokes.push({ d: `M${pcx - 22} ${pcy - 10} L${pcx - 10} ${pcy - 6} L${pcx - 18} ${pcy - 20}`, grp: 1, delay: 1.3, width: 1 });
  }
  // back sheet, signature line and ruler for extra depth
  strokes.push({ d: `M${dx - 16} ${dy + 16} h${dw - 26} v${dh - 30} h-${dw - 26} Z`, grp: 1, delay: 0.1, width: 0.9 });
  strokes.push({ d: `M${dx + 26} ${dy + dh - 26} q 11 -14 22 0 t 22 0 t 22 0`, grp: 1, delay: 1.15, width: 1.2 });
  texts.push({ x: dx, y: dy - 16, t: 'OBJEKT: EFH · NEUBAU', grp: 1 });

  /* ── Scene 2 · Aufmaß: tripod, sight lines, footprint + dimensions ── */
  const apex: [number, number, number] = [5.15, 4.05, 1.15];
  strokes.push({ d: pts(apex, [4.75, 3.65, 0]), grp: 2 });
  strokes.push({ d: pts(apex, [5.6, 3.75, 0]), grp: 2, delay: 0.08 });
  strokes.push({ d: pts(apex, [5.2, 4.55, 0]), grp: 2, delay: 0.16 });
  const [ax, ay] = iso(...apex);
  strokes.push({ d: `M${ax - 8} ${ay - 13} h16 v10 h-16 Z`, grp: 2, delay: 0.25 });
  strokes.push({ d: pts(apex, [0, 3, 0]), grp: 2, delay: 0.5, dashed: true, width: 1 });
  strokes.push({ d: pts(apex, [4, 0, 0]), grp: 2, delay: 0.62, dashed: true, width: 1 });
  strokes.push({ d: loop([0, 0, 0], [4, 0, 0], [4, 3, 0], [0, 3, 0]), grp: 2, delay: 0.75, width: 2 });
  strokes.push({ d: pts([0, 3.6, 0], [4, 3.6, 0]), grp: 2, delay: 1.0, width: 1 });
  strokes.push({ d: pts([0, 3.45, 0], [0, 3.75, 0]), grp: 2, delay: 1.08, width: 1 });
  strokes.push({ d: pts([4, 3.45, 0], [4, 3.75, 0]), grp: 2, delay: 1.14, width: 1 });
  const [d1x, d1y] = iso(2, 3.98, 0);
  texts.push({ x: d1x, y: d1y + 12, t: '12,4 m', grp: 2, anchor: 'middle', bronze: true });
  strokes.push({ d: pts([4.6, 0, 0], [4.6, 3, 0]), grp: 2, delay: 1.2, width: 1 });
  strokes.push({ d: pts([4.45, 0, 0], [4.75, 0, 0]), grp: 2, delay: 1.26, width: 1 });
  strokes.push({ d: pts([4.45, 3, 0], [4.75, 3, 0]), grp: 2, delay: 1.32, width: 1 });
  const [d2x, d2y] = iso(4.95, 1.5, 0);
  texts.push({ x: d2x + 6, y: d2y, t: '9,2 m', grp: 2, bronze: true });
  // survey stakes with flags on three visible corners
  (([[0, 0], [4, 0], [0, 3]]) as [number, number][]).forEach(([x, y], i) => {
    strokes.push({ d: pts([x, y, 0], [x, y, 0.55]), grp: 2, delay: 0.85 + i * 0.08, width: 1.2 });
    const [fx, fy] = iso(x, y, 0.55);
    strokes.push({ d: `M${fx} ${fy} l 12 3 l -12 4 Z`, grp: 2, delay: 0.92 + i * 0.08, width: 1 });
  });
  // diagonal check measure
  strokes.push({ d: pts([0, 0, 0], [4, 3, 0]), grp: 2, delay: 1.35, dashed: true, width: 0.9 });
  // compass rose (screen space, top area)
  strokes.push({ d: 'M118 468 a26 26 0 1 1 -0.1 0', grp: 2, delay: 1.2, width: 1 });
  strokes.push({ d: 'M118 450 v-14 M118 512 v8 M92 494 h-8 M144 494 h8', grp: 2, delay: 1.3, width: 1 });
  strokes.push({ d: 'M118 458 l7 36 l-7 -9 l-7 9 Z', grp: 2, delay: 1.4, width: 1.1 });
  texts.push({ x: 118, y: 434, t: 'N', grp: 2, anchor: 'middle', bronze: true });

  /* ── Scene 3 · Kalkulation: large cost sheet + house ghost on the plot ── */
  const cx0 = 560, cy0 = 72, cw = 226, ch = 292;
  strokes.push({ d: `M${cx0} ${cy0} h${cw} v${ch} h-${cw} Z`, grp: 3, width: 1.8 });
  strokes.push({ d: `M${cx0 + 38} ${cy0 + 110} h150 v-56 h-150 Z`, grp: 3, delay: 0.3 });
  strokes.push({ d: `M${cx0 + 30} ${cy0 + 54} L${cx0 + 113} ${cy0 + 18} L${cx0 + 196} ${cy0 + 54}`, grp: 3, delay: 0.45 });
  strokes.push({ d: `M${cx0 + 98} ${cy0 + 110} v-28 h30 v28`, grp: 3, delay: 0.6, width: 1 });
  [0, 1, 2].forEach((i) => {
    strokes.push({ d: `M${cx0 + 32} ${cy0 + 152 + i * 28} h104`, grp: 3, delay: 0.7 + i * 0.12, width: 1 });
    strokes.push({ d: `M${cx0 + 160} ${cy0 + 152 + i * 28} h34`, grp: 3, delay: 0.76 + i * 0.12, width: 1 });
  });
  strokes.push({ d: `M${cx0 + 32} ${cy0 + 238} h162`, grp: 3, delay: 1.1 });
  texts.push({ x: cx0 + 32, y: cy0 + 266, t: 'Σ FESTPREIS', grp: 3, bronze: true });
  strokes.push({ d: `M${cx0 + 160} ${cy0 + 260} h34`, grp: 3, delay: 1.2, width: 1.8 });
  // ghost of the future house on the plot (dashed)
  strokes.push({ d: loop([0, 0, 0], [4, 0, 0], [4, 3, 0], [0, 3, 0]), grp: 3, delay: 0.5, dashed: true, width: 1 });
  strokes.push({ d: pts([0, 0, 0], [0, 0, H], [0, 1.5, RZ], [0, 3, H], [0, 3, 0]), grp: 3, delay: 0.85, dashed: true, width: 1 });
  strokes.push({ d: pts([4, 0, 0], [4, 0, H], [4, 1.5, RZ], [4, 3, H], [4, 3, 0]), grp: 3, delay: 1.0, dashed: true, width: 1 });
  strokes.push({ d: pts([0, 1.5, RZ], [4, 1.5, RZ]), grp: 3, delay: 1.1, dashed: true, width: 1 });
  // mini bar chart on the sheet
  strokes.push({ d: `M${cx0 + 152} ${cy0 + 132} v-18 m 12 18 v-30 m 12 30 v-44`, grp: 3, delay: 0.9, width: 2.2 });
  strokes.push({ d: `M${cx0 + 146} ${cy0 + 134} h 40`, grp: 3, delay: 0.85, width: 1 });
  // euro chip next to the sum
  strokes.push({ d: `M${cx0 + 210} ${cy0 + 256} a13 13 0 1 1 -0.1 0`, grp: 3, delay: 1.3, width: 1.2 });
  texts.push({ x: cx0 + 210, y: cy0 + 261, t: '€', grp: 3, anchor: 'middle', bronze: true, size: 13 });

  /* ── Scene 4 · Bauphase: the house is built (persists) + crane (step only) ── */
  strokes.push({ d: loop([0, 0, 0.24], [4, 0, 0.24], [4, 3, 0.24], [0, 3, 0.24]), grp: 4, structural: true });
  ([[0, 0], [4, 0], [4, 3], [0, 3]] as [number, number][]).forEach(([x, y], i) => {
    strokes.push({ d: pts([x, y, 0], [x, y, 0.24]), grp: 4, delay: 0.08 + i * 0.04, structural: true, width: 1 });
  });
  ([[0, 0], [4, 0], [4, 3], [0, 3]] as [number, number][]).forEach(([x, y], i) => {
    strokes.push({ d: pts([x, y, 0.24], [x, y, H]), grp: 4, delay: 0.4 + i * 0.08, structural: true });
  });
  strokes.push({ d: loop([0, 0, H], [4, 0, H], [4, 3, H], [0, 3, H]), grp: 4, delay: 0.8, structural: true });
  strokes.push({ d: pts([1.7, 3, 0.24], [1.7, 3, 1.55], [2.5, 3, 1.55], [2.5, 3, 0.24]), grp: 4, delay: 1.05, structural: true, width: 1.2 });
  ([[0.5, 1.15], [1.85, 2.5]] as [number, number][]).forEach(([y0, y1], i) => {
    strokes.push({
      d: loop([4, y0, 0.95], [4, y1, 0.95], [4, y1, 1.65], [4, y0, 1.65]),
      grp: 4, delay: 1.15 + i * 0.12, structural: true, width: 1.2,
    });
  });
  strokes.push({ d: pts([0, 0, H], [0, 1.5, RZ], [0, 3, H]), grp: 4, delay: 1.4, structural: true });
  strokes.push({ d: pts([4, 0, H], [4, 1.5, RZ], [4, 3, H]), grp: 4, delay: 1.52, structural: true });
  strokes.push({ d: pts([0, 1.5, RZ], [4, 1.5, RZ]), grp: 4, delay: 1.65, structural: true, width: 1.8 });
  // crane — annotation of step 4 only
  strokes.push({ d: pts([-1.15, 3.55, 0], [-1.15, 3.55, 4.35]), grp: 4, delay: 0.15 });
  strokes.push({ d: pts([-1.15, 3.55, 4.35], [2.7, 1.4, 4.35]), grp: 4, delay: 0.32 });
  strokes.push({ d: pts([-1.15, 3.55, 4.35], [-2.1, 4.1, 4.35]), grp: 4, delay: 0.42, width: 1 });
  strokes.push({ d: pts([-2.1, 4.1, 4.35], [-2.1, 4.1, 3.7]), grp: 4, delay: 0.48, width: 1 });
  strokes.push({ d: pts([2.2, 1.68, 4.35], [2.2, 1.68, 2.75]), grp: 4, delay: 0.6, dashed: true, width: 1 });
  const [hx, hy] = iso(2.2, 1.68, 2.75);
  strokes.push({ d: `M${hx - 5} ${hy} h10 v8 h-10 Z`, grp: 4, delay: 0.75, width: 1 });
  const [ox, oy] = iso(-1.15, 3.55, 4.6);
  texts.push({ x: ox, y: oy - 8, t: 'ROHBAU OK', grp: 4, anchor: 'middle' });
  // scaffolding along the x=4 face
  [0.55, 1.25, 1.95].forEach((z, i) => {
    strokes.push({ d: pts([4.3, 0, z], [4.3, 3, z]), grp: 4, delay: 0.5 + i * 0.08, width: 0.9 });
  });
  ([[0.35], [1.5], [2.65]] as [number][]).forEach(([y], i) => {
    strokes.push({ d: pts([4.3, y, 0], [4.3, y, 2.1]), grp: 4, delay: 0.62 + i * 0.06, width: 0.9 });
  });
  strokes.push({ d: pts([4.3, 0.35, 0], [4.3, 1.5, 0.55]), grp: 4, delay: 0.8, width: 0.7 });
  strokes.push({ d: pts([4.3, 1.5, 0.55], [4.3, 2.65, 0]), grp: 4, delay: 0.86, width: 0.7 });
  // roof battens on the front plane
  [0.45, 0.9].forEach((f, i) => {
    strokes.push({ d: pts([0, 3 - 1.5 * f, H + (RZ - H) * f], [4, 3 - 1.5 * f, H + (RZ - H) * f]), grp: 4, delay: 1.7 + i * 0.1, width: 0.9 });
  });
  // pallet of blocks beside the house
  strokes.push({ d: loop([4.9, 0.3, 0], [5.5, 0.3, 0], [5.5, 0.9, 0], [4.9, 0.9, 0]), grp: 4, delay: 0.95, width: 1 });
  strokes.push({ d: loop([4.9, 0.3, 0.35], [5.5, 0.3, 0.35], [5.5, 0.9, 0.35], [4.9, 0.9, 0.35]), grp: 4, delay: 1.02, width: 1 });
  strokes.push({ d: pts([4.9, 0.3, 0], [4.9, 0.3, 0.35]), grp: 4, delay: 1.06, width: 0.9 });
  strokes.push({ d: pts([5.5, 0.3, 0], [5.5, 0.3, 0.35]), grp: 4, delay: 1.08, width: 0.9 });
  strokes.push({ d: pts([5.5, 0.9, 0], [5.5, 0.9, 0.35]), grp: 4, delay: 1.1, width: 0.9 });

  /* ── Scene 5 · Abnahme: walkway, big seal + key beside the finished house ── */
  strokes.push({ d: pts([2.1, 4.2, 0], [2.1, 3, 0]), grp: 5, dashed: true });
  const sx = 196, sy = 300;
  strokes.push({ d: `M${sx + 44} ${sy} a44 44 0 1 1 -88 0 a44 44 0 1 1 88 0`, grp: 5, delay: 0.25, width: 1.8 });
  strokes.push({ d: `M${sx - 18} ${sy + 2} l14 15 l25 -30`, grp: 5, delay: 0.65, width: 2.6 });
  strokes.push({ d: `M${sx - 30} ${sy + 92} a13 13 0 1 1 0.1 0`, grp: 5, delay: 0.85, width: 1.6 });
  strokes.push({ d: `M${sx - 17} ${sy + 92} h48 m-15 0 v11 m-11 -11 v8`, grp: 5, delay: 1.0, width: 1.6 });
  texts.push({ x: sx, y: sy + 136, t: 'SCHLÜSSELÜBERGABE', grp: 5, anchor: 'middle', bronze: true });
  // flag on the ridge
  strokes.push({ d: pts([2, 1.5, RZ], [2, 1.5, RZ + 0.75]), grp: 5, delay: 0.45, width: 1.2 });
  const [flx, fly] = iso(2, 1.5, RZ + 0.75);
  strokes.push({ d: `M${flx} ${fly} l 20 5 l -20 7 Z`, grp: 5, delay: 0.6, width: 1.1 });
  // sparkles near the seal
  strokes.push({ d: `M${sx + 74} ${sy - 52} v-16 m-8 8 h16`, grp: 5, delay: 1.1, width: 1.2 });
  strokes.push({ d: `M${sx + 96} ${sy - 20} v-10 m-5 5 h10`, grp: 5, delay: 1.2, width: 1 });
  // walkway becomes a solid double path
  strokes.push({ d: pts([1.95, 4.2, 0], [1.95, 3, 0]), grp: 5, delay: 0.7, width: 1 });
  strokes.push({ d: pts([2.25, 4.2, 0], [2.25, 3, 0]), grp: 5, delay: 0.78, width: 1 });

  return { strokes, texts };
}

/* ── Scene renderer: draw in the active step, un-draw the previous ── */
function Scene({
  active,
  started,
  reduce,
}: {
  active: number;
  started: boolean;
  reduce: boolean;
}) {
  const { strokes, texts } = useMemo(() => buildScene(), []);

  const visible = (s: { grp: number; structural?: boolean }) => {
    if (!started) return false;
    if (s.grp === 0) return true;
    return s.structural ? active >= s.grp : active === s.grp;
  };

  return (
    <svg
      viewBox="0 0 900 640"
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full"
      aria-hidden
    >
      {strokes.map((s, i) => {
        const on = visible(s);
        return (
          <motion.path
            key={i}
            d={s.d}
            fill="none"
            strokeWidth={s.width ?? 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={s.dashed ? '3 7' : undefined}
            initial={false}
            animate={{
              pathLength: on ? 1 : 0,
              opacity: on ? (s.grp === 0 ? 0.5 : 1) : 0,
              stroke: active === s.grp && s.grp !== 0 ? '#d0b586' : '#a98b56',
            }}
            transition={
              reduce
                ? { duration: 0 }
                : {
                    // draw in with its own delay; un-draw quickly together
                    pathLength: on
                      ? { duration: 0.65, delay: (s.delay ?? 0) * 0.6, ease: EASE_LUXE }
                      : { duration: 0.22, ease: 'easeIn' },
                    opacity: on
                      ? { duration: 0.3, delay: (s.delay ?? 0) * 0.6 }
                      : { duration: 0.2, delay: 0.05 },
                    stroke: { duration: 0.4 },
                  }
            }
          />
        );
      })}
      {texts.map((t, i) => {
        const on = visible(t);
        return (
          <motion.text
            key={`t${i}`}
            x={t.x}
            y={t.y}
            textAnchor={t.anchor ?? 'start'}
            fontSize={t.size ?? 11}
            letterSpacing={2.4}
            fill={t.bronze ? '#d0b586' : '#9b9b9b'}
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
            initial={false}
            animate={{ opacity: on ? 1 : 0 }}
            transition={{ duration: 0.35, delay: on ? 0.35 : 0 }}
          >
            {t.t}
          </motion.text>
        );
      })}
    </svg>
  );
}

/* ── Scene panel: framed viewport with HUD chrome (shared by layouts) ── */
function ScenePanel({
  active,
  n,
  step,
  started,
  reduce,
  renderScene,
  className,
}: {
  active: number;
  n: number;
  step: StoryStep;
  started: boolean;
  reduce: boolean;
  /** The hidden twin layout skips the heavy SVG so only one scene animates. */
  renderScene: boolean;
  className?: string;
}) {
  return (
    <div className={cn('relative rounded-sm border border-sand-50/10 bg-ink-950/60', className)}>
      {(['top-3 start-3 border-t border-s', 'top-3 end-3 border-t border-e', 'bottom-3 start-3 border-b border-s', 'bottom-3 end-3 border-b border-e'] as const).map((c) => (
        <span key={c} aria-hidden className={cn('pointer-events-none absolute size-4 border-bronze-500/60', c)} />
      ))}

      <div className="pointer-events-none absolute inset-x-6 top-4 flex items-center justify-between font-mono text-[0.62rem] tracking-[0.3em] text-sand-400 uppercase">
        <span className="flex items-center gap-2">
          <motion.span
            aria-hidden
            className="inline-block size-1.5 bg-bronze-400"
            animate={reduce ? undefined : { opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          {step.hud}
        </span>
        <span>{'//'} Scan</span>
      </div>

      {!reduce && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-bronze-400/40 to-transparent"
          animate={{ top: ['12%', '88%', '12%'] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <div className="h-full w-full pt-7 pb-9 lg:pt-10 lg:pb-12">
        {renderScene && <Scene active={active} started={started} reduce={reduce} />}
      </div>

      <div className="pointer-events-none absolute inset-x-6 bottom-3.5 flex items-end justify-between">
        <span className="tnum font-mono text-[0.68rem] tracking-[0.3em] text-sand-400">
          0{active} <span className="text-sand-500">/ 0{n}</span>
        </span>
        <span className="font-display text-sm tracking-[0.22em] text-bronze-300 uppercase">
          {step.hud}
        </span>
      </div>
    </div>
  );
}

// 64rem matches Tailwind's `lg` even when the root font size differs from 16px
const isDesktop = () => window.matchMedia('(min-width: 64rem)').matches;

/* ── Pinned scroll story ─────────────────────────────────────────────
   Desktop: the section is n×70vh tall; a full-viewport stage stays pinned
   while scroll progress scrubs through the steps (wheel snaps one step per
   gesture). Mobile: the scene panel alone pins under the header and the
   step list scrolls naturally, sliding away behind the pinned panel; the
   active scene follows whichever step sits under it. */
export function ProcessStory({ steps }: { steps: StoryStep[] }) {
  const reduce = useReducedMotion() ?? false;
  const tallRef = useRef<HTMLDivElement>(null);
  const mobileStageRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [active, setActive] = useState(1);
  // Scenes stay blank until the section first approaches the viewport, so the
  // base grid and scene 1 draw themselves in on first view.
  const [started, setStarted] = useState(false);
  // null until mounted: SSR/first paint keeps both layouts complete, then only
  // the visible one keeps its animated SVG scene mounted.
  const [desktopView, setDesktopView] = useState<boolean | null>(null);
  const n = steps.length;
  const lockRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 64rem)');
    const sync = () => setDesktopView(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Plain scroll listener (no rAF dependency). Desktop: progress through the
  // tall wrapper scrubs the active step. Mobile: the last step whose title has
  // reached the pinned panel's lower edge is the active one.
  useEffect(() => {
    const onScroll = () => {
      const el = tallRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9) setStarted(true);
      // during a wheel-snap glide the wheel handler owns `active`
      if (lockRef.current) return;
      let idx = 1;
      if (isDesktop()) {
        const scrollable = el.offsetHeight - window.innerHeight;
        if (scrollable <= 0) return;
        const p = Math.min(1, Math.max(0, -rect.top / scrollable));
        idx = Math.min(n, Math.max(1, Math.floor(p * n) + 1));
      } else {
        const stage = mobileStageRef.current;
        if (!stage) return;
        const line = stage.getBoundingClientRect().bottom + 56;
        stepRefs.current.forEach((li, i) => {
          if (li && li.getBoundingClientRect().top < line) idx = i + 1;
        });
      }
      setActive((a) => (a === idx ? a : idx));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [n]);

  const scrollToTarget = (target: number) => {
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    if (lenis && !reduce) {
      lenis.scrollTo(target, { duration: 0.7, lock: true });
    } else {
      window.scrollTo({ top: target, behavior: reduce ? 'auto' : 'smooth' });
    }
  };

  const desktopStepTarget = (i: number) => {
    const el = tallRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const top = window.scrollY + rect.top;
    const scrollable = el.offsetHeight - window.innerHeight;
    return top + ((i + 0.5) / n) * scrollable;
  };

  const animateTo = (i: number) => {
    const target = desktopStepTarget(i);
    if (target !== null) scrollToTarget(target);
  };

  const jumpTo = (i: number) => {
    if (isDesktop()) {
      animateTo(i);
      return;
    }
    const li = stepRefs.current[i];
    const stage = mobileStageRef.current;
    if (!li || !stage) return;
    const headerH =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) * 16 || 84;
    const pinBottom = headerH + stage.offsetHeight;
    scrollToTarget(window.scrollY + li.getBoundingClientRect().top - pinBottom - 10);
  };

  // Wheel snapping while the stage is pinned: one gesture advances exactly one
  // step, then a short dwell (~0.25s after the glide) before the next one.
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  useEffect(() => {
    if (reduce) return;
    const onWheel = (e: WheelEvent) => {
      if (!isDesktop()) return; // mobile layout scrolls natively
      const el = tallRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const headerH =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) * 16 || 84;
      const pinned = rect.top <= headerH + 2 && rect.bottom >= window.innerHeight - 2;
      if (!pinned) return;
      if (Math.abs(e.deltaY) < 4) return;
      if (lockRef.current) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      const dir = e.deltaY > 0 ? 1 : -1;
      const next = activeRef.current - 1 + dir;
      if (next < 0 || next > n - 1) return; // release: native scroll leaves the block
      e.preventDefault();
      e.stopImmediatePropagation();
      lockRef.current = true;
      activeRef.current = next + 1; // keep the mirror in sync within this frame
      setActive(next + 1); // start the scene switch with the glide
      animateTo(next);
      window.setTimeout(() => {
        lockRef.current = false;
      }, 950); // ~0.7s glide + ~0.25s dwell on the step
    };
    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => window.removeEventListener('wheel', onWheel, { capture: true } as EventListenerOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, reduce]);

  const step = steps[Math.min(active, n) - 1]!;

  const badgeCls = (state: 'active' | 'done' | 'todo') =>
    cn(
      'relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border font-display text-[0.7rem] transition-colors duration-500 sm:size-10 sm:text-xs',
      state === 'active' && 'border-bronze-400 bg-bronze-500 text-ink-950',
      state === 'done' && 'border-bronze-500/60 bg-ink-900 text-bronze-300',
      state === 'todo' &&
        'border-sand-50/20 bg-ink-900 text-sand-500 group-hover:border-bronze-500/50 group-hover:text-bronze-300',
    );

  return (
    <div
      ref={tallRef}
      style={{ '--story-h': `${n * 70}vh` } as React.CSSProperties}
      className="relative lg:h-[var(--story-h)]"
    >
      {/* Static (viewport-pinned) background: full-screen photo behind a
          heavy scrim that never stretches with the tall wrapper */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="sticky top-0 h-screen overflow-hidden">
          <Image
            src="/images/style-nichtstandard.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-ink-950/85" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink-900 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink-900 to-transparent" />
        </div>
      </div>

      {/* ── Mobile: scene pinned under the header, steps scroll behind it ── */}
      <div className="lg:hidden">
        {/* Unpins on short (landscape-phone) viewports so the list stays readable */}
        <div
          ref={mobileStageRef}
          className="sticky top-[var(--header-h)] z-20 bg-ink-900 pt-3 pb-2 [@media(max-height:30rem)]:static"
        >
          <Container>
            <ScenePanel
              active={active}
              n={n}
              step={step}
              started={started}
              reduce={reduce}
              renderScene={desktopView !== true}
              className="h-[42svh] min-h-[220px]"
            />
          </Container>
          {/* Passing text dissolves into this fade as it slides underneath */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-full h-12 bg-gradient-to-b from-ink-900 to-transparent [@media(max-height:30rem)]:hidden"
          />
        </div>

        <Container className="pt-10 pb-4">
          <ol className="relative">
            <span aria-hidden className="absolute top-5 bottom-5 start-[17px] w-px bg-sand-50/12" />
            <motion.span
              aria-hidden
              className="absolute top-5 start-[17px] w-px origin-top bg-bronze-500"
              style={{ height: 'calc(100% - 2.5rem)' }}
              animate={{ scaleY: n > 1 ? (active - 1) / (n - 1) : 0 }}
              transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 26 }}
            />
            {steps.map((s, i) => {
              const state = i + 1 === active ? 'active' : i + 1 < active ? 'done' : 'todo';
              return (
                <li
                  key={s.title}
                  ref={(el) => {
                    stepRefs.current[i] = el;
                  }}
                  className="relative pb-9 last:pb-0"
                >
                  <button
                    type="button"
                    aria-current={state === 'active' ? 'step' : undefined}
                    onClick={() => jumpTo(i)}
                    className="group flex w-full cursor-pointer items-center gap-4 text-start"
                  >
                    <span className={badgeCls(state)}>0{i + 1}</span>
                    <span className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                      <span
                        className={cn(
                          'font-display text-lg leading-snug font-semibold transition-colors duration-500',
                          state === 'active' ? 'text-sand-50' : 'text-sand-400',
                        )}
                      >
                        {s.title}
                      </span>
                      <span
                        className={cn(
                          'shrink-0 font-mono text-[0.6rem] tracking-[0.28em] uppercase transition-colors duration-500',
                          state === 'active' ? 'text-bronze-400' : 'text-sand-500/60',
                        )}
                      >
                        {s.hud}
                      </span>
                    </span>
                  </button>
                  <p className="pt-2.5 ps-[3.25rem] text-sm leading-relaxed text-sand-300">
                    {s.text}
                  </p>
                </li>
              );
            })}
          </ol>
        </Container>
      </div>

      {/* ── Desktop: full-viewport pinned stage, accordion step list ── */}
      <div className="sticky top-[var(--header-h)] hidden h-[calc(100dvh-var(--header-h))] lg:block">
        <Container className="flex h-full items-stretch gap-10 py-6">
        <ScenePanel
          active={active}
          n={n}
          step={step}
          started={started}
          reduce={reduce}
          renderScene={desktopView !== false}
          className="order-2 flex-1"
        />

        {/* ── Step list: every step titled, the active one expands ── */}
        <div className="order-1 flex min-h-0 max-w-xl flex-1 flex-col overflow-y-auto no-scrollbar">
          {/* my-auto centers when there is room yet keeps the top reachable on overflow */}
          <ol className="relative my-auto">
            {/* connector track + progress fill */}
            <span aria-hidden className="absolute top-5 bottom-5 start-[17px] w-px bg-sand-50/12 sm:start-[19px]" />
            <motion.span
              aria-hidden
              className="absolute top-5 start-[17px] w-px origin-top bg-bronze-500 sm:start-[19px]"
              style={{ height: 'calc(100% - 2.5rem)' }}
              animate={{ scaleY: n > 1 ? (active - 1) / (n - 1) : 0 }}
              transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 26 }}
            />

            {steps.map((s, i) => {
              const state = i + 1 === active ? 'active' : i + 1 < active ? 'done' : 'todo';
              const open = state === 'active';
              return (
                <li key={s.title} className="relative">
                  <button
                    type="button"
                    aria-current={open ? 'step' : undefined}
                    aria-expanded={open}
                    onClick={() => jumpTo(i)}
                    className="group flex w-full cursor-pointer items-center gap-4 py-2.5 text-start sm:gap-5 sm:py-3"
                  >
                    <span className={badgeCls(state)}>0{i + 1}</span>
                    <span className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                      <span
                        className={cn(
                          'font-display text-base leading-snug font-semibold transition-colors duration-500 sm:text-lg lg:text-xl',
                          open ? 'text-sand-50' : 'text-sand-400 group-hover:text-sand-200',
                        )}
                      >
                        {s.title}
                      </span>
                      <span
                        className={cn(
                          'hidden shrink-0 font-mono text-[0.6rem] tracking-[0.28em] uppercase transition-colors duration-500 sm:inline',
                          open ? 'text-bronze-400' : 'text-sand-500/60',
                        )}
                      >
                        {s.hud}
                      </span>
                    </span>
                  </button>

                  {/* Expanding step text (scroll-driven accordion) */}
                  <motion.div
                    initial={false}
                    animate={{
                      height: open ? 'auto' : 0,
                      opacity: open ? 1 : 0,
                    }}
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { height: { duration: 0.5, ease: EASE_LUXE }, opacity: { duration: 0.35, delay: open ? 0.12 : 0 } }
                    }
                    className="overflow-hidden"
                  >
                    <p className="max-w-prose pt-0.5 pb-3 ps-[3.25rem] text-sm leading-relaxed text-sand-300 sm:ps-[3.75rem] lg:text-[0.95rem]">
                      {s.text}
                    </p>
                  </motion.div>
                </li>
              );
            })}
          </ol>
        </div>
        </Container>
      </div>
    </div>
  );
}
