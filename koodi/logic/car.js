// Vitara: yksinkertainen arcade-ajo. Tie/piha täysi teho, maastossa (pelto, metsä, ojat) huippunopeus ja kiihtyvyys −30 %.
// Pysäyttävät: rakennukset, kartan reuna ja this.blocked(x,z) (puut, asetetaan main.js:ssä).
import { height, distToRoad, inYard, inBuilding, SIZE, inBounds } from './world.js';
export const MAASTO=0.7;
export const onRoad=(x,z)=>distToRoad(x,z)<0.6||inYard(x,z);
export const carFree=(x,z)=>!inBuilding(x,z)&&inBounds(x,z);
// vitara.glb-runko paikallisessa xz:ssä (pyörät mukana) + pieni vara, ettei koira leikkaa koria.
// yaw vastaa carObj.rotation.y = π − heading.
export const BODY={minx:-1.1,maxx:1.1,minz:-2.2,maxz:2.0};
export const bodyBox=c=>({x:c.x,z:c.z,yaw:Math.PI-c.heading,...BODY});
export class Car {
  constructor({x=0,z=0,heading=0}={}){this.x=x;this.z=z;this.heading=heading;this.speed=0;this.occupied=false;this.blocked=()=>false;this.pose();}
  // heading 0 = pohjoiseen (-z)
  update(dt,{throttle=0,steer=0}={}){
    const k=onRoad(this.x,this.z)?1:MAASTO;this.offroad=k<1;
    const max=(throttle<0&&this.speed<=0.5?-5:16)*k;
    if(throttle>0)this.speed=this.speed>max?Math.max(max,this.speed-14*dt):Math.min(max,this.speed+8*k*dt);
    else if(throttle<0)this.speed=this.speed>0.5?Math.max(0,this.speed-14*dt):Math.max(-5*k,this.speed-5*k*dt);
    else this.speed*=Math.pow(0.4,dt);
    this.heading+=steer*dt*1.4*Math.max(-1,Math.min(1,this.speed/4));
    const nx=this.x+Math.sin(this.heading)*this.speed*dt,nz=this.z-Math.cos(this.heading)*this.speed*dt;
    if(carFree(nx,nz)&&!this.blocked(nx,nz)){this.x=nx;this.z=nz;}else this.speed=0;
    this.pose();
  }
  // asento rinteessä: y maaston pinnalla, pitch/roll pyörien kohdilta
  pose(){const fx=Math.sin(this.heading),fz=-Math.cos(this.heading),L=1.3,Wd=0.8;
    const hf=height(this.x+fx*L,this.z+fz*L),hb=height(this.x-fx*L,this.z-fz*L),hl=height(this.x+fz*Wd,this.z-fx*Wd),hr=height(this.x-fz*Wd,this.z+fx*Wd);
    this.y=Math.max((hf+hb)/2,(hl+hr)/2,height(this.x,this.z));this.pitch=Math.atan2(hf-hb,2*L);this.roll=Math.atan2(hl-hr,2*Wd);return this;}
  // nousu: riittää että on auton vieressä (koiraa ei oteta kyytiin)
  canEnter(player){const d=Math.hypot(player.x-this.x,player.z-this.z);
    if(d>3)return{ok:false,syy:'Liian kaukana autosta'};return{ok:true};}
  exitPos(){return{x:this.x-Math.cos(this.heading)*1.8,z:this.z-Math.sin(this.heading)*1.8};} // kuljettajan puoli (mallin +X)
}
