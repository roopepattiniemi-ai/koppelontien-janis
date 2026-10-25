// Vitara ajaa itse pelaajan viereen. Käyttää samaa Car.update-fysiikkaa.
// Jos reitti ei ole vapaa tai auto ei etene noin 8 sekuntiin, se peruuttaa ja
// yrittää uutta reittiä. Viimeisenä keinona auto siirretään lähimpään vapaaseen
// kohtaan pelaajan lähelle. Jos sekään ei onnistu, FSD luovuttaa.
import { carFree } from './car.js';
import { ROADS } from './world.js';

export const FSD_TEKSTI = 'FSD aktivoitu – Full Self Driving (beta)';
export const FSD_LUOVUTTI = 'FSD luovutti';
export const FSD_JUMI = 8;
export const FSD_HOMMAT = [
  'FSD väistää jallupulloa',
  'FSD tarkistaa peilin, peiliä ei ole',
  'FSD laskee lumikiteitä',
  'FSD väistää näkymätöntä hirveä',
  'FSD päivittää beta-betaa',
];

export function fsdSaaKutsua({ autossa, vierasAutossa } = {}) {
  return !autossa && !vierasAutossa;
}

export function fsdKomento(role, peer) {
  return role === 'v' && peer ? 'pyynto' : 'itse';
}

export function fsdKommentti(rand = Math.random) {
  return FSD_HOMMAT[Math.min(FSD_HOMMAT.length - 1, (rand() * FSD_HOMMAT.length) | 0)];
}

export function fsdTila() {
  return { on: false, i: 0, reitti: [], jumissa: 0, ax: 0, az: 0, kommentti: null };
}

function este(blocked, x, z) {
  return typeof blocked === 'function' && !!blocked(x, z);
}

function soluVapaa(x, z, vapaa, blocked) {
  if (!vapaa(x, z) || este(blocked, x, z)) return false;
  for (const [dx, dz] of [[0.8, 0], [-0.8, 0], [0, 1.2], [0, -1.4]]) {
    if (!vapaa(x + dx, z + dz) || este(blocked, x + dx, z + dz)) return false;
  }
  return true;
}

function linjaVapaa(ax, az, bx, bz, vapaa) {
  const L = Math.hypot(bx - ax, bz - az);
  const n = Math.max(1, Math.ceil(L / 3));
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    if (!vapaa(ax + (bx - ax) * t, az + (bz - az) * t)) return false;
  }
  return true;
}

export function fsdVapaaPiste(kohde, { vapaa = carFree, blocked = null } = {}) {
  let best = null;
  for (let r = 2.6; r <= 5.7; r += 0.55) {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const x = kohde.x + Math.sin(a) * r;
      const z = kohde.z - Math.cos(a) * r;
      if (!soluVapaa(x, z, vapaa, blocked)) continue;
      const d = Math.hypot(x - kohde.x, z - kohde.z);
      if (!best || d < best.d) best = { x, z, d };
    }
    if (best) break;
  }
  return best;
}

function lahinTie(x, z, roads, ohita = -1) {
  let best = null, bd = 1e9;
  for (let r = 0; r < roads.length; r++) {
    if (r === ohita) continue;
    const pts = roads[r].pts;
    for (let i = 0; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - x, pts[i][1] - z);
      if (d < bd) { bd = d; best = { x: pts[i][0], z: pts[i][1], r, i, d }; }
    }
  }
  return best;
}

function pysays(from, kohde) {
  const dx = kohde.x - from.x, dz = kohde.z - from.z;
  const L = Math.hypot(dx, dz) || 1;
  const s = Math.min(3.5, Math.max(0, L - 0.4));
  return { x: kohde.x - (dx / L) * s, z: kohde.z - (dz / L) * s };
}

export function fsdReitti(car, kohde, { vapaa = carFree, roads = ROADS, bias = 0 } = {}) {
  const kohdeP = { x: kohde.x, z: kohde.z };
  const suora = Math.hypot(kohde.x - car.x, kohde.z - car.z) < 140
    && linjaVapaa(car.x, car.z, kohde.x, kohde.z, vapaa);
  if (suora && !bias) return [pysays(car, kohdeP)];
  if (bias) {
    const side = bias % 2 ? 1 : -1;
    const dist = 14 + (bias % 3) * 6;
    const hx = Math.sin(car.heading), hz = -Math.cos(car.heading);
    const sx = car.x - hx * 6 + Math.cos(car.heading) * side * dist;
    const sz = car.z - hz * 6 + Math.sin(car.heading) * side * dist;
    const pys = pysays({ x: sx, z: sz }, kohdeP);
    if (vapaa(sx, sz) && linjaVapaa(car.x, car.z, sx, sz, vapaa) && linjaVapaa(sx, sz, pys.x, pys.z, vapaa))
      return [{ x: sx, z: sz }, pys];
  }
  const a = lahinTie(car.x, car.z, roads, bias > 1 ? (lahinTie(car.x, car.z, roads)?.r ?? -1) : -1);
  const b = lahinTie(kohde.x, kohde.z, roads);
  const pts = [];
  if (a && b && a.r === b.r) {
    const step = a.i <= b.i ? 1 : -1;
    for (let i = a.i; step > 0 ? i <= b.i : i >= b.i; i += step) {
      const p = roads[a.r].pts[i];
      const ed = pts.at(-1);
      if (!ed || Math.hypot(ed.x - p[0], ed.z - p[1]) > 6) pts.push({ x: p[0], z: p[1] });
    }
  } else if (a && b) {
    pts.push({ x: a.x, z: a.z }, { x: b.x, z: b.z });
  }
  const ed = pts.at(-1) || car;
  pts.push(pysays(ed, kohdeP));
  return pts;
}

