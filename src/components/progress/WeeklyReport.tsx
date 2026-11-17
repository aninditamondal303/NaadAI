/** This week against last week, from saved practice. */
import React, { useMemo } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { PracticeRecord } from "../../lib/practiceHistory";
import { weeklyReport, type WeekFigures } from "../../lib/weekly";
import { useUi } from "../../i18n/ui";

const Delta: React.FC<{ now: number | null; before: number | null; unit?: string; higherIsBetter?: boolean }> = ({ now, before, unit = "", higherIsBetter = true }) => {
  if (now === null || before === null || now === before) return null;
  const up = now > before;
  const good = up === higherIsBetter;
  return (
    <span className={`wk-delta ${good ? "wk-good" : "wk-bad"}`}>
      {up ? <TrendingUp size={13} aria-hidden /> : <TrendingDown size={13} aria-hidden />}
      {up ? "+" : "−"}{Math.abs(Math.round((now - before) * 10) / 10)}{unit}
    </span>
  );
};

export const WeeklyReport: React.FC<{ history: PracticeRecord[] }> = ({ history }) => {
  const u = useUi();
  const r = useMemo(() => weeklyReport(history), [history]);
  const t: WeekFigures = r.thisWeek, l: WeekFigures = r.lastWeek;
  if (t.minutes === 0 && l.minutes === 0 && t.takes === 0 && l.takes === 0) return null;
  const cell = (label: string, value: React.ReactNode, delta: React.ReactNode, sub?: string) => (
    <div className="wk-cell">
      <span className="wk-label">{label}</span>
      <span className="wk-value">{value}{delta}</span>
      {sub && <span className="wk-sub">{sub}</span>}
    </div>
  );
  return (
    <section className="wk" aria-labelledby="wk-h">
      <h2 id="wk-h" className="rz-h2">{u("wkTitle")}</h2>
      <div className="wk-grid">
        {cell(u("wkMinutes"), t.minutes, <Delta now={t.minutes} before={l.minutes} />, u("wkLast", String(l.minutes)))}
        {cell(u("wkDays"), `${t.days}/7`, <Delta now={t.days} before={l.days} />, u("wkLast", String(l.days)))}
        {cell(u("wkInTune"), t.inTunePct === null ? "–" : `${t.inTunePct}%`, <Delta now={t.inTunePct} before={l.inTunePct} unit="%" />, l.inTunePct === null ? undefined : u("wkLast", `${l.inTunePct}%`))}
        {cell(u("wkSa"), t.longestSaSec === null ? "–" : `${t.longestSaSec.toFixed(1)} s`, <Delta now={t.longestSaSec} before={l.longestSaSec} unit=" s" />, l.longestSaSec === null ? undefined : u("wkLast", `${l.longestSaSec.toFixed(1)} s`))}
      </div>
      {(r.steadier.length > 0 || r.shakier.length > 0) && (
        <ul className="wk-swaras">
          {r.steadier.map(s => <li key={s.symbol} className="wk-good"><TrendingUp size={14} aria-hidden /> {u(s.kind === "wobble" ? "wkSteadier" : "wkCloser", s.symbol, s.before, s.after)}</li>)}
          {r.shakier.map(s => <li key={s.symbol} className="wk-bad"><TrendingDown size={14} aria-hidden /> {u(s.kind === "wobble" ? "wkShakier" : "wkFurther", s.symbol, s.before, s.after)}</li>)}
        </ul>
      )}
    </section>
  );
};
