#!/usr/bin/env python3
"""Puhe v2 (v0.9): Piper TTS (fi_FI-harri-medium) + sox/ffmpeg-jälkikäsittely.
- pelaajan huudot: huutava sävy, metsän ulkotilakaiku (puurajan heijastukset + hajakaiku)
- radiotunnukset ja juonnot: radio-EQ, kanavan biisi hiljaa taustalla
- humalaiset kuulijatervehdykset: hidas sammaltava puhe, puhelin-EQ 300-3400 Hz, syntetisoitu lasien/tölkkien kilinä + nauru
Aja generoi_radio_v2.py ensin (taustamusiikki /tmp/radio_v2/*_m.wav)."""
import numpy as np, subprocess, os, wave
D = os.path.dirname(os.path.abspath(__file__)); SR = 44100
MODEL = "/workspace/piper/fi_FI-harri-medium.onnx"; TMP = "/tmp/puhe_v2"; os.makedirs(TMP, exist_ok=True)
def sh(*a): subprocess.run(a, check=True)
def tts(text, out, length=1.0, noise=.667, noise_w=.8, cents=0, tempo=1.0):
    raw = f"{out}.raw.wav"
    subprocess.run(["python3","-m","piper","-m",MODEL,"-f",raw,"--length-scale",str(length),"--noise-scale",str(noise),"--noise-w",str(noise_w)],
                   input=text.encode(), check=True, capture_output=True)
    sh("sox", raw, "-r", "44100", "-c", "1", out, "pitch", str(cents), "tempo", "-s", str(tempo), "silence", "1", "0.02", "0.3%", "reverse", "silence", "1", "0.02", "0.3%", "reverse")
def rd(p):
    with wave.open(p) as w: x = np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(float)/32768; ch = w.getnchannels()
    return x.reshape(-1, ch).mean(1)
def wr(p, x):
    x = np.asarray(x); x = np.stack([x, x], 1) if x.ndim == 1 else x; x = x/(np.abs(x).max()+1e-9)*.7
    with wave.open(p, "wb") as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x*32767).astype("<i2").tobytes())
def enc(src, dst, af):
    af += ",loudnorm=I=-16:TP=-1.5,alimiter=limit=0.85:level=false"
    for ext, a in (("ogg", ["-c:a","libvorbis","-q:a","5"]), ("mp3", ["-c:a","libmp3lame","-b:a","160k"])):
        sh("ffmpeg","-y","-loglevel","error","-i",src,"-af",af,"-ar","44100","-ac","2",*a,f"{dst}.{ext}")

# ---------- pelaajan huudot ----------
HUUDOT = {"tanne": "Tänne!", "hae": "Hae!", "seuraa": "Seuraa!", "irti": "Irti!", "etsi": "Etsi!", "taalla": "Tule tänne, täällä!"}
AANET = {1: dict(cents=120, length=.95, noise=.75), 2: dict(cents=-260, length=1.05, noise=.8)}  # 1 = kirkkaampi, 2 = matalampi mies
def huuto(key, n):
    p = f"{TMP}/h_{key}_{n}.wav"; tts(HUUDOT[key], p, **AANET[n])
    x = rd(p); x = np.concatenate([np.zeros(int(.03*SR)), x, np.zeros(int(1.6*SR))]); dry = f"{TMP}/h_{key}_{n}_d.wav"; wr(dry, x)
    wet = f"{TMP}/h_{key}_{n}_w.wav"
    # huutava sävy: presence-korostus + kevyt saturaatio; metsä: kaukaiset heijastukset puurajasta ja avoin hajakaiku
    sh("sox", dry, wet, "highpass", "140", "equalizer", "2600", "1.2q", "+5", "equalizer", "300", "1q", "-3", "overdrive", "6", "30",
       "compand", "0.005,0.1", "-60,-60,-25,-14,0,-8", "-3", "gain", "-n", "-6",
       "echos", "0.85", "0.9", "230", "0.22", "410", "0.14", "690", "0.08",
       "reverb", "28", "60", "85", "100", "20", "-4", "lowpass", "7500", "gain", "-n", "-3")
    for dst in (f"aani_{key}_{n}",) + ((f"aani_tule_tanne_jaljilla_{n}",) if key == "taalla" else ()):
        enc(wet, os.path.join(D, dst), "afade=t=out:st=0.0:d=0.01,anull" if False else "anull")

