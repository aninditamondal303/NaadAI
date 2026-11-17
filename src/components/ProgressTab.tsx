/**
 * Progress: built only from the practice history saved in this browser
 * (analyses, Sa checks and timed riyaz sessions). A new user sees empty
 * charts with an explanation, never sample data.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { SwaraRing, RiyazThread } from './progress/SwaraRing';
import { useUi } from '../i18n/ui';
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Bookmark, Compass, Flame, Hourglass } from 'lucide-react';
import { loadHistory, onHistoryChange, type PracticeRecord } from '../lib/practiceHistory';
import { minutesPerDay, practiceStreakDays } from '../lib/stats';
import { centsBetween } from '../analysis/music';

const tooltipStyle = { backgroundColor: '#062327', borderColor: '#334155', borderRadius: '12px', fontSize: 11 };
const shortDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });

const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="h-full flex items-center justify-center text-center text-xs text-slate-500 px-6">{children}</div>
);

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="bg-[#0D3A40] p-4 rounded-xl border border-slate-800/80 shadow-lg flex items-center gap-4">
    <div className="h-10 w-10 shrink-0 rounded-xl bg-[#C9A227]/20 border border-[#C9A227]/30 flex items-center justify-center text-[#D9B45F]">{icon}</div>
    <div>
      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">{label}</span>
      <span className="text-2xl font-black font-mono text-slate-200">{value}</span>
    </div>
  </div>
);

export const ProgressTab: React.FC = () => {
  const u = useUi();
  const [history, setHistory] = useState<PracticeRecord[]>(() => loadHistory());
  useEffect(() => onHistoryChange(() => setHistory(loadHistory())), []);

  const analyses = useMemo(() => history.filter((r): r is Extract<PracticeRecord, { kind: "analysis" }> => r.kind === "analysis"), [history]);

  const totalMinutes = useMemo(() => history.reduce((s, r) =>
    s + (r.kind === "riyaz-timer" ? r.minutes : "durationSec" in r ? r.durationSec / 60 : 0), 0), [history]);
  const streak = practiceStreakDays(history);
  const raags = new Set(analyses.map(a => a.raagId)).size;
  const week = minutesPerDay(history, 7).map(d => ({ ...d, minutes: Number(d.minutes.toFixed(1)) }));

  const accuracy = analyses.slice(-20).map((a, i) => ({
    n: `#${analyses.length - Math.min(20, analyses.length) + i + 1}`,
    date: shortDate(a.dateIso),
    within20: a.heldWithin20CentsPct === null ? null : Number(a.heldWithin20CentsPct.toFixed(1)),
    medianCents: a.medianAbsDeviationCents === null ? null : Number(a.medianAbsDeviationCents.toFixed(1)),
  }));

  const sadhana = history
    .filter((r): r is Extract<PracticeRecord, { kind: "sa-sadhana" }> => r.kind === "sa-sadhana")
    .slice(-20)
    .map(r => ({ date: shortDate(r.dateIso), hold: Number(r.longestHoldSec.toFixed(1)), wobble: Number(r.wobbleCents.toFixed(1)) }));

  const breath = analyses
    .filter(a => typeof a.longestPhraseSec === "number")
    .slice(-20)
    .map(a => ({ date: shortDate(a.dateIso), longest: Number(a.longestPhraseSec!.toFixed(1)), typical: a.medianPhraseSec == null ? null : Number(a.medianPhraseSec.toFixed(1)) }));

  // Highest clean speed (score >= 85) per palta / pakad, with the date it was first reached
  const ladder = useMemo(() => {
    const map = new Map<string, { raag: string; exercise: string; speed: number; date: string; attempts: number }>();
    for (const r of history) {
      if (r.kind !== "palta" && r.kind !== "pakad") continue;
      const key = `${r.raagId}:${r.exerciseId}`;
      const e = map.get(key) ?? { raag: r.raagName, exercise: r.exerciseName, speed: 0, date: "", attempts: 0 };
      e.attempts++;
      if (r.score >= 85 && r.speed > e.speed) { e.speed = r.speed; e.date = shortDate(r.dateIso); }
      map.set(key, e);
    }
    return [...map.values()].sort((a, b) => a.raag.localeCompare(b.raag) || a.exercise.localeCompare(b.exercise));
  }, [history]);
  const SPEEDS = ["–", "Thah", "Dugun", "Tigun", "Chaugun"];

  // Range in cents relative to each session's Sa, so different Sa values compare fairly.
  const range = analyses.filter(a => a.lowest && a.highest).slice(-20).map((a, i) => ({
    n: `#${i + 1}`,
    date: shortDate(a.dateIso),
    low: Number((centsBetween(a.lowest!.hz, a.saHz) / 100).toFixed(1)),
    high: Number((centsBetween(a.highest!.hz, a.saHz) / 100).toFixed(1)),
    lowLabel: a.lowest!.label,
    highLabel: a.highest!.label,
  }));

  return (
    <div className="space-y-6">
      <header className="pg-head">
        <h1 className="pg-title">{u("progressTitle")}</h1>
        <p className="pg-figures">
          <span><b>{totalMinutes >= 60 ? `${(totalMinutes / 60).toFixed(1)} h` : `${Math.round(totalMinutes)} min`}</b> {u("ofRiyaz")}</span>
          <span><b>{streak}</b> {u("daysInRow", streak)}</span>
          <span><b>{analyses.length}</b> {u("recordingsAnalysed")}</span>
          <span><b>{raags}</b> {u("raagsCount", raags)}</span>
        </p>
      </header>
      <section className="pg-hero">
        <SwaraRing analyses={analyses} />
        <RiyazThread days={minutesPerDay(history, 56)} />
      </section>
      <div className="hidden">
        <Stat icon={<Hourglass className="h-5 w-5" />} label="Practice time" value={totalMinutes >= 60 ? `${(totalMinutes / 60).toFixed(1)} h` : totalMinutes >= 1 ? `${Math.round(totalMinutes)} min` : `${Math.round(totalMinutes * 60)} s`} />
        <Stat icon={<Flame className="h-5 w-5" />} label="Practice streak" value={`${streak} ${streak === 1 ? "day" : "days"}`} />
        <Stat icon={<Bookmark className="h-5 w-5" />} label="Analysed recordings" value={String(analyses.length)} />
        <Stat icon={<Compass className="h-5 w-5" />} label="Raags analysed" value={String(raags)} />
      </div>

      <p className="text-[11px] text-slate-500 px-1">
        Built from what you have saved in this browser: recordings analysed in the Analyzer, Sa checks, Sa sadhana, paltas and timed riyaz sessions.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#0D3A40] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-200">Swara accuracy per recording</h4>
            <span className="text-[10px] font-mono text-slate-500">Held-note time within ±20 cents (%) and median distance from the swara (cents), last 20 recordings</span>
          </div>
          <div className="h-56">
            {accuracy.length === 0 ? <Empty>Analyse a recording in the Analyzer to see your swara accuracy here.</Empty> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={accuracy} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} />
                  <YAxis yAxisId="pct" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} />
                  <YAxis yAxisId="cents" orientation="right" tick={{ fill: '#64748b', fontSize: 9 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line yAxisId="pct" name="Within ±20 cents (%)" dataKey="within20" stroke="#C9A227" strokeWidth={2} dot connectNulls={false} />
                  <Line yAxisId="cents" name="Median distance (cents)" dataKey="medianCents" stroke="#8CC7BD" strokeWidth={1.5} dot connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-[#0D3A40] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-200">Practice time, last 7 days</h4>
            <span className="text-[10px] font-mono text-slate-500">Minutes from timed riyaz sessions and analysed recordings</span>
          </div>
          <div className="h-56">
            {totalMinutes === 0 ? <Empty>Start a timed riyaz on the Home tab or analyse a recording to log practice time.</Empty> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={week} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 9 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar name="Minutes" dataKey="minutes" fill="#8CC7BD" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-[#0D3A40] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-200">Sa sadhana</h4>
            <span className="text-[10px] font-mono text-slate-500">Longest steady hold of Sa (s) and its wobble (cents), last 20 sessions</span>
          </div>
          <div className="h-56">
            {sadhana.length === 0 ? <Empty>Use "Sa sadhana" in the Analyzer to track how long and how steadily you hold Sa.</Empty> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sadhana} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} />
                  <YAxis yAxisId="s" tick={{ fill: '#64748b', fontSize: 9 }} />
                  <YAxis yAxisId="c" orientation="right" tick={{ fill: '#64748b', fontSize: 9 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line yAxisId="s" name="Longest hold (s)" dataKey="hold" stroke="#D9B45F" strokeWidth={2} dot />
                  <Line yAxisId="c" name="Wobble (cents)" dataKey="wobble" stroke="#8CC7BD" strokeWidth={1.5} dot />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-[#0D3A40] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-200">Breath per phrase</h4>
            <span className="text-[10px] font-mono text-slate-500">Longest and typical phrase between breaths (s), per analysed recording</span>
          </div>
          <div className="h-56">
            {breath.length === 0 ? <Empty>Analyse a recording to see how long your phrases are between breaths.</Empty> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={breath} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 9 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line name="Longest phrase (s)" dataKey="longest" stroke="#C9A227" strokeWidth={2} dot />
                  <Line name="Typical phrase (s)" dataKey="typical" stroke="#8CC7BD" strokeWidth={1.5} dot connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-[#0D3A40] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
          <div>
            <h4 className="text-sm font-bold text-slate-200">Laya ladder</h4>
            <span className="text-[10px] font-mono text-slate-500">Highest speed sung cleanly (score 85+) for each palta and pakad</span>
          </div>
          {ladder.length === 0 ? <p className="text-xs text-slate-500">Practise a palta in the Paltas tab to start your laya ladder.</p> : (
            <div className="overflow-x-auto"><table className="w-full text-xs font-mono whitespace-nowrap">
              <thead><tr className="text-[9px] uppercase tracking-widest text-slate-500 text-left"><th className="py-1.5">Raag</th><th>Exercise</th><th>Highest clean speed</th><th>Reached</th><th>Attempts</th></tr></thead>
              <tbody>
                {ladder.map(l => (
                  <tr key={l.raag + l.exercise} className="border-t border-slate-800 text-slate-200">
                    <td className="py-1.5">{l.raag}</td><td>{l.exercise}</td><td>{SPEEDS[l.speed]}</td><td>{l.date || "–"}</td><td>{l.attempts}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>

        <div className="lg:col-span-2 bg-[#0D3A40] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-200">Range of held notes</h4>
            <span className="text-[10px] font-mono text-slate-500">Lowest and highest held note per recording, in semitones from Sa (0 = Sa, 12 = taar Sa, −5 = mandra Pa)</span>
          </div>
          <div className="h-48">
            {range.length === 0 ? <Empty>Your range will appear here after you analyse recordings with held notes.</Empty> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={range} margin={{ left: -20, right: 15, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 9 }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: any, name: any, p: any) => [`${v} (${name === "Highest" ? p.payload.highLabel : p.payload.lowLabel})`, name]}
                  />
                  <Line name="Highest" dataKey="high" stroke="#D9B45F" strokeWidth={2} dot />
                  <Line name="Lowest" dataKey="low" stroke="#8CC7BD" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
