// Jokaisen biisin jälkeen välipuhe. Sama ei kahdesti peräkkäin.
// Tiedostot: /aanet/puhe/radio/<kanava>_NN.mp3 (parkano, country, tekno, 01–08).
import { mulberry32 } from './rng.js';
export const BIISIT=4;
export const JUONNOT=8;
export const VALIPUHE=JUONNOT;
export function valipuheNimi(k,i){return 'puhe/radio/'+k+'_'+String(i).padStart(2,'0');}
export function pickJuonto(k,last,rand=Math.random){
  const opts=[];for(let i=1;i<=VALIPUHE;i++){for(const n of[valipuheNimi(k,i),'radio/juonto_'+k+'_'+i])if(n!==last)opts.push(n);}return opts[Math.floor(rand()*opts.length)%opts.length];}
export function onValipuhe(clip){return /^(puhe\/radio\/(parkano|country|tekno)_\d{2}|radio\/juonto_(parkano|country|tekno)_\d)$/.test(clip||'');}

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
    s.lastJ=j;
    s.clip=j;
    return true;
  }
  s.clip='radio_'+c+'_'+((s.song%BIISIT)+1);
  return true;
}
// Puuttuva välipuhe ohitetaan seuraavaan biisiin. Biisiä ei ohiteta.
export function radioPuuttuu(s){
  if(!s.on||!onValipuhe(s.clip)) return false;
  s.pos=0; s.gen++;
  const c=KANAVAT[s.ch]||KANAVAT[0];
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
// Autossa radio kuuluu. Ovi auki vaimentaa vähän, pihalla enemmän. Aina yli nollan kun soitetaan.
export function radioVoimakkuus(autossa, oviAuki){
  if(autossa) return 0.85;
  if(oviAuki) return 0.4;
  return 0.22;
}
export function radioSuodin(autossa, oviAuki){
  if(autossa) return {hp:70, lp:17000};
  if(oviAuki) return {hp:180, lp:6000};
  return {hp:280, lp:1500};
}
// Offset klipin lopussa ei käynnistä soittoa: se päättyisi heti ja jäisi hiljaiseksi.
export function radioAlkuOffset(offset, kesto){
  const dur=Math.max(0, Number(kesto)||0);
  const off=Math.max(0, Number(offset)||0);
  if(dur<=0.05||off>=dur-0.05) return {off:0, ohi:true};
  return {off, ohi:false};
}
// kesken = lataus. loppui = lähde päättyi, soitto etenee. src puuttuu ilman loppua = yritä uudelleen.
export function radioJatka({kesken,loppui,src}={}){
  if(kesken) return 'odota';
  if(loppui) return 'seuraava';
  if(!src) return 'soita';
  return 'jatka';
}
