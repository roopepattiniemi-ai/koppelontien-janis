// Lumisade. Vanha jälki haalistuu, ei katoa. Sateen jälkeen tuore jälki on koiralle selvä.
// Yöjälki (piste.yo) pysyy aina löydettävänä: hajunArvo voi olla 0, mutta koira ei ohita sitä.

export function lumiAlku(rand = Math.random) {
  return { on: false, voima: 0, sadeAika: 0, jalkeen: 0, tauko: 180 + rand() * 150, kesto: 0, kello: 0 };
}

// kello on yhteinen peliaika, jotta jäljen ikä ja synkka käyttävät samaa kelloa.
export function lumiPaivita(st, dt, rand = Math.random, kello = (st.kello || 0) + dt) {
  st.kello = kello;
  if (st.on) {
    st.sadeAika += dt;
    st.jalkeen = 0;
    if (st.sadeAika >= st.kesto) {
      st.on = false;
      st.sadeAika = 0;
      st.jalkeen = 0.01;
      st.tauko = 200 + rand() * 220;
    }
  } else {
    if (st.jalkeen > 0) st.jalkeen += dt;
    st.tauko -= dt;
    // Ei heti jahdin alussa. Tauon jälkeenkin sade on harvinainen ja lyhyt.
    if (st.tauko <= 0 && (st.kello || 0) >= 150 && rand() < dt / 160) {
      st.on = true;
      st.voima = 0.4 + rand() * 0.35;
      st.kesto = 12 + rand() * 14;
      st.sadeAika = 0;
      st.jalkeen = 0;
    }
  }
  return st;
}

export function lumiPaketti(st) {
  const r = v => Math.round(v * 10) / 10;
  return { on: st.on ? 1 : 0, v: r(st.voima || 0), s: r(st.sadeAika || 0), j: r(st.jalkeen || 0), k: r(st.kello || 0) };
}

export function lumiKayta(st, p) {
  if (!p) return st;
  st.on = !!p.on;
  st.voima = Number(p.v) || 0;
  st.sadeAika = Number(p.s) || 0;
  st.jalkeen = Number(p.j) || 0;
  st.kello = Number(p.k) || st.kello || 0;
  return st;
}

// Näkyvyys 1..0.5. Vanhimmat haalistuvat ensin, mikään jälki ei katoa.
export function nakyvyys(ika, lumi) {
  if (!lumi || (!lumi.on && !(lumi.jalkeen > 0))) return 1;
  const t = Math.max(0, Number(ika) || 0);
  const vanhuus = Math.min(1, t / 48);
  if (lumi.on) return 1 - 0.5 * vanhuus;
  if (t <= (lumi.jalkeen || 0) + 0.2) return 1;
  const yli = Math.min(1, Math.max(0, t - (lumi.jalkeen || 0)) / 48);
  return 1 - 0.5 * yli;
}

// 1 = täysi haju. 0 = lumi vei hajun ajosta. Yöjälkeä tämä ei koske (koira katsoo piste.yo).
export function hajunArvo(ika, lumi) {
  if (!lumi || (!lumi.on && !(lumi.jalkeen > 0))) return 1;
  const t = Math.max(0, Number(ika) || 0);
  if (lumi.on) {
    if (t <= 6) return 0.9;
    if (t >= 48) return 0;
    return Math.max(0, 0.9 * (1 - (t - 6) / 42));
  }
  if (t <= lumi.jalkeen + 0.2) return 1;
  return 0.15;
}

// Sateen jälkeen tuore jälki katkeaa harvemmin. Heikko haju sateessa katkeaa helpommin.
export function katkoKerroin(arvo, lumi) {
  if (!lumi || (!lumi.on && !(lumi.jalkeen > 0))) return 1;
  if (!lumi.on && lumi.jalkeen > 0 && arvo >= 0.95) return 0.35;
  if (lumi.on && arvo < 0.45) return 1.5;
  return 1;
}

export function jalkiIka(pt, lumi) {
  if (!lumi) return 0;
  if (!pt || pt.synty == null) return (lumi.on || lumi.jalkeen > 0) ? 1e3 : 0;
  return Math.max(0, (lumi.kello || 0) - pt.synty);
}
