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
| 1 | Real pitch tracking from recordings, automatic Sa detection, remove placeholder values | In progress |
| 2 | Recorded tanpura and tabla sounds, 10 taals | Planned |
| 3 | Verified raag library | Planned |
| 4 | Sa sadhana, range and breath tracking | Planned |
| 5 | Palta mode with laya ladder, pakad practice | Planned |
| 6 | Raga rule checker, meend curve, gamak and andolan measurement | Planned |
| 7 | Ear training, weak-swara practice, daily riyaz planner | Planned |
| 8 | Accuracy report, per-user accounts, demo | Planned |

Working now: the live swara tuner, the tanpura drone and the taal metronome.
Some analysis screens still show example values while their real measurements
are being built; these are labelled in the app.

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
npm run lint           # type check
```
