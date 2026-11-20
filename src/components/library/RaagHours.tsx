/**
 * The raag's hours on a day strip divided into the eight prahars, starting at
 * 6 AM, with a mark at the current time and a line saying whether this is its
 * time now or how long until it comes round.
 */
import React from "react";
import { useUi } from "../../i18n/ui";
import { inRange, parseTimeRange } from "../../practice/raagTime";

const W = 480, H = 34, TOP = 6, BAR = 12;
const x = (hour: number) => ((((hour - 6) % 24) + 24) % 24) / 24 * W;

/** Hours (rounded up) until `hour` first falls in the range, 0 if it already does. */
export function hoursUntil(range: [number, number], now: Date): number {
  const h = now.getHours() + now.getMinutes() / 60;
  if (inRange(Math.floor(h), range)) return 0;
  return Math.ceil(((range[0] - h) % 24 + 24) % 24);
}

export const RaagHours: React.FC<{ time: string; now?: Date }> = ({ time, now = new Date() }) => {
  const u = useUi();
  const range = parseTimeRange(time);
  if (!range) return null;
  const [s, e] = range;
  const len = ((e - s) % 24 + 24) % 24 || 24;
  const x0 = x(s), x1 = x0 + (len / 24) * W;
  const nowH = now.getHours() + now.getMinutes() / 60;
  const wait = hoursUntil(range, now);
  const segs = x1 <= W ? [[x0, x1]] : [[x0, W], [0, x1 - W]];
  return (
    <figure className="rh">
      <svg viewBox={`0 0 ${W} ${H + 14}`} role="img" aria-label={u("rhAria", time)}>
        <rect x={0} y={TOP} width={W} height={BAR} rx={2} className="rh-day" />
        {Array.from({ length: 7 }, (_, i) => <line key={i} x1={(i + 1) * W / 8} x2={(i + 1) * W / 8} y1={TOP} y2={TOP + BAR} className="rh-tick" />)}
        {segs.map(([a, b], i) => <rect key={i} x={a} y={TOP} width={b - a} height={BAR} rx={2} className="rh-span" />)}
        <line x1={x(nowH)} x2={x(nowH)} y1={2} y2={TOP + BAR + 4} className="rh-now" />
        {[["6", 0], ["12", W / 4], ["18", W / 2], ["0", (3 * W) / 4]].map(([t, px]) => (
          <text key={t} x={Number(px) + 2} y={H + 10} className="rh-label">{u("rhHour", Number(t))}</text>
        ))}
      </svg>
      <figcaption>{wait === 0 ? u("rhNow") : u("rhIn", wait)}</figcaption>
    </figure>
  );
};