function reittiKelpaa(car, pts, vapaa) {
  if (!pts?.length) return false;
  let x = car.x, z = car.z;
  for (const p of pts) {
    if (!linjaVapaa(x, z, p.x, p.z, vapaa)) return false;
    x = p.x; z = p.z;
  }
  return true;
}

export function fsdOhjaus(car, wp) {
  const dx = wp.x - car.x, dz = wp.z - car.z;
  const dist = Math.hypot(dx, dz);
  const want = Math.atan2(dx, -dz);
  const dh = Math.atan2(Math.sin(want - car.heading), Math.cos(want - car.heading));
  const steer = Math.max(-1, Math.min(1, dh * 2.2));
  let throttle = Math.abs(dh) > 0.7 ? 0.12 : 0.55;
  if (dist < 8) throttle = dist < 2.2 ? 0.16 : 0.3;
  if (car.speed > dist * 0.85 + 0.35) throttle = -1;
  const perilla = dist < 0.55 && car.speed < 0.5;
  if (perilla) return { throttle: 0, steer: 0, perilla: true, dist };
  return { throttle, steer, perilla: false, dist };
}

function muistaApu(tila, car, apu) {
  tila.vapaa = apu.vapaa || carFree;
  tila.roads = apu.roads || ROADS;
  tila.blocked = apu.blocked || car.blocked || (() => false);
}

function rakenna(tila, car) {
  tila.reitti = fsdReitti(car, tila.kohde, { vapaa: tila.vapaa, roads: tila.roads, bias: tila.bias | 0 });
  tila.i = 0;
  tila.pi = -1;
  tila.paras = 1e9;
  tila.jumissa = 0;
  tila.ax = car.x;
  tila.az = car.z;
  tila.kelpaa = reittiKelpaa(car, tila.reitti, tila.vapaa);
}

function aloitaPeru(tila, car) {
  tila.peru = 1.6;
  tila.peruOhjaus = ((tila.yritykset | 0) % 2 ? -1 : 1) * 0.85;
  tila.peruLiikkui = false;
  tila.ax = car.x;
  tila.az = car.z;
  tila.jumissa = 0;
}

function siirraTaiLuovuta(tila, car) {
  const p = fsdVapaaPiste(tila.kohde, { vapaa: tila.vapaa, blocked: tila.blocked });
  if (!p) {
    tila.on = false;
    return { tapahtuma: 'luovutti', teksti: FSD_LUOVUTTI, throttle: 0, steer: 0 };
  }
  car.x = p.x;
  car.z = p.z;
  car.speed = 0;
  car.heading = Math.atan2(tila.kohde.x - p.x, -(tila.kohde.z - p.z));
  car.pose?.();
  tila.on = false;
  return { tapahtuma: 'perilla', teksti: null, throttle: 0, steer: 0, siirto: true };
}

export function fsdKaynnista(tila, car, kohde, apu = {}, rand = Math.random) {
  tila.on = true;
  tila.kohde = { x: kohde.x, z: kohde.z };
  muistaApu(tila, car, apu);
  tila.yritykset = 0;
  tila.bias = 0;
  tila.peru = 0;
  tila.kommentti = fsdKommentti(rand);
  rakenna(tila, car);
  if (!tila.kelpaa) aloitaPeru(tila, car);
  return { teksti: FSD_TEKSTI, kommentti: tila.kommentti };
}

export function fsdPaivita(tila, car, dt) {
  if (!tila.on || !tila.kohde) return null;
  if (tila.peru > 0) {
    if (Math.hypot(car.x - tila.ax, car.z - tila.az) >= 0.4) tila.peruLiikkui = true;
    tila.peru -= dt;
    if (tila.peru > 0) return { tapahtuma: null, teksti: null, throttle: -0.9, steer: tila.peruOhjaus || 0.8 };
    tila.yritykset = (tila.yritykset | 0) + 1;
    tila.bias = tila.yritykset;
    const eiLiikkunut = !tila.peruLiikkui;
    rakenna(tila, car);
    if (!tila.kelpaa || eiLiikkunut || tila.yritykset >= 3) return siirraTaiLuovuta(tila, car);
  }
  const reitti = tila.reitti?.length ? tila.reitti : [{ x: tila.kohde.x, z: tila.kohde.z }];
  while (tila.i < reitti.length - 1 && Math.hypot(reitti[tila.i].x - car.x, reitti[tila.i].z - car.z) < 5) tila.i++;
  if (tila.pi !== tila.i) { tila.pi = tila.i; tila.paras = 1e9; tila.jumissa = 0; }
  const wp = reitti[Math.min(tila.i, reitti.length - 1)];
  const oh = fsdOhjaus(car, wp);
  if (oh.dist + 0.35 < tila.paras) { tila.paras = oh.dist; tila.jumissa = 0; tila.ax = car.x; tila.az = car.z; }
  else tila.jumissa += dt;
  if (oh.perilla && tila.i >= reitti.length - 1) {
    tila.on = false;
    return { tapahtuma: 'perilla', teksti: null, throttle: 0, steer: 0 };
  }
  if (!tila.kelpaa || tila.jumissa >= FSD_JUMI) {
    aloitaPeru(tila, car);
    return { tapahtuma: null, teksti: null, throttle: -0.9, steer: tila.peruOhjaus };
  }
  return { tapahtuma: null, teksti: null, throttle: oh.throttle, steer: oh.steer };
}
