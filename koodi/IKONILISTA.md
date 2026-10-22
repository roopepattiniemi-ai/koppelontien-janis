# Ikonilista

Uudet HUD-ikonit ovat kansiossa `hud/ikonit/` (repon juuressa), nimetty `ikoni_*.png`. Palvelin tarjoaa ne polussa `/hud/ikonit/`.

## Pikapalkki (alareuna, `#cmds` main.js)

| Näppäin | Ikoni | Teksti | DOM-id |
|---|---|---|---|
| F | /hud/ikonit/ikoni_naru_irti.png ↔ ikoni_naru_kiinni.png | naru | cmdF |
| 1 | /grafiikka/hud/komento_tanne.png | tänne | – |
| 2 | /grafiikka/hud/komento_seuraa.png | seuraa | – |
| 3 | /grafiikka/hud/komento_etsi.png | etsi | – |
| 4 | /grafiikka/hud/komento_tanne.png | täällä | – |
| C | /hud/ikonit/ikoni_kyykky.png | kyykky (keltainen kun päällä) | kyykky |
| G / M | /hud/ikonit/ikoni_gps.png | GPS (keltainen kun auki) | gps-ikoni (`gps` on jo GPS-laitteen div) |

Komennoille 1–4 ei vielä ole ikoni_*-versioita (puuttuu: ikoni_tanne, ikoni_seuraa, ikoni_etsi, ikoni_taalla); ne käyttävät vanhoja komento_*.png-kuvia.

## Grafiikkabotin 10 ikonia (hud/ikonit/, kaikki säilytetty)
ikoni_auto, ikoni_gps, ikoni_haulikko, ikoni_kanava, ikoni_kiikarit, ikoni_kivaari, ikoni_kyykky, ikoni_naru_irti, ikoni_naru_kiinni, ikoni_radio (.png). Käytössä: naru_irti/kiinni (F), kyykky (C), gps (G/M).

## Käyttämättä (valmiina hud/ikonit/)
ikoni_auto.png, ikoni_haulikko.png, ikoni_kivaari.png, ikoni_kiikarit.png, ikoni_radio.png, ikoni_kanava.png

## Muut
grafiikka/hud/: tahtain_16, tahtain_kiikari, kompassi_256x32, tuuli_nuoli_32, saalis_janis_24, gps_*, radio_paneeli, logo, aloitus_tausta*.
Vitaran radion alla oleva tarra "R radio päälle – Q kanavan vaihto" piirretään koodissa canvas-tekstuurina (v08.js), ei kuvatiedostoa. Sen alla samanlainen tarra "E – ulos autosta".
Koiramalli: `?koira=terrieri` → grafiikka/mallit/koira_jagdterrier.glb (DOG_K 0.565: makuu 0.16 m, pomppu 0.017 m); kutsulinkki välittää rodun vieraalle.
