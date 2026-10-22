# Koppelontien jänis – suunnitteludokumentti v0.1

Omistaja: Roope · Koordinointi: Pelimestari · Pohja: `TUTKIMUS_janis_ja_ajokoira.md`
Merkintä **(AVOIN)** = ratkaisematta, ks. Avoimet kysymykset.

## 1. Nimi
**Koppelontien jänis** (päätetty 22.10.2026).

## 2. Visio
- Rauhallinen, realistinen jänisjahtisimulaattori talvimetsässä.
- Ensimmäisen persoonan kuvakulma, 90-luvun lopun retro-3D: matalaresoluutioiset tekstuurit, sumu.
- Ydinkokemus: jälkien lukeminen, koiran ajon kuunteleminen, passin valinta ja kärsivällinen odotus.

## 3. Alusta ja tekniikka
- Ensin selaimessa, Three.js.
- Myöhemmin mahdollisesti ladattava PC-peli (esim. Electron) ilman uudelleenkirjoitusta → koodi ei saa riippua selainkohtaisista ominaisuuksista, joita Electron ei tue.
- Moninpeli linkillä, kuten tiimin aiempi peli (sama ratkaisu/infra uudelleen) **(AVOIN: tekninen toteutus)**.

## 4. Maailma
- Todellinen paikka: Jalasjärvi, Kurikka, Kollinmäki–Koppelontie (n. 62.377 N, 22.927 E).
- Maasto OpenStreetMap- ja korkeusdatasta: metsät, pellot, metsätiet **(AVOIN: alueen koko, korkeusdatan lähde)**.
- Talvi, lumi, jänisten jäljet.
- Alueella voi esiintyä metsäjänis ja rusakko (tulkinta levinneisyydestä): metsäjänis metsissä, rusakko pelloilla ja pellonreunoilla.
- Muut eläimet (ei saa ampua): hirvi, kettu, metso, orava. Kettu voi sotkea jälkiä.
- Metsämökki: tallennus, varusteiden vaihto, saalisvalokuvat seinällä.
- Yöllä kuutamo ja revontulet.

## 5. Pelimuodot
- **Yksinpeli.**
- **Yhteistyö**: samassa jahdissa; radiopuhelin pelaajien välillä.
- **Kilpailu**: kuka saa eniten jäniksiä.

## 6. Pelaaja, ase ja koira
- Ase: haulikko; pelaaja valitsee aseen **(AVOIN: vaihtoehdot)**.
- Pelaaja valitsee koiran. Koirilla on nimet ja luonteet, esim.:
  - *Innokas*: nopea ylösotto, mutta karkaa/ajaa kauas, ajaa joskus karkkojänistä.
  - *Hidas mutta varma*: hidas ajo, ei juuri koskaan hukkaa jälkeä.
- Rotuvaihtoehdot tutkimuksesta: suomenajokoira, beagle, dreeveri **(AVOIN: mitkä mukaan)**.
- Kadonnut koira etsitään haukun ja GPS-pannan piippausten avulla.

## 7. Ajoneuvo
- Suzuki Vitara, ajetaan metsäteillä paikasta toiseen.
- Voi juuttua lumeen → lapioidaan irti (minipeli/toiminto).

