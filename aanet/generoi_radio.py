"""Vitaran radio v0.6: 3 kanavaa x 2 biisiä, kanavanvaihtokohina ja juontajatunnukset. Kaikki syntetisoitu."""
from generoi_aanet import *
import subprocess, functools
nf = lambda m: 440*2**((m-69)/12)
def save_small(name, x, vol=0.85):
    x = np.asarray(x, float); x = np.stack([x, x], 1) if x.ndim == 1 else x
    x = x/(np.max(np.abs(x))+1e-9)*vol; tmp = f"/tmp/{name}.wav"
    with wave.open(tmp, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x*32767).astype("<i2").tobytes())
    for ext, a in (("ogg", ["-c:a","libvorbis","-q:a","3"]), ("mp3", ["-c:a","libmp3lame","-b:a","112k"])):
        subprocess.run(["ffmpeg","-y","-loglevel","error","-i",tmp,*a,f"{name}.{ext}"], check=True)
    os.remove(tmp)
@functools.lru_cache(None)
def ks(m, dur, decay=0.996, bright=0.5):
    N = max(2, int(SR/nf(m))); n = int(dur*SR); y = np.zeros(n + N + 1)
    y[:N] = np.random.default_rng(int(m*7)).uniform(-1, 1, N)
    for s in range(N, n + N, N):
        prev = y[s-N:s+1]; L = min(N, len(y)-s)
        y[s:s+L] = decay*(bright*prev[:L] + (1-bright)*prev[1:L+1])
    return y[:n]
def place(buf, x, sec, g=1.0, pan=0.0):
    i = int(sec*SR); j = min(len(buf), i+len(x))
    if j <= i: return
    buf[i:j, 0] += x[:j-i]*g*(1-pan); buf[i:j, 1] += x[:j-i]*g*(1+pan)
@functools.lru_cache(None)
def kick(): tt = t(.35); return np.sin(2*np.pi*(50*tt + 90*(1-np.exp(-tt/.03))*.03*SR/SR*30))*np.exp(-tt/.12)
@functools.lru_cache(None)
def snare(): tt = t(.25); return filt(np.random.default_rng(1).standard_normal(len(tt)), 300, 8000)*np.exp(-tt/.06) + np.sin(2*np.pi*190*tt)*np.exp(-tt/.04)*.5
@functools.lru_cache(None)
def hat(o=False): tt = t(.25 if o else .05); return filt(np.random.default_rng(2).standard_normal(len(tt)), 7000)*np.exp(-tt/(.08 if o else .012))
def saw(f, dur): tt = t(dur); return 2*((tt*f) % 1) - 1
def drums(buf, bpm, bars, start, style):
    b = 60/bpm
    for bar in range(bars):
        t0 = start + bar*4*b
        for q in range(8):
            s = t0 + q*b/2
            if style == "rock":
                if q in (0, 3, 4): place(buf, kick(), s, 1.0)
                if q in (2, 6): place(buf, snare(), s, .8)
                place(buf, hat(), s, .25, .3)
            elif style == "country":
                if q in (0, 4): place(buf, kick(), s, .7)
                if q in (2, 6): place(buf, snare(), s, .45)
                place(buf, hat(), s, .12, .3)
            else:
                if q % 2 == 0: place(buf, kick(), s, 1.0)
                else: place(buf, hat(True), s, .25, .2)
                if q in (2, 6): place(buf, snare(), s, .35)
                place(buf, hat(), s + b/4, .12, -.3)
def master(buf, name):
    n = len(buf); fade = int(2*SR); buf[-fade:] *= np.linspace(1, 0, fade)[:, None]; buf[:int(.05*SR)] *= np.linspace(0, 1, int(.05*SR))[:, None]
    buf = np.tanh(buf/np.max(np.abs(buf))*1.6); save_small(name, buf)

def rock(name, key, bpm, prog, seed):
    r = np.random.default_rng(seed); b = 60/bpm; bars = int(100/(4*b)); buf = np.zeros((int((bars*4*b + 2)*SR), 2))
    drums(buf, bpm, bars, 0, "rock")
    riff = r.choice([0, 0, 0, 12, 0, 10, 0, 7], 8)
    for bar in range(bars):
        root = key + prog[bar % len(prog)]; sec = bar // 8
        for e in range(8):
            s = bar*4*b + e*b/2; d = b/2*.9
            chug = sum(saw(nf(root + iv)*det, d) for iv in (0, 7, 12) for det in (0.995, 1.005))
            g = filt(np.tanh(chug*3), 80, 3500)*np.exp(-t(d)/.25)
            place(buf, g, s, .35 if sec % 2 == 0 else .45, -.4); place(buf, g, s + .012, .35, .4)
            bs = filt(saw(nf(root - 12), d), None, 600)*np.exp(-t(d)/.3); place(buf, bs, s, .5)
        if sec % 2 == 1 and bar % 2 == 0:  # kitarasoolo
            for e in range(4):
                m = root + 12 + [0, 3, 5, 7, 10, 12][r.integers(0, 6)]; d = b*.95
                f = nf(m)*(1 + .01*np.sin(2*np.pi*6*t(d)))
                lead = filt(np.tanh(np.sin(2*np.pi*np.cumsum(f)/SR)*6), 200, 4000)*np.minimum(1, t(d)/.02)
                place(buf, lead, bar*4*b + e*b, .18)
    master(buf, name)

