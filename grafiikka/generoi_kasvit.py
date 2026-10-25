#!/usr/bin/env python3
"""ERÄ 1: kasvillisuus low-poly GLB:inä (mallit/kasvit/). Aja: python3 generoi_kasvit.py
Metrit, +Y ylös, +Z edessä, origo rungon tyvessä maassa, verteksivärit COLOR_0, tasasävytys."""
import json, struct, math, os, random
import numpy as np
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'mallit', 'kasvit')
PREV = '/workspace/jahti_varmuus/esikatselu_era1_puut.png'
def c(h): return tuple(int(h[i:i+2], 16)/255 for i in (1, 3, 5))
LUMI, LUMI_V = c('#E8EEF8'), c('#C4D0E4')
NEULA, NEULA_T = c('#2E4A44'), c('#22383A')
KUORI_T, KUORI_M = c('#4A3E3A'), c('#9A5A40')
KOIVU, LAIKKU = c('#DCDEE2'), c('#2A2A2E')
PUU_P = c('#B89A78')

class M:
    def __init__(s): s.t = []  # (p0,p1,p2,col)
    def tri(s, a, b, cc, col): s.t.append((np.array(a, float), np.array(b, float), np.array(cc, float), col))
    def quad(s, a, b, cc, d, col): s.tri(a, b, cc, col); s.tri(a, cc, d, col)

def ring(cx, y, cz, r, n, rot=0, ax=None):
    return [(cx + r*math.cos(rot + 2*math.pi*i/n), y, cz + r*math.sin(rot + 2*math.pi*i/n)) for i in range(n)]

def cyl(m, p0, p1, r0, r1, n, colf, cap=False):
    """Sylinteri mielivaltaiseen suuntaan; colf(i, t) -> väri sivulle i."""
    p0, p1 = np.array(p0, float), np.array(p1, float); d = p1 - p0; d /= np.linalg.norm(d)
    u = np.cross(d, [0, 0, 1] if abs(d[2]) < .9 else [1, 0, 0]); u /= np.linalg.norm(u); v = np.cross(d, u)
    A = [p0 + r0*(math.cos(2*math.pi*i/n)*u + math.sin(2*math.pi*i/n)*v) for i in range(n)]
    B = [p1 + r1*(math.cos(2*math.pi*i/n)*u + math.sin(2*math.pi*i/n)*v) for i in range(n)]
    for i in range(n):
        j = (i+1) % n; col = colf(i)
        if r1 > 1e-4: m.quad(A[i], A[j], B[j], B[i], col)
        else: m.tri(A[i], A[j], p1, col)
    if cap:
        for i in range(n): m.tri(p1, B[(i+1) % n], B[i], colf(-1))

def cone_tier(m, y0, y1, r, n, rot, droop, rnd):
    """Oksakerros: alareunan sakarat roikkuvat, yläpinnalla lumi (ulkoreuna vuoroin lumi/neula)."""
    top = np.array((0, y1, 0)); base = []
    for i in range(n):
        a = rot + 2*math.pi*i/n; rr = r*(1 + rnd.uniform(-.12, .12))
        base.append(np.array((rr*math.cos(a), y0 - (droop if i % 2 == 0 else 0), rr*math.sin(a))))
    inner = [(top*0.45 + b*0.55) + np.array((0, .05, 0)) for b in base]  # lumirajan kehä
    for i in range(n):
        j = (i+1) % n
        m.tri(top, inner[j], inner[i], LUMI)                      # lumikuorma yläosassa
        m.quad(inner[i], inner[j], base[j], base[i], LUMI_V if i % 3 == 0 else NEULA)
        m.tri(base[i], base[j], (0, y0 + .15*(y1-y0), 0), NEULA_T)  # alapinta

