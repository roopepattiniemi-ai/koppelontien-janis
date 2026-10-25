// Metsäjänis-tilakone: makuu -> pako -> ajon lenkki (150–400 m, paluu ylösajoon) -> paluuperät -> makuu
import { mulberry32 } from './rng.js';
import { turnBack, clampB, BOUND } from './bounds.js';
import { ROADS, FIELDS } from './world.js';
export const H = { MAKUU:'makuu', PAKO:'pako', KIERTO:'kierto', PALUU:'paluuperat', KUOLLUT:'kuollut' };
// Alkujäljen hämäykset: sivuloikka (jump) tai paluu omalle jäljelle. Rauhallinen mutka ei ole hämäys.
export function alkujaljenHamaykset(trail){
  const t=trail||[];let n=0;
  for(const p of t)if(p.jump)n++;
  for(let i=10;i<t.length;i++){const p=t[i];
    for(let j=0;j<i-8;j++){if(Math.hypot(p.x-t[j].x,p.z-t[j].z)>1.8)continue;
      const mid=t[(i+j)>>1];if(Math.hypot(mid.x-t[j].x,mid.z-t[j].z)<6)continue;n++;i+=10;break;}}
  return n;
}
const SISALLA = BOUND - 30;
const rajaa = (x, z) => ({ x: Math.max(-SISALLA, Math.min(SISALLA, x)), z: Math.max(-SISALLA, Math.min(SISALLA, z)) });

