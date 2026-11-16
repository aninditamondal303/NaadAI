/**
 * Measuring oscillations (andolan, gamak, vibrato-like movement).
 *
 * We measure, we don't judge: for each stretch where the pitch swings up
 * and down regularly we report how fast (Hz) and how wide (± cents) it
 * swings, and around which swara. A smooth glide (meend) has no
 * back-and-forth swings, so it is not counted.
 *
 * Method: lightly smooth the pitch curve (in cents), find alternating peaks
 * and troughs that differ by at least MIN_SWING_CENTS, and keep runs of at
 * least MIN_EXTREMA turning points whose half-periods are between 40 ms and
 * 1 s (that is, 0.5–12 Hz).
 */
import { centsBetween } from "./music";
import { median } from "./sa";
import { noteLabel } from "./summary";
import type { PitchTrack } from "./types";

export interface Oscillation {
  startSec: number;
  durSec: number;
  /** Swings per second (one swing = up and back down). */
  rateHz: number;
  /** Half of the typical peak-to-trough distance, in cents. */
  widthCents: number;
  cycles: number;
  /** Swara nearest to the centre of the oscillation, e.g. "r" or "d,". */
  centreLabel: string;
  /** Slow (< 3 Hz) swings are typical of andolan; faster ones of gamak or vibrato. */
  speed: "slow" | "fast";
}

const MIN_SWING_CENTS = 20;     // peak-to-trough
const MIN_EXTREMA = 5;          // two full swings
const MIN_HALF_PERIOD = 0.04;
const MAX_HALF_PERIOD = 1.0;
const SMOOTH_SEC = 0.03;

export function findOscillations(track: PitchTrack, saHz: number): Oscillation[] {
  const hop = track.hopSec;
  const out: Oscillation[] = [];
  const f = track.frames;
  let i = 0;
  while (i < f.length) {
    if (f[i].hz === null) { i++; continue; }
    let j = i;
    while (j < f.length && f[j].hz !== null) j++;
    // voiced run [i, j)
    if ((j - i) * hop >= 0.4) out.push(...inRun(f.slice(i, j).map(x => centsBetween(x.hz!, saHz)), f[i].timeSec, hop));
    i = j;
  }
  return out;
}

function inRun(cents: number[], t0: number, hop: number): Oscillation[] {
  // light moving-average smoothing to remove frame-to-frame jitter
  const k = Math.max(1, Math.round(SMOOTH_SEC / hop / 2));
  const c = cents.map((_, i) => {
    let s = 0, n = 0;
    for (let j = Math.max(0, i - k); j <= Math.min(cents.length - 1, i + k); j++) { s += cents[j]; n++; }
    return s / n;
  });

  // alternating extrema with hysteresis
  const ext: { i: number; v: number; max: boolean }[] = [];
  let dir = 0; // +1 rising, -1 falling
  let candI = 0;
  for (let i = 1; i < c.length; i++) {
    if (dir >= 0) {
      if (c[i] >= c[candI] || dir === 0 && c[i] > c[candI]) { candI = i; if (dir === 0) dir = 1; }
      else if (c[candI] - c[i] >= MIN_SWING_CENTS / 2 && dir === 1) { ext.push({ i: candI, v: c[candI], max: true }); dir = -1; candI = i; }
      else if (dir === 0 && c[candI] - c[i] >= MIN_SWING_CENTS / 2) { ext.push({ i: candI, v: c[candI], max: true }); dir = -1; candI = i; }
    }
    if (dir === -1) {
      if (c[i] <= c[candI]) candI = i;
      else if (c[i] - c[candI] >= MIN_SWING_CENTS / 2) { ext.push({ i: candI, v: c[candI], max: false }); dir = 1; candI = i; }
    }
  }

  // group consecutive extrema into regular oscillations
  const result: Oscillation[] = [];
  let start = 0;
  const flush = (a: number, b: number) => {
    const group = ext.slice(a, b + 1);
    if (group.length < MIN_EXTREMA) return;
    const swings = group.slice(1).map((e, n) => Math.abs(e.v - group[n].v));
    if (median(swings) < MIN_SWING_CENTS) return;
    const span = (group[group.length - 1].i - group[0].i) * hop;
    const cycles = (group.length - 1) / 2;
    const centre = median(group.map(e => e.v));
    const step = Math.round(centre / 100);
    const rateHz = cycles / span;
    result.push({
      startSec: t0 + group[0].i * hop,
      durSec: span,
      rateHz,
      widthCents: median(swings) / 2,
      cycles,
      centreLabel: noteLabel(((step % 12) + 12) % 12, Math.floor(step / 12)),
      speed: rateHz < 3 ? "slow" : "fast",
    });
  };
  for (let n = 1; n < ext.length; n++) {
    const half = (ext[n].i - ext[n - 1].i) * hop;
    if (half < MIN_HALF_PERIOD || half > MAX_HALF_PERIOD) { flush(start, n - 1); start = n; }
  }
  flush(start, ext.length - 1);
  return result;
}
