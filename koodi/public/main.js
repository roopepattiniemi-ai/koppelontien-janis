import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as V8 from '/v08.js';
import * as V9 from '/v09.js';
import * as TV from '/tienvarsi.js';
import * as AL from '/aloitus.js';
import { pickJuonto, BIISIT } from '/logic/radio.js';
import { judgeShot, LAJIT } from '/logic/rules.js';
import { Car, bodyBox } from '/logic/car.js';
import { CABIN, YARD, START, SIGNS, inBuilding, SAUNA_POLY, NAVETTA_POLY } from '/logic/world.js';
import { spreadHares, aiInterval } from '/logic/world.js';
import { clampB } from '/logic/bounds.js';
import { height, ROADS, WATER, BUILDINGS, SIZE, trees, inField, isForest, distToRoad, hareSpot, WIND, windFromText } from '/logic/world.js';
import { Hare, H } from '/logic/hare.js';
import { Dog, D } from '/logic/dog.js';
import { audibility } from '/logic/hearing.js';
import { toLocal, rayEllipsoid, closestOnTris, ellipsoidFromBox } from '/logic/osumat.js'
import { pelletPattern, swarmHits, judgeHits, woundDmg, groundImpacts, pelletAt, SHOT_RANGE } from '/logic/shot.js';
import { roomSeed, newRoomCode, packWorld, applyWorld, seatFor, startSeat } from '/logic/sync.js';
import { saunaPiste, saunaEtu, nearSauna, yhteenveto, riviPaikat, yhteenvetoTeksti, lopetusPyynto } from '/logic/lopetus.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import * as NETM from '/net.js';
import { mulberry32 } from '/logic/rng.js';
import { ditch, distToWater } from '/logic/world.js';
// maailman siemen: huonekoodista (molemmilla sama maailma ilman init-viestiä), yksinpelissä satunnainen
const ROOM=new URLSearchParams(location.search).get('huone');const WSEED=ROOM?roomSeed(ROOM.toUpperCase()):(Math.random()*2**32)>>>0;window.__WSEED=WSEED;let ME='h';
const feedOk=(x,z)=>inField(x,z)||distToWater(x,z)<8||ditch(x,z)>0.05;
const G='/grafiikka/', $=id=>document.getElementById(id);
// ---------- renderöinti: matala sisäinen resoluutio, sumu ----------
let RW=640,RH=400;const RES=[[320,200],[640,400],[960,600]];let resI=+(new URLSearchParams(location.search).get('res')??1);[RW,RH]=RES[resI]||RES[1]; const renderer=new THREE.WebGLRenderer({antialias:false});
renderer.setPixelRatio(1); renderer.setSize(RW,RH,false); document.body.prepend(renderer.domElement);
const scene=new THREE.Scene(); scene.background=new THREE.Color(0xb0bed2); scene.fog=new THREE.FogExp2(0xb0bed2,0.012);
const cam=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,0.05,600); cam.rotation.order='YXZ';
addEventListener('resize',()=>{cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();});
const hemi=new THREE.HemisphereLight(0xc8d4e8,0x8899aa,1.6); scene.add(hemi); const sun=new THREE.DirectionalLight(0xf0f0f4,1.1); sun.position.set(-1,0.35,1); scene.add(sun);
// ---------- tekstuurit: oikea tiedosto tai proseduraalinen varatekstuuri ----------
const TL=new THREE.TextureLoader();
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);return new THREE.CanvasTexture(c);}
function nearest(t,rep){t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;t.colorSpace=THREE.SRGBColorSpace;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;}return t;}
function tex(urls,fallback,rep){const t=nearest(fallback(),rep);(async()=>{for(const u of urls){try{const r=await TL.loadAsync(G+u);t.image=r.image;t.needsUpdate=true;return;}catch{}}})();return t;}
const noise=(base,v)=>(g,w,h)=>{for(let y=0;y<h;y++)for(let x=0;x<w;x++){const k=base+Math.random()*v|0;g.fillStyle=`rgb(${k},${k},${k+8})`;g.fillRect(x,y,1,1);}};
const lumiT=tex(['tekstuurit/lumi_64.png'],()=>canvasTex(64,64,noise(225,25)),true);
const tieT=tex(['tekstuurit/metsatie_64.png'],()=>canvasTex(64,64,noise(190,30)),true);
const peltoT=tex(['tekstuurit/pelto_64.png'],()=>canvasTex(64,64,noise(238,15)),true);
const taivasT=tex(['tekstuurit/taivas_256x128.png','taivas_256x128.png'],()=>canvasTex(4,64,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#8fa9c4');gr.addColorStop(1,'#d8e0e8');g.fillStyle=gr;g.fillRect(0,0,w,h);}));
const treeFb=(col,trunk)=>()=>canvasTex(64,128,(g)=>{g.fillStyle=trunk;g.fillRect(28,90,8,38);g.fillStyle=col;g.beginPath();g.moveTo(32,0);g.lineTo(60,100);g.lineTo(4,100);g.fill();g.fillStyle='#eef';g.fillRect(14,60,10,4);g.fillRect(38,40,8,3);});
const kuusiT=tex(['tekstuurit/kuusi_billboard.png'],treeFb('#1f3d2a','#3b2a1a'));
const koivuT=tex(['tekstuurit/koivu_billboard.png'],treeFb('#55604a','#ddd'));
const jalkiT={janis:canvasTex(64,64,g=>{// v1.1b: tyypillinen jäniksen kuvio, takajalat (pitkät, rinnakkain) edessä, etujalat peräkkäin takana; syvä painauma
  const pr=(x,y,rx,ry)=>{g.fillStyle='rgba(120,135,160,0.55)';g.beginPath();g.ellipse(x,y,rx+2.5,ry+2.5,0,0,7);g.fill();g.fillStyle='rgb(30,37,52)';g.beginPath();g.ellipse(x,y+0.8,rx,ry,0,0,7);g.fill();g.fillStyle='rgb(12,15,24)';g.beginPath();g.ellipse(x,y+1.6,rx*0.6,ry*0.65,0,0,7);g.fill();};
  pr(21,14,6,11);pr(43,14,6,11);pr(32,38,4.5,6);pr(30,54,4.5,6);}),
              koira:tex(['jaljet/koira_jalki_32.png'],()=>canvasTex(32,32,g=>{g.fillStyle='#7c8796';g.fillRect(11,12,10,10);g.fillRect(10,5,3,4);g.fillRect(19,5,3,4);g.fillRect(14,3,4,4);}))};
{const s=new THREE.Mesh(new THREE.SphereGeometry(500,16,8),new THREE.MeshBasicMaterial({map:taivasT,side:THREE.BackSide,fog:false}));scene.add(s);window._sky=s;}
// ---------- maasto ----------
const seg=240, tg=new THREE.PlaneGeometry(SIZE,SIZE,seg,seg); tg.rotateX(-Math.PI/2);
// ojien kohdalla karkea (5 m) maasto lasketaan alas, jotta tarkka ojanauha jää näkyviin
const pa=tg.attributes.position; for(let i=0;i<pa.count;i++){const x=pa.getX(i),z=pa.getZ(i);pa.setY(i,height(x,z)-(distToRoad(x,z,'tie')<5.5?0.6:0));} tg.computeVertexNormals();
lumiT.repeat.set(SIZE/8,SIZE/8); const terrainMat=new THREE.MeshLambertMaterial({map:lumiT,flatShading:true,emissive:0x1a1e26});scene.add(new THREE.Mesh(tg,terrainMat));
// v1.1 ulkomaa: karkea lumitaso kentän ulkopuolelle, jotta tiet jatkuvat sumuun ilman tyhjää (pelaaja ei pääse sinne)
{const og=new THREE.PlaneGeometry(4000,4000,200,200);og.rotateX(-Math.PI/2);const p=og.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);const e=Math.min(1,Math.max(0,(SIZE/2-Math.max(Math.abs(x),Math.abs(z)))/20));p.setY(i,height(x,z)-0.35*e);}og.computeVertexNormals();scene.add(new THREE.Mesh(og,terrainMat));}
// maankäyttö maaston värinä: pellot kirkkaampi lumi, metsänpohja varjoisampi
{const col=[],cc=new THREE.Color();for(let i=0;i<pa.count;i++){const x=pa.getX(i),z=pa.getZ(i);cc.set(inField(x,z)?0xfffcf4:isForest(x,z)?0xc4ccd8:0xeef0f4);col.push(cc.r,cc.g,cc.b);}
 tg.setAttribute('color',new THREE.Float32BufferAttribute(col,3));terrainMat.vertexColors=true;terrainMat.needsUpdate=true;}
// nauhat maaston pinnalle: tiet (auratut), lumipenkat, pihatie, ura, jäätyneet ojat
function strip(pts,w,yoff,mat,off=0,uvL=6){const v=[],uv=[];let acc=0;
  for(let i=0;i<pts.length-1;i++){const[ax,az]=pts[i],[bx,bz]=pts[i+1],L=Math.hypot(bx-ax,bz-az)||1,ux=-(bz-az)/L,uz=(bx-ax)/L,n=Math.ceil(L/5);
    for(let k=0;k<n;k++){const P=t=>[ax+(bx-ax)*t+ux*off,az+(bz-az)*t+uz*off],[x0,z0]=P(k/n),[x1,z1]=P((k+1)/n),u0=acc/uvL,u1=(acc+L/n)/uvL;acc+=L/n;const hx=ux*w/2,hz=uz*w/2;
      const q=[[x0+hx,z0+hz,0,u0],[x0-hx,z0-hz,1,u0],[x1-hx,z1-hz,1,u1],[x1+hx,z1+hz,0,u1]];for(const j of[0,1,2,0,2,3]){const[x,z,a2,b2]=q[j];v.push(x,height(x,z)+yoff,z);uv.push(a2,b2);}}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();
  const m=new THREE.Mesh(g,mat);scene.add(m);return m;}
{const tieM=new THREE.MeshLambertMaterial({map:tieT,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2});
 const uraM=new THREE.MeshLambertMaterial({map:peltoT,color:0xdde2ea,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2});
 const penkkaM=new THREE.MeshLambertMaterial({map:lumiT,color:0xffffff,emissive:0x202630,side:THREE.DoubleSide});
 const ojaM=new THREE.MeshLambertMaterial({map:lumiT,color:0xffffff,emissive:0x1a1e26,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1});
 const jaaM=new THREE.MeshLambertMaterial({color:0xa9bccd,emissive:0x101820,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1});
 for(const w of WATER)strip(w.pts,w.w,0.04,jaaM);
 TV.setupRoads(ROADS,strip,ojaM,penkkaM);const TVI=TV.setupRoadside(scene,{ROADS,height,distToRoad,SIZE});window.__tvi=TVI;
 for(const r of ROADS){if(r.c==='tie'){}else strip(r.pts,r.w,0.07,r.c==='piha'?tieM:uraM);}}
// talot: suunnattu laatikko + lumikatto
{const wallC=[0x8e2a20,0xd8c48a,0xe8e4dc,0x9a3a28];
 BUILDINGS.forEach((P,i)=>{let cx=0,cz=0;for(const[a2,b2]of P){cx+=a2;cz+=b2;}cx/=P.length;cz/=P.length;const ang=Math.atan2(P[1][1]-P[0][1],P[1][0]-P[0][0]),c=Math.cos(ang),sn=Math.sin(ang);
  let u0=1e9,u1=-1e9,v0=1e9,v1=-1e9;for(const[a2,b2]of P){const u=(a2-cx)*c+(b2-cz)*sn,v=-(a2-cx)*sn+(b2-cz)*c;u0=Math.min(u0,u);u1=Math.max(u1,u);v0=Math.min(v0,v);v1=Math.max(v1,v);}
  const L=Math.max(3,u1-u0),W=Math.max(3,v1-v0),g=new THREE.Group();{const wm=new THREE.Mesh(new THREE.BoxGeometry(L,3,W),new THREE.MeshLambertMaterial({color:wallC[i%4]}));wm.position.y=1.5;g.add(wm);}const roof=new THREE.Mesh(new THREE.CylinderGeometry(0.01,W*0.62,2,4,1),new THREE.MeshLambertMaterial({color:0xf4f6fa,flatShading:true}));
  roof.rotation.y=Math.PI/4;roof.scale.set(L/W*1.41,1,1);roof.position.y=4;g.add(roof);g.position.set(cx,height(cx,cz),cz);g.rotation.y=-ang;scene.add(g);});}
// puut: InstancedMesh per malli (grafiikka/mallit/kasvit/*.glb); varana kartiopuu/runko
const TREE_H={kuusi_1:6,kuusi_2:9.5,kuusi_3:13,kuusi_4:16,manty_1:14,manty_2:17,koivu_1:12,koivu_2:15,taimi_1:1.5,taimi_2:2.5,kanto_1:0.5,kanto_2:0.6,kaatunut_runko_1:0.6};
const NEAR=[];const TREES=TV.suodataPuut(trees(),window.__tvi,{SIGNS,inBuilding});{const groups={};for(const t of TREES)(groups[t.model]??=[]).push(t);
 const fbGeo=(m,h)=>m.startsWith('kaatunut')?new THREE.CylinderGeometry(0.25,0.3,8,5).rotateX(Math.PI/2).translate(0,0.3,0):m.startsWith('kanto')?new THREE.CylinderGeometry(0.3,0.35,h,6).translate(0,h/2,0):new THREE.ConeGeometry(m.startsWith('koivu')?h*0.18:h*0.22,h,6).translate(0,h/2,0);
 const fbMat={kuusi:new THREE.MeshLambertMaterial({color:0x2a4a34,flatShading:true}),koivu:new THREE.MeshLambertMaterial({color:0x8a8f7a,flatShading:true}),muu:new THREE.MeshLambertMaterial({color:0x5a4a3a,flatShading:true})};
 const M=new THREE.Matrix4(),Qt=new THREE.Quaternion(),Sv=new THREE.Vector3(),Pv=new THREE.Vector3(),Yv=new THREE.Vector3(0,1,0);window.__puuvirheet=[];
 for(const [m,list] of Object.entries(groups)){const h=TREE_H[m]||8;const mat=m.startsWith('kuusi')||m.startsWith('manty')||m.startsWith('taimi')?fbMat.kuusi:m.startsWith('koivu')?fbMat.koivu:fbMat.muu;
  const im=new THREE.InstancedMesh(fbGeo(m,h),mat,list.length);im.count=0;im.frustumCulled=false;scene.add(im);for(const t of list){t.y=height(t.x,t.z)-0.1;t.h=h;t.im=im;}NEAR.push(im);
  new GLTFLoader().load(G+'mallit/kasvit/'+m+'.glb',gl=>{let mesh=null;gl.scene.updateMatrixWorld(true);gl.scene.traverse(o=>{if(o.isMesh&&!mesh)mesh=o;});if(!mesh){window.__puuvirheet.push(m+': ei meshiä');return;}
    const g=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);const mt=mesh.material.clone();if(g.attributes.color)mt.vertexColors=true;mt.flatShading=true;im.geometry.dispose();im.geometry=g;im.material=mt;},
   undefined,e=>{window.__puuvirheet.push(m+': '+(e.message||e));console.warn('puumalli ei aukea',m);});}}
