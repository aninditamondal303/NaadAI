/**
 * Singer profiles, kept in this browser. Several singers can share one
 * device; each has their own Sa and practice history. No passwords and no
 * server: nothing leaves the device unless the singer exports it.
 */

export interface SingerProfile {
  id: string;
  name: string;
  saHz: number;
  createdIso: string;
}

const PROFILES_KEY = "naad.profiles.v1";
const CURRENT_KEY = "naad.currentProfile.v1";
/** History key used before profiles existed; moved into the first profile. */
export const LEGACY_HISTORY_KEY = "naad.practiceHistory.v1";

export function historyKeyFor(profileId: string): string {
  return `naad.practiceHistory.v1.${profileId}`;
}

export function loadProfiles(): SingerProfile[] {
  try {
    const raw = JSON.parse(localStorage.getItem(PROFILES_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter(p => p && typeof p.id === "string" && typeof p.name === "string" && typeof p.saHz === "number") : [];
  } catch {
    return [];
  }
}

function saveProfiles(list: SingerProfile[]) {
  try { localStorage.setItem(PROFILES_KEY, JSON.stringify(list)); } catch { /* storage blocked */ }
}

export function currentProfileId(): string | null {
  try { return localStorage.getItem(CURRENT_KEY); } catch { return null; }
}

export function setCurrentProfile(id: string | null) {
  try {
    if (id) localStorage.setItem(CURRENT_KEY, id);
    else localStorage.removeItem(CURRENT_KEY);
  } catch { /* ignore */ }
}

export function currentProfile(): SingerProfile | null {
  const id = currentProfileId();
  return loadProfiles().find(p => p.id === id) ?? null;
}

export function createProfile(name: string, saHz: number): SingerProfile {
  const list = loadProfiles();
  const p: SingerProfile = {
    id: `p${Date.now().toString(36)}`,
    name: name.trim().slice(0, 40) || "Singer",
    saHz,
    createdIso: new Date().toISOString(),
  };
  // The first profile inherits any history saved before profiles existed.
  try {
    const legacy = localStorage.getItem(LEGACY_HISTORY_KEY);
    if (list.length === 0 && legacy) {
      localStorage.setItem(historyKeyFor(p.id), legacy);
      localStorage.removeItem(LEGACY_HISTORY_KEY);
    }
  } catch { /* ignore */ }
  saveProfiles([...list, p]);
  setCurrentProfile(p.id);
  return p;
}

export function updateProfile(id: string, changes: Partial<Pick<SingerProfile, "name" | "saHz">>) {
  saveProfiles(loadProfiles().map(p => (p.id === id ? { ...p, ...changes } : p)));
}

export function deleteProfile(id: string) {
  saveProfiles(loadProfiles().filter(p => p.id !== id));
  try { localStorage.removeItem(historyKeyFor(id)); } catch { /* ignore */ }
  if (currentProfileId() === id) setCurrentProfile(null);
}

/** Everything about one singer, for backup or moving to another device. */
export function exportProfile(id: string): string {
  const p = loadProfiles().find(x => x.id === id);
  let history: unknown = [];
  try { history = JSON.parse(localStorage.getItem(historyKeyFor(id)) || "[]"); } catch { /* ignore */ }
  return JSON.stringify({ format: "naad-ai-profile", version: 1, profile: p, history }, null, 2);
}

/** Import an exported file as a new profile. Throws with a readable message if the file isn't valid. */
export function importProfile(json: string): SingerProfile {
  let data: any;
  try { data = JSON.parse(json); } catch { throw new Error("This file isn't valid JSON."); }
  if (data?.format !== "naad-ai-profile" || !data.profile || !Array.isArray(data.history)) {
    throw new Error("This isn't a Naad AI profile export.");
  }
  const sa = Number(data.profile.saHz);
  if (!Number.isFinite(sa) || sa < 40 || sa > 1000) throw new Error("The profile's Sa is missing or invalid.");
  const p = createProfile(String(data.profile.name || "Imported singer"), sa);
  try { localStorage.setItem(historyKeyFor(p.id), JSON.stringify(data.history)); } catch { /* ignore */ }
  return p;
}
