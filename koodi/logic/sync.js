import { sovellaPiha } from './piha.js';
// v1.1 moninpeli: puhtaat apufunktiot (testattavissa Nodessa). Viestit JSONina releen läpi.
// Viestit:
//  {t:'p', x,y,z,yaw,pitch,inCar,seat,crouch,aim?,ase?:'h'|'k',nimi?, car?:{x,z,h,speed,steer}}  pelaajan tila (15 Hz), car vain kuskilta. aim ja ase ovat valinnaisia hahmon animaatiota varten.
//  {t:'w', dog:{x,z,dir,state,barking,riding,haava?}, hares:[[x,z,heading,state,alive,carried,delivered,held,counted,damage]], cr:[[x,z,heading,state,alive]], birds:[[x,y,z,alive]], bag:{id:n}, veri?:[{k,i,n,pts}], haava?:[[i,k,makuu,loytyi,kuollut,kuljettu,matka]]}  isännän maailma (10 Hz). Jänisrivi pysyy 10 kenttänä; veri ja haava ovat omat kenttänsä.
//  {t:'s', o:{x,y,z}, d:{x,y,z}, w:'haulikko'|'kivaari', seed, by}  laukaus: molemmat soittavat 3D-äänen; isäntä ratkaisee osumat samalla siemenellä
//  {t:'r', on, ch, song, clip, pos, lastJ, gen}  radion tila isännältä. Vieras lähettää {t:'r', act:'on'|'ch'}.
//  {t:'piha', piha}  isännän rakennussiirrot (mökki, sauna, navetta). Maailmapaketissa piha on valinnainen.
//  {t:'cmd', c, x,z, kenelle?:'koira'|'terrieri'}  vieras käskee omaa terrieriään (kenelle:'terrieri'). Ilman kenelle-kenttää isäntä soveltaa ajokoiraan. Maailmapaketti ei ylikirjoita terrierin narua. {t:'pick', i}/{t:'drop', i} saaliin otto/lasku (isäntä kirjaa)
//  {t:'lopeta'}  vieras pyytää jahdin loppua;  {t:'loppu', yhteenveto}  isäntä käynnistää loppukohtauksen molemmille
//  {t:'lehti', seed, pisteet, kaatui:'h'|'v'|'k', nimi, otsikko?, ingressi?, kyla?}  isäntä: osuma pelaajaan tai kyläläiseen, sama lehti molemmille. Kyläläiset syntyvät huonesiemenestä, eivät maailmapaketista. Pihalenkki lasketaan samasta siemenestä ja kellosta, joten paikkaa ei lähetetä. Jutut, ohikulkuhuudot ja saavutukset eivät synkkaa. Ajon lenkin laskee isäntä; jäniksen paikka, suunta ja tila kulkevat maailmapaketissa kuten ennen. Saavutukset ovat pelaajan omassa selaimessa. dog.tone = haukun tila, dog.kimea = terrieri. Pelaajan tilassa nimi on kuolinilmoitusta varten.
export function roomSeed(code){let h=2166136261;for(const ch of String(code))h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0;}
export function newRoomCode(rand=Math.random){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<5;i++)s+=A[(rand()*A.length)|0];return s;}
export const enc=m=>JSON.stringify(m);
export function dec(s){try{const m=JSON.parse(s);return m&&typeof m.t==='string'?m:null;}catch{return null;}}
const r2=v=>Math.round(v*100)/100;
const VERI_MAX=16;
function veriOsa(elain){const v=elain.veri||[];if(!v.length)return null;const start=Math.max(0,v.length-VERI_MAX);const pts=[];
  for(let i=start;i<v.length;i++)pts.push([r2(v[i].x),r2(v[i].z),r2(v[i].s||1),Math.round(v[i].matka||0)]);return {n:v.length,pts};}
function haavaOsa(elain,i,k){if(!elain.wounded&&!elain.haavaKuollut)return null;return [i,k,elain.haavaMakuu?1:0,(elain.loytyi||elain.verelta)?1:0,elain.haavaKuollut?1:0,r2(elain.haavaKuljettu||0),r2(elain.haavaMatka||0)];}
export function packWorld({dog,hares,critters=[],birds=[],bag={},piha,car,lumi,kuvat}={}){const m={t:'w',dog:{x:r2(dog.x),z:r2(dog.z),dir:r2(dog.dir||0),state:dog.state,barking:!!dog.barking,riding:dog.riding?1:0,tone:dog.haukku||'',kimea:dog.kimea?1:0},
  hares:hares.map(h=>[r2(h.x),r2(h.z),r2(h.heading||0),h.state,h.alive?1:0,h.carried?1:0,h.delivered?1:0,h.held?1:0,h.counted?1:0,r2(h.damage||0)]),
  cr:critters.map(c=>[r2(c.x),r2(c.z),r2(c.heading||0),c.state,c.alive?1:0]),birds:birds.map(b=>[r2(b.x??0),r2(b.y??0),r2(b.z??0),b.alive?1:0]),bag};if(dog.haavakko)m.dog.haava=1;if(dog.aani&&dog.aani.id)m.dog.aani={id:String(dog.aani.id),nimi:String(dog.aani.nimi||'')};if(piha)m.piha=piha;if(car)m.car={x:r2(car.x),z:r2(car.z),h:r2(car.heading||0),speed:r2(car.speed||0)};if(lumi)m.lumi=lumi;if(kuvat)m.kuvat=kuvat;
  const veri=[],haava=[];hares.forEach((h,i)=>{const v=veriOsa(h);if(v)veri.push({k:'h',i,...v});const a=haavaOsa(h,i,'h');if(a)haava.push(a);});
  critters.forEach((c,i)=>{const v=veriOsa(c);if(v)veri.push({k:'c',i,...v});const a=haavaOsa(c,i,'c');if(a)haava.push(a);});
  if(veri.length)m.veri=veri;if(haava.length)m.haava=haava;return m;}
