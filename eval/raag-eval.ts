/**
 * Raag recognition on real recordings.
 *
 *   npm run eval:raag -- <folder of WAV files> <labels.csv> [--name "dataset"]
 *
 * labels.csv: file,raag,sa
 *   file  WAV file name in the folder
 *   raag  raag id in this app (src/data/allRaags.ts)
 *   sa    pitch class of the recording's Sa (C, C#, D, ... B), if known;
 *         leave empty when it isn't (then only automatic Sa is measured)
 *
 * Two ways of choosing Sa are measured:
 *   labelled  Sa from the label, refined to the recording's own tuning
 *             (the median pitch it holds within 60 cents of that note).
 *             This is how the app works: the singer sets their Sa.
 *   automatic Sa found from the recording alone, without knowing the raag:
 *             each likely Sa is tried and the one whose best raag fits
 *             best is kept (guessRaagAndSa).
 *
 * For each clip the app ranks all raags in its library (guessRaag) and the
 * position of the true raag is recorded. "Top 1 up to same swaras" counts a
 * guess as right when it has exactly the true raag's swaras (for example
 * Bhupali and Deshkar), since those differ by phrasing the scoring can't see.
 *
 * Writes eval/results/raag-recognition.md (or the path given with --out).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { guessRaag, guessRaagAndSa } from "../src/analysis/raagGuess";
import { detectSa, steadyFrames } from "../src/analysis/sa";
import { findHeldNotes } from "../src/analysis/summary";
import { trackPitch } from "../src/analysis/track";
import type { PitchTrack } from "../src/analysis/types";
import { RAAG_LIST, type ComprehensiveRaag } from "../src/data/allRaags";
import { readWav } from "./wav";

const PC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const C4 = 261.6256;

/** Hz of a labelled Sa pitch class, tuned to what the recording actually holds near it. */
export function labelledSa(track: PitchTrack, pc: string): number | null {
  const k = PC.indexOf(pc.trim().toUpperCase().replace("♯", "#"));
  if (k < 0) return null;
  const target = k * 100;
  const offs: number[] = [];
  for (const f of steadyFrames(track.frames)) {
    const c = (((1200 * Math.log2(f.hz! / C4)) % 1200) + 1200) % 1200;
    let d = c - target;
    if (d > 600) d -= 1200;
    if (d < -600) d += 1200;
    if (Math.abs(d) <= 60) offs.push(d);
  }
  offs.sort((a, b) => a - b);
  const off = offs.length ? offs[Math.floor(offs.length / 2)] : 0;
  // octave 3 (C3..B3); the octave doesn't change which swara a note is
  return (C4 / 2) * Math.pow(2, (target + off) / 1200);
}

const swaraKey = (r: ComprehensiveRaag) => [...r.allowedSwaras].sort((a, b) => a - b).join(",");

export interface ClipResult { file: string; raag: string; saHz: number | null; rank: number | null; top: string[]; sameSwaraHit: boolean; thaatHit: boolean; confidence: string }

export function rankRaag(track: PitchTrack, saHz: number | null, raagId: string): Omit<ClipResult, "file" | "raag"> {
  if (saHz === null) return { saHz, rank: null, top: [], sameSwaraHit: false, thaatHit: false, confidence: "no Sa" };
  const truth = RAAG_LIST.find(r => r.id === raagId)!;
  const g = guessRaag(findHeldNotes(track, saHz), RAAG_LIST, RAAG_LIST.length);
  const idx = g.candidates.findIndex(c => c.raag.id === raagId);
  return {
    saHz,
    rank: idx < 0 ? null : idx + 1,
    top: g.candidates.slice(0, 3).map(c => c.raag.id),
    sameSwaraHit: g.candidates.length > 0 && swaraKey(g.candidates[0].raag) === swaraKey(truth),
    thaatHit: g.candidates.length > 0 && g.candidates[0].raag.thaat === truth.thaat,
    confidence: g.confidence,
  };
}

