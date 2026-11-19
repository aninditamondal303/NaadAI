/**
 * Tabla engine: plays a taal's theka bol by bol, scheduled on the audio
 * clock so the beat is exact at any tempo.
 *
 * Each bol is made of one or two strokes: a dayan (right drum) stroke and/or
 * a bayan (left drum) stroke, e.g. Dha = Na (dayan) + Ge (bayan).
 *
 * Sound source:
 * - Recorded bols listed in /samples/tabla/manifest.json. The app ships
 *   real tabla recordings (from the MIT-licensed Naad project, see
 *   public/samples/tabla/LICENSE), retuned so the dayan sits on the
 *   singer's Sa.
 * - If they can't be loaded, simple synthesised strokes. The app says which
 *   one is playing.
 */
import type { Taal } from "../data/taals";

export type Stroke = "na" | "tin" | "tu" | "ti" | "ra" | "ge" | "ke";
export const STROKES: Stroke[] = ["na", "tin", "tu", "ti", "ra", "ge", "ke"];

const BOL_STROKES: Record<string, Stroke[]> = {
  dha: ["na", "ge"], dhe: ["na", "ge"], dhin: ["tin", "ge"], dhi: ["tin", "ge"], din: ["tin", "ge"],
  na: ["na"], ta: ["na"], tin: ["tin"], tu: ["tu"],
  ti: ["ti"], te: ["ti"], di: ["ti"], ra: ["ra"], tra: ["ti"],
  ge: ["ge"], ga: ["ge"], ghe: ["ge"],
  ke: ["ke"], ka: ["ke"], ki: ["ke"], kat: ["ke"], kra: ["ke"],
  "-": [],
};

/** Strokes for a bol name (case-insensitive). Throws for an unknown bol so typos are caught by tests. */
export function strokesFor(bol: string): Stroke[] {
  const s = BOL_STROKES[bol.toLowerCase()];
  if (!s) throw new Error(`Unknown bol "${bol}"`);
  return s;
}

// ------------------------------------------------------------ synthesis (fallback)

function seeded(seed: number) {
  let s = seed;
  return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff * 2 - 1; };
}

/** Synthesised stroke. The dayan is tuned to `saHz` (tabla is tuned to Sa). Deterministic. */
export function synthStroke(stroke: Stroke, sampleRate: number, saHz: number): Float32Array {
  const sr = sampleRate;
  const dur = { na: 0.45, tin: 1.0, tu: 0.7, ti: 0.12, ra: 0.1, ge: 0.8, ke: 0.12 }[stroke];
  const n = Math.round(dur * sr);
  const out = new Float32Array(n);
  const rand = seeded(STROKES.indexOf(stroke) + 1);
  // dayan pitch: Sa in an octave that sits between ~250 and 500 Hz
  let f0 = saHz;
  while (f0 < 250) f0 *= 2;
  while (f0 > 500) f0 /= 2;

  for (let i = 0; i < n; i++) {
    const t = i / sr;
    let v = 0;
    switch (stroke) {
      case "na": // bright ring with the tabla's harmonic overtones
        v = [1, 0.6, 0.45, 0.3].reduce((a, amp, k) => a + amp * Math.sin(2 * Math.PI * f0 * (k + 1) * t) * Math.exp(-t * (7 + 4 * k)), 0);
        v += 0.4 * rand() * Math.exp(-t * 250);
        break;
      case "tin": // longer, fundamental-heavy ring
        v = Math.sin(2 * Math.PI * f0 * t) * Math.exp(-t * 3.5) + 0.25 * Math.sin(4 * Math.PI * f0 * t) * Math.exp(-t * 8);
        v += 0.2 * rand() * Math.exp(-t * 300);
        break;
      case "tu": // open, soft
        v = Math.sin(2 * Math.PI * f0 * t) * Math.exp(-t * 5) * Math.min(1, t / 0.004);
        break;
      case "ti":
      case "ra": // closed, damped strokes
        v = rand() * Math.exp(-t * (stroke === "ti" ? 60 : 80)) * 0.7 + 0.3 * Math.sin(2 * Math.PI * f0 * 2 * t) * Math.exp(-t * 60);
        break;
      case "ge": { // bayan: low resonant boom with a slight downward pitch glide
        const phase = 2 * Math.PI * (95 * t + (95 * 0.15 / 6) * (1 - Math.exp(-t * 6)));
        v = Math.sin(phase) * Math.exp(-t * 4) + 0.3 * rand() * Math.exp(-t * 200);
        break;
      }
      case "ke": // bayan closed slap
        v = rand() * Math.exp(-t * 45) * 0.8;
        break;
    }
    out[i] = v;
  }
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(out[i]));
  const gain = { na: 0.5, tin: 0.5, tu: 0.45, ti: 0.35, ra: 0.3, ge: 0.6, ke: 0.35 }[stroke];
  for (let i = 0; i < n; i++) out[i] = (out[i] / (peak || 1)) * gain;
  return out;
}

