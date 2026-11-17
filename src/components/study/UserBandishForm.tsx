/** Enter a bandish from one's guru or a book, in swaralipi, to read and play alongside the raag. */
import React, { useState } from "react";
import type { ComprehensiveRaag } from "../../data/allRaags";
import { TAALS } from "../../data/taals";
import { outsideRaag } from "../../practice/swaralipi";
import { checkBlock, checkWords, loadUserBandishes, saveUserBandishes, type UserComposition } from "../../lib/userBandish";

export const UserBandishForm: React.FC<{ raag: ComprehensiveRaag; onSaved: () => void }> = ({ raag, onSaved }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [taalId, setTaalId] = useState("teentaal");
  const [laya, setLaya] = useState<"vilambit" | "madhya" | "drut">("madhya");
  const [bpm, setBpm] = useState(80);
  const [sthayi, setSthayi] = useState("");
  const [sthayiWords, setSthayiWords] = useState("");
  const [antara, setAntara] = useState("");
  const [antaraWords, setAntaraWords] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const taal = TAALS.find(t => t.id === taalId)!;

  const save = () => {
    const s = checkBlock(sthayi, taal.matras), a = checkBlock(antara, taal.matras);
    const sw = checkWords(sthayiWords, taal.matras, s.lines.length), aw = checkWords(antaraWords, taal.matras, a.lines.length);
    const errs = [
      ...(title.trim() ? [] : ["Give the bandish a title (its first words)."]),
      ...(s.lines.length ? [] : ["Write at least one line of the sthayi."]),
      ...s.errors.map(e => `Sthayi: ${e}`), ...sw.errors.map(e => `Sthayi: ${e}`),
      ...a.errors.map(e => `Antara: ${e}`), ...aw.errors.map(e => `Antara: ${e}`),
    ];
    if (errs.length) { setErrors(errs); return; }
    const outside = [...s.lines, ...a.lines].flatMap(l => outsideRaag(l, raag.allowedSwaras));
    if (outside.length && !window.confirm(`These swaras are not in ${raag.name}: ${[...new Set(outside)].join(", ")}. Save anyway?`)) return;
    const c: UserComposition = {
      id: `user-${Date.now()}`, raagId: raag.id, kind: "bandish", title: title.trim(), taalId, laya, bpm,
      sthayi: s.lines.map((notes, i) => ({ notes, words: sw.lines[i] })), antara: a.lines.map((notes, i) => ({ notes, words: aw.lines[i] })),
      user: true, source: source.trim(),
    };
    saveUserBandishes([...loadUserBandishes(), c]);
    setOpen(false); setErrors([]); setTitle(""); setSthayi(""); setSthayiWords(""); setAntara(""); setAntaraWords(""); setSource("");
    onSaved();
  };

  if (!open) {
    return (
      <section className="st-sec">
        <h3 className="st-h">Bandishes from your guru</h3>
        <p className="st-lede">Enter a bandish as taught by your guru or as written in a book of notation (for example Pt. V. N. Bhatkhande's Kramik Pustak Malika). It is saved in this browser for your profile, shown in swaralipi and can be played with the tanpura and tabla.</p>
        <button type="button" className="st-more" onClick={() => setOpen(true)}>Enter a bandish</button>
      </section>
    );
  }
  return (
    <section className="st-sec ub">
      <h3 className="st-h">Enter a bandish in {raag.name.replace(/^Raag\s+/i, "")}</h3>
      <p className="st-lede">
        One avartan per line, one entry per matra, separated by spaces, starting from sam. Write swaras as S r R g G m M P d D n N
        (lowercase komal, M tivra), "," after a swara for mandra (N,) and "'" for taar (S'). Use "-" where a swara is held (ऽ), "_" for an
        empty matra before the mukhda, and join swaras sung in one matra with "." (for example G.m). Words go on matching lines, one syllable per matra.
      </p>
      <div className="ub-grid">
        <label className="tp-field"><span>Title (first words)</span><input value={title} onChange={e => setTitle(e.target.value)} /></label>
        <label className="tp-field"><span>Source (guru or book)</span><input value={source} onChange={e => setSource(e.target.value)} placeholder="e.g. as taught by my guru" /></label>
        <label className="tp-field"><span>Taal</span>
          <select value={taalId} onChange={e => setTaalId(e.target.value)}>{TAALS.map(t => <option key={t.id} value={t.id}>{t.name}, {t.matras} matras</option>)}</select>
        </label>
        <label className="tp-field"><span>Laya</span>
          <select value={laya} onChange={e => setLaya(e.target.value as typeof laya)}><option value="vilambit">Vilambit</option><option value="madhya">Madhya</option><option value="drut">Drut</option></select>
        </label>
        <label className="tp-field"><span>Matras per minute</span><input type="number" min={20} max={320} value={bpm} onChange={e => setBpm(Number(e.target.value))} /></label>
      </div>
      <div className="ub-grid ub-two">
        <label className="tp-field"><span>Sthayi swaras</span><textarea rows={4} value={sthayi} onChange={e => setSthayi(e.target.value)} spellCheck={false} /></label>
        <label className="tp-field"><span>Sthayi words (optional)</span><textarea rows={4} value={sthayiWords} onChange={e => setSthayiWords(e.target.value)} /></label>
        <label className="tp-field"><span>Antara swaras</span><textarea rows={4} value={antara} onChange={e => setAntara(e.target.value)} spellCheck={false} /></label>
        <label className="tp-field"><span>Antara words (optional)</span><textarea rows={4} value={antaraWords} onChange={e => setAntaraWords(e.target.value)} /></label>
      </div>
      {errors.length > 0 && <ul className="tp-error">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
      <div className="tp-row">
        <button type="button" className="st-more" onClick={save}>Save bandish</button>
        <button type="button" className="tp-link" onClick={() => { setOpen(false); setErrors([]); }}>Cancel</button>
      </div>
    </section>
  );
};
