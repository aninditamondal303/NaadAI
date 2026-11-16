/**
 * Analyzer: everything here is measured from the microphone or an uploaded
 * recording, using the shared analysis code in src/analysis.
 *
 *  - Live tuner:      which swara you are singing right now, and how many cents off
 *  - Find my Sa:      hold Sa for a few seconds; we measure it
 *  - Analyse singing: record or upload; per-swara measurements and pitch curve
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Headphones, Mic, Square, Upload } from 'lucide-react';
import { centsBetween, westernNote } from '../analysis/music';
import { makeMpmDetector } from '../analysis/pitch/mpm';
import { measureHeldSa, type HeldSaResult } from '../analysis/sa';
import { noteLabel, summariseTake, type TakeMeasurements } from '../analysis/summary';
import { rmsOf, trackPitch, VOICING, windowSizeFor } from '../analysis/track';
import { DEFAULT_PITCH_SETTINGS, type PitchTrack } from '../analysis/types';
import { decodeAudioFile } from '../audio/decode';
import { MicSession } from '../audio/mic';
import { ALL_84_RAAGS } from '../data/allRaags';
import { addRecord, newId } from '../lib/practiceHistory';
import { TakeReport } from './analysis/TakeReport';

export type AnalyzerMode = "tuner" | "scale" | "singing";

interface AnalyzerTabProps {
  baseTonicHz: number;
  onTonicChange?: (hz: number) => void;
  initialMode?: AnalyzerMode;
}

const RAAG_OPTIONS = [...ALL_84_RAAGS]
  .filter(r => r.allowedSwaras && r.allowedSwaras.length > 0)
  .map(r => ({ id: r.id, name: r.name.replace(/^Raag\s+/i, ""), allowedSwaras: r.allowedSwaras }))
  .sort((a, b) => a.name.localeCompare(b.name));

const SA_SECONDS = 6;
const MAX_RECORD_SECONDS = 10 * 60;
const silenceRms = Math.pow(10, DEFAULT_PITCH_SETTINGS.silenceDb / 20);

const card = "bg-[#151A2E] p-6 rounded-3xl border border-slate-800 shadow-xl";
const primaryBtn = "px-5 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#38BDF8] text-slate-950 font-mono text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50";
const stopBtn = "px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer";

/** Hook: one microphone session shared by the three modes. */
function useMic() {
  const ref = useRef<MicSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const open = async () => {
    setError(null);
    if (ref.current) return ref.current;
    try {
      ref.current = await MicSession.open();
      return ref.current;
    } catch (e: any) {
      setError(e?.name === "NotAllowedError"
        ? "Microphone permission was denied. Please allow microphone access in your browser and try again."
        : `Couldn't open the microphone: ${e?.message || e}`);
      return null;
    }
  };
  const close = async () => {
    const m = ref.current;
    ref.current = null;
    if (m) await m.close();
  };
  useEffect(() => () => { void close(); }, []);
  return { open, close, error, session: ref };
}

const LevelMeter: React.FC<{ level: number }> = ({ level }) => {
  // dBFS from -60 to 0 mapped to 0..100%
  const db = level > 0 ? 20 * Math.log10(level) : -100;
  const pct = Math.max(0, Math.min(100, ((db + 60) / 60) * 100));
  return (
    <div className="w-full max-w-md h-2 rounded-full bg-slate-900 overflow-hidden" title={`${db.toFixed(0)} dB`}>
      <div className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-[width] duration-75" style={{ width: `${pct}%` }} />
    </div>
  );
};

// ------------------------------------------------------------------ live tuner