def kuusi(H, tiers, rmax, n=7, seed=0, slim=1.0, base=None):
    """base: alimman oksan (roikkuvan sakaran) korkeus metreinä; None = vanha H*.12-alku."""
    rnd = random.Random(seed); m = M()
    y = H*.12 if base is None else base + .18*rmax*slim  # sakaran roikkuma lisätään -> alin piste = base
    cyl(m, (0, 0, 0), (0, max(H*.25, y + .6), 0), .07+H*.012, .05+H*.008, 5, lambda i: KUORI_T)
    for k in range(tiers):
        f = k/(tiers-1); y1 = y + (H - y)*(.42 if k < tiers-1 else 1.0)
        if k == tiers-1: y1 = H
        r = rmax*(1-f*.82)*slim
        cone_tier(m, y, y1, r, n, rnd.uniform(0, 6), .18*r, rnd)
        y = y + (y1 - y)*.55
    return m

def koivu(H, seed):
    rnd = random.Random(seed); m = M()
    def bark(i): return LAIKKU if rnd.random() < .18 else KOIVU
    segs = 4; pts = [(0, 0, 0)]
    for s in range(1, segs+1): pts.append((rnd.uniform(-.15, .15), H*.85*s/segs, rnd.uniform(-.15, .15)))
    for s in range(segs):
        r0 = .16*(1-s/segs*.75); r1 = .16*(1-(s+1)/segs*.75)
        # pieniä alempia renkaita: laikuittainen väri
        cyl(m, pts[s], pts[s+1], r0, r1 if s < segs-1 else .02, 6, bark)
    for b in range(9):
        t = .4 + .55*b/8; y = H*.85*t; a = rnd.uniform(0, 6.28); L = H*.28*(1.1-t*.6)
        p0 = (math.cos(a)*.05, y, math.sin(a)*.05); p1 = (math.cos(a)*L, y + L*.9, math.sin(a)*L)
        cyl(m, p0, p1, .035, .006, 3, lambda i: c('#5A4A48') if i else KOIVU)
        if b % 3 == 0:  # pieni lumikertymä oksan tyvessä
            m.tri((p0[0], y+.06, p0[2]), (p0[0]+.12*math.cos(a+1.5), y+.02, p0[2]+.12*math.sin(a+1.5)),
                  (p0[0]+.25*math.cos(a), y+.12, p0[2]+.25*math.sin(a)), LUMI)
    m.tri(pts[-1], (pts[-1][0]+.3, H, pts[-1][2]), (pts[-1][0]-.2, H*.97, pts[-1][2]+.2), c('#5A4A48'))
    return m

def manty(H, seed):
    rnd = random.Random(seed); m = M()
    cyl(m, (0, 0, 0), (0, H*.35, 0), .2, .16, 6, lambda i: KUORI_T if i % 2 else c('#5E4A40'))
    cyl(m, (0, H*.35, 0), (rnd.uniform(-.3, .3), H*.9, rnd.uniform(-.3, .3)), .16, .07, 6, lambda i: KUORI_M)
    for k in range(3):  # latvuspilvet: litteät oktaedrit, lumi päällä
        cx, cz = rnd.uniform(-1, 1)*(1.2-k*.3), rnd.uniform(-1, 1)*(1.2-k*.3)
        y = H*(.68 + k*.1); r = H*(.16 - k*.03); h = r*.45; n = 7
        rg = ring(cx, y, cz, r, n, rnd.uniform(0, 6))
        rg = [(x+rnd.uniform(-.2, .2), yy+rnd.uniform(-.2, .2), z+rnd.uniform(-.2, .2)) for x, yy, z in rg]
        for i in range(n):
            j = (i+1) % n
            m.tri((cx, y+h, cz), rg[j], rg[i], LUMI if i % 3 else NEULA)
            m.tri((cx, y-h*.7, cz), rg[i], rg[j], NEULA_T)
        if k: cyl(m, (0, H*.6, 0), (cx, y, cz), .06, .04, 3, lambda i: KUORI_M)
    return m

def taimi(H, seed):
    m = M(); rnd = random.Random(seed)
    cyl(m, (0, 0, 0), (0, H*.15, 0), .03, .025, 4, lambda i: KUORI_T)
    for k, (y0, y1, r) in enumerate([(.08, .6, .38), (.4, .85, .26), (.65, 1.0, .14)]):
        cone_tier(m, H*y0, H*y1, H*r, 6, rnd.uniform(0, 6), H*.03, rnd)
    rg = ring(0, 0, 0, H*.5, 7)  # lumikinos tyvellä
    for i in range(7):
        j = (i+1) % 7; m.tri((0, H*.12, 0), rg[j], rg[i], LUMI)
    return m

