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
    subprocess.run(["fluidsynth", "-ni", "-q", "-g", "0.35", "-r", "44100", "-R", "1", "-C", "1", "-F", wav, SF, mid], check=True)
    dur = float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",wav]))
    af = (f"{master_af},acompressor=threshold=-20dB:ratio=1.6:attack=30:release=300:makeup=1,"
          f"loudnorm=I=-16:TP=-2:LRA=11,alimiter=limit=0.79:level=false,"
          f"afade=t=in:st=0:d=0.05,afade=t=out:st={max(0,dur-2.5):.2f}:d=2.5")
    out = f"{TMP}/{name}_m.wav"
    subprocess.run(["ffmpeg","-y","-loglevel","error","-i",wav,"-af",af,"-ar","44100","-ac","2",out], check=True)
    enc(out, os.path.join(D, name))
def enc(src, dst):
    for ext, a in (("ogg", ["-c:a","libvorbis","-q:a","6"]), ("mp3", ["-c:a","libmp3lame","-q:a","2"])):
        subprocess.run(["ffmpeg","-y","-loglevel","error","-i",src,*a,f"{dst}.{ext}"], check=True)
        o=subprocess.check_output(["ffmpeg","-i",f"{dst}.{ext}","-af","volumedetect","-f","null","-"],stderr=subprocess.STDOUT,text=True)
        peak=max(float(ln.split(":")[1].replace("dB","").strip()) for ln in o.splitlines() if "max_volume" in ln)
        print(f"{os.path.basename(dst)}.{ext} peak {peak:.2f} dB")
        if peak>-1.0: raise SystemExit(f"klippaus {dst}.{ext}: {peak:.2f} dB")

def bars_for(bpm, sec=76): return int(round(sec/(240/bpm)/4))*4

# Jäljelle jätetyt biisit: parkano_1, country_1, tekno_1. Toiset versiot olivat löysempiä riffejä.
# Sointukierrot ja melodiat on kirjoitettu fraaseina, ei satunnaiskävelynä. Nopeudet jätetään alle GM-särörajan.
RIFF = [0, 0, 7, 0, 3, 0, 7, 10]          # rock-riffi, kahdeksasosat
LEAD = [0, 3, 7, 10, 7, 3, 0, 7, 10, 12, 10, 7, 3, 0, -2, 0]
FIDGE = [0, 2, 4, 7, 4, 2, 0, -2, 0, 4, 7, 9, 7, 4, 2, 0]  # viulun 4 tahdin fraasi, neljäsosia kahdessa tahdissa
BASS16 = [0, 0, 0, 12, 0, 0, 3, 0, 0, 0, 0, 10, 0, 7, 0, 3]

