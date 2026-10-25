// Riistakamerat pihalla ja metsän reunassa, sekä tietokone jolta kuvia katsotaan.
import { mulberry32 } from './rng.js';
import { RIISTAKAMERA } from './config.js';

export const HAUSKA = ['juoppo', 'ufomies', 'norsu', 'bigfoot'];
const TEKSTI = {
  juoppo: 'Juoppo ja jallupullo',
  ufomies: 'Ufomies',
  norsu: 'Norsu',
  bigfoot: 'Bigfoot',
  mummo: 'Mummo porkkanoineen',
  janis: 'Jänis',
  kettu: 'Kettu',
  teeri: 'Teeri',
  korppi: 'Korppi',
  peura: 'Peura',
  koira: 'Ajokoira',
  terrieri: 'Terrieri',
  pelaaja: 'Metsästäjä',
  orava: 'Orava'
};

export function kameratPihasta(cabin) {
  const c = Math.cos(cabin.rot || 0), s = Math.sin(cabin.rot || 0);
  const w = (lx, lz) => ({ x: cabin.x + lx * c + lz * s, z: cabin.z - lx * s + lz * c });
  const piha = w(6.5, 16);
  const reuna = w(-18, 36);
  return [
    { id: 'piha', x: piha.x, z: piha.z, yaw: cabin.rot || 0, kantama: 22, kulma: 0.85 },
    { id: 'reuna', x: reuna.x, z: reuna.z, yaw: (cabin.rot || 0) + 0.8, kantama: 26, kulma: 0.75 }
  ];
}

export function koneMaailma(cabin) {
  const lx = -2.55, lz = 4.05;
  const c = Math.cos(cabin.rot || 0), s = Math.sin(cabin.rot || 0);
  return { x: cabin.x + lx * c + lz * s, z: cabin.z - lx * s + lz * c };
}

export function koneLaatikko(cabin) {
  const p = koneMaailma(cabin);
  return { x: p.x, z: p.z, yaw: cabin.rot || 0, hx: 0.55, hz: 0.42 };
}

// Pelissä näkyvä kamera ja kone. Lippu false: ei synny mitään. Geometria jää talteen.
export function pelinKamerat(cabin) {
  return RIISTAKAMERA ? kameratPihasta(cabin) : [];
}
export function pelinKone(cabin) {
  return RIISTAKAMERA ? koneMaailma(cabin) : null;
}
export function pelinKoneLaatikko(cabin) {
  return RIISTAKAMERA ? koneLaatikko(cabin) : null;
}

export function nakyy(cam, e) {
  if (!cam || !e) return false;
  const dx = e.x - cam.x, dz = e.z - cam.z, d = Math.hypot(dx, dz);
  if (d < 2 || d > cam.kantama) return false;
  let er = Math.atan2(dx, dz) - cam.yaw;
  er = Math.atan2(Math.sin(er), Math.cos(er));
  return Math.abs(er) < cam.kulma;
}

export function kuvaLeima(seed, yo) {
  const r = mulberry32((seed >>> 0) || 1);
  const h = yo ? 21 + (r() * 3 | 0) : 8 + (r() * 8 | 0);
  const m = r() * 60 | 0;
  const z = n => String(n).padStart(2, '0');
  return { leima: `24.10.2026 ${z(h)}:${z(m)}`, lampo: Math.round(-16 + r() * 12), yo: !!yo };
}

export function lisaaKuva(kuvat, kuva, nyt) {
  if (!kuva || !kuva.laji) return false;
  const viim = [...kuvat].reverse().find(k => k.laji === kuva.laji && k.kamera === kuva.kamera);
  if (viim && nyt - viim.aika < 12) return false;
  kuvat.push(kuva);
  if (kuvat.length > 24) kuvat.shift();
  return true;
}

export function ohikulut(kamerat, elaimet, kuvat, nyt, yo) {
  const uudet = [];
  for (const cam of kamerat) {
    for (const e of elaimet) {
      if (!e || e.alive === false || !nakyy(cam, e)) continue;
      const leima = kuvaLeima((nyt * 10 | 0) ^ (e.x * 13 | 0) ^ (e.z * 17 | 0) ^ cam.id.length, yo);
      const kuva = {
        laji: e.laji, kamera: cam.id, aika: nyt, x: Math.round(e.x * 10) / 10, z: Math.round(e.z * 10) / 10,
        teksti: e.teksti || TEKSTI[e.laji] || e.laji, ...leima
      };
      if (lisaaKuva(kuvat, kuva, nyt)) uudet.push(kuva);
    }
  }
  return uudet;
}

export function paivitaHauskat(lista, kamerat, dt, rand, nyt) {
  for (let i = lista.length - 1; i >= 0; i--) {
    const e = lista[i];
    e.x += e.vx * dt;
    e.z += e.vz * dt;
    e.t += dt;
    if (e.t > e.kesto) lista.splice(i, 1);
  }
  if (!lista.length && kamerat.length && rand() < dt / 28) {
    const cam = kamerat[(rand() * kamerat.length) | 0];
    const laji = HAUSKA[(rand() * HAUSKA.length) | 0];
    const vx = -Math.sin(cam.yaw) * 2.1, vz = -Math.cos(cam.yaw) * 2.1;
    lista.push({
      laji, teksti: TEKSTI[laji], x: cam.x + Math.sin(cam.yaw) * 18, z: cam.z + Math.cos(cam.yaw) * 18,
      vx, vz, t: 0, kesto: 16, alive: true
    });
  }
  return lista;
}

export function bigfootKuva(kuva) {
  return !!(kuva && kuva.laji === 'bigfoot');
}
