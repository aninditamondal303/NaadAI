/**
 * Raag pehchaan while singing: keeps every live pitch reading of the take,
 * turns steady stretches into held notes, and ranks raags with the same
 * rules as the full analysis (guessRaag). It needs a few seconds of held
 * notes before it says anything.
 */
import type { ComprehensiveRaag } from "../data/allRaags";
import { segmentNotes } from "../practice/phraseMatch";
import { guessRaag, type RaagGuess } from "./raagGuess";
import type { HeldNote } from "./summary";

export function createLiveRaag(raags: ComprehensiveRaag[]) {
  const all: { t: number; c: number | null }[] = [];
  let lastT = -Infinity;
  return {
    /** Add readings newer than any seen before. */
    add(points: { t: number; c: number | null }[]) {
      for (const p of points) if (p.t > lastT) { all.push(p); lastT = p.t; }
      if (all.length > 60 * 60 * 10) all.splice(0, all.length - 60 * 60 * 10);
    },
    guess(): RaagGuess {
      const notes: HeldNote[] = segmentNotes(all, 0.25).map(n => ({
        startSec: n.start, durSec: n.dur,
        swara: ((n.semitone % 12) + 12) % 12, octave: Math.floor(n.semitone / 12),
        deviationCents: n.cents, wobbleCents: 0,
      }));
      return guessRaag(notes, raags, 3);
    },
  };
}
