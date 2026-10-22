#!/usr/bin/env python3
"""v0.9: teeri, peura, kivääri. 100 % synteesiä. Aja: python3 generoi_elaimet_v09.py"""
from generoi_aanet import *
P = 10**(-1/20)  # huippu -1 dBFS

def pyrahdus(seed, dur):
    r = np.random.default_rng(seed); out = np.zeros(int(dur*SR)); tp = 0.0; k = 0
    while tp < dur - 0.08:
        rate = 18*np.exp(-tp/(dur*0.45)) + 4; g = np.exp(-tp/(dur*0.4))
        st = t(0.045); b = formant(r.standard_normal(len(st)), r.uniform(700, 1100), 1400)*env(len(st), .003, .012)
        b += filt(r.standard_normal(len(st)), 60, 300)*env(len(st), .002, .01)*(1.5 if k < 4 else .4)
        i = int(tp*SR); out[i:i+len(st)] += b*g*r.uniform(.8, 1); tp += 1/rate*r.uniform(.9, 1.1); k += 1
    y = reverb(out, .2, 1.2)[:len(out)]; fd = int(.15*SR); y[-fd:] *= np.linspace(1, 0, fd); return y

def kuherrus():
    dur = 6.0; tt = t(dur); out = np.zeros(len(tt))
    f = 500 + 80*np.sin(2*np.pi*.7*tt) + 40*np.sin(2*np.pi*3.1*tt); ph = 2*np.pi*np.cumsum(f)/SR
    src = np.sin(ph) + .4*np.sin(2*ph) + .15*np.sin(3*ph)
    bub = .5 + .5*np.sin(2*np.pi*11*tt + 2*np.sin(2*np.pi*.9*tt))**2  # pulputus
    a = np.ones(len(tt)); a[int(2.6*SR):int(3.5*SR)] = .15  # tauko sihaukselle
    out += formant(src, 520, 700)*bub*a
    st = t(0.6); ts = formant(rng.standard_normal(len(st)), 4500, 5000)*np.sin(np.pi*st/st[-1])**1.5*np.linspace(.6, 1, len(st))
    i = int(2.75*SR); out[i:i+len(st)] += ts*.9
    fade = int(.3*SR); out[:fade] *= np.linspace(0, 1, fade); out[-fade:] *= np.linspace(1, 0, fade)
    return reverb(out, .18, 1.0)[:len(tt)]

def peura():
    out = np.zeros(int(2.5*SR)); st = t(0.28)
    out[:len(st)] += formant(rng.standard_normal(len(st)), 1200, 1800)*env(len(st), .01, .09)*1.2
    for k in range(5):
        lt = t(0.1); thud = filt(rng.standard_normal(len(lt)), 60, 500)*env(len(lt), .002, .025) + np.sin(2*np.pi*75*lt)*env(len(lt), .001, .02)*.6
        puff = filt(rng.standard_normal(len(lt)), 2500, 8000)*env(len(lt), .004, .03)*.25
        g = .7*(1 - k*.17); x = filt(thud + puff, None, 6000 - k*900)
        i = int((0.45 + k*0.38)*SR); out[i:i+len(lt)] += x*g
    return reverb(out, .25, 1.4)[:int(2.5*SR)]

def kivaari():
    tt = t(0.5); n = rng.standard_normal(len(tt))
    crack = filt(n, 1500, 14000)*env(len(tt), .0001, .006)*3
    blast = crack + filt(n, 80, 6000)*env(len(tt), .0002, .025)*1.5 + np.sin(2*np.pi*70*tt)*env(len(tt), .0005, .04)
    blast = np.tanh(blast*2); out = np.zeros(int(3.0*SR)); out[:len(blast)] += blast
    for dly, g, hi in ((.28,.3,3500),(.5,.22,2500),(.8,.15,1700),(1.15,.1,1200),(1.6,.07,900),(2.1,.04,700)):
        i = int(dly*SR); out[i:i+len(blast)] += filt(blast, None, hi)*g
    y = reverb(out, .35, 2.4)[:len(out)]; fd = int(.4*SR); y[-fd:] *= np.linspace(1, 0, fd); return y

def kivaari_lataus():
    out = np.zeros(int(1.0*SR))
    def click(st, f, d, g):
        ct = t(d*6); c = sum(np.sin(2*np.pi*f*k*ct)*np.exp(-ct/(d/k)) for k in (1, 2.4, 3.9)) + filt(rng.standard_normal(len(ct)), 2500)*np.exp(-ct/.002)
        i = int(st*SR); out[i:i+len(c)] += c*g
    def slide(st, d, g):
        n = int(d*SR); s = formant(rng.standard_normal(n), 3500, 3000)*np.sin(np.pi*np.arange(n)/n)*.25
        i = int(st*SR); out[i:i+n] += s*g
    click(0.02, 1300, .012, .8)          # nosto
    slide(0.08, .14, 1); click(0.23, 1700, .01, .9)   # taakse
    slide(0.42, .13, 1); click(0.56, 1100, .015, .8)  # eteen
    click(0.68, 900, .02, 1.1)           # lukitus
    return out

if __name__ == "__main__":
    save("sfx_teeri_pyrahdus_1", pyrahdus(901, 1.5), P); save("sfx_teeri_pyrahdus_2", pyrahdus(902, 1.7), P)
    save("amb_teeri_kuherrus_1", kuherrus(), P); save("sfx_peura_pakenee_1", peura(), P)
    save("sfx_kivaari_laukaus", kivaari(), P*0.85)  # terävä transientti ylittää koodekissa; save("sfx_kivaari_lataus", kivaari_lataus(), P); print("valmis")
