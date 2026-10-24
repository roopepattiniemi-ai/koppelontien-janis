import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { WebSocketServer } from 'ws'; import { Relay } from './logic/relay.js';
import { pihaOletus, pihaPyynto, pihaSalasana, tarkistaPiha } from './logic/piha.js';
const here=path.dirname(fileURLToPath(import.meta.url));
const pihaTiedosto=path.join(here,'data','piha.json');
const roots={'/three/':path.join(here,'node_modules/three/'),'/logic/':path.join(here,'logic/'),'/grafiikka/':path.join(here,'../grafiikka/'),'/aanet/':path.join(here,'../aanet/'),'/hud/':path.join(here,'../hud/'),'/':path.join(here,'public/')};
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.glb':'model/gltf-binary','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav','.json':'application/json'};
function luePihaLevy(){try{const p=tarkistaPiha(JSON.parse(fs.readFileSync(pihaTiedosto,'utf8')));if(p)return p;}catch{}return pihaOletus();}
function lueBody(req,max=8192){return new Promise((resolve,reject)=>{let n=0,b='';req.on('data',c=>{n+=c.length;if(n>max){reject(new Error('iso'));req.destroy();return;}b+=c;});req.on('end',()=>resolve(b));req.on('error',reject);});}
function json(res,code,o){res.writeHead(code,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(o));}
async function pihaApi(req,res){
  if(req.method==='GET')return json(res,200,{ok:true,piha:luePihaLevy()});
  if(req.method!=='POST')return res.writeHead(405).end();
  let body;try{body=JSON.parse(await lueBody(req)||'{}');}catch{return json(res,400,{ok:false});}
  // PIHA_SALASANA: jos asetettu, se korvaa paikallisen oletussalasanan.
  const t=pihaPyynto(body,pihaSalasana(process.env));
  if(!t.ok)return json(res,t.status,{ok:false});
  fs.mkdirSync(path.dirname(pihaTiedosto),{recursive:true});
  fs.writeFileSync(pihaTiedosto,JSON.stringify(t.piha,null,2));
  return json(res,200,{ok:true,piha:t.piha});
}
const server=http.createServer((req,res)=>{
  let u=decodeURIComponent(req.url.split('?')[0]); if(u==='/api/piha')return pihaApi(req,res); if(u==='/')u='/index.html'; if(u==='/favicon.ico')return res.writeHead(204).end();
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
const port=process.env.PORT||3000;server.listen(port,'0.0.0.0',()=>console.log('Koppelontien jänis: http://localhost:'+port));
