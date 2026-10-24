// Kyläläiset muiden talojen pihoilla. Sama siemen (huone) antaa molemmille samat paikat.
// Jutut ovat paikallisia. Koppelontie 30:n piha ei ole mukana.
import { mulberry32 } from './rng.js';

export const JUTTELE_SADE = 2.4;

export const NIMET = {
  isanta: 'Maatilan isäntä',
  mummo: 'Mummo',
  naapuri: 'Naapuri',
  aija: 'Traktorin äijä'
};

export const REPLIIKIT = {
  isanta: [
    'Mää ammuin kerran jäniksen niin kaukaa et se ehti kuolla vanhuuteen',
    'Ota kuppi. Tää on jallovviinaa, seittemän tähtee, perhepakkkaus.',
    'Hattu lensi niin kauas et koira toi tilalle naapurin saappaan.',
    'Talo horjuu. Tai sit mää horjun. Sama asia, kahvi on jäässä.',
    'Vitara käynnistyy jos sille laulaa. Mää laulan, se ei käynnisty.',
    'Älä sano vaimolle et pullo on kahvia. Se maistaa.',
    'Koira ajoi jänistä eilen. Jänis ajoi koiraa tänään. Tasapeli.'
  ],
  mummo: [
    'Viattomia metsän eläimiä ei saa metsästää! Minä soitan poliisille!',
    'Ja Yleisradioon myös. Siellä kuunnellaan mummoja.',
    'Minä ruokkin jäniksiä porkkanoilla. Ne ovat ruokavieraita, ei saalista.',
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
      out.push({ id: out.length, laji: lajit[s], x: p.x, z: p.z, yaw: p.yaw, talo: t.i });
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
