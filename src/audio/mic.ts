/**
 * Microphone capture for analysis.
 *
 * Captures raw, uncompressed samples (no MediaRecorder codec) through an
 * AudioWorklet, so the analysis sees exactly what the microphone heard.
 * Browser voice processing (echo cancellation, noise suppression, automatic
 * gain) is switched off because it distorts pitch and loudness.
 */

const WORKLET_SOURCE = `
class NaadCapture extends AudioWorkletProcessor {
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) this.port.postMessage(ch.slice(0));
    return true;
  }
}
registerProcessor("naad-capture", NaadCapture);
`;

export class MicSession {
  readonly sampleRate: number;
  private ctx: AudioContext;
  private stream: MediaStream;
  private node: AudioWorkletNode;
  private chunks: Float32Array[] = [];
  private total = 0;
  private recording = false;
  /** Last ~0.25 s of audio, always kept for the live tuner and level meter. */
  private ring: Float32Array;
  private ringPos = 0;
  /** Audio-clock time (s) of the first recorded sample. */
  recordingStartTime = 0;

  private constructor(ctx: AudioContext, stream: MediaStream, node: AudioWorkletNode) {
    this.ctx = ctx;
    this.stream = stream;
    this.node = node;
    this.sampleRate = ctx.sampleRate;
    this.ring = new Float32Array(Math.pow(2, Math.ceil(Math.log2(ctx.sampleRate / 4))));
    node.port.onmessage = (e: MessageEvent<Float32Array>) => this.push(e.data);
  }

  static async open(): Promise<MicSession> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("This browser can't access the microphone.");
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
    });
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx: AudioContext = new Ctx();
    const url = URL.createObjectURL(new Blob([WORKLET_SOURCE], { type: "application/javascript" }));
    try {
      await ctx.audioWorklet.addModule(url);
    } finally {
      URL.revokeObjectURL(url);
    }
    const source = ctx.createMediaStreamSource(stream);
    const node = new AudioWorkletNode(ctx, "naad-capture");
    const mute = ctx.createGain();
    mute.gain.value = 0; // keep the node running without playing the mic back
    source.connect(node);
    node.connect(mute);
    mute.connect(ctx.destination);
    if (ctx.state === "suspended") await ctx.resume();
    return new MicSession(ctx, stream, node);
  }

  private push(block: Float32Array) {
    for (let i = 0; i < block.length; i++) {
      this.ring[this.ringPos] = block[i];
      this.ringPos = (this.ringPos + 1) % this.ring.length;
    }
    if (this.recording) {
      this.chunks.push(block);
      this.total += block.length;
    }
  }

  /** The most recent `n` samples (n <= ring size). */
  latest(n: number): Float32Array {
    const out = new Float32Array(n);
    const len = this.ring.length;
    let p = (this.ringPos - n + len) % len;
    for (let i = 0; i < n; i++) { out[i] = this.ring[p]; p = (p + 1) % len; }
    return out;
  }

  /** Loudness of the last ~50 ms, 0..1 (RMS). */
  level(): number {
    const w = this.latest(Math.round(this.sampleRate * 0.05));
    let s = 0;
    for (let i = 0; i < w.length; i++) s += w[i] * w[i];
    return Math.sqrt(s / w.length);
  }

  startRecording() {
    this.chunks = [];
    this.total = 0;
    this.recording = true;
    this.recordingStartTime = this.ctx.currentTime;
  }

  /** The AudioContext the microphone runs on; schedule clicks on it to share one clock. */
  get context(): AudioContext {
    return this.ctx;
  }

  /**
   * Estimated round-trip delay (s) between a sound being scheduled and the
   * singer's response reaching the recording: output latency + input latency.
   * Browsers report these only approximately.
   */
  get roundTripLatency(): number {
    const out = (this.ctx as any).outputLatency ?? this.ctx.baseLatency ?? 0.02;
    const settings = this.stream.getAudioTracks()[0]?.getSettings() as any;
    const inp = typeof settings?.latency === "number" ? settings.latency : 0.02;
    return Math.min(0.3, Math.max(0, out + inp));
  }

  /** Copy of the recorded samples between two sample indices (clamped to what's recorded). */
  recordedRange(from: number, to: number): Float32Array {
    from = Math.max(0, Math.floor(from));
    to = Math.min(this.total, Math.floor(to));
    const out = new Float32Array(Math.max(0, to - from));
    let pos = 0;
    for (const c of this.chunks) {
      const cStart = pos, cEnd = pos + c.length;
      pos = cEnd;
      if (cEnd <= from) continue;
      if (cStart >= to) break;
      const a = Math.max(from, cStart), b = Math.min(to, cEnd);
      out.set(c.subarray(a - cStart, b - cStart), a - from);
    }
    return out;
  }

  get recordedSamples(): number {
    return this.total;
  }

  get recordedSeconds(): number {
    return this.total / this.sampleRate;
  }

  /** Stop recording and return everything captured since startRecording(). */
  stopRecording(): Float32Array {
    this.recording = false;
    const out = new Float32Array(this.total);
    let o = 0;
    for (const c of this.chunks) { out.set(c, o); o += c.length; }
    this.chunks = [];
    this.total = 0;
    return out;
  }

  async close() {
    this.recording = false;
    this.stream.getTracks().forEach(t => t.stop());
    this.node.port.onmessage = null;
    try { await this.ctx.close(); } catch { /* already closed */ }
  }
}
