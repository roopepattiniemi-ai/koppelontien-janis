import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as V8 from '/v08.js';
import { Car } from '/logic/car.js';
import { CABIN, YARD, START, SIGNS } from '/logic/world.js';
import { height, ROADS, WATER, BUILDINGS, SIZE, trees, inField, isForest, distToRoad, hareSpot, WIND, windFromText } from '/logic/world.js';
import { Hare, H } from '/logic/hare.js';
import { Dog, D } from '/logic/dog.js';
import { audibility } from '/logic/hearing.js';
import { shotgun, KILL_HITS } from '/logic/shot.js';
const G='/grafiikka/', $=id=>document.getElementById(id);
// ---------- renderöinti: matala sisäinen resoluutio, sumu ----------
let RW=640,RH=400;const RES=[[320,200],[640,400],[960,600]];let resI=+(new URLSearchParams(location.search).get('res')??1);[RW,RH]=RES[resI]||RES[1]; const renderer=new THREE.WebGLRenderer({antialias:false});
renderer.setPixelRatio(1); renderer.setSize(RW,RH,false); document.body.prepend(renderer.domElement);
const scene=new THREE.Scene(); scene.background=new THREE.Color(0xb0bed2); scene.fog=new THREE.Fog(0xb0bed2,15,170);
const cam=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,0.05,600); cam.rotation.order='YXZ';
addEventListener('resize',()=>{cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();});
scene.add(new THREE.HemisphereLight(0xc8d4e8,0x8899aa,1.6)); const sun=new THREE.DirectionalLight(0xf0f0f4,1.1); sun.position.set(-1,0.35,1); scene.add(sun);
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
const jalkiT={janis:tex(['jaljet/janis_jalki_32.png'],()=>canvasTex(32,32,g=>{g.fillStyle='#8a97a8';g.fillRect(9,4,6,9);g.fillRect(17,4,6,9);g.fillRect(14,18,4,5);g.fillRect(14,26,4,5);})),
              koira:tex(['jaljet/koira_jalki_32.png'],()=>canvasTex(32,32,g=>{g.fillStyle='#7c8796';g.fillRect(11,12,10,10);g.fillRect(10,5,3,4);g.fillRect(19,5,3,4);g.fillRect(14,3,4,4);}))};
{const s=new THREE.Mesh(new THREE.SphereGeometry(500,16,8),new THREE.MeshBasicMaterial({map:taivasT,side:THREE.BackSide,fog:false}));scene.add(s);window._sky=s;}
// ---------- maasto ----------
const seg=240, tg=new THREE.PlaneGeometry(SIZE,SIZE,seg,seg); tg.rotateX(-Math.PI/2);
const pa=tg.attributes.position; for(let i=0;i<pa.count;i++)pa.setY(i,height(pa.getX(i),pa.getZ(i))); tg.computeVertexNormals();
lumiT.repeat.set(SIZE/8,SIZE/8); const terrainMat=new THREE.MeshLambertMaterial({map:lumiT,flatShading:true,emissive:0x1a1e26});scene.add(new THREE.Mesh(tg,terrainMat));
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
 const jaaM=new THREE.MeshLambertMaterial({color:0xa9bccd,emissive:0x101820,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1});
 for(const w of WATER)strip(w.pts,w.w,0.04,jaaM);
 for(const r of ROADS){if(r.c==='tie'){strip(r.pts,r.w,0.08,tieM);for(const sd of[-1,1])strip(r.pts,1.2,0.35,penkkaM,sd*(r.w/2+0.6));}else strip(r.pts,r.w,0.07,r.c==='piha'?tieM:uraM);}}
// talot: suunnattu laatikko + lumikatto
{const wallC=[0x8e2a20,0xd8c48a,0xe8e4dc,0x9a3a28];
 BUILDINGS.forEach((P,i)=>{let cx=0,cz=0;for(const[a2,b2]of P){cx+=a2;cz+=b2;}cx/=P.length;cz/=P.length;const ang=Math.atan2(P[1][1]-P[0][1],P[1][0]-P[0][0]),c=Math.cos(ang),sn=Math.sin(ang);
  let u0=1e9,u1=-1e9,v0=1e9,v1=-1e9;for(const[a2,b2]of P){const u=(a2-cx)*c+(b2-cz)*sn,v=-(a2-cx)*sn+(b2-cz)*c;u0=Math.min(u0,u);u1=Math.max(u1,u);v0=Math.min(v0,v);v1=Math.max(v1,v);}
  const L=Math.max(3,u1-u0),W=Math.max(3,v1-v0),g=new THREE.Group();{const wm=new THREE.Mesh(new THREE.BoxGeometry(L,3,W),new THREE.MeshLambertMaterial({color:wallC[i%4]}));wm.position.y=1.5;g.add(wm);}const roof=new THREE.Mesh(new THREE.CylinderGeometry(0.01,W*0.62,2,4,1),new THREE.MeshLambertMaterial({color:0xf4f6fa,flatShading:true}));
  roof.rotation.y=Math.PI/4;roof.scale.set(L/W*1.41,1,1);roof.position.y=4;g.add(roof);g.position.set(cx,height(cx,cz),cz);g.rotation.y=-ang;scene.add(g);});}
