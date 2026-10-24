// Koominen paikallislehti, kun metsästäjä osuu toiseen pelaajaan.
// Nimi, otsikot ja tuotenimet ovat keksittyjä. Kuvissa ei ole oikeita logoja.
import { pelletPattern, swarmHits } from './shot.js';
import { mulberry32 } from './rng.js';

export const LEHDEN_NIMI = 'Kollinmäen Sanomat';

// Pöydän lehti: hauskoja uutisia. Lopetuslehden surullinen pääotsikko ei ole tässä.
export const HAUSKAT = [
  ['Kylähullu keksi jänikselle ansan – nälkä yllätti ja jäi itse porkkanaloukkuun', 'Ansa toimi niin kuin se oli piirretty. Syötti maistui keksijälle paremmin kuin jänikselle.'],
  ['Jänis nauroi ojassa koko illan', 'Nauru kuului Koppelontielle asti. Jahtiseurue ei antanut lausuntoa.'],
  ['Vitara jäi hankeen, radio soi vielä aamullakin', 'Kuski käveli saunalle. Radio jäi kanavalleen ja hoiti yövuoron yksin.'],
  ['Seura kokoontui: huomioliivit pakollisiksi myös saunassa', 'Päätös oli yksimielinen. Löylyt eivät himmentäneet oranssia.'],
  ['Koira toi kotiin kumisaappaan ja odotti kehuja', 'Saapas oli ehjä. Omistaja löytyi seuraavana aamuna.'],
  ['Kollinmäen kahvipannu voitti jahtikisan', 'Pannu oli ajoissa paikalla. Jänis ei ollut.'],
  ['Oja oli syvempi kuin kartta väitti', 'Kartta pyysi anteeksi. Saapas ei.'],
  ['Naapuri lainasi huopikkaat ja sai ne takaisin märkinä', 'Huopikkaat kuivuivat kiukaan vieressä. Ystävyys myös.'],
  ['GPS neuvoi kiertämään navetan kahdesti', 'Toisella kierroksella kuski tervehti itseään.'],
  ['Makkara katosi hyllystä ennen patruunoita', 'Kyläkauppa epäilee koiraa. Koira ei kommentoi.']
];

// Lopetuslehden pääotsikko. Sävy on kömmähdys, ei vahinko.
export const SURUT = [
  ['Metsästäjä luuli metsäkaveria ihmisjänikseksi', 'Silminnäkijän mukaan kaveri loikki, mutta vastasi puhutteluun selvin sanoin.'],
  ['Kurikan mies ampui kaveriaan – koira nouti hatun', 'Hattu toimitettiin omistajalleen märkänä mutta ehjänä. Kaveri selvisi säikähdyksellä.'],
  ['Haulikko tunnisti oranssin liivin jäniksen korviksi', 'Liivi selvisi, ystävyys selvisi. Saalista ei kirjattu.'],
  ['Ampuja väittää tähdänneensä hankeen', 'Hanki ei vahvistanut tietoa. Kaveri vahvisti hankeen kaatumisen.']
];

export const OTSIKOT = HAUSKAT.concat(SURUT);

export const MUISTOT = [
  'Lähti jänistä, tuli jäniksenä',
  'Kaipaamaan jäivät koira ja puolikas jallupullo',
  'Hattu palasi ensin, kaveri heti perässä',
  'Muistetaan loikkana, ei riitana',
  'Sauna oli jo lämmin, ja se lohdutti',
  'Koira nuoli posken ja piti sen sovinnon merkkinä',
  'Huomioliivi selvisi. Ystävyys myös.',
  'Ei kaatunut saaliiksi, vaan tarinan vuoksi'
];

