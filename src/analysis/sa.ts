/**
 * Finding the singer's Sa (tonic).
 *
 * Two ways:
 *
 * 1. `measureHeldSa`: the singer holds Sa on purpose ("sing your Sa").
 *    We take the longest steady stretch and report its median pitch.
 *
 * 2. `detectSa`: work it out from any recording.
 *    - keep only steady moments (held notes, not glides)
 *    - fold every pitch into one octave and count how often each pitch occurs
 *      (a "pitch histogram", 10-cent bins)
 *    - score every peak as a possible Sa:
 *        * if we know the raag: how well the whole histogram fits the raag's
 *          swaras placed above that Sa (Sa counts double; time spent on
 *          swaras the raag doesn't use counts against it)
 *        * if we don't: Sa's own weight + the weight a fifth above (Pa,
 *          +702 cents), or a fourth above (Ma, +498) for raags without Pa.
 *          This can confuse Sa with Ma, so it is less reliable.
 *    - choose the octave: nearest to the singer's usual Sa if we know it
 *      (e.g. from their profile), otherwise the one that puts the middle of
 *      their singing between mandra Ni and madhya Ma
 *    If the top two candidates score almost the same, we say we're not sure
 *    rather than guess.
 *
 * Same input always gives the same answer.
 */
import { centsBetween, foldToOctave, hzFromCents } from "./music";
import type { PitchFrame, PitchTrack } from "./types";

/** All folded cents are measured from this arbitrary reference (A1 = 55 Hz). */
const REF_HZ = 55;
const BIN_CENTS = 10;
const BINS = 1200 / BIN_CENTS;

// ---------------------------------------------------------------- steady frames

/**
 * A frame is "steady" if every voiced neighbour within ±`halfWindow` frames is
 * within `toleranceCents` of it. This keeps held notes and drops glides/gamaks.
 */
export function steadyFrames(frames: PitchFrame[], halfWindow = 5, toleranceCents = 30): PitchFrame[] {
  const out: PitchFrame[] = [];
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    if (f.hz === null) continue;
    let ok = true;
    for (let j = Math.max(0, i - halfWindow); j <= Math.min(frames.length - 1, i + halfWindow); j++) {
      const g = frames[j];
      if (g.hz === null || Math.abs(centsBetween(g.hz, f.hz)) > toleranceCents) { ok = false; break; }
    }
    if (ok) out.push(f);
  }
  return out;
}

// ---------------------------------------------------------------- held Sa

export interface HeldSaResult {
  saHz: number;
  /** How long the steadiest stretch lasted (s). */
  heldSec: number;
  /** Typical wobble during that stretch: median |distance from its median| in cents. */
  wobbleCents: number;
}

/**
 * "Sing your Sa": find the longest stretch where the pitch stays within
 * ±`toleranceCents` of where it started, and return its median.
 * Returns null if nothing was held for at least `minSec`.
 */
export function measureHeldSa(track: PitchTrack, minSec = 1, toleranceCents = 35): HeldSaResult | null {
  const frames = track.frames;
  let bestStart = -1;
  let bestLen = 0;
  let i = 0;
  while (i < frames.length) {
    if (frames[i].hz === null) { i++; continue; }
    const anchor = frames[i].hz!;
    let j = i;
    let gaps = 0;
    while (j + 1 < frames.length) {
      const next = frames[j + 1];
      if (next.hz === null) {
        if (++gaps > 3) break; // allow tiny dropouts (~30 ms)
        j++;
        continue;
      }
      if (Math.abs(centsBetween(next.hz, anchor)) > toleranceCents) break;
      gaps = 0;
      j++;
    }
    if (j - i + 1 > bestLen) { bestLen = j - i + 1; bestStart = i; }
    i = j + 1;
  }
  const heldSec = bestLen * track.hopSec;
  if (bestStart < 0 || heldSec < minSec) return null;

  const hz = frames.slice(bestStart, bestStart + bestLen).filter(f => f.hz !== null).map(f => f.hz!);
  const saHz = median(hz);
  const wobbleCents = median(hz.map(h => Math.abs(centsBetween(h, saHz))));
  return { saHz, heldSec, wobbleCents };
}

// ---------------------------------------------------------------- automatic Sa

export interface SaCandidate {
  hz: number;
  /** Folded position (cents above REF, 0..1199). */
  folded: number;
  score: number;
}

export interface SaDetection {
  /** Best guess, or null if there wasn't enough steady singing. */
  saHz: number | null;
  /** 0..1: how far ahead the best candidate is of the runner-up. */
  confidence: number;
  /** True when confidence is too low to trust; ask the singer to sing Sa instead. */
  unsure: boolean;
  /** Seconds of steady singing the decision was based on. */
  steadySec: number;
  candidates: SaCandidate[];
}

export interface DetectSaOptions {
  /** Semitones above Sa used by the raag (e.g. Yaman [0,2,4,6,7,9,11]). Much more reliable when given. */
  allowedSwaras?: number[];
  /** Without allowedSwaras: the raag has no Pa (e.g. Malkauns), so pair Sa with Ma instead. */
  raagHasNoPa?: boolean;
  /** The singer's usual Sa (e.g. from their profile): only used to pick the octave. */
  expectedSaHz?: number;
  /** Below this confidence the result is marked unsure. */
  minConfidence?: number;
  /** Need at least this much steady singing (s). */
  minSteadySec?: number;
}

