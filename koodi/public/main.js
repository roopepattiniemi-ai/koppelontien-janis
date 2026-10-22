import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Car } from '/logic/car.js';
import { CABIN, YARD } from '/logic/world.js';
import { height, ROAD, FIELD, SIZE, trees, inField, distToRoad, WIND, windFromText } from '/logic/world.js';
import { Hare, H } from '/logic/hare.js';
import { Dog, D } from '/logic/dog.js';
import { audibility } from '/logic/hearing.js';
import { shotgun, KILL_HITS } from '/logic/shot.js';
const G='/grafiikka/', $=id=>document.getElementById(id);
// ---------- renderöinti: matala sisäinen resoluutio, sumu ----------
let RW=640,RH=400;const RES=[[320,200],[640,400],[960,600]];let resI=+(new URLSearchParams(location.search).get('res')??1);[RW,RH]=RES[resI]||RES[1]; const renderer=new THREE.WebGLRenderer({antialias:false});
renderer.setPixelRatio(1); renderer.setSize(RW,RH,false); document.body.prepend(renderer.domElement);
const scene=new THREE.Scene(); scene.background=new THREE.Color(0xb0bed2); scene.fog=new THREE.Fog(0xb0bed2,15,170);
const cam=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,0.1,600); cam.rotation.order='YXZ';
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
const seg=120, tg=new THREE.PlaneGeometry(SIZE,SIZE,seg,seg); tg.rotateX(-Math.PI/2);
const pa=tg.attributes.position; for(let i=0;i<pa.count;i++)pa.setY(i,height(pa.getX(i),pa.getZ(i))); tg.computeVertexNormals();
lumiT.repeat.set(SIZE/8,SIZE/8); scene.add(new THREE.Mesh(tg,new THREE.MeshLambertMaterial({map:lumiT,flatShading:true,emissive:0x1a1e26})));
{const fg=new THREE.PlaneGeometry(FIELD.x1-FIELD.x0,FIELD.z1-FIELD.z0,30,24);fg.rotateX(-Math.PI/2);fg.translate((FIELD.x0+FIELD.x1)/2,0,(FIELD.z0+FIELD.z1)/2);
 const p=fg.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,height(p.getX(i),p.getZ(i))+0.05);fg.computeVertexNormals();peltoT.repeat.set(30,24);
 scene.add(new THREE.Mesh(fg,new THREE.MeshLambertMaterial({map:peltoT,polygonOffset:true,polygonOffsetFactor:-1})));}
{const v=[],uv=[];let acc=0;for(let i=0;i<ROAD.length-1;i++){const[ax,az]=ROAD[i],[bx,bz]=ROAD[i+1],L=Math.hypot(bx-ax,bz-az),nx=-(bz-az)/L*3,nz=(bx-ax)/L*3,n=Math.ceil(L/6);
  for(let k=0;k<n;k++){const P=t=>[ax+(bx-ax)*t,az+(bz-az)*t],[x0,z0]=P(k/n),[x1,z1]=P((k+1)/n),y=(x,z)=>height(x,z)+0.08,u0=acc/6,u1=(acc+L/n)/6;acc+=L/n;
   const q=[[x0+nx,z0+nz,0,u0],[x0-nx,z0-nz,1,u0],[x1-nx,z1-nz,1,u1],[x1+nx,z1+nz,0,u1]];for(const j of[0,1,2,0,2,3]){const[x,z,a,b]=q[j];v.push(x,y(x,z),z);uv.push(a,b);}}}
 const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.Float32BufferAttribute(v,3));rg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));rg.computeVertexNormals();
 scene.add(new THREE.Mesh(rg,new THREE.MeshLambertMaterial({map:tieT,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2})));}
