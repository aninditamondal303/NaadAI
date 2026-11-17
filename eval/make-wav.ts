/**
 * Write a synthetic test clip to a WAV file, for manual or browser testing.
 *   npx tsx eval/make-wav.ts <out.wav> <sa|yaman> [saHz]
 */
import { writeFileSync } from "node:fs";
import { glide, oscillating, steady, synthVoice, SWARA_CENTS, type Segment } from "./synth";

const [out, kind = "yaman", saArg = "138.59"] = process.argv.slice(2);
if (!out) throw new Error("usage: make-wav.ts <out.wav> <sa|yaman> [saHz]");
const sa = Number(saArg);
const at = (sw: string, oct = 0) => sa * Math.pow(2, (SWARA_CENTS[sw] + 1200 * oct) / 1200);

let segs: Segment[];
if (kind === "yaman-mistakes") {
  // Yaman phrase with a held shuddha Ma (not in Yaman) and an andolan on Ga
  segs = [
    { durSec: 0.3, f0: null }, { durSec: 1.5, f0: steady(sa) }, { durSec: 0.1, f0: null },
    { durSec: 0.8, f0: steady(at("R")) }, { durSec: 0.1, f0: null },
    { durSec: 3.0, f0: oscillating(at("G"), 30, 2) }, { durSec: 0.5, f0: null },
    { durSec: 1.2, f0: steady(at("m")) }, { durSec: 0.1, f0: null },
    { durSec: 1.0, f0: steady(at("G")) }, { durSec: 0.1, f0: null },
    { durSec: 1.0, f0: steady(at("R")) }, { durSec: 0.1, f0: null },
    { durSec: 1.5, f0: steady(sa) }, { durSec: 0.3, f0: null },
  ];
} else if (kind === "demo") {
  // ~20 s Yaman alaap-like phrase for the website demo: mostly in tune, one
  // swara sung a little flat, an andolan on Ga, a meend, and one held
  // shuddha Ma (not in Yaman) for the rule checker to find.
  const flat = (sw: string, cents: number) => sa * Math.pow(2, (SWARA_CENTS[sw] + cents) / 1200);
  segs = [
    { durSec: 0.3, f0: null },
    { durSec: 2.0, f0: steady(sa) }, { durSec: 0.15, f0: null },
    { durSec: 0.7, f0: steady(at("N", -1)) }, { durSec: 0.1, f0: null },
    { durSec: 0.8, f0: steady(flat("R", -18)) }, { durSec: 0.1, f0: null },
    { durSec: 2.5, f0: oscillating(at("G"), 25, 1.8) }, { durSec: 0.5, f0: null },
    { durSec: 0.8, f0: steady(at("M")) }, { durSec: 0.1, f0: null },
    { durSec: 1.6, f0: steady(at("P")) }, { durSec: 0.1, f0: null },
    { durSec: 1.2, f0: glide(at("P"), at("G"), 1.2) },
    { durSec: 1.0, f0: steady(at("G")) }, { durSec: 0.6, f0: null },
    { durSec: 1.0, f0: steady(at("m")) }, { durSec: 0.1, f0: null },
    { durSec: 0.8, f0: steady(at("G")) }, { durSec: 0.1, f0: null },
    { durSec: 0.8, f0: steady(flat("R", -18)) }, { durSec: 0.1, f0: null },
    { durSec: 0.6, f0: steady(at("N", -1)) }, { durSec: 0.1, f0: null },
    { durSec: 2.5, f0: steady(sa) }, { durSec: 0.4, f0: null },
  ];
} else if (kind === "sa") {
  segs = [{ durSec: 0.5, f0: null }, { durSec: 8, f0: steady(sa) }, { durSec: 0.5, f0: null }];
} else {
  const notes: [string, number, number][] = [
    ["S", 0, 1.5], ["N", -1, 0.6], ["R", 0, 0.6], ["S", 0, 1.2], ["N", -1, 0.5], ["R", 0, 0.5], ["G", 0, 1.0],
    ["R", 0, 0.5], ["S", 0, 1.0], ["G", 0, 0.6], ["M", 0, 0.6], ["P", 0, 1.2], ["M", 0, 0.5], ["G", 0, 0.8],
    ["R", 0, 0.5], ["S", 0, 1.5],
  ];
  segs = [{ durSec: 0.3, f0: null }];
  for (const [sw, oct, d] of notes) { segs.push({ durSec: d, f0: steady(at(sw, oct)) }); segs.push({ durSec: 0.1, f0: null }); }
}
const clip = synthVoice(kind, segs, { sampleRate: 48000 });

// 16-bit PCM mono WAV
const n = clip.samples.length;
const buf = Buffer.alloc(44 + n * 2);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write("WAVE", 8);
buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
buf.writeUInt32LE(clip.sampleRate, 24); buf.writeUInt32LE(clip.sampleRate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(n * 2, 40);
for (let i = 0; i < n; i++) buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(clip.samples[i] * 32767))), 44 + i * 2);
writeFileSync(out, buf);
console.log(`wrote ${out}: ${(n / clip.sampleRate).toFixed(1)} s, Sa ${sa} Hz`);
