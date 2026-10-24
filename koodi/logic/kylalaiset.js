// Kyläläiset muiden talojen pihoilla. Sama siemen (huone) antaa molemmille samat paikat.
// Jutut ovat paikallisia. Koppelontie 30:n piha ei ole mukana.
// Liike pysyy talon pihasäteellä eikä seuraa pelaajaa. Reitti kiertää rakennukset samalla tarkistuksella kuin koira.
import { mulberry32 } from './rng.js';
import { askelEstetty, dogInside } from './dog.js';

export const JUTTELE_SADE = 2.4;
// Pihapiiri on kiekko talon keskipisteen ympärillä.
export const PIHA_SADE = 16;
export const HUUTO_SADE = 8;
export const HUUTO_TAUKO = 20;

export const NIMET = {
  isanta: 'Maatilan isäntä',
  mummo: 'Mummo',
  naapuri: 'Naapuri',
  aija: 'Traktorin äijä'
};

export const REPLIIKIT = {
  isanta: [
    'Mää ammuin kerran jäniksen niin kaukaa et se ehti kuolla vanhuuteen',
    'Ota kuppi. Tää on jalloviinaa, seittemän tähtee, perhepakkaus.',
    'Hattu lensi niin kauas et koira toi tilalle naapurin saappaan.',
    'Talo horjuu. Tai sit mää horjun. Sama asia, kahvi on jäässä.',
    'Vitara käynnistyy jos sille laulaa. Mää laulan, se ei käynnisty.',
    'Älä sano vaimolle et pullo on kahvia. Se maistaa.',
    'Koira ajoi jänistä eilen. Jänis ajoi koiraa tänään. Tasapeli.'
  ],
  mummo: [
    'Viattomia metsän eläimiä ei saa metsästää! Minä soitan poliisille!',
    'Ja Yleisradioon myös. Siellä kuunnellaan mummoja.',
    'Minä ruokkin jäniksiä porkkanoilla. Ne ovat ruokavieraita, eivät saalista.',
    'Keppi heiluu, jos tähtäätte pihalleni. Korvat matalaksi.',
    'Kirjoitin yleisönosastoon. Otsikko oli: jättäkää puput rauhaan.',
    'Koira saa tulla, jos se ei hauku porkkanoilleni.',
    'Saunassa saa laulaa. Metsässä ei saa paukutella.'
  ],
  mummoRaivo: [
    'Sinä kannat jänistä! Se oli mun ruokavieras!',
    'Laita se heti maahan! Porkkana odottaa vielä!',
    'Poliisi, Yleisradio ja kyläkauppa saavat kuulla tästä!',
    'Keppi on valmis. Korvasi myös.',
    'Se söi aamuporkkanan minun kädestä. Nyt se roikkuu sinun kädessä.',
    'Häpeä! Jänikset muistavat, ja minä muistan paremmin.',
    'Soitan heti. Numero on jo valmiina villatakissa.'
  ],
  naapuri: [
    'Älä sano että minä sanoin, mutta isännän pullo ei ole kahvia.',
    'Mummo vie porkkanoita metsään joka aamu. Jänikset jonottavat.',
    'Traktorin äijältä katosi mutteri. Se etsii sitä vuodesta kaksituhattakahdeksan.',
    'Saunan savu näkyi eilen. Joku lopetti jahdin kesken kehumisen.',
    'Koira toi saappaan. Saapas oli mun. Älä sano että minä sanoin.',
    'Vitara kävi pihassa kahdesti. Kuski tervehti itseään.',
    'Kuulin että joku ampui niin kaukaa että jänis ehti vanheta. Isäntä kertoi sen itse.'
  ],
  aija: [
    'Mutteri on ollut löysällä siitä asti kun radio keksittiin.',
    'Traktori käynnistyy jos sitä pyytää nätisti ja potkaisee.',
    'Älä ammu tännepäin. Tää on varaosa, ei jänis.',
    'Isäntä toi pullon, ei kiintoavainta. Pullo ei käy kierteeseen.',
    'Yksi pyörä pyörii. Kolme miettii vielä.',
    'Jarrut toimii, jos muistaa että niitä ei ole.',
    'Korjaan tämän ennen juhannusta. En sano minkä vuoden.'
  ]
};

