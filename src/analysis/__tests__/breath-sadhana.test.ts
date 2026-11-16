import { describe, expect, it } from "vitest";
import { measureSaSadhana } from "../sa";
import { findPhrases, summariseTake } from "../summary";
import { trackPitch } from "../track";
import { oscillating, steady, synthVoice } from "../../../eval/synth";

const SR = 44100;

describe("breath per phrase", () => {
  it("splits singing at breaths and ignores short articulation gaps", () => {
    const clip = synthVoice("phrases", [
      { durSec: 0.3, f0: null },
      { durSec: 2.0, f0: steady(140) },
      { durSec: 0.1, f0: null },          // articulation, same phrase
      { durSec: 1.0, f0: steady(157) },
      { durSec: 0.8, f0: null },          // breath
      { durSec: 4.0, f0: steady(176) },
      { durSec: 0.5, f0: null },
    ], { sampleRate: SR, jitterCents: 0 });
    const phrases = findPhrases(trackPitch(clip.samples, SR));
    expect(phrases).toHaveLength(2);
    expect(phrases[0].durSec).toBeGreaterThan(2.9);
    expect(phrases[0].durSec).toBeLessThan(3.3);
    expect(phrases[1].durSec).toBeGreaterThan(3.8);
    expect(phrases[1].durSec).toBeLessThan(4.2);
    const m = summariseTake(trackPitch(clip.samples, SR), { saHz: 140 });
    expect(m.longestPhraseSec!).toBeCloseTo(phrases[1].durSec, 5);
  });
});

describe("Sa sadhana", () => {
  it("measures hold length, offset and wobble against the given Sa", () => {
    const sa = 138.59;
    const sharp = sa * Math.pow(2, 8 / 1200); // sung 8 cents sharp, with a ±6-cent waver
    const clip = synthVoice("sadhana", [
      { durSec: 0.3, f0: null },
      { durSec: 6, f0: oscillating(sharp, 6, 4) },
      { durSec: 0.5, f0: null },
      { durSec: 2, f0: steady(sa) },
      { durSec: 0.3, f0: null },
    ], { sampleRate: SR, jitterCents: 0 });
    const r = measureSaSadhana(trackPitch(clip.samples, SR), sa)!;
    expect(r.longestHoldSec).toBeGreaterThan(5.8);
    expect(r.longestHoldSec).toBeLessThan(6.2);
    expect(r.totalOnSaSec).toBeGreaterThan(7.6);
    expect(r.medianOffsetCents).toBeGreaterThan(6);
    expect(r.medianOffsetCents).toBeLessThan(10);
    expect(r.wobbleCents).toBeGreaterThan(2);
    expect(r.wobbleCents).toBeLessThan(7);
  });

  it("counts taar Sa as Sa, and returns null when Sa is never held", () => {
    const taar = synthVoice("taar", [{ durSec: 2, f0: steady(277.18) }], { sampleRate: SR, jitterCents: 0 });
    expect(measureSaSadhana(trackPitch(taar.samples, SR), 138.59)!.longestHoldSec).toBeGreaterThan(1.8);
    const pa = synthVoice("pa", [{ durSec: 2, f0: steady(207.65) }], { sampleRate: SR, jitterCents: 0 });
    expect(measureSaSadhana(trackPitch(pa.samples, SR), 138.59)).toBeNull();
  });
});
