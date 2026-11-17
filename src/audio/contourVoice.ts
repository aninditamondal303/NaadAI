/**
 * Plays a pitch line (cents above Sa at a fixed rate) with the same reed-like
 * guide voice as scheduleSwaras, gliding where the singer glided, and silent
 * where they were silent.
 */
export function scheduleContour(ctx: AudioContext, dest: AudioNode, contour: (number | null)[], rate: number, saHz: number, t0: number, volume = 0.22): { stop: () => void; duration: number } {
  const out = ctx.createGain();
  out.gain.value = volume;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 2200;
  filter.connect(out);
  out.connect(dest);
  const env = ctx.createGain();
  env.gain.value = 0;
  env.connect(filter);
  const step = 1 / rate;
  const duration = contour.length * step;
  const oscs = [-4, 4].map(detune => {
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.detune.value = detune;
    const g = ctx.createGain();
    g.gain.value = 0.5;
    o.connect(g).connect(env);
    return o;
  });
  let last = contour.find(c => c !== null) ?? 0;
  let on = false;
  contour.forEach((c, i) => {
    const t = t0 + i * step;
    if (c !== null) {
      const hz = saHz * Math.pow(2, c / 1200);
      for (const o of oscs) {
        if (!on) o.frequency.setValueAtTime(hz, t);
        else o.frequency.linearRampToValueAtTime(hz, t);
      }
      if (!on) { env.gain.setTargetAtTime(1, t, 0.015); on = true; }
      last = c;
    } else if (on) {
      env.gain.setTargetAtTime(0, t, 0.02);
      on = false;
    }
  });
  env.gain.setTargetAtTime(0, t0 + duration, 0.03);
  void last;
  for (const o of oscs) { o.start(t0); o.stop(t0 + duration + 0.3); }
  return {
    duration,
    stop: () => {
      const now = ctx.currentTime;
      out.gain.setTargetAtTime(0, now, 0.03);
      for (const o of oscs) { try { o.stop(now + 0.1); } catch { /* done */ } }
      window.setTimeout(() => out.disconnect(), 300);
    },
  };
}
