/**
 * Note-by-note scoring for paltas and pakad.
 *
 * For each expected note we look at the singing inside that note's time
 * slot and ask two questions:
 *  - Pitch: how far was the sung pitch from the swara? (median over the
 *    slot, after the first part where the voice is still moving there)
 *  - Timing: how quickly did the voice reach the swara after the slot began?
 *
 * Grades: green = within 25 cents and on time; yellow = within 50 cents, or
 * in tune but late; red = further off, or not sung.
 * Score = (greens + half of yellows) / notes x 100.
 */
import { centsBetween, hzFromCents } from "../analysis/music";
import { median } from "../analysis/sa";
import { trackPitch } from "../analysis/track";
import type { SargamNote } from "./notation";

export type Grade = "green" | "yellow" | "red";

export interface NoteScore {
  grade: Grade;
  /** Median distance from the swara in cents (+ = sharp), or null if not sung. */
  deviationCents: number | null;
  /** When the voice first reached the swara (within 50 cents), as a fraction of the slot. null if never. */
  arrivalFraction: number | null;
}

export const GREEN_CENTS = 25;
export const YELLOW_CENTS = 50;
/** Reaching the swara later than this fraction of the slot counts as late. */
export const LATE_FRACTION = 0.4;
/** The first part of each slot is ignored for the pitch average (the voice is still arriving). */
const SETTLE_FRACTION = 0.3;

export function expectedHz(note: SargamNote, saHz: number): number {
  return hzFromCents(saHz, note.semitones * 100);
}

/**
 * Score one note from the audio of its slot.
 * `slot` should cover exactly the note's time (latency already compensated).
 */
export function scoreNote(slot: Float32Array, sampleRate: number, targetHz: number): NoteScore {
  const track = trackPitch(slot, sampleRate, "mpm", { hopSec: 0.005 });
  const n = track.frames.length;
  if (n === 0) return { grade: "red", deviationCents: null, arrivalFraction: null };

  // Compare in the target's octave-free sense? No: octave errors are real mistakes here, so compare directly.
  const devs = track.frames.map(f => (f.hz === null ? null : centsBetween(f.hz, targetHz)));
  const arrivalIdx = devs.findIndex(d => d !== null && Math.abs(d) <= YELLOW_CENTS);
  const arrivalFraction = arrivalIdx < 0 ? null : arrivalIdx / n;

  const settled = devs.slice(Math.floor(n * SETTLE_FRACTION)).filter((d): d is number => d !== null);
  const voicedShare = settled.length / Math.max(1, n - Math.floor(n * SETTLE_FRACTION));
  if (settled.length === 0 || voicedShare < 0.4) return { grade: "red", deviationCents: null, arrivalFraction };

  const dev = median(settled);
  const abs = Math.abs(dev);
  const late = arrivalFraction === null || arrivalFraction > LATE_FRACTION;
  let grade: Grade;
  if (abs <= GREEN_CENTS && !late) grade = "green";
  else if (abs <= YELLOW_CENTS) grade = "yellow";
  else grade = "red";
  return { grade, deviationCents: dev, arrivalFraction };
}

export function totalScore(scores: NoteScore[]): number {
  if (scores.length === 0) return 0;
  const g = scores.filter(s => s.grade === "green").length;
  const y = scores.filter(s => s.grade === "yellow").length;
  return ((g + 0.5 * y) / scores.length) * 100;
}

/** Note slots in seconds from the first beat: each note lasts one beat divided by the speed. */
export function noteSlots(count: number, bpm: number, speed: number): { start: number; end: number }[] {
  const dur = 60 / bpm / speed;
  return Array.from({ length: count }, (_, i) => ({ start: i * dur, end: (i + 1) * dur }));
}
