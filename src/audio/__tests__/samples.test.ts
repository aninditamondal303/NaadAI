import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { centsBetween } from "../../analysis/music";
import { median } from "../../analysis/sa";
import { trackPitch } from "../../analysis/track";
import { TAALS } from "../../data/taals";
import { readWav } from "../../../eval/wav";
import { retuneRate, sampleFor } from "../tabla";
import { nearestOctaveRate } from "../tanpura";

const PUB = join(__dirname, "../../../public/samples");

describe("real tabla and tanpura recordings", () => {
  it("every theka bol in every taal has a recorded sample (or is a rest)", () => {
    const manifest = JSON.parse(readFileSync(join(PUB, "tabla/manifest.json"), "utf8"));
    for (const t of TAALS) for (const m of t.theka) for (const bol of m) {
      const s = sampleFor(bol);
      if (s) expect(existsSync(join(PUB, "tabla", manifest.bols[s])), `${bol} -> ${s}`).toBe(true);
    }
  });

  it("the licence and credit ship with the samples", () => {
    for (const d of ["tabla", "tanpura"]) {
      expect(readFileSync(join(PUB, d, "LICENSE"), "utf8")).toMatch(/MIT License/);
      expect(JSON.parse(readFileSync(join(PUB, d, "manifest.json"), "utf8")).credit).toMatch(/oormicreations\/naad/);
    }
  });

  it("the tanpura recording's Sa matches its manifest (measured with our own pitch tracker)", () => {
    const m = JSON.parse(readFileSync(join(PUB, "tanpura/manifest.json"), "utf8"));
    const d = m.drones.Pa[0];
    const { samples, sampleRate } = readWav(join(PUB, "tanpura", d.file));
    const hz = trackPitch(samples, sampleRate, "mpm", { silenceDb: -70 }).frames.filter(f => f.hz).map(f => f.hz!);
    // most readings sit on Sa or kharaj Sa; fold to the Sa octave
    const folded = hz.map(h => { let x = h; while (x < d.saHz / Math.SQRT2) x *= 2; while (x > d.saHz * Math.SQRT2) x /= 2; return x; });
    expect(Math.abs(centsBetween(median(folded), d.saHz))).toBeLessThan(15);
  });

  it("the tabla's dayan pitch matches its manifest", () => {
    const m = JSON.parse(readFileSync(join(PUB, "tabla/manifest.json"), "utf8"));
    const { samples, sampleRate } = readWav(join(PUB, "tabla", m.bols.Na));
    const hz = trackPitch(samples, sampleRate, "mpm").frames.filter(f => f.hz && f.timeSec < 0.5).map(f => f.hz!);
    expect(Math.abs(centsBetween(median(hz), m.dayanHz))).toBeLessThan(15);
  });

  it("retunes to the singer's Sa by at most 6 semitones, picking the nearest octave", () => {
    for (const sa of [110, 130.81, 138.59, 164.81, 196, 207.65, 233.08]) {
      for (const rate of [nearestOctaveRate(131.2, sa), retuneRate(262.2, sa)]) {
        expect(Math.abs(12 * Math.log2(rate))).toBeLessThanOrEqual(6.0001);
      }
      // after retuning, Sa lands on the singer's Sa in some octave
      const shifted = 131.2 * nearestOctaveRate(131.2, sa);
      const c = centsBetween(shifted, sa);
      expect(Math.abs(c - 1200 * Math.round(c / 1200))).toBeLessThan(0.01);
    }
  });
});
