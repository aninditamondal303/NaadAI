/**
 * Tanpura & taal: one Sa (the scale) for both instruments, chosen on a
 * harmonium-style keyboard; the tanpura's strings drawn moving with its
 * sound; and the taal as a circle (one avartan) with its bols, the current
 * matra lit by the player's own clock. Thekas can be edited, since gharanas
 * differ, and are saved in this browser.
 */
import { BackgroundAudio } from '../audio/background';
import { closeContext } from '../audio/closeContext';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { centsBetween, hzFromCents, signedCents, westernNote } from '../analysis/music';
import { TanpuraEngine, STRING_ORDER, stringHz, type FirstString } from '../audio/tanpura';
import { sampleFor, TaalPlayer } from '../audio/tabla';
import { clapAt, layaFor, TAALS, type Taal } from '../data/taals';
import { TanpuraStrings } from './home/TanpuraStrings';
import { useLang } from '../i18n/lang';

interface TanpuraTabProps {
  baseTonicHz: number;
  onTonicChange?: (hz: number) => void;
  selectedTuning?: FirstString;
  onTuningChange?: (t: FirstString) => void;
}

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const noteHz = (i: number, octave: number) => 440 * Math.pow(2, (i - 9 + 12 * (octave - 4)) / 12);
const THEKA_KEY = (id: string) => `naad.theka.${id}`;

/** The tabla's dayan can be tuned to Sa, Pa or Ma of the singer's scale. */
const TABLA_TUNE = { Sa: 1, Pa: 1.5, Ma: 4 / 3 } as const;
type TablaTune = keyof typeof TABLA_TUNE;

function loadTheka(taal: Taal): string[][] {
  try {
    const raw = localStorage.getItem(THEKA_KEY(taal.id));
    if (raw) {
      const t = JSON.parse(raw) as string[][];
      if (Array.isArray(t) && t.length === taal.matras) return t;
    }
  } catch { /* ignore */ }
  return taal.theka;
}

/** Parse one matra's bols ("Dha Ge" or "Dha.Ge"); returns the unknown ones. */
function parseMatra(text: string): { bols: string[]; unknown: string[] } {
  const bols = text.trim().split(/[\s.]+/).filter(Boolean);
  const unknown = bols.filter(b => { try { sampleFor(b); return false; } catch { return true; } });
  return { bols: bols.length ? bols : ["-"], unknown };
}

function useAudioContext() {
  const ref = useRef<{ ctx: AudioContext; bus: GainNode; analyser: AnalyserNode; bg: BackgroundAudio } | null>(null);
  const get = () => {
    if (!ref.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new Ctx();
      const bus = ctx.createGain();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      bus.connect(analyser);
      const bg = new BackgroundAudio(ctx, analyser);
      ref.current = { ctx, bus, analyser, bg };
    }
    return ref.current;
  };
  useEffect(() => () => { ref.current?.bg.dispose(); closeContext(ref.current?.ctx); }, []);
  return get;
}

// ------------------------------------------------------------ keyboard

const SaKeyboard: React.FC<{ selected: number; onPick: (i: number) => void; label: string }> = ({ selected, onPick, label }) => {
  const whites = [0, 2, 4, 5, 7, 9, 11];
  const blacks: [number, number][] = [[1, 0], [3, 1], [6, 3], [8, 4], [10, 5]]; // [note, after white index]
  return (
    <div className="tp-keys" role="radiogroup" aria-label={label}>
      {whites.map(n => (
        <button key={n} type="button" role="radio" aria-checked={selected === n} className="tp-white" onClick={() => onPick(n)}>
          <span>{NOTES[n]}</span>
        </button>
      ))}
      {blacks.map(([n, after]) => (
        <button key={n} type="button" role="radio" aria-checked={selected === n} className="tp-black"
          style={{ left: `calc(${((after + 1) / 7) * 100}% - 1.15rem)` }} onClick={() => onPick(n)}>
          <span>{NOTES[n]}</span>
        </button>
      ))}
    </div>
  );
};

// ------------------------------------------------------------ taal circle

