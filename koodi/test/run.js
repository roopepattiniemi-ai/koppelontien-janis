import assert from 'node:assert/strict';
import { Hare, H, alkujaljenHamaykset } from '../logic/hare.js';
import { Dog, D, nearTrack, dogInside } from '../logic/dog.js';
import { audibility } from '../logic/hearing.js';
import { Car, bodyBox } from '../logic/car.js';
import { YARD, START, drivable, inBuilding, BUILDINGS, farmFootprints, YARD_POLYS } from '../logic/world.js';
import { shotgun } from '../logic/shot.js';
import { judgeShot } from '../logic/rules.js';
import { Critter } from '../logic/wild.js';
let n=0;const mulberryT=s=>{let a=s;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};};const t=(name,f)=>{f();n++;console.log('ok',name);};
t('jänis makuulla, alkujäljessä 0–1 hämäystä',()=>{const h=new Hare({seed:3});assert.equal(h.state,H.MAKUU);assert.ok(h.nightTrail.length>90);assert.ok(h.nightTrail.every(p=>p.yo));
  let nolla=0,yksi=0;for(let s=1;s<=40;s++){const n=alkujaljenHamaykset(new Hare({seed:s}).nightTrail);assert.ok(n<=1,'hämäys '+s+' '+n);if(n===0)nolla++;else yksi++;}
  assert.ok(nolla>0&&yksi>0,nolla+'/'+yksi);});
t('jänis lähtee kun koira lähellä, kierto <~1 km',()=>{const h=new Hare({seed:3});h.update(.1,{dog:{x:h.x+5,z:h.z}});assert.equal(h.state,H.PAKO);
  let maxR=0,states=new Set();for(let i=0;i<20000;i++){h.update(.05,{dog:{x:h.x+100,z:h.z},player:{x:9999,z:9999}});states.add(h.state);maxR=Math.max(maxR,Math.hypot(h.x-h.home.x,h.z-h.home.z));}
  assert.ok(states.has(H.KIERTO)&&states.has(H.PALUU),[...states]);assert.ok(maxR<1100,maxR);});
t('liikkumaton pelaaja ei karkota kaukaa',()=>{const h=new Hare({seed:4});h.update(.1,{player:{x:h.x+6,z:h.z},playerMoving:false});assert.equal(h.state,H.MAKUU);});
t('koira: haku -> yöjälki -> ylösotto -> ajo -> hukka',()=>{const h=new Hare({seed:5});const g=new Dog({x:h.home.x+150,z:h.home.z});const seen=new Set();let bark=0;
  for(let i=0;i<40000;i++){g.update(.05,{hare:h,player:{x:h.home.x+150,z:h.home.z}});h.update(.05,{dog:g.pos,player:{x:9999,z:9999}});seen.add(g.state);if(g.barking)bark++;}
  for(const s of [D.HAKU,D.YOJALKI,D.YLOSOTTO,D.AJO,D.HUKKA])assert.ok(seen.has(s),s+' '+[...seen]);assert.ok(bark>0);});
t('kuuluvuus: etäisyys ja tuuli',()=>{const s={x:0,z:0};assert.ok(audibility(s,{x:0,z:-100})>audibility(s,{x:0,z:-600}));
  const down={x:Math.sin(Math.PI/4)*800,z:-Math.cos(Math.PI/4)*800},up={x:-down.x,z:-down.z};assert.ok(audibility(s,down)>audibility(s,up));assert.equal(audibility(s,{x:5000,z:0}),0);});
