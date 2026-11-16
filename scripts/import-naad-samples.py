"""
Import real tabla and tanpura recordings from the open-source Naad project
(https://github.com/oormicreations/naad, MIT licence, (c) Oormi Creations and
Contributors) into public/samples.

    git clone --depth 1 https://github.com/oormicreations/naad /tmp/naad
    python3 scripts/import-naad-samples.py /tmp/naad

Only the "01" take of each pitched bol is used: those takes were all played on one
tabla with the dayan tuned to C (measured C4 + 4 cents with Naad AI's own
pitch tracker), so the set is consistent. The other takes use differently
tuned tablas.

The tanpura file is a real Sa-Pa tanpura loop with Sa = C3 (measured
131.2 Hz; its file name says "G", which is the Pa string).

Processing: mixed to mono, leading silence trimmed, long tails shortened
with a short fade, tanpura loop peak-normalised. No other changes.
"""
import json
import os
import sys
import wave

import numpy as np

SRC = os.path.join(sys.argv[1] if len(sys.argv) > 1 else "/tmp/naad", "Bol")
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "samples")

BOLS = ["Dha", "Dhin", "Na", "Ta", "Tin", "Tun", "Ti", "Ge", "Ga", "Ke"]
# Closed strokes have no pitch, so a fuller take is used where take 01 is clipped short (0.1 s).
TAKE = {"Ti": "02", "Ke": "02"}
MAX_SEC = 1.6


def load(path):
    w = wave.open(path)
    sr, ch = w.getframerate(), w.getnchannels()
    assert w.getsampwidth() == 2, path
    x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, ch).mean(1) / 32768.0
    return x, sr


def save(path, x, sr):
    y = np.clip(np.round(x * 32767), -32768, 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(y.tobytes())


def trim(x, sr):
    peak = np.max(np.abs(x))
    start = max(0, int(np.argmax(np.abs(x) > peak * 0.05)) - int(0.002 * sr))
    x = x[start:start + int(MAX_SEC * sr)].copy()
    fade = int(0.05 * sr)
    if len(x) > fade:
        x[-fade:] *= np.linspace(1, 0, fade)
    return x


os.makedirs(os.path.join(OUT, "tabla"), exist_ok=True)
os.makedirs(os.path.join(OUT, "tanpura"), exist_ok=True)

bols = {}
for b in BOLS:
    x, sr = load(os.path.join(SRC, b, f"{b}{TAKE.get(b, '01')}.wav"))
    name = f"{b.lower()}.wav"
    save(os.path.join(OUT, "tabla", name), trim(x, sr), sr)
    bols[b] = name

credit = "Naad by Oormi Creations, github.com/oormicreations/naad"
licence = "MIT licence"

with open(os.path.join(OUT, "tabla", "manifest.json"), "w") as f:
    json.dump({"credit": credit, "licence": licence, "dayanHz": 262.2, "bols": bols}, f, indent=2)

x, sr = load(os.path.join(SRC, "Acc", "Tanpura_SaPa_G.wav"))
x = x / np.max(np.abs(x)) * 0.8
save(os.path.join(OUT, "tanpura", "drone_sa-pa_C3.wav"), x, sr)
with open(os.path.join(OUT, "tanpura", "manifest.json"), "w") as f:
    json.dump({
        "credit": credit, "licence": licence,
        "strings": {},
        "drones": {"Pa": [{"file": "drone_sa-pa_C3.wav", "saHz": 131.2}]},
    }, f, indent=2)

licence_text = open(os.path.join(SRC, "..", "LICENSE.txt"), encoding="utf-8", errors="replace").read()
for d in ("tabla", "tanpura"):
    with open(os.path.join(OUT, d, "LICENSE"), "w") as f:
        f.write("Audio in this folder comes from https://github.com/oormicreations/naad\n\n" + licence_text)
print("done")
