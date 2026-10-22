// v0.9: riistaeläimet, linnut, heinikko, kivääri + kiikarit (viewmodel ja overlayt). GLB jos löytyy, muuten varamuoto.
import * as THREE from 'three';
import { inBounds, BOUND, clampB } from '/logic/bounds.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Critter } from '/logic/wild.js';
const G='/grafiikka/';const loader=new GLTFLoader();
export const missing=[];window.__puuttuvat=missing;
const vc=s=>s.traverse(o=>{if(o.isMesh){if(o.geometry.attributes.color)o.material.vertexColors=true;o.material.flatShading=true;}});
// lataa mallin ryhmään; varamuoto näkyy kunnes/jos GLB ei aukea. userData.n = nimetyt nodet
export function loadModel(path,fb,onLoad){const g=new THREE.Group();g.add(fb);g.userData.n={};
  loader.load(G+path,gl=>{vc(gl.scene);g.clear();g.add(gl.scene);gl.scene.traverse(o=>{if(o.name)g.userData.n[o.name]=o;});onLoad&&onLoad(gl.scene,g);},undefined,()=>{if(!missing.includes(path))missing.push(path);});return g;}
const lam=c=>new THREE.MeshLambertMaterial({color:c});
const boxM=(w,h,d,c,y=h/2,z=0)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),lam(c));m.position.set(0,y,z);return m;};
const fbGroup=(...ms)=>{const g=new THREE.Group();ms.forEach(m=>g.add(m));return g;};
const FB={kettu:()=>fbGroup(boxM(0.18,0.2,0.55,0xc0581c,0.3),boxM(0.12,0.12,0.15,0xc0581c,0.42,0.3)),
  peura:()=>fbGroup(boxM(0.35,0.45,1.1,0x8a6a4a,0.95),boxM(0.15,0.4,0.15,0x8a6a4a,1.25,0.5)),
  orava:()=>fbGroup(boxM(0.08,0.1,0.2,0xa0522d,0.06),boxM(0.06,0.14,0.06,0xa0522d,0.13,-0.1)),
  teeri:()=>fbGroup(boxM(0.18,0.18,0.45,0x1a1a22,0.2)),korppi:()=>fbGroup(boxM(0.15,0.15,0.5,0x111111,0.18))};
// ---------- animaatio ----------
function animQuad(n,{t,spd,kind}){if(!n)return;const run=spd>2.5,a=spd<0.05?0:run?(kind==='orava'?0.5:0.6):(kind==='peura'?0.25:0.3),f=run?spd*1.6:spd*5;
  const s=Math.sin(t*f),c=Math.sin(t*f+Math.PI);const L=(k,v)=>{if(n[k])n[k].rotation.x=v;};
  if(run){L('jalka_ev',s*a);L('jalka_eo',Math.sin(t*f+0.2)*a);L('jalka_tv',c*a);L('jalka_to',Math.sin(t*f+Math.PI+0.2)*a);if(n.runko)n.runko.rotation.x=s*0.08;}
  else{L('jalka_ev',s*a);L('jalka_to',s*a);L('jalka_eo',c*a);L('jalka_tv',c*a);if(n.runko)n.runko.rotation.x=0;}
  if(n.paa)n.paa.rotation.x=spd<0.05?0.15*Math.sin(t*0.7):0.05*s;
  if(n.hanta)n.hanta.rotation.x=kind==='peura'&&run?0.8:kind==='kettu'&&run?0.2:0.1*s;}
function animBird(n,{t,fly,kind,seed=0}){if(!n)return;const fv=n.siipi_v,fo=n.siipi_o;
  if(fly){const amp=kind==='teeri'?0.6:0.45,hz=kind==='teeri'?6:3,glide=kind==='korppi'&&Math.sin(t*0.5+seed)>0.3;const z=glide?0.1:Math.sin(t*hz*6.28+seed)*amp;
    for(const[w,sg]of[[fv,1],[fo,-1]])if(w){w.rotation.order='ZYX';w.rotation.y=-sg*Math.PI/2;w.rotation.z=sg*z;}
    for(const k of['jalka_v','jalka_o'])if(n[k])n[k].rotation.x=1.3;if(n.pyrsto)n.pyrsto.rotation.x=0;}
  else{for(const w of[fv,fo])if(w)w.rotation.set(0,0,0);for(const k of['jalka_v','jalka_o'])if(n[k])n[k].rotation.x=0.3;if(n.paa)n.paa.rotation.x=0.15*Math.max(0,Math.sin(t*1.3+seed));}}