t('haulikko: lähellä osuu, kaukana ei',()=>{const o={x:0,y:1.6,z:0},dir={x:0,y:0,z:-1};assert.ok(shotgun(o,dir,{x:0,y:1.6,z:-15})>=3);assert.equal(shotgun(o,dir,{x:0,y:1.6,z:-80}),0);});
t('narussa -> irti -> haku; kiinni vain lähellä',()=>{const h=new Hare({seed:6});const P={x:h.home.x+300,z:h.home.z};const g=new Dog({x:P.x+1,z:P.z,leashed:true});
  for(let i=0;i<200;i++){g.update(.05,{hare:h,player:P});}assert.equal(g.state,D.NARUSSA);assert.ok(Math.hypot(g.x-P.x,g.z-P.z)<3);
  assert.ok(g.command('irti',P).ok);assert.equal(g.state,D.HAKU);g.x=P.x+50;assert.equal(g.command('kiinni',P).syy,'Koira liian kaukana');
  assert.ok(g.command('tanne',P).ok);for(let i=0;i<400;i++)g.update(.05,{hare:h,player:P});assert.equal(g.state,D.TANNE);assert.ok(Math.hypot(g.x-P.x,g.z-P.z)<2);
  assert.ok(g.command('kiinni',P).ok);assert.equal(g.state,D.NARUSSA);g._haku();g.x=P.x+400;assert.equal(g.command('etsi',P).syy,'Koira ei kuule');});
t('ajossa ~70 % komennoista ohitetaan',()=>{const h=new Hare({seed:6});const g=new Dog({seed:9});let ok=0;for(let i=0;i<1000;i++){g.state=D.AJO;if(g.command('seuraa',{x:10,z:0}).ok)ok++;}assert.ok(ok>230&&ok<370,ok);});
t('haku ei suunnista jänikseen: kaukana jäljistä pysyy haussa',()=>{const h=new Hare({seed:6});const P={x:h.home.x+900,z:h.home.z+900};const g=new Dog({x:P.x,z:P.z,seed:3});
  for(let i=0;i<4000;i++){g.update(.05,{hare:h,player:P});assert.ok(Math.hypot(g.x-P.x,g.z-P.z)<400);}assert.ok([D.HAKU,D.PALUU].includes(g.state),g.state);});
t('täällä: jäljellä -> koira tulee ja nostaa jäljen, ilman jälkeä = tänne',()=>{const h=new Hare({seed:6});const tp=h.nightTrail[20],P={x:tp.x+1,z:tp.z};const g=new Dog({x:P.x+60,z:P.z,seed:4});
  assert.ok(nearTrack(h,P,3));const r=g.command('taalla',P,h);assert.ok(r.ok&&r.jalki);assert.equal(g.state,D.TAALLA);
  for(let i=0;i<600;i++)g.update(.05,{hare:h,player:P});assert.ok([D.YOJALKI,D.YLOSOTTO,D.AJO].includes(g.state),g.state);
  const g2=new Dog({x:P.x+60,z:P.z});assert.equal(g2.command('taalla',{x:P.x+500,z:P.z+500},h).ok,false);const Q={x:h.home.x+700,z:h.home.z};const g3=new Dog({x:Q.x+20,z:Q.z});g3.command('taalla',Q,h);assert.equal(g3.state,D.TANNE);});
