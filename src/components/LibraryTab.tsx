/**
 * Raag library. Shows only data stored in src/data (no generated or sample
 * content). Raags with full grammar are marked; all entries are awaiting a
 * guru's review, and the page says so.
 */
import React, { useMemo, useState } from 'react';
import { ArrowLeft, Search, ShieldAlert } from 'lucide-react';
import { RAAG_LIST, type ComprehensiveRaag } from '../data/allRaags';
import { RAAG_DETAILS } from '../data/raagDetails';
import { RaagStudy } from './study/RaagStudy';
import { SamayChakra } from './library/SamayChakra';

const SYM = ["S", "r", "R", "g", "G", "m", "M", "P", "d", "D", "n", "N"];
const NAMES = ["Sa", "komal Re", "Re", "komal Ga", "Ga", "Ma", "tivra Ma", "Pa", "komal Dha", "Dha", "komal Ni", "Ni"];
const FAMILIES: [string, number[]][] = [["Re", [1, 2]], ["Ga", [3, 4]], ["Ma", [5, 6]], ["Pa", [7]], ["Dha", [8, 9]], ["Ni", [10, 11]]];
const THAATS = ["All", "Bilawal", "Kalyan", "Khamaj", "Kafi", "Asavari", "Bhairavi", "Bhairav", "Todi", "Marwa", "Poorvi"];

const shortName = (r: ComprehensiveRaag) => r.name.replace(/^Raag\s+/i, "");
const varjitOf = (r: ComprehensiveRaag) => FAMILIES.filter(([, idx]) => idx.every(i => !r.allowedSwaras.includes(i))).map(([n]) => n);

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="lib-row">
    <span className="lib-row-k">{label}</span>
    <span className="lib-row-v">{children}</span>
  </div>
);

export const LibraryTab: React.FC<{ saHz?: number }> = ({ saHz = 130.81 }) => {
  const [query, setQuery] = useState("");
  const [thaat, setThaat] = useState("All");
  const [fullOnly, setFullOnly] = useState(false);
  const [viewing, setViewing] = useState<ComprehensiveRaag | null>(null);

  const list = useMemo(() => RAAG_LIST.filter(r => {
    const q = query.trim().toLowerCase();
    const matches = !q || [r.name, r.thaat, r.mood, r.time].some(x => x.toLowerCase().includes(q));
    return matches && (thaat === "All" || r.thaat === thaat) && (!fullOnly || RAAG_DETAILS[r.id]);
  }).sort((a, b) => shortName(a).localeCompare(shortName(b))), [query, thaat, fullOnly]);

  const fullCount = Object.keys(RAAG_DETAILS).length;

  if (viewing) {
    const r = viewing;
    const d = RAAG_DETAILS[r.id];
    const varjit = varjitOf(r);
    return (
      <div className="lib">
        <button type="button" onClick={() => setViewing(null)} className="lib-back">All raags</button>
        <header className="lib-raag-head">
          <h1 className="lib-title">{shortName(r)}</h1>
          <p className="lib-intro">{r.thaat} thaat, {r.jati.toLowerCase()}, {r.time.toLowerCase()}. {r.description}</p>
          <p className="lib-review">
            {d?.review.status === "reviewed" ? `Reviewed by ${d.review.reviewer}` : "Awaiting a guru's review. Please check details with your teacher."}
          </p>
        </header>

        <div className="lib-rows">
          <Row label="Swaras">{r.allowedSwaras.map(i => `${SYM[i]} (${NAMES[i]})`).join(", ")}</Row>
          <Row label="Varjit">{varjit.length ? varjit.join(", ") : "None (all seven swaras are used)"}</Row>
          <Row label="Aroh"><span className="font-mono">{r.aroha.join(" ")}</span></Row>
          <Row label="Avaroh"><span className="font-mono">{r.avaroha.join(" ")}</span></Row>
          <Row label="Vadi / Samvadi">{NAMES[r.vadi]} ({SYM[r.vadi]}) / {NAMES[r.samvadi]} ({SYM[r.samvadi]})</Row>
          <Row label="Time">{r.time}</Row>
          <Row label="Mood">{r.mood}</Row>
          {d ? (
            <>
              <Row label="Pakad"><span className="font-mono">{d.pakad}</span></Row>
              <Row label="Chalan"><span className="font-mono space-y-1 block">{d.chalan.map((c, i) => <span key={i} className="block">{c}</span>)}</span></Row>
              <Row label="Nyas swaras"><span className="font-mono">{d.nyas.join(", ")}</span></Row>
              {d.specialNotes && <Row label="Notes">{d.specialNotes}</Row>}
              <Row label="Similar raags">
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
              <Row label="Common mistakes">
                <ul className="list-disc pl-4 space-y-1">{d.commonMistakes.map((m, i) => <li key={i}>{m}</li>)}</ul>
              </Row>
            </>
          ) : (
            <Row label="Pakad, chalan, nyas">Not written yet for this raag. Only the basic facts above are available.</Row>
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
          <h1 className="lib-title">Raags, by the clock</h1>
          <p className="lib-intro">
            {RAAG_LIST.length} raags with their swaras, aroh, avaroh, vadi and samvadi. {fullCount} also have pakad, chalan,
            alaap, a sargam geet and a bandish to study. All entries await a guru's review.
          </p>
        </div>
        <div className="lib-filters">
          <label className="lib-search">
            <span className="lib-vh">Search raags</span>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, thaat, mood or time" />
          </label>
          <select value={thaat} onChange={e => setThaat(e.target.value)} aria-label="Thaat">
            {THAATS.map(t => <option key={t} value={t}>{t === "All" ? "All thaats" : `${t} thaat`}</option>)}
          </select>
          <label className="lib-check">
            <input type="checkbox" checked={fullOnly} onChange={e => setFullOnly(e.target.checked)} />
            With study material
          </label>
        </div>
      </header>

      <SamayChakra raags={list} onOpen={setViewing} />

      {list.length === 0 ? (
        <p className="lib-intro">No raags match your search. Try another word.</p>
      ) : (
        <section className="lib-index" aria-label="All raags by thaat">
          {byThaat.map(([t, rs]) => (
            <div key={t} className="lib-thaat">
              <h2>{t}</h2>
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
    </div>
  );
};
