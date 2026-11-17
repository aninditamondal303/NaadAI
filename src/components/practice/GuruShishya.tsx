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

const NOTE_SEC = 0.75;

function phrasesFor(raag: ComprehensiveRaag): { source: string; text: string }[] {
  const out: { source: string; text: string }[] = [];
  for (const st of ALAAP[raag.id] ?? []) for (const p of st.phrases) out.push({ source: `Alaap: ${st.name}`, text: p });
  const d = RAAG_DETAILS[raag.id];
  const pk = pakadFor(raag.id);
  if (pk) out.push({ source: "Pakad", text: pk.replace(/\|/g, " ") });
  for (let set = 1; set <= 3; set++) for (const p of moreSargams(raag, set, d?.nyas ?? [], 3)) out.push({ source: "Generated sargam", text: p });
  return out.filter(p => p.text.split(/\s+/).filter(t => t !== "-").length >= 3);
}

export const GuruShishya: React.FC<{ raag: ComprehensiveRaag; saHz: number }> = ({ raag, saHz }) => {
  const phrases = useMemo(() => phrasesFor(raag), [raag]);
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
  useEffect(() => { void close(); setIdx(0); setPhase("idle"); setMarks(null); setScore(null); setHistory([]); }, [raag.id]);

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
    const notes = timePhrases([phrase.text], NOTE_SEC, 0);
    const len = notes.length ? notes[notes.length - 1].start + notes[notes.length - 1].dur : 0;
    const t0 = ctx.currentTime + 0.3;
    scheduleSwaras(ctx, ctx.destination, notes, saHz, t0, 0.28);
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

  if (!phrase) return <p className="sm-muted">No phrases are available for this raag yet.</p>;
  const tokens = phrase.text.split(/\s+/);
  let k = -1;
  let prevSemi: number | null = null;

  return (
    <div className="sm">
      <div className="sm-top">
        <div>
          <h3 className="sm-h">Guru-shishya</h3>
          <p className="sm-muted">The app sings a phrase over the tanpura; then you sing it back. Each swara is marked when you finish. Use earphones.</p>
        </div>
        <span className="sm-muted">Phrase {idx % phrases.length + 1} of {phrases.length}, {phrase.source}</span>
      </div>

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