t('Vitara: nousu ilman koiraa, ajaa tiellä',()=>{const c=new Car({x:YARD.x,z:YARD.z});assert.ok(c.canEnter({x:YARD.x+1,z:YARD.z}).ok);assert.equal(c.canEnter({x:YARD.x+9,z:YARD.z}).ok,false);
  const g=new Dog({x:YARD.x,z:YARD.z});assert.ok(c.canEnter({x:YARD.x+1,z:YARD.z},g).ok);
  for(let i=0;i<2000;i++){c.update(.05,{throttle:1,steer:i%300<150?1:-.3});assert.ok(!inBuilding(c.x,c.z));}});
{const W=await import('../logic/world.js');const CM=await import('../logic/car.js');
t('Vitara maastossa: −30 % huippunopeus, ylittää ojan, puu ja talo pysäyttävät',()=>{
  // etsi suora tie ja aja kohtisuoraan ojan yli maastoon
  let P=null;for(const r of W.ROADS){if(r.c!=='tie')continue;for(let i=0;i<r.pts.length-1&&!P;i++){const[a,b]=r.pts[i],[c2,d]=r.pts[i+1],L=Math.hypot(c2-a,d-b);if(L<10)continue;const mx=(a+c2)/2,mz=(b+d)/2,ux=(c2-a)/L,uz=(d-b)/L;
    for(const sd of[1,-1]){const nx=-uz*sd,nz=ux*sd;let ok=true;for(let e=0;e<40;e+=1){const x=mx+nx*e,z=mz+nz*e;if(e>r.w/2+4&&CM.onRoad(x,z)||!CM.carFree(x,z))ok=false;}if(ok&&Math.abs(mx)<450&&Math.abs(mz)<450){P={x:mx,z:mz,h:Math.atan2(nx,-nz),r};break;}}}if(P)break;}
  assert.ok(P,'tie');const c=new Car({x:P.x,z:P.z,heading:P.h});let maxOja=0,vmax=0;
  for(let i=0;i<400;i++){c.update(.05,{throttle:1});maxOja=Math.max(maxOja,W.ditch(c.x,c.z));if(c.offroad)vmax=Math.max(vmax,c.speed);}
  const dist=Math.hypot(c.x-P.x,c.z-P.z);assert.ok(dist>35,'ei jumittunut: '+dist);assert.ok(maxOja>0.3,'oja ylitetty '+maxOja);assert.ok(c.offroad);
  assert.ok(Math.abs(vmax-16*CM.MAASTO)<0.01,vmax);
  // kiihtyvyys maastossa 0.7×
  const c2=new Car({x:c.x,z:c.z,heading:c.heading});c2.update(.1,{throttle:1});assert.ok(Math.abs(c2.speed-0.8*CM.MAASTO)<1e-6,c2.speed);
  const c3=new Car({x:P.x,z:P.z,heading:P.h+Math.PI/2});c3.update(.1,{throttle:1});assert.ok(Math.abs(c3.speed-0.8)<1e-6,c3.speed);
  // puu pysäyttää
  const tx=c.x+Math.sin(c.heading)*6,tz=c.z-Math.cos(c.heading)*6;const c4=new Car({x:c.x,z:c.z,heading:c.heading});c4.blocked=(x,z)=>Math.hypot(x-tx,z-tz)<1.4;
  for(let i=0;i<100;i++)c4.update(.05,{throttle:1});assert.ok(Math.hypot(c4.x-tx,c4.z-tz)>=1.39&&Math.hypot(c4.x-c.x,c4.z-c.z)<6,'puu');
  // talo pysäyttää
  const B=W.BUILDINGS[0];let bx=0,bz=0;for(const[a,b]of B){bx+=a;bz+=b;}bx/=B.length;bz/=B.length;const c5=new Car({x:bx+30,z:bz,heading:-Math.PI/2});
  for(let i=0;i<400;i++)c5.update(.05,{throttle:1});assert.ok(!W.inBuilding(c5.x,c5.z));assert.ok(c5.x>bx-1,'talo');});}
{const {height}=await import('../logic/world.js');t('korkeus: mökki≈0, vaihtelua >10 m, Vitara pinnalla',()=>{assert.ok(Math.abs(height(0,0))<1);let mn=1e9,mx=-1e9;for(let x=-590;x<590;x+=20)for(let z=-590;z<590;z+=20){const h=height(x,z);mn=Math.min(mn,h);mx=Math.max(mx,h);}assert.ok(mx-mn>10,mx-mn);
  const c=new Car({x:YARD.x,z:YARD.z});for(let i=0;i<500;i++){c.update(.05,{throttle:1,steer:.3});assert.ok(c.y>=height(c.x,c.z)-1e-6);assert.ok(Math.abs(c.pitch)<0.6);}});}
{const W=await import('../logic/world.js');t('v0.8 kenttä: jänis metsässä, puut eivät pelloilla/taloissa/teillä, piha ajettava',()=>{const r=mulberryT(5);
  for(let i=0;i<30;i++){const p=W.hareSpot(r);assert.ok(W.isForest(p.x,p.z)&&!W.inBuilding(p.x,p.z,20));const h=new Hare({...p,seed:i});assert.ok(!W.inBuilding(h.home.x,h.home.z));}
  for(const t of W.trees(3,800)){assert.ok(!W.inBuilding(t.x,t.z));assert.ok(W.distToRoad(t.x,t.z)>2);}
  assert.ok(W.drivable(W.YARD.x,W.YARD.z));assert.ok(W.drivable(W.START.x,W.START.z));
  // reitti Yli-Vallintie -> Löyhingintie -> Koppelontie -> pihatie: tiepisteet kentällä ajettavia (näytteet 2 m välein)
  for(const nm of ['Yli-Vallintie','Löyhingintie','Koppelontie','pihatie']){const r=W.ROADS.find(o=>o.n===nm);for(let i=0;i<r.pts.length-1;i++){const[a,b]=r.pts[i],[c,d]=r.pts[i+1],L=Math.hypot(c-a,d-b);
    for(let s=0;s<=L;s+=2){const x=a+(c-a)*s/L,z=b+(d-b)*s/L;if(Math.abs(x)<590&&Math.abs(z)<590&&!W.inBuilding(x,z))assert.ok(W.drivable(x,z),nm+' '+x.toFixed(0)+','+z.toFixed(0));}}}assert.ok(W.ROADS.some(r=>r.n==='Koppelontie'));});}
