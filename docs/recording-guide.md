# Recording real tanpura and tabla samples

Naad AI plays the tanpura and tabla itself, so it always knows the exact Sa and
beat timing.

**What ships with the app now:** real recordings from the open-source
[Naad](https://github.com/oormicreations/naad) project (MIT licence,
imported with `scripts/import-naad-samples.py`):

- **Tabla:** one recorded take of each bol (Dha, Dhin, Na, Ta, Tin, Tun, Ti,
  Ge, Ga, Ke) from one tabla with the dayan tuned to C, retuned to your Sa.
- **Tanpura:** one real Sa–Pa tanpura loop with Sa = C3, retuned to your Sa
  (within 6 semitones, so for some Sa settings it plays an octave below) and
  looped with crossfades.

**What's still missing,** and why recording your own is worth it:

- Ma and Ni first-string tuning (raags like Malkauns and Marwa) still use the
  synthesised tanpura.
- With one recorded key, Sa settings far from C are shifted by up to 6
  semitones, which changes the tone a little; the plucking speed can't be changed.
- Single-string recordings (below) fix all of this: every string is then
  played separately at any speed. When `strings` are listed in the manifest,
  the app uses them instead of the loop.

This guide explains how to record them.

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

Put the files in `public/samples/tanpura/` and list them under `strings` in
`manifest.json` (keep the existing `drones` entry as a fallback):

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

| Key | Stroke | Drum |
|---|---|---|
| `Na` | Na | dayan, on the rim |
| `Ta` | Ta | dayan |
| `Tin` | Tin | dayan, ringing on the sur |
| `Tun` | Tun / Tu | dayan, open in the centre |
| `Ti` | Ti / Te / Ra | dayan, closed |
| `Ge` | Ge | bayan, open resonant |
| `Ga` | Ga | bayan |
| `Ke` | Ke / Ka / Kat | bayan, closed |

Also record the combined bols Dha and Dhin (both drums together), and Ga.

`public/samples/tabla/manifest.json` (replace the shipped one):

```json
{
  "credit": "Tabla played by ... at ...",
  "licence": "Recorded for Naad AI, used with permission",
  "dayanHz": 277.2,
  "bols": { "Dha": "dha.wav", "Dhin": "dhin.wav", "Na": "na.wav", "Ta": "ta.wav", "Tin": "tin.wav",
            "Tun": "tun.wav", "Ti": "ti.wav", "Ge": "ge.wav", "Ga": "ga.wav", "Ke": "ke.wav" }
}
```

`dayanHz` is the measured pitch of your Na stroke. Theka bols are mapped to
these in `src/audio/tabla.ts` (e.g. Dhi → Dhin, Tu → Tun, TiRaKiTa → Ti Ti Ke Ta).

## Checking

Start the app, open **Tanpura & Taal**, and check that the line under each
player names your recordings. Then sing into the live tuner with the
tanpura on (with earphones) to check that Sa reads 0 cents.