// ---------- v1.1b puiden LOD + kulling + grafiikka-asetus ----------
// lähellä: GLB-instanssit (per malli), kauempana yksi halpa kartio-InstancedMesh, sumun takana ei mitään. Solut 50 m, frustum-testi soluittain.
const LAATU={matala:{rn:45,rf:140,fog:0.016},keski:{rn:80,rf:190,fog:0.012},korkea:{rn:130,rf:240,fog:0.009}},LN=Object.keys(LAATU);
const qs=new URLSearchParams(location.search);let laatu=qs.get('laatu')||localStorage.getItem('jahti_laatu')||'keski';if(!LAATU[laatu])laatu='keski';const autoQ=qs.get('auto')!=='0';
const farGeo=new THREE.ConeGeometry(1,1,5).translate(0,0.5,0),farIM=new THREE.InstancedMesh(farGeo,new THREE.MeshLambertMaterial({color:0xffffff,flatShading:true}),TREES.length);
farIM.count=0;farIM.frustumCulled=false;scene.add(farIM);const CK={kuusi:new THREE.Color(0x2a4a34),koivu:new THREE.Color(0x7d8470)};
const CELL=50,cells=new Map();for(const t of TREES){if(t.model.startsWith('kanto')||t.model.startsWith('kaatunut'))t.nofar=true;const k=Math.floor(t.x/CELL)+','+Math.floor(t.z/CELL);let c=cells.get(k);if(!c)cells.set(k,c={x:(Math.floor(t.x/CELL)+.5)*CELL,z:(Math.floor(t.z/CELL)+.5)*CELL,l:[]});c.l.push(t);}
const FR=new THREE.Frustum(),PM=new THREE.Matrix4(),SPH=new THREE.Sphere(),LQ=new THREE.Quaternion(),LS=new THREE.Vector3(),LP=new THREE.Vector3(),LM=new THREE.Matrix4(),LY=new THREE.Vector3(0,1,0);
let lodT=9,lodX=1e9,lodZ=0,lodD=new THREE.Vector3(),fpsT=0,fpsN=0,dropT=0;
function setLaatu(n,why){laatu=n;localStorage.setItem('jahti_laatu',n);scene.fog.density=LAATU[n].fog;lodT=9;if(why)say?.('Grafiikka: '+n+(why==='auto'?' (automaattinen pudotus, FPS matala)':''));}
setLaatu(laatu);window.__laatu=()=>laatu;window.__setLaatu=setLaatu;
addEventListener('keydown',e=>{if(e.code==='KeyL'&&!e.repeat)setLaatu(LN[(LN.indexOf(laatu)+1)%3],'k');});
function treeLOD(dt){fpsT+=dt;fpsN++;dropT+=dt;if(fpsT>=4){const f=fpsN/fpsT;fpsT=0;fpsN=0;if(autoQ&&f<24&&dropT>10&&laatu!=='matala'){dropT=0;setLaatu(LN[LN.indexOf(laatu)-1],'auto');}}
  cam.updateMatrixWorld();const dv=cam.getWorldDirection(new THREE.Vector3()),cx=cam.position.x,cz=cam.position.z;lodT+=dt;
  if(lodT<0.25&&Math.hypot(cx-lodX,cz-lodZ)<6&&dv.dot(lodD)>0.97)return;lodT=0;lodX=cx;lodZ=cz;lodD.copy(dv);
  const Q=LAATU[laatu],rn2=Q.rn*Q.rn,rf2=Q.rf*Q.rf;PM.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse);FR.setFromProjectionMatrix(PM);
  for(const im of NEAR)im.count=0;let nf=0;
  for(const c of cells.values()){const dx=c.x-cx,dz=c.z-cz;if(dx*dx+dz*dz>(Q.rf+CELL)**2)continue;SPH.center.set(c.x,cam.position.y,c.z);SPH.radius=CELL*0.75+15;if(!FR.intersectsSphere(SPH))continue;
    for(const t of c.l){const ex=t.x-cx,ez=t.z-cz,d2=ex*ex+ez*ez;if(d2>rf2)continue;
      LQ.setFromAxisAngle(LY,t.rot);LP.set(t.x,t.y,t.z);
      if(d2<rn2){const im=t.im;if(im.count>=im.instanceMatrix.count)continue;LS.setScalar(t.s);LM.compose(LP,LQ,LS);im.setMatrixAt(im.count++,LM);}
      else if(!t.nofar){const w=t.h*t.s*(t.kind==='koivu'?0.16:0.2);LS.set(w,t.h*t.s,w);LM.compose(LP,LQ,LS);farIM.setMatrixAt(nf,LM);farIM.setColorAt(nf++,CK[t.kind]||CK.kuusi);}}}
  for(const im of NEAR)im.instanceMatrix.needsUpdate=true;farIM.count=nf;farIM.instanceMatrix.needsUpdate=true;if(farIM.instanceColor)farIM.instanceColor.needsUpdate=true;}
window.__lod=()=>({near:NEAR.reduce((a,m)=>a+m.count,0),far:farIM.count,laatu});
// ---------- eläimet: GLB tai varamuoto ----------
function animal(file,fb){const g=new THREE.Group();g.add(fb);scene.add(g);
  new GLTFLoader().load(G+'mallit/'+file,gl=>{gl.scene.traverse(o=>{if(o.isMesh&&o.geometry.attributes.color){o.material.vertexColors=true;}});g.clear();g.add(gl.scene);g.userData.n=V8.bindNodes(gl.scene);},undefined,()=>{});return g;}
const box=(w,h,d,c,y)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color:c}));m.position.y=y;return m;};
const hareObj=animal('janis.glb',box(0.25,0.3,0.5,0xf4f6f8,0.15)), DOGBREED=new URLSearchParams(location.search).get('koira')==='terrieri'?'terrieri':'ajokoira',dogObj=animal(DOGBREED==='terrieri'?'koira_jagdterrier.glb':'ajokoira.glb',box(0.3,0.55,0.9,0xa0582a,0.4)); // terrieri ilman skaalausta, animaatio DOG_K
// ---------- mökki + Vitara: GLB jos löytyy, muuten laatikkomalli ----------
function model(files,fb,pos,rot,onLoad){const g=new THREE.Group();g.add(fb);g.position.set(pos.x,height(pos.x,pos.z),pos.z);g.rotation.y=rot;scene.add(g);
  (function next(i){if(i>=files.length)return;new GLTFLoader().load(G+'mallit/'+files[i],gl=>{gl.scene.traverse(o=>{if(o.isMesh&&o.geometry.attributes.color)o.material.vertexColors=true;});g.clear();g.add(gl.scene);onLoad&&onLoad(gl.scene);},undefined,()=>next(i+1));})(0);return g;}
const cabinFb=new THREE.Group();{const w=box(8,3,6,0x9a2a20,1.5);cabinFb.add(w);for(const[x,z]of[[-4,-3],[4,-3],[-4,3],[4,3]]){const c=box(0.3,3,0.3,0xffffff,1.5);c.position.x=x;c.position.z=z;cabinFb.add(c);}
  const r=new THREE.Mesh(new THREE.ConeGeometry(6.2,2.2,4),new THREE.MeshLambertMaterial({color:0xf4f6fa,flatShading:true}));r.position.y=4.1;r.rotation.y=Math.PI/4;r.scale.z=0.8;cabinFb.add(r);
  const d=box(1,2,0.1,0x5a3a20,1);d.position.z=3.05;cabinFb.add(d);}
const cabinM=model(['mokki.glb'],cabinFb,CABIN,CABIN.rot);if(CABIN.sx)cabinM.scale.set(CABIN.sx,1,CABIN.sz);
let savuMerkki=null;
// Tynnyrisauna (Ø 2,9 × 5,0 m) ja L-navetta: sama pohja kuin world.js:n törmäyspolygonit.
{const wood=new THREE.MeshLambertMaterial({color:0x6a3a22}),band=new THREE.MeshLambertMaterial({color:0x8a9098});
 const g=new THREE.Group();const body=new THREE.Mesh(new THREE.CylinderGeometry(1.45,1.45,5,18),wood);body.rotation.z=Math.PI/2;g.add(body);
 for(const x of[-1.6,0,1.6]){const t=new THREE.Mesh(new THREE.TorusGeometry(1.48,0.055,6,16),band);t.rotation.y=Math.PI/2;t.position.x=x;g.add(t);}
 const door=box(0.08,1.15,0.7,0x3a2418,0.85);door.position.set(2.52,0,0);g.add(door);
 const pipe=new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.15,0.85,8),new THREE.MeshLambertMaterial({color:0x2c2c2c}));pipe.position.set(0.15,1.9,0);g.add(pipe);
 savuMerkki=new THREE.Object3D();savuMerkki.position.set(0.15,2.4,0);g.add(savuMerkki);
 let sx=0,sz=0;for(const[x,z]of SAUNA_POLY){sx+=x;sz+=z;}sx/=SAUNA_POLY.length;sz/=SAUNA_POLY.length;
 g.rotation.y=Math.atan2(0.962,0.272);g.position.set(sx,height(sx,sz)+1.45,sz);scene.add(g);
 const polyMesh=(pts,h,color,y0)=>{const s=new THREE.Shape(),p=pts.map(([x,z])=>[x,-z]);let a=0;for(let i=0,j=p.length-1;i<p.length;j=i++)a+=p[j][0]*p[i][1]-p[i][0]*p[j][1];const q=a<0?[...p].reverse():p;
  s.moveTo(q[0][0],q[0][1]);for(let i=1;i<q.length;i++)s.lineTo(q[i][0],q[i][1]);const geo=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:false});geo.rotateX(-Math.PI/2);
  const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color}));m.position.y=y0;scene.add(m);};
 let nx=0,nz=0;for(const[x,z]of NAVETTA_POLY){nx+=x;nz+=z;}nx/=NAVETTA_POLY.length;nz/=NAVETTA_POLY.length;const gy=height(nx,nz);
 polyMesh(NAVETTA_POLY,3.8,0x8e2a20,gy);polyMesh(NAVETTA_POLY,0.4,0xe8eef2,gy+3.8);}
const car=START?.autossa?new Car({x:START.x,z:START.z,heading:START.heading}):new Car({x:YARD.x+4,z:YARD.z-5,heading:0});
// kyltit (logic/kyltit.json + grafiikka/tekstuurit/kyltit)
V8.setupSigns(scene,SIGNS||[],height);
const carFb=new THREE.Group();{carFb.add(box(1.7,1.1,3.6,0x2f4f6f,0.85));const t=box(1.6,0.8,2.2,0x2f4f6f,1.75);t.position.z=0.3;carFb.add(t);const w=box(1.62,0.5,0.1,0x223344,1.75);w.position.z=-0.82;carFb.add(w);
  for(const[x,z]of[[-0.85,-1.2],[0.85,-1.2],[-0.85,1.2],[0.85,1.2]]){const c=new THREE.Mesh(new THREE.CylinderGeometry(0.36,0.36,0.25,8),new THREE.MeshLambertMaterial({color:0x111111}));c.rotation.z=Math.PI/2;c.position.set(x,0.36,z);carFb.add(c);}}
