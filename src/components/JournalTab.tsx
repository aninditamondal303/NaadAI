/**
 * Riyaz journal: the singer's own notes on each practice session, kept in
 * this browser (same storage key as earlier versions, so entries are kept).
 */
import React, { useEffect, useState } from 'react';
import { RAAG_LIST } from '../data/allRaags';
import { useUi } from '../i18n/ui';

interface JournalEntry {
  id: string;
  date: string;
  raagId: string;
  raagName: string;
  durationMinutes: number;
  notes: string;
  moodReflection: string;
}

const KEY = "naadai_riyaz_journals";
const RAAGS = [...RAAG_LIST].sort((a, b) => a.name.localeCompare(b.name));
const short = (n: string) => n.replace(/^Raag\s+/i, "");

export const JournalTab: React.FC = () => {
  const u = useUi();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [adding, setAdding] = useState(false);
  const [raagId, setRaagId] = useState("yaman");
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");
  const rasas = u("rasas").split("|");
  const [rasa, setRasa] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored) setEntries((JSON.parse(stored) as JournalEntry[]).filter(e => e.id !== "journal_1" && e.id !== "journal_2"));
    } catch { /* unreadable: start empty */ }
  }, []);

  const persist = (list: JournalEntry[]) => {
    setEntries(list);
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* storage full */ }
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const r = RAAGS.find(x => x.id === raagId) ?? RAAGS[0];
    persist([{ id: `jentry_${Date.now()}`, date: new Date().toISOString().slice(0, 10), raagId: r.id, raagName: short(r.name), durationMinutes: duration, notes: notes.trim(), moodReflection: rasas[rasa] }, ...entries]);
    setNotes("");
    setAdding(false);
  };

  return (
    <div className="jr">
      <header className="az-head">
        <div>
          <h1 className="az-title">{u("journalTitle")}</h1>
          <p className="az-intro">{u("journalIntro")}</p>
        </div>
        {!adding && <button type="button" className="rz-btn" onClick={() => setAdding(true)}>{u("newEntry")}</button>}
      </header>

      {adding && (
        <form onSubmit={save} className="jr-form ub">
          <div className="ub-grid">
            <label className="tp-field"><span>{u("raag")}</span>
              <select value={raagId} onChange={e => setRaagId(e.target.value)}>{RAAGS.map(r => <option key={r.id} value={r.id}>{short(r.name)}</option>)}</select>
            </label>
            <label className="tp-field"><span>{u("duration")}</span>
              <input type="number" min={5} max={300} value={duration} onChange={e => setDuration(Number(e.target.value))} />
            </label>
            <label className="tp-field"><span>{u("rasa")}</span>
              <select value={rasa} onChange={e => setRasa(Number(e.target.value))}>{rasas.map((r, i) => <option key={r} value={i}>{r}</option>)}</select>
            </label>
          </div>
          <label className="tp-field"><span>{u("observations")}</span>
            <textarea required rows={4} maxLength={700} placeholder={u("observationsHint")} value={notes} onChange={e => setNotes(e.target.value)} />
          </label>
          <div className="tp-row">
            <button type="submit" className="rz-btn">{u("saveEntry")}</button>
            <button type="button" className="tp-link" onClick={() => setAdding(false)}>{u("cancel")}</button>
          </div>
        </form>
      )}

      <section className="jr-list">
        <h2 className="rz-h2">{u("pastEntries")}</h2>
        {entries.length === 0 ? <p className="rg-muted">{u("noEntries")}</p> : (
          <ol>
            {entries.map(e => (
              <li key={e.id}>
                <div className="jr-meta">
                  <span className="jr-raag">{e.raagName}</span>
                  <span>{e.date}</span>
                  <span>{u("minutes", e.durationMinutes)}</span>
                  <span>{u("rasa")}: {e.moodReflection}</span>
                  <button type="button" className="tp-link" onClick={() => persist(entries.filter(x => x.id !== e.id))}>{u("remove")}</button>
                </div>
                <p className="jr-notes">{e.notes}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
};
