/**
 * Ear training: name the swara (after a Sa reference), or name the raag
 * from a pakad/chalan phrase. Ten questions per round; results are saved.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { synthPluck } from '../../audio/tanpura';
import type { ComprehensiveRaag } from '../../data/allRaags';
import { RAAG_LIST } from '../../data/allRaags';
import { RAAG_DETAILS } from '../../data/raagDetails';
import { addRecord, newId } from '../../lib/practiceHistory';
import { cryptoRand, raagQuestion, swaraQuestion, type RaagQuestion, type SwaraQuestion } from '../../practice/earQuiz';
import type { SargamToken } from '../../practice/notation';
import { expectedHz } from '../../practice/scoring';

const ROUND = 10;
const shortName = (id: string) => (RAAG_LIST.find(r => r.id === id)?.name ?? id).replace(/^Raag\s+/i, "");

export const EarTraining: React.FC<{ raag: ComprehensiveRaag; saHz: number }> = ({ raag, saHz }) => {
  const [level, setLevel] = useState<"swara" | "raag">("swara");
  const [q, setQ] = useState<SwaraQuestion | RaagQuestion | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [n, setN] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);

  const ctx = () => {
    if (!ctxRef.current) {
      const C = window.AudioContext || (window as any).webkitAudioContext;
      ctxRef.current = new C();
    }
    if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
    return ctxRef.current;
  };
  useEffect(() => () => { void ctxRef.current?.close(); }, []);

  const pluck = (hz: number, when: number, len = 1.2) => {
    const c = ctx();
    const src = c.createBufferSource();
    src.buffer = synthPluck(c, hz, 2);
    const g = c.createGain();
    g.gain.value = 0.8;
    src.connect(g); g.connect(c.destination);
    src.start(when); src.stop(when + len);
  };

  const play = (question = q) => {
    if (!question) return;
    const t = ctx().currentTime + 0.05;
    if ("answer" in question) {
      pluck(saHz, t);                                            // Sa reference
      pluck(expectedHz(question.answer, saHz), t + 1.3);         // the swara
    } else {
      let time = t;
      pluck(saHz, time); time += 1.2;
      for (const tok of question.phrase as SargamToken[]) {
        if (tok.kind === "break") { time += 0.35; continue; }
        pluck(expectedHz(tok, saHz), time, 0.6);
        time += 0.55;
      }
    }
  };

  const next = (lvl = level) => {
    const question = lvl === "swara" ? swaraQuestion(raag, cryptoRand) : raagQuestion(RAAG_LIST, RAAG_DETAILS, cryptoRand);
    setQ(question);
    setChosen(null);
    play(question);
  };

  const start = (lvl: "swara" | "raag") => {
    setLevel(lvl); setN(0); setCorrect(0); setMissed([]); setDone(false);
    next(lvl);
  };

  const answerId = q ? ("answer" in q ? q.answer.label : q.answerId) : "";
  const choose = (id: string) => {
    if (chosen || !q) return;
    setChosen(id);
    const ok = id === answerId;
    const newCorrect = correct + (ok ? 1 : 0);
    const newMissed = ok ? missed : [...missed, answerId];
    setCorrect(newCorrect);
    setMissed(newMissed);
    const count = n + 1;
    setN(count);
    if (count >= ROUND) {
      setDone(true);
      addRecord({ kind: "ear-quiz", id: newId(), dateIso: new Date().toISOString(), level, correct: newCorrect, total: ROUND, missed: newMissed });
    }
  };

  const options: { id: string; label: string }[] = !q ? [] : "answer" in q
    ? q.options.filter(o => o.semitones !== 0).map(o => ({ id: o.label, label: o.label }))
    : q.optionIds.map(id => ({ id, label: shortName(id) }));

  return (
    <div className="bg-[#151A2E] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Ear training</h3>
          <p className="text-xs text-slate-400">
            {level === "swara" ? `You'll hear Sa, then one swara of ${raag.name.replace(/^Raag\s+/i, "")}. Which swara is it?` : "You'll hear Sa, then a pakad or chalan phrase. Which raag is it?"}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => start("swara")} className="px-3 py-2 rounded-lg border border-slate-700 text-xs font-mono font-bold text-slate-200 cursor-pointer hover:border-[#7C3AED]">New round: swaras</button>
          <button type="button" onClick={() => start("raag")} className="px-3 py-2 rounded-lg border border-slate-700 text-xs font-mono font-bold text-slate-200 cursor-pointer hover:border-[#7C3AED]">New round: raags</button>
        </div>
      </div>

      {q && !done && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">Question {Math.min(n + (chosen ? 0 : 1), ROUND)} of {ROUND} · {correct} correct</span>
            <button type="button" onClick={() => play()} className="px-3 py-1.5 rounded-lg bg-[#7C3AED] text-white text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"><Play className="h-3.5 w-3.5" /> Play again</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {options.map(o => {
              const state = !chosen ? "" : o.id === answerId ? "border-emerald-500 bg-emerald-500/20 text-emerald-100" : o.id === chosen ? "border-rose-500 bg-rose-500/20 text-rose-100" : "opacity-50";
              return (
                <button key={o.id} type="button" onClick={() => choose(o.id)}
                  className={`min-w-[3rem] px-3 py-2 rounded-lg border border-slate-700 font-mono text-sm font-bold text-slate-200 cursor-pointer ${state}`}>
                  {o.label}
                </button>
              );
            })}
          </div>
          {chosen && (
            <div className="flex items-center gap-3 text-xs">
              <span className={chosen === answerId ? "text-emerald-300" : "text-rose-300"}>
                {chosen === answerId ? "Correct." : `It was ${"answer" in q ? q.answer.label : shortName(q.answerId)}.`}
                {"phraseText" in q && <span className="text-slate-400 font-mono"> Phrase: {q.phraseText}</span>}
              </span>
              <button type="button" onClick={() => next()} className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-200 font-mono font-bold cursor-pointer">Next</button>
            </div>
          )}
        </div>
      )}

      {done && (
        <p className="text-sm text-slate-200">
          Round finished: <b>{correct} of {ROUND}</b> correct.
          {missed.length > 0 && <> Missed: <span className="font-mono">{(level === "raag" ? missed.map(shortName) : missed).join(", ")}</span>.</>}
        </p>
      )}
      <p className="text-[10px] text-slate-500">Swaras are played at equal-tempered positions above your Sa ({saHz.toFixed(1)} Hz) with the app's plucked-string sound.</p>
    </div>
  );
};
