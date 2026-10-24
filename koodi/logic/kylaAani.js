// Hahmon oma mumina. Suomenkielistä puhesynteesiä ei soiteta: teksti näkyy ruudulla.
const AANI = { isanta: 'matala', mummo: 'kimea', naapuri: 'juoru', aija: 'karhea' };

export function kylaAani(laji) { return AANI[laji] || 'juoru'; }

// Satunnainen pihaääni lähellä. null = hiljaa, ettei metsä täyty.
export function tunnelma(laji, rand = Math.random) {
  if (rand() > 0.35) return null;
  if (laji === 'isanta') return rand() < 0.5 ? 'hikka' : 'pullo';
  if (laji === 'mummo') return rand() < 0.5 ? 'keppi' : 'tuhahdus';
  return null;
}
