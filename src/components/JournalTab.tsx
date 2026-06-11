/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, Award, Trash2, Plus, PenTool, Check } from 'lucide-react';
import { RAAGS } from '../types';

interface JournalEntry {
  id: string;
  date: string;
  raagId: string;
  raagName: string;
  durationMinutes: number;
  notes: string;
  moodReflection: string;
}

export const JournalTab: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form details
  const [raagIdx, setRaagIdx] = useState(0);
  const [duration, setDuration] = useState(15);
  const [notesText, setNotesText] = useState("");
  const [moodText, setMoodText] = useState("Peaceful (Shanta)");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("naadai_riyaz_journals");
      if (stored) {
        setEntries(JSON.parse(stored));
      } else {
        // Seed default beautiful initial history for user visual engagement
        const seedEntries: JournalEntry[] = [
          {
            id: "journal_1",
            date: "2026-06-10",
            raagId: "yaman",
            raagName: "Raag Yaman",
            durationMinutes: 40,
            notes: "Focused heavily on avoiding the Pancham in the characteristic 'N' R G M D N' ascension. Stability on Gandhar felt extremely serene. Throat felt slightly dry but fine tuned after 15 minutes of Kharaj Riyāz.",
            moodReflection: "Meditative & Calm"
          },
          {
            id: "journal_2",
            date: "2026-06-08",
            raagId: "bhairav",
            raagName: "Raag Bhairav",
            durationMinutes: 30,
            notes: "Practiced Komal Re andolan oscillations at dawn. Sur accuracy tracker was hovering around 89%. Felt absolute quiet resonance. Will continue perfecting the sub-hertz flat pitch stability.",
            moodReflection: "Divine Sunrise Devotion"
          }
        ];
        localStorage.setItem("naadai_riyaz_journals", JSON.stringify(seedEntries));
        setEntries(seedEntries);
      }
    } catch (e) {
      console.error("Failed to parse journal indexes:", e);
    }
  }, []);

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const activeRaag = RAAGS[raagIdx] || RAAGS[0];
    
    const newEntry: JournalEntry = {
      id: `jentry_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      raagId: activeRaag.id,
      raagName: activeRaag.name,
      durationMinutes: duration,
      notes: notesText.trim() || "Completed standard swara alignment drills.",
      moodReflection: moodText
    };

    const updated = [newEntry, ...entries];
    localStorage.setItem("naadai_riyaz_journals", JSON.stringify(updated));
    setEntries(updated);

    // Reset Form
    setNotesText("");
    setIsAdding(false);
  };

  const handleDeleteEntry = (id: string) => {
    const filtered = entries.filter(e => e.id !== id);
    localStorage.setItem("naadai_riyaz_journals", JSON.stringify(filtered));
    setEntries(filtered);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header and Intro banner */}
      <div className="bg-[#151A2E] p-6 rounded-2xl border border-[#7C3AED]/40 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 bg-[#7C3AED]/10 rounded-full blur-2xl pointer-events-none" />
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="h-5.5 w-5.5 text-[#FBBF24]" />
            Riyāz Journal
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Maintain your personal aesthetic classical diary logs. Catalog your vocal practices, note microtonal findings, and capture spiritual/emotional discoveries.
          </p>
        </div>
        
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#38BDF8] text-slate-950 font-mono text-xs font-bold uppercase hover:opacity-90 flex items-center gap-1.5 cursor-pointer shadow-lg transition-transform hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Write Diary Entry
          </button>
        )}
      </div>

      {/* Adding Module Sub-Form */}
      {isAdding && (
        <form onSubmit={handleSaveEntry} className="bg-[#151A2E]/90 border border-[#7C3AED]/50 p-6 rounded-2xl shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 justify-between">
            <h3 className="text-sm font-bold text-slate-100 font-sans tracking-wide flex items-center gap-2">
              <PenTool className="h-4 w-4 text-[#FBBF24]" />
              New Riyaz Reflection Note
            </h3>
            <button 
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-200 text-xs font-mono"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Raga Selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Assigned Raga Scale</label>
              <select
                value={raagIdx}
                onChange={(e) => setRaagIdx(Number(e.target.value))}
                className="w-full bg-[#0F1115] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-[#7C3AED] focus:outline-none"
              >
                {RAAGS.map((r, i) => (
                  <option key={r.id} value={i}>{r.name}</option>
                ))}
              </select>
            </div>

            {/* Duration setting */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Duration (Minutes)</label>
              <input
                type="number"
                min="5"
                max="300"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-[#0F1115] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:border-[#7C3AED] focus:outline-none"
              />
            </div>

            {/* Mood Emotion Selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Rasa / Emotional State</label>
              <select
                value={moodText}
                onChange={(e) => setMoodText(e.target.value)}
                className="w-full bg-[#0F1115] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-[#7C3AED] focus:outline-none"
              >
                <option value="Peaceful (Shanta)">Peaceful (Shāntā)</option>
                <option value="Devotional (Bhakti)">Devotional (Bhakti)</option>
                <option value="Romantic (Shringara)">Romantic (Shringārā)</option>
                <option value="Mournful / Sad (Karuna)">Mournful (Karunā)</option>
                <option value="Heroic Intensity (Veera)">Heroic Intensity (Veerā)</option>
                <option value="Mysterious wonder">Mysterious Wonder</option>
              </select>
            </div>

          </div>

          {/* Diary Notes Context Field */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Microtonal Findings & Practice Reflections</label>
            <textarea
              required
              rows={4}
              maxLength={700}
              placeholder="e.g. Practiced Yaman meend glides. Felt pitch centering is shifting slightly flat on shuddha Madhyam entry. Corrected by sliding slower from Gandhar..."
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              className="w-full bg-[#0F1115] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:border-[#7C3AED] focus:outline-none leading-relaxed"
            />
          </div>

          {/* Action trigger row */}
          <button
            type="submit"
            className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#38BDF8] text-slate-950 font-mono text-xs font-bold uppercase hover:opacity-90 flex items-center justify-center gap-1 cursor-pointer"
          >
            <Check className="h-4 w-4" />
            Log Entry to Journal Scroll
          </button>

        </form>
      )}

      {/* Log Book Entries List scroll */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest pl-1">Historical Riyāz Scroll</h3>
        
        {entries.length === 0 ? (
          <div className="border border-dashed border-slate-800 p-12 rounded-2xl text-center space-y-2 bg-[#151A2E]/20">
            <BookOpen className="h-8 w-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400 font-bold">The Journal Scroll is currently empty</p>
            <p className="text-[10px] text-slate-550 max-w-sm mx-auto">Logged reflections can guide your musical path. Press the 'Write Diary Entry' button above to register your first notes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entries.map((item) => (
              <div 
                key={item.id} 
                className="bg-[#151A2E] p-5 rounded-2xl border border-slate-850/80 shadow-lg flex flex-col justify-between hover:border-[#7C3AED]/40 transition-colors group animate-in fade-in"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-[#7C3AED]/20 text-[#38BDF8] rounded-full border border-[#7C3AED]/10 font-bold">
                        {item.raagName}
                      </span>
                      <span className="text-[8px] font-mono text-slate-500 block mt-1 uppercase">Rasa: {item.moodReflection}</span>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteEntry(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/25 border border-transparent rounded-lg transition-all cursor-pointer"
                      title="Prune diary entry"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-4">
                    "{item.notes}"
                  </p>
                </div>

                <div className="flex justify-between items-center mt-5 pt-3 border-t border-slate-850 text-[10px] font-mono text-slate-500 shrink-0">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {item.date}</span>
                  <span className="flex items-center gap-1 font-bold text-slate-400"><Clock className="h-3 w-3" /> {item.durationMinutes} minutes</span>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
