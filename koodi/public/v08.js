// v0.8: kyltit, eläinanimaatiot, 3D-äänet, viewmodel-haulikko, Vitaran sisänäkymä, radion näyttö
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { asetaHanskat, makeHunter } from './hahmo.js';
export { makeHunter };
const G='/grafiikka/';
const nearestT=t=>{t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;t.colorSpace=THREE.SRGBColorSpace;return t;};
const vc=root=>root.traverse(o=>{if(o.isMesh&&o.geometry.attributes.color){o.material.vertexColors=true;}});

// ---------- 1) kyltit ----------
export function setupSigns(scene,signs,height){
  const TL=new THREE.TextureLoader(),postM=new THREE.MeshLambertMaterial({color:0x8a9098}),backM=new THREE.MeshLambertMaterial({color:0x9aa0a8,side:THREE.FrontSide});
  const post=(h)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,h,8),postM);m.position.y=h/2;return m;};
  const FILE={'Löyhingintie':'loyhingintie','Yli-Vallintie 6921':'ylivallintie','Koppelontie':'koppelontie'};
  for(const k of signs){const g=new THREE.Group();g.position.set(k.x,height(k.x,k.z),k.z);g.rotation.y=Math.PI-k.suunta;scene.add(g);
    if(k.tyyppi==='tienviitta'){g.add(post(2.3));const f=FILE[k.teksti]+(k.nuoli&&k.nuoli.startsWith('vasen')?'_vasen':'');
      const t=nearestT(TL.load(G+'tekstuurit/kyltit/kyltti_'+f+'.png'));const p=new THREE.Mesh(new THREE.PlaneGeometry(1.4,0.35),new THREE.MeshLambertMaterial({map:t,alphaTest:0.5}));p.position.set(0,2.05,0.05);g.add(p);
      const b=new THREE.Mesh(new THREE.PlaneGeometry(1.4,0.35),new THREE.MeshLambertMaterial({map:t,alphaTest:0.5,color:0x9aa0a8}));b.rotation.y=Math.PI;b.scale.x=-1;b.position.set(0,2.05,0.045);g.add(b);}
    else if(k.tyyppi==='osoitekilpi'){g.add(post(1.5));const t=nearestT(TL.load(G+'tekstuurit/kyltit/kyltti_osoite_30.png'));
      const p=new THREE.Mesh(new THREE.PlaneGeometry(0.4,0.2),new THREE.MeshLambertMaterial({map:t,emissiveMap:t,emissive:0x888888}));p.position.set(0,1.4,0.04);g.add(p);}
    else if(k.tyyppi==='postilaatikko'){const fb=new THREE.Group();fb.add(post(1.1));g.add(fb);
      new GLTFLoader().load(G+'mallit/kyltit/postilaatikko.glb',gl=>{vc(gl.scene);const t=nearestT(TL.load(G+'tekstuurit/kyltit/postilaatikko_teksti.png'));
        gl.scene.traverse(o=>{if(o.isMesh&&o.material.name==='nimilappu'){o.material=new THREE.MeshLambertMaterial({map:t});}});g.remove(fb);g.add(gl.scene);});}}
}

// ---------- 2) proseduraaliset animaatiot ----------
const NODES=['runko','paa','korva_v','korva_o','jalka_ev','jalka_eo','jalka_tv','jalka_to','hanta','leuka'];
export function bindNodes(root){const n={};for(const k of NODES){const o=root.getObjectByName(k);if(o){o.userData.p0=o.position.clone();n[k]=o;}}return Object.keys(n).length?n:null;}
// st: {spd m/s, lying, jaw 0..1, hop(bool, jänis), t}
export function animHare(n,st){if(!n)return;const t=st.t,s=st.spd;
  for(const k of ['jalka_ev','jalka_eo','jalka_tv','jalka_to','paa','korva_v','korva_o','hanta'])if(n[k])n[k].rotation.set(0,0,0);
  if(n.runko)n.runko.position.y=0;
  if(st.lying){if(n.runko)n.runko.position.y=-0.05;for(const k of['jalka_ev','jalka_eo'])n[k]&&(n[k].rotation.x=-1.1);for(const k of['jalka_tv','jalka_to'])n[k]&&(n[k].rotation.x=0.9);
    n.korva_v&&(n.korva_v.rotation.x=-1.0+Math.sin(t*0.7)*0.08);n.korva_o&&(n.korva_o.rotation.x=-1.0+Math.sin(t*0.9+1)*0.08);n.paa&&(n.paa.rotation.x=0.15);return;}
  if(s<0.2){n.korva_v&&(n.korva_v.rotation.z=Math.sin(t*1.3)*0.15);n.korva_o&&(n.korva_o.rotation.z=-Math.sin(t*1.1)*0.15);return;}
  // loikka: etujalat yhdessä, takajalat yhdessä, rungon kaari
  const f=s>3?7:4.5,ph=t*f*Math.PI*2/Math.PI,c=Math.sin(ph),a=s>3?0.9:0.5;
  for(const k of['jalka_ev','jalka_eo'])n[k]&&(n[k].rotation.x=c*a);for(const k of['jalka_tv','jalka_to'])n[k]&&(n[k].rotation.x=-c*a*1.2);
  if(n.runko)n.runko.position.y=Math.max(0,Math.sin(ph+0.6))*(s>3?0.12:0.05);
  n.korva_v&&(n.korva_v.rotation.x=-0.5-0.3*Math.min(1,s/5));n.korva_o&&(n.korva_o.rotation.x=-0.5-0.3*Math.min(1,s/5));n.hanta&&(n.hanta.rotation.x=-0.3);}
