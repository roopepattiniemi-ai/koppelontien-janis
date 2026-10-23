#!/usr/bin/env python3
"""Vitara radio: neljä uutta biisiä kanavaa kohden, kukin noin 40 s (puolet aiemmasta).

Sävellykset ovat fraaseja ja jaksoja (intro, säkeistö, kertosäe / breikki, droppi),
eivät samaa riffiä loputtomiin. Parkano Rock käyttää overdrive-kitaraa (GM 29), ei
särökitaraa. Masterissa on headroom ja limitteri, jotta näyte ei klippaa.
Aja: python3 generoi_radio_v2.py
"""
import numpy as np, subprocess, os, struct, sys
ROOT = os.path.dirname(os.path.abspath(__file__))
SF = "/usr/share/sounds/sf2/FluidR3_GM.sf2"
TMP = "/tmp/radio_v2"
os.makedirs(TMP, exist_ok=True)
PPQ = 480
RNG = np.random.default_rng(1)

def vlq(n):
    b = [n & 0x7f]
    n >>= 7
    while n:
        b.insert(0, (n & 0x7f) | 0x80)
        n >>= 7
    return bytes(b)

class Song:
    def __init__(s, bpm):
        s.bpm = bpm
        s.ev = []
    def prog(s, ch, p, bank=None):
        if bank is not None:
            s.ev.append((0, 0, bytes([0xB0 | ch, 0, bank])))
        s.ev.append((0, 1, bytes([0xC0 | ch, p])))
    def cc(s, ch, c, v):
        s.ev.append((0, 0, bytes([0xB0 | ch, c, max(0, min(127, int(v)))])))
    def note(s, ch, beat, m, dur, vel):
        if m is None or dur <= 0:
            return
        a = int(round(beat * PPQ))
        b = a + max(1, int(round(dur * PPQ)))
        vel = int(np.clip(vel, 1, 108))
        m = int(np.clip(m, 0, 127))
        s.ev.append((a, 3, bytes([0x90 | ch, m, vel])))
        s.ev.append((b, 2, bytes([0x80 | ch, m, 0])))
    def write(s, path):
        tempo = int(60e6 / s.bpm)
        trk = b"\x00\xff\x51\03" + tempo.to_bytes(3, "big")
        last = 0
        for tk, _, e in sorted(s.ev, key=lambda x: (x[0], x[1])):
            trk += vlq(max(0, tk - last)) + e
            last = max(last, tk)
        trk += b"\x00\xff\x2f\x00"
        open(path, "wb").write(b"MThd" + struct.pack(">IHHH", 6, 0, 1, PPQ) + b"MTrk" + struct.pack(">I", len(trk)) + trk)

K, SN, HH, OH, CR, TL, TM, CL = 36, 38, 42, 46, 49, 45, 47, 39

def hum(v, a=3):
    return int(np.clip(round(v) + int(RNG.integers(-a, a + 1)), 1, 104))

def stereo_peak(path):
    raw = subprocess.check_output(
        ["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-acodec", "pcm_f32le", "-ac", "2", "-"],
        stderr=subprocess.DEVNULL)
    x = np.frombuffer(raw, dtype=np.float32)
    x = x[: len(x) // 2 * 2].reshape(-1, 2)
    return float(np.max(np.abs(x[:, 0]))), float(np.max(np.abs(x[:, 1])))

def render(name, song, master_af):
    mid = f"{TMP}/{name}.mid"
    wav = f"{TMP}/{name}.wav"
    song.write(mid)
    subprocess.run([
        "fluidsynth", "-ni", "-q", "-g", "0.30", "-r", "44100", "-R", "1", "-C", "0",
        "-o", "synth.reverb.room-size=0.35", "-o", "synth.reverb.damp=0.55", "-o", "synth.reverb.level=0.22",
        "-F", wav, SF, mid], check=True)
    last = max(t for t, _, _ in song.ev) / PPQ
    dur = last * 60 / song.bpm + 1.2
    fade = 1.5
    af = (f"atrim=0:{dur:.3f},asetpts=PTS-STARTPTS,{master_af},acompressor=threshold=-18dB:ratio=1.5:attack=25:release=250:makeup=1,"
          f"loudnorm=I=-16:TP=-2.5:LRA=11,alimiter=limit=0.68:level=false,"
          f"afade=t=in:st=0:d=0.04,afade=t=out:st={max(0, dur - fade):.2f}:d={fade}")
    out = f"{TMP}/{name}_m.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-af", af, "-ar", "44100", "-ac", "2", out], check=True)
    md = float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out]))
    lp, rp = stereo_peak(out)
    print(f"{name} kesto {md:.1f}s  wav-huippu L {lp:.3f} R {rp:.3f}")
    if md < 36 or md > 46:
        raise SystemExit(f"kesto pielessä {name}: {md:.1f}s (tavoite 38–45)")
    if max(lp, rp) >= 0.95:
        raise SystemExit(f"klippaus wav {name}: {lp:.3f} {rp:.3f}")
    enc(out, os.path.join(ROOT, name))

