/**
 * Measurements of one recording ("take"), computed from its pitch track.
 *
 * Everything here is measured. Nothing is estimated or made up: if a number
 * can't be computed (for example, no held notes), it is left out (null).
 *
 * Swara positions are compared with equal-tempered positions above Sa
 * (Re = 200 cents, Ga = 400, ...). Real Hindustani intonation differs a little
 * from these for some swaras (e.g. a tanpura-tuned Ga is often nearer 386
 * cents), so small deviations are not mistakes. That's why we report the
 * number and don't call it right or wrong.
 */
import { centsBetween, hzFromCents } from "./music";
import { detectSa, median, type SaDetection } from "./sa";
import type { PitchTrack } from "./types";

export const SWARA_SYMBOLS = ["S", "r", "R", "g", "G", "m", "M", "P", "d", "D", "n", "N"] as const;
export const SWARA_NAMES = [
  "Sa", "Komal Re", "Re", "Komal Ga", "Ga", "Ma", "Tivra Ma", "Pa", "Komal Dha", "Dha", "Komal Ni", "Ni",
] as const;

/** A note label in the app's sargam notation: "P," = mandra Pa, "S'" = taar Sa. */
export function noteLabel(semitone: number, octave: number): string {
  const sym = SWARA_SYMBOLS[semitone];
  if (octave < 0) return sym + ",".repeat(-octave);
  if (octave > 0) return sym + "'".repeat(octave);
  return sym;
}

export interface HeldNote {
  startSec: number;
  durSec: number;
  /** 0..11 semitones above Sa */
  swara: number;
  /** 0 = madhya, -1 = mandra, +1 = taar */
  octave: number;
  /** Median distance from the equal-tempered swara position (cents, + = sharp). */
  deviationCents: number;
  /** Median |distance from the note's own median| (cents): how much the note wavered. */
  wobbleCents: number;
}

export interface SwaraStats {
  swara: number;
  symbol: string;
  name: string;
  /** null when no raag was given */
  inRaag: boolean | null;
  heldNotes: number;
  totalHeldSec: number;
  longestHoldSec: number;
  medianDeviationCents: number;
  medianWobbleCents: number;
}

export interface Phrase {
  startSec: number;
  durSec: number;
}

export interface TakeMeasurements {
  pitchMethod: string;
  durationSec: number;
  /** Time with a clear pitch (singing). */
  voicedSec: number;
  /** Time spent on held notes (at least `MIN_HELD_SEC` on one swara). */
  heldSec: number;
  saHz: number;
  saSource: "profile" | "detected";
  saDetection: Pick<SaDetection, "saHz" | "confidence" | "unsure" | "steadySec"> | null;
  /** % of held-note time within ±20 cents of the swara position. null if no held notes. */
  heldWithin20CentsPct: number | null;
  /** Median |deviation| over held-note time (cents). null if no held notes. */
  medianAbsDeviationCents: number | null;
  lowestNote: { label: string; hz: number } | null;
  highestNote: { label: string; hz: number } | null;
  swaras: SwaraStats[];
  heldNotes: HeldNote[];
  /** Sung phrases: singing separated by silences of at least BREATH_GAP_SEC. */
  phrases: Phrase[];
  longestPhraseSec: number | null;
  medianPhraseSec: number | null;
}

export const MIN_HELD_SEC = 0.25;
/** A silence at least this long counts as a breath between phrases. Shorter gaps are articulation. */
export const BREATH_GAP_SEC = 0.3;
/** Phrases shorter than this are ignored (coughs, clicks, single short syllables). */
export const MIN_PHRASE_SEC = 0.3;

/** Split the singing into phrases separated by breaths (silences of at least BREATH_GAP_SEC). */
export function findPhrases(track: PitchTrack): Phrase[] {
  const f = track.frames;
  const gapFrames = Math.ceil(BREATH_GAP_SEC / track.hopSec);
  const phrases: Phrase[] = [];
  let start = -1, lastVoiced = -1;
  for (let i = 0; i <= f.length; i++) {
    const voiced = i < f.length && f[i].hz !== null;
    if (voiced) {
      if (start < 0) start = i;
      lastVoiced = i;
    } else if (start >= 0 && (i === f.length || i - lastVoiced >= gapFrames)) {
      const durSec = (lastVoiced - start + 1) * track.hopSec;
      if (durSec >= MIN_PHRASE_SEC) phrases.push({ startSec: f[start].timeSec, durSec });
      start = -1;
    }
  }
  return phrases;
}
const MAX_GAP_FRAMES = 3;

