/**
 * Sa sadhana: hold Sa against the tanpura for as long and as steadily as
 * you can. Measures the longest hold, its distance from Sa and its wobble.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { signedCents } from '../../analysis/music';
import { measureSaSadhana, type SaSadhanaResult } from '../../analysis/sa';
import { trackPitch } from '../../analysis/track';
import { TanpuraEngine } from '../../audio/tanpura';
import { addRecord, loadHistory, newId } from '../../lib/practiceHistory';
import { LevelMeter, useMic } from './micHooks';

const MAX_SEC = 120;

export const SaSadhana: React.FC<{ saHz: number }> = ({ saHz }) => {
  const mic = useMic();
  const [withTanpura, setWithTanpura] = useState(true);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [result, setResult] = useState<SaSadhanaResult | null | "none">(null);
  const [previousBest, setPreviousBest] = useState<number | null>(null);
  const timer = useRef<number | null>(null);
  const tanpura = useRef<{ eng: TanpuraEngine; ctx: AudioContext } | null>(null);

  const stopTanpura = () => {
    if (!tanpura.current) return;
    tanpura.current.eng.disconnect();
    void tanpura.current.ctx.close();
    tanpura.current = null;
  };

  const finish = async () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stopTanpura();
    const m = mic.session.current;
    if (!m) return;
    const samples = m.stopRecording();
    const sr = m.sampleRate;
    await mic.close();
    setRecording(false);
    setLevel(0);
    const r = measureSaSadhana(trackPitch(samples, sr, "mpm"), saHz);
    const best = loadHistory().reduce((b, x) => (x.kind === "sa-sadhana" ? Math.max(b, x.longestHoldSec) : b), 0);
    setPreviousBest(best > 0 ? best : null);
    setResult(r ?? "none");
    if (r) {
      addRecord({
        kind: "sa-sadhana", id: newId(), dateIso: new Date().toISOString(), saHz,
        durationSec: samples.length / sr, ...r,
      });
    }
  };

  const start = async () => {
    setResult(null);
    const m = await mic.open();
    if (!m) return;
    if (withTanpura) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new Ctx();
      const eng = new TanpuraEngine(ctx, ctx.destination, { saHz, firstString: "Pa", cycleSec: 4.5, volume: 0.6 });
      await eng.loadSamples();
      eng.start();
      tanpura.current = { eng, ctx };
    }
    m.startRecording();
    setRecording(true);
    timer.current = window.setInterval(() => {
      setElapsed(m.recordedSeconds);
      setLevel(m.level());
      if (m.recordedSeconds >= MAX_SEC) void finish();
    }, 100);
  };

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); stopTanpura(); }, []);

  const r = result && result !== "none" ? result : null;

  return (
    <div className="space-y-5">
      <div className="bg-[#151A2E] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
        <p className="text-sm text-slate-300 text-center max-w-xl mx-auto">
          Sing Sa on "aa" and hold it as long and as steadily as you comfortably can. Press stop when you're done
          (it stops on its own after {MAX_SEC / 60} minutes). Use earphones so the tanpura doesn't reach the microphone.
        </p>
        <div className="flex flex-col items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input type="checkbox" checked={withTanpura} disabled={recording} onChange={e => setWithTanpura(e.target.checked)} className="accent-[#7C3AED]" />
            Play the tanpura while I sing (Sa {saHz.toFixed(1)} Hz)
          </label>
          {recording && (
            <>
              <span className="text-xs font-mono text-[#FBBF24]">Recording {elapsed.toFixed(1)} s</span>
              <LevelMeter level={level} />
            </>
          )}
          {!recording
            ? <button type="button" onClick={start} className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#38BDF8] text-slate-950 font-mono text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer"><Mic className="h-4 w-4" /> Start Sa sadhana</button>
            : <button type="button" onClick={() => void finish()} className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"><Square className="h-4 w-4 fill-white" /> Stop</button>}
          {mic.error && <p className="text-xs text-rose-300">{mic.error}</p>}
        </div>
      </div>

      {result === "none" && (
        <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 text-sm">
          Sa (within 50 cents of {saHz.toFixed(1)} Hz) wasn't held for half a second. Check that your Sa is set correctly, then try again.
        </div>
      )}

      {r && (
        <div className="bg-[#151A2E] p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-xs font-mono font-bold text-[#FBBF24] uppercase tracking-widest">Sa sadhana result</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
            {[
              ["Longest hold", `${r.longestHoldSec.toFixed(1)} s`, previousBest ? `Your previous best: ${previousBest.toFixed(1)} s` : "First Sa sadhana saved"],
              ["Distance from Sa", `${signedCents(r.medianOffsetCents)} cents`, "Median during the longest hold (+ = sharp)"],
              ["Wobble", `±${r.wobbleCents.toFixed(1)} cents`, "How much the note moved around its centre"],
              ["Total time on Sa", `${r.totalOnSaSec.toFixed(1)} s`, "Within 50 cents of Sa, any octave"],
            ].map(([label, value, note]) => (
              <div key={label} className="bg-[#0F1115]/60 p-4 rounded-xl border border-slate-800">
                <span className="text-[9px] text-slate-500 uppercase block font-bold">{label}</span>
                <span className="text-xl font-black text-slate-100 block">{value}</span>
                <span className="text-[10px] text-slate-400 font-sans">{note}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
