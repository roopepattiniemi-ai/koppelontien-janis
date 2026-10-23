// Suomenajokoira: haku -> yöjälki -> ylösotto -> ajo (haukkuen) -> hukka -> ajo
import { mulberry32 } from './rng.js';
import { haukkuTila } from './haukku.js';
import { clampB } from './bounds.js';
import { BUILDINGS, YARD_POLYS, farmFootprints } from './world.js';
export const HEAR_CMD=150, IGNORE_AJO=0.7, SCENT_R=4;
// Rakennukset (OSM-talot ja pihan mökki, tynnyrisauna, L-navetta) ja valinnaiset laatikkoesteet (Vitara). Sama polygoni kuin auton inBuilding.
const LOOK=3.6;
function inPoly(x,z,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const[xi,zi]=P[i],[xj,zj]=P[j];if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)c=!c;}return c;}
function orient(ax,az,bx,bz,cx,cz){return (bx-ax)*(cz-az)-(bz-az)*(cx-ax);}
function onSeg(ax,az,bx,bz,px,pz){return px>=Math.min(ax,bx)-1e-7&&px<=Math.max(ax,bx)+1e-7&&pz>=Math.min(az,bz)-1e-7&&pz<=Math.max(az,bz)+1e-7;}
function segHit(ax,az,bx,bz,cx,cz,dx,dz){
  const o1=orient(ax,az,bx,bz,cx,cz),o2=orient(ax,az,bx,bz,dx,dz),o3=orient(cx,cz,dx,dz,ax,az),o4=orient(cx,cz,dx,dz,bx,bz);
  if((o1>0)!==(o2>0)&&(o3>0)!==(o4>0))return true;
  if(o1===0&&onSeg(ax,az,bx,bz,cx,cz))return true;if(o2===0&&onSeg(ax,az,bx,bz,dx,dz))return true;
  if(o3===0&&onSeg(cx,cz,dx,dz,ax,az))return true;if(o4===0&&onSeg(cx,cz,dx,dz,bx,bz))return true;return false;}
const SOLIDS=[...BUILDINGS,...YARD_POLYS].map(P=>{let cx=0,cz=0,minx=1e9,maxx=-1e9,minz=1e9,maxz=-1e9;const e=[];
  for(const[a,b]of P){cx+=a;cz+=b;minx=Math.min(minx,a);maxx=Math.max(maxx,a);minz=Math.min(minz,b);maxz=Math.max(maxz,b);}
  for(let i=0;i<P.length;i++){const[a,b]=P[i],[c,d]=P[(i+1)%P.length];if(a!==c||b!==d)e.push(a,b,c,d);}
  return {P,e,cx:cx/P.length,cz:cz/P.length,minx,maxx,minz,maxz};});
const FARMS=farmFootprints().map(f=>({...f,c:Math.cos(f.yaw),s:Math.sin(f.yaw)}));
function into(o,x,z){const dx=x-o.x,dz=z-o.z,c=o.c??Math.cos(o.yaw||0),s=o.s??Math.sin(o.yaw||0);return [dx*c-dz*s,dx*s+dz*c];}
function inFarm(f,x,z){const [lx,lz]=into(f,x,z);return Math.abs(lx)<=f.hx&&Math.abs(lz)<=f.hz;}
function segAABB(x0,z0,x1,z1,minx,minz,maxx,maxz){const dx=x1-x0,dz=z1-z0;let t0=0,t1=1;const p=[-dx,dx,-dz,dz],q=[x0-minx,maxx-x0,z0-minz,maxz-z0];
  for(let i=0;i<4;i++){if(Math.abs(p[i])<1e-12){if(q[i]<0)return false;}else{const t=q[i]/p[i];if(p[i]<0){if(t>t1)return false;if(t>t0)t0=t;}else{if(t<t0)return false;if(t<t1)t1=t;}}}return t0<=t1;}
function inBox(o,x,z){if(o.r!=null)return (x-o.x)**2+(z-o.z)**2<o.r*o.r;const [lx,lz]=into(o,x,z);
  const minx=o.minx??-o.hx,maxx=o.maxx??o.hx,minz=o.minz??-o.hz,maxz=o.maxz??o.hz;return lx>=minx&&lx<=maxx&&lz>=minz&&lz<=maxz;}
