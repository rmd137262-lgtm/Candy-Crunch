import math
import os
import struct
import wave

RATE = 22050
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "sounds")
os.makedirs(OUT, exist_ok=True)


def write_wav(name, samples):
    path = os.path.join(OUT, name)
    with wave.open(path, "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        frames = b"".join(struct.pack("<h", int(max(-1.0, min(1.0, s)) * 32767)) for s in samples)
        w.writeframes(frames)
    print("wrote", path, len(samples), "samples")


def tone(freq, dur, vol=0.5, decay=True, start=0.0):
    n = int(RATE * dur)
    out = []
    for i in range(n):
        t = i / RATE
        env = 1.0
        if decay:
            env = math.exp(-4.0 * (t / dur))
        # small attack to avoid clicks
        attack = min(1.0, t / 0.005)
        out.append(math.sin(2 * math.pi * freq * (t + start)) * vol * env * attack)
    return out


def mix(a, b):
    n = max(len(a), len(b))
    out = []
    for i in range(n):
        va = a[i] if i < len(a) else 0.0
        vb = b[i] if i < len(b) else 0.0
        out.append(va + vb)
    return out


def seq(*chunks):
    out = []
    for c in chunks:
        out.extend(c)
    return out


# swap: quick soft click/whoosh
write_wav("swap.wav", tone(320, 0.07, vol=0.35))

# match: pleasant candy pop (two quick blips up)
match = seq(tone(680, 0.06, vol=0.45), tone(920, 0.09, vol=0.45))
write_wav("match.wav", match)

# combo: rising happy chime (3 notes)
combo = seq(tone(660, 0.08, vol=0.45), tone(880, 0.08, vol=0.45), tone(1180, 0.16, vol=0.5))
write_wav("combo.wav", combo)

# win: cheerful ascending arpeggio
win = seq(
    tone(523, 0.12, vol=0.5),
    tone(659, 0.12, vol=0.5),
    tone(784, 0.12, vol=0.5),
    tone(1046, 0.28, vol=0.55),
)
write_wav("win.wav", win)

# over: gentle descending tone
over = seq(tone(440, 0.16, vol=0.45), tone(330, 0.16, vol=0.45), tone(247, 0.30, vol=0.45))
write_wav("over.wav", over)

print("done")
