import { describe, expect, it } from "vitest";
import { findOscillations } from "../ornaments";
import { checkRaagRules, mmss } from "../rules";
import { findHeldNotes } from "../summary";
import { trackPitch } from "../track";
import { glide, oscillating, steady, synthVoice } from "../../../eval/synth";

const SR = 44100;
const sa = 138.59;
const at = (semi: number) => sa * Math.pow(2, semi / 12);
const YAMAN = [0, 2, 4, 6, 7, 9, 11];

describe("raag rule checker", () => {
  it("flags a clearly held wrong swara with its time, and ignores short touches", () => {
    const clip = synthVoice("rules", [
      { durSec: 0.3, f0: null },
      { durSec: 1.0, f0: steady(at(4)) },    // Ga (allowed)
      { durSec: 0.2, f0: null },
      { durSec: 0.3, f0: steady(at(5)) },    // shuddha Ma, short touch: allowed as a passing note
      { durSec: 0.2, f0: null },
      { durSec: 1.0, f0: steady(at(5)) },    // shuddha Ma held: flagged
      { durSec: 0.3, f0: null },
    ], { sampleRate: SR, jitterCents: 0 });
    const flags = checkRaagRules(findHeldNotes(trackPitch(clip.samples, SR), sa), YAMAN);
    expect(flags).toHaveLength(1);
    expect(flags[0].label).toBe("m");
    expect(flags[0].atSec).toBeGreaterThan(1.95);
    expect(flags[0].atSec).toBeLessThan(2.2);
    expect(mmss(62)).toBe("1:02");
  });
});

describe("oscillation measurement", () => {
  const measure = (segs: Parameters<typeof synthVoice>[1]) => {
    const clip = synthVoice("o", segs, { sampleRate: SR, jitterCents: 0 });
    return findOscillations(trackPitch(clip.samples, SR), sa);
  };

  it("measures a slow andolan on komal Re: ~1.5 Hz, ±40 cents", () => {
    const o = measure([{ durSec: 0.2, f0: null }, { durSec: 4, f0: oscillating(at(1), 40, 1.5) }, { durSec: 0.2, f0: null }]);
    expect(o).toHaveLength(1);
    expect(o[0].rateHz).toBeGreaterThan(1.3);
    expect(o[0].rateHz).toBeLessThan(1.7);
    expect(o[0].widthCents).toBeGreaterThan(32);
    expect(o[0].widthCents).toBeLessThan(44);
    expect(o[0].centreLabel).toBe("r");
    expect(o[0].speed).toBe("slow");
  });

  it("measures a fast wide gamak: ~6 Hz, ±150 cents", () => {
    const o = measure([{ durSec: 0.2, f0: null }, { durSec: 2, f0: oscillating(at(7), 150, 6) }, { durSec: 0.2, f0: null }]);
    expect(o.length).toBeGreaterThanOrEqual(1);
    const g = o.reduce((a, b) => (b.durSec > a.durSec ? b : a));
    expect(g.rateHz).toBeGreaterThan(5.4);
    expect(g.rateHz).toBeLessThan(6.6);
    expect(g.widthCents).toBeGreaterThan(110);
    expect(g.speed).toBe("fast");
  });

  it("finds nothing in a steady note or a smooth meend", () => {
    expect(measure([{ durSec: 2, f0: steady(sa) }])).toHaveLength(0);
    expect(measure([{ durSec: 2, f0: glide(sa, at(7), 2) }])).toHaveLength(0);
  });
});