def kanto(h, r, seed):
    m = M(); rnd = random.Random(seed); n = 8
    cyl(m, (0, 0, 0), (0, h, 0), r*1.2, r, n, lambda i: KUORI_T if i % 2 else c('#5E4A40'))
    rg = ring(0, h, 0, r*1.1, n); rg2 = ring(0, h+.03, 0, r*1.15, n)
    top = (0, h + r*.6, 0)
    for i in range(n):
        j = (i+1) % n
        m.tri(top, rg2[j], rg2[i], LUMI if i % 4 else LUMI_V)
        m.quad(rg[i], rg[j], rg2[j], rg2[i], LUMI_V)
    for k in range(3):  # juurenniskat
        a = rnd.uniform(0, 6.28) + k*2.1
        cyl(m, (0, h*.3, 0), (math.cos(a)*r*2.4, 0, math.sin(a)*r*2.4), r*.35, r*.1, 3, lambda i: KUORI_T)
    return m

def kaatunut(L=5.0):
    m = M(); r = .22; n = 7
    p0, p1 = (0, r*.8, -L/2), (0, r*.6, L/2)
    cyl(m, p0, p1, r, r*.7, n, lambda i: LUMI if i in (1, 2, 3) else (KUORI_T if i % 2 else c('#5E4A40')), cap=True)
    cyl(m, p1, p0, r*.7, r, n, lambda i: PUU_P, cap=True) if False else None
    # tyven pää (sahattu/katkennut pinta) + lumiharja koko pituudelle
    for i in range(n):
        a0 = 2*math.pi*i/n; a1 = 2*math.pi*(i+1)/n
        m.tri(p0, (r*math.cos(a1), p0[1]+r*math.sin(a1), p0[2]), (r*math.cos(a0), p0[1]+r*math.sin(a0), p0[2]), PUU_P)
    for s in range(5):
        z0 = -L/2 + L*s/5; z1 = z0 + L/5; t0, t1 = s/5, (s+1)/5
        rr0 = r*(1-.3*t0)+.07; rr1 = r*(1-.3*t1)+.07
        y0 = r*.8 + (-.2*r)*t0; y1 = r*.8 + (-.2*r)*t1
        m.quad((-rr0*.7, y0+rr0*.5, z0), (0, y0+rr0+.08, z0), (0, y1+rr1+.08, z1), (-rr1*.7, y1+rr1*.5, z1), LUMI)
        m.quad((0, y0+rr0+.08, z0), (rr0*.7, y0+rr0*.5, z0), (rr1*.7, y1+rr1*.5, z1), (0, y1+rr1+.08, z1), LUMI_V if s % 2 else LUMI)
    for a, z in ((.8, -.6), (-1.0, .9), (.6, 1.8)):  # oksantyngät
        q = (math.cos(a)*r, .2+math.sin(a)*r, z); cyl(m, q, (q[0]+.5*math.cos(a), q[1]+.4, z+.2), .04, .01, 3, lambda i: KUORI_T)
    return m

