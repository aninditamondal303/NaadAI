/**
 * Study a raag: alaap in three stages, a sargam geet and a bandish in
 * swaralipi (with what each is based on: raag, taal, laya, structure), and
 * as many extra sargam and alaap phrases as the student wants. Everything
 * can be played: a guide voice for the swaras, with the recorded tanpura,
 * and the recorded tabla for compositions.
 */
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

  const play = async (k: string, notes: TimedNote[], opts: { secPerUnit: number; taal?: { id: string; bpm: number }; units: number }) => {
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
    const stopVoice = scheduleSwaras(ctx, ctx.destination, notes, saHz, t0);
    const end = t0 + (notes.length ? Math.max(...notes.map(n => n.start + n.dur)) : 0);
    let raf = 0;
    const tick = () => {
      const t = ctx.currentTime;
      if (t > end + 0.4) { stop(); return; }
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
        window.setTimeout(() => void ctx.close(), 400);
      },
    };
    setKey(k);
  };

  return { key, pos, play, stop };
}

export const RaagStudy: React.FC<{ raag: ComprehensiveRaag; saHz: number }> = ({ raag, saHz }) => {
  const { lang } = useLang();
  const [script, setScript] = useState<NoteScript>(lang === "bn" ? "beng" : lang === "en" ? "latin" : "deva");
  const d = RAAG_DETAILS[raag.id];
  const alaap = ALAAP[raag.id];
  const comps = compositionsForRaag(raag);
  const player = usePlayer(saHz, raag);
  const [sargamSets, setSargamSets] = useState(1);
  const [alaapSets, setAlaapSets] = useState(1);
  const nyas = d?.nyas ?? [];
  const extraSargams = useMemo(() => Array.from({ length: sargamSets }, (_, i) => moreSargams(raag, i + 1, nyas)), [raag, sargamSets]);
  const extraAlaap = useMemo(() => Array.from({ length: alaapSets }, (_, i) => moreAlaap(raag, i + 1, nyas)), [raag, alaapSets]);

  useEffect(() => { player.stop(); setSargamSets(1); setAlaapSets(1); }, [raag.id]);

  const playPhrases = (k: string, phrases: string[]) =>
    player.key === k ? player.stop() : void player.play(k, timePhrases(phrases), { secPerUnit: 0.7, units: phrases.length });

  const playComposition = (c: Composition) => {
    const k = c.id;
    if (player.key === k) { player.stop(); return; }
    const lines = [...c.sthayi, ...c.antara].map(l => l.notes);
    const spm = 60 / c.bpm;
    void player.play(k, timeLines(lines, spm).notes, { secPerUnit: spm, taal: { id: c.taalId, bpm: c.bpm }, units: lines.length * 16 });
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
          <h3 className="st-h">Alaap</h3>
          <p className="st-lede">Alaap is sung in aakar, slowly and without taal. Each stage develops a further region of the raag. The sign ऽ indicates that the swara is sustained.</p>
          {alaap.map((stage, si) => {
            const k = `alaap-${si}`;
            return (
              <div key={si} className="st-stage">
                <div className="st-stage-head">
                  <h4>{stage.name}</h4>
                  <button type="button" className="st-play" onClick={() => playPhrases(k, stage.phrases)}>{player.key === k ? "Stop" : "Listen"}</button>
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
        const playing = player.key === c.id ? player.pos : null;
        return (
          <section key={c.id} className="st-sec">
            <div className="st-stage-head">
              <h3 className="st-h">{c.kind === "bandish" ? `Bandish: ${c.title}` : c.id.endsWith("basic-sargam-geet") ? c.title : "Sargam geet"}</h3>
              <button type="button" className="st-play st-play-main" onClick={() => playComposition(c)}>
                {player.key === c.id ? "Stop" : "Listen with tanpura and tabla"}
              </button>
            </div>

            <dl className="st-basis">
              <div><dt>Raag</dt><dd>{raag.name.replace(/^Raag\s+/i, "")}, {raag.thaat} thaat; vadi {SYM_NAMES[raag.vadi]}, samvadi {SYM_NAMES[raag.samvadi]}</dd></div>
              <div><dt>Taal</dt><dd>{taal.name}, {taal.matras} matras in {taal.vibhags.length} vibhags of {taal.vibhags.join(" + ")}; taali on {taal.claps.map((x, i) => (x === "0" ? null : `${x === "X" ? "sam" : x}`)).filter(Boolean).join(", ")}, khali on vibhag {taal.claps.map((x, i) => (x === "0" ? i + 1 : null)).filter(Boolean).join(", ")}</dd></div>
              <div><dt>Theka</dt><dd className="st-theka">{(() => { let i = 0; return taal.vibhags.map(v => taal.theka.slice(i, (i += v)).map(m => m.join(" ")).join(" ")).join("  |  "); })()}</dd></div>
              <div><dt>Laya</dt><dd>{c.laya[0].toUpperCase() + c.laya.slice(1)} laya, approximately {c.bpm} matras per minute. The composition begins on sam; in playback the tabla plays one avartan of theka first.</dd></div>
              <div><dt>Form</dt><dd>{c.id.endsWith("basic-sargam-geet")
                ? <>The raag's principal phrases (mukhya ang) in their published order, each beginning on a vibhag of Teentaal and sustained to its end. Sthayi: the phrases below taar Sa. Antara: the phrases reaching taar Sa, then the aroh and avaroh.</>
                : <>Sthayi in the mandra and madhya saptak ({c.sthayi.length} avartans); antara rising to the taar saptak ({c.antara.length} avartans); the sthayi is then repeated.</>}</dd></div>
              {c.roman && <div><dt>Words</dt><dd>{c.roman}</dd></div>}
              {c.meaning && <div><dt>Meaning</dt><dd>{c.meaning}</dd></div>}
            </dl>

            <h4 className="st-part">Sthayi</h4>
            <Swaralipi taal={taal} lines={c.sthayi} script={script} playing={playing} offset={0} />
            <h4 className="st-part">Antara</h4>
            <Swaralipi taal={taal} lines={c.antara} script={script} playing={playing} offset={c.sthayi.length * taal.matras} />
            <p className="st-muted st-small">
              Under each matra: the swara, {c.kind === "bandish" ? "the syllable, " : ""}and the taal mark (X sam, 0 khali, numbers taali). ऽ: hold the previous swara{c.kind === "bandish" ? " or syllable" : ""}. Two swaras in one cell share the matra.
            </p>
          </section>
        );
      })}

      {/* ---------------------------------------------------------------- more */}
      <section className="st-sec">
        <h3 className="st-h">Further sargam exercises</h3>
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
                <button type="button" className="st-play" onClick={() => playPhrases(k, set)}>{player.key === k ? "Stop" : "Listen"}</button>
              </div>
              <ol className="st-phrases">{set.map((ph, i) => <li key={i}><Phrase text={ph} script={script} active={player.key === k && player.pos === i} /></li>)}</ol>
            </div>
          );
        })}
        <button type="button" className="st-more" onClick={() => setSargamSets(n => n + 1)}>Show further sargam exercises</button>
      </section>

      <section className="st-sec">
        <h3 className="st-h">Further alaap exercises</h3>
        <p className="st-lede">Slow phrases with sustained nyas swaras, derived in the same manner. To be sung in aakar.</p>
        {extraAlaap.map((set, si) => {
          const k = `more-alaap-${si}`;
          return (
            <div key={si} className="st-stage">
              <div className="st-stage-head">
                <h4>Set {si + 1}</h4>
                <button type="button" className="st-play" onClick={() => playPhrases(k, set)}>{player.key === k ? "Stop" : "Listen"}</button>
              </div>
              <ol className="st-phrases">{set.map((ph, i) => <li key={i}><Phrase text={ph} script={script} active={player.key === k && player.pos === i} /></li>)}</ol>
            </div>
          );
        })}
        <button type="button" className="st-more" onClick={() => setAlaapSets(n => n + 1)}>Show further alaap exercises</button>
      </section>

      {!alaap && (
        <p className="st-muted">Written alaap and a bandish are at present available for Yaman, Bhupali, Bhairav, Malkauns, Bhimpalasi, Bageshree, Marwa, Puriya and Todi. For this raag, the sargam above is arranged from its mukhya ang, aroh and avaroh; it is an exercise, not a traditional composition.</p>
      )}
    </div>
  );
};
