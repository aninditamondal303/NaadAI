/**
 * Four tanpura strings drawn as a picture of the sound you are hearing.
 * Their movement follows the real loudness of the tanpura's output (an
 * AnalyserNode), and a string jumps when the engine reports plucking it.
 * With the recorded drone the plucks aren't known separately, so all four
 * strings follow the overall sound.
 */
import React, { useEffect, useRef } from "react";

interface Props {
  analyser: AnalyserNode | null;
  /** Bumped by the parent each time a string is plucked: [string index, counter]. */
  pluck: [number, number] | null;
  labels: string[];
  label: string;
}

export const TanpuraStrings: React.FC<Props> = ({ analyser, pluck, labels, label }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const energy = useRef([0, 0, 0, 0]);
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (pluck) energy.current[pluck[0]] = 1;
  }, [pluck]);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const buf = new Float32Array(analyser ? analyser.fftSize : 0);
    let raf = 0;
    let level = 0;
    const draw = (t: number) => {
      const dpr = window.devicePixelRatio || 1;
      const w = c.clientWidth, h = c.clientHeight;
      if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
      const ctx = c.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (analyser) {
        analyser.getFloatTimeDomainData(buf);
        let s = 0;
        for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
        const rms = Math.sqrt(s / buf.length);
        level = level * 0.8 + Math.min(1, rms * 6) * 0.2;
      } else level *= 0.9;

      const top = 18, bottom = h - 34;
      const gap = w / 5;
      for (let i = 0; i < 4; i++) {
        const x = gap * (i + 1);
        const e = energy.current[i];
        energy.current[i] = e * 0.965;
        const amp = reduced ? 0 : Math.min(14, (level * 7 + e * 9) * (i === 3 ? 1.3 : 1));
        const lit = Math.min(1, level * 1.5 + e);
        ctx.strokeStyle = `rgba(217,180,95,${0.25 + lit * 0.75})`;
        ctx.shadowColor = "#D9B45F";
        ctx.shadowBlur = lit * 16;
        ctx.lineWidth = i === 3 ? 2.2 : 1.4;
        ctx.beginPath();
        const steps = 48;
        for (let k = 0; k <= steps; k++) {
          const y = top + ((bottom - top) * k) / steps;
          // fundamental standing wave on a string fixed at both ends
          const dx = amp * Math.sin((Math.PI * k) / steps) * Math.sin(t / (38 + i * 5) + i);
          if (k === 0) ctx.moveTo(x + dx, y); else ctx.lineTo(x + dx, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(243,236,223,${0.55 + lit * 0.45})`;
        ctx.font = '20px "Tiro Devanagari Hindi", "Tiro Bangla", serif';
        ctx.textAlign = "center";
        ctx.fillText(labels[i] ?? "", x, h - 8);
      }
      // Keep animating while there is sound or a string is still moving
      if (analyser || energy.current.some(e => e > 0.01) || level > 0.01) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [analyser, labels, reduced]);

  return <canvas ref={ref} className="rz-strings" role="img" aria-label={label} />;
};
