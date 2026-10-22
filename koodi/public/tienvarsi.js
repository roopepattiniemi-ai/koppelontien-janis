// v0.9: tiepinnat ja tienvarsi Street View -referenssien mukaan (talvi). Mallit grafiikka/mallit/tienvarsi|rakennukset,
// placeholder kunnes GLB ilmestyy (yritetään uudelleen 30 s välein, max 40 kertaa).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const G='/grafiikka/mallit/',loader=new GLTFLoader();
export const KOHTEET={};window.__tienvarsi=KOHTEET;
const NIMET={katuvalo:['tienvarsi/katuvalo','tienvarsi/katuvalopylvas','tienvarsi/katuvalo_pylvas'],
 sahkopylvas:['tienvarsi/sahkopylvas','tienvarsi/sahkopylvas_puu','tienvarsi/puinen_sahkopylvas'],
 vaistamismerkki:['tienvarsi/vaistamismerkki','tienvarsi/vaistamisvelvollisuus','tienvarsi/vaistamisvelvollisuusmerkki'],
 opaste:['tienvarsi/opaste_mantykoski','tienvarsi/mantykoski_opaste','tienvarsi/opaste'],
 aurausviitta:['tienvarsi/aurausviitta','tienvarsi/auraus_viitta'],
 navetta:['rakennukset/maatalous_navetta'],lato:['rakennukset/maatalous_varasto'],aitta:['rakennukset/aitta'],konekatos:['rakennukset/katos']};
function tryLoad(key,cb,n=0){if(typeof location==="undefined")return;const L=NIMET[key];let i=0;const next=()=>{if(i>=L.length){if(n<40)setTimeout(()=>tryLoad(key,cb,n+1),30000);return;}
  const p=L[i++]+'.glb';loader.load(G+p+'?t='+n,gl=>{gl.scene.traverse(o=>{if(o.isMesh&&o.geometry.attributes.color)o.material.vertexColors=true;});gl.scene.updateMatrixWorld(true);KOHTEET[key]=p;cb(gl.scene);},undefined,next);};next();}
const lam=(c,e=0)=>new THREE.MeshLambertMaterial({color:c,emissive:e});
function grp(parts){const g=new THREE.Group();for(const[geo,c,x,y,z,ry=0,e=0]of parts){const m=new THREE.Mesh(geo,lam(c,e));m.position.set(x,y,z);m.rotation.y=ry;g.add(m);}return g;}
const B=(w,h,d)=>new THREE.BoxGeometry(w,h,d),C=(r,h)=>new THREE.CylinderGeometry(r,r*1.1,h,6);
function talo(w,d,h,c){const g=grp([[B(w,h,d),c,0,h/2,0]]);const r=new THREE.Mesh(new THREE.CylinderGeometry(d*0.72,d*0.72,w,3,1,false),lam(0xe8ecf2));r.rotation.z=Math.PI/2;r.rotation.x=Math.PI/6;r.scale.set(1,1,0.5);r.position.y=h+d*0.2;g.add(r);return g;}
function emptyNode(g,name,x,y,z){const o=new THREE.Object3D();o.name=name;o.position.set(x,y,z);g.add(o);}
// placeholderit (+X oikealle, tie -Z/+Z suunnassa, origo maassa)
const FB={
 katuvalo:()=>{const g=grp([[C(0.08,9),0x8a9098,0,4.5,0],[B(0.08,0.08,1.9),0x8a9098,0,7.9,0.95],[B(0.25,0.12,0.5),0x50555c,0,7.85,1.92]]);emptyNode(g,'valo',0,7.78,1.92);return g;},
 sahkopylvas:()=>{const g=grp([[C(0.13,9),0x5a4632,0,4.5,0],[B(1.6,0.12,0.12),0x5a4632,0,8.6,0]]);[-0.85,0,0.85].forEach((x,i)=>emptyNode(g,'johto_'+(i+1),x,8.72+(i==1?0.5:0),0));return g;},
 vaistamismerkki:()=>{const t=new THREE.Mesh(new THREE.CircleGeometry(0.5,3),lam(0xd02020));t.rotation.z=-Math.PI/2;t.position.y=2.1;const g=grp([[C(0.03,2.2),0x9a9ea4,0,1.1,-0.03]]);g.add(t);return g;},
 opaste:()=>grp([[C(0.04,2.6),0x9a9ea4,-0.6,1.3,-0.03],[C(0.04,2.6),0x9a9ea4,0.6,1.3,-0.03],[B(1.7,0.45,0.04),0x1f4fa0,0,2.3,0]]),
 aurausviitta:()=>grp([[new THREE.CylinderGeometry(0.012,0.015,2,4),0xe07020,0,1,0]]),
 navetta:()=>talo(24,12,5,0x8e2a20),lato:()=>talo(12,7,4,0x7d2a1e),aitta:()=>talo(5,4,2.6,0x9a3022),
 konekatos:()=>{const g=grp([[B(14,0.3,8),0x8e2a20,0,4.2,0]]);for(const x of[-6.5,6.5])for(const z of[-3.5,3.5]){const m=new THREE.Mesh(C(0.12,4.2),lam(0x5a4632));m.position.set(x,2.1,z);g.add(m);}return g;}};
