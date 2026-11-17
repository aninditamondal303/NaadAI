/** Daily riyaz reminder: downloads a calendar file the phone or computer's calendar turns into a daily alert. */
import { toast } from './shell/Toaster';
import React, { useState } from "react";
import { riyazIcs } from "../lib/reminder";
import { useUi } from "../i18n/ui";

export const RiyazReminder: React.FC<{ saLabel: string }> = ({ saLabel }) => {
  const u = useUi();
  const [time, setTime] = useState("06:30");
  const [minutes, setMinutes] = useState(45);
  const [done, setDone] = useState(false);
  const add = () => {
    const [h, m] = time.split(":").map(Number);
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
      <p className="rg-muted">{u("reminderIntro")}</p>
      <div className="tp-row">
        <label className="tp-field"><span>{u("reminderTime")}</span><input type="time" value={time} onChange={e => setTime(e.target.value)} /></label>
        <label className="tp-field"><span>{u("reminderLength")}</span><input type="number" min={5} max={240} value={minutes} onChange={e => setMinutes(Number(e.target.value))} /></label>
        <button type="button" className="rz-btn" onClick={add}>{u("reminderAdd")}</button>
      </div>
      {done && <p className="rg-muted" role="status">{u("reminderDone")}</p>}
    </section>
  );
};
