// Saalissäännöt: haulikolla jänis, kiväärillä valkohäntäpeura. Muut rauhoitettuja tässä pelissä.
export const LAJIT={janis:'jänis',peura:'valkohäntäpeura',kettu:'kettu',orava:'orava',teeri:'teeri',korppi:'korppi',tiainen:'tiainen'};
const LAILLINEN={janis:'haulikko',peura:'kivaari'};
const RAUHOITETTU=new Set(['kettu','orava','teeri','korppi','tiainen']);
// palauttaa {saalis:bool, huomautus:string|null}
export function judgeShot(laji,ase){
  const n=LAJIT[laji]||laji;
  if(RAUHOITETTU.has(laji))return{saalis:false,huomautus:`Huomautus: ${n} on rauhoitettu – älä ammu!`};
  const oikea=LAILLINEN[laji];if(!oikea)return{saalis:false,huomautus:`Huomautus: ${n} ei ole riistaa`};
  if(oikea!==ase)return{saalis:true,huomautus:`Huomautus: ${n} ammutaan ${oikea==='haulikko'?'haulikolla':'kiväärillä'}, ei ${ase==='haulikko'?'haulikolla':'kiväärillä'}`};
  return{saalis:true,huomautus:null};}
