/**
 * Electrical hum guard. A badly earthed laptop or amplifier can put a steady
 * tone at the mains frequency (50 Hz in India, 60 Hz elsewhere) or its
 * second harmonic into the microphone. Loud enough, the pitch detector
 * reports it as a sung note during a pause.
 *
 * Hum differs from a voice in being perfectly steady: a held human note
 * wanders by several cents within a fifth of a second, hum by well under one.
 * A run of readings counts as hum only when every one of them lies near a
 * mains frequency AND the run barely moves.
 */

/** Mains frequencies and their second harmonics (Hz). */
export const MAINS_HZ = [50, 60, 100, 120] as const;
/** How close (cents) a reading must be to a mains frequency. */
export const HUM_NEAR_CENTS = 25;
/** Largest spread (cents) of a run that still counts as hum. */
export const HUM_MAX_SPREAD_CENTS = 2;
/** Shortest run (seconds) judged; shorter runs are left alone. */
export const HUM_MIN_SEC = 0.2;

const cents = (a: number, b: number) => 1200 * Math.log2(a / b);

/** The mains frequency a reading sits on, or null. */
export function nearMains(hz: number): number | null {
  for (const m of MAINS_HZ) if (Math.abs(cents(hz, m)) <= HUM_NEAR_CENTS) return m;
  return null;
}

/** True when these consecutive readings (Hz) look like hum rather than a voice. */
export function looksLikeHum(run: readonly number[]): boolean {
  if (run.length === 0) return false;
  const m = nearMains(run[0]);
  if (m === null || !run.every(h => nearMains(h) === m)) return false;
  let lo = Infinity, hi = -Infinity;
  for (const h of run) { const c = cents(h, m); if (c < lo) lo = c; if (c > hi) hi = c; }
  return hi - lo <= HUM_MAX_SPREAD_CENTS;
}

/**
 * Mark readings that are hum. `hz` holds one reading per hop (null = none);
 * returns a parallel array, true where the reading should be dropped.
 */
export function humMask(hz: readonly (number | null)[], hopSec: number): boolean[] {
  const out = new Array<boolean>(hz.length).fill(false);
  const minLen = Math.max(2, Math.round(HUM_MIN_SEC / hopSec));
  let i = 0;
  while (i < hz.length) {
    const h = hz[i];
    const m = h === null ? null : nearMains(h);
    if (m === null) { i++; continue; }
    let j = i;
    while (j < hz.length && hz[j] !== null && nearMains(hz[j]!) === m) j++;
    const run = hz.slice(i, j) as number[];
    if (run.length >= minLen && looksLikeHum(run)) for (let k = i; k < j; k++) out[k] = true;
    i = j;
  }
  return out;
}
