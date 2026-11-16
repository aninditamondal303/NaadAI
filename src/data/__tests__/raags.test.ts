import { describe, expect, it } from "vitest";
import { RAAG_LIST } from "../allRaags";
import { RAAG_DETAILS } from "../raagDetails";

const SYMBOL_INDEX: Record<string, number> = { S: 0, r: 1, R: 2, g: 3, G: 4, m: 5, M: 6, P: 7, d: 8, D: 9, n: 10, N: 11 };

/** All swara letters used in a phrase like "N, R G R, P R" (ignoring octave marks and commas). */
const swarasIn = (phrase: string) => [...phrase].filter(ch => ch in SYMBOL_INDEX);

describe("raag library", () => {
  it("has unique ids and no padded duplicates", () => {
    const ids = RAAG_LIST.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    const names = RAAG_LIST.map(r => r.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  for (const r of RAAG_LIST) {
    it(`${r.id}: aroh, avaroh, vadi and samvadi use only the raag's swaras`, () => {
      const allowed = new Set(r.allowedSwaras);
      for (const sym of [...r.aroha, ...r.avaroha].flatMap(swarasIn)) {
        expect(allowed.has(SYMBOL_INDEX[sym]), `${sym} in ${r.id}`).toBe(true);
      }
      expect(allowed.has(r.vadi)).toBe(true);
      expect(allowed.has(r.samvadi)).toBe(true);
    });
  }

  for (const [id, d] of Object.entries(RAAG_DETAILS)) {
    it(`${id}: pakad, chalan and nyas only use the raag's swaras`, () => {
      const raag = RAAG_LIST.find(r => r.id === id);
      expect(raag, `${id} must exist in allRaags`).toBeDefined();
      const allowed = new Set(raag!.allowedSwaras);
      for (const sym of [d.pakad, ...d.chalan, ...d.nyas].flatMap(swarasIn)) {
        expect(allowed.has(SYMBOL_INDEX[sym]), `${sym} in ${id}`).toBe(true);
      }
      for (const s of d.similar) if (s.raagId) expect(RAAG_LIST.some(r => r.id === s.raagId)).toBe(true);
    });
  }
});