function lisaaVeri(elain,v){if(!elain||!v)return;const n=v.n|0;if(n<(elain._veriN||0)){elain.veri=[];elain._veriN=0;elain._veriPiirto=0;}
  const puuttuu=n-(elain._veriN||0);if(puuttuu<=0)return;elain.veri=elain.veri||[];
  for(const p of (v.pts||[]).slice(-puuttuu))elain.veri.push({x:p[0],z:p[1],s:p[2],matka:p[3]});elain._veriN=n;elain.wounded=true;}
export function applyWorld(m,{dog,hares,critters=[],birds=[],car}={}){if(m.piha)sovellaPiha(m.piha);Object.assign(dog,{x:m.dog.x,z:m.dog.z,dir:m.dog.dir,state:m.dog.state,barking:m.dog.barking});if('riding' in m.dog)dog.riding=!!m.dog.riding;if('tone' in m.dog)dog.haukku=m.dog.tone||null;if('kimea' in m.dog)dog.kimea=!!m.dog.kimea;if('haava' in m.dog)dog.haavakko=!!m.dog.haava;if(m.dog.aani&&m.dog.aani.id)dog.aani={id:String(m.dog.aani.id),nimi:String(m.dog.aani.nimi||'')};
  if(m.car&&car){car.x=m.car.x;car.z=m.car.z;car.heading=m.car.h;car.speed=m.car.speed;car.pose?.();}
  m.hares.forEach((a,i)=>{const h=hares[i];if(!h)return;[h.x,h.z,h.heading,h.state]=a;h.alive=!!a[4];h.carried=!!a[5];h.delivered=!!a[6];h.held=!!a[7];h.counted=!!a[8];h.damage=a[9];h.wounded=a[9]>0;});
  m.cr.forEach((a,i)=>{const c=critters[i];if(!c)return;[c.x,c.z,c.heading,c.state]=a;c.alive=!!a[4];});
  if(m.haava)for(const a of m.haava){const lista=a[1]==='c'?critters:hares;const e=lista[a[0]];if(!e)continue;e.wounded=true;e.haavaMakuu=!!a[2];if(a[3]){e.loytyi=true;e.verelta=true;}e.haavaKuljettu=a[5];e.haavaMatka=a[6];if(a[4]){e.haavaKuollut=true;e.killedBy='haava';e.alive=false;e.haavaMakuu=false;}}
  if(m.veri)for(const v of m.veri)lisaaVeri((v.k==='c'?critters:hares)[v.i],v);
  m.birds.forEach((a,i)=>{const b=birds[i];if(!b)return;if(b.kind!=='korppi'){b.x=a[0];b.y=a[1];b.z=a[2];}b.alive=!!a[3];});}
// interpolointi: puskuroi tilat ja palauttaa arvon ajassa now-delay
export class Interp{constructor(delay=0.12){this.buf=[];this.delay=delay;}
  push(t,s){this.buf.push({t,s});if(this.buf.length>20)this.buf.shift();}
  at(now){const T=now-this.delay,b=this.buf;if(!b.length)return null;if(T<=b[0].t)return b[0].s;for(let i=b.length-1;i>=0;i--)if(b[i].t<=T){const a=b[i],c=b[i+1];if(!c)return a.s;const k=(T-a.t)/(c.t-a.t),o={};
    for(const key in a.s){const x=a.s[key],y=c.s[key];o[key]=typeof x==='number'&&typeof y==='number'?(key==='yaw'||key==='h'?x+Math.atan2(Math.sin(y-x),Math.cos(y-x))*k:x+(y-x)*k):y;}return o;}return b.at(-1).s;}}
// auto: istumapaikka. Ensimmäinen autoon tullut ajaa.
export function seatFor(otherSeat){return otherSeat==='kuski'?'pelkaaja':'kuski';}
// Alussa autossa: yksinpelissä kuski heti, muuten kaasu ei tee mitään (ajo vaatii seat==='kuski').
// Huoneessa paikka vasta roolista, ettei vieras lähetä auton tilaa ennen tervetuloa.
export function startSeat(autossa,role,room){if(!autossa)return null;if(role==='v')return 'pelkaaja';if(room&&!role)return null;return 'kuski';}
