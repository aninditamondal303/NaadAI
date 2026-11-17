import { describe, expect, it } from "vitest";
import { RAAG_LIST } from "../../data/allRaags";
import { moreAlaap, moreSargams } from "../generate";
import { outsideRaag } from "../swaralipi";
import { parseNote } from "../notation";

describe("generated sargams and alaap", () => {
  for (const raag of RAAG_LIST) {
    it(`${raag.id}: only the raag's swaras, ending on a resting swara`, () => {
      for (let set = 1; set <= 5; set++) {
        for (const ph of [...moreSargams(raag, set), ...moreAlaap(raag, set)]) {
          expect(outsideRaag(ph, raag.allowedSwaras), ph).toEqual([]);
          const last = ph.split(" ").filter(t => t !== "-").pop()!;
          const cls = ((parseNote(last).semitones % 12) + 12) % 12;
          expect([0, raag.vadi, raag.samvadi]).toContain(cls);
        }
      }
    });
  }

  it("ascends only by aroh swaras (Bhupali has no Ma or Ni either way)", () => {
    const bhupali = RAAG_LIST.find(r => r.id === "bhupali")!;
    for (let set = 1; set <= 10; set++) for (const ph of moreSargams(bhupali, set)) expect(ph).not.toMatch(/\b[mMnN]/);
  });

  it("is repeatable", () => {
    const yaman = RAAG_LIST.find(r => r.id === "yaman")!;
    expect(moreSargams(yaman, 3)).toEqual(moreSargams(yaman, 3));
    expect(moreSargams(yaman, 3)).not.toEqual(moreSargams(yaman, 4));
  });
});
