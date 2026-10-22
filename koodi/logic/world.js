// v0.8: Koppelontie 30 (62.3759391 N, 22.9240875 E) = maailman origo = mökki. OSM + satelliittikuva, ks. ../../osm/rakenna_kentta.py
// Koordinaatit metreinä, x = itä, z = etelä. Alue 1200 x 1200 m.
import { mulberry32 } from './rng.js';
import { HM, HM_N, HM_STEP, HM_MIN } from './korkeus_data.js';
import { ROADS, FIELDS, WATER, BUILDINGS, CABIN, YARD, START, SIGNS } from './kartta_data.js';
export { ROADS, FIELDS, WATER, BUILDINGS, CABIN, YARD, START, SIGNS };
export const SIZE = 1200;
// Korkeus: AWS Terrarium, metreinä suhteessa mökkiin, kerroin 0.375, 17 m suodatus (+ tienvarsiojat, ks. ditch)
export function baseHeight(x,z){
  const fx=Math.max(0,Math.min(HM_N-1.001,(x-HM_MIN)/HM_STEP)),fz=Math.max(0,Math.min(HM_N-1.001,(z-HM_MIN)/HM_STEP));
  const i=fx|0,j=fz|0,ax=fx-i,az=fz-j,h=(a,b)=>HM[b*HM_N+a];
  return (h(i,j)*(1-ax)+h(i+1,j)*ax)*(1-az)+(h(i,j+1)*(1-ax)+h(i+1,j+1)*ax)*az;
}
// Tienvarsioja: alkaa 0.6 m tien reunasta, 1.8 m leveä, 0.5 m syvä, pehmeä (sin²) profiili. Vain 'tie'-luokan teillä;
// missä tahansa tiellä (myös piha/ura, risteykset) ja pihassa oja tasoittuu -> rumpu.
export const DITCH={off:0.6,w:1.8,depth:0.5};
const ss=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
export function ditch(x,z){let et=1e9,ea=1e9;for(const r of ROADS){const bb=r._bb||(r._bb=r.pts.reduce((b,[a,c])=>[Math.min(b[0],a),Math.min(b[1],c),Math.max(b[2],a),Math.max(b[3],c)],[1e9,1e9,-1e9,-1e9]));
  if(x<bb[0]-8||x>bb[2]+8||z<bb[1]-8||z>bb[3]+8)continue;const e=lineDist(x,z,r.pts)-r.w/2;if(e<ea)ea=e;if(r.c==='tie'&&e<et)et=e;}
  const t=(et-DITCH.off)/DITCH.w;if(t<=0||t>=1)return 0;let d=DITCH.depth*Math.sin(Math.PI*t)**2;
  d*=ss(0.2,1.6,ea+(ea===et?2:0)) ;d*=ss(YARD.r,YARD.r+4,Math.hypot(x-YARD.x,z-YARD.z));return d;}
