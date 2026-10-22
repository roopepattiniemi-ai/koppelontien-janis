// Haulikko: haulikuvio (hajonta) + etäisyysvaimennus. Palauttaa osumien määrän.
export function shotgun(origin,dir,target,{pellets=30,spread=0.035,range=45,rand=Math.random,radius=0.3}={}){
  let hits=0;
  for(let i=0;i<pellets;i++){
    const ax=(rand()-.5)*2*spread,ay=(rand()-.5)*2*spread;
    const yaw=Math.atan2(dir.x,-dir.z)+ax,pitch=Math.asin(Math.max(-1,Math.min(1,dir.y)))+ay;
    const d={x:Math.sin(yaw)*Math.cos(pitch),y:Math.sin(pitch),z:-Math.cos(yaw)*Math.cos(pitch)};
    const v={x:target.x-origin.x,y:target.y-origin.y,z:target.z-origin.z},t=v.x*d.x+v.y*d.y+v.z*d.z;
    if(t<0||t>range)continue;
    const miss=Math.hypot(v.x-d.x*t,v.y-d.y*t,v.z-d.z*t);
    if(miss<radius&&rand()<1-Math.pow(t/range,2))hits++;
  }
  return hits;
}
export const KILL_HITS=3;