// puut: billboard-spritet
const sprMat={kuusi:new THREE.SpriteMaterial({map:kuusiT,alphaTest:0.5}),koivu:new THREE.SpriteMaterial({map:koivuT,alphaTest:0.5})};
for(const t of trees()){const s=new THREE.Sprite(sprMat[t.kind]);const h=(t.kind==='kuusi'?9:11)*t.s;s.scale.set(h/2,h,1);s.position.set(t.x,height(t.x,t.z)+h/2-0.2,t.z);scene.add(s);}
// ---------- eläimet: GLB tai varamuoto ----------
function animal(file,fb){const g=new THREE.Group();g.add(fb);scene.add(g);
  new GLTFLoader().load(G+'mallit/'+file,gl=>{gl.scene.traverse(o=>{if(o.isMesh&&o.geometry.attributes.color){o.material.vertexColors=true;}});g.clear();g.add(gl.scene);},undefined,()=>{});return g;}
const box=(w,h,d,c,y)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color:c}));m.position.y=y;return m;};
const hareObj=animal('janis.glb',box(0.25,0.3,0.5,0xf4f6f8,0.15)), dogObj=animal('ajokoira.glb',box(0.3,0.55,0.9,0xa0582a,0.4));
// ---------- mökki + Vitara: GLB jos löytyy, muuten laatikkomalli ----------
function model(files,fb,pos,rot,onLoad){const g=new THREE.Group();g.add(fb);g.position.set(pos.x,height(pos.x,pos.z),pos.z);g.rotation.y=rot;scene.add(g);
  (function next(i){if(i>=files.length)return;new GLTFLoader().load(G+'mallit/'+files[i],gl=>{gl.scene.traverse(o=>{if(o.isMesh&&o.geometry.attributes.color)o.material.vertexColors=true;});g.clear();g.add(gl.scene);onLoad&&onLoad(gl.scene);},undefined,()=>next(i+1));})(0);return g;}
const cabinFb=new THREE.Group();{const w=box(8,3,6,0x9a2a20,1.5);cabinFb.add(w);for(const[x,z]of[[-4,-3],[4,-3],[-4,3],[4,3]]){const c=box(0.3,3,0.3,0xffffff,1.5);c.position.x=x;c.position.z=z;cabinFb.add(c);}
  const r=new THREE.Mesh(new THREE.ConeGeometry(6.2,2.2,4),new THREE.MeshLambertMaterial({color:0xf4f6fa,flatShading:true}));r.position.y=4.1;r.rotation.y=Math.PI/4;r.scale.z=0.8;cabinFb.add(r);
  const d=box(1,2,0.1,0x5a3a20,1);d.position.z=3.05;cabinFb.add(d);}
model(['mokki.glb'],cabinFb,CABIN,CABIN.rot);
const car=new Car({x:YARD.x+6,z:YARD.z-2,heading:Math.PI/2});
const carFb=new THREE.Group();{carFb.add(box(1.7,1.1,3.6,0x2f4f6f,0.85));const t=box(1.6,0.8,2.2,0x2f4f6f,1.75);t.position.z=0.3;carFb.add(t);const w=box(1.62,0.5,0.1,0x223344,1.75);w.position.z=-0.82;carFb.add(w);
  for(const[x,z]of[[-0.85,-1.2],[0.85,-1.2],[-0.85,1.2],[0.85,1.2]]){const c=new THREE.Mesh(new THREE.CylinderGeometry(0.36,0.36,0.25,8),new THREE.MeshLambertMaterial({color:0x111111}));c.rotation.z=Math.PI/2;c.position.set(x,0.36,z);carFb.add(c);}}