t('saalissäännöt: jänis haulikolla, peura kiväärillä, rauhoitetut',()=>{assert.deepEqual(judgeShot('janis','haulikko'),{saalis:true,huomautus:null});assert.deepEqual(judgeShot('peura','kivaari'),{saalis:true,huomautus:null});
  assert.ok(judgeShot('janis','kivaari').huomautus);assert.ok(judgeShot('peura','haulikko').huomautus);assert.deepEqual(judgeShot('kettu','haulikko'),{saalis:true,huomautus:null});assert.ok(judgeShot('kettu','kivaari').huomautus);assert.equal(judgeShot('kettu','kivaari').saalis,true);for(const l of['orava','korppi','tiainen']){for(const a of['haulikko','kivaari']){const r=judgeShot(l,a);assert.equal(r.saalis,false);assert.match(r.huomautus,/rauhoitettu/);}}});
t('koira: lenkit 80–250 m, paluu pelaajan luo 30–90 s välein, haistelu',()=>{const h=new Hare({x:5000,z:5000,seed:2});const P={x:0,z:0};const g=new Dog({x:0,z:0,seed:11});g.command('irti',P);g._haku();
  let maxD=0,ret=0,last=g.state,sniff=0,firstRet=null;for(let i=0;i<4000;i++){g.update(.05,{hares:[h],player:P});maxD=Math.max(maxD,Math.hypot(g.x,g.z));if(g.sniffing)sniff++;if(g.state===D.PALUU&&last!==D.PALUU){ret++;firstRet??=i*.05;}last=g.state;}
  assert.ok(maxD>60&&maxD<330,maxD);assert.ok(ret>=2,ret);assert.ok(firstRet>=30&&firstRet<=90,firstRet);assert.ok(sniff>0);});
t('koira: jäljen löydyttyä ajo, ei paluuta; useista jäniksistä yksi kohde',()=>{const hs=[1,2,3].map(s=>new Hare({x:s*180-360,z:0,seed:s}));const tp=hs[1].nightTrail[5];const g=new Dog({x:tp.x+1,z:tp.z,seed:3});g._haku();g.returnT=0.5;
  g.update(.05,{hares:hs,player:{x:0,z:0}});assert.equal(g.state,D.YOJALKI);assert.equal(g.target,hs[1]);for(let i=0;i<200;i++){g.update(.05,{hares:hs,player:{x:0,z:0}});assert.notEqual(g.state,D.PALUU);}});
