// Haavakon pako, makuu ja verijälki. Pienet eläimet makaavat lähemmäs.
import { nakyvyys } from './lumi.js';

export const HAAVA_FLUSH = 15;
export const VERI_SELVA = 10;

export function pieniLaji(laji) {
  return laji === 'janis' || laji === 'kettu';
}

function rnd(rand) {
  return typeof rand === 'function' ? rand() : (Number(rand) || 0);
}

/** Makuulle 150–400 m. Jänis ja kettu 150–250, kauris 180–300, peura 250–400. */
export function makuuMatka(laji, rand = Math.random) {
  const r = rnd(rand);
  if (pieniLaji(laji)) return 150 + r * 100;
  if (laji === 'kauris') return 180 + r * 120;
  return 250 + r * 150;
}

/** Sekunteja makuulla, jos haavakkoa ei löydetä. */
export function haavaKuolema(laji) {
  return pieniLaji(laji) ? 80 : 130;
}

/** Pisaran väli kasvaa matkan myötä. Isompi vahinko tihentää jälkeä. */
export function veriVali(matka, damage = 0) {
  const m = Math.max(0, Number(matka) || 0);
  const d = Math.max(0, Math.min(0.95, Number(damage) || 0));
  const v = (0.4 + m * 0.014) * (1.05 - 0.62 * d);
  return Math.max(0.32, Math.min(7.5, v));
}

/** 1 osumakohdassa, pienenee matkan myötä, ei katoa. */
export function veriKoko(matka) {
  const m = Math.max(0, Number(matka) || 0);
  return Math.max(0.28, 1 - m / 480);
}

/** Lumi ei peitä verta kokonaan. Tavallinen jälki voi haalistua 0.5:een, veri jää ≥ 0.72. */
export function veriNakyvyys(ika, lumi) {
  const n = nakyvyys(ika, lumi);
  return 0.72 + (n - 0.5) * 0.56;
}

/** Alle 10 m pisara piirretään selvästi. Kauempana lumi haalistaa, mutta ei peitä. */
export function veriSkaala(eta, s, nak) {
  const n = Math.max(0.72, Number(nak) || 0);
  const koko = s || 1;
  let sc = koko * n;
  if (eta < VERI_SELVA) sc = Math.max(sc, koko * 1.35);
  return sc;
}

function pisara(elain, x, z, s, matka) {
  const p = { x, z, s, matka, synty: elain.kello || 0 };
  (elain.veri || (elain.veri = [])).push(p);
  (elain.blood || (elain.blood = [])).push(p);
}

export function haavaKaynnista(elain, laji, dmg = 0.4) {
  elain.wounded = true;
  elain.damage = Math.min(0.95, (elain.damage || 0) + dmg);
  if (elain.haavaMatka == null) {
    const rand = elain.rand || Math.random;
    elain.haavaMatka = makuuMatka(laji, rand);
    elain.haavaKuljettu = 0;
    elain.haavaKuolee = haavaKuolema(laji);
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a = rnd(rand) * Math.PI * 2;
      const r = 0.05 + rnd(rand) * 0.4;
      pisara(elain, elain.x + Math.cos(a) * r, elain.z + Math.sin(a) * r, 1, 0);
    }
  }
}

function pudota(elain) {
  const matka = elain.haavaKuljettu || 0;
  const v = elain.veri || (elain.veri = []);
  const last = v.at(-1);
  if (last && Math.hypot(last.x - elain.x, last.z - elain.z) < veriVali(matka, elain.damage)) return;
  const side = (elain._veriPuoli = -(elain._veriPuoli || 1));
  const h = elain.heading || 0;
  const ox = -Math.sin(h) * 0.45 * side;
  const oz = Math.cos(h) * 0.45 * side;
  pisara(elain, elain.x + ox, elain.z + oz, veriKoko(matka), matka);
}

function pauseGap(elain) {
  return 3 + 22 * (1 - (elain.damage || 0)) * (0.6 + 0.8 * rnd(elain.rand || Math.random));
}

/**
 * Haavoittunut pako. true = normaali tilakone jää väliin.
 * pelaajat: vain nämä nostavat makaavan (koira saa seistä vieressä).
 */
export function haavaPaivita(elain, dt, { uhka, pelaajat, laji, move } = {}) {
  if (!elain.wounded || !elain.alive) return false;
  if (elain.haavaMatka == null) haavaKaynnista(elain, laji, 0);
  const pelaajaEta = () => {
    let d = 1e9;
    for (const p of pelaajat || []) {
      if (!p) continue;
      d = Math.min(d, Math.hypot(p.x - elain.x, p.z - elain.z));
    }
    return d;
  };
  if (elain.haavaMakuu) {
    elain.speed = 0;
    elain.paused = false;
    const pd = pelaajaEta();
    if (pd < HAAVA_FLUSH) {
      elain.haavaMakuu = false;
      elain.loytyi = true;
      elain.verelta = true;
      elain.paused = false;
      elain.pauseT = pauseGap(elain);
      elain.haavaMatka = (elain.haavaKuljettu || 0) + makuuMatka(laji, elain.rand || Math.random) * 0.4;
      elain.haavaKuolee = haavaKuolema(laji);
      const p = (pelaajat || []).find(q => q && Math.hypot(q.x - elain.x, q.z - elain.z) < HAAVA_FLUSH + 1) || uhka;
      if (p) elain.heading = Math.atan2(elain.z - p.z, elain.x - p.x);
    } else {
      if (!elain.loytyi && !elain.verelta) {
        elain.haavaKuolee -= dt;
        if (elain.haavaKuolee <= 0) {
          elain.alive = false;
          elain.speed = 0;
          elain.killedBy = 'haava';
          elain.haavaKuollut = true;
        }
      }
      return true;
    }
  }
  if (elain.pauseT == null) elain.pauseT = pauseGap(elain);
  if (elain.paused) {
    if ((elain.pauseT -= dt) <= 0) { elain.paused = false; elain.pauseT = pauseGap(elain); }
    elain.speed = 0;
    return true;
  }
  if ((elain.pauseT -= dt) <= 0) {
    elain.paused = true;
    elain.pauseT = 1 + 6 * (elain.damage || 0) * (0.5 + rnd(elain.rand || Math.random));
    elain.speed = 0;
    return true;
  }
  const kul = elain.haavaKuljettu || 0;
  const osa = elain.haavaMatka > 0 ? Math.min(1, kul / elain.haavaMatka) : 0;
  const hidastus = 1 - 0.78 * osa;
  const base = pieniLaji(laji) ? 6.2 : laji === 'peura' ? 9 : 7.4;
  elain.speed = base * hidastus * (1 - 0.75 * (elain.damage || 0));
  const away = uhka ? Math.atan2(elain.z - uhka.z, elain.x - uhka.x) : (elain.heading || 0);
  elain.heading = away + Math.sin(kul * 0.08) * 0.35;
  const px = elain.x, pz = elain.z;
  if (move) move(dt, elain.heading);
  elain.haavaKuljettu = kul + Math.hypot(elain.x - px, elain.z - pz);
  pudota(elain);
  if (elain.haavaKuljettu >= elain.haavaMatka) {
    elain.haavaMakuu = true;
    elain.speed = 0;
    elain.paused = false;
  }
  return true;
}
