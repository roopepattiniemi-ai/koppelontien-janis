import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as V8 from '/v08.js';
import * as V9 from '/v09.js';
import * as TV from '/tienvarsi.js';
import * as AL from '/aloitus.js';
import { uusiRadio, radioKomento, radioEtene, radioKuva, radioSovita, radioVoimakkuus, radioSuodin, radioAlkuOffset, radioJatka } from '/logic/radio.js';
import { gpsMerkit, gpsPino, gpsTapahtuma } from '/logic/gps.js';
import { nouseKyytiin, hyppaaUlos } from '/logic/kyyti.js';
import { kylaAani, tunnelma } from '/logic/kylaAani.js';
import { sovellaPiha, pihaNykyinen, pihaVersio, pihaPohja, tarkistaPiha } from '/logic/piha.js';
import { judgeShot, LAJIT } from '/logic/rules.js';
import { Car, bodyBox, carFree } from '/logic/car.js';
import { CABIN, YARD, START, SIGNS, inBuilding, SAUNA_POLY, NAVETTA_POLY } from '/logic/world.js';
import { spreadHares, aiInterval } from '/logic/world.js';
import { clampB } from '/logic/bounds.js';
import { height, ROADS, WATER, BUILDINGS, SIZE, trees, inField, isForest, distToRoad, hareSpot, WIND, windFromText, inBounds } from '/logic/world.js';
import { Hare, H } from '/logic/hare.js';
import { Dog, D } from '/logic/dog.js';
import { audibility } from '/logic/hearing.js';
import { toLocal, rayEllipsoid, closestOnTris, ellipsoidFromBox } from '/logic/osumat.js'
import { pelletPattern, swarmHits, judgeHits, woundDmg, groundImpacts, pelletAt, SHOT_RANGE } from '/logic/shot.js';
import { roomSeed, newRoomCode, packWorld, applyWorld, seatFor, startSeat } from '/logic/sync.js';
import { saunaPiste, saunaEtu, nearSauna, yhteenveto, riviPaikat, yhteenvetoTeksti, lopetusPyynto, PISTE } from '/logic/lopetus.js';
import { lisaa as kirjaaKaato, lataa as lataaKaadot, tanaan, jahdinTeksti, paivitaKoira } from '/logic/paivakirja.js';
import { haukkuVali, haukkuSavel, haukkuAani } from '/logic/haukku.js';
import { osuuPelaajaan, lehti as rakennaLehti, lehtiPoyta, lehtiHtml, piirraMainos, piirraJanis, poytaMaailma, nearPoyta, poytaLaatikko, poytaEstaa, siistiNimi } from '/logic/lehti.js';
import { alkuKoira, uusiJahtiKomento } from '/logic/kierros.js';
import { lahetaKoirakomento, vastaanotaKoirakomento } from '/logic/koirakomento.js';
import { seuraavaHyppy, hyppySallittu, pelaajaSavy } from '/logic/hyppy.js';
import { etsiPuhe } from '/logic/puhe.js';
import { fsdTila, fsdKaynnista, fsdPaivita, fsdSaaKutsua, fsdKomento, FSD_TEKSTI } from '/logic/fsd.js';
import { kettuMukana } from '/logic/kettu.js';
import { lumiAlku, lumiPaivita, lumiPaketti, lumiKayta, nakyvyys } from '/logic/lumi.js';
import { RIISTAKAMERA } from '/logic/config.js';
import { pelinKamerat, pelinKone, pelinKoneLaatikko, ohikulut, paivitaHauskat, bigfootKuva } from '/logic/riista.js';
import { sijoitaKylalaiset, seuraavaRepliikki, seuraavaHuuto, teePihaReitti, pihaKohta, JUTTELE_SADE, HUUTO_SADE, HUUTO_TAUKO, NIMET, KYLA_OTSIKOT } from '/logic/kylalaiset.js';
import { lataa as lataaSaav, talleta as talletaSaav, kirjaa as kirjaaSaav } from '/logic/saavutukset.js';
import { makeKylalainen } from '/hahmo.js';
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
let POYTA=poytaMaailma(CABIN);const poytaRyhma=new THREE.Group();poytaRyhma.name='pihapoyta';{
  const g=poytaRyhma,puu=new THREE.MeshLambertMaterial({color:0x6b4423}),penkkiVari=new THREE.MeshLambertMaterial({color:0x5a381c});
  const kansi=new THREE.Mesh(new THREE.BoxGeometry(1.8,0.07,0.72),puu);kansi.position.y=0.74;g.add(kansi);
  for(const[x,z]of[[-0.78,-0.28],[0.78,-0.28],[-0.78,0.28],[0.78,0.28]]){const j=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.74,0.07),puu);j.position.set(x,0.37,z);g.add(j);}
  for(const z of [-0.62,0.62]){const istuin=new THREE.Mesh(new THREE.BoxGeometry(1.6,0.06,0.28),penkkiVari);istuin.position.set(0,0.42,z);g.add(istuin);
    for(const x of [-0.68,0.68]){const j=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.42,0.06),penkkiVari);j.position.set(x,0.21,z);g.add(j);}}
  const c=document.createElement('canvas');c.width=256;c.height=180;const cg=c.getContext('2d');cg.fillStyle='#f4efe4';cg.fillRect(0,0,256,180);cg.strokeStyle='#1a120c';cg.lineWidth=6;cg.strokeRect(6,6,244,168);cg.fillStyle='#1a120c';cg.textAlign='center';cg.font='bold 28px Georgia';cg.fillText('Kollinmäen',128,58);cg.fillText('Sanomat',128,92);cg.font='14px Georgia';cg.fillText('porkkanaloukku ja muita',128,128);cg.fillText('uutisia pihapöydältä',128,148);
  const arkki=new THREE.Mesh(new THREE.PlaneGeometry(0.62,0.44),new THREE.MeshLambertMaterial({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide}));arkki.rotation.x=-Math.PI/2;arkki.position.y=0.79;g.add(arkki);
  g.position.set(POYTA.x,height(POYTA.x,POYTA.z),POYTA.z);g.rotation.y=CABIN.rot;scene.add(g);}
const LUMI_N=460,lumiGeo=new THREE.BufferGeometry(),lumiPos=new Float32Array(LUMI_N*3);
for(let i=0;i<LUMI_N;i++){lumiPos[i*3]=(Math.random()-0.5)*46;lumiPos[i*3+1]=Math.random()*18;lumiPos[i*3+2]=(Math.random()-0.5)*46;}
lumiGeo.setAttribute('position',new THREE.BufferAttribute(lumiPos,3));
const lumiPisteet=new THREE.Points(lumiGeo,new THREE.PointsMaterial({color:0xf7f9ff,size:0.14,transparent:true,opacity:0.88,depthWrite:false}));
lumiPisteet.frustumCulled=false;lumiPisteet.visible=false;scene.add(lumiPisteet);
function lumiPiirra(dt){lumiPisteet.visible=!!lumiTila.on;if(!lumiTila.on)return;const p=lumiGeo.attributes.position.array,v=2.1+(lumiTila.voima||0.6)*2.4;
  for(let i=0;i<LUMI_N;i++){p[i*3+1]-=dt*v;if(p[i*3+1]<0){p[i*3]=(Math.random()-0.5)*46;p[i*3+1]=14+Math.random()*6;p[i*3+2]=(Math.random()-0.5)*46;}}
  lumiGeo.attributes.position.needsUpdate=true;lumiPisteet.position.set(pl.x,height(pl.x,pl.z),pl.z);}
let KAMERAT=pelinKamerat(CABIN),riistaOn=false,riistaI=0,riistaT=0.4;
const riistaKuvat=[],hauskat=[],hauskaMesh=new Map(),kameraMallit=[];
function luoKameranMalli(){const g=new THREE.Group(),puu=new THREE.MeshLambertMaterial({color:0x5a4632}),musta=new THREE.MeshLambertMaterial({color:0x242820});
  const tolppa=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.05,1.2,6),puu);tolppa.position.y=-0.55;g.add(tolppa);
  const runko=new THREE.Mesh(new THREE.BoxGeometry(0.24,0.15,0.34),musta);g.add(runko);
  const linssi=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.045,0.07,8),new THREE.MeshLambertMaterial({color:0x0c0c0c}));linssi.rotation.x=Math.PI/2;linssi.position.z=0.2;g.add(linssi);
  scene.add(g);return g;}
const koneRyhma=new THREE.Group();koneRyhma.name='riistakone';{
  const puu=new THREE.MeshLambertMaterial({color:0x6a5038}),harmaa=new THREE.MeshLambertMaterial({color:0xc4c0b4}),ruutuVari=new THREE.MeshLambertMaterial({color:0x163024});
  const kansi=new THREE.Mesh(new THREE.BoxGeometry(0.95,0.07,0.58),puu);kansi.position.y=0.74;koneRyhma.add(kansi);
  const jalka=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.74,0.08),puu);jalka.position.y=0.37;koneRyhma.add(jalka);
  const torni=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.28,0.32),harmaa);torni.position.set(0.22,0.92,0.02);koneRyhma.add(torni);
  const ruutu=new THREE.Mesh(new THREE.BoxGeometry(0.46,0.3,0.03),ruutuVari);ruutu.position.set(-0.08,1.02,-0.08);ruutu.rotation.x=-0.18;koneRyhma.add(ruutu);}
function sijoitaRiista(){if(!RIISTAKAMERA){koneRyhma.visible=false;return;}
  KAMERAT=pelinKamerat(CABIN);while(kameraMallit.length<KAMERAT.length)kameraMallit.push(luoKameranMalli());
  KAMERAT.forEach((k,i)=>{const m=kameraMallit[i];if(!m)return;m.visible=true;m.position.set(k.x,height(k.x,k.z)+1.15,k.z);m.rotation.y=k.yaw;});
  const p=pelinKone(CABIN);if(!p)return;if(!koneRyhma.parent)scene.add(koneRyhma);
  koneRyhma.visible=true;koneRyhma.position.set(p.x,height(p.x,p.z),p.z);koneRyhma.rotation.y=CABIN.rot||0;}
sijoitaRiista();
function nearKone(x,z){if(!RIISTAKAMERA)return false;const p=pelinKone(CABIN);return !!p&&Math.hypot(x-p.x,z-p.z)<2.3;}
function luoHauska(laji){const g=new THREE.Group(),iho=new THREE.MeshLambertMaterial({color:laji==='bigfoot'?0x3a2a18:laji==='norsu'?0x8a8e92:laji==='ufomies'?0x7d8cff:0xc4a574});
  if(laji==='norsu'){const ruho=new THREE.Mesh(new THREE.BoxGeometry(1.1,1.3,2.1),iho);ruho.position.y=1.15;g.add(ruho);
    const karsa=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.08,1.1,6),iho);karsa.position.set(0,0.7,1.15);karsa.rotation.x=0.7;g.add(karsa);}
  else if(laji==='bigfoot'){const ruho=new THREE.Mesh(new THREE.CapsuleGeometry(0.45,1.15,4,8),iho);ruho.position.y=1.35;g.add(ruho);
    const paa=new THREE.Mesh(new THREE.SphereGeometry(0.32,8,6),iho);paa.position.y=2.25;g.add(paa);}
  else if(laji==='ufomies'){const ruho=new THREE.Mesh(new THREE.CapsuleGeometry(0.22,0.7,3,6),iho);ruho.position.y=1.05;g.add(ruho);
    const paa=new THREE.Mesh(new THREE.SphereGeometry(0.38,8,6),new THREE.MeshLambertMaterial({color:0xd8ffe8}));paa.position.y=1.75;g.add(paa);}
  else{const ruho=new THREE.Mesh(new THREE.CapsuleGeometry(0.28,0.85,3,6),iho);ruho.position.y=1.15;g.add(ruho);
    const pullo=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,0.28,6),new THREE.MeshLambertMaterial({color:0xc4a24a}));pullo.position.set(0.32,1.05,0.1);pullo.rotation.z=0.6;g.add(pullo);}
  return g;}
function piirraHauskat(){const elossa=new Set(hauskat);for(const [e,m] of hauskaMesh)if(!elossa.has(e)){scene.remove(m);hauskaMesh.delete(e);}
  for(const e of hauskat){let m=hauskaMesh.get(e);if(!m){m=luoHauska(e.laji);scene.add(m);hauskaMesh.set(e,m);}m.position.set(e.x,height(e.x,e.z),e.z);m.rotation.y=Math.atan2(e.vx||0,-(e.vz||1));}}
function varmistaRiista(){let el=$('riista');if(el)return el;el=document.createElement('div');el.id='riista';
  el.style.cssText='display:none;position:fixed;inset:0;z-index:90;background:rgba(6,8,6,.78);align-items:center;justify-content:center';
  el.innerHTML='<div style="width:min(680px,94vw);background:#16120e;color:#e6dcc8;padding:16px 18px;border:3px solid #3c3428;font-family:Georgia,serif"><div style="letter-spacing:.14em;font-size:13px">RIISTAKAMERA</div><canvas id="riista-c" width="600" height="340" style="width:100%;background:#111;margin:10px 0;image-rendering:pixelated"></canvas><div id="riista-info" style="min-height:1.4em"></div><div style="margin-top:8px;font-size:13px;opacity:.85">Nuolet selaavat · E sulkee</div></div>';
  document.body.appendChild(el);return el;}
function piirraRiistaKanvas(kuva){const c=$('riista-c');if(!c)return;const g=c.getContext('2d'),yo=!!kuva?.yo,w=c.width,h=c.height;
  g.fillStyle=yo?'#141414':'#5d6b52';g.fillRect(0,0,w,h);
  if(!yo){g.fillStyle='#3e4a38';g.fillRect(0,h*0.62,w,h*0.38);g.fillStyle='#6d7c5c';g.fillRect(0,h*0.55,w,8);}
  const laji=kuva?.laji||'';
  g.save();g.translate(w*0.52,h*0.62);g.fillStyle=yo?'#d0d0d0':'#1a140e';
  if(laji==='norsu'){g.fillRect(-70,-80,150,70);g.fillRect(40,-20,18,70);g.fillRect(-20,-10,16,55);}
  else if(laji==='bigfoot'){g.fillRect(-36,-150,72,150);g.beginPath();g.arc(0,-165,28,0,6.3);g.fill();}
  else if(laji==='ufomies'){g.fillRect(-16,-110,32,100);g.beginPath();g.arc(0,-130,34,0,6.3);g.fill();}
  else if(laji==='janis'||laji==='kettu'){g.beginPath();g.ellipse(0,-28,46,22,0,0,6.3);g.fill();g.fillRect(-8,-78,7,40);g.fillRect(8,-78,7,40);if(laji==='kettu')g.fillRect(30,-40,40,16);}
  else if(laji==='teeri'||laji==='korppi'||laji==='tiainen'){g.beginPath();g.ellipse(0,-40,28,14,-0.4,0,6.3);g.fill();}
  else if(laji){g.fillRect(-18,-120,36,110);g.beginPath();g.arc(0,-136,18,0,6.3);g.fill();if(laji==='juoppo'){g.fillStyle=yo?'#bdbdbd':'#c4a24a';g.fillRect(22,-70,10,36);}if(laji==='mummo'){g.fillStyle=yo?'#9a9a9a':'#e07a20';g.fillRect(-40,-40,16,8);g.fillRect(-36,-48,8,16);}}
  g.restore();
  const img=g.getImageData(0,0,w,h),d=img.data;
  for(let i=0;i<9000;i++){const x=(Math.random()*w)|0,y=(Math.random()*h)|0,o=(y*w+x)*4,n=(Math.random()*50)|0;d[o]+=n-25;d[o+1]+=n-25;d[o+2]+=n-25;}
  if(yo)for(let i=0;i<d.length;i+=4){const y2=(d[i]*0.3+d[i+1]*0.5+d[i+2]*0.2)|0;d[i]=d[i+1]=d[i+2]=y2;}
  g.putImageData(img,0,0);
  g.fillStyle=yo?'#f2f2f2':'#f6e7b0';g.font='18px monospace';g.fillText(kuva?.leima||'--',16,28);g.fillText((kuva?kuva.lampo:-12)+' C',16,52);
  g.font='15px monospace';g.fillText(kuva?(kuva.teksti||kuva.laji):'ei kuvia',16,h-16);}
function naytaRiista(){const k=riistaKuvat[riistaI];piirraRiistaKanvas(k);const info=$('riista-info');if(info)info.textContent=k?`${riistaI+1} / ${riistaKuvat.length} · ${k.teksti||k.laji} · ${k.kamera}`:'Ei vielä kuvia. Kamerat katsovat pihaa ja metsän reunaa.';if(k&&bigfootKuva(k))saavuta({tyyppi:'bigfoot'});}
function avaaRiista(){if(lehtiOn||loppuOn||lukuOn||editorOn)return;riistaOn=true;riistaI=Math.max(0,riistaKuvat.length-1);varmistaRiista().style.display='flex';if(document.pointerLockElement)document.exitPointerLock();$('menu').style.display='none';naytaRiista();}
function suljeRiista(){if(!riistaOn)return;riistaOn=false;const el=$('riista');if(el)el.style.display='none';if(window.__peliAlkanut&&!lehtiOn&&!loppuOn)cvs.requestPointerLock();}
function riistaSim(dt){if(!RIISTAKAMERA)return;piirraHauskat();if(isGuest())return;paivitaHauskat(hauskat,KAMERAT,dt,Math.random,lumiKello);
  riistaT-=dt;if(riistaT>0)return;riistaT=0.45;const yo=(lumiKello%300)>210,elukat=[];
  for(const h of hares)if(h.alive)elukat.push({laji:h.laji==='kettu'?'kettu':'janis',x:h.x,z:h.z,alive:true});
  for(const c of WL.critters)if(c.alive!==false)elukat.push({laji:c.kind,x:c.x,z:c.z,alive:true});
  for(const b of WL.birds)if((b.kind==='teeri'||b.kind==='korppi'||b.kind==='tiainen')&&b.alive!==false)elukat.push({laji:b.kind,x:b.x,z:b.z,alive:true});
  if(!dog.riding)elukat.push({laji:'koira',x:dog.x,z:dog.z,alive:true});
  elukat.push({laji:'pelaaja',x:pl.x,z:pl.z,alive:true});
  if(NET?.last)elukat.push({laji:'pelaaja',x:NET.last.x,z:NET.last.z,alive:true,teksti:'Kaveri'});
  if(NET?.peer&&!terrier.riding)elukat.push({laji:'terrieri',x:terrier.x,z:terrier.z,alive:true});
  for(const k of kylalaiset)if(k.laji==='mummo'&&!k.kaatunut)elukat.push({laji:'mummo',x:k.x,z:k.z,alive:true,teksti:'mummo porkkanoineen'});
  for(const h of hauskat)elukat.push(h);
  ohikulut(KAMERAT,elukat,riistaKuvat,lumiKello,yo);}
