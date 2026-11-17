/**
 * The measured pitch over time, drawn on a sargam grid (cents above Sa).
 * Gaps are silence or breath. Nothing is smoothed or invented.
 */
import React, { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { centsBetween } from '../../analysis/music';
import { noteLabel } from '../../analysis/summary';
import type { PitchTrack } from '../../analysis/types';

const MAX_POINTS = 4000;

export interface ContourMark { startSec: number; durSec: number; kind: "flag" | "oscillation" }

export const PitchContour: React.FC<{ track: PitchTrack; saHz: number; allowedSwaras?: number[]; marks?: ContourMark[] }> = ({ track, saHz, allowedSwaras, marks = [] }) => {
  const { data, minC, maxC } = useMemo(() => {
    const step = Math.max(1, Math.ceil(track.frames.length / MAX_POINTS));
    const pts: { t: number; c: number | null }[] = [];
    let minC = Infinity, maxC = -Infinity;
    for (let i = 0; i < track.frames.length; i += step) {
      const f = track.frames[i];
      const c = f.hz === null ? null : centsBetween(f.hz, saHz);
      if (c !== null) { minC = Math.min(minC, c); maxC = Math.max(maxC, c); }
      pts.push({ t: Number(f.timeSec.toFixed(2)), c: c === null ? null : Number(c.toFixed(1)) });
    }
    return { data: pts, minC, maxC };
  }, [track, saHz]);

  if (!Number.isFinite(minC)) return null;

  const lo = Math.floor(minC / 100) * 100 - 100;
  const hi = Math.ceil(maxC / 100) * 100 + 100;
  const allowed = new Set(allowedSwaras ?? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const gridLines: { cents: number; label: string }[] = [];
  for (let c = lo; c <= hi; c += 100) {
    const semi = ((c / 100) % 12 + 12) % 12;
    if (allowed.has(semi)) gridLines.push({ cents: c, label: noteLabel(semi, Math.floor(c / 1200)) });
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="#1e293b" vertical={false} horizontal={false} />
          {gridLines.map(g => (
            <ReferenceLine
              key={g.cents}
              y={g.cents}
              stroke={g.cents % 1200 === 0 ? "#D9B45F" : "#334155"}
              strokeDasharray={g.cents % 1200 === 0 ? undefined : "3 3"}
              label={{ value: g.label, position: "left", fill: "#94a3b8", fontSize: 10 }}
            />
          ))}
          {marks.map((m, i) => (
            <ReferenceArea key={`m${i}`} x1={m.startSec} x2={m.startSec + m.durSec} y1={lo} y2={hi}
              fill={m.kind === "flag" ? "#f43f5e" : "#8CC7BD"} fillOpacity={m.kind === "flag" ? 0.18 : 0.1} ifOverflow="hidden" />
          ))}
          <XAxis dataKey="t" type="number" domain={["dataMin", "dataMax"]} tick={{ fill: "#64748b", fontSize: 10 }} tickFormatter={(v: number) => `${Math.round(v)} s`} />
          <YAxis domain={[lo, hi]} tick={false} width={36} />
          <Tooltip
            contentStyle={{ background: "#062327", border: "1px solid #334155", fontSize: 11 }}
            formatter={(v: any) => [`${v} cents above Sa`, "Pitch"]}
            labelFormatter={(l: any) => `${l} s`}
          />
          <Line type="linear" dataKey="c" stroke="#8CC7BD" dot={false} strokeWidth={1.5} isAnimationActive={false} connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
