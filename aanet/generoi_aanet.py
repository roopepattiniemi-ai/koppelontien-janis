#!/usr/bin/env python3
"""Koppelontien jänis: MVP-äänet. 100 % synteesiä (numpy + ffmpeg), ei samplejä. Aja: python3 generoi_aanet.py"""
import numpy as np, subprocess, os, wave
SR = 44100; D = os.path.dirname(os.path.abspath(__file__)); rng = np.random.default_rng(2026)

def save(name, x, vol=0.9):
    x = np.asarray(x, float); x = np.stack([x, x], 1) if x.ndim == 1 else x
    x = x/(np.max(np.abs(x)) + 1e-9)*vol; tmp = os.path.join(D, name + ".wav")
    with wave.open(tmp, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x*32767).astype("<i2").tobytes())
    for ext, a in (("ogg", ["-c:a","libvorbis","-q:a","5"]), ("mp3", ["-c:a","libmp3lame","-b:a","160k"])):
        subprocess.run(["ffmpeg","-y","-loglevel","error","-i",tmp,*a,os.path.join(D,f"{name}.{ext}")], check=True)
    os.remove(tmp)
def t(s): return np.arange(int(s*SR))/SR
def env(n, a=.002, d=.2): tt = np.arange(n)/SR; return np.minimum(1, tt/a)*np.exp(-tt/d)
def filt(x, lo=None, hi=None):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1/SR)
    if hi: X *= 1/np.sqrt(1 + (f/hi)**4)
    if lo: X *= 1/np.sqrt(1 + (lo/np.maximum(f, 1))**4)
    return np.fft.irfft(X, len(x))
def formant(x, fc, bw): return filt(x, fc - bw/2, fc + bw/2)
def reverb(x, wet=0.3, rt=1.2, pre=0.02):
    n = int(rt*SR); ir = rng.standard_normal(n)*np.exp(-np.arange(n)/SR/(rt/6.9)); ir = filt(ir, 200, 5000)
    ir = np.concatenate([np.zeros(int(pre*SR)), ir]); y = np.convolve(x, ir)[:len(x) + len(ir)]
    y = y/np.max(np.abs(y) + 1e-9)*np.max(np.abs(x)); out = np.zeros(len(y)); out[:len(x)] += x*(1 - wet); return out + y*wet
def loopify(s, xf=0.4):
    n = int(xf*SR); s = s.copy(); s[:n] = s[:n]*np.linspace(0,1,n) + s[-n:]*np.linspace(1,0,n); return s[:-n]

# ---------- SUOMENAJOKOIRA ----------
def bark(f0, dur, seed, bay=False):
    """Yksi haukku: nopea sävelnousu + lasku, äänihuulimainen lähde, koiran formantit. bay=True: pidempi 'ulvova' ajohaukku."""
    r = np.random.default_rng(seed); tt = t(dur); p = tt/dur
    contour = (1 + 0.35*np.sin(np.pi*np.clip(p*1.6, 0, 1))) if not bay else (1 + 0.25*np.sin(np.pi*np.clip(p*1.2, 0, 1)) - 0.15*p)
    f = f0*contour*(1 + 0.01*r.standard_normal(len(tt)).cumsum()/np.sqrt(SR)*20)
    ph = 2*np.pi*np.cumsum(f)/SR
    src = sum(np.sin(k*ph)/k**1.1 for k in range(1, 14)) + filt(r.standard_normal(len(tt)), 500, 6000)*(0.25 if not bay else 0.12)
    v = formant(src, 700, 500)*1.0 + formant(src, 1400, 700)*0.7 + formant(src, 2600, 900)*0.35
    a = np.minimum(1, tt/0.008)*np.exp(-np.maximum(0, tt - dur*0.35)/(dur*0.25))
    return np.tanh(v*a*2.5)

