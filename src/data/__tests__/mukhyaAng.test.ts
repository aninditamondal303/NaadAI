import { describe, expect, it } from "vitest";
import { RAAG_LIST } from "../allRaags";
import { angPhrases, MUKHYA_ANG, vishrantiSwaras } from "../mukhyaAng";
import { outsideRaag } from "../../practice/swaralipi";

describe("mukhya ang", () => {
  it("converts site notation to app notation", () => {
    expect(angPhrases("yaman")[0]).toBe("N, R G");
    expect(angPhrases("darbari")[0]).toBe("S R g g");
    expect(angPhrases("hansasdhwani")[0].startsWith("N, R G P")).toBe(true);
  });
  for (const r of RAAG_LIST) {
    it(`${r.id}: present and uses only the raag's swaras`, () => {
      expect(MUKHYA_ANG[r.id]).toBeTruthy();
      for (const ph of angPhrases(r.id)) expect(outsideRaag(ph, r.allowedSwaras), ph).toEqual([]);
      expect(outsideRaag(vishrantiSwaras(r.id).join(" "), r.allowedSwaras)).toEqual([]);
    });
  }
});
