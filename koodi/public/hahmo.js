// Metsästäjän hahmo. Omat geometriat, ei ulkopuolista mallia.
// Mittasuhteet aikuisen miehen mukaan: pituus noin 1,80 m, silmät noin 1,65 m.
import * as THREE from 'three';

const GEO = {};
const geo = (k, fn) => GEO[k] || (GEO[k] = fn());
const MAT = {};
const mat = (hex, basic) => {
  const k = (basic ? 'b' : 'l') + hex;
  if (!MAT[k]) MAT[k] = basic
    ? new THREE.MeshBasicMaterial({ color: hex })
    : new THREE.MeshLambertMaterial({ color: hex, flatShading: true });
  return MAT[k];
};

function camoMap() {
  if (MAT.camo) return MAT.camo;
  const w = 32, h = 32, data = new Uint8Array(w * h * 4);
  const cols = [[90, 78, 48], [62, 74, 42], [46, 52, 36], [122, 100, 64], [36, 40, 30]];
  let s = 3;
  const rnd = () => { s = (Math.imul(s, 16807) + 11) >>> 0; return (s & 0xffffff) / 0x1000000; };
  for (let i = 0; i < w * h; i++) { const c = cols[i % 2]; const o = i * 4; data[o] = c[0]; data[o + 1] = c[1]; data[o + 2] = c[2]; data[o + 3] = 255; }
  for (let n = 0; n < 22; n++) {
    const c = cols[2 + (n % 3)], cx = (rnd() * w) | 0, cy = (rnd() * h) | 0, rx = 2 + rnd() * 6, ry = 2 + rnd() * 4;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = Math.min(Math.abs(x - cx), w - Math.abs(x - cx)), dy = Math.abs(y - cy);
      if ((dx / rx) ** 2 + (dy / ry) ** 2 < 1) { const o = (y * w + x) * 4; data[o] = c[0]; data[o + 1] = c[1]; data[o + 2] = c[2]; }
    }
  }
  const t = new THREE.DataTexture(data, w, h);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
  const m = new THREE.MeshLambertMaterial({ map: t, flatShading: true });
  MAT.camo = m;
  return m;
}

const cyl = (rt, rb, h, n = 7) => geo(`c${rt}_${rb}_${h}_${n}`, () => new THREE.CylinderGeometry(rt, rb, h, n));
const sph = (r, w, h) => geo(`s${r}_${w}_${h}`, () => new THREE.SphereGeometry(r, w, h));
const box = (w, h, d) => geo(`b${w}_${h}_${d}`, () => new THREE.BoxGeometry(w, h, d));

function put(parent, geometry, material, x, y, z, name) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  if (name) m.name = name;
  parent.add(m);
  return m;
}
function pivot(parent, x, y, z, name) {
  const o = new THREE.Object3D();
  o.position.set(x, y, z);
  if (name) o.name = name;
  parent.add(o);
  return o;
}

function ase(parent) {
  const g = new THREE.Group();
  g.name = 'ase';
  parent.add(g);
  const puu = mat(0x5a3a22), tera = mat(0x2a2e32), piippu = mat(0x1c1e22);
  const haulikko = new THREE.Group();
  haulikko.name = 'haulikko';
  put(haulikko, box(0.045, 0.07, 0.28), puu, 0, 0, 0.1);
  put(haulikko, cyl(0.012, 0.012, 0.62, 6), piippu, 0.012, 0.03, -0.28).rotation.x = Math.PI / 2;
  put(haulikko, cyl(0.012, 0.012, 0.62, 6), piippu, -0.012, 0.03, -0.28).rotation.x = Math.PI / 2;
  g.add(haulikko);
  const kivaari = new THREE.Group();
  kivaari.name = 'kivaari';
  put(kivaari, box(0.04, 0.07, 0.32), puu, 0, -0.01, 0.12);
  put(kivaari, cyl(0.01, 0.01, 0.78, 6), tera, 0, 0.02, -0.32).rotation.x = Math.PI / 2;
  put(kivaari, cyl(0.016, 0.016, 0.16, 6), mat(0x111418), 0, 0.055, -0.05).rotation.x = Math.PI / 2;
  g.add(kivaari);
  return { g, haulikko, kivaari };
}