let savuMerkki=null,saunaRyhma=null,navettaSeina=null,navettaKatto=null;
function polyMesh(pts,h,color,y0){const s=new THREE.Shape(),p=pts.map(([x,z])=>[x,-z]);let a=0;for(let i=0,j=p.length-1;i<p.length;j=i++)a+=p[j][0]*p[i][1]-p[i][0]*p[j][1];const q=a<0?[...p].reverse():p;
  s.moveTo(q[0][0],q[0][1]);for(let i=1;i<q.length;i++)s.lineTo(q[i][0],q[i][1]);const geo=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:false});geo.rotateX(-Math.PI/2);
  const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color}));m.position.y=y0;scene.add(m);return m;}
function rakennaNavetta(){if(navettaSeina){scene.remove(navettaSeina);navettaSeina.geometry.dispose();}if(navettaKatto){scene.remove(navettaKatto);navettaKatto.geometry.dispose();}
  let nx=0,nz=0;for(const[x,z]of NAVETTA_POLY){nx+=x;nz+=z;}nx/=NAVETTA_POLY.length;nz/=NAVETTA_POLY.length;const gy=height(nx,nz);
  navettaSeina=polyMesh(NAVETTA_POLY,3.8,0x8e2a20,gy);navettaKatto=polyMesh(NAVETTA_POLY,0.4,0xe8eef2,gy+3.8);}
// Tynnyrisauna (Ø 2,9 × 5,0 m) ja L-navetta: sama pohja kuin world.js:n törmäyspolygonit.
{const wood=new THREE.MeshLambertMaterial({color:0x6a3a22}),band=new THREE.MeshLambertMaterial({color:0x8a9098});
 const g=new THREE.Group();saunaRyhma=g;const body=new THREE.Mesh(new THREE.CylinderGeometry(1.45,1.45,5,18),wood);body.rotation.z=Math.PI/2;g.add(body);
 for(const x of[-1.6,0,1.6]){const t=new THREE.Mesh(new THREE.TorusGeometry(1.48,0.055,6,16),band);t.rotation.y=Math.PI/2;t.position.x=x;g.add(t);}
 const door=box(0.08,1.15,0.7,0x3a2418,0.85);door.position.set(2.52,0,0);g.add(door);
 const pipe=new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.15,0.85,8),new THREE.MeshLambertMaterial({color:0x2c2c2c}));pipe.position.set(0.15,1.9,0);g.add(pipe);
 savuMerkki=new THREE.Object3D();savuMerkki.position.set(0.15,2.4,0);g.add(savuMerkki);
 let sx=0,sz=0;for(const[x,z]of SAUNA_POLY){sx+=x;sz+=z;}sx/=SAUNA_POLY.length;sz/=SAUNA_POLY.length;
 g.rotation.y=Math.atan2(0.962,0.272);g.position.set(sx,height(sx,sz)+1.45,sz);scene.add(g);
 rakennaNavetta();}
const car=START?.autossa?new Car({x:START.x,z:START.z,heading:START.heading}):new Car({x:YARD.x+4,z:YARD.z-5,heading:0});
// kyltit (logic/kyltit.json + grafiikka/tekstuurit/kyltit)
V8.setupSigns(scene,SIGNS||[],height);
const carFb=new THREE.Group();{carFb.add(box(1.7,1.1,3.6,0x2f4f6f,0.85));const t=box(1.6,0.8,2.2,0x2f4f6f,1.75);t.position.z=0.3;carFb.add(t);const w=box(1.62,0.5,0.1,0x223344,1.75);w.position.z=-0.82;carFb.add(w);
  for(const[x,z]of[[-0.85,-1.2],[0.85,-1.2],[-0.85,1.2],[0.85,1.2]]){const c=new THREE.Mesh(new THREE.CylinderGeometry(0.36,0.36,0.25,8),new THREE.MeshLambertMaterial({color:0x111111}));c.rotation.z=Math.PI/2;c.position.set(x,0.36,z);carFb.add(c);}}
const wheels={};let door=null,doorT=0;
const carObj=model(['vitara.glb'],carFb,car,0,sc=>{for(const n of['pyora_ev','pyora_eo','pyora_tv','pyora_to'])wheels[n]=sc.getObjectByName(n);door=sc.getObjectByName('ovi_kuljettaja');if(door)door.userData.r0=door.rotation.y;});
const fsd=fsdTila(),fsdValot=[];
function luoFsdValot(){if(fsdValot.length)return;for(const x of[-0.72,0.72]){const m=new THREE.Mesh(new THREE.SphereGeometry(0.07,6,6),new THREE.MeshBasicMaterial({color:0xfff1a8}));m.position.set(x,0.72,1.55);const l=new THREE.PointLight(0xffe090,0,9);l.position.copy(m.position);carObj.add(m);carObj.add(l);fsdValot.push({m,l});}}
function fsdSeis(teksti){if(!fsd.on)return;fsd.on=false;if(teksti)say(teksti);if(NET?.peer&&ME==='h')NET.send({t:'fsd',on:0,teksti:teksti||''});}
function kaynnistaFsd(x,z){if(!fsdSaaKutsua({autossa:!!pl.inCar,vierasAutossa:!!(NET?.last?.inCar)})){say('FSD ei aja, kun autossa istutaan');return;}const alku=fsdKaynnista(fsd,car,{x,z},{vapaa:carFree,roads:ROADS});luoFsdValot();say(alku.teksti||FSD_TEKSTI);if(alku.kommentti)setTimeout(()=>{if(fsd.on)say(alku.kommentti);},1100);if(NET?.peer&&ME==='h')NET.send({t:'fsd',on:1,teksti:alku.teksti||FSD_TEKSTI});}
function kutsuFsd(){if(lehtiOn||loppuOn||lukuOn||editorOn)return;if(!fsdSaaKutsua({autossa:!!pl.inCar,vierasAutossa:!!(NET?.last?.inCar)})){say('FSD ei aja, kun autossa istutaan');return;}if(fsdKomento(ME,!!(NET&&NET.peer))==='pyynto'){NET.send({t:'fsd',x:pl.x,z:pl.z});say('FSD-pyyntö isännälle');return;}kaynnistaFsd(pl.x,pl.z);}
const interior=V8.setupInterior(scene), vm=V8.setupViewmodel(), WP=V9.setupWeapons(vm);
const FREQ={parkano:'98.4',country:'103.7',tekno:'91.1'};
// ---------- jäljet lumessa (decalit, suunta) ----------
// v1.1: kaikki lumidekaalit (jäljet, veri, haulien pöllähdykset) InstancedMeshinä; data tallessa, näkyviin vain lähimmät
// TRACK_R metrin sisällä, max MAXJ/laji; uudelleenrakennus 0.5 s välein tai kun pelaaja siirtyy >10 m.
const MAXJ=1500,TRACK_R=160,MAXDATA=20000; const jg=new THREE.PlaneGeometry(0.3,0.3).rotateX(-Math.PI/2);
const blot=(col,n,r)=>canvasTex(32,32,g=>{g.fillStyle=col;for(let k=0;k<n;k++){const a=k*2.4,d=k?r*Math.sqrt(k/n)*10:0;g.beginPath();g.arc(16+Math.cos(a)*d,16+Math.sin(a)*d,k?2+((k*7)%3):6,0,7);g.fill();}});
const TEXS={janis:jalkiT.janis,koira:jalkiT.koira,kettu:V9.trackCanvas('kettu'),peura:V9.trackCanvas('peura'),kauris:V9.trackCanvas('kauris'),veri:canvasTex(32,32,g=>{// v1.1c pisaramaiset roiskeet
  g.fillStyle='#6e0a0a';const D=[[16,16,3.2,0],[8,10,1.6,0.6],[24,9,1.3,-0.5],[25,22,1.8,0.9],[9,24,1.2,2.4],[18,5,1,0],[4,17,0.9,0],[28,15,0.8,0]];for(const[x,y,r,a]of D){g.beginPath();g.ellipse(x,y,r,r*1.6,a,0,7);g.fill();}}),polly:blot('rgba(150,160,175,0.7)',6,1)};
const SIZES={veri:0.17,polly:0.22,janis:1.6,kauris:0.62};
const jm={},jd={},jn={};for(const k in TEXS){jm[k]=new THREE.InstancedMesh(jg,new THREE.MeshBasicMaterial({map:TEXS[k],transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}),MAXJ);jm[k].count=0;jm[k].frustumCulled=false;scene.add(jm[k]);jd[k]=[];jn[k]=0;}
const M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),Y=new THREE.Vector3(0,1,0),_tp=new THREE.Vector3(),_ts=new THREE.Vector3();
let trackDirty=true,trackAt={x:1e9,z:1e9},trackT=0;
let lumiKello=0;const lumiTila=lumiAlku();
function addTrack(kind,p){const a=jd[kind];if(!a)return;if(a.length>=MAXDATA)a.shift();a.push({x:p.x,z:p.z,dir:p.dir||0,y:height(p.x,p.z)+0.1+(kind==='veri'?0.005:0),s:p.s||SIZES[kind]||1,luotu:p.synty!=null?p.synty:lumiKello,yo:!!p.yo});trackDirty=true;}
function cullTracks(px,pz){for(const k in jd){const a=jd[k],m=jm[k];let n=0;for(let i=a.length-1;i>=0&&n<MAXJ;i--){const p=a[i];if(Math.abs(p.x-px)>TRACK_R||Math.abs(p.z-pz)>TRACK_R)continue;
  const nak=nakyvyys(lumiKello-(p.luotu||0),lumiTila);if(nak<0.05)continue;const sc=p.s*Math.max(0.28,nak);
  Q.setFromAxisAngle(Y,-p.dir);_tp.set(p.x,p.y,p.z);_ts.set(sc,1,sc);M4.compose(_tp,Q,_ts);m.setMatrixAt(n++,M4);}m.count=n;m.instanceMatrix.needsUpdate=true;}trackDirty=false;trackAt={x:px,z:pz};}
