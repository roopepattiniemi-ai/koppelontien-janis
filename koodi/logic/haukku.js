// Haukun tila. Jälki: harva innostunut. Näköajo: tiheä jahtihaukku. Hukka: tauko / epävarma.
// Terrieri on kimeämpi kuin ajokoira. Ääni sijoitetaan 3D:ssä koiran kohdalle.
const NAKO_M = 28;

export function haukkuTila(state, dist, alive) {
  if (state === 'hukka') return 'epavarma';
  if (state === 'yöjälki' || state === 'ylösotto') return 'jalki';
  if (state === 'ajo' && alive) return dist < NAKO_M ? 'nako' : 'jalki';
  return null;
}

// Sekunteja seuraavaan haukkuun. Näköajo on selvästi jälkeä tiheämpi, hukka harvinainen.
export function haukkuVali(tila, dist = 0) {
  if (tila === 'nako') return 0.42 + Math.min(dist, NAKO_M) / 160;
  if (tila === 'jalki') return 1.7 + Math.min(Math.max(dist, 0), 220) / 90;
  if (tila === 'epavarma') return 5.2;
  return 30;
}

export function haukkuSavel(rotu) { return rotu === 'terrieri' ? 1.5 : 1; }

// Ajokoira ja terrieri käyttävät eri näytteitä. Terrieri lisäksi nopeutetaan sävelkorkeudella.
export function haukkuAani(tila, rotu, n = 0) {
  if (!tila) return null;
  if (tila === 'epavarma') return 'sfx_koira_vinkuu';
  if (rotu === 'terrieri') return 'sfx_koira_haukku_' + (1 + (Math.abs(n | 0) % 3));
  if (tila === 'nako') return 'sfx_koira_ajo_tiivis';
  return (n & 1) ? 'sfx_koira_ajo_harva' : 'sfx_koira_haukku_' + (4 + (Math.abs(n | 0) % 3));
}
