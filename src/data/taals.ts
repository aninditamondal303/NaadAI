/**
 * Taal library: matras, vibhags, taali/khali and the commonly taught theka.
 *
 * Thekas follow the standard forms taught in Hindustani music schools
 * (Bhatkhande notation). Different gharanas and teachers write some bols
 * differently, so please check them with your guru; corrections are easy
 * to make here.
 *
 * Each matra is a list of bols played evenly inside that matra, e.g.
 * ["Dha", "Ge"] is two bols in one matra, ["Ti", "Ra", "Ki", "Ta"] is four.
 * "-" is a rest.
 */

export type Clap = "X" | "0" | number; // X = sam (taali), 0 = khali, 2/3/4 = taali number

export interface Taal {
  id: string;
  name: string;
  matras: number;
  /** Matras in each vibhag, e.g. Teentaal [4, 4, 4, 4]. */
  vibhags: number[];
  /** Clap mark for the first matra of each vibhag. */
  claps: Clap[];
  /** One entry per matra. */
  theka: string[][];
  /** Typical use, for the user's information. */
  usage: string;
}

const m = (s: string): string[][] => s.trim().split(/\s+/).map(x => x.split("."));

export const TAALS: Taal[] = [
  {
    id: "teentaal", name: "Teentaal", matras: 16, vibhags: [4, 4, 4, 4], claps: ["X", 2, "0", 3],
    theka: m("Dha Dhin Dhin Dha  Dha Dhin Dhin Dha  Dha Tin Tin Ta  Ta Dhin Dhin Dha"),
    usage: "Khayal (vilambit to drut), instrumental gats",
  },
  {
    id: "ektaal", name: "Ektaal", matras: 12, vibhags: [2, 2, 2, 2, 2, 2], claps: ["X", "0", 2, "0", 3, 4],
    theka: m("Dhin Dhin  Dha.Ge Ti.Ra.Ki.Ta  Tu Na  Kat Ta  Dha.Ge Ti.Ra.Ki.Ta  Dhin Na"),
    usage: "Vilambit and drut khayal",
  },
  {
    id: "jhaptaal", name: "Jhaptaal", matras: 10, vibhags: [2, 3, 2, 3], claps: ["X", 2, "0", 3],
    theka: m("Dhi Na  Dhi Dhi Na  Ti Na  Dhi Dhi Na"),
    usage: "Madhya laya khayal, bhajans",
  },
  {
    id: "rupak", name: "Rupak", matras: 7, vibhags: [3, 2, 2], claps: ["0", 2, 3],
    theka: m("Tin Tin Na  Dhi Na  Dhi Na"),
    usage: "Madhya laya khayal, light classical. Begins on khali.",
  },
  {
    id: "dadra", name: "Dadra", matras: 6, vibhags: [3, 3], claps: ["X", "0"],
    theka: m("Dha Dhi Na  Dha Ti Na"),
    usage: "Dadra, thumri, light classical",
  },
  {
    id: "keherwa", name: "Keherwa", matras: 8, vibhags: [4, 4], claps: ["X", "0"],
    theka: m("Dha Ge Na Ti  Na Ke Dhi Na"),
    usage: "Light classical, bhajans, folk",
  },
  {
    id: "jhoomra", name: "Jhoomra", matras: 14, vibhags: [3, 4, 3, 4], claps: ["X", 2, "0", 3],
    theka: m("Dhin -.Dha Ti.Ra.Ki.Ta  Dhin Dhin Dha.Ge Ti.Ra.Ki.Ta  Tin -.Ta Ti.Ra.Ki.Ta  Dhin Dhin Dha.Ge Ti.Ra.Ki.Ta"),
    usage: "Ati-vilambit khayal",
  },
  {
    id: "tilwada", name: "Tilwada", matras: 16, vibhags: [4, 4, 4, 4], claps: ["X", 2, "0", 3],
    theka: m("Dha Ti.Ra.Ki.Ta Dhin Dhin  Dha Dha Tin Tin  Ta Ti.Ra.Ki.Ta Dhin Dhin  Dha Dha Dhin Dhin"),
    usage: "Vilambit khayal",
  },
  {
    id: "chautaal", name: "Chautaal", matras: 12, vibhags: [2, 2, 2, 2, 2, 2], claps: ["X", "0", 2, "0", 3, 4],
    theka: m("Dha Dha  Din Ta  Ki.Ta Dha  Din Ta  Ti.Ta Ka.Ta  Ga.Di Ga.Na"),
    usage: "Dhrupad (traditionally on pakhawaj)",
  },
  {
    id: "deepchandi", name: "Deepchandi", matras: 14, vibhags: [3, 4, 3, 4], claps: ["X", 2, "0", 3],
    theka: m("Dha Dhin -  Dha Dha Dhin -  Ta Tin -  Dha Dha Dhin -"),
    usage: "Thumri, hori, dadra-style light classical",
  },
];

/** The clap mark on a matra (1-based), or null if the matra doesn't start a vibhag. */
export function clapAt(taal: Taal, matra: number): Clap | null {
  let start = 1;
  for (let i = 0; i < taal.vibhags.length; i++) {
    if (matra === start) return taal.claps[i];
    start += taal.vibhags[i];
  }
  return null;
}

export type Laya = "vilambit" | "madhya" | "drut";

/** Rough laya name for a tempo (matras per minute). Boundaries vary between traditions. */
export function layaFor(bpm: number): Laya {
  if (bpm < 60) return "vilambit";
  if (bpm < 160) return "madhya";
  return "drut";
}
