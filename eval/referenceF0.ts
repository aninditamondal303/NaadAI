/**
 * Scoring the pitch tracker against recordings that come with a reference
 * f0 annotated by people (for example the vocadito dataset: 40 solo singers,
 * CC BY 4.0). Reference files are text: one frame per line, "time,frequency"
 * (commas, tabs or spaces), frequency 0 or below for silence; a header line
 * is allowed.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { trackPitch } from "../src/analysis/track";
import { scoreTrack, type PitchScores } from "./metrics";
import { readWav } from "./wav";

export interface RefFrame { t: number; hz: number | null }

export function parseReference(text: string): RefFrame[] {
  const out: RefFrame[] = [];
  for (const line of text.split(/\r?\n/)) {
    const parts = line.trim().split(/[\s,;]+/);
    if (parts.length < 2) continue;
    const t = Number(parts[0]), hz = Number(parts[1]);
    if (!Number.isFinite(t) || !Number.isFinite(hz)) continue; // header or junk
    out.push({ t, hz: hz > 0 ? hz : null });
  }
  return out.sort((a, b) => a.t - b.t);
}

/**
 * Reference pitch at time t: the nearest annotated frame, or "skip" when t
 * is outside the annotation, between frames that disagree on voicing (a
 * boundary, where a few milliseconds decide), or too far from any frame.
 */
export function referenceAt(ref: RefFrame[]): (t: number) => number | null | "skip" {
  const hop = ref.length > 1 ? (ref[ref.length - 1].t - ref[0].t) / (ref.length - 1) : 0.01;
  return (t: number) => {
    let lo = 0, hi = ref.length - 1;
    if (hi < 0 || t < ref[0].t - hop || t > ref[hi].t + hop) return "skip";
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (ref[mid].t <= t) lo = mid; else hi = mid; }
    const a = ref[lo], b = ref[hi];
    if ((a.hz === null) !== (b.hz === null)) return "skip";
    const near = Math.abs(a.t - t) <= Math.abs(b.t - t) ? a : b;
    if (Math.abs(near.t - t) > 1.5 * hop) return "skip";
    return near.hz;
  };
}

export interface ClipResult { file: string; seconds: number; mpm: PitchScores; yin: PitchScores }

export function evaluateClip(wavPath: string, refText: string): ClipResult {
  const { samples, sampleRate } = readWav(wavPath);
  const truth = referenceAt(parseReference(refText));
  return {
    file: basename(wavPath),
    seconds: samples.length / sampleRate,
    mpm: scoreTrack(trackPitch(samples, sampleRate, "mpm"), truth),
    yin: scoreTrack(trackPitch(samples, sampleRate, "yin"), truth),
  };
}

/** Pair each WAV under `dir` with a reference file named like it (x_f0.csv, x.f0.csv, x.csv, x.txt, x.f0). */
export function findPairs(dir: string): { wav: string; ref: string }[] {
  const files: string[] = [];
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      if (name === "__MACOSX" || name.startsWith("._") || name.startsWith(".")) continue; // macOS zip leftovers
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p); else files.push(p);
    }
  };
  walk(dir);
  const byBase = new Map<string, string>();
  for (const f of files) {
    const b = basename(f).toLowerCase();
    if (!/\.(csv|txt|f0|tsv)$/.test(b)) continue;
    byBase.set(b, f);
  }
  const pairs: { wav: string; ref: string }[] = [];
  for (const f of files) {
    if (!/\.wav$/i.test(f)) continue;
    const stem = basename(f).replace(/\.wav$/i, "").toLowerCase();
    const ref = [`${stem}_f0.csv`, `${stem}.f0.csv`, `${stem}_f0.txt`, `${stem}.f0`, `${stem}.csv`, `${stem}.txt`, `${stem}.tsv`]
      .map(n => byBase.get(n)).find(Boolean);
    if (ref) pairs.push({ wav: f, ref });
  }
  return pairs.sort((a, b) => a.wav.localeCompare(b.wav, undefined, { numeric: true }));
}
