// Koominen paikallislehti, kun metsästäjä osuu toiseen pelaajaan.
// Nimi, otsikot ja tuotenimet ovat keksittyjä. Kuvissa ei ole oikeita logoja.
import { pelletPattern, swarmHits } from './shot.js';
import { mulberry32 } from './rng.js';

export const LEHDEN_NIMI = 'Kollinmäen Sanomat';

export const OTSIKOT = [
  ['Kylähullu keksi jänikselle ansan – nälkä yllätti ja jäi itse porkkanaloukkuun', 'Ansa toimi niin kuin se oli piirretty. Syötti maistui keksijälle paremmin kuin jänikselle.'],
  ['Metsästäjä luuli metsäkaveria ihmisjänikseksi', 'Silminnäkijän mukaan kaveri loikki, mutta vastasi puhutteluun selvin sanoin.'],
  ['Kurikan mies ampui kaveriaan – koira nouti hatun', 'Hattu toimitettiin omistajalleen märkänä mutta ehjänä. Kaveri selvisi säikähdyksellä.'],
  ['Jänis nauroi ojassa koko illan', 'Nauru kuului Koppelontielle asti. Jahtiseurue ei antanut lausuntoa.'],
  ['Vitara jäi hankeen, radio soi vielä aamullakin', 'Kuski käveli saunalle. Radio jäi kanavalleen ja hoiti yövuoron yksin.'],
  ['Seura kokoontui: huomioliivit pakollisiksi myös saunassa', 'Päätös syntyi yksimielisesti sen jälkeen, kun kaveri oli jo hangessa.']
];

export const MAINOKSET = [
  { id: 'kola', teksti: '0,5 l Kolaa jauheena – piristevä ja hyvän hajuinen!' },
  { id: 'haulikko', teksti: 'Uusi haulikko ennakoi jäniksen hypyn!' },
  { id: 'jallovviina', teksti: 'Jallovviina 7 tähteä, perhepakkaus, muovipullo 1,5 l' },
  { id: 'liivi', teksti: 'Huomioliivi, joka näkyy myös kaverille – nyt -50 %' },
  { id: 'kauppa', teksti: 'Kollinmäen Kyläkauppa: makkaraa, patruunoita ja kahvia samasta hyllystä' },
  { id: 'pentu', teksti: 'Koiranpentu, joka haukkuu vain jäniksiä – ei naapurin akkaa' },
  { id: 'sauna', teksti: 'Tynnyrisaunan vuokraus, löylyt sisältyvät hintaan' }
];

function poimi(r, lista, n) {
  const a = lista.slice();
  const out = [];
  while (out.length < n && a.length) out.push(a.splice(Math.floor(r() * a.length), 1)[0]);
  return out;
}

export function lehti(seed, pisteet = 0) {
  const r = mulberry32(seed >>> 0);
  const o = OTSIKOT[Math.floor(r() * OTSIKOT.length)];
  const muut = OTSIKOT.filter(x => x[0] !== o[0]);
  const pikku = poimi(r, muut, 2 + Math.floor(r() * 2)).map(x => x[0]);
  const mainokset = poimi(r, MAINOKSET, 2 + Math.floor(r() * 2));
  return { nimi: LEHDEN_NIMI, otsikko: o[0], ingressi: o[1], pikku, mainokset, pisteet: pisteet | 0 };
}

// Rintakehä pallona. Kivääri kantaa pidemmälle kuin haulikon parvi.
export function osuuPelaajaan(o, dir, ase, seed, kohde, radius = 0.45) {
  if (!kohde) return false;
  const v = { x: kohde.x - o.x, y: kohde.y - o.y, z: kohde.z - o.z };
  const t = v.x * dir.x + v.y * dir.y + v.z * dir.z;
  const max = ase === 'kivaari' ? 400 : 60;
  if (t <= 1 || t > max) return false;
  if (ase === 'kivaari') return Math.hypot(v.x - dir.x * t, v.y - dir.y * t, v.z - dir.z * t) < radius;
  return swarmHits(o, dir, kohde, radius, pelletPattern(seed)).length > 0;
}

const esc = s => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export function lehtiHtml(l) {
  const mainokset = (l.mainokset || []).map(m => `<aside class="ks-mainos"><b>MAINOS</b><canvas class="ks-kuva" data-id="${esc(m.id)}" width="88" height="78"></canvas><span>${esc(m.teksti)}</span></aside>`).join('');
  const pikku = (l.pikku || []).map(p => `<li>${esc(p)}</li>`).join('');
  return `<article class="ks">
<header class="ks-head"><div class="ks-nimi">${esc(l.nimi)}</div><div class="ks-ala">Kollinmäki · Kurikka · ilmestyy kun kaveri kaatuu</div></header>
<h1>${esc(l.otsikko)}</h1>
<p class="ks-ing">${esc(l.ingressi)}</p>
<div class="ks-cols">
  <div class="ks-kuva-juttu" aria-hidden="true"><div class="ks-ukko ks-pysty"></div><div class="ks-ukko ks-kaatunut"></div><div class="ks-hanki"></div><p>Kuvassa kaveri ja hanki. Haukkua ei näy.</p></div>
  <div class="ks-mainokset">${mainokset}</div>
</div>
<section class="ks-pikk"><h2>Pikku-uutisia</h2><ul>${pikku}<li>Jahdin pisteet jäivät lukemaan ${l.pisteet | 0}. Toimitus ei suosittele uusintaa.</li></ul></section>
</article>`;
}

