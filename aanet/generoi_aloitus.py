#!/usr/bin/env python3
"""Aloitusruudun tunnari (45 s, saumaton looppi): tuuli + kaukainen ajohaukku + hiljainen mollimelodia.
Melodia: MIDI -> FluidSynth + FluidR3_GM. Sauma: renderöidään 48 s ja lopun 3 s ristihäivytetään alkuun.
Lähteet: tuuli Gravity Sound (CC BY 4.0), ajohaukku Benboncan / Freesound 65888 (CC BY 4.0). Aja: python3 generoi_aloitus.py"""
import numpy as np, subprocess, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from generoi_radio_v2 import Song, SF, enc
D = os.path.dirname(os.path.abspath(__file__)); TMP = "/tmp/aloitus"; os.makedirs(TMP, exist_ok=True)
SR, L, X = 44100, 45.0, 3.0; N = int(SR*L); NX = int(SR*X); NT = N + NX

def load(path, af=None):
    cmd = ["ffmpeg", "-loglevel", "error", "-i", path] + (["-af", af] if af else []) + ["-f", "f32le", "-ac", "2", "-ar", str(SR), "-"]
    return np.frombuffer(subprocess.check_output(cmd), np.float32).reshape(-1, 2).astype(np.float64)
def fit(a, n):
    out = np.zeros((n, 2)); out[:min(n, len(a))] = a[:n]; return out

def melodia():
    bpm = 60; s = Song(bpm)  # 1 isku = 1 s, 12 tahtia = 48 s
    s.prog(0, 46); s.prog(1, 49); s.prog(2, 42)  # harppu (kantelemainen), jousipad, sello
    s.cc(0, 10, 54); s.cc(1, 10, 74); s.cc(2, 10, 64); s.cc(0, 91, 90); s.cc(1, 91, 100); s.cc(2, 91, 80)
    s.cc(1, 7, 70); s.cc(2, 7, 80)
    A = 57; prog = [0, -4, -7, -5] * 3                    # Am F Dm Em
    mel = [[(0, 76, 1.5), (1.5, 74, .5), (2, 72, 2)], [(0, 72, 1), (1, 71, 1), (2, 69, 2)],
           [(0, 69, 1.5), (1.5, 71, .5), (2, 72, 1), (3, 74, 1)], [(0, 71, 3), (3, 68, 1)],
           [(0, 69, 1), (1, 72, 1), (2, 76, 2)], [(0, 77, 1.5), (1.5, 76, .5), (2, 72, 2)],
           [(0, 74, 1), (1, 72, 1), (2, 69, 2)], [(0, 71, 2), (2, 68, 1), (3, 71, 1)]]
    for bar in range(12):
        b0 = bar*4; r = A + prog[bar]; minor = bar % 4 in (0, 2)
        tri = [r, r + (3 if minor else 4), r + 7]
        if bar % 4 == 3: tri = [r, r + 4, r + 7]                     # E-duuri dominanttina
        for i, m in enumerate([tri[0], tri[1] + 12, tri[2], tri[1] + 12]):  # hidas näppäily
            s.note(0, b0 + i, m, 1.8, 48 + (6 if i == 0 else 0))
        for m in tri: s.note(1, b0, m + 12, 4.0, 42)
        s.note(2, b0, r - 12, 3.9, 50)
        if 2 <= bar < 10:
            for st, m, d in mel[bar - 2]: s.note(0, b0 + st, m + 12, d + .8, 62)
    s.write(f"{TMP}/mel.mid"); wav = f"{TMP}/mel.wav"
    subprocess.run(["fluidsynth", "-ni", "-q", "-g", "0.5", "-r", str(SR), "-F", wav, SF, f"{TMP}/mel.mid"], check=True)
    return fit(load(wav, "highpass=f=40"), NT)

def main():
    w = load(os.path.join(D, "amb_talvimetsa_tuuli_loop.ogg"))
    tuuli = np.tile(w, (NT // len(w) + 1, 1))[:NT]                  # 45 s looppi -> 48 s
    koira = load(os.path.join(D, "sfx_koira_ajo_harva.ogg"),
                 "lowpass=f=2500,lowpass=f=2500,highpass=f=200,aecho=0.8:0.7:180|420:0.35|0.22,volume=0.9")
    haukku = np.zeros((NT, 2))
    for t0, g, pan in ((9.0, 0.16, (1.0, 0.7)), (27.0, 0.11, (0.7, 1.0))):   # kaksi kaukaista jaksoa
        a = koira * g * np.array(pan); i = int(t0*SR); n = min(len(a), NT - i)
        fi = np.ones(n); k = int(.8*SR); fi[:k] = np.linspace(0, 1, k); fi[-k:] = np.linspace(1, 0, k)
        haukku[i:i+n] += a[:n] * fi[:, None]
    m = melodia()
    def rms(x): return np.sqrt(np.mean(x**2)) + 1e-12
    mix = tuuli * (0.10/rms(tuuli)) * 0.55 + haukku + m * (0.10/rms(m))
    # saumaton looppi: lopun 3 s (45..48) ristihäivytetään alkuun (0..3), tasatehokäyrällä
    t = np.linspace(0, np.pi/2, NX)[:, None]
    out = mix[:N].copy(); out[:NX] = mix[:NX]*np.sin(t) + mix[N:N+NX]*np.cos(t)
    out *= 10**(-1/20) / np.abs(out).max()                          # huippu -1 dBFS
    raw = f"{TMP}/aloitus.f32"; out.astype(np.float32).tofile(raw)
    wav = f"{TMP}/aloitus.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", raw, "-c:a", "pcm_s16le", wav], check=True)
    for ext, a in (("ogg", ["-c:a", "libvorbis", "-q:a", "5"]), ("mp3", ["-c:a", "libmp3lame", "-b:a", "160k"])):
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, *a, "-ar", "44100", "-ac", "2", os.path.join(D, f"musiikki_aloitus.{ext}")], check=True)
    # saumatarkistus: hyppy lopusta alkuun vs. tyypillinen näytteiden välinen muutos
    d = np.abs(np.diff(out, axis=0)); j = np.abs(out[0] - out[-1])
    print(f"sauma: hyppy {j.max():.5f}, tyypillinen {np.percentile(d, 99):.5f}, max {d.max():.5f}")
    print("aloitus ok")
if __name__ == "__main__": main()