window.__tracks=()=>{const o={};for(const k in jd)o[k]=[jd[k].length,jm[k].count];return o;};
// ---------- naru: tekstuuri toistuu pystysuunnassa, venyy kädestä pantaan ----------
const hihnaT=tex(['tekstuurit/hihna.png'],()=>canvasTex(16,64,g=>{g.fillStyle='#7a2a18';g.fillRect(3,0,10,64);}),true);
const leashGeo=new THREE.BufferGeometry();leashGeo.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(12),3));leashGeo.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));leashGeo.setIndex([0,1,2,0,2,3]);
const leash=new THREE.Mesh(leashGeo,new THREE.MeshBasicMaterial({map:hihnaT,transparent:true,alphaTest:0.3,side:THREE.DoubleSide}));leash.frustumCulled=false;scene.add(leash);
const _a=new THREE.Vector3(),_b=new THREE.Vector3(),_d=new THREE.Vector3(),_s=new THREE.Vector3(),_v=new THREE.Vector3();
function omaKoiraNyt(){return isGuest()?terrier:dog;}
function updateLeash(){const k=omaKoiraNyt();leash.visible=!!(k&&k.leashed&&!k.riding&&!pl.inCar);if(!leash.visible)return;
  _a.set(0,-0.42,-0.5).applyQuaternion(cam.quaternion).add(cam.position); // käsi: kuvan alareunan keskikohta (256,256)
  _b.set(k.x,height(k.x,k.z)+0.55,k.z);_d.subVectors(_b,_a);const L=_d.length();_v.subVectors(cam.position,_a);_s.crossVectors(_d,_v).normalize().multiplyScalar(0.02);
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
if(kettuMukana(WSEED)){const sp=hareSpot(mulberry32((WSEED^0x51ed)>>>0));hares.push(new Hare({...sp,seed:(WSEED^0x9e37)%1e6|0,feed:feedOk,laji:'kettu'}));}
let hare=hares[0];const hareObjs=hares.map((h,k)=>h.laji==='kettu'?animal('elaimet/kettu.glb',box(0.22,0.28,0.72,0xc0581c,0.22)):k?animal('janis.glb',box(0.25,0.3,0.5,0xf4f6f8,0.15)):hareObj),hn=hares.map(()=>0);
const ALKUKOIRA=alkuKoira();
const dog=new Dog({x:car.x,z:car.z,seed:7,leashed:true,riding:!!START?.autossa&&ALKUKOIRA.riding});dog.kimea=DOGBREED==='terrieri';
const JAHTI=(Date.now().toString(36)+Math.random().toString(36).slice(2,6));const KOIRA_NIMI=DOGBREED==='terrieri'?'terrieri':'ajokoira';
const LEHTI_SEED=(Math.random()*2**32)>>>0;function omaNimi(){try{return siistiNimi(localStorage.getItem('jahti_nimi')||new URLSearchParams(location.search).get('nimi'));}catch{return 'Metsäkaveri';}}
if(dog.riding){dog.kyytiNaru=true;const c0=car.cargo(0);dog.x=c0.x;dog.z=c0.z;dog.dir=car.heading;}
const terrierObj=animal('koira_jagdterrier.glb',box(0.22,0.4,0.55,0x1a1a1a,0.28));terrierObj.visible=false;
const terrier=new Dog({x:car.x,z:car.z,seed:11,leashed:true,riding:!!START?.autossa&&ALKUKOIRA.riding});
if(terrier.riding){terrier.kyytiNaru=true;const c1=car.cargo(1);terrier.x=c1.x;terrier.z=c1.z;terrier.dir=car.heading;}
const pl={x:car.x,z:car.z,yaw:-car.heading,inCar:!!START?.autossa,seat:startSeat(!!START?.autossa,ROOM?null:'h',!!ROOM),pitch:0,raise:0,raising:false,revealT:0,shells:2,bag:0,moving:false};
const carVol=b=>b*(pl.inCar?0.5:2);
// GPS-kanvas CPU-tilassa (willReadFrequently): GPU-kiihdytetty 2D-kanvas tuotti mustan haamukerroksen kompassin alle
const gpsCtx=$('gpsc').getContext('2d',{willReadFrequently:true});let gpsImgT=0;
// Näytetään GPS <img>:nä: näkyvä 2D-kanvas tuotti mustan haamulaatikon kompassin alle (Chromen kompositointi)
let engine=null;let gpsOn=false,gpsMode=0,gpsSpan=800,gpsKoriNyt=null,hyppyCd=0,hyppyEd=null,luovutus=0,vierasLuovutus=0;const gh={};for(const n of['ajo','seisonta','haukku','hiljaa'])(gh[n]=new Image()).src=G+'hud/gps_haukku_'+n+'.png';const gArrow=new Image();gArrow.src=G+'hud/gps_suunta_nuoli.png';const gDot=new Image();gDot.src=G+'hud/gps_reitti_piste.png';const gpsMap=new Image();let gpsGeo={m_per_px:SIZE/1024,maailma_origo_px:[512,512]};gpsMap.src=G+'hud/gps_kartta.png';fetch(G+'hud/gps_kartta.json').then(r=>r.ok&&r.json()).then(j=>{if(j)gpsGeo=j;}).catch(()=>{});const gi={};for(const n of['pelaaja','koira','koira_ajo','koira_haku','koira_hukka']){gi[n]=new Image();gi[n].src=G+'hud/gps_'+n+'.png';}
let dogJaw=0,ambT=12;let dn=0,barkT=0,terrierBarkT=1.4,stepT=0,msgT=0,puheT=0,huutoTauko=0,lastDog=dog.state,shotFlash=0,hareFlushed=false,muistiT=0;
for(const h of hares)for(const p of h.nightTrail)addTrack(h.laji==='kettu'?'kettu':'janis',p);
{const G={};for(const t of TREES)(G[Math.floor(t.x/4)+','+Math.floor(t.z/4)]??=[]).push(t);car.blocked=(x,z)=>{const gx=Math.floor(x/4),gz=Math.floor(z/4);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(const t of G[(gx+a)+','+(gz+b)]||[])if(Math.hypot(t.x-x,t.z-z)<1.4)return true;return poytaEstaa(car.x,car.z,x,z,poytaLaatikko(CABIN,1))||poytaEstaa(car.x,car.z,x,z,pelinKoneLaatikko(CABIN));};}
const PUUSOLU=8,PUUG=new Map();
for(const t of TREES){if(/^(kanto|taimi|kaatunut)/.test(t.model||''))continue;const k=Math.floor(t.x/PUUSOLU)+','+Math.floor(t.z/PUUSOLU);(PUUG.get(k)??PUUG.set(k,[]).get(k)).push(t);}
function puuEdessa(x,z){const gx=Math.floor(x/PUUSOLU),gz=Math.floor(z/PUUSOLU);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(const t of PUUG.get((gx+a)+','+(gz+b))||[])if((t.x-x)**2+(t.z-z)**2<5.3)return true;return false;}
const WL=V9.setupWildlife(scene,{rand:mulberry32(WSEED+1),height,isForest,trees:TREES,play3d:(n,o)=>play3d(n,o),aiInterval});
const kylalaiset=sijoitaKylalaiset(BUILDINGS,WSEED,YARD,(x,z)=>inBounds(x,z,2)&&!inBuilding(x,z)&&distToRoad(x,z)>1.2&&Math.hypot(x-YARD.x,z-YARD.z)>YARD.r+6).map(k=>{const obj=makeKylalainen(k.laji);obj.userData.asetaKoti(k.x,k.z,k.yaw);obj.position.y=height(k.x,k.z);scene.add(obj);const reitti=teePihaReitti(k,BUILDINGS[k.talo],{tie:distToRoad,metsa:isForest});return {...k,obj,i:-1,kaatunut:false,reitti,vaihe:k.id*11.3};});
V9.setupGrass(scene,{height,ok:(x,z)=>distToRoad(x,z)>4&&Math.hypot(x-YARD.x,z-YARD.z)>YARD.r+3&&!inField(x,z)});
const ALLSND=['sfx_kivaari_laukaus','sfx_kivaari_lataus','sfx_teeri_pyrahdus_1','sfx_teeri_pyrahdus_2','amb_teeri_kuherrus_1','sfx_peura_pakenee_1','sfx_kauris_haukku_1','sfx_kettu_haukahdus_1','sfx_kettu_haukahdus_2','amb_tiainen_1','amb_tiainen_2','amb_korppi_lento_1'];
// ---------- autoradio: isäntä arpoo, vieras kelautuu samaan kohtaan ----------
const CH=[{n:'Parkano Rock',k:'parkano'},{n:'Jalasjärven Country',k:'country'},{n:'Koppelontien Tekno',k:'tekno'}];
const RS=uusiRadio(WSEED^0x51ed);
const radio={on:false,ch:0,song:0,src:null,out:null,showT:0};
let radioHb=0,radioKesken=false,radioLoppui=false,radioTok=0;
function peilaaRadio(){radio.on=!!RS.on;radio.ch=RS.ch|0;radio.song=RS.song|0;}
async function rbuf(n){if(buf[n])return buf[n];if(!rbuf.k)rbuf.k={};if(!rbuf.k[n])rbuf.k[n]=(async()=>{await loadSnd(n);const b=buf[n];if(!b)delete buf[n];delete rbuf.k[n];return b;})();return rbuf.k[n];}
function radioOut(){if(radio.out)return radio.out;const su=radioSuodin(true,false);const hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=su.hp;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=su.lp;
  const g=AC.createGain();g.gain.value=radioVoimakkuus(true,false);const c3=A3.chain({ref:2,max:250,roll:1.6});c3.far=false;hp.connect(lp).connect(g).connect(c3.g);radio.out={hp,lp,g,c3};return radio.out;}
function radioStop(){if(radio.src){radio.src.onended=null;try{radio.src.stop();}catch{}radio.src=null;}}
function radioOff(){radioStop();radioKesken=false;radioLoppui=false;}
async function radioHerata(){if(!AC||!AL.aanetPaalla())return;if(AC.state==='suspended'){try{await AC.resume();}catch{}}if(RS.on&&!radio.src&&!radioKesken&&!radioLoppui)radioSoita(RS.pos);}
async function radioSoita(offset){if(!AC||!RS.on||!RS.clip){radioOff();return;}
  const tok=++radioTok,gen=RS.gen,clip=RS.clip;radioKesken=true;radioLoppui=false;radioStop();
  if(AC.state==='suspended'&&AL.aanetPaalla()){try{await AC.resume();}catch{}}
  const alku=AC.currentTime,b=await rbuf(clip);if(tok!==radioTok)return;if(gen!==RS.gen||RS.clip!==clip||!RS.on){radioKesken=false;return;}
  if(!b){radioKesken=false;return;}
  let off=offset||0;if(isGuest())off+=Math.max(0,AC.currentTime-alku);
  const al=radioAlkuOffset(off,b.duration);radioKesken=false;if(al.ohi){radioLoppui=true;RS.pos=b.duration;return;}
  const s=AC.createBufferSource();s.buffer=b;const sg=AC.createGain();sg.gain.value=clip.includes('juonto_')?1.15:1;s.connect(sg).connect(radioOut().hp);
  s.onended=()=>{if(radio.src!==s)return;radio.src=null;radioLoppui=true;};
  radio.src=s;try{s.start(0,al.off);}catch{try{s.start();}catch{}}RS.pos=al.off;peilaaRadio();}
function lahetaRadio(){peilaaRadio();if(NET?.peer&&!isGuest())NET.send(radioKuva(RS));}
function radioNappi(act){if(isGuest()){NET.send({t:'r',act});return;}
  radioKomento(RS,act);radio.showT=2.5;if(RS.on)radioSoita(0);else{radioOff();say('Radio pois');}lahetaRadio();}
function vastaanotaRadio(m){if(m.act){if(!isGuest()){radioKomento(RS,m.act);radio.showT=2.5;if(RS.on)radioSoita(0);else{radioOff();say('Radio pois');}lahetaRadio();}return;}
  const t=radioSovita(RS,m);peilaaRadio();radio.showT=2.5;if(t==='pois')radioOff();else if(t==='hae'){radioLoppui=false;radioSoita(RS.pos);}}
function radioTick(dt){peilaaRadio();if(!RS.on||!AC)return;
  if(isGuest()){if(radio.src&&!radioLoppui&&!radioKesken)RS.pos=(RS.pos||0)+dt;return;}
  const tila=radioJatka({kesken:radioKesken,loppui:radioLoppui,src:radio.src});
  if(tila==='odota')return;
  const b=buf[RS.clip];
  if(tila==='seuraava'){const dur=Math.max(0.05,b?.duration||RS.pos||0.05);RS.pos=Math.max(RS.pos||0,dur);if(radioEtene(RS,0.001,dur)){radioLoppui=false;radioSoita(0);lahetaRadio();}return;}
  if(!b){if(!radioKesken)rbuf(RS.clip);return;}
  if(tila==='soita'){radioSoita(RS.pos);return;}
  if(radioEtene(RS,dt,b.duration)){radioLoppui=false;radioSoita(0);lahetaRadio();}
  if(NET?.peer&&ME==='h'){radioHb-=dt;if(radioHb<=0){radioHb=2;NET.send(radioKuva(RS));}}}
addEventListener('focus',()=>radioHerata());
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')radioHerata();});
const keys={};addEventListener('keydown',e=>{keys[e.code]=true;
  if(e.target&&e.target.tagName==='INPUT')return;
  if(e.code==='Enter'&&$('menu').style.display==='flex'&&!loppuOn&&!lehtiOn&&!lukuOn){e.preventDefault();jatkaJahtia();return;}
  if(e.code==='Space'){e.preventDefault();if($('menu').style.display!=='flex')kieltaydyHypysta();return;}
  if(e.code==='KeyV'&&!pl.inCar&&!lehtiOn&&!loppuOn&&!lukuOn&&!editorOn&&!riistaOn){kutsuFsd();return;}
  if(riistaOn&&(e.code==='ArrowRight'||e.code==='ArrowLeft')){if(riistaKuvat.length){riistaI=(riistaI+(e.code==='ArrowRight'?1:-1)+riistaKuvat.length)%riistaKuvat.length;naytaRiista();}return;}
  if(riistaOn&&(e.code==='KeyE'||e.code==='Escape')){suljeRiista();return;}
  if((lukuOn||lehtiOn)&&(e.code==='ArrowRight'||e.code==='ArrowLeft')){const el=$('lehti');if(el&&el._selaa)el._selaa(e.code==='ArrowRight'?1:-1);return;}
  if(lukuOn){if(e.code==='KeyE'||e.code==='Escape')suljeLuku();return;}
  if(e.code==='F8'){vaihdaEditori();return;}
  if(editorOn&&(e.code==='KeyQ'||e.code==='KeyE')){editorPyorita(e.code==='KeyE'?0.08:-0.08);return;}
  if(e.code==='Tab')e.preventDefault();
  if(!pl.inCar&&e.code==='Tab'){switchWeapon();return;}
  if(!pl.inCar&&e.code==='KeyB'){WP.toggleBino();return;}
  if(!pl.inCar&&e.code==='KeyC'){pl.crouch=!pl.crouch;say(pl.crouch?'Kyykyssä':'Seisoo');return;}
  if(pl.inCar){if(e.code==='KeyR'){radioNappi('on');return;}
    if(e.code==='Tab')return;if(e.code==='KeyQ'){radioNappi('ch');return;}}

  if(gpsMode&&(e.code==='Equal'||e.code==='Minus'||e.code==='NumpadAdd'||e.code==='NumpadSubtract')){gpsSpan=Math.max(150,Math.min(1600,gpsSpan*(e.code.includes('Equal')||e.code.includes('Add')?0.7:1.43)));say('GPS-zoom '+Math.round(gpsSpan)+' m');return;}
  if(e.code==='Equal'||e.code==='Minus'||e.code==='NumpadAdd'||e.code==='NumpadSubtract'){resI=Math.max(0,Math.min(2,resI+(e.code.includes('Equal')||e.code.includes('Add')?1:-1)));[RW,RH]=RES[resI];renderer.setSize(RW,RH,false);say('Resoluutio '+RW+'x'+RH);}
  if(e.code==='KeyG'||e.code==='KeyM'){const oli=gpsOn;gpsMode=(gpsMode+1)%3;gpsOn=gpsMode>0;if(gpsOn&&!oli)saavuta({tyyppi:'gps'});const gd=$('gps');gd.style.display=gpsOn?'block':'none';gd.style.width=gpsMode===2?'calc(50vh*0.8)':'min(24vw,240px)';gd.style.height=gpsMode===2?'50vh':'calc(min(24vw,240px)*1.25)';varmistaFsdNappi();const gpn=!oli&&gpsOn?'sfx_gps_avaus':oli&&!gpsOn?'sfx_gps_sulku':null;if(gpn)play(gpn,{gain:0.6});}
  {const viesti=lahetaKoirakomento({role:isGuest()?'v':'h',code:e.code,koira:dog,terrieri:terrier,x:pl.x,z:pl.z,hare});if(viesti){const C=viesti.c;if(isGuest())NET.send({t:'cmd',kenelle:'terrieri',c:C,x:pl.x,z:pl.z});const r=viesti.tulos;
    const shout=k=>play('aani_'+k+'_'+(1+Math.random()*2|0),{gain:.8});
    if(C==='irti'||C==='kiinni')play('sfx_hihna_naksahdus',{gain:.8});
    if(C==='irti')shout('irti');if(C==='tanne'){shout('tanne');}if(C==='seuraa'){shout('seuraa');}if(C==='etsi'){shout('etsi');}if(C==='taalla')play('aani_taalla_'+(1+Math.random()*2|0),{gain:.9});
    say(r.ok?{irti:'Koira irti – haku!',kiinni:'Koira kytketty',tanne:'Tänne!',seuraa:'Seuraa!',etsi:'Etsi!',taalla:r.jalki?'Tule tänne, täällä! (jälki)':'Tule tänne, täällä!'}[C]:r.syy);}}
  if(e.code==='KeyE'&&!pl.inCar&&!lehtiOn&&!loppuOn){const c=nearestE();if(c&&c.kind!=='auto'){insPick(c);return;}
    if(!INS.on&&nearSauna(pl.x,pl.z,saunaPiste())){pyydaLopetus();return;}
    if(!INS.on&&nearPoyta(pl.x,pl.z,POYTA)){avaaPoytaLehti();return;}
    if(!INS.on&&nearKone(pl.x,pl.z)){avaaRiista();return;}
    const jk=lahinKylalainen();if(jk){juttele(jk);return;}}
  if(e.code==='KeyE'&&INS.on){insDrop();return;}
  if(e.code==='KeyE'){doorT=1;if(pl.inCar){const was=pl.seat,alone=!NET?.last?.inCar,hop=ME==='v'?terrier.riding:dog.riding,naruKyydissa=dog.riding&&(dog.kyytiNaru||dog.state===D.NARUSSA);pl.inCar=false;if(was==='kuski')car.speed=0;pl.seat=null;
      if(!isGuest())dismountDog();
      play('sfx_vitara_ovi_auki',{gain:carVol(.7)});const p=car.exitPos(was||'kuski');pl.x=p.x;pl.z=p.z;
      if(alone){play('sfx_vitara_sammutus',{gain:carVol(.6)});if(engine){for(const k in engine)engine[k]?.s.stop();engine=null;}}
      setTimeout(()=>play('sfx_vitara_ovi_kiinni',{gain:carVol(.7)}),500);say(naruKyydissa&&!isGuest()?'Nousit autosta – koira hyppäsi ulos ja pysyy narussa':hop?'Nousit autosta – koira hyppäsi ulos':'Nousit autosta');}
    else{const r=car.canEnter({x:pl.x,z:pl.z});if(!r.ok){if(Math.hypot(pl.x-car.x,pl.z-car.z)<3)say(r.syy);}else{pl.inCar=true;pl.raise=0;pl.seat=NET?.peer&&NET.last?.inCar?seatFor(NET.last.seat):'kuski';const nousi=!isGuest()&&nouseKyytiin(dog);if(nousi){const c0=car.cargo(0);dog.x=c0.x;dog.z=c0.z;dog.dir=car.heading;hopSnd(c0.x,c0.z);}play('sfx_vitara_ovi_auki',{gain:carVol(.7)});
      setTimeout(()=>{play('sfx_vitara_ovi_kiinni',{gain:carVol(.7)});if(!engine){play('sfx_vitara_kaynnistys',{gain:carVol(.7)});setTimeout(()=>{if((pl.inCar||NET?.last?.inCar)&&!engine)engine=engineStart();},1200);}},500);say(nousi?'Autossa – koira kyydissä, naru pysyy. W/S kaasu, A/D ohjaus, R radio, Q kanava, E ulos':'Autossa – W/S kaasu/jarru, A/D ohjaus, R radio, Q kanava, E ulos');}}}
  if(e.code==='KeyR'&&!pl.inCar&&WP.weapon==='kivaari'){if(WP.rifleShells<3&&WP.reloadT<=0){WP.rifleShells=3;WP.startReload();play('sfx_kivaari_lataus',{gain:.8});say('Kivääri ladattu');}return;}
  if(e.code==='KeyR'&&!pl.inCar&&pl.shells<2&&vm.reload<=0){pl.shells=2;vm.startReload();play('sfx_haulikko_lataus',{gain:.8});say('Ladattu');}});
addEventListener('keyup',e=>keys[e.code]=false);
function switchWeapon(){WP.setWeapon(WP.weapon==='haulikko'?'kivaari':'haulikko');pl.raise=0;pl.raising=false;say(WP.weapon==='kivaari'?'Kivääri':'Haulikko');}
addEventListener('wheel',e=>{if(!document.pointerLockElement||pl.inCar)return;if(WP.weapon==='kivaari'&&vm.aim>0.9){WP.zoom=Math.max(3,Math.min(12,WP.zoom*(e.deltaY<0?1.15:1/1.15)));return;}if(!WP.binoOn)switchWeapon();},{passive:true});
// laukaus: haulikko = PELLETS haulin parvi siemenestä (verkossa sama siemen -> sama tulos), kivääri = yksi luoti.
// Osumat tallennetaan jäniksen paikalliskoordinaatteihin (h.marks) tarkastelua varten. Saalis kirjataan vasta laskettaessa (tarkastelu).
let shotSeq=0;
const lauk={h:{laukaukset:0,osumat:0},v:{laukaukset:0,osumat:0}};
function kylaOsuma(o,dir,w,seed){let best=null,bd=1e9;for(const k of kylalaiset){if(k.kaatunut)continue;const kohde={x:k.x,y:height(k.x,k.z)+1.05,z:k.z};if(!osuuPelaajaan(o,dir,w,seed,kohde,0.55))continue;const d=Math.hypot(kohde.x-o.x,kohde.y-o.y,kohde.z-o.z);if(d<bd){bd=d;best=k;}}return best?{k:best,d:bd}:null;}
function fire(arg){const local=!arg;if(local){const d=new THREE.Vector3();cam.getWorldDirection(d);arg={o:{x:cam.position.x,y:cam.position.y,z:cam.position.z},d:{x:d.x,y:d.y,z:d.z},w:WP.weapon,seed:(WSEED^(++shotSeq*2654435761))>>>0,by:ME};window.__lastFire=arg;}
  const {o,d:dir,w,seed,by}=arg,rifle=w==='kivaari';const who=by==='v'?'v':'h';lauk[who].laukaukset++;
  let ystava=null;
  if(NET?.peer&&!lehtiOn&&!loppuOn){const kohde=by===ME?(NET.last&&{x:NET.last.x,y:(NET.last.y??height(NET.last.x,NET.last.z)+1.5)-0.25-(NET.last.crouch?0.35:0),z:NET.last.z}):{x:pl.x,y:cam.position.y-0.25-(pl.crouch?0.35:0),z:pl.z};if(kohde&&osuuPelaajaan(o,dir,w,seed,kohde,0.45))ystava={d:Math.hypot(kohde.x-o.x,kohde.y-o.y,kohde.z-o.z),kaatui:by==='h'?'v':'h'};}
  const T=[...hares.map(h=>({kind:h.laji==='kettu'?'kettu':'janis',h,get alive(){return h.alive;},pos:()=>({x:h.x,y:height(h.x,h.z)+(h.laji==='kettu'?0.32:0.2),z:h.z}),r:h.laji==='kettu'?0.24:0.22,shoot:()=>h.shoot(by)})),...WL.targets];
  const pat=rifle?[[0,0]]:pelletPattern(seed);let best=null,bd=1e9;
  for(const t of T){if(!t.alive)continue;const p=t.pos(),dd=Math.hypot(p.x-o.x,p.y-o.y,p.z-o.z);if(dd>(rifle?400:SHOT_RANGE))continue;
    let hits;if(rifle){const v=new THREE.Vector3(p.x-o.x,p.y-o.y,p.z-o.z),along=v.dot(new THREE.Vector3(dir.x,dir.y,dir.z));hits=along>0&&v.addScaledVector(dir,-along).length()<t.r?[0]:[];}
    else hits=swarmHits(o,dir,p,t.r,pat);
    if(hits.length&&dd<bd){bd=dd;best={t,hits,dist:dd,p};}}
  const npc=!lehtiOn&&!loppuOn?kylaOsuma(o,dir,w,seed):null;
  if(npc&&(!ystava||npc.d<ystava.d)&&(!best||npc.d<best.dist)){lauk[who].osumat++;if(by===ME)saavuta({tyyppi:'kyla'});if(ME==='h'){const ots=KYLA_OTSIKOT[npc.k.laji];kaynnistaLehti('k',{nimi:NIMET[npc.k.laji],otsikko:ots[0],ingressi:ots[1],kyla:npc.k.id});}return{kyla:npc.k.laji};}
  if(ystava){lauk[who].osumat++;if(by===ME)saavuta({tyyppi:'etusivu'});if(ME==='h')kaynnistaLehti(ystava.kaatui);}
  // ohi menneet haulit: lumipöllähdykset
  if(!rifle)for(const g of groundImpacts(o,dir,pat,height,best?best.hits:[]).slice(0,30))addTrack('polly',{...g,dir:g.t});
  if(!best){if(local&&!$('msg').textContent)say('Ohi');return null;}
  lauk[who].osumat++;
  const {t,hits,p}=best,n=hits.length;
  // osumakohdat -> kohteen paikalliskoordinaatit (kierretty suunnan mukaan), verijäljet lumelle
  // v1.1c: jokaisen haulin oma lentorata (suulta pisteeseen) kohteen mallin paikallisiin koordinaatteihin kohteen matrixWorldin kautta
  const hareLaji=t.kind==='janis'||(t.kind==='kettu'&&t.h);
  const tob=hareLaji?hareObjs[hares.indexOf(t.h)]:(t.h||t.c||t.b||t).obj;let inv=null;if(tob){tob.updateMatrixWorld(true);inv=tob.matrixWorld.clone().invert();}
  const hd=t.b?Math.PI/2-(t.b.heading||0):(t.h||t.c)?.heading||0,c=Math.cos(hd),sn=Math.sin(hd),marks=hits.map(i=>{const q=rifle?{x:p.x,y:p.y,z:p.z}:pelletAt(o,dir,pat[i],best.dist);const dx=q.x-p.x,dz=q.z-p.z;
    let lo=null,ld=null;if(inv){const pd=new THREE.Vector3(q.x-o.x,q.y-o.y,q.z-o.z).normalize(),a=new THREE.Vector3(q.x,q.y,q.z).addScaledVector(pd,-1.5).applyMatrix4(inv),b2=new THREE.Vector3(q.x,q.y,q.z).addScaledVector(pd,0.5).applyMatrix4(inv);lo=a.toArray();ld=b2.sub(a).normalize().toArray();}
    return{f:dx*c+dz*sn,s:-dx*sn+dz*c,y:q.y-p.y,bullet:rifle,lo,ld};});
  const tgt=t.h||t.c||t.b||t;tgt.marks=(tgt.marks||[]).concat(marks);if(hareLaji)applyMarks(hareObjs[hares.indexOf(t.h)],tgt.marks,t.kind);else if(tgt.obj)applyMarks(tgt.obj,tgt.marks,t.kind);
  for(let k=0;k<Math.min(12,2+n);k++){const a=(seed%997+k*2.39),r=0.2+0.12*k;addTrack('veri',{x:p.x+Math.cos(a)*r+dir.x*0.4*k,z:p.z+Math.sin(a)*r+dir.z*0.4*k,dir:a,s:0.05+0.08*Math.min(1,n/10)});}
  if(hareLaji){const res=rifle?'kaatui':judgeHits(n);tgt.hitCount=(tgt.hitCount||0)+n;
    if(res==='haavoittui'){t.h.wound(woundDmg(n),o);t.h.woundedBy=t.h.woundedBy??by;t.h.owner=t.h.owner??by;if(local)say('Haavakko – '+n+' haulia osui, '+(t.kind==='kettu'?'kettu':'jänis')+' jatkoi');window.__lastShot={kind:t.kind,haavakko:true,n};return{haavakko:true,n};}
    t.h.owner=t.h.owner??by;}
  else if(!rifle&&(t.kind==='peura'||t.kind==='kauris')||(!rifle&&t.kind==='kettu'&&n<3)){if(local)say('Haavakko');return{haavakko:true,n};}
  const lento=t.kind==='teeri'&&!!(t.b?.fly||t.b?.F?.state==='lentaa');
  t.shoot();tgt.owner=tgt.owner??by;tgt.matka=best.dist;tgt.osumaLkm=(tgt.osumaLkm||0)+(tgt.hitCount||n);const j=judgeShot(t.kind,rifle?'kivaari':'haulikko');if(by===ME){if(j.huomautus&&/rauhoitettu/.test(j.huomautus))saavuta({tyyppi:'rauhoitettu'});else if(PISTE[t.kind]){if(!tgt._saavKaato){tgt._saavKaato=true;saavuta({tyyppi:'kaato',laji:t.kind,matka:tgt.matka,osumat:tgt.osumaLkm||n,jahti:JAHTI});}if(lento)saavuta({tyyppi:'lento'});if(t.kind==='janis'&&(tgt.wounded||tgt.damage>0)&&!tgt._saavVeri){tgt._saavVeri=true;saavuta({tyyppi:'veri'});}}}muistaElain(t.kind,tgt);
  // jänis ja peura kirjataan tarkastelun jälkeen; muut heti
  if(j.saalis&&!INSPECT_KINDS.includes(t.kind)&&by===ME)addBag(t.kind);
  if(local)say((j.huomautus?j.huomautus+' · ':'')+(LAJIT[t.kind]||t.kind)+' kaatui'+(rifle?'':' ('+n+' haulia)'));window.__lastShot={kind:t.kind,n,...j};return j;}
// saalis lajeittain (pl.bagBy), pl.bag = yhteensä
const INSPECT_KINDS=['janis','peura','kauris','teeri','kettu'];pl.bagBy={};function addBag(k){pl.bag++;pl.bagBy[k]=(pl.bagBy[k]||0)+1;}
// ---- E-kohde: lähin voittaa (auto / kaatunut jänis / peura) ----
const E_R={auto:3,janis:2.2,peura:3,kauris:3,teeri:2.2,kettu:2.2};
function deadTargets(){const out=[];for(const h of hares)if(!h.alive&&!h.carried&&!h.held&&!h.counted)out.push({kind:h.laji==='kettu'?'kettu':'janis',o:h,x:h.x,z:h.z});
  for(const b of WL.birds)if(b.kind==='teeri'&&!b.alive&&!b.carried&&!b.held&&!b.counted)out.push({kind:'teeri',o:b,x:b.x,z:b.z});
  for(const c of WL.critters)if((c.kind==='peura'||c.kind==='kauris')&&!c.alive&&!c.held&&!c.counted)out.push({kind:c.kind,o:c,x:c.x,z:c.z});return out;}
function nearestE(){let b=null,bd=1e9;const cand=[{kind:'auto',x:car.x,z:car.z},...deadTargets()];for(const c of cand){const d=Math.hypot(c.x-pl.x,c.z-pl.z);if(d<E_R[c.kind]&&d<bd){bd=d;b=c;}}return b;}
const SAUNA_PISTE=saunaPiste();
function lahinKylalainen(){let b=null,bd=JUTTELE_SADE;for(const k of kylalaiset){if(k.kaatunut)continue;const d=Math.hypot(k.obj.position.x-pl.x,k.obj.position.z-pl.z);if(d<bd){bd=d;b=k;}}return b;}
function naytaPuhe(k,rivi,aika,kategoria){k.obj.userData.puhuu=2.2;const el=$('puhe');if(!el)return;el.replaceChildren();const b=document.createElement('b');b.textContent=NIMET[k.laji]||'Kyläläinen';el.append(b,document.createElement('br'),document.createTextNode(rivi));el.style.display='block';puheT=aika;soitaRepliikki({hahmot:[k.laji],teksti:rivi,x:k.x,z:k.z,mumina:'kyla_'+kylaAani(k.laji),kategoria});}
function juttele(k){const raivo=k.laji==='mummo'&&INS.on&&INS.c?.kind==='janis';saavuta({tyyppi:'juttu',laji:k.laji,raivo});naytaPuhe(k,seuraavaRepliikki(k,raivo),6.5,raivo?'raivo':'repliikki');}
function kylaTila(){if(pl.inCar)return 'vitara';if(INS.on||pl.bag>0)return 'saalis';const lahella=k=>k&&!k.riding&&Math.hypot(k.x-pl.x,k.z-pl.z)<12;if(lahella(dog)||(NET?.peer&&lahella(terrier)))return 'koira';if(pl.raise>=1)return 'ase';return null;}
function huudaLahella(dt){for(const k of kylalaiset)if(k.huuto>0)k.huuto=Math.max(0,k.huuto-dt);if(huutoTauko>0){huutoTauko=Math.max(0,huutoTauko-dt);return;}if(!window.__peliAlkanut||lehtiOn||loppuOn||lukuOn||puheT>0)return;let paras=null,bd=HUUTO_SADE;for(const k of kylalaiset){if(k.kaatunut||k.huuto>0)continue;const d=Math.hypot(k.obj.position.x-pl.x,k.obj.position.z-pl.z);if(d<bd){bd=d;paras=k;}}if(!paras)return;const tila=kylaTila();if(paras.laji==='mummo'&&tila==='saalis')saavuta({tyyppi:'mummo'});naytaPuhe(paras,seuraavaHuuto(paras,tila),4.2,tila?'ohikulku_'+tila:'ohikulku');paras.huuto=HUUTO_TAUKO;huutoTauko=HUUTO_TAUKO;}
function liikutaKylalaiset(){const kello=Math.floor(Date.now()/100)/10;for(const k of kylalaiset){if(k.kaatunut||!k.reitti)continue;const p=pihaKohta(k.reitti,kello+k.vaihe);k.x=p.x;k.z=p.z;k.obj.position.x=p.x;k.obj.position.z=p.z;k.obj.position.y=height(k.x,k.z);k.obj.rotation.y=p.yaw;k.obj.userData.vauhti=p.spd;}}
function updateE(){const el=$('ehint');if(!el)return;if(loppuOn||lehtiOn){el.textContent='';return;}
  if(riistaOn){el.textContent='Nuolet selaavat · E sulkee kuvat';return;}
  if(lukuOn){el.textContent='E / Esc – sulje lehti';return;}
  const c=pl.inCar?null:nearestE();
  if(!pl.inCar&&!INS.on&&(!c||c.kind==='auto')&&nearSauna(pl.x,pl.z,saunaPiste())){el.textContent='E – lopeta jahti saunalle';return;}
  if(!pl.inCar&&!INS.on&&(!c||c.kind==='auto')&&nearPoyta(pl.x,pl.z,POYTA)){el.textContent='E – lue lehteä';return;}
  if(!pl.inCar&&!INS.on&&(!c||c.kind==='auto')&&nearKone(pl.x,pl.z)){el.textContent='E – riistakameran kuvat';return;}
  if(!pl.inCar&&(!c||c.kind==='auto')&&lahinKylalainen()){el.textContent='E – juttele';return;}
  el.textContent=INS.on?'E / Esc – laske maahan · hiiri kääntää':c?{auto:'E – autoon',janis:'E – ota jänis',peura:'E – tarkastele peuraa',kauris:'E – tarkastele metsäkaurista',teeri:'E – ota teeri',kettu:'E – ota kettu'}[c.kind]:'';}
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
  const by=kind==='janis'?0.2:kind==='teeri'?0.15:kind==='kauris'?0.5:0.9,bs=kind==='peura'?0.03:0.025,R=kind==='teeri'?{x:0.09,y:0.1,z:0.2}:kind==='janis'?{x:0.11,y:0.13,z:0.24}:kind==='kauris'?{x:0.16,y:0.22,z:0.42}:{x:0.25,y:0.35,z:0.7};
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
function insPick(c){const hareO=c.kind==='janis'||(c.kind==='kettu'&&hares.includes(c.o));if(!hareO&&c.o.obj)applyMarks(c.o.obj,c.o.marks,c.kind);if(hareO)NET?.send({t:'pick',i:hares.indexOf(c.o)});const src=hareO?hareObjs[hares.indexOf(c.o)]:c.o.obj;const small=c.kind!=='peura'&&c.kind!=='kauris';if(!src)return;c.o.held=true;
  if(hareO)applyMarks(src,c.o.marks,c.kind);const g=new THREE.Group(),m=src.clone(true);m.position.set(0,0,0);m.rotation.set(0,0,0);m.visible=true;g.add(m);
  const by=c.kind==='kettu'?0.24:c.kind==='janis'?0.2:c.kind==='teeri'?0.15:c.kind==='kauris'?0.5:0.9,bs=small?0.025:0.03;
  applyMarks(src,c.o.marks,c.kind);
  const sz=small?0.75:2.6;if(c.kind==='teeri')m.rotation.set(0,0,0);g.position.set(0,-by,-sz);INS.yaw=0.6;INS.pitch=0.25;INS.scene.add(g);Object.assign(INS,{on:true,c,obj:g,dist:sz});
  const n=c.o.marks?.length||c.o.hitCount||0;const NM={janis:'Jänis',peura:'Peura',kauris:'Metsäkauris',teeri:'Teeri'};$('insinfo').textContent=NM[c.kind]+' · osumia '+n+(small?' haulia':(n===1?' luoti':' luotia'))+(c.o.killedBy==='koira'?' · koiran ottama':'');$('insinfo').style.display='block';
  if(c.kind==='janis'||c.kind==='kettu')for(const ch of m.children)ch.traverse?.(()=>{});}
function insDrop(){if(!INS.on)return;const o=INS.c.o;if(INS.c.kind==='janis'||INS.c.kind==='kettu')NET?.send({t:'drop',i:hares.indexOf(o)});o.held=false;if(!o.counted){o.counted=true;if((o.owner??ME)===ME){addBag(INS.c.kind);say({janis:'Jänis',peura:'Peura',kauris:'Metsäkauris',teeri:'Teeri',kettu:'Kettu'}[INS.c.kind]+' kirjattu saaliiksi');}}INS.scene.remove(INS.obj);INS.on=false;INS.c=null;$('insinfo').style.display='none';window.__insDrops=(window.__insDrops||0)+1;}
window.__insYaw=v=>{INS.yaw+=v;};window.__INS=INS;
addEventListener('mousemove',e=>{if(!INS.on)return;INS.yaw+=e.movementX*0.01;INS.pitch=Math.max(-1.4,Math.min(1.4,INS.pitch+e.movementY*0.01));});
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&INS.on)insDrop();});
addEventListener('keydown',e=>{if(e.code==='Escape'&&INS.on)insDrop();});
function renderIns(){if(!INS.on)return;const g=INS.obj;g.rotation.set(INS.pitch,INS.yaw,0,'YXZ');INS.cam.aspect=innerWidth/innerHeight;INS.cam.updateProjectionMatrix();renderer.autoClear=false;renderer.clearDepth();renderer.render(INS.scene,INS.cam);renderer.autoClear=true;}
window.__ins=INS;window.__insPick=c=>insPick(c||nearestE());window.__insDrop=insDrop;window.__nearestE=nearestE;
function say(t){$('msg').textContent=t;msgT=3;}
function hopSnd(x,z){play3d('sfx_koira_hyppy',{x,y:(car.y||0)+0.7,z,gain:1,ref:5,max:80});}
function dismountDog(){if(!dog.riding)return;const miten=hyppaaUlos(dog);const p=car.dogExit(0);dog.x=p.x;dog.z=p.z;dog.dir=car.heading;if(miten==='haku')dog._haku();hopSnd(p.x,p.z);}
function jumpPet(){if(!terrier.riding)return;const miten=hyppaaUlos(terrier);const p=car.dogExit(1);terrier.x=p.x;terrier.z=p.z;terrier.dir=car.heading;if(miten==='haku')terrier._haku();hopSnd(p.x,p.z);}
function nouseTerrieri(){if(!NET?.peer||terrier.riding)return;if(!nouseKyytiin(terrier,{seuraaMyos:true}))return;const c1=car.cargo(1);terrier.x=c1.x;terrier.z=c1.z;terrier.dir=car.heading;hopSnd(c1.x,c1.z);}
const cvs=renderer.domElement;
function suljeVarmistus(){const v=$('lopeta-varmistus');if(v)v.style.display='none';}
function avaaTauko(){suljeVarmistus();$('menu').style.display='flex';}
function jatkaJahtia(){if(loppuOn||lehtiOn||lukuOn||editorOn)return;suljeVarmistus();startGame();}
async function startGame(){$('menu').style.display='none';suljeVarmistus();cvs.requestPointerLock();if(!AC){AC=new AudioContext();if(!AL.aanetPaalla())AC.suspend();A3=V8.makeAudio3D(AC);await Promise.all(SND.map(loadSnd));await Promise.all(ALLSND.map(loadSnd));window.__aanetPuuttuu=ALLSND.filter(n=>!buf[n]);
  if(!amb)amb=play('amb_talvimetsa_tuuli_loop',{gain:.21,loop:true});if(!walk)walk=play('sfx_kavely_lumi_loop',{gain:0,loop:true});}
  else if(AL.aanetPaalla()){try{await AC.resume();}catch{}}
  radioHerata();
  if(pl.inCar&&!engine){play('sfx_vitara_kaynnistys',{gain:carVol(.7)});setTimeout(()=>{if(pl.inCar&&!engine)engine=engineStart();},1200);say('Ratissa Yli-Vallintiellä – Löyhingintie → Koppelontie → mökki. E = ulos');}}
