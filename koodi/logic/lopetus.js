// Jahdin lopetus tynnyrisaunan luona. Pisteet ovat vain loppuyhteenvedon asteikko
// (jänis 10, teeri 8, peura 25, metsäkauris 18). Saalispussin kirjausta tämä ei muuta.
import { SAUNA_POLY } from './world.js';

export const PISTE = { janis: 10, teeri: 8, peura: 25, kauris: 18, kettu: 15 };
export const SAUNA_SADE = 5.5;
// Sama oven suunta kuin main.js: tynnyrin akseli osoittaa local +X:stä maailmaan.
const PHI = Math.atan2(0.962, 0.272);
const OVI = { x: Math.cos(PHI), z: -Math.sin(PHI) };

export function saunaPiste(poly = SAUNA_POLY) {
  let x = 0, z = 0;
  for (const [a, b] of poly) { x += a; z += b; }
  return { x: x / poly.length, z: z / poly.length };
}

// Oven edusta: keskipisteestä oven suuntaan, tynnyrin pään ulkopuolelle.
export function saunaEtu(poly = SAUNA_POLY) {
  const p = saunaPiste(poly);
  return { x: p.x + OVI.x * 3.1, z: p.z + OVI.z * 3.1, dx: OVI.x, dz: OVI.z };
}

export function nearSauna(px, pz, piste, r = SAUNA_SADE) {
  return Math.hypot(px - piste.x, pz - piste.z) <= r;
}

// Vieras pyytää isäntää; isäntä ja yksinpeli käynnistävät itse.
export function lopetusPyynto(role, peer) {
  return peer && role === 'v' ? 'pyynto' : 'itse';
}

function tyhja() { return { janis: 0, teeri: 0, peura: 0, kauris: 0, kettu: 0, pisteet: 0, laukaukset: 0, osumat: 0 }; }

// elaimet: {kind, alive, owner}. Vain kaatuneet jänikset, teeret ja peurat.
// Omistaja puuttuu tai on muu kuin pelaaja -> isäntä. Yksinpelissä kaikki isännälle.
export function yhteenveto({ elaimet = [], laukaukset = {}, noudot = 0, moninpeli = false } = {}) {
  const pelaajat = {};
  for (const id of (moninpeli ? ['h', 'v'] : ['h'])) pelaajat[id] = tyhja();
  const rivi = [];
  for (const e of elaimet) {
    if (!e || e.alive || !PISTE[e.kind]) continue;
    let owner = e.owner === 'v' ? 'v' : 'h';
    if (!moninpeli) owner = 'h';
    const p = pelaajat[owner] || (pelaajat[owner] = tyhja());
    p[e.kind]++;
    p.pisteet += PISTE[e.kind];
    rivi.push({ kind: e.kind, owner });
  }
  for (const id of Object.keys(pelaajat)) {
    const s = laukaukset[id] || {};
    pelaajat[id].laukaukset = s.laukaukset | 0;
    pelaajat[id].osumat = s.osumat | 0;
  }
  return { pelaajat, noudot: noudot | 0, rivi, moninpeli: !!moninpeli };
}

const LEV = { janis: 0.8, teeri: 0.65, peura: 1.55, kauris: 1.05, kettu: 0.9 };

// Saaliit oven edustalla, metsästäjät ja koirat niiden takana (lähempänä saunaa).
export function riviPaikat(etu, rivi, metsastajia, koiria) {
  const dx = etu.dx, dz = etu.dz, px = -dz, pz = dx;
  const widths = rivi.map(e => LEV[e.kind] || 0.8);
  const total = widths.reduce((a, b) => a + b, 0);
  let acc = -total / 2;
  const elaimet = rivi.map((e, i) => {
    const off = acc + widths[i] / 2;
    acc += widths[i];
    return { kind: e.kind, owner: e.owner, x: etu.x + dx * 2.4 + px * off, z: etu.z + dz * 2.4 + pz * off };
  });
  const order = [];
  for (let i = 0; i < Math.max(metsastajia, koiria); i++) {
    if (i < metsastajia) order.push('metsastaja');
    if (i < koiria) order.push('koira');
  }
  const gap = 0.95, span = Math.max(0, order.length - 1) * gap;
  const yaw = Math.atan2(-dx, -dz);
  const ihmiset = order.map((kind, i) => {
    const off = -span / 2 + i * gap;
    return { kind, x: etu.x + dx * 0.55 + px * off, z: etu.z + dz * 0.55 + pz * off, yaw };
  });
  const look = elaimet.length
    ? { x: elaimet.reduce((s, p) => s + p.x, 0) / elaimet.length, z: elaimet.reduce((s, p) => s + p.z, 0) / elaimet.length }
    : { x: etu.x + dx * 1.4, z: etu.z + dz * 1.4 };
  return { elaimet, ihmiset, look, yaw, radius: Math.max(8.5, total / 2 + 5.5) };
}

export function yhteenvetoTeksti(y) {
  const lines = ['Jahti päättyi saunalle', ''];
  for (const id of (y.moninpeli ? ['h', 'v'] : ['h'])) {
    const p = y.pelaajat[id];
    lines.push(y.moninpeli ? (id === 'h' ? 'Isäntä' : 'Vieras') : 'Sinä');
    lines.push(`jänikset ${p.janis} · teeret ${p.teeri} · peurat ${p.peura} · metsäkauris ${p.kauris} · ketut ${p.kettu}`);
    lines.push(`pisteet ${p.pisteet}`);
    lines.push(`laukaukset ${p.laukaukset} · osumat ${p.osumat}`);
    lines.push('');
  }
  lines.push(`Koiran noudot: ${y.noudot}`);
  return lines.join('\n');
}
