// Haulikko: haulikuvio (hajonta) + etäisyysvaimennus. Palauttaa osumien määrän.
export function shotgun(origin,dir,target,{pellets=30,spread=0.035,range=45,rand=Math.random,radius=0.3}={}){
  let hits=0;
  for(let i=0;i<pellets;i++){
    const ax=(rand()-.5)*2*spread,ay=(rand()-.5)*2*spread;
    const yaw=Math.atan2(dir.x,-dir.z)+ax,pitch=Math.asin(Math.max(-1,Math.min(1,dir.y)))+ay;
    const d={x:Math.sin(yaw)*Math.cos(pitch),y:Math.sin(pitch),z:-Math.cos(yaw)*Math.cos(pitch)};
    const v={x:target.x-origin.x,y:target.y-origin.y,z:target.z-origin.z},t=v.x*d.x+v.y*d.y+v.z*d.z;
    if(t<0||t>range)continue;
    const miss=Math.hypot(v.x-d.x*t,v.y-d.y*t,v.z-d.z*t);
    if(miss<radius&&rand()<1-Math.pow(t/range,2))hits++;
  }
  return hits;
}
export const KILL_HITS=3;

// v1.1 hauliparvi: siemenestä n haulia (sama tulos kaikilla pelaajilla). Parven säde R(t):
// halkaisija 0.5 m @20 m, 1.5 m @40 m -> R=0.25*(t/20)^log2(3).
import { mulberry32 } from './rng.js';
export const PELLETS=25,SHOT_RANGE=60;
export const swarmR=t=>0.25*Math.pow(Math.max(t,0.5)/20,Math.log2(3));
export function pelletPattern(seed,n=PELLETS){const r=mulberry32(seed|0),out=[];for(let i=0;i<n;i++){const a=r()*Math.PI*2,q=Math.sqrt(r());out.push([Math.cos(a)*q,Math.sin(a)*q]);}return out;}
// kanta: oikea ja ylös suhteessa suuntaan
function basis(d){let rx=-d.z,rz=d.x;const L=Math.hypot(rx,rz)||1;rx/=L;rz/=L;
  const u={x:-d.x*d.y,y:1-d.y*d.y,z:-d.z*d.y},Lu=Math.hypot(u.x,u.y,u.z)||1;return{r:{x:rx,y:0,z:rz},u:{x:u.x/Lu,y:u.y/Lu,z:u.z/Lu}};}
// haulin paikka matkalla t
export function pelletAt(o,d,p,t){const B=basis(d),R=swarmR(t);return{x:o.x+d.x*t+(B.r.x*p[0]+B.u.x*p[1])*R,y:o.y+d.y*t+(B.r.y*p[0]+B.u.y*p[1])*R,z:o.z+d.z*t+(B.r.z*p[0]+B.u.z*p[1])*R};}
// osumat kohteeseen (pallo säteellä radius): palauttaa osuneiden haulien indeksit
export function swarmHits(o,d,target,radius,pattern){const v={x:target.x-o.x,y:target.y-o.y,z:target.z-o.z},t=v.x*d.x+v.y*d.y+v.z*d.z;if(t<=0||t>SHOT_RANGE)return[];
  const out=[];pattern.forEach((p,i)=>{const q=pelletAt(o,d,p,t);if(Math.hypot(q.x-target.x,q.y-target.y,q.z-target.z)<radius)out.push(i);});return out;}
// vahinko: haulimäärä -> kaatuu / haavoittuu / ohi
export const SWARM_KILL=5; export const woundDmg=n=>Math.min(0.9,n*0.18);
export const judgeHits=n=>n>=SWARM_KILL?'kaatui':n>0?'haavoittui':'ohi';
// ohi menneet haulit: missä ne osuvat maahan (height(x,z)), max SHOT_RANGE
export function groundImpacts(o,d,pattern,height,skip=[]){const out=[];pattern.forEach((p,i)=>{if(skip.includes(i))return;for(let t=2;t<=SHOT_RANGE;t+=1){const q=pelletAt(o,d,p,t);if(q.y<=height(q.x,q.z)){out.push({x:q.x,z:q.z,t});break;}}});return out;}