t('riista pakenee pelaajaa, oja ja korkeus: tiet tasaisia, oja 0.4–0.6 m',async()=>{const c=new Critter('peura',{x:0,z:0,seed:1});c.update(.1,{threats:[{x:20,z:0}]});assert.equal(c.state,'pakenee');for(let i=0;i<20;i++)c.update(.1,{threats:[{x:20,z:0}]});assert.ok(c.x<-10);});
{const W=await import('../logic/world.js');t('ojat: syvyys 0.4–0.6 m tien vierellä, ajoalue ja piha tasaisia, korkeus −6…+9 m',()=>{let mx=0;for(const r of W.ROADS){if(r.c!=='tie')continue;for(let i=0;i<r.pts.length-1;i+=3){const[a,b]=r.pts[i],[c,d]=r.pts[i+1],L=Math.hypot(c-a,d-b);if(L<1)continue;const ux=-(d-b)/L,uz=(c-a)/L,mx0=(a+c)/2,mz0=(b+d)/2;
    for(let e=-r.w/2;e<r.w/2+0.6;e+=0.3)assert.equal(W.ditch(mx0+ux*e,mz0+uz*e),0);let m=0;for(let e=0;e<4;e+=0.1)m=Math.max(m,W.ditch(mx0+ux*(r.w/2+e),mz0+uz*(r.w/2+e)));mx=Math.max(mx,m);}}
  assert.ok(mx>0.4&&mx<=0.6,mx);assert.equal(W.ditch(W.YARD.x,W.YARD.z),0);assert.equal(W.ditch(W.START.x,W.START.z),0);let lo=1e9,hi=-1e9;for(let x=-590;x<590;x+=20)for(let z=-590;z<590;z+=20){const h=W.height(x,z);lo=Math.min(lo,h);hi=Math.max(hi,h);}assert.ok(lo>-6.5&&hi<9,lo+' '+hi);
  // pihatie ja tie-tie -risteykset: tiellä ei ojaa
  for(const r of W.ROADS)for(const[x,z]of r.pts)if(Math.abs(x)<590&&Math.abs(z)<590)assert.equal(W.ditch(x,z),0,r.n);});}
t('ajettu jänis kaartaa vaiheittain laajan lenkin ja palaa pelaajan/lähtöpaikan lähelle',()=>{const h=new Hare({x:0,z:0,seed:5});const P={x:h.x+40,z:h.z+30};const s0={x:h.x,z:h.z};h.update(.1,{dog:{x:h.x+5,z:h.z},player:P});
  let maxR=0,minLate=1e9,turn=0,ph=h.heading,straight=0;for(let i=0;i<6000;i++){const dog={x:h.x-Math.cos(h.heading)*60,z:h.z-Math.sin(h.heading)*60};h.update(.1,{dog,player:P});if(h.state===H.MAKUU)break;
    const r=Math.hypot(h.x-s0.x,h.z-s0.z);maxR=Math.max(maxR,r);let dh=h.heading-ph;dh=Math.atan2(Math.sin(dh),Math.cos(dh));turn+=Math.abs(dh);ph=h.heading;if(maxR>150)minLate=Math.min(minLate,Math.min(Math.hypot(h.x-P.x,h.z-P.z),r));}
  assert.ok(maxR>150&&maxR<1100,'lenkki '+maxR);assert.ok(minLate<80,'paluu lähelle '+minLate);assert.ok(turn>Math.PI*2,'kaartaa '+turn);});
t('radiojuonto: ~50 % biisien välissä, ei samaa kahdesti peräkkäin, oikea kanava',async()=>{const {pickJuonto}=await import('../logic/radio.js');let last=null,n=0,prev=null;
  const {BIISIT,JUONNOT}=await import('../logic/radio.js');assert.equal(BIISIT,4);assert.equal(JUONNOT,8);
  for(let i=0;i<4000;i++){const j=pickJuonto('tekno',last);if(j){n++;assert.ok(j!==last,j);assert.match(j,/^radio\/juonto_tekno_[1-8]$/);last=j;}}assert.ok(n>1800&&n<2200,n);});
