/**
 * McLeod Pitch Method (MPM).
 * McLeod & Wyvill (2005), "A smarter way to find pitch", ICMC.
 *
 * Steps: normalised square difference function (NSDF, computed with an FFT)
 * -> "key maxima" between zero crossings -> first key maximum that reaches
 * k x the highest one -> parabolic interpolation.
 *
 * Why our own implementation instead of the `pitchy` library: pitchy searches
 * every lag up to the window length. During fast gamaks that let it lock onto
 * lags far below the lowest singable pitch (we measured readings of ~22 Hz on
 * a 6 Hz, ±150-cent gamak around 207 Hz). Here the search is limited to the
 * lags that correspond to minHz..maxHz.
 */
import type { DetectorFn } from "../types";

/** McLeod's "k" constant: pick the first peak that reaches k x the highest peak. */
export const MPM_K = 0.9;
export function makeMpmDetector(minHz: number, maxHz: number, k = MPM_K): DetectorFn {
  let fftSize = 0;
  let re = new Float64Array(0);
  let im = new Float64Array(0);
  let nsdf = new Float64Array(0);

  return (buffer, sampleRate) => {
    const w = buffer.length;
    const maxLag = Math.min(w - 2, Math.ceil(sampleRate / minHz));
    const minLag = Math.max(2, Math.floor(sampleRate / maxHz));

    // --- autocorrelation r(tau) via FFT (zero-padded to avoid wrap-around)
    if (fftSize < 2 * w) {
      fftSize = 1;
      while (fftSize < 2 * w) fftSize *= 2;
      re = new Float64Array(fftSize);
      im = new Float64Array(fftSize);
    }
    re.fill(0);
    im.fill(0);
    for (let i = 0; i < w; i++) re[i] = buffer[i];
    fft(re, im, false);
    for (let i = 0; i < fftSize; i++) { re[i] = re[i] * re[i] + im[i] * im[i]; im[i] = 0; }
    fft(re, im, true); // re[tau] is now r(tau)

    // --- NSDF n(tau) = 2 r(tau) / m(tau)
    if (nsdf.length < maxLag + 2) nsdf = new Float64Array(maxLag + 2);
    let m = 2 * re[0];
    if (m <= 0) return { hz: null, clarity: 0 };
    nsdf[0] = 1;
    for (let tau = 1; tau <= maxLag + 1; tau++) {
      m -= buffer[tau - 1] * buffer[tau - 1] + buffer[w - tau] * buffer[w - tau];
      nsdf[tau] = m > 1e-12 ? (2 * re[tau]) / m : 0;
    }

    // --- key maxima: the highest point between each upward and downward zero crossing,
    // skipping the lobe around lag 0.
    let tau = 1;
    while (tau <= maxLag && nsdf[tau] > 0) tau++;
    const peaks: number[] = [];
    let best = -1;
    while (tau <= maxLag) {
      while (tau <= maxLag && nsdf[tau] <= 0) tau++;
      let peak = -1;
      while (tau <= maxLag && nsdf[tau] > 0) {
        if (tau >= minLag && (peak < 0 || nsdf[tau] > nsdf[peak])) peak = tau;
        tau++;
      }
      if (peak > 0) {
        peaks.push(peak);
        if (best < 0 || nsdf[peak] > nsdf[best]) best = peak;
      }
    }
    if (best < 0) return { hz: null, clarity: 0 };

    const cutoff = k * nsdf[best];
    const chosen = peaks.find(p => nsdf[p] >= cutoff)!;

    // --- parabolic interpolation
    const a = nsdf[chosen - 1];
    const b = nsdf[chosen];
    const c = nsdf[chosen + 1];
    const div = a + c - 2 * b;
    const shift = div !== 0 ? (a - c) / (2 * div) : 0;
    const period = chosen + shift;
    const clarity = Math.min(1, b - 0.25 * (a - c) * shift);
    const hz = sampleRate / period;

    if (hz < minHz || hz > maxHz) return { hz: null, clarity: 0 };
    return { hz, clarity };
  };
}

/** In-place iterative radix-2 FFT. `re.length` must be a power of two. */
function fft(re: Float64Array, im: Float64Array, inverse: boolean): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let t = re[i]; re[i] = re[j]; re[j] = t;
      t = im[i]; im[i] = im[j]; im[j] = t;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const ang = ((inverse ? 2 : -2) * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let j = 0; j < half; j++) {
        const ar = re[i + j + half], ai = im[i + j + half];
        const tr = ar * cr - ai * ci;
        const ti = ar * ci + ai * cr;
        re[i + j + half] = re[i + j] - tr;
        im[i + j + half] = im[i + j] - ti;
        re[i + j] += tr;
        im[i + j] += ti;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }
  if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
}