# ---------- radio ----------
PERSOONA = {"parkano": dict(cents=-330, length=1.05, noise=.7, tempo=1.0),   # rouhea, matala, rento
            "country": dict(cents=-120, length=1.25, noise=.6, tempo=.95),   # leppoisa, hidas
            "tekno": dict(cents=280, length=.82, noise=.7, tempo=1.1)}       # energinen, nopea, korkea
HUMALA = dict(length=1.6, noise=.9, noise_w=1.2)
BIISI = {"parkano": "radio_parkano_1", "country": "radio_country_1", "tekno": "radio_tekno_1"}
RADIO_EQ = "highpass=f=110,lowpass=f=7500,equalizer=f=180:t=q:w=1:g=3,equalizer=f=3000:t=q:w=1.2:g=4,acompressor=threshold=-22dB:ratio=4:attack=5:release=120:makeup=3"
PUHELIN_EQ = "highpass=f=300,highpass=f=300,lowpass=f=3400,lowpass=f=3400,equalizer=f=1500:t=q:w=1:g=4,acompressor=threshold=-20dB:ratio=6:attack=3:release=80:makeup=4"
rng = np.random.default_rng(909)
def kilinat(n):
    """syntetisoitu baarin tausta: lasien kilinä (epäharmoniset osasävelet), tölkin aukeaminen ja puheensorina."""
    out = np.zeros(n); tt = np.arange(int(.9*SR))/SR
    for _ in range(int(n/SR*1.3)):
        i = rng.integers(0, max(1, n - len(tt))); f0 = rng.uniform(1800, 3200)
        c = sum(np.sin(2*np.pi*f0*k*tt)*np.exp(-tt*(6 + 3*k))/k for k in (1, 2.76, 5.4)); out[i:i+len(tt)] += c*rng.uniform(.05, .15)
    for _ in range(max(1, int(n/SR/6))):  # tölkki: pssht
        i = rng.integers(0, n - SR); m = int(.35*SR); z = rng.standard_normal(m)*np.exp(-np.arange(m)/SR/.12)
        Z = np.fft.rfft(z); f = np.fft.rfftfreq(m, 1/SR); Z *= (f > 2500); out[i:i+m] += np.fft.irfft(Z, m)*.15
    b = rng.standard_normal(n); B = np.fft.rfft(b); f = np.fft.rfftfreq(n, 1/SR); B *= np.exp(-((f - 500)/350)**2)
    out += np.fft.irfft(B, n)*(1 + .6*np.sin(2*np.pi*.7*np.arange(n)/SR))*.04  # sorina
    return out
def naurut(n, k):
    out = np.zeros(n)
    for j in range(k):
        p = f"{TMP}/naur_{j}.wav"; tts(rng.choice(["Hahhahhahhaa!", "Hehhehheh!", "Ahahhahaa!"]), p, cents=int(rng.uniform(-400, 400)), length=.9)
        x = rd(p)*rng.uniform(.25, .4); i = int(rng.uniform(.25, .75)*max(1, n - len(x))); out[i:i+len(x)] += x[:n-i]
    return out
