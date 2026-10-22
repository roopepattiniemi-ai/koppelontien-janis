import assert from 'node:assert/strict';
import { Hare, H } from '../logic/hare.js';
import { Dog, D } from '../logic/dog.js';
import { audibility } from '../logic/hearing.js';
import { shotgun } from '../logic/shot.js';
let n=0;const t=(name,f)=>{f();n++;console.log('ok',name);};
t('jänis makuulla, paluuperät + sivuloikka yöjäljessä',()=>{const h=new Hare({seed:3});assert.equal(h.state,H.MAKUU);assert.ok(h.nightTrail.at(-1).jump);assert.ok(h.nightTrail.length>90);});
t('jänis lähtee kun koira lähellä, kierto <~1 km',()=>{const h=new Hare({seed:3});h.update(.1,{dog:{x:h.x+5,z:h.z}});assert.equal(h.state,H.PAKO);
  let maxR=0,states=new Set();for(let i=0;i<20000;i++){h.update(.05,{dog:{x:h.x+100,z:h.z},player:{x:9999,z:9999}});states.add(h.state);maxR=Math.max(maxR,Math.hypot(h.x-h.home.x,h.z-h.home.z));}
  assert.ok(states.has(H.KIERTO)&&states.has(H.PALUU),[...states]);assert.ok(maxR<1100,maxR);});
t('liikkumaton pelaaja ei karkota kaukaa',()=>{const h=new Hare({seed:4});h.update(.1,{player:{x:h.x+6,z:h.z},playerMoving:false});assert.equal(h.state,H.MAKUU);});
t('koira: haku -> yöjälki -> ylösotto -> ajo -> hukka',()=>{const h=new Hare({seed:5});const g=new Dog({x:h.home.x+150,z:h.home.z});const seen=new Set();let bark=0;
  for(let i=0;i<40000;i++){g.update(.05,{hare:h,player:{x:h.home.x+150,z:h.home.z}});h.update(.05,{dog:g.pos,player:{x:9999,z:9999}});seen.add(g.state);if(g.barking)bark++;}
  for(const s of Object.values(D))assert.ok(seen.has(s),s+' '+[...seen]);assert.ok(bark>0);});
t('kuuluvuus: etäisyys ja tuuli',()=>{const s={x:0,z:0};assert.ok(audibility(s,{x:0,z:-100})>audibility(s,{x:0,z:-600}));
  const down={x:Math.sin(Math.PI/4)*800,z:-Math.cos(Math.PI/4)*800},up={x:-down.x,z:-down.z};assert.ok(audibility(s,down)>audibility(s,up));assert.equal(audibility(s,{x:5000,z:0}),0);});
t('haulikko: lähellä osuu, kaukana ei',()=>{const o={x:0,y:1.6,z:0},dir={x:0,y:0,z:-1};assert.ok(shotgun(o,dir,{x:0,y:1.6,z:-15})>=3);assert.equal(shotgun(o,dir,{x:0,y:1.6,z:-80}),0);});
console.log(`${n} testiä ok`);
