// Suomenajokoira: haku -> yöjälki -> ylösotto -> ajo (haukkuen) -> hukka -> ajo
import { mulberry32 } from './rng.js';
import { clampB } from './bounds.js';
export const HEAR_CMD=150, IGNORE_AJO=0.7, SCENT_R=4;
// lähin jäniksen jälki (yöjälki tai pakojälki) annetun pisteen säteellä, tai makuualue (6 m)
export function nearTrack(hare,p,r){
  if(hare.state==='makuu'&&Math.hypot(hare.x-p.x,hare.z-p.z)<6)return{kind:'yo',idx:hare.nightTrail.length-1};
  let best=null,bd=r;
  const scan=(arr,kind)=>{for(let i=0;i<arr.length;i++){const d=Math.hypot(arr[i].x-p.x,arr[i].z-p.z);if(d<bd){bd=d;best={kind,idx:i};}}};
  if(hare.state==='makuu')scan(hare.nightTrail,'yo');else if(hare.alive)scan(hare.trail,'ajo');
  return best;}
export const D = { NARUSSA:'narussa', TANNE:'tänne', SEURAA:'seuraa', TAALLA:'täällä', HAKU:'haku', YOJALKI:'yöjälki', YLOSOTTO:'ylösotto', AJO:'ajo', HUKKA:'hukka', PALUU:'paluu', NOUTO:'nouto', KANTO:'kanto' };
export const CATCH_R=1.0, FETCH_R=150;
export class Dog {
  constructor({x=0,z=0,leashed=false,seed=2,speed=4.2,hukkaChance=1}={}){
    this.rand=mulberry32(seed);this.x=x;this.z=z;this.state=leashed?D.NARUSSA:D.HAKU;this.t=0;this.ang=0;this.ring=40;
    this.speed=speed;this.hukkaChance=hukkaChance;this.idx=0;this.barking=false;this.trail=[];
  }
  get pos(){return{x:this.x,z:this.z};}
  _go(tx,tz,dt,sp=this.speed){const dx=tx-this.x,dz=tz-this.z,d=Math.hypot(dx,dz);if(d<1e-6)return 0;const s=Math.min(d,sp*dt);
    this.x=clampB(this.x+dx/d*s);this.z=clampB(this.z+dz/d*s);this.dir=Math.atan2(dx,-dz);const l=this.trail.at(-1);if(!l||Math.hypot(l.x-this.x,l.z-this.z)>1.2)this.trail.push({x:this.x,z:this.z,dir:this.dir});return d-s;}
  get leashed(){return this.state===D.NARUSSA;}
  // komennot: 'irti' | 'kiinni' | 'tanne' | 'seuraa' | 'etsi'. Palauttaa {ok, syy}
  command(cmd,player,hare){
    const d=Math.hypot(player.x-this.x,player.z-this.z);
    if(cmd==='kiinni'){ if(d>3)return{ok:false,syy:'Koira liian kaukana'}; this.state=D.NARUSSA;this.t=0;return{ok:true}; }
    if(cmd==='irti'){ if(this.state!==D.NARUSSA)return{ok:false,syy:'Koira ei ole narussa'}; this._haku(); return{ok:true}; }
    if(this.state===D.NARUSSA)return{ok:false,syy:'Koira on narussa'};
    if(d>HEAR_CMD)return{ok:false,syy:'Koira ei kuule'};
    if(this.state===D.AJO&&this.rand()<IGNORE_AJO)return{ok:false,syy:'Koira ei tottele – ajo päällä'};
    if(cmd==='tanne'){this.state=D.TANNE;this.t=0;return{ok:true};}
    if(cmd==='seuraa'){this.state=D.SEURAA;this.t=0;return{ok:true};}
    if(cmd==='etsi'){this._haku();return{ok:true};}
    if(cmd==='taalla'){const hl=Array.isArray(hare)?hare:[hare];let tr=null;for(const h of hl){tr=h&&nearTrack(h,player,3);if(tr){tr.hare=h;this.target=h;break;}}
      if(!tr){this.state=D.TANNE;this.t=0;return{ok:true,jalki:false};}
      this.state=D.TAALLA;this.t=0;this.found=tr;this.searchT=1.5+this.rand()*2;return{ok:true,jalki:true};}
    return{ok:false,syy:'?'};
  }
  // haku = vapaat lenkit: satunnainen suunta 80–250 m, kaartelu, haisteluseisahdukset; 30–90 s välein paluu pelaajan luo
  _haku(keepT){this.state=D.HAKU;this.t=0;this.idx=0;this.wp=null;this.sniffT=0;this.sniffing=false;if(!keepT)this.returnT=30+this.rand()*60;}
  _lenkki(player){const a=this.rand()*Math.PI*2,r=80+this.rand()*170;this.wp={x:player.x+Math.cos(a)*r,z:player.z+Math.sin(a)*r};this.curve=(this.rand()-.5)*1.6;this.curveF=0.3+this.rand()*0.5;}
  _scent(hares){for(const h of hares){if(!h)continue;const f=nearTrack(h,this,SCENT_R);if(f){this.target=h;this._onTrack(f);return true;}}return false;}
  _onTrack(f){if(f.kind==='yo'){this.state=D.YOJALKI;this.idx=f.idx;}else{this.state=D.AJO;this.idx=f.idx;}this.t=0;}
  update(dt,{hare,hares,player,players,fetch=[]}){
    this.t+=dt;this.barking=false;this.sniffing=false;const hs=hares||[hare];
    // kaatunut, noutamaton jänis lähellä -> nouto (vapaana olevat tilat)
    if(!this.leashed&&[D.HAKU,D.SEURAA,D.TANNE,D.PALUU,D.HUKKA].includes(this.state)){const f=hs.concat(fetch).find(h=>!h.alive&&!h.carried&&!h.delivered&&!h.held&&!h.counted&&Math.hypot(h.x-this.x,h.z-this.z)<FETCH_R);if(f){this.target=f;this.state=D.NOUTO;this.t=0;}}
    // koira ajaa kerrallaan yhtä jänistä: target asetetaan kun jälki löytyy
    if(this.target&&[D.YOJALKI,D.YLOSOTTO,D.AJO,D.HUKKA,D.TAALLA,D.NOUTO,D.KANTO].includes(this.state))hare=this.target;else if(this.state===D.TAALLA&&this.found?.hare)hare=this.found.hare;
    switch(this.state){
      case D.NARUSSA: case D.SEURAA:{ // kulkee kintereillä
        const d=Math.hypot(player.x-this.x,player.z-this.z);
        if(this.state===D.NARUSSA&&d>3){const k=2.5/d;this.x=player.x+(this.x-player.x)*k;this.z=player.z+(this.z-player.z)*k;} /* naru 3 m: ei veny */ if(d>1.3)this._go(player.x,player.z,dt,d>(this.state===D.NARUSSA?2:6)?this.speed:2); break;}
      case D.TANNE:{const d=Math.hypot(player.x-this.x,player.z-this.z); if(d>1.5)this._go(player.x,player.z,dt); break;} // tulee ja odottaa
      case D.HAKU:{ // vaeltaa satunnaisiin pisteisiin pelaajan ympäristössä, nuuskii; ei tiedä jäniksen paikkaa
        if((this.returnT-=dt)<=0){this.state=D.PALUU;this.t=0;this.lookT=0;break;}
        if(this.sniffT>0){this.sniffT-=dt;this.sniffing=true;}
        else{ if(!this.wp||Math.hypot(this.wp.x-this.x,this.wp.z-this.z)<3)this._lenkki(player);
          // kaartelu: tavoitesuuntaan sivuttainen poikkeama siniaaltona
          const dx=this.wp.x-this.x,dz=this.wp.z-this.z,d=Math.hypot(dx,dz),k=Math.sin(this.t*this.curveF)*this.curve*Math.min(1,d/40),c=Math.cos(k),sn=Math.sin(k);
          this._go(this.x+(dx*c-dz*sn)/d*5,this.z+(dx*sn+dz*c)/d*5,dt);
          if(this.rand()<dt*0.12)this.sniffT=1+this.rand()*3;}
        this._scent(hs);
        break;}
      case D.PALUU:{ // palaa pelaajan luo, katsoo hetken, lähtee uudelle lenkille
        const d=Math.hypot(player.x-this.x,player.z-this.z);
        if(d>3&&!this.lookT)this._go(player.x,player.z,dt,this.speed*1.2);
        else{if(!this.lookT)this.lookT=1.5+this.rand()*2;this.dir=Math.atan2(player.x-this.x,-(player.z-this.z));if((this.lookT-=dt)<=0){this._haku();this._lenkki(player);}}
        if(this.state===D.PALUU)this._scent(hs);
        break;}
      case D.TAALLA:{ // juoksee pelaajan luo, etsii jäljen siitä hetken
        const d=Math.hypot(player.x-this.x,player.z-this.z);
        if(d>1.5)this._go(player.x,player.z,dt); else if((this.searchT-=dt)<=0)this._onTrack(this.found);
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
        // nappaus: haavoittunut tai tauolla oleva jänis kiinni ajossa
        if(hare.alive&&(hare.wounded||hare.paused||hare.speed<1)&&Math.hypot(hare.x-this.x,hare.z-this.z)<CATCH_R){hare.shoot('koira');hare.owner=hare.owner??hare.woundedBy;this._carry(hare);break;}
        if(!hare.alive){if(!hare.delivered&&!hare.carried){this.state=D.NOUTO;this.t=0;}else{this._haku();this.target=null;this.ring=30;}}
        break;}
      case D.NOUTO:{ // juoksee kaatuneen jäniksen luo ja ottaa sen suuhun
        if(hare.carried||hare.delivered||hare.held){this._haku();this.target=null;break;}
        if(this._go(hare.x,hare.z,dt,this.speed*1.2)<0.8)this._carry(hare);break;}
      case D.KANTO:{ // kantaa omalle metsästäjälle (players[hare.owner] tai player), pudottaa viereen
        const o=(players&&hare.owner!=null&&players[hare.owner])||player;hare.x=this.x;hare.z=this.z;
        if(this._go(o.x,o.z,dt,this.speed*0.9)<1.6){hare.carried=false;hare.delivered=true;hare.x=this.x+Math.cos(this.dir||0)*0.4;hare.z=this.z+Math.sin(this.dir||0)*0.4;this.delivered=(this.delivered||0)+1;this.state=D.TANNE;this.t=0;this.target=null;}
        break;}
      case D.HUKKA: // hiljaa, laajenevat kehät hukkakohdan ympäri
        this.ang+=dt*this.speed/this.ring;this.ring+=dt*1.5;
        this._go(this.hx+Math.cos(this.ang)*this.ring,this.hz+Math.sin(this.ang)*this.ring,dt);
        if(this.t>this.hukkaTime){this.state=D.AJO;this.t=0;}
        break;
    }
  }
  _carry(h){h.carried=true;this.target=h;this.state=D.KANTO;this.t=0;}
  // haukkuväli s: tiheä kun lähellä jänistä
  barkInterval(hare){const d=Math.hypot(hare.x-this.x,hare.z-this.z);return Math.min(2.5,0.35+d/80);}
}