## 8. Jäniksen tekoäly (tilakone)
Perustuu tutkimukseen; luvut säädettäviä.
1. **RUOKAILU** (yö/hämärä): liikkuu ruokapuiden (haapa, paju, koivu, pihlaja) välillä, jättää ~40 cm loikkajälkeä ja papanoita.
2. **MAKUULLE_MENO** (aamu): siirtyy kauemmas, tekee ≥3 paluuperää (muutamia kymmeniä m) + sivuloikka (≥1 m); makuu esim. kuusentaimen alle, pää tulosuuntaan.
3. **MAKUU**: kuuntelee. Pysyy paikallaan pitkään; lähtee kun uhka pysähtyy lähelle tai on astumassa päälle. Pakkasella herkempi lähtö, suojasäällä pitää makuun.
4. **VAROVAINEN_PAKO**: 10–30 m, pysähtyy kuuntelemaan.
5. **AJOSSA**: kiertää ≤ ~1 km halkaisijan alueella, toistaa reittejä, käyttää teitä etenkin lumella. Säätää vauhtia koiran haukun etäisyyden mukaan; tekee temppuja (paluuperä, sivuloikka, tieosuus) → koiralle hukka.
6. **PALUU / SIIRTYMÄ**: palaa usein lähtöalueelle, mutta ei aina; joskus siirtyy kauas uuteen kiertoon.
- Havainto: kuulo (pitkä kantama), näkö (liike). Liikkumaton pelaaja voi jäädä huomaamatta muutaman metrin päästä.
- Haju/tuuli: pelissä jänis voi aistia metsästäjän myötätuulesta, **mutta hajuaistin osuus on tutkimuksessa epävarma** → säädettävä/kevyt vaikutus.
- Rusakko-variantti: pellot ja metsäsaarekkeet, ei valkoinen, nopeampi, siksak, uppoaa syvään lumeen.

## 9. Koiran tekoäly (tilakone)
1. **HAKU**: itsenäiset laajenevat lenkit, käy välillä pelaajan luona, hiljaa.
2. **YÖJÄLKI**: löytää yöjäljen, selvittää sitä.
3. **YLÖSOTTO**: selvittää paluuperät, jänis lähtee.
4. **AJO**: haukkuu kun varma; haukun rytmi kertoo etäisyyden jänikseen.
5. **HUKKA**: hiljenee, kiertää hukkakohtaa laajenevin kehin, palaa AJOON löytäessään.
6. **KADONNUT**: koira ajaa kauas/kuulumattomiin → pelaaja etsii haukun ja GPS-piippausten avulla.
- Luonneparametrit: hakuvauhti, kantama, ajovarmuus (hukkatodennäköisyys), taipumus ajaa takajälkeen tai vaihtaa karkkojänikseen, tottelevaisuus (kytkeminen).

## 10. Äänimalli: haukun kuuluvuus
Kuuluvuus = f(etäisyys, tuulen suunta, maastonmuoto/mäet, metsän tiheys, lumipeite, lumi puissa).
- Myötätuuli kantaa, vastatuuli vaimentaa; mäki välissä varjostaa; tiheä ja luminen metsä vaimentaa.
- Haukusta pelaaja päättelee ajon suunnan ja kierron.
- GPS-panta: kartta koiran sijainnista + piippaus/haukkuindikaattori **(AVOIN: onko oletuksena päällä vai helpotus)**.

## 11. Passimekaniikka
- Pelaaja valitsee passin oletetulta reitiltä (tienvarret, kohdat joissa jänis on aiemmin kulkenut), näkyvyys tulosuuntaan.
- Liike passissa nostaa jäniksen havaintoa; aseen hidas nosto vs. nopea nosto.
- Passin vaihto turvallisinta, kun ajo on kaukana (haukku peittää äänet).

## 12. Jälkien lukeminen
- Kuvio: kaksi isoa (takajalat) edessä rinnan, kaksi pientä takana → suunta isojen jälkien puolelle.
- Loikka ~40 cm vs. pakoloikka jopa ~4 m (parijälki).
- Metsäjänis: leveä, pyöreäkärkinen; rusakko: kapea, teräväkärkinen.
- Tuore vs. vanha: terävyys, lumisade täyttää vanhat; yön lumisade → aamulla vain yöjäljet. (Tutkimuksessa EPÄVARMA, pelisääntö.)
- Paluuperä: jälki tuplaantuu ja loppuu → etsi sivulta.
- Ketun jäljet voivat sotkea.

## 13. Sää, aika ja selviytyminen
- Vuorokausi: päivällä jänis makuulla, hämärässä liikkeellä; yöllä kuutamo/revontulet.
- Pakkanen, lumisade; vaikuttavat jäniksen käytökseen, jälkiin ja kuuluvuuteen.
- Lämpömittari pakkasessa; nuotio ja termospullo lämmittävät. Nuotion savu/haju voi paljastaa pelaajan.

