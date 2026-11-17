import { describe, expect, it } from "vitest";
import { ALAAP, COMPOSITIONS } from "../compositions";
import { RAAG_LIST } from "../allRaags";
import { TAALS } from "../taals";
import { outsideRaag, parseLine, timeLines } from "../../practice/swaralipi";

const raag = (id: string) => RAAG_LIST.find(r => r.id === id)!;

describe("compositions", () => {
  for (const c of COMPOSITIONS) {
    describe(c.id, () => {
      const taal = TAALS.find(t => t.id === c.taalId)!;
      const lines = [...c.sthayi, ...c.antara];
      it("has a known raag and taal", () => {
        expect(raag(c.raagId)).toBeTruthy();
        expect(taal).toBeTruthy();
      });
      it("fills exactly one avartan per line", () => {
        for (const l of lines) {
          expect(parseLine(l.notes)).toHaveLength(taal.matras);
          if (l.words) expect(l.words.trim().split(/\s+/)).toHaveLength(taal.matras);
        }
      });
      it("uses only the raag's swaras", () => {
        for (const l of lines) expect(outsideRaag(l.notes, raag(c.raagId).allowedSwaras)).toEqual([]);
      });
      it("gives every sung syllable a swara of its own", () => {
        for (const l of lines) {
          if (!l.words) continue;
          const notes = l.notes.trim().split(/\s+/);
          l.words.trim().split(/\s+/).forEach((w, i) => {
            if (w !== "-") expect(notes[i], `${c.id} matra ${i + 1} "${w}"`).not.toMatch(/^[-_]$/);
          });
        }
      });
      it("stays within mandra Pa and taar Pa", () => {
        const { notes } = timeLines(lines.map(l => l.notes), 1);
        for (const n of notes) { expect(n.semitones).toBeGreaterThanOrEqual(-5); expect(n.semitones).toBeLessThanOrEqual(19); }
      });
    });
  }

  it("has a sargam geet and a bandish for every raag with alaap", () => {
    for (const id of Object.keys(ALAAP)) {
      expect(COMPOSITIONS.filter(c => c.raagId === id).map(c => c.kind).sort()).toEqual(["bandish", "sargam-geet"]);
    }
  });

  it("alaap phrases use only the raag's swaras", () => {
    for (const [id, stages] of Object.entries(ALAAP)) {
      for (const st of stages) for (const ph of st.phrases) expect(outsideRaag(ph, raag(id).allowedSwaras), `${id}: ${ph}`).toEqual([]);
    }
  });
});

describe("timing", () => {
  it("holds lengthen the previous note", () => {
    const { notes } = timeLines(["S - R.G _"], 1);
    expect(notes.map(n => [n.start, n.dur])).toEqual([[0, 2], [2, 0.5], [2.5, 0.5]]);
  });
});