// puut: InstancedMesh per malli (grafiikka/mallit/kasvit/*.glb); varana kartiopuu/runko
const TREE_H={kuusi_1:6,kuusi_2:9.5,kuusi_3:13,kuusi_4:16,manty_1:14,manty_2:17,koivu_1:12,koivu_2:15,taimi_1:1.5,taimi_2:2.5,kanto_1:0.5,kanto_2:0.6,kaatunut_runko_1:0.6};
{const groups={};for(const t of trees())(groups[t.model]??=[]).push(t);
 const fbGeo=(m,h)=>m.startsWith('kaatunut')?new THREE.CylinderGeometry(0.25,0.3,8,5).rotateX(Math.PI/2).translate(0,0.3,0):m.startsWith('kanto')?new THREE.CylinderGeometry(0.3,0.35,h,6).translate(0,h/2,0):new THREE.ConeGeometry(m.startsWith('koivu')?h*0.18:h*0.22,h,6).translate(0,h/2,0);
 const fbMat={kuusi:new THREE.MeshLambertMaterial({color:0x2a4a34,flatShading:true}),koivu:new THREE.MeshLambertMaterial({color:0x8a8f7a,flatShading:true}),muu:new THREE.MeshLambertMaterial({color:0x5a4a3a,flatShading:true})};
 const M=new THREE.Matrix4(),Qt=new THREE.Quaternion(),Sv=new THREE.Vector3(),Pv=new THREE.Vector3(),Yv=new THREE.Vector3(0,1,0);window.__puuvirheet=[];
 for(const [m,list] of Object.entries(groups)){const h=TREE_H[m]||8;const mat=m.startsWith('kuusi')||m.startsWith('manty')||m.startsWith('taimi')?fbMat.kuusi:m.startsWith('koivu')?fbMat.koivu:fbMat.muu;
  const im=new THREE.InstancedMesh(fbGeo(m,h),mat,list.length);list.forEach((t,i)=>{Qt.setFromAxisAngle(Yv,t.rot);Sv.setScalar(t.s);Pv.set(t.x,height(t.x,t.z)-0.1,t.z);M.compose(Pv,Qt,Sv);im.setMatrixAt(i,M);});
  im.instanceMatrix.needsUpdate=true;im.computeBoundingSphere();scene.add(im);
  new GLTFLoader().load(G+'mallit/kasvit/'+m+'.glb',gl=>{let mesh=null;gl.scene.updateMatrixWorld(true);gl.scene.traverse(o=>{if(o.isMesh&&!mesh)mesh=o;});if(!mesh){window.__puuvirheet.push(m+': ei meshiä');return;}
    const g=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);const mt=mesh.material.clone();if(g.attributes.color)mt.vertexColors=true;mt.flatShading=true;im.geometry.dispose();im.geometry=g;im.material=mt;im.computeBoundingSphere();},
   undefined,e=>{window.__puuvirheet.push(m+': '+(e.message||e));console.warn('puumalli ei aukea',m);});}}
// ---------- eläimet: GLB tai varamuoto ----------
function animal(file,fb){const g=new THREE.Group();g.add(fb);scene.add(g);
  new GLTFLoader().load(G+'mallit/'+file,gl=>{gl.scene.traverse(o=>{if(o.isMesh&&o.geometry.attributes.color){o.material.vertexColors=true;}});g.clear();g.add(gl.scene);g.userData.n=V8.bindNodes(gl.scene);},undefined,()=>{});return g;}
const box=(w,h,d,c,y)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color:c}));m.position.y=y;return m;};
const hareObj=animal('janis.glb',box(0.25,0.3,0.5,0xf4f6f8,0.15)), dogObj=animal('ajokoira.glb',box(0.3,0.55,0.9,0xa0582a,0.4));
// ---------- mökki + Vitara: GLB jos löytyy, muuten laatikkomalli ----------
function model(files,fb,pos,rot,onLoad){const g=new THREE.Group();g.add(fb);g.position.set(pos.x,height(pos.x,pos.z),pos.z);g.rotation.y=rot;scene.add(g);
  (function next(i){if(i>=files.length)return;new GLTFLoader().load(G+'mallit/'+files[i],gl=>{gl.scene.traverse(o=>{if(o.isMesh&&o.geometry.attributes.color)o.material.vertexColors=true;});g.clear();g.add(gl.scene);onLoad&&onLoad(gl.scene);},undefined,()=>next(i+1));})(0);return g;}
const cabinFb=new THREE.Group();{const w=box(8,3,6,0x9a2a20,1.5);cabinFb.add(w);for(const[x,z]of[[-4,-3],[4,-3],[-4,3],[4,3]]){const c=box(0.3,3,0.3,0xffffff,1.5);c.position.x=x;c.position.z=z;cabinFb.add(c);}
  const r=new THREE.Mesh(new THREE.ConeGeometry(6.2,2.2,4),new THREE.MeshLambertMaterial({color:0xf4f6fa,flatShading:true}));r.position.y=4.1;r.rotation.y=Math.PI/4;r.scale.z=0.8;cabinFb.add(r);
  const d=box(1,2,0.1,0x5a3a20,1);d.position.z=3.05;cabinFb.add(d);}
