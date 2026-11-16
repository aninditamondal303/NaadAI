import { describe, expect, it } from "vitest";
import { centsBetween } from "../music";
import { detectSa, measureHeldSa } from "../sa";
import { findHeldNotes, summariseTake } from "../summary";
import { trackPitch } from "../track";
import { glide, oscillating, steady, synthVoice, SWARA_CENTS, type Segment } from "../../../eval/synth";

const SR = 44100;
const at = (sa: number, sw: string, oct = 0, offsetCents = 0) =>
  sa * Math.pow(2, (SWARA_CENTS[sw] + 1200 * oct + offsetCents) / 1200);

/** A short alaap-like phrase that keeps returning to Sa, like real singing. */
function alaap(sa: number, notes: [string, number, number][]): Segment[] {
  const segs: Segment[] = [{ durSec: 0.2, f0: null }];
  for (const [sw, oct, dur] of notes) {
    segs.push({ durSec: dur, f0: steady(at(sa, sw, oct)) });
    segs.push({ durSec: 0.1, f0: null });
  }
  return segs;
}

const YAMAN: [string, number, number][] = [
  ["S", 0, 1.5], ["N", -1, 0.6], ["R", 0, 0.6], ["S", 0, 1.2], ["N", -1, 0.5], ["R", 0, 0.5], ["G", 0, 1.0],
  ["R", 0, 0.5], ["S", 0, 1.0], ["G", 0, 0.6], ["M", 0, 0.6], ["P", 0, 1.2], ["M", 0, 0.5], ["G", 0, 0.8],
  ["R", 0, 0.5], ["S", 0, 1.5],
];

const MALKAUNS: [string, number, number][] = [
  ["S", 0, 1.5], ["n", -1, 0.6], ["S", 0, 1.0], ["g", 0, 0.6], ["m", 0, 1.2], ["g", 0, 0.5], ["S", 0, 1.0],
  ["m", 0, 0.6], ["d", 0, 0.8], ["n", 0, 0.6], ["d", 0, 0.5], ["m", 0, 1.0], ["g", 0, 0.5], ["S", 0, 1.5],
];

describe("Sa detection", () => {
  for (const [label, sa] of [["male C#3", 138.59], ["female G#3", 207.65], ["low male A2", 110]] as const) {
    it(`finds Sa in a Yaman phrase (${label}) within 10 cents`, () => {
      const clip = synthVoice("yaman", alaap(sa, YAMAN), { sampleRate: SR });
      const d = detectSa(trackPitch(clip.samples, SR));
      expect(d.saHz).not.toBeNull();
      expect(Math.abs(centsBetween(d.saHz!, sa))).toBeLessThan(10);
      expect(d.unsure).toBe(false);
    });
  }

  it("finds Sa in Malkauns (no Pa) when told the raag has no Pa", () => {
    const sa = 146.83;
    const clip = synthVoice("malkauns", alaap(sa, MALKAUNS), { sampleRate: SR });
    const d = detectSa(trackPitch(clip.samples, SR), { raagHasNoPa: true });
    expect(Math.abs(centsBetween(d.saHz!, sa))).toBeLessThan(10);
  });

  it("returns no answer when there is too little steady singing", () => {
    const clip = synthVoice("glide", [{ durSec: 1.5, f0: glide(140, 280, 1.5) }], { sampleRate: SR });
    const d = detectSa(trackPitch(clip.samples, SR));
    expect(d.saHz).toBeNull();
    expect(d.unsure).toBe(true);
  });

  it("measures a held Sa and its wobble", () => {
    const clip = synthVoice("sa", [
      { durSec: 0.3, f0: null },
      { durSec: 3, f0: oscillating(130.81, 10, 5) },
      { durSec: 0.3, f0: null },
    ], { sampleRate: SR, jitterCents: 0 });
    const r = measureHeldSa(trackPitch(clip.samples, SR))!;
    expect(Math.abs(centsBetween(r.saHz, 130.81))).toBeLessThan(3);
    expect(r.heldSec).toBeGreaterThan(2.5);
    // a ±10 cent sine wobbles ~7 cents from centre on median
    expect(r.wobbleCents).toBeGreaterThan(4);
    expect(r.wobbleCents).toBeLessThan(10);
  });
});

describe("take summary", () => {
  const sa = 138.59;

  it("finds held notes with their swara, octave and deviation", () => {
    const clip = synthVoice("notes", [
      { durSec: 0.2, f0: null },
      { durSec: 1, f0: steady(at(sa, "N", -1)) },
      { durSec: 0.2, f0: null },
      { durSec: 1, f0: steady(at(sa, "G", 0, 15)) }, // Ga sung 15 cents sharp
      { durSec: 0.2, f0: null },
      { durSec: 0.1, f0: steady(at(sa, "P")) }, // too short to count as held
      { durSec: 0.2, f0: null },
    ], { sampleRate: SR, jitterCents: 0 });
    const held = findHeldNotes(trackPitch(clip.samples, SR), sa);
    expect(held.map(n => [n.swara, n.octave])).toEqual([[11, -1], [4, 0]]);
    expect(held[1].deviationCents).toBeGreaterThan(12);
    expect(held[1].deviationCents).toBeLessThan(18);
  });

  it("reports measured numbers only, and marks swaras outside the raag", () => {
    const clip = synthVoice("phrase", alaap(sa, [["S", 0, 1], ["R", 0, 1], ["m", 0, 1], ["G", 0, 1]]), { sampleRate: SR });
    const m = summariseTake(trackPitch(clip.samples, SR), { saHz: sa, allowedSwaras: [0, 2, 4, 6, 7, 9, 11] });
    expect(m.saSource).toBe("profile");
    expect(m.heldWithin20CentsPct).toBeGreaterThan(95);
    expect(m.lowestNote!.label).toBe("S");
    expect(m.highestNote!.label).toBe("m");
    const ma = m.swaras.find(s => s.symbol === "m")!;
    expect(ma.inRaag).toBe(false); // shuddha Ma is not in Yaman's list
    expect(m.swaras.find(s => s.symbol === "R")!.inRaag).toBe(true);
  });

  it("gives identical results on repeated runs", () => {
    const clip = synthVoice("yaman", alaap(sa, YAMAN), { sampleRate: SR });
    const a = summariseTake(trackPitch(clip.samples, SR));
    const b = summariseTake(trackPitch(clip.samples, SR));
    expect(b).toEqual(a);
  });
});
