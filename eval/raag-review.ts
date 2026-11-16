/**
 * Print a review checklist of the raag library for a guru to check.
 *   npm run raag:review   (writes docs/raag-review.md)
 */
import { writeFileSync } from "node:fs";
import { RAAG_LIST } from "../src/data/allRaags";
import { RAAG_DETAILS } from "../src/data/raagDetails";

const SYM = ["S", "r", "R", "g", "G", "m", "M", "P", "d", "D", "n", "N"];
const NAMES = ["Sa", "komal Re", "Re", "komal Ga", "Ga", "Ma", "tivra Ma", "Pa", "komal Dha", "Dha", "komal Ni", "Ni"];

const lines: string[] = [
  "# Raag library review checklist",
  "",
  "Please tick each line that is correct, and write corrections next to anything that isn't.",
  "Notation: S r R g G m M P d D n N (lowercase r g d n = komal, m = shuddha Ma, M = tivra Ma); `,` = mandra, `'` = taar.",
  "",
  `Raags: ${RAAG_LIST.length}. With full details (pakad, chalan, nyas, similar raags): ${Object.keys(RAAG_DETAILS).length}.`,
  "",
  "Reviewer: ____________________   Date: ____________",
  "",
];

for (const r of RAAG_LIST) {
  const d = RAAG_DETAILS[r.id];
  // varjit: whole swara families (Re, Ga, Ma, Dha, Ni, Pa) with neither form in the raag
  const families: [string, number[]][] = [["Re", [1, 2]], ["Ga", [3, 4]], ["Ma", [5, 6]], ["Pa", [7]], ["Dha", [8, 9]], ["Ni", [10, 11]]];
  const varjit = families.filter(([, idx]) => idx.every(i => !r.allowedSwaras.includes(i))).map(([n]) => n);
  lines.push(`## ${r.name}`, "");
  lines.push(`- [ ] Thaat: ${r.thaat}`);
  lines.push(`- [ ] Jati: ${r.jati}`);
  lines.push(`- [ ] Time: ${r.time}`);
  lines.push(`- [ ] Swaras used: ${r.allowedSwaras.map(i => `${SYM[i]} (${NAMES[i]})`).join(", ")}`);
  lines.push(`- [ ] Not used (varjit): ${varjit.length ? varjit.join(", ") : "none"}`);
  lines.push(`- [ ] Aroh: ${r.aroha.join(" ")}`);
  lines.push(`- [ ] Avaroh: ${r.avaroha.join(" ")}`);
  lines.push(`- [ ] Vadi: ${SYM[r.vadi]} · Samvadi: ${SYM[r.samvadi]}`);
  lines.push(`- [ ] Mood: ${r.mood}`);
  if (d) {
    lines.push(`- [ ] Pakad: ${d.pakad}`);
    d.chalan.forEach((c, i) => lines.push(`- [ ] Chalan ${i + 1}: ${c}`));
    lines.push(`- [ ] Nyas swaras: ${d.nyas.join(", ")}`);
    if (d.specialNotes) lines.push(`- [ ] Note: ${d.specialNotes}`);
    for (const s of d.similar) lines.push(`- [ ] Compared with ${s.name}: ${s.difference}`);
    for (const m of d.commonMistakes) lines.push(`- [ ] Common mistake: ${m}`);
  } else {
    lines.push("- Pakad, chalan, nyas, similar raags: not written yet");
  }
  lines.push("");
}

writeFileSync("docs/raag-review.md", lines.join("\n"));
console.log(`wrote docs/raag-review.md (${RAAG_LIST.length} raags)`);
