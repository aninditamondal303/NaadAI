/**
 * Raag library. Shows only data stored in src/data (no generated or sample
 * content). Raags with full grammar are marked; all entries are awaiting a
 * guru's review, and the page says so.
 */
import { FormsReference, GharanasReference, TaalsReference } from './library/Reference';
import { RAAG_SOURCE_INFO } from '../data/raagsExtended';
import { ArrowLeftRight } from 'lucide-react';
import { RaagCompare } from './library/RaagCompare';
import { CLOSE_PAIRS } from '../data/raagCompare';
import React, { useMemo, useState } from 'react';
import { ArrowLeft, Search, ShieldAlert } from 'lucide-react';
import { RAAG_LIST, type ComprehensiveRaag } from '../data/allRaags';
import { RAAG_DETAILS } from '../data/raagDetails';
import { RaagStudy } from './study/RaagStudy';
import { useUi } from '../i18n/ui';
import { Phrase } from './study/Swaralipi';
import { angPhrases, MUKHYA_ANG, vishrantiSwaras } from '../data/mukhyaAng';
import { SamayChakra } from './library/SamayChakra';
import { RaagHours } from './library/RaagHours';

const SYM = ["S", "r", "R", "g", "G", "m", "M", "P", "d", "D", "n", "N"];
const NAMES = ["Sa", "komal Re", "Re", "komal Ga", "Ga", "Ma", "tivra Ma", "Pa", "komal Dha", "Dha", "komal Ni", "Ni"];
const FAMILIES: [string, number[]][] = [["Re", [1, 2]], ["Ga", [3, 4]], ["Ma", [5, 6]], ["Pa", [7]], ["Dha", [8, 9]], ["Ni", [10, 11]]];
const THAATS = ["All", "Bilawal", "Kalyan", "Khamaj", "Kafi", "Asavari", "Bhairavi", "Bhairav", "Todi", "Marwa", "Poorvi", "Not defined"];

const shortName = (r: ComprehensiveRaag) => r.name.replace(/^Raag\s+/i, "");
const varjitOf = (r: ComprehensiveRaag) => FAMILIES.filter(([, idx]) => idx.every(i => !r.allowedSwaras.includes(i))).map(([n]) => n);

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="lib-row">
    <span className="lib-row-k">{label}</span>
    <span className="lib-row-v">{children}</span>
  </div>
);

