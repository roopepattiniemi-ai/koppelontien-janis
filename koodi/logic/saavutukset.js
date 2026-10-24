// Saavutukset ovat pelaajan omassa selaimessa. Moninpeli ei lähetä niitä.
import { RIISTAKAMERA } from './config.js';
const AVAIN = 'jahti_saavutukset';
export { AVAIN };

const ik = (sisus) => `<svg viewBox="0 0 32 32" width="36" height="36" aria-hidden="true">${sisus}</svg>`;

export const SAAVUTUKSET = [
  { id: 'janis', nimi: 'Ensimmäinen jänis', kuvaus: 'Yksi korva hangessa. Kahvipannu lämpesi.',
    ikoni: ik('<ellipse cx="16" cy="20" rx="8" ry="6" fill="#c4a574"/><ellipse cx="11" cy="10" rx="2" ry="6" fill="#e7d3a8"/><ellipse cx="21" cy="10" rx="2" ry="6" fill="#e7d3a8"/><circle cx="13" cy="19" r="1" fill="#2a1c12"/><circle cx="19" cy="19" r="1" fill="#2a1c12"/>') },
  { id: 'kolme', nimi: 'Kolme jänistä', kuvaus: 'Yksi jahti, kolme jälkeä. Kylä laskee jo patoja.',
    ikoni: ik('<circle cx="8" cy="16" r="5" fill="#d2b48c"/><circle cx="16" cy="16" r="5" fill="#c4a574"/><circle cx="24" cy="16" r="5" fill="#a68456"/>') },
  { id: 'peura', nimi: 'Yhdellä laukauksella', kuvaus: 'Peura ja yksi pamaus. Metsä hiljeni vasta sen jälkeen.',
    ikoni: ik('<path d="M10 22c2-8 4-10 6-10s4 2 6 10" fill="#8d6b4a"/><path d="M12 12c-2-6 0-8 2-8M20 12c2-6 0-8-2-8" stroke="#6b4a2c" fill="none" stroke-width="1.6"/>') },
  { id: 'lento', nimi: 'Lennosta', kuvaus: 'Teeri lähti ja jäi. Siivet ehtivät yhden iskun.',
    ikoni: ik('<path d="M4 18c6-2 8-8 12-8s6 6 12 8c-6 1-8 2-12 2S10 19 4 18z" fill="#3d4a62"/>') },
  { id: 'noudot', nimi: 'Viisi noutoa', kuvaus: 'Koira toi viisi. Sinä toit kehun.',
    ikoni: ik('<ellipse cx="16" cy="20" rx="7" ry="5" fill="#c47a3a"/><circle cx="10" cy="14" r="2.2" fill="#c47a3a"/><circle cx="16" cy="12" r="2.2" fill="#c47a3a"/><circle cx="22" cy="14" r="2.2" fill="#c47a3a"/>') },
  { id: 'pitka', nimi: 'Pitkä laukaus', kuvaus: 'Jänis yli 35 metrin päästä. Isäntä väittää nähneensä pidemmälle.',
    ikoni: ik('<circle cx="16" cy="16" r="10" fill="none" stroke="#d4a24c" stroke-width="2"/><circle cx="16" cy="16" r="4" fill="none" stroke="#d4a24c" stroke-width="2"/><circle cx="16" cy="16" r="1.4" fill="#d4a24c"/>') },
  { id: 'veri', nimi: 'Verijälki', kuvaus: 'Haavoittunut jänis löytyi. Lumi kertoi loput.',
    ikoni: ik('<circle cx="12" cy="14" r="3" fill="#a83232"/><circle cx="18" cy="18" r="2.2" fill="#a83232"/><circle cx="22" cy="12" r="1.6" fill="#a83232"/>') },
  { id: 'kyla', nimi: 'Kyläjuttu', kuvaus: 'Isäntä, mummo, naapuri ja äijä. Juoru ehti kiertää takaisin.',
    ikoni: ik('<rect x="6" y="8" width="14" height="10" rx="2" fill="#6f8fbf"/><rect x="12" y="14" width="14" height="10" rx="2" fill="#e6d3a1"/>') },
  { id: 'mummo', nimi: 'Mummon vihollinen', kuvaus: 'Mummo näki saaliin. Porkkana jäi kostamatta. Vielä.',
    ikoni: ik('<circle cx="16" cy="14" r="6" fill="#d2a07a"/><path d="M8 12c2-8 14-8 16 0" fill="#8a3040"/><rect x="20" y="18" width="3" height="10" fill="#6b4a28"/>') },
  { id: 'etusivu', nimi: 'Etusivu', kuvaus: 'Kaveri pääsi Kollinmäen Sanomiin. Sinä pääsit syylliseksi.',
    ikoni: ik('<rect x="6" y="5" width="20" height="22" fill="#f4efe4" stroke="#1a120c"/><path d="M9 10h14M9 14h14M9 18h10" stroke="#1a120c"/>') },
  { id: 'lehti', nimi: 'Lehdenlukija', kuvaus: 'Mökin lehti tuli luettua. Porkkanaloukku jäi mieleen.',
    ikoni: ik('<path d="M7 8h8v16H7zM17 8h8v16h-8z" fill="#f4efe4" stroke="#5c4030"/><path d="M9 12h4M19 12h4M9 16h4M19 16h4" stroke="#5c4030"/>') },
  { id: 'vitara', nimi: 'Vitara hangessa', kuvaus: 'Yli 500 metriä maastoa. Tie oli kuulemma ehdotus.',
    ikoni: ik('<rect x="6" y="14" width="20" height="7" rx="2" fill="#3d6b4f"/><circle cx="11" cy="22" r="2.4" fill="#222"/><circle cx="21" cy="22" r="2.4" fill="#222"/>') },
  { id: 'radio', nimi: 'Radiomies', kuvaus: 'Kymmenen minuuttia radiota. Juontaja tuntee sinut jo.',
    ikoni: ik('<rect x="6" y="10" width="20" height="12" rx="2" fill="#223"/><circle cx="12" cy="16" r="3" fill="#9cff9c"/><path d="M20 12v8M23 14v4" stroke="#9cff9c"/>') },
  { id: 'kaksin', nimi: 'Kaksin jahdissa', kuvaus: 'Kaksi metsästäjää, yksi Vitara. Pelkääjän jalka mahtui.',
    ikoni: ik('<circle cx="12" cy="12" r="4" fill="#ff7a00"/><circle cx="21" cy="12" r="4" fill="#6b7a4a"/><rect x="8" y="18" width="8" height="8" fill="#6b4a2c"/><rect x="17" y="18" width="8" height="8" fill="#3d4a32"/>') },
  { id: 'loyly', nimi: 'Löylyihin', kuvaus: 'Jahti loppui saunalle. Savu hoiti yhteenvedon.',
    ikoni: ik('<rect x="8" y="16" width="16" height="10" rx="5" fill="#8d5a3c"/><path d="M12 14c0-4 2-6 2-6s2 2 2 6M18 13c0-5 2-7 2-7" stroke="#d9dde6" fill="none"/>') },
  { id: 'rauha', nimi: 'Rauhoitettu', kuvaus: 'Rauhoitettu meni. Huomautus jäi soimaan pidempään kuin pamaus.',
    ikoni: ik('<path d="M16 5l8 4v7c0 6-8 11-8 11S8 22 8 16V9z" fill="#8aa0b8"/><path d="M16 12v7" stroke="#1a120c"/>') },
  { id: 'kauhu', nimi: 'Kylän kauhu', kuvaus: 'Kyläläinen kaatui lehteen. Jänikset eivät valittaneet.',
    ikoni: ik('<rect x="7" y="6" width="18" height="20" fill="#1a120c"/><path d="M11 12h10M11 16h8" stroke="#f4efe4"/>') },
  { id: 'pata', nimi: 'Täysi pata', kuvaus: 'Jänis, teeri ja peura samassa jahdissa. Pata ei kysy lisää.',
    ikoni: ik('<path d="M8 14h16v6a6 6 0 0 1-16 0z" fill="#5c4030"/><path d="M6 14h20" stroke="#c4a574" stroke-width="2"/>') },
  { id: 'haukku', nimi: 'Haukku kantoi', kuvaus: 'Koira lähti ajoon. Haukku kuului pidemmälle kuin selitys.',
    ikoni: ik('<path d="M8 20c2-8 6-10 8-10s6 2 8 10" fill="#a86b3c"/><path d="M22 12c4 1 6 4 6 4" stroke="#d4a24c" fill="none"/>') },
  { id: 'gps', nimi: 'Kartta auki', kuvaus: 'GPS aukesi. Metsä siirtyi ruudulle ja takaisin.',
    ikoni: ik('<rect x="7" y="6" width="18" height="20" rx="2" fill="#1d3b2a"/><circle cx="16" cy="15" r="4" fill="#9cff9c"/><path d="M16 15l3 6" stroke="#ff8c1a"/>') },
  { id: 'repolainen', nimi: 'Repolainen', kuvaus: 'Kettu kaatui. Se ehti kiertää passin, mutta ei hauliparvea.',
    ikoni: ik('<ellipse cx="16" cy="18" rx="8" ry="5" fill="#c0581c"/><polygon points="22,16 28,12 26,18" fill="#c0581c"/><circle cx="12" cy="17" r="1" fill="#1a120c"/>') },
  { id: 'bigfoot', nimi: 'Bigfoot on totta', kuvaus: 'Riistakamera näki ison karvaisen. Kylä uskoo, jos kuva säilyy.',
    ikoni: ik('<circle cx="16" cy="10" r="4" fill="#6b4a32"/><rect x="12" y="14" width="8" height="10" rx="2" fill="#5a3e2b"/><path d="M10 16l-4 6M22 16l4 6" stroke="#5a3e2b"/>') }
];

