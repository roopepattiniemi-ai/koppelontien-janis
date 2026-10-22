from generoi_aanet import *
import subprocess
def pilli(name, pattern):
    out = []
    for f, d in pattern:
        if f == 0: out.append(np.zeros(int(d*SR))); continue
        tt = t(d); ff = f*(1 + 0.004*np.sin(2*np.pi*28*tt)); ph = 2*np.pi*np.cumsum(ff)/SR
        s = np.sin(ph) + 0.15*np.sin(2*ph) + filt(rng.standard_normal(len(tt)), 2500, 5000)*0.04
        out.append(s*np.minimum(1, tt/.01)*np.minimum(1, (d - tt)/.02))
    out.append(np.zeros(int(.6*SR))); save(name, reverb(np.concatenate(out), .3, 2.0), 0.7)
pilli("sfx_pilli_lyhyt", [(2900,.18)])
pilli("sfx_pilli_tanne", [(2900,.15),(0,.08),(2900,.15),(0,.08),(2900,.15)])
pilli("sfx_pilli_pitka", [(2900,.9)])
def huuto(name, text, voice):
    w = f"/tmp/{name}.wav"
    subprocess.run(["espeak-ng","-v",voice,"-s","150","-p","38","-a","180","-w",w,text], check=True)
    for ext, a in (("ogg",["-c:a","libvorbis","-q:a","5"]),("mp3",["-c:a","libmp3lame","-b:a","160k"])):
        subprocess.run(["ffmpeg","-y","-loglevel","error","-i",w,"-af","highpass=f=120,lowpass=f=6000,aecho=0.8:0.5:180|420:0.25|0.12,loudnorm=I=-16","-ar","44100","-ac","2",*a,f"{name}.{ext}"], check=True)
for v in ("m1","m3"):
    n = 1 if v == "m1" else 2
    huuto(f"aani_tanne_{n}", "Tänne!", f"fi+{v}"); huuto(f"aani_hae_{n}", "Hae!", f"fi+{v}")
    huuto(f"aani_seuraa_{n}", "Seuraa!", f"fi+{v}"); huuto(f"aani_irti_{n}", "Irti!", f"fi+{v}")
# hihnan naksahdus
out = np.zeros(int(.4*SR)); ct = t(.03)
for st in (0, .07):
    c = (np.sin(2*np.pi*2300*ct) + filt(rng.standard_normal(len(ct)), 2000))*np.exp(-ct/.004); i = int(st*SR); out[i:i+len(c)] += c
save("sfx_hihna_naksahdus", out, 0.6)
