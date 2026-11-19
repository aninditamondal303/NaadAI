/**
 * Raag pehchaan: which raags fit what was sung?
 *
 * Works on held notes (findHeldNotes): how much time went to each swara,
 * whether the raag's swaras were all used, whether rising steps used the
 * aroh's swaras and falling steps the avaroh's, and whether the vadi and
 * samvadi were emphasised, and how many of the sung three-note turns
 * belong to the raag's aroh, avaroh and pakad (and how many of those turns
 * were sung). This is a rule-based ranking, not a trained model: raags with the same swaras (for example Bhupali and Deshkar, or
 * Marwa, Puriya and Sohini) differ mostly in phrasing and are often not
 * separable this way, and the result says so.
 */
import type { ComprehensiveRaag } from "../data/allRaags";
import { pakadFor } from "../data/pakad";
import { parseNote } from "../practice/notation";
import type { HeldNote } from "./summary";

export interface RaagCandidate {
  raag: ComprehensiveRaag;
  score: number;
  /** Share of held time on the raag's swaras (0..1). */
  inRaag: number;
  /** Share of the raag's swaras that were sung (0..1). */
  coverage: number;
  /** Share of note-to-note steps that follow aroh (up) / avaroh (down) (0..1), or null if too few steps. */
  movement: number | null;
  /** Swaras sung that are not in the raag. */
  outside: number[];
  /** How well the sung three-note turns match the raag's aroh, avaroh and pakad (0..1), or null if too few. */
  phrase: number | null;
}

export interface RaagGuess {
  candidates: RaagCandidate[];
  /** Raags with exactly the same swaras as the top candidate. */
  sameSwaras: ComprehensiveRaag[];
  confidence: "clear" | "likely" | "unsure";
  heldSec: number;
}

const classOf = (tok: string) => ((parseNote(tok).semitones % 12) + 12) % 12;
const pcOf = (semi: number) => ((semi % 12) + 12) % 12;

/**
 * Three-note turns of a line of notes (absolute semitones, repeats removed):
 * the three swaras and whether each step goes up or down, e.g. "4.5.7.uu"
 * for G m P rising. Octave is ignored so a phrase counts in any saptak.
 */
export function turnsOf(line: number[]): string[] {
  const out: string[] = [];
  for (let i = 2; i < line.length; i++) {
    const a = line[i - 2], b = line[i - 1], c = line[i];
    out.push(`${pcOf(a)}.${pcOf(b)}.${pcOf(c)}.${b > a ? "u" : "d"}${c > b ? "u" : "d"}`);
  }
  return out;
}

const dedupe = (xs: number[]) => xs.filter((x, i) => i === 0 || x !== xs[i - 1]);
const lineOf = (text: string): number[] => {
  const out: number[] = [];
  for (const t of text.trim().split(/\s+/)) { try { out.push(parseNote(t).semitones); } catch { /* skip marks */ } }
  return dedupe(out);
};

const turnCache = new Map<string, Set<string>>();
/** All three-note turns in a raag's aroh, avaroh and pakad (or mukhya ang). */
export function raagTurns(raag: ComprehensiveRaag): Set<string> {
  let set = turnCache.get(raag.id);
  if (!set) {
    const lines = [raag.aroha.join(" "), raag.avaroha.join(" "), ...(pakadFor(raag.id) ?? "").split("|")];
    set = new Set(lines.flatMap(l => turnsOf(lineOf(l))));
    turnCache.set(raag.id, set);
  }
  return set;
}

/** Weight of the phrase match in the score (the other parts add up to 10). */
export const PHRASE_WEIGHT = 2;