function rakenna() {
  const g = new THREE.Group();
  g.name = 'metsastaja';
  const iho = mat(0xd2a07a), poski = mat(0xc4846a), housu = mat(0x2c3228), saapas = mat(0x1a1c1a), pohja = mat(0x101210);
  const liivi = mat(0xff7a00), heijaste = mat(0xe8f0f0, true), lakki = mat(0xff5c00), lippa = mat(0xc24100);
  const hanska = mat(0x4a3424), kalvosin = mat(0xff6a00), ruskea = mat(0x6b4a2c);
  const camo = camoMap();

  const lantio = pivot(g, 0, 1.0, 0, 'lantio');
  const vartalo = pivot(lantio, 0, 0.02, 0, 'vartalo');
  const takki = put(vartalo, cyl(0.2, 0.15, 0.46, 8), ruskea, 0, 0.28, 0, 'takki');
  put(vartalo, box(0.34, 0.4, 0.05), liivi, 0, 0.3, 0.11, 'liivi');
  put(vartalo, box(0.13, 0.36, 0.05), liivi, -0.09, 0.3, -0.12);
  put(vartalo, box(0.13, 0.36, 0.05), liivi, 0.09, 0.3, -0.12);
  put(vartalo, box(0.36, 0.035, 0.2), heijaste, 0, 0.22, 0);
  put(vartalo, box(0.36, 0.035, 0.2), heijaste, 0, 0.4, 0);
  const huppu = put(vartalo, sph(0.11, 8, 6), ruskea, 0, 0.48, 0.1, 'huppu');
  huppu.scale.set(1.1, 0.7, 0.8);

  put(vartalo, cyl(0.055, 0.06, 0.1, 8), iho, 0, 0.56, 0, 'kaula');
  const paaP = pivot(vartalo, 0, 0.64, 0, 'paa');
  const paa = put(paaP, sph(0.112, 16, 12), iho, 0, 0.02, 0);
  paa.scale.set(1.02, 1.22, 0.96);
  put(paaP, sph(0.075, 10, 8), iho, 0, -0.055, 0.015, 'leuka').scale.set(1.05, 0.72, 0.92);
  put(paaP, sph(0.032, 8, 6), poski, 0, -0.005, -0.1, 'nena').scale.set(0.75, 1.25, 1.35);
  put(paaP, box(0.1, 0.02, 0.025), mat(0x3a241c), 0, 0.055, -0.09);
  put(paaP, box(0.05, 0.01, 0.012), mat(0x6a3a38), 0, -0.05, -0.1);
  for (const [nx, nimi] of [[-0.038, 'silma_v'], [0.038, 'silma_o']]) {
    put(paaP, sph(0.02, 8, 6), mat(0xf4f1ea), nx, 0.015, -0.1, nimi);
    put(paaP, sph(0.01, 6, 5), mat(0x241810), nx, 0.015, -0.116);
  }
  put(paaP, sph(0.032, 8, 6), iho, -0.108, -0.005, 0, 'korva_v').scale.set(0.4, 1.05, 0.72);
  put(paaP, sph(0.032, 8, 6), iho, 0.108, -0.005, 0, 'korva_o').scale.set(0.4, 1.05, 0.72);

  const lakkiLippa = new THREE.Group();
  lakkiLippa.name = 'lakki_lippa';
  paaP.add(lakkiLippa);
  put(lakkiLippa, sph(0.122, 12, 8), lakki, 0, 0.085, 0.01).scale.set(1.06, 0.62, 1.05);
  put(lakkiLippa, box(0.15, 0.012, 0.09), lippa, 0, 0.045, -0.13, 'lakki');
  const lakkiKorva = new THREE.Group();
  lakkiKorva.name = 'lakki_korva';
  paaP.add(lakkiKorva);
  put(lakkiKorva, sph(0.128, 10, 8), lakki, 0, 0.06, 0).scale.set(1.08, 0.78, 1.08);
  put(lakkiKorva, box(0.05, 0.1, 0.04), lakki, -0.12, -0.04, 0);
  put(lakkiKorva, box(0.05, 0.1, 0.04), lakki, 0.12, -0.04, 0);
  put(lakkiKorva, box(0.16, 0.04, 0.04), lakki, 0, -0.08, 0.08);

  const käsi = (x, nimi) => {
    const olka = pivot(vartalo, x, 0.46, 0, 'olka_' + nimi);
    put(olka, cyl(0.055, 0.048, 0.3, 6), ruskea, 0, -0.15, 0, 'hiha_' + nimi);
    const kn = pivot(olka, 0, -0.3, 0, 'kynar_' + nimi);
    put(kn, cyl(0.046, 0.04, 0.26, 6), ruskea, 0, -0.13, 0);
    const ranne = pivot(kn, 0, -0.26, 0, 'ranne_' + nimi);
    const kasi = new THREE.Group();
    kasi.name = 'hanska_' + nimi;
    ranne.add(kasi);
    const kammen = put(kasi, sph(0.042, 8, 6), hanska, 0, -0.02, -0.02);
    kammen.scale.set(1.15, 0.65, 1.25);
    const sormi = put(kasi, sph(0.032, 8, 6), hanska, 0, -0.01, -0.07);
    sormi.scale.set(0.95, 0.55, 1);
    put(kasi, sph(0.02, 6, 5), hanska, x > 0 ? -0.04 : 0.04, -0.005, -0.02).scale.set(0.7, 0.6, 1.1);
    put(kasi, cyl(0.046, 0.05, 0.028, 8), kalvosin, 0, 0.02, 0);
    return { olka, kn };
  };
  const vas = käsi(-0.24, 'v');
  const oik = käsi(0.24, 'o');

  const jalka = (x, nimi) => {
    const reisi = pivot(lantio, x, 0, 0, 'reisi_' + nimi);
    put(reisi, cyl(0.075, 0.06, 0.46, 6), housu, 0, -0.23, 0);
    const polvi = pivot(reisi, 0, -0.46, 0, 'polvi_' + nimi);
    put(polvi, sph(0.055, 6, 5), housu, 0, 0, 0);
    const saari = pivot(polvi, 0, 0, 0, 'saari_' + nimi);
    put(saari, cyl(0.055, 0.045, 0.4, 6), housu, 0, -0.16, 0);
    const nilkka = pivot(saari, 0, -0.4, 0, 'nilkka_' + nimi);
    put(nilkka, cyl(0.07, 0.055, 0.32, 7), saapas, 0, -0.02, -0.02, 'saapas_' + nimi);
    put(nilkka, cyl(0.078, 0.078, 0.04, 7), mat(0x2a2e2a), 0, 0.1, -0.01);
    put(nilkka, box(0.1, 0.06, 0.16), saapas, 0, -0.1, -0.08);
    put(nilkka, box(0.1, 0.03, 0.2), pohja, 0, -0.14, -0.06, 'pohja_' + nimi);
    return { reisi, saari };
  };
  const jv = jalka(-0.11, 'v');
  const jo = jalka(0.11, 'o');
  const aseO = ase(vartalo);

  const takit = [];
  g.traverse(o => { if (o.isMesh && (o.name === 'takki' || o.name === 'huppu' || o.name.startsWith('hiha_'))) takit.push(o); });
  return { g, lantio, vartalo, paa: paaP, takit, lakkiLippa, lakkiKorva, ruskea, camo, vas, oik, jv, jo, ase: aseO };
}