// Instansoitu joukko: placeholder heti, vaihto GLB:hen kun latautuu. onNodes(nodes {nimi:Vector3 paikallisena}) kutsutaan molemmilla.
function joukko(scene,key,mats,onNodes){const holder=new THREE.Group();scene.add(holder);
  const build=root=>{holder.clear();root.updateMatrixWorld(true);const nodes={};root.traverse(o=>{if(o.name)nodes[o.name]=new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
    if(o.isMesh){const im=new THREE.InstancedMesh(o.geometry,o.material,mats.length);const tmp=new THREE.Matrix4();mats.forEach((M,i)=>im.setMatrixAt(i,tmp.multiplyMatrices(M,o.matrixWorld)));im.frustumCulled=false;holder.add(im);}});
    onNodes&&onNodes(nodes);};
  build(FB[key]());if(mats.length)tryLoad(key,build);return holder;}
// kulku polylinella: paikka+suunta s metrin välein
function walk(pts,step,from=0,to=1e9){const out=[];let acc=0,nextS=from;for(let i=0;i<pts.length-1;i++){const[ax,az]=pts[i],[bx,bz]=pts[i+1],L=Math.hypot(bx-ax,bz-az);
  while(nextS<=acc+L&&nextS<=to){const t=(nextS-acc)/L;out.push({x:ax+(bx-ax)*t,z:az+(bz-az)*t,ux:(bx-ax)/L,uz:(bz-az)/L,s:nextS});nextS+=step;}acc+=L;}return out;}
function arcAt(pts,x,z){let acc=0,best=1e9,bs=0;for(let i=0;i<pts.length-1;i++){const[ax,az]=pts[i],[bx,bz]=pts[i+1],L=Math.hypot(bx-ax,bz-az);let t=((x-ax)*(bx-ax)+(z-az)*(bz-az))/(L*L);t=Math.max(0,Math.min(1,t));const d=Math.hypot(ax+(bx-ax)*t-x,az+(bz-az)*t-z);if(d<best){best=d;bs=acc+t*L;}acc+=L;}return bs;}
export const LOYH_KOPP={x:302.7,z:-87.3},RISTEYS={x:317.5,z:-32.6};
// tiepinnan luokka: asfaltti | sora | ura
export function pintaluokka(r,s){if(r.n==='Yli-Vallintie')return'asfaltti';if(r.n==='Löyhingintie')return s<(r._sKopp-25)?'asfaltti':'sora';if(r.n==='Koppelontie')return'ura';return r.c==='tie'?'sora':null;}
function canvasT(draw,rep=true){const c=document.createElement('canvas');c.width=128;c.height=256;draw(c.getContext('2d'));const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t;}
function speck(g,n,cols,w=128,h=256){for(let i=0;i<n;i++){g.fillStyle=cols[i%cols.length];g.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*3,1+Math.random()*6);}}
export const PINNAT={
 asfaltti:canvasT(g=>{g.fillStyle='#43474d';g.fillRect(0,0,128,256);speck(g,900,['#3a3d42','#50545a','#5d6168']);g.fillStyle='rgba(225,230,238,0.55)';for(const x of[0,8,120])g.fillRect(x,0,8,256);g.fillStyle='rgba(210,216,226,0.25)';g.fillRect(56,0,16,256);speck(g,250,['rgba(235,240,246,0.5)']);}),
 sora:canvasT(g=>{g.fillStyle='#c9ccd0';g.fillRect(0,0,128,256);speck(g,1400,['#8c8478','#a39a8a','#dfe3e8','#7a7266']);g.fillStyle='rgba(120,110,96,0.45)';for(const x of[28,92])g.fillRect(x-9,0,18,256);}),
 ura:canvasT(g=>{g.fillStyle='#e6eaf0';g.fillRect(0,0,128,256);speck(g,500,['#cdd3db','#f4f6f9']);g.fillStyle='rgba(130,120,104,0.6)';for(const x of[30,98]){g.fillRect(x-11,0,22,256);}speck(g,500,['#8c8478','#a39a8a'],128,256);})};
