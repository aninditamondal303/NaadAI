import { describe, expect, it } from "vitest";
import { guessRaag } from "../raagGuess";
import { RAAG_LIST } from "../../data/allRaags";
import { ALAAP, COMPOSITIONS } from "../../data/compositions";
import { timeLines, timePhrases, type TimedNote } from "../../practice/swaralipi";
import type { HeldNote } from "../summary";

/** Turn written swaras into held notes, as if sung perfectly. */
function held(notes: TimedNote[]): HeldNote[] {
  return notes.filter(n => n.dur >= 0.25).map(n => ({
    startSec: n.start, durSec: n.dur, swara: ((n.semitones % 12) + 12) % 12, octave: Math.floor(n.semitones / 12), deviationCents: 0, wobbleCents: 0,
  }));
}

describe("raag pehchaan", () => {
  const cases = Object.keys(ALAAP).map(id => {
    const comps = COMPOSITIONS.filter(c => c.raagId === id);
    const notes = [
      ...ALAAP[id].flatMap(s => s.phrases),
    ];
    const t1 = timePhrases(notes);
    const end = t1.length ? t1[t1.length - 1].start + 2 : 0;
    const t2 = comps.flatMap(c => timeLines([...c.sthayi, ...c.antara].map(l => l.notes), 0.75).notes).map(n => ({ ...n, start: n.start + end }));
    return { id, notes: held([...t1, ...t2]) };
  });

  it("puts the right raag (or one with exactly the same swaras) first for the written alaap and compositions", () => {
    const results = cases.map(c => {
      const g = guessRaag(c.notes, RAAG_LIST);
      const top = g.candidates[0].raag.id;
      return { id: c.id, ok: top === c.id || g.sameSwaras.some(r => r.id === c.id), top };
    });
    const wrong = results.filter(r => !r.ok);
    expect(wrong, JSON.stringify(wrong)).toEqual([]);
  });

  it("says unsure with too little singing", () => {
    expect(guessRaag([], RAAG_LIST).confidence).toBe("unsure");
  });

  it("lists swaras sung outside the top raag", () => {
    const yaman = cases.find(c => c.id === "yaman")!.notes;
    const g = guessRaag(yaman, RAAG_LIST);
    expect(g.candidates[0].outside).toEqual([]);
  });
});
