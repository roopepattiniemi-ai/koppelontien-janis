// Koppelontie 30: mökki, tynnyrisauna ja L-navetta. Siirto on lisäys pohjapolygoniin, ei kertymä.
import { CABIN, CABIN_POLY, SAUNA_POLY, NAVETTA_POLY } from './world.js';
import { paivitaEsteet } from './dog.js';

const NIMET = ['mokki', 'sauna', 'navetta'];
const pohja = {
  mokki: CABIN_POLY.map(p => p.slice()),
  sauna: SAUNA_POLY.map(p => p.slice()),
  navetta: NAVETTA_POLY.map(p => p.slice())
};
const cabin0 = { x: CABIN.x, z: CABIN.z, rot: CABIN.rot };
const live = { mokki: CABIN_POLY, sauna: SAUNA_POLY, navetta: NAVETTA_POLY };

function keskus(P) {
  let x = 0, z = 0;
  for (const [a, b] of P) { x += a; z += b; }
  return { x: x / P.length, z: z / P.length };
}

export function pihaOletus() {
  return { mokki: { x: 0, z: 0, rot: 0 }, sauna: { x: 0, z: 0, rot: 0 }, navetta: { x: 0, z: 0, rot: 0 } };
}

export function tarkistaPiha(o) {
  if (!o || typeof o !== 'object') return null;
  const out = {};
  for (const n of NIMET) {
    const p = o[n];
    if (!p || typeof p !== 'object') return null;
    const x = +p.x, z = +p.z, rot = +p.rot;
    if (!Number.isFinite(x) || !Number.isFinite(z) || !Number.isFinite(rot)) return null;
    if (Math.hypot(x, z) >= 80 || Math.abs(rot) >= Math.PI * 4) return null;
    out[n] = { x, z, rot };
  }
  return out;
}

// Sama kierto kuin Three.js rotation.y, keskipisteen ympäri. Mesh ja törmäys pysyvät yhdessä.
export function muunnaPoly(P, off) {
  const c = keskus(P), co = Math.cos(off.rot || 0), si = Math.sin(off.rot || 0);
  return P.map(([x, z]) => {
    const dx = x - c.x, dz = z - c.z;
    return [c.x + dx * co + dz * si + off.x, c.z - dx * si + dz * co + off.z];
  });
}

export function pihaPohja(nimi) { return keskus(pohja[nimi]); }

let versio = 0;
let nykyinen = pihaOletus();
export function pihaVersio() { return versio; }
export function pihaNykyinen() { return nykyinen; }

export function sovellaPiha(raw) {
  const p = tarkistaPiha(raw);
  if (!p) return false;
  if (versio > 0 && NIMET.every(n => nykyinen[n].x === p[n].x && nykyinen[n].z === p[n].z && nykyinen[n].rot === p[n].rot)) return false;
  for (const n of NIMET) {
    const q = muunnaPoly(pohja[n], p[n]);
    const arr = live[n];
    arr.length = 0;
    for (const pt of q) arr.push(pt);
  }
  CABIN.x = cabin0.x + p.mokki.x;
  CABIN.z = cabin0.z + p.mokki.z;
  CABIN.rot = cabin0.rot + p.mokki.rot;
  nykyinen = p;
  versio++;
  paivitaEsteet();
  return true;
}

export function pihaSalasana(env) { return String((env && env.PIHA_SALASANA) || 'koppelo'); }

export function pihaPyynto(body, oikea) {
  if (String(body?.salasana ?? '') !== String(oikea ?? '')) return { ok: false, status: 403 };
  const p = tarkistaPiha(body?.piha || body);
  if (!p) return { ok: false, status: 400 };
  return { ok: true, status: 200, piha: p };
}