function asetaAsu(h, variant) {
  const camo = variant % 2 === 1;
  for (const m of h.takit) m.material = camo ? h.camo : h.ruskea;
  h.lakkiLippa.visible = !camo;
  h.lakkiKorva.visible = camo;
  h.ase.haulikko.visible = !camo;
  h.ase.kivaari.visible = camo;
  h.st.variant = variant;
  h.st.ase = camo ? 'k' : 'h';
}

function damp(cur, tgt, dt, k) {
  return cur + (tgt - cur) * Math.min(1, dt * k);
}

function pose(h, dt, inp) {
  const st = h.st;
  if (inp.sit != null) st.wantSit = !!inp.sit;
  if (inp.crouch != null) st.wantCrouch = !!inp.crouch;
  if (inp.aim != null) st.wantAim = !!inp.aim;
  if (inp.ase === 'k' || inp.ase === 'kivaari') st.ase = 'k';
  else if (inp.ase === 'h' || inp.ase === 'haulikko') st.ase = 'h';
  const sitT = st.wantSit ? 1 : 0;
  st.sit = damp(st.sit, sitT, dt, sitT > st.sit ? 3.2 : 6);
  st.crouch = damp(st.crouch, !st.wantSit && st.wantCrouch ? 1 : 0, dt, 8);
  st.aim = damp(st.aim, !st.wantSit && st.wantAim ? 1 : 0, dt, 7);
  st.t += dt;
  const spd = Math.max(0, inp.spd || 0);
  const moving = spd > 0.25 && st.sit < 0.2;
  const run = moving && spd > 2.4 && st.crouch < 0.4;
  if (moving) st.ph += dt * (run ? 8.4 : st.crouch > 0.5 ? 5.2 : 6.3);
  const swing = moving ? Math.min(1, spd / (run ? 3.2 : 1.5)) * (st.crouch > 0.5 ? 0.55 : 1) : 0;
  const s = Math.sin(st.ph);
  const cr = st.crouch, si = st.sit, ai = st.aim;

  st.enter = si > 0.02 && si < 0.72 ? Math.sin((si / 0.72) * Math.PI) : 0;
  h.lantio.position.y = 1 + (0.5 - 1) * cr * (1 - si) + (0.12 - 1) * si + Math.abs(s) * 0.02 * swing * (1 - si);
  h.lantio.rotation.y = s * 0.07 * swing * (1 - si);
  h.vartalo.rotation.x = 0.22 * cr + 0.12 * (run ? 1 : 0) * (1 - ai) + 0.16 * si - 0.06 * ai;
  h.vartalo.rotation.y = -s * 0.08 * swing;
  h.vartalo.position.y = 0.02 + Math.sin(st.t * 1.7) * 0.006;

  const askel = 0.7 * swing;
  h.jv.reisi.rotation.x = s * askel + 1.35 * cr + 1.68 * si + 0.15 * st.enter;
  h.jo.reisi.rotation.x = -s * askel + 1.35 * cr + 1.68 * si + 0.9 * st.enter;
  h.jv.saari.rotation.x = Math.max(0, -s) * 1.15 * swing - 2.35 * cr - 1.24 * si - 0.25 * st.enter;
  h.jo.saari.rotation.x = Math.max(0, s) * 1.15 * swing - 2.35 * cr - 1.24 * si - 1.15 * st.enter;

  const kävelyKäsi = (1 - ai) * (1 - si);
  h.vas.olka.rotation.x = 0.12 + s * 0.45 * swing * kävelyKäsi + 0.95 * ai + 0.85 * si + 0.45 * cr;
  h.oik.olka.rotation.x = 0.2 - s * 0.35 * swing * kävelyKäsi + 0.72 * ai + 0.7 * si + 0.25 * cr;
  h.vas.olka.rotation.z = 0.18 + 0.25 * ai;
  h.oik.olka.rotation.z = -0.22 - 0.12 * ai + 0.35 * (1 - ai) * (1 - si);
  h.vas.kn.rotation.x = 0.25 + Math.max(0, s) * 0.35 * swing * kävelyKäsi + 0.55 * ai + 0.85 * si;
  h.oik.kn.rotation.x = 0.4 + Math.max(0, -s) * 0.25 * swing * kävelyKäsi + 0.85 * ai + 0.95 * si;
  h.oik.olka.rotation.y = 0.35 * (1 - ai);

  h.paa.rotation.x = 0.12 * ai + 0.18 * cr + Math.sin(st.t * 0.6) * 0.03 * (moving ? 0 : 1);
  h.paa.rotation.y = Math.sin(st.t * 0.45) * 0.12 * (moving ? 0 : 1);

  const gun = h.ase.g;
  gun.position.set(0.2 * (1 - ai) + 0.1 * ai, 0.28 * (1 - ai) + 0.38 * ai, 0.08 * (1 - ai) - 0.22 * ai);
  gun.rotation.set(2.35 * (1 - ai) + 0.04 * ai, -0.15 * (1 - ai), 0.45 * (1 - ai));
  h.ase.haulikko.visible = st.ase !== 'k';
  h.ase.kivaari.visible = st.ase === 'k';
}

