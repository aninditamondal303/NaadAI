/** Daily riyaz reminder: downloads a calendar file the phone or computer's calendar turns into a daily alert. */
import { toast } from './shell/Toaster';
import React, { useState } from "react";
import { riyazIcs } from "../lib/reminder";
import { useUi } from "../i18n/ui";
import { isNativeApp } from "../lib/install";
import { cancelNativeReminder, savedNativeReminder, scheduleNativeReminder } from "../lib/nativeReminder";

export const RiyazReminder: React.FC<{ saLabel: string }> = ({ saLabel }) => {
  const u = useUi();
  const native = isNativeApp();
  const saved = native ? savedNativeReminder() : null;
  const [time, setTime] = useState(saved ? `${String(saved.hour).padStart(2, "0")}:${String(saved.minute).padStart(2, "0")}` : "06:30");
  const [nativeOn, setNativeOn] = useState(!!saved);
  const [minutes, setMinutes] = useState(45);
  const [done, setDone] = useState(false);
  const add = async () => {
    const [h, m] = time.split(":").map(Number);
    if (native) {
      const ok = await scheduleNativeReminder({ hour: h, minute: m }, u("reminderEventTitle"), u("reminderBody", minutes, saLabel));
      setNativeOn(ok);
      toast(ok ? u("reminderSet", time) : u("reminderDenied"));
      return;
    }
    const ics = riyazIcs({ hour: h, minute: m, minutes, title: `${u("reminderEventTitle")} (Naad AI)`, description: `Sa ${saLabel}. https://aninditamondal303.github.io/NaadAI/` });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "riyaz-reminder.ics";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    setDone(true);
    toast(u("reminderAdded"));
  };
  return (
    <section className="rg ub">
      <h3 className="rg-h">{u("reminderTitle")}</h3>
      <p className="rg-muted">{native ? u("reminderIntroNative") : u("reminderIntro")}</p>
      <div className="tp-row">
        <label className="tp-field"><span>{u("reminderTime")}</span><input type="time" value={time} onChange={e => setTime(e.target.value)} /></label>
        <label className="tp-field"><span>{u("reminderLength")}</span><input type="number" min={5} max={240} value={minutes} onChange={e => setMinutes(Number(e.target.value))} /></label>
        <button type="button" className="rz-btn" onClick={() => void add()}>{native ? (nativeOn ? u("reminderUpdate") : u("reminderSetBtn")) : u("reminderAdd")}</button>
        {native && nativeOn && <button type="button" className="tp-link" onClick={() => { void cancelNativeReminder(); setNativeOn(false); toast(u("reminderOff")); }}>{u("reminderTurnOff")}</button>}
      </div>
      {!native && done && <p className="rg-muted" role="status">{u("reminderDone")}</p>}
    </section>
  );
};