## 14. Saaliin käsittely ja trofeet
- Saaliin käsittely ammuttuaan **(AVOIN: kuinka yksityiskohtainen)**.
- Saalisvalokuva → mökin seinälle.
- Metsästysaika todellisuudessa 1.9.–28.2.; pelin päivämäärä talvikaudella **(AVOIN: näytetäänkö kausi)**.

## 15. Visuaalinen ja äänityyli
- Low-poly, matalaresoluutioiset tekstuurit, sumu peittää etäisyyden.
- Äänet keskeisiä: haukku, tuuli, lumen narina, laukaus, radio, Vitaran moottori.

## 16. Tiimi ja työnjako
- **Pelimestari**: koordinointi, priorisointi, dokumentti.
- **Koodaribotti**: Three.js-moottori, tekoälyt, maasto OSM-datasta, moninpeli.
- **Grafiikkabotti**: low-poly mallit, tekstuurit, eläimet, Vitara, mökki.
- **Musiikkibotti**: ääniefektit (haukut eri koirille), ambienssi, musiikki.
- Käyttörajoite: kevyt kehitys; **vähintään 25 % viikoittaisesta käytöstä varataan muille boteille**. Pienet iteraatiot, yksi ominaisuus kerrallaan.

## 17. MVP (ensimmäinen raakaversio)
- Yksinpeli selaimessa, Three.js.
- Pieni maastoalue Kollinmäen ympäristöstä (yksinkertaistettu OSM: metsä, pelto, yksi metsätie).
- Päivävalo, sumu, lumi; kiinteä tuuli.
- Yksi koira (suomenajokoira, yksi luonne) ja yksi haulikko.
- Metsäjänis: tilakoneet MAKUU → AJOSSA (kierto) → PALUU; yksinkertaiset paluuperät.
- Koira: HAKU → YLÖSOTTO → AJO → HUKKA.
- Haukun kuuluvuus: etäisyys + tuuli (muut tekijät myöhemmin).
- Jäljet lumessa (suunta), passi ja ammunta, saalislaskuri.

## 18. Myöhemmät versiot
- v0.2: jälkien ikä, lumisade, vuorokausi, pakkanen + lämpömittari, nuotio/termos, metsän tiheys ja maasto äänimalliin.
- v0.3: useampi koira/luonne, koiran katoaminen + GPS-panta, aseen valinta, rusakko.
- v0.4: Vitara, juuttuminen ja lapiointi, laajempi kartta.
- v0.5: mökki (tallennus, varusteet, saalisvalokuvat), saaliin käsittely.
- v0.6: muut eläimet (hirvi, kettu jälkineen, metso, orava), kuutamo ja revontulet.
- v0.7: moninpeli linkillä: yhteistyö + radio, kilpailu.
- Myöhemmin: Electron-paketointi PC:lle.

## Avoimet kysymykset
1. ~~Pelin nimi~~ – päätetty: Koppelontien jänis.
2. Kartta-alueen koko ja korkeusdatan lähde (esim. MML?).
3. Moninpelin tekninen toteutus: sama ratkaisu kuin aiemmassa pelissä – mikä se tarkalleen on?
4. Aseiden vaihtoehdot ja realismitaso (ammusten valinta?).
5. Mitkä koirarodut ja kuinka monta luonnetta.
6. GPS-pannan rooli: aina käytössä vai vaikeustason mukaan.
7. Hajun/tuulen vaikutuksen voimakkuus (tieteellinen pohja epävarma).
8. Saaliin käsittelyn yksityiskohtaisuus.
9. Rangaistus kielletyn eläimen ampumisesta (peli päättyy, sakko, varoitus?).
10. Näytetäänkö metsästyskausi/päivämäärä; vaikuttaako kiima (helmikuu) jäniksiin.
11. Kilpailutilan säännöt (aikaraja, sama koira vai omat koirat).
12. Tuoreen ja vanhan jäljen erottelu: pelisääntöjen tarkistus asiantuntijalta.
