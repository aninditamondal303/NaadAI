/** Two raags side by side, with the differences that follow from their data. */
import React, { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { RAAG_LIST, type ComprehensiveRaag } from "../../data/allRaags";
import { CLOSE_PAIRS, SWARA_NAMES, SWARA_SYMBOLS, compareRaags, differenceSummary } from "../../data/raagCompare";
import { angPhrases } from "../../data/mukhyaAng";
import { Phrase } from "../study/Swaralipi";
import { useUi } from "../../i18n/ui";

const short = (r: ComprehensiveRaag) => r.name.replace(/^Raag\s+/i, "").replace(/\s*\(.*\)/, "");
const SORTED = [...RAAG_LIST].sort((a, b) => short(a).localeCompare(short(b)));
const byId = (id: string) => RAAG_LIST.find(r => r.id === id)!;

export const RaagCompare: React.FC<{ initial: [string, string]; onBack: () => void; onOpen: (r: ComprehensiveRaag) => void }> = ({ initial, onBack, onOpen }) => {
  const u = useUi();
  const [aId, setA] = useState(initial[0]);
  const [bId, setB] = useState(initial[1]);
  const a = byId(aId), b = byId(bId);
  const c = useMemo(() => compareRaags(a, b), [a, b]);
  const summary = differenceSummary(a, b, c);
  const pick = (setter: (s: string) => void, value: string, label: string) => (
    <label className="rc-pick">
      <span className="lib-vh">{label}</span>
      <select value={value} onChange={e => setter(e.target.value)} aria-label={label}>
        {SORTED.map(r => <option key={r.id} value={r.id}>{short(r)}</option>)}
      </select>
    </label>
  );
  const row = (label: string, fa: React.ReactNode, fb: React.ReactNode, same?: boolean) => (
    <div className="rc-row" data-same={same || undefined}>
      <dt>{label}{same !== undefined && <span className={`rc-badge ${same ? "rc-same" : "rc-diff"}`}>{same ? u("rcSame") : u("rcDiffers")}</span>}</dt>
      <dd>{fa}</dd>
      <dd>{fb}</dd>
    </div>
  );

  return (
    <div className="lib rc">
      <button type="button" onClick={onBack} className="lib-back">{u("allRaags")}</button>
      <header className="lib-raag-head">
        <h1 className="lib-title">{u("rcTitle")}</h1>
        <p className="lib-intro">{u("rcIntro")}</p>
      </header>

      <div className="rc-pickers">
        {pick(setA, aId, u("rcFirst"))}
        <button type="button" className="nv-icon-btn rc-swap" onClick={() => { setA(bId); setB(aId); }} aria-label={u("rcSwap")}><ArrowLeftRight size={18} aria-hidden /></button>
        {pick(setB, bId, u("rcSecond"))}
      </div>
      <div className="rc-pairs" role="group" aria-label={u("rcPairs")}>
        {CLOSE_PAIRS.map(([x, y]) => (
          <button key={x + y} type="button" aria-pressed={(x === aId && y === bId) || (x === bId && y === aId)} onClick={() => { setA(x); setB(y); }}>
            {short(byId(x))} &amp; {short(byId(y))}
          </button>
        ))}
      </div>

      <section className="rc-strip" aria-label={u("rcSwaras")}>
        {SWARA_SYMBOLS.map((sym, i) => {
          const inA = a.allowedSwaras.includes(i), inB = b.allowedSwaras.includes(i);
          const state = inA && inB ? "both" : inA ? "a" : inB ? "b" : "none";
          return (
            <div key={i} className="rc-sw" data-state={state} title={SWARA_NAMES[i]}>
              <span className="rc-sw-sym"><Phrase text={sym} script="deva" /></span>
              <span className="rc-sw-name">{SWARA_NAMES[i]}</span>
            </div>
          );
        })}
        <p className="rc-legend">
          <span data-state="both">{u("rcBoth")}</span>
          <span data-state="a">{u("rcOnly", short(a))}</span>
          <span data-state="b">{u("rcOnly", short(b))}</span>
        </p>
      </section>

      {(summary.length > 0 || c.notes.length > 0) && (
        <section className="rc-summary">
          <h2 className="rz-h2">{u("rcHowDiffer")}</h2>
          <ul>
            {summary.map(s => <li key={s}>{s}</li>)}
            {c.notes.map(s => <li key={s} className="rc-note">{s}</li>)}
          </ul>
        </section>
      )}

      <dl className="rc-table">
        <div className="rc-row rc-head">
          <dt />
          <dd><button type="button" className="rc-name" onClick={() => onOpen(a)}>{short(a)}</button></dd>
          <dd><button type="button" className="rc-name" onClick={() => onOpen(b)}>{short(b)}</button></dd>
        </div>
        {row(u("rcThaat"), a.thaat, b.thaat, c.sameThaat)}
        {row(u("rcJati"), a.jati, b.jati)}
        {row(u("rcAroh"), <Phrase text={a.aroha.join(" ")} script="deva" />, <Phrase text={b.aroha.join(" ")} script="deva" />, c.sameAroh)}
        {row(u("rcAvaroh"), <Phrase text={a.avaroha.join(" ")} script="deva" />, <Phrase text={b.avaroha.join(" ")} script="deva" />, c.sameAvaroh)}
        {row(u("rcVadi"), `${SWARA_NAMES[a.vadi]} / ${SWARA_NAMES[a.samvadi]}`, `${SWARA_NAMES[b.vadi]} / ${SWARA_NAMES[b.samvadi]}`, c.sameVadi && c.sameSamvadi)}
        {row(u("rcAng"),
          angPhrases(a.id).map((p, i) => <span key={i} className="lib-ang"><Phrase text={p} script="deva" /></span>),
          angPhrases(b.id).map((p, i) => <span key={i} className="lib-ang"><Phrase text={p} script="deva" /></span>))}
        {row(u("rcTime"), a.time, b.time, c.sameTime)}
      </dl>
    </div>
  );
};
