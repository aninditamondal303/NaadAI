/**
 * "Install the app": browsers that support installing a web app fire
 * beforeinstallprompt once; it is kept here so a button can offer it later.
 * Set VITE_ANDROID_APK_URL at build time to also offer the Android download.
 */
type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
let deferred: PromptEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferred = e as PromptEvent;
    listeners.forEach(f => f());
  });
  window.addEventListener("appinstalled", () => { deferred = null; listeners.forEach(f => f()); });
}

export const canInstall = () => deferred !== null;
export function onInstallChange(f: () => void) { listeners.add(f); return () => { listeners.delete(f); }; }
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const d = deferred;
  deferred = null;
  await d.prompt();
  const choice = await d.userChoice.catch(() => ({ outcome: "dismissed" }));
  listeners.forEach(f => f());
  return choice.outcome === "accepted";
}
export const ANDROID_APK_URL: string | null = (import.meta.env.VITE_ANDROID_APK_URL as string | undefined) || null;
export const isNativeApp = () => typeof window !== "undefined" && !!(window as any).Capacitor?.isNativePlatform?.();
