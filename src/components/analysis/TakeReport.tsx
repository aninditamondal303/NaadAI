/**
 * Shows the measurements of one recording. Every number here comes from
 * src/analysis; anything that couldn't be measured is shown as "–".
 */
import React, { useState } from 'react';
import { CircleCheck, CircleAlert, ImageDown } from 'lucide-react';
import { InfoTip } from '../shell/InfoTip';
import { signedCents, westernNote } from '../../analysis/music';
import { mmss } from '../../analysis/rules';
import type { TakeMeasurements } from '../../analysis/summary';
import type { PitchTrack } from '../../analysis/types';
import { PitchContour } from './PitchContour';
import { FeedbackPanel } from './FeedbackPanel';
import { downloadTakeImage } from '../../lib/takeImage';
import { useLang } from '../../i18n/lang';
import { ListenBack } from './ListenBack';
import { RaagGuessPanel } from './RaagGuessPanel';
import { ShrutiView } from './ShrutiView';
import { ShareTake } from './ShareTake';

const fmtSec = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}m ${Math.round(s % 60)}s` : `${s.toFixed(1)} s`);
const fmtCents = signedCents;

export interface TakeReportProps {
  /** The recording itself, for listening back (kept only in memory). */
  audio?: { samples: Float32Array; sampleRate: number };
  m: TakeMeasurements;
  track: PitchTrack;
  raagName: string;
  allowedSwaras?: number[];
  /** Messages about how Sa was chosen (e.g. detection unsure). */
  saNotes: string[];
}

type ReportTab = "time" | "swaras" | "raag" | "ornaments";

/** Ring gauge for the share of held time in tune. */
const Gauge: React.FC<{ pct: number | null }> = ({ pct }) => {
  const r = 34, c = 2 * Math.PI * r, v = pct === null ? 0 : Math.max(0, Math.min(100, pct));
  return (
    <svg className="tr-gauge" viewBox="0 0 84 84" aria-hidden="true">
      <circle cx="42" cy="42" r={r} className="tr-gauge-bg" />
      <circle cx="42" cy="42" r={r} className="tr-gauge-fg" strokeDasharray={`${(v / 100) * c} ${c}`} transform="rotate(-90 42 42)" />
    </svg>
  );
};

export const TakeReport: React.FC<TakeReportProps> = ({ audio, m, track, raagName, allowedSwaras, saNotes }) => {
  const sa = westernNote(m.saHz);
  const { t } = useLang();
  const outside = m.swaras.filter(s => s.inRaag === false);
  const [tab, setTab] = useState<ReportTab>("time");
  const allowed = allowedSwaras ?? [0, 2, 4, 5, 7, 9, 11];
  const shortRaag = raagName.replace(/^Raag\s+/i, "");
  const tabs: [ReportTab, string][] = [["time", "Over time"], ["swaras", "Swaras"], ["raag", "Raag"], ["ornaments", "Andolan & gamak"]];

  return (
    <div className="tr">
      {saNotes.map((n, i) => <div key={i} className="tr-note">{n}</div>)}

      <section className="tr-summary" aria-label={`Summary, Raag ${shortRaag}`}>
        <div className="tr-sum-main">
          <div className="tr-gauge-wrap">
            <Gauge pct={m.heldWithin20CentsPct} />
            <span className="tr-gauge-n">{m.heldWithin20CentsPct === null ? "–" : `${m.heldWithin20CentsPct.toFixed(0)}%`}</span>
          </div>
          <div>
            <p className="tr-sum-h">Held in tune <InfoTip label="About this number">Share of held-note time within 20 cents of each swara's position. 100 cents make one semitone.</InfoTip></p>
            <p className="tr-sum-sub">Raag {shortRaag}, Sa {sa.name} ({m.saHz.toFixed(1)} Hz, {m.saSource === "profile" ? "your Sa" : "found in this recording"})</p>
            <p className={`tr-chip ${m.ruleFlags.length ? "tr-chip-warn" : "tr-chip-ok"}`}>
              {m.ruleFlags.length ? <CircleAlert size={15} aria-hidden /> : <CircleCheck size={15} aria-hidden />}
              {m.ruleFlags.length ? `${m.ruleFlags.length} held ${m.ruleFlags.length === 1 ? "swara" : "swaras"} outside the raag` : "Every held swara belongs to the raag"}
            </p>
          </div>
        </div>
        <dl className="tr-figs">
          <div><dt>Median distance</dt><dd>{m.medianAbsDeviationCents === null ? "–" : `${m.medianAbsDeviationCents.toFixed(1)}`}<small> cents</small></dd></div>
          <div><dt>Longest phrase</dt><dd>{m.longestPhraseSec === null ? "–" : m.longestPhraseSec.toFixed(1)}<small> s</small></dd></div>
          <div><dt>Held notes</dt><dd>{fmtSec(m.heldSec)}</dd></div>
          <div><dt>Range</dt><dd>{m.lowestNote && m.highestNote ? `${m.lowestNote.label}–${m.highestNote.label}` : "–"}</dd></div>
        </dl>
        <div className="tr-actions">
          <button type="button" className="btn btn-ghost"
            onClick={() => void downloadTakeImage({ m, track, raagName, allowedSwaras: allowed, date: new Date() })}>
            <ImageDown size={16} aria-hidden /> {t.analyzer.saveImage}
          </button>
        </div>
      </section>

      {audio && <ListenBack audio={audio} track={track} saHz={m.saHz} allowedSwaras={allowed} />}

      <section className="tr-detail">
        <div className="az-modes tr-tabs" role="tablist" aria-label="Details">
          {tabs.map(([id, label]) => (
            <button key={id} type="button" role="tab" id={`tr-tab-${id}`} aria-selected={tab === id} aria-controls={`tr-panel-${id}`}
              aria-current={tab === id ? "true" : undefined} onClick={() => setTab(id)}>
              {label}{id === "swaras" && outside.length > 0 ? <span className="tr-dot" aria-label="has swaras outside the raag" /> : null}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`tr-panel-${tab}`} aria-labelledby={`tr-tab-${tab}`} className="tr-panel" key={tab}>
          {tab === "time" && (
            <>
              <p className="tr-h">Pitch over time <InfoTip label="Reading this chart">Measured pitch in cents above Sa. Meends show as smooth curves between swaras; the gold line is Sa; gaps are silence or breath. Red bands mark swaras outside the raag, blue bands measured oscillations.</InfoTip></p>
              <PitchContour track={track} saHz={m.saHz} allowedSwaras={allowedSwaras}
                marks={[...m.ruleFlags.map(f => ({ startSec: f.atSec, durSec: f.durSec, kind: "flag" as const })), ...m.oscillations.map(o => ({ startSec: o.startSec, durSec: o.durSec, kind: "oscillation" as const }))]} />
              <p className="tr-h">Raag rule check <InfoTip label="About the rule check">Only clear holds of 0.4 s or more are flagged. Short touches and passing notes are allowed.</InfoTip></p>
              {m.ruleFlags.length === 0 ? (
                <p className="tr-ok">No swara outside Raag {shortRaag} was held for 0.4 s or longer.</p>
              ) : (
                <ul className="tr-flags">
                  {m.ruleFlags.map((f, i) => <li key={i}><b>{mmss(f.atSec)}</b> {f.name} ({f.label}) held {f.durSec.toFixed(1)} s</li>)}
                </ul>
              )}
              <dl className="tr-mini">
                <div><dt>Recording</dt><dd>{fmtSec(m.durationSec)}</dd></div>
                <div><dt>Clear singing</dt><dd>{fmtSec(m.voicedSec)}</dd></div>
                <div><dt>Phrases</dt><dd>{m.phrases.length}{m.medianPhraseSec === null ? "" : `, typically ${m.medianPhraseSec.toFixed(1)} s`}</dd></div>
              </dl>
            </>
          )}

          {tab === "swaras" && (
            <>
              {m.swaras.length === 0 ? (
                <p className="tr-muted">No note was held for 0.25 s or longer, so there is nothing to measure per swara.</p>
              ) : (
                <div className="tr-table-wrap">
                  <table className="tr-table">
                    <thead><tr><th>Swara</th><th>Held</th><th>Total</th><th>Longest</th><th>Position <InfoTip label="About position">Measured from the equal-tempered position (+ sharp, − flat). Traditional intonation places some swaras a little differently, so a small difference is not necessarily a mistake.</InfoTip></th><th>Wobble</th></tr></thead>
                    <tbody>
                      {m.swaras.map(s => (
                        <tr key={s.swara} data-out={s.inRaag === false || undefined}>
                          <td><b>{s.symbol}</b> {s.name}{s.inRaag === false && <span className="tr-tag">not in raag</span>}</td>
                          <td>{s.heldNotes}×</td>
                          <td>{s.totalHeldSec.toFixed(1)} s</td>
                          <td>{s.longestHoldSec.toFixed(1)} s</td>
                          <td data-far={Math.abs(s.medianDeviationCents) > 15 || undefined}>{fmtCents(s.medianDeviationCents)} c</td>
                          <td>±{s.medianWobbleCents.toFixed(1)} c</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <ShrutiView swaras={m.swaras} />
            </>
          )}

          {tab === "raag" && <RaagGuessPanel heldNotes={m.heldNotes} chosenRaag={raagName} />}

          {tab === "ornaments" && (
            <>
              <p className="tr-h">Oscillations <InfoTip label="About oscillations">Speed is swings per second; width is half the distance between the highest and lowest point. How an ornament should sound is for you and your guru to decide.</InfoTip></p>
              {m.oscillations.length === 0 ? (
                <p className="tr-muted">No regular oscillation (at least two full swings of 20 cents or more) was found.</p>
              ) : (
                <div className="tr-table-wrap">
                  <table className="tr-table">
                    <thead><tr><th>Time</th><th>Around</th><th>Speed</th><th>Width</th><th>Swings</th></tr></thead>
                    <tbody>
                      {m.oscillations.map((o, i) => (
                        <tr key={i}>
                          <td>{mmss(o.startSec)} <span className="tr-muted">({o.durSec.toFixed(1)} s)</span></td>
                          <td><b>{o.centreLabel}</b></td>
                          <td>{o.rateHz.toFixed(1)} Hz <span className="tr-muted">{o.speed === "slow" ? "andolan-like" : "gamak-like"}</span></td>
                          <td>±{o.widthCents.toFixed(0)} c</td>
                          <td>{o.cycles.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <ShareTake m={m} track={track} raagName={raagName} allowedSwaras={allowed} />
      <FeedbackPanel m={m} raagName={raagName} />
    </div>
  );
};
