// GPS-merkit. Oma sijainti, ajokoira, auto ja moninpelissä kaveri sekä terrieri.
export function gpsMerkit({ oma, koira, auto, kaveri, terrieri, moninpeli } = {}) {
  const m = [];
  if (auto) m.push({ id: 'auto', x: auto.x, z: auto.z, laji: 'auto' });
  if (koira) m.push({ id: 'koira', x: koira.x, z: koira.z, laji: 'koira', riding: !!koira.riding });
  if (oma) m.push({ id: 'oma', x: oma.x, z: oma.z, laji: 'oma' });
  if (moninpeli && kaveri) m.push({ id: 'kaveri', x: kaveri.x, z: kaveri.z, laji: 'kaveri' });
  if (moninpeli && terrieri) m.push({ id: 'terrieri', x: terrieri.x, z: terrieri.z, laji: 'terrieri', riding: !!terrieri.riding });
  return m;
}

// Kun kaveri istuu autossa, merkki siirretään ruudulla ettei se peity auton alle.
export function gpsPino(merkit) {
  const auto = merkit.find(m => m.laji === 'auto');
  return merkit.map(m => {
    if (!auto || (m.laji !== 'kaveri' && m.laji !== 'oma')) return { ...m, siirto: 0 };
    if (Math.hypot(m.x - auto.x, m.z - auto.z) >= 2) return { ...m, siirto: 0 };
    return { ...m, siirto: m.laji === 'kaveri' ? 14 : -10 };
  });
}
