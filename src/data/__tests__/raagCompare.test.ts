import { describe, expect, it } from "vitest";
import { RAAG_LIST } from "../allRaags";
import { CLOSE_PAIRS, compareRaags, differenceSummary } from "../raagCompare";

const r = (id: string) => RAAG_LIST.find(x => x.id === id)!;

describe("raag comparison", () => {
  it("every close pair is in the library", () => {
    for (const [a, b] of CLOSE_PAIRS) { expect(r(a)).toBeTruthy(); expect(r(b)).toBeTruthy(); }
  });
  it("Yaman and Shuddha Kalyan share swaras but not movement", () => {
    const c = compareRaags(r("yaman"), r("shuddhakalyan"));
    expect(c.shared).toContain(6);
    expect(c.sameThaat).toBe(true);
  });
  it("Marwa and Puriya use the same swaras", () => {
    const c = compareRaags(r("marwa"), r("puriya"));
    expect(c.sameSwaras).toBe(true);
    expect(differenceSummary(r("marwa"), r("puriya"), c)[0]).toMatch(/same swaras/);
  });
  it("Bhupali lacks Ma and Ni that Yaman has", () => {
    const c = compareRaags(r("yaman"), r("bhupali"));
    expect(c.onlyA).toEqual(expect.arrayContaining([6, 11]));
    expect(c.onlyB).toEqual([]);
  });
});