const wheels={};let door=null,doorT=0;
const carObj=model(['vitara.glb'],carFb,car,0,sc=>{for(const n of['pyora_ev','pyora_eo','pyora_tv','pyora_to'])wheels[n]=sc.getObjectByName(n);door=sc.getObjectByName('ovi_kuljettaja');if(door)door.userData.r0=door.rotation.y;});
const interior=V8.setupInterior(scene), vm=V8.setupViewmodel(), WP=V9.setupWeapons(vm);
const FREQ={parkano:'98.4',country:'103.7',tekno:'91.1'};
// ---------- jäljet lumessa (decalit, suunta) ----------
// v1.1: kaikki lumidekaalit (jäljet, veri, haulien pöllähdykset) InstancedMeshinä; data tallessa, näkyviin vain lähimmät
// TRACK_R metrin sisällä, max MAXJ/laji; uudelleenrakennus 0.5 s välein tai kun pelaaja siirtyy >10 m.
const MAXJ=1500,TRACK_R=160,MAXDATA=20000; const jg=new THREE.PlaneGeometry(0.3,0.3).rotateX(-Math.PI/2);
const blot=(col,n,r)=>canvasTex(32,32,g=>{g.fillStyle=col;for(let k=0;k<n;k++){const a=k*2.4,d=k?r*Math.sqrt(k/n)*10:0;g.beginPath();g.arc(16+Math.cos(a)*d,16+Math.sin(a)*d,k?2+((k*7)%3):6,0,7);g.fill();}});
const TEXS={janis:jalkiT.janis,koira:jalkiT.koira,kettu:V9.trackCanvas('kettu'),peura:V9.trackCanvas('peura'),veri:canvasTex(32,32,g=>{// v1.1c pisaramaiset roiskeet
  g.fillStyle='#6e0a0a';const D=[[16,16,3.2,0],[8,10,1.6,0.6],[24,9,1.3,-0.5],[25,22,1.8,0.9],[9,24,1.2,2.4],[18,5,1,0],[4,17,0.9,0],[28,15,0.8,0]];for(const[x,y,r,a]of D){g.beginPath();g.ellipse(x,y,r,r*1.6,a,0,7);g.fill();}}),polly:blot('rgba(150,160,175,0.7)',6,1)};
const SIZES={veri:0.17,polly:0.22,janis:1.6};
const jm={},jd={},jn={};for(const k in TEXS){jm[k]=new THREE.InstancedMesh(jg,new THREE.MeshBasicMaterial({map:TEXS[k],transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}),MAXJ);jm[k].count=0;jm[k].frustumCulled=false;scene.add(jm[k]);jd[k]=[];jn[k]=0;}
const M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),Y=new THREE.Vector3(0,1,0),_tp=new THREE.Vector3(),_ts=new THREE.Vector3();
let trackDirty=true,trackAt={x:1e9,z:1e9},trackT=0;
function addTrack(kind,p){const a=jd[kind];if(a.length>=MAXDATA)a.shift();a.push({x:p.x,z:p.z,dir:p.dir||0,y:height(p.x,p.z)+0.1+(kind==='veri'?0.005:0),s:p.s||SIZES[kind]||1});trackDirty=true;}
function cullTracks(px,pz){for(const k in jd){const a=jd[k],m=jm[k];let n=0;for(let i=a.length-1;i>=0&&n<MAXJ;i--){const p=a[i];if(Math.abs(p.x-px)>TRACK_R||Math.abs(p.z-pz)>TRACK_R)continue;
  Q.setFromAxisAngle(Y,-p.dir);_tp.set(p.x,p.y,p.z);_ts.set(p.s,1,p.s);M4.compose(_tp,Q,_ts);m.setMatrixAt(n++,M4);}m.count=n;m.instanceMatrix.needsUpdate=true;}trackDirty=false;trackAt={x:px,z:pz};}
window.__tracks=()=>{const o={};for(const k in jd)o[k]=[jd[k].length,jm[k].count];return o;};
// ---------- naru: tekstuuri toistuu pystysuunnassa, venyy kädestä pantaan ----------
const hihnaT=tex(['tekstuurit/hihna.png'],()=>canvasTex(16,64,g=>{g.fillStyle='#7a2a18';g.fillRect(3,0,10,64);}),true);
const leashGeo=new THREE.BufferGeometry();leashGeo.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(12),3));leashGeo.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));leashGeo.setIndex([0,1,2,0,2,3]);
const leash=new THREE.Mesh(leashGeo,new THREE.MeshBasicMaterial({map:hihnaT,transparent:true,alphaTest:0.3,side:THREE.DoubleSide}));leash.frustumCulled=false;scene.add(leash);
const _a=new THREE.Vector3(),_b=new THREE.Vector3(),_d=new THREE.Vector3(),_s=new THREE.Vector3(),_v=new THREE.Vector3();
function updateLeash(){leash.visible=dog.leashed&&!pl.inCar;if(!leash.visible)return;
  _a.set(0,-0.42,-0.5).applyQuaternion(cam.quaternion).add(cam.position); // käsi: kuvan alareunan keskikohta (256,256)
  _b.set(dog.x,height(dog.x,dog.z)+0.55,dog.z);_d.subVectors(_b,_a);const L=_d.length();_v.subVectors(cam.position,_a);_s.crossVectors(_d,_v).normalize().multiplyScalar(0.02);
  const p=leashGeo.attributes.position;p.setXYZ(0,_a.x-_s.x,_a.y-_s.y,_a.z-_s.z);p.setXYZ(1,_a.x+_s.x,_a.y+_s.y,_a.z+_s.z);p.setXYZ(2,_b.x+_s.x,_b.y+_s.y,_b.z+_s.z);p.setXYZ(3,_b.x-_s.x,_b.y-_s.y,_b.z-_s.z);p.needsUpdate=true;
  const u=leashGeo.attributes.uv;u.setY(2,L/0.15);u.setY(3,L/0.15);u.needsUpdate=true;}
{const box=$('cmds');for(const [k,ic,lab,id] of [['F','/hud/ikonit/ikoni_naru_irti.png','naru'],['1','komento_tanne','tänne'],['2','komento_seuraa','seuraa'],['3','komento_etsi','etsi'],['4','komento_tanne','täällä'],['C','/hud/ikonit/ikoni_kyykky.png','kyykky','kyykky'],['G','/hud/ikonit/ikoni_gps.png','GPS','gps-ikoni']]){
  const d=document.createElement('div');d.style.cssText='position:relative;width:64px;text-align:center;font-size:11px;white-space:nowrap';d.innerHTML=`<img src="${ic.startsWith('/')?ic:G+'hud/'+ic+'.png'}" style="width:32px;height:32px;image-rendering:pixelated;background:#0006" onerror="this.style.visibility='hidden'"><b style="position:absolute;left:10px;top:0;font-size:13px;color:#ff0">${k}</b><br>${lab}`;
  if(k==='F'){d.id='cmdF';}if(id)d.id=id;box.appendChild(d);}}
// ---------- ääni: oikeat tiedostot (ogg/mp3), varana syntetisoitu ----------
let AC=null,A3=null;const buf={};
const play3d=(n,o)=>A3&&buf[n]?A3.play(buf[n],o):null;
const engineStart=()=>({idle:play3d('sfx_vitara_tyhjakaynti_loop',{x:car.x,y:car.y+0.8,z:car.z,gain:.3,loop:true,ref:4,max:400,roll:1.2}),drive:play3d('sfx_vitara_ajo_loop',{x:car.x,y:car.y+0.8,z:car.z,gain:0.001,loop:true,ref:4,max:400,roll:1.2})});
const SND=['sfx_koira_haukku_1','sfx_koira_haukku_2','sfx_koira_haukku_3','sfx_koira_haukku_4','sfx_koira_haukku_5','sfx_koira_haukku_6','sfx_koira_ajo_tiivis','sfx_koira_ajo_harva','sfx_koira_ylosotto','sfx_koira_nuuhkii','sfx_koira_nuuhkii_hidas','sfx_koira_vinkuu','sfx_koira_juoksu_lumi','sfx_haulikko_laukaus','sfx_haulikko_lataus','sfx_askel_lumi_1','sfx_askel_lumi_2','sfx_askel_lumi_3','sfx_askel_lumi_4','sfx_kavely_lumi_loop','sfx_janis_pakoloikka','amb_talvimetsa_tuuli_loop','musiikki_valikko_talvi','sfx_gps_avaus','sfx_gps_sulku','sfx_gps_piippaus','sfx_gps_haukkuindikaattori','sfx_gps_hukka','sfx_hihna_naksahdus','aani_taalla_1','aani_taalla_2','sfx_vitara_ovi_auki','sfx_vitara_ovi_kiinni','sfx_vitara_kaynnistys','sfx_vitara_sammutus','sfx_vitara_tyhjakaynti_loop','sfx_vitara_ajo_loop','sfx_koira_hyppy','amb_korppi_1','amb_korppi_2','amb_tikka_1',...['tanne','etsi','seuraa','irti'].flatMap(k=>['aani_'+k+'_1','aani_'+k+'_2'])];
async function loadSnd(n){for(const e of['ogg','mp3']){try{const r=await fetch(`/aanet/${n}.${e}`);if(!r.ok)continue;buf[n]=await AC.decodeAudioData(await r.arrayBuffer());return;}catch{}}}
function play(n,{gain=1,pan=0,loop=false}={}){if(!AC||gain<=0.001)return null;const g=AC.createGain();g.gain.value=gain;const p=AC.createStereoPanner();p.pan.value=pan;g.connect(p).connect(AC.destination);
  let s;if(!buf[n]&&/pilli|aani_|hihna|gps|vitara|hyppy/.test(n))return null;if(buf[n]){s=AC.createBufferSource();s.buffer=buf[n];s.loop=loop;}else{if(loop)return null;s=AC.createOscillator();s.frequency.value=n.includes('haukku')||n.includes('ajo')?420:n.includes('laukaus')?90:200;s.type='sine';g.gain.value=gain*0.3;g.gain.setTargetAtTime(0,AC.currentTime+0.08,0.04);s.stop(AC.currentTime+0.3);}
  s.connect(g);s.start();return {s,g};}
