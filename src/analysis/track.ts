/**
 * Turn a whole recording (mono samples) into a pitch track:
 * one reading every `hopSec` seconds.
 *
 * No randomness anywhere: the same samples always give the same track.
 */
import { makeAutocorrDetector } from "./pitch/autocorr";
import { makeMpmDetector } from "./pitch/mpm";
import { makeYinDetector } from "./pitch/yin";
import { centsBetween } from "./music";
import {
  DEFAULT_PITCH_SETTINGS,
  type DetectorFn,
  type PitchFrame,
  type PitchMethodName,
  type PitchSettings,
  type PitchTrack,
} from "./types";

export function makeDetector(method: PitchMethodName, s: PitchSettings): DetectorFn {
  switch (method) {
    case "autocorr": return makeAutocorrDetector(s.minHz, s.maxHz);
    case "yin": return makeYinDetector(s.minHz, s.maxHz);
    case "mpm": return makeMpmDetector(s.minHz, s.maxHz);
  }
}

/**
 * When do we trust a pitch reading? ("voicing" decision)
 *
 * - `start`: a reading this clear is trusted on its own.
 * - `keep`: a less clear reading is trusted only if it continues a trusted
 *   reading next to it with a smooth pitch (no jump over `maxJumpCents`).
 *
 * Why two levels: during fast gamaks the pitch changes inside one 46 ms window,
 * which lowers clarity even though the pitch reading is still right. Noise and
 * breath rarely produce a smooth chain attached to a clear note.
 *
 * The autocorr baseline keeps its original behaviour (no clarity check).
 */
export const VOICING: Record<PitchMethodName, { start: number; keep: number }> = {
  autocorr: { start: 0, keep: 0 },
  yin: { start: 0.85, keep: 0.6 },
  mpm: { start: 0.85, keep: 0.6 },
};
export const MAX_JUMP_CENTS = 150;

/**
 * Window length in samples: enough to hold at least ~2.5 periods of the lowest
 * pitch (YIN needs one period of lag plus an integration window), rounded up
 * to a power of two. At 44.1 kHz with minHz = 60 this is 2048 (46 ms).
 */
export function windowSizeFor(sampleRate: number, minHz: number): number {
  const needed = Math.ceil((2.5 * sampleRate) / minHz);
  let size = 256;
  while (size < needed) size *= 2;
  return size;
}

export function rmsOf(buf: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  return Math.sqrt(sum / buf.length);
}

export function trackPitch(
  samples: Float32Array,
  sampleRate: number,
  method: PitchMethodName = "mpm",
  overrides: Partial<PitchSettings> = {},
): PitchTrack {
  const s: PitchSettings = { ...DEFAULT_PITCH_SETTINGS, ...overrides };
  const detect = makeDetector(method, s);
  const windowSize = windowSizeFor(sampleRate, s.minHz);
  const hop = Math.max(1, Math.round(s.hopSec * sampleRate));
  const silenceRms = Math.pow(10, s.silenceDb / 20);

  // 1. Raw candidates for every window.
  const raw: PitchFrame[] = [];
  for (let start = 0; start + windowSize <= samples.length; start += hop) {
    const win = samples.subarray(start, start + windowSize);
    const rms = rmsOf(win);
    const timeSec = (start + windowSize / 2) / sampleRate;
    if (rms < silenceRms) {
      raw.push({ timeSec, hz: null, clarity: 0, rms });
      continue;
    }
    const { hz, clarity } = detect(win, sampleRate);
    raw.push({ timeSec, hz, clarity, rms });
  }

  // 2. Decide which readings to trust.
  const voiced = decideVoicing(raw, VOICING[method]);
  const frames = raw.map((f, i) => (voiced[i] ? f : { ...f, hz: null }));

  return { method, sampleRate, hopSec: hop / sampleRate, windowSize, frames };
}

export function decideVoicing(raw: PitchFrame[], t: { start: number; keep: number }): boolean[] {
  const n = raw.length;
  const v = raw.map(f => f.hz !== null && f.clarity >= t.start);
  const canKeep = (i: number) => raw[i].hz !== null && raw[i].clarity >= t.keep;
  const smooth = (i: number, j: number) =>
    Math.abs(centsBetween(raw[i].hz!, raw[j].hz!)) <= MAX_JUMP_CENTS;

  // Extend trusted regions forwards, then backwards.
  for (let i = 1; i < n; i++) {
    if (!v[i] && v[i - 1] && canKeep(i) && smooth(i, i - 1)) v[i] = true;
  }
  for (let i = n - 2; i >= 0; i--) {
    if (!v[i] && v[i + 1] && canKeep(i) && smooth(i, i + 1)) v[i] = true;
  }
  return v;
}
