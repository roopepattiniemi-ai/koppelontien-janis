// Vitara ajaa itse pelaajan viereen. Käyttää samaa Car.update-fysiikkaa.
import { carFree } from './car.js';
import { ROADS } from './world.js';

export const FSD_TEKSTI = 'FSD aktivoitu – Full Self Driving (beta)';
export const FSD_LUOVUTTI = 'FSD luovutti';
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

function suoraVapaa(ax, az, bx, bz, vapaa) {
  const L = Math.hypot(bx - ax, bz - az);
  const n = Math.max(1, Math.ceil(L / 3));
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    if (!vapaa(ax + (bx - ax) * t, az + (bz - az) * t)) return false;
  }
  return true;
}

function lahinTie(x, z, roads) {
  let best = null, bd = 1e9;
  for (let r = 0; r < roads.length; r++) {
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

export function fsdReitti(car, kohde, { vapaa = carFree, roads = ROADS } = {}) {
  const kohdeP = { x: kohde.x, z: kohde.z };
  if (suoraVapaa(car.x, car.z, kohde.x, kohde.z, vapaa) && Math.hypot(kohde.x - car.x, kohde.z - car.z) < 140)
    return [pysays(car, kohdeP)];
  const a = lahinTie(car.x, car.z, roads);
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

export function fsdKaynnista(tila, car, kohde, apu = {}, rand = Math.random) {
  tila.on = true;
  tila.reitti = fsdReitti(car, kohde, apu);
  tila.i = 0;
  tila.jumissa = 0;
  tila.ax = car.x;
  tila.az = car.z;
  tila.kommentti = fsdKommentti(rand);
  return { teksti: FSD_TEKSTI, kommentti: tila.kommentti };
}

export function fsdPaivita(tila, car, dt) {
  if (!tila.on) return null;
  if (Math.hypot(car.x - tila.ax, car.z - tila.az) < 0.4) tila.jumissa += dt;
  else { tila.jumissa = 0; tila.ax = car.x; tila.az = car.z; }
  const reitti = tila.reitti.length ? tila.reitti : [{ x: car.x, z: car.z }];
  while (tila.i < reitti.length - 1 && Math.hypot(reitti[tila.i].x - car.x, reitti[tila.i].z - car.z) < 5) tila.i++;
  const wp = reitti[Math.min(tila.i, reitti.length - 1)];
  const oh = fsdOhjaus(car, wp);
  if (oh.perilla && tila.i >= reitti.length - 1) {
    tila.on = false;
    return { tapahtuma: 'perilla', teksti: null, throttle: 0, steer: 0 };
  }
  if (tila.jumissa > 10) {
    tila.on = false;
    return { tapahtuma: 'luovutti', teksti: FSD_LUOVUTTI, throttle: 0, steer: 0 };
  }
  return { tapahtuma: null, teksti: null, throttle: oh.throttle, steer: oh.steer };
}
