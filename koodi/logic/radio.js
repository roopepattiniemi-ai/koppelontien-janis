// Juonto biisien välissä 50 % todennäköisyydellä, ei samaa juontoa kahdesti peräkkäin.
// Kanavalla on neljä biisiä ja kahdeksan välijuontoa.
import { mulberry32 } from './rng.js';
export const BIISIT=4;
export const JUONNOT=8;
export function pickJuonto(k,last,rand=Math.random){if(rand()>=0.5)return null;
  const opts=[];for(let i=1;i<=JUONNOT;i++){const n='radio/juonto_'+k+'_'+i;if(n!==last)opts.push(n);}return opts[Math.floor(rand()*opts.length)%opts.length];}

// Isäntä arpoo juonnot ja biisijärjestyksen. Vieras soittaa saman klipin samasta kohdasta.
export const KANAVAT=['parkano','country','tekno'];
export function uusiRadio(seed=1){
  const rand=typeof seed==='function'?seed:mulberry32(seed>>>0);
  return { on:false, ch:0, song:0, clip:null, pos:0, lastJ:null, jono:[], gen:0, rand };
}
export function radioPaalle(s, jingle){
  s.on=true; s.song=0; s.pos=0; s.gen++;
  const c=KANAVAT[s.ch]||KANAVAT[0];
  const biisi='radio_'+c+'_1';
  if(jingle){ s.jono=['radio_'+c+'_tunnus', biisi]; s.clip='sfx_radio_kanava'; }
  else { s.jono=[]; s.clip=biisi; }
  return s;
}
export function radioKytke(s){
  if(s.on){ s.on=false; s.clip=null; s.pos=0; s.jono=[]; s.gen++; return s; }
  return radioPaalle(s, true);
}
export function radioKanava(s){
  s.ch=(s.ch+1)%KANAVAT.length;
  if(s.on) return radioPaalle(s, true);
  s.clip=null; s.pos=0; s.jono=[]; s.gen++; return s;
}
function onBiisi(clip){return /^radio_(parkano|country|tekno)_[1-4]$/.test(clip||'');}
// Palauttaa true, kun klippi vaihtuu. kesto on soivan pätkän pituus sekunteina.
export function radioEtene(s, dt, kesto){
  if(!s.on||!s.clip) return false;
  s.pos=(s.pos||0)+dt;
  const dur=Math.max(0.05, Number(kesto)||0);
  if(s.pos<dur) return false;
  s.pos=0; s.gen++;
  if(s.jono.length){ s.clip=s.jono.shift(); return true; }
  const c=KANAVAT[s.ch]||KANAVAT[0];
  if(onBiisi(s.clip)){
    s.song=(s.song+1)%BIISIT;
    const j=pickJuonto(c, s.lastJ, s.rand);
    if(j) s.lastJ=j;
    s.clip=j||('radio_'+c+'_'+(s.song+1));
    return true;
  }
  s.clip='radio_'+c+'_'+((s.song%BIISIT)+1);
  return true;
}
export function radioKuva(s){
  return { t:'r', on:!!s.on, ch:s.ch|0, song:s.song|0, clip:s.clip, pos:Math.round((s.pos||0)*100)/100, lastJ:s.lastJ||null, gen:s.gen|0 };
}
export function radioKomento(s, act){
  if(act==='on'||act==='toggle') return radioKytke(s);
  if(act==='ch') return radioKanava(s);
  return s;
}
// 'hae' = vieras kelautuu. 'sama' = ero alle 0,4 s. Vanhempi gen hylätään.
export function radioSovita(s, m){
  if(!m||typeof m.gen!=='number') return 'hylkaa';
  if(m.gen<s.gen) return 'vanha';
  const sama=!!m.on===!!s.on && (m.ch|0)===(s.ch|0) && m.clip===s.clip && Math.abs((m.pos||0)-(s.pos||0))<=0.4;
  s.on=!!m.on; s.ch=m.ch|0; s.song=m.song|0; s.clip=m.on?m.clip:null; s.pos=m.pos||0; s.lastJ=m.lastJ||null; s.jono=[]; s.gen=m.gen;
  if(!s.on) return 'pois';
  return sama?'sama':'hae';
}