t('tienvarsi: pylväät ojan ulkopuolella, rakennukset irti teistä',async()=>{globalThis.window=globalThis.window||{};globalThis.document=globalThis.document||{createElement:()=>({getContext:()=>new Proxy({},{get:()=>()=>{}})})};
  const W=await import('../logic/world.js'),TV=await import('../public/tienvarsi.js'),THREE=await import('three');const i=TV.setupRoadside(new THREE.Scene(),{ROADS:W.ROADS,height:W.height,distToRoad:W.distToRoad,SIZE:W.SIZE});
  assert.ok(i.valot.length>10&&i.sahko.length>10,[i.valot.length,i.sahko.length]);for(const p of[...i.valot,...i.sahko]){assert.ok(W.distToRoad(p.x,p.z)>0.6+1.8,'ojassa');assert.equal(W.ditch(p.x,p.z),0);}
  assert.deepEqual(i.tilat,{});assert.equal(i.aitta,undefined);
  for(const P of W.YARD_POLYS){let cx=0,cz=0;for(const[x,z]of P){cx+=x;cz+=z;}cx/=P.length;cz/=P.length;assert.ok(W.distToRoad(cx,cz)>5,cx.toFixed(1)+','+cz.toFixed(1));assert.ok(W.inBuilding(cx,cz));}
  assert.ok(W.inBuilding(0,0));assert.ok(!W.inBuilding(W.YARD.x,W.YARD.z));assert.ok(window.__tienvarsi.johtosegmentteja>100);});
t('puut: ei puita 3 m lähempänä rakennuksia, kylttejä tai pylväitä',async()=>{const W=await import('../logic/world.js'),TV=await import('../public/tienvarsi.js'),THREE=await import('three');
  const info=TV.setupRoadside(new THREE.Scene(),{ROADS:W.ROADS,height:W.height,distToRoad:W.distToRoad,SIZE:W.SIZE});const all=W.trees(),T=TV.suodataPuut(all,info,{SIGNS:W.SIGNS,inBuilding:W.inBuilding});
  assert.ok(T.length<all.length&&T.length>all.length*0.8,[all.length,T.length]);const E=TV.esteet(info,W.SIGNS);
  for(const t of T){assert.ok(!W.inBuilding(t.x,t.z,3),'talo');for(const e of E)assert.ok(Math.hypot(t.x-e.x,t.z-e.z)>=e.r,'este');}});