// Lyhyet ohikulkuhuudot. Eivät ole E-keskustelun repliikkejä.
export const OHIKULKU = {
  isanta: [
    'Hoi, kuka siellä horjuu, sinä vai mä?',
    'Tule tänne, mulla on teoria jäniksistä.',
    'Pullo on puolillaan. Tai mä oon.',
    'Älä kerro vaimolle että näit mut.',
    'Metsä on iso. Minä oon isompi. Melkein.',
    'Kävely on yliarvostettua.',
    'Terve. Tai jotain sinnepäin.',
    'Jos näet hatun, se on mun. Tai ei.'
  ],
  mummo: [
    'Taas se murhaaja kulkee!',
    'Pidä piippu maassa, minä näen sen!',
    'Porkkanat on jo jaettu. Jänikset on syönyt.',
    'Älä hiivi. Minä kuulen lumen.',
    'Keppi on mukana. Muista se.',
    'Metsä ei ole sinun kauppasi.',
    'Terve. Se ei ollut lupa.',
    'Jos pupu tulee, väistä. Se asuu tässä.'
  ],
  naapuri: [
    'Minä näin sinut. Älä sano että minä näin.',
    'Kello käy. Juorukin käy.',
    'Pihasta näkee kaiken. Valitettavasti.',
    'Kävelet kuin sinulla olisi asiaa.',
    'Minä en kuunnellut. Minä vain kuulin.',
    'Terve. Tämä ei ole kutsu kahville.',
    'Aidan takaa näkee paremmin.',
    'Jos kysyt, minä en ollut täällä.'
  ],
  aija: [
    'Älä astu mutterin päälle. Se on jossain.',
    'Traktori kuulee sinut. Se ei välitä.',
    'Mä korjaan. Älä auta.',
    'Käsi on rasvassa. Tervehdys peruutettu.',
    'Jos se käynnistyy, se on vahinko.',
    'Seis siinä. Tai missä vaan, ei väliä.',
    'Pihassa on varaosia. Sinä et ole niistä.',
    'Öljy on tuoretta. Lumi ei.'
  ]
};

export const OHIKULKU_TILA = {
  isanta: {
    vitara: [
      'Hei, kyytiä, mennhään kylille!',
      'Seisauta se Vitara, mä mahdun takakonttiin!',
      'Aja hiljaa, pullo ei pysy sylissä!',
      'Ota mut kyytiin. Mä tiedän tien. Suurin piirtein.'
    ],
    ase: [
      'Älä osoita, mä oon jo kaatunu sisältä.',
      'Hieno pyssy. Mä ammuin kerran ohi lähempää.',
      'Piippu pois. Tää pullo ei ole jänis.'
    ],
    saalis: [
      'Saitko sinä sen? Mä väitin että mä sain.',
      'Näytä saalis. Mä kehun, jos se on iso.',
      'Kantoitko sen itse? Koira on rehellisempi.'
    ],
    koira: [
      'Koira! Se on parempi seura kuin mä. Älä kerro.',
      'Anna koiran tulla. Mulla on teoria sillekin.',
      'Haukku kuulostaa mun serkultani.'
    ]
  },
  mummo: {
    vitara: [
      'Aja hitaammin, puput on tiellä!',
      'Älä pölytä pihaani sillä autolla!',
      'Vitara ei ole lupa metsästää.'
    ],
    ase: [
      'Älä osoita sillä minua!',
      'Piippu alas, tai soitan poliisille jo pihasta!',
      'Se pyssy näkyy. Jäniksetkin näkee.'
    ],
    saalis: [
      'Mitä sinä kannat? Minä en halua tietää!',
      'Saalis tuoksuu. Häpeä tuoksuu samalta.',
      'Jos se on jänis, käänny ympäri.'
    ],
    koira: [
      'Koira saa tulla. Sinä et.',
      'Pidä koira kaukana porkkanoista!',
      'Haukahdus kuuluu. Minä kuulen sen.'
    ]
  },
  naapuri: {
    vitara: [
      'Vitara! Minä kerron minne se meni. Myöhemmin.',
      'Aja ohi. Minä ehdin lukea rekisterin.',
      'Kaasujalka kuuluu naapuriin asti.'
    ],
    ase: [
      'Ase esillä. Minä panen tämän muistiin.',
      'Älä osoita tänne. Minä en ole uutinen. Vielä.',
      'Piippu näkyy. Mummo näkee sen myös.'
    ],
    saalis: [
      'Saalista? Minä en kysy. Minä arvaan.',
      'Kannat jotain. Kylä tietää jo.',
      'Älä näytä sitä mummolle. Liian myöhäistä.'
    ],
    koira: [
      'Koira tuli ensin. Sinä perässä. Tyypillistä.',
      'Haukahdus tallentui. Minä toistan sen myöhemmin.',
      'Koira ei juoruile. Sinä juoruilet kävelemällä.'
    ]
  },
  aija: {
    vitara: [
      'Vitara menee ohi. Traktori miettii vielä.',
      'Hieno auto. Tässä on hienompi, kun se käy.',
      'Aja ympäri. Mä kuuntelen koneesta vian.'
    ],
    ase: [
      'Älä ammu traktoria. Se on jo haavoittunut.',
      'Piippu pois päin jakohihnasta.',
      'Pyssy ei käy kiintoavaimeksi. Mä kokeilin.'
    ],
    saalis: [
      'Sait saalista. Mä sain ruosteen.',
      'Jänis ei korjaa tätä. Älä tarjoa.',
      'Kanna se ohi. Mulla on kädet täynnä.'
    ],
    koira: [
      'Koira saa nuuskia. Ei jakoavainta.',
      'Haukku ei käynnistä tätä.',
      'Koira on parempi apulainen. Se ei neuvo.'
    ]
  }
};