export const MAINOKSET = [
  { id: 'kola', teksti: '0,5 l Kolaa jauheena – piristävä ja hyvänhajuinen!' },
  { id: 'haulikko', teksti: 'Uusi haulikko ennakoi jäniksen hypyn!' },
  { id: 'jallovviina', teksti: 'Jallovviina 7 tähteä, perhepakkaus, muovipullo 1,5 l' },
  { id: 'liivi', teksti: 'Huomioliivi, joka näkyy myös kaverille – nyt −50 %' },
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

export function siistiNimi(s) {
  const t = String(s ?? '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, 24);
  return t || 'Metsäkaveri';
}

function numero(seed, lista, pikkuLista) {
  const r = mulberry32(seed >>> 0);
  const o = lista[Math.floor(r() * lista.length)];
  const muut = pikkuLista.filter(x => x[0] !== o[0]);
  const pikku = poimi(r, muut, 2 + Math.floor(r() * 2)).map(x => x[0]);
  const mainokset = poimi(r, MAINOKSET, 2 + Math.floor(r() * 2));
  return { o, pikku, mainokset, r };
}

// Lopetus: surullinen pääotsikko, hauskat pikku-uutiset, kuolinilmoitus ja pisteet.
// pakko.otsikko korvaa pääotsikon (kyläläisen oma juttu). Surulistaa ei muuteta.
export const LEHDEN_PAIVA = 'lauantai 24.10.2026';
export const LEHDEN_HINTA = '0 mk';
function meta(seed) { return { numero: 100 + ((seed >>> 0) % 900), paiva: LEHDEN_PAIVA, hinta: LEHDEN_HINTA }; }

// Kuvitus vain kun otsikko kertoo juuri tästä kuvasta. Muuten palstassa ei ole väärää kuvaa.
export function juttuKuva(otsikko) {
  const s = String(otsikko || '');
  if (s.includes('ihmisjänikseksi')) return { src: '/grafiikka/hud/lehti/ihmisjanis.webp', teksti: 'Kaveri loikki. Korvat olivat lakki. Toimitus pettyi ääneen.' };
  if (s.includes('porkkanaloukku')) return { src: '/grafiikka/hud/lehti/porkkanaloukku.webp', teksti: 'Syötti maistui keksijälle. Ansa taputti käsiään.' };
  if (s.includes('Vitara jäi hankeen')) return { src: '/grafiikka/hud/lehti/vitara_hangessa.webp', teksti: 'Vitara jäi yöksi. Radio juoruili aamuun asti yksin.' };
  if (/Mummo|puput|ruokavier|jänikset juhlivat/.test(s)) return { src: '/grafiikka/hud/lehti/mummo_ja_janikset.webp', teksti: 'Mummo ja jänikset. Porkkana oli sopimus, ei syötti.' };
  return null;
}

// Iltapäivälehden tarrat. Keltainen ja punainen vuorottelevat nimen mukaan.
const TARRAT = ['KOHU!', 'SHOKKI!', 'PALJASTUS!', 'ERIKOINEN', 'UUTINEN'];
function tarraNimi(seed, i = 0) { return TARRAT[((seed >>> 0) + i * 2) % TARRAT.length]; }
function tarraVari(nimi) { return nimi === 'ERIKOINEN' || nimi === 'UUTINEN' || nimi === 'PALJASTUS!' ? 'kelt' : 'pun'; }

// Juorulehden lainausotsikot. Murre saa jäädä, nimet ovat kylän omia.
const LAINAUKSET = [
  { kuka: 'Mummo', sana: 'Taas ne juoksee pitkin pihaa!' },
  { kuka: 'Isäntä', sana: 'Mää näin sen ihan selvin silmin, melkein.' },
  { kuka: 'Mummo', sana: 'Älä usko sitä miestä. Se haiskahtaa pullolta.' },
  { kuka: 'Isäntä', sana: 'Pullo oli pystyssä. Sekin on uutinen.' },
  { kuka: 'Mummo', sana: 'Jänikset tietää enemmän kuin te.' },
  { kuka: 'Isäntä', sana: 'Hei, kyytiä ei nyt saa. Mä oon etusivulla.' }
];
function lainaus(seed, i = 0) { return LAINAUKSET[((seed >>> 0) + i) % LAINAUKSET.length]; }
function ingressiOtsikolle(otsikko) {
  const rivi = HAUSKAT.find(x => x[0] === otsikko) || SURUT.find(x => x[0] === otsikko);
  return rivi ? rivi[1] : '';
}

export function lehti(seed, pisteet = 0, nimi, pakko) {
  const { o, pikku, mainokset, r } = numero(seed, SURUT, HAUSKAT);
  const muisto = MUISTOT[Math.floor(r() * MUISTOT.length)];
  const otsikko = pakko?.otsikko || o[0];
  const siemen = seed >>> 0;
  return {
    nimi: LEHDEN_NIMI, otsikko, ingressi: pakko?.ingressi || o[1], pikku, mainokset, pisteet: pisteet | 0,
    kuolin: { nimi: siistiNimi(nimi), muisto }, kuva: 'kaatui', kuvaJuttu: juttuKuva(otsikko),
    tarra: tarraNimi(siemen), lainaus: lainaus(siemen),
    ...meta(siemen),
    ala: 'Kollinmäki · Kurikka · ilmestyy kun kaveri kaatuu'
  };
}

// Mökin pöytä: sama lehti ilman kuolinilmoitusta ja ilman suruotsikkoa. Sama siemen = sama numero.
export function lehtiPoyta(seed) {
  const s = (seed >>> 0) ^ 0x9e3779b9;
  const { o, pikku, mainokset } = numero(s, HAUSKAT, HAUSKAT);
  return {
    nimi: LEHDEN_NIMI, otsikko: o[0], ingressi: o[1], pikku, mainokset, pisteet: null,
    kuolin: null, kuva: 'poyta', kuvaJuttu: juttuKuva(o[0]), sulje: true,
    tarra: tarraNimi(s), lainaus: lainaus(s),
    ...meta(s),
    ala: 'Kollinmäki · Kurikka · mökin pöydältä'
  };
}

// Pöytä mökin sisällä, ovesta (itä, paikallinen +z) poispäin. x = itä, z = etelä.
export const POYTA_SADE = 1.6;
export function poytaMaailma(cabin) {
  const lx = 0.15, lz = -0.7;
  const sx = cabin.sx || 1, sz = cabin.sz || 1;
  const c = Math.cos(cabin.rot || 0), s = Math.sin(cabin.rot || 0);
  return { x: cabin.x + lx * sx * c + lz * sz * s, z: cabin.z - lx * sx * s + lz * sz * c };
}
export function nearPoyta(px, pz, p, r = POYTA_SADE) {
  return !!p && Math.hypot(px - p.x, pz - p.z) <= r;
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

function tarraHtml(nimi) {
  return `<span class="ks-tarra ${tarraVari(nimi)}">${esc(nimi)}</span>`;
}
function lainausHtml(q) {
  if (!q) return '';
  return `<blockquote class="ks-lainaus"><p>”${esc(q.sana)}”</p><cite>${esc(q.kuka)}</cite></blockquote>`;
}
function kuvaHtml(kuva) {
  if (!kuva) return '';
  return `<figure class="ks-kuva-juttu"><img class="ks-pyorea" alt="" src="${esc(kuva.src)}"><figcaption>${esc(kuva.teksti)}</figcaption></figure>`;
}

export function lehtiHtml(l) {
  const siemen = (l.numero | 0) || 1;
  const kuva = l.kuvaJuttu || juttuKuva(l.otsikko);
  const etuTarra = l.tarra || tarraNimi(siemen);
  const etuLainaus = l.lainaus || lainaus(siemen);
  const mainokset = (l.mainokset || []).map(m => {
    const kuvaM = m.id === 'jallovviina'
      ? `<img class="ks-mainoskuva" alt="" src="/grafiikka/hud/lehti/mainos_jallovviina.webp">`
      : `<canvas class="ks-kuva" data-id="${esc(m.id)}" width="88" height="78"></canvas>`;
    return `<aside class="ks-mainos"><b>MAINOS</b>${kuvaM}<span>${esc(m.teksti)}</span></aside>`;
  }).join('');
  const piste = l.pisteet == null ? '' : `<p class="ks-piste">Jahdin pisteet jäivät lukemaan ${l.pisteet | 0}. Toimitus ei suosittele uusintaa.</p>`;
  const kuolin = l.kuolin ? `<section class="ks-kuolin"><div class="ks-risti" aria-hidden="true">†</div><canvas class="ks-janis" width="140" height="90"></canvas><h2>${esc(l.kuolin.nimi)}</h2><p>${esc(l.kuolin.muisto)}</p></section>` : '';
  const sulje = l.sulje ? `<p class="ks-sulje">E tai Esc sulkee lehden. Nuolet selaavat.</p>` : `<p class="ks-sulje">Nuolet selaavat sivuja.</p>`;
  const pikkuSivut = (l.pikku || []).map((p, i) => {
    const nimi = tarraNimi(siemen, i + 1);
    const ing = ingressiOtsikolle(p);
    return `<section class="ks-sivu">${tarraHtml(nimi)}<h2 class="ks-kohu">${esc(p)}</h2>${ing ? `<p class="ks-ing">${esc(ing)}</p>` : ''}${lainausHtml(lainaus(siemen, i + 1))}</section>`;
  }).join('');
  const sivuja = 2 + (l.pikku || []).length;
  return `<article class="ks">
<header class="ks-head"><div class="ks-nimi">${esc(l.nimi)}</div><div class="ks-mast"><span>${esc(l.paiva || '')}</span><span>Nro ${l.numero | 0}</span><span>${esc(l.hinta || '')}</span></div><div class="ks-ala">${esc(l.ala)}</div></header>
<div class="ks-sivut">
<section class="ks-sivu ks-nayta">${tarraHtml(etuTarra)}<h1>${esc(l.otsikko)}</h1>${kuvaHtml(kuva)}<p class="ks-ing">${esc(l.ingressi)}</p>${lainausHtml(etuLainaus)}</section>
${pikkuSivut}
<section class="ks-sivu"><h2 class="ks-kohu">TAKASIVU</h2><div class="ks-mainokset">${mainokset}</div>${kuolin}${piste}</section>
</div>
<nav class="ks-selaus"><button type="button" class="ks-ed">EDELLINEN</button><span class="ks-sivu-nro">1 / ${sivuja}</span><button type="button" class="ks-seur">SEURAAVA KOHU</button></nav>
${sulje}
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

// Valkoinen jänis kuolinilmoituksen kuvaksi. Ei ole minkään merkin logo.
export function piirraJanis(canvas) {
  const g = canvas.getContext('2d'); if (!g) return;
  const w = canvas.width, h = canvas.height, cx = w / 2;
  pohja(g, w, h);
  g.fillStyle = '#f7f4ee';
  g.beginPath();
  g.ellipse(cx - 16, 28, 7, 22, -0.25, 0, Math.PI * 2);
  g.ellipse(cx + 16, 28, 7, 22, 0.25, 0, Math.PI * 2);
  g.fill(); g.stroke();
  g.beginPath();
  g.ellipse(cx, 58, 28, 16, 0, 0, Math.PI * 2);
  g.fill(); g.stroke();
  g.beginPath();
  g.arc(cx + 18, 50, 12, 0, Math.PI * 2);
  g.fill(); g.stroke();
  g.fillStyle = '#2a241c';
  g.beginPath();
  g.arc(cx + 22, 48, 2, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#f7f4ee';
  g.beginPath();
  g.arc(cx - 24, 62, 6, 0, Math.PI * 2);
  g.fill(); g.stroke();
}
