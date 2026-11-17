/**
 * The welcome page takes its colours from the sky at the visitor's local
 * time, the same clock that decides which raags suit the hour.
 */
export type SkyName = "dawn" | "day" | "dusk" | "night";

export interface Sky {
  name: SkyName;
  top: string;
  bottom: string;
  ink: string;
  muted: string;
  line: string;
  lineStrong: string;
  voice: string;
  glow: number;
  buttonBg: string;
  buttonInk: string;
}

export const SKIES: Record<SkyName, Sky> = {
  dawn: {
    name: "dawn", top: "#123B44", bottom: "#A9775E", ink: "#F7EEE2", muted: "rgba(247,238,226,0.74)",
    line: "rgba(247,238,226,0.16)", lineStrong: "rgba(247,238,226,0.34)", voice: "#F4D79E", glow: 14,
    buttonBg: "#F7EEE2", buttonInk: "#123B44",
  },
  day: {
    name: "day", top: "#C9DDD8", bottom: "#EFE7D4", ink: "#0B3036", muted: "rgba(11,48,54,0.72)",
    line: "rgba(11,48,54,0.14)", lineStrong: "rgba(11,48,54,0.32)", voice: "#8A5A12", glow: 0,
    buttonBg: "#0B3036", buttonInk: "#EFE7D4",
  },
  dusk: {
    name: "dusk", top: "#0F3940", bottom: "#83463A", ink: "#F7EEE2", muted: "rgba(247,238,226,0.74)",
    line: "rgba(247,238,226,0.15)", lineStrong: "rgba(247,238,226,0.34)", voice: "#EBC673", glow: 16,
    buttonBg: "#F7EEE2", buttonInk: "#0F3940",
  },
  night: {
    name: "night", top: "#062327", bottom: "#155058", ink: "#F3ECDF", muted: "rgba(243,236,223,0.7)",
    line: "rgba(243,236,223,0.12)", lineStrong: "rgba(243,236,223,0.3)", voice: "#D9B45F", glow: 18,
    buttonBg: "#D9B45F", buttonInk: "#062327",
  },
};

export function skyForHour(hour: number): Sky {
  if (hour >= 4 && hour < 8) return SKIES.dawn;
  if (hour >= 8 && hour < 16) return SKIES.day;
  if (hour >= 16 && hour < 20) return SKIES.dusk;
  return SKIES.night;
}
