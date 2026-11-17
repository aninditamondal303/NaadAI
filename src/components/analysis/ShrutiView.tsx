/**
 * Shruti view: where each held swara sits between the keyboard (equal
 * temperament) position and the natural (just-intonation) position that a
 * tanpura's harmonics suggest. Measurements only; which is "right" depends
 * on the raag and the tradition (for example ati-komal Ga in Darbari).
 */
import React from "react";
import type { SwaraStats } from "../../analysis/summary";

/** Just-intonation ratio for each swara and its distance from equal temperament (cents). */
const JUST: { ratio: string; cents: number }[] = [
  { ratio: "1/1", cents: 0 }, { ratio: "16/15", cents: 11.7 }, { ratio: "9/8", cents: 3.9 }, { ratio: "6/5", cents: 15.6 },
  { ratio: "5/4", cents: -13.7 }, { ratio: "4/3", cents: -2.0 }, { ratio: "45/32", cents: -9.8 }, { ratio: "3/2", cents: 2.0 },
  { ratio: "8/5", cents: 13.7 }, { ratio: "5/3", cents: -15.6 }, { ratio: "9/5", cents: 17.6 }, { ratio: "15/8", cents: -11.7 },
];
const RANGE = 40;
const x = (c: number) => `${50 + (Math.max(-RANGE, Math.min(RANGE, c)) / RANGE) * 50}%`;

export const ShrutiView: React.FC<{ swaras: SwaraStats[] }> = ({ swaras }) => {
  const shown = swaras.filter(s => s.totalHeldSec >= 0.5).sort((a, b) => a.swara - b.swara);
  if (shown.length === 0) return null;
  return (
    <section className="sh">
      <h3 className="rg-h">Shruti view</h3>
      <p className="rg-muted">
        Each line spans 40 cents flat to 40 cents sharp of the keyboard note (|). The ring is the natural position from simple ratios,
        which a tanpura's overtones point to; the dot is where you held the swara.
      </p>
      <div className="sh-rows">
        {shown.map(s => {
          const j = JUST[s.swara];
          const you = s.medianDeviationCents;
          const nearer = Math.abs(you - j.cents) < Math.abs(you) ? "natural" : "keyboard";
          return (
            <div key={s.swara} className="sh-row">
              <span className="sh-name">{s.name}</span>
              <div className="sh-line" role="img" aria-label={`${s.name}: ${you > 0 ? "+" : ""}${you.toFixed(0)} cents; natural position ${j.cents > 0 ? "+" : ""}${j.cents} cents`}>
                <span className="sh-et" style={{ left: "50%" }} />
                {s.swara !== 0 && <span className="sh-just" style={{ left: x(j.cents) }} title={`natural ${j.ratio}`} />}
                <span className="sh-you" style={{ left: x(you) }} />
              </div>
              <span className="sh-num">
                {you > 0 ? "+" : ""}{you.toFixed(0)} cents{s.swara !== 0 && <>, nearer the {nearer} {s.name}</>}
              </span>
            </div>
          );
        })}
      </div>
      <p className="rg-muted">Traditions differ: some raags want a swara higher or lower than either mark. Use this to notice, then ask your guru.</p>
    </section>
  );
};
