import { describe, expect, it } from "vitest";
import { centsBetween } from "../../analysis/music";
import { median } from "../../analysis/sa";
import { trackPitch } from "../../analysis/track";
import { firstStringForRaag, karplusStrong, stringHz } from "../tanpura";

describe("tanpura tuning", () => {
  it("tunes strings in just intonation", () => {
    expect(stringHz("first", 200, "Pa")).toBeCloseTo(150, 6);
    expect(stringHz("first", 210, "Ma")).toBeCloseTo(140, 6);
    expect(stringHz("first", 160, "Ni")).toBeCloseTo(150, 6);
    expect(stringHz("kharaj", 138.59, "Pa")).toBeCloseTo(69.295, 3);
  });

  it("chooses the first string from the raag", () => {
    expect(firstStringForRaag([0, 2, 4, 6, 7, 9, 11])).toBe("Pa"); // Yaman
    expect(firstStringForRaag([0, 3, 5, 8, 10])).toBe("Ma");       // Malkauns
    expect(firstStringForRaag([0, 1, 4, 6, 9, 11])).toBe("Ni");    // Marwa
  });

  for (const hz of [69.3, 103.9, 138.59, 207.65, 233.08]) {
    it(`synthesised string at ${hz} Hz is in tune within 3 cents`, () => {
      const sr = 48000;
      const samples = karplusStrong(sr, hz, 2);
      const t = trackPitch(samples, sr, "mpm");
      const got = t.frames.filter(f => f.hz !== null && f.timeSec > 0.1 && f.timeSec < 1.5).map(f => f.hz!);
      expect(got.length).toBeGreaterThan(50);
      expect(Math.abs(centsBetween(median(got), hz))).toBeLessThan(3);
    });
  }
});
