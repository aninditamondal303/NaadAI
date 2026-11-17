/**
 * The welcome page. The top of the page is an instrument: a real tanpura
 * drone, the swaras of Raag Yaman as lines, and the visitor's voice (or the
 * demo recording) drawn on them as it is measured.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { MicSession } from "../../audio/mic";
import { TanpuraEngine } from "../../audio/tanpura";
import { decodeAudioFile } from "../../audio/decode";
import { trackPitch } from "../../analysis/track";
import { createLiveTracker } from "../../analysis/live";
import { RAAG_LIST } from "../../data/allRaags";
import { praharFor, raagsForHour } from "../../practice/raagTime";
import { drawStage, nearestSwara, type Script, type TracePoint, type View } from "./stage";
import { SKIES, skyForHour, type Sky, type SkyName } from "./sky";
import "./landing.css";
import { useLang } from "../../i18n/lang";
import { LangPicker } from "../../i18n/LangPicker";

const DEMO_URL = `${import.meta.env.BASE_URL}samples/demo/yaman-demo.wav`;
const DEMO_SA = 130.81;
const REPO = "https://github.com/aninditamondal303/naadai";
const SA_CHOICES = [
  { id: "low", label: "Sa C", hz: 130.81, hint: "most men" },
  { id: "high", label: "Sa G", hz: 196.0, hint: "most women" },
] as const;

type Mode = "idle" | "loading" | "demo" | "live";

interface Props {
  /** Name of the singer last used on this device, if any. */
  returningName: string | null;
  onOpenApp: () => void;
  onDemoAnalysis: () => void;
}

function initialSky(): Sky {
  const forced = new URLSearchParams(window.location.search).get("sky") as SkyName | null;
  if (forced && SKIES[forced]) return SKIES[forced];
  return skyForHour(new Date().getHours());
}

const prefersReducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