function pohja(g, w, h) {
  g.clearRect(0, 0, w, h);
  g.lineWidth = 2;
  g.lineJoin = 'round';
  g.strokeStyle = '#2a241c';
}

// Omat piirrokset: purkki, haulikko, suora muovipullo, liivi, puoti, pentu, tynnyri.
export function piirraMainos(canvas, id = '') {
  const g = canvas.getContext('2d'); if (!g) return;
  const w = canvas.width, h = canvas.height;
  pohja(g, w, h);
  if (id === 'jallovviina') return piirraPullo(canvas);
  if (id === 'kola') return piirraPurkki(g, w, h);
  if (id === 'haulikko') return piirraHaulikko(g);
  if (id === 'liivi') return piirraLiivi(g);
  if (id === 'kauppa') return piirraPuoti(g);
  if (id === 'pentu') return piirraPentu(g);
  if (id === 'sauna') return piirraTynnyri(g);
}

function piirraPurkki(g, w) {
  g.fillStyle = '#efe6d2';
  g.fillRect(28, 22, 32, 46);
  g.strokeRect(28, 22, 32, 46);
  g.fillStyle = '#8a5a2a';
  g.fillRect(26, 16, 36, 10);
  g.strokeRect(26, 16, 36, 10);
  g.fillStyle = '#6a3a16';
  g.font = 'bold 10px sans-serif';
  g.textAlign = 'center';
  g.fillText('Kolaa', w / 2, 44);
  g.font = '9px sans-serif';
  g.fillText('jauhe', w / 2, 56);
}

function piirraHaulikko(g) {
  g.strokeStyle = '#3a2a1c';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(10, 28); g.lineTo(74, 22);
  g.moveTo(10, 36); g.lineTo(62, 32);
  g.stroke();
  g.fillStyle = '#6b4423';
  g.fillRect(14, 30, 16, 18);
  g.strokeRect(14, 30, 16, 18);
}

function piirraLiivi(g) {
  g.fillStyle = '#ff7a00';
  g.beginPath();
  g.moveTo(30, 16); g.lineTo(58, 16); g.lineTo(66, 64); g.lineTo(22, 64); g.closePath();
  g.fill(); g.stroke();
  g.fillStyle = '#f4efe4';
  g.fillRect(38, 16, 12, 18);
  g.strokeRect(38, 16, 12, 18);
}

function piirraPuoti(g) {
  g.fillStyle = '#d8c4a0';
  g.fillRect(16, 28, 56, 38);
  g.strokeRect(16, 28, 56, 38);
  g.fillStyle = '#9d1c1c';
  g.fillRect(14, 18, 60, 12);
  g.strokeRect(14, 18, 60, 12);
  g.fillStyle = '#8ec6e8';
  g.fillRect(22, 36, 16, 12);
  g.fillRect(46, 36, 16, 12);
  g.strokeRect(22, 36, 16, 12);
  g.strokeRect(46, 36, 16, 12);
}

function piirraPentu(g) {
  g.fillStyle = '#c47a3a';
  g.beginPath();
  g.arc(44, 36, 16, 0, Math.PI * 2);
  g.fill(); g.stroke();
  g.beginPath();
  g.ellipse(28, 24, 6, 10, -0.4, 0, Math.PI * 2);
  g.ellipse(58, 24, 6, 10, 0.4, 0, Math.PI * 2);
  g.fill(); g.stroke();
  g.fillStyle = '#2a241c';
  g.beginPath();
  g.arc(38, 34, 2, 0, Math.PI * 2);
  g.arc(50, 34, 2, 0, Math.PI * 2);
  g.fill();
}

function piirraTynnyri(g) {
  g.fillStyle = '#8a5a32';
  g.beginPath();
  g.ellipse(44, 28, 26, 8, 0, 0, Math.PI * 2);
  g.fill(); g.stroke();
  g.fillRect(18, 28, 52, 28);
  g.strokeRect(18, 28, 52, 28);
  g.beginPath();
  g.ellipse(44, 56, 26, 8, 0, 0, Math.PI * 2);
  g.fill(); g.stroke();
  g.strokeStyle = '#5a3a20';
  g.beginPath();
  g.moveTo(18, 40); g.lineTo(70, 40);
  g.moveTo(18, 48); g.lineTo(70, 48);
  g.stroke();
}

// Suora muovipullo ja kierrekorkki. Ei oikean pullon muotoa eikä merkkiä.
export function piirraPullo(canvas) {
  const g = canvas.getContext('2d'); if (!g) return;
  const w = canvas.width;
  pohja(g, canvas.width, canvas.height);
  g.fillStyle = '#d8ecf4';
  g.beginPath();
  g.moveTo(34, 14); g.lineTo(54, 14); g.lineTo(56, 26); g.lineTo(64, 34);
  g.lineTo(64, 66); g.quadraticCurveTo(44, 74, 24, 66); g.lineTo(24, 34); g.lineTo(32, 26); g.closePath();
  g.fill(); g.stroke();
  g.fillStyle = '#f4efe4';
  g.fillRect(30, 36, 28, 20);
  g.strokeRect(30, 36, 28, 20);
  g.fillStyle = '#8a1e14';
  g.font = 'bold 9px sans-serif';
  g.textAlign = 'center';
  g.fillText('7', w / 2, 49);
}
