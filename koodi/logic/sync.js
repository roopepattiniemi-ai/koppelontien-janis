// v1.1 moninpeli: puhtaat apufunktiot (testattavissa Nodessa). Viestit JSONina releen läpi.
// Viestit:
//  {t:'p', x,y,z,yaw,pitch,inCar,seat,crouch,aim?,ase?:'h'|'k',nimi?, car?:{x,z,h,speed,steer}}  pelaajan tila (15 Hz), car vain kuskilta. aim ja ase ovat valinnaisia hahmon animaatiota varten.
//  {t:'w', dog:{x,z,dir,state,barking,riding}, hares:[[x,z,heading,state,alive,carried,delivered,held,counted,damage]], cr:[[x,z,heading,state,alive]], birds:[[x,y,z,alive]], bag:{id:n}}  isännän maailma (10 Hz)
//  {t:'s', o:{x,y,z}, d:{x,y,z}, w:'haulikko'|'kivaari', seed, by}  laukaus: molemmat soittavat 3D-äänen; isäntä ratkaisee osumat samalla siemenellä
//  {t:'r', on, ch}  radion tila (kuka tahansa autossa oleva)
//  {t:'cmd', c, x,z}  vieraan koirakomento isännälle;  {t:'pick', i}/{t:'drop', i} saaliin otto/lasku (isäntä kirjaa)
//  {t:'lopeta'}  vieras pyytää jahdin loppua;  {t:'loppu', yhteenveto}  isäntä käynnistää loppukohtauksen molemmille
//  {t:'lehti', seed, pisteet, kaatui:'h'|'v'|'k', nimi, otsikko?, ingressi?, kyla?}  isäntä: osuma pelaajaan tai kyläläiseen, sama lehti molemmille. Kyläläiset syntyvät huonesiemenestä, eivät maailmapaketista. Jutut eivät synkkaa. dog.tone = haukun tila, dog.kimea = terrieri. Pelaajan tilassa nimi on kuolinilmoitusta varten.
export function roomSeed(code){let h=2166136261;for(const ch of String(code))h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0;}
export function newRoomCode(rand=Math.random){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<5;i++)s+=A[(rand()*A.length)|0];return s;}
export const enc=m=>JSON.stringify(m);
export function dec(s){try{const m=JSON.parse(s);return m&&typeof m.t==='string'?m:null;}catch{return null;}}
const r2=v=>Math.round(v*100)/100;
export function packWorld({dog,hares,critters=[],birds=[],bag={}}){return{t:'w',dog:{x:r2(dog.x),z:r2(dog.z),dir:r2(dog.dir||0),state:dog.state,barking:!!dog.barking,riding:dog.riding?1:0,tone:dog.haukku||'',kimea:dog.kimea?1:0},
  hares:hares.map(h=>[r2(h.x),r2(h.z),r2(h.heading||0),h.state,h.alive?1:0,h.carried?1:0,h.delivered?1:0,h.held?1:0,h.counted?1:0,r2(h.damage||0)]),
  cr:critters.map(c=>[r2(c.x),r2(c.z),r2(c.heading||0),c.state,c.alive?1:0]),birds:birds.map(b=>[r2(b.x??0),r2(b.y??0),r2(b.z??0),b.alive?1:0]),bag};}
export function applyWorld(m,{dog,hares,critters=[],birds=[]}){Object.assign(dog,{x:m.dog.x,z:m.dog.z,dir:m.dog.dir,state:m.dog.state,barking:m.dog.barking});if('riding' in m.dog)dog.riding=!!m.dog.riding;if('tone' in m.dog)dog.haukku=m.dog.tone||null;if('kimea' in m.dog)dog.kimea=!!m.dog.kimea;
  m.hares.forEach((a,i)=>{const h=hares[i];if(!h)return;[h.x,h.z,h.heading,h.state]=a;h.alive=!!a[4];h.carried=!!a[5];h.delivered=!!a[6];h.held=!!a[7];h.counted=!!a[8];h.damage=a[9];h.wounded=a[9]>0;});
  m.cr.forEach((a,i)=>{const c=critters[i];if(!c)return;[c.x,c.z,c.heading,c.state]=a;c.alive=!!a[4];});
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
