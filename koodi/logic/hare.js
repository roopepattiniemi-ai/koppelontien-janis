// Metsäjänis-tilakone: makuu -> pako -> kierto (<=~1 km) -> paluuperat (+sivuloikka) -> makuu
import { mulberry32 } from './rng.js';
export const H = { MAKUU:'makuu', PAKO:'pako', KIERTO:'kierto', PALUU:'paluuperat', KUOLLUT:'kuollut' };
export class Hare {
  constructor({x=0,z=0,seed=1}={}){
    this.rand=mulberry32(seed); this.x=x; this.z=z; this.home={x,z}; this.state=H.MAKUU; this.t=0;
    this.trail=[]; this.nightTrail=this.makeNightTrail(); this.heading=0; this.loopAngle=0; this.loops=0;
    this.loopR=200+this.rand()*150; this.dirSign=this.rand()<.5?1:-1; this.speed=0; this.alive=true;
  }
  _pt(arr,x,z,jump=false){arr.push({x,z,jump,dir:Math.atan2(x-(arr.at(-1)?.x??x),-(z-(arr.at(-1)?.z??z)))});}
  // yöjälki ruokailupaikalta makuulle; lopussa 3 paluuperää + sivuloikka
  makeNightTrail(){
    const r=this.rand,t=[];const a=r()*Math.PI*2,L=250;let x=this.home.x+Math.cos(a)*L,z=this.home.z+Math.sin(a)*L;
    for(let i=0;i<=60;i++){const f=i/60;const px=x+(this.home.x-x)*f+Math.sin(f*9)*15,pz=z+(this.home.z-z)*f+Math.cos(f*7)*15;this._pt(t,px,pz);}
    // paluuperät: kuljetaan omaa jälkeä takaisin ja eteen
    const end=t.length-1;for(let k=0;k<3;k++){for(let i=1;i<=6;i++)this._pt(t,t[end-i].x,t[end-i].z);for(let i=5;i>=0;i--)this._pt(t,t[end-i].x,t[end-i].z);}
    // sivuloikka: makuu jäljen sivussa
    const last=t.at(-1);this._pt(t,last.x+2.5,last.z+1.0,true);
    this.x=this.home.x=last.x;this.z=this.home.z=last.z;return t;
  }
  get pos(){return{x:this.x,z:this.z};}
  flush(from){ if(this.state!==H.MAKUU)return; this.state=H.PAKO;this.t=0;
    const a=Math.atan2(this.z-from.z,this.x-from.x);this.heading=a;this.loopAngle=Math.atan2(this.z-this.home.z,this.x-this.home.x)||a; }
  shoot(){this.state=H.KUOLLUT;this.alive=false;this.speed=0;}
  update(dt,{dog,player,playerMoving=false}={}){
    if(!this.alive)return; this.t+=dt; const d=(p)=>p?Math.hypot(p.x-this.x,p.z-this.z):1e9;
    switch(this.state){
      case H.MAKUU:
        this.speed=0;
        if(d(dog)<12 || d(player)<4 || (playerMoving&&d(player)<9)) this.flush(d(dog)<d(player)?dog:player);
        break;
      case H.PAKO: // varovainen pako 10–30 m
        this.speed=6; this._move(dt,this.heading);
        if(this.t>3.5){this.state=H.KIERTO;this.t=0;this.cx=this.x-Math.cos(this.loopAngle)*this.loopR;this.cz=this.z-Math.sin(this.loopAngle)*this.loopR;}
        break;
      case H.KIERTO:{
        const dd=d(dog); this.speed=dd<80?7:dd<200?4.5:2.5;  // säätää vauhtia koiran etäisyyden mukaan
        // pelaaja liikkuu edessä -> jänis väistää (kierto suurenee/vaihtaa puolta)
        if(playerMoving&&d(player)<70){this.loopR=Math.min(480,this.loopR+40*dt);this.veered=true;}
        this.loopAngle+=this.dirSign*this.speed*dt/this.loopR;
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
  _move(dt,a){this.heading=a;this.x+=Math.cos(a)*this.speed*dt;this.z+=Math.sin(a)*this.speed*dt;
    const l=this.trail.at(-1);if(!l||Math.hypot(l.x-this.x,l.z-this.z)>1.5)this._pt(this.trail,this.x,this.z);}
}