// ---------- riista + linnut ----------
export const FLUSH={koira:15,ihminen:25};
export const COUNTS={kettu:2,peura:6,orava:8,teeriParvet:2,teeriParvessa:6,korppi:6,tiainen:12};
export function setupWildlife(scene,{height,isForest,trees,rand=Math.random,play3d=()=>{},aiInterval=()=>0}){
  const W={critters:[],birds:[],targets:[]};
  const spot=(ok,cx=0,cz=0,R=500)=>{for(let i=0;i<400;i++){const x=cx+(rand()*2-1)*R,z=cz+(rand()*2-1)*R;if(inBounds(x,z,20)&&ok(x,z))return{x,z};}return{x:cx,z:cz};};
  const add=(kind,n)=>{for(let i=0;i<n;i++){const p=spot((x,z)=>isForest(x,z)&&Math.hypot(x,z)>60),c=new Critter(kind,{...p,seed:(rand()*1e6)|0});c.obj=loadModel('mallit/elaimet/'+kind+'.glb',FB[kind]());scene.add(c.obj);c.tn=0;W.critters.push(c);
    W.targets.push({kind,c,get alive(){return c.alive;},pos:()=>({x:c.x,y:height(c.x,c.z)+(kind==='peura'?0.9:kind==='kettu'?0.3:0.08),z:c.z}),r:kind==='peura'?0.45:kind==='kettu'?0.22:0.08,shoot:()=>c.shoot()});}};
  add('kettu',COUNTS.kettu);add('peura',COUNTS.peura);add('orava',COUNTS.orava);
  // linnut: teeriparvi koivussa, korpit kiertelevät, tiaiset (pienet varamuodot)
  const koivut=trees.filter(t=>t.model?.includes('koivu')||t.kind==='koivu');
  const perch=()=>{const t=koivut.length?koivut[(rand()*koivut.length)|0]:{x:spot(isForest).x,z:0};return{x:t.x+(rand()-.5)*2,z:t.z+(rand()-.5)*2,y:height(t.x,t.z)+5+rand()*3};};
  W.flocks=[];for(let f=0;f<COUNTS.teeriParvet;f++){let P0=perch();for(let k=0;k<30&&W.flocks.some(F=>Math.hypot(F.home.x-P0.x,F.home.z-P0.z)<300);k++)P0=perch();
  if(f%2===1){const g=spot(isForest);P0={x:g.x,z:g.z,y:height(g.x,g.z)};}// joka toinen parvi maassa / lumikiepissä
  const F={state:'istuu',t:0,target:null,home:P0,sndT:10+rand()*20,ground:f%2===1,single:rand()<0.5};W.flocks.push(F);for(let i=0;i<COUNTS.teeriParvessa;i++){const b={F,kind:'teeri',x:P0.x+(rand()-.5)*6,z:P0.z+(rand()-.5)*6,y:f%2===1?P0.y:P0.y+rand()*2,kieppi:f%2===1&&rand()<0.5,fly:false,alive:true,seed:rand()*9,vx:0,vy:0,vz:0,heading:rand()*6.28};
    b.obj=loadModel('mallit/elaimet/teeri.glb',FB.teeri());scene.add(b.obj);W.birds.push(b);}}
  W.flock=W.flocks[0];
  for(let i=0;i<COUNTS.korppi;i++){const b={kind:'korppi',cx:(rand()-.5)*800,cz:(rand()-.5)*800,R:60+rand()*80,y:35+rand()*20,ph:rand()*6.28,w:0.08+rand()*0.06,fly:true,alive:true,seed:rand()*9};b.obj=loadModel('mallit/elaimet/korppi.glb',FB.korppi());scene.add(b.obj);W.birds.push(b);}
  // tiaiset: vain ambienssiääniä ~12 koivulta, soivat kun pelaaja < 120 m
  W.tiaiset=[];for(let i=0;i<COUNTS.tiainen;i++){const t=koivut[(rand()*koivut.length)|0]||spot(isForest);W.tiaiset.push({x:t.x,z:t.z,y:height(t.x,t.z)+3,T:8+rand()*17});}
  if(typeof window!=='undefined')window.__tiainenSoitot=0;
  for(const b of W.birds)W.targets.push({kind:b.kind,b,get alive(){return b.alive;},pos:()=>({x:b.obj.position.x,y:b.obj.position.y+0.15,z:b.obj.position.z}),r:0.2,shoot:()=>{b.alive=false;b.vy=0;}});
  W.update=(dt,{t,player,dog,addTrack})=>{const threats=[player,dog];
    for(const c of W.critters){c._acc=(c._acc||0)+dt;if(c._acc<aiInterval(Math.hypot(c.x-player.x,c.z-player.z)))continue;const cdt=Math.min(c._acc,0.25);c._acc=0;const was=c.state;c.update(cdt,{threats,ok:(x,z)=>inBounds(x,z)});
      if(c.state==='pakenee'&&was!=='pakenee'){if(c.kind==='peura')play3d('sfx_peura_pakenee_1',{x:c.x,y:height(c.x,c.z)+1,z:c.z,gain:1.2,ref:10,max:600});if(c.kind==='kettu')play3d('sfx_kettu_haukahdus_'+(1+(rand()*2|0)),{x:c.x,y:height(c.x,c.z)+0.4,z:c.z,gain:1,ref:8,max:700});}
      if(c.kind!=='orava')while(c.tn<c.trail.length)addTrack(c.kind,c.trail[c.tn++]);
      c.obj.position.set(c.x,height(c.x,c.z),c.z);c.obj.rotation.set(0,Math.PI/2-c.heading,c.alive?0:Math.PI/2);animQuad(c.obj.userData.n,{t,spd:c.speed,kind:c.kind});}
    for(const q of W.tiaiset){if((q.T-=dt)>0)continue;q.T=8+rand()*17;if(Math.hypot(q.x-player.x,q.z-player.z)>250)for(let k=0;k<40;k++){const t=koivut[(rand()*koivut.length)|0];if(t&&Math.hypot(t.x-player.x,t.z-player.z)<110){q.x=t.x;q.z=t.z;q.y=height(t.x,t.z)+3;break;}}
      if(Math.hypot(q.x-player.x,q.z-player.z)<120&&play3d('amb_tiainen_'+(1+(rand()*2|0)),{x:q.x,y:q.y,z:q.z,gain:0.9,ref:6,max:120})){if(typeof window!=='undefined')window.__tiainenSoitot++;}}
    for(const F of W.flocks){const teeret=W.birds.filter(b=>b.F===F&&b.alive);F.t+=dt;
    if(teeret.length){const cx=teeret.reduce((s,b)=>s+b.x,0)/teeret.length,cz=teeret.reduce((s,b)=>s+b.z,0)/teeret.length;
      // pyrähdys: koira < 15 m tai ihminen < 25 m (ks. FLUSH); parvena tai yksitellen (viive per lintu), lentää 150–400 m uuteen puuhun
      const hum=W.humans||[player];if(F.state==='istuu'&&(hum.some(p=>p&&Math.hypot(p.x-cx,p.z-cz)<FLUSH.ihminen)||(dog&&Math.hypot(dog.x-cx,dog.z-cz)<FLUSH.koira))){F.state='lentaa';F.t=0;F.flushed=(F.flushed||0)+1;
        teeret.forEach((b,i)=>{b.delay=F.single?i*(0.4+rand()*0.9):rand()*0.3;b.sndDone=false;b.kieppi=false;});let p;for(let k=0;k<30;k++){p=perch();if(Math.hypot(p.x-cx,p.z-cz)>150&&Math.hypot(p.x-cx,p.z-cz)<400)break;}F.target=p;
        if(!F.single)play3d('sfx_teeri_pyrahdus_'+(1+(rand()*2|0)),{x:cx,y:teeret[0].y,z:cz,gain:1.6,ref:10,max:500});}
      if(F.state==='istuu'&&(F.sndT-=dt)<=0){F.sndT=20+rand()*40;play3d('amb_teeri_kuherrus_1',{x:cx,y:teeret[0].y,z:cz,gain:1,ref:20,max:1200});}}
      if(F.state==='lentaa'&&teeret.every(b=>!b.fly)&&F.t>3)F.state='istuu';}
    for(const b of W.birds){const o=b.obj;
      if(b.carried||b.held){o.visible=!b.held;if(b.carried)continue;}else o.visible=true;
      if(!b.alive){b.vy=(b.vy||0)-9.8*dt;b.y=Math.max(height(b.x??o.position.x,b.z??o.position.z),b.y+b.vy*dt);if(b.kind==='korppi'){b.x??=o.position.x;b.z??=o.position.z;}o.position.set(b.x,b.y,b.z);o.rotation.z=Math.PI/2;animBird(o.userData.n,{t,fly:false,kind:b.kind});continue;}
      if(b.kind==='korppi'){b.ph+=b.w*dt;const x=b.cx+Math.cos(b.ph)*b.R,z=b.cz+Math.sin(b.ph)*b.R;o.position.set(x,height(x,z)+b.y,z);o.rotation.set(0,-b.ph+Math.PI,0.25);animBird(o.userData.n,{t,fly:true,kind:'korppi',seed:b.seed});continue;}
      if(b.kind==='teeri'){const F=b.F;if(F.state==='lentaa'&&F.target&&b.delay>0){b.delay-=dt;}else if(F.state==='lentaa'&&F.target){if(F.single&&!b.sndDone){b.sndDone=true;play3d('sfx_teeri_pyrahdus_'+(1+(rand()*2|0)),{x:b.x,y:b.y,z:b.z,gain:1.2,ref:10,max:500});}const tx=F.target.x+(b.seed-4.5),tz=F.target.z+Math.sin(b.seed)*3,ty=F.target.y+(b.seed%2);const dx=tx-b.x,dz=tz-b.z,d=Math.hypot(dx,dz);
          const cruise=height(b.x,b.z)+18,wantY=d>40?cruise:ty;b.y+=(wantY-b.y)*Math.min(1,dt*(F.t<1.5?3:1));if(d>0.5){const sp=Math.min(14,2+F.t*8);b.x+=dx/d*sp*dt;b.z+=dz/d*sp*dt;b.heading=Math.atan2(dx,dz);}
          b.fly=d>0.8;}else b.fly=false;b.x=clampB(b.x);b.z=clampB(b.z);o.position.set(b.x,b.kieppi?b.y-0.18:b.y,b.z);o.rotation.set(0,b.heading,0);animBird(o.userData.n,{t,fly:b.fly,kind:'teeri',seed:b.seed});}
      }
  };
  return W;}
