/**
 * Shows the measurements of one recording. Every number here comes from
 * src/analysis; anything that couldn't be measured is shown as "–".
 */
import React, { useState } from 'react';
import { CircleCheck, CircleAlert, ImageDown } from 'lucide-react';
import { InfoTip } from '../shell/InfoTip';
import { useUi } from '../../i18n/ui';
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
  const u = useUi();
  const outside = m.swaras.filter(s => s.inRaag === false);
  const [tab, setTab] = useState<ReportTab>("time");
  const allowed = allowedSwaras ?? [0, 2, 4, 5, 7, 9, 11];
  const shortRaag = raagName.replace(/^Raag\s+/i, "");
  const tabs: [ReportTab, string][] = [["time", u("trOverTime")], ["swaras", u("trSwaras")], ["raag", u("trRaag")], ["ornaments", u("trOrnaments")]];

  return (
    <div className="tr">
      {saNotes.map((n, i) => <div key={i} className="tr-note">{n}</div>)}

      <section className="tr-summary" aria-label={u("trSummary", shortRaag)}>
        <div className="tr-sum-main">
          <div className="tr-gauge-wrap">
            <Gauge pct={m.heldWithin20CentsPct} />
            <span className="tr-gauge-n">{m.heldWithin20CentsPct === null ? "–" : `${m.heldWithin20CentsPct.toFixed(0)}%`}</span>
          </div>
          <div>
            <p className="tr-sum-h">{u("trHeldInTune")} <InfoTip label={u("trAboutNumber")}>{u("trInTuneTip")}</InfoTip></p>
            <p className="tr-sum-sub">Raag {shortRaag}, Sa {sa.name} ({m.saHz.toFixed(1)} Hz, {m.saSource === "profile" ? u("trYourSa") : u("trFoundSa")})</p>
            <p className={`tr-chip ${m.ruleFlags.length ? "tr-chip-warn" : "tr-chip-ok"}`}>
              {m.ruleFlags.length ? <CircleAlert size={15} aria-hidden /> : <CircleCheck size={15} aria-hidden />}
              {m.ruleFlags.length ? u("trOutside", m.ruleFlags.length) : u("trAllIn")}
            </p>
          </div>
        </div>
        <dl className="tr-figs">
          <div><dt>{u("trMedian")}</dt><dd>{m.medianAbsDeviationCents === null ? "–" : `${m.medianAbsDeviationCents.toFixed(1)}`}<small> cents</small></dd></div>
          <div><dt>{u("trLongest")}</dt><dd>{m.longestPhraseSec === null ? "–" : m.longestPhraseSec.toFixed(1)}<small> s</small></dd></div>
          <div><dt>{u("trHeldNotes")}</dt><dd>{fmtSec(m.heldSec)}</dd></div>
          <div><dt>{u("trRange")}</dt><dd>{m.lowestNote && m.highestNote ? `${m.lowestNote.label}–${m.highestNote.label}` : "–"}</dd></div>
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
        <div className="az-modes tr-tabs" role="tablist" aria-label={u("trDetails")}>
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
              <p className="tr-h">{u("trPitchOverTime")} <InfoTip label={u("trReadChart")}>{u("trChartTip")}</InfoTip></p>
              <PitchContour track={track} saHz={m.saHz} allowedSwaras={allowedSwaras}
                marks={[...m.ruleFlags.map(f => ({ startSec: f.atSec, durSec: f.durSec, kind: "flag" as const })), ...m.oscillations.map(o => ({ startSec: o.startSec, durSec: o.durSec, kind: "oscillation" as const }))]} />
              <p className="tr-h">{u("trRuleCheck")} <InfoTip label={u("trRuleCheck")}>{u("trRuleTip")}</InfoTip></p>
              {m.ruleFlags.length === 0 ? (
                <p className="tr-ok">{u("trNoneOutside", shortRaag)}</p>
              ) : (
                <ul className="tr-flags">
                  {m.ruleFlags.map((f, i) => <li key={i}><b>{mmss(f.atSec)}</b> {f.name} ({f.label}) {u("trHeldFor", f.durSec.toFixed(1))}</li>)}
                </ul>
              )}
              <dl className="tr-mini">
                <div><dt>{u("trRecording")}</dt><dd>{fmtSec(m.durationSec)}</dd></div>
                <div><dt>{u("trClear")}</dt><dd>{fmtSec(m.voicedSec)}</dd></div>
                <div><dt>{u("trPhrases")}</dt><dd>{m.phrases.length}{m.medianPhraseSec === null ? "" : `, ${u("trTypically", m.medianPhraseSec.toFixed(1))}`}</dd></div>
              </dl>
            </>
          )}

          {tab === "swaras" && (
            <>
              {m.swaras.length === 0 ? (
                <p className="tr-muted">{u("trNothingHeld")}</p>
              ) : (
                <div className="tr-table-wrap">
                  <table className="tr-table">
                    <thead><tr><th>{u("trSwaras")}</th><th>{u("trColHeld")}</th><th>{u("trColTotal")}</th><th>{u("trColLongest")}</th><th>{u("trColPos")} <InfoTip label={u("trColPos")}>{u("trPosTip")}</InfoTip></th><th>{u("trColWobble")}</th></tr></thead>
                    <tbody>
                      {m.swaras.map(s => (
                        <tr key={s.swara} data-out={s.inRaag === false || undefined}>
                          <td><b>{s.symbol}</b> {s.name}{s.inRaag === false && <span className="tr-tag">{u("trNotInRaag")}</span>}</td>
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
              <p className="tr-h">{u("trOsc")} <InfoTip label={u("trOsc")}>{u("trOscTip")}</InfoTip></p>
              {m.oscillations.length === 0 ? (
                <p className="tr-muted">{u("trNoOsc")}</p>
              ) : (
                <div className="tr-table-wrap">
                  <table className="tr-table">
                    <thead><tr><th>{u("trColTime")}</th><th>{u("trColAround")}</th><th>{u("trColSpeed")}</th><th>{u("trColWidth")}</th><th>{u("trColSwings")}</th></tr></thead>
                    <tbody>
                      {m.oscillations.map((o, i) => (
                        <tr key={i}>
                          <td>{mmss(o.startSec)} <span className="tr-muted">({o.durSec.toFixed(1)} s)</span></td>
                          <td><b>{o.centreLabel}</b></td>
                          <td>{o.rateHz.toFixed(1)} Hz <span className="tr-muted">{o.speed === "slow" ? u("trAndolan") : u("trGamak")}</span></td>
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
