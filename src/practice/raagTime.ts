/**
 * Time-of-day (prahar) raag suggestions, from the times stored in the raag
 * library (e.g. "Evening (6 PM - 9 PM)"). Raags without a clock range in
 * their data are not suggested.
 */
import type { ComprehensiveRaag } from "../data/allRaags";

/** Parse "(6 PM - 9 PM)" style ranges into [startHour, endHour) in 24-hour time. */
export function parseTimeRange(time: string): [number, number] | null {
  const m = /(\d{1,2})\s*(AM|PM)\s*-\s*(\d{1,2})\s*(AM|PM)/i.exec(time);
  if (!m) return null;
  const to24 = (h: number, ap: string) => (h % 12) + (ap.toUpperCase() === "PM" ? 12 : 0);
  return [to24(Number(m[1]), m[2]), to24(Number(m[3]), m[4])];
}

export function inRange(hour: number, [start, end]: [number, number]): boolean {
  return start <= end ? hour >= start && hour < end : hour >= start || hour < end; // ranges can cross midnight
}

/** The traditional eight prahars, three hours each, starting at 6 AM. */
export function praharFor(hour: number): { number: number; name: string } {
  const idx = Math.floor((((hour - 6) % 24) + 24) % 24 / 3);
  const names = ["1st prahar of the day (morning)", "2nd prahar of the day (late morning)", "3rd prahar of the day (afternoon)", "4th prahar of the day (late afternoon)",
    "1st prahar of the night (evening)", "2nd prahar of the night (late evening)", "3rd prahar of the night (midnight)", "4th prahar of the night (before dawn)"];
  return { number: (idx % 4) + 1, name: names[idx] };
}

export function raagsForHour(raags: ComprehensiveRaag[], hour: number): ComprehensiveRaag[] {
  return raags.filter(r => {
    const range = parseTimeRange(r.time);
    return range !== null && inRange(hour, range);
  });
}