// ---------- peli ----------
// 5 jänistä eri puolilla metsää (vähintään 120 m toisistaan), koira ajaa yhtä kerrallaan (dog.target)
const hares=spreadHares(10,mulberry32(WSEED)).map((sp,k)=>new Hare({...sp,seed:(WSEED+k*7919)%1e6|0,feed:feedOk}));
let hare=hares[0];const hareObjs=hares.map((h,k)=>k?animal('janis.glb',box(0.25,0.3,0.5,0xf4f6f8,0.15)):hareObj),hn=hares.map(()=>0);
const dog=new Dog({x:car.x,z:car.z,seed:7,leashed:!START?.autossa,riding:!!START?.autossa});
if(dog.riding){const c0=car.cargo(0);dog.x=c0.x;dog.z=c0.z;dog.dir=car.heading;}
const terrierObj=animal('koira_jagdterrier.glb',box(0.22,0.4,0.55,0x1a1a1a,0.28));terrierObj.visible=false;
const terrier=new Dog({x:car.x,z:car.z,seed:11,riding:!!START?.autossa});
if(terrier.riding){const c1=car.cargo(1);terrier.x=c1.x;terrier.z=c1.z;terrier.dir=car.heading;}
const pl={x:car.x,z:car.z,yaw:-car.heading,inCar:!!START?.autossa,seat:startSeat(!!START?.autossa,ROOM?null:'h',!!ROOM),pitch:0,raise:0,raising:false,revealT:0,shells:2,bag:0,moving:false};
const carVol=b=>b*(pl.inCar?0.5:2);
// GPS-kanvas CPU-tilassa (willReadFrequently): GPU-kiihdytetty 2D-kanvas tuotti mustan haamukerroksen kompassin alle
const gpsCtx=$('gpsc').getContext('2d',{willReadFrequently:true});let gpsImgT=0;
// Näytetään GPS <img>:nä: näkyvä 2D-kanvas tuotti mustan haamulaatikon kompassin alle (Chromen kompositointi)
let engine=null;let gpsOn=false,gpsMode=0,gpsSpan=800,gpsT=0;const gh={};for(const n of['ajo','seisonta','haukku','hiljaa'])(gh[n]=new Image()).src=G+'hud/gps_haukku_'+n+'.png';const gArrow=new Image();gArrow.src=G+'hud/gps_suunta_nuoli.png';const gDot=new Image();gDot.src=G+'hud/gps_reitti_piste.png';const gpsMap=new Image();let gpsGeo={m_per_px:SIZE/1024,maailma_origo_px:[512,512]};gpsMap.src=G+'hud/gps_kartta.png';fetch(G+'hud/gps_kartta.json').then(r=>r.ok&&r.json()).then(j=>{if(j)gpsGeo=j;}).catch(()=>{});const gi={};for(const n of['pelaaja','koira','koira_ajo','koira_haku','koira_hukka']){gi[n]=new Image();gi[n].src=G+'hud/gps_'+n+'.png';}
let dogJaw=0,ambT=12;let dn=0,barkT=0,stepT=0,msgT=0,lastDog=dog.state,shotFlash=0,hareFlushed=false;
for(const h of hares)for(const p of h.nightTrail)addTrack('janis',p);
{const G={};for(const t of TREES)(G[Math.floor(t.x/4)+','+Math.floor(t.z/4)]??=[]).push(t);car.blocked=(x,z)=>{const gx=Math.floor(x/4),gz=Math.floor(z/4);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(const t of G[(gx+a)+','+(gz+b)]||[])if(Math.hypot(t.x-x,t.z-z)<1.4)return true;return false;};}
const WL=V9.setupWildlife(scene,{rand:mulberry32(WSEED+1),height,isForest,trees:TREES,play3d:(n,o)=>play3d(n,o),aiInterval});
V9.setupGrass(scene,{height,ok:(x,z)=>distToRoad(x,z)>4&&Math.hypot(x-YARD.x,z-YARD.z)>YARD.r+3&&!inField(x,z)});
const ALLSND=['sfx_kivaari_laukaus','sfx_kivaari_lataus','sfx_teeri_pyrahdus_1','sfx_teeri_pyrahdus_2','amb_teeri_kuherrus_1','sfx_peura_pakenee_1','sfx_kettu_haukahdus_1','sfx_kettu_haukahdus_2','amb_tiainen_1','amb_tiainen_2','amb_korppi_lento_1'];
// ---------- autoradio ----------
const CH=[{n:'Parkano Rock',k:'parkano'},{n:'Jalasjärven Country',k:'country'},{n:'Koppelontien Tekno',k:'tekno'}];
const radio={on:false,ch:0,song:0,src:null,out:null,showT:0};
async function rbuf(n){if(!(n in buf)){buf[n]=undefined;await loadSnd(n);}return buf[n];}
function radioOut(){if(radio.out)return radio.out;const hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=300;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=4000;
  const g=AC.createGain();g.gain.value=0.35;const c3=A3.chain({ref:2,max:250,roll:1.6});c3.far=false;hp.connect(lp).connect(g).connect(c3.g);radio.out={hp,g,c3};return radio.out;}
function radioStop(){if(radio.src){radio.src.onended=null;try{radio.src.stop();}catch{}radio.src=null;}}
async function radioPlay(list){radioStop();const tok=radio.tok=(radio.tok||0)+1;
  for(const n of list){const b=await rbuf(n);if(tok!==radio.tok||!radio.on)return;if(!b)continue;
    await new Promise(res=>{const s=AC.createBufferSource();s.buffer=b;const sg=AC.createGain();sg.gain.value=n.includes('juonto_')?1.15:1;s.connect(sg).connect(radioOut().hp);s.onended=res;radio.src=s;s.start();});if(tok!==radio.tok)return;}
  if(tok===radio.tok&&radio.on){const c=CH[radio.ch].k;const j=pickJuonto(c,radio.lastJ);if(j)radio.lastJ=j;radio.song=(radio.song+1)%BIISIT;radioPlay([...(j?[j]:[]),'radio_'+c+'_'+(radio.song+1)]);}}
function radioTune(jingle){if(!AC)return;const c=CH[radio.ch].k;radio.showT=2.5;radio.song=0;radioPlay(jingle?['sfx_radio_kanava','radio_'+c+'_tunnus','radio_'+c+'_1']:['radio_'+c+'_1']);}
function radioOff(){radio.tok=(radio.tok||0)+1;radioStop();}
const keys={};addEventListener('keydown',e=>{keys[e.code]=true;
  if(e.code==='Tab')e.preventDefault();
  if(!pl.inCar&&e.code==='Tab'){switchWeapon();return;}
  if(!pl.inCar&&e.code==='KeyB'){WP.toggleBino();return;}
  if(!pl.inCar&&e.code==='KeyC'){pl.crouch=!pl.crouch;say(pl.crouch?'Kyykyssä':'Seisoo');return;}
  if(pl.inCar){if(e.code==='KeyR'){radio.on=!radio.on;NET?.send({t:'r',on:radio.on,ch:radio.ch});if(radio.on)radioTune(true);else{radioOff();say('Radio pois');}return;}
    if(e.code==='Tab')return;if(e.code==='KeyQ'){radio.ch=(radio.ch+1)%CH.length;NET?.send({t:'r',on:radio.on,ch:radio.ch});if(radio.on)radioTune(true);else radio.showT=2.5;return;}}

  if(gpsMode&&(e.code==='Equal'||e.code==='Minus'||e.code==='NumpadAdd'||e.code==='NumpadSubtract')){gpsSpan=Math.max(150,Math.min(1600,gpsSpan*(e.code.includes('Equal')||e.code.includes('Add')?0.7:1.43)));say('GPS-zoom '+Math.round(gpsSpan)+' m');return;}
  if(e.code==='Equal'||e.code==='Minus'||e.code==='NumpadAdd'||e.code==='NumpadSubtract'){resI=Math.max(0,Math.min(2,resI+(e.code.includes('Equal')||e.code.includes('Add')?1:-1)));[RW,RH]=RES[resI];renderer.setSize(RW,RH,false);say('Resoluutio '+RW+'x'+RH);}
  if(e.code==='KeyG'||e.code==='KeyM'){gpsMode=(gpsMode+1)%3;gpsOn=gpsMode>0;const gd=$('gps');gd.style.display=gpsOn?'block':'none';gd.style.width=gpsMode===2?'calc(50vh*0.8)':'min(24vw,240px)';gd.style.height=gpsMode===2?'50vh':'calc(min(24vw,240px)*1.25)';const gpn=gpsMode===1?'sfx_gps_avaus':gpsMode===0?'sfx_gps_sulku':'sfx_gps_piippaus';play(gpn,{gain:gpn==='sfx_gps_piippaus'?0.3:0.6});}
  {const C={KeyF:dog.leashed?'irti':'kiinni',Digit1:'tanne',Digit2:'seuraa',Digit3:'etsi',Digit4:'taalla'}[e.code];if(C){const r=isGuest()?(NET.send({t:'cmd',c:C,x:pl.x,z:pl.z}),{ok:true}):dog.command(C,{x:pl.x,z:pl.z},hare);
    const shout=k=>play('aani_'+k+'_'+(1+Math.random()*2|0),{gain:.8});
    if(C==='irti'||C==='kiinni')play('sfx_hihna_naksahdus',{gain:.8});
    if(C==='irti')shout('irti');if(C==='tanne'){shout('tanne');}if(C==='seuraa'){shout('seuraa');}if(C==='etsi'){shout('etsi');}if(C==='taalla')play('aani_taalla_'+(1+Math.random()*2|0),{gain:.9});
    say(r.ok?{irti:'Koira irti – haku!',kiinni:'Koira kytketty',tanne:'Tänne!',seuraa:'Seuraa!',etsi:'Etsi!',taalla:r.jalki?'Tule tänne, täällä! (jälki)':'Tule tänne, täällä!'}[C]:r.syy);}}
  if(e.code==='KeyE'&&INS.on){insDrop();return;}
  if(e.code==='KeyE'&&!pl.inCar){const c=nearestE();if(c&&c.kind!=='auto'){insPick(c);return;}
    if(nearSauna(pl.x,pl.z,SAUNA_PISTE)){pyydaLopetus();return;}}
  if(e.code==='KeyE'){doorT=1;if(pl.inCar){const was=pl.seat,alone=!NET?.last?.inCar,hop=ME==='v'?terrier.riding:dog.riding;pl.inCar=false;if(was==='kuski')car.speed=0;pl.seat=null;
      if(ME==='h')dismountDog();if(ME==='v')jumpPet();
      play('sfx_vitara_ovi_auki',{gain:carVol(.7)});const p=car.exitPos(was||'kuski');pl.x=p.x;pl.z=p.z;
      if(alone){play('sfx_vitara_sammutus',{gain:carVol(.6)});if(engine){for(const k in engine)engine[k]?.s.stop();engine=null;}}
      setTimeout(()=>play('sfx_vitara_ovi_kiinni',{gain:carVol(.7)}),500);say(hop?'Nousit autosta – koira hyppäsi ulos':'Nousit autosta');}
    else{const r=car.canEnter({x:pl.x,z:pl.z});if(!r.ok){if(Math.hypot(pl.x-car.x,pl.z-car.z)<3)say(r.syy);}else{pl.inCar=true;pl.raise=0;pl.seat=NET?.peer&&NET.last?.inCar?seatFor(NET.last.seat):'kuski';if(dog.leashed){dog.command('irti',{x:pl.x,z:pl.z});say('Naru irti – koira jää maastoon');}play('sfx_vitara_ovi_auki',{gain:carVol(.7)});
      setTimeout(()=>{play('sfx_vitara_ovi_kiinni',{gain:carVol(.7)});if(!engine){play('sfx_vitara_kaynnistys',{gain:carVol(.7)});setTimeout(()=>{if((pl.inCar||NET?.last?.inCar)&&!engine)engine=engineStart();},1200);}},500);say('Autossa – W/S kaasu/jarru, A/D ohjaus, R radio, Q kanava, E ulos');}}}
  if(e.code==='KeyR'&&!pl.inCar&&WP.weapon==='kivaari'){if(WP.rifleShells<3&&WP.reloadT<=0){WP.rifleShells=3;WP.startReload();play('sfx_kivaari_lataus',{gain:.8});say('Kivääri ladattu');}return;}
  if(e.code==='KeyR'&&!pl.inCar&&pl.shells<2&&vm.reload<=0){pl.shells=2;vm.startReload();play('sfx_haulikko_lataus',{gain:.8});say('Ladattu');}});
