/**
 * Baseline: the time-domain autocorrelation method that SwaraTuner.tsx used
 * before this module existed (centre clipping + first-dip search + parabolic
 * interpolation). Ported as-is so the benchmark can compare against it.
 *
 * Only change: the pitch range comes from settings instead of a fixed 85–850 Hz,
 * so every method is tested over the same range.
 */
import type { DetectorFn } from "../types";

export function makeAutocorrDetector(minHz: number, maxHz: number): DetectorFn {
  return (buffer, sampleRate) => {
    const size = buffer.length;

    // Centre clipping: trim the ends of the window until the signal is near zero.
    let r1 = 0;
    let r2 = size - 1;
    const clippingThreshold = 0.15;
    for (let i = 0; i < size / 2; i++) {
      if (Math.abs(buffer[i]) < clippingThreshold) { r1 = i; break; }
    }
    for (let i = size - 1; i >= size / 2; i--) {
      if (Math.abs(buffer[i]) < clippingThreshold) { r2 = i; break; }
    }
    const clipped = buffer.subarray(r1, r2);
    const n = clipped.length;
    const maxLag = Math.min(n - 1, Math.ceil(sampleRate / minHz) + 2);

    const r = new Float32Array(maxLag + 1);
    for (let lag = 0; lag <= maxLag; lag++) {
      let sum = 0;
      for (let j = 0; j < n - lag; j++) sum += clipped[j] * clipped[j + lag];
      r[lag] = sum;
    }

    // Walk down from lag 0 to the first dip.
    let lag0 = 0;
    while (lag0 < maxLag - 1 && r[lag0] > r[lag0 + 1]) lag0++;

    // Highest peak after the dip.
    let bestVal = -Infinity;
    let bestLag = -1;
    for (let lag = Math.max(1, lag0); lag < maxLag; lag++) {
      if (r[lag] > r[lag - 1] && r[lag] > r[lag + 1] && r[lag] > bestVal) {
        bestVal = r[lag];
        bestLag = lag;
      }
    }
    if (bestLag <= 0 || r[0] <= 0) return { hz: null, clarity: 0 };

    const a = r[bestLag - 1];
    const b = r[bestLag];
    const c = r[bestLag + 1];
    const div = 2 * (a + c - 2 * b);
    const period = bestLag + (div !== 0 ? (a - c) / div : 0);
    const hz = sampleRate / period;
    const clarity = Math.max(0, Math.min(1, bestVal / r[0]));

    if (hz < minHz || hz > maxHz) return { hz: null, clarity };
    return { hz, clarity };
  };
}
