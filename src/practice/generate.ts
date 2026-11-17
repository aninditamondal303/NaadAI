/**
 * More sargam and alaap phrases for a raag, generated from its aroh and
 * avaroh: steps upward use only swaras of the aroh, steps downward only
 * swaras of the avaroh, and every phrase ends on a resting swara (nyas) or
 * Sa. The same raag and number always give the same phrases (a fixed,
 * seeded sequence), so a student can come back to "set 3" later.
 *
 * Generated phrases follow the raag's scale rules but not its full grammar
 * (vakra turns, characteristic phrases), so they are labelled as generated.
 */
import type { ComprehensiveRaag } from "../data/allRaags";
import { parseNote } from "./notation";

const NAMES = ["S", "r", "R", "g", "G", "m", "M", "P", "d", "D", "n", "N"];

function label(semi: number): string {
  const oct = Math.floor(semi / 12);
  const base = NAMES[((semi % 12) + 12) % 12];
  return oct < 0 ? base + ",".repeat(-oct) : oct > 0 ? base + "'".repeat(oct) : base;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Swaras of a written aroh/avaroh, repeated over mandra Pa .. taar Pa. */
function range(seq: string[]): number[] {
  const classes = new Set(seq.map(t => ((parseNote(t).semitones % 12) + 12) % 12));
  const out: number[] = [];
  for (let s = -5; s <= 19; s++) if (classes.has(((s % 12) + 12) % 12)) out.push(s);
  return out;
}

export interface GenOptions { minLen?: number; maxLen?: number; low?: number; high?: number }

function phrase(raag: ComprehensiveRaag, rng: () => number, rest: number[], o: Required<GenOptions>): number[] {
  const up = range(raag.aroha).filter(s => s >= o.low && s <= o.high);
  const down = range(raag.avaroha).filter(s => s >= o.low && s <= o.high);
  const starts = up.filter(s => s >= 0 && s <= 12);
  let cur = starts[Math.floor(rng() * starts.length)];
  const out = [cur];
  const len = o.minLen + Math.floor(rng() * (o.maxLen - o.minLen + 1));
  let dir = rng() < 0.6 ? 1 : -1;
  let run = 0; // steps since the last change of direction, to avoid zigzagging
  let tries = 0;
  while (out.length < len && tries++ < 64) {
    if (run >= 2 && rng() < 0.25) { dir = -dir; run = 0; }
    const next = dir > 0 ? up.find(s => s > cur) : [...down].reverse().find(s => s < cur);
    if (next === undefined) { dir = -dir; run = 0; continue; }
    run++;
    cur = next;
    out.push(cur);
  }
  // walk down (by the avaroh) or up (by the aroh) to the nearest resting swara
  const isRest = (s: number) => rest.includes(((s % 12) + 12) % 12);
  let guard = 0;
  while (!isRest(cur) && guard++ < 12) {
    // below Sa, rise towards Sa by the aroh; otherwise come down by the avaroh
    const next = cur < 0 ? up.find(s => s > cur) : [...down].reverse().find(s => s < cur) ?? up.find(s => s > cur);
    if (next === undefined) break;
    cur = next;
    out.push(cur);
  }
  return out;
}

function restSwaras(raag: ComprehensiveRaag, nyas: string[] = []): number[] {
  const r = new Set<number>([0, raag.vadi, raag.samvadi]);
  for (const n of nyas) r.add(((parseNote(n).semitones % 12) + 12) % 12);
  return [...r].filter(s => raag.allowedSwaras.includes(s));
}

/** A set of sargam phrases (quick, one swara per beat). */
export function moreSargams(raag: ComprehensiveRaag, set: number, nyas: string[] = [], count = 4): string[] {
  const rng = mulberry32(hash(raag.id) + set * 7919);
  const o = { minLen: 6, maxLen: 10, low: -5, high: 14 };
  return Array.from({ length: count }, () => phrase(raag, rng, restSwaras(raag, nyas), o).map(label).join(" "));
}

/** A set of alaap phrases: slower, with long resting notes. */
export function moreAlaap(raag: ComprehensiveRaag, set: number, nyas: string[] = [], count = 4): string[] {
  const rng = mulberry32(hash(raag.id) + set * 104729 + 1);
  const o = { minLen: 3, maxLen: 6, low: -5, high: 12 };
  const rest = restSwaras(raag, nyas);
  return Array.from({ length: count }, () => {
    const ph = phrase(raag, rng, rest, o);
    // hold resting swaras and the last swara
    return ph.map((s, i) => label(s) + (i === ph.length - 1 ? " - -" : rest.includes(((s % 12) + 12) % 12) && rng() < 0.6 ? " -" : "")).join(" ");
  });
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
