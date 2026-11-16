/**
 * Choose or create a singer profile. There are no passwords: profiles live
 * only in this browser (see src/lib/profiles.ts).
 */
import React, { useRef, useState } from 'react';
import { Upload, UserPlus } from 'lucide-react';
import { westernNote } from '../analysis/music';
import { createProfile, importProfile, loadProfiles, setCurrentProfile, type SingerProfile } from '../lib/profiles';

const PRESETS = [
  { label: "Typical male Sa", hz: 130.81 },
  { label: "Typical male Sa (higher)", hz: 138.59 },
  { label: "Typical female Sa", hz: 196.0 },
  { label: "Typical female Sa (higher)", hz: 207.65 },
];

export const ProfilePicker: React.FC<{ onChosen: (p: SingerProfile) => void }> = ({ onChosen }) => {
  const [profiles, setProfiles] = useState(() => loadProfiles());
  const [creating, setCreating] = useState(profiles.length === 0);
  const [name, setName] = useState("");
  const [saHz, setSaHz] = useState(130.81);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Please enter a name."); return; }
    onChosen(createProfile(name, saHz));
  };

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      onChosen(importProfile(await f.text()));
    } catch (err: any) {
      setError(err?.message || "Couldn't import this file.");
      setProfiles(loadProfiles());
    }
  };

  return (
    <div className="max-w-md mx-auto pt-6">
      <div className="p-6 rounded-2xl border border-teal-950 bg-slate-950/90 shadow-2xl space-y-5">
        <div className="text-center space-y-1">
          <h3 className="text-2xl font-bold font-serif text-white">{creating ? "New singer" : "Who is practising?"}</h3>
          <p className="text-xs text-slate-400">Profiles are saved only in this browser. No account or password is needed.</p>
        </div>

        {error && <p className="text-xs text-rose-300 bg-rose-950/40 border border-rose-900 rounded-lg p-2">{error}</p>}

        {!creating ? (
          <div className="space-y-2">
            {profiles.map(p => (
              <button key={p.id} type="button" onClick={() => { setCurrentProfile(p.id); onChosen(p); }}
                className="w-full text-left p-3 rounded-xl border border-teal-950 bg-slate-900/60 hover:border-teal-500 cursor-pointer">
                <span className="block font-bold text-slate-100">{p.name}</span>
                <span className="block text-[11px] font-mono text-slate-400">Sa {p.saHz.toFixed(1)} Hz ({westernNote(p.saHz).name})</span>
              </button>
            ))}
            <button type="button" onClick={() => { setCreating(true); setError(null); }}
              className="w-full p-3 rounded-xl border border-dashed border-teal-800 text-teal-300 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer">
              <UserPlus className="h-4 w-4" /> Add a singer
            </button>
          </div>
        ) : (
          <form onSubmit={create} className="space-y-4">
            <label className="block space-y-1">
              <span className="font-mono uppercase tracking-wider text-[9px] font-bold text-slate-400 block">Name</span>
              <input value={name} onChange={e => setName(e.target.value)} maxLength={40} autoFocus
                className="w-full bg-slate-900 border border-teal-950 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-500" />
            </label>
            <div className="space-y-1">
              <span className="font-mono uppercase tracking-wider text-[9px] font-bold text-slate-400 block">Your Sa (you can measure it exactly later with "Find my Sa")</span>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map(p => (
                  <button key={p.hz} type="button" onClick={() => setSaHz(p.hz)}
                    className={`p-2 rounded-lg border text-left cursor-pointer ${saHz === p.hz ? "bg-teal-500/20 border-teal-500 text-teal-200" : "bg-slate-900 border-teal-950 text-slate-400"}`}>
                    <span className="block text-[11px] font-bold">{p.label}</span>
                    <span className="text-[10px] font-mono">{westernNote(p.hz).name} · {p.hz} Hz</span>
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 font-mono text-xs font-bold uppercase cursor-pointer">
              Start practising
            </button>
            {profiles.length > 0 && (
              <button type="button" onClick={() => setCreating(false)} className="w-full text-xs text-slate-400 hover:text-slate-200 cursor-pointer">Back to profiles</button>
            )}
          </form>
        )}

        <div className="pt-3 border-t border-teal-950/60 text-center">
          <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-teal-400 hover:underline cursor-pointer inline-flex items-center gap-1">
            <Upload className="h-3.5 w-3.5" /> Import a profile from another device
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onImport} />
        </div>
      </div>
    </div>
  );
};
