import { describe, expect, it } from "vitest";
import { humMask, looksLikeHum, nearMains } from "../hum";
import { trackPitch } from "../track";
import { createLiveTracker } from "../live";

const SR = 44100;

/** Mains hum: a perfectly steady tone with harmonics. */
function hum(fund: number, sec: number, amp = 0.2): Float32Array {
  const n = Math.round(sec * SR), out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const ph = (2 * Math.PI * fund * i) / SR;
    out[i] = amp * (Math.sin(ph) + 0.6 * Math.sin(2 * ph) + 0.3 * Math.sin(3 * ph));
  }
  return out;
}

/** A sung note: vibrato of ±15 cents at 5.5 Hz plus slow drift, as a real voice has. */
function voice(hz: number, sec: number, amp = 0.2): Float32Array {
  const n = Math.round(sec * SR), out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = hz * Math.pow(2, (15 * Math.sin(2 * Math.PI * 5.5 * t) + 8 * t) / 1200);
    ph += (2 * Math.PI * f) / SR;
    out[i] = amp * (Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.25 * Math.sin(3 * ph));
  }
  return out;
}

const voicedShare = (s: Float32Array) => {
  const fr = trackPitch(s, SR).frames;
  return fr.filter(f => f.hz !== null).length / fr.length;
};

describe("electrical hum guard", () => {
  it("knows the mains frequencies", () => {
    expect(nearMains(100.5)).toBe(100);
    expect(nearMains(60)).toBe(60);
    expect(nearMains(110)).toBeNull();
  });

  it("treats a steady run on a mains frequency as hum, a wandering one as voice", () => {
    expect(looksLikeHum(Array(30).fill(100))).toBe(true);
    expect(looksLikeHum(Array.from({ length: 30 }, (_, i) => 100 * Math.pow(2, (6 * Math.sin(i / 3)) / 1200)))).toBe(false);
    expect(looksLikeHum(Array(30).fill(130.8))).toBe(false);
  });

  it("only masks runs long enough to judge", () => {
    const hz = [null, ...Array(5).fill(100), null, ...Array(30).fill(100)];
    const m = humMask(hz, 0.01);
    expect(m.slice(1, 6).every(x => !x)).toBe(true);
    expect(m.slice(7).every(x => x)).toBe(true);
  });

  it.each([100, 120])("reports no pitch for %d Hz hum in a recording", hz => {
    expect(voicedShare(hum(hz, 2))).toBe(0);
  });

  it("still hears a low singer holding a note near 100 Hz", () => {
    expect(voicedShare(voice(100, 2))).toBeGreaterThan(0.9);
  });

  it("drops hum in the live view after a fifth of a second", () => {
    const h = hum(100, 0.2);
    const tr = createLiveTracker({ sampleRate: SR, latest: n => h.subarray(h.length - n) }, 130.81);
    const out: (number | null)[] = [];
    for (let t = 0; t <= 0.5; t += 1 / 60) out.push(tr.step(t));
    expect(out.slice(-10).every(c => c === null)).toBe(true);
  });
});
