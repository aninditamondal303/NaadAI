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
