// v1.0: aloitusruutu (overlay ennen peliä). Kuvat/tunnari vaihtuvat oikeisiin kun tiedostot ilmestyvät (uusi yritys 15 s välein).
export const OHJEET=[
 ['WASD','liiku',['KeyW','KeyA','KeyS','KeyD']],['Hiiri','katso'],['Vaihto','juokse',['ShiftLeft']],['Vasen hiiri','nosta ase / ammu'],['Oikea hiiri','tähtää'],
 ['Tab / rulla','vaihda ase (haulikko ↔ kivääri)',['Tab']],['Rulla tähdätessä','kiikarin zoomi (kivääri)'],['B','kiikarit',['KeyB']],['R','lataa',['KeyR']],
 ['F','naru irti / kiinni',['KeyF']],['1','koira tänne',['Digit1']],['2','koira seuraa',['Digit2']],['3','koira etsi',['Digit3']],['4','täällä',['Digit4']],
 ['G / M','GPS-panta (pieni / iso / pois)',['KeyG','KeyM']],['+ / −','GPS-zoomi (GPS auki) tai resoluutio',['Equal','Minus','NumpadAdd','NumpadSubtract']],
 ['E','autoon / ulos autosta (koira jää maastoon, naru irtoaa)',['KeyE']],['Autolla maastoon','tiellä täysi vauhti, maastossa −30 %; ojat ylittyvät, puut ja talot pysäyttävät'],['Autossa W/S, A/D','kaasu/jarru, ohjaus'],['Autossa R','radio päälle/pois'],['Autossa Q / Tab','vaihda kanavaa',['KeyQ']],['Esc','taukovalikko']];
export const KREDIITIT='Äänet: Gravity Sound (tuuli), Benboncan (haukku), Lukas Beck (CC BY 4.0) · Alexander Kürthy (SanoAK), Marie-Lan Taÿ Pamart, Benoît Van Hecke, Anthony Wetherhill, Livlandfahrer (CC BY-SA 4.0) – Wikimedia Commons · YleArkisto (CC BY 4.0), Pierre Grandjean (CC BY 3.0) – Freesound · Kartta © OpenStreetMap contributors';
const H='/grafiikka/hud/';
const css=`#aloitus{position:fixed;inset:0;z-index:50;overflow:hidden;background:linear-gradient(180deg,#5d7896 0%,#9fb4cc 55%,#dfe7f0 100%);font-family:sans-serif;color:#fff;cursor:default}
#aloitus picture,#aloitus .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center}
#al-logo{position:absolute;top:2.8%;left:50%;transform:translateX(-50%);width:50%}@media (max-aspect-ratio:1/1){#al-logo{width:86%}}
#al-tlogo{position:absolute;top:7vh;width:100%;text-align:center;font:900 clamp(32px,7vw,84px)/1 Georgia,serif;letter-spacing:.04em;text-shadow:0 3px 0 #2a3a50,0 6px 18px #0008}
#al-napit{position:absolute;left:50%;bottom:15vh;transform:translateX(-50%);display:flex;flex-direction:column;gap:12px;width:min(80vw,320px)}
#al-napit button{font:700 20px sans-serif;padding:14px;border:2px solid #fff;border-radius:6px;background:#1e3550cc;color:#fff;cursor:pointer}
#al-napit button:hover{background:#3a6a98ee}#al-napit #al-aloita{background:#b8481ecc;font-size:24px}
#al-kred{position:absolute;bottom:8px;left:4vw;right:4vw;text-align:center;font-size:11px;opacity:.85;text-shadow:0 1px 2px #000}
#al-ohjeet{position:absolute;inset:8vh 8vw;background:#0f2236ee;border:2px solid #fff;border-radius:8px;padding:18px 24px;overflow:auto;display:none;z-index:2}
#al-ohjeet table{border-collapse:collapse;font-size:16px;margin:auto}#al-ohjeet td{padding:4px 14px;border-bottom:1px solid #fff3}#al-ohjeet td:first-child{font-weight:700;text-align:right;white-space:nowrap;color:#ffd9a0}`;
export const aanetPaalla=()=>localStorage.getItem('jahti_aanet')!=='0';
export function setupAloitus({onStart,onAanet}){const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  const d=document.createElement('div');d.id='aloitus';d.innerHTML=`<picture><source id="al-mob" media="(max-aspect-ratio: 1/1)"><img class="bg" id="al-bg" alt="" style="display:none"></picture>
<div id="al-tlogo">Koppelontien jänis</div><img id="al-logo" alt="Koppelontien jänis" style="display:none">
<div id="al-napit"><button id="al-aloita">Aloita jahti</button><button id="al-ohje">Ohjeet</button><button id="al-aani"></button></div>
<div id="al-ohjeet"><h2 style="text-align:center;margin-top:0">Ohjeet</h2><table>${OHJEET.map(([k,t])=>`<tr><td>${k}</td><td>${t}</td></tr>`).join('')}</table><p style="text-align:center"><button id="al-sulje" style="font:700 18px sans-serif;padding:8px 24px">Sulje</button></p></div>
<div id="al-kred">${KREDIITIT}</div>`;document.body.appendChild(d);const $=s=>d.querySelector(s);
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
  $('#al-aloita').onclick=()=>{d.style.display='none';// tunnari himmenee pois 1.5 s
    removeEventListener('pointerdown',ele);removeEventListener('keydown',ele);if(mAC&&mG){const t=mAC.currentTime;mG.gain.setValueAtTime(mG.gain.value,t);mG.gain.linearRampToValueAtTime(0,t+1.5);setTimeout(()=>{try{mSrc&&mSrc.stop();mAC.close();}catch{}},1700);}
    window.__peliAlkanut=true;onStart();};
  return d;}