addEventListener('keyup',e=>keys[e.code]=false);
function switchWeapon(){WP.setWeapon(WP.weapon==='haulikko'?'kivaari':'haulikko');pl.raise=0;pl.raising=false;say(WP.weapon==='kivaari'?'Kivääri':'Haulikko');}
addEventListener('wheel',e=>{if(!document.pointerLockElement||pl.inCar)return;if(WP.weapon==='kivaari'&&vm.aim>0.9){WP.zoom=Math.max(3,Math.min(12,WP.zoom*(e.deltaY<0?1.15:1/1.15)));return;}if(!WP.binoOn)switchWeapon();},{passive:true});
// laukaus: haulikko = PELLETS haulin parvi siemenestä (verkossa sama siemen -> sama tulos), kivääri = yksi luoti.
// Osumat tallennetaan jäniksen paikalliskoordinaatteihin (h.marks) tarkastelua varten. Saalis kirjataan vasta laskettaessa (tarkastelu).
let shotSeq=0;
const lauk={h:{laukaukset:0,osumat:0},v:{laukaukset:0,osumat:0}};
function fire(arg){const local=!arg;if(local){const d=new THREE.Vector3();cam.getWorldDirection(d);arg={o:{x:cam.position.x,y:cam.position.y,z:cam.position.z},d:{x:d.x,y:d.y,z:d.z},w:WP.weapon,seed:(WSEED^(++shotSeq*2654435761))>>>0,by:ME};window.__lastFire=arg;}
  const {o,d:dir,w,seed,by}=arg,rifle=w==='kivaari';const who=by==='v'?'v':'h';lauk[who].laukaukset++;
  const T=[...hares.map(h=>({kind:'janis',h,get alive(){return h.alive;},pos:()=>({x:h.x,y:height(h.x,h.z)+0.2,z:h.z}),r:0.22,shoot:()=>h.shoot(by)})),...WL.targets];
  const pat=rifle?[[0,0]]:pelletPattern(seed);let best=null,bd=1e9;
  for(const t of T){if(!t.alive)continue;const p=t.pos(),dd=Math.hypot(p.x-o.x,p.y-o.y,p.z-o.z);if(dd>(rifle?400:SHOT_RANGE))continue;
    let hits;if(rifle){const v=new THREE.Vector3(p.x-o.x,p.y-o.y,p.z-o.z),along=v.dot(new THREE.Vector3(dir.x,dir.y,dir.z));hits=along>0&&v.addScaledVector(dir,-along).length()<t.r?[0]:[];}
    else hits=swarmHits(o,dir,p,t.r,pat);
    if(hits.length&&dd<bd){bd=dd;best={t,hits,dist:dd,p};}}
  // ohi menneet haulit: lumipöllähdykset
  if(!rifle)for(const g of groundImpacts(o,dir,pat,height,best?best.hits:[]).slice(0,30))addTrack('polly',{...g,dir:g.t});
  if(!best){if(local&&!$('msg').textContent)say('Ohi');return null;}
  lauk[who].osumat++;
  const {t,hits,p}=best,n=hits.length;
  // osumakohdat -> kohteen paikalliskoordinaatit (kierretty suunnan mukaan), verijäljet lumelle
  // v1.1c: jokaisen haulin oma lentorata (suulta pisteeseen) kohteen mallin paikallisiin koordinaatteihin kohteen matrixWorldin kautta
  const tob=t.kind==='janis'?hareObjs[hares.indexOf(t.h)]:(t.h||t.c||t.b||t).obj;let inv=null;if(tob){tob.updateMatrixWorld(true);inv=tob.matrixWorld.clone().invert();}
  const hd=t.b?Math.PI/2-(t.b.heading||0):(t.h||t.c)?.heading||0,c=Math.cos(hd),sn=Math.sin(hd),marks=hits.map(i=>{const q=rifle?{x:p.x,y:p.y,z:p.z}:pelletAt(o,dir,pat[i],best.dist);const dx=q.x-p.x,dz=q.z-p.z;
    let lo=null,ld=null;if(inv){const pd=new THREE.Vector3(q.x-o.x,q.y-o.y,q.z-o.z).normalize(),a=new THREE.Vector3(q.x,q.y,q.z).addScaledVector(pd,-1.5).applyMatrix4(inv),b2=new THREE.Vector3(q.x,q.y,q.z).addScaledVector(pd,0.5).applyMatrix4(inv);lo=a.toArray();ld=b2.sub(a).normalize().toArray();}
    return{f:dx*c+dz*sn,s:-dx*sn+dz*c,y:q.y-p.y,bullet:rifle,lo,ld};});
  const tgt=t.h||t.c||t.b||t;tgt.marks=(tgt.marks||[]).concat(marks);if(t.kind==='janis')applyMarks(hareObjs[hares.indexOf(t.h)],tgt.marks,'janis');else if(tgt.obj)applyMarks(tgt.obj,tgt.marks,t.kind);
  for(let k=0;k<Math.min(12,2+n);k++){const a=(seed%997+k*2.39),r=0.2+0.12*k;addTrack('veri',{x:p.x+Math.cos(a)*r+dir.x*0.4*k,z:p.z+Math.sin(a)*r+dir.z*0.4*k,dir:a,s:0.05+0.08*Math.min(1,n/10)});}
  if(t.kind==='janis'){const res=rifle?'kaatui':judgeHits(n);tgt.hitCount=(tgt.hitCount||0)+n;
    if(res==='haavoittui'){t.h.wound(woundDmg(n),o);t.h.woundedBy=t.h.woundedBy??by;t.h.owner=t.h.owner??by;if(local)say('Haavakko – '+n+' haulia osui, jänis jatkoi');window.__lastShot={kind:'janis',haavakko:true,n};return{haavakko:true,n};}
    t.h.owner=t.h.owner??by;}
  else if(!rifle&&t.kind==='peura'||(!rifle&&t.kind==='kettu'&&n<3)){if(local)say('Haavakko');return{haavakko:true,n};}
  t.shoot();tgt.owner=tgt.owner??by;const j=judgeShot(t.kind,rifle?'kivaari':'haulikko');
  // jänis ja peura kirjataan tarkastelun jälkeen; muut heti
  if(j.saalis&&!INSPECT_KINDS.includes(t.kind)&&by===ME)addBag(t.kind);
  if(local)say((j.huomautus?j.huomautus+' · ':'')+(LAJIT[t.kind]||t.kind)+' kaatui'+(rifle?'':' ('+n+' haulia)'));window.__lastShot={kind:t.kind,n,...j};return j;}
// saalis lajeittain (pl.bagBy), pl.bag = yhteensä
const INSPECT_KINDS=['janis','peura','teeri'];pl.bagBy={};function addBag(k){pl.bag++;pl.bagBy[k]=(pl.bagBy[k]||0)+1;}
// ---- E-kohde: lähin voittaa (auto / kaatunut jänis / peura) ----
const E_R={auto:3,janis:2.2,peura:3,teeri:2.2};
function deadTargets(){const out=[];for(const h of hares)if(!h.alive&&!h.carried&&!h.held&&!h.counted)out.push({kind:'janis',o:h,x:h.x,z:h.z});
  for(const b of WL.birds)if(b.kind==='teeri'&&!b.alive&&!b.carried&&!b.held&&!b.counted)out.push({kind:'teeri',o:b,x:b.x,z:b.z});
  for(const c of WL.critters)if(c.kind==='peura'&&!c.alive&&!c.held&&!c.counted)out.push({kind:'peura',o:c,x:c.x,z:c.z});return out;}
function nearestE(){let b=null,bd=1e9;const cand=[{kind:'auto',x:car.x,z:car.z},...deadTargets()];for(const c of cand){const d=Math.hypot(c.x-pl.x,c.z-pl.z);if(d<E_R[c.kind]&&d<bd){bd=d;b=c;}}return b;}
const SAUNA_PISTE=saunaPiste();
function updateE(){const el=$('ehint');if(!el)return;if(loppuOn){el.textContent='';return;}
  const c=pl.inCar||INS.on?null:nearestE();
  if(!pl.inCar&&!INS.on&&(!c||c.kind==='auto')&&nearSauna(pl.x,pl.z,SAUNA_PISTE)){el.textContent='E – lopeta jahti saunalle';return;}
  el.textContent=INS.on?'E / Esc – laske maahan · hiiri kääntää':c?{auto:'E – autoon',janis:'E – ota jänis',peura:'E – tarkastele peuraa',teeri:'E – ota teeri'}[c.kind]:'';}
// ---- saaliin tarkastelu: kopio mallista oman kameran eteen, hiiri kääntää, osumat (h.marks) pinnalla ----
const INS={on:false,c:null,obj:null,yaw:0,pitch:0,scene:new THREE.Scene(),cam:new THREE.PerspectiveCamera(40,1,0.05,20)};
INS.scene.add(new THREE.HemisphereLight(0xdfe8ff,0x777777,1.6));{const dl=new THREE.DirectionalLight(0xffffff,1.4);dl.position.set(1,2,2);INS.scene.add(dl);}
const DPO={polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,depthWrite:false,transparent:true,side:THREE.DoubleSide};
const holeMat=new THREE.MeshBasicMaterial({color:0x1a0505,...DPO}),splatMat=new THREE.MeshBasicMaterial({color:0x8a0d0d,opacity:0.85,...DPO});
// v1.1b osumadekaalit: osumakohta (paikallinen) projisoidaan raycastilla mallin pintaan, litteä dekaali normaalin suuntaan, lapsena mallissa
const holeGeo=new THREE.CircleGeometry(1,8),RC=new THREE.Raycaster();
function applyMarks(obj,marks,kind){if(!obj||!marks)return;const ud=obj.userData;if(ud.mk&&!obj.children.includes(ud.mk))ud.mk=null;
  if(!ud.mk){ud.mk=new THREE.Group();ud.mk.userData.dekaali=true;obj.add(ud.mk);ud.nm=0;}if(ud.nm>=marks.length)return;
  obj.updateMatrixWorld(true);const meshes=[];obj.traverseVisible(o=>{if(o.isMesh&&!o.parent?.userData.dekaali)meshes.push(o);});// vain näkyvät meshit (piilotettu varamuoto/hitbox antoi ennen vääriä osumia)
  const by=kind==='janis'?0.2:kind==='teeri'?0.15:0.9,bs=kind==='peura'?0.03:0.025,R=kind==='teeri'?{x:0.09,y:0.1,z:0.2}:kind==='janis'?{x:0.11,y:0.13,z:0.24}:{x:0.25,y:0.35,z:0.7};
  const inv=new THREE.Matrix4().copy(obj.matrixWorld).invert(),C=new THREE.Vector3(0,by,0);
  // Mallin kolmiot obj-koordinaatistossa nykyasennossa (osat animoituvat, ei välimuistia) + bbox-ellipsoidi varalle
  {const T=[],RG=[],v=new THREE.Vector3(),bb=new THREE.Box3();for(const m of meshes){const g=m.geometry,pa=g.attributes.position,ix=g.index,M=new THREE.Matrix4().multiplyMatrices(inv,m.matrixWorld),n=ix?ix.count:pa.count;RG.push([T.length/9,m]);for(let i=0;i<n;i++){v.fromBufferAttribute(pa,ix?ix.getX(i):i).applyMatrix4(M);T.push(v.x,v.y,v.z);bb.expandByPoint(v);}}ud.tris=new Float32Array(T);ud.rg=RG;ud.ell=T.length?ellipsoidFromBox(bb.min,bb.max):null;}
  const EC=ud.ell?new THREE.Vector3(ud.ell.C.x,ud.ell.C.y,ud.ell.C.z):C,ER=ud.ell?ud.ell.R:R;
  for(;ud.nm<marks.length;ud.nm++){const k=marks[ud.nm];let LO,LD;if(k.lo){LO=new THREE.Vector3().fromArray(k.lo);LD=new THREE.Vector3().fromArray(k.ld);}else{const P=new THREE.Vector3(-k.s,by+k.y,k.f);LD=C.clone().sub(P).normalize();LO=P.clone().addScaledVector(LD,-1.5);}
    const d=LD.clone().negate();let pt=null,nl=null;const o=LO.clone().applyMatrix4(obj.matrixWorld),tw=LO.clone().add(LD).applyMatrix4(obj.matrixWorld);RC.set(o,tw.sub(o).normalize());
    const h=RC.intersectObjects(meshes,false)[0];// mallin pinta; varalla ellipsoidi samaa rataa pitkin
    if(h){pt=h.point.applyMatrix4(inv);nl=h.face?h.face.normal.clone().transformDirection(h.object.matrixWorld).transformDirection(inv):d.clone();}
    else{const e=rayEllipsoid(LO,LD,EC,ER);if(!e)continue;pt=new THREE.Vector3(e.p.x,e.p.y,e.p.z);nl=new THREE.Vector3(e.n.x,e.n.y,e.n.z);}
    let host=null;if(ud.tris.length){const c=closestOnTris([pt.x,pt.y,pt.z],ud.tris);if(c){pt.set(...c.p);if(!h)nl.set(...c.n);for(const [st,m] of ud.rg)if(c.i>=st)host=m;}}// reikä aina mallin pintaan
    if(nl.dot(d)<0)nl.negate();
    const mk=(mat,r,off)=>{const m=new THREE.Mesh(holeGeo,mat);m.scale.setScalar(r);m.position.copy(pt).addScaledVector(nl,off);m.lookAt(m.position.clone().add(nl));m.rotateZ(ud.nm*2.4);m.renderOrder=2;ud.mk.add(m);if(host){m.updateMatrixWorld(true);let dg=host.children.find(c=>c.userData.dekaali);if(!dg){dg=new THREE.Group();dg.userData.dekaali=true;host.add(dg);}dg.attach(m);}};// reikä kiinni osuttuun osaan (runko/pää animoituvat)
    mk(holeMat,k.bullet?0.016:0.007,0.0015);if(k.bullet)mk(splatMat,0.03,0.001);}}
window.__marks=()=>hareObjs.map(o=>{let n=0;o?.traverse(c=>{if(c.parent?.userData.dekaali)n++;});return n;});
function insPick(c){if(c.kind!=='janis'&&c.o.obj)applyMarks(c.o.obj,c.o.marks,c.kind);if(c.kind==='janis')NET?.send({t:'pick',i:hares.indexOf(c.o)});const src=c.kind==='janis'?hareObjs[hares.indexOf(c.o)]:c.o.obj;const small=c.kind!=='peura';if(!src)return;c.o.held=true;
  if(c.kind==='janis')applyMarks(src,c.o.marks,'janis');const g=new THREE.Group(),m=src.clone(true);m.position.set(0,0,0);m.rotation.set(0,0,0);m.visible=true;g.add(m);
  const by=c.kind==='janis'?0.2:c.kind==='teeri'?0.15:0.9,bs=small?0.025:0.03;
  applyMarks(src,c.o.marks,c.kind);
  const sz=small?0.75:2.6;if(c.kind==='teeri')m.rotation.set(0,0,0);g.position.set(0,-by,-sz);INS.yaw=0.6;INS.pitch=0.25;INS.scene.add(g);Object.assign(INS,{on:true,c,obj:g,dist:sz});
  const n=c.o.marks?.length||c.o.hitCount||0;const NM={janis:'Jänis',peura:'Peura',teeri:'Teeri'};$('insinfo').textContent=NM[c.kind]+' · osumia '+n+(small?' haulia':(n===1?' luoti':' luotia'))+(c.o.killedBy==='koira'?' · koiran ottama':'');$('insinfo').style.display='block';
  if(c.kind==='janis')for(const ch of m.children)ch.traverse?.(()=>{});}