export function guessRaag(notes: HeldNote[], raags: ComprehensiveRaag[], top = 5): RaagGuess {
  const hist = new Array(12).fill(0);
  for (const n of notes) hist[n.swara] += n.durSec;
  const total = hist.reduce((a, b) => a + b, 0);
  if (total < 3 || notes.length < 6) return { candidates: [], sameSwaras: [], confidence: "unsure", heldSec: total };
  const sung = hist.map(h => h / total >= 0.02);

  // note-to-note steps between neighbouring held notes
  const steps: { to: number; up: boolean }[] = [];
  for (let i = 1; i < notes.length; i++) {
    const a = notes[i - 1], b = notes[i];
    if (b.startSec - (a.startSec + a.durSec) > 1.5) continue;
    const pa = a.octave * 12 + a.swara, pb = b.octave * 12 + b.swara;
    if (pa !== pb) steps.push({ to: b.swara, up: pb > pa });
  }

  // three-note turns actually sung, phrase by phrase (a pause over 1.5 s ends a phrase)
  const sungTurns: string[] = [];
  let line: number[] = [];
  for (let i = 0; i < notes.length; i++) {
    const n = notes[i];
    if (i > 0 && n.startSec - (notes[i - 1].startSec + notes[i - 1].durSec) > 1.5) { sungTurns.push(...turnsOf(dedupe(line))); line = []; }
    line.push(n.octave * 12 + n.swara);
  }
  sungTurns.push(...turnsOf(dedupe(line)));
  const sungSet = new Set(sungTurns);

  const scored: RaagCandidate[] = raags.map(raag => {
    const A = new Set(raag.allowedSwaras);
    const up = new Set(raag.aroha.map(classOf));
    const down = new Set(raag.avaroha.map(classOf));
    const inRaag = raag.allowedSwaras.reduce((a, s) => a + hist[s], 0) / total;
    const coverage = raag.allowedSwaras.filter(s => sung[s]).length / raag.allowedSwaras.length;
    const okSteps = steps.filter(s => (s.up ? up : down).has(s.to)).length;
    const movement = steps.length >= 4 ? okSteps / steps.length : null;
    const share = 2 / raag.allowedSwaras.length;
    const emph = raag.vadiGiven === false ? 0 : Math.min(1.5, (hist[raag.vadi] + hist[raag.samvadi]) / total / share) / 1.5;
    const outside = hist.map((h, s) => (sung[s] && !A.has(s) ? s : -1)).filter(s => s >= 0);
    // phrase: half how many sung turns are the raag's own, half how many of its turns were sung
    const own = raagTurns(raag);
    let phrase: number | null = null;
    if (sungTurns.length >= 3 && own.size > 0) {
      const precision = sungTurns.filter(t => own.has(t)).length / sungTurns.length;
      let hit = 0;
      for (const t of own) if (sungSet.has(t)) hit++;
      phrase = 0.5 * precision + 0.5 * (hit / own.size);
    }
    const score = 6 * inRaag + 2 * coverage + 1.5 * (movement ?? 0.5) + 0.5 * emph + PHRASE_WEIGHT * (phrase ?? 0.5);
    return { raag, score, inRaag, coverage, movement, outside, phrase };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0];
  const key = (r: ComprehensiveRaag) => [...r.allowedSwaras].sort((a, b) => a - b).join(",");
  const sameSwaras = scored.slice(1).filter(c => key(c.raag) === key(best.raag)).map(c => c.raag);
  const firstOther = scored.find(c => key(c.raag) !== key(best.raag));
  const margin = firstOther ? best.score - firstOther.score : 2;
  const confidence = best.inRaag < 0.9 ? "unsure" : margin >= 0.6 ? "clear" : margin >= 0.25 ? "likely" : "unsure";
  return { candidates: scored.slice(0, top), sameSwaras, confidence, heldSec: total };
}

/** How much the Sa evidence (0..1, from detectSa) adds when Sa and raag are chosen together. */
export const SA_EVIDENCE_WEIGHT = 2;

export interface RaagAndSaGuess extends RaagGuess {
  /** The Sa the guess was made with, or null if none could be found. */
  saHz: number | null;
}

/**
 * When the singer's Sa is not known: try each likely Sa from the recording
 * (detectSa's candidates), rank the raags with each, and keep the Sa whose
 * best raag fits best, giving some weight to how strongly the recording
 * itself points to that Sa. A musician does the same: a Sa is right when
 * the notes then make sense as a raag.
 */
export function guessRaagAndSa(
  candidates: { hz: number; score: number }[],
  heldNotesFor: (saHz: number) => HeldNote[],
  raags: ComprehensiveRaag[],
  top = 5,
): RaagAndSaGuess {
  const maxSa = Math.max(0, ...candidates.map(c => c.score));
  let best: RaagAndSaGuess | null = null, bestScore = -Infinity;
  for (const c of candidates.slice(0, 5)) {
    const g = guessRaag(heldNotesFor(c.hz), raags, top);
    if (!g.candidates.length) continue;
    const s = g.candidates[0].score + SA_EVIDENCE_WEIGHT * (maxSa > 0 ? c.score / maxSa : 0);
    if (s > bestScore) { bestScore = s; best = { ...g, saHz: c.hz }; }
  }
  return best ?? { candidates: [], sameSwaras: [], confidence: "unsure", heldSec: 0, saHz: null };
}