// st.k: per-koira animaatioskaala (ajokoira 1, jagdterrieri ≈0.565: makuun lasku 0.16 m, juoksupomppu 0.017 m)
export const DOG_K={ajokoira:1,terrieri:0.565};
export function animDog(n,st){if(!n)return;const t=st.t,s=st.spd,K=st.k??1;
  for(const k of ['jalka_ev','jalka_eo','jalka_tv','jalka_to','paa','korva_v','korva_o','hanta','leuka'])if(n[k])n[k].rotation.set(0,0,0);if(n.runko){n.runko.position.y=0;n.runko.scale.set(1,1,1);}
  if(st.sit){n.jalka_tv&&(n.jalka_tv.rotation.x=1.15);n.jalka_to&&(n.jalka_to.rotation.x=1.15);n.jalka_ev&&(n.jalka_ev.rotation.x=0.3);n.jalka_eo&&(n.jalka_eo.rotation.x=0.22);
    if(n.runko)n.runko.position.y=-0.16*K;n.paa&&(n.paa.rotation.x=-0.08);}
  else if(st.lying){for(const k of['jalka_ev','jalka_eo'])n[k]&&(n[k].rotation.x=-1.4);for(const k of['jalka_tv','jalka_to'])n[k]&&(n[k].rotation.x=1.3);if(n.runko){n.runko.position.y=-0.28*K;n.runko.scale.y=1+Math.sin(t*2.2)*0.015;}
    n.paa&&(n.paa.rotation.y=Math.sin(t*0.45)*0.7,n.paa.rotation.x=0.1*Math.sin(t*0.3));}
  else if(s>0.3){const f=s>3?3.2:1.8,ph=t*f*Math.PI*2,a=Math.min(0.8,0.3+s*0.08);
    n.jalka_ev&&(n.jalka_ev.rotation.x=Math.sin(ph)*a);n.jalka_eo&&(n.jalka_eo.rotation.x=Math.sin(ph+(s>3?0.4:Math.PI))*a);n.jalka_tv&&(n.jalka_tv.rotation.x=Math.sin(ph+Math.PI)*a);n.jalka_to&&(n.jalka_to.rotation.x=Math.sin(ph+(s>3?Math.PI+0.4:0))*a);
    if(n.runko)n.runko.position.y=Math.abs(Math.sin(ph))*0.03*K;n.paa&&(n.paa.rotation.x=st.sniff?0.5:0.05*Math.sin(ph*2));
    const fl=Math.sin(ph*2)*0.25*Math.min(1,s/3);n.korva_v&&(n.korva_v.rotation.z=0.1+fl);n.korva_o&&(n.korva_o.rotation.z=-0.1-fl);}
  else{n.paa&&(n.paa.rotation.y=Math.sin(t*0.6)*0.3);n.runko&&(n.runko.scale.y=1+Math.sin(t*2.5)*0.01);}
  const wag=!!(st.wag||st.barking);
  n.hanta&&(n.hanta.rotation.y=Math.sin(t*(wag?12:5))*(wag?0.55:0.3),n.hanta.rotation.x=st.barking?-0.5:-0.15);
  if(st.sniff&&n.paa)n.paa.rotation.x=st.wag?0.72:Math.max(n.paa.rotation.x||0,0.5);
  if(n.leuka)n.leuka.rotation.x=st.jaw*0.55;if(st.jaw>0&&n.paa)n.paa.rotation.x-=st.jaw*0.25;}

