/**
 * Samay chakra: the raags placed on a 24-hour clock by the hours listed for
 * them in the raag library. Each raag is an arc over its hours, stacked in
 * lanes so they don't overlap; the hand points at the visitor's current
 * time. Selecting an arc opens the raag.
 */
import React, { useMemo, useState } from "react";
import type { ComprehensiveRaag } from "../../data/allRaags";
import { parseTimeRange } from "../../practice/raagTime";

interface Placed { raag: ComprehensiveRaag; start: number; end: number; lane: number }

const CX = 300, CY = 300, R0 = 118, LANE = 15;

function place(raags: ComprehensiveRaag[]): { placed: Placed[]; lanes: number } {
  const items = raags
    .map(r => ({ r, range: parseTimeRange(r.time) }))
    .filter((x): x is { r: ComprehensiveRaag; range: [number, number] } => x.range !== null)
    .map(({ r, range: [s, e] }) => ({ raag: r, start: s, end: e <= s ? e + 24 : e }))
    .sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const laneEnds: [number, number][][] = [];
  const placed: Placed[] = [];
  const overlaps = (a0: number, a1: number, b0: number, b1: number) => {
    // compare on the circle (ranges may pass midnight)
    for (const shift of [-24, 0, 24]) if (a0 < b1 + shift && b0 + shift < a1) return true;
    return false;
  };
  for (const it of items) {
    let lane = 0;
    while (laneEnds[lane]?.some(([s, e]) => overlaps(it.start, it.end, s, e))) lane++;
    (laneEnds[lane] ??= []).push([it.start, it.end]);
    placed.push({ ...it, lane });
  }
  return { placed, lanes: laneEnds.length };
}

const angle = (h: number) => -Math.PI / 2 + (2 * Math.PI * h) / 24; // midnight at the top
const pt = (h: number, r: number) => [CX + r * Math.cos(angle(h)), CY + r * Math.sin(angle(h))] as const;

function arc(h0: number, h1: number, r: number): string {
  const [x0, y0] = pt(h0, r);
  const [x1, y1] = pt(h1, r);
  const large = h1 - h0 > 12 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

const HOUR_LABEL = (h: number) => (h === 0 ? "midnight" : h === 12 ? "noon" : h < 12 ? `${h} am` : `${h - 12} pm`);
const SKY_BANDS: [number, number, string][] = [
  [4, 8, "rgba(222,150,140,0.10)"], [8, 16, "rgba(175,196,211,0.08)"], [16, 20, "rgba(160,84,106,0.12)"],
];

export const SamayChakra: React.FC<{ raags: ComprehensiveRaag[]; onOpen: (r: ComprehensiveRaag) => void }> = ({ raags, onOpen }) => {
  const { placed, lanes } = useMemo(() => place(raags), [raags]);
  const [hover, setHover] = useState<Placed | null>(null);
  const now = new Date();
  const nowH = now.getHours() + now.getMinutes() / 60;
  const outer = R0 + lanes * LANE + 8;
  const [hx, hy] = pt(nowH, outer + 10);
  const nowRaags = placed.filter(p => [nowH, nowH + 24].some(h => h >= p.start && h < p.end));
  const shown = hover ?? null;

  return (
    <div className="sc">
      <svg viewBox="0 0 600 600" className="sc-svg" role="group" aria-label="Raags by the hour of the day">
        {SKY_BANDS.map(([a, b, c]) => <path key={a} d={arc(a, b, (R0 + outer) / 2)} stroke={c} strokeWidth={outer - R0 + 10} fill="none" />)}
        <circle cx={CX} cy={CY} r={R0 - 6} className="sc-inner" />
        {Array.from({ length: 24 }, (_, h) => {
          const [x0, y0] = pt(h, outer + 2);
          const [x1, y1] = pt(h, outer + (h % 3 === 0 ? 12 : 6));
          const [lx, ly] = pt(h, outer + 28);
          return (
            <g key={h}>
              <line x1={x0} y1={y0} x2={x1} y2={y1} className="sc-tick" />
              {h % 3 === 0 && <text x={lx} y={ly + 4} className="sc-hour">{HOUR_LABEL(h)}</text>}
            </g>
          );
        })}
        {placed.map(p => {
          const r = R0 + p.lane * LANE + LANE / 2;
          const active = nowRaags.includes(p);
          const isHover = hover === p;
          return (
            <path key={p.raag.id} d={arc(p.start + 0.08, p.end - 0.08, r)}
              className={`sc-arc${active ? " sc-now" : ""}${isHover ? " sc-hover" : ""}`}
              tabIndex={0} role="button" aria-label={`${p.raag.name.replace(/^Raag\s+/i, "")}, ${p.raag.time}`}
              onMouseEnter={() => setHover(p)} onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(p)} onBlur={() => setHover(null)}
              onClick={() => onOpen(p.raag)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(p.raag); } }} />
          );
        })}
        <line x1={pt(nowH, R0 - 6)[0]} y1={pt(nowH, R0 - 6)[1]} x2={hx} y2={hy} className="sc-hand" />
        <circle cx={hx} cy={hy} r={4} className="sc-hand-dot" />
        <text x={CX} y={CY - 18} className="sc-center-big">
          {shown ? shown.raag.name.replace(/^Raag\s+/i, "").replace(/\s*\(.*\)/, "") : `${nowRaags.length}`}
        </text>
        <text x={CX} y={CY + 10} className="sc-center-small">
          {shown ? shown.raag.time.replace(/\s*\(.*\)/, "") : nowRaags.length === 1 ? "raag for this hour" : "raags for this hour"}
        </text>
        <text x={CX} y={CY + 32} className="sc-center-small sc-center-aroh">
          {shown ? shown.raag.aroha.join(" ") : now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </text>
      </svg>
      <p className="sc-note">
        Each arc is a raag, over the hours given for it in the raag library; the hand is your time now. Traditions differ on exact hours,
        and {raags.length - placed.length} raags have no clock time listed, so they are only in the index below.
      </p>
    </div>
  );
};
