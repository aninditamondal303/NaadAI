/**
 * Palta and pakad practice, scored note by note.
 *
 * The app plays a click on every beat (and optionally the tanpura) on the
 * microphone's own audio clock, so it knows exactly when each note should
 * start. Each note is graded green / yellow / red for pitch and timing.
 * Laya ladder: thah -> dugun -> tigun -> chaugun; the next speed unlocks at
 * a score of 85.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Lock, Mic, Square } from 'lucide-react';
import { signedCents } from '../analysis/music';
import { TanpuraEngine, firstStringForRaag } from '../audio/tanpura';
import { RAAG_LIST } from '../data/allRaags';
import { RAAG_DETAILS } from '../data/raagDetails';
import { pakadFor } from '../data/pakad';
import { useUi } from '../i18n/ui';
import { addRecord, loadHistory, newId, onHistoryChange, type PracticeRecord } from '../lib/practiceHistory';
import { parseSargam, type SargamToken } from '../practice/notation';
import { generatePaltas, LAYAS, SHUDDHA_SWARAS, UNLOCK_SCORE } from '../practice/paltas';
import { expectedHz, scoreNote, totalScore, type NoteScore } from '../practice/scoring';
import { useMic } from './analysis/micHooks';
import { SurMilao } from './practice/SurMilao';
import { GuruShishya } from './practice/GuruShishya';
import { EarTraining } from './practice/EarTraining';
import { weakSwaraPalta, weakSwaras } from '../practice/weakSwaras';

interface Props { baseTonicHz: number; initialMode?: "palta" | "pakad" | "ear" | "match" | "guru" }

type Exercise = { id: string; name: string; description: string; tokens: SargamToken[] };
type PracticeRec = Extract<PracticeRecord, { kind: "palta" | "pakad" }>;

const RAAG_ONLY = [...RAAG_LIST].sort((a, b) => a.name.localeCompare(b.name));
/** Basic paltas on the shuddha swaras come first, then every raag. */
const RAAGS = [SHUDDHA_SWARAS, ...RAAG_ONLY];
const COUNT_IN = 4;
/** Shortest note we can score reliably (the pitch window is ~46 ms). */
const MIN_NOTE_SEC = 0.12;

/** Highest speed passed (score >= 85) for each exercise in a raag. */
function bestSpeeds(history: PracticeRecord[], raagId: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of history) {
    if ((r.kind === "palta" || r.kind === "pakad") && r.raagId === raagId && r.score >= UNLOCK_SCORE) {
      out[r.exerciseId] = Math.max(out[r.exerciseId] ?? 0, r.speed);
    }
  }
  return out;
}

function click(ctx: AudioContext, when: number, accent: boolean) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.value = accent ? 1760 : 1320;
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(accent ? 0.35 : 0.2, when + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.06);
  o.connect(g); g.connect(ctx.destination);
  o.start(when); o.stop(when + 0.08);
}