const ROOLIT = ['isanta', 'mummo', 'naapuri', 'aija'];
const PADAN = ['janis', 'teeri', 'peura'];

export function tyhja() {
  return { avatut: {}, noudot: 0, radio: 0, vitara: 0, jahti: '', janikset: 0, lajit: [], kylat: [] };
}

export function lataa(storage) {
  const t = tyhja();
  try {
    const j = JSON.parse(storage.getItem(AVAIN) || 'null');
    if (!j || typeof j !== 'object') return t;
    if (j.avatut && typeof j.avatut === 'object') {
      for (const s of SAAVUTUKSET) if (typeof j.avatut[s.id] === 'string') t.avatut[s.id] = j.avatut[s.id].slice(0, 40);
    }
    t.noudot = Math.max(0, j.noudot | 0);
    t.radio = Math.max(0, Number(j.radio) || 0);
    t.vitara = Math.max(0, Number(j.vitara) || 0);
    t.jahti = String(j.jahti || '').slice(0, 40);
    t.janikset = Math.max(0, j.janikset | 0);
    if (Array.isArray(j.lajit)) t.lajit = [...new Set(j.lajit.filter(x => PADAN.includes(x)))];
    if (Array.isArray(j.kylat)) t.kylat = [...new Set(j.kylat.filter(x => ROOLIT.includes(x)))];
  } catch { /* tyhjä kirja */ }
  return t;
}