function insDrop(){if(!INS.on)return;const o=INS.c.o;if(INS.c.kind==='janis')NET?.send({t:'drop',i:hares.indexOf(o)});o.held=false;if(!o.counted){o.counted=true;if((o.owner??ME)===ME){addBag(INS.c.kind);say({janis:'Jänis',peura:'Peura',teeri:'Teeri'}[INS.c.kind]+' kirjattu saaliiksi');}}INS.scene.remove(INS.obj);INS.on=false;INS.c=null;$('insinfo').style.display='none';window.__insDrops=(window.__insDrops||0)+1;}
window.__insYaw=v=>{INS.yaw+=v;};window.__INS=INS;
addEventListener('mousemove',e=>{if(!INS.on)return;INS.yaw+=e.movementX*0.01;INS.pitch=Math.max(-1.4,Math.min(1.4,INS.pitch+e.movementY*0.01));});
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&INS.on)insDrop();});
addEventListener('keydown',e=>{if(e.code==='Escape'&&INS.on)insDrop();});
function renderIns(){if(!INS.on)return;const g=INS.obj;g.rotation.set(INS.pitch,INS.yaw,0,'YXZ');INS.cam.aspect=innerWidth/innerHeight;INS.cam.updateProjectionMatrix();renderer.autoClear=false;renderer.clearDepth();renderer.render(INS.scene,INS.cam);renderer.autoClear=true;}
window.__ins=INS;window.__insPick=c=>insPick(c||nearestE());window.__insDrop=insDrop;window.__nearestE=nearestE;
function say(t){$('msg').textContent=t;msgT=3;}
function hopSnd(x,z){play3d('sfx_koira_hyppy',{x,y:(car.y||0)+0.7,z,gain:1,ref:5,max:80});}
function dismountDog(){if(!dog.riding)return;const p=car.dogExit(0);dog.riding=false;dog.x=p.x;dog.z=p.z;dog.dir=car.heading;dog._haku();hopSnd(p.x,p.z);}
function jumpPet(){if(!terrier.riding)return;const p=car.dogExit(1);terrier.riding=false;terrier.x=p.x;terrier.z=p.z;terrier.dir=car.heading;terrier.state=D.SEURAA;hopSnd(p.x,p.z);}
const cvs=renderer.domElement;
async function startGame(){$('menu').style.display='none';cvs.requestPointerLock();if(!AC){AC=new AudioContext();if(!AL.aanetPaalla())AC.suspend();A3=V8.makeAudio3D(AC);await Promise.all(SND.map(loadSnd));await Promise.all(ALLSND.map(loadSnd));window.__aanetPuuttuu=ALLSND.filter(n=>!buf[n]);
  if(!amb)amb=play('amb_talvimetsa_tuuli_loop',{gain:.21,loop:true});if(!walk)walk=play('sfx_kavely_lumi_loop',{gain:0,loop:true});}
  if(pl.inCar&&!engine){play('sfx_vitara_kaynnistys',{gain:carVol(.7)});setTimeout(()=>{if(pl.inCar&&!engine)engine=engineStart();},1200);say('Ratissa Yli-Vallintiellä – Löyhingintie → Koppelontie → mökki. E = ulos');}}
$('menu').onclick=()=>{if(!loppuOn)startGame();};
$('lopeta')?.addEventListener('click',e=>{e.stopPropagation();pyydaLopetus();});
AL.setupAloitus({onStart:startGame,onAanet:on=>{if(AC)on?AC.resume():AC.suspend();}});
// Kutsu kaveri: luo huoneen (jos ei vielä) ja kopioi linkin; huoneeseen siirrytään linkin kautta (sama siemen kummallakin)
$('al-kutsu')?.addEventListener('click',async()=>{const code=ROOM||newRoomCode();const link=NETM.inviteLink(code);try{await navigator.clipboard.writeText(link);}catch{}
  $('al-kutsu').textContent='Linkki kopioitu';window.__invite=link;if(!ROOM)setTimeout(()=>location.href=link,700);});
// ---- moninpeli ----
const NET=ROOM?NETM.connect(ROOM.toUpperCase(),{onRole:r=>{ME=r;if(pl.inCar)pl.seat=startSeat(true,r,true);},onStatus:t=>say(t),onMsg:m=>netMsg(m)}):null;
let RP=null;const avatar=V8.makeHunter();if(avatar){avatar.visible=false;scene.add(avatar);}
const isGuest=()=>NET&&NET.peer&&ME==='v';
function netMsg(m){
  if(m.t==='s'){play3d(m.w==='kivaari'?'sfx_kivaari_laukaus':'sfx_haulikko_laukaus',{x:m.o.x,y:m.o.y,z:m.o.z,gain:1.2,ref:15,max:2000});fire(m);}
  else if(m.t==='w'&&ME==='v')applyWorld(m,{dog,hares,critters:WL.critters,birds:WL.birds});
  else if(m.t==='r'){radio.on=m.on;radio.ch=m.ch;if(radio.on)radioTune(true);else radioOff();}
  else if(m.t==='cmd'&&ME==='h')dog.command(m.c,{x:m.x,z:m.z},hare);
  else if(m.t==='pick'&&ME==='h'){const h=hares[m.i];if(h)h.held=true;}
  else if(m.t==='drop'&&ME==='h'){const h=hares[m.i];if(h){h.held=false;h.counted=true;}}
  else if(m.t==='lopeta'&&ME==='h')kaynnistaLopetus();
  else if(m.t==='loppu'&&m.yhteenveto)aloitaKohtaus(m.yhteenveto);}
let netT=0,worldT=0;
function netTick(dt){if(!NET||!NET.peer)return;netT-=dt;worldT-=dt;
  if(netT<=0){netT=1/15;const m={t:'p',role:ME,x:pl.x,y:cam.position.y,z:pl.z,yaw:pl.yaw,pitch:pl.pitch,inCar:pl.inCar,seat:pl.seat||null,crouch:!!pl.crouch};if(pl.inCar&&pl.seat==='kuski')m.car={x:car.x,z:car.z,h:car.heading,speed:car.speed,steer:car.steer||0};NET.send(m);}
  if(ME==='h'&&worldT<=0){worldT=0.1;NET.send(packWorld({dog,hares,critters:WL.critters,birds:WL.birds}));}
  RP=NET.remote.at(performance.now()/1000);const L=NET.last;
  if(L?.car&&pl.seat!=='kuski'){car.x=L.car.x;car.z=L.car.z;car.heading=L.car.h;car.speed=L.car.speed;car.steer=L.car.steer;car.pose();}
  if(avatar&&RP){avatar.visible=true;if(L.inCar){interior.g.updateMatrixWorld();const sp=new THREE.Vector3(L.seat==='kuski'?0.40:-0.40,0.55,-0.55);interior.g.localToWorld(sp);avatar.position.copy(sp);avatar.rotation.set(0,-car.heading,0);avatar.userData.sit?.(true);}
    else{avatar.position.set(RP.x,height(RP.x,RP.z),RP.z);avatar.rotation.set(0,RP.yaw,0);avatar.userData.sit?.(false,RP.crouch);}}
  else if(avatar)avatar.visible=false;}
window.__netState=()=>({ME,peer:!!NET?.peer,remote:RP,seat:pl.seat,avatar:avatar?.visible});
let amb,walk,loppuOn=false; document.addEventListener('pointerlockchange',()=>{if(loppuOn){$('menu').style.display='none';return;}if(!document.pointerLockElement&&window.__peliAlkanut)$('menu').style.display='flex';});
addEventListener('mousemove',e=>{if(!document.pointerLockElement||INS.on)return;if(pl.inCar){pl.lookYaw=Math.max(-2.62,Math.min(2.62,(pl.lookYaw||0)-e.movementX*0.0025));pl.pitch=Math.max(-0.7,Math.min(0.6,pl.pitch-e.movementY*0.0025));return;}pl.yaw-=e.movementX*0.0025;pl.pitch=Math.max(-1.4,Math.min(1.4,pl.pitch-e.movementY*0.0025));});
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('mouseup',e=>{if(e.button===2){pl.rmb=false;pl.raise=0;pl.raising=false;}});
addEventListener('mousedown',e=>{if(!document.pointerLockElement||pl.inCar||INS.on)return;if(e.button===2){pl.rmb=true;if(pl.raise<1&&!pl.raising){pl.raising=true;pl.revealT=1;}return;}if(vm.reload>0)return;if(pl.raise<1){if(!pl.raising){pl.raising=true;pl.revealT=1;}return;}if(WP.binoOn)return;if(WP.weapon==='kivaari'){if(WP.bolt>0||WP.reloadT>0)return;if(WP.rifleShells<=0){say('Kivääri tyhjä – lataa (R)');return;}WP.rifleShells--;vm.kick=0.6;if(buf.sfx_kivaari_laukaus)play('sfx_kivaari_laukaus');else{const r=play('sfx_haulikko_laukaus');if(r?.s?.playbackRate)r.s.playbackRate.value=0.75;}fire();setTimeout(()=>{if(WP.rifleShells>0)WP.startBolt();},250);return;}
  if(pl.shells<=0){say('Tyhjä – lataa (R)');return;}pl.shells--;shotFlash=0.15;vm.shoot();play('sfx_haulikko_laukaus');fire();NET?.send({t:'s',...window.__lastFire});return;});
// HUD-kuvat
const himg=(id,src,fb)=>{const i=$(id);i.onerror=()=>{i.onerror=null;i.src=fb;};i.src=G+src;};
const fbCross=canvasTex(16,16,g=>{g.fillStyle='#f22';g.fillRect(7,2,2,12);g.fillRect(2,7,12,2);}).image.toDataURL();
const fbGun=canvasTex(256,128,g=>{g.fillStyle='#333';g.fillRect(110,20,14,108);g.fillStyle='#6b4423';g.fillRect(100,80,34,48);}).image.toDataURL();
himg('cross','hud/tahtain_16.png',fbCross);
const gunSrc={fp:G+'haulikko_fp.png',naru:G+'haulikko_hihna.png',shot:G+'haulikko_laukaus.png'};himg('gun','haulikko_fp.png',fbGun);
const windArrow=new Image();windArrow.src=G+'hud/tuuli_nuoli_32.png';
const compass=new Image();compass.src=G+'hud/kompassi_256x32.png';
const STATE_FI={[D.NARUSSA]:'narussa',[D.TANNE]:'tänne (odottaa)',[D.SEURAA]:'seuraa',[D.TAALLA]:'täällä (tulee jäljelle)',[D.HAKU]:'haku',[D.YOJALKI]:'yöjälki',[D.YLOSOTTO]:'ylösotto',[D.AJO]:'ajo (haukkuu)',[D.HUKKA]:'hukka',[D.PALUU]:'palaa luokse'};
const clock=new THREE.Clock();
let loppuAng=0,loppuR=9,loppuLook={x:0,z:0},loppuMus=null;const loppuSavu=[],loppuKoirat=[];
function rakennaYhteenveto(){const elaimet=[];
  for(const h of hares)elaimet.push({kind:'janis',alive:!!h.alive,owner:h.owner});
  for(const b of WL.birds)if(b.kind==='teeri')elaimet.push({kind:'teeri',alive:!!b.alive,owner:b.owner});
  for(const c of WL.critters)if(c.kind==='peura')elaimet.push({kind:'peura',alive:!!c.alive,owner:c.owner});
  return yhteenveto({elaimet,laukaukset:lauk,noudot:dog.delivered||0,moninpeli:!!(NET&&NET.peer)});}
function pyydaLopetus(){if(loppuOn)return;if(lopetusPyynto(ME,!!(NET&&NET.peer))==='pyynto'){NET.send({t:'lopeta'});say('Odotetaan isäntää…');return;}kaynnistaLopetus();}
function kaynnistaLopetus(){if(loppuOn)return;const yh=rakennaYhteenveto();if(NET?.peer&&ME==='h')NET.send({t:'loppu',yhteenveto:yh});aloitaKohtaus(yh);}
function iltahamara(){scene.background.set(0x3c345c);scene.fog.color.set(0x514868);scene.fog.density=0.011;hemi.color.set(0xb4bdd8);hemi.groundColor.set(0x6a5040);hemi.intensity=0.95;sun.color.set(0xffc090);sun.intensity=0.85;sun.position.set(-0.8,0.28,0.35);if(window._sky?.material)window._sky.material.color.set(0xa090b0);}
function hiljenna(){if(amb?.g)amb.g.gain.value=0;if(walk?.g)walk.g.gain.value=0;radio.on=false;radioOff();if(engine){for(const k in engine){try{engine[k]?.s.stop();}catch{}}engine=null;}}
function naytaYhteenveto(yh){let el=$('loppu');if(!el){el=document.createElement('div');el.id='loppu';el.style.cssText='position:fixed;left:20px;top:20px;max-width:360px;background:rgba(12,14,24,.72);color:#f3ead2;padding:16px 18px;border:1px solid #c4a574;font:16px/1.45 monospace;white-space:pre-wrap;pointer-events:none;text-shadow:0 1px 2px #000;z-index:5';document.body.appendChild(el);}el.textContent=yhteenvetoTeksti(yh);el.style.display='block';}
async function soitaLopetus(){if(!AC||!AL.aanetPaalla())return;const b=await rbuf('musiikki_lopetus');if(!b||!loppuOn)return;const s=AC.createBufferSource();s.buffer=b;s.loop=true;const g=AC.createGain();g.gain.value=0.5;s.connect(g).connect(AC.destination);s.start();loppuMus={s,g};}
function nollaaSavu(p){const o=new THREE.Vector3();savuMerkki.getWorldPosition(o);p.mesh.position.copy(o);p.life=0;p.age=2.6+Math.random()*1.5;p.dx=(Math.random()-.5)*.5;p.dz=(Math.random()-.5)*.35;p.mesh.material.opacity=0;}
function luoSavu(){if(loppuSavu.length||!savuMerkki)return;const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),grd=g.createRadialGradient(32,32,2,32,32,30);grd.addColorStop(0,'rgba(255,255,255,.75)');grd.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=grd;g.fillRect(0,0,64,64);const map=new THREE.CanvasTexture(c);
  for(let i=0;i<14;i++){const mat=new THREE.SpriteMaterial({map,transparent:true,depthWrite:false,opacity:0,color:0xe6e2ea});const mesh=new THREE.Sprite(mat);mesh.scale.setScalar(.2);scene.add(mesh);const p={mesh,life:-i*0.22,age:3,dx:0,dz:0};loppuSavu.push(p);if(p.life>=0)nollaaSavu(p);else{const o=new THREE.Vector3();savuMerkki.getWorldPosition(o);mesh.position.copy(o);}}}
