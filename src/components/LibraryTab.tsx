/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Filter, Book, Music, Copy, Code, CheckCircle, ExternalLink, ArrowLeft, Volume2, ShieldAlert } from 'lucide-react';
import { ALL_84_RAAGS, ComprehensiveRaag } from '../data/allRaags';
import { SWARAS_MAP } from '../types';

// Let's create beautiful high-fidelity bandish database for matching known major ragas
const BANDISH_MOCK_DATABASE: Record<string, {
  name: string;
  type: string;
  taal: string;
  laya: string;
  lyrics: string;
  meaning: string;
  notation: string;
  teachingNotes: string;
}[]> = {
  yaman: [
    {
      name: "Eri Aali Piya Bin",
      type: "Vilambit Khayāl",
      taal: "Ektaal (12 beats)",
      laya: "Vilambit (Slow)",
      lyrics: "Eri aali piya bina sakhi, kal na parata mohe ghari pala chhina dina.\nJab se piya pardes gavan kino, tero biraha satave, nina na aave dukhia nayan ke.",
      meaning: "O friend! Without my beloved I find no rest even for a moment or secondary slice of time. Since my beloved has departed to foreign lands, his absence torments me; sleep does not visit my sorrowful eyes.",
      notation: "N, R G M D N S' | S' N D P M G R S\n[Swaralipi] Ni Re Ga Ma Dha Ni Sa' | Sa' Ni Dha Pa Ma Ga Re Sa",
      teachingNotes: "Focus on the long slow slide (Meend) from Gandhar to Rishabh. Ensure Tivra Madhyam is sustained flawlessly without touching the Shuddha fourth."
    },
    {
      name: "Kaise Sukh Sove",
      type: "Drut Khayāl",
      taal: "Teentaal (16 beats)",
      laya: "Drut (Fast)",
      lyrics: "Kaise sukh sove, jo piya pardes biraha dukh jage.\nSuna mandir dekhar mohe dukh upaje, aavi mila sajan mora.",
      meaning: "How can one sleep in comfort when the beloved is away? Looking at the empty home brings deep grief; come return to me, my love.",
      notation: "G R G M P | M D N S' P | S' N D P M G R S",
      teachingNotes: "Perfect for singing swift colouratura 'Taan' patterns. Keep the Sam arrival on beat 1 aligned perfectly with the word 'Kaise'."
    }
  ],
  bhairav: [
    {
      name: "Pratham Sumir Maan",
      type: "Bada Khayāl",
      taal: "Jhaptal (10 beats)",
      laya: "Madhya (Medium)",
      lyrics: "Pratham sumir maan jagatpati, sikhale tu swara gyan guve.\nBhajahu Tansen charan nita, dhyan dhare mana gyan suraj.",
      meaning: "First, meditate on the Creator of the universe, and acquire the sacred awareness of classical swaras. Bow to the master lineage of Tansen, illuminating your mind like the morning sun.",
      notation: "S r G m P | d N S'\nAndolan: heavy oscillations on Komal Re (r) and Komal Dha (d).",
      teachingNotes: "The oscillation (Andolan) on Komal Rishabh must be incredibly microtonally stable. Touch the note from Gandhar gently."
    }
  ]
};

// Common mistakes for major ragas
const COMMON_MISTAKES: Record<string, string[]> = {
  yaman: [
    "Accidentally touching Shuddha Madhyam instead of the sharp Tivra Madhyam.",
    "Stopping on Pancham in the ascent, which breaks the classical Yaman structure.",
    "Applying too much heavy oscillation (Andolan) on notes, where Yaman requires pristine glides (Meend)."
  ],
  bhairav: [
    "Singing Komal Rishabh or Komal Dhaivat static without their mandatory heavy oscillations (Andolan).",
    "Letting the pitch of Rishabh slide too close to Shuddha Re, eroding the early morning prayer vibe.",
    "Singing it too fast; Bhairav requires slow, deeply meditative time to unfold its divinity."
  ]
};