// ---------- 6) 3D-ääni ----------
export function makeAudio3D(AC){
  const out=AC.createGain();out.connect(AC.destination);
  const conv=AC.createConvolver();{const L=AC.sampleRate*2.2,b=AC.createBuffer(2,L,AC.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<L;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/L,3.2)*(i<AC.sampleRate*0.02?0.3:1);}conv.buffer=b;}
  const wet=AC.createGain();wet.gain.value=0.5;conv.connect(wet).connect(out);
  const live=new Set();
  function chain({ref=10,max=3000,roll=1,model='inverse'}={}){const g=AC.createGain(),lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=18000;
    const p=AC.createPanner();p.panningModel='HRTF';p.distanceModel=model;p.refDistance=ref;p.maxDistance=max;p.rolloffFactor=roll;
    const send=AC.createGain();send.gain.value=0;g.connect(lp).connect(p).connect(out);p.connect(send).connect(conv);return{g,lp,p,send};}
  function setPos(h,x,y,z){const t=AC.currentTime;h.p.positionX.setValueAtTime(x,t);h.p.positionY.setValueAtTime(y,t);h.p.positionZ.setValueAtTime(z,t);h.pos={x,y,z};}
  function play(buf,{x=0,y=1,z=0,gain=1,loop=false,ref=10,max=3000,roll=1,far=true,rate=1}={}){if(!buf)return null;const h=chain({ref,max,roll});h.far=far;h.g.gain.value=gain;setPos(h,x,y,z);
    const s=AC.createBufferSource();s.buffer=buf;s.loop=loop;if(rate!==1)s.playbackRate.value=rate;s.connect(h.g);s.start();h.s=s;live.add(h);s.onended=()=>live.delete(h);h.setPos=(a,b,c)=>setPos(h,a,b,c);return h;}
  function updateListener(cam){const l=AC.listener,t=AC.currentTime,p=cam.getWorldPosition(new THREE.Vector3()),f=new THREE.Vector3(0,0,-1).applyQuaternion(cam.quaternion),u=new THREE.Vector3(0,1,0).applyQuaternion(cam.quaternion);
    if(l.positionX){l.positionX.setValueAtTime(p.x,t);l.positionY.setValueAtTime(p.y,t);l.positionZ.setValueAtTime(p.z,t);l.forwardX.setValueAtTime(f.x,t);l.forwardY.setValueAtTime(f.y,t);l.forwardZ.setValueAtTime(f.z,t);l.upX.setValueAtTime(u.x,t);l.upY.setValueAtTime(u.y,t);l.upZ.setValueAtTime(u.z,t);}
    else{l.setPosition(p.x,p.y,p.z);l.setOrientation(f.x,f.y,f.z,u.x,u.y,u.z);}
    // kaukaiset äänet: lowpass + metsäkaiku etäisyyden mukaan
    for(const h of live){if(!h.pos||!h.far)continue;const d=Math.hypot(h.pos.x-p.x,h.pos.z-p.z);h.lp.frequency.setTargetAtTime(Math.max(900,16000*Math.exp(-d/220)),t,0.1);h.send.gain.setTargetAtTime(Math.min(0.5,d/500),t,0.1);}}
  return{play,chain,setPos,updateListener,out};
}

