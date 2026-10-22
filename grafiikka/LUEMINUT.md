# Koppelontien jänis – grafiikka v0.2

v0.2: peli renderöi ~640×400. Tiedostonimet ennallaan, vaikka nimen koko-pääte (_64/_32) ei enää vastaa todellista kokoa.

Tehty proseduraalisesti skriptillä `generoi.py` (Python + PIL + numpy, GLB kirjoitetaan käsin). Aja uudelleen komennolla `python3 generoi.py`.
Kaikki PNG:t on tarkoitettu NearestFilter-suodatukselle (retro). Läpinäkyvät = RGBA.

| Tiedosto | Koko | Huom. |
|---|---|---|
| tekstuurit/lumi_64.png | **128×128** (nimi ennallaan) | saumaton, rajattu paletti |
| tekstuurit/metsatie_64.png | **128×128** (nimi ennallaan) | saumaton; urat kulkevat pystysuunnassa (V), x≈36 ja x≈92 |
| tekstuurit/pelto_64.png | **128×128** (nimi ennallaan) | saumaton, sänkirivit vaakasuunnassa (U) |
| tekstuurit/taivas_256x128.png | 256×128 | toistuu vaakasuunnassa; yläreuna = zeniitti, alareuna = horisontti (sylinteri/kupoli) |
| tekstuurit/kuusi_billboard.png | **128×256** | RGBA, ankkuri alareunan keskellä (64,256) |
| tekstuurit/koivu_billboard.png | **96×256** | RGBA, ankkuri alareunan keskellä (48,256) |
| mallit/janis.glb | 824 tris | metsäjänis talviturkissa, mustat korvankärjet, pituus ≈0.55 m, korkeus 0.46 m |
| mallit/ajokoira.glb | 980 tris | suomenajokoira (kuono, luppakorvat, häntä, satula, valkoinen läsi/rinta/jalat), säkä ≈0.62 m, pituus ≈1.1 m |
| haulikko_fp.png | **512×256** | RGBA, sijoitus näytön oikeaan alakulmaan (kuvan oikea/ala-reuna = ruudun reuna) |
| haulikko_laukaus.png | **512×256** | sama + suuliekki, rekyyli +18px oikealle/+14px alas |
| haulikko_tahtays.png | 512×256 | RGBA tähtäysasento (piippujen yli). **Jyvän keskipiste (256,58)** (over-under, jyvä ylemmän piipun päällä): aseta kuva niin, että tämä piste osuu ruudun keskelle |
| haulikko_hihna.png | 512×256 | RGBA, vasen hanskakäsi pitää hihnaa; sijoita ruudun vasempaan alakulmaan (kuvan vasen/ala-reuna = ruudun reuna) haulikko_fp.png:n rinnalle. Hihna päättyy kuvan alareunan keskelle (256,256) |
| tekstuurit/hihna.png | 16×64 | talutushihna (oranssi nylon), toistuu pystysuunnassa (V); hihna x=3–12, reunat läpinäkyviä |
| hud/komento_irti.png, komento_kiinni.png, komento_tanne.png, komento_seuraa.png, komento_hae.png | 32×32 | RGBA komentokuvakkeet, tumma puoliläpinäkyvä pyöristetty tausta, ei näppäintekstiä; koodi voi piirtää numeron esim. oikeaan alakulmaan |
| jaljet/janis_jalki_32.png | **64×64** (nimi ennallaan) | RGBA, kulkusuunta = kuvan ylös; Y-kuvio: takakäpälät edessä, etukäpälät takana |
| jaljet/koira_jalki_32.png | **64×64** (nimi ennallaan) | RGBA, kulkusuunta ylös; kaksi soikeaa tassua kynsineen |
| hud/kompassi_256x32.png | 256×32 | RGBA, toistuu vaakasuunnassa; P x=0, I x=64, E x=128, L x=192 (1 px = 1.40625°) |
| hud/tuuli_nuoli_32.png | 32×32 | nuoli ylös; kierrä tuulen suunnan mukaan |
| hud/saalis_janis_24.png | 24×24 | saalisikoni |
| hud/tahtain_16.png | 16×16 | tähtäin, keskipiste (7,7) |
| hud/gps_kehys.png | 320×400 | RGBA GPS-kehys, läpinäkyvä näyttöaukko: **x=56, y=92, w=208, h=176** (pikseleinä kuvan vasemmasta yläkulmasta) |
| hud/gps_pelaaja.png, gps_koira.png, gps_koira_ajo.png, gps_koira_haku.png, gps_koira_hukka.png | 16×16 | RGBA; pelaajanuoli osoittaa ylös, koira katsoo oikealle |
| esikatselu.png | 1300×1800 | esikatselu (2–3× suurennos, mallit sivu- ja etukuvana) |

