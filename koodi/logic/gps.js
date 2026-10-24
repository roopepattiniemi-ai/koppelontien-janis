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

// Piippaus vain tilan vaihtuessa. Sama kori ei soi uudestaan.
const KORIT = {
  haku: { teksti: 'Koira hakee', aanet: ['sfx_gps_piippaus'] },
  jaljestaa: { teksti: 'Koira jäljestää', aanet: ['sfx_gps_piippaus'] },
  ajo: { teksti: 'Koira ajaa!', aanet: ['sfx_gps_piippaus', 'sfx_gps_piippaus'] },
  katko: { teksti: 'Katko', aanet: ['sfx_gps_hukka'] },
  seisoo: { teksti: 'Koira seisoo', aanet: ['sfx_gps_haukkuindikaattori'] },
  paluu: { teksti: 'Koira palaa', aanet: ['sfx_gps_piippaus'] },
};

export function gpsKori(state) {
  if (state === 'haku') return 'haku';
  if (state === 'yöjälki' || state === 'täällä') return 'jaljestaa';
  if (state === 'ajo') return 'ajo';
  if (state === 'hukka') return 'katko';
  if (state === 'ylösotto' || state === 'tänne') return 'seisoo';
  if (state === 'paluu') return 'paluu';
  return null;
}

export function gpsTapahtuma(edellinen, state) {
  const kori = gpsKori(state);
  if (kori === edellinen) return null;
  if (!kori) return { kori: null, teksti: null, aanet: [] };
  const k = KORIT[kori];
  return { kori, teksti: k.teksti, aanet: k.aanet.slice() };
}
