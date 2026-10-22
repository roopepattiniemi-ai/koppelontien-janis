// Muut eläimet: vaeltaa -> pakenee (pelaaja/koira lähellä) -> rauhoittuu
import { mulberry32 } from './rng.js';
export const SPECIES={kettu:{walk:1.1,run:9,fear:35,calm:12},peura:{walk:0.9,run:11,fear:60,calm:15},orava:{walk:0.7,run:4.5,fear:12,calm:6}};
export class Critter{
  constructor(kind,{x=0,z=0,seed=1}={}){this.kind=kind;this.p=SPECIES[kind];this.rand=mulberry32(seed);this.x=x;this.z=z;this.home={x,z};this.heading=this.rand()*6.28;this.state='vaeltaa';this.t=0;this.speed=0;this.alive=true;this.trail=[];this.pause=0;}
  update(dt,{threats=[],ok=()=>true}={}){if(!this.alive)return;this.t+=dt;let near=null,nd=1e9;for(const p of threats){if(!p)continue;const d=Math.hypot(p.x-this.x,p.z-this.z);if(d<nd){nd=d;near=p;}}
    if(near&&nd<this.p.fear&&this.state!=='pakenee'){this.state='pakenee';this.t=0;this.fled=true;}
    if(this.state==='pakenee'){this.speed=this.p.run;if(near)this.heading=Math.atan2(this.z-near.z,this.x-near.x)+Math.sin(this.t*1.3)*0.3;if(this.t>this.p.calm&&nd>this.p.fear*1.5){this.state='vaeltaa';this.t=0;this.home={x:this.x,z:this.z};}}
    else{if(this.pause>0){this.pause-=dt;this.speed=0;}else{this.speed=this.p.walk;this.heading+=(this.rand()-.5)*dt*1.5;const hd=Math.hypot(this.x-this.home.x,this.z-this.home.z);if(hd>60)this.heading=Math.atan2(this.home.z-this.z,this.home.x-this.x);if(this.rand()<dt*0.15)this.pause=2+this.rand()*5;}}
    if(this.speed>0){const nx=this.x+Math.cos(this.heading)*this.speed*dt,nz=this.z+Math.sin(this.heading)*this.speed*dt;if(ok(nx,nz)){this.x=nx;this.z=nz;}else this.heading+=1.5;
      const l=this.trail.at(-1);if(!l||Math.hypot(l.x-this.x,l.z-this.z)>(this.kind==='peura'?1.4:0.9))this.trail.push({x:this.x,z:this.z,dir:Math.atan2(this.x-(l?.x??this.x),-(this.z-(l?.z??this.z)))});}}
  shoot(){this.alive=false;this.speed=0;this.state='kuollut';}
}