const wheels={};let door=null,doorT=0;
const carObj=model(['vitara.glb'],carFb,car,0,sc=>{for(const n of['pyora_ev','pyora_eo','pyora_tv','pyora_to'])wheels[n]=sc.getObjectByName(n);door=sc.getObjectByName('ovi_kuljettaja');if(door)door.userData.r0=door.rotation.y;});
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
function updateLeash(){leash.visible=dog.leashed&&!pl.inCar;dogObj.visible=!pl.inCar;carObj.visible=!pl.inCar;$('gun').style.visibility=pl.inCar?'hidden':'visible';if(!leash.visible)return;
  _a.set(0,-0.42,-0.5).applyQuaternion(cam.quaternion).add(cam.position); // käsi: kuvan alareunan keskikohta (256,256)
  _b.set(dog.x,height(dog.x,dog.z)+0.55,dog.z);_d.subVectors(_b,_a);const L=_d.length();_v.subVectors(cam.position,_a);_s.crossVectors(_d,_v).normalize().multiplyScalar(0.02);
  const p=leashGeo.attributes.position;p.setXYZ(0,_a.x-_s.x,_a.y-_s.y,_a.z-_s.z);p.setXYZ(1,_a.x+_s.x,_a.y+_s.y,_a.z+_s.z);p.setXYZ(2,_b.x+_s.x,_b.y+_s.y,_b.z+_s.z);p.setXYZ(3,_b.x-_s.x,_b.y-_s.y,_b.z-_s.z);p.needsUpdate=true;
  const u=leashGeo.attributes.uv;u.setY(2,L/0.15);u.setY(3,L/0.15);u.needsUpdate=true;}
{const box=$('cmds');for(const [k,ic,lab] of [['F','komento_irti','naru'],['1','komento_tanne','tänne'],['2','komento_seuraa','seuraa'],['3','komento_etsi','etsi'],['4','komento_tanne','täällä']]){
  const d=document.createElement('div');d.style.cssText='position:relative;width:64px;text-align:center;font-size:11px;white-space:nowrap';d.innerHTML=`<img src="${G}hud/${ic}.png" style="width:32px;height:32px;image-rendering:pixelated;background:#0006" onerror="this.style.visibility='hidden'"><b style="position:absolute;left:10px;top:0;font-size:13px;color:#ff0">${k}</b><br>${lab}`;
  if(k==='F'){d.id='cmdF';}box.appendChild(d);}}
// ---------- ääni: oikeat tiedostot (ogg/mp3), varana syntetisoitu ----------
let AC=null;const buf={};
const SND=['sfx_koira_haukku_1','sfx_koira_haukku_2','sfx_koira_haukku_3','sfx_koira_haukku_4','sfx_koira_haukku_5','sfx_koira_haukku_6','sfx_koira_ajo_tiivis','sfx_koira_ajo_harva','sfx_koira_ylosotto','sfx_koira_nuuhkii','sfx_koira_nuuhkii_hidas','sfx_koira_vinkuu','sfx_koira_juoksu_lumi','sfx_haulikko_laukaus','sfx_haulikko_lataus','sfx_askel_lumi_1','sfx_askel_lumi_2','sfx_askel_lumi_3','sfx_askel_lumi_4','sfx_kavely_lumi_loop','sfx_janis_pakoloikka','amb_talvimetsa_tuuli_loop','musiikki_valikko_talvi','sfx_gps_avaus','sfx_gps_sulku','sfx_gps_piippaus','sfx_gps_haukkuindikaattori','sfx_gps_hukka','sfx_hihna_naksahdus','aani_taalla_1','aani_taalla_2','sfx_vitara_ovi_auki','sfx_vitara_ovi_kiinni','sfx_vitara_kaynnistys','sfx_vitara_sammutus','sfx_vitara_tyhjakaynti_loop','sfx_vitara_ajo_loop','sfx_koira_hyppy',...['tanne','etsi','seuraa','irti'].flatMap(k=>['aani_'+k+'_1','aani_'+k+'_2'])];
async function loadSnd(n){for(const e of['ogg','mp3']){try{const r=await fetch(`/aanet/${n}.${e}`);if(!r.ok)continue;buf[n]=await AC.decodeAudioData(await r.arrayBuffer());return;}catch{}}}
function play(n,{gain=1,pan=0,loop=false}={}){if(!AC||gain<=0.001)return null;const g=AC.createGain();g.gain.value=gain;const p=AC.createStereoPanner();p.pan.value=pan;g.connect(p).connect(AC.destination);
  let s;if(!buf[n]&&/pilli|aani_|hihna|gps|vitara|hyppy/.test(n))return null;if(buf[n]){s=AC.createBufferSource();s.buffer=buf[n];s.loop=loop;}else{if(loop)return null;s=AC.createOscillator();s.frequency.value=n.includes('haukku')||n.includes('ajo')?420:n.includes('laukaus')?90:200;s.type='sine';g.gain.value=gain*0.3;g.gain.setTargetAtTime(0,AC.currentTime+0.08,0.04);s.stop(AC.currentTime+0.3);}
  s.connect(g);s.start();return {s,g};}
