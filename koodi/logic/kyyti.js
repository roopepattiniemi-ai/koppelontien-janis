// Narussa oleva koira nousee konttiin ja pysyy narussa. Vapaa ajo tai haku jää maastoon.
export function nouseKyytiin(k, { seuraaMyos = false } = {}) {
  if (!k || k.riding) return false;
  const naru = k.state === 'narussa' || k.leashed;
  const mukaan = naru || (seuraaMyos && k.state === 'seuraa');
  if (!mukaan) return false;
  k.riding = true;
  k.kyytiNaru = !!naru;
  return true;
}

// 'naru' pysyy hihnassa, 'seuraa' jatkaa perässä, 'haku' lähtee hakuun (alkukoira, joka ei ollut narussa).
export function hyppaaUlos(k) {
  if (!k?.riding) return null;
  k.riding = false;
  if (k.kyytiNaru || k.state === 'narussa') { k.state = 'narussa'; k.kyytiNaru = false; return 'naru'; }
  if (k.state === 'seuraa') return 'seuraa';
  return 'haku';
}
