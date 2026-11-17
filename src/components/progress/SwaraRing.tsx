/**
 * Where your swaras sit: the twelve swaras around a circle like a tuning
 * dial. Each swara you have held is a dot pushed outward when you sing it
 * sharp and inward when flat (median cents, weighted by held time), with a
 * band showing how much it wavers. If there are enough recordings, a faint
 * dot shows where the swara sat in your earlier recordings, so you can see
 * it move towards the line.
 */
import React, { useMemo } from "react";
import type { PracticeRecord } from "../../lib/practiceHistory";
import { SWARA_SYMBOLS } from "../../analysis/summary";

type Analysis = Extract<PracticeRecord, { kind: "analysis" }>;
const DEVA = ["सा", "रे॒", "रे", "ग॒", "ग", "म", "म॑", "प", "ध॒", "ध", "नि॒", "नि"];
const CX = 260, CY = 260, R = 170, PX_PER_CENT = 1.4, MAX_CENTS = 40;

interface Agg { dev: number; wobble: number; sec: number }

function aggregate(list: Analysis[]): Map<string, Agg> {
  const m = new Map<string, { d: number; w: number; s: number }>();
  for (const a of list) for (const s of a.swaras) {
    if (s.totalHeldSec <= 0) continue;
    const e = m.get(s.symbol) ?? { d: 0, w: 0, s: 0 };
    e.d += s.medianDeviationCents * s.totalHeldSec;
    e.w += s.medianWobbleCents * s.totalHeldSec;
    e.s += s.totalHeldSec;
    m.set(s.symbol, e);
  }
  const out = new Map<string, Agg>();
  for (const [k, e] of m) out.set(k, { dev: e.d / e.s, wobble: e.w / e.s, sec: e.s });
  return out;
}

const pos = (i: number, r: number) => {
  const a = -Math.PI / 2 + (2 * Math.PI * i) / 12;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)] as const;
};

export const SwaraRing: React.FC<{ analyses: Analysis[] }> = ({ analyses }) => {
  const recent = analyses.slice(-5);
  const earlier = analyses.length >= 6 ? analyses.slice(-10, -5) : [];
  const now = useMemo(() => aggregate(recent), [analyses]);
  const then = useMemo(() => aggregate(earlier), [analyses]);
  const r = (cents: number) => R + Math.max(-MAX_CENTS, Math.min(MAX_CENTS, cents)) * PX_PER_CENT;

  return (
    <figure className="sring">
      <svg viewBox="0 0 520 520" className="sring-svg" role="img" aria-label="How sharp or flat each swara sits in your recent recordings">
        <circle cx={CX} cy={CY} r={r(20)} className="sring-band" />
        <circle cx={CX} cy={CY} r={r(-20)} className="sring-band" />
        <circle cx={CX} cy={CY} r={R} className="sring-true" />
        <text x={pos(7.5, r(20) + 12)[0]} y={pos(7.5, r(20) + 12)[1]} className="sring-scale">+20 sharp</text>
        <text x={pos(7.5, r(-20) - 12)[0]} y={pos(7.5, r(-20) - 12)[1]} className="sring-scale">−20 flat</text>
        {SWARA_SYMBOLS.map((sym, i) => {
          const [lx, ly] = pos(i, R + 78);
          const a = now.get(sym);
          const b = then.get(sym);
          const [x, y] = a ? pos(i, r(a.dev)) : pos(i, R);
          const [bx, by] = b ? pos(i, r(b.dev)) : [0, 0];
          const [w0x, w0y] = a ? pos(i, r(a.dev - a.wobble)) : [0, 0];
          const [w1x, w1y] = a ? pos(i, r(a.dev + a.wobble)) : [0, 0];
          const good = a && Math.abs(a.dev) <= 10;
          return (
            <g key={sym}>
              <line x1={pos(i, R - 8)[0]} y1={pos(i, R - 8)[1]} x2={pos(i, R + 8)[0]} y2={pos(i, R + 8)[1]} className="sring-tick" />
              <text x={lx} y={ly + 7} className={`ring-label${a ? " sring-label-on" : ""}`}>{DEVA[i]}</text>
              {a && (
                <>
                  <line x1={w0x} y1={w0y} x2={w1x} y2={w1y} className="sring-wobble" />
                  {b && <><line x1={bx} y1={by} x2={x} y2={y} className="sring-trail" /><circle cx={bx} cy={by} r={4} className="sring-then" /></>}
                  <circle cx={x} cy={y} r={Math.min(13, 5 + Math.sqrt(a.sec))} className={good ? "sring-dot sring-good" : "sring-dot"} />
                  <text x={pos(i, R + 44)[0]} y={pos(i, R + 44)[1] + 5} className="sring-cents">{a.dev > 0 ? "+" : ""}{Math.round(a.dev)}</text>
                </>
              )}
            </g>
          );
        })}
        <text x={CX} y={CY - 6} className="sring-center">{recent.length ? `${recent.length}` : "–"}</text>
        <text x={CX} y={CY + 20} className="sring-center-s">{recent.length === 1 ? "recent recording" : "recent recordings"}</text>
      </svg>
      <figcaption className="sring-cap">
        {recent.length === 0
          ? "Record a take in the Analyzer and your swaras will appear here: outside the circle when sharp, inside when flat."
          : <>Each dot is a swara you held, in cents from its true position (the circle): outside is sharp, inside is flat; the band is ±20 cents.
             The line through a dot shows how much it wavers.{earlier.length ? " Faint dots are your five recordings before these." : ""}</>}
      </figcaption>
    </figure>
  );
};

/** One mark per day for the last eight weeks, sized by minutes practised. */
export const RiyazThread: React.FC<{ days: { day: string; minutes: number }[] }> = ({ days }) => {
  const max = Math.max(30, ...days.map(d => d.minutes));
  return (
    <figure className="thread">
      <div className="thread-row" role="img" aria-label={`Practice on ${days.filter(d => d.minutes > 0).length} of the last ${days.length} days`}>
        {days.map(d => (
          <span key={d.day} className="thread-day" title={`${d.day}: ${Math.round(d.minutes)} min`}>
            <span className="thread-dot" style={{ transform: `scale(${d.minutes > 0 ? 0.35 + 0.65 * Math.min(1, d.minutes / max) : 0.15})`, opacity: d.minutes > 0 ? 1 : 0.35 }} />
          </span>
        ))}
      </div>
      <figcaption className="sring-cap">The last eight weeks, one bead per day; bigger beads are longer riyaz. Today is on the right.</figcaption>
    </figure>
  );
};
