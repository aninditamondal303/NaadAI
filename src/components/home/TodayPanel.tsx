/**
 * Home: raags for this time of day, today's riyaz plan built from real
 * measurements, and the real practice streak.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useLang } from '../../i18n/lang';
import { useUi } from '../../i18n/ui';
import { RAAG_LIST } from '../../data/allRaags';
import { loadHistory, onHistoryChange, type PracticeRecord } from '../../lib/practiceHistory';
import { localDay, practiceStreakDays } from '../../lib/stats';
import { buildPlan, type PlanStep } from '../../practice/planner';
import { praharFor, raagsForHour } from '../../practice/raagTime';

interface Props {
  onGo: (step: PlanStep["goTo"]) => void;
  onOpenRaag?: (id: string) => void;
}

const DONE_KEY = "naad.planDone.v1";

function loadDone(): Record<string, boolean> {
  try {
    const raw = JSON.parse(localStorage.getItem(DONE_KEY) || "{}");
    return raw.day === localDay(new Date()) ? raw.done ?? {} : {};
  } catch { return {}; }
}

export const TodayPanel: React.FC<Props> = ({ onGo, onOpenRaag }) => {
  const { t } = useLang();
  const u = useUi();
  const h = t.home;
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
    <section className="rz-today">
      <div className="rz-plan">
        <div className="rz-plan-head">
          <h2 className="rz-h2">{h.plan}</h2>
          <label className="rz-inline">
            <span className="rz-visually-hidden">{h.minutes}</span>
            <select value={minutes} onChange={e => setMinutes(Number(e.target.value))}>
              {[20, 30, 45, 60, 90].map(m => <option key={m} value={m}>{m} {h.minUnit}</option>)}
            </select>
          </label>
        </div>
        {!hasData && <p className="rz-muted rz-small">{h.planEmpty}</p>}
        <div className="rz-progress" aria-hidden="true">
          <span style={{ width: `${(plan.filter(p => done[p.id]).length / Math.max(1, plan.length)) * 100}%` }} />
        </div>
        <p className="rz-progress-label">{u("planDone", plan.filter(p => done[p.id]).length, plan.length)}</p>
        <ol className="rz-steps">
          {plan.map(step => (
            <li key={step.id} data-done={done[step.id] ? "true" : "false"}>
              <label className="rz-check">
                <input type="checkbox" checked={!!done[step.id]} onChange={() => toggle(step.id)}
                  aria-label={done[step.id] ? h.markNotDone : h.markDone} />
              </label>
              <div className="rz-step-body">
                <span className="rz-step-title">{step.title}</span>
                <span className="rz-step-why">{step.reason}</span>
              </div>
              <span className="rz-step-min">{step.minutes} {h.minUnit}</span>
              <button type="button" className="rz-go" onClick={() => onGo(step.goTo)} aria-label={`${h.open}: ${step.title}`}><ChevronRight size={18} aria-hidden /></button>
            </li>
          ))}
        </ol>
      </div>

      <aside className="rz-aside">
        <div>
          <h2 className="rz-h2">{h.nowRaags}</h2>
          <p className="rz-muted rz-small">{t.hour(prahar.number, prahar.name.includes("night"), [])}</p>
          {nowRaags.length === 0 ? (
            <p className="rz-muted">{h.noneNow}</p>
          ) : (
            <ul className="rz-raags">
              {nowRaags.slice(0, 6).map(r => (
                <li key={r.id}>
                  <button type="button" className="rz-raag" onClick={() => onOpenRaag?.(r.id)}>
                    <span className="rz-raag-name">{r.name.replace(/^Raag\s+/i, "")}</span>
                    <span className="rz-raag-aroh">{r.aroha.join(" ")}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="rz-muted rz-small">{h.timesNote}</p>
        </div>
        <div className="rz-streak">
          <span className="rz-streak-n">{h.streak(streak)}</span>
          <span className="rz-muted rz-small">{h.streakNote}</span>
        </div>
      </aside>
    </section>
  );
};