def koira_haukut():
    # ajohaukku-variaatiot: yksittäisiä haukkuja, joista koodi rakentaa rytmin
    specs = [(520,.22,1,False),(560,.18,2,False),(480,.26,3,False),(600,.20,4,False),(540,.45,5,True),(500,.55,6,True)]
    for i, (f0, d, s, bay) in enumerate(specs, 1):
        save(f"sfx_koira_haukku_{i}", reverb(np.concatenate([bark(f0, d, s, bay), np.zeros(int(.3*SR))]), .25, 1.5), 0.9)
    # valmiit ajojaksot: tiivis (lähellä jänistä) ja harva (jälki vanhempi)
    for name, gaps in (("sfx_koira_ajo_tiivis", [.38,.42,.36,.5,.4,.37,.44,.6,.38,.41]), ("sfx_koira_ajo_harva", [.9,1.3,.8,1.6,1.1,1.4])):
        total = sum(gaps) + 1.0; out = np.zeros(int(total*SR)); tpos = 0.1
        for k, g in enumerate(gaps):
            f0, d, s, bay = specs[rng.integers(0, len(specs))]; b = bark(f0*rng.uniform(.96, 1.04), d, 100 + k, bay)
            i = int(tpos*SR); out[i:i+len(b)] += b*rng.uniform(.8, 1); tpos += g
        save(name, reverb(out, .3, 1.8), 0.9)

def koira_muut():
    # ylösotto: innostunut kiljahdus + pari nopeaa haukkua
    tt = t(0.5); f = 700 + 500*np.sin(np.pi*tt/0.5); ph = 2*np.pi*np.cumsum(f)/SR
    yelp = formant(sum(np.sin(k*ph)/k for k in range(1, 8)), 1200, 1600)*np.sin(np.pi*tt/0.5)**0.5
    out = np.concatenate([yelp, np.zeros(int(.1*SR)), bark(620,.18,21), np.zeros(int(.12*SR)), bark(640,.16,22), np.zeros(int(.4*SR))])
    save("sfx_koira_ylosotto", reverb(out, .25, 1.5), 0.9)
    # haku / hukka: nuuhkiminen (lyhyitä nenäpuhalluksia)
    for name, n, rate in (("sfx_koira_nuuhkii", 8, .14), ("sfx_koira_nuuhkii_hidas", 5, .32)):
        out = np.zeros(int((n*rate + .5)*SR))
        for k in range(n):
            st = t(0.07); s = formant(rng.standard_normal(len(st)), 3000, 3000)*np.sin(np.pi*st/st[-1])**2
            i = int(k*rate*SR); out[i:i+len(st)] += s*rng.uniform(.6, 1)
        save(name, out, 0.6)
    # hukka: hiljainen vinkuna
    tt = t(1.1); f = 900 + 150*np.sin(2*np.pi*1.5*tt) - 200*tt; ph = 2*np.pi*np.cumsum(f)/SR
    whine = formant(np.sin(ph) + 0.3*np.sin(2*ph), 1100, 1200)*np.sin(np.pi*tt/tt[-1])
    save("sfx_koira_vinkuu", whine, 0.5)
    # GPS-pannan / haun kulkuset? -> vain hakujuoksu: tassut lumessa
    tt = t(2.0); out = np.zeros(len(tt))
    for k in range(18):
        st = t(0.05); s = formant(rng.standard_normal(len(st)), 1800, 2500)*env(len(st), .002, .012)
        i = int((k*0.105 + rng.uniform(0, .02))*SR); out[i:i+len(st)] += s*rng.uniform(.4, .8)
    save("sfx_koira_juoksu_lumi", out*np.sin(np.pi*tt/tt[-1]), 0.6)

