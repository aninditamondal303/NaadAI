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

const WESTERN = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** Nearest Western note name (e.g. "C#3") and how many cents away, for reference. */
export function westernNote(hz: number): { name: string; cents: number } {
  const midi = 69 + 12 * Math.log2(hz / 440);
  const nearest = Math.round(midi);
  const name = WESTERN[((nearest % 12) + 12) % 12] + (Math.floor(nearest / 12) - 1);
  return { name, cents: (midi - nearest) * 100 };
}
