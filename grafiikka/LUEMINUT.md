# Koppelontien jänis – grafiikka

Tehty proseduraalisesti skriptillä `generoi.py` (Python + PIL + numpy, GLB kirjoitetaan käsin). Aja uudelleen komennolla `python3 generoi.py`.
Kaikki PNG:t on tarkoitettu NearestFilter-suodatukselle (retro). Läpinäkyvät = RGBA.

| Tiedosto | Koko | Huom. |
|---|---|---|
| tekstuurit/lumi_64.png | 64×64 | saumaton, rajattu paletti |
| tekstuurit/metsatie_64.png | 64×64 | saumaton; urat kulkevat kuvan pystysuunnassa (V), x≈18 ja x≈46 |
| tekstuurit/pelto_64.png | 64×64 | saumaton, sänkirivit vaakasuunnassa (U) |
| tekstuurit/taivas_256x128.png | 256×128 | toistuu vaakasuunnassa; yläreuna = zeniitti, alareuna = horisontti (sylinteri/kupoli) |
| tekstuurit/kuusi_billboard.png | 64×128 | RGBA, ankkuri alareunan keskellä (32,128) |
| tekstuurit/koivu_billboard.png | 48×128 | RGBA, ankkuri alareunan keskellä (24,128) |
| mallit/janis.glb | 328 tris | metsäjänis talviturkissa, pituus ≈0.52 m, korkeus 0.45 m (korvat) |
| mallit/ajokoira.glb | 384 tris | suomenajokoira, säkä ≈0.62 m, pituus ≈1.08 m (kuono–häntä) |
| haulikko_fp.png | 256×128 | RGBA, sijoitus näytön oikeaan alakulmaan (kuvan oikea/ala-reuna = ruudun reuna) |
| haulikko_laukaus.png | 256×128 | sama + suuliekki, rekyyli +10px oikealle/+8px alas |
| jaljet/janis_jalki_32.png | 32×32 | RGBA, kulkusuunta = kuvan ylös; Y-kuvio: takakäpälät edessä, etukäpälät takana |
| jaljet/koira_jalki_32.png | 32×32 | RGBA, kulkusuunta ylös; kaksi soikeaa tassua kynsineen |
| hud/kompassi_256x32.png | 256×32 | RGBA, toistuu vaakasuunnassa; P x=0, I x=64, E x=128, L x=192 (1 px = 1.40625°) |
| hud/tuuli_nuoli_32.png | 32×32 | nuoli ylös; kierrä tuulen suunnan mukaan |
| hud/saalis_janis_24.png | 24×24 | saalisikoni |
| hud/tahtain_16.png | 16×16 | tähtäin, keskipiste (7,7) |
| esikatselu.png | 1100×1400 | esikatselu (2–3× suurennos, mallit sivu- ja etukuvana) |

## Mallien konventiot
- Yksikkö metri, +Y ylös, eläin katsoo +Z, origo maassa rungon keskikohdan alla.
- Väri vertex-väreinä (COLOR_0), tasasävytys (kärjet duplikoitu per kolmio, normaalit mukana). Materiaali valkoinen, metallic 0, roughness 1 – käytä esim. MeshLambertMaterial({vertexColors:true}) tai GLTFLoaderin materiaalia.
- Ei animaatioita, ei luurankoa; liike/keinunta koodissa.

## Huomioita
- Jälkien varjosävy sinharmaa (128,146,170) alfalla ~150–170; piirrä decalina lumen päälle.
- Kompassin "P" piirretty myös oikeaan reunaan (x≈253) saumattomuuden vuoksi.