// Hiljaa seisova tai kyykyssä oleva metsästäjä lähellä ylösajoa. Juokseva ei ole passi.
export function passiKohde(hunters, ylos, max = 280) {
  let best = null, bd = 1e9;
  for (const h of hunters || []) {
    if (!h || h.inCar || h.moving || h.run) continue;
    const d = Math.hypot(h.x - ylos.x, h.z - ylos.z);
    if (d > max || d >= bd) continue;
    bd = d; best = h;
  }
  return best;
}
export class Hare {
  constructor({x=0,z=0,seed=1,feed=null,laji='janis'}={}){this.feed=feed;this.seed=seed|0;this.laji=laji==='kettu'?'kettu':'janis';
    this.rand=mulberry32(seed); this.x=x; this.z=z; this.home={x,z}; this.state=H.MAKUU; this.t=0;
    this.trail=[]; this.nightTrail=this.makeNightTrail(); this.heading=0; this.loopAngle=0; this.loops=0;
    this.relocT=180+this.rand()*300;this.wounded=false;this.loopR=200+this.rand()*150; this.dirSign=this.rand()<.5?1:-1; this.speed=0; this.alive=true;
  }
  _pt(arr,x,z,jump=false){arr.push({x,z,jump,dir:Math.atan2(x-(arr.at(-1)?.x??x),-(z-(arr.at(-1)?.z??z)))});}
  // Vanha yöjälki kulutti this.rand samalla kaavalla. Kulutus pidetään, jotta ajon satunnaisuus ei vaihdu.
  _vanhaYokulutus(){
    const r=this.rand,H0=this.home;let fx,fz,x,z,h;
    for(let k=0;k<60;k++){const a=r()*Math.PI*2,L=150+r()*250;fx=H0.x+Math.cos(a)*L;fz=H0.z+Math.sin(a)*L;if(!this.feed||this.feed(fx,fz))break;}
    x=fx;z=fz;h=r()*6.28;for(let i=0;i<25;i++){h+=(r()-.5)*1.8;x+=Math.cos(h)*1.3;z+=Math.sin(h)*1.3;}
    for(let i=0;i<600;i++){const dx=H0.x-x,dz=H0.z-z,D=Math.hypot(dx,dz);if(D<2)break;const want=Math.atan2(dz,dx);let e=want-h;e=Math.atan2(Math.sin(e),Math.cos(e));
      h+=e*0.25+(r()-.5)*0.9;x+=Math.cos(h)*1.6;z+=Math.sin(h)*1.6;}
  }
  // Yöjälki: rauhallinen ruokailujälki makuulle. Ei paluuperiä eikä sivuloikkia.
  // Juuri ennen makuuta voi olla yksi pieni koukkaus. Hämäykset kuuluvat ajoon.
  makeNightTrail(){
    this._vanhaYokulutus();
    const r=mulberry32((this.seed||1)^0xA5A5),t=[],H0=this.home;let fx,fz;
    for(let k=0;k<60;k++){const a=r()*Math.PI*2,L=150+r()*250;fx=H0.x+Math.cos(a)*L;fz=H0.z+Math.sin(a)*L;if(!this.feed||this.feed(fx,fz))break;}
    let x=fx,z=fz,h=Math.atan2(H0.z-fz,H0.x-fx);
    for(let i=0;i<18;i++){h+=(r()-.5)*0.28;x+=Math.cos(h)*1.4;z+=Math.sin(h)*1.4;this._pt(t,x,z);
      if(i%6===5){const bend=(r()-.5)*0.45;for(let j=0;j<4;j++){h+=bend*0.2;x+=Math.cos(h)*1.15;z+=Math.sin(h)*1.15;this._pt(t,x,z);}}}
    for(let i=0;i<700;i++){const dx=H0.x-x,dz=H0.z-z,D=Math.hypot(dx,dz);if(D<10)break;const want=Math.atan2(dz,dx);let e=want-h;e=Math.atan2(Math.sin(e),Math.cos(e));
      h+=e*0.5+(r()-.5)*0.16;x+=Math.cos(h)*1.7;z+=Math.sin(h)*1.7;this._pt(t,x,z);}
    if(r()<0.5){const side=r()<0.5?1:-1;for(let i=0;i<6;i++){const dx=H0.x-x,dz=H0.z-z,D=Math.hypot(dx,dz)||1,want=Math.atan2(dz,dx);
      h=want+Math.sin((i+1)/7*Math.PI)*0.85*side;x+=Math.cos(h)*1.6;z+=Math.sin(h)*1.6;this._pt(t,x,z,i===3);}}
    for(let i=0;i<24;i++){const dx=H0.x-x,dz=H0.z-z,D=Math.hypot(dx,dz);if(D<1.2)break;h=Math.atan2(dz,dx);const step=Math.min(1.6,D);
      x+=Math.cos(h)*step;z+=Math.sin(h)*step;this._pt(t,x,z);}
    this._pt(t,H0.x,H0.z);
    for(const p of t){p.yo=true;p.synty=0;}
    this.x=H0.x;this.z=H0.z;this.home={x:H0.x,z:H0.z};return t;
  }
  // Makuupaikan vaihto päivällä: lyhyt suora siirtymä, jatkaa yöjälkeä ilman sivuloikkaa.
  relocate(){const r=this.rand,a=r()*6.28,n=6+(r()*10|0);let h=a;for(let i=0;i<n;i++){h+=(r()-.5)*0.28;this.x+=Math.cos(h)*1.5;this.z+=Math.sin(h)*1.5;this._pt(this.nightTrail,this.x,this.z);const p=this.nightTrail.at(-1);p.yo=true;p.synty=this.kello||0;}
    this.home={x:this.x,z:this.z};this.relocations=(this.relocations||0)+1;}
  // haavoittuminen: jos makuulla, lähtee; hidastuu ja jättää verijälkeä (main.js piirtää)
  // dmg 0..1 kertyy; vakavuus -> hidastus, taukojen tiheys/pituus, verijäljen tiheys
  wound(dmg,from){this.wounded=true;this.damage=Math.min(0.95,(this.damage||0)+dmg);this.pauseT=this.pauseT??this._pauseGap();if(this.state===H.MAKUU||this.paused)this.flush(from||{x:this.x+1,z:this.z});}
  _pauseGap(){return 3+22*(1-(this.damage||0))*(0.6+0.8*this.rand());}
  get bloodStep(){return 0.6+3*(1-(this.damage||0));}
  shoot(by){this.state=H.KUOLLUT;this.alive=false;this.speed=0;this.paused=false;this.killedBy=by;}
  get pos(){return{x:this.x,z:this.z};}
  flush(from){ if(this.state!==H.MAKUU&&!this.paused)return; this.paused=false;this.state=H.PAKO;this.t=0;
    this.ylos={x:this.x,z:this.z};this.lenkki=null;this.reitit=new Set();
    const a=Math.atan2(this.z-from.z,this.x-from.x);this.heading=a;this.loopAngle=a; }
  // Ajon lenkki: kaari kauas (150–400 m), paluu omaa yöjälkeä ja ohi passin.
  _lenkki(lista, dog){
    const y=this.ylos||this.home, r=this.rand;this.reitit=this.reitit||new Set();
    const kartta=maastoPisteet(y);
    const kettu=this.laji==='kettu';
    let far=null, fd=0, fi=0;
    const farMax=kettu?560:400, farMin=kettu?220:150;
    this.nightTrail.forEach((p,i)=>{const d=Math.hypot(p.x-y.x,p.z-y.z);if(d<=farMax&&d>fd){fd=d;far=p;fi=i;}});
    if(!far||fd<farMin){const a=this.heading||r()*6.28,L=(kettu?250:160)+r()*(kettu?280:220);far=rajaa(y.x+Math.cos(a)*L,y.z+Math.sin(a)*L);fd=Math.hypot(far.x-y.x,far.z-y.z);fi=0;}
    const ang=Math.atan2(far.z-y.z,far.x-y.x);
    const dox=this.x-(dog?.x??this.x+1),doz=this.z-(dog?.z??this.z);
    const side=dox*Math.sin(ang)-doz*Math.cos(ang)>=0?1:-1;
    const pull=35+r()*40;
    const cx=(this.x+far.x)/2+Math.cos(ang+side*Math.PI/2)*pull, cz=(this.z+far.z)/2+Math.sin(ang+side*Math.PI/2)*pull;
    const maasto=lahinMaasto(cx,cz,kartta)||lahinMaasto(y.x,y.z,kartta)||lahinMaasto(far.x,far.z,kartta);
    const kx=maasto?maasto.x:cx, kz=maasto?maasto.z:cz;
    const pts=[];
    const lisaa=(x,z,laji,jump=false)=>{const q=rajaa(x,z);const e=pts.at(-1);if(e&&Math.hypot(e.x-q.x,e.z-q.z)<8)return;pts.push({x:q.x,z:q.z,laji,jump});if(laji)this.reitit.add(laji);};
    const n=8;
    for(let i=1;i<=n;i++){const t=i/n,u=1-t,x=u*u*this.x+2*u*t*kx+t*t*far.x,z=u*u*this.z+2*u*t*kz+t*t*far.z;
      const s=kiinnita(x,z,kartta);lisaa(s?s.x:x,s?s.z:z,s?s.laji:(maasto&&i===n>>1?maasto.laji:null),kettu?i%3===0:i===4);}
    if(maasto)this.reitit.add(maasto.laji);
    // paluu yöjälkeä pitkin ylösajoa kohti
    for(let i=fi;i<this.nightTrail.length;i+=4){const p=this.nightTrail[i];if(Math.hypot(p.x-y.x,p.z-y.z)>420)continue;lisaa(p.x,p.z,'yo',i===fi+8);}
    this._ohitus(lista, pts);irtiPassista(pts, lista, y, this.laji);
    this.lenkki=pts.length?pts:[{x:y.x,z:y.z,laji:'yo'}];
    this.li=0;this.puoli=false;this.passId=passiId(passiKohde(lista,y));
  }
  _ohitus(lista, pts){
    const y=this.ylos||this.home, p=passiKohde(lista,y);
    if(p){const o=ohiPiste(p,y,this.rand,this.laji);pts.push({x:o.x,z:o.z,laji:'passi'});this.reitit.add('passi');}
    const q=rajaa(y.x+(this.rand()-.5)*12,y.z+(this.rand()-.5)*12);
    pts.push({x:q.x,z:q.z,laji:'yo'});this.reitit.add('yo');
  }
  update(dt,{dog,player,playerMoving=false,hunters,kello}={}){
    this.kello=kello!=null?kello:(this.kello||0)+dt;
    const flushR=4;
    if(!this.alive)return;
    // haavoittunut: tauot (tiheämpiä ja pidempiä kun vahinko suuri), verijälki this.blood
    if(this.wounded&&this.state!==H.MAKUU){if(this.paused){if((this.pauseT-=dt)<=0){this.paused=false;this.pauseT=this._pauseGap();}this.speed=0;return;}
      if((this.pauseT-=dt)<=0){this.paused=true;this.pauseT=1+6*this.damage*(0.5+this.rand());return;}
      const b=(this.blood||(this.blood=[])).at(-1);if(!b||Math.hypot(b.x-this.x,b.z-this.z)>this.bloodStep)this.blood.push({x:this.x,z:this.z});}
    this.t+=dt; const d=(p)=>p?Math.hypot(p.x-this.x,p.z-this.z):1e9;
    const lista=hunters?.length?hunters:(player?[{...player,moving:!!playerMoving||!!player.moving,crouch:!!player.crouch,run:!!player.run}]:[]);
    switch(this.state){
      case H.MAKUU:
        this.speed=0;this.relocT-=dt;if(this.relocT<=0){this.relocT=180+this.rand()*300;if(d(dog)>60&&d(player)>60)this.relocate();}
        if(d(dog)<12 || d(player)<flushR || (playerMoving&&d(player)<9)) this.flush(d(dog)<d(player)?dog:player);
        break;
      case H.PAKO: // varovainen pako 10–30 m
        this.speed=6; this._move(dt,this.heading);
        if(this.t>3.5){this.state=H.KIERTO;this.t=0;this._lenkki(lista,dog);}
        break;
      case H.KIERTO:{
        if(!this.lenkki)this._lenkki(lista,dog);
        const dd=d(dog);
        // terve jänis pitää koiran 50–150 m takana; haavoittunut hidastuu kuten ennen
        if(this.laji==='kettu'){
          if(this.wounded)this.speed=dd<90?8.2:dd<220?5.2:3.2;
          else if(this.jarruT>0){this.jarruT-=dt;this.speed=2.4;}
          else if(dd<60)this.speed=8.4;
          else if(dd>180)this.speed=3.6;
          else this.speed=5.4;
        }else if(this.wounded)this.speed=dd<80?7:dd<200?4.5:2.5;
        else if(this.jarruT>0){this.jarruT-=dt;this.speed=2.1;}
        else if(dd<50)this.speed=7.6;
        else if(dd>150)this.speed=3;
        else this.speed=4.6;
        const wp=this.lenkki[Math.min(this.li,this.lenkki.length-1)];
        let tx=wp.x,tz=wp.z;
        for(const h of lista){if(h.inCar)continue;const dx=this.x-h.x,dz=this.z-h.z,dist=Math.hypot(dx,dz);if(dist<0.4)continue;
          const juoksuRaja=this.laji==='kettu'?72:58, seisRaja=this.laji==='kettu'?28:17;
          if(h.moving||h.run){if(dist<juoksuRaja){tx=this.x+dx/dist*10;tz=this.z+dz/dist*10;this.veered=true;}}
          else if(dist<seisRaja){tx=this.x+dx/dist*8;tz=this.z+dz/dist*8;}}
        this._move(dt,Math.atan2(tz-this.z,tx-this.x));
        if(Math.hypot(wp.x-this.x,wp.z-this.z)<4||(this.askel=(this.askel||0)+dt)>5){this.askel=0;
          if(wp.jump&&!wp._tehty){wp._tehty=true;this._hook=true;const viim=this.trail.at(-1);if(viim)viim.jump=true;if(!this.wounded)this.jarruT=1.35;this.koukut=(this.koukut||0)+1;}
          if(this.li<this.lenkki.length)this.li++;}
        // paluumatkalla passi päivittyy: hiljaa seisonut ehtii vielä kohteeksi
        if(!this.puoli&&this.li>this.lenkki.length*0.55){this.puoli=true;const id=passiId(passiKohde(lista,this.ylos||this.home));
          if(id!==this.passId){this.passId=id;this.lenkki=this.lenkki.slice(0,this.li);this._ohitus(lista,this.lenkki);}}
        if(this.li>=this.lenkki.length){this.loops++;this.state=H.PALUU;this.t=0;this.back=0;this.lenkki=null;}
        break;}
      case H.PALUU:{ // lyhyt paluu omia jälkiä ja sivuloikka, josta koira hukkaa
        this.speed=this.wounded?2.2:3.4;
        const i=this.trail.length-1-(this.back||0);
        const backN=this.laji==='kettu'?14:8;
        if((this.back||0)<backN&&i>1){const p=this.trail[i];this._move(dt,Math.atan2(p.z-this.z,p.x-this.x));if(Math.hypot(p.x-this.x,p.z-this.z)<2.2)this.back++;}
        else{this._hook=true;this._move(dt,this.heading+(this.laji==='kettu'?2.1:1.5)*(this.dirSign||1));const viim=this.trail.at(-1);if(viim)viim.jump=true;
          const nukkumaan=this.laji==='kettu'?this.loops>=3&&this.rand()<.35:this.loops>=2&&this.rand()<.55;
          this.state=nukkumaan?H.MAKUU:H.KIERTO;this.t=0;if(this.state===H.MAKUU)this.speed=0;}
        break;}
    }
  }
  _move(dt,a){a=turnBack(this.x,this.z,a);this.heading=a;if(this.wounded)this.speed*=1-0.75*this.damage;this.x=clampB(this.x+Math.cos(a)*this.speed*dt);this.z=clampB(this.z+Math.sin(a)*this.speed*dt);
    const l=this.trail.at(-1);if(!l||Math.hypot(l.x-this.x,l.z-this.z)>1.5){this._pt(this.trail,this.x,this.z,!!this._hook);const vi=this.trail.at(-1);if(vi&&vi.synty==null)vi.synty=this.kello||0;this._hook=false;}}
}

