// v1.1 moninpeli-asiakas. Ilman ?huone= ei avata yhteyttä (yksinpeli toimii ilman palvelinta).
import { enc, dec, Interp } from '/logic/sync.js';
export function connect(room,{onMsg=()=>{},onRole=()=>{},onStatus=()=>{}}={}){
  const N={room,role:null,open:false,peer:false,remote:new Interp(0.12),last:null,send(m){if(N.open&&N.peer)ws.send(enc(m));}};
  const url=(location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws?huone='+encodeURIComponent(room);let ws;
  const go=()=>{ws=new WebSocket(url);ws.onopen=()=>{N.open=true;};
    ws.onmessage=e=>{const m=dec(e.data);if(!m)return;
      if(m.t==='tervetuloa'){N.role=m.role;N.peer=m.muita>0;onRole(m.role);onStatus(N.peer?'Kaveri paikalla':'Odotetaan kaveria… huone '+room);return;}
      if(m.t==='liittyi'){N.peer=true;onStatus('Kaveri liittyi');onMsg({t:'liittyi'});return;}
      if(m.t==='poistui'){N.peer=false;if(m.uusiRooli&&m.uusiRooli!==N.role){N.role=m.uusiRooli;onRole(N.role);}onStatus('Kaveri poistui');N.last=null;return;}
      if(m.t==='virhe'){onStatus('Moninpeli: '+m.syy);return;}
      if(m.t==='p'){N.last=m;N.remote.push(performance.now()/1000,m);}
      onMsg(m);};
    ws.onclose=()=>{N.open=false;N.peer=false;onStatus('Yhteys katkesi – yritetään uudelleen');setTimeout(go,3000);};};
  go();window.__net=N;return N;}
// kutsulinkki
export function inviteLink(room){const u=new URL(location.href);const k=u.searchParams.get('koira');u.search='?huone='+room+(k?'&koira='+k:'');u.hash='';return u.toString();}