// Oma otsikko Kollinmäen Sanomiin. Ei kuulu kaveriosuman suruotsikoihin.
export const KYLA_OTSIKOT = {
  isanta: ['Humalainen isäntä ammuttiin – pullo jäi pystyyn', 'Pullo seisoi hangessa suorassa. Isäntä ei. Kylä piti sitä tasapelinä.'],
  mummo: ['Mummo ammuttiin – jänikset juhlivat', 'Porkkanat jäivät jakamatta. Jänikset järjestivät hiljaisen juhlan ojanpenkalla.'],
  naapuri: ['Juorukello vaikeni keskelle lausetta', 'Lause jäi kesken. Kylä täydensi sen itse, kolmella eri tavalla.'],
  aija: ['Traktorin korjaaja kaatui – mutteri jäi käteen', 'Mutteri oli viimein löytynyt. Traktori ei huomannut eroa.']
};

function inPoly(x, z, P) {
  let c = false;
  const n = P.length > 1 && P[0][0] === P[P.length - 1][0] && P[0][1] === P[P.length - 1][1] ? P.length - 1 : P.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = P[i][0], zi = P[i][1], xj = P[j][0], zj = P[j][1];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c;
  }
  return c;
}

function talo(P, i, yard) {
  const n = P.length > 1 && P[0][0] === P[P.length - 1][0] && P[0][1] === P[P.length - 1][1] ? P.length - 1 : P.length;
  let x = 0, z = 0, a = 0;
  for (let i2 = 0; i2 < n; i2++) {
    const j = (i2 + 1) % n;
    x += P[i2][0]; z += P[i2][1];
    a += P[i2][0] * P[j][1] - P[j][0] * P[i2][1];
  }
  x /= n; z /= n;
  const d = Math.hypot(x - (yard?.x || 0), z - (yard?.z || 0));
  return { i, P, x, z, area: Math.abs(a) / 2, d };
}

function ulos(t, ang, extra) {
  const dx = Math.sin(ang), dz = Math.cos(ang);
  let sisalla = false;
  for (let s = 0.5; s <= 46; s += 0.7) {
    const x = t.x + dx * s, z = t.z + dz * s;
    if (inPoly(x, z, t.P)) { sisalla = true; continue; }
    if (!sisalla) continue;
    const px = t.x + dx * (s + extra), pz = t.z + dz * (s + extra);
    if (inPoly(px, pz, t.P)) continue;
    // Hahmo katsoo paikallisessa −z:ssa. Maailmassa katse on (−sin yaw, −cos yaw), eli pihasta ulospäin.
    return { x: px, z: pz, yaw: Math.atan2(-dx, -dz) };
  }
  return null;
}

function etsi(t, slot, nSlots, rand, sopii, existing) {
  const base = rand() * Math.PI * 2;
  const bias = nSlots > 1 ? (slot - (nSlots - 1) / 2) * 1.2 : 0;
  let varalla = null;
  for (let ring = 0; ring < 3; ring++) {
    const extra = 2.1 + ring * 0.7;
    for (let k = 0; k < 12; k++) {
      const p = ulos(t, base + bias + k * (Math.PI * 2 / 12) + ring * 0.13, extra);
      if (!p) continue;
      if (existing.some(e => Math.hypot(e.x - p.x, e.z - p.z) < 2.2)) continue;
      if (sopii(p.x, p.z)) return p;
      varalla = varalla || p;
    }
  }
  return varalla;
}