// ---------- peli ----------
const hare=new Hare({x:60,z:-60,seed:Date.now()%1e6|0}), dog=new Dog({x:YARD.x+1,z:YARD.z+1,seed:7,leashed:true});
const pl={x:YARD.x,z:YARD.z+2,yaw:Math.PI*0.75,inCar:false,pitch:0,passi:false,raise:0,raising:false,revealT:0,shells:2,bag:0,moving:false};
let engine=null;let gpsOn=false,gpsT=0;const gi={};for(const n of['pelaaja','koira','koira_ajo','koira_haku','koira_hukka']){gi[n]=new Image();gi[n].src=G+'hud/gps_'+n+'.png';}
let hn=0,dn=0,barkT=0,stepT=0,msgT=0,lastDog=dog.state,shotFlash=0,hareFlushed=false;
for(const p of hare.nightTrail)addTrack('janis',p);
// ---------- autoradio ----------
const CH=[{n:'Parkano Rock',k:'parkano'},{n:'Jalasjärven Country',k:'country'},{n:'Koppelontien Tekno',k:'tekno'}];
const radio={on:false,ch:0,song:0,src:null,out:null,showT:0};
async function rbuf(n){if(!(n in buf)){buf[n]=undefined;await loadSnd(n);}return buf[n];}
function radioOut(){if(radio.out)return radio.out;const hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=300;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=4000;
  const g=AC.createGain();g.gain.value=0.35;hp.connect(lp).connect(g).connect(AC.destination);radio.out={hp,g};return radio.out;}
function radioStop(){if(radio.src){radio.src.onended=null;try{radio.src.stop();}catch{}radio.src=null;}}
async function radioPlay(list){radioStop();const tok=radio.tok=(radio.tok||0)+1;
  for(const n of list){const b=await rbuf(n);if(tok!==radio.tok||!radio.on||!pl.inCar)return;if(!b)continue;
    await new Promise(res=>{const s=AC.createBufferSource();s.buffer=b;s.connect(radioOut().hp);s.onended=res;radio.src=s;s.start();});if(tok!==radio.tok)return;}
  if(tok===radio.tok&&radio.on&&pl.inCar){const c=CH[radio.ch].k;radio.song=(radio.song+1)%2;radioPlay(['radio_'+c+'_'+(radio.song+1)]);}}
