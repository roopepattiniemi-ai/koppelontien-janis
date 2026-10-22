# Koppelontien jänis: äänet (MVP)
Pääosa äänistä on syntetisoitu itse (`python3 generoi_aanet.py`). **v0.9 aidot äänitteet** (lähteet ja lisenssit ovat tiedostossa LAHTEET.md): sfx_askel_lumi_1..4, sfx_kavely_lumi_loop, amb_talvimetsa_tuuli_loop, amb_korppi_1..2, amb_tikka_1, sfx_vitara_kaynnistys ja sfx_vitara_tyhjakaynti_loop. Synteettiset alkuperäiset ovat kansiossa /workspace/jahti_varmuus/aanet_synteettinen/. Jokaisesta äänestä on sekä .ogg- että .mp3-versio, ja Phaser lataa ne muodossa `[ogg, mp3]`.

| Tiedosto | Käyttö |
|---|---|
| sfx_koira_haukku_1..4 | lyhyitä löytöhaukkuja ("vau") v0.8 |
| sfx_koira_haukku_5..6 | kumeita ulvovia ajohaukkuja ("vouuu", noin 1 s) v0.8 |
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
| amb_talvimetsa_tuuli_loop | 60 s pehmeä, vaihteleva tuuli ja oksilta putoava lumi. v0.2: korkea sihinä poistettu, saumaton 3 s ristihäivytys. v0.9: aito äänite, 45 s |
| amb_korppi_1..2 | v0.9 aito: korpin raakkaus (1,5 s), soita satunnaisesti tuulen päälle |
| amb_tikka_1 | v0.9 aito: palokärjen rummutus (4,2 s), satunnaisesti |
| amb_korppi_lento_1 | v1.0 aito: korppiparvi raakkuu lennossa (1,6 s), satunnaisesti tuulen päälle |
| amb_tiainen_1..2 | v1.0 aito: talitiainen (2,8 s) ja hömötiainen (2,1 s), satunnaisesti |
| sfx_kettu_haukahdus_1..2 | v1.0 aito: ketun kiljaisu (1,2 s) |
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
| radio_parkano_1..2 | v0.9: Parkano Rock, särökitarat L/R, basso, rummut, soolokitara, 1:26–1:27 |
| radio_country_1..2 | v0.9: Jalasjärven Country, akustinen komppi, banjo, viulu, boom-chak-basso, 1:28 |
| radio_tekno_1..2 | v0.9: Koppelontien Tekno, 808-rummut, acid-basso, pad, arpeggio, stabit, 1:28–1:32 |
| radio_parkano_tunnus, radio_country_tunnus, radio_tekno_tunnus | juontajan tunnus kanavalle vaihdettaessa |
| sfx_radio_kanava | kanavanvaihdon kohina (0,45 s) |
Biisit loppuvat häivytykseen. Soita kanavan biisit vuorotellen.

| sfx_teeri_pyrahdus_1..2 | teeren räjähtävä lentoonlähtö (1,5 / 1,7 s) – itse syntetisoitu (generoi_elaimet_v09.py), ei lisenssirajoitusta |
| amb_teeri_kuherrus_1 | teeren kuherrus ja tsuish-sihaus (6 s) – itse syntetisoitu (generoi_elaimet_v09.py), ei lisenssirajoitusta |
| sfx_peura_pakenee_1 | peuran varoitusprustaus ja loittonevat loikat (2,5 s) – itse syntetisoitu (generoi_elaimet_v09.py), ei lisenssirajoitusta |
| sfx_kivaari_laukaus | kiväärin terävä laukaus ja metsäkaiku (3 s) – itse syntetisoitu (generoi_elaimet_v09.py), ei lisenssirajoitusta |
| sfx_kivaari_lataus | kiväärin lukon veto: nosto, taakse, eteen, lukitus (1 s) – itse syntetisoitu (generoi_elaimet_v09.py), ei lisenssirajoitusta |