// ---------- heinikko: 3 tupasmallia InstancedMeshinä, kortit ladataan erikseen ----------
export function setupGrass(scene,{height,ok,rand=Math.random,count=[2500,2000,1200]}){const out=[];const CARD=[2,1,2],H=[0.2,0.4,0.6];
  const tl=new THREE.TextureLoader();const pts=[];for(let k=0;k<3;k++){const arr=[];let n=0;while(arr.length<count[k]&&n++<count[k]*20){const x=(rand()*2-1)*(BOUND-10),z=(rand()*2-1)*(BOUND-10);if(ok(x,z))arr.push([x,z]);}pts.push(arr);}
  for(let k=0;k<3;k++){const tex=tl.load(G+'tekstuurit/heina_kortti_'+CARD[k]+'.png',undefined,undefined,()=>missing.push('tekstuurit/heina_kortti_'+CARD[k]+'.png'));tex.magFilter=tex.minFilter=THREE.NearestFilter;tex.generateMipmaps=false;tex.colorSpace=THREE.SRGBColorSpace;tex.flipY=false;
    const mat=new THREE.MeshLambertMaterial({map:tex,alphaTest:0.5,side:THREE.DoubleSide,color:0xffffff});
    // varageometria: 2 ristikkäistä quadia
    const fb=(()=>{const h=H[k],a=new THREE.PlaneGeometry(h,h).translate(0,h/2,0),b=a.clone().rotateY(Math.PI/2);const g=new THREE.BufferGeometry();const pa=[...a.toNonIndexed().attributes.position.array,...b.toNonIndexed().attributes.position.array],ua=[...a.toNonIndexed().attributes.uv.array,...b.toNonIndexed().attributes.uv.array].map((v,i)=>i%2?1-v:v);g.setAttribute('position',new THREE.Float32BufferAttribute(pa,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(ua,2));g.computeVertexNormals();return g;})();
    const im=new THREE.InstancedMesh(fb,mat,pts[k].length);const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),Y=new THREE.Vector3(0,1,0);
    pts[k].forEach(([x,z],i)=>{const s=0.8+rand()*0.5;Q.setFromAxisAngle(Y,rand()*6.28);M.compose(new THREE.Vector3(x,height(x,z)-0.02,z),Q,new THREE.Vector3(0.7*s,s*(0.8+rand()*0.4),0.7*s));im.setMatrixAt(i,M);});
    im.computeBoundingSphere();scene.add(im);out.push(im);
    loader.load(G+'mallit/heina/heinatupas_'+(k+1)+'.glb',gl=>{let mesh=null;gl.scene.updateMatrixWorld(true);gl.scene.traverse(o=>{if(o.isMesh&&!mesh)mesh=o;});if(!mesh)return;im.geometry=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);im.computeBoundingSphere();},undefined,()=>missing.push('mallit/heina/heinatupas_'+(k+1)+'.glb'));}
  return out;}
