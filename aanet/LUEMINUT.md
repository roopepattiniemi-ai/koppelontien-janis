# Koppelontien jänis: äänet (MVP)
Kaikki on syntetisoitu itse (`python3 generoi_aanet.py`), eikä mukana ole samplejä. Jokaisesta äänestä on sekä .ogg- että .mp3-versio, ja Phaser lataa ne muodossa `[ogg, mp3]`.

| Tiedosto | Käyttö |
|---|---|
| sfx_koira_haukku_1..4 | lyhyitä ajohaukkuja, joista koodi rakentaa rytmin (tiheä rytmi = jänis lähellä) |
| sfx_koira_haukku_5..6 | pitkiä ulvovia ajohaukkuja |
| sfx_koira_ajo_tiivis / _harva | valmiit ajojaksot, joissa jänis on lähellä tai jälki vanhempi |
| sfx_koira_ylosotto | jänis lähtee liikkeelle, koira kiljahtaa ja aloittaa ajon |
| sfx_koira_nuuhkii / _hidas | haku ja hukan kiertäminen |
| sfx_koira_vinkuu | hukka, hiljainen vinkuna |
| sfx_koira_juoksu_lumi | koiran tassut lumessa |
| sfx_haulikko_laukaus | laukaus ja metsän kaiku (3,5 s) |
| sfx_haulikko_lataus | taittuvan haulikon lataus |
| sfx_askel_lumi_1..4 | yksittäisiä askelia, valitse satunnaisesti |
| sfx_kavely_lumi_loop | kävelyloop |
| sfx_janis_pakoloikka | jäniksen pakoloikat |
| amb_talvimetsa_tuuli_loop | 60 s pehmeä, vaihteleva tuuli ja oksilta putoava lumi. v0.2: korkea sihinä poistettu, saumaton 3 s ristihäivytys |
| musiikki_valikko_talvi | rauhallinen kantele- ja jousimattobiisi, 66 BPM, noin 58 s, loop |

Haukun kuuluvuus toteutetaan pelin koodissa: etäisyys säätää äänenvoimakkuutta ja alipäästöä, tuuli säätää äänenvoimakkuutta.

## GPS (v0.2)
| sfx_gps_avaus / _sulku | laitteen avaus ja sulkeminen (M/G) |
| sfx_gps_piippaus | sijaintipäivityksen piippaus |
| sfx_gps_haukkuindikaattori | kolme nopeaa piippausta: koira haukkuu ajossa |
| sfx_gps_hukka | kaksi laskevaa piippausta: koira hukassa |