function main() {
  const args = process.argv.slice(2);
  const opt = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  const [dir, labelsPath] = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
  if (!dir || !labelsPath) {
    console.log("Usage: npm run eval:raag -- <folder of WAV files> <labels.csv> [--name dataset] [--out file.md]");
    process.exit(1);
  }
  const name = opt("--name") ?? dir;
  const out = opt("--out") ?? "eval/results/raag-recognition.md";

  const [header, ...lines] = readFileSync(labelsPath, "utf8").trim().split(/\r?\n/);
  const cols = header.split(",").map(s => s.trim());
  const rows = lines.filter(l => l.trim() && !l.startsWith("#")).map(l => Object.fromEntries(l.split(",").map((v, i) => [cols[i], v.trim()])));
  for (const r of rows) if (!RAAG_LIST.some(x => x.id === r.raag)) throw new Error(`${labelsPath}: unknown raag id "${r.raag}"`);

  const lab: ClipResult[] = [], auto: ClipResult[] = [];
  for (const r of rows) {
    const { samples, sampleRate } = readWav(join(dir, r.file));
    const track = trackPitch(samples, sampleRate, "mpm");
    const a = { file: r.file, raag: r.raag, ...rankRaag(track, r.sa ? labelledSa(track, r.sa) : null, r.raag) };
    const d = detectSa(track, {});
    const joint = guessRaagAndSa(d.candidates, sa => findHeldNotes(track, sa), RAAG_LIST, 1);
    const b = { file: r.file, raag: r.raag, ...rankRaag(track, joint.saHz, r.raag) };
    lab.push(a); auto.push(b);
    console.log(`  ${r.file.padEnd(46)} labelled Sa: rank ${a.rank ?? "-"}   automatic Sa: rank ${b.rank ?? "-"} (${b.top[0] ?? "-"})`);
  }

  const pct = (n: number, d: number) => `${n} / ${d} (${((100 * n) / d).toFixed(0)}%)`;
  const stats = (rs: ClipResult[]) => ({
    top1: pct(rs.filter(r => r.rank === 1).length, rs.length),
    top3: pct(rs.filter(r => r.rank !== null && r.rank <= 3).length, rs.length),
    same: pct(rs.filter(r => r.rank === 1 || r.sameSwaraHit).length, rs.length),
    thaat: pct(rs.filter(r => r.thaatHit).length, rs.length),
    median: (() => { const k = rs.map(r => r.rank ?? RAAG_LIST.length).sort((x, y) => x - y); return k[Math.floor(k.length / 2)]; })(),
  });
  const L = stats(lab), A = stats(auto);
  const hasLabels = rows.some(r => r.sa);
  const nameOf = (id: string) => RAAG_LIST.find(r => r.id === id)?.name.replace(/^Raag /, "") ?? id;

  const md = [
    "# Raag recognition on real recordings",
    "",
    `Dataset: ${name}. ${rows.length} recordings. The app chooses among all ${RAAG_LIST.length} raags in its library.`,
    "Generated by `npm run eval:raag`.",
    "",
    "| Sa | Top 1 | Top 3 | Top 1 up to same swaras | First guess in the right thaat | Median rank |",
    "|---|---|---|---|---|---|",
    ...(hasLabels ? [`| Labelled (as in the app: the singer sets Sa) | ${L.top1} | ${L.top3} | ${L.same} | ${L.thaat} | ${L.median} |`] : []),
    `| Automatic (found from the recording, raag unknown) | ${A.top1} | ${A.top3} | ${A.same} | ${A.thaat} | ${A.median} |`,
    "",
    "## Per recording",
    "",
    "| Recording | Raag | Labelled Sa: rank | First three guesses | Automatic Sa: rank |",
    "|---|---|---|---|---|",
    ...lab.map((r, i) => `| ${r.file.replace(/\.wav$/i, "")} | ${nameOf(r.raag)} | ${r.rank ?? "–"}${r.rank !== 1 && r.sameSwaraHit ? " (same swaras)" : ""} | ${r.top.map(nameOf).join(", ")} | ${auto[i].rank ?? "–"} |`),
    "",
  ].join("\n");
  mkdirSync("eval/results", { recursive: true });
  writeFileSync(out, md);
  console.log(`\n${hasLabels ? `Labelled Sa: top 1 ${L.top1}, top 3 ${L.top3}. ` : ""}Automatic Sa: top 1 ${A.top1}, top 3 ${A.top3}, thaat ${A.thaat}.\nWrote ${out}`);
}

if (process.argv[1]?.endsWith("raag-eval.ts")) main();
