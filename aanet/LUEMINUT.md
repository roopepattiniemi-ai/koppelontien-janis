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
| aani_taalla_1..2 | v0.4: "Tule tänne, täällä!" jäljillä, kaksi ääntä |
| aani_etsi_1..2 | v0.4: "Etsi!" (korvaa aani_hae_*, joka jää varalle) |

## Vitara (v0.4)
| sfx_vitara_ovi_auki / _ovi_kiinni | ovi (E) |
| sfx_vitara_kaynnistys / _sammutus | moottori käyntiin ja sammuksiin |
| sfx_vitara_tyhjakaynti_loop / _ajo_loop | 4 s loopit; säädä ajossa nopeuden mukaan playbackRatea 0.8–1.5 ja ristihäivytä loopien välillä |
| sfx_koira_hyppy | v0.5: koira hyppää Vitaran kyytiin (ponnistus, tömähdys, pannan kilinä) |

## Vitaran radio (v0.6)
| radio_parkano_1..2 | Parkano Rock: hard rock, noin 1:41 |
| radio_country_1..2 | Jalasjärven Country: banjo, boom-chak-basso ja lap steel, noin 1:38 |
| radio_tekno_1..2 | Koppelontien Tekno: 90-luvun acid/rave, noin 1:41 |
| radio_parkano_tunnus, radio_country_tunnus, radio_tekno_tunnus (myös radio_tunnus_*) | juontajan tunnus kanavalle vaihdettaessa |
| sfx_radio_kanava | kanavanvaihdon kohina (0,45 s) |
Biisit loppuvat häivytykseen. Soita kanavan biisit vuorotellen.
