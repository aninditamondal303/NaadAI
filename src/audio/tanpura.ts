/**
 * Tanpura engine (one engine for the whole app).
 *
 * Four strings in the traditional order: first string (mandra Pa, Ma or Ni),
 * two madhya Sa strings, kharaj (low) Sa. Plucks are scheduled on the audio
 * clock, so timing stays steady even when the page is busy.
 *
 * Sound source:
 * - Recorded samples, if /samples/tanpura/manifest.json exists (see
 *   docs/recording-guide.md). The sample recorded nearest to each string's
 *   pitch is used and shifted only slightly, so it stays natural.
 * - Otherwise a synthesised string (Karplus-Strong plucked-string model with
 *   a bright, buzzing "jawari" tone). The app tells the user which one is
 *   playing.
 *
 * Tuning is just intonation, as a tanpura is tuned by ear:
 * mandra Pa = 3/4 Sa, mandra Ma = 2/3 Sa, mandra Ni = 15/16 Sa, kharaj = 1/2 Sa.
 */

export type FirstString = "Pa" | "Ma" | "Ni";
export type StringId = "first" | "sa1" | "sa2" | "kharaj";
export const STRING_ORDER: StringId[] = ["first", "sa1", "sa2", "kharaj"];

const FIRST_RATIO: Record<FirstString, number> = { Pa: 3 / 4, Ma: 2 / 3, Ni: 15 / 16 };

export function stringHz(id: StringId, saHz: number, first: FirstString): number {
  switch (id) {
    case "first": return saHz * FIRST_RATIO[first];
    case "sa1": return saHz;
    case "sa2": return saHz;
    case "kharaj": return saHz / 2;
  }
}

/** Which first string suits a raag: Pa if the raag uses Pa, else shuddha Ma, else Ni (e.g. Marwa). */
export function firstStringForRaag(allowedSwaras: number[]): FirstString {
  if (allowedSwaras.includes(7)) return "Pa";
  if (allowedSwaras.includes(5)) return "Ma";
  return "Ni";
}

export interface TanpuraOptions {
  saHz: number;
  firstString: FirstString;
  /** Seconds for one full cycle of four plucks. Typical: 4–6 s. */
  cycleSec: number;
  /** 0..1 */
  volume: number;
}

/** When, within a cycle, each string is plucked (fractions of the cycle). */
const PLUCK_AT = [0, 0.22, 0.44, 0.66];

interface SampleEntry { file: string; hz: number }
interface TanpuraManifest {
  credit?: string;
  licence?: string;
  strings: Partial<Record<"first-Pa" | "first-Ma" | "first-Ni" | "sa" | "kharaj", SampleEntry[]>>;
}

// ------------------------------------------------------------ synthesis

/**
 * A plucked string: Karplus-Strong with a slight brightness boost and
 * slow decay, roughly like a tanpura string with jawari. Pure and
 * deterministic (the excitation noise uses a fixed seed), so its pitch can
 * be tested.
 */
export function karplusStrong(sampleRate: number, hz: number, seconds = 5): Float32Array {
  const sr = sampleRate;
  const n = Math.round(seconds * sr);
  const out = new Float32Array(n);
  const period = sr / hz;
  // The averaging filter adds half a sample of delay; the allpass supplies the rest of the fraction.
  const total = period - 0.5;
  let len = Math.floor(total);
  let frac = total - len;
  if (frac < 0.1) { len -= 1; frac += 1; } // keep the allpass coefficient well-behaved
  const line = new Float32Array(len);

  let seed = 12345;
  const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let i = 0; i < len; i++) line[i] = rand() * 2 - 1;

  const decay = Math.pow(0.001, 1 / (seconds * hz)); // ~60 dB over `seconds`
  const apC = (1 - frac) / (1 + frac);
  let apPrevIn = 0, apPrevOut = 0;
  let idx = 0, prev = 0;
  for (let i = 0; i < n; i++) {
    const cur = line[idx];
    const lp = 0.5 * (cur + prev);
    let y = decay * lp;
    const ap = apC * y + apPrevIn - apC * apPrevOut; // fractional-delay allpass for exact tuning
    apPrevIn = y; apPrevOut = ap; y = ap;
    prev = cur;
    line[idx] = y;
    out[i] = cur;
    idx = (idx + 1) % len;
  }
  // "Jawari" brightness: soft clipping adds the buzzing upper harmonics without changing the pitch.
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(out[i]));
  const attack = Math.round(0.004 * sr);
  for (let i = 0; i < n; i++) {
    const x = out[i] / (peak || 1);
    out[i] = 0.6 * Math.tanh(1.8 * x) * Math.min(1, i / attack);
  }
  return out;
}

const synthCache = new Map<string, AudioBuffer>();

export function synthPluck(ctx: BaseAudioContext, hz: number, seconds = 5): AudioBuffer {
  const key = `${ctx.sampleRate}:${hz.toFixed(3)}:${seconds}`;
  const cached = synthCache.get(key);
  if (cached) return cached;
  const buf = ctx.createBuffer(1, Math.round(seconds * ctx.sampleRate), ctx.sampleRate);
  buf.getChannelData(0).set(karplusStrong(ctx.sampleRate, hz, seconds));
  synthCache.set(key, buf);
  return buf;
}

