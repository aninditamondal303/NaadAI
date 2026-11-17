/** A daily riyaz reminder as a standard calendar file (iCalendar, RFC 5545), with an alert at the start. */
export function riyazIcs(opts: { hour: number; minute: number; minutes: number; title: string; description: string; now?: Date }): string {
  const now = opts.now ?? new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), opts.hour, opts.minute, 0);
  if (start <= now) start.setDate(start.getDate() + 1);
  const end = new Date(start.getTime() + opts.minutes * 60_000);
  const local = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}00`;
  const utc = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/[,;]/g, m => `\\${m}`).replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Naad AI//Riyaz reminder//EN", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:riyaz-${start.getTime()}@naad-ai`,
    `DTSTAMP:${utc(now)}`,
    `DTSTART:${local(start)}`,
    `DTEND:${local(end)}`,
    "RRULE:FREQ=DAILY",
    `SUMMARY:${esc(opts.title)}`,
    `DESCRIPTION:${esc(opts.description)}`,
    "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(opts.title)}`, "TRIGGER:PT0M", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
}