function paivitaSavu(dt){for(const p of loppuSavu){p.life+=dt;if(p.life<0)continue;if(p.life>p.age)nollaaSavu(p);const k=Math.max(0,Math.min(1,p.life/p.age));p.mesh.position.y+=dt*(0.65+.55*k);p.mesh.position.x+=p.dx*dt;p.mesh.position.z+=p.dz*dt;p.mesh.scale.setScalar(.3+k*2.2);p.mesh.material.opacity=.4*Math.sin(k*Math.PI);}}
function aloitaKohtaus(yh){if(loppuOn||!yh?.pelaajat)return;loppuOn=true;if(document.pointerLockElement)document.exitPointerLock();$('menu').style.display='none';$('hud').style.display='none';const al=$('aloitus');if(al)al.style.display='none';iltahamara();hiljenna();
  const etu=saunaEtu(),mono=!!yh.moninpeli,paikat=riviPaikat(etu,yh.rivi||[],mono?2:1,mono?2:1);loppuLook=paikat.look;loppuR=paikat.radius;loppuAng=Math.atan2(etu.dz,etu.dx);
  const malli={janis:hareObjs[0],teeri:WL.birds.find(b=>b.kind==='teeri')?.obj,peura:WL.critters.find(c=>c.kind==='peura')?.obj};
  for(const p of paikat.elaimet){const src=malli[p.kind];if(!src)continue;let g;try{g=cloneSkinned(src);}catch{g=src.clone(true);}g.visible=true;g.traverse(o=>{o.frustumCulled=false;});g.position.set(p.x,height(p.x,p.z)+(p.kind==='peura'?0.2:0.04),p.z);g.rotation.set(0,paikat.yaw+Math.PI/2,Math.PI/2);scene.add(g);}
  hares.forEach((h,i)=>{if(!h.alive)hareObjs[i].visible=false;});
  for(const b of WL.birds)if(b.kind==='teeri'&&!b.alive&&b.obj)b.obj.visible=false;
  for(const c of WL.critters)if(c.kind==='peura'&&!c.alive&&c.obj)c.obj.visible=false;
  let hi=0,ki=0;const koirat=[[dogObj,DOGBREED],[terrierObj,'terrieri']];
  for(const p of paikat.ihmiset){if(p.kind==='metsastaja'){const h=V8.makeHunter();if(hi++===1)h.traverse(o=>{if(o.isMesh&&o.material?.color?.getHex()===0xff7a00){o.material=o.material.clone();o.material.color.set(0xc44812);}});h.position.set(p.x,height(p.x,p.z),p.z);h.rotation.y=p.yaw;h.userData.sit?.(false);scene.add(h);}
    else{const pair=koirat[ki++];if(!pair)continue;const [o,rotu]=pair;o.visible=true;o.position.set(p.x,height(p.x,p.z),p.z);o.rotation.y=Math.PI-Math.atan2(etu.dx,-etu.dz);loppuKoirat.push({o,k:V8.DOG_K[rotu]||1});}}
  if(!mono)terrierObj.visible=false;if(avatar)avatar.visible=false;leash.visible=false;luoSavu();naytaYhteenveto(yh);soitaLopetus();}
