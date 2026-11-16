/**
 * Shows the measurements of one recording. Every number here comes from
 * src/analysis; anything that couldn't be measured is shown as "–".
 */
import React from 'react';
import { signedCents, westernNote } from '../../analysis/music';
import type { TakeMeasurements } from '../../analysis/summary';
import type { PitchTrack } from '../../analysis/types';
import { PitchContour } from './PitchContour';
import { FeedbackPanel } from './FeedbackPanel';

const fmtSec = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}m ${Math.round(s % 60)}s` : `${s.toFixed(1)} s`);
const fmtCents = signedCents;

const Stat: React.FC<{ label: string; value: string; note?: string }> = ({ label, value, note }) => (
  <div className="bg-[#0F1115]/60 p-4 rounded-xl border border-slate-800 space-y-1">
    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">{label}</span>
    <span className="text-lg font-black text-slate-100 block font-mono">{value}</span>
    {note && <span className="text-[10px] text-slate-500 block leading-snug">{note}</span>}
  </div>
);

export interface TakeReportProps {
  m: TakeMeasurements;
  track: PitchTrack;
  raagName: string;
  allowedSwaras?: number[];
  /** Messages about how Sa was chosen (e.g. detection unsure). */
  saNotes: string[];
}

export const TakeReport: React.FC<TakeReportProps> = ({ m, track, raagName, allowedSwaras, saNotes }) => {
  const sa = westernNote(m.saHz);
  const outside = m.swaras.filter(s => s.inRaag === false);

  return (
    <div className="space-y-5">
      {saNotes.map((n, i) => (
        <div key={i} className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 text-xs">{n}</div>
      ))}

      <div className="bg-[#151A2E] p-5 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-xs font-mono font-bold text-[#FBBF24] uppercase tracking-widest">Measurements · Raag {raagName}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Stat
            label="Sa used"
            value={`${m.saHz.toFixed(1)} Hz`}
            note={`${sa.name} ${fmtCents(sa.cents)} cents · ${m.saSource === "profile" ? "your Sa" : "detected from this recording"}`}
          />
          <Stat label="Recording" value={fmtSec(m.durationSec)} note={`Singing (clear pitch): ${fmtSec(m.voicedSec)}`} />
          <Stat label="Held notes" value={fmtSec(m.heldSec)} note="Time spent on one swara for at least 0.25 s" />
          <Stat
            label="Held within ±20 cents"
            value={m.heldWithin20CentsPct === null ? "–" : `${m.heldWithin20CentsPct.toFixed(0)}%`}
            note="Share of held-note time within 20 cents of the swara position"
          />
          <Stat
            label="Median distance from swara"
            value={m.medianAbsDeviationCents === null ? "–" : `${m.medianAbsDeviationCents.toFixed(1)} cents`}
            note="100 cents = one semitone"
          />
          <Stat
            label="Range (held notes)"
            value={m.lowestNote && m.highestNote ? `${m.lowestNote.label} – ${m.highestNote.label}` : "–"}
            note={m.lowestNote && m.highestNote ? `${m.lowestNote.hz.toFixed(0)} – ${m.highestNote.hz.toFixed(0)} Hz` : undefined}
          />
        </div>
      </div>

      <div className="bg-[#151A2E] p-5 rounded-2xl border border-slate-800 space-y-2">
        <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">Pitch over time</h3>
        <p className="text-[11px] text-slate-500">Measured pitch in cents above Sa. Lines show the raag's swaras; the gold line is Sa. Gaps are silence or breath.</p>
        <PitchContour track={track} saHz={m.saHz} allowedSwaras={allowedSwaras} />
      </div>

      <div className="bg-[#151A2E] p-5 rounded-2xl border border-slate-800 space-y-3">
        <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">Swaras you held</h3>
        {m.swaras.length === 0 ? (
          <p className="text-xs text-slate-400">No note was held for 0.25 s or longer, so there is nothing to measure per swara.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-[9px] uppercase tracking-widest text-slate-500 text-left">
                  <th className="py-2 pr-3">Swara</th>
                  <th className="py-2 pr-3">Times held</th>
                  <th className="py-2 pr-3">Total</th>
                  <th className="py-2 pr-3">Longest</th>
                  <th className="py-2 pr-3">Median position</th>
                  <th className="py-2 pr-3">Wobble</th>
                </tr>
              </thead>
              <tbody>
                {m.swaras.map(s => (
                  <tr key={s.swara} className={`border-t border-slate-800 ${s.inRaag === false ? "text-rose-300" : "text-slate-200"}`}>
                    <td className="py-2 pr-3 font-bold">
                      {s.symbol} <span className="font-sans font-normal text-slate-400">{s.name}</span>
                      {s.inRaag === false && <span className="ml-2 text-[9px] uppercase text-rose-400">not in raag</span>}
                    </td>
                    <td className="py-2 pr-3">{s.heldNotes}</td>
                    <td className="py-2 pr-3">{s.totalHeldSec.toFixed(1)} s</td>
                    <td className="py-2 pr-3">{s.longestHoldSec.toFixed(1)} s</td>
                    <td className="py-2 pr-3">{fmtCents(s.medianDeviationCents)} cents</td>
                    <td className="py-2 pr-3">±{s.medianWobbleCents.toFixed(1)} cents</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[10px] text-slate-500 leading-relaxed">
          "Median position" is measured from the equal-tempered position of each swara (+ = sharp, − = flat).
          Traditional intonation places some swaras a little differently (for example Ga is often a little lower),
          so a small difference is not necessarily a mistake. "Wobble" is how much a held note moved around its own centre.
          {outside.length > 0 && ` Swaras marked "not in raag" are not in this app's swara list for Raag ${raagName}.`}
        </p>
      </div>

      <FeedbackPanel m={m} raagName={raagName} />
    </div>
  );
};
