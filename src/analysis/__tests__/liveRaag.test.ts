import { describe, expect, it } from "vitest";
import { RAAG_LIST } from "../../data/allRaags";
import { createLiveRaag } from "../liveRaag";

describe("live raag recognition", () => {
  it("says nothing until enough is sung, then names a Yaman-family raag for N R G M D N S'", () => {
    const lr = createLiveRaag(RAAG_LIST);
    expect(lr.guess().candidates).toHaveLength(0);
    let t = 0;
    const pts: { t: number; c: number | null }[] = [];
    const phrase = [-100, 0, 200, 400, 600, 400, 200, 0, 900, 1100, 1200, 1100, 900, 700, 600, 400, 200, 0];
    for (let rep = 0; rep < 2; rep++) for (const c of phrase) {
      for (let k = 0; k < 30; k++) { pts.push({ t, c: c + Math.sin(k) * 4 }); t += 1 / 60; }
      pts.push({ t, c: null }); t += 0.05;
    }
    lr.add(pts.slice(0, 200));
    lr.add(pts);
    const g = lr.guess();
    expect(g.candidates.length).toBeGreaterThan(0);
    const names = [g.candidates[0].raag.id, ...g.sameSwaras.map(r => r.id)];
    expect(names).toContain("yaman");
  });
});
