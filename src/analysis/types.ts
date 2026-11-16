/**
 * Shared types for Naad AI's audio analysis.
 *
 * Everything in src/analysis is plain TypeScript with no browser APIs,
 * so the exact same code runs in the browser (live mic, uploaded files)
 * and in Node (tests and the accuracy benchmark).
 */

/** One pitch reading, taken every `hopSec` seconds. */
export interface PitchFrame {
  /** Centre of the analysis window, in seconds from the start of the audio. */
  timeSec: number;
  /** Detected fundamental frequency in Hz, or null if no clear pitch (silence, breath, noise). */
  hz: number | null;
  /** How confident the detector is, 0..1 (method-specific, higher = clearer pitch). */
  clarity: number;
  /** Loudness of the window (root-mean-square amplitude, 0..1). */
  rms: number;
}

export interface PitchTrack {
  method: PitchMethodName;
  sampleRate: number;
  hopSec: number;
  windowSize: number;
  frames: PitchFrame[];
}

export type PitchMethodName = "autocorr" | "yin" | "mpm";

/**
 * Raw result from a single-window detector: its best pitch guess (null if
 * nothing in range) and how clear it is. Whether the guess is trusted
 * ("voiced") is decided afterwards in track.ts.
 */
export interface DetectorResult {
  hz: number | null;
  clarity: number;
}

/** A pitch detector looks at one window of samples and returns a pitch (or none). */
export type DetectorFn = (window: Float32Array, sampleRate: number) => DetectorResult;

/** Settings shared by all detectors. */
export interface PitchSettings {
  /** Lowest pitch we try to detect (Hz). Default 60 Hz covers mandra Sa for low male voices (Sa = C3 gives mandra Sa ≈ 65 Hz). */
  minHz: number;
  /** Highest pitch we try to detect (Hz). Default 1100 Hz covers high female taar saptak. */
  maxHz: number;
  /** Time between readings (seconds). Default 0.01 = 100 readings per second. */
  hopSec: number;
  /** Windows quieter than this (dB relative to full scale) are treated as silence. */
  silenceDb: number;
}

export const DEFAULT_PITCH_SETTINGS: PitchSettings = {
  minHz: 60,
  maxHz: 1100,
  hopSec: 0.01,
  silenceDb: -45,
};
