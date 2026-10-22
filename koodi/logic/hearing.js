import { windVec, WIND } from './world.js';
// Haukun kuuluvuus 0..1 = f(etäisyys, tuuli). Myötätuuli (ääni kulkee tuulen mukana kuulijaan) kantaa, vastatuuli vaimentaa.
export const BASE_RANGE = 1500; // m tyynellä
export function audibility(src, lis, wind=WIND){
  const dx=lis.x-src.x, dz=lis.z-src.z, d=Math.hypot(dx,dz);
  if(d<1) return 1;
  const w=windVec(wind), cos=(dx*w.x+dz*w.z)/d;
  const k=Math.min(wind.speed/10,1)*0.5;          // max ±50 % kantamaan
  const range=BASE_RANGE*(1+k*cos);
  if(d>=range) return 0;
  const lin=1-d/range, inv=1/(1+d/60);             // etäisyysvaimennus
  return Math.min(1, Math.sqrt(lin*inv)*1.0);
}
