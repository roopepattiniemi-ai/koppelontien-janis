// v0.9: juonto biisien välissä 50 % todennäköisyydellä, ei samaa juontoa kahdesti peräkkäin
export const JUONNOT=4;
export function pickJuonto(k,last,rand=Math.random){if(rand()>=0.5)return null;
  const opts=[];for(let i=1;i<=JUONNOT;i++){const n='radio/juonto_'+k+'_'+i;if(n!==last)opts.push(n);}return opts[Math.floor(rand()*opts.length)%opts.length];}
