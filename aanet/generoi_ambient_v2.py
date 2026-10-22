from generoi_aanet import *
def ambient2():
    dur = 63.0; tt = t(dur)
    def slow(cut, seed):
        r = np.random.default_rng(seed); x = filt(r.standard_normal(len(tt)), None, cut); return (x - x.mean())/(x.std() + 1e-9)
    gust = np.clip(0.5 + 0.28*slow(0.08, 1) + 0.12*slow(0.3, 2), 0.12, 1.0)
    def layer(seed, lo, hi):
        r = np.random.default_rng(seed); return filt(r.standard_normal(len(tt)), lo, hi)
    # pehmeä humina: matala runko + keskikaista vain puuskissa, ei korkeaa sihinää (>900 Hz poistettu)
    L = layer(10, 60, 380)*gust + layer(11, 250, 800)*gust**2.5*0.35
    R = layer(12, 60, 380)*np.roll(gust, int(1.5*SR)) + layer(13, 250, 800)*np.roll(gust, int(1.5*SR))**2.5*0.35
    for _ in range(4):  # lumi putoaa oksalta, pehmeä tömähdys
        i = rng.integers(3*SR, len(tt) - 3*SR); ct = t(0.5)
        plop = filt(rng.standard_normal(len(ct)), 120, 900)*env(len(ct), .02, .1)*0.4
        L[i:i+len(ct)] += plop*rng.uniform(.3, 1); R[i:i+len(ct)] += plop*rng.uniform(.3, 1)
    st = np.stack([loopify(L, 3.0), loopify(R, 3.0)], 1)
    save("amb_talvimetsa_tuuli_loop", st, 0.4)
ambient2()