function passiId(p){return p?((p.id??'')+':'+Math.round(p.x)+','+Math.round(p.z)):'';}
// Ohitus 18–34 m passista, ylösajon puolelta, jotta paikallaan olija näkee jäniksen läheltä.
function ohiPiste(h,y,rand,laji){let dx=y.x-h.x,dz=y.z-h.z,L=Math.hypot(dx,dz);
  if(L<8){const a=rand()*6.28;dx=Math.cos(a);dz=Math.sin(a);L=1;}
  const dist=laji==='kettu'?36+rand()*34:18+rand()*16;return rajaa(h.x+dx/L*dist,h.z+dz/L*dist);}
function maastoPisteet(y){const out=[];
  for(const r of ROADS){const p=r.pts;for(let i=0;i<p.length-1;i+=3){const [x,z]=p[i];if(Math.abs(x-y.x)>380||Math.abs(z-y.z)>380)continue;
    const [x2,z2]=p[i+1],dx=x2-x,dz=z2-z,L=Math.hypot(dx,dz)||1;out.push({x,z,px:-dz/L,pz:dx/L,c:r.c,w:r.w});}}
  for(const P of FIELDS){let cx=0,cz=0;for(const [a,b] of P){cx+=a;cz+=b;}cx/=P.length;cz/=P.length;
    for(let i=0;i<P.length;i++){const [x,z]=P[i],[x2,z2]=P[(i+1)%P.length],mx=(x+x2)/2,mz=(z+z2)/2;
      if(Math.abs(mx-y.x)>380||Math.abs(mz-y.z)>380)continue;out.push({x:mx,z:mz,px:mx-cx,pz:mz-cz,c:'pelto',w:0});}}
  return out;}