def enc(src, dst):
    for ext, a in (("ogg", ["-c:a", "libvorbis", "-q:a", "6"]), ("mp3", ["-c:a", "libmp3lame", "-q:a", "2"])):
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, *a, f"{dst}.{ext}"], check=True)
        o = subprocess.check_output(
            ["ffmpeg", "-i", f"{dst}.{ext}", "-af", "volumedetect", "-f", "null", "-"],
            stderr=subprocess.STDOUT, text=True)
        peak = max(float(ln.split(":")[1].replace("dB", "").strip()) for ln in o.splitlines() if "max_volume" in ln)
        lp, rp = stereo_peak(f"{dst}.{ext}")
        print(f"  {os.path.basename(dst)}.{ext} {peak:.2f} dB  L {lp:.3f} R {rp:.3f}")
        if peak > -1.0 or max(lp, rp) >= 0.99:
            raise SystemExit(f"klippaus {dst}.{ext}: {peak:.2f} dB")

def lay(parts):
    out = []
    for name, n, prog in parts:
        for i in range(n):
            off, q = prog[i % len(prog)]
            out.append({"name": name, "off": off, "q": q, "i": i, "n": n})
    return out

def lead_on(s, ch, b0, bar, phrase, key, scale):
    if not phrase or scale <= 0 or bar["i"] >= bar["n"] - 0 and bar["name"] == "end":
        return
    notes, span = phrase
    local = (bar["i"] % span) * 4
    for beat, semi, dur, vel in notes:
        if local <= beat < local + 4:
            s.note(ch, b0 + (beat - local), key + semi, dur, hum(vel * scale, 2))

def third(q):
    return 3 if q == "min" else 4

# ---------- rummut ja basso ----------
def rock_drums(s, b0, name, scale, last):
    v = scale * (0.85 if name == "intro" else 1)
    if name != "intro":
        for e in range(8):
            s.note(9, b0 + e / 2, HH, 0.28, hum(64 if e % 2 == 0 else 48, 2) * (0.7 + 0.3 * v) / 1)
    else:
        for q in range(4):
            s.note(9, b0 + q, HH, 0.3, hum(50 * v))
    kicks = (0, 2) if name in ("intro", "break") else ((0, 2.5, 2) if name == "chorus" else (0, 2))
    if name == "drive":
        kicks = (0, 1.5, 2, 2.75)
    for kt in kicks:
        s.note(9, b0 + kt, K, 0.28, hum(96 * v, 2))
    if name not in ("intro", "break"):
        s.note(9, b0 + 1, SN, 0.25, hum(90 * v, 2))
        s.note(9, b0 + 3, SN, 0.25, hum(88 * v, 2))
        if name == "verse":
            s.note(9, b0 + 1.75, SN, 0.08, hum(36))
            s.note(9, b0 + 3.75, SN, 0.08, hum(32))
    if last and name in ("verse", "chorus", "drive"):
        for k in range(6):
            s.note(9, b0 + 3 + k / 8, SN if k % 2 == 0 else TL, 0.1, hum(70 + k * 4))