## v0.9: radio ja puhe uusittu
Biisit tehdään skriptillä generoi_radio_v2.py. Se kirjoittaa MIDIn, renderöi sen FluidSynthillä ja FluidR3_GM-soundfontilla ja masteroi ffmpegillä (EQ, kompressori, loudnorm −14 LUFS, limitteri, huippu noin −1…−3 dBFS). Ääneen generoidaan skriptillä generoi_puhe_v2.py, joka käyttää Piper TTS:ää ja ääntä fi_FI-harri-medium. Aja ensin generoi_radio_v2.py, koska tunnusten ja juontojen taustamusiikki otetaan /tmp:stä. Vanhat versiot ovat kansiossa /workspace/jahti_varmuus/aanet_v09_ennen/.
- Pelaajan huudot (aani_*): huutava EQ ja saturaatio sekä metsän kaiku (puurajan heijastukset ja hajakaiku). Ääni _1 on kirkkaampi ja _2 matalampi. aani_tule_tanne_jaljilla_* ovat edelleen aani_taalla_*:n kopioita.
- Tunnukset (radio_*_tunnus ja kaksoiskappaleet radio_tunnus_*): juontaja, radio-EQ ja kanavan biisi hiljaa taustalla.

### Radiojuonnot (radio/juonto_<kanava>_1..4, 9–19 s)
Persoonat: Parkano on matala ja rento, Country hidas ja leppoisa, Tekno nopea ja korkea. Tähdellä (*) merkityt ovat humalaisia kuulijatervehdyksiä puhelinlinjalta. Niissä puhe on hidasta ja huojuvaa, ääni puhelin-EQ:lla (300–3400 Hz) ja taustalla on syntetisoitua lasien ja tölkkien kilinää ja naurua. Nimet on keksitty.

| Tiedosto | Teksti |
|---|---|
| juonto_parkano_1 | Iltaa, metsämiehet. Täällä Parkano Rock, ja ulkona pakkasta kaksikymmentäviisi astetta. Pitäkää piiput lämpiminä ja hanat kiinni, kunnes jänis tulee näkyviin. |
| juonto_parkano_2 | Kuulkaa, jäniksen kanssa on niinku treffeillä. Pitää olla kärsivällinen, hiljaa kuusikossa, ja kun se vihdoin tulee, älä hosu. Seuraavaksi raskasta kamaa, kuunnelkaa. |
| juonto_parkano_3 * | Moro, täällä Rötkö Vitaran takapenkiltä! Oltiin saunassa ja nyt ollaan ihan... kuusikossa. Terveisiä koko porukalle, ja Pertsalle, joka ampui taas ohi! |
| juonto_parkano_4 | Ajokoira haukkuu, haulikko on ladattu ja kahvi on termarissa. Mitä muuta mies tarvitsee? No ehkä vähän lisää kitaraa. Tässä tulee! |
| juonto_country_1 | No kyllä tuota, täällä on Jalasjärven Kantri, ja lunta tullee ihan tuiskuna. Ei oo kiirettä mihinkään, laitetaan kahvit tulelle ja kuunnellaan. |
| juonto_country_2 * | Terveisiä Jalasjärven saunaillasta! Täällä Hilkka ja Toivo. Kyllä tuota, löyly oli niin kova, että Toivon pipo meni kuusikkoon. Soittakaa jotain kaunista! |
| juonto_country_3 | Se oli tuota semmonen jänis, että kun koira sen ajoi kierrokselle, niin isäntä sanoi, et ei oo kiirettä, kyllä se takaisin tullee. Ja niinhän se tuli, ja meni taas. |
| juonto_country_4 | Kurikan seudulla on pakkasta ja tähtitaivas. Kyllä tuota, täs on hyvä meneä takapenkille lämpimään. Seuraavaksi hidas valssi kaikille Vitaran kuskeille. |
| juonto_tekno_1 | Hei hei hei, Koppelontien Tekno! Pakkasta riittää, bassoa riittää, ja jänis pomppii samaan tahtiin! Nostetaan kädet ilmaan ja tumput käteen! |
| juonto_tekno_2 | Ajokoira on paras tanssija. Koko yön ympyrää, nenä maassa, häntä pystyssä! Seuraava biisi on omistettu kaikille koirille, jotka eivät koskaan väsy! |
| juonto_tekno_3 * | Jouuu! Tässä Mökö ja Jänskä takapenkiltä! Nyt etitään autoa kuusikosta. Terkkuja Koppelontien bileisiin, soittakaa jumputusta! |
| juonto_tekno_4 | Muistakaa: haulikko ja tanssilattia vaativat molemmat hyvää ajoitusta. Liian aikaisin, ja jänis nauraa. Täällä Koppelontien Tekno, nyt mennään! |

- musiikki_aloitus (.ogg/.mp3, generoi_aloitus.py): aloitusruudun 45 s saumaton looppi. CC BY 4.0 -lähteet: tuuli Gravity Sound (amb_talvimetsa_tuuli_loop), kaukainen ajohaukku Benboncan, Freesound 65888 (sfx_koira_ajo_harva). Melodia FluidSynth + FluidR3_GM.
