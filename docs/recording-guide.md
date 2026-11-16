# Recording real tanpura and tabla samples

Naad AI plays the tanpura and tabla itself, so it always knows the exact Sa and
beat timing. Until real recordings are added, it uses synthesised placeholder
sounds and says so on screen. This guide explains how to record the real ones.

**Only use recordings you made yourself (your own instrument, your guru's, or
a music school's, with permission), or recordings whose licence clearly
allows reuse (for example CC0 or CC BY). Never copy sounds from other apps.**

## Equipment

- A quiet room (switch off fans and AC).
- A phone or laptop is enough; an external microphone is better.
- Record as WAV, 48 kHz, 24-bit if possible (16-bit is fine). No effects, no noise reduction.
- Keep the microphone 30–50 cm from the instrument and don't move it between takes.

## Tanpura

Record each string **on its own**, plucked once, letting it ring until it fades
(about 6–8 seconds). Mute the other strings with your hand.

Record at several Sa pitches so the app never has to shift a sample far
(shifting more than 2–3 semitones starts to sound unnatural). Suggested:

| Voice | Sa pitches to record |
|---|---|
| Male | C3, C#3, D3, D#3, E3 (130.8–164.8 Hz) |
| Female | F#3, G3, G#3, A3, A#3 (185.0–233.1 Hz) |

For each Sa, record: the first string tuned to mandra Pa, then retuned to
mandra Ma, then mandra Ni; one madhya Sa string; the kharaj (low Sa) string.

Measure each file's real pitch (play it into the Analyzer's live tuner, or use
any tuner) and write it in the manifest. The app uses the measured pitch to
retune exactly to the singer's Sa.

Put the files in `public/samples/tanpura/` with a `manifest.json` like:

```json
{
  "credit": "Tanpura played by ... at ...",
  "licence": "Recorded for Naad AI, used with permission",
  "strings": {
    "first-Pa": [{ "file": "pa_C3.wav", "hz": 98.1 }, { "file": "pa_G3.wav", "hz": 147.0 }],
    "first-Ma": [{ "file": "ma_C3.wav", "hz": 87.2 }],
    "first-Ni": [{ "file": "ni_C3.wav", "hz": 122.6 }],
    "sa":       [{ "file": "sa_C3.wav", "hz": 130.8 }],
    "kharaj":   [{ "file": "kharaj_C3.wav", "hz": 65.4 }]
  }
}
```

## Tabla

Tune the dayan (right drum) to a known Sa and write that pitch as `dayanHz`.
Record each stroke **separately**, 5 clean repetitions each, then cut the
single best one into its own file (start exactly at the attack, about 1 s long).

| File key | Stroke | Drum |
|---|---|---|
| `na` | Na / Ta | dayan, on the rim |
| `tin` | Tin | dayan, ringing on the sur |
| `tu` | Tu | dayan, open in the centre |
| `ti` | Ti / Te | dayan, closed |
| `ra` | Ra | dayan, closed (second stroke of TiRa) |
| `ge` | Ge / Ga | bayan, open resonant |
| `ke` | Ke / Ka / Kat | bayan, closed |

Combined bols are built from these: Dha = Na + Ge, Dhin = Tin + Ge, and so on
(see `src/audio/tabla.ts`).

`public/samples/tabla/manifest.json`:

```json
{
  "credit": "Tabla played by ... at ...",
  "licence": "Recorded for Naad AI, used with permission",
  "dayanHz": 277.2,
  "strokes": { "na": "na.wav", "tin": "tin.wav", "tu": "tu.wav", "ti": "ti.wav", "ra": "ra.wav", "ge": "ge.wav", "ke": "ke.wav" }
}
```

## Checking

Start the app, open **Tanpura & Taal**, and check that the line under each
player says "Recorded ... samples". Then sing into the live tuner with the
tanpura on (with earphones) to check that Sa reads 0 cents.
