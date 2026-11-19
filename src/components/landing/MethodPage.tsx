/**
 * How Naad AI works: the methods, their settings and the measured accuracy,
 * in plain but formal terms. Every number here comes from the code or from
 * the published evaluation tables.
 */
import React from "react";
import { SKIES } from "./sky";
import { useLang } from "../../i18n/lang";
import { LangPicker } from "../../i18n/LangPicker";

const sky = SKIES.night;
const vars = {
  "--sky-top": sky.top, "--sky-bottom": sky.bottom, "--ink": sky.ink, "--muted": sky.muted, "--line": sky.line,
  "--line-strong": sky.lineStrong, "--voice": sky.voice, "--btn-bg": sky.buttonBg, "--btn-ink": sky.buttonInk,
} as React.CSSProperties;

export const MethodPage: React.FC<{ onBack: () => void; onOpenApp: () => void }> = ({ onBack, onOpenApp }) => {
  const { lang } = useLang();
  return (
    <div className="ln ln-gate" style={vars} lang={lang}>
      <header className="ln-top">
        <span className="ln-mark"><span className="ln-mark-deva">{lang === "bn" ? "নাদ" : "नाद"}</span> Naad AI</span>
        <nav className="ln-nav" aria-label="Page">
          <button type="button" className="ln-open" onClick={onBack}>Welcome page</button>
          <LangPicker />
          <button type="button" className="ln-open" onClick={onOpenApp}>Open the app</button>
        </nav>
      </header>

      <main className="ln-read mt-read">
        <section className="ln-sec">
          <h2>How it works</h2>
          <p className="ln-lede">
            Naad AI measures singing; it does not imitate a teacher's judgement. Each stage below is a defined measurement with stated
            limits. All processing takes place in the browser, and recordings are not uploaded.
          </p>
        </section>

        <section className="ln-sec">
          <h2>1. Pitch</h2>
          <p className="ln-lede">
            The voice is measured every 10 milliseconds with the McLeod Pitch Method (McLeod and Wyvill, 2005), which finds the
            repetition period of the waveform through its normalised squared difference. The search is limited to 60–1100 Hz, the range
            of the singing voice.
          </p>
          <dl className="ln-dl">
            <div><dt>Voicing</dt><dd>A reading begins a sung passage only when the waveform's periodicity (clarity) reaches 0.85, and continues it while clarity stays above 0.6. Silence below −45 dB is not measured.</dd></div>
            <div><dt>Octave errors</dt><dd>A continuing reading may not jump more than 150 cents from the previous one; larger jumps must meet the stricter starting condition. This prevents sudden octave errors within a held note.</dd></div>
            <div><dt>Live drawing</dt><dd>While singing, the same detector and voicing rule are applied to the most recent audio once per screen refresh.</dd></div>
          </dl>
        </section>

        <section className="ln-sec">
          <h2>2. Sa</h2>
          <p className="ln-lede">
            When Sa is not given, all measured pitches are folded into one octave and counted by position. Each of the twelve possible
            Sa positions is scored by how well the counts match the swaras of the chosen raag; the octave is chosen from the voice type.
            A small margin between the best two positions is reported as uncertain instead of being presented as a result.
          </p>
        </section>

        <section className="ln-sec">
          <h2>3. Swaras, phrases and raag rules</h2>
          <dl className="ln-dl">
            <div><dt>Held swara</dt><dd>Singing that stays within 50 cents of one swara for at least 0.25 seconds. Its position is the median distance from the equal-tempered swara, in cents; its steadiness is the median distance from its own centre.</dd></div>
            <div><dt>Phrase</dt><dd>Singing between silences of at least 0.3 seconds, taken as breaths.</dd></div>
            <div><dt>Outside the raag</dt><dd>A swara not belonging to the chosen raag that is held for at least 0.4 seconds, reported with its time.</dd></div>
            <div><dt>Andolan and gamak</dt><dd>Alternating peaks and troughs of pitch around a swara, between 0.5 and 12 cycles per second and at least 20 cents wide, reported with their rate and width.</dd></div>
          </dl>
        </section>

        <section className="ln-sec">
          <h2>4. Raag recognition</h2>
          <p className="ln-lede">
            Each raag in the library is scored from the held swaras: the share of held time on its swaras, the share of its swaras that
            were sung, whether rising steps use the swaras of its aroh and falling steps those of its avaroh, and the emphasis on its vadi
            and samvadi. Raags with the same swaras differ chiefly in phrasing and are named together rather than separated.
          </p>
        </section>

        <section className="ln-sec">
          <h2>5. Shruti view</h2>
          <p className="ln-lede">
            Each held swara is shown against two references: the equal-tempered position and the position given by simple frequency ratios
            (for example Pa at 3/2 and shuddha Ga at 5/4), towards which the tanpura's overtones point. The view reports measurements only;
            the correct intonation of a swara depends on the raag and the tradition.
          </p>
        </section>

        <section className="ln-sec">
          <h2>6. Accuracy</h2>
          <table className="ln-table">
            <caption className="ln-visually-hidden">Accuracy</caption>
            <tbody>
              <tr><th scope="row">Real singing, within 20 cents</th><td>92.0%</td><td>A public research dataset of 40 solo singers, 13.6 minutes, with pitch marked by musicians. The YIN method scores 84.3% on the same recordings.</td></tr>
              <tr><th scope="row">Real singing, within 50 cents</th><td>96.6%</td><td>Median error 2.8 cents. Pitch reported in passages marked silent: 13.0%, mostly breaths and fading note endings.</td></tr>
              <tr><th scope="row">Computer-generated voices, within 20 cents</th><td>100%</td><td>20 clips with gamak, meend and background noise; no pitch reported in silence.</td></tr>
              <tr><th scope="row">Raag recognised, Sa set by the singer</th><td>22 / 27</td><td>27 short public recordings of aroh, avaroh and pakad in 27 raags, chosen among all 125 in the library. The right raag was in the first three for 26; every first guess had the right swaras. With Sa found automatically: 20 / 27.</td></tr>
              <tr><th scope="row">Sa found, raag and voice type known</th><td>56 / 56</td><td>Computer-generated phrases in four raags, Sa from 110 to 233 Hz. Testing on Hindustani riyaz recordings is in progress.</td></tr>
            </tbody>
          </table>
        </section>

        <section className="ln-sec">
          <h2>7. Notation and data</h2>
          <dl className="ln-dl">
            <div><dt>Raag phrases</dt><dd>Mukhya ang and vishranti sthan from established raag references, converted to the app's swaralipi.</dd></div>
            <div><dt>Notation</dt><dd>Swaralipi follows the system of Pt. Vishnu Narayan Bhatkhande.</dd></div>
            <div><dt>Sound</dt><dd>Recorded tanpura and tabla samples, used under open-source licences.</dd></div>
            <div><dt>Evaluation</dt><dd>A public dataset of solo singing with pitch marked by musicians, together with computer-generated voices whose pitch is known exactly.</dd></div>
          </dl>
          <p className="ln-note">Raag notes and the compositions written for the app await review by a guru. Corrections are welcome.</p>
        </section>
      </main>
    </div>
  );
};
