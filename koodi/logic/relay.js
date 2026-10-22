// v1.1 rele: puhdas huonelogiikka (ei verkkoa) -> testattavissa. Max 2 / huone, ensimmäinen on isäntä ('h'), toinen vieras ('v').
export const MAX_PER_ROOM=2, MAX_MSG=16384;
export class Relay{constructor(){this.rooms=new Map();}
  validRoom(c){return typeof c==='string'&&/^[A-Z0-9]{3,12}$/.test(c);}
  join(code,peer){code=String(code||'').toUpperCase();if(!this.validRoom(code))return{ok:false,syy:'huonekoodi virheellinen'};
    let r=this.rooms.get(code);if(!r){r=[];this.rooms.set(code,r);}if(r.length>=MAX_PER_ROOM)return{ok:false,syy:'huone täynnä'};
    const role=r.some(p=>p.role==='h')?'v':'h';peer.role=role;peer.room=code;r.push(peer);return{ok:true,role,others:r.filter(p=>p!==peer)};}
  leave(peer){const r=this.rooms.get(peer.room);if(!r)return[];const i=r.indexOf(peer);if(i>=0)r.splice(i,1);if(peer.role==='h')for(const p of r)p.role='h';if(!r.length)this.rooms.delete(peer.room);return r;}
  // välittää viestin huoneen muille; palauttaa vastaanottajat
  route(peer,data){if(typeof data!=='string'||data.length>MAX_MSG)return[];const r=this.rooms.get(peer.room)||[];return r.filter(p=>p!==peer);}}
