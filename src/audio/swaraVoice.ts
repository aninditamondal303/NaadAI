/**
 * A simple harmonium-like voice for playing written swaras (sargam geet,
 * bandish, alaap) so a student can hear them. It is a synthesised guide
 * tone, not a singer: two slightly detuned reeds through a soft filter.
 */
import type { TimedNote } from "../practice/swaralipi";

export function scheduleSwaras(ctx: AudioContext, dest: AudioNode, notes: TimedNote[], saHz: number, t0: number, volume = 0.22): () => void {
  const out = ctx.createGain();
  out.gain.value = volume;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 2200;
  filter.Q.value = 0.5;
  filter.connect(out);
  out.connect(dest);
  const sources: OscillatorNode[] = [];
  for (const n of notes) {
    const hz = saHz * Math.pow(2, n.semitones / 12);
    const start = t0 + n.start;
    const end = start + Math.max(0.08, n.dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(1, start + 0.04);
    g.gain.setValueAtTime(1, Math.max(start + 0.04, end - 0.06));
    g.gain.linearRampToValueAtTime(0, end);
    g.connect(filter);
    for (const detune of [-4, 4]) {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(hz, start);
      o.detune.value = detune;
      const og = ctx.createGain();
      og.gain.value = 0.5;
      o.connect(og).connect(g);
      o.start(start);
      o.stop(end + 0.02);
      sources.push(o);
    }
  }
  return () => {
    const now = ctx.currentTime;
    out.gain.setTargetAtTime(0, now, 0.03);
    for (const s of sources) { try { s.stop(now + 0.1); } catch { /* already stopped */ } }
    window.setTimeout(() => out.disconnect(), 300);
  };
}