const TaalCircle: React.FC<{ taal: Taal; theka: string[][]; matra: number | null; labels: { sam: string; khali: string; taali: string }; name: string }> = ({ taal, theka, matra, labels, name }) => {
  const n = taal.matras;
  const R = 150, cx = 200, cy = 200;
  const at = (i: number, r: number) => {
    const a = -Math.PI / 2 + (2 * Math.PI * (i - 1)) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  };
  // vibhag starts
  const starts: number[] = [];
  let s = 1;
  for (const v of taal.vibhags) { starts.push(s); s += v; }
  const clap = matra ? clapAt(taal, matra) : null;
  const state = matra === null ? "" : matra === 1 ? labels.sam : clap === "0" ? labels.khali : clap !== null ? labels.taali : "";
  const hand = matra ? at(matra, R - 22) : null;

  return (
    <svg viewBox="0 0 400 400" className="tp-circle" role="img" aria-label={`${name}: ${n}`}>
      <circle cx={cx} cy={cy} r={R} className="tp-ring" />
      {starts.map(st => {
        const [x1, y1] = at(st - 0.5, R - 14);
        const [x2, y2] = at(st - 0.5, R + 14);
        return <line key={st} x1={x1} y1={y1} x2={x2} y2={y2} className="tp-vibhag" />;
      })}
      {hand && <line x1={cx} y1={cy} x2={hand[0]} y2={hand[1]} className="tp-hand" />}
      {Array.from({ length: n }, (_, k) => {
        const i = k + 1;
        const c = clapAt(taal, i);
        const [x, y] = at(i, R);
        const [bx, by] = at(i, R + 34);
        const on = matra === i;
        return (
          <g key={i} className={on ? "tp-on" : undefined}>
            {c === "0"
              ? <circle cx={x} cy={y} r={on ? 11 : 8} className="tp-khali" />
              : <circle cx={x} cy={y} r={c === "X" ? (on ? 13 : 10) : on ? 9 : c !== null ? 7 : 4.5} className={c === "X" ? "tp-sam" : "tp-dot"} />}
            {c !== null && <text x={x} y={y + 4} className="tp-mark">{c === "X" ? "X" : c === "0" ? "" : c}</text>}
            <text x={bx} y={by + 4} className="tp-bol">{theka[k].join(" ")}</text>
          </g>
        );
      })}
      <text x={cx} y={cy - 6} className="tp-center-n">{matra ?? n}</text>
      <text x={cx} y={cy + 24} className="tp-center-l">{state || name}</text>
    </svg>
  );
};

// ------------------------------------------------------------ tab

