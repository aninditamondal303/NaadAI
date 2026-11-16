/**
 * Home: raags for this time of day, today's riyaz plan built from real
 * measurements, and the real practice streak.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Flame } from 'lucide-react';
import { RAAG_LIST } from '../../data/allRaags';
import { loadHistory, onHistoryChange, type PracticeRecord } from '../../lib/practiceHistory';
import { localDay, practiceStreakDays } from '../../lib/stats';
import { buildPlan, type PlanStep } from '../../practice/planner';
import { praharFor, raagsForHour } from '../../practice/raagTime';

interface Props {
  onGo: (step: PlanStep["goTo"]) => void;
}

const DONE_KEY = "naad.planDone.v1";

function loadDone(): Record<string, boolean> {
  try {
    const raw = JSON.parse(localStorage.getItem(DONE_KEY) || "{}");
    return raw.day === localDay(new Date()) ? raw.done ?? {} : {};
  } catch { return {}; }
}

export const TodayPanel: React.FC<Props> = ({ onGo }) => {
  const [history, setHistory] = useState<PracticeRecord[]>(() => loadHistory());
  useEffect(() => onHistoryChange(() => setHistory(loadHistory())), []);
  const [hour, setHour] = useState(() => new Date().getHours());
  useEffect(() => { const t = window.setInterval(() => setHour(new Date().getHours()), 60000); return () => clearInterval(t); }, []);
  const [minutes, setMinutes] = useState(45);
  const [done, setDone] = useState<Record<string, boolean>>(() => loadDone());

  const toggle = (id: string) => {
    const next = { ...done, [id]: !done[id] };
    setDone(next);
    try { localStorage.setItem(DONE_KEY, JSON.stringify({ day: localDay(new Date()), done: next })); } catch { /* ignore */ }
  };

  const prahar = praharFor(hour);
  const nowRaags = raagsForHour(RAAG_LIST, hour);
  const plan = useMemo(() => buildPlan(history, RAAG_LIST, minutes), [history, minutes, hour]);
  const streak = practiceStreakDays(history);
  const hasData = history.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-4 bg-[#151A2E] p-5 rounded-2xl border border-slate-800 shadow-lg space-y-3">
        <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-widest block">Raags for now</span>
        <p className="text-xs text-[#38BDF8] font-mono">{prahar.name}</p>
        {nowRaags.length === 0 ? (
          <p className="text-xs text-slate-400">No raag in the library is listed for this hour.</p>
        ) : (
          <ul className="space-y-2">
            {nowRaags.slice(0, 6).map(r => (
              <li key={r.id} className="text-sm">
                <span className="font-serif font-bold text-slate-100">{r.name.replace(/^Raag\s+/i, "")}</span>
                <span className="block text-[10px] font-mono text-slate-500">{r.time} · {r.aroha.join(" ")}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[10px] text-slate-500">From the times listed in the raag library. Traditions differ on exact hours.</p>
      </div>

      <div className="lg:col-span-5 bg-[#151A2E] p-5 rounded-2xl border border-slate-800 shadow-lg space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-widest block">Today's riyaz plan</span>
          <select value={minutes} onChange={e => setMinutes(Number(e.target.value))} className="bg-[#0F1115] border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-200">
            {[20, 30, 45, 60, 90].map(m => <option key={m} value={m}>{m} min</option>)}
          </select>
        </div>
        {!hasData && <p className="text-[11px] text-amber-300/80">No measurements yet, so time is split evenly. The plan adapts as you practise.</p>}
        <ol className="space-y-2">
          {plan.map(step => (
            <li key={step.id} className={`p-2.5 rounded-lg border ${done[step.id] ? "border-slate-900 opacity-60" : "border-slate-800 bg-[#0F1115]/60"}`}>
              <div className="flex items-start gap-2">
                <button type="button" onClick={() => toggle(step.id)} className="mt-0.5 cursor-pointer" aria-label={done[step.id] ? "Mark not done" : "Mark done"}>
                  {done[step.id] ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-slate-600" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-bold ${done[step.id] ? "line-through text-slate-500" : "text-slate-200"}`}>{step.title}</span>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0">{step.minutes} min</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{step.reason}</p>
                </div>
                <button type="button" onClick={() => onGo(step.goTo)} className="text-[10px] font-mono text-[#38BDF8] hover:underline cursor-pointer shrink-0 mt-0.5">Open</button>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="lg:col-span-3 bg-[#151A2E] p-5 rounded-2xl border border-slate-800 shadow-lg flex flex-col items-center justify-center text-center gap-2">
        <Flame className="h-8 w-8 text-orange-400" />
        <span className="text-3xl font-black font-mono text-orange-300">{streak} {streak === 1 ? "day" : "days"}</span>
        <span className="text-[10px] font-mono text-slate-400 uppercase">Practice streak</span>
        <p className="text-[10px] text-slate-500">Days in a row with practice saved in this browser.</p>
      </div>
    </div>
  );
};
