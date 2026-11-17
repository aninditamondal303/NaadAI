/**
 * Bandishes entered by the singer (from their guru or a book), saved in this
 * browser for the current profile. Stored in the same swaralipi format as
 * the app's compositions (see src/data/compositions.ts).
 */
import type { Composition } from "../data/compositions";
import { currentProfileId } from "./profiles";
import { parseLine } from "../practice/swaralipi";

const key = () => `naad.userBandish.v1.${currentProfileId() ?? "guest"}`;

export interface UserComposition extends Composition { user: true; source: string }

export function loadUserBandishes(): UserComposition[] {
  try { return JSON.parse(localStorage.getItem(key()) ?? "[]"); } catch { return []; }
}

export function saveUserBandishes(list: UserComposition[]) {
  localStorage.setItem(key(), JSON.stringify(list));
}

/** Check a swaralipi block: one avartan per line, every token a swara, "-" or "_". */
export function checkBlock(text: string, matras: number): { lines: string[]; errors: string[] } {
  const lines = text.split(/\r?\n/).map(l => l.trim().replace(/\s+/g, " ")).filter(Boolean);
  const errors: string[] = [];
  lines.forEach((l, i) => {
    const n = l.split(" ").length;
    if (n !== matras) errors.push(`Line ${i + 1} has ${n} matras; this taal has ${matras}.`);
    try { parseLine(l); } catch { errors.push(`Line ${i + 1} has a token that is not a swara.`); }
    if (/[^SrRgGmMPdDnN,'.\-_ ]/.test(l)) errors.push(`Line ${i + 1}: use S r R g G m M P d D n N, "," for mandra, "'" for taar, "-" to hold, "." to join swaras in one matra.`);
  });
  return { lines, errors };
}

export function checkWords(text: string, matras: number, count: number): { lines: string[]; errors: string[] } {
  const lines = text.split(/\r?\n/).map(l => l.trim().replace(/\s+/g, " ")).filter(Boolean);
  const errors: string[] = [];
  if (lines.length && lines.length !== count) errors.push(`There are ${lines.length} lines of words for ${count} lines of swaras.`);
  lines.forEach((l, i) => { const n = l.split(" ").length; if (n !== matras) errors.push(`Words line ${i + 1} has ${n} syllables; it needs ${matras} (use "-" for a held syllable).`); });
  return { lines, errors };
}
