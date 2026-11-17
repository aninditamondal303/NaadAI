/**
 * Profile: the singer's Sa and what their saved recordings show so far.
 * Everything is computed from the practice history in this browser.
 * With too little data, we say so instead of guessing.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { User } from 'lucide-react';
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
      <div className="bg-[#1A2150] p-6 rounded-2xl border border-[#E0A458]/40 shadow-xl">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 font-serif">
          <User className="h-5 w-5 text-[#F4C56A]" />
          {vocalistName ? `${vocalistName}'s profile` : "Your profile"}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Built from {analyses.length} analysed {analyses.length === 1 ? "recording" : "recordings"} and {saChecks.length} Sa {saChecks.length === 1 ? "check" : "checks"} saved in this browser.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1A2150] p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Your Sa</span>
          <span className="text-2xl font-black font-mono text-slate-100 block">{baseTonicHz.toFixed(1)} Hz</span>
          <span className="text-[11px] text-slate-400">{sa.name} {signedCents(sa.cents)} cents</span>
        </div>
        <div className="bg-[#1A2150] p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Latest Sa check</span>
          {lastSa ? (
            <>
              <span className="text-2xl font-black font-mono text-slate-100 block">±{lastSa.wobbleCents.toFixed(1)} cents</span>
              <span className="text-[11px] text-slate-400">wobble while holding {lastSa.saHz.toFixed(1)} Hz for {lastSa.heldSec.toFixed(1)} s</span>
            </>
          ) : <span className="text-xs text-slate-500 block">Use "Find my Sa" in the Analyzer to measure how steadily you hold Sa.</span>}
        </div>
        <div className="bg-[#1A2150] p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Range of held notes</span>
          {range ? (
            <>
              <span className="text-2xl font-black font-mono text-slate-100 block">{range.low.label} – {range.high.label}</span>
              <span className="text-[11px] text-slate-400">{(range.high.semis - range.low.semis).toFixed(0)} semitones across all recordings</span>
            </>
          ) : <span className="text-xs text-slate-500 block">Analyse a recording to measure your range.</span>}
        </div>
      </div>

      <div className="bg-[#1A2150] p-5 rounded-2xl border border-slate-800 space-y-3">
        <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">Swara tendencies</h3>
        {enough.length === 0 ? (
          <p className="text-xs text-slate-500">
            Not enough data yet. A swara appears here once you have held it for at least {MIN_SWARA_SEC} seconds in total across your analysed recordings.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono whitespace-nowrap">
              <thead>
                <tr className="text-[9px] uppercase tracking-widest text-slate-500 text-left">
                  <th className="py-2 pr-3">Swara</th>
                  <th className="py-2 pr-3">Held in total</th>
                  <th className="py-2 pr-3">Typical position</th>
                  <th className="py-2 pr-3">Typical wobble</th>
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
        <p className="text-[10px] text-slate-500">
          Position is measured from the equal-tempered swara position and averaged by time held. Differences over 15 cents are highlighted;
          some swaras are traditionally sung a little lower or higher, so check with your guru before changing anything.
        </p>
      </div>

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
            Export my data
          </button>
        )}
        {history.length > 0 && (
          <button type="button"
            onClick={() => { if (window.confirm("Delete all practice history saved for this singer? This can't be undone.")) clearHistory(); }}
            className="px-3 py-1.5 rounded-lg border border-rose-900 text-rose-300 hover:bg-rose-950/40 text-[10px] font-mono font-bold uppercase cursor-pointer">
            Clear practice history
          </button>
        )}
        {profileId && (
          <button type="button"
            onClick={() => { if (window.confirm(`Delete the profile "${vocalistName}" and all its history from this browser?`)) { deleteProfile(profileId); onDeleted?.(); } }}
            className="px-3 py-1.5 rounded-lg border border-rose-900 text-rose-300 hover:bg-rose-950/40 text-[10px] font-mono font-bold uppercase cursor-pointer">
            Delete profile
          </button>
        )}
      </div>
    </div>
  );
};
