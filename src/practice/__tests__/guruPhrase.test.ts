import { describe, expect, it } from "vitest";
import { MAX_CONTOUR, phraseFromPoints, semitoneToSymbol, validateGuruPhrase } from "../guruPhrase";

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

  describe("checking a phrase from a link", () => {
    const good = { v: 1, id: "gabc123", by: "Guruji", raagId: "yaman", notes: "N, R G", contour: [0, 10, null, 200], created: "2026-11-19T10:00:00.000Z" };
    it("accepts a well-formed phrase", () => {
      expect(validateGuruPhrase(good)).toEqual(good);
    });
    it.each([
      ["wrong version", { ...good, v: 2 }],
      ["unknown swara", { ...good, notes: "S X" }],
      ["markup in the notes", { ...good, notes: "<img src=x>" }],
      ["path in the raag id", { ...good, raagId: "../yaman" }],
      ["pitch out of range", { ...good, contour: [0, 99999] }],
      ["pitch not a number", { ...good, contour: [0, "200"] }],
      ["infinite pitch", { ...good, contour: [0, Infinity] }],
      ["too long", { ...good, contour: new Array(MAX_CONTOUR + 1).fill(0) }],
      ["name too long", { ...good, by: "x".repeat(41) }],
      ["not an object", "yaman"],
    ])("refuses %s", (_, g) => {
      expect(() => validateGuruPhrase(g)).toThrow();
    });
  });
});
