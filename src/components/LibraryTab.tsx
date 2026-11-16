/**
 * Raag library. Shows only data stored in src/data (no generated or sample
 * content). Raags with full grammar are marked; all entries are awaiting a
 * guru's review, and the page says so.
 */
import React, { useMemo, useState } from 'react';
import { ArrowLeft, Search, ShieldAlert } from 'lucide-react';
import { RAAG_LIST, type ComprehensiveRaag } from '../data/allRaags';
import { RAAG_DETAILS } from '../data/raagDetails';

const SYM = ["S", "r", "R", "g", "G", "m", "M", "P", "d", "D", "n", "N"];
const NAMES = ["Sa", "komal Re", "Re", "komal Ga", "Ga", "Ma", "tivra Ma", "Pa", "komal Dha", "Dha", "komal Ni", "Ni"];
const FAMILIES: [string, number[]][] = [["Re", [1, 2]], ["Ga", [3, 4]], ["Ma", [5, 6]], ["Pa", [7]], ["Dha", [8, 9]], ["Ni", [10, 11]]];
const THAATS = ["All", "Bilawal", "Kalyan", "Khamaj", "Kafi", "Asavari", "Bhairavi", "Bhairav", "Todi", "Marwa", "Poorvi"];

const shortName = (r: ComprehensiveRaag) => r.name.replace(/^Raag\s+/i, "");
const varjitOf = (r: ComprehensiveRaag) => FAMILIES.filter(([, idx]) => idx.every(i => !r.allowedSwaras.includes(i))).map(([n]) => n);

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-4 py-2 border-t border-slate-800">
    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">{label}</span>
    <span className="text-sm text-slate-200">{children}</span>
  </div>
);

export const LibraryTab: React.FC = () => {
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
      <div className="space-y-5">
        <button type="button" onClick={() => setViewing(null)} className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 cursor-pointer">
          <ArrowLeft className="h-4 w-4" /> All raags
        </button>
        <div className="bg-[#151A2E] p-6 rounded-2xl border border-slate-800 space-y-1">
          <h2 className="text-2xl font-bold font-serif text-slate-100">{shortName(r)}</h2>
          <p className="text-xs text-slate-400">{r.thaat} thaat · {r.jati} · {r.time}</p>
          <p className="text-[11px] text-amber-300/80 pt-2 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" />
            {d?.review.status === "reviewed" ? `Reviewed by ${d.review.reviewer}` : "Awaiting a guru's review. Please check details with your teacher."}
          </p>
        </div>

        <div className="bg-[#151A2E] p-6 rounded-2xl border border-slate-800">
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
                        <button type="button" className="font-bold text-[#38BDF8] hover:underline cursor-pointer"
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
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-[#151A2E] p-6 rounded-2xl border border-slate-800 space-y-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-slate-100">Raag library</h2>
          <p className="text-xs text-slate-400 mt-1">
            {RAAG_LIST.length} raags with their swaras, aroh, avaroh, vadi and samvadi. {fullCount} also have pakad, chalan, nyas swaras and comparisons with similar raags.
            All entries are awaiting a guru's review.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <label className="flex-1 flex items-center gap-2 bg-[#0F1115] border border-slate-800 rounded-lg px-3">
            <Search className="h-4 w-4 text-slate-500" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search raags by name, thaat, mood or time..."
              className="flex-1 bg-transparent py-2 text-sm text-slate-200 outline-none" />
          </label>
          <select value={thaat} onChange={e => setThaat(e.target.value)} className="bg-[#0F1115] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200">
            {THAATS.map(t => <option key={t} value={t}>{t === "All" ? "All thaats" : `${t} thaat`}</option>)}
          </select>
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input type="checkbox" checked={fullOnly} onChange={e => setFullOnly(e.target.checked)} className="accent-[#7C3AED]" />
            Full details only
          </label>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-slate-400 px-1">No raags match your search. Try another word.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {list.map(r => (
            <button key={r.id} type="button" onClick={() => setViewing(r)}
              className="text-left bg-[#151A2E] p-4 rounded-xl border border-slate-800 hover:border-[#7C3AED]/60 cursor-pointer space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold font-serif text-slate-100">{shortName(r)}</span>
                {RAAG_DETAILS[r.id] && <span className="text-[8px] font-mono uppercase text-emerald-300 border border-emerald-700/50 rounded px-1.5 py-0.5">Full details</span>}
              </div>
              <span className="block text-[10px] font-mono text-slate-500">{r.thaat} · {r.time}</span>
              <span className="block text-xs font-mono text-slate-300">{r.aroha.join(" ")}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