model(['mokki.glb'],cabinFb,CABIN,CABIN.rot);
const car=START?.autossa?new Car({x:START.x,z:START.z,heading:START.heading}):new Car({x:YARD.x+4,z:YARD.z-5,heading:0});
// kyltit (logic/kyltit.json + grafiikka/tekstuurit/kyltit)
V8.setupSigns(scene,SIGNS||[],height);
const carFb=new THREE.Group();{carFb.add(box(1.7,1.1,3.6,0x2f4f6f,0.85));const t=box(1.6,0.8,2.2,0x2f4f6f,1.75);t.position.z=0.3;carFb.add(t);const w=box(1.62,0.5,0.1,0x223344,1.75);w.position.z=-0.82;carFb.add(w);
  for(const[x,z]of[[-0.85,-1.2],[0.85,-1.2],[-0.85,1.2],[0.85,1.2]]){const c=new THREE.Mesh(new THREE.CylinderGeometry(0.36,0.36,0.25,8),new THREE.MeshLambertMaterial({color:0x111111}));c.rotation.z=Math.PI/2;c.position.set(x,0.36,z);carFb.add(c);}}
const wheels={};let door=null,doorT=0;
const carObj=model(['vitara.glb'],carFb,car,0,sc=>{for(const n of['pyora_ev','pyora_eo','pyora_tv','pyora_to'])wheels[n]=sc.getObjectByName(n);door=sc.getObjectByName('ovi_kuljettaja');if(door)door.userData.r0=door.rotation.y;});
const interior=V8.setupInterior(scene), vm=V8.setupViewmodel();
const FREQ={parkano:'98.4',country:'103.7',tekno:'91.1'};
// ---------- jäljet lumessa (decalit, suunta) ----------
const MAXJ=3000; const jg=new THREE.PlaneGeometry(0.3,0.3).rotateX(-Math.PI/2);
const jm={janis:new THREE.InstancedMesh(jg,new THREE.MeshBasicMaterial({map:jalkiT.janis,transparent:true,depthWrite:false}),MAXJ),koira:new THREE.InstancedMesh(jg,new THREE.MeshBasicMaterial({map:jalkiT.koira,transparent:true,depthWrite:false}),MAXJ)};
const jn={janis:0,koira:0},M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),Y=new THREE.Vector3(0,1,0);
for(const k in jm){jm[k].count=0;jm[k].frustumCulled=false;scene.add(jm[k]);}
function addTrack(kind,p){const i=jn[kind]++%MAXJ;Q.setFromAxisAngle(Y,-p.dir);M4.compose(new THREE.Vector3(p.x,height(p.x,p.z)+0.1,p.z),Q,new THREE.Vector3(1,1,1));
  jm[kind].setMatrixAt(i,M4);jm[kind].count=Math.min(MAXJ,jn[kind]);jm[kind].instanceMatrix.needsUpdate=true;}
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
{const box=$('cmds');for(const [k,ic,lab] of [['F','komento_irti','naru'],['1','komento_tanne','tänne'],['2','komento_seuraa','seuraa'],['3','komento_etsi','etsi'],['4','komento_tanne','täällä']]){
  const d=document.createElement('div');d.style.cssText='position:relative;width:64px;text-align:center;font-size:11px;white-space:nowrap';d.innerHTML=`<img src="${G}hud/${ic}.png" style="width:32px;height:32px;image-rendering:pixelated;background:#0006" onerror="this.style.visibility='hidden'"><b style="position:absolute;left:10px;top:0;font-size:13px;color:#ff0">${k}</b><br>${lab}`;
  if(k==='F'){d.id='cmdF';}box.appendChild(d);}}
// ---------- ääni: oikeat tiedostot (ogg/mp3), varana syntetisoitu ----------
let AC=null,A3=null;const buf={};
const play3d=(n,o)=>A3&&buf[n]?A3.play(buf[n],o):null;
const engineStart=()=>({idle:play3d('sfx_vitara_tyhjakaynti_loop',{x:car.x,y:car.y+0.8,z:car.z,gain:.6,loop:true,ref:4,max:400,roll:1.2}),drive:play3d('sfx_vitara_ajo_loop',{x:car.x,y:car.y+0.8,z:car.z,gain:0.001,loop:true,ref:4,max:400,roll:1.2})});
const SND=['sfx_koira_haukku_1','sfx_koira_haukku_2','sfx_koira_haukku_3','sfx_koira_haukku_4','sfx_koira_haukku_5','sfx_koira_haukku_6','sfx_koira_ajo_tiivis','sfx_koira_ajo_harva','sfx_koira_ylosotto','sfx_koira_nuuhkii','sfx_koira_nuuhkii_hidas','sfx_koira_vinkuu','sfx_koira_juoksu_lumi','sfx_haulikko_laukaus','sfx_haulikko_lataus','sfx_askel_lumi_1','sfx_askel_lumi_2','sfx_askel_lumi_3','sfx_askel_lumi_4','sfx_kavely_lumi_loop','sfx_janis_pakoloikka','amb_talvimetsa_tuuli_loop','musiikki_valikko_talvi','sfx_gps_avaus','sfx_gps_sulku','sfx_gps_piippaus','sfx_gps_haukkuindikaattori','sfx_gps_hukka','sfx_hihna_naksahdus','aani_taalla_1','aani_taalla_2','sfx_vitara_ovi_auki','sfx_vitara_ovi_kiinni','sfx_vitara_kaynnistys','sfx_vitara_sammutus','sfx_vitara_tyhjakaynti_loop','sfx_vitara_ajo_loop','sfx_koira_hyppy','amb_korppi_1','amb_korppi_2','amb_tikka_1',...['tanne','etsi','seuraa','irti'].flatMap(k=>['aani_'+k+'_1','aani_'+k+'_2'])];
async function loadSnd(n){for(const e of['ogg','mp3']){try{const r=await fetch(`/aanet/${n}.${e}`);if(!r.ok)continue;buf[n]=await AC.decodeAudioData(await r.arrayBuffer());return;}catch{}}}
function play(n,{gain=1,pan=0,loop=false}={}){if(!AC||gain<=0.001)return null;const g=AC.createGain();g.gain.value=gain;const p=AC.createStereoPanner();p.pan.value=pan;g.connect(p).connect(AC.destination);
  let s;if(!buf[n]&&/pilli|aani_|hihna|gps|vitara|hyppy/.test(n))return null;if(buf[n]){s=AC.createBufferSource();s.buffer=buf[n];s.loop=loop;}else{if(loop)return null;s=AC.createOscillator();s.frequency.value=n.includes('haukku')||n.includes('ajo')?420:n.includes('laukaus')?90:200;s.type='sine';g.gain.value=gain*0.3;g.gain.setTargetAtTime(0,AC.currentTime+0.08,0.04);s.stop(AC.currentTime+0.3);}
  s.connect(g);s.start();return {s,g};}
