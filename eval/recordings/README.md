# Real recordings for the accuracy report

The resume number ("Sa detection within ±X cents on Y% of recordings") must
come from real singing. Here's how to collect it.

1. In the app, set your Sa (Tanpura tab) and note the exact Hz shown.
2. With **earphones** on and the tanpura playing, record on your phone or
   laptop as WAV (or convert to WAV afterwards):
   - `singing` clips: 20–60 s of alaap or a bandish in a raag the app knows
   - `held-sa` clips: hold Sa on "aa" for about 5 s
3. Put the files here and list them in `labels.csv`:

```
file,type,true_sa_hz,raag,voice,singer
asha_yaman_1.wav,singing,196.00,yaman,female,Asha
asha_sa_1.wav,held-sa,196.00,,female,Asha
```

`raag` is the app's raag id (e.g. yaman, bhupali, bhairav, malkauns).
`voice` is male or female.

4. Run `npm run eval:real`. The report is written to `eval/results/real-voice.md`.

Aim for at least 20 clips from 3 or more singers. Only add recordings of
people who have agreed; this folder is committed to a public repository, so
if anyone prefers privacy, keep their files out of git (add them to
.gitignore) and only commit the results table.
