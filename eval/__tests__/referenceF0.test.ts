import { describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { evaluateClip, findPairs, parseReference, referenceAt } from "../referenceF0";

function writeWav16(path: string, samples: Float32Array, sr: number) {
  const b = Buffer.alloc(44 + samples.length * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + samples.length * 2, 4); b.write("WAVE", 8);
  b.write("fmt ", 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write("data", 36); b.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((s, i) => b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), 44 + i * 2));
  writeFileSync(path, b);
}

describe("reference f0", () => {
  it("reads time,frequency lines with a header and treats 0 as silence", () => {
    expect(parseReference("time,f0\n0.00,0\n0.01,220.5\n")).toEqual([{ t: 0, hz: null }, { t: 0.01, hz: 220.5 }]);
  });

  it("skips frames on a sung/silent boundary and outside the annotation", () => {
    const at = referenceAt(parseReference("0,0\n0.01,0\n0.02,200\n0.03,200\n"));
    expect(at(0.005)).toBeNull();
    expect(at(0.015)).toBe("skip");
    expect(at(0.025)).toBe(200);
    expect(at(1)).toBe("skip");
  });

  it("scores a clip end to end", () => {
    const dir = mkdtempSync(join(tmpdir(), "f0eval-"));
    mkdirSync(join(dir, "Audio")); mkdirSync(join(dir, "F0"));
    const sr = 22050, n = sr * 2;
    const s = new Float32Array(n);
    let ph = 0;
    const lines: string[] = [];
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const hz = t < 0.5 ? 0 : 196 * Math.pow(2, (30 * Math.sin(2 * Math.PI * 5 * t)) / 1200); // vibrato ±30 cents
      if (hz > 0) { ph += (2 * Math.PI * hz) / sr; s[i] = 0.4 * (Math.sin(ph) + 0.4 * Math.sin(2 * ph)); }
      if (i % (sr / 100 | 0) === 0) lines.push(`${t.toFixed(4)},${hz.toFixed(3)}`);
    }
    writeWav16(join(dir, "Audio", "clip_1.wav"), s, sr);
    writeFileSync(join(dir, "F0", "clip_1_f0.csv"), lines.join("\n"));
    const pairs = findPairs(dir);
    expect(pairs).toHaveLength(1);
    const r = evaluateClip(pairs[0].wav, lines.join("\n"));
    expect(r.mpm.rpa20).toBeGreaterThan(90);
    expect(r.mpm.voicingFalseAlarm).toBeLessThan(5);
  });
});