function radioTune(jingle){if(!AC)return;const c=CH[radio.ch].k;radio.showT=2.5;radio.song=0;radioPlay(jingle?['sfx_radio_kanava','radio_'+c+'_tunnus','radio_'+c+'_1']:['radio_'+c+'_1']);}
function radioOff(){radio.tok=(radio.tok||0)+1;radioStop();}
const keys={};addEventListener('keydown',e=>{keys[e.code]=true;
  if(e.code==='Tab')e.preventDefault();
  if(pl.inCar){if(e.code==='KeyR'){radio.on=!radio.on;if(radio.on)radioTune(true);else{radioOff();say('Radio pois');}return;}
    if(e.code==='KeyQ'||e.code==='Tab'){radio.ch=(radio.ch+1)%CH.length;if(radio.on)radioTune(true);else radio.showT=2.5;return;}}
if(e.code==='KeyP'){pl.passi=!pl.passi;say(pl.passi?'Passissa – pysy liikkumatta':'Passi purettu');pl.raise=0;}
  if(e.code==='Equal'||e.code==='Minus'||e.code==='NumpadAdd'||e.code==='NumpadSubtract'){resI=Math.max(0,Math.min(2,resI+(e.code.includes('Equal')||e.code.includes('Add')?1:-1)));[RW,RH]=RES[resI];renderer.setSize(RW,RH,false);say('Resoluutio '+RW+'x'+RH);}
  if(e.code==='KeyG'||e.code==='KeyM'){gpsOn=!gpsOn;$('gps').style.display=gpsOn?'block':'none';play(gpsOn?'sfx_gps_avaus':'sfx_gps_sulku',{gain:.6});}
  {const C={KeyF:dog.leashed?'irti':'kiinni',Digit1:'tanne',Digit2:'seuraa',Digit3:'etsi',Digit4:'taalla'}[e.code];if(C){const r=dog.command(C,{x:pl.x,z:pl.z},hare);
    const shout=k=>play('aani_'+k+'_'+(1+Math.random()*2|0),{gain:.8});
    if(C==='irti'||C==='kiinni')play('sfx_hihna_naksahdus','aani_taalla_1','aani_taalla_2','sfx_vitara_ovi_auki','sfx_vitara_ovi_kiinni','sfx_vitara_kaynnistys','sfx_vitara_sammutus','sfx_vitara_tyhjakaynti_loop','sfx_vitara_ajo_loop','sfx_koira_hyppy',{gain:.8});
    if(C==='irti')shout('irti');if(C==='tanne'){shout('tanne');}if(C==='seuraa'){shout('seuraa');}if(C==='etsi'){shout('etsi');}if(C==='taalla')play('aani_taalla_'+(1+Math.random()*2|0),{gain:.9});
    say(r.ok?{irti:'Koira irti – haku!',kiinni:'Koira kytketty',tanne:'Tänne!',seuraa:'Seuraa!',etsi:'Etsi!',taalla:r.jalki?'Tule tänne, täällä! (jälki)':'Tule tänne, täällä!'}[C]:r.syy);}}
  if(e.code==='KeyE'){doorT=1;if(pl.inCar){pl.inCar=false;car.speed=0;radioOff();play('sfx_vitara_sammutus',{gain:.6});play('sfx_vitara_ovi_auki',{gain:.7});const p=car.exitPos();pl.x=p.x;pl.z=p.z;dog.x=p.x+1;dog.z=p.z;play('sfx_koira_hyppy',{gain:.6});
      if(engine){for(const k in engine)engine[k]?.s.stop();engine=null;}setTimeout(()=>play('sfx_vitara_ovi_kiinni',{gain:.7}),500);say('Nousit autosta');}
    else{const r=car.canEnter({x:pl.x,z:pl.z},dog);if(!r.ok){if(Math.hypot(pl.x-car.x,pl.z-car.z)<3)say(r.syy);}else{pl.inCar=true;pl.passi=false;pl.raise=0;play('sfx_vitara_ovi_auki',{gain:.7});play('sfx_koira_hyppy',{gain:.6});
      setTimeout(()=>{play('sfx_vitara_ovi_kiinni',{gain:.7});play('sfx_vitara_kaynnistys',{gain:.7});setTimeout(()=>{if(pl.inCar&&!engine)engine={idle:play('sfx_vitara_tyhjakaynti_loop',{gain:.5,loop:true}),drive:play('sfx_vitara_ajo_loop',{gain:0.001,loop:true})};},1200);},500);say('Autossa – W/S kaasu/jarru, A/D ohjaus, R radio, Q/Tab kanava, E ulos');if(radio.on)setTimeout(()=>{if(pl.inCar)radioTune(false);},1800);}}}
  if(e.code==='KeyR'&&pl.shells<2){pl.shells=2;play('sfx_haulikko_lataus',{gain:.8});say('Ladattu');}});
addEventListener('keyup',e=>keys[e.code]=false);
function say(t){$('msg').textContent=t;msgT=3;}
const cvs=renderer.domElement;
$('menu').onclick=async()=>{$('menu').style.display='none';cvs.requestPointerLock();if(!AC){AC=new AudioContext();await Promise.all(SND.map(loadSnd));
  if(!amb)amb=play('amb_talvimetsa_tuuli_loop',{gain:.21,loop:true});if(!walk)walk=play('sfx_kavely_lumi_loop',{gain:0,loop:true});}};
