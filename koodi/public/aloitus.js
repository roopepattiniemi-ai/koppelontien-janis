// v1.0: aloitusruutu (overlay ennen peliä). Kuvat/tunnari vaihtuvat oikeisiin kun tiedostot ilmestyvät (uusi yritys 15 s välein).
import { RIISTAKAMERA } from '../logic/config.js';
export const OHJEET=[
 ['WASD','liiku',['KeyW','KeyA','KeyS','KeyD']],['Hiiri','katso'],['Vaihto','juokse',['ShiftLeft']],['Vasen hiiri','nosta ase / ammu'],['Oikea hiiri','tähtää'],
 ['Tab / rulla','vaihda ase (haulikko ↔ kivääri)',['Tab']],['Rulla tähdätessä','kiikarin zoomi (kivääri)'],['B','kiikarit',['KeyB']],['R','lataa',['KeyR']],
 ['F','naru irti / kiinni',['KeyF']],['1','koira tänne',['Digit1']],['2','koira seuraa',['Digit2']],['3','koira etsi',['Digit3']],['4','täällä',['Digit4']],
 ['G / M','GPS-panta (pieni / iso / pois)',['KeyG','KeyM']],['+ / −','GPS-zoomi (GPS auki) tai resoluutio',['Equal','Minus','NumpadAdd','NumpadSubtract']],
 ['C','kyykky päälle/pois (matalampi katse, hidas liike)',['KeyC']],['L','grafiikka Matala/Keski/Photo realistic',['KeyL']],['Riista','jänis ja teeri haulikolla (teeri myös lennosta), valkohäntäpeura ja metsäkauris kiväärillä, kettu harvinaisena saaliina haulikolla; orava, korppi ja tiainen rauhoitettuja. Lumisade haalistaa vanhoja jälkiä, mutta yöjälki makuulle jää. Teeri pyrähtää kun koira < 15 m tai olet < 25 m; koira noutaa kaatuneen',[]],['E / Esc','ota kaatunut jänis/teeri/peura/metsäkauris tarkasteltavaksi, hiiri kääntää; E tai Esc laskee ja kirjaa saaliin. Tynnyrisaunan luona E lopettaa jahdin. Mökin oven vieressä pihapöydällä E avaa Kollinmäen Sanomat, E tai Esc sulkee sen.'+(RIISTAKAMERA?' Tietokone pöydällä E avaa riistakameran kuvat, nuolet selaavat.':'')+' Noin kahdeksan metrin päässä kyläläinen huikkaa itse. Luona E juttelee. Kyläläinen pysyy oman talon pihalla',['KeyE','Escape']],['E','autoon / ulos autosta (narussa oleva koira hyppää kyytiin ja pysyy narussa; irti oleva jää maastoon, eikä sitä tarvita takaisin kyytiin)',['KeyE']],['Autolla maastoon','tiellä täysi vauhti, maastossa −30 %; ojat ylittyvät, puut ja talot pysäyttävät'],['Autossa W/S, A/D','kaasu/jarru, ohjaus'],['Autossa R','radio päälle/pois'],['Autossa Q','vaihda kanavaa',['KeyQ']],['← / →','lehden sivut',['ArrowLeft','ArrowRight']],['F8','rakennuseditori: siirrä mökki, sauna ja navetta. Q ja E kääntävät. Vie kopioi sijainnit.',['F8']],['Esc','taukovalikko'],['Enter','jatka jahtia tauolta',['Enter']],['V','kutsu Vitara luokse (FSD)',['KeyV']],['Space','hyppy – metsästäjä kieltäytyy',['Space']]];