// ------------------------------------------------------------ engine

export class TanpuraEngine {
  private ctx: AudioContext;
  private out: GainNode;
  private opts: TanpuraOptions;
  private timer: number | null = null;
  private nextTime = 0;
  private nextString = 0;
  private manifest: TanpuraManifest | null = null;
  private samples = new Map<string, AudioBuffer>();
  /** "samples" once recorded samples are loaded, otherwise "synth". */
  source: "samples" | "synth" = "synth";
  sourceCredit: string | null = null;
  onPluck: ((s: StringId) => void) | null = null;

  constructor(ctx: AudioContext, destination: AudioNode, opts: TanpuraOptions) {
    this.ctx = ctx;
    this.opts = { ...opts };
    this.out = ctx.createGain();
    this.out.gain.value = opts.volume;
    this.out.connect(destination);
  }

  /** Try to load recorded samples. Safe to skip: the synth is used if this fails. */
  async loadSamples(baseUrl = "/samples/tanpura"): Promise<void> {
    try {
      const res = await fetch(`${baseUrl}/manifest.json`);
      if (!res.ok) return;
      const manifest = (await res.json()) as TanpuraManifest;
      const entries = Object.values(manifest.strings).flat().filter(Boolean) as SampleEntry[];
      await Promise.all(entries.map(async e => {
        const r = await fetch(`${baseUrl}/${e.file}`);
        if (!r.ok) throw new Error(`missing ${e.file}`);
        this.samples.set(e.file, await this.ctx.decodeAudioData(await r.arrayBuffer()));
      }));
      this.manifest = manifest;
      this.source = "samples";
      this.sourceCredit = [manifest.credit, manifest.licence].filter(Boolean).join(" · ") || null;
    } catch {
      this.manifest = null;
      this.samples.clear();
      this.source = "synth";
    }
  }

  setOptions(partial: Partial<TanpuraOptions>) {
    this.opts = { ...this.opts, ...partial };
    if (partial.volume !== undefined) this.out.gain.setTargetAtTime(partial.volume, this.ctx.currentTime, 0.05);
  }

  get options(): TanpuraOptions { return { ...this.opts }; }

  get playing(): boolean { return this.timer !== null; }

  start() {
    if (this.timer !== null) return;
    if (this.ctx.state === "suspended") void this.ctx.resume();
    this.nextTime = this.ctx.currentTime + 0.05;
    this.nextString = 0;
    this.timer = window.setInterval(() => this.schedule(), 25);
    this.schedule();
  }

  stop() {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    this.out.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
    // restore volume for the next start, after the fade
    window.setTimeout(() => this.out.gain.setValueAtTime(this.opts.volume, this.ctx.currentTime), 1500);
  }

  disconnect() {
    this.stop();
    this.out.disconnect();
  }

  /** Pluck one string right away (e.g. when the user taps it). */
  pluckNow(s: StringId) {
    if (this.ctx.state === "suspended") void this.ctx.resume();
    this.out.gain.setValueAtTime(this.opts.volume, this.ctx.currentTime);
    this.pluck(s, this.ctx.currentTime + 0.01);
    this.onPluck?.(s);
  }

  /** Lookahead scheduler: queue every pluck due in the next 200 ms. */
  private schedule() {
    while (this.nextTime < this.ctx.currentTime + 0.2) {
      const s = STRING_ORDER[this.nextString];
      this.pluck(s, this.nextTime);
      const delayMs = Math.max(0, (this.nextTime - this.ctx.currentTime) * 1000);
      const cb = this.onPluck;
      if (cb) window.setTimeout(() => cb(s), delayMs);

      const cycle = this.opts.cycleSec;
      const cur = PLUCK_AT[this.nextString];
      const next = this.nextString === 3 ? 1 : PLUCK_AT[this.nextString + 1];
      this.nextTime += (next - cur) * cycle;
      this.nextString = (this.nextString + 1) % 4;
    }
  }

  private pluck(s: StringId, when: number) {
    const hz = stringHz(s, this.opts.saHz, this.opts.firstString);
    let buffer: AudioBuffer;
    let rate = 1;
    const sample = this.pickSample(s, hz);
    if (sample) {
      buffer = this.samples.get(sample.file)!;
      rate = hz / sample.hz;
    } else {
      buffer = synthPluck(this.ctx, hz, 5);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    // second Sa string slightly detuned (+1.5 cents) like a real instrument
    if (s === "sa2") src.detune.value = 1.5;
    const g = this.ctx.createGain();
    g.gain.value = s === "kharaj" ? 0.9 : s === "first" ? 0.8 : 0.7;
    src.connect(g);
    g.connect(this.out);
    src.start(when);
    src.stop(when + Math.min(buffer.duration / rate, this.opts.cycleSec * 1.6));
  }

  private pickSample(s: StringId, hz: number): SampleEntry | null {
    if (!this.manifest) return null;
    const key = s === "first" ? (`first-${this.opts.firstString}` as const) : s === "kharaj" ? "kharaj" : "sa";
    const list = this.manifest.strings[key];
    if (!list || list.length === 0) return null;
    let best = list[0];
    for (const e of list) if (Math.abs(Math.log2(e.hz / hz)) < Math.abs(Math.log2(best.hz / hz))) best = e;
    return best;
  }
}
