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

## Kivääri ja kiikarit (generoi_kivaari_kiikarit.py)
Aja `python3 generoi_kivaari_kiikarit.py` → mallit/kivaari.glb, mallit/kiikarit.glb, hud/tahtain_kiikari.png, hud/kiikarit_naakyma.png. Esikatselu: /workspace/jahti_varmuus/esikatselu_kivaari_kiikarit.png. Sama sopimus kuin haulikossa: metrit, +Y ylös, +X oikea, piippu −Z, verteksivärit (COLOR_0), materiaalit `puu`, `teras` (sinistetty), `messinki` (ei käytössä), `kangas`. Kaikki nodet juuren lapsia, vain translation.

**mallit/kivaari.glb** (1772 tris), pulttilukko, piippu 0.6 m (z −0.16…−0.76, akseli y=0.018), perä z=+0.41. Origo = liipaisimen yläpää.
| Node | Pivot (m) | Sisältö |
|---|---|---|
| kivaari | (0,0,0) | juuri |
| runko | (0,0,0) | tukki, lukkokehys, piippu, liipaisinkaari, kiikarin renkaat/jalustat |
| lukko | (0, 0.018, 0.05) lukon akselilla | lukon vipu (osoittaa oikealle-alas). Avaus: **rotation.z ≈ +1.2 rad** (vipu ylös), sitten position.z += 0.09 (veto taakse) |
| liipaisin | (0,0,0) | kääntö rotation.x |
| kiikaritahtain | (0, 0.065, 0) | kiikari, optinen akseli y=0.065, takalinssi z=+0.115, objektiivi z=−0.25 |
| kasi_oikea / kasi_vasen | (0,0,0) | oikea kahvalla (etusormi liipaisimella), vasen etutukin alla z≈−0.30 |
| suu | (0, 0.018, −0.76) | tyhjä, piipun suu |
| silma | (0, 0.065, 0.195) | tyhjä, silmäpiste 0.08 m takalinssin takana; katso −Z → tähtäyslinja kiikarin akselilla (kiikari ~4.7 cm piipun yläpuolella) |

**mallit/kiikarit.glb** (1096 tris): juuri `kiikarit` (sisältää rungon meshin), lapset `kasi_oikea`, `kasi_vasen`. Origo okulaarien keskellä (okulaarit x=±0.033, z≈+0.012), objektiivit z=−0.165, tummanvihreä kumi + musta silta/tarkennuspyörä.

**HUD** (1024×1024 RGBA, musta + pehmeä ~70 px vinjetti): tahtain_kiikari.png aukko keskellä r=440, duplex-ristikko (ohut ~2 px keskellä, 12 px paksu |etäisyys keskeltä| > 150 px). kiikarit_naakyma.png kaksi ympyrää r=330 keskipisteet (347,512) ja (677,512).