/** Split the pitch track into held notes (runs on one swara lasting at least MIN_HELD_SEC). */
export function findHeldNotes(track: PitchTrack, saHz: number): HeldNote[] {
  const notes: HeldNote[] = [];
  const f = track.frames;
  const pos = f.map(fr => (fr.hz === null ? null : centsBetween(fr.hz, saHz)));
  const minFrames = Math.ceil(MIN_HELD_SEC / track.hopSec);

  let i = 0;
  while (i < f.length) {
    if (pos[i] === null) { i++; continue; }
    const step = Math.round(pos[i]! / 100);
    const devs: number[] = [pos[i]! - step * 100];
    let last = i;
    let j = i + 1;
    while (j < f.length && j - last <= MAX_GAP_FRAMES + 1) {
      if (pos[j] !== null) {
        if (Math.round(pos[j]! / 100) !== step) break;
        devs.push(pos[j]! - step * 100);
        last = j;
      }
      j++;
    }
    if (devs.length >= minFrames) {
      const dev = median(devs);
      notes.push({
        startSec: f[i].timeSec,
        durSec: (last - i + 1) * track.hopSec,
        swara: ((step % 12) + 12) % 12,
        octave: Math.floor(step / 12),
        deviationCents: dev,
        wobbleCents: median(devs.map(d => Math.abs(d - dev))),
      });
    }
    i = last + 1;
  }
  return notes;
}

export interface SummariseOptions {
  /** Sa to measure against. If omitted, it is detected from the recording. */
  saHz?: number;
  /** Singer's usual Sa, used only to choose the octave when Sa is detected. */
  expectedSaHz?: number;
  /** Semitone indices allowed in the raag (e.g. Yaman: [0,2,4,6,7,9,11]). */
  allowedSwaras?: number[];
}

export function summariseTake(track: PitchTrack, opts: SummariseOptions = {}): TakeMeasurements {
  const allowed = opts.allowedSwaras ? new Set(opts.allowedSwaras) : null;
  const detection = detectSa(track, { allowedSwaras: opts.allowedSwaras, expectedSaHz: opts.expectedSaHz });

  let saHz: number;
  let saSource: TakeMeasurements["saSource"];
  if (opts.saHz) { saHz = opts.saHz; saSource = "profile"; }
  else if (detection.saHz !== null) { saHz = detection.saHz; saSource = "detected"; }
  else { saHz = NaN; saSource = "detected"; }

  const voicedFrames = track.frames.filter(fr => fr.hz !== null).length;
  const durationSec = track.frames.length
    ? track.frames[track.frames.length - 1].timeSec + track.windowSize / 2 / track.sampleRate
    : 0;

  const phrases = findPhrases(track);
  const base = {
    phrases,
    longestPhraseSec: phrases.length ? Math.max(...phrases.map(p => p.durSec)) : null,
    medianPhraseSec: phrases.length ? median(phrases.map(p => p.durSec)) : null,
    pitchMethod: track.method,
    durationSec,
    voicedSec: voicedFrames * track.hopSec,
    saHz,
    saSource,
    saDetection: {
      saHz: detection.saHz,
      confidence: detection.confidence,
      unsure: detection.unsure,
      steadySec: detection.steadySec,
    },
  };

  if (!Number.isFinite(saHz)) {
    return {
      ...base, heldSec: 0, heldWithin20CentsPct: null, medianAbsDeviationCents: null,
      lowestNote: null, highestNote: null, swaras: [], heldNotes: [],
    };
  }

  const held = findHeldNotes(track, saHz);
  const heldSec = held.reduce((s, n) => s + n.durSec, 0);

  // Time-weighted accuracy over held notes, using every frame inside them.
  const heldDevs: number[] = [];
  for (const n of held) {
    for (const fr of track.frames) {
      if (fr.hz === null || fr.timeSec < n.startSec || fr.timeSec >= n.startSec + n.durSec) continue;
      const step = n.swara + 12 * n.octave;
      heldDevs.push(centsBetween(fr.hz, saHz) - step * 100);
    }
  }
  const within = heldDevs.filter(d => Math.abs(d) <= 20).length;

  const byStep = (n: HeldNote) => n.swara + 12 * n.octave;
  const sorted = [...held].sort((a, b) => byStep(a) - byStep(b));
  const asNote = (n: HeldNote) => ({
    label: noteLabel(n.swara, n.octave),
    hz: hzFromCents(saHz, byStep(n) * 100 + n.deviationCents),
  });

  const swaras: SwaraStats[] = [];
  for (let s = 0; s < 12; s++) {
    const ns = held.filter(n => n.swara === s);
    if (ns.length === 0) continue;
    swaras.push({
      swara: s,
      symbol: SWARA_SYMBOLS[s],
      name: SWARA_NAMES[s],
      inRaag: allowed ? allowed.has(s) : null,
      heldNotes: ns.length,
      totalHeldSec: ns.reduce((a, n) => a + n.durSec, 0),
      longestHoldSec: Math.max(...ns.map(n => n.durSec)),
      medianDeviationCents: median(ns.map(n => n.deviationCents)),
      medianWobbleCents: median(ns.map(n => n.wobbleCents)),
    });
  }

  return {
    ...base,
    heldSec,
    heldWithin20CentsPct: heldDevs.length ? (100 * within) / heldDevs.length : null,
    medianAbsDeviationCents: heldDevs.length ? median(heldDevs.map(Math.abs)) : null,
    lowestNote: sorted.length ? asNote(sorted[0]) : null,
    highestNote: sorted.length ? asNote(sorted[sorted.length - 1]) : null,
    swaras,
    heldNotes: held,
  };
}
