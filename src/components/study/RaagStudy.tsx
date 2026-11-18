/**
 * Study a raag: alaap in three stages, a sargam geet and a bandish in
 * swaralipi (with what each is based on: raag, taal, laya, structure), and
 * as many extra sargam and alaap phrases as the student wants. Everything
 * can be played: a guide voice for the swaras, with the recorded tanpura,
 * and the recorded tabla for compositions.
 */
import { useUi } from "../../i18n/ui";
import { Mic, Play, Square } from "lucide-react";
import { closeContext } from '../../audio/closeContext';
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ComprehensiveRaag } from "../../data/allRaags";
import { RAAG_DETAILS } from "../../data/raagDetails";
import { ALAAP, compositionsForRaag, type Composition } from "../../data/compositions";
import { clapAt, TAALS } from "../../data/taals";
import { timeLines, timePhrases, type TimedNote } from "../../practice/swaralipi";
import { moreAlaap, moreSargams } from "../../practice/generate";
import { firstStringForRaag, TanpuraEngine } from "../../audio/tanpura";
import { TaalPlayer } from "../../audio/tabla";
import { scheduleSwaras } from "../../audio/swaraVoice";
import { useLang } from "../../i18n/lang";
import { Phrase, Swaralipi, type NoteScript } from "./Swaralipi";
import { UserBandishForm } from "./UserBandishForm";
import { loadUserBandishes, saveUserBandishes, type UserComposition } from "../../lib/userBandish";

const SYM_NAMES = ["Sa", "komal Re", "Re", "komal Ga", "Ga", "Ma", "tivra Ma", "Pa", "komal Dha", "Dha", "komal Ni", "Ni"];

type PlayingKey = string | null;

