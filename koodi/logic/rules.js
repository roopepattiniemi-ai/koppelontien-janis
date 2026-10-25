// Saalissäännöt: haulikolla jänis, teeri ja harvinainen kettu, kiväärillä valkohäntäpeura ja metsäkauris. Muut rauhoitettuja.
export const LAJIT={janis:'jänis',peura:'valkohäntäpeura',kauris:'metsäkauris',kettu:'kettu',orava:'orava',teeri:'teeri',korppi:'korppi',tiainen:'tiainen'};
const LAILLINEN={janis:'haulikko',teeri:'haulikko',peura:'kivaari',kauris:'kivaari',kettu:'haulikko'};
const RAUHOITETTU=new Set(['orava','korppi','tiainen']);
// palauttaa {saalis:bool, huomautus:string|null}
export function judgeShot(laji,ase){
  const n=LAJIT[laji]||laji;
  if(RAUHOITETTU.has(laji))return{saalis:false,huomautus:`Huomautus: ${n} on rauhoitettu – älä ammu!`};
  const oikea=LAILLINEN[laji];if(!oikea)return{saalis:false,huomautus:`Huomautus: ${n} ei ole riistaa`};
  if(oikea!==ase)return{saalis:true,huomautus:`Huomautus: ${n} ammutaan ${oikea==='haulikko'?'haulikolla':'kiväärillä'}, ei ${ase==='haulikko'?'haulikolla':'kiväärillä'}`};
  return{saalis:true,huomautus:null};}