def bass_line(s, ch, b0, root, nxt, scale, kind):
    b = root - 12
    nb = nxt - 12
    if kind == "hold":
        s.note(ch, b0, b, 3.6, hum(82 * scale, 2))
        return
    s.note(ch, b0 + 0.0, b, 0.8, hum(88 * scale, 2))
    s.note(ch, b0 + 1.5, b + 7, 0.35, hum(70 * scale, 2))
    s.note(ch, b0 + 2.0, b, 0.7, hum(82 * scale, 2))
    approach = b if nb == b else (nb - 1 if abs(nb - b) <= 5 else nb - 2)
    s.note(ch, b0 + 3.5, approach, 0.35, hum(68 * scale, 2))

def gtr_mute(s, ch, b0, root, scale):
    for e in range(8):
        vel = 68 if e % 2 == 0 else 50
        s.note(ch, b0 + e / 2, root, 0.2, hum(vel * scale, 2))
        if e % 2 == 0:
            s.note(ch, b0 + e / 2, root + 7, 0.18, hum((vel - 10) * scale, 2))

def gtr_power(s, ch, b0, root, scale):
    tones = (root, root + 7, root + 12)
    for i, m in enumerate(tones):
        s.note(ch, b0 + i * 0.015, m, 1.25, hum(70 * scale, 2))
    for i, m in enumerate(tones[:2]):
        s.note(ch, b0 + 1.5 + i * 0.012, m, 0.28, hum(58 * scale))
    for i, m in enumerate(tones):
        s.note(ch, b0 + 2.0 + i * 0.015, m, 1.05, hum(66 * scale, 2))
    s.note(ch, b0 + 3.5, root + 12, 0.28, hum(60 * scale))

def gtr_arp(s, ch, b0, root, q, scale):
    t = third(q)
    seq = [root, root + t, root + 7, root + 12, root + 7, root + t, root + 12, root + 7]
    for e, m in enumerate(seq):
        s.note(ch, b0 + e / 2, m + 12, 0.42, hum((62 if e % 2 == 0 else 50) * scale, 2))

def gtr_chick(s, ch, b0, root, q, scale, train=False):
    t = third(q)
    chord = [root + 12, root + 12 + t, root + 12 + 7]
    s.note(ch, b0, root, 0.35, hum(66 * scale))
    s.note(ch, b0 + 2, root + 7 if not train else root, 0.3, hum(60 * scale))
    for beat in ((1, 3) if not train else (1, 1.5, 2.5, 3, 3.5)):
        for i, m in enumerate(chord):
            s.note(ch, b0 + beat + i * 0.008, m, 0.28, hum(64 * scale))

def country_drums(s, b0, scale, train=False, sparse=False):
    s.note(9, b0, K, 0.3, hum(78 * scale, 2))
    s.note(9, b0 + 2, K, 0.3, hum(72 * scale, 2))
    if train:
        for e in range(8):
            s.note(9, b0 + e / 2, SN, 0.12, hum(42 if e % 2 else 58, 2))
            s.note(9, b0 + e / 2 + 0.25, HH, 0.12, hum(40))
    elif sparse:
        s.note(9, b0 + 1, CL, 0.2, hum(58 * scale))
        s.note(9, b0 + 3, CL, 0.2, hum(54 * scale))
        s.note(9, b0 + 1.5, HH, 0.2, hum(40))
        s.note(9, b0 + 3.5, HH, 0.2, hum(38))
    else:
        s.note(9, b0 + 1, SN, 0.2, hum(62 * scale))
        s.note(9, b0 + 3, SN, 0.2, hum(58 * scale))
        for e in range(8):
            s.note(9, b0 + e / 2, HH, 0.2, hum(48 if e % 2 == 0 else 36))

def banjo_roll(s, b0, root, scale):
    roll = (0, 4, 7, 4, 7, 12, 7, 4)
    for e, iv in enumerate(roll):
        s.note(1, b0 + e / 2, root + 12 + iv, 0.36, hum(60 * scale, 2))

def tekno_drums(s, b0, name, scale, last):
    br = name == "break"
    if not br:
        for q in range(4):
            s.note(9, b0 + q, K, 0.3, hum(98 * scale, 1))
        if name != "intro":
            s.note(9, b0 + 1, CL, 0.2, hum(80 * scale))
            s.note(9, b0 + 3, CL, 0.2, hum(78 * scale))
    for e in range(8):
        open_hat = (not br) and e % 2 == 1
        s.note(9, b0 + e / 2, OH if open_hat else HH, 0.22, hum((58 if open_hat else 46) * (0.55 if br else scale)))
    if br and last:
        for k in range(8):
            s.note(9, b0 + 3 + k / 8, SN, 0.08, hum(40 + k * 6))