export const KREDIITIT='Äänet: Gravity Sound (tuuli), Benboncan (haukku), Lukas Beck (CC BY 4.0) · Alexander Kürthy (SanoAK), Marie-Lan Taÿ Pamart, Benoît Van Hecke, Anthony Wetherhill, Livlandfahrer (CC BY-SA 4.0) – Wikimedia Commons · YleArkisto (CC BY 4.0), Pierre Grandjean (CC BY 3.0) – Freesound · Kartta © OpenStreetMap contributors';
const H='/grafiikka/hud/';
const css=`#aloitus{position:fixed;inset:0;z-index:50;overflow:hidden;background:linear-gradient(180deg,#5d7896 0%,#9fb4cc 55%,#dfe7f0 100%);font-family:sans-serif;color:#fff;cursor:default}
#aloitus picture,#aloitus .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center}
#al-logo{position:absolute;top:2.8%;left:50%;transform:translateX(-50%);width:50%}@media (max-aspect-ratio:1/1){#al-logo{width:86%}}
#al-tlogo{position:absolute;top:7vh;width:100%;text-align:center;font:900 clamp(32px,7vw,84px)/1 Georgia,serif;letter-spacing:.04em;text-shadow:0 3px 0 #2a3a50,0 6px 18px #0008}
#al-napit{position:absolute;left:50%;bottom:15vh;transform:translateX(-50%);display:flex;flex-direction:column;gap:12px;width:min(80vw,320px)}
#al-napit button{font:700 20px sans-serif;padding:14px;border:2px solid #fff;border-radius:6px;background:#1e3550cc;color:#fff;cursor:pointer}
#al-napit button:hover{background:#3a6a98ee}#al-napit #al-aloita{background:#b8481ecc;font-size:24px}
#al-nimi{font:600 14px sans-serif;text-align:left}#al-nimi input{display:block;width:100%;box-sizing:border-box;margin-top:4px;font:16px sans-serif;padding:8px;border-radius:6px;border:2px solid #fff;background:#fff;color:#1a120c}
#al-kred{position:absolute;bottom:8px;left:4vw;right:4vw;text-align:center;font-size:11px;opacity:.85;text-shadow:0 1px 2px #000}
#al-versio{position:absolute;top:12px;left:12px;z-index:3;font:700 18px/1.2 sans-serif;letter-spacing:.02em;color:#1a120c;background:#ffe9a0;padding:7px 12px;border-radius:8px;border:2px solid #1a120c;box-shadow:0 2px 8px #0006}
#al-ohjeet{position:absolute;inset:8vh 8vw;background:#0f2236ee;border:2px solid #fff;border-radius:8px;padding:18px 24px;overflow:auto;display:none;z-index:2}
#al-ohjeet table{border-collapse:collapse;font-size:16px;margin:auto}#al-ohjeet td{padding:4px 14px;border-bottom:1px solid #fff3}#al-ohjeet td:first-child{font-weight:700;text-align:right;white-space:nowrap;color:#ffd9a0}
#al-paiva,#al-saav{position:absolute;inset:8vh 6vw;background:#0f2236ee;border:2px solid #fff;border-radius:8px;padding:18px 24px;overflow:auto;display:none;z-index:2;text-align:left}
#al-paiva h2,#al-paiva h3,#al-saav h2{margin:12px 0 6px}#al-paiva table{border-collapse:collapse}#al-paiva td{padding:4px 12px;border-bottom:1px solid #fff3}#al-paiva li{margin:2px 0}
.saav-ruudukko{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin-top:8px}
.saav{border:1px solid #fff4;border-radius:8px;padding:8px 10px;background:#1e3550}
.saav.auki{background:#3a2a14;border-color:#e2c27a;color:#ffe9c2}
.saav.lukko{background:#2a2e34;color:#8d939a}
.saav-ikoni{height:40px;font:700 28px/40px Georgia,serif}
.saav p{margin:4px 0 0;font:14px/1.3 Georgia,serif}
.saav-maara{opacity:.85}`;
import { lataa, paivakirjaHtml } from '../logic/paivakirja.js';
import { lataa as lataaSaav, saavutuksetHtml } from '../logic/saavutukset.js';
export const aanetPaalla=()=>localStorage.getItem('jahti_aanet')!=='0';
export function setupAloitus({onStart,onAanet}){const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  const d=document.createElement('div');d.id='aloitus';d.innerHTML=`<picture><source id="al-mob" media="(max-aspect-ratio: 1/1)"><img class="bg" id="al-bg" alt="" style="display:none"></picture>
<div id="al-tlogo">Koppelontien jänis</div><img id="al-logo" alt="Koppelontien jänis" style="display:none">
<div id="al-napit"><label id="al-nimi">Nimi lehdessä<input id="al-nimi-kentta" maxlength="24" placeholder="Metsäkaveri" autocomplete="nickname"></label><button id="al-aloita">Aloita jahti</button><button id="al-kutsu">Kutsu kaveri</button><button id="al-paivakirja">Saalispäiväkirja</button><button id="al-saavutukset">Saavutukset</button><button id="al-ohje">Ohjeet</button><button id="al-aani"></button></div>
<div id="al-paiva"></div><div id="al-saav"></div>
<div id="al-ohjeet"><h2 style="text-align:center;margin-top:0">Ohjeet</h2><table>${OHJEET.map(([k,t])=>`<tr><td>${k}</td><td>${t}</td></tr>`).join('')}</table><p style="text-align:center"><button id="al-sulje" style="font:700 18px sans-serif;padding:8px 24px">Sulje</button></p></div>
<div id="al-kred">${KREDIITIT}</div><div id="al-versio"></div>`;document.body.appendChild(d);const $=s=>d.querySelector(s);
  fetch('/versio').then(r=>r.ok?r.json():null).then(j=>{if(!j?.teksti)return;const el=$('#al-versio');if(el)el.textContent=j.teksti;const menu=document.getElementById('menu');if(menu&&!menu.querySelector('#menu-versio')){const m=document.createElement('div');m.id='menu-versio';m.textContent=j.teksti;m.style.cssText='position:absolute;top:12px;left:12px;font:700 18px/1.2 sans-serif;color:#1a120c;background:#ffe9a0;padding:7px 12px;border-radius:8px;border:2px solid #1a120c';menu.appendChild(m);}}).catch(()=>{});
  // kuvat: kokeile, uusi yritys kunnes löytyy
  const tryImg=(url,ok,n=0)=>{const i=new Image();i.onload=()=>ok(url);i.onerror=()=>{if(n<40&&d.isConnected&&d.style.display!=='none')setTimeout(()=>tryImg(url,ok,n+1),15000);};i.src=url+(n?'?t='+n:'');};
  tryImg(H+'aloitus_tausta.png',u=>{$('#al-bg').src=u;$('#al-bg').style.display='block';});
  tryImg(H+'aloitus_tausta_mobiili.png',u=>{$('#al-mob').srcset=u;});
  tryImg(H+'logo_koppelontien_janis.png',u=>{$('#al-logo').src=u;$('#al-logo').style.display='block';$('#al-tlogo').style.display='none';});
  // tunnari: ogg AudioBufferSourceNode loop=true (saumaton), mp3 varalla; oma AudioContext, käynnistyy ensimmäisellä eleellä
  let mAC=null,mG=null,mSrc=null;const tryPlay=()=>{if(!mAC||!aanetPaalla()||d.style.display==='none')return;mAC.resume().catch(()=>{});};
  const loadMus=async(n=0)=>{try{mAC=mAC||new AudioContext();mG=mG||mAC.createGain();mG.gain.value=0.6;mG.connect(mAC.destination);
    for(const e of['ogg','mp3']){const r=await fetch('/aanet/musiikki_aloitus.'+e);if(!r.ok)continue;const b=await mAC.decodeAudioData(await r.arrayBuffer());
      if(e==='mp3'){/* mp3: ohita alun ja lopun hiljaisuus loopissa */}mSrc=mAC.createBufferSource();mSrc.buffer=b;mSrc.loop=true;
      if(e==='mp3'){const ch=b.getChannelData(0),th=0.003;let a=0,z=ch.length-1;while(a<z&&Math.abs(ch[a])<th)a++;while(z>a&&Math.abs(ch[z])<th)z--;mSrc.loopStart=a/b.sampleRate;mSrc.loopEnd=z/b.sampleRate;mSrc.start(0,mSrc.loopStart);}else mSrc.start();
      window.__tunnari=e;if(!aanetPaalla())mAC.suspend();else tryPlay();return;}}catch(e){}
    if(n<40&&d.style.display!=='none')setTimeout(()=>loadMus(n+1),15000);};loadMus();
  const ele=()=>{tryPlay();};addEventListener('pointerdown',ele);addEventListener('keydown',ele);
  const mus={pause:()=>mAC&&mAC.suspend()};
  const aaniTxt=()=>$('#al-aani').textContent='Äänet: '+(aanetPaalla()?'päällä':'pois');aaniTxt();
  $('#al-aani').onclick=()=>{localStorage.setItem('jahti_aanet',aanetPaalla()?'0':'1');aaniTxt();if(aanetPaalla())tryPlay();else mus.pause();onAanet&&onAanet(aanetPaalla());};
  $('#al-ohje').onclick=()=>{$('#al-ohjeet').style.display='block';};$('#al-sulje').onclick=()=>{$('#al-ohjeet').style.display='none';};
  const paiva=$('#al-paiva');
  const saavEl=$('#al-saav');
  const naytaSaavutukset=()=>{saavEl.innerHTML=saavutuksetHtml(lataaSaav(localStorage))+'<p style="text-align:center"><button id="al-saav-sulje" style="font:700 18px sans-serif;padding:8px 24px">Sulje</button></p>';saavEl.style.display='block';paiva.style.display='none';saavEl.querySelector('#al-saav-sulje').onclick=()=>{saavEl.style.display='none';};};
  $('#al-saavutukset').onclick=naytaSaavutukset;
  $('#al-paivakirja').onclick=()=>{paiva.innerHTML=paivakirjaHtml(lataa(localStorage))+'<p style="text-align:center"><button id="al-paiva-saav" style="font:700 18px sans-serif;padding:8px 24px;margin-right:8px">Saavutukset</button><button id="al-paiva-sulje" style="font:700 18px sans-serif;padding:8px 24px">Sulje</button></p>';paiva.style.display='block';saavEl.style.display='none';paiva.querySelector('#al-paiva-sulje').onclick=()=>{paiva.style.display='none';};paiva.querySelector('#al-paiva-saav').onclick=naytaSaavutukset;};
  const nimi=$('#al-nimi-kentta');try{nimi.value=localStorage.getItem('jahti_nimi')||'';}catch{}
  nimi.addEventListener('input',()=>{try{localStorage.setItem('jahti_nimi',nimi.value.slice(0,24));}catch{}});
  nimi.addEventListener('keydown',e=>e.stopPropagation());
  $('#al-aloita').onclick=()=>{d.style.display='none';// tunnari himmenee pois 1.5 s
    removeEventListener('pointerdown',ele);removeEventListener('keydown',ele);if(mAC&&mG){const t=mAC.currentTime;mG.gain.setValueAtTime(mG.gain.value,t);mG.gain.linearRampToValueAtTime(0,t+1.5);setTimeout(()=>{try{mSrc&&mSrc.stop();mAC.close();}catch{}},1700);}
    window.__peliAlkanut=true;onStart();};
  return d;}