def write_glb(m, path, name):
    P, N, C = [], [], []
    for a, b, cc, col in m.t:
        nrm = np.cross(b-a, cc-a); l = np.linalg.norm(nrm); nrm = nrm/l if l > 0 else np.array((0, 1, 0))
        for p in (a, b, cc): P.append(p); N.append(nrm); C.append(col)
    P = np.array(P, np.float32); N = np.array(N, np.float32); C = np.array(C, np.float32)
    bufs = [P.tobytes(), N.tobytes(), C.tobytes()]; off = 0; views = []
    for bb in bufs: views.append({"buffer": 0, "byteOffset": off, "byteLength": len(bb), "target": 34962}); off += len(bb)
    bin_ = b''.join(bufs); cnt = len(P)
    acc = [{"bufferView": 0, "componentType": 5126, "count": cnt, "type": "VEC3", "min": P.min(0).tolist(), "max": P.max(0).tolist()},
           {"bufferView": 1, "componentType": 5126, "count": cnt, "type": "VEC3"},
           {"bufferView": 2, "componentType": 5126, "count": cnt, "type": "VEC3"}]
    g = {"asset": {"version": "2.0", "generator": "generoi_kasvit.py"}, "scene": 0, "scenes": [{"nodes": [0]}],
         "nodes": [{"name": name, "mesh": 0}], "meshes": [{"name": name, "primitives": [{"attributes": {"POSITION": 0, "NORMAL": 1, "COLOR_0": 2}, "material": 0}]}],
         "materials": [{"name": "verteksivari", "pbrMetallicRoughness": {"baseColorFactor": [1, 1, 1, 1], "metallicFactor": 0, "roughnessFactor": 1}}],
         "accessors": acc, "bufferViews": views, "buffers": [{"byteLength": len(bin_)}]}
    js = json.dumps(g, separators=(',', ':')).encode(); js += b' '*((4-len(js) % 4) % 4); bin_ += b'\0'*((4-len(bin_) % 4) % 4)
    with open(path, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, 12+8+len(js)+8+len(bin_)))
        f.write(struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(bin_), 0x004E4942) + bin_)
    return len(m.t), P.min(0), P.max(0)

MALLIT = [
    ('kuusi_1', kuusi(6.0, 4, 1.7, seed=1, base=1.3)), ('kuusi_2', kuusi(9.5, 5, 2.3, seed=2, base=1.3)),
    ('kuusi_3', kuusi(13.0, 6, 2.4, seed=3, slim=.85, base=1.8)), ('kuusi_4', kuusi(16.0, 6, 3.4, n=8, seed=4, base=1.8)),
    ('koivu_1', koivu(11.0, 5)), ('koivu_2', koivu(8.0, 6)),
    ('manty_1', manty(14.0, 7)), ('manty_2', manty(11.0, 8)),
    ('taimi_1', taimi(0.6, 9)), ('taimi_2', taimi(1.4, 10)),
    ('kanto_1', kanto(.45, .22, 11)), ('kanto_2', kanto(.7, .3, 12)),
    ('kaatunut_runko_1', kaatunut()),
]

def preview(info):
    W, Hh = 2900, 900; img = Image.new('RGB', (W, Hh), (206, 218, 234)); d = ImageDraw.Draw(img)
    d.rectangle((0, 780, W, Hh), fill=(232, 238, 248)); sc = 44; x = 80
    L = np.array((-.5, .8, .6)); L /= np.linalg.norm(L); ca, sa = math.cos(.5), math.sin(.5)
    for name, m in MALLIT:
        tris = []
        for a, b, cc, col in m.t:
            ps = []
            for p in (a, b, cc):
                X = p[0]*ca + p[2]*sa; Z = -p[0]*sa + p[2]*ca; ps.append((X, p[1] - Z*.12, Z))
            nrm = np.cross(b-a, cc-a); l = np.linalg.norm(nrm); nrm = nrm/l if l else nrm
            sh = .55 + .45*max(0, nrm @ L); tris.append((sum(q[2] for q in ps), ps, tuple(int(255*min(1, ch*sh*1.05)) for ch in col)))
        xs = [q[0] for _, ps, _ in tris for q in ps]; w = (max(xs)-min(xs))*sc; cx = x + w/2 - min(xs)*sc - (max(xs)+min(xs))/2*sc*0 
        cx = x - min(xs)*sc
        for _, ps, col in sorted(tris, key=lambda t: t[0]):
            d.polygon([(cx + q[0]*sc, 780 - q[1]*sc) for q in ps], fill=col)
        d.text((x, 800), name, fill=(40, 50, 70)); d.text((x, 815), f"{info[name][0]} tris, {info[name][1]:.1f} m", fill=(40, 50, 70))
        x += max(w, 70) + 40
    img.save(PREV)

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True); info = {}
    for name, m in MALLIT:
        n, mn, mx = write_glb(m, os.path.join(OUT, name + '.glb'), name); info[name] = (n, mx[1])
        print(f"{name}.glb  {n} tris  korkeus {mx[1]:.2f} m  x[{mn[0]:.1f},{mx[0]:.1f}] z[{mn[2]:.1f},{mx[2]:.1f}]")
    preview(info)
