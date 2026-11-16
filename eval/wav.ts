/** Minimal WAV reader (PCM 16/24/32-bit integer or 32-bit float), mixed to mono. */
import { readFileSync } from "node:fs";

export function readWav(path: string): { samples: Float32Array; sampleRate: number } {
  const buf = readFileSync(path);
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE") throw new Error(`${path}: not a WAV file`);
  let pos = 12, fmt: { format: number; channels: number; rate: number; bits: number } | null = null;
  while (pos + 8 <= buf.length) {
    const id = buf.toString("ascii", pos, pos + 4);
    const size = buf.readUInt32LE(pos + 4);
    const body = pos + 8;
    if (id === "fmt ") {
      let format = buf.readUInt16LE(body);
      if (format === 0xfffe) format = buf.readUInt16LE(body + 24); // WAVE_FORMAT_EXTENSIBLE
      fmt = { format, channels: buf.readUInt16LE(body + 2), rate: buf.readUInt32LE(body + 4), bits: buf.readUInt16LE(body + 14) };
    } else if (id === "data") {
      if (!fmt) throw new Error(`${path}: data before fmt`);
      const bytes = fmt.bits / 8;
      const frames = Math.floor(size / (bytes * fmt.channels));
      const out = new Float32Array(frames);
      for (let i = 0; i < frames; i++) {
        let sum = 0;
        for (let c = 0; c < fmt.channels; c++) {
          const o = body + (i * fmt.channels + c) * bytes;
          let v: number;
          if (fmt.format === 3) v = buf.readFloatLE(o);
          else if (fmt.bits === 16) v = buf.readInt16LE(o) / 32768;
          else if (fmt.bits === 24) v = buf.readIntLE(o, 3) / 8388608;
          else if (fmt.bits === 32) v = buf.readInt32LE(o) / 2147483648;
          else throw new Error(`${path}: ${fmt.bits}-bit audio not supported`);
          sum += v;
        }
        out[i] = sum / fmt.channels;
      }
      return { samples: out, sampleRate: fmt.rate };
    }
    pos = body + size + (size % 2);
  }
  throw new Error(`${path}: no audio data`);
}
