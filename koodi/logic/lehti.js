// Koominen iltapäivälehti, kun metsästäjä osuu toiseen pelaajaan. Nimi ja mainokset ovat keksittyjä.
import { pelletPattern, swarmHits } from './shot.js';
import { mulberry32 } from './rng.js';

export const LEHDEN_NIMI = 'Ilta-Jänis';

export const OTSIKOT = [
  ['Metsästäjä luuli metsäkaveria ihmisjänikseksi', 'Silminnäkijän mukaan kaveri loikki, mutta vastasi puhutteluun selvin sanoin.'],
  ["Jahtiseurue riitaantui: 'Se loikki ihan kuin jänis'", 'Sopu syntyi vasta, kun koira palautti hatun ja molemmat pääsivät saunaan.'],
  ['Kurikan mies ampui kaveriaan – koira nouti hatun', 'Hattu toimitettiin omistajalleen märkänä mutta ehjänä. Kaveri selvisi säikähdyksellä.'],
  ['Haulikko tunnisti oranssin liivin jäniksen korviksi', 'Liivi selvisi, ystävyys selvisi. Saalista ei kirjattu.'],
  ['"Se oli ihan valkoinen ja hyppi" – kaveri oli villapaidassa', 'Jahti keskeytettiin yhteiseen kahviin Koppelontien laidassa.'],
  ['GPS näytti kaveria jäniksenä ja toisinpäin', 'Panta piippasi kolme kertaa. Ystävyys piippasi vain kerran.'],
  ['Metsästyskoira todistajana: haukkuin, etteivät ampuisi', 'Koira sai sovittelupalkkioksi ylimääräisen makkaran ja lyhyen taputuksen.'],
  ['Koppelontien kahakka: kaksi miestä, nolla jänistä', 'Saunan kiuas sytytettiin silti. Savu oli ainoa saalis.'],
  ['Ampuja väittää tähdänneensä hankeen', 'Hanki ei vahvistanut tietoa. Kaveri vahvisti hankeen kaatumisen.'],
  ['Kaveri kaatui näyttävästi, yleisöä ei ollut', 'Koira aplodeerasi hännällä. Toimitus suosittelee hitaampaa sormea.']
];

export const MAINOKSET = [
  { nimi: 'Jallovviina', rivi: '7 tähteä perhepakkaus, muovipullo 1,5 l', hinta: '9,90' },
  { nimi: 'Pakkashousu Oy', rivi: 'Lumessa istuminen nyt 40 % pehmeämpää', hinta: '24,00' },
  { nimi: 'Hirvisarpa', rivi: 'Raaputa sarvi, voita yksi (1) villasukka', hinta: '2,50' },
  { nimi: 'Napero-saunamakkara', rivi: 'Ei sisällä jänistä. Näin me lupaamme.', hinta: '3,20' }
];

export function lehti(seed, pisteet = 0) {
  const r = mulberry32(seed >>> 0);
  const o = OTSIKOT[Math.floor(r() * OTSIKOT.length)];
  const m = MAINOKSET[Math.floor(r() * MAINOKSET.length)];
  return { nimi: LEHDEN_NIMI, otsikko: o[0], ingressi: o[1], mainos: m, pisteet: pisteet | 0 };
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
  const m = l.mainos;
  return `<article class="ij">
<header class="ij-head"><div class="ij-nimi">${esc(l.nimi)}</div><div class="ij-ala">Kurikan ainoa jahtelehti · ilmainen näytenumero · ei jatketa</div></header>
<h1>${esc(l.otsikko)}</h1>
<p class="ij-ing">${esc(l.ingressi)}</p>
<div class="ij-cols">
  <div class="ij-kuva" aria-hidden="true"><div class="ij-ukko ij-pysty"></div><div class="ij-ukko ij-kaatunut"></div><div class="ij-hanki"></div><p>Kuvassa kaveri ja hanki. Haukkua ei näy.</p></div>
  <aside class="ij-mainos"><b>MAINOS</b><canvas class="ij-pullo" width="90" height="150"></canvas><strong>${esc(m.nimi)}</strong><span>${esc(m.rivi)}</span><em>${esc(m.hinta)} €</em></aside>
</div>
<p class="ij-pikk">Pikku-uutinen: jahdin pisteet jäivät lukemaan ${l.pisteet|0}. Toimitus ei suosittele uusintaa.</p>
</article>`;
}

// Yleinen muovipullo, ei oikean tuotteen muotoa eikä merkkiä.
export function piirraPullo(canvas, nimi = '') {
  const g = canvas.getContext('2d'); if (!g) return;
  const w = canvas.width, h = canvas.height;
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#d8ecf4';
  g.strokeStyle = '#2a4a58';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(34, 18); g.lineTo(56, 18); g.lineTo(58, 36); g.lineTo(70, 48);
  g.lineTo(70, 132); g.quadraticCurveTo(45, 146, 20, 132); g.lineTo(20, 48); g.lineTo(32, 36); g.closePath();
  g.fill(); g.stroke();
  g.fillStyle = '#f4efe4';
  g.fillRect(30, 62, 30, 42);
  g.strokeRect(30, 62, 30, 42);
  g.fillStyle = '#8a1e14';
  g.font = 'bold 11px sans-serif';
  g.textAlign = 'center';
  const t = (nimi || '7').slice(0, 8);
  g.fillText(t, 45, 80);
  g.fillText('★★★★★★★', 45, 96);
}
