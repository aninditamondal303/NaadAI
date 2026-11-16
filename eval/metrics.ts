/**
 * Standard pitch-tracking accuracy measures (as used in MIREX melody extraction),
 * plus a stricter ±20-cent version that matters for swara accuracy.
 */
import { centsBetween } from "../src/analysis/music";
import type { PitchTrack } from "../src/analysis/types";

export interface PitchScores {
  /** Voiced frames scored */
  voicedFrames: number;
  unvoicedFrames: number;
  /** % of truly-voiced frames where the detected pitch is within ±20 cents */
  rpa20: number;
  /** % within ±50 cents (the MIREX "raw pitch accuracy") */
  rpa50: number;
  /** % of truly-voiced frames that were an octave (or more) off */
  octaveErrors: number;
  /** % of truly-voiced frames that got any pitch at all */
  voicingRecall: number;
  /** % of truly-silent frames where a pitch was (wrongly) reported */
  voicingFalseAlarm: number;
  /** Median |error| in cents, over voiced frames that got a pitch */
  medianAbsCents: number;
  /** All absolute errors (cents), for pooling */
  absErrors: number[];
}

export function scoreTrack(track: PitchTrack, truthAt: (t: number) => number | null | "skip"): PitchScores {
  let voiced = 0, unvoiced = 0, within20 = 0, within50 = 0, octave = 0, recalled = 0, falseAlarm = 0;
  const absErrors: number[] = [];

  for (const f of track.frames) {
    const truth = truthAt(f.timeSec);
    if (truth === "skip") continue;
    if (truth === null) {
      unvoiced++;
      if (f.hz !== null) falseAlarm++;
      continue;
    }
    voiced++;
    if (f.hz === null) continue;
    recalled++;
    const err = centsBetween(f.hz, truth);
    const abs = Math.abs(err);
    absErrors.push(abs);
    if (abs <= 20) within20++;
    if (abs <= 50) within50++;
    if (abs >= 1150) octave++;
  }

  const pct = (a: number, b: number) => (b === 0 ? NaN : (100 * a) / b);
  return {
    voicedFrames: voiced,
    unvoicedFrames: unvoiced,
    rpa20: pct(within20, voiced),
    rpa50: pct(within50, voiced),
    octaveErrors: pct(octave, voiced),
    voicingRecall: pct(recalled, voiced),
    voicingFalseAlarm: pct(falseAlarm, unvoiced),
    medianAbsCents: median(absErrors),
    absErrors,
  };
}

export function median(xs: number[]): number {
  if (xs.length === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