export const PracticeTab: React.FC<Props> = ({ baseTonicHz, initialMode = "palta" }) => {
  const u = useUi();
  const mic = useMic();
  const [raagId, setRaagId] = useState("shuddha");
  const [kind, setKind] = useState<"palta" | "pakad" | "ear" | "match" | "guru">(initialMode);
  useEffect(() => setKind(initialMode), [initialMode]);
  const [exerciseId, setExerciseId] = useState("aroh-avaroh");
  const [bpm, setBpm] = useState(60);
  const [speed, setSpeed] = useState(1);
  const [withTanpura, setWithTanpura] = useState(true);
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState<number>(-1);
  const [scores, setScores] = useState<(NoteScore | null)[]>([]);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [history, setHistory] = useState<PracticeRecord[]>(() => loadHistory());
  useEffect(() => onHistoryChange(() => setHistory(loadHistory())), []);

  const raag = RAAGS.find(r => r.id === raagId)!;
  const details = RAAG_DETAILS[raagId];
  const pakad = pakadFor(raagId);

  const exercises: Exercise[] = useMemo(() => {
    if (kind === "pakad") {
      return pakad ? [{ id: "pakad", name: "Pakad", description: pakad, tokens: parseSargam(pakad) }] : [];
    }
    const base = generatePaltas(raag).map(p => ({ id: p.id, name: p.name, description: p.description, tokens: p.notes as SargamToken[] }));
    // Paltas focused on the singer's own weak swaras (from their measurements)
    const weak = weakSwaras(history).flatMap(w => {
      const notes = weakSwaraPalta(raag, w.semitone);
      return notes ? [{ id: `weak-${w.semitone}`, name: `Weak swara: ${w.name}`, description: `Your ${w.name} ${w.reason}. ${notes.map(n => n.label).join(" ")}`, tokens: notes as SargamToken[] }] : [];
    });
    return [...weak, ...base];
  }, [raag, kind, pakad, history]);
  const exercise = exercises.find(e => e.id === exerciseId) ?? exercises[0];

  useEffect(() => { setExerciseId(kind === "pakad" ? "pakad" : "aroh-avaroh"); }, [kind, raagId]);
  const recordKind: "palta" | "pakad" = kind === "pakad" ? "pakad" : "palta";
  useEffect(() => { setScores([]); setFinalScore(null); setCurrent(-1); }, [exerciseId, raagId, kind, speed]);

  const best = bestSpeeds(history, raagId);
  const unlockedUpTo = exercise ? Math.min(4, (best[exercise.id] ?? 0) + 1) : 1;
  const noteSec = 60 / bpm / speed;
  const tooFast = noteSec < MIN_NOTE_SEC;
  const lastRuns = history.filter((r): r is PracticeRec => (r.kind === "palta" || r.kind === "pakad") && r.raagId === raagId && r.exerciseId === exercise?.id).slice(-5).reverse();

  const timers = useRef<number[]>([]);
  const tanpura = useRef<TanpuraEngine | null>(null);
  const cancel = useRef(false);

  const cleanup = async () => {
    timers.current.forEach(t => clearInterval(t));
    timers.current = [];
    tanpura.current?.disconnect();
    tanpura.current = null;
    await mic.close();
    setRunning(false);
    setCurrent(-1);
  };
  useEffect(() => () => { void cleanup(); }, []);

  const start = async () => {
    if (!exercise || tooFast) return;
    const m = await mic.open();
    if (!m) return;
    const ctx = m.context;
    cancel.current = false;
    setScores(exercise.tokens.map(() => null));
    setFinalScore(null);
    setRunning(true);

    if (withTanpura) {
      const eng = new TanpuraEngine(ctx, ctx.destination, { saHz: baseTonicHz, firstString: firstStringForRaag(raag.allowedSwaras), cycleSec: 4.5, volume: 0.45 });
      await eng.loadSamples();
      eng.start();
      tanpura.current = eng;
    }

    m.startRecording();
    const beat = 60 / bpm;
    const t0 = ctx.currentTime + 0.4;            // first count-in click
    const firstNote = t0 + COUNT_IN * beat;
    const tokens = exercise.tokens;
    const total = tokens.length;
    const endTime = firstNote + total * noteSec;
    const latency = m.roundTripLatency;

    // clicks: count-in on every beat, then one per beat while singing
    for (let i = 0; i < COUNT_IN; i++) click(ctx, t0 + i * beat, i === 0);
    for (let b = 0; firstNote + b * beat < endTime - 1e-6; b++) click(ctx, firstNote + b * beat, b === 0);

    const results: (NoteScore | null)[] = tokens.map(() => null);
    let nextToScore = 0;
    const sr = m.sampleRate;

    const tick = window.setInterval(() => {
      const now = ctx.currentTime;
      setCurrent(now < firstNote ? -1 : Math.min(total, Math.floor((now - firstNote) / noteSec)));

      // score every note whose slot has been fully recorded
      while (nextToScore < total) {
        const tok = tokens[nextToScore];
        const slotStart = firstNote + nextToScore * noteSec + latency;
        const slotEnd = slotStart + noteSec;
        const toSample = (t: number) => (t - m.recordingStartTime) * sr;
        if (m.recordedSamples < toSample(slotEnd) + 0.02 * sr) break;
        if (tok.kind === "note") {
          const audio = m.recordedRange(toSample(slotStart), toSample(slotEnd));
          results[nextToScore] = scoreNote(audio, sr, expectedHz(tok, baseTonicHz));
        }
        nextToScore++;
        setScores([...results]);
      }

      if (nextToScore >= total || cancel.current) {
        clearInterval(tick);
        const scored = results.filter((r): r is NoteScore => r !== null);
        if (!cancel.current && scored.length) {
          const score = totalScore(scored);
          setFinalScore(score);
          addRecord({
            kind: recordKind, id: newId(), dateIso: new Date().toISOString(), raagId, raagName: raag.name.replace(/^Raag\s+/i, ""),
            exerciseId: exercise.id, exerciseName: exercise.name, speed, bpm, score, notes: scored.length,
            durationSec: endTime - t0,
          });
        }
        void cleanup();
      }
    }, 50);
    timers.current.push(tick);
  };

  const stop = () => { cancel.current = true; };

  const gradeClass = (s: NoteScore | null, i: number) => {
    if (s?.grade === "green") return "bg-emerald-500/20 border-emerald-500 text-emerald-200";
    if (s?.grade === "yellow") return "bg-amber-500/20 border-amber-400 text-amber-100";
    if (s?.grade === "red") return "bg-rose-500/20 border-rose-500 text-rose-200";
    if (i === current) return "bg-[#C9A227]/30 border-[#C9A227] text-white";
    return "bg-[#062327]/60 border-slate-800 text-slate-300";
  };

  const card = "pr-panel space-y-4";
  const label = "pr-label";

  return (
    <div className="space-y-6">
      <div className={card}>
        <div>
          <h1 className="pg-title">{u("riyazTitle")}</h1>
          <p className="pr-intro">{u("riyazIntro")}</p>
        </div>
        <div className="pr-controls">
          <label className="space-y-1 block">
            <span className={label}>Raag</span>
            <select value={raagId} disabled={running} onChange={e => setRaagId(e.target.value)} className="w-full bg-[#062327] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200">
              <optgroup label={u("basicPaltas")}>
                <option value={SHUDDHA_SWARAS.id}>{u("shuddhaSwaras")}</option>
              </optgroup>
              <optgroup label={u("raagPaltas")}>
                {RAAG_ONLY.map(r => <option key={r.id} value={r.id}>{r.name.replace(/^Raag\s+/i, "")}</option>)}
              </optgroup>
            </select>
          </label>
          <div className="space-y-1">
            <span className={label}>Exercise type</span>
            <div className="flex gap-2">
              {(["palta", "pakad", "guru", "match", "ear"] as const).map(k => (
                <button key={k} type="button" disabled={running || (k === "pakad" && !pakad)} onClick={() => setKind(k)}
                  aria-current={kind === k ? "true" : undefined} className="pr-kind">
                  {u(k === "palta" ? "kindPalta" : k === "pakad" ? "kindPakad" : k === "ear" ? "kindEar" : k === "guru" ? "kindGuru" : "kindMatch")}
                </button>
              ))}
            </div>
          </div>
          {(kind === "palta" || kind === "pakad") && <>
          <label className="space-y-1 block pr-beat">
            <span className={label}>{u("beat", bpm)}</span>
            <input type="range" min={40} max={120} value={bpm} disabled={running} onChange={e => setBpm(Number(e.target.value))} className="w-full accent-[#C9A227]" />
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-300 pt-4">
            <input type="checkbox" checked={withTanpura} disabled={running} onChange={e => setWithTanpura(e.target.checked)} className="accent-[#C9A227]" />
            {u("tanpuraOn", baseTonicHz.toFixed(1))}
          </label>
          </>}
        </div>
      </div>

      {kind === "palta" && (
        <div className="pr-exlist">
          {exercises.map(e => (
            <button key={e.id} type="button" disabled={running} onClick={() => setExerciseId(e.id)}
              aria-current={exercise?.id === e.id ? "true" : undefined} className="pr-ex">
              <span className="pr-ex-name">{e.name}</span>
              <span className="pr-ex-notes">{e.description}</span>
              <span className="pr-ex-best">
                Best clean speed: {best[e.id] ? LAYAS[best[e.id] - 1].name : "none yet"}
              </span>
            </button>
          ))}
        </div>
      )}

      {kind === "ear" && <EarTraining raag={raag} saHz={baseTonicHz} />}
      {kind === "match" && <SurMilao raag={raag} saHz={baseTonicHz} />}
      {kind === "guru" && <GuruShishya raag={raag} saHz={baseTonicHz} />}

      {kind !== "ear" && kind !== "match" && kind !== "guru" && exercise && (
        <div className={card}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {LAYAS.map(l => {
                const locked = l.speed > unlockedUpTo;
                return (
                  <button key={l.speed} type="button" disabled={running || locked} onClick={() => setSpeed(l.speed)}
                    title={locked ? `Score ${UNLOCK_SCORE}+ at ${LAYAS[l.speed - 2].name} to unlock` : undefined}
                    className={`px-3 py-2 rounded-lg border text-xs font-mono font-bold flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed ${speed === l.speed ? "bg-[#8CC7BD] border-[#8CC7BD] text-slate-950" : locked ? "border-slate-800 text-slate-600" : "border-slate-700 text-slate-200"}`}>
                    {locked && <Lock className="h-3 w-3" />}{l.name}
                  </button>
                );
              })}
            </div>
            {!running
              ? <button type="button" onClick={start} disabled={tooFast} className="px-5 py-2.5 rounded-xl bg-[#D9B45F] text-slate-950 font-mono text-xs font-black uppercase flex items-center gap-2 cursor-pointer disabled:opacity-50"><Mic className="h-4 w-4" /> Start ({COUNT_IN}-beat count-in)</button>
              : <button type="button" onClick={stop} className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-mono text-xs font-bold uppercase flex items-center gap-2 cursor-pointer"><Square className="h-4 w-4 fill-white" /> Stop</button>}
          </div>
          {tooFast && <p className="text-xs text-amber-300">Notes would be shorter than {MIN_NOTE_SEC * 1000} ms at this beat and speed, which is too short to score reliably. Lower the beat.</p>}

          <div className="flex flex-wrap gap-1.5">
            {exercise.tokens.map((t, i) => t.kind === "break"
              ? <span key={i} className="w-4" />
              : (
                <div key={i} title={scores[i]?.deviationCents != null ? `${signedCents(scores[i]!.deviationCents!)} cents` : undefined}
                  className={`min-w-[2.5rem] px-2 py-1.5 rounded-lg border text-center font-mono text-sm font-bold ${gradeClass(scores[i], i)}`}>
                  {t.label}
                  {scores[i]?.deviationCents != null && <span className="block text-[9px] font-normal opacity-80">{signedCents(scores[i]!.deviationCents!)}</span>}
                </div>
              ))}
          </div>

          {finalScore !== null && (
            <div className="p-4 rounded-xl border border-slate-700 bg-[#062327]/60 text-sm text-slate-200">
              Score: <b>{finalScore.toFixed(0)}</b> at {LAYAS[speed - 1].name}, {bpm} beats per minute.{" "}
              {finalScore >= UNLOCK_SCORE
                ? speed < 4 ? `${LAYAS[speed].name} is now unlocked.` : "That's the top of the laya ladder."
                : `Reach ${UNLOCK_SCORE} to unlock the next speed.`}
            </div>
          )}
          {mic.error && <p className="text-xs text-rose-300">{mic.error}</p>}

          {lastRuns.length > 0 && (
            <div className="text-[11px] text-slate-400 space-y-0.5">
              <span className={label}>Recent attempts</span>
              {lastRuns.map(r => (
                <span key={r.id} className="block font-mono">
                  {new Date(r.dateIso).toLocaleDateString()} · {LAYAS[r.speed - 1].name} @ {r.bpm} · score {r.score.toFixed(0)}
                </span>
              ))}
            </div>
          )}
          <p className="text-[10px] text-slate-500">
            Timing allows for your device's audio delay as reported by the browser; Bluetooth earphones add extra delay and may make notes look late.
          </p>
        </div>
      )}
    </div>
  );
};
