// v1.1c osumat: haulin oikea lentorata kohteen paikalliskoordinaateissa ja varamuoto (ellipsoidi) mallin pinnalle
// malli: +z eteen (pää), +y ylös; rotation.y = PI/2 - heading (kuten main.js)
export function toLocal(v,pos,heading,isDir=false){const a=-(Math.PI/2-heading),c=Math.cos(a),s=Math.sin(a);const x=isDir?v.x:v.x-pos.x,y=isDir?v.y:v.y-pos.y,z=isDir?v.z:v.z-pos.z;return{x:c*x+s*z,y,z:-s*x+c*z};}
// säde–ellipsoidi: palauttaa ensimmäisen leikkauspisteen ja normaalin tai null
export function rayEllipsoid(o,d,C,R){const ox=(o.x-C.x)/R.x,oy=(o.y-C.y)/R.y,oz=(o.z-C.z)/R.z,dx=d.x/R.x,dy=d.y/R.y,dz=d.z/R.z;
  const a=dx*dx+dy*dy+dz*dz,b=2*(ox*dx+oy*dy+oz*dz),c=ox*ox+oy*oy+oz*oz-1,D=b*b-4*a*c;if(D<0)return null;const t=(-b-Math.sqrt(D))/(2*a);if(t<0)return null;
  const p={x:o.x+d.x*t,y:o.y+d.y*t,z:o.z+d.z*t},n={x:(p.x-C.x)/R.x**2,y:(p.y-C.y)/R.y**2,z:(p.z-C.z)/R.z**2},L=Math.hypot(n.x,n.y,n.z);return{p,n:{x:n.x/L,y:n.y/L,z:n.z/L},t};}
// kehon alue paikallisesta pisteestä
export function region(p,C,R){const z=(p.z-C.z)/R.z,x=(p.x-C.x)/R.x,y=(p.y-C.y)/R.y;if(z>0.6)return'etu';if(z<-0.6)return'taka';if(Math.abs(x)>=Math.abs(y))return'kylki';return y>0?'selka':'vatsa';}
export const HARE_BODY={C:{x:0,y:0.2,z:0},R:{x:0.11,y:0.13,z:0.24}};

// Lähin piste kolmioon (Ericson, Real-Time Collision Detection 5.1.5)
function cpTri(p,a,b,c){const sub=(u,v)=>[u[0]-v[0],u[1]-v[1],u[2]-v[2]],dot=(u,v)=>u[0]*v[0]+u[1]*v[1]+u[2]*v[2],ad=(u,v,s)=>[u[0]+v[0]*s,u[1]+v[1]*s,u[2]+v[2]*s];
  const ab=sub(b,a),ac=sub(c,a),ap=sub(p,a),d1=dot(ab,ap),d2=dot(ac,ap);if(d1<=0&&d2<=0)return a;
  const bp=sub(p,b),d3=dot(ab,bp),d4=dot(ac,bp);if(d3>=0&&d4<=d3)return b;const vc=d1*d4-d3*d2;if(vc<=0&&d1>=0&&d3<=0)return ad(a,ab,d1/(d1-d3));
  const cp=sub(p,c),d5=dot(ab,cp),d6=dot(ac,cp);if(d6>=0&&d5<=d6)return c;const vb=d5*d2-d1*d6;if(vb<=0&&d2>=0&&d6<=0)return ad(a,ac,d2/(d2-d6));
  const va=d3*d6-d5*d4;if(va<=0&&d4-d3>=0&&d5-d6>=0){const w=(d4-d3)/((d4-d3)+(d5-d6));return ad(b,sub(c,b),w);}
  const den=1/(va+vb+vc);return ad(ad(a,ab,vb*den),ac,vc*den);}
// tris: Float32Array/Array, 9 lukua per kolmio. Palauttaa {p:[x,y,z], n:[kolmion normaali], d:etäisyys}
export function closestOnTris(p,tris){let best=null,bd=Infinity,bi=0;for(let i=0;i<tris.length;i+=9){const a=[tris[i],tris[i+1],tris[i+2]],b=[tris[i+3],tris[i+4],tris[i+5]],c=[tris[i+6],tris[i+7],tris[i+8]],q=cpTri(p,a,b,c),d=(q[0]-p[0])**2+(q[1]-p[1])**2+(q[2]-p[2])**2;if(d<bd){bd=d;best=q;bi=i;}}
  if(!best)return null;const t=tris,ti=bi/9,u=[t[bi+3]-t[bi],t[bi+4]-t[bi+1],t[bi+5]-t[bi+2]],v=[t[bi+6]-t[bi],t[bi+7]-t[bi+1],t[bi+8]-t[bi+2]];let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];const l=Math.hypot(...n)||1;n=n.map(x=>x/l);return{p:best,n,d:Math.sqrt(bd),i:ti};}
// Ellipsoidi bounding boxista (varamuoto)
export function ellipsoidFromBox(min,max){return{C:{x:(min.x+max.x)/2,y:(min.y+max.y)/2,z:(min.z+max.z)/2},R:{x:(max.x-min.x)/2,y:(max.y-min.y)/2,z:(max.z-min.z)/2}};}
