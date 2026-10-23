#!/usr/bin/env python3
"""Surullinen kirkkourkukappale kaveriin osumisen lopetukseen.

Eri kappale kuin radio ja saunan lopetusbiisi: vain urut, hidas d-molli.
Aja: python3 generoi_urut.py
"""
import os, struct, subprocess
import numpy as np

ROOT = os.path.dirname(os.path.abspath(__file__))
SF = "/usr/share/sounds/sf2/FluidR3_GM.sf2"
TMP = "/tmp/urut_biisi"
os.makedirs(TMP, exist_ok=True)
PPQ = 480
BPM = 48
RNG = np.random.default_rng(3)

def vlq(n):
    b = [n & 0x7f]
    n >>= 7
    while n:
        b.insert(0, (n & 0x7f) | 0x80)
        n >>= 7
    return bytes(b)

class Song:
    def __init__(self):
        self.ev = []
    def prog(self, ch, p):
        self.ev.append((0, 1, bytes([0xC0 | ch, p])))
    def note(self, ch, beat, m, dur, vel):
        if dur <= 0:
            return
        a = int(round(beat * PPQ))
        b = a + max(1, int(round(dur * PPQ)))
        vel = int(np.clip(vel + int(RNG.integers(-1, 2)), 1, 90))
        self.ev.append((a, 3, bytes([0x90 | ch, int(m), vel])))
        self.ev.append((b, 2, bytes([0x80 | ch, int(m), 0])))
    def write(self, path):
        tempo = int(60e6 / BPM)
        trk = b"\x00\xff\x51\03" + tempo.to_bytes(3, "big")
        last = 0
        for tk, _, e in sorted(self.ev, key=lambda x: (x[0], x[1])):
            trk += vlq(max(0, tk - last)) + e
            last = max(last, tk)
        trk += b"\x00\xff\x2f\x00"
        open(path, "wb").write(
            b"MThd" + struct.pack(">IHHH", 6, 0, 1, PPQ) + b"MTrk" + struct.pack(">I", len(trk)) + trk)

# d-molli, koraalityyli. (bar, sointu)
CHORDS = [
    (38, 50, 53, 57),  # Dm
    (41, 53, 57, 60),  # F
    (43, 46, 50, 55),  # Gm
    (46, 50, 53, 58),  # Bb
    (36, 48, 52, 55),  # C
    (38, 50, 53, 57),
    (41, 45, 50, 57),  # Dm/F
    (43, 50, 55, 58),
    (36, 48, 52, 55),
    (38, 50, 53, 57),
]
# Sävellaji D4=62
MELODY = [
    (0, 0, 0, 3.2, 70), (1, 0, 3, 2.0, 66), (1, 2.2, 7, 1.6, 72),
    (2, 0, 8, 2.2, 68), (2, 2.4, 7, 1.4, 64),
    (3, 0, 5, 1.6, 66), (3, 2, 3, 1.8, 70),
    (4, 0, 2, 3.4, 64),
    (5, 0, 0, 2.0, 72), (5, 2.2, -2, 1.6, 66),
    (6, 0, 3, 1.5, 68), (6, 1.8, 7, 2.0, 74),
    (7, 0, 8, 1.4, 66), (7, 1.6, 5, 2.2, 62),
    (8, 0, 3, 3.2, 64),
    (9, 0, 0, 3.6, 76),
]

def build():
    s = Song()
    s.prog(0, 19)  # kirkkourut
    s.prog(1, 19)
    for bar, chord in enumerate(CHORDS):
        b0 = bar * 4
        for m in chord:
            s.note(0, b0, m, 3.7, 52)
        for m in chord[:2]:
            s.note(0, b0, m - 12, 3.7, 46)
    for bar, beat, semi, dur, vel in MELODY:
        s.note(1, bar * 4 + beat, 62 + semi, dur, vel)
    return s

def stereo_peak(path):
    raw = subprocess.check_output(
        ["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-acodec", "pcm_f32le", "-ac", "2", "-"],
        stderr=subprocess.DEVNULL)
    x = np.frombuffer(raw, dtype=np.float32)
    x = x[: len(x) // 2 * 2].reshape(-1, 2)
    return float(np.max(np.abs(x[:, 0]))), float(np.max(np.abs(x[:, 1])))

def main():
    song = build()
    mid, wav = f"{TMP}/urut.mid", f"{TMP}/urut.wav"
    song.write(mid)
    subprocess.run([
        "fluidsynth", "-ni", "-q", "-g", "0.32", "-r", "44100", "-R", "1", "-C", "0",
        "-o", "synth.reverb.room-size=0.72", "-o", "synth.reverb.damp=0.35", "-o", "synth.reverb.level=0.38",
        "-F", wav, SF, mid], check=True)
    last = max(t for t, _, _ in song.ev) / PPQ
    dur = last * 60 / BPM + 2.8
    fade = 3.5
    af = (f"atrim=0:{dur:.3f},asetpts=PTS-STARTPTS,highpass=f=50,"
          f"acompressor=threshold=-18dB:ratio=1.5:attack=40:release=300:makeup=1,"
          f"loudnorm=I=-16:TP=-2.5:LRA=11,alimiter=limit=0.68:level=false,"
          f"afade=t=in:st=0:d=0.6,afade=t=out:st={max(0, dur - fade):.2f}:d={fade}")
    out = f"{TMP}/urut_m.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-af", af, "-ar", "44100", "-ac", "2", out], check=True)
    md = float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out]))
    lp, rp = stereo_peak(out)
    print(f"musiikki_urut kesto {md:.1f}s  wav-huippu L {lp:.3f} R {rp:.3f}")
    if md < 36 or md > 62:
        raise SystemExit(f"kesto pielessä: {md:.1f}s")
    if max(lp, rp) >= 0.95:
        raise SystemExit(f"klippaus wav: {lp:.3f} {rp:.3f}")
    dst = os.path.join(ROOT, "musiikki_urut")
    for ext, a in (("ogg", ["-c:a", "libvorbis", "-q:a", "5"]), ("mp3", ["-c:a", "libmp3lame", "-q:a", "2"])):
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", out, *a, f"{dst}.{ext}"], check=True)
        lp, rp = stereo_peak(f"{dst}.{ext}")
        print(f"  musiikki_urut.{ext} L {lp:.3f} R {rp:.3f}")
        if max(lp, rp) >= 0.99:
            raise SystemExit(f"klippaus {ext}")

if __name__ == "__main__":
    main()