$('menu').onclick=()=>{if(loppuOn||lehtiOn||lukuOn)return;const v=$('lopeta-varmistus');if(v&&v.style.display!=='none')return;jatkaJahtia();};
$('jatka')?.addEventListener('click',e=>{e.stopPropagation();jatkaJahtia();});
$('lopeta')?.addEventListener('click',e=>{e.stopPropagation();const v=$('lopeta-varmistus');if(v)v.style.display='block';});
$('lopeta-kylla')?.addEventListener('click',e=>{e.stopPropagation();pyydaLopetus();});
$('lopeta-ei')?.addEventListener('click',e=>{e.stopPropagation();jatkaJahtia();});
AL.setupAloitus({onStart:startGame,onAanet:on=>{if(AC)on?AC.resume():AC.suspend();}});
// Kutsu kaveri: luo huoneen (jos ei vielä) ja kopioi linkin; huoneeseen siirrytään linkin kautta (sama siemen kummallakin)
$('al-kutsu')?.addEventListener('click',async()=>{const code=ROOM||newRoomCode();const link=NETM.inviteLink(code);try{await navigator.clipboard.writeText(link);}catch{}
  $('al-kutsu').textContent='Linkki kopioitu';window.__invite=link;if(!ROOM)setTimeout(()=>location.href=link,700);});