def country(name, key, bpm, prog, seed):
    r = np.random.default_rng(seed); b = 60/bpm; bars = int(96/(4*b)); buf = np.zeros((int((bars*4*b + 3)*SR), 2))
    drums(buf, bpm, bars, 0, "country")
    roll = [0, 7, 12, 4, 7, 12, 0, 16]
    for bar in range(bars):
        root = key + prog[bar % len(prog)]; t0 = bar*4*b
        for q in range(4):  # boom-chak basso
            m = root - 12 + (0 if q % 2 == 0 else 7); place(buf, filt(ks(m, b, .995, .5), None, 900), t0 + q*b, .7)
        for e in range(8):  # banjo-rolli
            place(buf, filt(ks(root + 12 + roll[e], .6, .990, .5), 400), t0 + e*b/2, .3, -.4)
        if bar % 4 in (1, 3):  # lap steel -liuku
            d = 4*b; tt = t(d); m0 = root + 12 + r.choice([4, 7, 9]); f = nf(m0)*2**((-1 + np.minimum(1, tt/.25))/12)*(1 + .006*np.sin(2*np.pi*5*tt))
            ph = 2*np.pi*np.cumsum(f)/SR; st = (np.sin(ph) + .3*np.sin(2*ph) + .15*np.sin(3*ph))*np.minimum(1, tt/.08)*np.exp(-tt/2.5)
            place(buf, st, t0, .22, .4)
    master(buf, name)

def tekno(name, key, bpm, pattern, seed):
    r = np.random.default_rng(seed); b = 60/bpm; bars = int(100/(4*b)); buf = np.zeros((int((bars*4*b + 2)*SR), 2))
    drums(buf, bpm, bars, 0, "tekno")
    for bar in range(bars):
        t0 = bar*4*b; cut = 400 + 2500*(0.5 + 0.5*np.sin(2*np.pi*bar/16))
        for s16 in range(16):  # acid-basso
            m = pattern[s16]
            if m is None: continue
            d = b/4*.9; x = saw(nf(key + m), d)*np.exp(-t(d)/.08)
            x = np.tanh(filt(x, None, cut)*2 + formant(x, cut, cut*.3)*1.5)
            place(buf, x, t0 + s16*b/4, .45)
        if bar >= 8 and bar % 2 == 0:  # rave-stabit
            for s in (0.5, 2.5):
                d = b*.4; c = sum(saw(nf(key + 24 + iv)*det, d) for iv in (0, 3, 7, 10) for det in (.99, 1.01))
                place(buf, filt(c, 300, 5000)*np.exp(-t(d)/.1), t0 + s*b, .12, r.uniform(-.4, .4))
    master(buf, name)

rock("radio_parkano_1", 40, 140, [0, 0, 3, 5, 0, 0, 7, 5], 1)
rock("radio_parkano_2", 45, 126, [0, 5, 7, 5, 0, 3, 5, 7], 2)
country("radio_country_1", 55, 112, [0, 0, 5, 5, 7, 7, 0, 0], 3)
country("radio_country_2", 50, 100, [0, 5, 0, 7, 0, 5, 7, 0], 4)
N = None
tekno("radio_tekno_1", 33, 136, [0, N, 12, 0, N, 0, 15, N, 0, 0, N, 12, 10, N, 0, 7], 5)
tekno("radio_tekno_2", 36, 142, [0, 0, N, 0, 12, N, 0, 10, N, 0, 0, 15, N, 12, 0, N], 6)

# kanavan vaihto: kohinapurske + rätinä
tt = t(.45); n = filt(rng.standard_normal(len(tt)), 400, 4000)*np.sin(np.pi*tt/tt[-1])**.5
n += (rng.random(len(tt)) > .998)*rng.uniform(-1, 1, len(tt))*2 + np.sin(2*np.pi*(1200 + 800*np.sin(2*np.pi*3*tt))*tt)*.1
save_small("sfx_radio_kanava", n, .5)
for name, text in (("radio_tunnus_parkano", "Parkano Rock!"), ("radio_tunnus_country", "Jalasjärven Kantri!"), ("radio_tunnus_tekno", "Koppelontien Tekno!")):
    w = f"/tmp/{name}.wav"; subprocess.run(["espeak-ng","-v","fi+m2","-s","140","-p","30","-a","190","-w",w,text], check=True)
    for ext, a in (("ogg",["-c:a","libvorbis","-q:a","4"]),("mp3",["-c:a","libmp3lame","-b:a","128k"])):
        subprocess.run(["ffmpeg","-y","-loglevel","error","-i",w,"-af","aecho=0.8:0.7:60|120:0.4|0.25,highpass=f=150,loudnorm=I=-15","-ar","44100","-ac","2",*a,f"{name}.{ext}"], check=True)
print("ok")