const LEV={asfaltti:7,sora:4.6,ura:3.2};
// tiepinnat: strip(pts,w,yoff,mat,off,uvL) main.js:stä
export function setupRoads(ROADS,strip,ojaM,penkkaM){for(const r of ROADS)if(r.n==='Löyhingintie')r._sKopp=arcAt(r.pts,LOYH_KOPP.x,LOYH_KOPP.z);
  const mats={};for(const k in PINNAT)mats[k]=new THREE.MeshLambertMaterial({map:PINNAT[k],side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2});
  for(const r of ROADS){if(r.c!=='tie')continue;// pilko luokan mukaan
    const pts=r.pts;let acc=0,cur=null,seg=[];const flush=()=>{if(seg.length>1){const w=Math.min(r.w,LEV[cur]);strip(seg,w,0.08,mats[cur],0,cur==='asfaltti'?8:5);
      for(const sd of[-1,1])strip(seg,cur==='asfaltti'?1.1:0.7,0.18,penkkaM,sd*(w/2+(cur==='asfaltti'?0.55:0.35)),8);}seg=[];};
    for(let i=0;i<pts.length;i++){if(i)acc+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);const k=pintaluokka(r,acc);if(k!==cur){if(seg.length){seg.push(pts[i]);}flush();cur=k;if(i)seg.push(pts[i-1]);}seg.push(pts[i]);}flush();
    for(const sd of[-1,1])for(let e=0;e<5.5;e+=0.5)strip(pts,0.55,0.03,ojaM,sd*(r.w/2+e+0.25),8);}}
