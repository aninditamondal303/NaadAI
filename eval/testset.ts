/**
 * The synthetic test set: Hindustani-style phrases for a typical male Sa (C#3)
 * and female Sa (G#3), each with an exactly known pitch.
 */
import { glide, oscillating, steady, synthVoice, SWARA_CENTS, type Segment, type SynthClip } from "./synth";

const at = (sa: number, swara: string, octave = 0) =>
  sa * Math.pow(2, (SWARA_CENTS[swara] + 1200 * octave) / 1200);

function yamanAroh(sa: number): Segment[] {
  const notes: [string, number][] = [["N", -1], ["R", 0], ["G", 0], ["M", 0], ["P", 0], ["D", 0], ["N", 0], ["S", 1]];
  const segs: Segment[] = [{ durSec: 0.3, f0: null }];
  for (const [sw, oct] of notes) {
    segs.push({ durSec: 0.6, f0: steady(at(sa, sw, oct)) });
    segs.push({ durSec: 0.15, f0: null });
  }
  return segs;
}

export function buildTestSet(): SynthClip[] {
  const voices = [
    { label: "male", sa: 138.59, sr: 44100 },  // C#3
    { label: "female", sa: 207.65, sr: 48000 }, // G#3
  ];
  const clips: SynthClip[] = [];

  for (const { label, sa, sr } of voices) {
    const o = { sampleRate: sr };
    const p = (n: string) => `${label}/${n}`;

    clips.push(synthVoice(p("sa-sadhana"), [{ durSec: 0.3, f0: null }, { durSec: 4, f0: steady(sa) }, { durSec: 0.3, f0: null }], o));
    clips.push(synthVoice(p("yaman-aroh"), yamanAroh(sa), o));
    clips.push(synthVoice(p("kharaj"), [
      { durSec: 0.3, f0: null },
      { durSec: 2, f0: steady(at(sa, "S", -1)) },
      { durSec: 0.2, f0: null },
      { durSec: 2, f0: steady(at(sa, "P", -1)) },
      { durSec: 0.3, f0: null },
    ], o));
    clips.push(synthVoice(p("taar"), [
      { durSec: 0.3, f0: null },
      { durSec: 2, f0: steady(at(sa, "S", 1)) },
      { durSec: 0.2, f0: null },
      { durSec: 2, f0: steady(at(sa, "P", 1)) },
      { durSec: 0.3, f0: null },
    ], o));
    clips.push(synthVoice(p("andolan-komal-re"), [
      { durSec: 0.3, f0: null }, { durSec: 3, f0: oscillating(at(sa, "r"), 40, 1.5) }, { durSec: 0.3, f0: null },
    ], o));
    clips.push(synthVoice(p("gamak"), [
      { durSec: 0.3, f0: null }, { durSec: 2, f0: oscillating(at(sa, "P"), 150, 6) }, { durSec: 0.3, f0: null },
    ], o));
    clips.push(synthVoice(p("meend-sa-pa-ga"), [
      { durSec: 0.3, f0: null },
      { durSec: 1.5, f0: glide(sa, at(sa, "P"), 1.5) },
      { durSec: 1.5, f0: glide(at(sa, "P"), at(sa, "G"), 1.5) },
      { durSec: 0.3, f0: null },
    ], o));
    clips.push(synthVoice(p("weak-fundamental"), yamanAroh(sa), { ...o, fundamentalGain: 0.15, seed: 2 }));
    clips.push(synthVoice(p("noise-20dB"), yamanAroh(sa), { ...o, snrDb: 20, seed: 3 }));
    clips.push(synthVoice(p("noise-10dB"), yamanAroh(sa), { ...o, snrDb: 10, seed: 4 }));
  }
  return clips;
}