// ---------- kivääri + kiikarit viewmodeliin, overlay-kuvat ----------
export function setupWeapons(vm){const W={weapon:'haulikko',bino:0,binoOn:false,bolt:0,rifleShells:3,zoom:6,sway:0};
  const rifleG=new THREE.Group();rifleG.position.set(0,-0.065,-0.195);rifleG.visible=false;vm.pivot.add(rifleG);
  const rfb=fbGroup(boxM(0.04,0.06,1.1,0x3a2a1a,-0.02,-0.15),boxM(0.035,0.035,0.33,0x111111,0.065,-0.06));rifleG.add(rfb);W.n={};
  loader.load(G+'mallit/kivaari.glb',gl=>{vc(gl.scene);gl.scene.traverse(o=>{if(o.isMesh)o.frustumCulled=false;});rifleG.clear();rifleG.add(gl.scene);for(const k of['lukko','liipaisin','kiikaritahtain','suu','silma'])W.n[k]=gl.scene.getObjectByName(k);if(W.n.lukko)W.n.lukko.userData.z0=W.n.lukko.position.z;},undefined,()=>missing.push('mallit/kivaari.glb'));
  const binoG=new THREE.Group();binoG.visible=false;vm.scene.add(binoG);binoG.add(fbGroup(boxM(0.05,0.05,0.17,0x223322,0,-0.08),boxM(0.05,0.05,0.17,0x223322,0,-0.08)));binoG.children[0].children[0].position.x=-0.033;binoG.children[0].children[1].position.x=0.033;
  loader.load(G+'mallit/kiikarit.glb',gl=>{vc(gl.scene);gl.scene.traverse(o=>{if(o.isMesh)o.frustumCulled=false;});binoG.clear();binoG.add(gl.scene);},undefined,()=>missing.push('mallit/kiikarit.glb'));
  // overlayt
  const ov=(id,src,fb)=>{const i=document.createElement('img');i.id=id;i.style.cssText='position:fixed;left:50%;top:50%;height:100vh;transform:translate(-50%,-50%);display:none;pointer-events:none;z-index:5;image-rendering:auto;box-shadow:0 0 0 100vmax #000';i.onerror=()=>{i.onerror=null;missing.push(src);i.src=fb();};i.src=G+src;document.body.appendChild(i);return i;};
  const cv=(f)=>()=>{const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,512,512);g.globalCompositeOperation='destination-out';f(g);g.globalCompositeOperation='source-over';g.strokeStyle='#000';g.lineWidth=1;g.beginPath();g.moveTo(256,30);g.lineTo(256,482);g.moveTo(30,256);g.lineTo(482,256);g.stroke();return c.toDataURL();};
  W.scopeImg=ov('ov_scope','hud/tahtain_kiikari.png',cv(g=>{g.beginPath();g.arc(256,256,220,0,7);g.fill();}));
  W.binoImg=ov('ov_bino','hud/kiikarit_naakyma.png',()=>{const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,512,512);g.globalCompositeOperation='destination-out';g.beginPath();g.arc(173,256,165,0,7);g.arc(338,256,165,0,7);g.fill();return c.toDataURL();});
  W.setWeapon=w=>{W.weapon=w;vm.gunG.visible=w==='haulikko';rifleG.visible=w==='kivaari';};
  W.toggleBino=()=>{W.binoOn=!W.binoOn;};
  W.startBolt=()=>{W.bolt=1.0;};
  W.reloadT=0;W.startReload=()=>{W.reloadT=2.2;};
  // update palauttaa kameran fov-kertoimen ja huojunnan
  W.update=(dt,{t,aim,inCar})=>{W.bino+=((W.binoOn&&!inCar?1:0)-W.bino)*Math.min(1,dt*6);
    binoG.visible=W.bino>0.02&&W.bino<0.95;binoG.position.set(0.0,-0.25*(1-W.bino)-0.0,-0.02-0.1*(1-W.bino));binoG.rotation.x=-0.6*(1-W.bino);
    vm.pivot.visible=!inCar&&W.bino<0.3;
    if(W.bolt>0){W.bolt-=dt;const p=1-W.bolt,l=W.n.lukko;let r=0,z=0;if(p<0.25)r=p/0.25;else if(p<0.5){r=1;z=(p-0.25)/0.25;}else if(p<0.75){r=1;z=1-(p-0.5)/0.25;}else r=1-(p-0.75)/0.25;if(l){l.rotation.z=1.2*r;l.position.z=(l.userData.z0||0)+0.09*z;}}
    if(W.reloadT>0){W.reloadT-=dt;vm.pivot.rotation.z+=Math.sin(Math.min(1,W.reloadT/2.2)*Math.PI)*0.5;}
    const scoped=W.weapon==='kivaari'&&vm.aim>0.9&&!inCar;W.scopeImg.style.display=scoped&&W.bino<0.5?'block':'none';W.binoImg.style.display=W.bino>0.95?'block':'none';
    if(scoped)rifleG.visible=false;else rifleG.visible=W.weapon==='kivaari';
    const sw=W.bino>0.95?1:scoped?0.4:0;W.swayX=Math.sin(t*0.9)*0.004*sw+Math.sin(t*2.3)*0.0015*sw;W.swayY=Math.sin(t*1.3+1)*0.003*sw;
    return W.bino>0.95?8:scoped?W.zoom:1;};
  return W;}
// jälkien varatekstuurit
export function trackCanvas(kind){const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d');g.fillStyle='#7f8a9a';
  if(kind==='peura'){for(const x of[11,18]){g.beginPath();g.ellipse(x,16,3,8,x<16?0.15:-0.15,0,7);g.fill();}}else{g.beginPath();g.ellipse(16,18,4,5,0,0,7);g.fill();for(const[x,y]of[[11,10],[21,10],[14,7],[18,7]]){g.beginPath();g.arc(x,y,1.8,0,7);g.fill();}}
  const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;return t;}