export const TanpuraTab: React.FC<TanpuraTabProps> = ({ baseTonicHz, onTonicChange, selectedTuning = "Pa", onTuningChange }) => {
  const { t } = useLang();
  const T = t.tp;
  const getAudio = useAudioContext();

  // ---- Sa (scale), shared by tanpura and tabla
  const nearest = useMemo(() => {
    const midi = Math.round(69 + 12 * Math.log2(baseTonicHz / 440));
    const note = ((midi % 12) + 12) % 12;
    const octave = Math.floor(midi / 12) - 1;
    return { note, octave, cents: centsBetween(baseTonicHz, noteHz(note, octave)) };
  }, [baseTonicHz]);
  const [octave, setOctave] = useState<2 | 3>(nearest.octave <= 2 ? 2 : 3);
  const setSa = (noteIdx: number, oct: number, cents: number) => onTonicChange?.(Number(hzFromCents(noteHz(noteIdx, oct), cents).toFixed(2)));
  const sa = westernNote(baseTonicHz);

  // ---- tanpura
  const [first, setFirst] = useState<FirstString>(selectedTuning);
  const [cycleSec, setCycleSec] = useState(4.5);
  const [tVolume, setTVolume] = useState(0.7);
  const [tPlaying, setTPlaying] = useState(false);
  const [droneMode, setDroneMode] = useState(false);
  const [tSource, setTSource] = useState("");
  const [pluck, setPluck] = useState<[number, number] | null>(null);
  const pluckN = useRef(0);
  const tanpura = useRef<TanpuraEngine | null>(null);
  const tLoading = useRef<Promise<TanpuraEngine> | null>(null);

  const ensureTanpura = async () => {
    if (tanpura.current) return tanpura.current;
    if (tLoading.current) return tLoading.current;
    tLoading.current = (async () => {
      const { ctx, bus } = getAudio();
      const eng = new TanpuraEngine(ctx, bus, { saHz: baseTonicHz, firstString: first, cycleSec, volume: tVolume });
      eng.onPluck = s => setPluck([STRING_ORDER.indexOf(s), ++pluckN.current]);
      await eng.loadSamples();
      tanpura.current = eng;
      setTSource(eng.describeSource());
      setDroneMode(eng.usesRecordedDrone());
      return eng;
    })();
    return tLoading.current;
  };
  useEffect(() => { void ensureTanpura(); }, []);
  useEffect(() => () => { tanpura.current?.disconnect(); }, []);
  useEffect(() => {
    const eng = tanpura.current;
    if (!eng) return;
    eng.setOptions({ saHz: baseTonicHz, firstString: first, cycleSec, volume: tVolume });
    setTSource(eng.describeSource());
    setDroneMode(eng.usesRecordedDrone());
  }, [baseTonicHz, first, cycleSec, tVolume]);

  // Lock-screen controls and background playback while anything sounds
  const syncBackground = () => {
    const bg = getAudio().bg;
    const anyPlaying = !!tanpura.current?.playing || !!player.current?.playing;
    if (anyPlaying) {
      const parts = [tanpura.current?.playing ? `Tanpura, Sa ${westernNote(baseTonicHz).name}` : "", player.current?.playing ? baseTaal.name : ""].filter(Boolean);
      bg.activate({
        title: parts.join(" and "),
        onPause: () => { tanpura.current?.stop(); player.current?.stop(); setTPlaying(false); setBPlaying(false); setMatra(null); bg.deactivate(); },
        onPlay: () => { tanpura.current?.start(); setTPlaying(true); syncBackground(); },
      });
    } else bg.deactivate();
  };
  const toggleTanpura = async () => {
    const eng = await ensureTanpura();
    if (eng.playing) { eng.stop(); setTPlaying(false); } else { eng.start(); setTPlaying(true); }
    syncBackground();
  };
  const pluckString = async (i: number) => {
    if (droneMode) return;
    (await ensureTanpura()).pluckNow(STRING_ORDER[i]);
  };

  // ---- taal
  const [taalId, setTaalId] = useState("teentaal");
  const baseTaal = TAALS.find(x => x.id === taalId)!;
  const [theka, setTheka] = useState<string[][]>(() => loadTheka(baseTaal));
  useEffect(() => setTheka(loadTheka(baseTaal)), [taalId]);
  const taal: Taal = useMemo(() => ({ ...baseTaal, theka }), [baseTaal, theka]);
  const custom = JSON.stringify(theka) !== JSON.stringify(baseTaal.theka);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const [bpm, setBpm] = useState(80);
  const [bVolume, setBVolume] = useState(0.7);
  const [tablaTune, setTablaTune] = useState<TablaTune>("Sa");
  const [bPlaying, setBPlaying] = useState(false);
  const [matra, setMatra] = useState<number | null>(null);
  const [bSource, setBSource] = useState("");
  const player = useRef<TaalPlayer | null>(null);
  const pLoading = useRef<Promise<TaalPlayer> | null>(null);
  const tablaHz = baseTonicHz * TABLA_TUNE[tablaTune];

  const ensurePlayer = async () => {
    if (player.current) return player.current;
    if (pLoading.current) return pLoading.current;
    pLoading.current = (async () => {
      const { ctx, bus } = getAudio();
      const p = new TaalPlayer(ctx, bus, { taal, bpm, saHz: tablaHz, volume: bVolume });
      p.onMatra = m => setMatra(m);
      await p.loadSamples();
      setBSource(p.source === "samples"
        ? `Recorded tabla, retuned so the dayan sits on your ${tablaTune}${p.sourceCredit ? ` (${p.sourceCredit})` : ""}`
        : "Synthesised tabla (the recordings couldn't be loaded)");
      player.current = p;
      return p;
    })();
    return pLoading.current;
  };
  useEffect(() => { void ensurePlayer(); }, []);
  useEffect(() => () => { player.current?.disconnect(); }, []);
  useEffect(() => { player.current?.setOptions({ taal, bpm }); }, [taal, bpm]);
  useEffect(() => { player.current?.setOptions({ volume: bVolume, saHz: tablaHz }); }, [bVolume, tablaHz]);
  useEffect(() => {
    if (player.current?.source === "samples") setBSource(cur => cur.replace(/your (Sa|Pa|Ma)/, `your ${tablaTune}`));
  }, [tablaTune]);

  const toggleTaal = async () => {
    const p = await ensurePlayer();
    if (p.playing) { p.stop(); setBPlaying(false); setMatra(null); } else { p.start(); setBPlaying(true); }
    syncBackground();
  };

  const startEdit = () => { setDraft(theka.map(m => m.join(" "))); setEditing(true); };
  const parsed = draft.map(parseMatra);
  const draftOk = parsed.every(p => p.unknown.length === 0);
  const saveEdit = () => {
    if (!draftOk) return;
    const next = parsed.map(p => p.bols);
    setTheka(next);
    try { localStorage.setItem(THEKA_KEY(taalId), JSON.stringify(next)); } catch { /* ignore */ }
    setEditing(false);
  };
  const resetTheka = () => {
    setTheka(baseTaal.theka);
    try { localStorage.removeItem(THEKA_KEY(taalId)); } catch { /* ignore */ }
    setEditing(false);
  };

  const { analyser } = tPlaying || bPlaying ? getAudio() : { analyser: null };
  const stringLabels = [first === "Pa" ? "प़" : first === "Ma" ? "म़" : "ऩि", "सा", "सा", "सा़"];

  return (
    <div className="tp">
      {/* ---------------- Sa, shared */}
      <section className="tp-sa" aria-labelledby="tp-sa-h">
        <div className="tp-sa-read">
          <h1 id="tp-sa-h" className="tp-h1">{T.sa} <span className="tp-sa-note">{sa.name}</span></h1>
          <p className="tp-muted">{baseTonicHz.toFixed(2)} Hz, {signedCents(sa.cents)} cents</p>
          <p className="tp-muted tp-small">{T.findSaTip}</p>
        </div>
        <div className="tp-sa-set">
          <SaKeyboard selected={nearest.note} label={T.keyboard} onPick={i => setSa(i, octave, 0)} />
          <div className="tp-row">
            <div className="tp-choices" role="radiogroup" aria-label="Octave">
              {([2, 3] as const).map(o => (
                <button key={o} type="button" role="radio" aria-checked={octave === o}
                  onClick={() => { setOctave(o); setSa(nearest.note, o, nearest.cents); }}>{T.octave(o)}</button>
              ))}
            </div>
            <label className="tp-range">
              <span>{T.fine(signedCents(nearest.cents))}</span>
              <input type="range" min={-50} max={50} step={1} value={Math.round(nearest.cents)} onChange={e => setSa(nearest.note, nearest.octave, Number(e.target.value))} />
            </label>
          </div>
        </div>
      </section>

      {/* ---------------- Tanpura */}
      <section className="tp-inst" aria-labelledby="tp-t-h">
        <div className="tp-inst-ctl">
          <div className="tp-head">
            <h2 id="tp-t-h" className="tp-h2">{T.title}</h2>
            <button type="button" className={tPlaying ? "tp-btn tp-btn-stop" : "tp-btn"} onClick={() => void toggleTanpura()}>{tPlaying ? T.stop : T.play}</button>
          </div>
          <div className="tp-field">
            <span>{T.first}</span>
            <div className="tp-choices" role="radiogroup" aria-label={T.first}>
              {(["Pa", "Ma", "Ni"] as FirstString[]).map(f => (
                <button key={f} type="button" role="radio" aria-checked={first === f} onClick={() => { setFirst(f); onTuningChange?.(f); }}>
                  {f === "Pa" ? "प" : f === "Ma" ? "म" : "नि"} <small>{stringHz("first", baseTonicHz, f).toFixed(1)} Hz</small>
                </button>
              ))}
            </div>
            <p className="tp-muted tp-small">{T.firstHelp}</p>
          </div>
          <details className="tp-more">
            <summary>More settings</summary>
          {!droneMode && (
            <label className="tp-range">
              <span>{T.cycle(cycleSec.toFixed(1))}</span>
              <input type="range" min={3} max={8} step={0.1} value={cycleSec} onChange={e => setCycleSec(Number(e.target.value))} />
            </label>
          )}
          <label className="tp-range">
            <span>{T.volume}</span>
            <input type="range" min={0} max={1} step={0.01} value={tVolume} onChange={e => setTVolume(Number(e.target.value))} />
          </label>
          <p className="tp-muted tp-small">{droneMode ? T.droneHint : T.tapHint}</p>
          {tSource && <p className="tp-muted tp-small">{T.sound}: {tSource}</p>}
          </details>
        </div>
        <div className="tp-strings-wrap">
          <TanpuraStrings analyser={analyser} pluck={pluck} labels={stringLabels} label={T.title} />
          {!droneMode && (
            <div className="tp-string-hits">
              {STRING_ORDER.map((s, i) => (
                <button key={s} type="button" onClick={() => void pluckString(i)} aria-label={`${stringLabels[i]} ${stringHz(s, baseTonicHz, first).toFixed(1)} Hz`} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------------- Taal */}
      <section className="tp-inst tp-taal" aria-labelledby="tp-b-h">
        <div className="tp-circle-wrap">
          <TaalCircle taal={taal} theka={theka} matra={matra} name={baseTaal.name} labels={{ sam: T.sam, khali: T.khali, taali: T.taali }} />
        </div>
        <div className="tp-inst-ctl">
          <div className="tp-head">
            <h2 id="tp-b-h" className="tp-h2">{T.taal}</h2>
            <button type="button" className={bPlaying ? "tp-btn tp-btn-stop" : "tp-btn"} onClick={() => void toggleTaal()}>{bPlaying ? T.stop : T.playTaal}</button>
          </div>
          <label className="tp-field">
            <span>{T.taal}</span>
            <select value={taalId} onChange={e => { setTaalId(e.target.value); setEditing(false); }}>
              {TAALS.map(x => <option key={x.id} value={x.id}>{x.name}, {T.matras(x.matras)}</option>)}
            </select>
            <span className="tp-muted tp-small">{baseTaal.usage}</span>
          </label>
          <label className="tp-range">
            <span>{T.tempo(bpm, T.laya[layaFor(bpm)])}</span>
            <input type="range" min={20} max={320} step={1} value={bpm} onChange={e => setBpm(Number(e.target.value))} />
          </label>
          <details className="tp-more">
            <summary>More settings</summary>
          <div className="tp-field">
            <span>Tabla tuned to</span>
            <div className="tp-choices" role="radiogroup" aria-label="Tabla tuned to">
              {(Object.keys(TABLA_TUNE) as TablaTune[]).map(k => (
                <button key={k} type="button" role="radio" aria-checked={tablaTune === k} onClick={() => setTablaTune(k)}>
                  {k === "Sa" ? "सा" : k === "Pa" ? "प" : "म"} <small>{westernNote(baseTonicHz * TABLA_TUNE[k]).name}</small>
                </button>
              ))}
            </div>
          </div>
          <label className="tp-range">
            <span>{T.volume}</span>
            <input type="range" min={0} max={1} step={0.01} value={bVolume} onChange={e => setBVolume(Number(e.target.value))} />
          </label>
          {bSource && <p className="tp-muted tp-small">{T.sound}: {bSource}</p>}
          </details>
          <p className="tp-muted tp-small">{T.legend}</p>
        </div>
      </section>

      {/* ---------------- Theka (bols), editable */}
      <section className="tp-theka" aria-labelledby="tp-k-h">
        <div className="tp-head">
          <h2 id="tp-k-h" className="tp-h2">Theka of {baseTaal.name}{custom ? " (your version)" : ""}</h2>
          {!editing ? (
            <div className="tp-row">
              <button type="button" className="tp-link" onClick={startEdit}>Edit the bols</button>
              {custom && <button type="button" className="tp-link" onClick={resetTheka}>Back to the standard theka</button>}
            </div>
          ) : (
            <div className="tp-row">
              <button type="button" className="tp-btn" disabled={!draftOk} onClick={saveEdit}>Save bols</button>
              <button type="button" className="tp-link" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          )}
        </div>
        {editing && (
          <p className="tp-muted tp-small">
            Write the bols of each matra, separated by spaces (e.g. "Dha Ge" for two bols in one matra, "-" for a rest).
            Bols the app can play: Dha, Dhin, Dhi, Na, Ta, Tin, Tu, Ti, Te, Ra, Ge, Ghe, Ga, Ke, Ka, Ki, Kat. Your version is saved in this browser.
          </p>
        )}
        <div className="tp-grid">
          {(() => {
            let i = 0;
            return taal.vibhags.map((len, vi) => (
              <div key={vi} className="tp-vibhag-row">
                {Array.from({ length: len }, () => {
                  const k = i++;
                  const c = clapAt(taal, k + 1);
                  return (
                    <div key={k} className={`tp-cell${matra === k + 1 ? " tp-cell-on" : ""}`}>
                      <span className="tp-cell-n">{k + 1}</span>
                      {editing ? (
                        <input value={draft[k] ?? ""} aria-label={`Matra ${k + 1}`} aria-invalid={parsed[k]?.unknown.length ? true : undefined}
                          onChange={e => setDraft(d => d.map((x, j) => (j === k ? e.target.value : x)))} />
                      ) : (
                        <span className="tp-cell-bol">{theka[k].join(" ")}</span>
                      )}
                      <span className="tp-cell-clap">{c === null ? "" : c}</span>
                    </div>
                  );
                })}
              </div>
            ));
          })()}
        </div>
        {editing && !draftOk && (
          <p className="tp-error">Not a bol the app can play: {[...new Set(parsed.flatMap(p => p.unknown))].join(", ")}</p>
        )}
      </section>
    </div>
  );
};