// Yksi hahmo pientä taloa kohti, kaksi jos pinta-ala on yli 130 m². Isäntä ja mummo lähimpiin.
export function sijoitaKylalaiset(buildings, seed, yard = { x: 0, z: 0, r: 0 }, sopii = () => true) {
  const rand = mulberry32(seed >>> 0);
  const raja = (yard?.r || 0) + 8;
  const talot = buildings.map((P, i) => talo(P, i, yard)).filter(t => t.d > raja).sort((a, b) => a.d - b.d || a.i - b.i);
  const out = [];
  let vuoro = 0;
  const comic = () => (vuoro++ % 2 === 0 ? 'naapuri' : 'aija');
  for (let ti = 0; ti < talot.length; ti++) {
    const t = talot[ti];
    const n = t.area > 130 ? 2 : 1;
    const lajit = [];
    if (ti === 0) lajit.push('isanta');
    else if (ti === 1) lajit.push('mummo');
    else lajit.push(comic());
    if (n === 2) lajit.push(comic());
    for (let s = 0; s < lajit.length; s++) {
      const p = etsi(t, s, n, rand, sopii, out);
      if (!p) continue;
      out.push({ id: out.length, laji: lajit[s], x: p.x, z: p.z, yaw: p.yaw, talo: t.i, cx: t.x, cz: t.z, piha: PIHA_SADE });
    }
  }
  return out;
}

export function seuraavaRepliikki(npc, raivo) {
  const pool = npc.laji === 'mummo' && raivo ? REPLIIKIT.mummoRaivo : (REPLIIKIT[npc.laji] || REPLIIKIT.naapuri);
  const i = ((npc.i ?? -1) + 1) % pool.length;
  npc.i = i;
  return pool[i];
}

// Tilanne, jos se on päällä. Vitara voittaa, sitten saalis, koira ja ase.
export function huudonTila(t) {
  if (t?.vitara) return 'vitara';
  if (t?.saalis) return 'saalis';
  if (t?.koira) return 'koira';
  if (t?.ase) return 'ase';
  return null;
}

function kelpaaPiste(x, z, npc, env) {
  if (Math.hypot(x - npc.cx, z - npc.cz) > npc.piha - 0.25) return false;
  if (dogInside(x, z)) return false;
  if (env.tie(x, z) <= 1.15) return false;
  if (env.metsa(x, z)) return false;
  return true;
}

function janaKelpaa(a, b, npc, env) {
  if (askelEstetty(a.x, a.z, b.x, b.z)) return false;
  const d = Math.hypot(b.x - a.x, b.z - a.z);
  const n = Math.max(1, Math.ceil(d / 0.45));
  for (let i = 0; i <= n; i++) {
    const x = a.x + (b.x - a.x) * i / n, z = a.z + (b.z - a.z) * i / n;
    if (!kelpaaPiste(x, z, npc, env)) return false;
  }
  return true;
}

// Jos suora leikkaa talon nurkan, kokeile pistettä kauempana keskipisteestä. Sama este kuin koiralla.
function kulku(a, b, npc, env) {
  if (janaKelpaa(a, b, npc, env)) return [b];
  const mx = (a.x + b.x) / 2 - npc.cx, mz = (a.z + b.z) / 2 - npc.cz;
  const L = Math.hypot(mx, mz) || 1;
  for (const lisa of [3.5, 6.5, 9]) {
    const r = Math.min(npc.piha - 0.4, L + lisa);
    const m = { x: npc.cx + (mx / L) * r, z: npc.cz + (mz / L) * r };
    if (Math.hypot(m.x - a.x, m.z - a.z) < 1.2) continue;
    if (janaKelpaa(a, m, npc, env) && janaKelpaa(m, b, npc, env)) return [m, b];
  }
  return null;
}

function ulkoPiste(P, cx, cz, ang, npc, env) {
  const dx = Math.sin(ang), dz = Math.cos(ang);
  let seinä = inPoly(cx, cz, P) ? 0 : null;
  for (let s = 0.4; s <= npc.piha; s += 0.4) {
    const x = cx + dx * s, z = cz + dz * s;
    if (inPoly(x, z, P) || dogInside(x, z)) { seinä = s; continue; }
    if (seinä == null) continue;
    const e = s - seinä;
    if (e < 2.2 || e > 8) continue;
    if (kelpaaPiste(x, z, npc, env)) return { x, z };
  }
  return null;
}

function aikajana(pts, nopeus, rand, yaw0) {
  if (pts.length < 2) {
    const p = pts[0];
    return { pisteet: pts, osat: [{ x0: p.x, z0: p.z, x1: p.x, z1: p.z, dt: 8, spd: 0, yaw: yaw0 }], kesto: 8 };
  }
  const jarj = [];
  for (let i = 0; i < pts.length; i++) jarj.push(i);
  for (let i = pts.length - 2; i >= 0; i--) jarj.push(i);
  const osat = [];
  for (let i = 0; i < jarj.length - 1; i++) {
    const a = pts[jarj[i]], b = pts[jarj[i + 1]];
    const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
    if (d < 0.05) continue;
    const yaw = Math.atan2(-dx, -dz);
    osat.push({ x0: a.x, z0: a.z, x1: b.x, z1: b.z, dt: d / nopeus, spd: nopeus, yaw });
    osat.push({ x0: b.x, z0: b.z, x1: b.x, z1: b.z, dt: 4 + rand() * 6, spd: 0, yaw });
  }
  const kesto = osat.reduce((s, o) => s + o.dt, 0) || 1;
  return { pisteet: pts, osat, kesto };
}

