#!/usr/bin/env python3
"""Jahdin lopetusbiisi: hidas d-molli, eri kappale kuin radion biisit.

Piano, nailonkitarat, jouset, käyrätorvi, huilu ja kuoro. Ei rumpukoneistoa eikä
radiokanavien sointia. Sama masteriketju kuin radiossa (headroom + limitteri),
mutta isompi huonekaiku. Aja: python3 generoi_lopetus.py
"""
import os, struct, subprocess
import numpy as np

ROOT = os.path.dirname(os.path.abspath(__file__))
SF = "/usr/share/sounds/sf2/FluidR3_GM.sf2"
TMP = "/tmp/lopetus_biisi"
os.makedirs(TMP, exist_ok=True)
PPQ = 480
BPM = 56
RNG = np.random.default_rng(7)

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
    def cc(self, ch, c, v):
        self.ev.append((0, 0, bytes([0xB0 | ch, c, max(0, min(127, int(v)))])))
    def note(self, ch, beat, m, dur, vel):
        if dur <= 0:
            return
        a = int(round(beat * PPQ))
        b = a + max(1, int(round(dur * PPQ)))
        vel = int(np.clip(vel + int(RNG.integers(-2, 3)), 1, 96))
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

# d-molli, soinnut barin alusta. Sävellaji pysyy luonnollisessa mollissa.
CHORDS = [
    (50, 53, 57),  # Dm
    (50, 53, 57),
    (46, 50, 53),  # Bb
    (41, 45, 48),  # F
    (43, 46, 50),  # Gm
    (50, 53, 57),
    (46, 50, 53),
    (48, 52, 55),  # C
    (50, 53, 57),
    (46, 50, 53),
    (41, 45, 48),
    (50, 53, 57),
]
# Käyrätorven sävel, puolisävelaskelina D4:stä. (bar, beat, semi, dur, vel)
HORN = [
    (2, 0.0, 0, 1.4, 74), (2, 1.5, 3, 0.9, 68), (2, 2.5, 7, 1.4, 78),
    (3, 0.0, 8, 1.2, 76), (3, 1.5, 7, 0.8, 70), (3, 2.5, 3, 1.4, 72),
    (4, 0.0, 5, 1.5, 74), (4, 1.75, 3, 0.7, 66), (4, 2.5, 0, 1.4, 76),
    (5, 0.0, -2, 2.0, 72), (5, 2.0, 0, 2.0, 80),
    (8, 0.0, 0, 1.5, 70), (8, 1.75, 7, 2.0, 76),
    (9, 0.0, 8, 1.2, 72), (9, 1.5, 10, 0.8, 68), (9, 2.5, 7, 1.4, 74),
    (10, 0.0, 3, 1.5, 70), (10, 1.75, 0, 2.0, 66),
    (11, 0.0, -2, 3.5, 78),
]
FLUTE = [
    (6, 0.0, 12, 1.2, 62), (6, 1.5, 15, 1.0, 58), (6, 2.75, 19, 1.1, 64),
    (7, 0.0, 15, 1.5, 60), (7, 2.0, 12, 1.8, 66),
]

def build():
    s = Song()
    s.prog(0, 0)    # piano
    s.prog(1, 24)   # nailonkitara
    s.prog(2, 48)   # jouset
    s.prog(3, 60)   # käyrätorvi
    s.prog(4, 73)   # huilu
    s.prog(5, 52)   # kuoro
    s.cc(2, 7, 78)
    s.cc(5, 7, 64)
    s.cc(1, 7, 70)
    for bar, chord in enumerate(CHORDS):
        b0 = bar * 4
        for i, m in enumerate(chord):
            s.note(2, b0, m - 12, 3.8, 46 + (8 if bar in (5, 11) else 0))
            s.note(5, b0, m + 12, 3.9, 36)
            s.note(0, b0 + (0.02 if i else 0), m, 1.7, 54)
            s.note(0, b0 + 2, m + 12, 1.6, 48)
        if 1 <= bar <= 10:
            for k, m in enumerate(chord):
                s.note(1, b0 + k * 0.5, m + 12, 0.42, 50)
                s.note(1, b0 + 2 + k * 0.5, m + 12, 0.42, 46)
    for bar, beat, semi, dur, vel in HORN:
        s.note(3, bar * 4 + beat, 62 + semi, dur, vel)
    for bar, beat, semi, dur, vel in FLUTE:
        s.note(4, bar * 4 + beat, 62 + semi, dur, vel)
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
    mid = f"{TMP}/lopetus.mid"
    wav = f"{TMP}/lopetus.wav"
    song.write(mid)
    subprocess.run([
        "fluidsynth", "-ni", "-q", "-g", "0.28", "-r", "44100", "-R", "1", "-C", "0",
        "-o", "synth.reverb.room-size=0.62", "-o", "synth.reverb.damp=0.42", "-o", "synth.reverb.level=0.34",
        "-F", wav, SF, mid], check=True)
    last = max(t for t, _, _ in song.ev) / PPQ
    dur = last * 60 / BPM + 2.4
    fade = 3.2
    af = (f"atrim=0:{dur:.3f},asetpts=PTS-STARTPTS,highpass=f=70,"
          f"acompressor=threshold=-18dB:ratio=1.6:attack=30:release=280:makeup=1,"
          f"loudnorm=I=-16:TP=-2.5:LRA=11,alimiter=limit=0.68:level=false,"
          f"afade=t=in:st=0:d=0.8,afade=t=out:st={max(0, dur - fade):.2f}:d={fade}")
    out = f"{TMP}/lopetus_m.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-af", af, "-ar", "44100", "-ac", "2", out], check=True)
    md = float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out]))
    lp, rp = stereo_peak(out)
    print(f"musiikki_lopetus kesto {md:.1f}s  wav-huippu L {lp:.3f} R {rp:.3f}")
    if md < 46 or md > 60:
        raise SystemExit(f"kesto pielessä: {md:.1f}s")
    if max(lp, rp) >= 0.95:
        raise SystemExit(f"klippaus wav: {lp:.3f} {rp:.3f}")
    dst = os.path.join(ROOT, "musiikki_lopetus")
    for ext, a in (("ogg", ["-c:a", "libvorbis", "-q:a", "6"]), ("mp3", ["-c:a", "libmp3lame", "-q:a", "2"])):
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", out, *a, f"{dst}.{ext}"], check=True)
        lp, rp = stereo_peak(f"{dst}.{ext}")
        print(f"  musiikki_lopetus.{ext} L {lp:.3f} R {rp:.3f}")
        if max(lp, rp) >= 0.99:
            raise SystemExit(f"klippaus {ext}")

if __name__ == "__main__":
    main()
