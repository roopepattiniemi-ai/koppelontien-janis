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
| amb_talvimetsa_tuuli_loop | 30 s tuuli ja metsä: puuskat, oksilta putoava lumi ja kaukainen tiainen (saumaton) |
| musiikki_valikko_talvi | rauhallinen kantele- ja jousimattobiisi, 66 BPM, noin 58 s, loop |

Haukun kuuluvuus toteutetaan pelin koodissa: etäisyys säätää äänenvoimakkuutta ja alipäästöä, tuuli säätää äänenvoimakkuutta.
