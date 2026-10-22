#!/usr/bin/env python3
"""Vitaran radio v2 (v0.9): MIDI-sovitukset (python) -> FluidSynth + FluidR3_GM -> ffmpeg-miksaus/masterointi.
Rummut, basso, komppi (kitarat/syntikat) ja melodia. 60-90 s. Aja: python3 generoi_radio_v2.py"""
import numpy as np, subprocess, os, struct
D = os.path.dirname(os.path.abspath(__file__)); SF = "/usr/share/sounds/sf2/FluidR3_GM.sf2"; TMP = "/tmp/radio_v2"; os.makedirs(TMP, exist_ok=True)
PPQ = 480
def vlq(n):
    b = [n & 0x7f]; n >>= 7
    while n: b.insert(0, (n & 0x7f) | 0x80); n >>= 7
    return bytes(b)
class Song:
    def __init__(s, bpm): s.bpm = bpm; s.ev = []  # (tick, order, bytes)
    def prog(s, ch, p, bank=None):
        if bank is not None: s.ev.append((0, 0, bytes([0xB0|ch, 0, bank])))
        s.ev.append((0, 1, bytes([0xC0|ch, p])))
    def cc(s, ch, c, v): s.ev.append((0, 0, bytes([0xB0|ch, c, v])))
    def note(s, ch, beat, m, dur, vel):
        a = int(beat*PPQ); b = a + max(1, int(dur*PPQ)); vel = int(np.clip(vel, 1, 127))
        s.ev.append((a, 3, bytes([0x90|ch, m, vel]))); s.ev.append((b, 2, bytes([0x80|ch, m, 0])))
    def write(s, path):
        tempo = int(60e6/s.bpm); trk = b"\x00\xff\x51\x03" + tempo.to_bytes(3, "big"); last = 0
        for tk, _, e in sorted(s.ev, key=lambda x: (x[0], x[1])): trk += vlq(tk - last) + e; last = tk
        trk += b"\x00\xff\x2f\x00"
        open(path, "wb").write(b"MThd" + struct.pack(">IHHH", 6, 0, 1, PPQ) + b"MTrk" + struct.pack(">I", len(trk)) + trk)
K, SN, HH, OH, CR, RD, TL, TM, CL, TB = 36, 38, 42, 46, 49, 51, 45, 48, 39, 54
def hum(r, v, a=8): return v + r.integers(-a, a+1)
def chord(root, minor=False, sev=False): return [root, root + (3 if minor else 4), root + 7] + ([root + 10] if sev else [])

def render(name, song, master_af):
    mid = f"{TMP}/{name}.mid"; wav = f"{TMP}/{name}.wav"; song.write(mid)
    subprocess.run(["fluidsynth", "-ni", "-q", "-g", "0.5", "-r", "44100", "-R", "1", "-C", "1", "-F", wav, SF, mid], check=True)
    dur = float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",wav]))
    af = (f"{master_af},acompressor=threshold=-18dB:ratio=3:attack=15:release=200:makeup=2,"
          f"loudnorm=I=-14:TP=-1.5:LRA=9,alimiter=limit=0.85:level=false,afade=t=out:st={dur-3:.2f}:d=3")
    out = f"{TMP}/{name}_m.wav"
    subprocess.run(["ffmpeg","-y","-loglevel","error","-i",wav,"-af",af,"-ar","44100","-ac","2",out], check=True)
    enc(out, os.path.join(D, name))
def enc(src, dst):
    for ext, a in (("ogg", ["-c:a","libvorbis","-q:a","4"]), ("mp3", ["-c:a","libmp3lame","-b:a","160k"])):
        subprocess.run(["ffmpeg","-y","-loglevel","error","-i",src,*a,f"{dst}.{ext}"], check=True)

def bars_for(bpm, sec=76): return int(round(sec/(240/bpm)/4))*4

