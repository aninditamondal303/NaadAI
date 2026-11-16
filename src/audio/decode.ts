/** Decode an uploaded audio file (WAV, MP3, M4A, WebM, ...) to mono samples in the browser. */

export const MAX_FILE_SECONDS = 10 * 60;

export async function decodeAudioFile(file: Blob): Promise<{ samples: Float32Array; sampleRate: number }> {
  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  const ctx: AudioContext = new Ctx();
  try {
    const buf = await ctx.decodeAudioData(await file.arrayBuffer());
    if (buf.duration > MAX_FILE_SECONDS) {
      throw new Error(`Recording is ${Math.round(buf.duration / 60)} minutes long. Please use one under ${MAX_FILE_SECONDS / 60} minutes.`);
    }
    // Mix all channels to mono.
    const n = buf.length;
    const out = new Float32Array(n);
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const ch = buf.getChannelData(c);
      for (let i = 0; i < n; i++) out[i] += ch[i] / buf.numberOfChannels;
    }
    return { samples: out, sampleRate: buf.sampleRate };
  } finally {
    try { await ctx.close(); } catch { /* ignore */ }
  }
}
