/**
 * Choose or create a singer profile. There are no passwords: profiles live
 * only in this browser (see src/lib/profiles.ts). Styled by landing.css.
 */
import React, { useRef, useState } from 'react';
import { westernNote } from '../analysis/music';
import { createProfile, importProfile, loadProfiles, setCurrentProfile, type SingerProfile } from '../lib/profiles';
import { useLang } from '../i18n/lang';

const PRESET_HZ = [130.81, 138.59, 196.0, 207.65];

export const ProfilePicker: React.FC<{ onChosen: (p: SingerProfile) => void }> = ({ onChosen }) => {
  const { t } = useLang();
  const g = t.gate;
  const [profiles, setProfiles] = useState(() => loadProfiles());
  const [creating, setCreating] = useState(profiles.length === 0);
  const [name, setName] = useState("");
  const [saHz, setSaHz] = useState(130.81);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError(g.enterName); return; }
    onChosen(createProfile(name, saHz));
  };

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      onChosen(importProfile(await f.text()));
    } catch (err: any) {
      setError(err?.message || g.importFailed);
      setProfiles(loadProfiles());
    }
  };

  return (
    <div className="pp">
      <h1 className="pp-title">{creating ? g.newSinger : g.who}</h1>
      <p className="pp-sub">{g.savedHere}</p>

      {error && <p className="pp-error" role="alert">{error}</p>}

      {!creating ? (
        <>
          <ul className="pp-list">
            {profiles.map(p => (
              <li key={p.id}>
                <button type="button" onClick={() => { setCurrentProfile(p.id); onChosen(p); }}>
                  <span className="pp-name">{p.name}</span>
                  <span className="pp-sa">Sa {westernNote(p.saHz).name}, {p.saHz.toFixed(1)} Hz</span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="ln-btn ln-btn-quiet" onClick={() => { setCreating(true); setError(null); }}>{g.add}</button>
        </>
      ) : (
        <form onSubmit={create} className="pp-form">
          <label className="pp-field">
            <span>{g.name}</span>
            <input value={name} onChange={e => setName(e.target.value)} maxLength={40} autoFocus autoComplete="off" />
          </label>
          <fieldset className="pp-field">
            <legend>{g.yourSa}</legend>
            <div className="pp-presets">
              {PRESET_HZ.map((hz, i) => (
                <label key={hz}>
                  <input type="radio" name="pp-sa" checked={saHz === hz} onChange={() => setSaHz(hz)} />
                  <span><b>{g.presets[i]}</b> Sa {westernNote(hz).name}, {hz} Hz</span>
                </label>
              ))}
            </div>
          </fieldset>
          <button type="submit" className="ln-btn ln-btn-main">{g.start}</button>
          {profiles.length > 0 && (
            <button type="button" className="ln-btn ln-btn-quiet" onClick={() => setCreating(false)}>{g.backToProfiles}</button>
          )}
        </form>
      )}

      <p className="pp-import">
        <button type="button" className="ln-btn ln-btn-quiet" onClick={() => fileRef.current?.click()}>{g.import}</button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImport} />
      </p>
    </div>
  );
};
