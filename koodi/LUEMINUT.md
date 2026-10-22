# Koppelontien jänis – MVP-koodi
Käynnistys: `npm install && npm start` (PORT-ympäristömuuttuja, oletus 3000) → http://localhost:3000. Testit: `npm test` (pelkkä Node).
Ohjaus: WASD, hiiri, Vaihto = juoksu, P = passi (liike purkaa passin ja paljastaa), klikkaus = ammu, R = lataa.

Rakenne: `server.js` (plain http; /three = node_modules/three, /logic, /grafiikka = ../grafiikka, /aanet = ../aanet), `public/` (index.html, main.js Three.js),
`logic/` (Node-yhteensopiva: hare.js, dog.js, hearing.js, shot.js, world.js), `test/run.js`.

## Odotetut assetit (puuttuva → proseduraalinen varamuoto)
grafiikka/: tekstuurit/{lumi,metsatie,pelto}_64.png, tekstuurit/taivas_256x128.png (myös juuresta), tekstuurit/{kuusi,koivu}_billboard.png,
mallit/{janis,ajokoira}.glb (m, Y ylös, kuono +Z, vertexColors), haulikko_fp.png, haulikko_laukaus.png (rekyyli 10px oik., 8px alas),
jaljet/{janis,koira}_jalki_32.png (yläreuna = kulkusuunta), hud/kompassi_256x32.png (P=0, I=64, E=128, L=192), hud/tuuli_nuoli_32.png, hud/saalis_janis_24.png, hud/tahtain_16.png, haulikko_tahtays.png (jyvä 256,58), haulikko_hihna.png, tekstuurit/hihna.png, hud/komento_{irti,kiinni,tanne,seuraa,hae}.png, hud/gps_kehys.png (320x400, näyttöalue nyt oletusinsetti 10%/12%/80%/64%), hud/gps_{pelaaja,koira,koira_ajo,koira_haku,koira_hukka}.png (16x16).
aanet/ (.ogg, varana .mp3): sfx_pilli_{lyhyt,tanne,pitka}, sfx_hihna_naksahdus, aani_{tanne,hae,seuraa,irti}_{1,2}, sfx_koira_haukku_1..6, sfx_koira_ajo_tiivis, sfx_koira_ajo_harva, sfx_koira_ylosotto, sfx_koira_nuuhkii, sfx_koira_nuuhkii_hidas,
sfx_koira_vinkuu, sfx_koira_juoksu_lumi, sfx_haulikko_laukaus, sfx_haulikko_lataus, sfx_askel_lumi_1..4, sfx_kavely_lumi_loop, sfx_janis_pakoloikka,
amb_talvimetsa_tuuli_loop, sfx_gps_{avaus,sulku,piippaus,haukkuindikaattori,hukka}, musiikki_valikko_talvi (ladataan, valikkosoitto ei vielä käytössä).
