// Puheäänien haku. indeksi.json on taulukko {tiedosto, hahmo, teksti, kategoria}.
// Tiedostot ovat kansiossa /aanet/puhe/. Jos repliikille ei ole tiedostoa, peli soittaa muminan.

export function etsiPuhe(indeksi, { hahmo, teksti, kategoria } = {}) {
  const lista = Array.isArray(indeksi) ? indeksi : (indeksi && typeof indeksi === 'object' ? [indeksi] : []);
  const n = s => String(s ?? '').replace(/\s+/g, ' ').trim();
  const t = n(teksti);
  if (!t) return null;
  const hahmot = (Array.isArray(hahmo) ? hahmo : [hahmo]).map(n).filter(Boolean);
  const k = n(kategoria);
  const osuma = (r, h, kat) => r && n(r.teksti) === t && n(r.hahmo) === h && r.tiedosto && (!kat || n(r.kategoria) === kat);
  if (k) {
    for (const h of hahmot) {
      const tarkka = lista.find(r => osuma(r, h, k));
      if (tarkka) return String(tarkka.tiedosto);
    }
    return null;
  }
  for (const h of hahmot) {
    const o = lista.find(r => osuma(r, h, ''));
    if (o) return String(o.tiedosto);
  }
  const pelkka = lista.find(r => r && n(r.teksti) === t && r.tiedosto && !hahmot.length);
  return pelkka ? String(pelkka.tiedosto) : null;
}
