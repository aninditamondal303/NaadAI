import { beforeEach, describe, expect, it } from "vitest";

// Minimal in-memory localStorage and window for Node
class MemoryStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}
(globalThis as any).localStorage = new MemoryStorage();
(globalThis as any).window = { dispatchEvent() {}, addEventListener() {}, removeEventListener() {} };

const { createProfile, currentProfile, deleteProfile, exportProfile, importProfile, loadProfiles, setCurrentProfile, LEGACY_HISTORY_KEY } = await import("../profiles");
const { addRecord, loadHistory } = await import("../practiceHistory");

const timer = (m: number) => ({ kind: "riyaz-timer" as const, id: String(m), dateIso: "2026-11-16T10:00:00Z", raagName: "Yaman", minutes: m });

describe("singer profiles", () => {
  beforeEach(() => (globalThis as any).localStorage.clear());

  it("keeps each singer's history separate", () => {
    const a = createProfile("Asha", 196);
    addRecord(timer(10));
    const b = createProfile("Bhim", 130.81);
    addRecord(timer(20));
    expect(loadHistory().map(r => r.id)).toEqual(["20"]);
    setCurrentProfile(a.id);
    expect(loadHistory().map(r => r.id)).toEqual(["10"]);
    expect(currentProfile()!.name).toBe("Asha");
    expect(loadProfiles().map(p => p.name)).toEqual(["Asha", "Bhim"]);
    void b;
  });

  it("moves history saved before profiles existed into the first profile", () => {
    localStorage.setItem(LEGACY_HISTORY_KEY, JSON.stringify([timer(5)]));
    createProfile("First", 138.59);
    expect(loadHistory().map(r => r.id)).toEqual(["5"]);
    expect(localStorage.getItem(LEGACY_HISTORY_KEY)).toBeNull();
  });

  it("exports and imports a profile with its history, and rejects bad files", () => {
    const p = createProfile("Asha", 196);
    addRecord(timer(15));
    const json = exportProfile(p.id);
    deleteProfile(p.id);
    expect(loadProfiles()).toHaveLength(0);
    const q = importProfile(json);
    expect(q.name).toBe("Asha");
    expect(q.saHz).toBe(196);
    expect(loadHistory().map(r => r.id)).toEqual(["15"]);
    expect(() => importProfile("{}")).toThrow(/isn't a Naad AI profile/);
    expect(() => importProfile("not json")).toThrow(/valid JSON/);
  });
});
