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
    name: "dawn", top: "#2C3264", bottom: "#9C6B78", ink: "#FBEFE6", muted: "rgba(251,239,230,0.72)",
    line: "rgba(251,239,230,0.16)", lineStrong: "rgba(251,239,230,0.34)", voice: "#FFD9A0", glow: 14,
    buttonBg: "#FBEFE6", buttonInk: "#2C3264",
  },
  day: {
    name: "day", top: "#AFC4D3", bottom: "#E6DFD0", ink: "#1D2340", muted: "rgba(29,35,64,0.72)",
    line: "rgba(29,35,64,0.14)", lineStrong: "rgba(29,35,64,0.32)", voice: "#9A3B22", glow: 0,
    buttonBg: "#1D2340", buttonInk: "#E6DFD0",
  },
  dusk: {
    name: "dusk", top: "#2A2350", bottom: "#A0546A", ink: "#FCEFE3", muted: "rgba(252,239,227,0.74)",
    line: "rgba(252,239,227,0.15)", lineStrong: "rgba(252,239,227,0.34)", voice: "#FFD37A", glow: 16,
    buttonBg: "#FCEFE3", buttonInk: "#2A2350",
  },
  night: {
    name: "night", top: "#0D1230", bottom: "#27315F", ink: "#E6E8F6", muted: "rgba(230,232,246,0.7)",
    line: "rgba(230,232,246,0.12)", lineStrong: "rgba(230,232,246,0.3)", voice: "#F4C56A", glow: 18,
    buttonBg: "#F4C56A", buttonInk: "#0D1230",
  },
};

export function skyForHour(hour: number): Sky {
  if (hour >= 4 && hour < 8) return SKIES.dawn;
  if (hour >= 8 && hour < 16) return SKIES.day;
  if (hour >= 16 && hour < 20) return SKIES.dusk;
  return SKIES.night;
}