export function talleta(storage, tila) {
  storage.setItem(AVAIN, JSON.stringify({
    avatut: tila.avatut,
    noudot: tila.noudot | 0,
    radio: Math.round((Number(tila.radio) || 0) * 10) / 10,
    vitara: Math.round((Number(tila.vitara) || 0) * 10) / 10,
    jahti: String(tila.jahti || '').slice(0, 40),
    janikset: tila.janikset | 0,
    lajit: tila.lajit || [],
    kylat: tila.kylat || []
  }));
}

function samaJahti(tila, id) {
  const j = String(id || '');
  if (tila.jahti === j) return false;
  tila.jahti = j;
  tila.janikset = 0;
  tila.lajit = [];
  return true;
}

// Kirjaa yhden tapahtuman. Palauttaa uudet avaukset. Sama saavutus ei avaudu kahdesti.
export function kirjaa(tila, ev = {}) {
  const uudet = [];
  let muuttui = false;
  const avaa = id => {
    if (tila.avatut[id]) return;
    const s = SAAVUTUKSET.find(x => x.id === id);
    if (!s) return;
    tila.avatut[id] = String(ev.aika || 'avattu').slice(0, 40);
    uudet.push(s);
    muuttui = true;
  };
  const lajiMukaan = laji => {
    if (!PADAN.includes(laji) || tila.lajit.includes(laji)) return;
    tila.lajit.push(laji);
    muuttui = true;
    if (PADAN.every(x => tila.lajit.includes(x))) avaa('pata');
  };
  const tyyppi = ev.tyyppi;
  if (tyyppi === 'kaato') {
    if (samaJahti(tila, ev.jahti)) muuttui = true;
    lajiMukaan(ev.laji);
    if (ev.laji === 'kettu') avaa('repolainen');
    if (ev.laji === 'janis') {
      tila.janikset = (tila.janikset | 0) + 1;
      muuttui = true;
      if (tila.janikset >= 1) avaa('janis');
      if (tila.janikset >= 3) avaa('kolme');
      if (Number(ev.matka) > 35) avaa('pitka');
    } else if (ev.laji === 'peura' && (ev.osumat | 0) <= 1) avaa('peura');
  } else if (tyyppi === 'lento') avaa('lento');
  else if (tyyppi === 'veri') avaa('veri');
  else if (tyyppi === 'nouto') {
    tila.noudot = (tila.noudot | 0) + 1;
    muuttui = true;
    if (tila.noudot >= 5) avaa('noudot');
  } else if (tyyppi === 'juttu' && ROOLIT.includes(ev.laji)) {
    if (!tila.kylat.includes(ev.laji)) { tila.kylat.push(ev.laji); muuttui = true; }
    if (ROOLIT.every(x => tila.kylat.includes(x))) avaa('kyla');
    if (ev.laji === 'mummo' && ev.raivo) avaa('mummo');
  } else if (tyyppi === 'mummo') avaa('mummo');
  else if (tyyppi === 'etusivu') avaa('etusivu');
  else if (tyyppi === 'lehti') avaa('lehti');
  else if (tyyppi === 'vitara') {
    const m = Number(ev.metri);
    if (m > 0) { tila.vitara += m; muuttui = true; if (tila.vitara >= 500) avaa('vitara'); }
  } else if (tyyppi === 'radio') {
    const s = Number(ev.dt);
    if (s > 0) { tila.radio += s; muuttui = true; if (tila.radio >= 600) avaa('radio'); }
  } else if (tyyppi === 'moninpeli') avaa('kaksin');
  else if (tyyppi === 'sauna') avaa('loyly');
  else if (tyyppi === 'rauhoitettu') avaa('rauha');
  else if (tyyppi === 'kyla') avaa('kauhu');
  else if (tyyppi === 'haukku') avaa('haukku');
  else if (tyyppi === 'gps') avaa('gps');
  else if (tyyppi === 'bigfoot' && RIISTAKAMERA) avaa('bigfoot');
  return { tila, uudet, muuttui };
}

const esc = s => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function nakyvatSaavutukset() {
  return RIISTAKAMERA ? SAAVUTUKSET : SAAVUTUKSET.filter(s => s.id !== 'bigfoot');
}

export function saavutuksetHtml(tila) {
  const lista = nakyvatSaavutukset();
  const auki = tila?.avatut || {};
  const n = lista.filter(s => auki[s.id]).length;
  const kortit = lista.map(s => {
    if (!auki[s.id]) return '<article class="saav lukko"><div class="saav-ikoni">?</div><b>???</b><p>???</p></article>';
    return `<article class="saav auki"><div class="saav-ikoni">${s.ikoni}</div><b>${esc(s.nimi)}</b><p>${esc(s.kuvaus)}</p></article>`;
  }).join('');
  return `<h2>Saavutukset</h2><p class="saav-maara">${n} / ${lista.length}</p><div class="saav-ruudukko">${kortit}</div>`;
}