export const SA_MIN_CONFIDENCE = 0.15;

export function detectSa(track: PitchTrack, opts: DetectSaOptions = {}): SaDetection {
  const minConfidence = opts.minConfidence ?? SA_MIN_CONFIDENCE;
  const steady = steadyFrames(track.frames);
  const steadySec = steady.length * track.hopSec;
  const empty: SaDetection = { saHz: null, confidence: 0, unsure: true, steadySec, candidates: [] };
  if (steadySec < (opts.minSteadySec ?? 2)) return empty;

  // 1. Folded histogram, each frame weighted equally.
  const hist = new Float64Array(BINS);
  for (const f of steady) {
    const c = foldToOctave(centsBetween(f.hz!, REF_HZ));
    hist[Math.floor(c / BIN_CENTS) % BINS] += 1;
  }
  // 2. Light circular smoothing (Gaussian, sigma = 1 bin = 10 cents).
  const smooth = new Float64Array(BINS);
  const kernel = [0.054, 0.242, 0.399, 0.242, 0.054];
  for (let b = 0; b < BINS; b++) {
    let s = 0;
    for (let k = -2; k <= 2; k++) s += hist[(b + k + BINS) % BINS] * kernel[k + 2];
    smooth[b] = s;
  }
  // 3. Peaks.
  const peaks: number[] = [];
  for (let b = 0; b < BINS; b++) {
    const l = smooth[(b - 1 + BINS) % BINS];
    const r = smooth[(b + 1) % BINS];
    if (smooth[b] > 0 && smooth[b] >= l && smooth[b] > r) peaks.push(b);
  }
  if (peaks.length === 0) return empty;

  // 4. Score each peak as a possible Sa.
  const near = (bin: number) => {
    // best bin within ±20 cents of the expected position
    let best = 0;
    for (let k = -2; k <= 2; k++) best = Math.max(best, smooth[(((bin + k) % BINS) + BINS) % BINS]);
    return best;
  };
  const allowed = opts.allowedSwaras ? new Set(opts.allowedSwaras.map(x => ((x % 12) + 12) % 12)) : null;
  const scoreAsSa = (b: number): number => {
    if (allowed) {
      let score = 0;
      for (let semi = 0; semi < 12; semi++) {
        const w = near(b + semi * (100 / BIN_CENTS));
        score += allowed.has(semi) ? (semi === 0 ? 2 : 1) * w : -w;
      }
      return score;
    }
    const companion = opts.raagHasNoPa ? 498 : 702;
    return smooth[b] + near(b + Math.round(companion / BIN_CENTS));
  };
  const scored = peaks
    .map(b => ({ bin: b, score: scoreAsSa(b) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score || a.bin - b.bin);
  if (scored.length === 0) return empty;

  // 5. Refine the winner: mean folded cents of the steady frames within ±30 cents of it.
  const refine = (bin: number) => {
    const centre = (bin + 0.5) * BIN_CENTS;
    let sum = 0, n = 0;
    for (const f of steady) {
      const c = foldToOctave(centsBetween(f.hz!, REF_HZ));
      let d = c - centre;
      if (d > 600) d -= 1200;
      if (d < -600) d += 1200;
      if (Math.abs(d) <= 30) { sum += d; n++; }
    }
    return foldToOctave(centre + (n ? sum / n : 0));
  };

  // 6. Choose the octave.
  const medianCents = median(steady.map(f => centsBetween(f.hz!, REF_HZ)));
  const expectedCents = opts.expectedSaHz ? centsBetween(opts.expectedSaHz, REF_HZ) : null;
  const toHz = (folded: number) => {
    let cents = folded;
    if (expectedCents !== null) {
      // nearest octave to the singer's usual Sa
      cents += 1200 * Math.round((expectedCents - folded) / 1200);
    } else {
      // middle of the singing between mandra Ni (-100) and madhya Ma (+500)... wraps to a 1200-cent window
      while (medianCents - cents >= 1100) cents += 1200;
      while (medianCents - cents < -100) cents -= 1200;
    }
    return hzFromCents(REF_HZ, cents);
  };

  const candidates: SaCandidate[] = scored.slice(0, 5).map(s => {
    const folded = refine(s.bin);
    return { hz: toHz(folded), folded, score: s.score };
  });

  // 7. Confidence: lead of the best over the best candidate that is clearly different (> 50 cents away).
  const best = candidates[0];
  const rival = candidates.slice(1).find(c => circularDistance(c.folded, best.folded) > 50);
  const confidence = rival ? 1 - rival.score / best.score : 1;

  return {
    saHz: best.hz,
    confidence,
    unsure: confidence < minConfidence,
    steadySec,
    candidates,
  };
}

function circularDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 1200;
  return Math.min(d, 1200 - d);
}

export function median(xs: number[]): number {
  if (xs.length === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