export const LibraryTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedThaat, setSelectedThaat] = useState("All");
  const [viewingRaag, setViewingRaag] = useState<ComprehensiveRaag | null>(null);
  const [copiedNotation, setCopiedNotation] = useState(false);

  const filterThaats = ["All", "Kalyan", "Bhairav", "Kafi", "Asavari", "Bhairavi", "Bilawal", "Khamaj", "Todi", "Marwa", "Poorvi"];

  const handleCopyNotation = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotation(true);
    setTimeout(() => setCopiedNotation(false), 2000);
  };

  const filteredRaags = ALL_84_RAAGS.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.mood.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         r.time.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesThaat = selectedThaat === "All" || r.thaat.toLowerCase() === selectedThaat.toLowerCase();
    return matchesSearch && matchesThaat;
  });

  if (viewingRaag) {
    const cleanId = viewingRaag.id.split('_')[0]; // resolve base ID
    const bandishes = BANDISH_MOCK_DATABASE[cleanId] || [
      {
        name: `Mora Man Ab Mane Na (${viewingRaag.name})`,
        type: "Madhya Laya Bandish",
        taal: "Teentaal (16 beats)",
        laya: "Madhya (Medium)",
        lyrics: "Mora man ab mane na, lakh samujhaye swar gyan sur.\nJab se raga sanyog paidha, tarpat dhyan nirmal chit.",
        meaning: "My mind no longer yields to logic; I have explained to it a thousand times the beauty of the swaras. Ever since this melody touched my heart, my mind has been in constant search for spiritual focus.",
        notation: `${viewingRaag.aroha.join(" ")} ➔ ${viewingRaag.avaroha.join(" ")}`,
        teachingNotes: "Align the breath on long sustained vowels. Ensure all allowed swaras maintain purity."
      }
    ];

    const mistakes = COMMON_MISTAKES[cleanId] || [
      "Touching notes outside the traditional allowed Swara list (such as accidentals).",
      "Confusing the specific Vadi/Samvadi notes, causing the melodic focal point to shift.",
      "Singing the melody outside of its traditional designated hours, which dilutes the environmental aesthetics."
    ];

    return (
      <div className="bg-[#151A2E] p-6 rounded-2xl border border-[#7C3AED]/40 shadow-2xl space-y-6 animate-in fade-in duration-300">
        
        {/* Detail page Header navigation back */}
        <button
          onClick={() => setViewingRaag(null)}
          className="px-3.5 py-1.5 rounded-xl bg-[#0F1115] hover:bg-[#0F1115]/80 text-[#38BDF8] font-mono text-xs font-bold border border-slate-800 flex items-center gap-1.5 cursor-pointer shadow-md transition-transform hover:-translate-x-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Raag Library
        </button>

        {/* Big visual banner */}
        <div className="p-6 rounded-xl bg-gradient-to-r from-[#7C3AED]/30 via-indigo-950/40 to-[#0F1115] border border-[#7C3AED]/35 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-full w-40 bg-gradient-to-l from-[#FBBF24]/10 to-transparent pointer-events-none" />
          <span className="px-2.5 py-1 rounded-full text-[9px] font-mono font-bold bg-[#7C3AED]/35 text-[#38BDF8] border border-[#7C3AED]/20 uppercase">
            Hindustani Raag Ontology
          </span>
          <h2 className="text-2xl font-black text-slate-100 font-serif tracking-wide mt-2">{viewingRaag.name}</h2>
          <p className="text-xs text-[#FBBF24] font-mono font-bold mt-1">Thaat: {viewingRaag.thaat} • Jaati: {viewingRaag.jati || "Sampurna"}</p>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed mt-2 italic">
            "{viewingRaag.description}"
          </p>
        </div>

        {/* 2-column detailed profiles */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: Classical Parameters Table */}
          <div className="bg-[#0F1115]/90 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2">Technical Parameters</h3>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Vadi Swara (King):</span>
                <span className="text-[#38BDF8] font-mono font-bold uppercase">{SWARAS_MAP[viewingRaag.vadi]?.name || "Sa"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Samvadi (Queen):</span>
                <span className="text-indigo-400 font-mono font-bold uppercase">{SWARAS_MAP[viewingRaag.samvadi]?.name || "Pa"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Prahar (Time):</span>
                <span className="text-[#FBBF24] font-semibold">{viewingRaag.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Rasa / Mood:</span>
                <span className="text-slate-300 font-medium">{viewingRaag.mood}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Jati:</span>
                <span className="text-slate-300 font-mono font-bold">{viewingRaag.jati || "Sampurna-Sampurna"}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Swaralipi / Scale notation patterns */}
          <div className="lg:col-span-2 bg-[#0F1115]/90 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#38BDF8] border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>Swaralipi Notations</span>
              <button
                onClick={() => handleCopyNotation(viewingRaag.aroha.join(" ➔ ") + "\n" + viewingRaag.avaroha.join(" ➔ "))}
                className="text-[10px] bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 px-2 py-1 rounded flex items-center gap-1 cursor-pointer"
              >
                {copiedNotation ? <CheckCircle className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copiedNotation ? "Copied" : "Copy Swaras"}</span>
              </button>
            </h3>

            <div className="space-y-4 text-xs font-mono">
              <div className="bg-[#151A2E]/50 p-3 rounded-xl border border-slate-900">
                <span className="text-[10px] text-slate-500 uppercase block font-bold mb-1">Aroha (Scale Ascension)</span>
                <span className="text-[#38BDF8] text-sm font-black tracking-wide block">{viewingRaag.aroha.join("  ➔  ")}</span>
              </div>
              <div className="bg-[#151A2E]/50 p-3 rounded-xl border border-slate-900">
                <span className="text-[10px] text-slate-500 uppercase block font-bold mb-1">Avaroha (Scale Descension)</span>
                <span className="text-indigo-400 text-sm font-black tracking-wide block">{viewingRaag.avaroha.join("  ➔  ")}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[9px] text-[#FBBF24] block font-bold uppercase">Nyas Swaras (Rests)</span>
                  <span className="text-slate-300 font-semibold">{SWARAS_MAP[viewingRaag.vadi]?.symbol}, {SWARAS_MAP[viewingRaag.samvadi]?.symbol}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-550 block font-bold uppercase">Similar Ragas</span>
                  <span className="text-slate-400 font-semibold">Bhupali, Yaman Kalyan</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Listening Recommendations and Commom mistakes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Section A: Common Mistakes warning */}
          <div className="bg-[#0F1115]/60 p-5 rounded-2xl border border-rose-950/30 space-y-3.5">
            <h4 className="text-xs font-mono font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4" />
              Common Practice Mistakes
            </h4>
            <ul className="space-y-2 text-xs text-slate-400 list-disc pl-4 leading-relaxed">
              {mistakes.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>

          {/* Section B: Listening recommendations */}
          <div className="bg-[#0F1115]/60 p-5 rounded-2xl border border-slate-800 space-y-3.5">
            <h4 className="text-xs font-mono font-bold text-[#FBBF24] uppercase tracking-widest flex items-center gap-1.5">
              <Volume2 className="h-4 w-4" />
              Famous Listening Recommendations
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 bg-[#151A2E]/50 border border-slate-900 rounded-lg">
                <div>
                  <span className="font-bold text-slate-200 block">Ustad Rashid Khan</span>
                  <span className="text-[9px] font-mono text-slate-500">Traditional Vilambit Khayal rendition</span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-[#38BDF8]" />
              </div>
              <div className="flex items-center justify-between p-2 bg-[#151A2E]/50 border border-[#1e293b/45] rounded-lg">
                <div>
                  <span className="font-bold text-slate-200 block">Pandit Bhimsen Joshi</span>
                  <span className="text-[9px] font-mono text-slate-500">Drut Khayāl Tarana masterpiece</span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-[#38BDF8]" />
              </div>
            </div>
          </div>

        </div>

        {/* Integrated Bandish Library matching page */}
        <div className="space-y-4 pt-4 border-t border-slate-850">
          <h3 className="text-lg font-bold text-slate-200 font-serif tracking-wide flex items-center gap-2">
            <Book className="h-5.5 w-5.5 text-[#FBBF24]" />
            Associated Bandish Library
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bandishes.map((b, i) => (
              <div key={i} className="bg-[#0F1115] border border-slate-800 p-5 rounded-2xl space-y-4">
                
                <div className="flex justify-between items-start border-b border-slate-900 pb-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{b.name}</h4>
                    <span className="text-[10px] font-mono text-[#FBBF24] block mt-0.5">{b.type} • {b.taal}</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold bg-[#7C3AED]/20 text-[#38BDF8] px-2 py-0.5 rounded uppercase border border-[#7C3AED]/10 shrink-0">
                    {b.laya}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">Lyrics notation (Hindi/Sanskrit)</span>
                  <p className="text-xs text-slate-300 font-serif italic whitespace-pre-line leading-relaxed pl-2 bg-[#151A2E]/35 p-2 rounded border border-slate-900">
                    {b.lyrics}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">Translation meaning</span>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans pl-2 border-l-2 border-[#7C3AED]">
                    {b.meaning}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">Pedagogic Teaching Notes</span>
                  <p className="text-xs text-slate-450 leading-relaxed font-sans bg-[#151A2E]/20 p-2.5 rounded text-[11px]">
                    {b.teachingNotes}
                  </p>
                </div>

              </div>
            ))}
          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Search Input and visual catalog controls */}
      <div className="bg-[#151A2E] p-6 rounded-2xl border border-[#7C3AED]/40 shadow-xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-bl from-[#7C3AED]/15 to-transparent rounded-bl-full pointer-events-none" />
        
        <div className="space-y-1 relative z-10">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Book className="h-5 w-5 text-[#FBBF24]" />
            Hindustani Raag Encyclopedia
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Audit, filter, and study India's most comprehensive melodic ontology database. Includes pakad, chalan notations, saptak boundaries, and master bandishes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative z-10">
          
          {/* Keyword Search field */}
          <div className="md:col-span-3 relative font-sans">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search 84+ classical ragas by name, thaat scale, mood, time..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0F1115] text-slate-150 pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 text-xs focus:outline-none focus:border-[#7C3AED] focus:bg-[#0F1115]/90 transition-all placeholder-slate-600 font-sans"
            />
          </div>

          {/* Quick Thaat select dropdown filter */}
          <div>
            <select
              value={selectedThaat}
              onChange={(e) => setSelectedThaat(e.target.value)}
              className="w-full bg-[#0F1115] border border-slate-800 text-slate-350 px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#7C3AED]"
            >
              {filterThaats.map((thaat) => (
                <option key={thaat} value={thaat}>{thaat === "All" ? "Filter Thāat..." : `${thaat} Thāat`}</option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* Grid of Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRaags.map((r) => (
          <div
            key={r.id}
            onClick={() => setViewingRaag(r)}
            className="bg-[#151A2E] p-5 rounded-2xl border border-slate-850/80 shadow-lg flex flex-col justify-between hover:border-[#7C3AED]/60 hover:-translate-y-0.5 transition-all cursor-pointer group"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[8px] font-mono font-bold bg-[#7C3AED]/20 text-[#38BDF8] border border-[#7C3AED]/10 px-2 py-0.5 rounded uppercase">
                  {r.thaat}
                </span>
                <span className="text-[8px] font-mono text-slate-500 font-bold uppercase">{r.jati || "Sampurna"}</span>
              </div>
              
              <h3 className="text-base font-bold text-slate-200 group-hover:text-[#FBBF24] transition-colors font-serif">{r.name}</h3>
              <p className="text-xs text-slate-450 leading-relaxed font-sans line-clamp-3">
                "{r.description}"
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-850/80 flex justify-between items-center text-[9px] font-mono text-slate-500">
              <span>⏱ {r.time.split(' ')[0]} {r.time.split(' ')[1] || ""}</span>
              <span className="text-[#38BDF8] group-hover:underline flex items-center gap-0.5 font-bold">
                Learn Academy →
              </span>
            </div>

          </div>
        ))}

        {filteredRaags.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500 font-serif text-sm border border-dashed border-slate-800 rounded-2xl">
            No ragas found matching your query within the 84 major raga divisions. Try another search.
          </div>
        )}
      </div>

    </div>
  );
};
