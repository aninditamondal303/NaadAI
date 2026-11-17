import { describe, expect, it } from "vitest";
import { RAAG_LIST } from "../allRaags";
import { pakadFor } from "../pakad";
import { outsideRaag } from "../../practice/swaralipi";

describe("pakad for every raag", () => {
  for (const r of RAAG_LIST) {
    it(`${r.id}: written, and only the raag's swaras`, () => {
      const p = pakadFor(r.id);
      expect(p).toBeTruthy();
      expect(outsideRaag(p!, r.allowedSwaras), p!).toEqual([]);
    });
  }
});