// ---------- 7) viewmodel-haulikko ----------
export function setupViewmodel(){
  const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(55,1,0.01,10);scene.add(new THREE.HemisphereLight(0xdde6f4,0x667080,1.6));const dl=new THREE.DirectionalLight(0xfff4e8,1.2);dl.position.set(-0.5,1,0.6);scene.add(dl);
  const pivot=new THREE.Group();scene.add(pivot);const gunG=new THREE.Group();gunG.position.set(0,-0.080,-0.23);pivot.add(gunG);   // silmäpiste origoon
  const vm={scene,cam,pivot,gunG,n:{},aim:0,kick:0,reload:0,shells:[],flash:null,loaded:false};
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(0.16,0.16),new THREE.MeshBasicMaterial({color:0xffc060,transparent:true,opacity:0.9,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));fl.visible=false;vm.flash=fl;
  new GLTFLoader().load(G+'mallit/haulikko.glb',gl=>{vc(gl.scene);gl.scene.traverse(o=>{if(o.isMesh){o.material.flatShading=true;o.frustumCulled=false;}});gunG.add(gl.scene);for(const k of['piiput','suu','helmi','liipaisin'])vm.n[k]=gl.scene.getObjectByName(k);
    asetaHanskat(gl.scene);(vm.n.suu||gunG).add(fl);vm.loaded=true;},undefined,e=>{vm.err=String(e.message||e);});
  vm.shoot=()=>{vm.kick=1;fl.visible=true;fl.rotation.z=Math.random()*3;vm.flashT=0.05;};
  vm.startReload=()=>{vm.reload=1.6;vm.ejected=false;};
  vm.update=(dt,{moving,t,aim,run,crouch})=>{vm.aim+=((aim?1:0)-vm.aim)*Math.min(1,dt*8);const a=vm.aim,bob=moving?1-a*0.8:0,f=run?12:crouch?6.2:8,amp=run?1.6:crouch?0.55:1;
    const hip={x:0.16,y:-0.15-(crouch?0.05:0),z:-0.06,rx:0.04+(crouch?0.08:0),ry:0.10,rz:0.04};
    pivot.position.set(hip.x*(1-a)+Math.cos(t*f)*0.006*bob*amp,hip.y*(1-a)+Math.abs(Math.sin(t*f))*0.008*bob*amp,hip.z*(1-a)+vm.kick*0.07);
    pivot.rotation.set(hip.rx*(1-a)+0.0223*a+vm.kick*0.15,hip.ry*(1-a),hip.rz*(1-a));
    vm.kick=Math.max(0,vm.kick-dt*6);if(vm.flashT!==undefined){vm.flashT-=dt;if(vm.flashT<=0)fl.visible=false;}
    if(vm.reload>0){vm.reload-=dt;const r=vm.reload,e=r>1.2?(1.6-r)/0.4:r>0.4?1:r/0.4;if(vm.n.piiput)vm.n.piiput.rotation.x=-0.6*e;
      if(!vm.ejected&&r<1.2){vm.ejected=true;for(const y of[0.040,0.018]){const sh=new THREE.Mesh(new THREE.CylinderGeometry(0.0105,0.0105,0.07,8).rotateX(Math.PI/2),new THREE.MeshLambertMaterial({color:0xb02020}));
        const p=new THREE.Vector3(0,y,-0.07);gunG.localToWorld(p);sh.position.copy(p);sh.userData.v=new THREE.Vector3((Math.random()-.5)*0.4,1.4+Math.random()*0.4,1.2);sh.userData.life=1.0;scene.add(sh);vm.shells.push(sh);}}}
    for(const sh of vm.shells){sh.userData.life-=dt;sh.userData.v.y-=9.8*dt;sh.position.addScaledVector(sh.userData.v,dt);sh.rotation.x+=dt*12;if(sh.userData.life<=0){scene.remove(sh);}}
    vm.shells=vm.shells.filter(s=>s.userData.life>0);};
  return vm;
}

