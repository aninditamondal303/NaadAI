/**
 * YIN pitch detector.
 * de Cheveigné & Kawahara (2002), "YIN, a fundamental frequency estimator
 * for speech and music", JASA 111(4).
 *
 * Steps: difference function -> cumulative mean normalised difference ->
 * first dip under a threshold -> parabolic interpolation.
 */
import type { DetectorFn } from "../types";

/** 0.1–0.15 is the usual range from the paper; lower = stricter. */
export const YIN_THRESHOLD = 0.15;

export function makeYinDetector(minHz: number, maxHz: number, threshold = YIN_THRESHOLD): DetectorFn {
  let d: Float32Array | null = null;

  return (buffer, sampleRate) => {
    const maxLag = Math.ceil(sampleRate / minHz);
    const minLag = Math.max(2, Math.floor(sampleRate / maxHz));
    const w = buffer.length - maxLag; // integration window
    if (w <= 0) throw new Error("YIN window too short for minHz");
    if (!d || d.length !== maxLag + 2) d = new Float32Array(maxLag + 2);

    // 1. Difference function d(tau)
    for (let tau = 1; tau <= maxLag + 1; tau++) {
      let sum = 0;
      for (let j = 0; j < w; j++) {
        const diff = buffer[j] - buffer[j + tau];
        sum += diff * diff;
      }
      d[tau] = sum;
    }

    // 2. Cumulative mean normalised difference d'(tau)
    d[0] = 1;
    let running = 0;
    for (let tau = 1; tau <= maxLag + 1; tau++) {
      running += d[tau];
      d[tau] = running > 0 ? (d[tau] * tau) / running : 1;
    }

    // 3. First tau (in range) where d' dips below the threshold, then walk to the bottom of that dip.
    let tauEst = -1;
    for (let tau = minLag; tau <= maxLag; tau++) {
      if (d[tau] < threshold) {
        while (tau + 1 <= maxLag && d[tau + 1] < d[tau]) tau++;
        tauEst = tau;
        break;
      }
    }

    // No dip under the threshold: fall back to the deepest dip (as in the paper).
    // Its low clarity lets track.ts decide whether to trust it.
    if (tauEst === -1) {
      let best = Infinity;
      for (let tau = minLag; tau <= maxLag; tau++) {
        if (d[tau] < best) { best = d[tau]; tauEst = tau; }
      }
      if (tauEst <= 0 || tauEst >= maxLag + 1) return { hz: null, clarity: 0 };
    }

    // 4. Parabolic interpolation around the dip
    const a = d[tauEst - 1];
    const b = d[tauEst];
    const c = d[tauEst + 1];
    const div = 2 * (a + c - 2 * b);
    const period = tauEst + (div !== 0 ? (a - c) / div : 0);

    const hz = sampleRate / period;
    if (hz < minHz || hz > maxHz) return { hz: null, clarity: 0 };
    return { hz, clarity: Math.max(0, Math.min(1, 1 - b)) };
  };
}
