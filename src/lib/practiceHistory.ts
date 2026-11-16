/**
 * The singer's practice history, kept in this browser (localStorage),
 * separately for each singer profile.
 *
 * Only real measurements and real timings are stored here. Nothing is
 * pre-filled: a new user starts with an empty history.
 */

import { currentProfileId, historyKeyFor, LEGACY_HISTORY_KEY } from "./profiles";

export interface SwaraSnapshot {
  symbol: string;
  medianDeviationCents: number;
  medianWobbleCents: number;
  totalHeldSec: number;
}

export type PracticeRecord =
  | {
      kind: "analysis";
      id: string;
      dateIso: string;
      raagId: string;
      raagName: string;
      durationSec: number;
      singingSec: number;
      saHz: number;
      heldWithin20CentsPct: number | null;
      medianAbsDeviationCents: number | null;
      lowest: { label: string; hz: number } | null;
      highest: { label: string; hz: number } | null;
      swaras: SwaraSnapshot[];
      /** Breath per phrase (added in v2 records; may be missing in older ones). */
      longestPhraseSec?: number | null;
      medianPhraseSec?: number | null;
      phraseCount?: number;
    }
  | {
      kind: "sa-sadhana";
      id: string;
      dateIso: string;
      saHz: number;
      durationSec: number;
      longestHoldSec: number;
      totalOnSaSec: number;
      medianOffsetCents: number;
      wobbleCents: number;
    }
  | {
      kind: "sa-check";
      id: string;
      dateIso: string;
      saHz: number;
      heldSec: number;
      wobbleCents: number;
    }
  | {
      kind: "palta" | "pakad";
      id: string;
      dateIso: string;
      raagId: string;
      raagName: string;
      /** palta pattern id, or "pakad" */
      exerciseId: string;
      exerciseName: string;
      /** 1 thah, 2 dugun, 3 tigun, 4 chaugun */
      speed: number;
      bpm: number;
      /** 0–100 */
      score: number;
      notes: number;
      durationSec: number;
    }
  | {
      kind: "ear-quiz";
      id: string;
      dateIso: string;
      level: "swara" | "raag";
      correct: number;
      total: number;
      /** Swara symbols the singer got wrong (for "swara" level). */
      missed: string[];
    }
  | {
      kind: "riyaz-timer";
      id: string;
      dateIso: string;
      raagName: string;
      minutes: number;
    };


/** History is stored per singer profile. */
function key(): string {
  const id = currentProfileId();
  return id ? historyKeyFor(id) : LEGACY_HISTORY_KEY;
}
const EVENT = "naad-practice-history-changed";

export function loadHistory(): PracticeRecord[] {
  try {
    const raw = localStorage.getItem(key());
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addRecord(record: PracticeRecord): void {
  try {
    const all = loadHistory();
    all.push(record);
    localStorage.setItem(key(), JSON.stringify(all.slice(-500)));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // Storage full or blocked: the measurement is still shown, just not saved.
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(key());
    window.dispatchEvent(new Event(EVENT));
  } catch { /* ignore */ }
}

export function onHistoryChange(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.floor(performance.now() * 1000).toString(36)}`;
}