const LiveTuner: React.FC<{ saHz: number }> = ({ saHz }) => {
  const mic = useMic();
  const [running, setRunning] = useState(false);
  const [level, setLevel] = useState(0);
  const [reading, setReading] = useState<{ hz: number; cents: number } | null>(null);
  const raf = useRef<number | null>(null);
  const recent = useRef<number[]>([]);

  const stop = async () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    await mic.close();
    setRunning(false);
    setReading(null);
    setLevel(0);
  };

  const start = async () => {
    const m = await mic.open();
    if (!m) return;
    setRunning(true);
    const detect = makeMpmDetector(DEFAULT_PITCH_SETTINGS.minHz, DEFAULT_PITCH_SETTINGS.maxHz);
    const size = windowSizeFor(m.sampleRate, DEFAULT_PITCH_SETTINGS.minHz);
    const loop = () => {
      const win = m.latest(size);
      const rms = rmsOf(win);
      setLevel(rms);
      let hz: number | null = null;
      if (rms >= silenceRms) {
        const r = detect(win, m.sampleRate);
        if (r.hz !== null && r.clarity >= VOICING.mpm.start) hz = r.hz;
      }
      if (hz === null) {
        recent.current = [];
        setReading(null);
      } else {
        // Show the median of the last 5 readings so the display is readable (~80 ms).
        recent.current = [...recent.current, hz].slice(-5);
        const sorted = [...recent.current].sort((a, b) => a - b);
        const med = sorted[sorted.length >> 1];
        setReading({ hz: med, cents: centsBetween(med, saHz) });
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  };

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  const step = reading ? Math.round(reading.cents / 100) : 0;
  const off = reading ? reading.cents - step * 100 : 0;
  const label = reading ? noteLabel(((step % 12) + 12) % 12, Math.floor(step / 12)) : "–";
  const colour = !reading ? "text-slate-600" : Math.abs(off) <= 10 ? "text-emerald-400" : Math.abs(off) <= 25 ? "text-amber-300" : "text-rose-400";

  return (
    <div className={`${card} space-y-5`}>
      <div className="flex flex-col items-center gap-3 py-4">
        <span className={`text-6xl font-black font-mono ${colour}`}>{label}</span>
        <span className="text-sm font-mono text-slate-400">
          {reading ? `${off > 0 ? "+" : ""}${off.toFixed(0)} cents · ${reading.hz.toFixed(1)} Hz` : running ? "Listening..." : "Not listening"}
        </span>
        <div className="relative w-full max-w-md h-6 rounded-full bg-slate-900 border border-slate-800">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#FBBF24]" />
          {reading && (
            <div
              className="absolute top-1 bottom-1 w-1.5 rounded-full bg-[#38BDF8]"
              style={{ left: `calc(${50 + Math.max(-50, Math.min(50, off))}% - 3px)` }}
            />
          )}
          <span className="absolute -bottom-5 left-0 text-[9px] font-mono text-slate-600">−50</span>
          <span className="absolute -bottom-5 right-0 text-[9px] font-mono text-slate-600">+50</span>
        </div>
        <div className="pt-4 w-full flex justify-center"><LevelMeter level={level} /></div>
      </div>
      <div className="flex justify-center">
        {!running
          ? <button type="button" className={primaryBtn} onClick={start}><Mic className="h-4 w-4" /> Start tuner</button>
          : <button type="button" className={stopBtn} onClick={stop}><Square className="h-4 w-4 fill-white" /> Stop</button>}
      </div>
      {mic.error && <p className="text-xs text-rose-300 text-center">{mic.error}</p>}
      <p className="text-[11px] text-slate-500 text-center">Measured against your Sa: {saHz.toFixed(1)} Hz ({westernNote(saHz).name}).</p>
    </div>
  );
};

// ------------------------------------------------------------------ find my Sa

const FindSa: React.FC<{ saHz: number; onTonicChange?: (hz: number) => void }> = ({ saHz, onTonicChange }) => {
  const mic = useMic();
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [result, setResult] = useState<HeldSaResult | null | "none">(null);
  const [applied, setApplied] = useState(false);
  const timer = useRef<number | null>(null);

  const finish = async () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    const m = mic.session.current;
    if (!m) return;
    const samples = m.stopRecording();
    const sr = m.sampleRate;
    await mic.close();
    setRecording(false);
    setLevel(0);
    const track = trackPitch(samples, sr, "mpm");
    const r = measureHeldSa(track);
    setResult(r ?? "none");
    if (r) addRecord({ kind: "sa-check", id: newId(), dateIso: new Date().toISOString(), saHz: r.saHz, heldSec: r.heldSec, wobbleCents: r.wobbleCents });
  };

  const start = async () => {
    setResult(null);
    setApplied(false);
    const m = await mic.open();
    if (!m) return;
    m.startRecording();
    setRecording(true);
    setElapsed(0);
    timer.current = window.setInterval(() => {
      setElapsed(m.recordedSeconds);
      setLevel(m.level());
      if (m.recordedSeconds >= SA_SECONDS) void finish();
    }, 100);
  };

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const r = result && result !== "none" ? result : null;
  const wn = r ? westernNote(r.saHz) : null;
  const diff = r ? centsBetween(r.saHz, saHz) : 0;

  return (
    <div className="space-y-5">
      <div className={`${card} space-y-5`}>
        <p className="text-sm text-slate-300 text-center max-w-lg mx-auto">
          Sing your comfortable Sa on "aa" and hold it steadily. Recording stops after {SA_SECONDS} seconds.
          Keep the tanpura off (or use earphones) so only your voice is measured.
        </p>
        <div className="flex flex-col items-center gap-3">
          {recording && (
            <>
              <span className="text-xs font-mono text-[#FBBF24]">Recording {elapsed.toFixed(1)} / {SA_SECONDS} s</span>
              <LevelMeter level={level} />
            </>
          )}
          {!recording
            ? <button type="button" className={primaryBtn} onClick={start}><Mic className="h-4 w-4" /> Record my Sa</button>
            : <button type="button" className={stopBtn} onClick={() => void finish()}><Square className="h-4 w-4 fill-white" /> Stop now</button>}
          {mic.error && <p className="text-xs text-rose-300">{mic.error}</p>}
        </div>
      </div>

      {result === "none" && (
        <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 text-sm">
          No steady note of at least 1 second was found. Try again, holding one note steadily on "aa".
        </div>
      )}

      {r && wn && (
        <div className={`${card} space-y-4`}>
          <h3 className="text-xs font-mono font-bold text-[#FBBF24] uppercase tracking-widest">Your measured Sa</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono">
            <div className="bg-[#0F1115]/60 p-4 rounded-xl border border-slate-800">
              <span className="text-[9px] text-slate-500 uppercase block font-bold">Sa</span>
              <span className="text-2xl font-black text-slate-100 block">{r.saHz.toFixed(1)} Hz</span>
              <span className="text-[10px] text-slate-400">{wn.name} {wn.cents >= 0 ? "+" : ""}{wn.cents.toFixed(0)} cents</span>
            </div>
            <div className="bg-[#0F1115]/60 p-4 rounded-xl border border-slate-800">
              <span className="text-[9px] text-slate-500 uppercase block font-bold">Held steadily for</span>
              <span className="text-2xl font-black text-slate-100 block">{r.heldSec.toFixed(1)} s</span>
            </div>
            <div className="bg-[#0F1115]/60 p-4 rounded-xl border border-slate-800">
              <span className="text-[9px] text-slate-500 uppercase block font-bold">Wobble</span>
              <span className="text-2xl font-black text-slate-100 block">±{r.wobbleCents.toFixed(1)} cents</span>
              <span className="text-[10px] text-slate-400">Median distance from the note's centre</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              Your current Sa is {saHz.toFixed(1)} Hz ({westernNote(saHz).name}); this is {Math.abs(diff).toFixed(0)} cents {diff >= 0 ? "higher" : "lower"}.
            </p>
            {onTonicChange && (
              <button
                type="button"
                disabled={applied}
                onClick={() => { onTonicChange(Number(r.saHz.toFixed(2))); setApplied(true); }}
                className="px-4 py-2 rounded-lg border border-[#7C3AED] text-purple-200 hover:bg-[#7C3AED] hover:text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-60"
              >
                {applied ? "Saved as your Sa" : "Use this as my Sa"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------ analyse singing

interface AnalysisResult {
  m: TakeMeasurements;
  track: PitchTrack;
  raagName: string;
  allowedSwaras: number[];
  saNotes: string[];
}

const AnalyseSinging: React.FC<{ saHz: number }> = ({ saHz }) => {
  const mic = useMic();
  const [raagId, setRaagId] = useState("yaman");
  const [saChoice, setSaChoice] = useState<"mine" | "detect">("mine");
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const timer = useRef<number | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const raag = useMemo(() => RAAG_OPTIONS.find(r => r.id === raagId) ?? RAAG_OPTIONS[0], [raagId]);

  const analyse = (samples: Float32Array, sampleRate: number, source: string) => {
    setBusy("Measuring pitch...");
    setError(null);
    // Let the "Measuring" message render before the (synchronous) analysis runs.
    window.setTimeout(() => {
      try {
        const track = trackPitch(samples, sampleRate, "mpm");
        const notes: string[] = [];
        const allowed = raag.allowedSwaras;
        let m = summariseTake(track, saChoice === "mine" ? { saHz, expectedSaHz: saHz, allowedSwaras: allowed } : { expectedSaHz: saHz, allowedSwaras: allowed });
        const det = m.saDetection;

        if (saChoice === "detect") {
          if (!det || det.saHz === null || det.unsure) {
            notes.push(`Couldn't detect Sa confidently from this recording${det && det.saHz ? ` (best guess ${det.saHz.toFixed(1)} Hz, confidence ${(det.confidence * 100).toFixed(0)}%)` : ""}. Measured against your Sa (${saHz.toFixed(1)} Hz) instead.`);
            m = summariseTake(track, { saHz, expectedSaHz: saHz, allowedSwaras: allowed });
          } else {
            notes.push(`Sa detected from the recording: ${det.saHz.toFixed(1)} Hz (confidence ${(det.confidence * 100).toFixed(0)}%, based on ${det.steadySec.toFixed(0)} s of steady singing).`);
          }
        } else if (det && det.saHz !== null && !det.unsure && Math.abs(centsBetween(det.saHz, saHz)) > 50) {
          notes.push(`This recording seems to use a different Sa (about ${det.saHz.toFixed(1)} Hz) from yours (${saHz.toFixed(1)} Hz). If so, choose "Detect from recording" and analyse again.`);
        }
        if (m.voicedSec < 2) notes.push("Very little clear singing was found in this recording, so these numbers are based on very little data.");

        setResult({ m, track, raagName: raag.name, allowedSwaras: allowed, saNotes: notes });
        addRecord({
          kind: "analysis",
          id: newId(),
          dateIso: new Date().toISOString(),
          raagId: raag.id,
          raagName: raag.name,
          durationSec: m.durationSec,
          singingSec: m.voicedSec,
          saHz: m.saHz,
          heldWithin20CentsPct: m.heldWithin20CentsPct,
          medianAbsDeviationCents: m.medianAbsDeviationCents,
          lowest: m.lowestNote,
          highest: m.highestNote,
          swaras: m.swaras.map(s => ({
            symbol: s.symbol,
            medianDeviationCents: s.medianDeviationCents,
            medianWobbleCents: s.medianWobbleCents,
            totalHeldSec: s.totalHeldSec,
          })),
        });
        void source;
      } catch (e: any) {
        setError(`Analysis failed: ${e?.message || e}`);
      } finally {
        setBusy(null);
      }
    }, 30);
  };

  const stopRecording = async () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    const m = mic.session.current;
    if (!m) return;
    const samples = m.stopRecording();
    const sr = m.sampleRate;
    await mic.close();
    setRecording(false);
    setLevel(0);
    analyse(samples, sr, "microphone");
  };

  const startRecording = async () => {
    setResult(null);
    const m = await mic.open();
    if (!m) return;
    m.startRecording();
    setRecording(true);
    setElapsed(0);
    timer.current = window.setInterval(() => {
      setElapsed(m.recordedSeconds);
      setLevel(m.level());
      if (m.recordedSeconds >= MAX_RECORD_SECONDS) void stopRecording();
    }, 100);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setResult(null);
    setError(null);
    setBusy(`Reading ${file.name}...`);
    try {
      const { samples, sampleRate } = await decodeAudioFile(file);
      analyse(samples, sampleRate, file.name);
    } catch (err: any) {
      setBusy(null);
      setError(err?.message?.startsWith("Recording is") ? err.message : "Couldn't read this audio file. Try WAV, MP3, M4A or WebM.");
    }
  };

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  return (
    <div className="space-y-5">
      <div className={`${card} space-y-5`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1 block">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block">Raag</span>
            <select
              value={raagId}
              onChange={e => setRaagId(e.target.value)}
              disabled={recording || !!busy}
              className="w-full bg-[#0F1115] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200"
            >
              {RAAG_OPTIONS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block">Measure against</span>
            <div className="flex gap-2 text-xs font-mono">
              {([["mine", `My Sa (${saHz.toFixed(1)} Hz)`], ["detect", "Detect from recording"]] as const).map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  disabled={recording || !!busy}
                  onClick={() => setSaChoice(v)}
                  className={`px-3 py-2 rounded-lg border cursor-pointer ${saChoice === v ? "bg-[#7C3AED] border-[#7C3AED] text-white" : "border-slate-800 text-slate-400 hover:text-slate-200"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          {recording && (
            <>
              <span className="text-xs font-mono text-[#FBBF24]">Recording {Math.floor(elapsed / 60)}:{String(Math.floor(elapsed % 60)).padStart(2, "0")}</span>
              <LevelMeter level={level} />
            </>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            {!recording
              ? <button type="button" className={primaryBtn} onClick={startRecording} disabled={!!busy}><Mic className="h-4 w-4" /> Record</button>
              : <button type="button" className={stopBtn} onClick={() => void stopRecording()}><Square className="h-4 w-4 fill-white" /> Stop & analyse</button>}
            {!recording && (
              <button
                type="button"
                disabled={!!busy}
                onClick={() => fileInput.current?.click()}
                className="px-5 py-3 rounded-xl border border-slate-700 text-slate-200 hover:bg-slate-800 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Upload className="h-4 w-4" /> Upload recording
              </button>
            )}
            <input ref={fileInput} type="file" accept="audio/*,.wav,.mp3,.m4a,.webm,.ogg" className="hidden" onChange={onFile} data-testid="audio-upload" />
          </div>
          {busy && <p className="text-xs font-mono text-[#38BDF8]">{busy}</p>}
          {(error || mic.error) && <p className="text-xs text-rose-300">{error || mic.error}</p>}
        </div>
      </div>

      {result && <TakeReport m={result.m} track={result.track} raagName={result.raagName} allowedSwaras={result.allowedSwaras} saNotes={result.saNotes} />}
    </div>
  );
};

// ------------------------------------------------------------------ tab

export const AnalyzerTab: React.FC<AnalyzerTabProps> = ({ baseTonicHz, onTonicChange, initialMode = "singing" }) => {
  const [mode, setMode] = useState<AnalyzerMode>(initialMode);
  useEffect(() => setMode(initialMode), [initialMode]);

  const modes: [AnalyzerMode, string][] = [["tuner", "Live tuner"], ["scale", "Find my Sa"], ["singing", "Analyse singing"]];

  return (
    <div className="space-y-6">
      <div className={`${card} flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#FBBF24]" />
            Analyzer
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Everything shown here is measured from your voice. Recordings are analysed in your browser and are not uploaded.
          </p>
        </div>
        <div className="flex font-mono text-[10px] p-1 bg-[#0F1115] border border-slate-800 rounded-xl shrink-0">
          {modes.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all cursor-pointer ${mode === id ? "bg-[#7C3AED] text-white" : "text-slate-400 hover:text-slate-200"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-400 px-1">
        <Headphones className="h-4 w-4 text-[#38BDF8]" />
        Use earphones if the tanpura is playing, so it doesn't reach the microphone.
      </div>

      {mode === "tuner" && <LiveTuner saHz={baseTonicHz} />}
      {mode === "scale" && <FindSa saHz={baseTonicHz} onTonicChange={onTonicChange} />}
      {mode === "singing" && <AnalyseSinging saHz={baseTonicHz} />}
    </div>
  );
};