function paivitaLopetus(dt){loppuAng+=dt*0.15;const y=height(loppuLook.x,loppuLook.z);cam.position.set(loppuLook.x+Math.cos(loppuAng)*loppuR,y+2.55,loppuLook.z+Math.sin(loppuAng)*loppuR);cam.lookAt(loppuLook.x,y+0.9,loppuLook.z);window._sky.position.copy(cam.position);paivitaSavu(dt);const t=clock.elapsedTime;for(const d of loppuKoirat)V8.animDog(d.o.userData.n,{t,spd:0,jaw:0,sit:true,k:d.k});renderer.autoClear=true;renderer.render(scene,cam);}
function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),0.1);if(loppuOn){paivitaLopetus(dt);return;}hares.forEach((h,i)=>{if(h.marks?.length)applyMarks(hareObjs[i],h.marks,'janis');});treeLOD(dt);
  // pelaaja
  let f=(keys.KeyW?1:0)-(keys.KeyS?1:0),s=(keys.KeyD?1:0)-(keys.KeyA?1:0);
  if(pl.inCar){if(pl.seat==='kuski'){car.update(dt,{throttle:f,steer:s});car.steer=s;}pl.x=car.x;pl.z=car.z;f=s=0;}
  if(engine){const v=Math.min(1,Math.abs(car.speed)/16),r=0.8+0.7*v,eg=pl.inCar?0.5:2;for(const k in engine)if(engine[k]){engine[k].s.playbackRate.value=r;engine[k].setPos?.(car.x,car.y+0.8,car.z);}if(engine.idle)engine.idle.g.gain.value=0.25*(1-v)*eg;if(engine.drive)engine.drive.g.gain.value=0.25*v*eg;}
  if(radio.out){const o=radio.out;o.c3.setPos?.(car.x,car.y+1,car.z);A3.setPos(o.c3,car.x,car.y+1,car.z);const open=doorT>0;o.g.gain.value=pl.inCar?0.35:open?0.25:0.14;o.c3.lp.frequency.value=pl.inCar?18000:open?4000:1300;}
  if(A3){A3.updateListener(cam);ambT-=dt;if(ambT<=0){ambT=15+Math.random()*30;const a=Math.random()*6.28,d=80+Math.random()*250,n=['amb_korppi_1','amb_korppi_2','amb_tikka_1'][Math.random()*3|0];play3d(n,{x:pl.x+Math.cos(a)*d,y:12,z:pl.z+Math.sin(a)*d,gain:1.5,ref:25,max:1500});}
    }
  carObj.rotation.order='YXZ';carObj.position.set(car.x,car.y,car.z);carObj.rotation.set(-car.pitch,Math.PI-car.heading,-car.roll);
  for(const n in wheels){const w=wheels[n];if(!w)continue;w.rotation.x+=car.speed*dt/0.33;if(n==='pyora_ev'||n==='pyora_eo')w.rotation.y=(pl.inCar?car.steer||0:0)*0.45;}
  if(door){doorT=Math.max(0,doorT-dt);door.rotation.y=door.userData.r0+Math.sin(doorT*Math.PI)*1.0;}
  pl.moving=!!(f||s);
  if(pl.moving){pl.raise=0;pl.raising=false;} if(pl.raising){pl.raise=Math.min(1,pl.raise+dt/0.3);if(pl.raise>=1)pl.raising=false;}
  pl.revealT=Math.max(0,pl.revealT-dt); const aiming=pl.raise>=1&&!pl.inCar; $('aim').style.display='none'; $('gun').style.display='none'; $('cross').style.display=aiming||pl.inCar||WP.binoOn?'none':'block';$('vignette').style.opacity=vm.aim*0.9;
  {const zf=WP.update(dt,{t:clock.elapsedTime,aim:aiming,inCar:pl.inCar});cam.fov=zf>1?65/zf:65-10*vm.aim;cam.updateProjectionMatrix();}
  if(pl.moving){const sp=pl.crouch?0.7:keys.ShiftLeft?4:1.6;pl.x+=(-Math.sin(pl.yaw)*f+Math.cos(pl.yaw)*s)*sp*dt;pl.z+=(-Math.cos(pl.yaw)*f-Math.sin(pl.yaw)*s)*sp*dt;stepT-=dt;}pl.x=clampB(pl.x);pl.z=clampB(pl.z);
  if(walk)walk.g.gain.value=pl.moving?0.4:0;
  interior.g.position.copy(carObj.position);interior.g.rotation.copy(carObj.rotation);interior.g.visible=interior.loaded;
  // Sisänäkymässä ulkokori (vitara_kori, DoubleSide) peitti tuulilasin/ikkunat/radion/lattian 0.2–1.1 m päässä kamerasta → piiloon
  {const kori=carObj.getObjectByName('vitara_kori');if(kori)kori.visible=!(pl.inCar&&interior.loaded);if(interior.extra)interior.extra.visible=pl.inCar;}
  if(pl.inCar){interior.g.updateMatrixWorld();const cp=new THREE.Vector3(pl.seat==='pelkaaja'?-0.40:0.40,1.32,-0.55);interior.g.localToWorld(cp);cam.position.copy(cp);pl.yaw=-car.heading;cam.rotation.set(pl.pitch,pl.yaw+(pl.lookYaw||0),0);
    if(interior.n.ratti)interior.n.ratti.rotation.z=-(car.steer||0)*1.6;if(interior.n.vaihdekeppi)interior.n.vaihdekeppi.rotation.x=car.speed>0.3?-0.25:car.speed<-0.3?0.25:0;}
  else{pl.lookYaw=0;pl.eye=(pl.eye??1.65)+((pl.crouch?1.0:1.65)-(pl.eye??1.65))*Math.min(1,dt*10);cam.position.set(pl.x,height(pl.x,pl.z)+pl.eye,pl.z);cam.rotation.set(pl.pitch+(WP.swayY||0),pl.yaw+(WP.swayX||0),0);}window._sky.position.copy(cam.position);
  // tekoäly
  netTick(dt);const P={x:pl.x,z:pl.z},GUEST=isGuest();
  if(GUEST&&dog._wasRide&&!dog.riding)hopSnd(dog.x,dog.z);dog._wasRide=!!dog.riding;
  if(NET?.peer&&terrier.riding&&((ME==='h'&&NET.last&&!NET.last.inCar)||(ME==='v'&&!pl.inCar&&window.__peliAlkanut)))jumpPet();
  const rideAt=slot=>{const q=car.cargo(slot);return{x:q.x,z:q.z,dir:car.heading};};
  if(dog.riding){const r=rideAt(0);dog.x=r.x;dog.z=r.z;dog.dir=r.dir;}
  if(!GUEST)dog.update(dt,{hares,fetch:WL.birds.filter(b=>b.kind==='teeri'),player:P,players:{[ME]:P,...(NET?.last&&!GUEST?{v:{x:NET.last.x,z:NET.last.z}}:{})},obstacles:[bodyBox(car)],ride:dog.riding?rideAt(0):null});
  if(NET?.peer){const gp=ME==='v'?P:(NET.last?{x:NET.last.x,z:NET.last.z}:P);terrier.update(dt,{player:gp,hares:[],obstacles:[bodyBox(car)],ride:terrier.riding?rideAt(1):null});}
  hare=dog.target||hare;for(const h of hares){if(GUEST)break;h._acc=(h._acc||0)+dt;const d=Math.min(Math.hypot(h.x-P.x,h.z-P.z),Math.hypot(h.x-dog.x,h.z-dog.z));if(h!==dog.target&&h._acc<aiInterval(d))continue;h.update(Math.min(h._acc,0.25),{dog:dog.pos,player:P,playerMoving:pl.moving||pl.revealT>0});h._acc=0;}
  WL.update(dt,{t:clock.elapsedTime,player:P,dog:dog.pos,addTrack});
  if(hare.state===H.PAKO&&!hareFlushed){hareFlushed=true;play3d('sfx_janis_pakoloikka',{x:hare.x,y:height(hare.x,hare.z)+0.3,z:hare.z,gain:1,ref:5,max:400});}
  if(hare.veered&&pl.moving){hare.veered=false;}
  for(const h of hares)if(h.blood?.length){for(const b of h.blood)addTrack('veri',{...b,dir:b.x*7,s:0.12+0.3*h.damage});h.blood.length=0;}
  if((trackT-=dt)<=0&&(trackDirty||Math.hypot(pl.x-trackAt.x,pl.z-trackAt.z)>10)){trackT=0.5;cullTracks(pl.x,pl.z);}
  updateE();WL.humans=[P,NET?.last&&{x:NET.last.x,z:NET.last.z}];
  for(const b of WL.birds)if(b.carried){const n=dogObj.userData.n,nd=n?.leuka||n?.paa;b.x=dog.x;b.z=dog.z;if(nd){nd.getWorldPosition(b.obj.position);b.obj.position.y-=0.1;}b.y=b.obj.position.y;b.obj.rotation.set(0,-(dog.dir||0),Math.PI/2);}
    else if(b.delivered&&!b._dropY){b._dropY=1;b.y=height(b.x,b.z);}
  hares.forEach((h,k)=>{while(hn[k]<h.trail.length)addTrack('janis',h.trail[hn[k]++]);});while(dn<dog.trail.length){if(dn%2===0)addTrack('koira',dog.trail[dn]);dn++;}
  const tnow=clock.elapsedTime;hares.forEach((h,k)=>{const o=hareObjs[k];o.position.set(h.x,height(h.x,h.z),h.z);o.rotation.y=Math.PI/2-h.heading;o.rotation.z=h.alive?0:Math.PI/2;o.visible=!h.held;if(h.carried){const hn2=dogObj.userData.n,nd=hn2?.leuka||hn2?.paa;if(nd){nd.getWorldPosition(o.position);o.position.y-=0.12;}o.rotation.set(0,Math.PI-(dog.dir||0)+Math.PI/2,Math.PI/2);}V8.animHare(o.userData.n,{t:tnow,spd:h.alive?h.speed:0,lying:h.state===H.MAKUU});});
  const dsp=Math.hypot(dog.x-(dog._px??dog.x),dog.z-(dog._pz??dog.z))/Math.max(dt,1e-3);dog._px=dog.x;dog._pz=dog.z;dogJaw=Math.max(0,dogJaw-dt*5);
  dogObj.position.set(dog.x,dog.riding?car.y+0.58:height(dog.x,dog.z),dog.z);dogObj.rotation.set(0,Math.PI-(dog.dir||0),0);V8.animDog(dogObj.userData.n,{t:tnow,spd:dog.riding?0:dsp,jaw:Math.sin(Math.min(1,dogJaw)*Math.PI),barking:dog.barking,sniff:dog.sniffing||dog.state===D.YOJALKI,sit:!!dog.riding,k:V8.DOG_K[DOGBREED]});
  terrierObj.visible=!!NET?.peer;if(terrierObj.visible){const ts=Math.hypot(terrier.x-(terrier._px??terrier.x),terrier.z-(terrier._pz??terrier.z))/Math.max(dt,1e-3);terrier._px=terrier.x;terrier._pz=terrier.z;
    terrierObj.position.set(terrier.x,terrier.riding?car.y+0.58:height(terrier.x,terrier.z),terrier.z);terrierObj.rotation.set(0,Math.PI-(terrier.dir||0),0);V8.animDog(terrierObj.userData.n,{t:tnow,spd:terrier.riding?0:ts,sit:!!terrier.riding,jaw:0,k:V8.DOG_K.terrier});}
  // ääni: kuuluvuus etäisyys + tuuli, panorointi suunnan mukaan
  const vol=audibility(dog.pos,P),rel=Math.atan2(dog.x-pl.x,-(dog.z-pl.z))+pl.yaw,pan=Math.max(-1,Math.min(1,Math.sin(rel)));
  if(!dog.riding&&dog.state!==lastDog){if(dog.state===D.YLOSOTTO)play3d('sfx_koira_ylosotto',{x:dog.x,y:height(dog.x,dog.z)+0.6,z:dog.z,gain:1.4,ref:15,max:2500});if(dog.state===D.HUKKA){play3d('sfx_koira_vinkuu',{x:dog.x,y:height(dog.x,dog.z)+0.6,z:dog.z,gain:.8,ref:6,max:500});if(gpsOn)play('sfx_gps_hukka',{gain:.5});}if(dog.state===D.AJO&&gpsOn)play('sfx_gps_haukkuindikaattori',{gain:.5});lastDog=dog.state;}
  barkT-=dt;if(dog.riding)barkT=1;else if(barkT<=0){if(dog.barking){const iv=dog.barkInterval(hare);play3d(iv<0.8?'sfx_koira_ajo_tiivis':iv>1.8?'sfx_koira_ajo_harva':'sfx_koira_haukku_'+(1+Math.random()*6|0),{x:dog.x,y:height(dog.x,dog.z)+0.6,z:dog.z,gain:1.2*(0.5+vol),ref:15,max:2500,roll:1});dogJaw=1;barkT=iv*(1.5+Math.random());}
    else if(dog.state===D.YOJALKI||dog.state===D.HAKU){play3d(dog.state===D.HAKU?'sfx_koira_nuuhkii':'sfx_koira_nuuhkii_hidas',{x:dog.x,y:height(dog.x,dog.z)+0.4,z:dog.z,gain:.6,ref:3,max:120,roll:1.5});barkT=6;}else barkT=1;}
  if(pl.moving&&stepT<=0){stepT=0.55;}
  // HUD
  shotFlash-=dt;const g=$('gun'),want=shotFlash>0?gunSrc.shot:dog.leashed?gunSrc.naru:gunSrc.fp;if(!g.src.endsWith(want.slice(G.length))&&g.src.includes('/grafiikka/'))g.src=want;
  g.style.transform=shotFlash>0?'translate(10px,8px)':'';
  const deg=((-pl.yaw*180/Math.PI)%360+360)%360;
  $('tls').innerHTML=`Koira: ${dog.riding?'kyydissä':STATE_FI[dog.state]}${dog.sniffing?' (haistelee)':''} · kuuluvuus ${(vol*100|0)}%<br>${pl.moving?'liikkeellä':'paikallaan'} · ${WP.weapon==='kivaari'?'kivääri '+WP.rifleShells+'/3':'haulikko '+pl.shells+'/2'}${WP.binoOn?' · kiikarit':''} · ase ${pl.raise>=1?'tähtäyksessä':pl.raising?'nousee':'alhaalla'}<br>Suunta ${deg|0}°<br>`;
  const cc=$('comp').getContext('2d');cc.clearRect(0,0,128,32);if(compass.complete&&compass.naturalWidth){const W=compass.naturalWidth,Hh=compass.naturalHeight,x0=((deg/360-0.25)*W+W)%W;cc.drawImage(compass,x0,0,W/2,Hh,0,0,128,32);if(x0>W/2)cc.drawImage(compass,0,0,W/2,Hh,(W-x0)/(W/2)*128,0,128,32);}
  else{cc.fillStyle='#fff';cc.fillText(['P','I','E','L'][Math.round(deg/90)%4],60,20);}
  const wc=$('wind').getContext('2d');wc.clearRect(0,0,32,32);wc.save();wc.translate(16,16);wc.rotate(WIND.dir-(-pl.yaw));
  if(windArrow.complete&&windArrow.naturalWidth)wc.drawImage(windArrow,-16,-16);else{wc.fillStyle='#fff';wc.beginPath();wc.moveTo(0,-14);wc.lineTo(6,10);wc.lineTo(-6,10);wc.fill();}wc.restore();
  $('windt').textContent=`${windFromText()} ${WIND.speed} m/s`;
  $('bag').textContent=pl.bag+(pl.bag?' ('+Object.entries(pl.bagBy).map(([k,v])=>(LAJIT[k]||k)+' '+v).join(', ')+')':'');
  if(gpsOn){gpsT-=dt;const c=gpsCtx,W=256,S=W/gpsSpan;c.imageSmoothingEnabled=false;const m=(x,z)=>[W/2+(x-pl.x)*S,W/2+(z-pl.z)*S];
    if(gpsMap.complete&&gpsMap.naturalWidth){const k=gpsGeo.m_per_px,o=gpsGeo.maailma_origo_px,span=gpsSpan/k;c.fillStyle='#7A8070';c.fillRect(0,0,W,W);c.drawImage(gpsMap,o[0]+pl.x/k-span/2,o[1]+pl.z/k-span/2,span,span,0,0,W,W);}
    else{c.fillStyle='#9ab08a';c.fillRect(0,0,W,W);c.strokeStyle='#6b5a3a';c.lineWidth=2;for(const r of ROADS){c.beginPath();r.pts.forEach(([x,z],i)=>{const[a2,b2]=m(x,z);i?c.lineTo(a2,b2):c.moveTo(a2,b2);});c.stroke();}}
    // koiran reitti häivyttyvinä pisteinä (uusin alfa 1)
    const tr=dog.trail,N=Math.min(tr.length,300);for(let i=0;i<N;i+=2){const p=tr[tr.length-N+i],[a2,b2]=m(p.x,p.z);c.globalAlpha=i/N;if(gDot.complete&&gDot.naturalWidth)c.drawImage(gDot,a2-2,b2-2);else{c.fillStyle='#FF8C1A';c.fillRect(a2-1.5,b2-1.5,3,3);}}c.globalAlpha=1;
    const ic=(img,x,y,rot,col,sz=16)=>{c.save();c.translate(x,y);c.rotate(rot);if(img.complete&&img.naturalWidth)c.drawImage(img,-sz/2,-sz/2,sz,sz);else{c.fillStyle=col;c.fillRect(-4,-4,8,8);}c.restore();};
    const hi=dog.barking?(dogJaw>0.3?gh.haukku:gh.ajo):dog.state===D.TANNE||dog.state===D.NARUSSA?gh.seisonta:gh.hiljaa;
    const[dx,dz]=m(dog.x,dog.z),inside=dx>8&&dx<W-8&&dz>8&&dz<W-8;
    if(inside){ic(hi,dx,dz,0,dog.barking?'#f33':'#a52',24);ic(gArrow,dx,dz-16,dog.dir||0,'#fa0',12);}
    else{const ang=Math.atan2(dx-W/2,-(dz-W/2));ic(gArrow,W/2+Math.sin(ang)*(W/2-12),W/2-Math.cos(ang)*(W/2-12),ang,'#fa0',16);}
    ic(gi.pelaaja,W/2,W/2,-pl.yaw,'#00f',16);
    const dd=Math.hypot(dog.x-pl.x,dog.z-pl.z),brg=((Math.atan2(dog.x-pl.x,-(dog.z-pl.z))*180/Math.PI)+360)%360,SU=['P','KO','I','KA','E','LO','L','LU'][Math.round(brg/45)%8];
    c.fillStyle='#000a';c.fillRect(0,W-30,W,30);c.fillStyle='#fff';c.font='bold 11px monospace';c.fillText(`Koira ${dd<1000?Math.round(dd)+' m':(dd/1000).toFixed(1)+' km'} ${SU} ${Math.round(brg)}°`,4,W-17);c.fillText((dog.riding?'kyydissä':STATE_FI[dog.state])+(dog.sniffing?' · haistelee':'')+(dog.barking?' · haukkuu':''),4,W-4);c.fillText(Math.round(gpsSpan)+' m',W-48,12);
    if((gpsImgT-=dt)<=0){gpsImgT=0.1;$('gpsi').src=$('gpsc').toDataURL();}
    if(gpsT<=0){gpsT=3;play('sfx_gps_piippaus',{gain:.15});}}
  {const rp=$('radio');rp.style.display='none';if(interior.loaded&&(radio._d!==radio.on+''+radio.ch)){radio._d=radio.on+''+radio.ch;interior.drawRadio(radio.on,CH[radio.ch].n,FREQ[CH[radio.ch].k]);}radio.showT-=dt;$('radioch').textContent=CH[radio.ch].n;$('radioname').style.display=pl.inCar&&radio.showT>0?'block':'none';$('radioname').textContent='📻 '+CH[radio.ch].n;}
  if((msgT-=dt)<=0)$('msg').textContent='';
  {for(const [id2,on] of [['kyykky',pl.crouch],['gps-ikoni',gpsOn]]){const e2=$(id2);if(e2)e2.style.color=on?'#ff0':'';}}
  updateLeash();{const f=$('cmdF').querySelector('img');const want='/hud/ikonit/'+(dog.leashed?'ikoni_naru_irti':'ikoni_naru_kiinni')+'.png';if(!f.src.endsWith(want))f.src=want;}
  vm.cam.aspect=cam.aspect;vm.cam.fov=55-8*vm.aim;vm.cam.updateProjectionMatrix();vm.update(dt,{moving:pl.moving,t:tnow,aim:aiming});
  renderer.autoClear=true;renderer.render(scene,cam);renderer.autoClear=false;renderer.clearDepth();if(!pl.inCar&&!INS.on)renderer.render(vm.scene,vm.cam);renderIns();}
loop();
window.__game={radio,pl,car,dog,hares,get hare(){return hare;},WL,WP,fire,scene,renderer,cam,THREE,vm,interior,hareObj,hareObjs,dogObj,height,DOGBREED,get NET(){return NET;},get gpsOn(){return gpsOn;}};