/** Plays guide swaras (and optionally tanpura and tabla); reports the current matra or phrase. */
function usePlayer(saHz: number, raag: ComprehensiveRaag) {
  const [key, setKey] = useState<PlayingKey>(null);
  const [pos, setPos] = useState<number | null>(null);
  const run = useRef<{ ctx: AudioContext; stop: () => void } | null>(null);

  const stop = () => {
    run.current?.stop();
    run.current = null;
    setKey(null);
    setPos(null);
  };
  useEffect(() => () => run.current?.stop(), []);

  const play = async (k: string, notes: TimedNote[], opts: { secPerUnit: number; taal?: { id: string; bpm: number }; units: number; voice?: boolean; loop?: () => void }) => {
    stop();
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx: AudioContext = new Ctx();
    const tanpura = new TanpuraEngine(ctx, ctx.destination, { saHz, firstString: firstStringForRaag(raag.allowedSwaras), cycleSec: 4.5, volume: 0.35 });
    await tanpura.loadSamples();
    tanpura.start();
    let taal: TaalPlayer | null = null;
    let t0 = ctx.currentTime + 1.5;
    if (opts.taal) {
      const tl = TAALS.find(x => x.id === opts.taal!.id)!;
      taal = new TaalPlayer(ctx, ctx.destination, { taal: tl, bpm: opts.taal.bpm, saHz, volume: 0.5 });
      await taal.loadSamples();
      // one avartan of theka first, then the composition from sam
      taal.start();
      t0 = taal.startedAt + tl.matras * opts.secPerUnit;
    }
    const stopVoice = opts.voice === false ? () => {} : scheduleSwaras(ctx, ctx.destination, notes, saHz, t0);
    const end = t0 + (notes.length ? Math.max(...notes.map(n => n.start + n.dur)) : 0);
    let raf = 0;
    const tick = () => {
      const t = ctx.currentTime;
      if (t > end + 0.4) { stop(); opts.loop?.(); return; }
      if (opts.taal) setPos(t >= t0 ? Math.floor((t - t0) / opts.secPerUnit) : null);
      else {
        const cur = notes.filter(n => n.start <= t - t0).pop();
        setPos(cur && t >= t0 ? cur.matra : null);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    run.current = {
      ctx,
      stop: () => {
        cancelAnimationFrame(raf);
        stopVoice();
        tanpura.disconnect();
        taal?.disconnect();
        window.setTimeout(() => closeContext(ctx), 400);
      },
    };
    setKey(k);
  };

  return { key, pos, play, stop };
}

export const RaagStudy: React.FC<{ raag: ComprehensiveRaag; saHz: number }> = ({ raag, saHz }) => {
  const { lang } = useLang();
  const u = useUi();
  const [script, setScript] = useState<NoteScript>(lang === "bn" ? "beng" : lang === "en" ? "latin" : "deva");
  const d = RAAG_DETAILS[raag.id];
  const alaap = ALAAP[raag.id];
  const [userVersion, setUserVersion] = useState(0);
  const userComps = useMemo(() => loadUserBandishes().filter(c => c.raagId === raag.id), [raag.id, userVersion]);
  const comps = [...userComps, ...compositionsForRaag(raag)];
  const removeUser = (id: string) => {
    if (!window.confirm(u("stRemoveConfirm"))) return;
    saveUserBandishes(loadUserBandishes().filter(c => c.id !== id));
    setUserVersion(v => v + 1);
  };
  const player = usePlayer(saHz, raag);
  const [sargamSets, setSargamSets] = useState(1);
  const [alaapSets, setAlaapSets] = useState(1);
  const nyas = d?.nyas ?? [];
  const extraSargams = useMemo(() => Array.from({ length: sargamSets }, (_, i) => moreSargams(raag, i + 1, nyas)), [raag, sargamSets]);
  const extraAlaap = useMemo(() => Array.from({ length: alaapSets }, (_, i) => moreAlaap(raag, i + 1, nyas)), [raag, alaapSets]);

  useEffect(() => { player.stop(); setSargamSets(1); setAlaapSets(1); }, [raag.id]);

  const playPhrases = (k: string, phrases: string[]) =>
    player.key === k ? player.stop() : void player.play(k, timePhrases(phrases), { secPerUnit: 0.7, units: phrases.length });

  // Laya as a share of the composition's own tempo, and whether the guide voice sings
  const [layaPct, setLayaPct] = useState(100);
  const [loop, setLoop] = useState(false);
  const loopRef = useRef(loop);
  loopRef.current = loop;
  const playComposition = (c: Composition, voice = true) => {
    const k = `${c.id}:${voice ? "v" : "s"}`;
    if (player.key === k) { player.stop(); return; }
    const lines = [...c.sthayi, ...c.antara].map(l => l.notes);
    const bpm = Math.round((c.bpm * layaPct) / 100);
    const spm = 60 / bpm;
    const again = () => { if (loopRef.current) playComposition(c, voice); };
    void player.play(k, timeLines(lines, spm).notes, { secPerUnit: spm, taal: { id: c.taalId, bpm }, units: lines.length * 16, voice, loop: again });
  };

  const scriptPicker = (
    <div className="st-script" role="radiogroup" aria-label="Notation">
      {([["deva", "सा रे ग"], ["beng", "সা রে গা"], ["latin", "S R G"]] as [NoteScript, string][]).map(([id, l]) => (
        <button key={id} type="button" role="radio" aria-checked={script === id} onClick={() => setScript(id)}>{l}</button>
      ))}
    </div>
  );

  return (
    <div className="st">
      <div className="st-bar">
        <p className="st-note">
          The compositions on this page have been prepared for study according to the raag's aroh, avaroh and pakad; they are
          not traditional bandishes. The guide voice is synthesised. Traditional compositions should be learnt from one's guru,
          and this material should be verified with one's teacher.
        </p>
        {scriptPicker}
      </div>

      {/* ---------------------------------------------------------------- alaap */}
      {alaap && (
        <section className="st-sec">
          <h3 className="st-h">{u("stAlaap")}</h3>
          <p className="st-lede">Alaap is sung in aakar, slowly and without taal. Each stage develops a further region of the raag. The sign ऽ indicates that the swara is sustained.</p>
          {alaap.map((stage, si) => {
            const k = `alaap-${si}`;
            return (
              <div key={si} className="st-stage">
                <div className="st-stage-head">
                  <h4>{stage.name}</h4>
                  <button type="button" className="st-play" onClick={() => playPhrases(k, stage.phrases)}>{player.key === k ? u("stStop") : u("stListen")}</button>
                </div>
                <p className="st-muted">{stage.about}</p>
                <ol className="st-phrases">
                  {stage.phrases.map((ph, i) => <li key={i}><Phrase text={ph} script={script} active={player.key === k && player.pos === i} /></li>)}
                </ol>
              </div>
            );
          })}
        </section>
      )}

      {/* ---------------------------------------------------------------- compositions */}
      {comps.map(c => {
        const taal = TAALS.find(t => t.id === c.taalId)!;
        const active = player.key?.startsWith(`${c.id}:`) ?? false;
        const playing = active ? player.pos : null;
        return (
          <section key={c.id} className="st-sec">
            <div className="st-stage-head">
              <h3 className="st-h">{c.kind === "bandish" ? u("stBandish", c.title) : c.id.endsWith("basic-sargam-geet") ? c.title : u("stSargamGeet")}</h3>
              {(c as UserComposition).user && <button type="button" className="tp-link" onClick={() => removeUser(c.id)}>{u("stRemove")}</button>}
            </div>
            <div className="st-practice" role="group" aria-label={u("stPractise")}>
              <button type="button" className="btn btn-primary" onClick={() => playComposition(c, true)}>
                {player.key === `${c.id}:v` ? <><Square size={14} fill="currentColor" aria-hidden /> {u("stStop")}</> : <><Play size={15} aria-hidden /> {u("stListen")}</>}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => playComposition(c, false)}>
                {player.key === `${c.id}:s` ? <><Square size={14} fill="currentColor" aria-hidden /> {u("stStop")}</> : <><Mic size={15} aria-hidden /> {u("stSingAlong")}</>}
              </button>
              <label className="st-laya">
                <span>{u("stLaya")}</span>
                <select value={layaPct} disabled={active} onChange={e => setLayaPct(Number(e.target.value))}>
                  {[60, 75, 90, 100, 115, 130].map(p => <option key={p} value={p}>{u("stPerMin", Math.round((c.bpm * p) / 100))}{p === 100 ? ` ${u("stAsWritten")}` : ""}</option>)}
                </select>
              </label>
              <label className="st-loop"><input type="checkbox" checked={loop} onChange={e => setLoop(e.target.checked)} /> {u("stRepeat")}</label>
            </div>
            {active && player.key!.endsWith(":s") && <p className="st-muted st-small" role="status">{u("stSingAlongNote")}</p>}

            {(c as UserComposition).user && <p className="st-muted">Entered by you{(c as UserComposition).source ? `, ${(c as UserComposition).source}` : ""}.</p>}
            <dl className="st-basis">
              <div><dt>Raag</dt><dd>{raag.name.replace(/^Raag\s+/i, "")}, {raag.thaat === "Not defined" ? "no thaat assigned" : `${raag.thaat} thaat`}{raag.vadiGiven === false ? "" : <>; vadi {SYM_NAMES[raag.vadi]}, samvadi {SYM_NAMES[raag.samvadi]}</>}</dd></div>
              <div><dt>Taal</dt><dd>{taal.name}, {taal.matras} matras in {taal.vibhags.length} vibhags of {taal.vibhags.join(" + ")}; taali on {taal.claps.map((x, i) => (x === "0" ? null : `${x === "X" ? "sam" : x}`)).filter(Boolean).join(", ")}, khali on vibhag {taal.claps.map((x, i) => (x === "0" ? i + 1 : null)).filter(Boolean).join(", ")}</dd></div>
              <div><dt>Theka</dt><dd className="st-theka">{(() => { let i = 0; return taal.vibhags.map(v => taal.theka.slice(i, (i += v)).map(m => m.join(" ")).join(" ")).join("  |  "); })()}</dd></div>
              <div><dt>Laya</dt><dd>{c.laya[0].toUpperCase() + c.laya.slice(1)} laya, approximately {c.bpm} matras per minute. The composition begins on sam; in playback the tabla plays one avartan of theka first.</dd></div>
              <div><dt>Form</dt><dd>{c.id.endsWith("basic-sargam-geet")
                ? <>The raag's principal phrases (mukhya ang) in their published order, each beginning on a vibhag of Teentaal and sustained to its end. Sthayi: the phrases below taar Sa. Antara: the phrases reaching taar Sa, then the aroh and avaroh.</>
                : <>Sthayi in the mandra and madhya saptak ({c.sthayi.length} avartans); antara rising to the taar saptak ({c.antara.length} avartans); the sthayi is then repeated.</>}</dd></div>
              {c.roman && <div><dt>Words</dt><dd>{c.roman}</dd></div>}
              {c.meaning && <div><dt>Meaning</dt><dd>{c.meaning}</dd></div>}
            </dl>

            <h4 className="st-part">{u("stSthayi")}</h4>
            <Swaralipi taal={taal} lines={c.sthayi} script={script} playing={playing} offset={0} />
            <h4 className="st-part">{u("stAntara")}</h4>
            <Swaralipi taal={taal} lines={c.antara} script={script} playing={playing} offset={c.sthayi.length * taal.matras} />
            <p className="st-muted st-small">
              Under each matra: the swara, {c.kind === "bandish" ? "the syllable, " : ""}and the taal mark (X sam, 0 khali, numbers taali). {script === "latin" ? "–" : "ऽ"}: hold the previous swara{c.kind === "bandish" ? " or syllable" : ""}. Two swaras in one cell share the matra.
            </p>
          </section>
        );
      })}

      <UserBandishForm raag={raag} onSaved={() => setUserVersion(v => v + 1)} />

      {/* ---------------------------------------------------------------- more */}
      <section className="st-sec">
        <h3 className="st-h">{u("stFurtherSargam")}</h3>
        <p className="st-lede">
          These exercises are derived from the aroh and avaroh: ascending movement uses only the swaras of the aroh, descending
          movement only those of the avaroh, and each phrase ends on a nyas swara. They observe the raag's swaras but not every
          feature of its chalan, and are therefore offered as exercises, not as phrases of the raag.
        </p>
        {extraSargams.map((set, si) => {
          const k = `sargam-${si}`;
          return (
            <div key={si} className="st-stage">
              <div className="st-stage-head">
                <h4>Set {si + 1}</h4>
                <button type="button" className="st-play" onClick={() => playPhrases(k, set)}>{player.key === k ? u("stStop") : u("stListen")}</button>
              </div>
              <ol className="st-phrases">{set.map((ph, i) => <li key={i}><Phrase text={ph} script={script} active={player.key === k && player.pos === i} /></li>)}</ol>
            </div>
          );
        })}
        <button type="button" className="st-more" onClick={() => setSargamSets(n => n + 1)}>{u("stShowSargam")}</button>
      </section>

      <section className="st-sec">
        <h3 className="st-h">{u("stFurtherAlaap")}</h3>
        <p className="st-lede">Slow phrases with sustained nyas swaras, derived in the same manner. To be sung in aakar.</p>
        {extraAlaap.map((set, si) => {
          const k = `more-alaap-${si}`;
          return (
            <div key={si} className="st-stage">
              <div className="st-stage-head">
                <h4>Set {si + 1}</h4>
                <button type="button" className="st-play" onClick={() => playPhrases(k, set)}>{player.key === k ? u("stStop") : u("stListen")}</button>
              </div>
              <ol className="st-phrases">{set.map((ph, i) => <li key={i}><Phrase text={ph} script={script} active={player.key === k && player.pos === i} /></li>)}</ol>
            </div>
          );
        })}
        <button type="button" className="st-more" onClick={() => setAlaapSets(n => n + 1)}>{u("stShowAlaap")}</button>
      </section>

      {!alaap && (
        <p className="st-muted">Written alaap and a bandish are at present available for Yaman, Bhupali, Bhairav, Malkauns, Bhimpalasi, Bageshree, Marwa, Puriya and Todi. For this raag, the sargam above is arranged from its mukhya ang, aroh and avaroh; it is an exercise, not a traditional composition.</p>
      )}
    </div>
  );
};
