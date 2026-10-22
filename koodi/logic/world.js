// Yksinkertaistettu Kollinmäki–Koppelontie (n. 62.377 N, 22.927 E), OSM-henkinen käsin tehty layout.
// Koordinaatit metreinä, x = itä, z = etelä. Alue 1200 x 1200 m, keskipiste (0,0).
import { mulberry32 } from './rng.js';
export const SIZE = 1200;
// Koppelontie: metsätie lounaasta koilliseen
export const ROAD = [[-600,380],[-300,250],[-80,120],[60,-20],[220,-200],[420,-340],[600,-420]];
// Pelto Koppelontien varressa
export const FIELD = { x0:-420, z0:180, x1:-120, z1:420 };
export function height(x,z){ // Kollinmäki koillisessa + loivaa aaltoilua
  const d = Math.hypot(x-250, z+250);
  return 18*Math.exp(-(d*d)/(2*220*220)) + 2*Math.sin(x*0.013)*Math.cos(z*0.011);
}
export function distToRoad(x,z){
  let best=1e9;
  for(let i=0;i<ROAD.length-1;i++){const[ax,az]=ROAD[i],[bx,bz]=ROAD[i+1];
    const dx=bx-ax,dz=bz-az;let t=((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz);t=Math.max(0,Math.min(1,t));
    best=Math.min(best,Math.hypot(x-ax-t*dx,z-az-t*dz));}
  return best;
}
export const inField=(x,z)=>x>FIELD.x0&&x<FIELD.x1&&z>FIELD.z0&&z<FIELD.z1;
export const isForest=(x,z)=>!inField(x,z)&&distToRoad(x,z)>6;
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
