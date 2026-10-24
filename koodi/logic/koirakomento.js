// Kumpikin pelaaja käskee omaa koiraansa. Vieraan F ei koske isännän ajokoiraan.
// Isäntä soveltaa vieraan viestin terrieriin, jotta molemmat näkevät saman naru-tilan.

export function komentoNappain(code, leashed) {
  if (code === 'KeyF') return leashed ? 'irti' : 'kiinni';
  return { Digit1: 'tanne', Digit2: 'seuraa', Digit3: 'etsi', Digit4: 'taalla' }[code] || null;
}

export function omaKoira(role) {
  return role === 'v' ? 'terrieri' : 'koira';
}

function kohdeKoira(kenelle, koira, terrieri) {
  return kenelle === 'terrieri' ? terrieri : koira;
}

// Lähettäjä soveltaa komennon heti omaan koiraansa. Vieras lähettää saman viestin isännälle.
export function lahetaKoirakomento({ role, code, koira, terrieri, x, z, hare } = {}) {
  const kenelle = omaKoira(role);
  const kohde = kohdeKoira(kenelle, koira, terrieri);
  if (!kohde) return null;
  const c = komentoNappain(code, !!kohde.leashed);
  if (!c) return null;
  const tulos = kohde.command(c, { x, z }, kenelle === 'koira' ? hare : undefined);
  return { t: 'cmd', kenelle, c, x, z, tulos };
}

// Isäntä: ilman kenelle-kenttää viesti on yhä ajokoiralle. kenelle:'terrieri' ei koske ajokoiraan.
export function vastaanotaKoirakomento(m, { koira, terrieri, hare } = {}) {
  if (!m || m.t !== 'cmd' || !m.c) return { ok: false, kenelle: null };
  const kenelle = m.kenelle === 'terrieri' ? 'terrieri' : 'koira';
  const kohde = kohdeKoira(kenelle, koira, terrieri);
  if (!kohde) return { ok: false, kenelle };
  const tulos = kohde.command(m.c, { x: m.x, z: m.z }, kenelle === 'koira' ? hare : undefined);
  return { ...tulos, kenelle };
}
