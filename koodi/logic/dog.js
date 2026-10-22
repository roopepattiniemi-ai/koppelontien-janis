// Suomenajokoira: haku -> yöjälki -> ylösotto -> ajo (haukkuen) -> hukka -> ajo
import { mulberry32 } from './rng.js';
export const HEAR_CMD=150, IGNORE_AJO=0.7;
export const D = { NARUSSA:'narussa', TANNE:'tänne', SEURAA:'seuraa', HAKU:'haku', YOJALKI:'yöjälki', YLOSOTTO:'ylösotto', AJO:'ajo', HUKKA:'hukka' };
export class Dog {
  constructor({x=0,z=0,leashed=false,seed=2,speed=4.2,hukkaChance=1}={}){
    this.rand=mulberry32(seed);this.x=x;this.z=z;this.state=leashed?D.NARUSSA:D.HAKU;this.t=0;this.ang=0;this.ring=40;
    this.speed=speed;this.hukkaChance=hukkaChance;this.idx=0;this.barking=false;this.trail=[];
  }
  get pos(){return{x:this.x,z:this.z};}
  _go(tx,tz,dt,sp=this.speed){const dx=tx-this.x,dz=tz-this.z,d=Math.hypot(dx,dz);if(d<1e-6)return 0;const s=Math.min(d,sp*dt);
    this.x+=dx/d*s;this.z+=dz/d*s;this.dir=Math.atan2(dx,-dz);const l=this.trail.at(-1);if(!l||Math.hypot(l.x-this.x,l.z-this.z)>1.2)this.trail.push({x:this.x,z:this.z,dir:this.dir});return d-s;}
  get leashed(){return this.state===D.NARUSSA;}
  // komennot: 'irti' | 'kiinni' | 'tanne' | 'seuraa' | 'hae'. Palauttaa {ok, syy}
  command(cmd,player){
    const d=Math.hypot(player.x-this.x,player.z-this.z);
    if(cmd==='kiinni'){ if(d>3)return{ok:false,syy:'Koira liian kaukana'}; this.state=D.NARUSSA;this.t=0;return{ok:true}; }
    if(cmd==='irti'){ if(this.state!==D.NARUSSA)return{ok:false,syy:'Koira ei ole narussa'}; this._haku(); return{ok:true}; }
    if(this.state===D.NARUSSA)return{ok:false,syy:'Koira on narussa'};
    if(d>HEAR_CMD)return{ok:false,syy:'Koira ei kuule'};
    if(this.state===D.AJO&&this.rand()<IGNORE_AJO)return{ok:false,syy:'Koira ei tottele – ajo päällä'};
    if(cmd==='tanne'){this.state=D.TANNE;this.t=0;return{ok:true};}
    if(cmd==='seuraa'){this.state=D.SEURAA;this.t=0;return{ok:true};}
    if(cmd==='hae'){this._haku();return{ok:true};}
    return{ok:false,syy:'?'};
  }
  _haku(){this.state=D.HAKU;this.t=0;this.idx=0;}
  update(dt,{hare,player}){
    this.t+=dt;this.barking=false;
    switch(this.state){
      case D.NARUSSA: case D.SEURAA:{ // kulkee kintereillä
        const d=Math.hypot(player.x-this.x,player.z-this.z); if(d>1.3)this._go(player.x,player.z,dt,d>(this.state===D.NARUSSA?2:6)?this.speed:2); break;}
      case D.TANNE:{const d=Math.hypot(player.x-this.x,player.z-this.z); if(d>1.5)this._go(player.x,player.z,dt); break;} // tulee ja odottaa
      case D.HAKU:{ // laajenevat lenkit pelaajan ympärillä, hiljaa
        this.ang+=dt*this.speed/this.ring;this.ring=40+400*Math.abs(Math.sin(this.t*0.006));
        this._go(player.x+Math.cos(this.ang)*this.ring,player.z+Math.sin(this.ang)*this.ring,dt);
        const nt=hare.nightTrail;for(let i=0;i<nt.length;i+=3)if(Math.hypot(nt[i].x-this.x,nt[i].z-this.z)<35){this.state=D.YOJALKI;this.idx=i;this.t=0;break;}
        break;}
      case D.YOJALKI:{ // selvittää yöjälkeä hitaasti makuuta kohti
        const nt=hare.nightTrail,p=nt[this.idx];
        if(this._go(p.x,p.z,dt,this.speed*0.5)<0.5)this.idx++;
        if(this.idx>=nt.length-2||this.idx>=nt.length){this.state=D.YLOSOTTO;this.t=0;}
        break;}
      case D.YLOSOTTO: // paluuperien selvitys; jänis lähtee kun koira lähellä
        this._go(hare.home.x,hare.home.z,dt,this.speed*0.4);
        if(hare.state!=='makuu'){this.state=D.AJO;this.idx=0;this.t=0;}
        break;
      case D.AJO:{
        const tr=hare.trail; if(!tr.length)break; const p=tr[Math.min(this.idx,tr.length-1)];
        if(this._go(p.x,p.z,dt)<0.5&&this.idx<tr.length-1){this.idx++;
          if(tr[this.idx].jump&&this.rand()<this.hukkaChance){this.state=D.HUKKA;this.t=0;this.hx=this.x;this.hz=this.z;this.ring=3;this.hukkaTime=6+this.rand()*14;}}
        this.barking=hare.alive;
        if(!hare.alive&&this.idx>=tr.length-1){this.state=D.HAKU;this.ring=30;}
        break;}
      case D.HUKKA: // hiljaa, laajenevat kehät hukkakohdan ympäri
        this.ang+=dt*this.speed/this.ring;this.ring+=dt*1.5;
        this._go(this.hx+Math.cos(this.ang)*this.ring,this.hz+Math.sin(this.ang)*this.ring,dt);
        if(this.t>this.hukkaTime){this.state=D.AJO;this.t=0;}
        break;
    }
  }
  // haukkuväli s: tiheä kun lähellä jänistä
  barkInterval(hare){const d=Math.hypot(hare.x-this.x,hare.z-this.z);return Math.min(2.5,0.35+d/80);}
}
