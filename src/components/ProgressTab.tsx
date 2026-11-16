/**
 * Progress: built only from the practice history saved in this browser
 * (analyses, Sa checks and timed riyaz sessions). A new user sees empty
 * charts with an explanation, never sample data.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Bookmark, Compass, Flame, Hourglass } from 'lucide-react';
import { loadHistory, onHistoryChange, type PracticeRecord } from '../lib/practiceHistory';
import { minutesPerDay, practiceStreakDays } from '../lib/stats';
import { centsBetween } from '../analysis/music';

const tooltipStyle = { backgroundColor: '#0F1115', borderColor: '#334155', borderRadius: '12px', fontSize: 11 };
const shortDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });

const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="h-full flex items-center justify-center text-center text-xs text-slate-500 px-6">{children}</div>
);

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="bg-[#151A2E] p-4 rounded-xl border border-slate-800/80 shadow-lg flex items-center gap-4">
    <div className="h-10 w-10 shrink-0 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center text-[#FBBF24]">{icon}</div>
    <div>
      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">{label}</span>
      <span className="text-2xl font-black font-mono text-slate-200">{value}</span>
    </div>
  </div>
);

export const ProgressTab: React.FC = () => {
  const [history, setHistory] = useState<PracticeRecord[]>(() => loadHistory());
  useEffect(() => onHistoryChange(() => setHistory(loadHistory())), []);

  const analyses = useMemo(() => history.filter((r): r is Extract<PracticeRecord, { kind: "analysis" }> => r.kind === "analysis"), [history]);

  const totalMinutes = useMemo(() => history.reduce((s, r) =>
    s + (r.kind === "riyaz-timer" ? r.minutes : r.kind === "analysis" ? r.durationSec / 60 : 0), 0), [history]);
  const streak = practiceStreakDays(history);
  const raags = new Set(analyses.map(a => a.raagId)).size;
  const week = minutesPerDay(history, 7).map(d => ({ ...d, minutes: Number(d.minutes.toFixed(1)) }));

  const accuracy = analyses.slice(-20).map((a, i) => ({
    n: `#${analyses.length - Math.min(20, analyses.length) + i + 1}`,
    date: shortDate(a.dateIso),
    within20: a.heldWithin20CentsPct === null ? null : Number(a.heldWithin20CentsPct.toFixed(1)),
    medianCents: a.medianAbsDeviationCents === null ? null : Number(a.medianAbsDeviationCents.toFixed(1)),
  }));

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={<Hourglass className="h-5 w-5" />} label="Practice time" value={totalMinutes >= 60 ? `${(totalMinutes / 60).toFixed(1)} h` : `${Math.round(totalMinutes)} min`} />
        <Stat icon={<Flame className="h-5 w-5" />} label="Practice streak" value={`${streak} ${streak === 1 ? "day" : "days"}`} />
        <Stat icon={<Bookmark className="h-5 w-5" />} label="Analysed recordings" value={String(analyses.length)} />
        <Stat icon={<Compass className="h-5 w-5" />} label="Raags analysed" value={String(raags)} />
      </div>

      <p className="text-[11px] text-slate-500 px-1">
        Built from what you have saved in this browser: recordings analysed in the Analyzer, Sa checks and timed riyaz sessions.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#151A2E] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
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
                  <Line yAxisId="pct" name="Within ±20 cents (%)" dataKey="within20" stroke="#7C3AED" strokeWidth={2} dot connectNulls={false} />
                  <Line yAxisId="cents" name="Median distance (cents)" dataKey="medianCents" stroke="#38BDF8" strokeWidth={1.5} dot connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-[#151A2E] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
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
                  <Bar name="Minutes" dataKey="minutes" fill="#38BDF8" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-[#151A2E] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
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
                  <Line name="Highest" dataKey="high" stroke="#FBBF24" strokeWidth={2} dot />
                  <Line name="Lowest" dataKey="low" stroke="#38BDF8" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