export const LibraryTab: React.FC<{ saHz?: number; openRaagId?: string | null; onOpenTaal?: (id: string) => void }> = ({ saHz = 130.81, openRaagId = null, onOpenTaal }) => {
  const [section, setSection] = useState<"raags" | "taals" | "forms" | "gharanas">("raags");
  const u = useUi();
  const [query, setQuery] = useState("");
  const [thaat, setThaat] = useState("All");
  const [fullOnly, setFullOnly] = useState(false);
  const [viewing, setViewing] = useState<ComprehensiveRaag | null>(() => RAAG_LIST.find(r => r.id === openRaagId) ?? null);
  const [comparing, setComparing] = useState<[string, string] | null>(null);

  const list = useMemo(() => RAAG_LIST.filter(r => {
    const q = query.trim().toLowerCase();
    const matches = !q || [r.name, r.thaat, r.mood, r.time].some(x => x.toLowerCase().includes(q));
    return matches && (thaat === "All" || r.thaat === thaat) && (!fullOnly || RAAG_DETAILS[r.id]);
  }).sort((a, b) => shortName(a).localeCompare(shortName(b))), [query, thaat, fullOnly]);

  const fullCount = Object.keys(RAAG_DETAILS).length;

  if (comparing) {
    return <RaagCompare initial={comparing} onBack={() => setComparing(null)} onOpen={r => { setComparing(null); setViewing(r); window.scrollTo({ top: 0 }); }} />;
  }

  if (viewing) {
    const r = viewing;
    const info = RAAG_SOURCE_INFO[r.id];
    const d = RAAG_DETAILS[r.id];
    const varjit = varjitOf(r);
    return (
      <div className="lib">
        <button type="button" onClick={() => setViewing(null)} className="lib-back">{u("allRaags")}</button>
        <header className="lib-raag-head">
          <h1 className="lib-title">{shortName(r)}</h1>
          <p className="lib-intro">{u("rdIntro", r.thaat, r.jati, r.time)}</p>
          <RaagHours time={r.time} />
          <button type="button" className="btn btn-ghost lib-compare" onClick={() => {
            const pair = CLOSE_PAIRS.find(p => p.includes(r.id));
            const other = pair ? pair.find(x => x !== r.id)! : (d?.similar.find(x => x.raagId)?.raagId ?? (r.id === "yaman" ? "bhupali" : "yaman"));
            setComparing([r.id, other]); window.scrollTo({ top: 0 });
          }}><ArrowLeftRight size={16} aria-hidden /> {u("rcCompareWith")}</button>
          <p className="lib-review">
            {d?.review.status === "reviewed" ? `Reviewed by ${d.review.reviewer}` : u("rdReview")}
          </p>
        </header>

        <div className="lib-rows">
          <Row label={u("rdRowSwaras")}>{r.allowedSwaras.map(i => `${SYM[i]} (${NAMES[i]})`).join(", ")}</Row>
          <Row label={u("rdRowVarjit")}>{varjit.length ? varjit.join(", ") : u("rdNoVarjit")}</Row>
          <Row label={u("rdRowAroh")}><span className="font-mono">{r.aroha.join(" ")}</span></Row>
          <Row label={u("rdRowAvaroh")}><span className="font-mono">{r.avaroha.join(" ")}</span></Row>
          <Row label={u("rdRowVadi")}>{r.vadiGiven === false ? u("rdVadiNone") : <>{NAMES[r.vadi]} ({SYM[r.vadi]}) / {NAMES[r.samvadi]} ({SYM[r.samvadi]})</>}</Row>
          <Row label={u("rdRowTime")}>{r.time}</Row>
          {info?.swar && <Row label={u("rdRowSwar")}>{info.swar}</Row>}
          {!d && info?.notes && info.notes.length > 0 && (
            <Row label={u("rdRowNotes")}><ul className="lib-notes">{info.notes.map((n, i) => <li key={i}>{n}</li>)}</ul></Row>
          )}
          {d ? (
            <>
              <Row label={u("rdRowPakad")}><Phrase text={d.pakad} script="deva" /></Row>
              {MUKHYA_ANG[r.id]?.source === "reference" && <Row label={u("rdRowAng")}>{angPhrases(r.id).map((ph, i) => <span key={i} className="lib-ang"><Phrase text={ph} script="deva" /></span>)}</Row>}
              <Row label={u("rdRowChalan")}><span className="font-mono space-y-1 block">{d.chalan.map((c, i) => <span key={i} className="block">{c}</span>)}</span></Row>
              <Row label={u("rdRowNyas")}><span className="font-mono">{d.nyas.join(", ")}</span></Row>
              {d.specialNotes && <Row label={u("rdRowNotes")}>{d.specialNotes}</Row>}
              <Row label={u("rdRowSimilar")}>
                <span className="space-y-2 block">
                  {d.similar.map(s => (
                    <span key={s.name} className="block">
                      {s.raagId ? (
                        <button type="button" className="font-bold text-[#8CC7BD] hover:underline cursor-pointer"
                          onClick={() => setViewing(RAAG_LIST.find(x => x.id === s.raagId) ?? r)}>{s.name}</button>
                      ) : <span className="font-bold">{s.name}</span>}
                      : {s.difference}
                    </span>
                  ))}
                </span>
              </Row>
              <Row label={u("rdRowMistakes")}>
                <ul className="list-disc pl-4 space-y-1">{d.commonMistakes.map((m, i) => <li key={i}>{m}</li>)}</ul>
              </Row>
            </>
          ) : (
            <Row label={u("rdRowAng")}>{angPhrases(r.id).map((ph, i) => <span key={i} className="lib-ang"><Phrase text={ph} script="deva" /></span>)}</Row>
          )}
          {vishrantiSwaras(r.id).length > 0 && <Row label={u("rdRowVishranti")}><Phrase text={vishrantiSwaras(r.id).join(" ")} script="deva" /></Row>}
          {info && info.b.length > 0 && (
            <Row label={u("rdRowBandish")}>
              <div className="lib-bandishen">
                {info.b.length > 0 && (
                  <ul>
                    {info.b.map(([title, type, taal, theme], i) => (
                      <li key={i}>
                        <span className="lib-b-title">{title || type}</span>
                        <span className="lib-b-meta">{[title ? type : "", taal, theme].filter(Boolean).join(", ")}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="lib-b-note">{u("rdBandishNote")}</p>
              </div>
            </Row>
          )}
        </div>

        <RaagStudy raag={r} saHz={saHz} />
      </div>
    );
  }

  const byThaat = THAATS.slice(1).map(t => [t, list.filter(r => r.thaat === t)] as const).filter(([, rs]) => rs.length > 0);

  return (
    <div className="lib">
      <header className="lib-head">
        <div>
          <h1 className="lib-title">{u("libraryTitle")}</h1>
          <div className="az-modes lib-sections" role="tablist" aria-label={u("libraryTitle")}>
            {(["raags", "taals", "forms", "gharanas"] as const).map(id => (
              <button key={id} type="button" role="tab" aria-selected={section === id} aria-current={section === id ? "true" : undefined} onClick={() => setSection(id)}>
                {u(`libSec_${id}` as "libSec_raags")}
              </button>
            ))}
          </div>
          {section === "raags" && <p className="lib-intro">
            {u("libIntro", RAAG_LIST.length, fullCount)}
          </p>}
        </div>
        {section === "raags" && <div className="lib-filters">
          <label className="lib-search">
            <span className="lib-vh">{u("searchRaags")}</span>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder={u("searchRaags")} />
          </label>
          <select value={thaat} onChange={e => setThaat(e.target.value)} aria-label="Thaat">
            {THAATS.map(t => <option key={t} value={t}>{t === "All" ? u("allThaats") : t === "Not defined" ? u("noThaat") : `${t} thaat`}</option>)}
          </select>
          <button type="button" className="btn btn-ghost" onClick={() => setComparing(CLOSE_PAIRS[0])}><ArrowLeftRight size={16} aria-hidden /> {u("rcTitle")}</button>
          <label className="lib-check">
            <input type="checkbox" checked={fullOnly} onChange={e => setFullOnly(e.target.checked)} />
            {u("withStudy")}
          </label>
        </div>}
      </header>
      {section === "taals" && <TaalsReference onOpenTaal={onOpenTaal} />}
      {section === "forms" && <FormsReference onOpenTaal={onOpenTaal} onOpenRaag={id => { const r = RAAG_LIST.find(x => x.id === id); if (r) { setViewing(r); window.scrollTo({ top: 0 }); } }} />}
      {section === "gharanas" && <GharanasReference />}
      {section === "raags" && <>

      <SamayChakra raags={list} onOpen={setViewing} />

      {list.length === 0 ? (
        <p className="lib-intro">{u("noMatch")}</p>
      ) : (
        <section className="lib-index" aria-label="All raags by thaat">
          {byThaat.map(([t, rs]) => (
            <div key={t} className="lib-thaat">
              <h2>{t === "Not defined" ? u("noThaat") : `${t} thaat`}</h2>
              <ul>
                {rs.map(r => (
                  <li key={r.id}>
                    <button type="button" onClick={() => setViewing(r)}>
                      <span className="lib-name">{shortName(r).replace(/\s*\(.*\)/, "")}{RAAG_DETAILS[r.id] && <span className="lib-study" title="Has alaap, sargam geet and bandish"> ✦</span>}</span>
                      <span className="lib-aroh">{r.aroha.join(" ")}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
      </>}
    </div>
  );
};