const M4=(x,y,z,ry,s=1)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),ry),new THREE.Vector3(s,s,s));
// pylväät, viitat, merkit, rakennukset. Paluu: tiedot testejä/smokea varten
export function setupRoadside(scene,{ROADS,height,distToRoad,SIZE=1200}){const H=SIZE/2-10,inW=(x,z)=>Math.abs(x)<H&&Math.abs(z)<H;
  const valot=[],sahko=[],viitat=[];const OJA_ULKO=0.6+1.8+1.2;// ojan ulkoreuna + 1.2 m
  for(const r of ROADS){if(r.c!=='tie')continue;const off=r.w/2+OJA_ULKO;
    const asf=s=>pintaluokka(r,s)==='asfaltti';
    for(const p of walk(r.pts,45,12))if(asf(p.s)){const x=p.x-p.uz*off,z=p.z+p.ux*off;if(inW(x,z)&&distToRoad(x,z)>off-r.w/2-0.5)valot.push({x,z,ry:Math.atan2(p.uz,-p.ux)});}
    for(const p of walk(r.pts,55,30))if(asf(p.s)){const x=p.x+p.uz*(off+0.8),z=p.z-p.ux*(off+0.8);if(inW(x,z)&&distToRoad(x,z)>off-r.w/2-0.5)sahko.push({x,z,ry:Math.atan2(p.ux,p.uz),road:r.n});}
    for(const p of walk(r.pts,50,5))for(const sd of[-1,1]){const k=pintaluokka(r,p.s),w=Math.min(r.w,LEV[k]||r.w),o=w/2+0.5;const x=p.x-sd*p.uz*o,z=p.z+sd*p.ux*o;if(inW(x,z))viitat.push({x,z,ry:Math.atan2(sd*p.uz,-sd*p.ux)});}}
  const M=a=>a.map(p=>M4(p.x,height(p.x,p.z),p.z,p.ry));
  // valon hehku valo-noden kohdalle
  const glowM=new THREE.MeshBasicMaterial({color:0xffd9a0});let glow=null;
  joukko(scene,'katuvalo',M(valot),nodes=>{if(glow)scene.remove(glow);const v=nodes.valo;if(!v)return;glow=new THREE.InstancedMesh(new THREE.SphereGeometry(0.18,8,6),glowM,valot.length);
    M(valot).forEach((m,i)=>glow.setMatrixAt(i,new THREE.Matrix4().multiplyMatrices(m,new THREE.Matrix4().makeTranslation(v.x,v.y,v.z))));glow.frustumCulled=false;scene.add(glow);});
  // ilmajohdot: catenary vierekkäisten saman tien pylväiden johto_N-nodejen välillä
  let wires=null;const wM=new THREE.LineBasicMaterial({color:0x202428});
  joukko(scene,'sahkopylvas',M(sahko),nodes=>{if(wires)scene.remove(wires);const ks=Object.keys(nodes).filter(n=>/^johto_\d+$/.test(n)).sort();const v=[],mats=M(sahko);
    for(let i=0;i<sahko.length-1;i++){const a=sahko[i],b=sahko[i+1];if(a.road!==b.road||Math.hypot(a.x-b.x,a.z-b.z)>70)continue;
      for(const k of ks){const A=nodes[k].clone().applyMatrix4(mats[i]),Bp=nodes[k].clone().applyMatrix4(mats[i+1]);const L=A.distanceTo(Bp),cA=L*L/(8*0.9);// riippuma ~0.9 m
        const pt=t=>{const P=A.clone().lerp(Bp,t);const u=(t-0.5)*L;P.y-=cA*(Math.cosh(L/2/cA)-Math.cosh(u/cA));return P;};
        for(let j=0;j<12;j++){const p=pt(j/12),q=pt((j+1)/12);v.push(p.x,p.y,p.z,q.x,q.y,q.z);}}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));wires=new THREE.LineSegments(g,wM);wires.frustumCulled=false;scene.add(wires);KOHTEET.johtosegmentteja=v.length/6;});
  joukko(scene,'aurausviitta',M(viitat));
  // risteys Yli-Vallintie × Löyhingintie: väistämismerkki Löyhingintien oikealla puolella, Mäntykoski-opaste, maatalousrakennukset
  const loy=ROADS.find(r=>r.n==='Löyhingintie'),p0=loy.pts[0],p1=loy.pts[3]||loy.pts[1],L=Math.hypot(p1[0]-p0[0],p1[1]-p0[1]),ux=(p1[0]-p0[0])/L,uz=(p1[1]-p0[1])/L;
  const at=(s,side)=>({x:p0[0]+ux*s-uz*side,z:p0[1]+uz*s+ux*side});const face=Math.atan2(ux,uz);// kyltin etupuoli kohti tulevaa (Löyhingintieltä risteykseen ajavaa)
  const vm=at(9,-(loy.w/2+1.2));joukko(scene,'vaistamismerkki',[M4(vm.x,height(vm.x,vm.z),vm.z,face)]);
  const op=at(16,(loy.w/2+1.6));joukko(scene,'opaste',[M4(op.x,height(op.x,op.z),op.z,face)]);
  const place=(key,s,side,ry)=>{const p=at(s,side);const m=[M4(p.x,height(p.x,p.z),p.z,face+ry)];joukko(scene,key,m);return p;};
  const tilat={navetta:place('navetta',70,45,Math.PI/2),lato:place('lato',22,48,0),konekatos:place('konekatos',30,17,Math.atan2(uz,-ux)-face)};
  // Löyhingintie × Koppelontie: punainen aitta
  const kp=ROADS.find(r=>r.n==='Koppelontie').pts,kx=kp[1][0]-kp[0][0],kz=kp[1][1]-kp[0][1],kl=Math.hypot(kx,kz);
  const ap={x:LOYH_KOPP.x+kx/kl*14+kz/kl*9,z:LOYH_KOPP.z+kz/kl*14-kx/kl*9};joukko(scene,'aitta',[M4(ap.x,height(ap.x,ap.z),ap.z,Math.atan2(kx,kz))]);
  const info={valot,sahko,viitat,vaistamismerkki:vm,opaste:op,tilat,aitta:ap};KOHTEET.info=info;return info;}
// v0.9: esteet puille – rakennuksen/kyltin/pylvään alue + 3 m (r = puolikas lävistäjä + 3)
const KOKO={navetta:[24,10],lato:[10,6],konekatos:[12,6],aitta:[4,3.2]};
export function esteet(info,SIGNS=[],vara=3){const c=[];const add=(p,r)=>c.push({x:p.x,z:p.z,r:r+vara});
  for(const p of[...info.valot,...info.sahko,...info.viitat])add(p,0.3);add(info.vaistamismerkki,0.5);add(info.opaste,1);
  for(const k in info.tilat)add(info.tilat[k],Math.hypot(...KOKO[k])/2);add(info.aitta,Math.hypot(...KOKO.aitta)/2);for(const s of SIGNS)add(s,0.6);return c;}
export function suodataPuut(trees,info,{SIGNS=[],inBuilding=()=>false}={}){const E=esteet(info,SIGNS);
  return trees.filter(t=>!inBuilding(t.x,t.z,3)&&!E.some(e=>Math.hypot(t.x-e.x,t.z-e.z)<e.r));}
