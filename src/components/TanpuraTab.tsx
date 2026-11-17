/**
 * Tanpura & Taal: the app plays the drone and the theka itself, so it
 * always knows the exact Sa and beat timing.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Music, Play, Square, Drum } from 'lucide-react';
import { centsBetween, hzFromCents, signedCents, westernNote } from '../analysis/music';
import { TanpuraEngine, STRING_ORDER, stringHz, type FirstString, type StringId } from '../audio/tanpura';
import { TaalPlayer } from '../audio/tabla';
import { clapAt, layaFor, TAALS } from '../data/taals';

interface TanpuraTabProps {
  baseTonicHz: number;
  onTonicChange?: (hz: number) => void;
  selectedTuning?: FirstString;
  onTuningChange?: (t: FirstString) => void;
}

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
/** Equal-tempered frequency of a note name in octave 2 or 3. */
const noteHz = (i: number, octave: number) => 440 * Math.pow(2, (i - 9 + 12 * (octave - 4)) / 12);

const STRING_LABEL: Record<StringId, string> = { first: "1st", sa1: "Sa", sa2: "Sa", kharaj: "Kharaj" };

/** One AudioContext shared by the tanpura and the tabla on this page. */
function useAudioContext() {
  const ref = useRef<AudioContext | null>(null);
  const get = () => {
    if (!ref.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      ref.current = new Ctx();
    }
    return ref.current;
  };
  useEffect(() => () => { void ref.current?.close(); }, []);
  return get;
}

