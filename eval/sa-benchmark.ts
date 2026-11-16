/**
 * Automatic Sa detection benchmark (synthetic phrases).
 *
 *   npm run eval:sa
 *
 * For every Sa from A2 (110 Hz) to A#3 (233 Hz), in four raags, builds a
 * 20-second alaap-like phrase (seeded, so identical every run) and checks how
 * close the detected Sa is to the true Sa. Writes eval/results/sa-benchmark.md.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { centsBetween } from "../src/analysis/music";
import { detectSa } from "../src/analysis/sa";
import { trackPitch } from "../src/analysis/track";
import { seededRandom, steady, synthVoice, type Segment } from "./synth";

const RAAGS: { name: string; swaras: number[] }[] = [
  { name: "Yaman", swaras: [0, 2, 4, 6, 7, 9, 11] },
  { name: "Bhairav", swaras: [0, 1, 4, 5, 7, 8, 11] },
  { name: "Bhupali", swaras: [0, 2, 4, 7, 9] },
  { name: "Malkauns", swaras: [0, 3, 5, 8, 10] },
];

/** Phrase that moves stepwise through the raag's swaras and keeps resting on Sa. */
function phrase(sa: number, swaras: number[], seed: number): Segment[] {
  const rand = seededRandom(seed);
  // Notes available: mandra upper half, madhya, taar Sa
  const ladder = [
    ...swaras.filter(s => s >= 5).map(s => s - 12),
    ...swaras,
    12,
  ];
  const saIdx = ladder.indexOf(0);
  const segs: Segment[] = [{ durSec: 0.2, f0: null }];
  let idx = saIdx;
  let t = 0;
  while (t < 20) {
    const r = rand();
    if (r < 0.15) idx = saIdx; // return to Sa
    else idx = Math.max(0, Math.min(ladder.length - 1, idx + (rand() < 0.5 ? -1 : 1) * (rand() < 0.8 ? 1 : 2)));
    const isSa = ladder[idx] % 12 === 0;
    const dur = (isSa ? 0.8 : 0.3) + rand() * (isSa ? 1.2 : 0.7);
    segs.push({ durSec: dur, f0: steady(sa * Math.pow(2, ladder[idx] / 12)) });
    segs.push({ durSec: 0.08 + rand() * 0.15, f0: null });
    t += dur;
  }
  return segs;
}

type Mode = "raag + voice type known" | "raag known" | "nothing known";
const MODES: Mode[] = ["raag + voice type known", "raag known", "nothing known"];
const rows: { mode: Mode; raag: string; sa: number; errCents: number | null; unsure: boolean }[] = [];
let seed = 100;
for (const raag of RAAGS) {
  for (let semi = 0; semi <= 13; semi++) {
    const sa = 110 * Math.pow(2, semi / 12);
    const clip = synthVoice(`${raag.name}-${sa.toFixed(0)}`, phrase(sa, raag.swaras, seed), { sampleRate: 44100, seed });
    seed++;
    const track = trackPitch(clip.samples, clip.sampleRate);
    // "voice type": the singer picked male (C3 = 130.8 Hz) or female (G3 = 196 Hz) Sa at sign-up
    const expectedSaHz = sa < 165 ? 130.81 : 196;
    for (const mode of MODES) {
      const d = detectSa(track,
        mode === "raag + voice type known" ? { allowedSwaras: raag.swaras, expectedSaHz }
        : mode === "raag known" ? { allowedSwaras: raag.swaras } : {});
      rows.push({ mode, raag: raag.name, sa, errCents: d.saHz === null ? null : centsBetween(d.saHz, sa), unsure: d.unsure });
    }
  }
}

const pct = (n: number, d: number) => `${((100 * n) / d).toFixed(1)}%`;
const lines = [
  "# Sa detection benchmark (synthetic phrases)",
  "",
  `${rows.length / MODES.length} synthetic 20-second phrases: 4 raags (Yaman, Bhairav, Bhupali, Malkauns) x 14 Sa values from 110 Hz to 233 Hz.`,
  "Synthetic signals are easier than real singing; real-voice results are reported separately.",
  "",
  "Raag known = the singer chose the raag in the app. Voice type known = they picked male or female Sa at sign-up (used only to choose the octave). Nothing known = Sa + Pa method only.",
  "",
  "| Mode | Raag | Within ±20 cents | Within ±50 cents | Octave-correct | Marked unsure |",
  "|---|---|---|---|---|---|",
];
for (const mode of MODES)
for (const r of [...RAAGS.map(x => x.name), "All"]) {
  const rs = rows.filter(x => x.mode === mode && (r === "All" || x.raag === r));
  const ok20 = rs.filter(x => x.errCents !== null && Math.abs(x.errCents) <= 20).length;
  const ok50 = rs.filter(x => x.errCents !== null && Math.abs(x.errCents) <= 50).length;
  const oct = rs.filter(x => x.errCents !== null && Math.abs(x.errCents) < 600).length;
  const unsure = rs.filter(x => x.unsure).length;
  lines.push(`| ${mode} | ${r} | ${pct(ok20, rs.length)} | ${pct(ok50, rs.length)} | ${pct(oct, rs.length)} | ${pct(unsure, rs.length)} |`);
}
const wrong = rows.filter(x => x.errCents === null || Math.abs(x.errCents) > 20);
if (wrong.length) {
  lines.push("", "## Misses", "", "| Mode | Raag | True Sa (Hz) | Error (cents) | Unsure |", "|---|---|---|---|---|");
  for (const w of wrong) lines.push(`| ${w.mode} | ${w.raag} | ${w.sa.toFixed(1)} | ${w.errCents === null ? "no answer" : w.errCents.toFixed(0)} | ${w.unsure} |`);
}
const md = lines.join("\n") + "\n";
console.log(md);
mkdirSync("eval/results", { recursive: true });
writeFileSync("eval/results/sa-benchmark.md", md);
