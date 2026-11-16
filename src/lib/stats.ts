/** Simple statistics over the saved practice history. Pure functions, easy to test. */
import type { PracticeRecord } from "./practiceHistory";

/** Local calendar day as "YYYY-MM-DD". */
export function localDay(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Number of consecutive days, ending today (or yesterday, if nothing yet
 * today), on which at least one practice record was saved.
 */
export function practiceStreakDays(records: PracticeRecord[], now = new Date()): number {
  const days = new Set(records.map(r => localDay(new Date(r.dateIso))));
  const cursor = new Date(now);
  if (!days.has(localDay(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(localDay(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Practice minutes per local day for the last `n` days (oldest first). */
export function minutesPerDay(records: PracticeRecord[], n = 7, now = new Date()) {
  const out: { day: string; label: string; minutes: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push({ day: localDay(d), label: d.toLocaleDateString(undefined, { weekday: "short" }), minutes: 0 });
  }
  const index = new Map(out.map((o, i) => [o.day, i]));
  for (const r of records) {
    const i = index.get(localDay(new Date(r.dateIso)));
    if (i === undefined) continue;
    if (r.kind === "riyaz-timer") out[i].minutes += r.minutes;
    else if (r.kind === "analysis" || r.kind === "sa-sadhana") out[i].minutes += r.durationSec / 60;
  }
  return out;
}