def bass16(s, b0, key, pat, scale):
    for i, iv in enumerate(pat):
        if iv is None:
            continue
        s.note(0, b0 + i / 4, key - 12 + iv, 0.18, hum((84 if i % 4 == 0 else 70) * scale, 2))

def pad(s, b0, root, q, scale, beats=7.6):
    t = third(q)
    for iv in (0, t, 7):
        s.note(1, b0, root + 12 + iv, beats, hum(44 * scale, 1))

def arp_lead(s, b0, root, q, scale, busy=True):
    t = third(q)
    if busy:
        seq = (0, t, 7, 12, 7, t)
        for i, iv in enumerate(seq):
            s.note(2, b0 + i * 4 / 6, root + 12 + iv, 0.4, hum(66 * scale, 2))
    else:
        for beat, iv in ((0, 0), (1.5, 7), (2.5, 12), (3.5, t)):
            s.note(2, b0 + beat, root + 24 + iv, 0.4, hum(70 * scale))

# Fraasit: (alku tahdin sisällä 2 tahdin fraasissa, puolisävel sävellajista, kesto, velociteetti), span tahteina.
P_ANTHEM_V = ([(0, 0, 1.6, 66), (2, 4, 0.8, 64), (3, 7, 0.8, 68),
               (4, 5, 1.2, 64), (5.5, 4, 0.4, 58), (6, 2, 1.6, 62)], 2)
P_ANTHEM_C = ([(0, 12, 0.85, 78), (1, 14, 0.85, 74), (2, 16, 0.85, 80), (3, 19, 0.85, 82),
               (4, 17, 0.8, 76), (5, 16, 0.4, 70), (5.5, 14, 0.4, 68), (6, 12, 1.7, 76)], 2)
P_MINOR_V = ([(0, 12, 2.4, 64), (3, 15, 0.8, 66), (4, 12, 1.2, 62), (5.5, 10, 0.4, 58), (6, 8, 1.6, 64)], 2)
P_MINOR_C = ([(0, 15, 1.2, 74), (1.5, 12, 0.4, 66), (2, 10, 1.0, 72), (3, 12, 0.8, 70),
              (4, 19, 1.4, 78), (5.5, 15, 0.4, 68), (6, 12, 1.8, 74)], 2)
P_DRIVE_C = ([(0, 12, 0.4, 78), (0.5, 12, 0.35, 70), (1, 16, 0.4, 80), (1.5, 14, 0.3, 68),
              (2, 12, 0.4, 76), (2.5, 19, 0.4, 82), (3, 16, 0.3, 72), (3.5, 14, 0.4, 74),
              (4, 12, 0.8, 78), (5, 14, 0.4, 70), (5.5, 16, 0.4, 74), (6, 19, 0.8, 80), (7, 16, 0.8, 76)], 2)
P_BALLAD = ([(0, 7, 1.4, 70), (1.5, 11, 0.45, 64), (2, 12, 1.4, 76), (3.5, 14, 0.4, 66),
             (4, 16, 0.9, 78), (5, 14, 0.9, 72), (6, 12, 1.8, 74)], 2)

C_STEP_V = ([(0, 12, 1.4, 72), (1.5, 14, 0.4, 64), (2, 16, 0.9, 76), (3, 14, 0.8, 68),
             (4, 12, 0.9, 72), (5, 11, 0.4, 62), (5.5, 12, 0.4, 64), (6, 7, 1.8, 70)], 2)
C_STEP_C = ([(0, 16, 0.9, 78), (1, 19, 0.9, 80), (2, 16, 0.5, 72), (2.5, 14, 0.4, 68), (3, 12, 0.8, 74),
             (4, 14, 0.9, 76), (5, 16, 0.9, 78), (6, 19, 0.5, 74), (6.5, 16, 0.4, 70), (7, 12, 0.9, 76)], 2)