// ---------- peli ----------
const _hs=hareSpot(Math.random),hare=new Hare({..._hs,seed:Date.now()%1e6|0}), dog=new Dog({x:YARD.x+1,z:YARD.z+1,seed:7,leashed:true});
const pl={x:car.x,z:car.z,yaw:-car.heading,inCar:!!START?.autossa,pitch:0,passi:false,raise:0,raising:false,revealT:0,shells:2,bag:0,moving:false};
// GPS-kanvas CPU-tilassa (willReadFrequently): GPU-kiihdytetty 2D-kanvas tuotti mustan haamukerroksen kompassin alle
const gpsCtx=$('gpsc').getContext('2d',{willReadFrequently:true});let gpsImgT=0;
// Näytetään GPS <img>:nä: näkyvä 2D-kanvas tuotti mustan haamulaatikon kompassin alle (Chromen kompositointi)
let engine=null;let gpsOn=false,gpsMode=0,gpsSpan=800,gpsT=0;const gh={};for(const n of['ajo','seisonta','haukku','hiljaa'])(gh[n]=new Image()).src=G+'hud/gps_haukku_'+n+'.png';const gArrow=new Image();gArrow.src=G+'hud/gps_suunta_nuoli.png';const gDot=new Image();gDot.src=G+'hud/gps_reitti_piste.png';const gpsMap=new Image();let gpsGeo={m_per_px:SIZE/1024,maailma_origo_px:[512,512]};gpsMap.src=G+'hud/gps_kartta.png';fetch(G+'hud/gps_kartta.json').then(r=>r.ok&&r.json()).then(j=>{if(j)gpsGeo=j;}).catch(()=>{});const gi={};for(const n of['pelaaja','koira','koira_ajo','koira_haku','koira_hukka']){gi[n]=new Image();gi[n].src=G+'hud/gps_'+n+'.png';}
let dogJaw=0,ambT=12,shotT=90;let hn=0,dn=0,barkT=0,stepT=0,msgT=0,lastDog=dog.state,shotFlash=0,hareFlushed=false;
for(const p of hare.nightTrail)addTrack('janis',p);
// ---------- autoradio ----------
const CH=[{n:'Parkano Rock',k:'parkano'},{n:'Jalasjärven Country',k:'country'},{n:'Koppelontien Tekno',k:'tekno'}];
const radio={on:false,ch:0,song:0,src:null,out:null,showT:0};
async function rbuf(n){if(!(n in buf)){buf[n]=undefined;await loadSnd(n);}return buf[n];}
function radioOut(){if(radio.out)return radio.out;const hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=300;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=4000;
  const g=AC.createGain();g.gain.value=0.35;const c3=A3.chain({ref:2,max:250,roll:1.6});c3.far=false;hp.connect(lp).connect(g).connect(c3.g);radio.out={hp,g,c3};return radio.out;}
function radioStop(){if(radio.src){radio.src.onended=null;try{radio.src.stop();}catch{}radio.src=null;}}
async function radioPlay(list){radioStop();const tok=radio.tok=(radio.tok||0)+1;
  for(const n of list){const b=await rbuf(n);if(tok!==radio.tok||!radio.on)return;if(!b)continue;
    await new Promise(res=>{const s=AC.createBufferSource();s.buffer=b;s.connect(radioOut().hp);s.onended=res;radio.src=s;s.start();});if(tok!==radio.tok)return;}
  if(tok===radio.tok&&radio.on){const c=CH[radio.ch].k;radio.song=(radio.song+1)%2;radioPlay(['radio_'+c+'_'+(radio.song+1)]);}}