export const TanpuraTab: React.FC<TanpuraTabProps> = ({ baseTonicHz, onTonicChange, selectedTuning = "Pa", onTuningChange }) => {
  const getCtx = useAudioContext();

  // ---------------- tanpura state
  const [first, setFirst] = useState<FirstString>(selectedTuning);
  const [cycleSec, setCycleSec] = useState(4.5);
  const [tVolume, setTVolume] = useState(0.7);
  const [tPlaying, setTPlaying] = useState(false);
  const [lit, setLit] = useState<StringId | null>(null);
  const [tSource, setTSource] = useState<string>("");
  const [droneMode, setDroneMode] = useState(false);
  const tanpura = useRef<TanpuraEngine | null>(null);

  // Sa: nearest equal-tempered note + fine tuning in cents
  const nearest = useMemo(() => {
    const midi = Math.round(69 + 12 * Math.log2(baseTonicHz / 440));
    const note = ((midi % 12) + 12) % 12;
    const octave = Math.floor(midi / 12) - 1;
    return { note, octave, cents: centsBetween(baseTonicHz, noteHz(note, octave)) };
  }, [baseTonicHz]);
  const [octave, setOctave] = useState<2 | 3>(nearest.octave <= 2 ? 2 : 3);

  const tanpuraLoading = useRef<Promise<TanpuraEngine> | null>(null);
  const ensureTanpura = async (): Promise<TanpuraEngine> => {
    if (tanpura.current) return tanpura.current;
    if (tanpuraLoading.current) return tanpuraLoading.current;
    tanpuraLoading.current = (async () => {
      const ctx = getCtx();
      const eng = new TanpuraEngine(ctx, ctx.destination, { saHz: baseTonicHz, firstString: first, cycleSec, volume: tVolume });
      eng.onPluck = s => { setLit(s); window.setTimeout(() => setLit(cur => (cur === s ? null : cur)), 350); };
      await eng.loadSamples();
      tanpura.current = eng;
      setTSource(eng.describeSource());
      setDroneMode(eng.usesRecordedDrone());
      return eng;
    })();
    return tanpuraLoading.current;
  };

  useEffect(() => {
    const eng = tanpura.current;
    if (!eng) return;
    eng.setOptions({ saHz: baseTonicHz, firstString: first, cycleSec, volume: tVolume });
    setTSource(eng.describeSource());
    setDroneMode(eng.usesRecordedDrone());
  }, [baseTonicHz, first, cycleSec, tVolume]);

  // Load the sounds once when the tab opens, so the source line is accurate before playing
  useEffect(() => { void ensureTanpura(); }, []);
  useEffect(() => () => { tanpura.current?.disconnect(); }, []);

  const toggleTanpura = async () => {
    const eng = await ensureTanpura();
    if (eng.playing) { eng.stop(); setTPlaying(false); }
    else { eng.start(); setTPlaying(true); }
  };

  const setSa = (noteIdx: number, oct: number, cents: number) => {
    onTonicChange?.(Number(hzFromCents(noteHz(noteIdx, oct), cents).toFixed(2)));
  };

  // ---------------- taal state
  const [taalId, setTaalId] = useState("teentaal");
  const [bpm, setBpm] = useState(80);
  const [bVolume, setBVolume] = useState(0.7);
  const [bPlaying, setBPlaying] = useState(false);
  const [matra, setMatra] = useState<number | null>(null);
  const [bSource, setBSource] = useState("");
  const player = useRef<TaalPlayer | null>(null);
  const taal = TAALS.find(t => t.id === taalId)!;

  const playerLoading = useRef<Promise<TaalPlayer> | null>(null);
  const ensurePlayer = async (): Promise<TaalPlayer> => {
    if (player.current) return player.current;
    if (playerLoading.current) return playerLoading.current;
    playerLoading.current = (async () => {
      const ctx = getCtx();
      const p = new TaalPlayer(ctx, ctx.destination, { taal, bpm, saHz: baseTonicHz, volume: bVolume });
      p.onMatra = m => setMatra(m);
      await p.loadSamples();
      setBSource(p.source === "samples"
        ? `Real tabla recordings, retuned so the dayan sits on your Sa${p.sourceCredit ? ` (${p.sourceCredit})` : ""}`
        : "Synthesised tabla (placeholder: real recordings couldn't be loaded)");
      player.current = p;
      return p;
    })();
    return playerLoading.current;
  };

  useEffect(() => { player.current?.setOptions({ taal, bpm }); }, [taalId, bpm]);
  useEffect(() => { player.current?.setOptions({ volume: bVolume, saHz: baseTonicHz }); }, [bVolume, baseTonicHz]);
  useEffect(() => () => { player.current?.disconnect(); }, []);
  useEffect(() => { void ensurePlayer(); }, []);

  const toggleTaal = async () => {
    const p = await ensurePlayer();
    if (p.playing) { p.stop(); setBPlaying(false); setMatra(null); }
    else { p.start(); setBPlaying(true); }
  };

  const sa = westernNote(baseTonicHz);
  const card = "bg-[#1A2150] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5";
  const label = "text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block";

  return (
    <div className="space-y-6">
      {/* ---------------- Tanpura */}
      <div className={card}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#E0A458]/20 border border-[#E0A458] flex items-center justify-center text-[#F4C56A]"><Music className="h-5 w-5" /></div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Tanpura</h3>
              <p className="text-xs text-slate-400">Sa {baseTonicHz.toFixed(2)} Hz · {sa.name} {signedCents(sa.cents)} cents</p>
            </div>
          </div>
          <button type="button" onClick={toggleTanpura}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase flex items-center gap-2 cursor-pointer ${tPlaying ? "bg-rose-600 text-white" : "bg-[#F4C56A] text-slate-950"}`}>
            {tPlaying ? <><Square className="h-4 w-4 fill-white" /> Stop</> : <><Play className="h-4 w-4" /> Play tanpura</>}
          </button>
        </div>

        {/* strings */}
        <div className="grid grid-cols-4 gap-3">
          {STRING_ORDER.map(s => {
            const hz = stringHz(s, baseTonicHz, first);
            const name = s === "first" ? `${first},` : s === "kharaj" ? "S,," : "S";
            return (
              <button key={s} type="button" disabled={droneMode} onClick={async () => (await ensureTanpura()).pluckNow(s)}
                className={`p-3 rounded-xl border text-center cursor-pointer transition-colors ${lit === s ? "border-[#F4C56A] bg-[#F4C56A]/10" : "border-slate-800 bg-[#0D1230]/60 hover:border-slate-600"}`}>
                <span className="block text-[9px] font-mono text-slate-500 uppercase">{STRING_LABEL[s]} string</span>
                <span className="block text-lg font-black font-mono text-slate-100">{name}</span>
                <span className="block text-[10px] font-mono text-slate-400">{hz.toFixed(1)} Hz</span>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-slate-500 -mt-2">
          {droneMode
            ? "Playing a real tanpura recording, so strings can't be plucked one at a time and the cycle speed is the player's own."
            : "Tap a string to pluck it. Strings are tuned by just intonation, like a real tanpura."}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-2">
            <span className={label}>Sa</span>
            <div className="grid grid-cols-6 gap-1.5">
              {NOTES.map((n, i) => (
                <button key={n} type="button" onClick={() => setSa(i, octave, 0)}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer border ${nearest.note === i && nearest.octave === octave ? "bg-[#E0A458] border-[#E0A458] text-white" : "border-slate-800 text-slate-300 hover:border-slate-600"}`}>
                  {n}{octave}
                </button>
              ))}
            </div>
            <div className="flex gap-2 text-[10px] font-mono">
              {([2, 3] as const).map(o => (
                <button key={o} type="button" onClick={() => { setOctave(o); setSa(nearest.note, o, nearest.cents); }}
                  className={`px-2.5 py-1 rounded-md border cursor-pointer ${octave === o ? "border-[#9FB3E6] text-[#9FB3E6]" : "border-slate-800 text-slate-400"}`}>
                  Octave {o}
                </button>
              ))}
            </div>
            <label className="block space-y-1 pt-1">
              <span className={label}>Fine tune: {signedCents(nearest.cents)} cents</span>
              <input type="range" min={-50} max={50} step={1} value={Math.round(nearest.cents)}
                onChange={e => setSa(nearest.note, nearest.octave, Number(e.target.value))} className="w-full accent-[#E0A458]" />
            </label>
            <p className="text-[10px] text-slate-500">Tip: "Find my Sa" in the Analyzer measures your natural Sa and sets it exactly.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <span className={label}>First string</span>
              <div className="flex gap-2">
                {(["Pa", "Ma", "Ni"] as FirstString[]).map(f => (
                  <button key={f} type="button" onClick={() => { setFirst(f); onTuningChange?.(f); }}
                    className={`px-3 py-2 rounded-lg border text-xs font-mono font-bold cursor-pointer ${first === f ? "bg-[#E0A458] border-[#E0A458] text-white" : "border-slate-800 text-slate-300"}`}>
                    {f}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">Pa for most raags, Ma for raags without Pa (e.g. Malkauns), Ni for raags like Marwa.</p>
            </div>
            {!droneMode && (
              <label className="block space-y-1">
                <span className={label}>Cycle: {cycleSec.toFixed(1)} s per four plucks</span>
                <input type="range" min={3} max={8} step={0.1} value={cycleSec} onChange={e => setCycleSec(Number(e.target.value))} className="w-full accent-[#E0A458]" />
              </label>
            )}
            <label className="block space-y-1">
              <span className={label}>Volume</span>
              <input type="range" min={0} max={1} step={0.01} value={tVolume} onChange={e => setTVolume(Number(e.target.value))} className="w-full accent-[#E0A458]" />
            </label>
          </div>
        </div>
        {tSource && <p className="text-[10px] font-mono text-amber-300/80">Sound: {tSource}</p>}
      </div>

      {/* ---------------- Taal */}
      <div className={card}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#9FB3E6]/15 border border-[#9FB3E6]/60 flex items-center justify-center text-[#9FB3E6]"><Drum className="h-5 w-5" /></div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Taal</h3>
              <p className="text-xs text-slate-400">{taal.name} · {taal.matras} matras · {bpm} matras per minute ({layaFor(bpm)})</p>
            </div>
          </div>
          <button type="button" onClick={toggleTaal}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase flex items-center gap-2 cursor-pointer ${bPlaying ? "bg-rose-600 text-white" : "bg-[#F4C56A] text-slate-950"}`}>
            {bPlaying ? <><Square className="h-4 w-4 fill-white" /> Stop</> : <><Play className="h-4 w-4" /> Play theka</>}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <label className="block space-y-1">
            <span className={label}>Taal</span>
            <select value={taalId} onChange={e => setTaalId(e.target.value)} className="w-full bg-[#0D1230] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200">
              {TAALS.map(t => <option key={t.id} value={t.id}>{t.name} ({t.matras})</option>)}
            </select>
            <span className="text-[10px] text-slate-500 block">{taal.usage}</span>
          </label>
          <label className="block space-y-1">
            <span className={label}>Tempo: {bpm} matras/min</span>
            <input type="range" min={20} max={320} step={1} value={bpm} onChange={e => setBpm(Number(e.target.value))} className="w-full accent-[#9FB3E6]" />
          </label>
          <label className="block space-y-1">
            <span className={label}>Volume</span>
            <input type="range" min={0} max={1} step={0.01} value={bVolume} onChange={e => setBVolume(Number(e.target.value))} className="w-full accent-[#9FB3E6]" />
          </label>
        </div>

        {/* theka grid */}
        <div className="flex flex-wrap gap-3">
          {(() => {
            let n = 0;
            return taal.vibhags.map((len, vi) => {
              const cells = Array.from({ length: len }, () => ++n);
              return (
                <div key={vi} className="flex gap-1 border-l-2 border-slate-700 pl-2">
                  {cells.map(i => {
                    const clap = clapAt(taal, i);
                    return (
                      <div key={i} className={`w-16 p-1.5 rounded-lg text-center border ${matra === i ? "border-[#F4C56A] bg-[#F4C56A]/10" : "border-slate-800 bg-[#0D1230]/60"}`}>
                        <span className="block text-[9px] font-mono text-slate-500">{i}{clap !== null ? ` · ${clap}` : ""}</span>
                        <span className="block text-[11px] font-mono font-bold text-slate-200 leading-tight">{taal.theka[i - 1].join(" ")}</span>
                      </div>
                    );
                  })}
                </div>
              );
            });
          })()}
        </div>
        <p className="text-[10px] text-slate-500">X = sam, 0 = khali, numbers = taali. Thekas are the standard school forms; your guru may teach some bols differently. Taals here are for practice only: the app doesn't score rhythm.</p>
        {bSource && <p className="text-[10px] font-mono text-amber-300/80">Sound: {bSource}</p>}
      </div>
    </div>
  );
};
