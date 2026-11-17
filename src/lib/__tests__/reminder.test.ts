import { describe, expect, it } from "vitest";
import { riyazIcs } from "../reminder";

describe("riyaz reminder", () => {
  it("makes a daily event with an alert, starting tomorrow if the time has passed", () => {
    const ics = riyazIcs({ hour: 6, minute: 30, minutes: 45, title: "Riyaz", description: "Sa C3", now: new Date(2026, 10, 17, 20, 0) });
    expect(ics).toContain("RRULE:FREQ=DAILY");
    expect(ics).toContain("DTSTART:20261118T063000");
    expect(ics).toContain("DTEND:20261118T071500");
    expect(ics).toContain("BEGIN:VALARM");
    expect(ics.split("\r\n")[0]).toBe("BEGIN:VCALENDAR");
  });
});
