/**
 * Swara lines with a pitch trace, for use inside the app. While `running`,
 * it repaints every animation frame from `getView()`.
 */
import React, { useEffect, useRef } from "react";
import { drawStage, type GridLine, type View } from "../landing/stage";
import { SKIES, type Sky } from "../landing/sky";
import { useLang } from "../../i18n/lang";

interface Props {
  grid: GridLine[];
  getView: () => View | null;
  running: boolean;
  sky?: Sky;
  className?: string;
  label: string;
}

export const SwaraCanvas: React.FC<Props> = ({ grid, getView, running, sky = SKIES.night, className, label }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const { lang } = useLang();
  const script = lang === "bn" ? "beng" : "deva";

  const paint = () => {
    const c = ref.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawStage(ctx, w, h, sky, getView(), script, grid);
  };

  useEffect(() => {
    paint();
    if (!running) return;
    let raf = 0;
    const tick = () => { paint(); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, grid, script]);

  useEffect(() => {
    const onResize = () => paint();
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(paint);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={ref} className={className} role="img" aria-label={label} />;
};