C_SLOW = ([(0, 12, 3.2, 74), (4, 16, 1.4, 76), (5.5, 14, 0.4, 66), (6, 12, 1.8, 72)], 2)
C_TRAIN = ([(0, 12, 0.45, 76), (0.5, 16, 0.4, 74), (1, 19, 0.45, 80), (1.5, 16, 0.35, 68),
            (2, 14, 0.8, 74), (3, 12, 0.8, 70),
            (4, 16, 0.4, 78), (4.5, 19, 0.4, 80), (5, 21, 0.9, 82), (6, 19, 0.4, 72), (6.5, 16, 0.4, 68), (7, 12, 0.9, 76)], 2)
C_SWEET = ([(0, 16, 0.9, 74), (1, 14, 0.4, 66), (1.5, 12, 0.4, 64), (2, 11, 0.9, 70), (3, 12, 0.8, 72),
            (4, 7, 1.3, 70), (5.5, 9, 0.4, 64), (6, 11, 0.9, 72), (7, 12, 0.9, 74)], 2)

BASS_A = [0, None, 0, 0, 7, None, 0, 3, 0, None, 0, 10, 0, 7, None, 3]
BASS_B = [0, None, 12, 0, 7, None, 3, 0, 0, None, 0, 7, 10, 7, 3, 0]
BASS_OFF = [0, None, None, 0, None, 3, 0, None, 7, None, None, 0, None, 10, 7, 0]
BASS_SPARSE = [0, None, 0, None, 7, None, None, 0, 0, None, 3, None, 7, None, 10, 0]
BASS_OCT = [0, 0, 12, 0, 0, 7, 0, 12, 0, 0, 10, 0, 7, 0, 3, 0]

def scale_of(name):
    return {"intro": 0.78, "verse": 0.9, "chorus": 1.0, "break": 0.62, "groove": 0.9, "drop": 1.0, "drive": 1.0}.get(name, 0.9)

def setup(s, kind):
    if kind == "rock":
        s.prog(0, 29)   # overdrive, ei GM 30 Distortion
        s.prog(1, 27)   # puhdas
        s.prog(2, 34)   # plektra-basso
        s.prog(3, 27)   # soolo puhtaalla, ei toista säröä
        s.prog(9, 0)
        s.cc(0, 10, 42); s.cc(1, 10, 90); s.cc(2, 10, 64); s.cc(3, 10, 72)
        s.cc(0, 91, 16); s.cc(1, 91, 28); s.cc(3, 91, 32); s.cc(2, 91, 8); s.cc(9, 91, 10)
        s.cc(0, 7, 96); s.cc(1, 7, 88); s.cc(2, 7, 104); s.cc(3, 7, 92)
    elif kind == "country":
        s.prog(0, 25); s.prog(1, 105); s.prog(2, 33); s.prog(3, 40); s.prog(9, 0)
        s.cc(0, 10, 46); s.cc(1, 10, 96); s.cc(2, 10, 64); s.cc(3, 10, 74)
        s.cc(0, 91, 20); s.cc(1, 91, 14); s.cc(3, 91, 36); s.cc(2, 91, 8); s.cc(9, 91, 8)
        s.cc(0, 7, 96); s.cc(1, 7, 78); s.cc(2, 7, 104); s.cc(3, 7, 90)
    else:
        s.prog(0, 38); s.prog(1, 89); s.prog(2, 80); s.prog(9, 25)  # TR-808, FluidR3 rumpupresetti 25
        s.cc(0, 10, 64); s.cc(1, 10, 64); s.cc(2, 10, 78)
        s.cc(0, 91, 8); s.cc(1, 91, 40); s.cc(2, 91, 22); s.cc(9, 91, 6)
        s.cc(0, 7, 108); s.cc(1, 7, 78); s.cc(2, 7, 84)

