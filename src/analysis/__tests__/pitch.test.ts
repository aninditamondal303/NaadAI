import { describe, expect, it } from "vitest";
import { centsBetween, foldToOctave, hzFromCents } from "../music";
import { trackPitch } from "../track";
import type { PitchMethodName } from "../types";
import { seededRandom, steady, oscillating, synthVoice } from "../../../eval/synth";

const SR = 44100;

function voicedHz(track: ReturnType<typeof trackPitch>, from: number, to: number) {
  return track.frames.filter(f => f.timeSec >= from && f.timeSec <= to && f.hz !== null).map(f => f.hz!);
}

describe("music helpers", () => {
  it("converts between Hz and cents", () => {
    expect(centsBetween(440, 220)).toBeCloseTo(1200, 6);
    expect(centsBetween(hzFromCents(138.59, 702), 138.59)).toBeCloseTo(702, 6);
    expect(foldToOctave(-100)).toBeCloseTo(1100, 6);
    expect(foldToOctave(2500)).toBeCloseTo(100, 6);
  });
});

describe.each<PitchMethodName>(["mpm", "yin"])("%s pitch tracking", method => {
  it("reads a held Sa within 5 cents", () => {
    const clip = synthVoice("sa", [{ durSec: 1.5, f0: steady(138.59) }], { sampleRate: SR, jitterCents: 0 });
    const hz = voicedHz(trackPitch(clip.samples, SR, method), 0.1, 1.4);
    expect(hz.length).toBeGreaterThan(100);
    for (const h of hz) expect(Math.abs(centsBetween(h, 138.59))).toBeLessThan(5);
  });

  it("reads deep mandra Sa (69 Hz) without octave errors", () => {
    const clip = synthVoice("mandra", [{ durSec: 1.5, f0: steady(69.3) }], { sampleRate: SR, jitterCents: 0 });
    const hz = voicedHz(trackPitch(clip.samples, SR, method), 0.1, 1.4);
    expect(hz.length).toBeGreaterThan(100);
    for (const h of hz) expect(Math.abs(centsBetween(h, 69.3))).toBeLessThan(10);
  });

  it("reports no pitch for silence or plain noise", () => {
    const rand = seededRandom(7);
    const noise = new Float32Array(SR).map(() => (rand() * 2 - 1) * 0.1);
    for (const samples of [new Float32Array(SR), noise]) {
      const track = trackPitch(samples, SR, method);
      expect(track.frames.filter(f => f.hz !== null).length).toBe(0);
    }
  });

  it("gives exactly the same result every time", () => {
    const clip = synthVoice("andolan", [{ durSec: 1, f0: oscillating(220, 40, 1.5) }], { sampleRate: SR });
    const a = trackPitch(clip.samples, SR, method);
    const b = trackPitch(clip.samples, SR, method);
    expect(b).toEqual(a);
  });
});

import { westernNote } from "../music";
describe("westernNote", () => {
  it("names notes", () => {
    expect(westernNote(138.59).name).toBe("C#3");
    expect(westernNote(440).name).toBe("A4");
    expect(Math.abs(westernNote(130.81).cents)).toBeLessThan(1);
  });
});