// ------------------------------------------------------------ engine

/** Recorded bols the app knows how to use. */
export type SampleBol = "Dha" | "Dhin" | "Na" | "Ta" | "Tin" | "Tun" | "Ti" | "Ge" | "Ga" | "Ke";

const BOL_SAMPLE: Record<string, SampleBol | null> = {
  dha: "Dha", dhe: "Dha", dhin: "Dhin", dhi: "Dhin", din: "Dhin",
  na: "Na", ta: "Ta", tin: "Tin", tu: "Tun",
  ti: "Ti", te: "Ti", di: "Ti", ra: "Ti", tra: "Ti",
  ge: "Ge", ghe: "Ge", ga: "Ga",
  ke: "Ke", ka: "Ke", ki: "Ke", kat: "Ke", kra: "Ke",
  "-": null,
};

/** Which recorded bol plays a theka bol (null = rest). Throws for an unknown bol. */
export function sampleFor(bol: string): SampleBol | null {
  const key = bol.toLowerCase();
  if (!(key in BOL_SAMPLE)) throw new Error(`Unknown bol "${bol}"`);
  return BOL_SAMPLE[key];
}

interface TablaManifest {
  credit?: string;
  licence?: string;
  /** Recorded pitch of the dayan (Hz), used to retune the tabla to the singer's Sa. */
  dayanHz?: number;
  bols: Partial<Record<SampleBol, string>>;
}

/**
 * Playback rate that moves the recorded dayan pitch to the singer's Sa, in
 * whichever octave needs the smallest shift (never more than 6 semitones).
 */
export function retuneRate(recordedHz: number, saHz: number): number {
  let r = saHz / recordedHz;
  while (r > Math.SQRT2) r /= 2;
  while (r < Math.SQRT1_2) r *= 2;
  return r;
}

export interface TaalOptions {
  taal: Taal;
  /** Matras per minute. */
  bpm: number;
  saHz: number;
  /** 0..1 */
  volume: number;
}

/** Times (in seconds from the start of the cycle) of every bol in one avartan. */
export function bolTimes(taal: Taal, bpm: number): { matra: number; bol: string; at: number; startsMatra: boolean }[] {
  const beat = 60 / bpm;
  const out: { matra: number; bol: string; at: number; startsMatra: boolean }[] = [];
  taal.theka.forEach((bols, i) => {
    bols.forEach((bol, j) => out.push({ matra: i + 1, bol, at: i * beat + (j * beat) / bols.length, startsMatra: j === 0 }));
  });
  return out;
}

export class TaalPlayer {
  private ctx: AudioContext;
  private out: GainNode;
  private opts: TaalOptions;
  private timer: number | null = null;
  private cycleStart = 0;
  private nextIndex = 0;
  private events: ReturnType<typeof bolTimes> = [];
  private recorded = new Map<SampleBol, AudioBuffer>();
  private synthCache = new Map<string, AudioBuffer>();
  private dayanHz: number | null = null;
  source: "samples" | "synth" = "synth";
  sourceCredit: string | null = null;
  onMatra: ((matra: number) => void) | null = null;

  constructor(ctx: AudioContext, destination: AudioNode, opts: TaalOptions) {
    this.ctx = ctx;
    this.opts = { ...opts };
    this.out = ctx.createGain();
    this.out.gain.value = opts.volume;
    this.out.connect(destination);
  }