t('narussa koira pysyy 3 m sisällä vaikka pelaaja siirtyy kauas',async()=>{const {Dog}=await import('../logic/dog.js');const d=new Dog({x:0,z:0,leashed:true});d.update(.1,{hares:[],player:{x:300,z:-80}});assert.ok(Math.hypot(d.x-300,d.z+80)<=3,[d.x,d.z]);});
t('aloitusruudun ohjeet kattavat kaikki main.js:n näppäimet, ei passia',async()=>{const fs=await import('fs');const src=fs.readFileSync(new URL('../public/main.js',import.meta.url),'utf8');
  globalThis.localStorage=globalThis.localStorage||{getItem:()=>null};const {OHJEET,KREDIITIT}=await import('../public/aloitus.js');const have=new Set(OHJEET.flatMap(o=>o[2]||[]));
  const used=new Set([...src.matchAll(/e\.code===?'([A-Za-z0-9]+)'/g)].map(m=>m[1]).concat([...src.matchAll(/\b(Key[A-Z]|Digit[0-9]):/g)].map(m=>m[1])));
  for(const k of used)assert.ok(have.has(k),'ohjeista puuttuu '+k);assert.ok(!JSON.stringify(OHJEET).toLowerCase().includes('passi'));assert.ok(!JSON.stringify(OHJEET).toLowerCase().includes('riistakamera'));for(const n of['Lukas Beck','Livlandfahrer','Benboncan','Pierre Grandjean','YleArkisto'])assert.ok(KREDIITIT.includes(n),n);});
{const W=await import('../logic/world.js');const fs=await import('fs');t('eläimet tuplana: 10 jänistä ≥~100 m välein koko kartalla, koira ajaa yhtä, AI-harvennus',()=>{const r=mulberryT(5);const sp=W.spreadHares(10,r);assert.equal(sp.length,10);
  let md=1e9,xs=[],zs=[];for(const a of sp){xs.push(a.x);zs.push(a.z);for(const b of sp)if(a!==b)md=Math.min(md,Math.hypot(a.x-b.x,a.z-b.z));}assert.ok(md>=80,md);assert.ok(Math.max(...xs)-Math.min(...xs)>400&&Math.max(...zs)-Math.min(...zs)>400,'levitys');
  assert.equal(W.aiInterval(50),0);assert.ok(W.aiInterval(400)>0);
  const hs=sp.map((p,k)=>new Hare({...p,seed:k+1}));const h=hs[3],g=new Dog({x:h.home.x+30,z:h.home.z,seed:3});g.command('etsi',{x:h.home.x+30,z:h.home.z},h);let ajo=false;
  for(let i=0;i<18000&&!ajo;i++){g.update(.05,{hares:hs,player:{x:h.home.x+30,z:h.home.z}});for(const x of hs)x.update(.05,{dog:g.pos,player:{x:h.home.x+30,z:h.home.z}});if(g.state===D.AJO)ajo=true;}assert.ok(ajo,'koira ajoon');
  const src=fs.readFileSync(new URL('../public/v09.js',import.meta.url),'utf8');const C=JSON.parse(src.match(/COUNTS=(\{[^}]*\})/)[1].replace(/(\w+):/g,'"$1":'));assert.deepEqual(C,{kettu:2,peura:6,orava:8,teeriParvet:4,teeriParvessa:12,korppi:12,tiainen:24});assert.ok(!/kind:'tiainen'/.test(src)&&!/SphereGeometry\(0\.05/.test(src),'tiaispallot poistettu');assert.match(src,/play3d\('amb_tiainen_'/);assert.match(src,/__tiainenSoitot\+\+/);});}
t('koira kiertää rakennukset eikä ole sisällä pitkässä simulaatiossa',()=>{
  const inside=(x,z)=>dogInside(x,z);
  const out=(ix,iz,ang)=>{let x=ix,z=iz,c=Math.cos(ang),s=Math.sin(ang);for(let k=0;k<90&&inside(x,z);k++){x+=c*0.7;z+=s*0.7;}if(inside(x,z))return null;const p={x:x+c*10,z:z+s*10};return inside(p.x,p.z)?null:p;};
  const ipOf=P=>{let minx=1e9,maxx=-1e9,minz=1e9,maxz=-1e9;for(const[a,b]of P){minx=Math.min(minx,a);maxx=Math.max(maxx,a);minz=Math.min(minz,b);maxz=Math.max(maxz,b);}for(let x=minx;x<=maxx;x+=0.8)for(let z=minz;z<=maxz;z+=0.8)if(inside(x,z))return{x,z};return null;};
  let steps=0,cross=0;
  const run=(A,B)=>{let hit=false;for(let t=0.08;t<1;t+=0.08)if(inside(A.x+(B.x-A.x)*t,A.z+(B.z-A.z)*t))hit=true;if(!hit)return;
    const g=new Dog({x:A.x,z:A.z,seed:2});let i=0;while(Math.hypot(g.x-B.x,g.z-B.z)>2&&i++<7000){g._go(B.x,B.z,0.05,4.5);steps++;assert.ok(!inside(g.x,g.z),'sisällä '+g.x.toFixed(1)+','+g.z.toFixed(1));}
    assert.ok(i<7000,'jumissa');cross++;};
  for(const P of [...BUILDINGS,...YARD_POLYS]){const ip=ipOf(P);if(!ip)continue;for(const ang of[0,Math.PI/2,-Math.PI/3]){const A=out(ip.x,ip.z,ang),B=out(ip.x,ip.z,ang+Math.PI);if(A&&B)run(A,B);}}
  for(const f of farmFootprints())for(const ang of[0,Math.PI/2]){const A=out(f.x,f.z,ang),B=out(f.x,f.z,ang+Math.PI);if(A&&B)run(A,B);}
  run(out(0,0,0.4),out(0,0,0.4+Math.PI));
  const box=bodyBox(new Car({x:120,z:-40,heading:0.6})),gv=new Dog({x:120,z:-70,seed:1});gv.obstacles=[box];
  let iv=0;while(Math.hypot(gv.x-120,gv.z+10)>2&&iv++<3000){gv._go(120,-10,0.05,4.5);steps++;assert.ok(!inside(gv.x,gv.z));
    const dx=gv.x-box.x,dz=gv.z-box.z,c=Math.cos(box.yaw),s=Math.sin(box.yaw),lx=dx*c-dz*s,lz=dx*s+dz*c;assert.ok(!(lx>=box.minx&&lx<=box.maxx&&lz>=box.minz&&lz<=box.maxz),'vitara');}
  assert.ok(iv<3000,'vitara jumissa');
  const P0={x:80,z:-520};assert.ok(!inside(P0.x,P0.z));const far=new Hare({x:5000,z:5000,seed:4});const gh=new Dog({x:P0.x+2,z:P0.z,seed:5});gh.command('irti',P0);gh._haku();
  for(let i=0;i<6000;i++){gh.update(.05,{hares:[far],player:P0});steps++;assert.ok(!inside(gh.x,gh.z),'haku');}
  const ip=ipOf(BUILDINGS[1]),A=out(ip.x,ip.z,0.2),B=out(ip.x,ip.z,0.2+Math.PI);assert.ok(A&&B&&inside(ip.x,ip.z));
  const hare=new Hare({x:B.x,z:B.z,seed:8});hare.trail=[{x:A.x,z:A.z},{x:ip.x,z:ip.z},{x:B.x,z:B.z}];hare.alive=true;hare.speed=6;hare.state='pako';
  const da=new Dog({x:A.x,z:A.z,seed:3});da.state=D.AJO;da.target=hare;da.idx=0;
  for(let i=0;i<5000&&Math.hypot(da.x-B.x,da.z-B.z)>3;i++){da.update(.05,{hare,hares:[hare],player:P0});steps++;assert.ok(!inside(da.x,da.z),'ajo');}
  assert.ok(Math.hypot(da.x-B.x,da.z-B.z)<3,'ajo perille');
  hare.shoot('h');hare.x=B.x;hare.z=B.z;hare.carried=false;hare.delivered=false;hare.held=false;hare.counted=false;
  const dn=new Dog({x:A.x,z:A.z,seed:6});dn.state=D.NOUTO;dn.target=hare;
  for(let i=0;i<5000&&!hare.carried;i++){dn.update(.05,{hare,hares:[hare],player:{x:A.x,z:A.z+40}});steps++;assert.ok(!inside(dn.x,dn.z),'nouto');}
  assert.ok(hare.carried,'nouto');assert.ok(steps>8000&&cross>=8,[steps,cross]);});
t('kyyti: koira pysyy autossa ja hyppy vie korin ulkopuolelle',()=>{
  const c=new Car({x:120,z:-40,heading:0.6}),box=bodyBox(c);
  const loc=(wx,wz)=>{const dx=wx-box.x,dz=wz-box.z,co=Math.cos(box.yaw),si=Math.sin(box.yaw);return [dx*co-dz*si,dx*si+dz*co];};
  const inn=p=>{const [lx,lz]=loc(p.x,p.z);return lx>=box.minx&&lx<=box.maxx&&lz>=box.minz&&lz<=box.maxz;};
  assert.ok(inn(c.cargo(0))&&inn(c.cargo(1)),'tavaratila');assert.ok(!inn(c.dogExit(0))&&!inn(c.dogExit(1)),'hyppy ulos');
  const g=new Dog({x:0,z:0,seed:1,riding:true});
  for(let i=0;i<200;i++)g.update(.05,{player:{x:400,z:0},hares:[],ride:{x:12,z:-4,dir:1}});
  assert.equal(g.x,12);assert.equal(g.z,-4);assert.equal(g.state,D.HAKU);
  g.riding=false;const p=c.dogExit(0);g.x=p.x;g.z=p.z;g._haku();
  for(let i=0;i<30;i++)g.update(.05,{player:{x:400,z:0},hares:[]});
  assert.ok(Math.hypot(g.x-p.x,g.z-p.z)>1);
  const c2=new Car({x:START.x,z:START.z,heading:START.heading});
  for(let i=0;i<30;i++)c2.update(.05,{throttle:1});
  assert.ok(Math.hypot(c2.x-START.x,c2.z-START.z)>5,'lähtöpaikalta pääsee ajamaan');});
console.log(`${n} testiä ok`);
