// Haukun tila. Yöjälki on hiljaa, kunnes jälki tuoreutuu (vingahdus).
// Varsinainen ajohaukku vasta kun jänis on lähtenyt. Katko on epävarma ja harva.
// Terrieri on kimeämpi kuin ajokoira. Ääni sijoitetaan 3D:ssä koiran kohdalle.
const NAKO_M = 28;
const HILJAA_M = 75;

export function haukkuTila(state, dist, alive) {
  if (state === 'hukka') return 'epavarma';
  if (state === 'yöjälki' || state === 'ylösotto') return dist > HILJAA_M ? null : 'vingahdus';
  if (state === 'ajo' && alive) return 'nako';
  return null;
}

// Sekunteja seuraavaan ääneen. Vingahdus tihenee makuuta kohti. Näköajo pysyy tiheänä.
export function haukkuVali(tila, dist = 0) {
  if (tila === 'nako') return 0.42 + Math.min(dist, NAKO_M) / 160;
  if (tila === 'vingahdus') return 0.55 + Math.min(Math.max(dist, 0), 90) / 22;
  if (tila === 'jalki') return 1.7 + Math.min(Math.max(dist, 0), 220) / 90;
  if (tila === 'epavarma') return 5.2;
  return 30;
}

export function haukkuSavel(rotu) { return rotu === 'terrieri' ? 1.5 : 1; }

// Ajokoira ja terrieri käyttävät eri näytteitä. Terrieri lisäksi nopeutetaan sävelkorkeudella.
export function haukkuAani(tila, rotu, n = 0) {
  if (!tila) return null;
  if (tila === 'epavarma' || tila === 'vingahdus') return 'sfx_koira_vinkuu';
  if (rotu === 'terrieri') return 'sfx_koira_haukku_' + (1 + (Math.abs(n | 0) % 3));
  if (tila === 'nako') return 'sfx_koira_ajo_tiivis';
  return (n & 1) ? 'sfx_koira_ajo_harva' : 'sfx_koira_haukku_' + (4 + (Math.abs(n | 0) % 3));
}

// Yksi haukku tai ulina kerrallaan per koira. Uusi odottaa, jos edellinen soi.
// Sama tunnus (paikallinen ja verkosta tullut) ei käynnisty toista kertaa.
export function uusiHaukkuSoitin() {
  return { slot: {}, kuultu: new Map() };
}
export function haukkuPyynto(s, koira, nimi, nyt, kesto, tunnus) {
  if (!s || !koira || !nimi) return { soita: false, odota: 0 };
  const slot = s.slot[koira] || (s.slot[koira] = { asti: -Infinity, tunnus: null });
  const id = tunnus ? String(tunnus) : '';
  if (id && (slot.tunnus === id || s.kuultu.has(id))) return { soita: false, odota: Math.max(0, slot.asti - nyt) };
  if (nyt < slot.asti - 1e-4) return { soita: false, odota: slot.asti - nyt };
  const k = Math.max(0.05, Number(kesto) || 0);
  slot.asti = nyt + k;
  slot.tunnus = id || null;
  if (id) {
    s.kuultu.set(id, nyt);
    if (s.kuultu.size > 64) { const vanha = [...s.kuultu.entries()].sort((a, b) => a[1] - b[1]).slice(0, 32); for (const [avain] of vanha) s.kuultu.delete(avain); }
  }
  return { soita: true, odota: k };
}
export function haukkuPeru(s, koira) {
  const slot = s?.slot[koira];
  if (!slot) return;
  if (slot.tunnus) s.kuultu.delete(slot.tunnus);
  slot.asti = -Infinity;
  slot.tunnus = null;
}