def play_rock(s, bars, key, mode):
    for i, bar in enumerate(bars):
        b0 = i * 4
        root = key + bar["off"]
        nxt = key + bars[(i + 1) % len(bars)]["off"]
        name = bar["name"]
        sc = scale_of(name)
        last = i + 1 == len(bars) or bars[i + 1]["name"] != name
        first = i == 0 or bars[i - 1]["name"] != name
        rock_drums(s, b0, "drive" if mode == "drive" and name == "verse" else name, sc, last)
        if name == "break":
            bass_line(s, 2, b0, root, nxt, sc * 0.8, "hold")
            gtr_arp(s, 1, b0, root, bar["q"], sc)
            continue
        if first and name in ("chorus", "verse") and name != "intro":
            s.note(9, b0, CR, 1.0, hum(78 * sc))
        kind_b = "hold" if name == "intro" and mode == "ballad" else "walk"
        if not (mode == "minor" and name == "intro"):
            bass_line(s, 2, b0, root, nxt, sc, "walk" if kind_b == "walk" else "hold")
        if mode == "anthem":
            if name in ("intro", "verse"):
                gtr_mute(s, 0, b0, root, sc)
            else:
                gtr_power(s, 0, b0, root, sc * 0.92)
            if name == "verse" and i < len(bars) - 1:
                lead_on(s, 3, b0, bar, P_ANTHEM_V, key, sc)
            if name == "chorus" and i < len(bars) - 1:
                lead_on(s, 3, b0, bar, P_ANTHEM_C, key, sc)
        elif mode == "minor":
            gtr_arp(s, 1, b0, root, bar["q"], sc)
            if name != "intro":
                s.note(0, b0, root, 3.6, hum(48 * sc))
                s.note(0, b0, root + 7, 3.6, hum(42 * sc))
            if name == "verse" and i < len(bars) - 1:
                lead_on(s, 3, b0, bar, P_MINOR_V, key, sc)
            if name == "chorus" and i < len(bars) - 1:
                lead_on(s, 3, b0, bar, P_MINOR_C, key, sc)
        elif mode == "drive":
            # yhden tahdin riffi, vastaus kertosäkeessä
            riff = (0, 0, 7, 5, 7, 12, 10, 7)
            for e, iv in enumerate(riff):
                s.note(0, b0 + e / 2, root + iv, 0.32, hum((72 if e % 2 == 0 else 58) * sc, 2))
            if name == "chorus":
                gtr_power(s, 1, b0, root, sc * 0.55)
                if i < len(bars) - 1:
                    lead_on(s, 3, b0, bar, P_DRIVE_C, key, sc)
        else:  # ballad
            gtr_chick(s, 1, b0, root, bar["q"], sc * 0.85, train=False)
            if name == "chorus":
                gtr_power(s, 0, b0, root, sc * 0.7)
            if name in ("verse", "chorus") and i < len(bars) - 1:
                lead_on(s, 3, b0, bar, P_BALLAD, key, sc * (1 if name == "chorus" else 0.85))

def play_country(s, bars, key, mode):
    sparse = mode == "slow"
    train = mode == "train"
    for i, bar in enumerate(bars):
        b0 = i * 4
        root = key + bar["off"]
        nxt = key + bars[(i + 1) % len(bars)]["off"]
        name = bar["name"]
        sc = scale_of(name) * (0.9 if sparse else 1)
        country_drums(s, b0, sc, train=train and name != "intro", sparse=sparse or name == "intro")
        bass_line(s, 2, b0, root, nxt, sc, "hold" if name == "intro" and sparse else "walk")
        if name != "break":
            gtr_chick(s, 0, b0, root, bar["q"], sc, train=train and name == "chorus")
        phrase = {"two": (C_STEP_V, C_STEP_C), "slow": (C_SLOW, C_SLOW),
                  "train": (C_TRAIN, C_TRAIN), "sweet": (C_SWEET, C_SWEET)}[mode]
        if name == "verse" and i < len(bars) - 1:
            lead_on(s, 3, b0, bar, phrase[0], key, sc)
        if name == "chorus" and i < len(bars) - 1:
            lead_on(s, 3, b0, bar, phrase[1], key, sc)
            if mode != "slow" and bar["i"] % 2 == 0:
                banjo_roll(s, b0, root, sc * 0.85)

