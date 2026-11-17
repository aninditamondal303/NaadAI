/**
 * Live pitch for drawing while someone sings: the same MPM detector and
 * two-level voicing rule as the full analysis (track.ts), applied to the
 * newest window of microphone audio once per animation frame.
 */
import { makeMpmDetector } from "./pitch/mpm";
import { MAX_JUMP_CENTS, rmsOf, VOICING, windowSizeFor } from "./track";
import { DEFAULT_PITCH_SETTINGS } from "./types";

export interface LivePoint { t: number; c: number | null }

export interface LiveSource {
  sampleRate: number;
  latest(n: number): Float32Array;
}

export function createLiveTracker(src: LiveSource, saHz: number, keepSec = 9) {
  const { minHz, maxHz, silenceDb } = DEFAULT_PITCH_SETTINGS;
  const detect = makeMpmDetector(minHz, maxHz);
  const size = windowSizeFor(src.sampleRate, minHz);
  const silence = Math.pow(10, silenceDb / 20);
  const points: LivePoint[] = [];
  let prevHz: number | null = null;

  /** Measure the newest window; returns cents from Sa, or null if no clear pitch. */
  const step = (now: number): number | null => {
    const win = src.latest(size);
    let hz: number | null = null;
    if (rmsOf(win) >= silence) {
      const r = detect(win, src.sampleRate);
      const smooth = prevHz !== null && r.hz !== null && Math.abs(1200 * Math.log2(r.hz / prevHz)) <= MAX_JUMP_CENTS;
      if (r.hz !== null && (r.clarity >= VOICING.mpm.start || (smooth && r.clarity >= VOICING.mpm.keep))) hz = r.hz;
    }
    prevHz = hz;
    const c = hz === null ? null : 1200 * Math.log2(hz / saHz);
    points.push({ t: now, c });
    while (points.length && points[0].t < now - keepSec) points.shift();
    return c;
  };

  return { step, points };
}
