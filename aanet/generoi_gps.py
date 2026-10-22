from generoi_aanet import *
def beep(f, d, g=1.0):
    tt = t(d); return np.sign(np.sin(2*np.pi*f*tt))*0.5*np.minimum(1, tt/.003)*np.minimum(1, (d-tt)/.005)*g
z = lambda s: np.zeros(int(s*SR))
save("sfx_gps_avaus", np.concatenate([beep(1800,.06), z(.04), beep(2400,.08), z(.2)]), 0.4)
save("sfx_gps_sulku", np.concatenate([beep(2400,.06), z(.04), beep(1600,.08), z(.2)]), 0.4)
save("sfx_gps_piippaus", np.concatenate([beep(2000,.05), z(.25)]), 0.35)
save("sfx_gps_haukkuindikaattori", np.concatenate([beep(2600,.04), z(.04), beep(2600,.04), z(.04), beep(2600,.04), z(.3)]), 0.35)
save("sfx_gps_hukka", np.concatenate([beep(1400,.25), z(.1), beep(1100,.35), z(.2)]), 0.35)