function boxBlocks(o,x0,z0,x1,z1){if(inBox(o,x0,z0))return false;if(o.r!=null){const dx=x1-x0,dz=z1-z0,fx=x0-o.x,fz=z0-o.z,a=dx*dx+dz*dz||1e-12;let t=Math.max(0,Math.min(1,-(fx*dx+fz*dz)/a));return (fx+dx*t)**2+(fz+dz*t)**2<o.r*o.r;}
  const [lx0,lz0]=into(o,x0,z0),[lx1,lz1]=into(o,x1,z1);return segAABB(lx0,lz0,lx1,lz1,o.minx??-o.hx,o.minz??-o.hz,o.maxx??o.hx,o.maxz??o.hz);}
// id: polygoni (OSM, sitten piha), 100+ maatilan laatikko. null = ulkona.
export function solidAt(x,z){for(let i=0;i<SOLIDS.length;i++){const b=SOLIDS[i];if(x<b.minx||x>b.maxx||z<b.minz||z>b.maxz)continue;if(inPoly(x,z,b.P))return i;}
  for(let i=0;i<FARMS.length;i++)if(inFarm(FARMS[i],x,z))return 100+i;return null;}
export function dogInside(x,z){return solidAt(x,z)!==null;}
function overlaps(minx,maxx,minz,maxz,b){return !(maxx<b.minx||minx>b.maxx||maxz<b.minz||minz>b.maxz);}
// true jos askel x0,z0 -> x1,z1 menee esteeseen. skip = kohteen rakennus (saa mennä sisään), start ohitetaan (ulos pääsee).
function pathBlocked(x0,z0,x1,z1,skip,extras){const start=solidAt(x0,z0),minx=Math.min(x0,x1),maxx=Math.max(x0,x1),minz=Math.min(z0,z1),maxz=Math.max(z0,z1);
  for(let i=0;i<SOLIDS.length;i++){if(i===skip||i===start)continue;const b=SOLIDS[i];if(!overlaps(minx,maxx,minz,maxz,b))continue;
    if(inPoly(x1,z1,b.P))return true;const e=b.e;for(let k=0;k<e.length;k+=4)if(segHit(x0,z0,x1,z1,e[k],e[k+1],e[k+2],e[k+3]))return true;}
  for(let i=0;i<FARMS.length;i++){const id=100+i;if(id===skip||id===start)continue;const f=FARMS[i];if(!overlaps(minx,maxx,minz,maxz,{minx:f.x-f.hx-f.hz,maxx:f.x+f.hx+f.hz,minz:f.z-f.hx-f.hz,maxz:f.z+f.hx+f.hz}))continue;if(boxBlocks(f,x0,z0,x1,z1))return true;}
  if(extras)for(const o of extras)if(boxBlocks(o,x0,z0,x1,z1))return true;return false;}
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
  constructor({x=0,z=0,leashed=false,seed=2,speed=4.2,hukkaChance=1,riding=false}={}){
    this.rand=mulberry32(seed);this.x=x;this.z=z;this.state=leashed?D.NARUSSA:D.HAKU;this.t=0;this.ang=0;this.ring=40;
    this.speed=speed;this.hukkaChance=hukkaChance;this.idx=0;this.barking=false;this.trail=[];this.riding=!!riding;
  }
  get pos(){return{x:this.x,z:this.z};}
  // enter: kohde saa olla rakennuksen sisällä (pelaaja mökissä, saalis ladossa). Muuten kiertää.
  // Vitara ym. this.obstacles: jos kohde on laatikon sisällä, kävellään laatikon reunaan ja jäädään.
  _go(tx,tz,dt,sp=this.speed,enter=false){const dx=tx-this.x,dz=tz-this.z,d=Math.hypot(dx,dz);if(d<1e-6)return 0;const s=Math.min(d,sp*dt);
    const skip=enter?solidAt(tx,tz):null,ex=this.obstacles;
    const hit=(vx,vz,dist,noEx)=>pathBlocked(this.x,this.z,this.x+vx*dist,this.z+vz*dist,skip,noEx?null:ex);
    let ux=dx/d,uz=dz/d,ahead=Math.min(LOOK,d);
    const direct=hit(ux,uz,s)||(d>s+0.05&&hit(ux,uz,ahead));
    const held=enter&&ex&&ex.some(o=>inBox(o,tx,tz));
    const finish=left=>{this._watch(dt,left);return left;};
    if(direct){const stat=hit(ux,uz,s,true)||(d>s+0.05&&hit(ux,uz,ahead,true));
      if(held&&!stat){if(hit(ux,uz,s)){this.dir=Math.atan2(dx,-dz);return finish(d);}/* laatikon luo, ei ympäri */}
      else{if(!this._side)this._side=this._pickSide(ux,uz,s,skip);
        const side=this._side||1,angs=[0.4,0.8,1.15,1.55,2.0,2.5,3.0],order=[...angs.map(v=>v*side),...angs.map(v=>-v*side)];let ok=false;
        for(const a of order){const c=Math.cos(a),sn=Math.sin(a),vx=ux*c-uz*sn,vz=ux*sn+uz*c;
          if(!hit(vx,vz,s)&&(d<=s+0.05||!hit(vx,vz,Math.min(2.4,ahead)))){ux=vx;uz=vz;ok=true;break;}}
        if(!ok)for(const a of order){const c=Math.cos(a),sn=Math.sin(a),vx=ux*c-uz*sn,vz=ux*sn+uz*c;
          if(!hit(vx,vz,s)){ux=vx;uz=vz;ok=true;break;}}
        if(!ok){this._stuck=(this._stuck||0)+dt;if(this._stuck>0.5&&!(this._sideLock>0)){this._side=-side;this._sideLock=1.2;this._stuck=0;}this.dir=Math.atan2(dx,-dz);return finish(d);}
        this._stuck=0;this._free=0;}}
    else if(this._side){this._free=(this._free||0)+dt;if(this._free>0.45&&!(this._sideLock>0)){this._side=0;this._free=0;}}
    const nx=clampB(this.x+ux*s),nz=clampB(this.z+uz*s);
    if((nx!==this.x||nz!==this.z)&&pathBlocked(this.x,this.z,nx,nz,skip,ex)){this._side=this._side||1;this.dir=Math.atan2(dx,-dz);return finish(d);}
    this.x=nx;this.z=nz;this.dir=Math.atan2(ux,-uz);const l=this.trail.at(-1);if(!l||Math.hypot(l.x-this.x,l.z-this.z)>1.2)this.trail.push({x:this.x,z:this.z,dir:this.dir});return finish(Math.hypot(tx-this.x,tz-this.z));}
  // nurkassa värinä: jos metriin ei edetä, vaihdetaan kiertosuuntaa
  _watch(dt,left){if(this._sideLock>0)this._sideLock-=dt;if(this._ax==null){this._ax=this.x;this._az=this.z;return;}
    if((this._prog=(this._prog||0)+dt)>1){const net=Math.hypot(this.x-this._ax,this.z-this._az);
      if(net<0.55&&left>4&&!(this._sideLock>0)){this._side=-(this._side||1);this._sideLock=2.2;this._stuck=0;}
      this._ax=this.x;this._az=this.z;this._prog=0;}}
  _pickSide(ux,uz,s,skip){const ex=this.obstacles,score=sg=>{let n=0;for(const a of[0.7,1.3,2.0]){const c=Math.cos(a*sg),sn=Math.sin(a*sg),vx=ux*c-uz*sn,vz=ux*sn+uz*c;
      if(pathBlocked(this.x,this.z,this.x+vx*Math.max(s,1.5),this.z+vz*Math.max(s,1.5),skip,ex))break;n++;}return n;};
    const L=score(-1),R=score(1);return L>=R?-1:1;}
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
  _lenkki(player){const a=this.rand()*Math.PI*2,r=80+this.rand()*170;let x=player.x+Math.cos(a)*r,z=player.z+Math.sin(a)*r;
    if(solidAt(x,z)!==null){const dx=player.x-x,dz=player.z-z;for(let k=0;k<14&&solidAt(x,z)!==null;k++){x+=dx*0.08;z+=dz*0.08;}}
    this.wp={x,z};this.curve=(this.rand()-.5)*1.6;this.curveF=0.3+this.rand()*0.5;}
  _scent(hares){for(const h of hares){if(!h)continue;const f=nearTrack(h,this,SCENT_R);if(f){this.target=h;this._onTrack(f);return true;}}return false;}
  _onTrack(f){if(f.kind==='yo'){this.state=D.YOJALKI;this.idx=f.idx;}else{this.state=D.AJO;this.idx=f.idx;}this.t=0;}
  update(dt,{hare,hares,player,players,fetch=[],obstacles,ride}={}){
    this.t+=dt;this.obstacles=obstacles||null;this.barking=false;this.sniffing=false;
    if(this.riding){if(ride){this.x=ride.x;this.z=ride.z;if(ride.dir!=null)this.dir=ride.dir;}return;}
    const hs=hares||[hare];
    // kaatunut, noutamaton jänis lähellä -> nouto (vapaana olevat tilat)
    if(!this.leashed&&[D.HAKU,D.SEURAA,D.TANNE,D.PALUU,D.HUKKA].includes(this.state)){const f=hs.concat(fetch).find(h=>!h.alive&&!h.carried&&!h.delivered&&!h.held&&!h.counted&&Math.hypot(h.x-this.x,h.z-this.z)<FETCH_R);if(f){this.target=f;this.state=D.NOUTO;this.t=0;}}
    // koira ajaa kerrallaan yhtä jänistä: target asetetaan kun jälki löytyy
    if(this.target&&[D.YOJALKI,D.YLOSOTTO,D.AJO,D.HUKKA,D.TAALLA,D.NOUTO,D.KANTO].includes(this.state))hare=this.target;else if(this.state===D.TAALLA&&this.found?.hare)hare=this.found.hare;
    switch(this.state){
      case D.NARUSSA: case D.SEURAA:{ // kulkee kintereillä
        const d=Math.hypot(player.x-this.x,player.z-this.z);
        if(this.state===D.NARUSSA&&d>3){const k=2.5/d;this.x=player.x+(this.x-player.x)*k;this.z=player.z+(this.z-player.z)*k;
          if(solidAt(player.x,player.z)===null)for(let i=0;i<8&&solidAt(this.x,this.z)!==null;i++){this.x+=(player.x-this.x)*0.35;this.z+=(player.z-this.z)*0.35;}} /* naru 3 m: ei veny */
        if(d>1.3)this._go(player.x,player.z,dt,d>(this.state===D.NARUSSA?2:6)?this.speed:2,true); break;}
      case D.TANNE:{const d=Math.hypot(player.x-this.x,player.z-this.z); if(d>1.5)this._go(player.x,player.z,dt,this.speed,true); break;} // tulee ja odottaa
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
        if(d>3&&!this.lookT)this._go(player.x,player.z,dt,this.speed*1.2,true);
        else{if(!this.lookT)this.lookT=1.5+this.rand()*2;this.dir=Math.atan2(player.x-this.x,-(player.z-this.z));if((this.lookT-=dt)<=0){this._haku();this._lenkki(player);}}
        if(this.state===D.PALUU)this._scent(hs);
        break;}
      case D.TAALLA:{ // juoksee pelaajan luo, etsii jäljen siitä hetken
        const d=Math.hypot(player.x-this.x,player.z-this.z);
        if(d>1.5)this._go(player.x,player.z,dt,this.speed,true); else if((this.searchT-=dt)<=0)this._onTrack(this.found);
        break;}
      case D.YOJALKI:{ // selvittää yöjälkeä hitaasti makuuta kohti; talon läpi kulkevat pisteet ohitetaan
        const nt=hare.nightTrail;while(this.idx<nt.length-1&&solidAt(nt[this.idx].x,nt[this.idx].z)!==null)this.idx++;
        const p=nt[Math.min(this.idx,nt.length-1)];
        if(p&&this._go(p.x,p.z,dt,this.speed*0.5)<0.5)this.idx++;
        if(this.idx>=nt.length-2||this.idx>=nt.length){this.state=D.YLOSOTTO;this.t=0;}
        break;}
      case D.YLOSOTTO: // paluuperien selvitys; jänis lähtee kun koira lähellä
        this._go(hare.home.x,hare.home.z,dt,this.speed*0.4);
        if(hare.state!=='makuu'){this.state=D.AJO;this.idx=0;this.t=0;}
        break;
      case D.AJO:{
        const tr=hare.trail; if(!tr.length)break;
        while(this.idx<tr.length-1&&solidAt(tr[this.idx].x,tr[this.idx].z)!==null){this.idx++;if(tr[this.idx].jump&&this.rand()<this.hukkaChance){this.state=D.HUKKA;this.t=0;this.hx=this.x;this.hz=this.z;this.ring=3;this.hukkaTime=6+this.rand()*14;break;}}
        if(this.state!==D.AJO)break; const p=tr[Math.min(this.idx,tr.length-1)];
        if(this._go(p.x,p.z,dt)<0.5&&this.idx<tr.length-1){this.idx++;
          if(tr[this.idx].jump&&this.rand()<this.hukkaChance){this.state=D.HUKKA;this.t=0;this.hx=this.x;this.hz=this.z;this.ring=3;this.hukkaTime=6+this.rand()*14;}}
        this.barking=hare.alive;
        // nappaus: haavoittunut tai tauolla oleva jänis kiinni ajossa
        if(hare.alive&&(hare.wounded||hare.paused||hare.speed<1)&&Math.hypot(hare.x-this.x,hare.z-this.z)<CATCH_R){hare.shoot('koira');hare.owner=hare.owner??hare.woundedBy;this._carry(hare);break;}
        if(!hare.alive){if(!hare.delivered&&!hare.carried){this.state=D.NOUTO;this.t=0;}else{this._haku();this.target=null;this.ring=30;}}
        break;}
      case D.NOUTO:{ // juoksee kaatuneen jäniksen luo ja ottaa sen suuhun
        if(hare.carried||hare.delivered||hare.held){this._haku();this.target=null;break;}
        if(this._go(hare.x,hare.z,dt,this.speed*1.2,true)<0.8)this._carry(hare);break;}
      case D.KANTO:{ // kantaa omalle metsästäjälle (players[hare.owner] tai player), pudottaa viereen
        const o=(players&&hare.owner!=null&&players[hare.owner])||player;hare.x=this.x;hare.z=this.z;
        if(this._go(o.x,o.z,dt,this.speed*0.9,true)<1.6){hare.carried=false;hare.delivered=true;hare.x=this.x+Math.cos(this.dir||0)*0.4;hare.z=this.z+Math.sin(this.dir||0)*0.4;this.delivered=(this.delivered||0)+1;this.state=D.TANNE;this.t=0;this.target=null;}
        break;}
      case D.HUKKA:{ // hiljaa, laajenevat kehät hukkakohdan ympäri
        this.ang+=dt*this.speed/this.ring;this.ring+=dt*1.5;
        let tx=this.hx+Math.cos(this.ang)*this.ring,tz=this.hz+Math.sin(this.ang)*this.ring;
        if(solidAt(tx,tz)!==null){const dx=tx-this.hx,dz=tz-this.hz,L=Math.hypot(dx,dz)||1;for(let k=0;k<10&&solidAt(tx,tz)!==null;k++){tx-=dx/L*1.2;tz-=dz/L*1.2;}}
        this._go(tx,tz,dt);
        if(this.t>this.hukkaTime){this.state=D.AJO;this.t=0;}
        break;}
    }
    const ht=hare?Math.hypot((hare.x??0)-this.x,(hare.z??0)-this.z):1e9;
    this.haukku=haukkuTila(this.state,ht,!!(hare&&hare.alive));
    if(this.haukku==='jalki'||this.haukku==='nako')this.barking=true;
  }
  _carry(h){h.carried=true;this.target=h;this.state=D.KANTO;this.t=0;}
  // haukkuväli s: tiheä kun lähellä jänistä
  barkInterval(hare){const d=Math.hypot(hare.x-this.x,hare.z-this.z);return Math.min(2.5,0.35+d/80);}
}