def rock(name, key, bpm, prog, mel_scale, seed):
    r = np.random.default_rng(seed); s = Song(bpm); nb = bars_for(bpm)
    s.prog(0, 30); s.prog(1, 29); s.prog(2, 34); s.prog(3, 30); s.prog(9, 0)  # dist-kitara L, overdrive R, basso, soolo
    s.cc(0, 10, 25); s.cc(1, 10, 103); s.cc(3, 10, 64); s.cc(3, 91, 60); s.cc(0, 91, 30); s.cc(1, 91, 30); s.cc(9, 91, 25)
    for bar in range(nb):
        b0 = bar*4; root = key + prog[bar % len(prog)]; sec = (bar // 8) % 4; intro = bar < 4; outro = bar >= nb - 2
        # rummut
        if bar % 8 == 0: s.note(9, b0, CR, .5, 110)
        for e in range(8):
            bt = b0 + e/2
            if not intro or bar >= 2: s.note(9, bt, RD if sec == 2 else HH, .25, hum(r, 85 if e % 2 == 0 else 65))
            if e in (0, 3, 5) and not (intro and bar < 2): s.note(9, bt, K, .25, hum(r, 110))
            if e in (2, 6) and not (intro and bar < 2): s.note(9, bt, SN, .25, hum(r, 112))
        if bar % 8 == 7:
            for i, d in enumerate([SN, SN, TM, TL]): s.note(9, b0 + 3 + i/4, d, .2, 100 + i*5)
        # kitarat: power chord -tsugat, kertsissä (sec 1,3) avoimet soinnut
        pc = [root, root + 7, root + 12]
        if sec in (1, 3):
            for ch, off in ((0, 0), (1, .02)):
                for m in pc: s.note(ch, b0 + off, m, 1.9, 95); s.note(ch, b0 + 2 + off, m, 1.9, 90)
        else:
            for e in range(8):
                for ch, off in ((0, 0), (1, .015)):
                    for m in pc[:2]: s.note(ch, b0 + e/2 + off, m, .35, hum(r, 92 if e % 2 == 0 else 78, 5))
        # basso kahdeksasosat
        for e in range(8): s.note(2, b0 + e/2, root - 12 + (12 if e == 7 and bar % 2 else 0), .45, hum(r, 100, 6))
        # melodia/soolo (kertsi ja C-osa)
        if sec in (1, 2, 3) and not outro:
            pos = 0
            while pos < 4:
                d = r.choice([.5, .5, 1, 1, 1.5]) if sec != 2 else r.choice([.25, .5, .5])
                m = root + 24 + mel_scale[r.integers(0, len(mel_scale))]
                if r.random() > .15: s.note(3, b0 + pos, m, d*.95, hum(r, 100))
                pos += d
    s.note(9, nb*4, CR, 2, 115); [s.note(c, nb*4, m, 3, 100) for c in (0, 1) for m in (key, key+7, key+12)]; s.note(2, nb*4, key-12, 3, 100)
    render(name, s, "highpass=f=35,equalizer=f=250:t=q:w=1:g=-2,equalizer=f=3000:t=q:w=1:g=2,equalizer=f=9000:t=h:w=1:g=1.5")

def country(name, key, bpm, prog, seed):
    r = np.random.default_rng(seed); s = Song(bpm); nb = bars_for(bpm)
    s.prog(0, 25); s.prog(1, 105); s.prog(2, 33); s.prog(3, 40); s.prog(4, 27); s.prog(9, 0)  # akustinen, banjo, basso, viulu, clean-kitara
    s.cc(0, 10, 40); s.cc(1, 10, 95); s.cc(3, 10, 70); s.cc(4, 10, 20); s.cc(3, 91, 55); s.cc(4, 91, 45)
    scale = [0, 2, 4, 7, 9, 12]; roll = [0, 7, 12, 4, 7, 12, 0, 16]
    for bar in range(nb):
        b0 = bar*4; root = key + prog[bar % len(prog)]; sec = (bar // 8) % 4; ch3 = chord(root)
        for q in range(4):
            s.note(9, b0 + q, K if q % 2 == 0 else SN, .25, hum(r, 80 if q % 2 == 0 else 62))
            s.note(9, b0 + q + .5, HH, .2, hum(r, 45)); s.note(9, b0 + q, HH, .2, hum(r, 55))
            s.note(2, b0 + q, root - 12 + (0 if q % 2 == 0 else 7), .8, hum(r, 100, 5))   # boom-chak
            if q % 2: [s.note(0, b0 + q + i*.012, m, .45, hum(r, 72, 4)) for i, m in enumerate(ch3)]
        if bar >= 4 and sec != 1:
            for e in range(8): s.note(1, b0 + e/2, root + 12 + roll[e], .5, hum(r, 70 if e % 2 else 82, 4))
        if sec in (1, 3) and bar < nb - 2:  # viulumelodia
            pos = 0
            while pos < 4:
                d = r.choice([.5, 1, 1, 2]); d = min(d, 4 - pos)
                s.note(3, b0 + pos, root + 12 + scale[r.integers(0, len(scale))], d*.95, hum(r, 92)); pos += d
        if sec == 2 and bar % 2 == 0:  # clean-kitaran kanttifillit
            for i, iv in enumerate([12, 14, 16, 19, 16, 14]): s.note(4, b0 + 2 + i/3, root + iv, .3, hum(r, 85))
    [s.note(c, nb*4, m, 3, 90) for c in (0, 3) for m in chord(key + 12)]; s.note(2, nb*4, key - 12, 3, 100)
    render(name, s, "highpass=f=40,equalizer=f=300:t=q:w=1:g=-1.5,equalizer=f=5000:t=q:w=1:g=2")

def tekno(name, key, bpm, pat, seed):
    r = np.random.default_rng(seed); s = Song(bpm); nb = bars_for(bpm, 80)
    s.prog(0, 38); s.prog(1, 81); s.prog(2, 89); s.prog(3, 80); s.prog(9, 25, bank=None)  # synabasso, saw-lead, pad, square-arp, TR-808-kitti
    s.ev.append((0, 0, bytes([0xB9, 0, 128]))); s.cc(1, 91, 70); s.cc(2, 91, 90); s.cc(3, 10, 30); s.cc(1, 10, 90); s.cc(3, 93, 60)
    for bar in range(nb):
        b0 = bar*4; sec = (bar // 8) % 4; brk = sec == 2 and bar % 8 < 4
        for q in range(4):
            if not brk: s.note(9, b0 + q, K, .25, hum(r, 118, 3))
            s.note(9, b0 + q + .5, OH, .25, hum(r, 70)); s.note(9, b0 + q + .25, HH, .1, hum(r, 45)); s.note(9, b0 + q + .75, HH, .1, hum(r, 50))
            if q % 2 and bar >= 4: s.note(9, b0 + q, CL, .2, hum(r, 85))
        for i, m in enumerate(pat):  # acid-basso 16-osat
            if m is not None and bar >= 2: s.note(0, b0 + i/4, key + m, .22, hum(r, 100 if i % 4 == 0 else 85, 6))
        if bar % 4 == 0: [s.note(2, b0, key + 24 + iv, 15.8, 60) for iv in (0, 3, 7, 10)]
        if sec in (1, 3) and bar < nb - 2:
            for st in (0.5, 1.5, 2.75, 3.5): [s.note(1, b0 + st, key + 36 + iv, .3, hum(r, 88)) for iv in (0, 3, 7)]
        if bar >= 8:
            arp = [0, 3, 7, 12, 15, 12, 7, 3]
            for i in range(16): s.note(3, b0 + i/4, key + 36 + arp[i % 8] + (5 if bar % 8 >= 4 else 0), .2, hum(r, 60 + 20*(i % 4 == 0)))
    s.note(9, nb*4, CR, 2, 110); [s.note(2, nb*4, key + 24 + iv, 3, 70) for iv in (0, 3, 7)]
    render(name, s, "highpass=f=30,equalizer=f=60:t=q:w=1:g=2,equalizer=f=400:t=q:w=1:g=-2,equalizer=f=10000:t=h:w=1:g=2")

if __name__ == "__main__":
    N = None
    rock("radio_parkano_1", 52, 140, [0, 0, 3, 5, 0, 0, 7, 5], [0, 3, 5, 7, 10, 12], 1)
    rock("radio_parkano_2", 45, 126, [0, 5, 7, 5, 0, 3, 5, 7], [0, 2, 3, 7, 10, 12], 2)
    country("radio_country_1", 55, 112, [0, 0, 5, 5, 7, 7, 0, 0], 3)
    country("radio_country_2", 50, 100, [0, 5, 0, 7, 0, 5, 7, 0], 4)
    tekno("radio_tekno_1", 33, 136, [0, N, 12, 0, N, 0, 15, N, 0, 0, N, 12, 10, N, 0, 7], 5)
    tekno("radio_tekno_2", 36, 142, [0, 0, N, 0, 12, N, 0, 10, N, 0, 0, 15, N, 12, 0, N], 6)
    print("biisit ok")