def rock(name, key, bpm):
    s = Song(bpm); nb = bars_for(bpm, 72)
    s.prog(0, 29); s.prog(1, 27); s.prog(2, 33); s.prog(3, 29); s.prog(9, 0)  # overdrive, puhdas, basso, soolo
    s.cc(0, 10, 40); s.cc(1, 10, 90); s.cc(3, 10, 64); s.cc(0, 91, 18); s.cc(1, 91, 28); s.cc(3, 91, 36); s.cc(9, 91, 12)
    prog = [0, 0, 10, 5]  # I I bVII IV
    for bar in range(nb):
        b0 = bar*4; root = key + prog[bar % 4]; part = (bar // 8) % 2; intro = bar < 4; outro = bar >= nb-2
        if bar % 8 == 0 and not intro: s.note(9, b0, CR, 1, 96)
        for e in range(8):
            bt = b0 + e/2
            if bar >= 2: s.note(9, bt, HH, .4, 72 if e % 2 == 0 else 58)
            if e in (0, 4) or (part and e in (0, 3, 4, 5)): s.note(9, bt, K, .3, 100)
            if e in (2, 6): s.note(9, bt, SN, .3, 96)
        if bar % 8 == 7:
            for i, d in enumerate((SN, SN, TM)): s.note(9, b0+3+i/3, d, .2, 90)
        # komppi: yksi overdrive, ei tuplasäröä. Kertsissä avoimet soinnut, säkeistössä riffi.
        if part and not intro:
            for m in (root, root+7, root+12): s.note(0, b0, m, 1.8, 74); s.note(0, b0+2, m, 1.8, 70)
            for e, iv in enumerate((0, 7, 12, 7)): s.note(1, b0+e, root+12+iv, .9, 68)
        else:
            for e, iv in enumerate(RIFF): s.note(0, b0+e/2, root+iv, .42, 76 if e % 2 == 0 else 64)
        for e, iv in enumerate((0, 0, 7, 0, 0, 0, 7, 12)): s.note(2, b0+e/2, root-12+iv, .42, 90)
        if part and not intro and not outro:
            for e, iv in enumerate(LEAD): s.note(3, b0+e/4, root+12+iv, .22, 78)
    s.note(9, nb*4, CR, 2, 100)
    for m in (key, key+7, key+12): s.note(0, nb*4, m, 3, 72); s.note(1, nb*4, m+12, 3, 64)
    s.note(2, nb*4, key-12, 3, 90)
    render(name, s, "highpass=f=35,equalizer=f=240:t=q:w=1.2:g=-2,equalizer=f=3200:t=q:w=1:g=1.5")

def country(name, key, bpm):
    s = Song(bpm); nb = bars_for(bpm, 74)
    s.prog(0, 25); s.prog(1, 105); s.prog(2, 33); s.prog(3, 40); s.prog(9, 0)
    s.cc(0, 10, 48); s.cc(1, 10, 88); s.cc(3, 10, 70); s.cc(3, 91, 40); s.cc(0, 91, 22); s.cc(9, 91, 10)
    prog = [0, 0, 5, 7]  # I I IV V
    for bar in range(nb):
        b0 = bar*4; root = key + prog[bar % 4]; ch3 = chord(root); verse = (bar // 8) % 2 == 0
        for q in range(4):
            s.note(9, b0+q, K if q % 2 == 0 else SN, .4, 78 if q % 2 == 0 else 64)
            s.note(9, b0+q+.5, HH, .3, 48)
            s.note(2, b0+q, root-12+(0 if q % 2 == 0 else 7), .85, 88)
            if q % 2 == 1:  # chak
                for i, m in enumerate(ch3): s.note(0, b0+q+i*0.01, m, .7, 70)
            else:
                s.note(0, b0+q, root, .4, 64)
        if bar >= 4 and verse:
            roll = [0, 4, 7, 4, 7, 12, 7, 4]
            for e, iv in enumerate(roll): s.note(1, b0+e/2, root+12+iv, .42, 72)
        if not verse and bar < nb-2:  # sama fraasi kahdesti, sitten terssi ylös
            shift = 12 if (bar // 8) % 4 == 3 else 0
            for e, iv in enumerate(FIDGE): s.note(3, b0+e/4, root+12+iv+shift, .22, 80)
    for m in chord(key+12): s.note(0, nb*4, m, 3, 72); s.note(3, nb*4, m, 3, 76)
    s.note(2, nb*4, key-12, 3, 88)
    render(name, s, "highpass=f=40,equalizer=f=280:t=q:w=1:g=-1.5,equalizer=f=4500:t=q:w=1:g=1.2")

def tekno(name, key, bpm):
    s = Song(bpm); nb = bars_for(bpm, 76)
    s.prog(0, 38); s.prog(1, 89); s.prog(2, 81); s.prog(9, 0)
    s.ev.append((0, 0, bytes([0xB9, 0, 128])))  # TR-808
    s.cc(1, 91, 50); s.cc(2, 91, 30); s.cc(1, 10, 64); s.cc(2, 10, 80); s.cc(9, 91, 8)
    for bar in range(nb):
        b0 = bar*4; sec = (bar // 8) % 4; brk = sec == 2 and bar % 8 < 4
        for q in range(4):
            if not brk: s.note(9, b0+q, K, .35, 102)
            s.note(9, b0+q+.5, OH, .3, 62)
            if q % 2 and bar >= 4 and not brk: s.note(9, b0+q, CL, .25, 84)
        if bar >= 2 and not brk:
            for i, iv in enumerate(BASS16): s.note(0, b0+i/4, key+iv+(12 if sec == 3 and i % 8 == 0 else 0), .2, 86 if i % 4 == 0 else 74)
        if bar % 8 == 0:  # pad neljä tahtia, hiljaa
            for iv in (0, 3, 7, 10): s.note(1, b0, key+24+iv, 15.5, 52)
        if sec in (1, 3) and not brk and bar < nb-2:
            arp = (0, 3, 7, 12, 7, 3)
            for i, iv in enumerate(arp): s.note(2, b0+i*4/6, key+24+iv, .4, 70)
    s.note(9, nb*4, CR, 1.5, 96)
    for iv in (0, 3, 7): s.note(1, nb*4, key+24+iv, 3, 56)
    render(name, s, "highpass=f=30,equalizer=f=80:t=q:w=1:g=1.5,equalizer=f=350:t=q:w=1:g=-2,equalizer=f=8000:t=h:w=1:g=1")

if __name__ == "__main__":
    rock("radio_parkano_1", 52, 132)
    country("radio_country_1", 55, 104)
    tekno("radio_tekno_1", 33, 126)
    print("biisit ok")
