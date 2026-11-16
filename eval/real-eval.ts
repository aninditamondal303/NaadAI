/**
 * Accuracy on REAL recordings.
 *
 *   npm run eval:real
 *
 * Put WAV files in eval/recordings/ and describe them in
 * eval/recordings/labels.csv (see eval/recordings/README.md):
 *
 *   file,type,true_sa_hz,raag,voice,singer
 *   asha_yaman_1.wav,singing,196.00,yaman,female,Asha
 *   asha_sa_1.wav,held-sa,196.00,,female,Asha
 *
 * true_sa_hz is the Sa the app's tanpura was set to while recording (or a
 * tuner reading), so the correct answer is known exactly.
 *
 * Measures:
 *  - "singing" clips: automatic Sa detection error (raag + voice type known,
 *    which is how the app uses it)
 *  - "held-sa" clips: error of "Find my Sa"
 * Writes eval/results/real-voice.md.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { centsBetween } from "../src/analysis/music";
import { detectSa, measureHeldSa } from "../src/analysis/sa";
import { trackPitch } from "../src/analysis/track";
import { RAAG_LIST } from "../src/data/allRaags";
import { readWav } from "./wav";

const DIR = "eval/recordings";
const labelsPath = join(DIR, "labels.csv");
if (!existsSync(labelsPath)) {
  console.log(`No ${labelsPath} yet. See eval/recordings/README.md for how to add real recordings.`);
  process.exit(0);
}

const [header, ...lines] = readFileSync(labelsPath, "utf8").trim().split(/\r?\n/);
const cols = header.split(",").map(s => s.trim());
const rows = lines.filter(l => l.trim()).map(l => Object.fromEntries(l.split(",").map((v, i) => [cols[i], v.trim()])));

type Result = { file: string; type: string; singer: string; errCents: number | null; unsure: boolean; note: string };
const results: Result[] = [];

for (const r of rows) {
  const trueSa = Number(r.true_sa_hz);
  const { samples, sampleRate } = readWav(join(DIR, r.file));
  const track = trackPitch(samples, sampleRate, "mpm");
  if (r.type === "held-sa") {
    const h = measureHeldSa(track);
    results.push({ file: r.file, type: r.type, singer: r.singer ?? "", errCents: h ? centsBetween(h.saHz, trueSa) : null, unsure: false, note: h ? `held ${h.heldSec.toFixed(1)} s, wobble ±${h.wobbleCents.toFixed(1)}` : "no steady note found" });
  } else {
    const raag = RAAG_LIST.find(x => x.id === r.raag);
    const expectedSaHz = r.voice === "female" ? 196 : r.voice === "male" ? 130.81 : undefined;
    const d = detectSa(track, { allowedSwaras: raag?.allowedSwaras, expectedSaHz });
    results.push({ file: r.file, type: r.type, singer: r.singer ?? "", errCents: d.saHz === null ? null : centsBetween(d.saHz, trueSa), unsure: d.unsure, note: d.unsure ? `marked unsure (confidence ${(d.confidence * 100).toFixed(0)}%)` : `confidence ${(d.confidence * 100).toFixed(0)}%` });
  }
}

const summary = (type: string) => {
  const rs = results.filter(r => r.type === type);
  if (!rs.length) return null;
  const within = (c: number) => rs.filter(r => r.errCents !== null && Math.abs(r.errCents) <= c).length;
  const pct = (n: number) => `${((100 * n) / rs.length).toFixed(0)}%`;
  const confident = rs.filter(r => !r.unsure && r.errCents !== null);
  const confOk = confident.filter(r => Math.abs(r.errCents!) <= 20).length;
  return `| ${type} | ${rs.length} | ${new Set(rs.map(r => r.singer)).size} | ${pct(within(20))} | ${pct(within(50))} | ${pct(rs.filter(r => r.unsure || r.errCents === null).length)} | ${confident.length ? `${confOk} of ${confident.length}` : "–"} |`;
};

const md = [
  "# Accuracy on real recordings",
  "",
  `${results.length} recordings. True Sa = the Sa the app's tanpura was set to while recording.`,
  "",
  "| Clip type | Clips | Singers | Sa within ±20 cents | Sa within ±50 cents | Unsure or no answer | Within ±20 cents when confident |",
  "|---|---|---|---|---|---|---|",
  summary("singing"), summary("held-sa"),
  "",
  "When detection is unsure, the app says so and uses the singer's own Sa instead, so the last column is what users actually see.",
  "",
  "| File | Type | Singer | Error (cents) | Note |",
  "|---|---|---|---|---|",
  ...results.map(r => `| ${r.file} | ${r.type} | ${r.singer} | ${r.errCents === null ? "–" : r.errCents.toFixed(1)} | ${r.note} |`),
  "",
].filter(x => x !== null).join("\n");
console.log(md);
mkdirSync("eval/results", { recursive: true });
writeFileSync("eval/results/real-voice.md", md);
