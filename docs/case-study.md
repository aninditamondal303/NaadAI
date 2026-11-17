# Naad AI: case study

## The problem

A Hindustani vocalist's daily riyaz rests on two things a teacher cannot be
present for: holding each swara exactly in its place against the tanpura, and
moving between swaras the way the raag allows. Practice tools for Western
music measure notes against a keyboard and know nothing of Sa, raag grammar,
meend or andolan. Naad AI measures singing in the terms a guru uses, and only
reports what it has actually measured.

## Principles

- **Measured, not guessed.** Every number on screen comes from the recording.
  When something cannot be measured, the app shows "–".
- **The singer's own Sa.** Every swara is placed relative to the singer's Sa,
  set on a harmonium keyboard or found from the voice.
- **Authority stays with the guru.** Raag facts cite their source
  (tanarang.com for mukhya ang, vishranti sthan, vadi and samvadi).
  Compositions written for the app are labelled as such. A guru can record
  phrases for the student, and traditional bandishes can be entered by hand.
- **Private by default.** Analysis runs on the device. Share links carry
  measurements and a pitch line, never audio.

## How a take is measured

1. **Pitch**: the McLeod pitch method (MPM) runs every 10 ms between 60 and
   1100 Hz.
   - A frame counts as voiced when its clarity is at least 0.85, or at least
     0.6 when it continues a voiced line.
   - Frames below −45 dB, and jumps of more than 150 cents, are treated as
     breaks.
2. **Sa**: either the singer's saved Sa or one found in the recording. Each
   candidate Sa is scored by how well the held notes fit the chosen raag's
   swaras.
3. **Held notes**: stretches within half a semitone for at least 0.25 s. Each
   has a median position (cents from the equal-tempered swara) and a wobble
   (median distance from its own centre).
4. **Phrases and breath**: a silence of 0.3 s or more ends a phrase.
5. **Raag rules**: a swara outside the raag held for 0.4 s or more is
   flagged with its time. Shorter touches are allowed, as in performance.
6. **Ornaments**: oscillations of 0.5–12 swings a second and at least
   20 cents wide are reported with their speed and width. Slow ones are
   andolan-like and fast ones gamak-like.
7. **Raag recognition**: a rule-based ranking, run after the take and live
   while singing. Each raag is scored on:
   - the share of held time on its swaras
   - how many of its swaras were used
   - whether steps follow its aroh and avaroh
   - emphasis on its vadi and samvadi

   Raags with the same swaras are named together, because only phrasing
   separates them.

## Accuracy

| Test | Result |
|---|---|
| Real singing: 40 singers, pitch marked by musicians (vocadito, CC BY 4.0) | 92.0% of frames within 20 cents, 96.6% within 50, median error 2.8 cents |
| The common YIN method on the same data | 84.3% within 20 cents |
| Pitch reported where annotators marked silence | 13% (mostly breaths and fading note endings) |
| Synthetic voices with gamak, meend and noise | 100% within 20 cents |
| Sa detection on 56 phrases (four raags, Sa 110–233 Hz) | 56 of 56 |

The real-voice evaluation runs in GitHub Actions (workflow "Real-voice
accuracy"), and the synthetic benchmarks run in CI on every push.

## Design decisions

- **Recorded instruments.** The tanpura (Sa–Pa) and tabla bols are
  recordings retuned to the singer's Sa, not synthesis. They come from
  Oormi Creations' Naad, under the MIT licence.
- **Timing stays tight on screen and survives a locked screen.** While the
  app is visible, sound goes straight to the speakers. When the screen locks,
  the same sound is sent through a media element, so the phone keeps playing
  it and shows lock-screen controls.
- **A guru's phrase travels as a pitch line.** The guide voice follows the
  guru's own pitch line, meends and andolans included. The student is scored
  on the guru's swaras, and no recording leaves the guru's device.
- **One codebase, three surfaces.** The same app is published as a website,
  as an installable offline web app and, via Capacitor, as an Android app.
  The Android app uses native daily notifications.

## Engineering

- **Stack:** React 19, TypeScript, Vite, and Web Audio with an AudioWorklet
  microphone. Analysis runs in a Web Worker.
- **Unit tests:** over 440 tests (vitest) cover:
  - pitch detection and voicing
  - held notes, phrases and the rule check
  - raag data consistency: every composition's swaras belong to its raag
  - scoring, sharing, the weekly report, raag comparison and guru phrases
- **End-to-end tests:** `e2e/flows.mjs` drives the real site in Chrome on
  every push, at desktop and phone sizes, and fails on any page error.
- **Accessibility and speed:** Lighthouse (mobile) scores 100 for
  accessibility, best practices and SEO. Tabs load on demand, so the welcome
  page becomes usable quickly.
- **Languages:** English, Hindi and Bengali.

## What remains

- A review of the raag notes by a guru, and of the Hindi and Bengali text by
  native speakers.
- Evaluation on riyaz recordings of Hindustani vocalists. The current
  real-voice dataset is not Hindustani singing.
- Tanpura recordings tuned to Ma and Ni for raags without Pa.
