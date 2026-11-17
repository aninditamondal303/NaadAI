/**
 * Sur milao (match the swara): the app plays a swara of the raag over the
 * tanpura, then the singer sings it for four seconds. The pitch is measured
 * live with the same detector as the analysis; the score is the share of
 * sung time within 20 cents of the swara (in any octave) and the median
 * distance from it. Results stay on this page; they are not saved.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ComprehensiveRaag } from "../../data/allRaags";
import { MicSession } from "../../audio/mic";
import { TanpuraEngine, firstStringForRaag } from "../../audio/tanpura";
import { scheduleSwaras } from "../../audio/swaraVoice";
import { createLiveTracker } from "../../analysis/live";
import { parseNote } from "../../practice/notation";
import { SwaraCanvas } from "../shared/SwaraCanvas";
import { gridFor, type GridLine, type View } from "../landing/stage";
import { Note } from "../study/Swaralipi";

const LISTEN_SEC = 1.6;
const SING_SEC = 4;

interface RoundResult { target: string; within20Pct: number | null; medianCents: number | null }

/** Swaras to practise, in the order of the raag's aroh (madhya saptak, Sa to Ni). */
function targetsFor(raag: ComprehensiveRaag): string[] {
  const seen = new Set<number>();
  const out: string[] = [];
  for (const t of raag.aroha) {
    const n = parseNote(t);
    const cls = ((n.semitones % 12) + 12) % 12;
    if (seen.has(cls)) continue;
    seen.add(cls);
    out.push(t.replace(/[,']/g, ""));
  }
  if (!seen.has(0)) out.unshift("S");
  return out;
}

export function scoreMatch(cents: (number | null)[], target: number): { within20Pct: number | null; medianCents: number | null } {
  const devs = cents.filter((c): c is number => c !== null).map(c => {
    // distance to the target swara in the nearest octave
    let d = (c - target) % 1200;
    if (d > 600) d -= 1200;
    if (d < -600) d += 1200;
    return d;
  });
  if (devs.length < 10) return { within20Pct: null, medianCents: null };
  const within = devs.filter(d => Math.abs(d) <= 20).length / devs.length;
  const sorted = [...devs].sort((a, b) => a - b);
  return { within20Pct: Math.round(within * 100), medianCents: Math.round(sorted[Math.floor(sorted.length / 2)]) };
}

export const SurMilao: React.FC<{ raag: ComprehensiveRaag; saHz: number }> = ({ raag, saHz }) => {
  const targets = useMemo(() => targetsFor(raag), [raag]);
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<"idle" | "listen" | "sing" | "done">("idle");
  const [results, setResults] = useState<RoundResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const run = useRef<{ mic: MicSession; tanpura: TanpuraEngine; tracker: ReturnType<typeof createLiveTracker> } | null>(null);
  const target = targets[round % targets.length];
  const targetCents = parseNote(target).semitones * 100;

  const grid: GridLine[] = useMemo(() => gridFor(raag.allowedSwaras).map(g =>
    ((g.c % 1200) + 1200) % 1200 === targetCents ? { ...g, kind: "sa" } : { ...g, kind: g.kind === "sa" ? "swara" : g.kind }), [raag, targetCents]);

  const close = async () => {
    const r = run.current;
    run.current = null;
    if (!r) return;
    r.tanpura.stop();
    await r.mic.close();
  };
  useEffect(() => () => { void close(); }, []);
  useEffect(() => { void close(); setRound(0); setResults([]); setPhase("idle"); }, [raag.id]);

  const go = async () => {
    setError(null);
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
      r = run.current = { mic, tanpura, tracker: createLiveTracker(mic, saHz) };
    }
    const ctx = r.mic.context;
    setPhase("listen");
    const t0 = ctx.currentTime + 0.3;
    scheduleSwaras(ctx, ctx.destination, [{ semitones: parseNote(target).semitones, start: 0, dur: LISTEN_SEC, matra: 0 }], saHz, t0, 0.3);
    const singFrom = t0 + LISTEN_SEC + 0.35;
    const singTo = singFrom + SING_SEC;
    await new Promise(res => window.setTimeout(res, (singFrom - ctx.currentTime) * 1000));
    setPhase("sing");
    const sung: (number | null)[] = [];
    await new Promise<void>(res => {
      const tick = () => {
        const rr = run.current;
        if (!rr) return res();
        const now = ctx.currentTime;
        sung.push(rr.tracker.points.length ? rr.tracker.points[rr.tracker.points.length - 1].c : null);
        if (now >= singTo) return res();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    setResults(rs => [...rs, { target, ...scoreMatch(sung, targetCents) }]);
    setPhase("done");
  };

  const next = () => { setRound(r => r + 1); setPhase("idle"); };

  const view = (): View | null => {
    const r = run.current;
    if (!r) return null;
    const now = r.mic.context.currentTime;
    r.tracker.step(now);
    return { kind: "live", points: r.tracker.points, duration: 0, reveal: 0, ghostRest: false, now };
  };

  const last = results[results.length - 1];
  const scored = results.filter(r => r.within20Pct !== null);
  const avg = scored.length ? Math.round(scored.reduce((a, r) => a + r.within20Pct!, 0) / scored.length) : null;

  return (
    <div className="sm">
      <div className="sm-top">
        <div>
          <h3 className="sm-h">Sur milao</h3>
          <p className="sm-muted">Listen to the swara, then sing it on "aa" for {SING_SEC} seconds. It is measured against your Sa ({saHz.toFixed(1)} Hz), in any octave. Use earphones.</p>
        </div>
        <div className="sm-target" aria-live="polite">
          <span className="sm-muted">Swara {round % targets.length + 1} of {targets.length}</span>
          <span className="sm-big"><Note n={parseNote(target)} script="deva" /></span>
        </div>
      </div>

      <SwaraCanvas className="rz-live" grid={grid} getView={view} running={phase === "listen" || phase === "sing"} label="Your voice and the swara to match" />

      <div className="sm-actions">
        {phase === "idle" && <button type="button" className="rz-btn" onClick={() => void go()}>Play the swara, then sing</button>}
        {phase === "listen" && <p className="sm-status">Listen...</p>}
        {phase === "sing" && <p className="sm-status sm-sing">Sing now</p>}
        {phase === "done" && (
          <>
            <p className="sm-status">
              {last.within20Pct === null
                ? "Not enough clear singing was heard. Sing a little louder or closer to the microphone."
                : `${last.within20Pct}% of the time within 20 cents; typically ${Math.abs(last.medianCents!)} cents ${last.medianCents! > 0 ? "sharp" : last.medianCents! < 0 ? "flat" : "off"}.`}
            </p>
            <button type="button" className="rz-btn" onClick={() => void go()}>Try again</button>
            <button type="button" className="rz-link" onClick={next}>Next swara</button>
          </>
        )}
        {error && <p className="sm-status sm-error">{error}</p>}
      </div>

      {results.length > 0 && (
        <div className="sm-results">
          <p className="sm-muted">This session{avg !== null ? `: ${avg}% within 20 cents on average` : ""}. Not saved.</p>
          <ol>
            {results.map((r, i) => (
              <li key={i}>
                <Note n={parseNote(r.target)} script="deva" />
                <span>{r.within20Pct === null ? "not enough singing" : `${r.within20Pct}%, ${r.medianCents! > 0 ? "+" : ""}${r.medianCents} cents`}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};