let amb,walk; document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement)$('menu').style.display='flex';});
addEventListener('mousemove',e=>{if(!document.pointerLockElement)return;pl.yaw-=e.movementX*0.0025;pl.pitch=Math.max(-1.4,Math.min(1.4,pl.pitch-e.movementY*0.0025));});
addEventListener('mousedown',()=>{if(!document.pointerLockElement||pl.inCar)return;if(pl.raise<1){if(!pl.raising){pl.raising=true;if(!pl.passi)pl.revealT=1;say(pl.passi?'Nostat aseen hitaasti…':'Nopea nosto');}return;}if(pl.shells<=0){say('Tyhjä – lataa (R)');return;}pl.shells--;shotFlash=0.15;play('sfx_haulikko_laukaus');
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
  if(pl.inCar){car.update(dt,{throttle:f,steer:s});car.steer=s;pl.x=car.x;pl.z=car.z;dog.x=car.x;dog.z=car.z;if(engine){const v=Math.min(1,Math.abs(car.speed)/16),r=0.8+0.7*v;for(const k in engine)if(engine[k])engine[k].s.playbackRate.value=r;if(engine.idle)engine.idle.g.gain.value=0.5*(1-v);if(engine.drive)engine.drive.g.gain.value=0.5*v;if(radio.out)radio.out.g.gain.value=0.35-0.1*v;}f=s=0;}
  carObj.position.set(car.x,height(car.x,car.z),car.z);carObj.rotation.y=Math.PI-car.heading;
  for(const n in wheels){const w=wheels[n];if(!w)continue;w.rotation.x+=car.speed*dt/0.33;if(n==='pyora_ev'||n==='pyora_eo')w.rotation.y=(pl.inCar?car.steer||0:0)*0.45;}
  if(door){doorT=Math.max(0,doorT-dt);door.rotation.y=door.userData.r0+Math.sin(doorT*Math.PI)*1.0;}
  pl.moving=!!(f||s);
  if(pl.moving&&pl.passi){pl.passi=false;pl.revealT=2;say('Liikahdit – passi paljastui!');}
  if(pl.moving){pl.raise=0;pl.raising=false;} if(pl.raising){pl.raise=Math.min(1,pl.raise+dt/(pl.passi?1.5:0.3));if(pl.raise>=1)pl.raising=false;}
  pl.revealT=Math.max(0,pl.revealT-dt); const aiming=pl.raise>=1; $('aim').style.display=aiming?'block':'none'; $('gun').style.display=aiming?'none':'block'; $('cross').style.display=aiming?'none':'block';
  $('passi').style.display=pl.passi?'inline-block':'none';
  if(pl.moving){const sp=keys.ShiftLeft?4:1.6;pl.x+=(-Math.sin(pl.yaw)*f+Math.cos(pl.yaw)*s)*sp*dt;pl.z+=(-Math.cos(pl.yaw)*f-Math.sin(pl.yaw)*s)*sp*dt;stepT-=dt;}
  if(walk)walk.g.gain.value=pl.moving?0.4:0;
  cam.position.set(pl.x,height(pl.x,pl.z)+(pl.inCar?1.45:1.65),pl.z);if(pl.inCar){pl.yaw=-car.heading;}cam.rotation.set(pl.pitch,pl.yaw,0);window._sky.position.copy(cam.position);
  // tekoäly
  const P={x:pl.x,z:pl.z};if(!pl.inCar)dog.update(dt,{hare,player:P});hare.update(dt,{dog:dog.pos,player:P,playerMoving:pl.moving||pl.revealT>0,playerHidden:pl.passi&&pl.revealT<=0});
  if(hare.state===H.PAKO&&!hareFlushed){hareFlushed=true;play('sfx_janis_pakoloikka',{gain:audibility(hare.pos,P)});}
  if(hare.veered&&pl.moving){hare.veered=false;}
  while(hn<hare.trail.length)addTrack('janis',hare.trail[hn++]);while(dn<dog.trail.length){if(dn%2===0)addTrack('koira',dog.trail[dn]);dn++;}
  hareObj.position.set(hare.x,height(hare.x,hare.z),hare.z);hareObj.rotation.y=Math.PI/2-hare.heading;hareObj.rotation.z=hare.alive?0:Math.PI/2;
  dogObj.position.set(dog.x,height(dog.x,dog.z),dog.z);dogObj.rotation.y=Math.PI-(dog.dir||0);
  // ääni: kuuluvuus etäisyys + tuuli, panorointi suunnan mukaan
  const vol=audibility(dog.pos,P),rel=Math.atan2(dog.x-pl.x,-(dog.z-pl.z))+pl.yaw,pan=Math.max(-1,Math.min(1,Math.sin(rel)));
  if(dog.state!==lastDog){if(dog.state===D.YLOSOTTO)play('sfx_koira_ylosotto',{gain:vol,pan});if(dog.state===D.HUKKA){play('sfx_koira_vinkuu',{gain:vol*.6,pan});if(gpsOn)play('sfx_gps_hukka',{gain:.5});}if(dog.state===D.AJO&&gpsOn)play('sfx_gps_haukkuindikaattori',{gain:.5});lastDog=dog.state;}
  barkT-=dt;if(barkT<=0){if(dog.barking){const iv=dog.barkInterval(hare);play(iv<0.8?'sfx_koira_ajo_tiivis':iv>1.8?'sfx_koira_ajo_harva':'sfx_koira_haukku_'+(1+Math.random()*6|0),{gain:vol,pan});barkT=iv*(1.5+Math.random());}
    else if(dog.state===D.YOJALKI||dog.state===D.HAKU){play(dog.state===D.HAKU?'sfx_koira_nuuhkii':'sfx_koira_nuuhkii_hidas',{gain:vol*0.5,pan});barkT=6;}else barkT=1;}
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
  if(gpsOn){gpsT-=dt;const c=$('gpsc').getContext('2d'),S=128/800;c.fillStyle='#9ab08a';c.fillRect(0,0,128,128);
    const m=(x,z)=>[64+(x-pl.x)*S,64+(z-pl.z)*S];c.strokeStyle='#6b5a3a';c.lineWidth=2;c.beginPath();ROAD.forEach(([x,z],i)=>{const[a,b]=m(x,z);i?c.lineTo(a,b):c.moveTo(a,b);});c.stroke();
    const[fx,fz]=m(FIELD.x0,FIELD.z0);c.fillStyle='#d8dcc8';c.fillRect(fx,fz,(FIELD.x1-FIELD.x0)*S,(FIELD.z1-FIELD.z0)*S);
    const ic=(img,x,y,rot,col)=>{c.save();c.translate(x,y);c.rotate(rot);if(img.complete&&img.naturalWidth)c.drawImage(img,-6,-6,12,12);else{c.fillStyle=col;c.fillRect(-3,-3,6,6);}c.restore();};
    const di=dog.state===D.AJO?gi.koira_ajo:dog.state===D.HUKKA?gi.koira_hukka:dog.state===D.HAKU?gi.koira_haku:gi.koira;c.fillStyle='#000';c.font='9px monospace';c.fillText(STATE_FI[dog.state],3,124);
    const[dx,dz]=m(dog.x,dog.z);ic(di,Math.max(4,Math.min(124,dx)),Math.max(4,Math.min(124,dz)),0,dog.barking?'#f33':'#a52');ic(gi.pelaaja,64,64,-pl.yaw,'#00f');
    if(gpsT<=0){gpsT=3;play('sfx_gps_piippaus',{gain:.3});}}
  {const rp=$('radio');rp.style.display=pl.inCar&&radio.on?'block':'none';radio.showT-=dt;$('radioch').textContent=CH[radio.ch].n;$('radioname').style.display=pl.inCar&&radio.showT>0?'block':'none';$('radioname').textContent='📻 '+CH[radio.ch].n;}
  if((msgT-=dt)<=0)$('msg').textContent='';
  updateLeash();{const f=$('cmdF').querySelector('img');const want=G+'hud/'+(dog.leashed?'komento_irti':'komento_kiinni')+'.png';if(!f.src.endsWith(want.slice(G.length)))f.src=want;}
  renderer.render(scene,cam);}
loop();
window.__game={pl,car,dog};
