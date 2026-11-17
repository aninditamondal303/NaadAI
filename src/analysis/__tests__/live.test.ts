import { describe, expect, it } from "vitest";
import { createLiveTracker } from "../live";

function sineSource(hz: number, sampleRate = 44100, amp = 0.3) {
  return {
    sampleRate,
    latest(n: number) {
      const out = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const ph = (2 * Math.PI * hz * i) / sampleRate;
        // a voice-like tone: fundamental plus two harmonics
        out[i] = amp * (Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.25 * Math.sin(3 * ph));
      }
      return out;
    },
  };
}

describe("live tracker", () => {
  it("reads Pa as about 702 cents above Sa", () => {
    const sa = 130.81;
    const tr = createLiveTracker(sineSource(sa * 1.5), sa);
    const c = tr.step(0);
    expect(c).not.toBeNull();
    expect(Math.abs(c! - 701.96)).toBeLessThan(5);
  });

  it("reports no pitch in silence and keeps only recent points", () => {
    const tr = createLiveTracker({ sampleRate: 44100, latest: n => new Float32Array(n) }, 130.81, 2);
    for (let t = 0; t <= 5; t += 0.5) expect(tr.step(t)).toBeNull();
    expect(tr.points[0].t).toBeGreaterThanOrEqual(3);
  });
});