def play_tekno(s, bars, key, mode):
    pats = {"pump": (BASS_A, BASS_B), "circle": (BASS_OFF, BASS_OFF),
            "bark": (BASS_SPARSE, BASS_A), "mitts": (BASS_OCT, BASS_B)}[mode]
    for i, bar in enumerate(bars):
        b0 = i * 4
        root = key + bar["off"]
        name = bar["name"]
        sc = scale_of(name)
        last = i + 1 == len(bars) or bars[i + 1]["name"] != name
        tekno_drums(s, b0, name, sc, last)
        if name == "drop" and bar["i"] == 0:
            s.note(9, b0, CR, 1.4, hum(86))
        if name not in ("break",) and not (name == "intro" and bar["i"] < 2):
            pat = pats[0 if (bar["i"] // 2) % 2 == 0 else 1]
            # Duurisoinnussa pieni terssi on rinnakkainen duuriterssi, ettei basso riitele kompin kanssa.
            shifted = []
            for n in pat:
                if n is None:
                    shifted.append(None)
                    continue
                if bar["q"] != "min" and n % 12 == 3:
                    n += 1
                shifted.append(n + bar["off"])
            bass16(s, b0, key, shifted, sc * (0.85 if name == "intro" else 1))
        if name in ("groove", "drop", "intro", "break"):
            pad(s, b0, root, bar["q"], sc * (0.65 if name == "intro" else 1), beats=3.6)
        if name == "drop":
            arp_lead(s, b0, root, bar["q"], sc, busy=(mode != "mitts"))

def finish(s, bars, key, ch_lead, kind):
    end = len(bars) * 4
    root = key + bars[-1]["off"]
    q = bars[-1]["q"]
    t = third(q)
    tones = [root, root + t, root + 7, root + 12]
    if kind == "rock":
        for i, m in enumerate(tones[:3]):
            s.note(0, end + i * 0.02, m, 2.0, hum(64))
        s.note(2, end, root - 12, 2.0, hum(80))
        s.note(ch_lead, end, root + 12, 2.0, hum(66))
    elif kind == "country":
        for m in tones[:3]:
            s.note(0, end, m + 12, 2.2, hum(62))
        s.note(2, end, root - 12, 2.2, hum(78))
        s.note(3, end, root + 12, 2.2, hum(70))
    else:
        for iv in (0, t, 7):
            s.note(1, end, root + 12 + iv, 2.0, hum(48))
        s.note(0, end, root - 12, 1.2, hum(80))
    s.note(9, end, CR, 1.6, hum(82))

EQ = {
    "rock": "highpass=f=38,equalizer=f=220:t=q:w=1.1:g=-2.5,equalizer=f=3200:t=q:w=1:g=1.2",
    "country": "highpass=f=42,equalizer=f=240:t=q:w=1:g=-1.5,equalizer=f=5000:t=q:w=1:g=1.0",
    "tekno": "highpass=f=28,equalizer=f=70:t=q:w=1:g=1.6,equalizer=f=320:t=q:w=1:g=-2.5,equalizer=f=8000:t=h:w=1:g=0.8",
}

def build(spec):
    global RNG
    RNG = np.random.default_rng(spec["seed"])
    bars = lay(spec["parts"])
    s = Song(spec["bpm"])
    setup(s, spec["kind"])
    if spec["kind"] == "rock":
        play_rock(s, bars, spec["key"], spec["mode"])
        finish(s, bars, spec["key"], 3, "rock")
    elif spec["kind"] == "country":
        play_country(s, bars, spec["key"], spec["mode"])
        finish(s, bars, spec["key"], 3, "country")
    else:
        play_tekno(s, bars, spec["key"], spec["mode"])
        finish(s, bars, spec["key"], 2, "tekno")
    render(spec["name"], s, EQ[spec["kind"]])

# Sointu = (puolisävelaskel sävellajista, laatu). Kestot on laskettu niin, että
# tahtimäärä * 240 / bpm on noin 40 s ennen lyhyttä loppusoinnun häntää.
E, A, D, G = 52, 57, 50, 55
AM, DM, EM, FM = 57, 50, 52, 53

V_E = [(0, "maj"), (0, "maj"), (-2, "maj"), (5, "maj")]          # E E D A
C_E = [(5, "maj"), (0, "maj"), (7, "maj"), (0, "maj")]          # A E B E
AEOL = [(0, "min"), (-4, "maj"), (3, "maj"), (-2, "maj")]       # i VI III bVII
I_IV_V = [(0, "maj"), (5, "maj"), (7, "maj"), (5, "maj")]
I_vi_IV_V = [(0, "maj"), (9, "min"), (5, "maj"), (7, "maj")]
I_IV_I_V = [(0, "maj"), (5, "maj"), (0, "maj"), (7, "maj")]
I_V_vi_IV = [(0, "maj"), (7, "maj"), (9, "min"), (5, "maj")]
I_I_IV_V = [(0, "maj"), (0, "maj"), (5, "maj"), (7, "maj")]
I_vi_ii_V = [(0, "maj"), (9, "min"), (2, "min"), (7, "maj")]
EM_C_AM_D = [(0, "min"), (-4, "maj"), (5, "min"), (-2, "maj")]
FM_LOOP = [(0, "min"), (5, "maj"), (3, "maj"), (-2, "maj")]

SONGS = [
    # Parkano Rock
    dict(name="radio_parkano_1", kind="rock", mode="anthem", key=E, bpm=118, seed=11,
         parts=[("intro", 4, V_E), ("verse", 8, V_E), ("chorus", 8, C_E)]),
    dict(name="radio_parkano_2", kind="rock", mode="minor", key=A, bpm=96, seed=12,
         parts=[("intro", 4, AEOL), ("verse", 4, AEOL), ("chorus", 8, AEOL)]),
    dict(name="radio_parkano_3", kind="rock", mode="drive", key=D, bpm=132, seed=13,
         parts=[("intro", 4, I_IV_V), ("verse", 8, I_IV_V), ("break", 2, [(0, "maj")]), ("chorus", 8, I_IV_V)]),
    dict(name="radio_parkano_4", kind="rock", mode="ballad", key=G, bpm=108, seed=14,
         parts=[("intro", 4, I_vi_IV_V), ("verse", 6, I_vi_IV_V), ("chorus", 8, I_vi_IV_V)]),
    # Jalasjärven Kantri
    dict(name="radio_country_1", kind="country", mode="two", key=G, bpm=100, seed=21,
         parts=[("intro", 4, I_IV_I_V), ("verse", 4, I_IV_I_V), ("chorus", 8, I_IV_I_V)]),
    dict(name="radio_country_2", kind="country", mode="slow", key=D, bpm=84, seed=22,
         parts=[("intro", 2, I_V_vi_IV), ("verse", 4, I_V_vi_IV), ("chorus", 8, I_V_vi_IV)]),
    dict(name="radio_country_3", kind="country", mode="train", key=48, bpm=108, seed=23,
         parts=[("intro", 4, I_I_IV_V), ("verse", 6, I_I_IV_V), ("chorus", 8, I_I_IV_V)]),
    dict(name="radio_country_4", kind="country", mode="sweet", key=A, bpm=92, seed=24,
         parts=[("intro", 4, I_vi_ii_V), ("verse", 4, I_vi_ii_V), ("chorus", 8, I_vi_ii_V)]),
    # Koppelontien Tekno
    dict(name="radio_tekno_1", kind="tekno", mode="pump", key=AM, bpm=126, seed=31,
         parts=[("intro", 4, AEOL), ("groove", 8, AEOL), ("drop", 8, AEOL)]),
    dict(name="radio_tekno_2", kind="tekno", mode="circle", key=DM, bpm=128, seed=32,
         parts=[("intro", 4, AEOL), ("groove", 8, AEOL), ("break", 4, AEOL), ("drop", 6, AEOL)]),
    dict(name="radio_tekno_3", kind="tekno", mode="bark", key=EM, bpm=120, seed=33,
         parts=[("intro", 4, EM_C_AM_D), ("groove", 6, EM_C_AM_D), ("break", 4, EM_C_AM_D), ("drop", 6, EM_C_AM_D)]),
    dict(name="radio_tekno_4", kind="tekno", mode="mitts", key=FM, bpm=130, seed=34,
         parts=[("intro", 4, FM_LOOP), ("groove", 6, FM_LOOP), ("break", 4, FM_LOOP), ("drop", 8, FM_LOOP)]),
]

if __name__ == "__main__":
    want = sys.argv[1:]
    for spec in SONGS:
        if want and spec["name"] not in want and not any(w in spec["name"] for w in want):
            continue
        nb = sum(n for _, n, _ in spec["parts"])
        print(f"-- {spec['name']}  {nb} tahtia @ {spec['bpm']}  ~{nb * 240 / spec['bpm']:.1f}s")
        build(spec)
    print("biisit ok")
