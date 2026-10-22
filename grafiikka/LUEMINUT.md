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
