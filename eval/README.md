# Accuracy evaluation

Naad AI only shows numbers it really measures, so we also measure how accurate
those measurements are. Everything here is deterministic: running it twice
gives the same numbers.

## Pitch tracking benchmark

```bash
npm run eval:pitch
```

Compares three pitch detectors on the same clips and writes
`results/pitch-benchmark.md`:

| Method | What it is |
|---|---|
| `autocorr` | The method the live tuner used before (time-domain autocorrelation). Kept as a baseline. |
| `yin` | YIN, de Cheveigné & Kawahara (2002). |
| `mpm` | McLeod Pitch Method, McLeod & Wyvill (2005). FFT-based, so it's fast. |

Measures (standard melody-extraction measures, plus a stricter ±20-cent one):

- **Within ±20 / ±50 cents**: share of sung moments where the detected pitch is that close to the true pitch.
- **Octave errors**: share of sung moments read a whole octave off.
- **Voicing recall**: share of sung moments that got a pitch at all.
- **False pitch in silence**: share of silent or breath moments where a pitch was wrongly reported.

## Sa detection benchmark

```bash
npm run eval:sa
```

56 synthetic 20-second alaap-like phrases (Yaman, Bhairav, Bhupali, Malkauns,
each at 14 Sa values from 110 Hz to 233 Hz), tested three ways:

- **raag + voice type known**: the normal case in the app. The singer has
  chosen the raag, and their profile says roughly where their Sa is (male or
  female), which is used only to choose the octave.
- **raag known**: no hint about the octave.
- **nothing known**: only the Sa + Pa relationship. This often confuses Sa with
  Ma (or Pa), so the app doesn't rely on it.

Results are in `results/sa-benchmark.md`.

### Test clips: synthetic for now

`synth.ts` builds voice-like test signals (harmonics shaped like an open "aa"
vowel, small natural pitch wander) with an exactly known pitch at every
moment, for a male Sa (C#3) and a female Sa (G#3):
Sa sadhana, Yaman aroh, kharaj, taar saptak, andolan, fast gamak, meend,
weak fundamental, and background noise at 20 dB and 10 dB.

**Limitation:** synthetic clips are much easier than real singing (no
breathiness, no room echo, no real vocal tract). They catch broken methods,
but they can't prove a method works on real voices. Next: real recordings sung
over the app's own tanpura (so the true Sa is known) and a public singing
dataset with expert pitch labels.