export const Landing: React.FC<Props> = ({ returningName, onOpenApp, onDemoAnalysis }) => {
  const sky = useMemo(initialSky, []);
  const { lang, t } = useLang();
  // Refs so the animation loop always reads the current language
  const tRef = useRef(t);
  tRef.current = t;
  const script: Script = lang === "bn" ? "beng" : "deva";
  const scriptRef = useRef<Script>(script);
  scriptRef.current = script;
  const hour = new Date().getHours();
  const prahar = praharFor(hour);
  const hourRaags = useMemo(() => raagsForHour(RAAG_LIST, hour).slice(0, 3).map(r => r.name.replace(/^Raag /, "")), [hour]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const readoutRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [demoDone, setDemoDone] = useState(false);
  const [saId, setSaId] = useState<"low" | "high">("low");
  const [message, setMessage] = useState<string | null>(null);

  // Everything the animation loop reads lives in refs.
  const demo = useRef<{ points: TracePoint[]; duration: number; samples: Float32Array; sampleRate: number } | null>(null);
  const view = useRef<View | null>(null);
  const raf = useRef<number | null>(null);
  const audio = useRef<{ ctx: AudioContext; tanpura: TanpuraEngine; voice?: AudioBufferSourceNode; mic?: MicSession } | null>(null);

  // ---------------------------------------------------------------- drawing
  const paint = () => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawStage(ctx, w, h, sky, view.current, scriptRef.current);
  };

  const loop = (step: () => boolean) => {
    if (raf.current) cancelAnimationFrame(raf.current);
    const tick = () => {
      const more = step();
      paint();
      raf.current = more ? requestAnimationFrame(tick) : null;
    };
    raf.current = requestAnimationFrame(tick);
  };

  const setReadout = (cents: number | null) => {
    const el = readoutRef.current;
    if (!el) return;
    if (cents === null) { el.dataset.on = "false"; return; }
    const { label, off, saptak } = nearestSwara(cents, scriptRef.current);
    const tr = tRef.current.read;
    const r = Math.round(off);
    el.dataset.on = "true";
    el.querySelector<HTMLElement>("[data-swara]")!.textContent = label;
    el.querySelector<HTMLElement>("[data-saptak]")!.textContent = saptak === "madhya" ? "" : tr[saptak];
    el.querySelector<HTMLElement>("[data-off]")!.textContent =
      r === 0 ? tr.onNote : r > 0 ? tr.sharp(r) : tr.flat(-r);
  };

  // ------------------------------------------------- load and reveal the demo
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(DEMO_URL);
        if (!res.ok) throw new Error(String(res.status));
        const { samples, sampleRate } = await decodeAudioFile(await res.blob());
        const track = trackPitch(samples, sampleRate, "mpm");
        const points: TracePoint[] = track.frames.map(f => ({
          t: f.timeSec,
          c: f.hz === null ? null : 1200 * Math.log2(f.hz / DEMO_SA),
        }));
        const duration = samples.length / sampleRate;
        if (cancelled) return;
        demo.current = { points, duration, samples, sampleRate };
        if (prefersReducedMotion()) {
          view.current = { kind: "track", points, duration, reveal: duration, ghostRest: false, now: 0 };
          paint();
          return;
        }
        // The one orchestrated moment: the demo phrase writes itself across the lines.
        const start = performance.now();
        const ms = 3200;
        loop(() => {
          const p = Math.min(1, (performance.now() - start) / ms);
          const eased = 1 - Math.pow(1 - p, 3);
          view.current = { kind: "track", points, duration, reveal: eased * duration, ghostRest: false, now: 0 };
          return p < 1;
        });
      } catch {
        paint(); // lines only; the demo button will report the problem
      }
    })();
    const onResize = () => paint();
    window.addEventListener("resize", onResize);
    paint();
    // The swara labels are drawn in Tiro Devanagari; repaint once it has loaded.
    document.fonts?.ready.then(() => { if (!raf.current) paint(); });
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      if (raf.current) cancelAnimationFrame(raf.current);
      void stopAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Repaint the swara labels in the new script
  useEffect(() => { if (!raf.current) paint(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [lang]);

  // ---------------------------------------------------------------- audio
  const stopAudio = async () => {
    const a = audio.current;
    audio.current = null;
    if (!a) return;
    try { a.voice?.stop(); } catch { /* already stopped */ }
    a.tanpura.stop();
    if (a.mic) await a.mic.close();
    else await a.ctx.close();
  };

  const stop = async () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    await stopAudio();
    setReadout(null);
    setMode("idle");
    setMessage(null);
    const d = demo.current;
    if (d) view.current = { kind: "track", points: d.points, duration: d.duration, reveal: d.duration, ghostRest: false, now: 0 };
    paint();
  };

  const playDemo = async () => {
    await stop();
    const d = demo.current;
    if (!d) { setMessage(tRef.current.err.demoMissing); return; }
    setMode("loading");
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx: AudioContext = new Ctx();
    const tanpura = new TanpuraEngine(ctx, ctx.destination, { saHz: DEMO_SA, firstString: "Pa", cycleSec: 4.5, volume: 0.42 });
    await tanpura.loadSamples();
    tanpura.start();
    const buf = ctx.createBuffer(1, d.samples.length, d.sampleRate);
    buf.copyToChannel(d.samples, 0);
    const voice = ctx.createBufferSource();
    voice.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.value = 0.9;
    voice.connect(gain).connect(ctx.destination);
    const t0 = ctx.currentTime + 1.6; // let the drone settle first
    voice.start(t0);
    audio.current = { ctx, tanpura, voice };
    setMode("demo");
    setDemoDone(false);
    loop(() => {
      if (!audio.current) return false;
      const t = Math.max(0, ctx.currentTime - t0);
      view.current = { kind: "track", points: d.points, duration: d.duration, reveal: Math.min(t, d.duration), ghostRest: true, now: 0 };
      const head = t > 0 ? lastPoint(d.points, t) : null;
      setReadout(head && t - head.t < 0.05 ? head.c : null);
      if (t >= d.duration) {
        setDemoDone(true);
        void stop();
        return false;
      }
      return true;
    });
  };

  const sing = async () => {
    await stop();
    setMode("loading");
    let mic: MicSession;
    try {
      mic = await MicSession.open();
    } catch (e: any) {
      setMode("idle");
      setMessage(e?.name === "NotAllowedError"
        ? tRef.current.err.micBlocked
        : tRef.current.err.micFailed(String(e?.message || e)));
      return;
    }
    const saHz = SA_CHOICES.find(s => s.id === saId)!.hz;
    const ctx = mic.context;
    const tanpura = new TanpuraEngine(ctx, ctx.destination, { saHz, firstString: "Pa", cycleSec: 4.5, volume: 0.42 });
    await tanpura.loadSamples();
    tanpura.start();
    audio.current = { ctx, tanpura, mic };
    setMode("live");

    const tracker = createLiveTracker(mic, saHz);
    const points = tracker.points;
    loop(() => {
      if (!audio.current) return false;
      const now = ctx.currentTime;
      const c = tracker.step(now);
      view.current = { kind: "live", points, duration: 0, reveal: 0, ghostRest: false, now };
      setReadout(c);
      return true;
    });
  };

  // ---------------------------------------------------------------- markup
  const vars = {
    "--sky-top": sky.top, "--sky-bottom": sky.bottom, "--ink": sky.ink, "--muted": sky.muted,
    "--line": sky.line, "--line-strong": sky.lineStrong, "--voice": sky.voice,
    "--btn-bg": sky.buttonBg, "--btn-ink": sky.buttonInk,
  } as React.CSSProperties;

  const hourLine = t.hour(prahar.number, prahar.name.includes("night"), hourRaags);
  const openLabel = returningName ? t.nav.continueAs(returningName) : t.nav.open;
  const A = t.accuracy;

  return (
    <div className={`ln ln-${sky.name}`} style={vars} lang={lang}>
      <div className="ln-first">
        <header className="ln-top">
          <span className="ln-mark"><span lang={lang === "bn" ? "bn" : "hi"} className="ln-mark-deva">{lang === "bn" ? "নাদ" : "नाद"}</span> Naad AI</span>
          <nav className="ln-nav" aria-label="Page">
            <a href="#listens">{t.nav.listens}</a>
            <a href="#accuracy">{t.nav.accuracy}</a>
            <a href={REPO}>{t.nav.source}</a>
            <LangPicker />
            <button type="button" className="ln-open" onClick={onOpenApp}>{openLabel}</button>
          </nav>
        </header>

        <div className="ln-stage" data-mode={mode}>
          <canvas ref={canvasRef} className="ln-canvas" aria-label={t.stageLabel} role="img" />
          <div ref={readoutRef} className="ln-readout" data-on="false" aria-live="off">
            <span data-swara className="ln-readout-swara" />
            <span data-saptak className="ln-readout-saptak" />
            <span data-off className="ln-readout-off" />
          </div>
        </div>

        <section className="ln-intro" aria-labelledby="ln-title">
          <div className="ln-copy">
            <h1 id="ln-title">{t.title}</h1>
            <p>{t.intro}</p>
          </div>

          <div className="ln-controls">
            {mode === "live" || mode === "demo" ? (
              <button type="button" className="ln-btn ln-btn-main" onClick={() => void stop()}>{t.stop}</button>
            ) : (
              <>
                <div className="ln-row">
                  <button type="button" className="ln-btn ln-btn-main" disabled={mode === "loading"} onClick={() => void sing()}>
                    {t.sing}
                  </button>
                  <fieldset className="ln-sa">
                    <legend className="ln-visually-hidden">{t.saLegend}</legend>
                    {SA_CHOICES.map(s => (
                      <label key={s.id} title={s.id === "low" ? t.saLowHint : t.saHighHint}>
                        <input type="radio" name="ln-sa" value={s.id} checked={saId === s.id} onChange={() => setSaId(s.id)} />
                        <span>{s.id === "low" ? t.saLow : t.saHigh}</span>
                      </label>
                    ))}
                  </fieldset>
                </div>
                <button type="button" className="ln-btn ln-btn-quiet" disabled={mode === "loading"} onClick={() => void playDemo()}>
                  {t.demo}
                </button>
              </>
            )}
            <p className="ln-status" role="status">
              {message ?? (mode === "live"
                ? t.status.listening
                : mode === "demo"
                  ? t.status.demo
                  : mode === "loading"
                    ? t.status.loading
                    : demoDone
                      ? <button type="button" className="ln-link" onClick={onDemoAnalysis}>{t.status.seeAnalysis}</button>
                      : t.status.idle)}
            </p>
          </div>

          <p className="ln-hour">{hourLine}</p>
        </section>
      </div>

      <main className="ln-read">
        <section id="listens" className="ln-sec">
          <h2>{t.listens.h}</h2>
          <p className="ln-lede">{t.listens.lede}</p>
          <dl className="ln-dl">
            {t.listens.items.map(([dt, dd]) => <div key={dt}><dt>{dt}</dt><dd>{dd}</dd></div>)}
          </dl>
        </section>

        <section id="accuracy" className="ln-sec">
          <h2>{A.h}</h2>
          <p className="ln-lede">{A.lede}</p>
          <table className="ln-table">
            <caption className="ln-visually-hidden">{A.h}</caption>
            <tbody>
              {A.rows.map(([th, v, note]) => <tr key={th}><th scope="row">{th}</th><td>{v}</td><td>{note}</td></tr>)}
            </tbody>
          </table>
          <p className="ln-note">
            {A.tablesPre} <a href={`${REPO}/blob/main/eval/results/pitch-benchmark.md`}>{A.pitch}</a> {A.and}{" "}
            <a href={`${REPO}/blob/main/eval/results/sa-benchmark.md`}>{A.sa}</a>. {A.helpPre}{" "}
            <a href={`${REPO}/blob/main/docs/recording-guide.md`}>{A.guide}</a>{A.helpPost}
          </p>
        </section>

        <section className="ln-sec">
          <h2>{t.practise.h}</h2>
          <dl className="ln-dl">
            {t.practise.items.map(([dt, dd]) => <div key={dt}><dt>{dt}</dt><dd>{dd}</dd></div>)}
          </dl>
        </section>

        <section className="ln-sec">
          <h2>{t.privacy.h}</h2>
          <p className="ln-lede">{t.privacy.lede}</p>
        </section>

        <div className="ln-again">
          <button type="button" className="ln-btn ln-btn-main" onClick={onOpenApp}>{openLabel}</button>
        </div>
      </main>

      <footer className="ln-foot">
        <p>
          {t.credit} <a href="https://github.com/oormicreations/naad">{t.creditLink}</a> {t.creditPost} {t.review}
        </p>
        <p><a href={REPO}>{t.sourceCode}</a></p>
      </footer>
    </div>
  );
};

function lastPoint(points: TracePoint[], t: number): TracePoint | null {
  let lo = 0, hi = points.length - 1, idx = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (points[mid].t <= t) { idx = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return idx >= 0 ? points[idx] : null;
}