export function makeHunter(variant = 0) {
  const h = rakenna();
  const st = { sit: 0, crouch: 0, aim: 0, wantSit: false, wantCrouch: false, wantAim: false, ph: 0, t: 0, enter: 0, variant: 0, ase: 'h' };
  h.st = st;
  const g = h.g;
  g.userData.sit = (on, crouch) => { st.wantSit = !!on; st.wantCrouch = !!crouch && !on; };
  g.userData.asu = v => asetaAsu(h, v | 0);
  g.userData.tick = (dt, inp = {}) => pose(h, dt, inp || {});
  g.userData.asu(variant | 0);
  g.userData.tick(0, {});
  return g;
}

// Ensimmäisen persoonan talvihanska aseen käsinodessa. Vanha kangasblokki piilotetaan.
export function asetaHanskat(root) {
  if (!root) return;
  const piiput = root.getObjectByName ? root.getObjectByName('piiput') : null;
  const kasit = [];
  root.traverse(o => { if (o.isMesh && (o.name === 'kasi_oikea' || o.name === 'kasi_vasen')) kasit.push(o); });
  for (const o of kasit) {
    o.geometry.computeBoundingBox();
    const bb = o.geometry.boundingBox;
    if (!bb) continue;
    const c = bb.getCenter(new THREE.Vector3());
    const oikea = o.name === 'kasi_oikea';
    const g = new THREE.Group();
    g.name = oikea ? 'fp_hanska_o' : 'fp_hanska_v';
    const villa = mat(0x5c4030), oranssi = mat(0xff6a00), hiha = mat(0x6b4a2c);
    const kammen = put(g, sph(0.048, 10, 8), villa, 0, 0, 0);
    kammen.scale.set(1.05, 0.62, 1.25);
    const sormi = put(g, sph(0.036, 8, 6), villa, 0, 0.008, oikea ? 0.055 : -0.055);
    sormi.scale.set(0.85, 0.55, 1.05);
    put(g, sph(0.02, 6, 5), villa, oikea ? 0.045 : -0.045, 0.01, 0.01).scale.set(0.65, 0.6, 1.15);
    put(g, cyl(0.05, 0.055, 0.032, 8), oranssi, 0, -0.005, oikea ? -0.045 : 0.045);
    const sleeve = put(g, cyl(0.042, 0.05, 0.18, 8), hiha, 0, -0.01, oikea ? -0.14 : 0.14);
    sleeve.rotation.x = Math.PI / 2;
    g.traverse(m => { if (m.isMesh) m.frustumCulled = false; });
    const host = !oikea && piiput ? piiput : o.parent;
    if (host === piiput) g.position.copy(c).sub(piiput.position);
    else g.position.copy(c);
    host.add(g);
    o.visible = false;
  }
}