export function height(x,z){return baseHeight(x,z)-ditch(x,z);}
function segDist(x,z,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,L=dx*dx+dz*dz||1;let t=((x-ax)*dx+(z-az)*dz)/L;t=Math.max(0,Math.min(1,t));return Math.hypot(x-ax-t*dx,z-az-t*dz);}
function lineDist(x,z,pts){let b=1e9;for(let i=0;i<pts.length-1;i++){const[ax,az]=pts[i],[bx,bz]=pts[i+1];if(Math.abs(x-ax)>b+400&&Math.abs(x-bx)>b+400)continue;b=Math.min(b,segDist(x,z,ax,az,bx,bz));}return b;}
// etäisyys tien reunaan (0 = tiellä); kaikki tieluokat (tie, piha, ura)
export function distToRoad(x,z,cls){let b=1e9;for(const r of ROADS){if(cls&&r.c!==cls)continue;b=Math.min(b,lineDist(x,z,r.pts)-r.w/2);}return Math.max(0,b);}
export function distToWater(x,z){let b=1e9;for(const w of WATER)b=Math.min(b,lineDist(x,z,w.pts));return b;}
function inPoly(x,z,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const[xi,zi]=P[i],[xj,zj]=P[j];if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)c=!c;}return c;}
export const inField=(x,z)=>FIELDS.some(P=>inPoly(x,z,P));
export const inBuilding=(x,z,m=0)=>BUILDINGS.some(P=>{let cx=0,cz=0;for(const[a,b]of P){cx+=a;cz+=b;}cx/=P.length;cz/=P.length;return Math.hypot(x-cx,z-cz)<12+m&&inPolyM(x,z,P,cx,cz,m);})||Math.hypot(x-CABIN.x,z-CABIN.z)<5+m;
function inPolyM(x,z,P,cx,cz,m){return m<=0?inPoly(x,z,P):Math.hypot(x-cx,z-cz)<12+m;}
export const inYard=(x,z)=>Math.hypot(x-YARD.x,z-YARD.z)<YARD.r;
export const drivable=(x,z)=>(distToRoad(x,z)<0.6||inYard(x,z)||inField(x,z))&&!inBuilding(x,z)&&Math.abs(x)<SIZE/2&&Math.abs(z)<SIZE/2;
// metsä = oletusmaankäyttö (satelliittikuvan mukaan tiheät kuusikot), ei pellolla, teillä, pihassa, talojen tai ojien päällä
export const isForest=(x,z)=>!inField(x,z)&&distToRoad(x,z)>3&&distToWater(x,z)>2.5&&Math.hypot(x-YARD.x,z-YARD.z)>YARD.r+3&&!inBuilding(x,z,6);
export function trees(seed=7,n=12000){
  const r=mulberry32(seed),out=[];let tries=0;
  while(out.length<n&&tries++<n*6){const x=(r()-.5)*SIZE,z=(r()-.5)*SIZE;
    if(isForest(x,z)){const q=r();const m=q<.74?'kuusi_'+(1+(r()*4|0)):q<.82?'manty_'+(1+(r()*2|0)):q<.89?'koivu_'+(1+(r()*2|0)):q<.95?'taimi_'+(1+(r()*2|0)):q<.99?'kanto_'+(1+(r()*2|0)):'kaatunut_runko_1';
      out.push({x,z,model:m,kind:m.startsWith('koivu')?'koivu':'kuusi',s:0.8+r()*0.4,rot:r()*Math.PI*2});}
    else if(distToWater(x,z)<4&&!inField(x,z)&&distToRoad(x,z)>3&&r()<.3) out.push({x,z,model:'koivu_'+(1+(r()*2|0)),kind:'koivu',s:0.9,rot:r()*6.28}); }  // puurivi ojan varrella
  return out;
}
// jäniksen makuu: metsässä, kaukana taloista/teistä, 120–500 m mökistä
export function hareSpot(rand){for(let i=0;i<500;i++){const a=rand()*Math.PI*2,d=120+rand()*380,x=Math.cos(a)*d,z=Math.sin(a)*d;if(Math.abs(x)<520&&Math.abs(z)<520&&isForest(x,z)&&distToRoad(x,z)>25&&!inBuilding(x,z,30))return{x,z};}return{x:-200,z:150};}
// Tuuli: suunta johon tuuli PUHALTAA (rad, 0 = pohjoiseen eli -z), voimakkuus m/s
export const WIND = { dir: Math.PI*0.25, speed: 5 }; // lounaistuuli, puhaltaa koilliseen
export function windVec(w=WIND){ return { x: Math.sin(w.dir), z: -Math.cos(w.dir) }; }
const DIRS=['pohjoisesta','koillisesta','idästä','kaakosta','etelästä','lounaasta','lännestä','luoteesta'];
export function windFromText(w=WIND){ const from=(w.dir+Math.PI)%(2*Math.PI); return DIRS[Math.round(from/(Math.PI/4))%8]; }