  async loadSamples(baseUrl = `${import.meta.env.BASE_URL}samples/tabla`): Promise<void> {
    try {
      const res = await fetch(`${baseUrl}/manifest.json`);
      if (!res.ok) return;
      const manifest = (await res.json()) as TablaManifest;
      const needed: SampleBol[] = ["Dha", "Dhin", "Na", "Ta", "Tin", "Tun", "Ti", "Ge", "Ga", "Ke"];
      await Promise.all(needed.map(async b => {
        const file = manifest.bols?.[b];
        if (!file) throw new Error(`no sample for ${b}`);
        const r = await fetch(`${baseUrl}/${file}`);
        if (!r.ok) throw new Error(`missing ${file}`);
        this.recorded.set(b, await this.ctx.decodeAudioData(await r.arrayBuffer()));
      }));
      this.dayanHz = manifest.dayanHz ?? null;
      this.source = "samples";
      this.sourceCredit = null; // licence notice ships in public/samples/*/LICENSE
    } catch {
      this.recorded.clear();
      this.source = "synth";
    }
  }

  setOptions(partial: Partial<TaalOptions>) {
    const wasPlaying = this.playing;
    const changesTiming = partial.taal !== undefined || partial.bpm !== undefined;
    this.opts = { ...this.opts, ...partial };
    if (partial.volume !== undefined) this.out.gain.setTargetAtTime(partial.volume, this.ctx.currentTime, 0.05);
    if (wasPlaying && changesTiming) {
      // restart cleanly from sam on the next beat
      this.stop();
      this.start();
    }
  }

  get playing(): boolean { return this.timer !== null; }

  /** Audio-clock time of the first sam after the last start(). */
  startedAt = 0;

  start() {
    if (this.timer !== null) return;
    if (this.ctx.state === "suspended") void this.ctx.resume();
    this.events = bolTimes(this.opts.taal, this.opts.bpm);
    this.cycleStart = this.ctx.currentTime + 0.1;
    this.startedAt = this.cycleStart;
    this.nextIndex = 0;
    this.out.gain.setValueAtTime(this.opts.volume, this.ctx.currentTime);
    this.timer = window.setInterval(() => this.schedule(), 25);
    this.schedule();
  }

  stop() {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    this.out.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
  }

  disconnect() {
    this.stop();
    this.out.disconnect();
  }

  private schedule() {
    const cycleLen = this.opts.taal.matras * (60 / this.opts.bpm);
    while (true) {
      const ev = this.events[this.nextIndex];
      const when = this.cycleStart + ev.at;
      if (when >= this.ctx.currentTime + 0.2) break;
      if (this.source === "samples") {
        const b = sampleFor(ev.bol);
        if (b) this.playRecorded(b, when, ev.startsMatra && ev.matra === 1);
      } else {
        for (const s of strokesFor(ev.bol)) this.play(s, when);
      }
      if (ev.startsMatra && this.onMatra) {
        const cb = this.onMatra;
        const m = ev.matra;
        window.setTimeout(() => cb(m), Math.max(0, (when - this.ctx.currentTime) * 1000));
      }
      this.nextIndex++;
      if (this.nextIndex >= this.events.length) {
        this.nextIndex = 0;
        this.cycleStart += cycleLen;
      }
    }
  }

  private playRecorded(bol: SampleBol, when: number, sam: boolean) {
    const buffer = this.recorded.get(bol)!;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    // the whole tabla is retuned together, as if the player had tuned it to your Sa
    if (this.dayanHz) src.playbackRate.value = retuneRate(this.dayanHz, this.opts.saHz);
    const g = this.ctx.createGain();
    g.gain.value = sam ? 1 : 0.85; // a little weight on sam, like a real player
    src.connect(g);
    g.connect(this.out);
    src.start(when);
  }

  /** Fallback: synthesised stroke. */
  private play(stroke: Stroke, when: number) {
    const key = `${stroke}:${this.opts.saHz.toFixed(2)}`;
    let buffer = this.synthCache.get(key);
    if (!buffer) {
      const data = synthStroke(stroke, this.ctx.sampleRate, this.opts.saHz);
      buffer = this.ctx.createBuffer(1, data.length, this.ctx.sampleRate);
      buffer.getChannelData(0).set(data);
      this.synthCache.set(key, buffer);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.out);
    src.start(when);
  }
}
