/**
 * Guru-shishya: the app sings a phrase (guide voice over the tanpura), the
 * student sings it back, and each swara is marked: sung in order and in tune
 * (within 25 cents), sung but out of tune, or missed. The pitch is measured
 * live with the same detector as the analysis. Results are not saved.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ComprehensiveRaag } from "../../data/allRaags";
import { RAAG_DETAILS } from "../../data/raagDetails";
import { ALAAP } from "../../data/compositions";
import { pakadFor } from "../../data/pakad";
import { MicSession } from "../../audio/mic";
import { TanpuraEngine, firstStringForRaag } from "../../audio/tanpura";
import { scheduleSwaras } from "../../audio/swaraVoice";
import { createLiveTracker } from "../../analysis/live";
import { parseNote } from "../../practice/notation";
import { timePhrases } from "../../practice/swaralipi";
import { moreSargams } from "../../practice/generate";
import { matchPhrase, segmentNotes, type NoteMark } from "../../practice/phraseMatch";
import { SwaraCanvas } from "../shared/SwaraCanvas";
import { gridFor, type View } from "../landing/stage";
import { Note } from "../study/Swaralipi";
import { scheduleContour } from "../../audio/contourVoice";
import { CONTOUR_RATE, encodeGuruPhrase, guruPhraseUrl, loadGuruPhrases, phraseFromPoints, removeGuruPhrase, saveGuruPhrase, type GuruPhrase } from "../../practice/guruPhrase";
import { toast } from "../shell/Toaster";
import { useUi } from "../../i18n/ui";
import { Mic, Share2, Square, Trash2 } from "lucide-react";

const NOTE_SEC = 0.75;

type Phrase = { source: string; text: string; contour?: (number | null)[]; guruId?: string };

function phrasesFor(raag: ComprehensiveRaag): Phrase[] {
  const out: Phrase[] = [];
  for (const st of ALAAP[raag.id] ?? []) for (const p of st.phrases) out.push({ source: `Alaap: ${st.name}`, text: p });
  const d = RAAG_DETAILS[raag.id];
  const pk = pakadFor(raag.id);
  if (pk) out.push({ source: "Pakad", text: pk.replace(/\|/g, " ") });
  for (let set = 1; set <= 3; set++) for (const p of moreSargams(raag, set, d?.nyas ?? [], 3)) out.push({ source: "Generated sargam", text: p });
  return out.filter(p => p.text.split(/\s+/).filter(t => t !== "-").length >= 3);
}

export const GuruShishya: React.FC<{ raag: ComprehensiveRaag; saHz: number }> = ({ raag, saHz }) => {
  const u = useUi();
  const [guruVersion, setGuruVersion] = useState(0);
  const guruList = useMemo(() => loadGuruPhrases(), [guruVersion]);
  const [from, setFrom] = useState<"app" | "guru">(() => (loadGuruPhrases().length ? "guru" : "app"));
  const phrases: Phrase[] = useMemo(() => from === "guru"
    ? guruList.map(g => ({ source: g.by ? u("gsSungBy", g.by) : u("gsYourGuru"), text: g.notes, contour: g.contour, guruId: g.id }))
    : phrasesFor(raag), [raag, from, guruList]);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"idle" | "guru" | "shishya" | "done">("idle");
  const [marks, setMarks] = useState<NoteMark[] | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const run = useRef<{ mic: MicSession; tanpura: TanpuraEngine; tracker: ReturnType<typeof createLiveTracker> } | null>(null);
  const phrase = phrases[idx % Math.max(1, phrases.length)];
  const grid = useMemo(() => gridFor(raag.allowedSwaras), [raag]);

  const close = async () => {
    const r = run.current;
    run.current = null;
    if (!r) return;
    r.tanpura.stop();
    await r.mic.close();
  };
  useEffect(() => () => { void close(); }, []);
  useEffect(() => { void close(); setIdx(0); setPhase("idle"); setMarks(null); setScore(null); setHistory([]); }, [raag.id, from]);

  const go = async () => {
    if (!phrase) return;
    setError(null);
    setMarks(null);
    let r = run.current;
    if (!r) {
      let mic: MicSession;
      try { mic = await MicSession.open(); } catch (e: any) {
        setError(e?.name === "NotAllowedError" ? "Microphone access was blocked. Allow it in the address bar and try again." : `The microphone didn't open: ${e?.message || e}`);
        return;
      }
      const tanpura = new TanpuraEngine(mic.context, mic.context.destination, { saHz, firstString: firstStringForRaag(raag.allowedSwaras), cycleSec: 4.5, volume: 0.35 });
      await tanpura.loadSamples();
      tanpura.start();
      r = run.current = { mic, tanpura, tracker: createLiveTracker(mic, saHz, 30) };
    }
    const ctx = r.mic.context;
    const t0 = ctx.currentTime + 0.3;
    let len: number;
    if (phrase.contour) {
      len = scheduleContour(ctx, ctx.destination, phrase.contour, CONTOUR_RATE, saHz, t0, 0.28).duration;
    } else {
      const notes = timePhrases([phrase.text], NOTE_SEC, 0);
      len = notes.length ? notes[notes.length - 1].start + notes[notes.length - 1].dur : 0;
      scheduleSwaras(ctx, ctx.destination, notes, saHz, t0, 0.28);
    }
    setPhase("guru");
    const from = t0 + len + 0.4;
    const to = from + len + 1.5;
    let turned = false;
    await new Promise<void>(res => {
      const tick = () => {
        const rr = run.current;
        if (!rr) return res();
        const now = ctx.currentTime;
        rr.tracker.step(now);
        if (now >= from && !turned) { turned = true; setPhase("shishya"); }
        if (now >= to) return res();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const rr = run.current;
    if (!rr) return;
    const sung = segmentNotes(rr.tracker.points.filter(p => p.t >= from && p.t <= to));
    const expected = phrase.text.split(/\s+/).filter(t => t !== "-" && t !== "|").map(t => parseNote(t).semitones);
    const res = matchPhrase(expected, sung);
    setMarks(res.marks);
    setScore(res.score);
    setHistory(h => [...h, res.score]);
    setPhase("done");
  };

  const view = (): View | null => {
    const r = run.current;
    if (!r) return null;
    return { kind: "live", points: r.tracker.points, duration: 0, reveal: 0, ghostRest: false, now: r.mic.context.currentTime };
  };

  // ---- recording a phrase as the guru
  const [recName, setRecName] = useState("");
  const [rec, setRec] = useState<{ mic: MicSession; tracker: ReturnType<typeof createLiveTracker>; raf: number } | null>(null);
  const [recOpen, setRecOpen] = useState(false);
  const startRec = async () => {
    await close();
    let mic: MicSession;
    try { mic = await MicSession.open(); } catch { setError("Microphone access was blocked. Allow it and try again."); return; }
    const tracker = createLiveTracker(mic, saHz, 20);
    const tick = () => { tracker.step(mic.context.currentTime); r.raf = requestAnimationFrame(tick); };
    const r = { mic, tracker, raf: requestAnimationFrame(tick) };
    setRec(r);
  };
  const stopRec = async () => {
    const r = rec;
    if (!r) return;
    cancelAnimationFrame(r.raf);
    setRec(null);
    await r.mic.close();
    const g = phraseFromPoints(r.tracker.points, raag.id, recName);
    if (!g) { setError("No clear swaras were heard. Sing the phrase a little louder and hold each swara briefly."); return; }
    saveGuruPhrase(g);
    setGuruVersion(v => v + 1);
    setFrom("guru");
    setRecOpen(false);
    toast(u("gsSaved"));
  };
  const shareGuru = async (g: GuruPhrase) => {
    const url = guruPhraseUrl(await encodeGuruPhrase(g));
    try {
      if (navigator.share) { await navigator.share({ title: "A phrase to sing back", text: `${g.notes} (Naad AI)`, url }); return; }
    } catch { /* cancelled */ }
    try { await navigator.clipboard.writeText(url); toast("Link copied"); } catch { window.prompt("Copy this link", url); }
  };
  const recView = (): View | null => rec ? { kind: "live", points: rec.tracker.points, duration: 0, reveal: 0, ghostRest: false, now: rec.mic.context.currentTime } : null;

  const sourceBar = (
    <div className="gs-source">
      <div className="az-modes" role="group" aria-label="Phrases from">
        <button type="button" aria-current={from === "app" ? "true" : undefined} onClick={() => setFrom("app")}>{u("gsRaagPhrases")}</button>
        <button type="button" aria-current={from === "guru" ? "true" : undefined} onClick={() => setFrom("guru")}>{u("gsFromGuru")}{guruList.length ? ` (${guruList.length})` : ""}</button>
      </div>
      <button type="button" className="btn btn-ghost" onClick={() => setRecOpen(o => !o)} aria-expanded={recOpen}><Mic size={15} aria-hidden /> {u("gsRecord")}</button>
    </div>
  );
  const recorder = recOpen && (
    <div className="gs-rec">
      <p className="sm-muted">{u("gsRecIntro", saHz.toFixed(1))}</p>
      <div className="gs-rec-row">
        <label className="tp-field"><span>{u("gsName")}</span><input value={recName} onChange={e => setRecName(e.target.value)} maxLength={40} placeholder="e.g. Guruji" /></label>
        {!rec ? <button type="button" className="btn btn-primary" onClick={() => void startRec()}><Mic size={15} aria-hidden /> {u("gsStart")}</button>
          : <button type="button" className="btn btn-danger" onClick={() => void stopRec()}><Square size={14} fill="currentColor" aria-hidden /> {u("gsStopSave")}</button>}
      </div>
      {rec && <SwaraCanvas className="rz-live" grid={grid} getView={recView} running label="The phrase being recorded" />}
    </div>
  );

  if (!phrase) return (
    <div className="sm">
      {sourceBar}
      {recorder}
      <div className="empty-state">
        <Mic size={28} strokeWidth={1.5} aria-hidden />
        <strong>{u("gsEmptyH")}</strong>
        <span>{u("gsEmptyP")}</span>
      </div>
    </div>
  );
  const currentGuru = phrase.guruId ? guruList.find(g => g.id === phrase.guruId) : undefined;
  const tokens = phrase.text.split(/\s+/);
  let k = -1;
  let prevSemi: number | null = null;

  return (
    <div className="sm">
      {sourceBar}
      {recorder}
      <div className="sm-top">
        <div>
          <h3 className="sm-h">Guru-shishya</h3>
          <p className="sm-muted">The app sings a phrase over the tanpura; then you sing it back. Each swara is marked when you finish. Use earphones.</p>
        </div>
        <span className="sm-muted">Phrase {idx % phrases.length + 1} of {phrases.length}, {phrase.source}</span>
      </div>
      {currentGuru && (
        <div className="gs-guru-actions">
          <span className="sm-muted">{u("gsFollows")}</span>
          <button type="button" className="rz-link" onClick={() => void shareGuru(currentGuru)}><Share2 size={14} aria-hidden /> {u("gsShare")}</button>
          <button type="button" className="rz-link" onClick={() => { if (window.confirm("Remove this phrase?")) { removeGuruPhrase(currentGuru.id); setGuruVersion(v => v + 1); setIdx(0); } }}><Trash2 size={14} aria-hidden /> {u("gsRemove")}</button>
        </div>
      )}

      <p className="gs-phrase" aria-label="The phrase">
        {tokens.map((tok, i) => {
          if (tok === "-") return <span key={i} className="sl-hold">ऽ</span>;
          const semi = parseNote(tok).semitones;
          if (semi !== prevSemi) k++;
          prevSemi = semi;
          const mk = marks?.[k];
          const cls = !mk ? "" : !mk.hit ? "gs-miss" : Math.abs(mk.cents!) <= 25 ? "gs-good" : "gs-off";
          return (
            <span key={i} className={`gs-note ${cls}`} title={mk ? (mk.hit ? `${mk.cents! > 0 ? "+" : ""}${mk.cents} cents` : "not heard") : undefined}>
              <Note n={parseNote(tok)} script="deva" />
              {mk?.hit && <small>{mk.cents! > 0 ? "+" : ""}{mk.cents}</small>}
            </span>
          );
        })}
      </p>

      <SwaraCanvas className="rz-live" grid={grid} getView={view} running={phase === "guru" || phase === "shishya"} label="Your voice on the raag's swara lines" />

      <div className="sm-actions">
        {(phase === "idle" || phase === "done") && <button type="button" className="rz-btn" onClick={() => void go()}>{phase === "done" ? "Try this phrase again" : "Listen, then sing it back"}</button>}
        {phase === "guru" && <p className="sm-status">Listen...</p>}
        {phase === "shishya" && <p className="sm-status sm-sing">Your turn</p>}
        {phase === "done" && (
          <>
            <p className="sm-status">{score}/100. Gold: in order and within 25 cents. Rose: sung but off by more. Faded: not heard.</p>
            <button type="button" className="rz-link" onClick={() => { setIdx(i => i + 1); setPhase("idle"); setMarks(null); setScore(null); }}>Next phrase</button>
          </>
        )}
        {error && <p className="sm-status sm-error">{error}</p>}
      </div>
      {history.length > 1 && <p className="sm-muted">This session: {history.join(", ")}. Not saved.</p>}
    </div>
  );
};