# ---------- HAULIKKO ----------
def haulikko():
    tt = t(0.8); n = rng.standard_normal(len(tt))
    blast = filt(n, 60, 9000)*env(len(tt), .0003, .04)*2 + filt(n, None, 400)*env(len(tt), .001, .12)*2 + np.sin(2*np.pi*55*tt)*env(len(tt), .001, .08)*2
    blast = np.tanh(blast*2)
    # kaiku metsästä: useita viivästettyjä, alipäästettyjä heijastuksia
    out = np.zeros(int(3.5*SR)); out[:len(blast)] += blast
    for dly, g, hi in ((.35,.25,2500),(.62,.18,1800),(.95,.12,1200),(1.4,.08,900),(1.9,.05,700)):
        i = int(dly*SR); out[i:i+len(blast)] += filt(blast, None, hi)*g
    save("sfx_haulikko_laukaus", reverb(out, .35, 2.5), 0.95)
def lataus():
    out = np.zeros(int(2.2*SR))
    def click(st, f, d, g):
        ct = t(d*6); c = sum(np.sin(2*np.pi*f*k*ct)*np.exp(-ct/(d/k)) for k in (1, 2.7, 4.1)) + filt(rng.standard_normal(len(ct)), 2000)*np.exp(-ct/.003)
        i = int(st*SR); out[i:i+len(c)] += c*g
    click(0.0, 900, .02, 1.0)        # avausvipu
    click(0.12, 500, .03, 0.8)       # piiput aukeavat
    click(0.55, 1800, .008, .4); click(0.62, 1500, .01, .35)   # hylsyt ulos
    click(1.05, 1100, .01, .5); click(1.35, 1150, .01, .5)     # uudet patruunat sisään
    click(1.8, 700, .03, 1.1)        # piiput kiinni
    save("sfx_haulikko_lataus", out, 0.8)

# ---------- KÄVELY, JÄNIS ----------
def askel(seed, soft=1.0):
    r = np.random.default_rng(seed); dur = 0.32; tt = t(dur); n = r.standard_normal(len(tt)); s = np.zeros(len(tt))
    for _ in range(60):  # lumen narskahdukset
        i = int(r.uniform(0, 0.22)*SR); ct = t(0.006)
        s[i:i+len(ct)] += filt(r.standard_normal(len(ct)), 1500, 7000)*np.exp(-ct/.0015)*r.uniform(.2, 1)
    s += filt(n, 100, 800)*env(len(tt), .01, .08)*0.6
    return s*np.sin(np.pi*np.clip(tt/0.25, 0, 1))*soft
def kavely():
    for i in range(1, 5): save(f"sfx_askel_lumi_{i}", askel(300 + i), 0.6)
    out = np.zeros(int(4.2*SR))
    for k in range(8): a = askel(400 + k); i = int(k*0.52*SR); out[i:i+len(a)] += a
    save("sfx_kavely_lumi_loop", out[:int(4.16*SR)], 0.6)
def janis():
    out = np.zeros(int(1.6*SR))
    for k in range(5):  # pehmeät loikat + lumen pöllähdys
        st = t(0.12); thud = filt(rng.standard_normal(len(st)), 80, 600)*env(len(st), .002, .03) + np.sin(2*np.pi*90*st)*env(len(st), .001, .02)*.5
        puff = filt(rng.standard_normal(len(st)), 2000, 8000)*env(len(st), .005, .04)*.3
        i = int(k*0.28*SR); out[i:i+len(st)] += (thud + puff)*(1 - k*0.12)
    save("sfx_janis_pakoloikka", out, 0.6)

