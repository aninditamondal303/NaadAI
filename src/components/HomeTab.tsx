/**
 * Home: the riyaz room. A timed riyaz with the tanpura (its strings drawn
 * moving with the real sound), today's plan, raags for the hour, and an
 * index of everything in the app.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RAAG_LIST } from '../data/allRaags';
import { RAAG_DETAILS } from '../data/raagDetails';
import { addRecord, newId } from '../lib/practiceHistory';
import { firstStringForRaag, STRING_ORDER, TanpuraEngine, type FirstString } from '../audio/tanpura';
import { westernNote } from '../analysis/music';
import { generatePaltas } from '../practice/paltas';
import { praharFor, raagsForHour } from '../practice/raagTime';
import type { AppTab } from '../types';
import type { AnalyzerMode } from './AnalyzerTab';
import { TodayPanel } from './home/TodayPanel';
import { TanpuraStrings } from './home/TanpuraStrings';
import { useLang } from '../i18n/lang';
import { Phrase } from './study/Swaralipi';
import type { Lang } from '../i18n/strings';

interface HomeTabProps {
  setActiveTab: (tab: AppTab) => void;
  setAnalyzerMode?: (mode: AnalyzerMode) => void;
  setPracticeMode?: (mode: "palta" | "pakad" | "ear" | "match") => void;
  vocalistName?: string;
  baseTonicHz?: number;
}

interface Session {
  raagId: string;
  raagName: string;
  minutes: number;
  endsAt: number;
  startedAt: number;
  tuning: FirstString;
  cycleSec: number;
  volume: number;
}

const RAAGS = [...RAAG_LIST].sort((a, b) => a.name.localeCompare(b.name));
const shortName = (n: string) => n.replace(/^Raag\s+/i, "");

const STRING_LABELS: Record<"deva" | "beng", Record<FirstString, string>> = {
  deva: { Pa: "प़", Ma: "म़", Ni: "ऩि" },
  beng: { Pa: "পা", Ma: "মা", Ni: "নি" },
};

function digits(lang: Lang) {
  const nf = new Intl.NumberFormat(lang === "hi" ? "hi-IN-u-nu-deva" : lang === "bn" ? "bn-IN-u-nu-beng" : "en-IN", { minimumIntegerDigits: 2, useGrouping: false });
  return (n: number) => nf.format(n);
}

export const HomeTab: React.FC<HomeTabProps> = ({ setActiveTab, setAnalyzerMode, setPracticeMode, vocalistName = "", baseTonicHz = 130.81 }) => {
  const { lang, t } = useLang();
  const h = t.home;
  // Start with a raag suited to this hour, if the library lists one
  const [raagId, setRaagId] = useState(() => raagsForHour(RAAG_LIST, new Date().getHours())[0]?.id ?? "yaman");
  const [minutes, setMinutes] = useState(15);
  const [session, setSession] = useState<Session | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [message, setMessage] = useState<string | null>(null);
  const [pluck, setPluck] = useState<[number, number] | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [recorded, setRecorded] = useState(false);
  const audio = useRef<{ ctx: AudioContext; eng: TanpuraEngine } | null>(null);
  const pluckCount = useRef(0);

  const raag = RAAGS.find(r => r.id === raagId) ?? RAAGS[0];
  const sa = westernNote(baseTonicHz);
  const prahar = praharFor(new Date().getHours());
  const fmt = digits(lang);
  const num = (n: number) => new Intl.NumberFormat(lang === "hi" ? "hi-IN-u-nu-deva" : lang === "bn" ? "bn-IN-u-nu-beng" : "en-IN").format(n);
  const script = lang === "bn" ? "beng" : "deva";
  const noteScript = lang === "bn" ? "beng" as const : "deva" as const;
  const tuning = session?.tuning ?? firstStringForRaag(raag.allowedSwaras);
  const labels = useMemo(() => [STRING_LABELS[script][tuning], script === "beng" ? "সা" : "सा", script === "beng" ? "সা" : "सा", script === "beng" ? "সা" : "सा़"], [script, tuning]);

  // ---- tanpura
  const stopAudio = () => {
    const a = audio.current;
    audio.current = null;
    if (!a) return;
    a.eng.disconnect();
    setTimeout(() => a.ctx.close().catch(() => {}), 800);
    setAnalyser(null);
  };
  useEffect(() => () => stopAudio(), []);

  const start = async () => {
    stopAudio();
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx: AudioContext = new Ctx();
    const bus = ctx.createGain();
    const an = ctx.createAnalyser();
    an.fftSize = 1024;
    bus.connect(an);
    an.connect(ctx.destination);
    const first = firstStringForRaag(raag.allowedSwaras);
    const eng = new TanpuraEngine(ctx, bus, { saHz: baseTonicHz, firstString: first, cycleSec: 4.5, volume: 0.7 });
    eng.onPluck = s => setPluck([STRING_ORDER.indexOf(s), ++pluckCount.current]);
    audio.current = { ctx, eng };
    await eng.loadSamples();
    if (audio.current?.eng !== eng) return;
    eng.start();
    setRecorded(eng.usesRecordedDrone());
    setAnalyser(an);
    const t0 = Date.now();
    setSession({ raagId: raag.id, raagName: shortName(raag.name), minutes, startedAt: t0, endsAt: t0 + minutes * 60_000, tuning: first, cycleSec: 4.5, volume: 0.7 });
  };

  const save = (min: number, name: string, done: boolean) => {
    addRecord({ kind: "riyaz-timer", id: newId(), dateIso: new Date().toISOString(), raagName: `Raag ${name}`, minutes: min });
    setMessage(done ? h.complete(min, name) : h.saved(min, name));
  };

  const finish = (keep: boolean) => {
    if (!session) return;
    stopAudio();
    const min = Number(((Date.now() - session.startedAt) / 60_000).toFixed(1));
    if (keep) {
      if (min >= 0.5) save(Math.round(min * 10) / 10, session.raagName, false);
      else setMessage(h.tooShort);
    }
    setSession(null);
  };

  useEffect(() => {
    if (!session) return;
    const id = window.setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= session.endsAt) {
        stopAudio();
        save(session.minutes, session.raagName, true);
        setSession(null);
      }
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const change = (p: Partial<Pick<Session, "tuning" | "cycleSec" | "volume">>) => {
    if (!session) return;
    setSession({ ...session, ...p });
    audio.current?.eng.setOptions({
      ...(p.tuning ? { firstString: p.tuning } : {}),
      ...(p.cycleSec ? { cycleSec: p.cycleSec } : {}),
      ...(p.volume !== undefined ? { volume: p.volume } : {}),
    });
    if (p.tuning) setRecorded(audio.current?.eng.usesRecordedDrone() ?? false);
  };

  const go = (tab: AppTab, mode?: string) => {
    if (tab === "analyzer" && mode) setAnalyzerMode?.(mode as AnalyzerMode);
    if (tab === "practice") setPracticeMode?.((mode as "palta" | "pakad" | "ear" | "match") ?? "palta");
    setActiveTab(tab);
  };

  const left = session ? Math.max(0, Math.ceil((session.endsAt - now) / 1000)) : minutes * 60;
  const details = session ? RAAG_DETAILS[session.raagId] : null;
  const sessionRaag = session ? RAAGS.find(r => r.id === session.raagId) : null;

  return (
    <div className="rz-home">
      <section className="rz-room" aria-label={h.start}>
        <div className="rz-room-text">
          <h1 className="rz-greet">{h.greet(vocalistName)}</h1>
          <p className="rz-muted">{h.yourSa(sa.name, baseTonicHz.toFixed(1))} {t.hour(prahar.number, prahar.name.includes("night"), [])}</p>

          {!session ? (
            <form className="rz-setup" onSubmit={e => { e.preventDefault(); void start(); }}>
              <label className="rz-field">
                <span>{h.raag}</span>
                <select value={raagId} onChange={e => setRaagId(e.target.value)}>
                  {RAAGS.map(r => <option key={r.id} value={r.id}>{shortName(r.name)}</option>)}
                </select>
              </label>
              <fieldset className="rz-field">
                <legend>{h.minutes}</legend>
                <div className="rz-choices">
                  {[5, 15, 30, 45, 60].map(m => (
                    <label key={m}>
                      <input type="radio" name="rz-min" checked={minutes === m} onChange={() => setMinutes(m)} />
                      <span>{num(m)} {h.minUnit}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <button type="submit" className="rz-btn">{h.start}</button>
            </form>
          ) : (
            <div className="rz-session">
              <p className="rz-running">{h.running(session.raagName)}</p>
              <p className="rz-clock" aria-live="off">
                {fmt(Math.floor(left / 60))}<span className="rz-colon">:</span>{fmt(left % 60)}
                <span className="rz-clock-note">{h.left}</span>
              </p>
              <div className="rz-controls">
                <fieldset className="rz-field">
                  <legend>{h.tuning}</legend>
                  <div className="rz-choices">
                    {(["Pa", "Ma", "Ni"] as FirstString[]).map(f => (
                      <label key={f}>
                        <input type="radio" name="rz-tuning" checked={session.tuning === f} onChange={() => change({ tuning: f })} />
                        <span>{STRING_LABELS[script][f].replace("़", "")}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="rz-field rz-range">
                  <span>{h.speed}</span>
                  <input type="range" min={3} max={7} step={0.25} value={10 - session.cycleSec}
                    onChange={e => change({ cycleSec: 10 - Number(e.target.value) })} aria-valuetext={`${session.cycleSec.toFixed(1)} s`} />
                </label>
                <label className="rz-field rz-range">
                  <span>{h.volume}</span>
                  <input type="range" min={0.1} max={1} step={0.05} value={session.volume} onChange={e => change({ volume: Number(e.target.value) })} />
                </label>
              </div>
              <div className="rz-actions">
                <button type="button" className="rz-btn" onClick={() => finish(true)}>{h.stopSave}</button>
                <button type="button" className="rz-link" onClick={() => finish(false)}>{h.discard}</button>
              </div>
            </div>
          )}
          {message && <p className="rz-message" role="status">{message}</p>}
        </div>

        <figure className="rz-room-strings">
          <TanpuraStrings analyser={analyser} pluck={pluck} labels={labels} label={h.stringsLabel} />
          {session && recorded && <figcaption className="rz-muted">{h.recordedDrone}</figcaption>}
        </figure>
      </section>

      {session && sessionRaag && (
        <section className="rz-sheet">
          <dl className="rz-notation">
            <div><dt>{h.aroh}</dt><dd><Phrase text={sessionRaag.aroha.join(" ")} script={noteScript} /></dd></div>
            <div><dt>{h.avaroh}</dt><dd><Phrase text={sessionRaag.avaroha.join(" ")} script={noteScript} /></dd></div>
            <div><dt>{h.pakad}</dt><dd>{details ? <Phrase text={details.pakad} script={noteScript} /> : h.notWritten}</dd></div>
          </dl>
          <h2 className="rz-h2">{h.paltas}</h2>
          <ol className="rz-paltas">
            {generatePaltas(sessionRaag).slice(0, 3).map(p => (
              <li key={p.id}><span>{p.name}</span> <Phrase text={p.notes.map(n => n.label).join(" ")} script={noteScript} /></li>
            ))}
          </ol>
          <p className="rz-muted rz-small">{h.review}</p>
        </section>
      )}

      <TodayPanel onGo={(g) => go(g.tab as AppTab, g.mode)} />

      <section className="rz-index" aria-labelledby="rz-index-h">
        <h2 id="rz-index-h" className="rz-h2">{h.index}</h2>
        <ul>
          {(["tanpura", "analyzer", "practice", "journal", "progress", "library"] as const).map(id => (
            <li key={id}>
              <button type="button" onClick={() => go(id, id === "analyzer" ? "singing" : undefined)}>
                <span className="rz-index-name">{t.tabs[id]}</span>
                <span className="rz-index-desc">{h.items[id]}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