// Rauhallinen lenkki oman talon pihalla. Pelaajan paikka ei vaikuta. Sama npc antaa saman reitin.
export function teePihaReitti(npc, poly, env) {
  const rand = mulberry32((Math.imul(npc.id + 1, 0x9e3779b1) ^ Math.imul((npc.talo | 0) + 1, 0x85ebca6b)) >>> 0);
  const alku = { x: npc.x, z: npc.z };
  const ehdokkaat = [];
  const phase = rand() * Math.PI * 2;
  const lisaa = p => {
    if (!p || !kelpaaPiste(p.x, p.z, npc, env)) return;
    if (Math.hypot(p.x - alku.x, p.z - alku.z) < 2) return;
    if (ehdokkaat.some(q => Math.hypot(q.x - p.x, q.z - p.z) < 2)) return;
    ehdokkaat.push(p);
  };
  for (let i = 0; i < 12; i++) lisaa(ulkoPiste(poly, npc.cx, npc.cz, phase + i * (Math.PI * 2 / 12), npc, env));
  for (let k = 0; k < 14; k++) {
    const ang = rand() * Math.PI * 2, rad = 4 + rand() * (npc.piha - 6);
    lisaa({ x: npc.cx + Math.cos(ang) * rad, z: npc.cz + Math.sin(ang) * rad });
  }
  const ketju = [alku];
  const kaytetty = new Set();
  for (let guard = 0; guard < ehdokkaat.length; guard++) {
    let paras = null, bi = -1, bd = 1e9;
    const viime = ketju[ketju.length - 1];
    for (let i = 0; i < ehdokkaat.length; i++) {
      if (kaytetty.has(i)) continue;
      const p = ehdokkaat[i];
      const d = Math.hypot(p.x - viime.x, p.z - viime.z);
      if (d < 1.8 || d > 14) continue;
      const askel = kulku(viime, p, npc, env);
      if (!askel) continue;
      let kustannus = 0, ed = viime;
      for (const q of askel) { kustannus += Math.hypot(q.x - ed.x, q.z - ed.z); ed = q; }
      if (kustannus < bd) { bd = kustannus; paras = askel; bi = i; }
    }
    if (!paras) break;
    kaytetty.add(bi);
    ketju.push(...paras);
  }
  const nopeus = npc.laji === 'mummo' ? 0.36 : npc.laji === 'isanta' ? 0.46 : npc.laji === 'aija' ? 0.4 : 0.52;
  return aikajana(ketju, nopeus, rand, npc.yaw || 0);
}

// Paikka kellonajan mukaan. Sama aika molemmilla asiakkailla, ei pelaajan perässä.
export function pihaKohta(reitti, t) {
  const osat = reitti.osat;
  let u = ((t % reitti.kesto) + reitti.kesto) % reitti.kesto;
  for (let i = 0; i < osat.length; i++) {
    const s = osat[i];
    if (u > s.dt && i < osat.length - 1) { u -= s.dt; continue; }
    const k = s.dt > 1e-6 ? Math.max(0, Math.min(1, u / s.dt)) : 0;
    return { x: s.x0 + (s.x1 - s.x0) * k, z: s.z0 + (s.z1 - s.z0) * k, yaw: s.yaw, spd: s.spd };
  }
  const s = osat[0];
  return { x: s.x0, z: s.z0, yaw: s.yaw, spd: 0 };
}

export function seuraavaHuuto(npc, tila) {
  const erikois = tila && OHIKULKU_TILA[npc.laji]?.[tila];
  const pool = erikois?.length ? erikois : (OHIKULKU[npc.laji] || OHIKULKU.naapuri);
  const avain = erikois?.length ? 'hi_' + tila : 'hi_yleinen';
  let i = npc[avain] ?? -1;
  let line = pool[0];
  for (let n = 0; n < pool.length; n++) {
    i = (i + 1) % pool.length;
    if (pool[i] !== npc.viimeHuuto) { line = pool[i]; break; }
  }
  npc[avain] = i;
  npc.viimeHuuto = line;
  return line;
}