## Mallien konventiot
- Yksikkö metri, +Y ylös, eläin katsoo +Z, origo maassa rungon keskikohdan alla.
- Väri vertex-väreinä (COLOR_0), tasasävytys (kärjet duplikoitu per kolmio, normaalit mukana). Materiaali valkoinen, metallic 0, roughness 1 – käytä esim. MeshLambertMaterial({vertexColors:true}) tai GLTFLoaderin materiaalia.
- Ei animaatioita, ei luurankoa; liike/keinunta koodissa.

## Huomioita
- Jälkien varjosävy sinharmaa (128,146,170) alfalla ~150–170; piirrä decalina lumen päälle.
- Kompassin "P" piirretty myös oikeaan reunaan (x≈253) saumattomuuden vuoksi.

## v0.4
- Haulikko on nyt päällekkäispiippuinen (over-under): haulikko_fp/laukaus/tahtays. haulikko_hihna.png ennallaan (ase ei näy siinä).
- Tekstuurit viilennetty: matalampi saturaatio, sinertävä valo, kuuset/koivut sumuun sekoitettu, porrastetut sävyt (12 tason askel). GLB-värejä viilennetty hieman.
- Suositus koodiin: sumun väri **#B0BED2** (176,190,210), ambientti valo **#C8D4E8**, suuntavalo #F0F0F4 matala kulma.

## v0.4 mallit (generoi_mallit_v04.py)
Kaikki: metrit, +Y ylös, etuosa +Z, origo maassa, verteksivärit (COLOR_0), ei animaatioita. Esikatselu: mallit_esikatselu_v04.png.

| Tiedosto | Mitat | Tris | Nodet |
|---|---|---|---|
| mallit/mokki.glb | runko 6.0 (x) × 5.0 (z), räystäineen 6.7 × 5.9, harja 4.5 m (+lumi), piippu 5.2 m; kuisti ja portaat +Z-puolella (ulottuu z=4.05) | ~840 | `mokki` (juuri) → `mokki_runko` |
| mallit/vitara.glb | 3.6 (z) × 1.7 (x; peilit 1.9) × 1.7 m; vararengas takana ulottuu z=-2.04 | ~750 | `vitara` (juuri) → `vitara_kori`, `pyora_ev`, `pyora_eo`, `pyora_tv`, `pyora_to`, `ovi_kuljettaja`, `ovi_takaluukku` |

- Pyörät: noden origo = pyörän keskipiste (r=0.33 m, leveys 0.22), akseli X → pyöritä `rotation.x`. ev = etu vasen (+x), eo = etu oikea (-x), tv/to taka vasen/oikea. (Huom: +Z edessä, joten auton oma vasen on +X.)
- `ovi_kuljettaja` (0.90, 1.0, 0.10): tyhjä node kuljettajan oven ulkopuolella (vasemmanpuoleinen ohjaus, auton vasen = +X). `ovi_takaluukku` (0, 1.0, -2.10): takaluukun takana.
- Väri tummanvihreä #224830, mustat puskurit, ei logoja/tekstejä.

## v0.8 haulikko (generoi_haulikko_v08.py)
- haulikko_fp.png / haulikko_laukaus.png / haulikko_tahtays.png piirretty uudelleen realistisemmiksi (512×256 RGBA, sama sommittelu): pähkinätukki ja -etutukki syykuvioin + shakeeraus, sinistetty piippupari reunakorostuksin, tuuletettu kisko, harmaa kaiverrettu lukkokehys, avauskeli, liipaisinkaari, messinkihelmi, oliivinvihreä hanskakäsi kahvalla (fp/laukaus). Valo ylävasemmalta, rajattu paletti, ei antialiasointia.
- Laukaus: rekyyli +18 px oikealle / +14 px alas, suuliekki ylemmän piipun suulla.
- **Tähtäyshelmen keskipiste (256,58)** haulikko_tahtays.png:ssä (ennallaan).
- haulikko_hihna.png ennallaan.

