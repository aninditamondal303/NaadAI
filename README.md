# Naad AI

A riyaz (practice) companion for Hindustani classical vocalists. It listens
while you sing and shows how closely you hold each swara, measured in cents
against your own Sa. It also plays the tanpura and taal for you.

You only need a laptop or phone microphone and earphones. Earphones keep the
app's tanpura out of the microphone.

## Principles

- **Only real measurements.** Every number the app shows is measured from your
  voice. If something can't be measured reliably, the app doesn't show it.
- **Strict on raag rules, gentle on style.** A wrong swara for the raag is
  flagged. A slower meend or a different ornament is your style, not a mistake.
- **Accuracy is measured and published.** See [`eval/`](eval/).

## Status

Work in progress. Being rebuilt in phases:

| Phase | Work | Status |
|---|---|---|
| 1 | Real pitch tracking from recordings, automatic Sa detection, remove placeholder values | Done (real-voice accuracy test pending) |
| 2 | Recorded tanpura and tabla sounds, 10 taals | Planned |
| 3 | Verified raag library | Planned |
| 4 | Sa sadhana, range and breath tracking | Planned |
| 5 | Palta mode with laya ladder, pakad practice | Planned |
| 6 | Raga rule checker, meend curve, gamak and andolan measurement | Planned |
| 7 | Ear training, weak-swara practice, daily riyaz planner | Planned |
| 8 | Accuracy report, per-user accounts, demo | Planned |

### What works now

- **Live tuner**: the swara you are singing and how many cents sharp or flat it is.
- **Find my Sa**: hold Sa for a few seconds; the app measures its pitch and how much it wobbles.
- **Analyse singing**: record or upload a recording (analysed in the browser, never uploaded).
  You get the time on held notes, the share within ±20 cents of each swara, per-swara position
  and wobble, the range, swaras outside the chosen raag, and the pitch curve on a sargam grid.
- **Automatic Sa detection** from a recording, which says "not sure" instead of guessing.
- **Progress and Profile** pages built only from your own saved practice (stored in your browser).
- **Optional written feedback**: an AI model comments on the measured numbers only, through
  gharana-style lenses. Without an API key the app shows the measurements alone.
- Tanpura drone and taal metronome (synthesised for now; recorded samples come in Phase 2).

### Accuracy so far (synthetic test audio only)

| What | Result | How to reproduce |
|---|---|---|
| Pitch within ±20 cents | 100% of sung frames, 0% false pitch in silence | `npm run eval:pitch` |
| Sa within ±20 cents (raag and voice type known) | 56 of 56 test phrases | `npm run eval:sa` |

These numbers come from computer-generated voice-like test clips, which are much
easier than real singing. Results on real recordings will be published once
they are collected (see [`eval/README.md`](eval/README.md)).

## Tech stack

- React 19, TypeScript, Vite, Tailwind CSS
- Express server (`server.ts`)
- Pitch analysis in plain TypeScript (`src/analysis/`), shared by the browser and the tests
- Optional written feedback from the Google Gemini API, based only on the measured numbers

## Run locally

Requires Node.js 20 or later.

```bash
npm install
cp .env.example .env   # optional: add a Gemini API key for written feedback
npm run dev            # http://localhost:3000
```

Other commands:

```bash
npm test               # unit tests
npm run eval:pitch     # pitch accuracy benchmark
npm run eval:sa        # Sa detection benchmark
npm run lint           # type check
```
