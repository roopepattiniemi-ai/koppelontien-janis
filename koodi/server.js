import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const roots={'/three/':path.join(here,'node_modules/three/'),'/logic/':path.join(here,'logic/'),'/grafiikka/':path.join(here,'../grafiikka/'),'/aanet/':path.join(here,'../aanet/'),'/':path.join(here,'public/')};
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav','.json':'application/json'};
http.createServer((req,res)=>{
  let u=decodeURIComponent(req.url.split('?')[0]); if(u==='/')u='/index.html';
  const pre=Object.keys(roots).find(p=>u.startsWith(p)); const base=roots[pre]; const f=path.join(base,u.slice(pre.length));
  if(!f.startsWith(base))return res.writeHead(403).end();
  fs.readFile(f,(e,d)=>{ if(e)return res.writeHead(404).end('ei löydy'); res.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'}); res.end(d);});
}).listen(process.env.PORT||3000,()=>console.log('Koppelontien jänis: http://localhost:'+(process.env.PORT||3000)));
