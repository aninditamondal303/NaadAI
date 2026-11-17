import { describe, expect, it } from "vitest";
import { phraseFromPoints, semitoneToSymbol } from "../guruPhrase";

describe("guru phrase", () => {
  it("writes octaves the app's way", () => {
    expect(semitoneToSymbol(0)).toBe("S");
    expect(semitoneToSymbol(-1)).toBe("N,");
    expect(semitoneToSymbol(12)).toBe("S'");
    expect(semitoneToSymbol(6)).toBe("M");
  });
  it("turns a sung line into swaras and a pitch line", () => {
    const pts: { t: number; c: number | null }[] = [];
    let t = 0;
    for (const [c, d] of [[null, 0.3], [0, 0.5], [200, 0.5], [400, 0.6], [null, 0.4]] as [number | null, number][]) {
      for (let k = 0; k < d * 60; k++) { pts.push({ t, c: c === null ? null : c + Math.sin(k) * 5 }); t += 1 / 60; }
    }
    const g = phraseFromPoints(pts, "yaman", "Guruji")!;
    expect(g.notes).toBe("S R G");
    expect(g.contour.length).toBeGreaterThan(30);
    expect(g.contour[0]).not.toBeNull();
    expect(g.by).toBe("Guruji");
  });
});