// ---- moninpeli ----
const NET=ROOM?NETM.connect(ROOM.toUpperCase(),{onRole:r=>{ME=r;if(pl.inCar)pl.seat=startSeat(true,r,true);avatar?.userData.asu?.(r==='v'?0:1);},onStatus:t=>say(t),onMsg:m=>netMsg(m)}):null;
let RP=null;const avatar=V8.makeHunter(1);if(avatar){avatar.visible=false;scene.add(avatar);}
const isGuest=()=>NET&&NET.peer&&ME==='v';
function netMsg(m){
  if(m.t==='s'){play3d(m.w==='kivaari'?'sfx_kivaari_laukaus':'sfx_haulikko_laukaus',{x:m.o.x,y:m.o.y,z:m.o.z,gain:1.2,ref:15,max:2000});fire(m);}
  else if(m.t==='w'&&ME==='v'){applyWorld(m,{dog,hares,critters:WL.critters,birds:WL.birds,car});if(m.lumi)lumiKayta(lumiTila,m.lumi);if(Array.isArray(m.kuvat)){riistaKuvat.length=0;riistaKuvat.push(...m.kuvat);}if(m.car){fsd.on=true;luoFsdValot();}else if(fsd.on)fsd.on=false;}
  else if(m.t==='r')vastaanotaRadio(m);
  else if(m.t==='piha'&&m.piha&&isGuest())sovellaPiha(m.piha);
  else if(m.t==='liittyi'&&ME==='h'){lahetaRadio();NET.send({t:'piha',piha:pihaNykyinen()});}
  else if(m.t==='cmd'&&ME==='h')vastaanotaKoirakomento(m,{koira:dog,terrieri:terrier,hare});
  else if(m.t==='pick'&&ME==='h'){const h=hares[m.i];if(h)h.held=true;}
  else if(m.t==='drop'&&ME==='h'){const h=hares[m.i];if(h){h.held=false;h.counted=true;}}
  else if(m.t==='lopeta'&&ME==='h')kaynnistaLopetus();
  else if(m.t==='loppu'&&m.yhteenveto)aloitaKohtaus(m.yhteenveto);
  else if(m.t==='lehti'&&m.seed!=null)aloitaLehti(m.seed,m.pisteet|0,m.kaatui,m.nimi,m.kyla!=null||m.otsikko?{otsikko:m.otsikko,ingressi:m.ingressi,kyla:m.kyla}:null);
  else if(m.t==='uusi'){if(m.pyynto){if(ME==='h')kaynnistaUusiJahti();}else location.reload();}
  else if(m.t==='fsd'){if(m.x!=null&&ME==='h')kaynnistaFsd(m.x,m.z);else if(ME!=='h'){fsd.on=!!m.on;if(fsd.on)luoFsdValot();if(m.teksti)say(m.teksti);}}
  else if(m.t==='hyppy'&&m.rivi){vierasLuovutus=0.7;naytaPelaajaPuhe(m.rivi,m.role||'v',m.x??pl.x,m.z??pl.z);}}
let netT=0,worldT=0,vierasVauhti=0;
function netTick(dt){if(!NET||!NET.peer)return;netT-=dt;worldT-=dt;
  if(netT<=0){netT=1/15;const m={t:'p',role:ME,x:pl.x,y:cam.position.y,z:pl.z,yaw:pl.yaw,pitch:pl.pitch,inCar:pl.inCar,seat:pl.seat||null,crouch:!!pl.crouch,aim:pl.raise>=1?1:0,ase:WP.weapon==='kivaari'?'k':'h',nimi:omaNimi()};if(pl.inCar&&pl.seat==='kuski')m.car={x:car.x,z:car.z,h:car.heading,speed:car.speed,steer:car.steer||0};NET.send(m);}
  if(ME==='h'&&worldT<=0){worldT=0.1;NET.send(packWorld({dog,hares,critters:WL.critters,birds:WL.birds,piha:pihaNykyinen(),car:fsd.on?car:undefined,lumi:lumiPaketti(lumiTila),kuvat:riistaKuvat.slice(-12)}));}
  RP=NET.remote.at(performance.now()/1000);const L=NET.last;
  if(L?.car&&pl.seat!=='kuski'){car.x=L.car.x;car.z=L.car.z;car.heading=L.car.h;car.speed=L.car.speed;car.steer=L.car.steer;car.pose();}
  if(avatar&&RP){avatar.visible=true;const px=avatar.userData._px??RP.x,pz=avatar.userData._pz??RP.z;const spd=Math.min(8,Math.hypot(RP.x-px,RP.z-pz)/Math.max(dt,1/120));avatar.userData._px=RP.x;avatar.userData._pz=RP.z;vierasVauhti=L?.inCar?0:spd;
    if(L.inCar){interior.g.updateMatrixWorld();const sp=new THREE.Vector3(L.seat==='kuski'?0.40:-0.40,0.55,-0.55);interior.g.localToWorld(sp);avatar.position.copy(sp);avatar.rotation.set(0,-car.heading,0);}
    else{avatar.position.set(RP.x,height(RP.x,RP.z),RP.z);avatar.rotation.set(0,RP.yaw,0);}
    avatar.userData.tick?.(dt,{sit:!!L.inCar,crouch:!!L.crouch||vierasLuovutus>0,luovutus:vierasLuovutus>0?Math.min(1,vierasLuovutus/0.35):0,aim:!!L.aim,ase:L.ase,spd:L.inCar?0:spd});}
  else if(avatar)avatar.visible=false;}
window.__netState=()=>({ME,peer:!!NET?.peer,remote:RP,seat:pl.seat,avatar:avatar?.visible});
let amb,walk,loppuOn=false,lehtiOn=false,lukuOn=false,editorOn=false,editorValinta='mokki',editorVeto=false,editorKatse={x:0,z:2},pihaNaky=0,editorEl=null,kylaAmbT=0; document.addEventListener('pointerlockchange',()=>{if(loppuOn||lehtiOn||lukuOn||editorOn||riistaOn){$('menu').style.display='none';return;}if(!document.pointerLockElement&&window.__peliAlkanut)avaaTauko();});
addEventListener('mousemove',e=>{if(!document.pointerLockElement||INS.on||lukuOn)return;if(pl.inCar){pl.lookYaw=Math.max(-2.62,Math.min(2.62,(pl.lookYaw||0)-e.movementX*0.0025));pl.pitch=Math.max(-0.7,Math.min(0.6,pl.pitch-e.movementY*0.0025));return;}pl.yaw-=e.movementX*0.0025;pl.pitch=Math.max(-1.4,Math.min(1.4,pl.pitch-e.movementY*0.0025));});
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('mouseup',e=>{if(e.button===2){pl.rmb=false;pl.raise=0;pl.raising=false;}});
addEventListener('mousedown',e=>{if(!document.pointerLockElement||pl.inCar||INS.on||lukuOn)return;if(e.button===2){pl.rmb=true;if(pl.raise<1&&!pl.raising){pl.raising=true;pl.revealT=1;}return;}if(vm.reload>0)return;if(pl.raise<1){if(!pl.raising){pl.raising=true;pl.revealT=1;}return;}if(WP.binoOn)return;if(WP.weapon==='kivaari'){if(WP.bolt>0||WP.reloadT>0)return;if(WP.rifleShells<=0){say('Kivääri tyhjä – lataa (R)');return;}WP.rifleShells--;vm.kick=0.6;if(buf.sfx_kivaari_laukaus)play('sfx_kivaari_laukaus');else{const r=play('sfx_haulikko_laukaus');if(r?.s?.playbackRate)r.s.playbackRate.value=0.75;}fire();NET?.send({t:'s',...window.__lastFire});setTimeout(()=>{if(WP.rifleShells>0)WP.startBolt();},250);return;}
  if(pl.shells<=0){say('Tyhjä – lataa (R)');return;}pl.shells--;shotFlash=0.15;vm.shoot();play('sfx_haulikko_laukaus');fire();NET?.send({t:'s',...window.__lastFire});return;});
// HUD-kuvat
const himg=(id,src,fb)=>{const i=$(id);i.onerror=()=>{i.onerror=null;i.src=fb;};i.src=G+src;};
const fbCross=canvasTex(16,16,g=>{g.fillStyle='#f22';g.fillRect(7,2,2,12);g.fillRect(2,7,12,2);}).image.toDataURL();
const fbGun=canvasTex(256,128,g=>{g.fillStyle='#333';g.fillRect(110,20,14,108);g.fillStyle='#6b4423';g.fillRect(100,80,34,48);}).image.toDataURL();
himg('cross','hud/tahtain_16.png',fbCross);
const gunSrc={fp:G+'haulikko_fp.png',naru:G+'haulikko_hihna.png',shot:G+'haulikko_laukaus.png'};himg('gun','haulikko_fp.png',fbGun);
const windArrow=new Image();windArrow.src=G+'hud/tuuli_nuoli_32.png';
const compass=new Image();compass.src=G+'hud/kompassi_256x32.png';
const STATE_FI={[D.NARUSSA]:'narussa',[D.TANNE]:'tänne (odottaa)',[D.SEURAA]:'seuraa',[D.TAALLA]:'täällä (tulee jäljelle)',[D.HAKU]:'haku',[D.YOJALKI]:'jäljestää',[D.YLOSOTTO]:'seisoo jäljellä',[D.AJO]:'ajo (haukkuu)',[D.HUKKA]:'katko',[D.PALUU]:'palaa luokse'};
const clock=new THREE.Clock();
let loppuAng=0,loppuR=9,loppuLook={x:0,z:0},loppuMus=null;const loppuSavu=[],loppuKoirat=[],loppuHahmot=[];
function rakennaYhteenveto(){const elaimet=[];
  for(const h of hares)elaimet.push({kind:'janis',alive:!!h.alive,owner:h.owner});
  for(const b of WL.birds)if(b.kind==='teeri')elaimet.push({kind:'teeri',alive:!!b.alive,owner:b.owner});
  for(const c of WL.critters)if(c.kind==='peura'||c.kind==='kauris')elaimet.push({kind:c.kind,alive:!!c.alive,owner:c.owner});
  return yhteenveto({elaimet,laukaukset:lauk,noudot:dog.delivered||0,moninpeli:!!(NET&&NET.peer)});}
function pyydaLopetus(){if(loppuOn||lehtiOn)return;if(lopetusPyynto(ME,!!(NET&&NET.peer))==='pyynto'){NET.send({t:'lopeta'});say('Odotetaan isäntää…');return;}kaynnistaLopetus();}
function pyydaUusiJahti(){if(!(loppuOn||lehtiOn))return;if(uusiJahtiKomento(ME,!!(NET&&NET.peer))==='pyynto'){NET.send({t:'uusi',pyynto:1});const v=$('kierros-viesti');if(v)v.textContent='Odotetaan isäntää…';return;}kaynnistaUusiJahti();}
function kaynnistaUusiJahti(){if(NET?.peer&&ME==='h')NET.send({t:'uusi'});setTimeout(()=>location.reload(),NET?.peer?80:0);}
function paavalikkoon(){const u=new URL(location.href);u.searchParams.delete('huone');location.assign(u.pathname+u.search);}
function naytaKierrosnapit(){let el=$('kierrosnapit');if(!el){if(!document.getElementById('kierros-css')){const st=document.createElement('style');st.id='kierros-css';st.textContent='#kierrosnapit{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:95;display:flex;gap:12px;align-items:center;pointer-events:auto;flex-wrap:wrap;justify-content:center}#kierrosnapit button{font:900 22px/1 Impact,Arial Black,sans-serif;min-height:52px;padding:14px 18px;border:3px solid #111;cursor:pointer;letter-spacing:.03em}#uusi-jahti{background:#d0121a;color:#fff}#paavalikko{background:#ffe14a;color:#111}#kierros-viesti{flex-basis:100%;text-align:center;font:700 16px monospace;color:#fff;text-shadow:0 1px 2px #000}';document.head.appendChild(st);}el=document.createElement('div');el.id='kierrosnapit';el.innerHTML='<button type="button" id="uusi-jahti">UUSI JAHTI</button><button type="button" id="paavalikko">PÄÄVALIKKO</button><div id="kierros-viesti"></div>';document.body.appendChild(el);el.querySelector('#uusi-jahti').onclick=e=>{e.stopPropagation();pyydaUusiJahti();};el.querySelector('#paavalikko').onclick=e=>{e.stopPropagation();paavalikkoon();};}el.style.display='flex';const lehti=$('lehti');if(lehti)lehti.style.bottom='84px';}
function kaynnistaLopetus(){if(loppuOn)return;const yh=rakennaYhteenveto();if(NET?.peer&&ME==='h')NET.send({t:'loppu',yhteenveto:yh});aloitaKohtaus(yh);}
function iltahamara(){scene.background.set(0x3c345c);scene.fog.color.set(0x514868);scene.fog.density=0.011;hemi.color.set(0xb4bdd8);hemi.groundColor.set(0x6a5040);hemi.intensity=0.95;sun.color.set(0xffc090);sun.intensity=0.85;sun.position.set(-0.8,0.28,0.35);if(window._sky?.material)window._sky.material.color.set(0xa090b0);}
function hiljenna(){if(amb?.g)amb.g.gain.value=0;if(walk?.g)walk.g.gain.value=0;RS.on=false;RS.clip=null;radio.on=false;radioOff();if(engine){for(const k in engine){try{engine[k]?.s.stop();}catch{}}engine=null;}}
function naytaYhteenveto(yh){let el=$('loppu');if(!el){el=document.createElement('div');el.id='loppu';el.style.cssText='position:fixed;left:20px;top:20px;max-width:420px;max-height:86vh;overflow:auto;background:rgba(12,14,24,.72);color:#f3ead2;padding:16px 18px;border:1px solid #c4a574;font:16px/1.45 monospace;white-space:pre-wrap;pointer-events:none;text-shadow:0 1px 2px #000;z-index:5';document.body.appendChild(el);}let extra='';try{extra='\n\n'+jahdinTeksti(lataaKaadot(localStorage),JAHTI);}catch{}el.textContent=yhteenvetoTeksti(yh)+extra;el.style.display='block';}
async function soitaLopetus(){if(!AC||!AL.aanetPaalla())return;const b=await rbuf('musiikki_lopetus');if(!b||!loppuOn)return;const s=AC.createBufferSource();s.buffer=b;s.loop=true;const g=AC.createGain();g.gain.value=0.5;s.connect(g).connect(AC.destination);s.start();loppuMus={s,g};}
function nollaaSavu(p){const o=new THREE.Vector3();savuMerkki.getWorldPosition(o);p.mesh.position.copy(o);p.life=0;p.age=2.6+Math.random()*1.5;p.dx=(Math.random()-.5)*.5;p.dz=(Math.random()-.5)*.35;p.mesh.material.opacity=0;}
function luoSavu(){if(loppuSavu.length||!savuMerkki)return;const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),grd=g.createRadialGradient(32,32,2,32,32,30);grd.addColorStop(0,'rgba(255,255,255,.75)');grd.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=grd;g.fillRect(0,0,64,64);const map=new THREE.CanvasTexture(c);
  for(let i=0;i<14;i++){const mat=new THREE.SpriteMaterial({map,transparent:true,depthWrite:false,opacity:0,color:0xe6e2ea});const mesh=new THREE.Sprite(mat);mesh.scale.setScalar(.2);scene.add(mesh);const p={mesh,life:-i*0.22,age:3,dx:0,dz:0};loppuSavu.push(p);if(p.life>=0)nollaaSavu(p);else{const o=new THREE.Vector3();savuMerkki.getWorldPosition(o);mesh.position.copy(o);}}}
function paivitaSavu(dt){for(const p of loppuSavu){p.life+=dt;if(p.life<0)continue;if(p.life>p.age)nollaaSavu(p);const k=Math.max(0,Math.min(1,p.life/p.age));p.mesh.position.y+=dt*(0.65+.55*k);p.mesh.position.x+=p.dx*dt;p.mesh.position.z+=p.dz*dt;p.mesh.scale.setScalar(.3+k*2.2);p.mesh.material.opacity=.4*Math.sin(k*Math.PI);}}
function aloitaKohtaus(yh){if(loppuOn||lehtiOn||!yh?.pelaajat)return;saavuta({tyyppi:'sauna'});muistiKierros();loppuOn=true;piilotaPuhe();if(document.pointerLockElement)document.exitPointerLock();$('menu').style.display='none';$('hud').style.display='none';const al=$('aloitus');if(al)al.style.display='none';iltahamara();hiljenna();
  const etu=saunaEtu(),mono=!!yh.moninpeli,paikat=riviPaikat(etu,yh.rivi||[],mono?2:1,mono?2:1);loppuLook=paikat.look;loppuR=paikat.radius;loppuAng=Math.atan2(etu.dz,etu.dx);
  const malli={janis:hareObjs[0],teeri:WL.birds.find(b=>b.kind==='teeri')?.obj,peura:WL.critters.find(c=>c.kind==='peura')?.obj,kauris:WL.critters.find(c=>c.kind==='kauris')?.obj};
  for(const p of paikat.elaimet){const src=malli[p.kind];if(!src)continue;let g;try{g=cloneSkinned(src);}catch{g=src.clone(true);}g.visible=true;g.traverse(o=>{o.frustumCulled=false;});g.position.set(p.x,height(p.x,p.z)+(p.kind==='peura'?0.2:p.kind==='kauris'?0.1:0.04),p.z);g.rotation.set(0,paikat.yaw+Math.PI/2,Math.PI/2);scene.add(g);}
  hares.forEach((h,i)=>{if(!h.alive)hareObjs[i].visible=false;});
  for(const b of WL.birds)if(b.kind==='teeri'&&!b.alive&&b.obj)b.obj.visible=false;
  for(const c of WL.critters)if((c.kind==='peura'||c.kind==='kauris')&&!c.alive&&c.obj)c.obj.visible=false;
  let hi=0,ki=0;const koirat=[[dogObj,DOGBREED],[terrierObj,'terrieri']];
  for(const p of paikat.ihmiset){if(p.kind==='metsastaja'){const h=V8.makeHunter(hi++);h.position.set(p.x,height(p.x,p.z),p.z);h.rotation.y=p.yaw;h.userData.sit?.(false);loppuHahmot.push(h);scene.add(h);}
    else{const pair=koirat[ki++];if(!pair)continue;const [o,rotu]=pair;o.visible=true;o.position.set(p.x,height(p.x,p.z),p.z);o.rotation.y=Math.PI-Math.atan2(etu.dx,-etu.dz);loppuKoirat.push({o,k:V8.DOG_K[rotu]||1});}}
  if(!mono)terrierObj.visible=false;if(avatar)avatar.visible=false;leash.visible=false;luoSavu();naytaYhteenveto(yh);soitaLopetus();naytaKierrosnapit();}
