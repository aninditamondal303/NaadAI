# Raag recognition test sets

Labels for `npm run eval:raag`. Audio is not committed; download it and
convert to WAV (mono, 44.1 kHz) into `eval/datasets/` first:

```sh
for f in *.mp3; do ffmpeg -v error -i "$f" -ac 1 -ar 44100 "eval/datasets/hcm-raaga/${f%.mp3}.wav"; done
npm run eval:raag -- eval/datasets/hcm-raaga eval/raag-labels/hcm-raaga.csv --name "HindustaniClassicalMusic_Raaga"
```

## hcm-raaga.csv

27 recordings, 27 raags, from the Kaggle dataset
"HindustaniClassicalMusic_Raaga" (MIT licence). 18 are short aroh/avaroh
demonstrations by one singer with Sa near A#3; 9 are longer lessons
(spoken introduction, aroh, avaroh, pakad) by a singer with Sa near C3,
C#3, G#3 or A#2.

**Raag labels** come from the file names. The dataset's own spreadsheet has
some aroh entries that disagree with the recordings (for example Bhairav
without komal Re), so it was not used.

**Sa labels** were read from each recording's pitch track (not by ear):
the note the singer starts the aroh from and returns to. They have not yet
been checked by a musician.
The script then tunes each label to the recording's own Sa (median pitch
held within 60 cents of that note). One label (Puriya Dhanashree) was
corrected from C to C#, where the opening phrase N r G M P d N S' places Sa.

## Results (19 Nov 2026)

| Version | Sa | Top 1 | Top 3 |
|---|---|---|---|
| Before: swaras, steps and vadi only | labelled | 19 / 27 | 22 / 27 |
| With three-note phrase matching | labelled | **22 / 27** | **26 / 27** |
| Before: Sa found first, then the raag | automatic | 14 / 27 | 16 / 27 |
| Sa and raag chosen together | automatic | **20 / 27** | **23 / 27** |

With labelled Sa, every first guess has the true raag's swaras; the five
misses are raags with the same swaras (Bhimpalasi/Dhanashree,
Durga/Jaldhar Kedar, Kedar/Kamod, Marwa/Puriya, Hameer/Chayanat).

The two weights added (phrase match 2, Sa evidence 2) were chosen before
the run and not tuned afterwards, but the method was developed while
looking at this set. A separate dataset (Thaat and Raga Forest) is the
independent check.

## trf-sample.csv: the independent check

Thaat and Raga Forest (Kaggle / IEEE DataPort, AGPL-3.0, 17 GB): concert,
film and instrumental recordings, with tabla, harmonium and other
accompaniment. A fixed sample was taken before any results were seen: the
first two files (by number, under 40 MB) of each of the 48 folders whose
name maps to one raag in this app, 96 recordings in all. Folders that could
mean several raags (Malhar, Sarang, Deepak, Gauri and others) were left out.
Each was cut to at most 5 minutes, starting 30 s in to skip announcements:

```sh
ffmpeg -ss 30 -t 300 -i in.mp3 -ac 1 -ar 44100 out.wav
```

There are no Sa labels, so only automatic Sa is measured. Nothing was
changed after seeing these results.

| Version | Top 1 | Top 3 | First guess in the right thaat | Median rank (of 125) |
|---|---|---|---|---|
| Before (swaras, steps and vadi; Sa found first) | 7 / 96 | 11 / 96 | 22 / 96 | 48 |
| Now (phrase matching; Sa and raag together) | **16 / 96** | **22 / 96** | **26 / 96** | **31** |

Chance would be under 1 in 100 for top 1. The improvement carries over to
recordings the method was not developed on, but concert recordings with
accompaniment and an unknown Sa remain hard: the pitch tracker follows one
voice and is confused by harmonium and sarangi, and many of these are
instrumental or film songs. Solo riyaz recordings, which the app is made
for, are much closer to the first test set.
