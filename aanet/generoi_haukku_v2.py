"""v0.8: realistisempi suomenajokoiran haukku. Lähde-suodin-synteesi aikamuuttuvilla formanteilla (vain itse syntetisoitua)."""
from generoi_aanet import *
def tv_formant(src, F, gains, bws):
    """F: lista funktioita p->Hz (p=0..1). Kehyksittäinen FFT-suodatus, overlap-add."""
    hop = 256; win = 1024; w = np.hanning(win); n = len(src); out = np.zeros(n + win)
    pad = np.concatenate([src, np.zeros(win)]); fr = np.fft.rfftfreq(win, 1/SR)
    for s in range(0, n, hop):
        p = s/n; seg = pad[s:s+win]*w; X = np.fft.rfft(seg); H = np.zeros_like(fr)
        for f, g, bw in zip(F, gains, bws):
            fc = f(p); H += g/(1 + ((fr - fc)/(bw/2))**2)
        out[s:s+win] += np.fft.irfft(X*H, win)*w
    return out[:n]/1.5
def bay(f0, dur, seed, kind="ulvova"):
    r = np.random.default_rng(seed); tt = t(dur); p = tt/dur
    if kind == "ulvova":   # kumea "vouuu": nopea nousu, pitkä kaareva lasku
        contour = 0.82 + 0.3*np.minimum(1, p/0.12) - 0.28*np.maximum(0, p - 0.25)**1.3
        F1 = lambda q: 350 + 450*min(1, q/0.15) - 250*max(0, q - 0.5)   # "u" -> "o/a" -> "u"
        F2 = lambda q: 900 + 300*min(1, q/0.15) - 300*max(0, q - 0.4)
        att, rel = 0.03, 0.35
    else:                   # löytöhaukku: lyhyt, terävämpi "vau"
        contour = 0.9 + 0.35*np.sin(np.pi*np.clip(p*1.3, 0, 1))
        F1 = lambda q: 500 + 400*np.sin(np.pi*min(1, q*1.4)); F2 = lambda q: 1300 + 300*np.sin(np.pi*min(1, q*1.4))
        att, rel = 0.012, 0.3
    jitter = filt(r.standard_normal(len(tt)), None, 30); jitter /= np.abs(jitter).max() + 1e-9
    f = f0*contour*(1 + 0.025*jitter + 0.012*np.sin(2*np.pi*r.uniform(5, 7)*tt))
    ph = 2*np.pi*np.cumsum(f)/SR
    # glottaalilähde: rikas harmoninen + aliharmoninen karheus alussa
    src = sum(np.sin(k*ph)/k**0.9 for k in range(1, 25))
    src += 0.35*np.sin(ph/2)*np.exp(-tt/0.06) + filt(r.standard_normal(len(tt)), 300, 5000)*(0.15 + 0.3*np.exp(-tt/0.04))
    v = tv_formant(src, [F1, F2, lambda q: 2700, lambda q: 3600], [1.0, 0.6, 0.25, 0.1], [260, 380, 500, 700])
    a = np.minimum(1, tt/att)*np.minimum(1, np.maximum(0, dur - tt)/(dur*rel))
    v = np.tanh(v/np.abs(v).max()*1.8*a)
    return filt(v, 120, 6500)
def forest(x, wet=.35): return reverb(np.concatenate([x, np.zeros(int(.6*SR))]), wet, 2.2, .03)
specs = [(560,.32,1,"loyto"),(600,.28,2,"loyto"),(530,.35,3,"loyto"),(620,.30,4,"loyto"),(470,.95,5,"ulvova"),(440,1.15,6,"ulvova")]
for i, (f0, d, s, k) in enumerate(specs, 1): save(f"sfx_koira_haukku_{i}", forest(bay(f0, d, s, k)), 0.9)
def seq(name, items):
    total = sum(g for *_, g in items) + 2; out = np.zeros(int(total*SR)); pos = 0.1
    for k, (f0, d, kind, g) in enumerate(items):
        b = bay(f0*rng.uniform(.97, 1.03), d*rng.uniform(.9, 1.1), 200 + k, kind)
        i = int(pos*SR); out[i:i+len(b)] += b*rng.uniform(.8, 1); pos += g
    save(name, reverb(out, .38, 2.4, .03), 0.9)
U, L = "ulvova", "loyto"
seq("sfx_koira_ajo_tiivis", [(470,.8,U,1.0),(480,.75,U,.95),(460,.85,U,1.05),(530,.3,L,.5),(475,.8,U,.95),(465,.9,U,1.1),(480,.75,U,1.0),(470,.85,U,1.2)])
seq("sfx_koira_ajo_harva", [(450,1.0,U,1.9),(460,.95,U,2.4),(445,1.1,U,1.7),(455,1.0,U,2.6),(440,1.1,U,2.0)])
# ylösotto: innostunut kiljahdus + löytöhaukut + ensimmäinen ulvova
tt = t(.45); f = 750 + 450*np.sin(np.pi*tt/.45); ph = 2*np.pi*np.cumsum(f)/SR
yelp = filt(sum(np.sin(k*ph)/k for k in range(1, 10)), 500, 4000)*np.sin(np.pi*tt/.45)**.6
z = lambda s: np.zeros(int(s*SR))
out = np.concatenate([yelp*.6, z(.12), bay(600,.28,31,L), z(.15), bay(620,.26,32,L), z(.25), bay(480,.9,33,U)])
save("sfx_koira_ylosotto", forest(out, .3), 0.9)