function paivitaLopetus(dt){loppuAng+=dt*0.15;const y=height(loppuLook.x,loppuLook.z);cam.position.set(loppuLook.x+Math.cos(loppuAng)*loppuR,y+2.55,loppuLook.z+Math.sin(loppuAng)*loppuR);cam.lookAt(loppuLook.x,y+0.9,loppuLook.z);window._sky.position.copy(cam.position);paivitaSavu(dt);const t=clock.elapsedTime;for(const d of loppuKoirat)V8.animDog(d.o.userData.n,{t,spd:0,jaw:0,sit:true,k:d.k});for(const h of loppuHahmot)h.userData.tick?.(dt,{spd:0});renderer.autoClear=true;renderer.render(scene,cam);}
const LEHTI_CSS=`#lehti{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(20,0,0,.55);font-family:Georgia,serif;color:#161616}
.ks{width:min(640px,96vw);max-height:94vh;overflow:auto;background:#fff;padding:0 0 14px;box-shadow:0 16px 48px #000a}
.ks-head{background:#d0121a;color:#fff;text-align:center;padding:10px 14px 8px;border-bottom:8px solid #ffe14a}
.ks-nimi{font:900 clamp(34px,8vw,64px)/.9 Impact,"Arial Black",sans-serif;letter-spacing:-.03em;text-transform:uppercase;text-shadow:3px 3px 0 #7a0a10}
.ks-mast{display:flex;justify-content:space-between;gap:8px;font:700 clamp(13px,2.4vw,16px)/1.2 Arial,sans-serif;color:#ffe14a;text-transform:uppercase;margin-top:4px}
.ks-ala{font:italic clamp(14px,2.4vw,16px)/1.3 Georgia,serif;color:#ffe9a8;margin-top:2px}
.ks-sivu{display:none;padding:14px 16px 6px}
.ks-sivu.ks-nayta{display:block}
.ks-tarra{display:inline-block;font:900 clamp(18px,3vw,26px)/1 Impact,"Arial Black",sans-serif;padding:6px 10px;margin:0 0 8px;transform:rotate(-6deg);border:3px solid #111}
.ks-tarra.pun{background:#d0121a;color:#fff}
.ks-tarra.kelt{background:#ffe14a;color:#111}
.ks h1,.ks-kohu{font:900 clamp(36px,7.4vw,68px)/.92 Impact,"Arial Black",sans-serif;text-transform:uppercase;letter-spacing:-.03em;margin:4px 0 10px}
.ks-ing{font:700 clamp(20px,3.4vw,28px)/1.35 Georgia,serif;margin:0 0 12px}
.ks-lainaus{margin:8px 0 0;padding:8px 0 0;border-top:4px solid #d0121a}
.ks-lainaus p{font:800 clamp(26px,4.6vw,40px)/1.05 Georgia,serif;margin:0}
.ks-lainaus cite{display:block;margin-top:6px;font:900 18px/1.2 Arial,sans-serif;font-style:normal;color:#d0121a;text-transform:uppercase}
.ks-kuva-juttu{margin:8px auto 12px;text-align:center}
.ks-pyorea{width:min(420px,78vw);height:min(420px,78vw);object-fit:cover;border-radius:50%;border:8px solid #ffe14a;box-shadow:0 0 0 6px #d0121a;background:#eee}
.ks-kuva-juttu figcaption{font:700 clamp(16px,2.8vw,20px)/1.3 Georgia,serif;margin-top:8px}
.ks-mainokset{display:flex;flex-direction:column;gap:12px}
.ks-mainos{border:4px solid #d0121a;background:#fff6c8;padding:10px;display:flex;gap:10px;align-items:center}
.ks-mainos b{font:900 13px/1 Arial,sans-serif;letter-spacing:.12em;color:#d0121a;align-self:flex-start}
.ks-mainos span{font:700 clamp(18px,2.8vw,22px)/1.3 Georgia,serif}
.ks-mainoskuva{width:84px;height:auto;flex:0 0 auto;border-radius:50%;border:3px solid #d0121a}
.ks-kuva{flex:0 0 auto;border:2px solid #111;background:#fff}
.ks-piste{font:800 clamp(18px,3vw,24px)/1.3 Georgia,serif;background:#ffe14a;padding:10px;margin:12px 0 0}
.ks-kuolin{border:6px solid #111;margin:14px 0 0;padding:8px 12px 12px;text-align:center;background:#fff}
.ks-risti{font:900 36px/1 Georgia,serif}
.ks-kuolin h2{margin:2px 0;font:900 clamp(28px,5vw,40px)/1.05 Impact,"Arial Black",sans-serif;text-transform:uppercase}
.ks-kuolin p{font:italic clamp(18px,3vw,22px)/1.3 Georgia,serif;margin:0}
.ks-selaus{display:flex;gap:8px;align-items:center;justify-content:space-between;padding:8px 14px 0}
.ks-selaus button{font:900 18px/1 Impact,"Arial Black",sans-serif;min-height:48px;padding:12px 14px;border:3px solid #111;cursor:pointer}
.ks-ed{background:#ffe14a;color:#111}
.ks-seur{background:#d0121a;color:#fff}
.ks-sivu-nro{font:900 16px/1 Arial,sans-serif}
.ks-sulje{text-align:center;font:700 16px/1.3 Arial,sans-serif;color:#5c4030;margin:8px 14px 0}`;
let lehtiT=0,lehtiKaatui='v';
function muistaElain(kind,e){if(!e||e.alive||e._muistettu||!PISTE[kind])return;e._muistettu=true;try{const ampuja=e.owner==='v'||e.owner==='h'?e.owner:(e.killedBy==='koira'?'koira':'h');const rec=kirjaaKaato(localStorage,{laji:kind,paiva:tanaan(),matka:e.matka==null?null:e.matka,osumat:e.osumaLkm||e.hitCount||(e.marks?.length||0),pisteet:PISTE[kind],ampuja,koira:(e.killedBy==='koira'||e.delivered)?KOIRA_NIMI:null,jahti:JAHTI});if(rec){e._rec=rec;e._jahtiIdx=lataaKaadot(localStorage).filter(k=>k.jahti===JAHTI).length-1;}}catch{}}
function muistiKierros(){for(const h of hares)if(!h.alive)muistaElain(h.laji==='kettu'?'kettu':'janis',h);for(const b of WL.birds)if(b.kind==='teeri'&&!b.alive)muistaElain('teeri',b);for(const c of WL.critters)if((c.kind==='peura'||c.kind==='kauris')&&!c.alive)muistaElain(c.kind,c);
  for(const e of[...hares,...WL.birds.filter(b=>b.kind==='teeri'),...WL.critters.filter(c=>c.kind==='peura'||c.kind==='kauris')])if(e._rec&&!e._rec.koira&&(e.delivered||e.killedBy==='koira')){e._rec.koira=KOIRA_NIMI;try{paivitaKoira(localStorage,JAHTI,e._jahtiIdx,KOIRA_NIMI);}catch{}}}
function kaadaKylalainen(id){const k=kylalaiset.find(x=>x.id===id);if(!k||k.kaatunut)return;k.kaatunut=true;k.obj.userData.kaatunut=true;k.obj.userData.puhuu=0;k.obj.position.set(k.x,height(k.x,k.z),k.z);k.obj.rotation.y=k.yaw;k.obj.rotation.z=1.15;}
function kaynnistaLehti(kaatui,extra){if(lehtiOn||loppuOn)return;const y=rakennaYhteenveto();let p=0;for(const id in y.pelaajat)p+=y.pelaajat[id].pisteet||0;const seed=(Math.random()*2**32)>>>0;const k=kaatui==='h'?'h':kaatui==='k'?'k':'v';const nimi=extra?.nimi?siistiNimi(extra.nimi):(k==='h'?omaNimi():siistiNimi(NET?.last?.nimi));if(NET?.peer&&ME==='h'){const msg={t:'lehti',seed,pisteet:p,kaatui:k,nimi};if(extra?.otsikko){msg.otsikko=extra.otsikko;msg.ingressi=extra.ingressi||'';}if(extra?.kyla!=null)msg.kyla=extra.kyla|0;NET.send(msg);}aloitaLehti(seed,p,k,nimi,extra||null);}
function kytkeLehdenSelaus(el){const sivut=[...el.querySelectorAll('.ks-sivu')];let i=Math.max(0,sivut.findIndex(s=>s.classList.contains('ks-nayta')));
  const nayta=d=>{if(!sivut.length)return;i=(i+d+sivut.length)%sivut.length;sivut.forEach((s,k)=>s.classList.toggle('ks-nayta',k===i));const nro=el.querySelector('.ks-sivu-nro');if(nro)nro.textContent=(i+1)+' / '+sivut.length;};
  el._selaa=nayta;el.querySelector('.ks-ed')?.addEventListener('click',e=>{e.stopPropagation();nayta(-1);});el.querySelector('.ks-seur')?.addEventListener('click',e=>{e.stopPropagation();nayta(1);});}
function naytaLehti(l){if(!document.getElementById('lehti-css')){const st=document.createElement('style');st.id='lehti-css';st.textContent=LEHTI_CSS;document.head.appendChild(st);}let el=$('lehti');if(!el){el=document.createElement('div');el.id='lehti';document.body.appendChild(el);}el.style.bottom='0';el.style.display='flex';el.innerHTML=lehtiHtml(l);el.querySelectorAll('canvas.ks-kuva').forEach(c=>piirraMainos(c,c.dataset.id));el.querySelectorAll('canvas.ks-janis').forEach(c=>piirraJanis(c));kytkeLehdenSelaus(el);el.style.opacity='0';}
async function soitaUrut(){if(!AC||!AL.aanetPaalla())return;const b=await rbuf('musiikki_urut');if(!b||!lehtiOn)return;const s=AC.createBufferSource();s.buffer=b;s.loop=true;const g=AC.createGain();g.gain.value=0.55;s.connect(g).connect(AC.destination);s.start();}
function piilotaPuhe(){puheT=0;const el=$('puhe');if(el)el.style.display='none';}
function aloitaLehti(seed,pisteet,kaatui,nimi,extra){if(lehtiOn||loppuOn)return;lukuOn=false;lehtiOn=true;lehtiT=0;lehtiKaatui=kaatui==='h'?'h':kaatui==='k'?'k':'v';if(extra?.kyla!=null)kaadaKylalainen(extra.kyla|0);piilotaPuhe();if(document.pointerLockElement)document.exitPointerLock();$('menu').style.display='none';$('hud').style.display='none';const al=$('aloitus');if(al)al.style.display='none';hiljenna();naytaLehti(rakennaLehti(seed>>>0,pisteet|0,nimi,extra?.otsikko?{otsikko:extra.otsikko,ingressi:extra.ingressi}:null));naytaKierrosnapit();soitaUrut();}
function avaaPoytaLehti(){if(lukuOn||lehtiOn||loppuOn||INS.on)return;lukuOn=true;saavuta({tyyppi:'lehti'});if(document.pointerLockElement)document.exitPointerLock();$('menu').style.display='none';naytaLehti(lehtiPoyta(LEHTI_SEED));const el=$('lehti');if(el)el.style.opacity='1';}
function suljeLuku(){if(!lukuOn)return;lukuOn=false;const el=$('lehti');if(el){el.style.display='none';el.style.opacity='0';}if(window.__peliAlkanut&&!lehtiOn&&!loppuOn)cvs.requestPointerLock();}
function paivitaLehti(dt){lehtiT+=dt;const k=Math.min(1,lehtiT/1.05);const oma=lehtiKaatui===ME;if(oma){const y=height(pl.x,pl.z);cam.position.set(pl.x,y+1.55*(1-k)+0.32*k,pl.z);cam.rotation.set(0.2+1.0*k,pl.yaw,0.35*k);}window._sky.position.copy(cam.position);if(avatar){avatar.visible=!!NET?.peer;if(avatar.visible&&!oma&&lehtiKaatui!=='k')avatar.rotation.z=1.2*k;}const el=$('lehti');if(el)el.style.opacity=String(Math.min(1,Math.max(0,(lehtiT-0.35)/0.7)));renderer.autoClear=true;renderer.render(scene,cam);}
const PIHA_NIMET={mokki:'Mökki',sauna:'Tynnyrisauna',navetta:'L-navetta'};
function pihaKeski(nimi){const b=pihaPohja(nimi),o=pihaNykyinen()[nimi];return {x:b.x+o.x,z:b.z+o.z};}
function paivitaPihaMallit(){const v=pihaVersio();if(v===pihaNaky)return;pihaNaky=v;
  cabinM.position.set(CABIN.x,height(CABIN.x,CABIN.z),CABIN.z);cabinM.rotation.y=CABIN.rot;
  POYTA=poytaMaailma(CABIN);poytaRyhma.position.set(POYTA.x,height(POYTA.x,POYTA.z),POYTA.z);poytaRyhma.rotation.y=CABIN.rot;sijoitaRiista();
  let sx=0,sz=0;for(const[x,z]of SAUNA_POLY){sx+=x;sz+=z;}sx/=SAUNA_POLY.length;sz/=SAUNA_POLY.length;
  saunaRyhma.position.set(sx,height(sx,sz)+1.45,sz);saunaRyhma.rotation.y=Math.atan2(0.962,0.272)+pihaNykyinen().sauna.rot;
  rakennaNavetta();if(editorOn)paivitaEditoriTeksti();}
function voiEditoida(){return !isGuest();}
function varmistaEditori(){if(editorEl)return editorEl;editorEl=document.createElement('div');editorEl.id='piha-editori';
  editorEl.style.cssText='position:fixed;left:16px;bottom:16px;z-index:40;background:rgba(18,16,12,.92);color:#f6efe2;padding:12px 14px;border:1px solid #e2c27a;border-radius:8px;font:14px/1.4 Georgia,serif;max-width:380px';
  editorEl.innerHTML='<b>Rakennuseditori</b><div id="piha-nimi"></div><div>Hiiri siirtää valittua, Q ja E kääntävät, F8 sulkee. Kamera on ylhäältä. Pihapöytä ja lehti siirtyvät mökin mukana.'+(RIISTAKAMERA?' Riistakamerat ja tietokone siirtyvät myös.':'')+'</div><label>Salasana <input id="piha-sala" type="password" autocomplete="off" style="width:8em"></label><div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap"><button type="button" id="piha-vie">Vie</button><button type="button" id="piha-tallenna">Tallenna pysyvästi</button></div><p style="margin:8px 0 0;font-size:12px">Tallenna pysyvästi kirjoittaa sijainnit palvelimelle heti. Renderin ilmaisversiossa tiedosto katoaa uudelleenkäynnistyksessä ja deployssa. Vie kopioi JSONin, jonka voi myöhemmin kirjoittaa koodin oletussijainneiksi.</p>';
  document.body.appendChild(editorEl);
  editorEl.querySelector('#piha-sala').addEventListener('keydown',e=>e.stopPropagation());
  editorEl.querySelector('#piha-vie').onclick=async()=>{const t=JSON.stringify(pihaNykyinen(),null,2);try{await navigator.clipboard.writeText(t);}catch{}say('Sijainnit kopioitu leikepöydälle.');};
  editorEl.querySelector('#piha-tallenna').onclick=()=>tallennaPiha();
  return editorEl;}
function paivitaEditoriTeksti(){if(!editorEl)return;const o=pihaNykyinen()[editorValinta],c=pihaKeski(editorValinta);
  editorEl.querySelector('#piha-nimi').textContent=voiEditoida()?`${PIHA_NIMET[editorValinta]} · x ${c.x.toFixed(1)} · z ${c.z.toFixed(1)} · kierto ${(o.rot*180/Math.PI).toFixed(0)}°`:'Vain isäntä siirtää rakennuksia.';}
function vaihdaEditori(){editorOn=!editorOn;if(editorOn){if(document.pointerLockElement)document.exitPointerLock();$('menu').style.display='none';const c=pihaKeski(editorValinta);editorKatse.x=c.x;editorKatse.z=c.z;varmistaEditori().style.display='block';paivitaEditoriTeksti();cam.up.set(0,0,-1);}
  else{if(editorEl)editorEl.style.display='none';cam.up.set(0,1,0);if(window.__peliAlkanut&&!lehtiOn&&!loppuOn)cvs.requestPointerLock();}}
function editorSiirra(nimi,x,z,rotLisa){if(!voiEditoida())return;const p=JSON.parse(JSON.stringify(pihaNykyinen()));
  if(x!=null){const b=pihaPohja(nimi);p[nimi].x=x-b.x;p[nimi].z=z-b.z;}
  if(rotLisa){p[nimi].rot+=rotLisa;if(Math.abs(p[nimi].rot)>=Math.PI*4)p[nimi].rot=Math.atan2(Math.sin(p[nimi].rot),Math.cos(p[nimi].rot));}
  if(!tarkistaPiha(p)){say('Liian kauas pihasta');return;}sovellaPiha(p);try{localStorage.setItem('jahti_piha',JSON.stringify(pihaNykyinen()));}catch{}
  const c=pihaKeski(nimi);editorKatse.x=c.x;editorKatse.z=c.z;paivitaEditoriTeksti();}
function editorPyorita(d){editorSiirra(editorValinta,null,null,d);}
function hiiriMaa(e){const r=renderer.domElement.getBoundingClientRect(),ndc=new THREE.Vector2(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1),ray=new THREE.Raycaster(),hit=new THREE.Vector3();
  ray.setFromCamera(ndc,cam);return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),hit)?hit:null;}
function lahinPiha(x,z){let best=null,bd=8;for(const n of Object.keys(PIHA_NIMET)){const c=pihaKeski(n),d=Math.hypot(c.x-x,c.z-z);if(d<bd){bd=d;best=n;}}return best;}
addEventListener('mousedown',e=>{if(!editorOn||e.button!==0||e.target.closest?.('#piha-editori'))return;const h=hiiriMaa(e);if(!h)return;const n=lahinPiha(h.x,h.z);if(!n){say('Osoita mökkiä, saunaa tai navettaa');return;}editorValinta=n;editorVeto=true;editorSiirra(n,h.x,h.z);});
addEventListener('mousemove',e=>{if(!editorOn||!editorVeto)return;const h=hiiriMaa(e);if(h)editorSiirra(editorValinta,h.x,h.z);});
addEventListener('mouseup',()=>{editorVeto=false;});
async function tallennaPiha(){const salasana=editorEl?.querySelector('#piha-sala')?.value||'';
  try{const r=await fetch('/api/piha',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({salasana,piha:pihaNykyinen()})});
    if(r.status===403){say('Väärä salasana');return;}if(!r.ok){say('Tallennus ei onnistunut');return;}
    say('Sijainnit palvelimella. Ilmaisessa Renderissä ne katoavat käynnistyksessä.');if(NET?.peer&&!isGuest())NET.send({t:'piha',piha:pihaNykyinen()});}
  catch{say('Palvelimeen ei saada yhteyttä');}}
