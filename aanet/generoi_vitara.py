from generoi_aanet import *
def engine(dur, rpm_fn, seed):
    tt = t(dur); rpm = rpm_fn(tt); f = rpm/60*2  # 4-syl: 2 sytytystä/kierros
    ph = 2*np.pi*np.cumsum(f)/SR; r = np.random.default_rng(seed)
    s = sum(np.sin(k*ph + r.uniform(0, 6))*(1/k) for k in range(1, 12))
    s *= 1 + 0.25*np.sin(ph/2)  # epätasaisuus
    s += filt(r.standard_normal(len(tt)), 80, 1200)*0.25
    return np.tanh(filt(s, 30, 1800)*1.5)
def door(close):
    out = np.zeros(int(1.0*SR)); n = rng.standard_normal(len(out))
    if close:
        st = t(.4); thud = filt(rng.standard_normal(len(st)), 40, 500)*env(len(st), .001, .06) + np.sin(2*np.pi*70*st)*env(len(st), .001, .05)
        clk = filt(rng.standard_normal(len(st)), 1500, 6000)*env(len(st), .0005, .01)*.5
        out[:len(st)] += thud + clk; out[int(.05*SR):int(.05*SR)+len(st)] += filt(thud, None, 300)*.3
    else:
        st = t(.15); c = filt(rng.standard_normal(len(st)), 1200, 5000)*env(len(st), .0005, .015)
        out[:len(st)] += c; out[int(.08*SR):int(.08*SR)+len(st)] += c*.6
        cr = t(.5); out[int(.15*SR):int(.15*SR)+len(cr)] += filt(rng.standard_normal(len(cr)), 300, 1500)*np.sin(np.pi*cr/.5)*.15
    return reverb(out, .15, .6)
save("sfx_vitara_ovi_auki", door(False), 0.7); save("sfx_vitara_ovi_kiinni", door(True), 0.85)
start = np.concatenate([engine(.9, lambda x: 250 + 80*np.sin(2*np.pi*9*x), 1)*0.6, engine(1.6, lambda x: 800 + 1400*np.exp(-x/.3) , 2)])
save("sfx_vitara_kaynnistys", start, 0.8)
save("sfx_vitara_tyhjakaynti_loop", loopify(engine(4.3, lambda x: 800 + 0*x, 3), .3), 0.7)
save("sfx_vitara_ajo_loop", loopify(engine(4.3, lambda x: 2200 + 0*x, 4), .3), 0.7)
save("sfx_vitara_sammutus", engine(1.2, lambda x: 800*np.exp(-x/.35), 5)*np.linspace(1, 0, int(1.2*SR)), 0.7)
