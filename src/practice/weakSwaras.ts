/**
 * Weak swaras from the singer's own measurements, and paltas that focus on them.
 */
import type { ComprehensiveRaag } from "../data/allRaags";
import { SWARA_NAMES, SWARA_SYMBOLS } from "../analysis/summary";
import type { PracticeRecord } from "../lib/practiceHistory";
import { parseNote, type SargamNote } from "./notation";

/** Minimum total held time before a swara is judged at all. */
export const MIN_SWARA_SEC = 5;
/** Offsets beyond this (cents) count as a tendency to be sharp/flat. */
export const OFF_CENTS = 15;
/** Wobble beyond this (cents) counts as unsteady. */
export const WOBBLE_CENTS = 12;

export interface SwaraTendency {
  symbol: string;
  name: string;
  semitone: number;
  heldSec: number;
  /** Time-weighted average position (cents, + = sharp). */
  deviationCents: number;
  /** Time-weighted average wobble (cents). */
  wobbleCents: number;
}

export function swaraTendencies(history: PracticeRecord[]): SwaraTendency[] {
  const acc = new Map<string, { sec: number; dev: number; wob: number }>();
  for (const r of history) {
    if (r.kind !== "analysis") continue;
    for (const s of r.swaras) {
      const e = acc.get(s.symbol) ?? { sec: 0, dev: 0, wob: 0 };
      e.sec += s.totalHeldSec;
      e.dev += s.medianDeviationCents * s.totalHeldSec;
      e.wob += s.medianWobbleCents * s.totalHeldSec;
      acc.set(s.symbol, e);
    }
  }
  return SWARA_SYMBOLS.flatMap((sym, i) => {
    const e = acc.get(sym);
    return e && e.sec > 0
      ? [{ symbol: sym, name: SWARA_NAMES[i], semitone: i, heldSec: e.sec, deviationCents: e.dev / e.sec, wobbleCents: e.wob / e.sec }]
      : [];
  });
}

/** Swaras with enough data that are often off or unsteady, worst first. Sa is excluded (it has Sa sadhana). */
export function weakSwaras(history: PracticeRecord[]): (SwaraTendency & { reason: string })[] {
  return swaraTendencies(history)
    .filter(t => t.heldSec >= MIN_SWARA_SEC && t.semitone !== 0)
    .map(t => {
      const off = Math.abs(t.deviationCents) > OFF_CENTS;
      const wob = t.wobbleCents > WOBBLE_CENTS;
      const reason = [
        off ? `${Math.abs(t.deviationCents).toFixed(0)} cents ${t.deviationCents > 0 ? "sharp" : "flat"} on average` : "",
        wob ? `wobbles ±${t.wobbleCents.toFixed(0)} cents` : "",
      ].filter(Boolean).join(", ");
      return { ...t, reason, badness: (off ? Math.abs(t.deviationCents) - OFF_CENTS : 0) + (wob ? t.wobbleCents - WOBBLE_CENTS : 0) };
    })
    .filter(t => t.reason)
    .sort((a, b) => b.badness - a.badness)
    .map(({ badness: _b, ...t }) => t);
}

/**
 * A palta that keeps returning to one swara, approached from its neighbours
 * in the raag's own aroh and avaroh: below-X-below-X, above-X-above-X, then a
 * long hold on X. Returns null if the raag doesn't use the swara.
 */
export function weakSwaraPalta(raag: ComprehensiveRaag, semitone: number): SargamNote[] | null {
  if (!raag.allowedSwaras.includes(semitone)) return null;
  const up = raag.aroha.map(parseNote);
  const down = raag.avaroha.map(parseNote);
  const iu = up.findIndex(n => n.semitones === semitone);
  const id = down.findIndex(n => n.semitones === semitone);
  const x = (iu >= 0 ? up[iu] : down[id]);
  if (!x) return null;
  const below = iu > 0 ? up[iu - 1] : null;
  const above = id > 0 ? down[id - 1] : null;
  const out: SargamNote[] = [];
  if (below) out.push(below, x, below, x);
  if (above) out.push(above, x, above, x);
  out.push(x, x, x, x); // hold for four beats
  return out;
}