## Riistaeläimet: mallit/elaimet/ (generoi_elaimet.py)
`python3 generoi_elaimet.py` → mallit/elaimet/*.glb + /workspace/jahti_varmuus/esikatselu_elaimet.png (sivukuvat, eri mittakaava/eläin).
Sama sopimus kuin v0.8 janis/ajokoira: metrit, +Y ylös, edessä +Z, origo maassa, COLOR_0, tasasävytys, ei luurankoa/animaatioita, jokainen node = oma mesh pivotin suhteen, nodeilla vain `translation`. v = +X, o = −X.

| Tiedosto | Mitat | Tris | Nodet |
|---|---|---|---|
| kettu.glb | säkä ≈0.40 m, korkeus 0.54 (korvat), pituus 0.97 m (häntä mukana) | 374 | runko, paa, korva_v/o, jalka_ev/eo/tv/to, hanta |
| peura.glb | säkä ≈0.95 m, sarvien kärki 1.54 m, pituus 1.25 m | 396 | + **kaula** (runko → kaula → paa); sarvet osa paa-nodea |
| orava.glb | vartalo ≈0.20 m, korkeus 0.24 (häntä), pituus 0.28 m | 264 | kuten kettu |
| teeri.glb | kukko, pituus 0.60 m, korkeus 0.32 m | 278 | runko, paa, siipi_v/o, pyrsto, jalka_v/o |
| korppi.glb | pituus 0.63 m, korkeus 0.29 m | 208 | kuten teeri |

Pivotit maailmakoordinaatteina (m), vanhempi suluissa:
```
kettu:  paa (0,.39,.21) kaulan tyvi | korva_v/o (±.035,.46,.27) (paa) | jalka_ev/eo (±.045,.30,.17) lapa | jalka_tv/to (±.045,.30,-.16) lonkka | hanta (0,.31,-.22)
peura:  kaula (0,.95,.33) (runko) | paa (0,1.22,.50) (kaula) | korva_v/o (±.06,1.34,.53) (paa) | jalka_ev/eo (±.09,.80,.33) | jalka_tv/to (±.09,.82,-.33) | hanta (0,.97,-.44)
orava:  paa (0,.09,.06) | korva_v/o (±.017,.125,.08) (paa) | jalka_ev/eo (±.025,.055,.055) | jalka_tv/to (±.025,.06,-.05) | hanta (0,.07,-.075)
teeri:  paa (0,.22,.12) | siipi_v/o (±.065,.22,.07) olkapää | pyrsto (0,.17,-.15) | jalka_v/o (±.04,.10,0) lonkka
korppi: paa (0,.19,.14) | siipi_v/o (±.055,.19,.09) olkapää | pyrsto (0,.14,-.15) | jalka_v/o (±.035,.08,0)
```

**Suositellut animaatiokulmat** (rad, jalat `rotation.x`: **negatiivinen = jalan kärki eteen**, positiivinen = taakse):
| Liike | Jalat (amplitudi) | Vaihe | Muuta |
|---|---|---|---|
| käynti | ±0.30 (peura ±0.25) | ristiin: ev & to samassa, eo & tv vastavaiheessa | paa.rotation.x ±0.05, hanta ±0.1 |
| juoksu (ravi/laukka) | ±0.6 (kettu, peura), orava ±0.5 | laukka: etujalat yhdessä, takajalat vaihe π (pieni 0.2 rad viive v/o) | runko.rotation.x ±0.08, kettu hanta.rotation.x +0.2 (häntä vaakaan) |
| loikka (peura/orava) | ponnistus: etujalat +0.6, takajalat +0.9 (taakse); ilmassa etujalat −0.8 (eteen), takajalat +0.3 | ponnistus yhtä aikaa | peura hanta.rotation.x = +0.8 (valkoinen "lippu" ylös) |
| linnun käynti | jalka_v/o ±0.35 vastavaiheessa | | paa.rotation.x nyökkäys ±0.15 |

Linnut, siivet: siipi on mallinnettu **kokoon taitettuna** selän sivulle (litteä Y:ssä, ulottuu taaksepäin). Istuva asento = lepoasento (kaikki kierrot 0); orressa voi laskea runkoa (jalka_v/o.rotation.x ≈ 0.3).
Lentoasento: aseta `siipi.rotation.order = 'ZYX'`, sitten **siipi_v.rotation.y = −π/2, siipi_o.rotation.y = +π/2** (siipi kääntyy sivulle levälleen, vaaka). Läpäytys `rotation.z`: **siipi_v positiivinen z = ylös, siipi_o negatiivinen z = ylös** (peilaa merkki). Amplitudi teeri ±0.6 rad nopeasti (~6 Hz) + liito 0; korppi ±0.45 rad ~3 Hz, liito z = +0.1/−0.1 (lievä V). Jalat lennossa rotation.x = +1.3 (taakse), pyrsto.rotation.x ≈ 0.

Puutteet: ei silmiä teerellä/korpilla erillisinä (pää yhtä väriä), sarvet yksinkertaiset (runko + 1 piikki/puoli), siiven lentoasento ei ole erillinen geometria (taitettu siipi vain käännetään), orava nelijalkaisessa asennossa (istuva vaatii runko.rotation.x ≈ −0.6 + jalkakiertoja).

## Heinikko (generoi_heina.py)
Lumen läpi pilkistävä kuiva heinikko InstancedMeshille. Origo tyvessä maassa, +Y ylös, metrit.

| Tiedosto | Huom. |
|---|---|
| tekstuurit/heina_kortti_1.png | 128×128 RGBA, kellertävä kuiva heinä, alareuna = maa |
| tekstuurit/heina_kortti_2.png | 128×128 RGBA, ruskeampi |
| mallit/heina/heinatupas_1.glb | korkeus 0.2 m, 2 ristikkäistä quadia (4 tris), kortti 2 |
| mallit/heina/heinatupas_2.glb | korkeus 0.4 m, 3 quadia (6 tris), kortti 1 |
| mallit/heina/heinatupas_3.glb | korkeus 0.6 m, 3 quadia (6 tris), kortti 2 |

- Quadin leveys = korkeus. Materiaali `heina`: baseColorTexture → `../../tekstuurit/heina_kortti_N.png` (ulkoinen URI), alphaMode MASK, cutoff 0.5, doubleSided, sampler Nearest/clamp. Ei verteksivärejä.
- Koodissa: `alphaTest: 0.5`, `side: THREE.DoubleSide`, tekstuurille `NearestFilter` (+ `colorSpace = SRGBColorSpace`). InstancedMeshissä käytä GLB:n geometriaa ja materiaalia; satunnainen Y-kierto/skaalaus per instanssi.
- Esikatselu: /workspace/jahti_varmuus/esikatselu_heina.png

## Tienvarsi ja rakennukset (generoi_tienvarsi.py)
Talviversiot Kurikan Street View -kuvien pohjalta. Metrit, +Y ylös, etu +Z, origo maassa, COLOR_0, tasasävytys, materiaali valkoinen (rough 1). Esikatselu: /workspace/jahti_varmuus/esikatselu_tienvarsi.png. Kaikissa yksi mesh-node (nimi = tiedosto); tyhjät nodet sen lapsina.

| Tiedosto | Mitat (m) | Tris | Nodet / huom. |
|---|---|---|---|
| mallit/tienvarsi/katuvalo.glb | pylväs 7.6, puomi +Z:aan, valaisin z 1.6–2.25, yläreuna 8.05 | 86 | `valo` (0, 7.78, 1.92) lasin alla |
| mallit/tienvarsi/sahkopylvas.glb | pylväs 9.0, poikkiorsi X-suunnassa ±1.0 @ y 8.35–8.5 | 98 | `johto_1` (−0.85, 8.72, 0), `johto_2` (0, 9.22, 0) pylvään latvassa, `johto_3` (0.85, 8.72, 0). Johdot kulkevat Z-suunnassa pylväästä toiseen |
| mallit/tienvarsi/vaistamismerkki.glb | kolmio sivu 0.9, kärki alas y 1.35, yläreuna 2.13 + lumihattu | 39 | etupuoli +Z |
| mallit/tienvarsi/opaste_mantykoski.glb | kilpi 1.6 × 0.4 @ y 1.6–2.0, 2 tolppaa | 62 | 2 primitiiviä: verteksivärit + tekstuuriquad (UV, materiaali `opaste_mantykoski_teksti`, ulkoinen URI `../../tekstuurit/kyltit/kyltti_mantykoski.png`, Nearest). Etupuoli +Z |
| tekstuurit/kyltit/kyltti_mantykoski.png | 256×64 RGBA | – | sininen, valkoinen reunus, "Mäntykoski" + nuoli oikealle, DejaVu Sans Bold ilman AA:ta |
| mallit/tienvarsi/aurausviitta.glb | keppi 2.0 (keltainen), punavalkoinen yläosa, oranssi heijastin +Z | 72 | |
| mallit/rakennukset/maatalous_navetta.glb | 10 × 24 (Z pitkä), kivijalka 1.0, räystäs 4.2, harja 7.6, hattu 8.6 | 374 | iso ovi +Z-päädyssä, sivuovi +X |
| mallit/rakennukset/maatalous_varasto.glb | 6 × 10, räystäs 3.2, harja 5.6 | 166 | ovi +Z |
| mallit/rakennukset/aitta.glb | 3.2 × 4, kulmakivillä, räystäs 2.3, harja 3.6 | 182 | ovi + porraskivi +Z |
| mallit/rakennukset/katos.glb | 6 × 12, 8 puupilaria, räystäs 3.6, harja 5.0, punainen takaseinä −Z | 144 | avoin +Z ja sivuilta |

Rakennukset: punamulta #8B2A1F, valkoiset nurkkalaudat/räystäslauta/ikkunanpuitteet, harmaa peltikatto 0.18 m lumilaatalla (pellin reuna näkyy räystäällä), lumi kivijalan päällä.
Puutteet: ei hirsi-/lautakuviota (tasaväri), päädyt kolmioina ilman räystään alapintaa, ikkunoissa vain yksi välipuite. Esikatselun painter-renderöinti piirtää isoja kolmioita väärässä järjestyksessä (seinän läpi näkyviä lumikolmioita) – mallit itse ovat kunnossa.

## Aloitusruutu (hud/)
- aloitus_tausta.png 1920×1080: generoitu (GenerateImage, tyyliref. referenssi_roope_1.png), skaalattu 1280×720 → 1920×1080 (LANCZOS, hieman pehmeä). Metsästäjä+koira keskellä-oikealla, yläosa väljä logolle.
- aloitus_tausta_mobiili.png 810×1080: pystyrajaus x=745–1555 (hahmot keskellä).
- logo_koppelontien_janis.png 1200×300 RGBA: DejaVu Sans Bold, kermainen teksti, tumma ääriviiva+varjo, oranssi alleviivaus. Tehty PIL:llä.
- Esikatselu: /workspace/jahti_varmuus/aloitus_esikatselu.png (logo 960×240 kohtaan (480,30)).

## HUD-pikatoimintokuvakkeet (hud/ikonit/)
- 128×128 RGBA, läpinäkyvä, ei laattaa: kerma/jäänsininen symboli, paksu tumma ääriviiva, pieni oranssi korostus. Generaattori grafiikka/generoi_ikonit.py (PIL, 4× → LANCZOS). Näppäinkirjainta ei piirretä.
- ikoni_kiikarit (B), ikoni_haulikko / ikoni_kivaari (Tab), ikoni_auto (E), ikoni_radio (R autossa), ikoni_kanava (Q/Tab autossa), ikoni_naru_kiinni / ikoni_naru_irti (F, vaihtaa tilaa), ikoni_gps (G/M, main.js:171).
- ikoni_kyykky (C): tehty etukäteen, kyykky tulossa koodiin (ei vielä main.js:ssä 22.10.2026).
- Ei tehty: pilli/huuto – ei näppäintä koodissa.
- Esikatselu: /workspace/jahti_varmuus/ikonit_esikatselu.png

## Saksanmetsästysterrieri (toisen pelaajan koira)
- `mallit/koira_jagdterrier.glb`, generaattori `generoi_jagdterrier.py` (`python3 generoi_jagdterrier.py`).
- Black and tan Jagdterrier, säkä ~0.35 m, korkeus ~0.46 m (pää), ~1150 kolmiota, vertex-värit, +Y ylös, +Z eteen, origo maassa.
- Samat nodet ja hierarkia kuin `ajokoira.glb`: runko > (paa > leuka, korva_v, korva_o), jalka_ev/eo/tv/to, hanta.
  Pivotit = ajokoiran pivotit × 0.565 (korvat hieman muokattu) → `V8.bindNodes`/`animDog` toimii sellaisenaan. Ei GLB-animaatioita.
- Huom: `animDog` makuuasento laskee runkoa absoluuttisesti 0.28 m (mitoitettu ajokoiralle); pienellä koiralla arvo pitäisi skaalata.

## Metsäkauris (generoi_kauris.py)
`python3 generoi_kauris.py` → `mallit/elaimet/kauris.glb` (pukki, lyhyet 3-haaraiset sarvet) ja `kauris_naaras.glb` (ei sarvia) + esikatselu `/workspace/jahti_varmuus/kauris_esikatselu.png`.
Käyttää generoi_elaimet.py:n apufunktioita (ell/box/legs4/write); solmut ja hierarkia täsmälleen kuin peura.glb (runko > kaula > paa > korva_v/o; runko > jalka_ev/eo/tv/to, hanta), jotta v09.js:n animQuad toimii. Säkä ~0,70 m, ruskeanharmaa talviturkki, iso valkoinen peili, lähes näkymätön häntä, tumma kuono + valkoinen leukaläiskä.
Koodi (v09.js) lataa toistaiseksi vain `kauris.glb`; naarasta ei vielä käytetä.
