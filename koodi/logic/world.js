// Yksinkertaistettu Kollinmäki–Koppelontie (n. 62.377 N, 22.927 E), OSM-henkinen käsin tehty layout.
// Koordinaatit metreinä, x = itä, z = etelä. Alue 1200 x 1200 m, keskipiste (0,0).
import { mulberry32 } from './rng.js';
import { HM, HM_N, HM_STEP, HM_MIN } from './korkeus_data.js';
export const SIZE = 1200;
// Kollinmäki (OSM: bussipysäkit 'Kollinmäki P/E' Yli-Vallintiellä) ~ maailmassa (-117,197)
export const KOLLINMAKI={x:-117,z:197};
// Koppelontie: metsätie lounaasta koilliseen
export const ROAD = [[-600,380],[-300,250],[-80,120],[60,-20],[220,-200],[420,-340],[600,-420]];
// Pelto Koppelontien varressa
export const FIELD = { x0:-420, z0:180, x1:-120, z1:420 };
// Korkeus: oikea korkeusdata (AWS Terrarium, ks. ../korkeus/), metreinä suhteessa mökkiin, pystykorostus 1.5x
export function height(x,z){
  const fx=Math.max(0,Math.min(HM_N-1.001,(x-HM_MIN)/HM_STEP)),fz=Math.max(0,Math.min(HM_N-1.001,(z-HM_MIN)/HM_STEP));
  const i=fx|0,j=fz|0,ax=fx-i,az=fz-j,h=(a,b)=>HM[b*HM_N+a];
  return (h(i,j)*(1-ax)+h(i+1,j)*ax)*(1-az)+(h(i,j+1)*(1-ax)+h(i+1,j+1)*ax)*az;
}
export function distToRoad(x,z){
  let best=1e9;
  for(let i=0;i<ROAD.length-1;i++){const[ax,az]=ROAD[i],[bx,bz]=ROAD[i+1];
    const dx=bx-ax,dz=bz-az;let t=((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz);t=Math.max(0,Math.min(1,t));
    best=Math.min(best,Math.hypot(x-ax-t*dx,z-az-t*dz));}
  return best;
}
// Mökki (Koppelontie 30) Koppelontien pohjoispuolella, piha tien ja mökin välissä
export const CABIN={x:-200,z:160,rot:0}, YARD={x:-196,z:176,r:16};
export const inYard=(x,z)=>Math.hypot(x-YARD.x,z-YARD.z)<YARD.r;
export const drivable=(x,z)=>distToRoad(x,z)<4||inYard(x,z)||inField(x,z);
export const inField=(x,z)=>x>FIELD.x0&&x<FIELD.x1&&z>FIELD.z0&&z<FIELD.z1;
export const isForest=(x,z)=>!inField(x,z)&&distToRoad(x,z)>6&&Math.hypot(x-YARD.x,z-YARD.z)>YARD.r+8;
export function trees(seed=7,n=2600){
  const r=mulberry32(seed),out=[];
  while(out.length<n){const x=(r()-.5)*SIZE,z=(r()-.5)*SIZE; if(isForest(x,z)) out.push({x,z,kind:r()<.75?'kuusi':'koivu',s:0.7+r()*0.6});}
  return out;
}
// Tuuli: suunta johon tuuli PUHALTAA (rad, 0 = pohjoiseen eli -z), voimakkuus m/s
export const WIND = { dir: Math.PI*0.25, speed: 5 }; // lounaistuuli, puhaltaa koilliseen
export function windVec(w=WIND){ return { x: Math.sin(w.dir), z: -Math.cos(w.dir) }; }
const DIRS=['pohjoisesta','koillisesta','idästä','kaakosta','etelästä','lounaasta','lännestä','luoteesta'];
export function windFromText(w=WIND){ const from=(w.dir+Math.PI)%(2*Math.PI); return DIRS[Math.round(from/(Math.PI/4))%8]; }