function syntaa(sr,sek,fn){const len=Math.floor(sr*sek),b=AC.createBuffer(1,len,sr),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=fn(i/sr,i);return b;}
function varmistaPelaajaAani(){if(!AC||buf.pelaaja_h)return;for(const role of['h','v']){const f=pelaajaSavy(role);buf['pelaaja_'+role]=syntaa(AC.sampleRate,0.55,(t,i)=>{const env=Math.sin(Math.min(1,t/0.05)*Math.PI)*Math.exp(-t*2.4),syl=Math.sin(t*11*Math.PI)>0?1:0.25;return Math.max(-1,Math.min(1,env*syl*(Math.sin(2*Math.PI*f*t)*0.5+Math.sin(2*Math.PI*f*2.1*t)*0.22)));});}}
let puheIndeksiLupaus=null;
function lataaPuheIndeksi(){if(!puheIndeksiLupaus)puheIndeksiLupaus=fetch('/aanet/puhe/indeksi.json').then(r=>r.ok?r.json():null).catch(()=>null);return puheIndeksiLupaus;}
lataaPuheIndeksi();
async function soitaPuheTiedosto(tiedosto,o){if(!AC)return false;const key='puhe:'+tiedosto;if(!(key in buf)){try{const r=await fetch('/aanet/puhe/'+String(tiedosto).replace(/^\//,''));if(!r.ok){buf[key]=null;return false;}buf[key]=await AC.decodeAudioData(await r.arrayBuffer());}catch{buf[key]=null;return false;}}if(!buf[key])return false;play3d(key,o);return true;}
function soitaRepliikki({hahmot,teksti,x,z,mumina,gain=0.55,kategoria}){const opt={x,y:height(x,z)+1.5,z,gain,ref:4,max:28};varmistaKylaAanet();varmistaPelaajaAani();lataaPuheIndeksi().then(async idx=>{const tied=etsiPuhe(idx,{hahmo:hahmot,teksti,kategoria});if(tied&&await soitaPuheTiedosto(tied,opt))return;play3d(mumina,opt);});}
function naytaPelaajaPuhe(rivi,role,x,z){const el=$('puhe');if(!el)return;el.replaceChildren();const b=document.createElement('b');b.textContent=role===ME?'Sinä':'Kaveri';el.append(b,document.createElement('br'),document.createTextNode(rivi));el.style.display='block';puheT=3.4;const hahmo=role==='v'?'pelaaja2':'pelaaja1';const mumina=role==='v'?'pelaaja_v':'pelaaja_h';soitaRepliikki({hahmot:[hahmo],teksti:rivi,x,z,mumina,gain:0.7,kategoria:'hyppy'});}
function kieltaydyHypysta(){if(!window.__peliAlkanut||pl.inCar||loppuOn||lehtiOn||lukuOn||editorOn||!hyppySallittu(hyppyCd))return;const rivi=seuraavaHyppy(hyppyEd);hyppyEd=rivi;hyppyCd=1.5;luovutus=0.7;naytaPelaajaPuhe(rivi,ME,pl.x,pl.z);NET?.send({t:'hyppy',rivi,role:ME,x:pl.x,z:pl.z});}
function varmistaFsdNappi(){const gd=$('gps');if(!gd||$('fsd-nappi'))return;const b=document.createElement('button');b.id='fsd-nappi';b.type='button';b.textContent='FSD';b.title='Kutsu Vitara';b.style.cssText='position:absolute;right:6px;top:6px;z-index:3;pointer-events:auto;font:700 13px sans-serif;padding:4px 8px;background:#ffe14a;color:#111;border:2px solid #111;cursor:pointer';b.addEventListener('click',e=>{e.stopPropagation();kutsuFsd();});gd.appendChild(b);}
varmistaFsdNappi();
function varmistaKylaAanet(){if(!AC||buf._kyla)return;buf._kyla=1;const f0={matala:90,kimea:280,juoru:190,karhea:130};
  for(const nimi in f0)buf['kyla_'+nimi]=syntaa(AC.sampleRate,0.62,(t,i)=>{const env=Math.sin(Math.min(1,t/0.08)*Math.PI)*Math.exp(-t*3.2),syl=Math.sin(t*14*Math.PI)>0?1:0.2,karhea=nimi==='karhea'?((i*17%100)/100-0.5)*0.55:0,f=f0[nimi];
    return Math.max(-1,Math.min(1,env*syl*(Math.sin(2*Math.PI*f*t)*0.55+Math.sin(2*Math.PI*f*2.6*t)*0.28+Math.sin(2*Math.PI*f*3.4*t)*0.12+karhea)));});
  buf.kyla_hikka=syntaa(AC.sampleRate,0.28,t=>Math.sin(2*Math.PI*70*t)*Math.exp(-t*8)*(t<0.08?1:0.25));
  buf.kyla_pullo=syntaa(AC.sampleRate,0.18,t=>Math.sin(2*Math.PI*(880+t*500)*t)*Math.exp(-t*14)*0.55);
  buf.kyla_keppi=syntaa(AC.sampleRate,0.1,t=>(t<0.015?1:0)*Math.sin(2*Math.PI*220*t));
  buf.kyla_tuhahdus=syntaa(AC.sampleRate,0.35,(t,i)=>(((i*13)%100)/100-0.5)*Math.exp(-t*6)*0.7);}
function kylaTunnelma(dt){if(!AC||!window.__peliAlkanut||lehtiOn||loppuOn)return;kylaAmbT-=dt;if(kylaAmbT>0)return;kylaAmbT=2.8;
  for(const k of kylalaiset){if(k.kaatunut||Math.hypot(k.x-pl.x,k.z-pl.z)>18)continue;const a=tunnelma(k.laji);if(!a)continue;varmistaKylaAanet();play3d('kyla_'+a,{x:k.x,y:height(k.x,k.z)+1.2,z:k.z,gain:0.4,ref:3,max:18});break;}}
async function lataaPihaAlkuun(){let p=null;try{const r=await fetch('/api/piha');if(r.ok){const j=await r.json();p=tarkistaPiha(j.piha);}}catch{}
  if(!p){try{p=tarkistaPiha(JSON.parse(localStorage.getItem('jahti_piha')||'null'));}catch{}}if(p)sovellaPiha(p);}
lataaPihaAlkuun();
function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),0.1);lumiKello=clock.elapsedTime;if(!isGuest())lumiPaivita(lumiTila,dt,Math.random,lumiKello);piirraSaavutus(dt);liikutaKylalaiset();if(lehtiOn){paivitaLehti(dt);return;}if(loppuOn){paivitaLopetus(dt);return;}lumiPiirra(dt);hares.forEach((h,i)=>{if(h.marks?.length)applyMarks(hareObjs[i],h.marks,h.laji==='kettu'?'kettu':'janis');});treeLOD(dt);
  // pelaaja
  let f=(keys.KeyW?1:0)-(keys.KeyS?1:0),s=(keys.KeyD?1:0)-(keys.KeyA?1:0);if(lukuOn||editorOn||riistaOn||$('menu').style.display==='flex')f=s=0;
  if(pl.inCar){if(fsd.on)fsdSeis('FSD perui – autossa istutaan');if(pl.seat==='kuski'){car.update(dt,{throttle:f,steer:s});car.steer=s;}pl.x=car.x;pl.z=car.z;f=s=0;if(window.__peliAlkanut){if(radio.on)saavuta({tyyppi:'radio',dt});if(pl.seat==='kuski'&&car.offroad)saavuta({tyyppi:'vitara',metri:Math.abs(car.speed)*dt});}}
  else if(fsd.on&&!isGuest()){if(NET?.last?.inCar)fsdSeis('FSD perui – autossa istutaan');else{const r=fsdPaivita(fsd,car,dt);if(r){if(r.tapahtuma){if(r.teksti)say(r.teksti);if(NET?.peer&&ME==='h')NET.send({t:'fsd',on:0,teksti:r.teksti||''});}else{car.update(dt,{throttle:r.throttle,steer:r.steer});car.steer=r.steer;if(window.__peliAlkanut&&car.offroad)saavuta({tyyppi:'vitara',metri:Math.abs(car.speed)*dt});}}}}
  if(engine){const v=Math.min(1,Math.abs(car.speed)/16),r=0.8+0.7*v,eg=pl.inCar?0.5:2;for(const k in engine)if(engine[k]){engine[k].s.playbackRate.value=r;engine[k].setPos?.(car.x,car.y+0.8,car.z);}if(engine.idle)engine.idle.g.gain.value=0.25*(1-v)*eg;if(engine.drive)engine.drive.g.gain.value=0.25*v*eg;}
  radioTick(dt);
  if(radio.out){const o=radio.out;o.c3.setPos?.(car.x,car.y+1,car.z);A3.setPos(o.c3,car.x,car.y+1,car.z);const open=doorT>0;const su=radioSuodin(pl.inCar,open);o.hp.frequency.value=su.hp;o.lp.frequency.value=su.lp;o.g.gain.value=radioVoimakkuus(pl.inCar,open);o.c3.lp.frequency.value=pl.inCar?18000:open?8000:2200;}
  if(A3){A3.updateListener(cam);ambT-=dt;if(ambT<=0){ambT=15+Math.random()*30;const a=Math.random()*6.28,d=80+Math.random()*250,n=['amb_korppi_1','amb_korppi_2','amb_tikka_1'][Math.random()*3|0];play3d(n,{x:pl.x+Math.cos(a)*d,y:12,z:pl.z+Math.sin(a)*d,gain:1.5,ref:25,max:1500});}
    }
  carObj.rotation.order='YXZ';carObj.position.set(car.x,car.y,car.z);carObj.rotation.set(-car.pitch,Math.PI-car.heading,-car.roll);
  for(const n in wheels){const w=wheels[n];if(!w)continue;w.rotation.x+=car.speed*dt/0.33;if(n==='pyora_ev'||n==='pyora_eo')w.rotation.y=((pl.inCar||fsd.on)?car.steer||0:0)*0.45;}
  if(door){doorT=Math.max(0,doorT-dt);door.rotation.y=door.userData.r0+Math.sin(doorT*Math.PI)*1.0;}
  pl.moving=!!(f||s);
  if(pl.moving){pl.raise=0;pl.raising=false;} if(pl.raising){pl.raise=Math.min(1,pl.raise+dt/0.3);if(pl.raise>=1)pl.raising=false;}
  pl.revealT=Math.max(0,pl.revealT-dt); const aiming=pl.raise>=1&&!pl.inCar; $('aim').style.display='none'; $('gun').style.display='none'; $('cross').style.display=aiming||pl.inCar||WP.binoOn?'none':'block';$('vignette').style.opacity=vm.aim*0.9;
  {const zf=WP.update(dt,{t:clock.elapsedTime,aim:aiming,inCar:pl.inCar});cam.fov=zf>1?65/zf:65-10*vm.aim;cam.updateProjectionMatrix();}
  if(pl.moving){const sp=pl.crouch?0.7:keys.ShiftLeft?4:1.6;let nx=pl.x+(-Math.sin(pl.yaw)*f+Math.cos(pl.yaw)*s)*sp*dt,nz=pl.z+(-Math.cos(pl.yaw)*f-Math.sin(pl.yaw)*s)*sp*dt;const laatikot=[poytaLaatikko(CABIN),pelinKoneLaatikko(CABIN)];
    const estaa=(x1,z1)=>laatikot.some(b=>poytaEstaa(pl.x,pl.z,x1,z1,b));
    if(estaa(nx,nz)){if(!estaa(nx,pl.z))nz=pl.z;else if(!estaa(pl.x,nz))nx=pl.x;else{nx=pl.x;nz=pl.z;}}pl.x=nx;pl.z=nz;stepT-=dt;}pl.x=clampB(pl.x);pl.z=clampB(pl.z);
  if(walk)walk.g.gain.value=pl.moving?0.4:0;
  interior.g.position.copy(carObj.position);interior.g.rotation.copy(carObj.rotation);interior.g.visible=interior.loaded;
  // Sisänäkymässä ulkokori (vitara_kori, DoubleSide) peitti tuulilasin/ikkunat/radion/lattian 0.2–1.1 m päässä kamerasta → piiloon
  {const kori=carObj.getObjectByName('vitara_kori');if(kori)kori.visible=!(pl.inCar&&interior.loaded);if(interior.extra)interior.extra.visible=pl.inCar;}
  if(pl.inCar){interior.g.updateMatrixWorld();const cp=new THREE.Vector3(pl.seat==='pelkaaja'?-0.40:0.40,1.32,-0.55);interior.g.localToWorld(cp);cam.position.copy(cp);pl.yaw=-car.heading;cam.rotation.set(pl.pitch,pl.yaw+(pl.lookYaw||0),0);
    if(interior.n.ratti)interior.n.ratti.rotation.z=-(car.steer||0)*1.6;if(interior.n.vaihdekeppi)interior.n.vaihdekeppi.rotation.x=car.speed>0.3?-0.25:car.speed<-0.3?0.25:0;}
  else{pl.lookYaw=0;const dip=luovutus>0?0.32*Math.sin(Math.min(1,(0.7-luovutus)/0.7)*Math.PI):0;const tavoite=(pl.crouch?1.0:1.65)-dip;pl.eye=(pl.eye??1.65)+(tavoite-(pl.eye??1.65))*Math.min(1,dt*10);cam.position.set(pl.x,height(pl.x,pl.z)+pl.eye,pl.z);cam.rotation.set(pl.pitch+(WP.swayY||0),pl.yaw+(WP.swayX||0),0);}window._sky.position.copy(cam.position);
  if(luovutus>0)luovutus=Math.max(0,luovutus-dt);if(vierasLuovutus>0)vierasLuovutus=Math.max(0,vierasLuovutus-dt);if(hyppyCd>0)hyppyCd-=dt;
  if(fsdValot.length){const vilkku=fsd.on&&((clock.elapsedTime*3)%1<0.5);for(const v of fsdValot){v.m.visible=fsd.on;v.l.intensity=vilkku?2.4:0;}}
  // tekoäly
  netTick(dt);const P={x:pl.x,z:pl.z},GUEST=isGuest();
  if(GUEST&&dog._wasRide&&!dog.riding)hopSnd(dog.x,dog.z);if(GUEST&&!dog._wasRide&&dog.riding)hopSnd(dog.x,dog.z);dog._wasRide=!!dog.riding;
  if(NET?.peer){const tunnettu=ME==='v'||!!NET.last,guestIn=ME==='v'?pl.inCar:!!(NET.last&&NET.last.inCar);if(guestIn)nouseTerrieri();else if(tunnettu&&terrier.riding&&window.__peliAlkanut)jumpPet();}
  const rideAt=slot=>{const q=car.cargo(slot);return{x:q.x,z:q.z,dir:car.heading};};
  if(dog.riding){const r=rideAt(0);dog.x=r.x;dog.z=r.z;dog.dir=r.dir;}
  if(!GUEST)dog.update(dt,{hares,fetch:WL.birds.filter(b=>b.kind==='teeri'),player:P,players:{[ME]:P,...(NET?.last&&!GUEST?{v:{x:NET.last.x,z:NET.last.z}}:{})},obstacles:[bodyBox(car),poytaLaatikko(CABIN),pelinKoneLaatikko(CABIN)].filter(Boolean),puu:puuEdessa,lumi:lumiTila,ride:dog.riding?rideAt(0):null});
  if(NET?.peer){const gp=ME==='v'?P:(NET.last?{x:NET.last.x,z:NET.last.z}:P);terrier.update(dt,{player:gp,hares:[],obstacles:[bodyBox(car),poytaLaatikko(CABIN)],ride:terrier.riding?rideAt(1):null});}
  hare=dog.target||hare;const ajajat=[];if(!pl.inCar)ajajat.push({x:pl.x,z:pl.z,moving:!!(pl.moving||pl.revealT>0),crouch:!!pl.crouch,run:!!(keys.ShiftLeft&&pl.moving),id:ME});
  if(NET?.last&&!GUEST&&!NET.last.inCar)ajajat.push({x:NET.last.x,z:NET.last.z,moving:vierasVauhti>0.45,crouch:!!NET.last.crouch,run:vierasVauhti>3.2,id:NET.last.role||'v'});
  for(const h of hares){if(GUEST)break;h._acc=(h._acc||0)+dt;const d=Math.min(Math.hypot(h.x-P.x,h.z-P.z),Math.hypot(h.x-dog.x,h.z-dog.z));if(h!==dog.target&&h._acc<aiInterval(d))continue;h.update(Math.min(h._acc,0.25),{dog:dog.pos,player:P,playerMoving:!!(pl.moving||pl.revealT>0),hunters:ajajat,kello:lumiKello});h._acc=0;}
  WL.update(dt,{t:clock.elapsedTime,player:P,dog:dog.pos,addTrack});
  if(hare.state===H.PAKO&&!hareFlushed){hareFlushed=true;play3d('sfx_janis_pakoloikka',{x:hare.x,y:height(hare.x,hare.z)+0.3,z:hare.z,gain:1,ref:5,max:400});}
  if(hare.veered&&pl.moving){hare.veered=false;}
  for(const h of hares)if(h.blood?.length){for(const b of h.blood)addTrack('veri',{...b,dir:b.x*7,s:0.12+0.3*h.damage});h.blood.length=0;}
  if((trackT-=dt)<=0&&(trackDirty||Math.hypot(pl.x-trackAt.x,pl.z-trackAt.z)>10)){trackT=0.5;cullTracks(pl.x,pl.z);}
  updateE();WL.humans=[P,NET?.last&&{x:NET.last.x,z:NET.last.z}];
  for(const b of WL.birds)if(b.carried){const n=dogObj.userData.n,nd=n?.leuka||n?.paa;b.x=dog.x;b.z=dog.z;if(nd){nd.getWorldPosition(b.obj.position);b.obj.position.y-=0.1;}b.y=b.obj.position.y;b.obj.rotation.set(0,-(dog.dir||0),Math.PI/2);}
    else if(b.delivered&&!b._dropY){b._dropY=1;b.y=height(b.x,b.z);}
  hares.forEach((h,k)=>{const laji=h.laji==='kettu'?'kettu':'janis';while(hn[k]<h.trail.length)addTrack(laji,h.trail[hn[k]++]);});while(dn<dog.trail.length){if(dn%2===0)addTrack('koira',dog.trail[dn]);dn++;}
  riistaSim(dt);
  const tnow=clock.elapsedTime;hares.forEach((h,k)=>{const o=hareObjs[k];o.position.set(h.x,height(h.x,h.z),h.z);o.rotation.y=Math.PI/2-h.heading;o.rotation.z=h.alive?0:Math.PI/2;o.visible=!h.held;if(h.carried){const hn2=dogObj.userData.n,nd=hn2?.leuka||hn2?.paa;if(nd){nd.getWorldPosition(o.position);o.position.y-=0.12;}o.rotation.set(0,Math.PI-(dog.dir||0)+Math.PI/2,Math.PI/2);}V8.animHare(o.userData.n,{t:tnow,spd:h.alive?h.speed:0,lying:h.state===H.MAKUU});});
  const dsp=Math.hypot(dog.x-(dog._px??dog.x),dog.z-(dog._pz??dog.z))/Math.max(dt,1e-3);dog._px=dog.x;dog._pz=dog.z;dogJaw=Math.max(0,dogJaw-dt*5);
  dogObj.position.set(dog.x,dog.riding?car.y+0.58:height(dog.x,dog.z),dog.z);dogObj.rotation.set(0,Math.PI-(dog.dir||0),0);V8.animDog(dogObj.userData.n,{t:tnow,spd:dog.riding?0:dsp,jaw:Math.sin(Math.min(1,dogJaw)*Math.PI),barking:dog.barking,sniff:dog.sniffing||dog.state===D.YOJALKI||dog.state===D.YLOSOTTO,wag:!!dog.wag,sit:!!dog.riding,k:V8.DOG_K[DOGBREED]});
  terrierObj.visible=!!NET?.peer;if(terrierObj.visible){const ts=Math.hypot(terrier.x-(terrier._px??terrier.x),terrier.z-(terrier._pz??terrier.z))/Math.max(dt,1e-3);terrier._px=terrier.x;terrier._pz=terrier.z;
    terrierObj.position.set(terrier.x,terrier.riding?car.y+0.58:height(terrier.x,terrier.z),terrier.z);terrierObj.rotation.set(0,Math.PI-(terrier.dir||0),0);V8.animDog(terrierObj.userData.n,{t:tnow,spd:terrier.riding?0:ts,sit:!!terrier.riding,jaw:0,k:V8.DOG_K.terrier});}
  // ääni: kuuluvuus etäisyys + tuuli, panorointi suunnan mukaan
  const vol=audibility(dog.pos,P),rel=Math.atan2(dog.x-pl.x,-(dog.z-pl.z))+pl.yaw,pan=Math.max(-1,Math.min(1,Math.sin(rel)));
  if(!dog.riding&&dog.state!==lastDog){if(dog.state===D.AJO){saavuta({tyyppi:'haukku'});play3d('sfx_koira_ylosotto',{x:dog.x,y:height(dog.x,dog.z)+0.6,z:dog.z,gain:1.4,ref:15,max:2500});}lastDog=dog.state;}
  {const tap=gpsTapahtuma(gpsKoriNyt,dog.riding?'narussa':dog.state);if(tap){gpsKoriNyt=tap.kori;if(gpsOn&&window.__peliAlkanut){tap.aanet.forEach((a,i)=>setTimeout(()=>play(a,{gain:a==='sfx_gps_hukka'?0.5:0.4}),i*130));if(tap.teksti)say(tap.teksti);}}}
  barkT-=dt;terrierBarkT-=dt;if(dog.riding)barkT=1;else if(barkT<=0){const mode=dog.haukku;if(mode){const rotu=dog.kimea?'terrieri':'ajokoira';const dist=hare?Math.hypot(hare.x-dog.x,hare.z-dog.z):60;const hiljaa=mode==='epavarma'||mode==='vingahdus';dog._hn=(dog._hn||0)+1;play3d(haukkuAani(mode,rotu,dog._hn),{x:dog.x,y:height(dog.x,dog.z)+0.6,z:dog.z,gain:(hiljaa?0.42:0.9)*(0.4+0.6*vol),ref:12,max:1600,roll:1.45,rate:haukkuSavel(rotu)});dogJaw=hiljaa?0.22:1;barkT=haukkuVali(mode,dist)*(0.85+Math.random()*0.35);}
    else if(dog.state===D.HAKU){play3d('sfx_koira_nuuhkii',{x:dog.x,y:height(dog.x,dog.z)+0.4,z:dog.z,gain:.6,ref:3,max:120,roll:1.5});barkT=6;}
    else if(dog.state===D.YOJALKI||dog.state===D.YLOSOTTO){play3d('sfx_koira_nuuhkii_hidas',{x:dog.x,y:height(dog.x,dog.z)+0.35,z:dog.z,gain:.45,ref:3,max:80,roll:1.5});barkT=4;}else barkT=1;}
  if(NET?.peer&&!terrier.riding&&(dog.haukku==='jalki'||dog.haukku==='nako')&&terrierBarkT<=0){terrier._hn=(terrier._hn||0)+1;play3d(haukkuAani(dog.haukku,'terrieri',terrier._hn),{x:terrier.x,y:height(terrier.x,terrier.z)+0.4,z:terrier.z,gain:0.62*(0.4+0.6*audibility(terrier.pos,P)),ref:10,max:1200,roll:1.5,rate:haukkuSavel('terrieri')});terrierBarkT=haukkuVali(dog.haukku,18)*1.8;}
  if((muistiT-=dt)<=0){muistiT=0.5;muistiKierros();}
  saavutusElukat();if(NET?.peer)saavuta({tyyppi:'moninpeli'});
  if(pl.moving&&stepT<=0){stepT=0.55;}
  // HUD
  shotFlash-=dt;const g=$('gun'),naruKasi=omaKoiraNyt().leashed,want=shotFlash>0?gunSrc.shot:naruKasi?gunSrc.naru:gunSrc.fp;if(!g.src.endsWith(want.slice(G.length))&&g.src.includes('/grafiikka/'))g.src=want;
  g.style.transform=shotFlash>0?'translate(10px,8px)':'';
  const deg=((-pl.yaw*180/Math.PI)%360+360)%360;
  $('tls').innerHTML=`Koira: ${dog.riding?'kyydissä':STATE_FI[dog.state]}${dog.sniffing?' (haistelee)':''} · kuuluvuus ${(vol*100|0)}%<br>${pl.moving?'liikkeellä':'paikallaan'} · ${WP.weapon==='kivaari'?'kivääri '+WP.rifleShells+'/3':'haulikko '+pl.shells+'/2'}${WP.binoOn?' · kiikarit':''} · ase ${pl.raise>=1?'tähtäyksessä':pl.raising?'nousee':'alhaalla'}<br>Suunta ${deg|0}°<br>`;
  const cc=$('comp').getContext('2d');cc.clearRect(0,0,128,32);if(compass.complete&&compass.naturalWidth){const W=compass.naturalWidth,Hh=compass.naturalHeight,x0=((deg/360-0.25)*W+W)%W;cc.drawImage(compass,x0,0,W/2,Hh,0,0,128,32);if(x0>W/2)cc.drawImage(compass,0,0,W/2,Hh,(W-x0)/(W/2)*128,0,128,32);}
  else{cc.fillStyle='#fff';cc.fillText(['P','I','E','L'][Math.round(deg/90)%4],60,20);}
  const wc=$('wind').getContext('2d');wc.clearRect(0,0,32,32);wc.save();wc.translate(16,16);wc.rotate(WIND.dir-(-pl.yaw));
  if(windArrow.complete&&windArrow.naturalWidth)wc.drawImage(windArrow,-16,-16);else{wc.fillStyle='#fff';wc.beginPath();wc.moveTo(0,-14);wc.lineTo(6,10);wc.lineTo(-6,10);wc.fill();}wc.restore();
  $('windt').textContent=`${windFromText()} ${WIND.speed} m/s`;
  $('bag').textContent=pl.bag+(pl.bag?' ('+Object.entries(pl.bagBy).map(([k,v])=>(LAJIT[k]||k)+' '+v).join(', ')+')':'');
  if(gpsOn){const c=gpsCtx,W=256,S=W/gpsSpan;c.imageSmoothingEnabled=false;const m=(x,z)=>[W/2+(x-pl.x)*S,W/2+(z-pl.z)*S];
    if(gpsMap.complete&&gpsMap.naturalWidth){const k=gpsGeo.m_per_px,o=gpsGeo.maailma_origo_px,span=gpsSpan/k;c.fillStyle='#7A8070';c.fillRect(0,0,W,W);c.drawImage(gpsMap,o[0]+pl.x/k-span/2,o[1]+pl.z/k-span/2,span,span,0,0,W,W);}
    else{c.fillStyle='#9ab08a';c.fillRect(0,0,W,W);c.strokeStyle='#6b5a3a';c.lineWidth=2;for(const r of ROADS){c.beginPath();r.pts.forEach(([x,z],i)=>{const[a2,b2]=m(x,z);i?c.lineTo(a2,b2):c.moveTo(a2,b2);});c.stroke();}}
    // koiran reitti häivyttyvinä pisteinä (uusin alfa 1)
    const tr=dog.trail,N=Math.min(tr.length,300);for(let i=0;i<N;i+=2){const p=tr[tr.length-N+i],[a2,b2]=m(p.x,p.z);c.globalAlpha=i/N;if(gDot.complete&&gDot.naturalWidth)c.drawImage(gDot,a2-2,b2-2);else{c.fillStyle='#FF8C1A';c.fillRect(a2-1.5,b2-1.5,3,3);}}c.globalAlpha=1;
    const ic=(img,x,y,rot,col,sz=16)=>{c.save();c.translate(x,y);c.rotate(rot);if(img.complete&&img.naturalWidth)c.drawImage(img,-sz/2,-sz/2,sz,sz);else{c.fillStyle=col;c.fillRect(-4,-4,8,8);}c.restore();};
    const gpsLista=gpsPino(gpsMerkit({oma:{x:pl.x,z:pl.z},koira:dog,auto:car,kaveri:NET?.last||null,terrieri:NET?.peer?terrier:null,moninpeli:!!(NET&&NET.peer)}));
    for(const mk of gpsLista)if(mk.laji==='auto'){const[ax,az]=m(mk.x,mk.z);c.save();c.translate(ax,az);c.rotate(-(car.heading||0));c.fillStyle='#1d3a28';c.fillRect(-8,-12,16,24);c.fillStyle='#d7ecf8';c.fillRect(-6,-5,12,9);c.restore();}
    const hi=dog.barking?(dogJaw>0.3?gh.haukku:gh.ajo):dog.state===D.TANNE||dog.state===D.NARUSSA?gh.seisonta:gh.hiljaa;
    const[dx,dz]=m(dog.x,dog.z),inside=dx>8&&dx<W-8&&dz>8&&dz<W-8;
    if(inside){ic(hi,dx,dz,0,dog.barking?'#f33':'#a52',24);ic(gArrow,dx,dz-16,dog.dir||0,'#fa0',12);}
    else{const ang=Math.atan2(dx-W/2,-(dz-W/2));ic(gArrow,W/2+Math.sin(ang)*(W/2-12),W/2-Math.cos(ang)*(W/2-12),ang,'#fa0',16);}
    for(const mk of gpsLista){const[ax,az]=m(mk.x,mk.z),sx=mk.siirto||0;
      if(mk.laji==='terrieri'){c.fillStyle='#111';c.fillRect(ax+sx-5,az-5,10,10);c.strokeStyle='#f4efe4';c.strokeRect(ax+sx-5,az-5,10,10);}
      if(mk.laji==='kaveri'){c.fillStyle='#3cff7a';c.beginPath();c.moveTo(ax+sx,az-9);c.lineTo(ax+sx+7,az+7);c.lineTo(ax+sx-7,az+7);c.fill();}
      if(mk.laji==='oma')ic(gi.pelaaja,ax+sx,az,-pl.yaw,'#00f',16);}
    const dd=Math.hypot(dog.x-pl.x,dog.z-pl.z),brg=((Math.atan2(dog.x-pl.x,-(dog.z-pl.z))*180/Math.PI)+360)%360,SU=['P','KO','I','KA','E','LO','L','LU'][Math.round(brg/45)%8];
    c.fillStyle='#000a';c.fillRect(0,W-30,W,30);c.fillStyle='#fff';c.font='bold 11px monospace';c.fillText(`Koira ${dd<1000?Math.round(dd)+' m':(dd/1000).toFixed(1)+' km'} ${SU} ${Math.round(brg)}°`,4,W-17);c.fillText((dog.riding?'kyydissä':STATE_FI[dog.state])+(dog.sniffing?' · haistelee':'')+(dog.barking?' · haukkuu':''),4,W-4);c.fillText(Math.round(gpsSpan)+' m',W-48,12);
    if((gpsImgT-=dt)<=0){gpsImgT=0.1;$('gpsi').src=$('gpsc').toDataURL();}}
  {const rp=$('radio');rp.style.display='none';if(interior.loaded&&(radio._d!==radio.on+''+radio.ch)){radio._d=radio.on+''+radio.ch;interior.drawRadio(radio.on,CH[radio.ch].n,FREQ[CH[radio.ch].k]);}radio.showT-=dt;$('radioch').textContent=CH[radio.ch].n;$('radioname').style.display=pl.inCar&&radio.showT>0?'block':'none';$('radioname').textContent='📻 '+CH[radio.ch].n;}
  if((msgT-=dt)<=0)$('msg').textContent='';
  if(puheT>0&&(puheT-=dt)<=0)piilotaPuhe();
  for(const k of kylalaiset){if(k.kaatunut)continue;if(Math.hypot(k.x-pl.x,k.z-pl.z)>80)continue;k.obj.userData.tick(dt);}
  huudaLahella(dt);kylaTunnelma(dt);paivitaPihaMallit();
  if(editorOn){const y=height(editorKatse.x,editorKatse.z);cam.up.set(0,0,-1);cam.position.set(editorKatse.x,y+42,editorKatse.z);cam.lookAt(editorKatse.x,y,editorKatse.z);}
  {for(const [id2,on] of [['kyykky',pl.crouch],['gps-ikoni',gpsOn]]){const e2=$(id2);if(e2)e2.style.color=on?'#ff0':'';}}
  updateLeash();{const f=$('cmdF').querySelector('img');const want='/hud/ikonit/'+(omaKoiraNyt().leashed?'ikoni_naru_irti':'ikoni_naru_kiinni')+'.png';if(!f.src.endsWith(want))f.src=want;}
  vm.cam.aspect=cam.aspect;vm.cam.fov=55-8*vm.aim;vm.cam.updateProjectionMatrix();vm.update(dt,{moving:pl.moving,t:tnow,aim:aiming,run:!pl.crouch&&!!keys.ShiftLeft&&!!pl.moving,crouch:!!pl.crouch||luovutus>0});
  scene.fog.density=LAATU[laatu].fog*(lumiTila.on?1+0.55*(lumiTila.voima||0.6):1);
  renderer.autoClear=true;renderer.render(scene,cam);renderer.autoClear=false;renderer.clearDepth();if(!pl.inCar&&!INS.on&&!editorOn&&!riistaOn)renderer.render(vm.scene,vm.cam);renderIns();}
let saav=null,saavDirty=0,saavutusJono=[],saavutusT=0,saavutusEl=null;
function saavuta(ev){
  try{
    if(!saav)saav=lataaSaav(localStorage);
    const r=kirjaaSaav(saav,ev);saav=r.tila;
    if(r.uudet.length){talletaSaav(localStorage,saav);saavDirty=0;for(const s of r.uudet)saavutusJono.push(s);}
    else if(r.muuttui&&saavDirty<=0)saavDirty=5;
  }catch{}
}
function soittoSaavutus(){
  if(!AC||!AL.aanetPaalla())return;
  const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();
  o.type='sine';o.frequency.setValueAtTime(660,t);o.frequency.setValueAtTime(880,t+0.09);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.07,t+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+0.35);
  o.connect(g).connect(AC.destination);o.start(t);o.stop(t+0.36);
}
function piirraSaavutus(dt){
  if(saavDirty>0){saavDirty-=dt;if(saavDirty<=0){saavDirty=0;try{if(saav)talletaSaav(localStorage,saav);}catch{}}}
  if(saavutusT>0){saavutusT-=dt;if(saavutusT<=0){saavutusT=0;if(saavutusEl)saavutusEl.style.display='none';}return;}
  const s=saavutusJono.shift();if(!s)return;
  if(!saavutusEl){saavutusEl=document.createElement('div');saavutusEl.id='saavutus';
    saavutusEl.style.cssText='position:fixed;top:72px;right:16px;z-index:90;display:flex;gap:10px;align-items:center;max-width:340px;background:rgba(20,16,12,.92);color:#f6efe2;border:1px solid #e2c27a;border-radius:10px;padding:8px 12px;pointer-events:none;font:16px/1.3 Georgia,serif;box-shadow:0 6px 18px #0008';
    document.body.appendChild(saavutusEl);}
  saavutusEl.replaceChildren();
  const ik=document.createElement('div');ik.innerHTML=s.ikoni;ik.style.flex='0 0 auto';
  const tx=document.createElement('div');
  const sm=document.createElement('small');sm.textContent='Saavutus';sm.style.opacity='.75';
  const b=document.createElement('b');b.textContent=s.nimi;b.style.display='block';
  const p=document.createElement('div');p.textContent=s.kuvaus;p.style.fontSize='14px';
  tx.append(sm,b,p);saavutusEl.append(ik,tx);saavutusEl.style.display='flex';
  soittoSaavutus();saavutusT=4.6;
}
function saavutusElukat(){
  const lista=[...hares.map(e=>({kind:e.laji==='kettu'?'kettu':'janis',e})),...WL.birds.filter(b=>b.kind==='teeri').map(e=>({kind:'teeri',e})),...WL.critters.filter(c=>c.kind==='peura'||c.kind==='kauris').map(e=>({kind:e.kind,e}))];
  for(const {kind,e} of lista){
    if(!e.alive&&e.owner===ME&&!e._saavKaato){e._saavKaato=true;saavuta({tyyppi:'kaato',laji:kind,matka:e.matka,osumat:e.osumaLkm||e.hitCount||1,jahti:JAHTI});if(kind==='janis'&&(e.wounded||e.damage>0)&&!e._saavVeri){e._saavVeri=true;saavuta({tyyppi:'veri'});}}
    else if(!e.alive&&kind==='janis'&&(e.wounded||e.damage>0)&&(e.woundedBy===ME||e.owner===ME)&&!e._saavVeri){e._saavVeri=true;saavuta({tyyppi:'veri'});}
    if(e.delivered&&(e.owner===ME||e.woundedBy===ME)&&!e._saavNouto){e._saavNouto=true;saavuta({tyyppi:'nouto'});}
  }
}
addEventListener('pagehide',()=>{try{if(saav)talletaSaav(localStorage,saav);}catch{}});
loop();
window.__game={radio,pl,car,dog,hares,get hare(){return hare;},WL,WP,fire,scene,renderer,cam,THREE,vm,interior,hareObj,hareObjs,dogObj,height,DOGBREED,kylalaiset,get NET(){return NET;},get gpsOn(){return gpsOn;},saavuta,lumi:lumiTila,riistaKuvat,avaaRiista,koneRyhma,kameraMallit};
