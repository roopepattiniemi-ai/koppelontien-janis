// Taukovalikon grafiikka ja äänet. Laatutaso pysyy avaimessa jahti_laatu.
export const AVAIN = 'jahti_asetukset';
export const LAATU_AVAIN = 'jahti_laatu';
export const LAATU_KERTA = 'jahti_laatu_photo';
export const LAATU_OLETUS = 'korkea';
export const LAATUNIMI = { matala: 'Matala', keski: 'Keski', korkea: 'Photo realistic' };
export const RES_SKAALA = [0.5, 0.75, 1];
export const NAKYVYYS = [
  { id: 'lyhyt', nimi: 'Lyhyt', kerroin: 0.65 },
  { id: 'normaali', nimi: 'Normaali', kerroin: 1 },
  { id: 'pitka', nimi: 'Pitkä', kerroin: 1.4 },
];

export function oletusAsetukset() {
  return { res: RES_SKAALA.length - 1, naky: NAKYVYYS.length - 1, fps: false, yleinen: 1, radio: 1, puhe: 1 };
}

// Kerran tässä versiossa: automaattipudotuksen tallentama matalampi taso nollataan Photo realisticiin.
export function lataaLaatu(storage) {
  if (!storage) return LAATU_OLETUS;
  if (storage.getItem(LAATU_KERTA) !== '1') {
    storage.setItem(LAATU_AVAIN, LAATU_OLETUS);
    storage.setItem(LAATU_KERTA, '1');
    return LAATU_OLETUS;
  }
  const n = storage.getItem(LAATU_AVAIN);
  return Object.prototype.hasOwnProperty.call(LAATUNIMI, n) ? n : LAATU_OLETUS;
}

function nollaYksi(v, oletus) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : oletus;
}

export function puhdistaAsetukset(j) {
  const o = oletusAsetukset();
  if (!j || typeof j !== 'object') return o;
  const res = j.res | 0;
  if (res >= 0 && res < RES_SKAALA.length) o.res = res;
  const naky = j.naky | 0;
  if (naky >= 0 && naky < NAKYVYYS.length) o.naky = naky;
  o.fps = !!j.fps;
  o.yleinen = nollaYksi(j.yleinen, 1);
  o.radio = nollaYksi(j.radio, 1);
  o.puhe = nollaYksi(j.puhe, 1);
  return o;
}

export function lataaAsetukset(storage) {
  try { return puhdistaAsetukset(JSON.parse(storage.getItem(AVAIN) || 'null')); }
  catch { return oletusAsetukset(); }
}

export function talletaAsetukset(storage, a) {
  const p = puhdistaAsetukset(a);
  storage.setItem(AVAIN, JSON.stringify(p));
  return p;
}
