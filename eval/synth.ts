/**
 * Synthetic "voice-like" test clips with an exactly known pitch at every moment.
 *
 * These are NOT real singing. They are a controlled first test: if a method
 * fails here, it will fail on real voices too. Real-voice recordings are
 * evaluated separately (see eval/README.md).
 *
 * The noise uses a seeded generator, so every clip is identical on every run.
 */

/** Deterministic pseudo-random numbers (mulberry32). Used ONLY to build test signals. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A sung segment: pitch as a function of time since the segment started. */
export interface Segment {
  durSec: number;
  /** null = silence/breath for this segment */
  f0?: ((tSec: number) => number) | null;
}

export interface VoiceOptions {
  sampleRate?: number;
  /** Multiply the fundamental's strength (e.g. 0.15 = weak fundamental, tests octave errors). */
  fundamentalGain?: number;
  /** Signal-to-noise ratio in dB for added white noise; undefined = clean. */
  snrDb?: number;
  /** Natural pitch jitter, in cents (slow random wander). Default 3. */
  jitterCents?: number;
  seed?: number;
}

export interface SynthClip {
  name: string;
  sampleRate: number;
  samples: Float32Array;
  /**
   * True pitch at time t (Hz), null if silent, or "skip" near note edges
   * where even a perfect detector is ambiguous (first/last 40 ms of each note).
   */
  truthAt: (tSec: number) => number | null | "skip";
}

/** Rough formant envelope for an open "aa" vowel (aakar). */
function aakarEnvelope(hz: number): number {
  const formants = [
    { f: 750, bw: 130, g: 1.0 },
    { f: 1200, bw: 150, g: 0.6 },
    { f: 2600, bw: 250, g: 0.25 },
  ];
  let e = 0.05;
  for (const { f, bw, g } of formants) e += g / (1 + ((hz - f) / bw) ** 2);
  return e;
}

const EDGE_SKIP_SEC = 0.04;
const RAMP_SEC = 0.03;

export function synthVoice(name: string, segments: Segment[], opts: VoiceOptions = {}): SynthClip {
  const sr = opts.sampleRate ?? 44100;
  const rand = seededRandom(opts.seed ?? 1);
  const jitterCents = opts.jitterCents ?? 3;
  const totalSec = segments.reduce((s, x) => s + x.durSec, 0);
  const n = Math.round(totalSec * sr);
  const out = new Float32Array(n);

  // Slow random pitch wander (low-passed noise), so the pitch is never perfectly flat.
  const jitter = new Float32Array(n);
  let j = 0;
  const alpha = 1 / (0.05 * sr); // ~50 ms smoothing
  for (let i = 0; i < n; i++) {
    j += alpha * ((rand() * 2 - 1) * jitterCents * 6 - j);
    jitter[i] = j;
  }

  const starts: number[] = [];
  let acc = 0;
  for (const seg of segments) { starts.push(acc); acc += seg.durSec; }

  const phases = new Float64Array(64);
  for (let si = 0; si < segments.length; si++) {
    const seg = segments[si];
    if (!seg.f0) continue;
    phases.fill(0);
    const i0 = Math.round(starts[si] * sr);
    const i1 = Math.min(n, Math.round((starts[si] + seg.durSec) * sr));
    for (let i = i0; i < i1; i++) {
      const t = (i - i0) / sr;
      const f0 = seg.f0(t) * Math.pow(2, jitter[i] / 1200);
      const ramp = Math.min(1, t / RAMP_SEC, (seg.durSec - t) / RAMP_SEC);
      let v = 0;
      for (let k = 1; k <= 64; k++) {
        const fk = k * f0;
        if (fk > 5000) break;
        phases[k - 1] += (2 * Math.PI * fk) / sr;
        let amp = aakarEnvelope(fk) / Math.pow(k, 0.8);
        if (k === 1) amp *= opts.fundamentalGain ?? 1;
        v += amp * Math.sin(phases[k - 1]);
      }
      out[i] = v * ramp;
    }
  }

  // Normalise to a typical recording level (peak 0.5).
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak > 0) for (let i = 0; i < n; i++) out[i] *= 0.5 / peak;

  if (opts.snrDb !== undefined) {
    let sigPow = 0, voiced = 0;
    for (let i = 0; i < n; i++) if (out[i] !== 0) { sigPow += out[i] * out[i]; voiced++; }
    sigPow /= Math.max(1, voiced);
    const noiseRms = Math.sqrt(sigPow / Math.pow(10, opts.snrDb / 10));
    for (let i = 0; i < n; i++) {
      // Approximate Gaussian noise: sum of 4 uniforms, scaled to unit variance.
      const g = (rand() + rand() + rand() + rand() - 2) * Math.sqrt(3);
      out[i] += g * noiseRms;
    }
  }

  const truthAt = (tSec: number): number | null | "skip" => {
    for (let si = 0; si < segments.length; si++) {
      const s0 = starts[si];
      const s1 = s0 + segments[si].durSec;
      if (tSec < s0 || tSec >= s1) continue;
      const seg = segments[si];
      if (!seg.f0) {
        // Silence right after a note can still contain the window's tail: skip the edge.
        return tSec - s0 < EDGE_SKIP_SEC * 2 || s1 - tSec < EDGE_SKIP_SEC * 2 ? "skip" : null;
      }
      if (tSec - s0 < EDGE_SKIP_SEC || s1 - tSec < EDGE_SKIP_SEC) return "skip";
      const i = Math.min(n - 1, Math.round(tSec * sr));
      return seg.f0(tSec - s0) * Math.pow(2, jitter[i] / 1200);
    }
    return null;
  };

  return { name, sampleRate: sr, samples: out, truthAt };
}

// ---------- Pitch shapes used in Hindustani singing ----------

export const steady = (hz: number) => () => hz;

/** Andolan / vibrato: slow oscillation of `depthCents` (peak) at `rateHz`. */
export const oscillating = (hz: number, depthCents: number, rateHz: number) =>
  (t: number) => hz * Math.pow(2, (depthCents * Math.sin(2 * Math.PI * rateHz * t)) / 1200);

/** Meend: smooth glide from `fromHz` to `toHz` over the segment (`durSec`). */
export const glide = (fromHz: number, toHz: number, durSec: number) => (t: number) => {
  const x = Math.min(1, Math.max(0, t / durSec));
  const smooth = x * x * (3 - 2 * x); // ease in/out like a real meend
  return fromHz * Math.pow(toHz / fromHz, smooth);
};

/** Ratio of each shuddha swara above Sa (equal-tempered approximation for test purposes). */
export const SWARA_CENTS: Record<string, number> = {
  S: 0, r: 100, R: 200, g: 300, G: 400, m: 500, M: 600, P: 700, d: 800, D: 900, n: 1000, N: 1100,
};
