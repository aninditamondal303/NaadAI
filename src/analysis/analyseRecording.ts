/**
 * Full analysis of one recording, including how Sa is chosen, as one pure
 * function. Runs in a Web Worker in the app (so long recordings don't freeze
 * the page) and directly in tests.
 */
import { centsBetween } from "./music";
import { summariseTake, type TakeMeasurements } from "./summary";
import { trackPitch } from "./track";
import type { PitchTrack } from "./types";

export interface AnalyseRequest {
  samples: Float32Array;
  sampleRate: number;
  /** The singer's Sa from their profile. */
  saHz: number;
  /** "mine": measure against the profile Sa; "detect": find Sa in the recording. */
  saChoice: "mine" | "detect";
  allowedSwaras: number[];
}

export interface AnalyseResult {
  m: TakeMeasurements;
  track: PitchTrack;
  /** Plain-language notes about how Sa was chosen or data quality. */
  notes: string[];
}

export function analyseRecording(req: AnalyseRequest): AnalyseResult {
  const { samples, sampleRate, saHz, saChoice, allowedSwaras } = req;
  const track = trackPitch(samples, sampleRate, "mpm");
  const notes: string[] = [];
  let m = summariseTake(track, saChoice === "mine"
    ? { saHz, expectedSaHz: saHz, allowedSwaras }
    : { expectedSaHz: saHz, allowedSwaras });
  const det = m.saDetection;

  if (saChoice === "detect") {
    if (!det || det.saHz === null || det.unsure) {
      notes.push(`Couldn't detect Sa confidently from this recording${det && det.saHz ? ` (best guess ${det.saHz.toFixed(1)} Hz, confidence ${(det.confidence * 100).toFixed(0)}%)` : ""}. Measured against your Sa (${saHz.toFixed(1)} Hz) instead.`);
      m = summariseTake(track, { saHz, expectedSaHz: saHz, allowedSwaras });
    } else {
      notes.push(`Sa detected from the recording: ${det.saHz.toFixed(1)} Hz (confidence ${(det.confidence * 100).toFixed(0)}%, based on ${det.steadySec.toFixed(0)} s of steady singing).`);
    }
  } else if (det && det.saHz !== null && !det.unsure && Math.abs(centsBetween(det.saHz, saHz)) > 50) {
    notes.push(`This recording seems to use a different Sa (about ${det.saHz.toFixed(1)} Hz) from yours (${saHz.toFixed(1)} Hz). If so, choose "Detect from recording" and analyse again.`);
  }
  if (m.voicedSec < 2) notes.push("Very little clear singing was found in this recording, so these numbers are based on very little data.");
  return { m, track, notes };
}
