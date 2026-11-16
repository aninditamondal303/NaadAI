/** Small music-math helpers: Hz <-> cents. */

/** Distance from `refHz` to `hz` in cents (100 cents = 1 semitone, 1200 = 1 octave). */
export function centsBetween(hz: number, refHz: number): number {
  return 1200 * Math.log2(hz / refHz);
}

/** The frequency `cents` away from `refHz`. */
export function hzFromCents(refHz: number, cents: number): number {
  return refHz * Math.pow(2, cents / 1200);
}

/** Wrap a cents value into one octave, 0 <= result < 1200. */
export function foldToOctave(cents: number): number {
  return ((cents % 1200) + 1200) % 1200;
}
