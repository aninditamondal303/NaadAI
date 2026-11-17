/**
 * Profile: the singer's Sa and what their saved recordings show so far.
 * Everything is computed from the practice history in this browser.
 * With too little data, we say so instead of guessing.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useUi } from '../i18n/ui';
import { RiyazReminder } from './RiyazReminder';
import { centsBetween, signedCents, westernNote } from '../analysis/music';
import { SWARA_NAMES, SWARA_SYMBOLS } from '../analysis/summary';
import { clearHistory, loadHistory, onHistoryChange, type PracticeRecord } from '../lib/practiceHistory';
import { deleteProfile, exportProfile } from '../lib/profiles';

/** Minimum held time on a swara (across all recordings) before we describe it. */
const MIN_SWARA_SEC = 5;

interface ProfileTabProps {
  baseTonicHz: number;
  vocalistName?: string;
  profileId?: string | null;
  onDeleted?: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ baseTonicHz, vocalistName, profileId, onDeleted }) => {
  const u = useUi();
  const [history, setHistory] = useState<PracticeRecord[]>(() => loadHistory());
  useEffect(() => onHistoryChange(() => setHistory(loadHistory())), []);

  const analyses = history.filter((r): r is Extract<PracticeRecord, { kind: "analysis" }> => r.kind === "analysis");
  const saChecks = history.filter((r): r is Extract<PracticeRecord, { kind: "sa-check" }> => r.kind === "sa-check");
  const sa = westernNote(baseTonicHz);

  // Range across all analyses, in semitones from each session's Sa.
  const range = useMemo(() => {
    let low: { semis: number; label: string } | null = null;
    let high: { semis: number; label: string } | null = null;
    for (const a of analyses) {
      if (a.lowest) {
        const s = centsBetween(a.lowest.hz, a.saHz) / 100;
        if (!low || s < low.semis) low = { semis: s, label: a.lowest.label };
      }
      if (a.highest) {
        const s = centsBetween(a.highest.hz, a.saHz) / 100;
        if (!high || s > high.semis) high = { semis: s, label: a.highest.label };
      }
    }
    return low && high ? { low, high } : null;
  }, [analyses]);

  // Per-swara tendencies, weighted by held time.
  const swaraStats = useMemo(() => {
    const acc = new Map<string, { sec: number; dev: number; wob: number }>();
    for (const a of analyses) {
      for (const s of a.swaras) {
        const e = acc.get(s.symbol) ?? { sec: 0, dev: 0, wob: 0 };
        e.sec += s.totalHeldSec;
        e.dev += s.medianDeviationCents * s.totalHeldSec;
        e.wob += s.medianWobbleCents * s.totalHeldSec;
        acc.set(s.symbol, e);
      }
    }
    return SWARA_SYMBOLS.map((sym, i) => {
      const e = acc.get(sym);
      return e && e.sec > 0
        ? { symbol: sym, name: SWARA_NAMES[i], sec: e.sec, dev: e.dev / e.sec, wob: e.wob / e.sec }
        : null;
    }).filter((x): x is NonNullable<typeof x> => x !== null);
  }, [analyses]);

  const enough = swaraStats.filter(s => s.sec >= MIN_SWARA_SEC);
  const lastSa = saChecks[saChecks.length - 1];

  return (
    <div className="space-y-6">
      <header className="az-head">
        <div>
          <h1 className="az-title">{vocalistName ? u("profileOf", vocalistName) : u("yourProfile")}</h1>
          <p className="az-intro">{u("builtFrom", analyses.length, saChecks.length)}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0D3A40] p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">{u("yourSa")}</span>
          <span className="text-2xl font-black font-mono text-slate-100 block">{baseTonicHz.toFixed(1)} Hz</span>
          <span className="text-[11px] text-slate-400">{sa.name} {signedCents(sa.cents)} cents</span>
        </div>
        <div className="bg-[#0D3A40] p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">{u("latestSaCheck")}</span>
          {lastSa ? (
            <>
              <span className="text-2xl font-black font-mono text-slate-100 block">±{lastSa.wobbleCents.toFixed(1)} cents</span>
              <span className="text-[11px] text-slate-400">{u("wobbleHolding", lastSa.saHz.toFixed(1), lastSa.heldSec.toFixed(1))}</span>
            </>
          ) : <span className="text-xs text-slate-500 block">{u("saCheckEmpty")}</span>}
        </div>
        <div className="bg-[#0D3A40] p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">{u("rangeHeld")}</span>
          {range ? (
            <>
              <span className="text-2xl font-black font-mono text-slate-100 block">{range.low.label} – {range.high.label}</span>
              <span className="text-[11px] text-slate-400">{u("rangeSemis", (range.high.semis - range.low.semis).toFixed(0))}</span>
            </>
          ) : <span className="text-xs text-slate-500 block">{u("rangeEmpty")}</span>}
        </div>
      </div>

      <div className="bg-[#0D3A40] p-5 rounded-2xl border border-slate-800 space-y-3">
        <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">{u("swaraTendencies")}</h3>
        {enough.length === 0 ? (
          <p className="text-xs text-slate-500">{u("tendEmpty", MIN_SWARA_SEC)}          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono whitespace-nowrap">
              <thead>
                <tr className="text-[9px] uppercase tracking-widest text-slate-500 text-left">
                  <th className="py-2 pr-3">{u("colSwara")}</th>
                  <th className="py-2 pr-3">{u("colHeld")}</th>
                  <th className="py-2 pr-3">{u("colPos")}</th>
                  <th className="py-2 pr-3">{u("colWob")}</th>
                </tr>
              </thead>
              <tbody>
                {enough.map(s => (
                  <tr key={s.symbol} className="border-t border-slate-800 text-slate-200">
                    <td className="py-2 pr-3 font-bold">{s.symbol} <span className="font-sans font-normal text-slate-400">{s.name}</span></td>
                    <td className="py-2 pr-3">{s.sec.toFixed(0)} s</td>
                    <td className={`py-2 pr-3 ${Math.abs(s.dev) > 15 ? "text-amber-300" : ""}`}>{signedCents(s.dev)} cents</td>
                    <td className="py-2 pr-3">±{s.wob.toFixed(1)} cents</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[10px] text-slate-500">{u("tendNote")}        </p>
      </div>

      <RiyazReminder saLabel={`${sa.name}, ${baseTonicHz.toFixed(1)} Hz`} />

      <div className="flex flex-wrap justify-end gap-2">
        {profileId && (
          <button type="button"
            onClick={() => {
              const blob = new Blob([exportProfile(profileId)], { type: "application/json" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `naad-ai-${(vocalistName || "profile").replace(/\W+/g, "-").toLowerCase()}.json`;
              a.click();
              URL.revokeObjectURL(a.href);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-[10px] font-mono font-bold uppercase cursor-pointer">
            {u("exportData")}
          </button>
        )}
        {history.length > 0 && (
          <button type="button"
            onClick={() => { if (window.confirm(u("clearConfirm"))) clearHistory(); }}
            className="px-3 py-1.5 rounded-lg border border-rose-900 text-rose-300 hover:bg-rose-950/40 text-[10px] font-mono font-bold uppercase cursor-pointer">{u("clearHistory")}          </button>
        )}
        {profileId && (
          <button type="button"
            onClick={() => { if (window.confirm(u("deleteConfirm", vocalistName))) { deleteProfile(profileId); onDeleted?.(); } }}
            className="px-3 py-1.5 rounded-lg border border-rose-900 text-rose-300 hover:bg-rose-950/40 text-[10px] font-mono font-bold uppercase cursor-pointer">{u("deleteProfile")}          </button>
        )}
      </div>
    </div>
  );
};
