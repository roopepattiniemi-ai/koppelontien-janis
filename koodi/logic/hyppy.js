// Metsästäjä ei hyppää. Repliikit säilytetään murteellisina, eikä sama tule kahdesti peräkkäin.
export const HYPTY_REPLIIKIT = [
  'Enkä hyppää!',
  'Hyppää ite.',
  'Kokeile itse hypätä, läski.',
  'Jalka kipee, ei pysty hyppää.',
  'Huonot kengät.',
  'Tämä ei oo mikään Mario-peli.',
];

export const HYPTY_CD = 1.5;

export function seuraavaHyppy(edellinen, rand = Math.random) {
  const muut = HYPTY_REPLIIKIT.filter(s => s !== edellinen);
  const lista = muut.length ? muut : HYPTY_REPLIIKIT;
  return lista[Math.min(lista.length - 1, (rand() * lista.length) | 0)];
}

export function hyppySallittu(cooldown) { return cooldown <= 0; }

// Vieras on hieman kimeämpi. Perustaajuus hertseinä muminalle.
export function pelaajaSavy(role) { return role === 'v' ? 165 : 118; }
