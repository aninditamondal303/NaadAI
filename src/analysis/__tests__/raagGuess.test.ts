import { describe, expect, it } from "vitest";
import { guessRaag, guessRaagAndSa, raagTurns, turnsOf } from "../raagGuess";
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

  it("writes three-note turns with direction, ignoring the octave", () => {
    expect(turnsOf([0, 4, 5, 7])).toEqual(["0.4.5.uu", "4.5.7.uu"]);
    expect(turnsOf([12, 11, 9])).toEqual(["0.11.9.dd"]);
  });

  it("collects turns from aroh, avaroh and pakad", () => {
    const yaman = RAAG_LIST.find(r => r.id === "yaman")!;
    const t = raagTurns(yaman);
    expect(t.has("11.2.4.uu")).toBe(true); // N, R G
    expect(t.has("5.7.9.uu")).toBe(false); // shuddha Ma is not Yaman's
  });

  it("tells same-swara raags apart by their turns: Bhupali's G R S against Deshkar's G P D", () => {
    const line = (sw: number[], t0: number) => sw.map((s, i) => ({ startSec: t0 + i * 0.6, durSec: 0.5, swara: s % 12, octave: Math.floor(s / 12), deviationCents: 0, wobbleCents: 0 }));
    const bhupali = [...line([0, 2, 4, 7, 9, 12], 0), ...line([12, 9, 7, 4, 2, 0], 5), ...line([4, 2, 4, 7, 4, 2, 0], 10), ...line([9, 7, 4, 2, 0], 16)];
    const g = guessRaag(bhupali, RAAG_LIST, 10);
    const rank = (id: string) => g.candidates.findIndex(c => c.raag.id === id);
    expect(rank("bhupali")).toBeGreaterThanOrEqual(0);
    if (rank("deshkar") >= 0) expect(rank("bhupali")).toBeLessThan(rank("deshkar"));
  });

  it("chooses Sa and raag together when Sa is not known", () => {
    const yaman = cases.find(c => c.id === "yaman")!;
    // the same notes heard against a Sa a fourth too low and the true Sa (score evidence equal)
    const shift = (sa: number) => yaman.notes.map(n => { const s = n.octave * 12 + n.swara + (sa === 1 ? 0 : 5); return { ...n, swara: ((s % 12) + 12) % 12, octave: Math.floor(s / 12) }; });
    const g = guessRaagAndSa([{ hz: 1, score: 1 }, { hz: 2, score: 1 }], hz => shift(hz), RAAG_LIST);
    expect(g.saHz).toBe(1);
    expect(g.candidates[0].raag.id === "yaman" || g.sameSwaras.some(r => r.id === "yaman")).toBe(true);
  });
});

