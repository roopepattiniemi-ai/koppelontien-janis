// Uusi jahti nollataan lataamalla sivu uudelleen. Isäntä käynnistää kierroksen molemmille.
export function uusiJahtiKomento(role, peer) {
  return role === 'v' && peer ? 'pyynto' : 'itse';
}

// Alkukoira istuu Vitarassa jo remmissä, jotta ulos hypätessä naru pysyy.
export function alkuKoira() {
  return { leashed: true, riding: true, state: 'narussa', kyytiNaru: true };
}