// ---------- 4) Vitaran sisänäkymä + radion näyttö ----------
export function setupInterior(scene){
  const it={g:new THREE.Group(),n:{},loaded:false};scene.add(it.g);
  const c=document.createElement('canvas');c.width=1024;c.height=256;const tex=new THREE.CanvasTexture(c);tex.flipY=false;tex.anisotropy=8;tex.generateMipmaps=true;tex.minFilter=THREE.LinearMipmapLinearFilter;tex.magFilter=THREE.LinearFilter;it.canvas=c;it.tex=tex;
  const panel=new Image();panel.src=G+'hud/radio_paneeli.png';it.panel=panel;
  new GLTFLoader().load(G+'mallit/vitara_sisa.glb',gl=>{vc(gl.scene);gl.scene.traverse(o=>{if(o.isMesh)o.material.side=THREE.DoubleSide;});it.g.add(gl.scene);
    for(const k of['ratti','vaihdekeppi','radio_naytto','kamera_kuljettaja','koira_paikka'])it.n[k]=gl.scene.getObjectByName(k);
    if(it.n.ratti)it.n.ratti.userData.rx=it.n.ratti.rotation.x;
    const rn=it.n.radio_naytto;if(rn){const m=rn.isMesh?rn:rn.getObjectByProperty('isMesh',true);if(m)m.material=new THREE.MeshBasicMaterial({map:tex});rn.scale.multiplyScalar(1.6);rn.position.y+=0.16;rn.position.z-=0.006;rn.rotation.y-=0.3;}
    // tarra radion alla: canvas-tekstuuri kuten radion näyttö
    const tarra=(txt,name,dy,dx=0)=>{const sc=document.createElement('canvas');sc.width=1024;sc.height=116;const g=sc.getContext('2d');g.fillStyle='#e8e2c8';g.fillRect(0,0,1024,116);g.strokeStyle='#333';g.lineWidth=6;g.strokeRect(3,3,1018,110);
      g.fillStyle='#111';g.font='bold 64px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(txt,512,60,995);
      const st=new THREE.CanvasTexture(sc);st.anisotropy=8;const sm=new THREE.Mesh(new THREE.PlaneGeometry(0.30,0.034),new THREE.MeshBasicMaterial({map:st,side:THREE.DoubleSide}));
      sm.name=name;rn.parent.add(sm);sm.position.copy(rn.position);sm.quaternion.copy(rn.quaternion);sm.translateY(dy);sm.translateX(dx);return [sm,sc];};
    // Näyttö on skaalattu 1.6× (puolikorkeus 0.04). Tarrat tulevat sen alle omiksi riveikseen.
    if(rn){[it.n.tarra,it.tarraCanvas]=tarra('R radio päälle – Q kanavan vaihto','radio_tarra',-0.065,0);[it.n.tarraE,it.tarraECanvas]=tarra('E – ulos autosta','ulos_tarra',0);it.n.tarra.scale.x=-1;it.n.tarra.add(it.n.tarraE);it.n.tarraE.position.set(0,-0.04,0.001);it.n.tarraE.quaternion.identity();}
    // Lattialevy + karmien muotoiset lasit (pisteet mitattu sisa_kori-meshistä). Näkyvät vain sisänäkymässä.
    const ex=new THREE.Group();it.extra=ex;ex.visible=false;gl.scene.add(ex);
    const fl=new THREE.Mesh(new THREE.BoxGeometry(1.6,0.04,2.2),new THREE.MeshLambertMaterial({color:0x3a3d42,flatShading:true}));fl.position.set(0,0.44,-0.53);ex.add(fl);
    const fw=new THREE.Mesh(new THREE.BoxGeometry(1.6,0.6,0.04),fl.material);fw.position.set(0,0.74,0.56);ex.add(fw); // tulipelti jalkatilan eteen
    const glass=new THREE.MeshBasicMaterial({color:0xa8c8e8,transparent:true,opacity:0.12,depthWrite:false,side:THREE.DoubleSide});
    const poly=pts=>{const g=new THREE.BufferGeometry(),v=[];for(let i=1;i<pts.length-1;i++)v.push(...pts[0],...pts[i],...pts[i+1]);g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));const m=new THREE.Mesh(g,glass);m.renderOrder=10;ex.add(m);};
    for(const x of[0.79,-0.79]){ // sivut (z,y): kalteva A-pilari etuikkunassa
      poly([[x,1.12,-0.15],[x,1.12,0.48],[x,1.6,0.09],[x,1.6,-0.15]]);
      poly([[x,1.12,-1.55],[x,1.12,-0.25],[x,1.6,-0.25],[x,1.6,-1.55]]);}
    poly([[-0.78,1.12,0.5],[0.78,1.12,0.5],[0.76,1.62,0.1],[-0.76,1.62,0.1]]); // tuulilasi
    poly([[-0.78,1.12,-1.61],[0.78,1.12,-1.61],[0.78,1.6,-1.61],[-0.78,1.6,-1.61]]); // takalasi
    it.loaded=true;},undefined,e=>{it.err=String(e.message||e);});
  it.drawRadio=(on,name,freq)=>{const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.setTransform(4,0,0,4,0,0);g.clearRect(0,0,256,64);
    if(panel.complete&&panel.naturalWidth)g.drawImage(panel,0,0,256,64);else{g.fillStyle='#222';g.fillRect(0,0,256,64);}
    g.fillStyle=on?'#020802':'#050805';g.fillRect(46,16,163,32);if(on){g.fillStyle='#EFFFEF';g.textAlign='center';g.font='bold 15px monospace';g.fillText(name,127,31,158);g.font='bold 10px monospace';g.fillText(freq+' MHz',127,44);}tex.needsUpdate=true;};
  return it;
}
