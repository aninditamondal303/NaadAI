import { describe, expect, it } from "vitest";
import { matchPhrase, segmentNotes } from "../phraseMatch";

const sing = (notes: [number, number, number][]) => {
  // [cents, start, dur] -> 60 readings/s with silence between
  const pts: { t: number; c: number | null }[] = [];
  let t = 0;
  for (const [c, , dur] of notes) {
    for (let k = 0; k < dur * 60; k++) { pts.push({ t, c }); t += 1 / 60; }
    for (let k = 0; k < 6; k++) { pts.push({ t, c: null }); t += 1 / 60; }
  }
  return pts;
};

describe("guru-shishya phrase matching", () => {
  it("finds the sung notes", () => {
    const s = segmentNotes(sing([[0, 0, 0.5], [205, 0, 0.4], [398, 0, 0.6]]));
    expect(s.map(n => n.semitone)).toEqual([0, 2, 4]);
    expect(s[1].cents).toBe(5);
  });

  it("scores a perfect echo 100", () => {
    const r = matchPhrase([0, 2, 4, 2, 0], segmentNotes(sing([[0, 0, 0.4], [200, 0, 0.4], [400, 0, 0.4], [200, 0, 0.4], [0, 0, 0.4]])));
    expect(r.score).toBe(100);
  });

  it("marks a missed swara without spoiling the rest", () => {
    const r = matchPhrase([0, 2, 4, 7], segmentNotes(sing([[0, 0, 0.4], [400, 0, 0.4], [700, 0, 0.4]])));
    expect(r.marks.map(m => m.hit)).toEqual([true, false, true, true]);
  });

  it("counts a flat swara as sung but not in tune", () => {
    const r = matchPhrase([0, 4], segmentNotes(sing([[0, 0, 0.4], [360, 0, 0.4]])));
    expect(r.marks[1]).toEqual({ semitone: 4, hit: true, cents: -40 });
    expect(r.score).toBe(75);
  });

  it("ignores very short blips", () => {
    expect(segmentNotes(sing([[0, 0, 0.05]]))).toEqual([]);
  });
});