function radioTune(jingle){if(!AC)return;const c=CH[radio.ch].k;radio.showT=2.5;radio.song=0;radioPlay(jingle?['sfx_radio_kanava','radio_'+c+'_tunnus','radio_'+c+'_1']:['radio_'+c+'_1']);}
function radioOff(){radio.tok=(radio.tok||0)+1;radioStop();}
const keys={};addEventListener('keydown',e=>{keys[e.code]=true;
  if(e.code==='Tab')e.preventDefault();
  if(pl.inCar){if(e.code==='KeyR'){radio.on=!radio.on;if(radio.on)radioTune(true);else{radioOff();say('Radio pois');}return;}
    if(e.code==='KeyQ'||e.code==='Tab'){radio.ch=(radio.ch+1)%CH.length;if(radio.on)radioTune(true);else radio.showT=2.5;return;}}
if(e.code==='KeyP'&&!pl.inCar){pl.passi=!pl.passi;say(pl.passi?'Passissa – pysy liikkumatta':'Passi purettu');pl.raise=0;}
  if(gpsMode&&(e.code==='Equal'||e.code==='Minus'||e.code==='NumpadAdd'||e.code==='NumpadSubtract')){gpsSpan=Math.max(150,Math.min(1600,gpsSpan*(e.code.includes('Equal')||e.code.includes('Add')?0.7:1.43)));say('GPS-zoom '+Math.round(gpsSpan)+' m');return;}
  if(e.code==='Equal'||e.code==='Minus'||e.code==='NumpadAdd'||e.code==='NumpadSubtract'){resI=Math.max(0,Math.min(2,resI+(e.code.includes('Equal')||e.code.includes('Add')?1:-1)));[RW,RH]=RES[resI];renderer.setSize(RW,RH,false);say('Resoluutio '+RW+'x'+RH);}
  if(e.code==='KeyG'||e.code==='KeyM'){gpsMode=(gpsMode+1)%3;gpsOn=gpsMode>0;const gd=$('gps');gd.style.display=gpsOn?'block':'none';gd.style.width=gpsMode===2?'calc(50vh*0.8)':'min(24vw,240px)';gd.style.height=gpsMode===2?'50vh':'calc(min(24vw,240px)*1.25)';play(gpsMode===1?'sfx_gps_avaus':gpsMode===0?'sfx_gps_sulku':'sfx_gps_piippaus',{gain:.6});}
  {const C={KeyF:dog.leashed?'irti':'kiinni',Digit1:'tanne',Digit2:'seuraa',Digit3:'etsi',Digit4:'taalla'}[e.code];if(C){const r=dog.command(C,{x:pl.x,z:pl.z},hare);
    const shout=k=>play('aani_'+k+'_'+(1+Math.random()*2|0),{gain:.8});
    if(C==='irti'||C==='kiinni')play('sfx_hihna_naksahdus',{gain:.8});
    if(C==='irti')shout('irti');if(C==='tanne'){shout('tanne');}if(C==='seuraa'){shout('seuraa');}if(C==='etsi'){shout('etsi');}if(C==='taalla')play('aani_taalla_'+(1+Math.random()*2|0),{gain:.9});
    say(r.ok?{irti:'Koira irti – haku!',kiinni:'Koira kytketty',tanne:'Tänne!',seuraa:'Seuraa!',etsi:'Etsi!',taalla:r.jalki?'Tule tänne, täällä! (jälki)':'Tule tänne, täällä!'}[C]:r.syy);}}
  if(e.code==='KeyE'){doorT=1;if(pl.inCar){pl.inCar=false;car.speed=0;play('sfx_vitara_sammutus',{gain:.6});play('sfx_vitara_ovi_auki',{gain:.7});const p=car.exitPos();pl.x=p.x;pl.z=p.z;dog.x=p.x+1;dog.z=p.z;play('sfx_koira_hyppy',{gain:.6});
      if(engine){for(const k in engine)engine[k]?.s.stop();engine=null;}setTimeout(()=>play('sfx_vitara_ovi_kiinni',{gain:.7}),500);say('Nousit autosta');}
    else{const r=car.canEnter({x:pl.x,z:pl.z},dog);if(!r.ok){if(Math.hypot(pl.x-car.x,pl.z-car.z)<3)say(r.syy);}else{pl.inCar=true;pl.passi=false;pl.raise=0;play('sfx_vitara_ovi_auki',{gain:.7});play('sfx_koira_hyppy',{gain:.6});
      setTimeout(()=>{play('sfx_vitara_ovi_kiinni',{gain:.7});play('sfx_vitara_kaynnistys',{gain:.7});setTimeout(()=>{if(pl.inCar&&!engine)engine=engineStart();},1200);},500);say('Autossa – W/S kaasu/jarru, A/D ohjaus, R radio, Q/Tab kanava, E ulos');}}}
  if(e.code==='KeyR'&&!pl.inCar&&pl.shells<2&&vm.reload<=0){pl.shells=2;vm.startReload();play('sfx_haulikko_lataus',{gain:.8});say('Ladattu');}});
addEventListener('keyup',e=>keys[e.code]=false);
function say(t){$('msg').textContent=t;msgT=3;}
const cvs=renderer.domElement;
$('menu').onclick=async()=>{$('menu').style.display='none';cvs.requestPointerLock();if(!AC){AC=new AudioContext();A3=V8.makeAudio3D(AC);await Promise.all(SND.map(loadSnd));
  if(!amb)amb=play('amb_talvimetsa_tuuli_loop',{gain:.21,loop:true});if(!walk)walk=play('sfx_kavely_lumi_loop',{gain:0,loop:true});}
  if(pl.inCar&&!engine){play('sfx_vitara_kaynnistys',{gain:.7});setTimeout(()=>{if(pl.inCar&&!engine)engine=engineStart();},1200);say('Ratissa Yli-Vallintiellä – Löyhingintie → Koppelontie → mökki. E = ulos');}};
