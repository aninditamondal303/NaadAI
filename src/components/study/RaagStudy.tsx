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
import { ALAAP, compositionsFor, type Composition } from "../../data/compositions";
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
  const comps = compositionsFor(raag.id);
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
          Everything on this page was written for Naad AI to follow the raag's rules; it is not a traditional bandish.
          The guide voice is synthesised. Please learn traditional compositions from your guru, and check these with them.
        </p>
        {scriptPicker}
      </div>

      {/* ---------------------------------------------------------------- alaap */}
      {alaap && (
        <section className="st-sec">
          <h3 className="st-h">Alaap</h3>
          <p className="st-lede">Sung in aakar ("aa"), slowly and without taal. Each stage opens a little more of the raag. ऽ means hold the swara.</p>
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
              <h3 className="st-h">{c.kind === "bandish" ? `Bandish: ${c.title}` : "Sargam geet"}</h3>
              <button type="button" className="st-play st-play-main" onClick={() => playComposition(c)}>
                {player.key === c.id ? "Stop" : "Listen with tanpura and tabla"}
              </button>
            </div>

            <dl className="st-basis">
              <div><dt>Raag</dt><dd>{raag.name.replace(/^Raag\s+/i, "")}, {raag.thaat} thaat; vadi {SYM_NAMES[raag.vadi]}, samvadi {SYM_NAMES[raag.samvadi]}</dd></div>
              <div><dt>Taal</dt><dd>{taal.name}, {taal.matras} matras in {taal.vibhags.length} vibhags of {taal.vibhags.join(" + ")}; taali on {taal.claps.map((x, i) => (x === "0" ? null : `${x === "X" ? "sam" : x}`)).filter(Boolean).join(", ")}, khali on vibhag {taal.claps.map((x, i) => (x === "0" ? i + 1 : null)).filter(Boolean).join(", ")}</dd></div>
              <div><dt>Theka</dt><dd className="st-theka">{(() => { let i = 0; return taal.vibhags.map(v => taal.theka.slice(i, (i += v)).map(m => m.join(" ")).join(" ")).join("  |  "); })()}</dd></div>
              <div><dt>Laya</dt><dd>{c.laya}, about {c.bpm} matras a minute. It starts on sam (matra 1); the tabla plays one avartan first.</dd></div>
              <div><dt>Form</dt><dd>Sthayi (lower and middle range, {c.sthayi.length} avartans), then antara (rising to taar Sa, {c.antara.length} avartans), then back to the sthayi.</dd></div>
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
        <h3 className="st-h">More sargams</h3>
        <p className="st-lede">
          Generated from the aroh and avaroh: rising only on aroh swaras, falling only on avaroh swaras, ending on a resting swara.
          They follow the raag's scale but not every turn of its grammar, so treat them as exercises.
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
        <button type="button" className="st-more" onClick={() => setSargamSets(n => n + 1)}>Give me more sargams</button>
      </section>

      <section className="st-sec">
        <h3 className="st-h">More alaap</h3>
        <p className="st-lede">Slow phrases with long resting swaras, generated the same way. Sing them in aakar.</p>
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
        <button type="button" className="st-more" onClick={() => setAlaapSets(n => n + 1)}>Give me more alaap</button>
      </section>

      {!alaap && (
        <p className="st-muted">Written alaap, a sargam geet and a bandish are available for Yaman, Bhupali, Bhairav, Malkauns, Bhimpalasi, Bageshree, Marwa, Puriya and Todi. The generated sargams above work for every raag.</p>
      )}
    </div>
  );
};
