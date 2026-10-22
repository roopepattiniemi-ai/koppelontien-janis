// Vitara: yksinkertainen arcade-ajo, pysyy ajettavalla maalla (tie, piha, pelto)
import { drivable, height } from './world.js';
export class Car {
  constructor({x=0,z=0,heading=0}={}){this.x=x;this.z=z;this.heading=heading;this.speed=0;this.occupied=false;this.pose();}
  // heading 0 = pohjoiseen (-z)
  update(dt,{throttle=0,steer=0}={}){
    const max=throttle<0&&this.speed<=0.5?-5:16;
    if(throttle>0)this.speed=Math.min(max,this.speed+8*dt);
    else if(throttle<0)this.speed=this.speed>0.5?Math.max(0,this.speed-14*dt):Math.max(-5,this.speed-5*dt);
    else this.speed*=Math.pow(0.4,dt);
    this.heading+=steer*dt*1.4*Math.max(-1,Math.min(1,this.speed/4));
    const nx=this.x+Math.sin(this.heading)*this.speed*dt,nz=this.z-Math.cos(this.heading)*this.speed*dt;
    if(drivable(nx,nz)){this.x=nx;this.z=nz;}else this.speed=0;
    this.pose();
  }
  // asento rinteessä: y maaston pinnalla, pitch/roll pyörien kohdilta
  pose(){const fx=Math.sin(this.heading),fz=-Math.cos(this.heading),L=1.3,Wd=0.8;
    const hf=height(this.x+fx*L,this.z+fz*L),hb=height(this.x-fx*L,this.z-fz*L),hl=height(this.x+fz*Wd,this.z-fx*Wd),hr=height(this.x-fz*Wd,this.z+fx*Wd);
    this.y=Math.max((hf+hb)/2,(hl+hr)/2,height(this.x,this.z));this.pitch=Math.atan2(hf-hb,2*L);this.roll=Math.atan2(hl-hr,2*Wd);return this;}
  // nousu: vaatii että koira on narussa (tai matkassa)
  canEnter(player,dog){const d=Math.hypot(player.x-this.x,player.z-this.z);
    if(d>3)return{ok:false,syy:'Liian kaukana autosta'}; if(!dog.leashed)return{ok:false,syy:'Kytke koira ensin (F)'}; return{ok:true};}
  exitPos(){return{x:this.x-Math.cos(this.heading)*1.8,z:this.z-Math.sin(this.heading)*1.8};} // kuljettajan puoli (mallin +X)
}