let amb,walk; document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement)$('menu').style.display='flex';});
addEventListener('mousemove',e=>{if(!document.pointerLockElement)return;if(pl.inCar){pl.lookYaw=Math.max(-2.62,Math.min(2.62,(pl.lookYaw||0)-e.movementX*0.0025));pl.pitch=Math.max(-0.7,Math.min(0.6,pl.pitch-e.movementY*0.0025));return;}pl.yaw-=e.movementX*0.0025;pl.pitch=Math.max(-1.4,Math.min(1.4,pl.pitch-e.movementY*0.0025));});
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('mouseup',e=>{if(e.button===2){pl.rmb=false;pl.raise=0;pl.raising=false;}});
addEventListener('mousedown',e=>{if(!document.pointerLockElement||pl.inCar)return;if(e.button===2){pl.rmb=true;if(pl.raise<1&&!pl.raising){pl.raising=true;if(!pl.passi)pl.revealT=1;}return;}if(vm.reload>0)return;if(pl.raise<1){if(!pl.raising){pl.raising=true;if(!pl.passi)pl.revealT=1;say(pl.passi?'Nostat aseen hitaasti…':'Nopea nosto');}return;}if(pl.shells<=0){say('Tyhjä – lataa (R)');return;}pl.shells--;shotFlash=0.15;vm.shoot();play('sfx_haulikko_laukaus');
  const dir=new THREE.Vector3();cam.getWorldDirection(dir);
  if(hare.alive){const hits=shotgun({x:cam.position.x,y:cam.position.y,z:cam.position.z},dir,{x:hare.x,y:height(hare.x,hare.z)+0.2,z:hare.z},{radius:0.35});
    if(hits>=KILL_HITS){hare.shoot();pl.bag++;say('Jänis kaatui! ('+hits+' haulia)');}else say(hits?'Haavakko… jänis jatkoi':'Ohi');}});
