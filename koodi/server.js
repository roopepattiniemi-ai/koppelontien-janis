import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { WebSocketServer } from 'ws'; import { Relay } from './logic/relay.js';
const here=path.dirname(fileURLToPath(import.meta.url));
const roots={'/three/':path.join(here,'node_modules/three/'),'/logic/':path.join(here,'logic/'),'/grafiikka/':path.join(here,'../grafiikka/'),'/aanet/':path.join(here,'../aanet/'),'/hud/':path.join(here,'../hud/'),'/':path.join(here,'public/')};
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav','.json':'application/json'};
const server=http.createServer((req,res)=>{
  let u=decodeURIComponent(req.url.split('?')[0]); if(u==='/')u='/index.html'; if(u==='/favicon.ico')return res.writeHead(204).end();
  const pre=Object.keys(roots).find(p=>u.startsWith(p)); const base=roots[pre]; const f=path.join(base,u.slice(pre.length));
  if(!f.startsWith(base))return res.writeHead(403).end();
  fs.readFile(f,(e,d)=>{ if(e)return res.writeHead(404).end('ei löydy'); res.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'}); res.end(d);});
});
// moninpeli: websocket-rele samassa portissa, /ws?huone=KOODI
const relay=new Relay(),wss=new WebSocketServer({server,path:'/ws',maxPayload:16384});
wss.on('connection',(ws,req)=>{const code=new URL(req.url,'http://x').searchParams.get('huone');const r=relay.join(code,ws);
  if(!r.ok){ws.send(JSON.stringify({t:'virhe',syy:r.syy}));return ws.close();}
  ws.send(JSON.stringify({t:'tervetuloa',role:r.role,muita:r.others.length}));for(const o of r.others)o.send(JSON.stringify({t:'liittyi',role:r.role}));
  ws.on('message',d=>{const s=d.toString();for(const o of relay.route(ws,s))if(o.readyState===1)o.send(s);});
  ws.on('close',()=>{for(const o of relay.leave(ws))if(o.readyState===1)o.send(JSON.stringify({t:'poistui',role:ws.role,uusiRooli:o.role}));});});
server.listen(process.env.PORT||3000,()=>console.log('Koppelontien jänis: http://localhost:'+(process.env.PORT||3000)));