## v0.8 mallit: janis.glb ja ajokoira.glb nodeiksi (generoi_mallit_v08.py)
Ei luurankoa, ei animaatioita. Jokainen node = oma mesh, geometria noden paikalliskoordinaatistossa (pivot = origo); nodeilla vain `translation` (ei rotaatiota/skaalaa), joten levossa malli on identtinen v0.7:n kanssa. Kierrä nodeja koodissa (esim. `obj.getObjectByName('paa').rotation.x`). Vasen (v) = +X, oikea (o) = −X (eläin katsoo +Z). e = etu, t = taka.
`generoi.py` ajaa lopuksi itse `generoi_haulikko_v08.py`:n ja `generoi_mallit_v08.py`:n, joten pelkkä `python3 generoi.py` tuottaa v0.8-version. Mallien lähteenä on generoi.py:n juuri kirjoittama yhden meshin mallit/*.glb; jos tiedosto on jo nodetettu (v08-skripti ajetaan yksin), lähteenä on /workspace/jahti_varmuus/*_v07.glb.

Pivotit maailmakoordinaatteina (m); suluissa vanhempi:

**janis.glb**
```
runko (juuri)            (0, 0, 0)
├─ paa (runko)           (0, 0.21, 0.10)     kaula
│  ├─ korva_v (paa)      (0.03, 0.29, 0.14)  korvan tyvi
│  └─ korva_o (paa)      (-0.03, 0.29, 0.14)
├─ jalka_ev (runko)      (0.035, 0.14, 0.10) lapa
├─ jalka_eo (runko)      (-0.035, 0.14, 0.10)
├─ jalka_tv (runko)      (0.07, 0.13, -0.11) lonkka (reisi + takakäpälä)
├─ jalka_to (runko)      (-0.07, 0.13, -0.11)
└─ hanta (runko)         (0, 0.17, -0.22)    hännän tyvi
```

**ajokoira.glb** (kaula kuuluu runkoon)
```
runko (juuri)            (0, 0, 0)
├─ paa (runko)           (0, 0.66, 0.31)     kaula/pään tyvi
│  ├─ leuka (paa)        (0, 0.655, 0.41)    leuan sarana; suu aukeaa rotation.x > 0 (positiivinen = leuka alas)
│  ├─ korva_v (paa)      (0.075, 0.74, 0.36) korvan tyvi
│  └─ korva_o (paa)      (-0.075, 0.74, 0.36)
├─ jalka_ev (runko)      (0.07, 0.43, 0.22)  lapa
├─ jalka_eo (runko)      (-0.07, 0.43, 0.22)
├─ jalka_tv (runko)      (0.07, 0.43, -0.22) lonkka
├─ jalka_to (runko)      (-0.07, 0.43, -0.22)
└─ hanta (runko)         (0, 0.58, -0.29)    hännän tyvi
```
Leuka = kuonon ellipsoidin alapuolisko (kolmiot, joiden painopiste y < 0.665); suun sisäpinta: paa-nodessa kuonon keskitason kiekko alaspäin (#3A1A1A, 8 kolmiota), leuka-nodessa sama kiekko ylöspäin kielenä (#7A2A2A, 8 kolmiota). Levossa kiekot ovat suljetun kuonon sisällä (ei näy); auki olevassa suussa ei ole aukkoa.

## v0.9 tutkapannan HUD-ikonit (generoi_gps_haukku.py)
| Tiedosto | Koko | Huom. |
|---|---|---|
| hud/gps_haukku_ajo.png | 24×24 | juokseva koira + ääniaallot, katsoo oikealle |
| hud/gps_haukku_seisonta.png | 24×24 | seisova koira, pystyt korvat, kuono ylös |
| hud/gps_haukku_haukku.png | 24×24 | haukku haukkua: istuva koira, harvat aallot |
| hud/gps_haukku_hiljaa.png | 24×24 | koira ilman aaltoja, himmeä (puoliläpinäkyvä) |
| hud/gps_suunta_nuoli.png | 16×16 | nuoli ylös (koiran kulkusuunta), kierrä koodissa |
| hud/gps_reitti_piste.png | 4×4 | oranssi #FF8C1A pyöreä piste reittiviivan piirtoon |

Ehdotus: reittiviivan väri **#FF8C1A**, häivytys alfa 1 → 0 (uusin piste alfa 1, vanhin 0).

## v0.9 mallit/vitara_sisa.glb (generoi_vitara_sisa.py)
Sama koordinaatisto kuin vitara.glb (aseta samaan transformiin, identtinen origo). **768 kolmiota.** Lasit puuttuvat tarkoituksella: tuulilasi, sivuikkunat ja takalasi ovat aukkoja. Materiaali `sisa` (verteksivärit, doubleSided) ja `radio_paneeli` (baseColorTexture → `../hud/radio_paneeli.png`, Nearest-sampler, clamp). Ei logoja.

| Node | translation (m) | Huom. |
|---|---|---|
| `vitara_sisa` (juuri) | (0,0,0) | |
| `sisa_kori` | (0,0,0) | kojelauta, mittaristo (nopeus x=0.30, kierrokset x=0.50; y=1.03, z≈0.30, tummat kiekot r=0.075 + valkoiset viivat), istuimet, takapenkki, sisäkatto, verhoilut |
| `ratti` | (0.40, 0.98, 0.18) | rotation = 25° X-akselin ympäri (quat [0.2164,0,0,0.9763]). Rattikehä paikallisessa XY-tasossa, r=0.19. **Akseli = paikallinen +Z**, joka osoittaa maailmassa (0, −0.423, 0.906) eli eteen-alas kohti kojelautaa. Ohjaus: `ratti.rotation.z = kulma` (Euler-järjestys XYZ säilyttää x=25°:n kallistuksen) |
| `vaihdekeppi` | (0, 0.70, 0.22) | pivot kepin tyvessä, keppi +Y |
| `radio_naytto` | (0, 0.84, 0.355) | quad 0.20 × 0.05 m (4:1), normaali −Z (matkustamoon), UV 0..1: u=0 +X-reuna (kuljettajan vasen), v=0 yläreuna |
| `kamera_kuljettaja` | (0.40, 1.15, −0.55) | tyhjä, katse +Z |
| `koira_paikka` | (0, 0.58, −1.50) | tyhjä, tavaratilan lattia takapenkin takana |

Esikatselu: /workspace/jahti_varmuus/vitara_sisa_esikatselu.png.

## ERÄ 1: kasvillisuus (generoi_kasvit.py)
`python3 generoi_kasvit.py` → mallit/kasvit/*.glb + /workspace/jahti_varmuus/esikatselu_era1_puut.png.
Metrit, +Y ylös, +Z edessä, origo rungon tyvessä maassa, verteksivärit (COLOR_0), tasasävytys, yksi node/mesh, materiaali valkoinen (roughness 1).

| Tiedosto | Korkeus | Tris | Huom. |
|---|---|---|---|
| kuusi_1.glb | 6.0 m | 122 | 4 oksakerrosta, Ø≈3.4 m |
| kuusi_2.glb | 9.5 m | 150 | 5 kerrosta |
| kuusi_3.glb | 13.0 m | 178 | 6 kerrosta, kapea |
| kuusi_4.glb | 16.0 m | 202 | 6 kerrosta, leveä (Ø≈6.7 m) |
| koivu_1.glb | 11.0 m | 106 | valkoinen runko mustin laikuin, paljaat oksat, lumitäpliä |
| koivu_2.glb | 8.0 m | 106 | |
| manty_1.glb | 13.0 m | 78 | punaruskea ylärunko, 3 lumista latvuspilveä |
| manty_2.glb | 10.2 m | 78 | |
| taimi_1.glb | 0.6 m | 87 | lumikinos tyvellä |
| taimi_2.glb | 1.4 m | 87 | |
| kanto_1.glb | 0.58 m (lumineen) | 58 | lumihattu, juurenniskat |
| kanto_2.glb | 0.88 m | 58 | |
| kaatunut_runko_1.glb | 0.76 m, pituus 5.0 m (Z-akseli) | 66 | lumiharja päällä, oksantyngät |

## Kyltit (generoi_kyltit.py)
Aja `python3 generoi_kyltit.py`. Fontti DejaVu Sans Bold ilman antialiasointia (ä/ö tarkistettu). RGBA, NearestFilter. Esikatselu: /workspace/jahti_varmuus/esikatselu_kyltit.png.

| Tiedosto | Koko px | Koko maailmassa | Huom. |
|---|---|---|---|
| tekstuurit/kyltit/kyltti_koppelontie.png (+ _vasen) | 256×64 | **1.40 × 0.35 m** | sininen #0057A8, valkoinen reunus, kärki oikealle (_vasen: kärki vasemmalle, teksti luettava). Kärki 26 px ≈ 0.14 m; läpinäkyvä kärjen ympärillä → alphaTest 0.5 |
| tekstuurit/kyltit/kyltti_loyhingintie.png (+ _vasen) | 256×64 | 1.40 × 0.35 m | 'Löyhingintie' |
| tekstuurit/kyltit/kyltti_ylivallintie.png (+ _vasen) | 256×64 | 1.40 × 0.35 m | 'Yli-Vallintie' + tienumerokilpi '6921' |
| tekstuurit/kyltit/kyltti_osoite_30.png | 64×32 | **0.40 × 0.20 m** | musta, valkoinen '30', vaalea reunaviiva |
| tekstuurit/kyltit/postilaatikko_teksti.png | 128×32 | 0.20 × 0.05 m | nimilappu 'Koppelontie 30' |

Kyltit: koko kuva = koko quad, UV (0,0) vasen ala … (1,1) oikea ylä (flipY=true, Three.js-oletus). Tolpat tekee koodi.

**mallit/kyltit/postilaatikko.glb** (110 tris): puutolppa 0.10×0.10 m, laatikko 0.32 (x) × 0.50 (z), kaareva katto, korkeus ≈1.42 m, punainen lippu +X-sivulla, origo maassa, etupääty +Z. Kaksi primitiiviä: materiaali `postilaatikko` (COLOR_0) ja `nimilappu` (quad 0.20×0.05 m, keskipiste (0, 1.095, 0.252), normaali +Z, UV 0..1 koko kuva → aseta map = postilaatikko_teksti.png).

## FP-haulikko 3D (generoi_haulikko_3d.py)
Aja `python3 generoi_haulikko_3d.py` → **mallit/haulikko.glb** (1648 tris, 6 mesh-nodea + tyhjä `suu`). Esikatselu: /workspace/jahti_varmuus/haulikko_3d_esikatselu.png (sivukuva, FP, tähtäys kiskoa pitkin).
Over-under, metrit, +Y ylös, **piiput −Z**, oikea = +X. **Origo = liipaisimen yläpää / pistoolikahvan kohta.** Kokonaispituus 1.15 m (perä z=+0.418 … suu z=−0.74; kädet ja hihat ulottuvat taakse/alas).
Materiaalit (kaikissa COLOR_0, baseColor valkoinen): `puu`, `teras` (sinistetty), `hopea` (lukkokehys, kaiverrus tummina verteksiväripintoina), `messinki`, `kangas` (hanskat, oranssi #FF6A00 hiha, harmaa heijastinraita, kumiperälevy).

| Node | Vanhempi | Pivot (vanhemman koord.) | Sisältö |
|---|---|---|---|
| haulikko | – | (0,0,0) | juuri |
| runko | haulikko | (0,0,0) | tukki+kahva+perälevy, lukkokehys, liipaisinkaari |
| liipaisin | haulikko | (0,0,0) = liipaisimen yläpää | kääntö rotation.x |
| kasi_oikea | haulikko | (0,0,0) | hanska kahvalla, etusormi liipaisimella, hiha |
| piiput | haulikko | (0, 0.005, −0.07) saranatappi | piiput, kisko+tukipalat, etutukki. **Taitto alas = NEGATIIVINEN rotation.x** (≈ −0.6 rad); positiivinen nostaa suuta |
| helmi | piiput | (0, 0.0535, −0.663) → maailma (0, 0.0585, −0.733) | messinkihelmi kiskon kärjessä |
| kasi_vasen | piiput | (0,0,0) (verteksit piippujen koordinaateissa) | vasen hanska etutukin alla, taittuu piippujen mukana |
| suu | piiput | (0, 0.035, −0.67) → maailma (0, 0.04, −0.74) | tyhjä, yläpiipun suu (suuliekki) |

Maailmakoordinaatit (taittamaton):
- Kiskon tähtäyslinja: silmäpiste ehdotus **(0, 0.080, 0.23)** → helmi **(0, 0.0585, −0.733)** (kiskon yläpinta y≈0.0565). Kameran voi asettaa silmäpisteeseen ja katsoa helmeen.
- Suuaukot: ylä (0, 0.040, −0.74), ala (0, 0.018, −0.74); piipun Ø 21 mm.
- Patruunapäät (hylsyt, piippujen takapää/sarana): ylä (0, 0.040, −0.07), ala (0, 0.018, −0.07); taitettuna kierrä saranan (0,0.005,−0.07) ympäri.
