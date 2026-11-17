/**
 * This week against last week, from saved practice only: minutes, days with
 * practice, in-tune share of held notes, longest Sa, and which swaras became
 * steadier or more accurately placed. A swara is compared only when it was
 * held for at least 3 seconds in both weeks.
 */
import type { PracticeRecord } from "./practiceHistory";
import { localDay } from "./stats";

export interface WeekFigures {
  minutes: number;
  days: number;
  takes: number;
  /** Held-time-weighted share within ±20 cents, or null without analyses. */
  inTunePct: number | null;
  longestSaSec: number | null;
}
export interface SwaraChange { symbol: string; before: number; after: number; kind: "wobble" | "placement" }
export interface WeeklyReport { thisWeek: WeekFigures; lastWeek: WeekFigures; steadier: SwaraChange[]; shakier: SwaraChange[] }

const DAY = 86_400_000;
const MIN_SEC = 3;

function figures(rs: PracticeRecord[]): WeekFigures {
  let minutes = 0, takes = 0, w = 0, held = 0, longest: number | null = null;
  const days = new Set<string>();
  for (const r of rs) {
    days.add(localDay(new Date(r.dateIso)));
    if (r.kind === "riyaz-timer") minutes += r.minutes;
    else if (r.kind === "analysis" || r.kind === "sa-sadhana" || r.kind === "palta" || r.kind === "pakad") minutes += r.durationSec / 60;
    if (r.kind === "analysis") {
      takes++;
      const h = r.swaras.reduce((a, s) => a + s.totalHeldSec, 0);
      if (r.heldWithin20CentsPct !== null && h > 0) { w += r.heldWithin20CentsPct * h; held += h; }
    }
    if (r.kind === "sa-sadhana") longest = Math.max(longest ?? 0, r.longestHoldSec);
    if (r.kind === "sa-check") longest = Math.max(longest ?? 0, r.heldSec);
  }
  return { minutes: Math.round(minutes), days: days.size, takes, inTunePct: held > 0 ? Math.round(w / held) : null, longestSaSec: longest };
}

function perSwara(rs: PracticeRecord[]) {
  const m = new Map<string, { sec: number; wob: number; dev: number }>();
  for (const r of rs) {
    if (r.kind !== "analysis") continue;
    for (const s of r.swaras) {
      const e = m.get(s.symbol) ?? { sec: 0, wob: 0, dev: 0 };
      e.sec += s.totalHeldSec;
      e.wob += s.medianWobbleCents * s.totalHeldSec;
      e.dev += Math.abs(s.medianDeviationCents) * s.totalHeldSec;
      m.set(s.symbol, e);
    }
  }
  return m;
}

export function weeklyReport(records: PracticeRecord[], now = new Date()): WeeklyReport {
  const end = now.getTime();
  const inRange = (from: number, to: number) => records.filter(r => { const t = new Date(r.dateIso).getTime(); return t > from && t <= to; });
  const cur = inRange(end - 7 * DAY, end), prev = inRange(end - 14 * DAY, end - 7 * DAY);
  const a = perSwara(prev), b = perSwara(cur);
  const steadier: SwaraChange[] = [], shakier: SwaraChange[] = [];
  for (const [sym, x] of a) {
    const y = b.get(sym);
    if (!y || x.sec < MIN_SEC || y.sec < MIN_SEC) continue;
    const wb = x.wob / x.sec, wa = y.wob / y.sec, db = x.dev / x.sec, da = y.dev / y.sec;
    // a change counts when it is at least 2 cents and 15%
    const better = (o: number, n: number) => o - n >= 2 && n <= o * 0.85;
    if (better(wb, wa)) steadier.push({ symbol: sym, before: Math.round(wb), after: Math.round(wa), kind: "wobble" });
    else if (better(db, da)) steadier.push({ symbol: sym, before: Math.round(db), after: Math.round(da), kind: "placement" });
    else if (better(wa, wb)) shakier.push({ symbol: sym, before: Math.round(wb), after: Math.round(wa), kind: "wobble" });
    else if (better(da, db)) shakier.push({ symbol: sym, before: Math.round(db), after: Math.round(da), kind: "placement" });
  }
  return { thisWeek: figures(cur), lastWeek: figures(prev), steadier, shakier };
}