def juonto(name, kanava, text, humala=False, tausta=True):
    tn = name.replace("/", "_"); p = f"{TMP}/{tn}.wav"
    tts(text, p, **(dict(HUMALA, cents=PERSOONA[kanava]["cents"]//2 - 60) if humala else PERSOONA[kanava]))
    v = rd(p); lead = int(.4*SR); n = len(v) + lead + int(.8*SR); mix = np.zeros(n); mix[lead:lead+len(v)] = v
    if humala:  # sammallus: hidas sävelhuojunta, sitten taustahäly
        vv = f"{TMP}/{tn}_v.wav"; wr(vv, mix); vw = f"{TMP}/{tn}_vw.wav"
        sh("ffmpeg","-y","-loglevel","error","-i",vv,"-af","vibrato=f=0.9:d=0.25,aecho=0.6:0.3:25:0.3",vw); mix = rd(vw)[:n]
        mix = mix/np.abs(mix).max() + kilinat(n)*1.4 + naurut(n, 3); src = f"{TMP}/{tn}_mix.wav"; wr(src, mix)
        out = f"{TMP}/{tn}_ph.wav"
        sh("ffmpeg","-y","-loglevel","error","-i",src,"-af",PUHELIN_EQ+",acrusher=bits=11:mix=0.3",out)
        enc(out, os.path.join(D, name), "anull"); return
    vf = f"{TMP}/{tn}_vf.wav"; wr(vf, mix); veq = f"{TMP}/{tn}_veq.wav"
    sh("ffmpeg","-y","-loglevel","error","-i",vf,"-af",RADIO_EQ,veq); voice = rd(veq); voice /= np.abs(voice).max()
    if tausta:
        m = rd(f"/tmp/radio_v2/{BIISI[kanava]}_m.wav"); st = int(rng.uniform(1.5, 10)*SR); bg = m[st:st+n]; bg = np.pad(bg, (0, max(0, n - len(bg))))
        fade = np.ones(n); a = int(.3*SR); fade[:a] = np.linspace(0, 1, a); fade[-int(.8*SR):] = np.linspace(1, 0, int(.8*SR))
        voice = voice + bg/(np.abs(bg).max()+1e-9)*.14*fade
    src = f"{TMP}/{tn}_mix.wav"; wr(src, voice); enc(src, os.path.join(D, name), "anull")

TUNNUKSET = {"parkano": "Parkano Rock!", "country": "Jalasjärven Kantri!", "tekno": "Koppelontien Tekno!"}
JUONNOT = {
 "parkano": [
  ("Iltaa, metsämiehet. Täällä Parkano Rock, ja ulkona pakkasta kaksikymmentäviisi astetta. Pitäkää piiput lämpiminä ja hanat kiinni, kunnes jänis tulee näkyviin.", False),
  ("Kuulkaa, jäniksen kanssa on niinku treffeillä. Pitää olla kärsivällinen, hiljaa kuusikossa, ja kun se vihdoin tulee, älä hosu. Seuraavaksi raskasta kamaa, kuunnelkaa.", False),
  ("Moro, täällä Rötkö Vitaran takapenkiltä! Oltiin saunassa ja nyt ollaan ihan... kuusikossa. Terveisiä koko porukalle, ja Pertsalle, joka ampui taas ohi!", True),
  ("Ajokoira haukkuu, haulikko on ladattu ja kahvi on termarissa. Mitä muuta mies tarvitsee? No ehkä vähän lisää kitaraa. Tässä tulee!", False)],
 "country": [
  ("No kyllä tuota, täällä on Jalasjärven Kantri, ja lunta tullee ihan tuiskuna. Ei oo kiirettä mihinkään, laitetaan kahvit tulelle ja kuunnellaan.", False),
  ("Terveisiä Jalasjärven saunaillasta! Täällä Hilkka ja Toivo. Kyllä tuota, löyly oli niin kova, että Toivon pipo meni kuusikkoon. Soittakaa jotain kaunista!", True),
  ("Se oli tuota semmonen jänis, että kun koira sen ajoi kierrokselle, niin isäntä sanoi, et ei oo kiirettä, kyllä se takaisin tullee. Ja niinhän se tuli, ja meni taas.", False),
  ("Kurikan seudulla on pakkasta ja tähtitaivas. Kyllä tuota, täs on hyvä meneä takapenkille lämpimään. Seuraavaksi hidas valssi kaikille Vitaran kuskeille.", False)],
 "tekno": [
  ("Hei hei hei, Koppelontien Tekno! Pakkasta riittää, bassoa riittää, ja jänis pomppii samaan tahtiin! Nostetaan kädet ilmaan ja tumput käteen!", False),
  ("Ajokoira on paras tanssija. Koko yön ympyrää, nenä maassa, häntä pystyssä! Seuraava biisi on omistettu kaikille koirille, jotka eivät koskaan väsy!", False),
  ("Jouuu! Tässä Mökö ja Jänskä takapenkiltä! Nyt etitään autoa kuusikosta. Terkkuja Koppelontien bileisiin, soittakaa jumputusta!", True),
  ("Muistakaa: haulikko ja tanssilattia vaativat molemmat hyvää ajoitusta. Liian aikaisin, ja jänis nauraa. Täällä Koppelontien Tekno, nyt mennään!", False)]}

# Uudet välijuonnot 5–8. Vanhoja 1–4 ei generoida uudestaan.
UUSI_JUONNOT = {
 "parkano": [
  ("Koppelontiellä on lunta polveen ja keli on peilijää. Ajakaa hiljaa, ja jos näette jäniksen, se on jo nähnyt teidät.", False),
  ("Täällä on Masa pellon reunasta! Vitara on ojassa mutta radio soi. Pertsalle terveiset, ensi kerralla tähtää vähän vasemmalle!", True),
  ("Ajokoira löysi yön jäljen ja kiersi navetan kolmesti. Isäntä ehti juoda kahvit. Näin sen pitää mennä. Seuraavaksi lisää kitaraa.", False),
  ("Pakkasta puree poskia ja termari pitää lupauksensa. Parkano Rock, pysykää kanavalla.", False)],
 "country": [
  ("No kyllä tuota, Kurikassa paistaa kuu ja tie on valkoinen. Ei oo hoppua, annetaan koiran tehdä työnsä.", False),
  ("Se oli tuota semmonen passi, että istuttiin kannon nokassa tunnin ja jänis tuli ihan viereen. Ei ammuttu. Kahvi oli vielä kuumaa.", False),
  ("Hilkka tässä taas! Toivo hukkasi lapaset saunan taakse. Soittakaa valssi, niin löytyvät aamulla.", True),
  ("Jalasjärven Kantri toivottaa hyvää jahtia. Pitäkää hanskat kädessä ja mieli lämpimänä.", False)],
 "tekno": [
  ("Koppelontien Tekno! Basso pohjaan ja nenä lumeen! Jänis ei odota, älä sinäkään!", False),
  ("Koira tekee ympyrää, me tehdään droppi. Kun haukku nousee, nousee tempo. Nyt!", False),
  ("Jänskä tässä takakontista! Mökö nukkuu ja radio ei. Terkkuja kaikille jotka etsivät autoa väärästä metsästä!", True),
  ("Muistakaa tumput ja turvaväli. Koppelontien Tekno, biisi pyörii ja jänis myös.", False)]}

if __name__ == "__main__":
    import sys
    if "--uudet-juonnot" in sys.argv:
        for k, lst in UUSI_JUONNOT.items():
            for i, (txt, hum) in enumerate(lst, 5):
                print(f"juonto {k} {i}")
                juonto(f"radio/juonto_{k}_{i}", k, txt, humala=hum)
        print("uudet juonnot ok")
        raise SystemExit(0)
    if "--vain-juonnot" not in sys.argv:
      for key in HUUDOT:
        for n in (1, 2): huuto(key, n)
    for k, txt in TUNNUKSET.items():
        juonto(f"radio_{k}_tunnus", k, txt)
        for ext in ("ogg", "mp3"): sh("cp", os.path.join(D, f"radio_{k}_tunnus.{ext}"), os.path.join(D, f"radio_tunnus_{k}.{ext}"))
    for k, lst in JUONNOT.items():
        for i, (txt, hum) in enumerate(lst, 1): juonto(f"radio/juonto_{k}_{i}", k, txt, humala=hum)
    print("puhe ok")
