/**
 * Compare pitch detection methods on the synthetic test set.
 *
 *   npm run eval:pitch
 *
 * Prints a table and writes eval/results/pitch-benchmark.md.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { trackPitch } from "../src/analysis/track";
import type { PitchMethodName } from "../src/analysis/types";
import { median, scoreTrack, type PitchScores } from "./metrics";
import { buildTestSet } from "./testset";

const METHODS: PitchMethodName[] = ["autocorr", "yin", "mpm"];
const clips = buildTestSet();
const audioSec = clips.reduce((s, c) => s + c.samples.length / c.sampleRate, 0);

interface Row { method: PitchMethodName; clip: string; s: PitchScores }
const rows: Row[] = [];
const speed: Record<string, number> = {};

for (const method of METHODS) {
  const t0 = performance.now();
  for (const clip of clips) {
    const track = trackPitch(clip.samples, clip.sampleRate, method);
    rows.push({ method, clip: clip.name, s: scoreTrack(track, clip.truthAt) });
  }
  speed[method] = (performance.now() - t0) / audioSec; // ms of compute per second of audio
}

function pooled(rs: Row[]) {
  let v = 0, u = 0, w20 = 0, w50 = 0, oct = 0, rec = 0, fa = 0;
  const errs: number[] = [];
  for (const { s } of rs) {
    v += s.voicedFrames; u += s.unvoicedFrames;
    w20 += (s.rpa20 * s.voicedFrames) / 100;
    w50 += (s.rpa50 * s.voicedFrames) / 100;
    oct += (s.octaveErrors * s.voicedFrames) / 100;
    rec += (s.voicingRecall * s.voicedFrames) / 100;
    fa += (s.voicingFalseAlarm * s.unvoicedFrames) / 100 || 0;
    errs.push(...s.absErrors);
  }
  return {
    rpa20: (100 * w20) / v, rpa50: (100 * w50) / v, octave: (100 * oct) / v,
    recall: (100 * rec) / v, falseAlarm: u ? (100 * fa) / u : NaN, median: median(errs),
  };
}

const f1 = (x: number) => (Number.isNaN(x) ? "–" : x.toFixed(1));
const lines: string[] = [];
lines.push(`# Pitch method benchmark (synthetic clips)`);
lines.push("");
lines.push(`${clips.length} synthetic clips, ${audioSec.toFixed(1)} s of audio, 1 reading every 10 ms.`);
lines.push(`Synthetic voice-like signals with exactly known pitch. Real-voice results are reported separately.`);
lines.push("");
lines.push(`## Overall`);
lines.push("");
lines.push(`| Method | Within ±20 cents | Within ±50 cents | Octave errors | Voicing recall | False pitch in silence | Median error (cents) | Speed (ms per s of audio) |`);
lines.push(`|---|---|---|---|---|---|---|---|`);
for (const m of METHODS) {
  const p = pooled(rows.filter(r => r.method === m));
  lines.push(`| ${m} | ${f1(p.rpa20)}% | ${f1(p.rpa50)}% | ${f1(p.octave)}% | ${f1(p.recall)}% | ${f1(p.falseAlarm)}% | ${p.median.toFixed(2)} | ${speed[m].toFixed(1)} |`);
}
lines.push("");
lines.push(`## Within ±20 cents, per clip`);
lines.push("");
lines.push(`| Clip | ${METHODS.join(" | ")} |`);
lines.push(`|---|${METHODS.map(() => "---").join("|")}|`);
for (const clip of clips) {
  const cells = METHODS.map(m => {
    const r = rows.find(x => x.method === m && x.clip === clip.name)!;
    return `${f1(r.s.rpa20)}%${r.s.octaveErrors > 0.5 ? ` (oct ${f1(r.s.octaveErrors)}%)` : ""}`;
  });
  lines.push(`| ${clip.name} | ${cells.join(" | ")} |`);
}

const md = lines.join("\n") + "\n";
console.log(md);
mkdirSync("eval/results", { recursive: true });
writeFileSync("eval/results/pitch-benchmark.md", md);