function sivulle(f){const L=Math.hypot(f.px,f.pz)||1,o=f.c==='tie'?f.w/2+1.7:f.c==='pelto'?4:f.w/2+1.4;
  return {x:f.x+f.px/L*o,z:f.z+f.pz/L*o,laji:f.c==='tie'?'oja':f.c==='pelto'?'pelto':'metsatie'};}
function lahinMaasto(x,z,kartta){let best=null,bd=110;for(const f of kartta){const d=Math.hypot(f.x-x,f.z-z);if(d<bd){bd=d;best=f;}}
  if(!best)return null;const s=sivulle(best);return {...rajaa(s.x,s.z),laji:s.laji};}
function kiinnita(x,z,kartta){let best=null,bd=24;for(const f of kartta){const d=Math.hypot(f.x-x,f.z-z);if(d<bd){bd=d;best=f;}}
  if(!best)return null;const s=sivulle(best);const q=rajaa(s.x,s.z);if(Math.hypot(q.x-x,q.z-z)>32)return null;return {...q,laji:s.laji};}
function irtiPassista(pts, lista, y, laji){const p=passiKohde(lista,y);if(!p)return;const min=laji==='kettu'?30:15, ulos=laji==='kettu'?42:20;
  for(const q of pts){const dx=q.x-p.x,dz=q.z-p.z,d=Math.hypot(dx,dz);
  if(d>0.2&&d<min){q.x=p.x+dx/d*ulos;q.z=p.z+dz/d*ulos;}}}