// HUD-kuvat
const himg=(id,src,fb)=>{const i=$(id);i.onerror=()=>{i.onerror=null;i.src=fb;};i.src=G+src;};
const fbCross=canvasTex(16,16,g=>{g.fillStyle='#f22';g.fillRect(7,2,2,12);g.fillRect(2,7,12,2);}).image.toDataURL();
const fbGun=canvasTex(256,128,g=>{g.fillStyle='#333';g.fillRect(110,20,14,108);g.fillStyle='#6b4423';g.fillRect(100,80,34,48);}).image.toDataURL();
himg('cross','hud/tahtain_16.png',fbCross);
const gunSrc={fp:G+'haulikko_fp.png',naru:G+'haulikko_hihna.png',shot:G+'haulikko_laukaus.png'};himg('gun','haulikko_fp.png',fbGun);
const windArrow=new Image();windArrow.src=G+'hud/tuuli_nuoli_32.png';
const compass=new Image();compass.src=G+'hud/kompassi_256x32.png';
const STATE_FI={[D.NARUSSA]:'narussa',[D.TANNE]:'tänne (odottaa)',[D.SEURAA]:'seuraa',[D.TAALLA]:'täällä (tulee jäljelle)',[D.HAKU]:'haku',[D.YOJALKI]:'yöjälki',[D.YLOSOTTO]:'ylösotto',[D.AJO]:'ajo (haukkuu)',[D.HUKKA]:'hukka'};
const clock=new THREE.Clock();
function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),0.1);
  // pelaaja
  let f=(keys.KeyW?1:0)-(keys.KeyS?1:0),s=(keys.KeyD?1:0)-(keys.KeyA?1:0);
  if(pl.inCar){car.update(dt,{throttle:f,steer:s});car.steer=s;pl.x=car.x;pl.z=car.z;dog.x=car.x;dog.z=car.z;if(engine){const v=Math.min(1,Math.abs(car.speed)/16),r=0.8+0.7*v;for(const k in engine)if(engine[k])engine[k].s.playbackRate.value=r;if(engine.idle)engine.idle.g.gain.value=0.5*(1-v);if(engine.drive)engine.drive.g.gain.value=0.5*v;}f=s=0;}
  if(engine)for(const k in engine)engine[k]?.setPos(car.x,car.y+0.8,car.z);
  if(radio.out){const o=radio.out;o.c3.setPos?.(car.x,car.y+1,car.z);A3.setPos(o.c3,car.x,car.y+1,car.z);const open=doorT>0;o.g.gain.value=pl.inCar?0.35:open?0.25:0.14;o.c3.lp.frequency.value=pl.inCar?18000:open?4000:1300;}
  if(A3){A3.updateListener(cam);ambT-=dt;if(ambT<=0){ambT=15+Math.random()*30;const a=Math.random()*6.28,d=80+Math.random()*250,n=['amb_korppi_1','amb_korppi_2','amb_tikka_1'][Math.random()*3|0];play3d(n,{x:pl.x+Math.cos(a)*d,y:12,z:pl.z+Math.sin(a)*d,gain:1.5,ref:25,max:1500});}
    shotT-=dt;if(shotT<=0){shotT=70+Math.random()*120;const a=Math.random()*6.28,d=600+Math.random()*900;play3d('sfx_haulikko_laukaus',{x:pl.x+Math.cos(a)*d,y:2,z:pl.z+Math.sin(a)*d,gain:3,ref:30,max:4000});}}
  carObj.rotation.order='YXZ';carObj.position.set(car.x,car.y,car.z);carObj.rotation.set(-car.pitch,Math.PI-car.heading,-car.roll);
  for(const n in wheels){const w=wheels[n];if(!w)continue;w.rotation.x+=car.speed*dt/0.33;if(n==='pyora_ev'||n==='pyora_eo')w.rotation.y=(pl.inCar?car.steer||0:0)*0.45;}
  if(door){doorT=Math.max(0,doorT-dt);door.rotation.y=door.userData.r0+Math.sin(doorT*Math.PI)*1.0;}
  pl.moving=!!(f||s);
  if(pl.moving&&pl.passi){pl.passi=false;pl.revealT=2;say('Liikahdit – passi paljastui!');}
  if(pl.moving){pl.raise=0;pl.raising=false;} if(pl.raising){pl.raise=Math.min(1,pl.raise+dt/(pl.passi?1.5:0.3));if(pl.raise>=1)pl.raising=false;}
  pl.revealT=Math.max(0,pl.revealT-dt); const aiming=pl.raise>=1&&!pl.inCar; $('aim').style.display='none'; $('gun').style.display='none'; $('cross').style.display=aiming||pl.inCar?'none':'block';$('vignette').style.opacity=vm.aim*0.9;
  cam.fov=65-10*vm.aim;cam.updateProjectionMatrix();
  $('passi').style.display=pl.passi?'inline-block':'none';
  if(pl.moving){const sp=keys.ShiftLeft?4:1.6;pl.x+=(-Math.sin(pl.yaw)*f+Math.cos(pl.yaw)*s)*sp*dt;pl.z+=(-Math.cos(pl.yaw)*f-Math.sin(pl.yaw)*s)*sp*dt;stepT-=dt;}
  if(walk)walk.g.gain.value=pl.moving?0.4:0;
  interior.g.position.copy(carObj.position);interior.g.rotation.copy(carObj.rotation);interior.g.visible=interior.loaded;
  // Sisänäkymässä ulkokori (vitara_kori, DoubleSide) peitti tuulilasin/ikkunat/radion/lattian 0.2–1.1 m päässä kamerasta → piiloon
  {const kori=carObj.getObjectByName('vitara_kori');if(kori)kori.visible=!(pl.inCar&&interior.loaded);if(interior.extra)interior.extra.visible=pl.inCar;}
  if(pl.inCar){interior.g.updateMatrixWorld();const cp=new THREE.Vector3(0.40,1.15,-0.55);interior.g.localToWorld(cp);cam.position.copy(cp);pl.yaw=-car.heading;cam.rotation.set(pl.pitch,pl.yaw+(pl.lookYaw||0),0);
    if(interior.n.ratti)interior.n.ratti.rotation.z=-(car.steer||0)*1.6;if(interior.n.vaihdekeppi)interior.n.vaihdekeppi.rotation.x=car.speed>0.3?-0.25:car.speed<-0.3?0.25:0;}
  else{pl.lookYaw=0;cam.position.set(pl.x,height(pl.x,pl.z)+1.65,pl.z);cam.rotation.set(pl.pitch,pl.yaw,0);}window._sky.position.copy(cam.position);
  // tekoäly
  const P={x:pl.x,z:pl.z};if(!pl.inCar)dog.update(dt,{hare,player:P});hare.update(dt,{dog:dog.pos,player:P,playerMoving:pl.moving||pl.revealT>0,playerHidden:pl.passi&&pl.revealT<=0});
  if(hare.state===H.PAKO&&!hareFlushed){hareFlushed=true;play3d('sfx_janis_pakoloikka',{x:hare.x,y:height(hare.x,hare.z)+0.3,z:hare.z,gain:1,ref:5,max:400});}
  if(hare.veered&&pl.moving){hare.veered=false;}
  while(hn<hare.trail.length)addTrack('janis',hare.trail[hn++]);while(dn<dog.trail.length){if(dn%2===0)addTrack('koira',dog.trail[dn]);dn++;}
  hareObj.position.set(hare.x,height(hare.x,hare.z),hare.z);hareObj.rotation.y=Math.PI/2-hare.heading;hareObj.rotation.z=hare.alive?0:Math.PI/2;
  const tnow=clock.elapsedTime;V8.animHare(hareObj.userData.n,{t:tnow,spd:hare.alive?hare.speed:0,lying:hare.state===H.MAKUU});
  const dsp=Math.hypot(dog.x-(dog._px??dog.x),dog.z-(dog._pz??dog.z))/Math.max(dt,1e-3);dog._px=dog.x;dog._pz=dog.z;dogJaw=Math.max(0,dogJaw-dt*5);
  if(pl.inCar){interior.g.updateMatrixWorld();const kp=new THREE.Vector3(0,0.58,-1.50);interior.g.localToWorld(kp);dogObj.position.copy(kp);dogObj.rotation.set(0,carObj.rotation.y,0);V8.animDog(dogObj.userData.n,{t:tnow,spd:0,lying:true,jaw:0});}
  else{dogObj.position.set(dog.x,height(dog.x,dog.z),dog.z);dogObj.rotation.set(0,Math.PI-(dog.dir||0),0);V8.animDog(dogObj.userData.n,{t:tnow,spd:dsp,jaw:Math.sin(Math.min(1,dogJaw)*Math.PI),barking:dog.barking,sniff:dog.state===D.HAKU||dog.state===D.YOJALKI});}
  // ääni: kuuluvuus etäisyys + tuuli, panorointi suunnan mukaan
  const vol=audibility(dog.pos,P),rel=Math.atan2(dog.x-pl.x,-(dog.z-pl.z))+pl.yaw,pan=Math.max(-1,Math.min(1,Math.sin(rel)));
  if(dog.state!==lastDog){if(dog.state===D.YLOSOTTO)play3d('sfx_koira_ylosotto',{x:dog.x,y:height(dog.x,dog.z)+0.6,z:dog.z,gain:1.4,ref:15,max:2500});if(dog.state===D.HUKKA){play3d('sfx_koira_vinkuu',{x:dog.x,y:height(dog.x,dog.z)+0.6,z:dog.z,gain:.8,ref:6,max:500});if(gpsOn)play('sfx_gps_hukka',{gain:.5});}if(dog.state===D.AJO&&gpsOn)play('sfx_gps_haukkuindikaattori',{gain:.5});lastDog=dog.state;}
  barkT-=dt;if(barkT<=0){if(dog.barking){const iv=dog.barkInterval(hare);play3d(iv<0.8?'sfx_koira_ajo_tiivis':iv>1.8?'sfx_koira_ajo_harva':'sfx_koira_haukku_'+(1+Math.random()*6|0),{x:dog.x,y:height(dog.x,dog.z)+0.6,z:dog.z,gain:1.2*(0.5+vol),ref:15,max:2500,roll:1});dogJaw=1;barkT=iv*(1.5+Math.random());}
    else if(dog.state===D.YOJALKI||dog.state===D.HAKU){play3d(dog.state===D.HAKU?'sfx_koira_nuuhkii':'sfx_koira_nuuhkii_hidas',{x:dog.x,y:height(dog.x,dog.z)+0.4,z:dog.z,gain:.6,ref:3,max:120,roll:1.5});barkT=6;}else barkT=1;}
  if(pl.moving&&stepT<=0){stepT=0.55;}
  // HUD
  shotFlash-=dt;const g=$('gun'),want=shotFlash>0?gunSrc.shot:dog.leashed?gunSrc.naru:gunSrc.fp;if(!g.src.endsWith(want.slice(G.length))&&g.src.includes('/grafiikka/'))g.src=want;
  g.style.transform=shotFlash>0?'translate(10px,8px)':'';
  const deg=((-pl.yaw*180/Math.PI)%360+360)%360;
  $('tls').innerHTML=`Koira: ${STATE_FI[dog.state]} · kuuluvuus ${(vol*100|0)}%<br>${pl.passi?'paikallaan':'liikkeellä'} · patruunat ${pl.shells}/2 · ase ${pl.raise>=1?'tähtäyksessä':pl.raising?'nousee':'alhaalla'}<br>Suunta ${deg|0}°<br>`;
  const cc=$('comp').getContext('2d');cc.clearRect(0,0,128,32);if(compass.complete&&compass.naturalWidth){const W=compass.naturalWidth,Hh=compass.naturalHeight,x0=((deg/360-0.25)*W+W)%W;cc.drawImage(compass,x0,0,W/2,Hh,0,0,128,32);if(x0>W/2)cc.drawImage(compass,0,0,W/2,Hh,(W-x0)/(W/2)*128,0,128,32);}
  else{cc.fillStyle='#fff';cc.fillText(['P','I','E','L'][Math.round(deg/90)%4],60,20);}
  const wc=$('wind').getContext('2d');wc.clearRect(0,0,32,32);wc.save();wc.translate(16,16);wc.rotate(WIND.dir-(-pl.yaw));
  if(windArrow.complete&&windArrow.naturalWidth)wc.drawImage(windArrow,-16,-16);else{wc.fillStyle='#fff';wc.beginPath();wc.moveTo(0,-14);wc.lineTo(6,10);wc.lineTo(-6,10);wc.fill();}wc.restore();
  $('windt').textContent=`${windFromText()} ${WIND.speed} m/s`;
  $('bag').textContent=pl.bag;
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
    c.fillStyle='#000a';c.fillRect(0,W-30,W,30);c.fillStyle='#fff';c.font='bold 11px monospace';c.fillText(`Koira ${dd<1000?Math.round(dd)+' m':(dd/1000).toFixed(1)+' km'} ${SU} ${Math.round(brg)}°`,4,W-17);c.fillText(STATE_FI[dog.state]+(dog.barking?' · haukkuu':''),4,W-4);c.fillText(Math.round(gpsSpan)+' m',W-48,12);
    if((gpsImgT-=dt)<=0){gpsImgT=0.1;$('gpsi').src=$('gpsc').toDataURL();}
    if(gpsT<=0){gpsT=3;play('sfx_gps_piippaus',{gain:.3});}}
  {const rp=$('radio');rp.style.display='none';if(interior.loaded&&(radio._d!==radio.on+''+radio.ch)){radio._d=radio.on+''+radio.ch;interior.drawRadio(radio.on,CH[radio.ch].n,FREQ[CH[radio.ch].k]);}radio.showT-=dt;$('radioch').textContent=CH[radio.ch].n;$('radioname').style.display=pl.inCar&&radio.showT>0?'block':'none';$('radioname').textContent='📻 '+CH[radio.ch].n;}
  if((msgT-=dt)<=0)$('msg').textContent='';
  updateLeash();{const f=$('cmdF').querySelector('img');const want=G+'hud/'+(dog.leashed?'komento_irti':'komento_kiinni')+'.png';if(!f.src.endsWith(want.slice(G.length)))f.src=want;}
  vm.cam.aspect=cam.aspect;vm.cam.fov=55-8*vm.aim;vm.cam.updateProjectionMatrix();vm.update(dt,{moving:pl.moving,t:tnow,aim:aiming});vm.pivot.visible=!pl.inCar;
  renderer.autoClear=true;renderer.render(scene,cam);renderer.autoClear=false;renderer.clearDepth();if(!pl.inCar)renderer.render(vm.scene,vm.cam);}
loop();
window.__game={radio,pl,car,dog,hare,scene,renderer,cam,THREE,vm,interior,hareObj,dogObj};