# ---------- AMBIENSSI ----------
def ambient():
    dur = 30.4; tt = t(dur); n = rng.standard_normal(len(tt))
    gust = 0.55 + 0.45*filt(rng.standard_normal(len(tt)), None, 0.15)/0.05; gust = np.clip(gust, 0.2, 1.4)
    wind = filt(n, 150, 900)*gust + filt(rng.standard_normal(len(tt)), 1500, 5000)*gust**2*0.15   # kuusien humina
    L = wind.copy(); R = np.roll(wind, int(0.013*SR))
    # harvoja ääniä: oksa naksahtaa, lumi putoaa oksalta, tiainen kaukana
    for _ in range(4):
        i = rng.integers(SR, len(tt) - 2*SR); ct = t(0.4)
        plop = filt(rng.standard_normal(len(ct)), 200, 2500)*env(len(ct), .01, .08)*0.5
        L[i:i+len(ct)] += plop*rng.uniform(.3, 1); R[i:i+len(ct)] += plop*rng.uniform(.3, 1)
    for _ in range(3):
        i = rng.integers(SR, len(tt) - 2*SR)
        for k in range(3):  # "ti-ti-tyy"
            ct = t(0.09 if k < 2 else 0.18); f = 4200 if k < 2 else 3400
            ch = np.sin(2*np.pi*f*ct)*np.sin(np.pi*ct/ct[-1])*0.04
            j = i + int(k*0.16*SR); L[j:j+len(ch)] += ch*0.6; R[j:j+len(ch)] += ch
    st = np.stack([loopify(L, 0.4), loopify(R, 0.4)], 1)
    save("amb_talvimetsa_tuuli_loop", st, 0.55)

# ---------- VALIKKOBIISI ----------
def kantele(f, dur, seed):
    r = np.random.default_rng(seed); N = int(SR/f); buf = r.uniform(-1, 1, N); out = np.zeros(int(dur*SR))
    for i in range(len(out)):
        out[i] = buf[i % N]; buf[i % N] = 0.996*0.5*(buf[i % N] + buf[(i + 1) % N])
    return filt(out, 80, 6000)
def valikko():
    bpm = 66; beat = 60/bpm; bars = 16; dur = bars*4*beat; N = int(dur*SR); L = np.zeros(N); R = np.zeros(N)
    nf = lambda m: 440*2**((m - 69)/12)
    prog = [[50,57,62,65],[46,53,58,62],[48,55,60,64],[45,52,57,61]]   # Dm Bb C A
    mel = [74,72,69,0, 72,70,69,67, 69,0,72,74, 73,0,69,0]
    for b in range(bars):
        t0 = b*4*beat; ch = prog[(b//2) % 4]
        if b % 2 == 0:  # pehmeä jousimatto
            tt = t(8*beat); p = sum(np.sin(2*np.pi*nf(m)*tt*d) for m in ch for d in (0.998, 1.002))
            p = filt(p, None, 1200)*np.minimum(1, tt/1.5)*np.minimum(1, (tt[-1] - tt)/1.5)*0.05
            i = int(t0*SR); j = min(N, i + len(p)); L[i:j] += p[:j-i]; R[i:j] += p[:j-i]
        for e in range(8):  # kantele-arpeggio kahdeksasosina
            if b < 2 and e % 2: continue
            m = ch[[0,1,2,3,2,1,2,3][e]] + 12; k = kantele(nf(m), 2.0, b*8 + e)*0.12
            i = int((t0 + e*beat/2)*SR); j = min(N, i + len(k)); pan = 0.3 if e % 2 else -0.3
            L[i:j] += k[:j-i]*(1 - pan); R[i:j] += k[:j-i]*(1 + pan)
        if b >= 4:  # melodia kanteleella, puolinuotteina
            for q in range(2):
                m = mel[(b % 8)*2 + q]
                if not m: continue
                k = kantele(nf(m), 3.0, 900 + b*2 + q)*0.22; i = int((t0 + q*2*beat)*SR); j = min(N, i + len(k))
                L[i:j] += k[:j-i]; R[i:j] += k[:j-i]
    st = np.stack([L, R], 1)
    tail = int(2.5*SR)  # hännän häivytys alkuun saumattomaksi
    st[:tail] *= np.linspace(0.3, 1, tail)[:, None]
    save("musiikki_valikko_talvi", np.stack([reverb(st[:,0], .35, 3.0)[:N], reverb(st[:,1], .35, 3.0)[:N]], 1), 0.75)

if __name__ == "__main__":
    koira_haukut(); koira_muut(); haulikko(); lataus(); kavely(); janis(); ambient(); valikko(); print("valmis")
