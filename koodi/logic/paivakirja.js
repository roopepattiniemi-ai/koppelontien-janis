// Saalispäiväkirja. Jokainen kaato: laji, päivä, ampumamatka, osumat, pisteet, ampuja, noutaja.
export const AVAIN = 'jahti_paivakirja';
const LAJI = { janis: 'jänis', teeri: 'teeri', peura: 'peura' };
const KUKA = { h: 'isäntä', v: 'vieras', koira: 'koira' };

export function tanaan(d = new Date()) {
  const z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

function puhdas(k) {
  const laji = LAJI[k.laji] ? k.laji : null;
  if (!laji) return null;
  const matka = k.matka == null || k.matka === '' ? null : Math.max(0, Math.round(Number(k.matka) || 0));
  return {
    laji,
    paiva: typeof k.paiva === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k.paiva) ? k.paiva : tanaan(),
    matka,
    osumat: Math.max(0, k.osumat | 0),
    pisteet: Math.max(0, k.pisteet | 0),
    ampuja: k.ampuja === 'v' || k.ampuja === 'koira' ? k.ampuja : 'h',
    koira: k.koira === 'terrieri' || k.koira === 'ajokoira' ? k.koira : null,
    jahti: String(k.jahti || 'jahti').slice(0, 40),
  };
}

export function lataa(storage) {
  try {
    const j = JSON.parse(storage.getItem(AVAIN) || '[]');
    return Array.isArray(j) ? j.map(puhdas).filter(Boolean) : [];
  } catch { return []; }
}

export function talleta(storage, kaadot) {
  storage.setItem(AVAIN, JSON.stringify(kaadot.slice(-500)));
}

export function lisaa(storage, kaato) {
  const k = puhdas(kaato);
  if (!k) return null;
  const kaikki = lataa(storage);
  kaikki.push(k);
  talleta(storage, kaikki);
  return k;
}

export function paivitaKoira(storage, jahti, index, koira) {
  const kaikki = lataa(storage);
  const omat = kaikki.filter(k => k.jahti === jahti);
  const k = omat[index];
  if (!k || k.koira || (koira !== 'ajokoira' && koira !== 'terrieri')) return false;
  k.koira = koira;
  talleta(storage, kaikki);
  return true;
}

export function jahdit(kaadot) {
  const m = new Map();
  for (const k of kaadot) {
    let j = m.get(k.jahti);
    if (!j) m.set(k.jahti, j = { id: k.jahti, paiva: k.paiva, kaadot: [] });
    if (k.paiva < j.paiva) j.paiva = k.paiva;
    j.kaadot.push(k);
  }
  return [...m.values()].sort((a, b) => (a.paiva < b.paiva ? 1 : a.paiva > b.paiva ? -1 : 0));
}

export function ennatykset(kaadot) {
  let pisin = null, paras = null, eniten = null;
  const noudot = {};
  for (const j of jahdit(kaadot)) {
    const p = j.kaadot.reduce((s, k) => s + k.pisteet, 0);
    if (!paras || p > paras.pisteet) paras = { paiva: j.paiva, pisteet: p, jahti: j.id };
    if (!eniten || j.kaadot.length > eniten.maara) eniten = { paiva: j.paiva, maara: j.kaadot.length, jahti: j.id };
  }
  for (const k of kaadot) {
    if (k.matka != null && (!pisin || k.matka > pisin.matka)) pisin = k;
    if (k.koira) noudot[k.koira] = (noudot[k.koira] || 0) + 1;
  }
  let noutaja = null;
  for (const [koira, n] of Object.entries(noudot)) if (!noutaja || n > noutaja.n) noutaja = { koira, n };
  return { pisin, paras, eniten, noutaja };
}

const esc = s => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export function paivakirjaHtml(kaadot) {
  const e = ennatykset(kaadot);
  const rivi = (ots, arvo) => `<tr><td>${ots}</td><td>${esc(arvo)}</td></tr>`;
  const en = e.pisin || e.paras || e.eniten
    ? `<h3>Ennätykset</h3><table>${
      rivi('Pisin ampumamatka', e.pisin ? `${e.pisin.matka} m (${LAJI[e.pisin.laji]}, ${e.pisin.paiva})` : '–')
    }${rivi('Eniten pisteitä jahdissa', e.paras ? `${e.paras.pisteet} p (${e.paras.paiva})` : '–')
    }${rivi('Eniten kaatoja jahdissa', e.eniten ? `${e.eniten.maara} (${e.eniten.paiva})` : '–')
    }${rivi('Ahkerin noutaja', e.noutaja ? `${e.noutaja.koira} ${e.noutaja.n}` : '–')}</table>`
    : '<p>Ei vielä kaatoja. Jahti kirjaa ne tähän.</p>';
  const lista = jahdit(kaadot).map(j => {
    const p = j.kaadot.reduce((s, k) => s + k.pisteet, 0);
    const rivit = j.kaadot.map(k => `<li>${esc(LAJI[k.laji])} · ${k.matka == null ? '–' : k.matka + ' m'} · ${k.osumat} osumaa · ${k.pisteet} p · ampui ${esc(KUKA[k.ampuja] || k.ampuja)}${k.koira ? ' · nouti ' + esc(k.koira) : ''}</li>`).join('');
    return `<h3>${esc(j.paiva)} · ${j.kaadot.length} kaatoa · ${p} p</h3><ul>${rivit}</ul>`;
  }).join('');
  return `<h2>Saalispäiväkirja</h2>${en}${lista}`;
}

export function jahdinTeksti(kaadot, jahti) {
  const omat = kaadot.filter(k => k.jahti === jahti);
  if (!omat.length) return 'Tämän jahdin kaadot\nei kaatoja';
  return 'Tämän jahdin kaadot\n' + omat.map(k => `${LAJI[k.laji]} · ${k.matka == null ? '–' : k.matka + ' m'} · ${k.osumat} osumaa · ${k.pisteet} p · ampui ${KUKA[k.ampuja] || k.ampuja}${k.koira ? ' · nouti ' + k.koira : ''}`).join('\n');
}
