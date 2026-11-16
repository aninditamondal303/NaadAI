import { describe, expect, it } from "vitest";
import { clapAt, TAALS } from "../../data/taals";
import { bolTimes, strokesFor, synthStroke } from "../tabla";

describe("taal library", () => {
  it("has the 10 taals from the plan", () => {
    expect(TAALS.map(t => t.name)).toEqual([
      "Teentaal", "Ektaal", "Jhaptaal", "Rupak", "Dadra", "Keherwa", "Jhoomra", "Tilwada", "Chautaal", "Deepchandi",
    ]);
  });

  for (const t of TAALS) {
    it(`${t.name}: matras, vibhags, claps and theka agree`, () => {
      expect(t.theka.length).toBe(t.matras);
      expect(t.vibhags.reduce((a, b) => a + b, 0)).toBe(t.matras);
      expect(t.claps.length).toBe(t.vibhags.length);
      // every bol is playable
      for (const matra of t.theka) for (const bol of matra) expect(() => strokesFor(bol)).not.toThrow();
    });
  }

  it("marks sam and khali in the right places", () => {
    const teen = TAALS.find(t => t.id === "teentaal")!;
    expect(clapAt(teen, 1)).toBe("X");
    expect(clapAt(teen, 9)).toBe("0");
    expect(clapAt(teen, 13)).toBe(3);
    expect(clapAt(teen, 2)).toBeNull();
    const rupak = TAALS.find(t => t.id === "rupak")!;
    expect(clapAt(rupak, 1)).toBe("0"); // Rupak starts on khali
  });

  it("places bols evenly inside each matra", () => {
    const ek = TAALS.find(t => t.id === "ektaal")!;
    const times = bolTimes(ek, 60);
    const tirakita = times.filter(e => e.matra === 4);
    expect(tirakita.map(e => e.at)).toEqual([3, 3.25, 3.5, 3.75]);
  });

  it("synthesised strokes are deterministic and not silent", () => {
    const a = synthStroke("na", 48000, 138.59);
    const b = synthStroke("na", 48000, 138.59);
    expect(b).toEqual(a);
    expect(Math.max(...a.map(Math.abs))).toBeGreaterThan(0.1);
  });
});
