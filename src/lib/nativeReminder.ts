/**
 * In the Android app, the daily riyaz reminder is a real notification
 * scheduled on the phone (no calendar needed). On the web this module is not
 * used; the calendar file is offered instead.
 */
import { isNativeApp } from "./install";

const ID = 7001;
const KEY = "naad.nativeReminder.v1";

export interface NativeReminder { hour: number; minute: number; }

export function savedNativeReminder(): NativeReminder | null {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}

export async function scheduleNativeReminder(r: NativeReminder, title: string, body: string): Promise<boolean> {
  if (!isNativeApp()) return false;
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  const perm = await LocalNotifications.requestPermissions();
  if (perm.display !== "granted") return false;
  await LocalNotifications.cancel({ notifications: [{ id: ID }] }).catch(() => {});
  await LocalNotifications.schedule({
    notifications: [{ id: ID, title, body, schedule: { on: { hour: r.hour, minute: r.minute }, repeats: true, allowWhileIdle: true } }],
  });
  localStorage.setItem(KEY, JSON.stringify(r));
  return true;
}

export async function cancelNativeReminder(): Promise<void> {
  if (!isNativeApp()) return;
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  await LocalNotifications.cancel({ notifications: [{ id: ID }] }).catch(() => {});
  localStorage.removeItem(KEY);
}
