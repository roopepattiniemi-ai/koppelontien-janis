// Metsäjänis-tilakone: makuu -> pako -> kierto (<=~1 km) -> paluuperat (+sivuloikka) -> makuu
import { mulberry32 } from './rng.js';
import { turnBack, clampB } from './bounds.js';
export const H = { MAKUU:'makuu', PAKO:'pako', KIERTO:'kierto', PALUU:'paluuperat', KUOLLUT:'kuollut' };
export class Hare {
  constructor({x=0,z=0,seed=1,feed=null}={}){this.feed=feed;
    this.rand=mulberry32(seed); this.x=x; this.z=z; this.home={x,z}; this.state=H.MAKUU; this.t=0;
    this.trail=[]; this.nightTrail=this.makeNightTrail(); this.heading=0; this.loopAngle=0; this.loops=0;
    this.relocT=180+this.rand()*300;this.wounded=false;this.loopR=200+this.rand()*150; this.dirSign=this.rand()<.5?1:-1; this.speed=0; this.alive=true;
  }
  _pt(arr,x,z,jump=false){arr.push({x,z,jump,dir:Math.atan2(x-(arr.at(-1)?.x??x),-(z-(arr.at(-1)?.z??z)))});}
  // yöjälki ruokailupaikalta makuulle; lopussa 3 paluuperää + sivuloikka
  // yöreitti: ruokailupaikka (pelto/oja/pajukko, feed(x,z)) -> mutkitteleva kulku makuulle; ruokailun pyörinät,
  // lopussa 3 paluuperää + sivuloikka. Täysin siemenestä (rand) -> sama kaikilla pelaajilla.
  makeNightTrail(){
    const r=this.rand,t=[],H0=this.home;let fx,fz;
    for(let k=0;k<60;k++){const a=r()*Math.PI*2,L=150+r()*250;fx=H0.x+Math.cos(a)*L;fz=H0.z+Math.sin(a)*L;if(!this.feed||this.feed(fx,fz))break;}
    // ruokailu: pieniä silmukoita ruokapaikan ympärillä
    let x=fx,z=fz,h=r()*6.28;for(let i=0;i<25;i++){h+=(r()-.5)*1.8;x+=Math.cos(h)*1.3;z+=Math.sin(h)*1.3;this._pt(t,x,z);}
    // kulku makuulle: suunta kohti makuuta + kohina, askel ~1.6 m
    for(let i=0;i<600;i++){const dx=H0.x-x,dz=H0.z-z,D=Math.hypot(dx,dz);if(D<2)break;const want=Math.atan2(dz,dx);let e=want-h;e=Math.atan2(Math.sin(e),Math.cos(e));
      h+=e*0.25+(r()-.5)*0.9;x+=Math.cos(h)*1.6;z+=Math.sin(h)*1.6;this._pt(t,x,z);}
    this._pt(t,H0.x,H0.z);
    // paluuperät: kuljetaan omaa jälkeä takaisin ja eteen (koukkaus)
    const end=t.length-1;for(let k=0;k<3;k++){for(let i=1;i<=6;i++)this._pt(t,t[end-i].x,t[end-i].z);for(let i=5;i>=0;i--)this._pt(t,t[end-i].x,t[end-i].z);}
    // sivuloikka: makuu jäljen sivussa
    const last=t.at(-1);this._pt(t,last.x+2.5,last.z+1.0,true);
    this.x=this.home.x=last.x;this.z=this.home.z=last.z;return t;
  }
  // makuupaikan vaihto: lyhyt siirtymä + sivuloikka, jatkaa yöjälkeä (koira löytää uuden makuun)
  relocate(){const r=this.rand,a=r()*6.28,n=6+(r()*10|0);let h=a;for(let i=0;i<n;i++){h+=(r()-.5)*0.8;this.x+=Math.cos(h)*1.5;this.z+=Math.sin(h)*1.5;this._pt(this.nightTrail,this.x,this.z);}
    this.x+=Math.cos(h+1.4)*2.5;this.z+=Math.sin(h+1.4)*2.5;this._pt(this.nightTrail,this.x,this.z,true);this.home={x:this.x,z:this.z};this.relocations=(this.relocations||0)+1;}
  // haavoittuminen: jos makuulla, lähtee; hidastuu ja jättää verijälkeä (main.js piirtää)
  // dmg 0..1 kertyy; vakavuus -> hidastus, taukojen tiheys/pituus, verijäljen tiheys
  wound(dmg,from){this.wounded=true;this.damage=Math.min(0.95,(this.damage||0)+dmg);this.pauseT=this.pauseT??this._pauseGap();if(this.state===H.MAKUU||this.paused)this.flush(from||{x:this.x+1,z:this.z});}
  _pauseGap(){return 3+22*(1-(this.damage||0))*(0.6+0.8*this.rand());}
  get bloodStep(){return 0.6+3*(1-(this.damage||0));}
  shoot(by){this.state=H.KUOLLUT;this.alive=false;this.speed=0;this.paused=false;this.killedBy=by;}
  get pos(){return{x:this.x,z:this.z};}
  flush(from){ if(this.state!==H.MAKUU&&!this.paused)return; this.paused=false;this.state=H.PAKO;this.t=0;
    const a=Math.atan2(this.z-from.z,this.x-from.x);this.heading=a;this.loopAngle=Math.atan2(this.z-this.home.z,this.x-this.home.x)||a; }
  update(dt,{dog,player,playerMoving=false}={}){
    const flushR=4;
    if(!this.alive)return;
    // haavoittunut: tauot (tiheämpiä ja pidempiä kun vahinko suuri), verijälki this.blood
    if(this.wounded&&this.state!==H.MAKUU){if(this.paused){if((this.pauseT-=dt)<=0){this.paused=false;this.pauseT=this._pauseGap();}this.speed=0;return;}
      if((this.pauseT-=dt)<=0){this.paused=true;this.pauseT=1+6*this.damage*(0.5+this.rand());return;}
      const b=(this.blood||(this.blood=[])).at(-1);if(!b||Math.hypot(b.x-this.x,b.z-this.z)>this.bloodStep)this.blood.push({x:this.x,z:this.z});}
    this.t+=dt; const d=(p)=>p?Math.hypot(p.x-this.x,p.z-this.z):1e9;
    switch(this.state){
      case H.MAKUU:
        this.speed=0;this.relocT-=dt;if(this.relocT<=0){this.relocT=180+this.rand()*300;if(d(dog)>60&&d(player)>60)this.relocate();}
        if(d(dog)<12 || d(player)<flushR || (playerMoving&&d(player)<9)) this.flush(d(dog)<d(player)?dog:player);
        break;
      case H.PAKO: // varovainen pako 10–30 m
        this.speed=6; this._move(dt,this.heading);
        if(this.t>3.5){this.state=H.KIERTO;this.t=0;this.cx=this.x-Math.cos(this.loopAngle)*this.loopR;this.cz=this.z-Math.sin(this.loopAngle)*this.loopR;this.qA=this.loopAngle;this.anchor=this.home;}
        break;
      case H.KIERTO:{
        const dd=d(dog); this.speed=dd<80?7:dd<200?4.5:2.5;  // säätää vauhtia koiran etäisyyden mukaan
        // pelaaja liikkuu edessä -> jänis väistää (kierto suurenee/vaihtaa puolta)
        if(playerMoving&&d(player)<70){this.loopR=Math.min(480,this.loopR+40*dt);this.veered=true;}
        // vaiheittainen kaarto pelaajaa kohti: joka neljänneskierroksella lenkin keskipistettä siirretään ~30 %
        // kohti paikkaa, josta kierros kulkee pelaajan (tai lähtöpaikan) läheltä -> laaja lenkki, joka palaa takaisin
        // kaukana (>300 m lähtöpaikasta) oleva pelaaja ei vedä, silloin palataan lähtöpaikalle
        this.anchor=player&&Math.hypot(player.x-this.home.x,player.z-this.home.z)<300?{x:player.x,z:player.z}:this.home;
        if(Math.abs(this.loopAngle-this.qA)>Math.PI/2){this.qA=this.loopAngle;const A=this.anchor||this.home,dx=this.cx-A.x,dz=this.cz-A.z,L=Math.hypot(dx,dz)||1,want=this.loopR*0.85;
          const tx=A.x+dx/L*want,tz=A.z+dz/L*want,k=0.25+this.rand()*0.15;this.cx+=(tx-this.cx)*k;this.cz+=(tz-this.cz)*k;}
        this.loopAngle+=this.dirSign*this.speed*dt/(this.loopR*(1+0.25*Math.sin(this.loopAngle*3+this.dirSign)));
        const tx=this.cx+Math.cos(this.loopAngle)*this.loopR,tz=this.cz+Math.sin(this.loopAngle)*this.loopR;
        this._move(dt,Math.atan2(tz-this.z,tx-this.x));
        if(Math.abs(this.loopAngle-(this.startA??(this.startA=this.loopAngle)))>Math.PI*2*(this.loops+1)){this.loops++;}
        if(this.t>25 && this.rand()<dt*0.05 && dd>60){this.state=H.PALUU;this.t=0;this.back=0;this.backN=0;}
        break;}
      case H.PALUU:{ // kulkee omia jälkiään takaisin ~30 m, sitten sivuloikka
        const i=this.trail.length-2-this.back*2; this.speed=3;
        if(this.back<20 && i>0){const p=this.trail[Math.max(0,this.trail.length-1-this.back*2)];this.x=p.x;this.z=p.z;this.back++;}
        else{const a=Math.atan2(this.z-this.cz,this.x-this.cx);this.x+=Math.cos(a)*3;this.z+=Math.sin(a)*3;
          this._pt(this.trail,this.x,this.z,true);this.loopR=Math.hypot(this.x-this.cx,this.z-this.cz);this.loopAngle=Math.atan2(this.z-this.cz,this.x-this.cx);
          this.state=this.loops>=2&&this.rand()<.6?H.MAKUU:H.KIERTO;this.t=0;}
        break;}
    }
  }
  _move(dt,a){a=turnBack(this.x,this.z,a);this.heading=a;if(this.wounded)this.speed*=1-0.75*this.damage;this.x=clampB(this.x+Math.cos(a)*this.speed*dt);this.z=clampB(this.z+Math.sin(a)*this.speed*dt);
    const l=this.trail.at(-1);if(!l||Math.hypot(l.x-this.x,l.z-this.z)>1.5)this._pt(this.trail,this.x,this.z);}
}
