/**
 * Listen back to a take: the recording plays and its measured pitch is
 * drawn on the raag's swara lines in step with the sound, so the singer can
 * hear and see each note together. The audio stays in memory only.
 */
import { useUi } from "../../i18n/ui";
import { closeContext } from '../../audio/closeContext';
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { PitchTrack } from "../../analysis/types";
import { SwaraCanvas } from "../shared/SwaraCanvas";
import { gridFor, type TracePoint, type View } from "../landing/stage";

interface Props {
  audio: { samples: Float32Array; sampleRate: number };
  track: PitchTrack;
  saHz: number;
  allowedSwaras: number[];
}

export const ListenBack: React.FC<Props> = ({ audio, track, saHz, allowedSwaras }) => {
  const u = useUi();
  const grid = useMemo(() => gridFor(allowedSwaras), [allowedSwaras]);
  const points: TracePoint[] = useMemo(() => track.frames.map(f => ({ t: f.timeSec, c: f.hz === null ? null : 1200 * Math.log2(f.hz / saHz) })), [track, saHz]);
  const duration = audio.samples.length / audio.sampleRate;
  const [playing, setPlaying] = useState(false);
  const run = useRef<{ ctx: AudioContext; src: AudioBufferSourceNode; t0: number } | null>(null);

  const stop = () => {
    const r = run.current;
    run.current = null;
    if (r) { try { r.src.stop(); } catch { /* done */ } closeContext(r.ctx); }
    setPlaying(false);
  };
  useEffect(() => () => stop(), []);

  const play = () => {
    if (playing) { stop(); return; }
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx: AudioContext = new Ctx();
    const buf = ctx.createBuffer(1, audio.samples.length, audio.sampleRate);
    buf.copyToChannel(audio.samples, 0);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    const t0 = ctx.currentTime + 0.1;
    src.start(t0);
    src.onended = () => { if (run.current?.src === src) stop(); };
    run.current = { ctx, src, t0 };
    setPlaying(true);
  };

  const view = (): View => {
    const r = run.current;
    const t = r ? Math.max(0, r.ctx.currentTime - r.t0) : duration;
    return { kind: "track", points, duration, reveal: Math.min(t, duration), ghostRest: !!r, now: 0 };
  };

  return (
    <div className="lb">
      <div className="lb-head">
        <h3 className="lb-h">{u("lbH")}</h3>
        <button type="button" className="rz-link" onClick={play}>{playing ? u("lbStop") : u("lbListen")}</button>
      </div>
      <SwaraCanvas className="rz-live" grid={grid} getView={view} running={playing} label="Your measured pitch on the raag's swara lines" />
      <p className="lb-note">{u("lbNote")}</p>
    </div>
  );
};
