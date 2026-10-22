// v1.1 kentän raja: maasto SIZE×SIZE (keskitetty), kova raja BOUND kaikille (pelaaja, auto, eläimet, koira, linnut).
export const SIZE=1400, BOUND=SIZE/2-4;
export const inBounds=(x,z,m=0)=>Math.abs(x)<BOUND-m&&Math.abs(z)<BOUND-m;
export const clampB=v=>Math.max(-BOUND,Math.min(BOUND,v));
// pakeneva eläin kääntyy reunalla: suunta (cos a, sin a) peilataan, jos se vie ulospäin reunavyöhykkeellä
export function turnBack(x,z,a,m=12){const L=BOUND-m;let c=Math.cos(a),s=Math.sin(a);if(Math.abs(x)>L&&c*Math.sign(x)>0)c=-c;if(Math.abs(z)>L&&s*Math.sign(z)>0)s=-s;return Math.atan2(s,c);}
