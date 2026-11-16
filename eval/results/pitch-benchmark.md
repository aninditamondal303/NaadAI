# Pitch method benchmark (synthetic clips)

20 synthetic clips, 98.4 s of audio, 1 reading every 10 ms.
Synthetic voice-like signals with exactly known pitch. Real-voice results are reported separately.

## Overall

| Method | Within ±20 cents | Within ±50 cents | Octave errors | Voicing recall | False pitch in silence | Median error (cents) | Speed (ms per s of audio) |
|---|---|---|---|---|---|---|---|
| autocorr | 100.0% | 100.0% | 0.0% | 100.0% | 11.0% | 0.10 | 116.2 |
| yin | 96.7% | 100.0% | 0.0% | 100.0% | 0.0% | 0.09 | 277.9 |
| mpm | 100.0% | 100.0% | 0.0% | 100.0% | 0.0% | 0.07 | 18.0 |

## Within ±20 cents, per clip

| Clip | autocorr | yin | mpm |
|---|---|---|---|
| male/sa-sadhana | 100.0% | 100.0% | 100.0% |
| male/yaman-aroh | 100.0% | 100.0% | 100.0% |
| male/kharaj | 100.0% | 100.0% | 100.0% |
| male/taar | 100.0% | 100.0% | 100.0% |
| male/andolan-komal-re | 100.0% | 100.0% | 100.0% |
| male/gamak | 100.0% | 41.7% | 100.0% |
| male/meend-sa-pa-ga | 100.0% | 100.0% | 100.0% |
| male/weak-fundamental | 100.0% | 100.0% | 100.0% |
| male/noise-20dB | 100.0% | 100.0% | 100.0% |
| male/noise-10dB | 100.0% | 100.0% | 100.0% |
| female/sa-sadhana | 100.0% | 100.0% | 100.0% |
| female/yaman-aroh | 100.0% | 100.0% | 100.0% |
| female/kharaj | 100.0% | 100.0% | 100.0% |
| female/taar | 100.0% | 100.0% | 100.0% |
| female/andolan-komal-re | 100.0% | 100.0% | 100.0% |
| female/gamak | 100.0% | 35.9% | 100.0% |
| female/meend-sa-pa-ga | 100.0% | 100.0% | 100.0% |
| female/weak-fundamental | 100.0% | 100.0% | 100.0% |
| female/noise-20dB | 100.0% | 100.0% | 100.0% |
| female/noise-10dB | 100.0% | 100.0% | 100.0% |
