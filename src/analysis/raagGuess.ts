/**
 * Raag pehchaan: which raags fit what was sung?
 *
 * Works on held notes (findHeldNotes): how much time went to each swara,
 * whether the raag's swaras were all used, whether rising steps used the
 * aroh's swaras and falling steps the avaroh's, and whether the vadi and
 * samvadi were emphasised. This is a rule-based ranking, not a trained
 * model: raags with the same swaras (for example Bhupali and Deshkar, or
 * Marwa, Puriya and Sohini) differ mostly in phrasing and are often not
 * separable this way, and the result says so.
 */
import type { ComprehensiveRaag } from "../data/allRaags";
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
}

export interface RaagGuess {
  candidates: RaagCandidate[];
  /** Raags with exactly the same swaras as the top candidate. */
  sameSwaras: ComprehensiveRaag[];
  confidence: "clear" | "likely" | "unsure";
  heldSec: number;
}

const classOf = (tok: string) => ((parseNote(tok).semitones % 12) + 12) % 12;

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

  const scored: RaagCandidate[] = raags.map(raag => {
    const A = new Set(raag.allowedSwaras);
    const up = new Set(raag.aroha.map(classOf));
    const down = new Set(raag.avaroha.map(classOf));
    const inRaag = raag.allowedSwaras.reduce((a, s) => a + hist[s], 0) / total;
    const coverage = raag.allowedSwaras.filter(s => sung[s]).length / raag.allowedSwaras.length;
    const okSteps = steps.filter(s => (s.up ? up : down).has(s.to)).length;
    const movement = steps.length >= 4 ? okSteps / steps.length : null;
    const share = 2 / raag.allowedSwaras.length;
    const emph = Math.min(1.5, (hist[raag.vadi] + hist[raag.samvadi]) / total / share) / 1.5;
    const outside = hist.map((h, s) => (sung[s] && !A.has(s) ? s : -1)).filter(s => s >= 0);
    const score = 6 * inRaag + 2 * coverage + 1.5 * (movement ?? 0.5) + 0.5 * emph;
    return { raag, score, inRaag, coverage, movement, outside };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0];
  const key = (r: ComprehensiveRaag) => [...r.allowedSwaras].sort((a, b) => a - b).join(",");
  const sameSwaras = scored.slice(1).filter(c => key(c.raag) === key(best.raag)).map(c => c.raag);
  const firstOther = scored.find(c => key(c.raag) !== key(best.raag));
  const margin = firstOther ? best.score - firstOther.score : 2;
  const confidence = best.inRaag < 0.9 ? "unsure" : margin >= 0.6 ? "clear" : margin >= 0.25 ? "likely" : "unsure";
  return { candidates: scored.slice(0, top), sameSwaras, confidence, heldSec: total };
}
