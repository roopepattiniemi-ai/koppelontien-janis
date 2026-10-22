#!/usr/bin/env python3
"""Tienvarsi + rakennukset (talvi) low-poly GLB:inä. Aja: python3 generoi_tienvarsi.py
Metrit, +Y ylös, +Z edessä, origo maassa, COLOR_0, tasasävytys. Tuottaa mallit/tienvarsi/, mallit/rakennukset/,
tekstuurit/kyltit/kyltti_mantykoski.png ja /workspace/jahti_varmuus/esikatselu_tienvarsi.png."""
import json, struct, math, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont
os.chdir(os.path.dirname(os.path.abspath(__file__)))
TV, RK = 'mallit/tienvarsi/', 'mallit/rakennukset/'
os.makedirs(TV, exist_ok=True); os.makedirs(RK, exist_ok=True)
def c(h): return tuple(int(h[i:i+2], 16)/255 for i in (1, 3, 5))
LUMI, LUMI_V = c('#E8EEF8'), c('#C4D0E4')
HARMAA, HARMAA_T = c('#8A9098'), c('#5A6068'); SINKKI = c('#A4AAB2')
PUUP, PUUP_T = c('#6A5C50'), c('#4E443C'); POSL = c('#D8DCE0')
PUNA, PUNA_T = c('#8B2A1F'), c('#6E2018'); VALK = c('#E4E6E8')
PELTI, PELTI_T = c('#7A8088'), c('#5C626A'); KIVI = c('#6C6E72')
LASI, OVI = c('#1C2430'), c('#5E1C16'); PILARI = c('#6A5040')
RED, WHITE, ORANSSI = c('#C8201C'), c('#F0F0F0'), c('#E86A1A'); SININEN = c('#0057A8')

class M:
    def __init__(s): s.P = []; s.C = []; s.tex = []   # tex: (p,uv)
    def tri(s, a, b, d, col):
        s.P += [np.array(a, float), np.array(b, float), np.array(d, float)]; s.C += [col]*3
    def quad(s, a, b, d, e, col): s.tri(a, b, d, col); s.tri(a, d, e, col)
    def quad_o(s, a, b, d, e, col, ulos):  # kääntää kiertosuunnan niin että normaali osoittaa 'ulos'
        n = np.cross(np.subtract(b, a), np.subtract(d, a))
        if n @ np.asarray(ulos, float) < 0: a, b, d, e = b, a, e, d
        s.quad(a, b, d, e, col)
    def box(s, lo, hi, col, top=None, bottom=True):
        x0, y0, z0 = lo; x1, y1, z1 = hi; t = top or col
        s.quad((x0,y0,z1),(x1,y0,z1),(x1,y1,z1),(x0,y1,z1),col); s.quad((x1,y0,z0),(x0,y0,z0),(x0,y1,z0),(x1,y1,z0),col)
        s.quad((x1,y0,z1),(x1,y0,z0),(x1,y1,z0),(x1,y1,z1),col); s.quad((x0,y0,z0),(x0,y0,z1),(x0,y1,z1),(x0,y1,z0),col)
        s.quad((x0,y1,z1),(x1,y1,z1),(x1,y1,z0),(x0,y1,z0),t)
        if bottom: s.quad((x0,y0,z0),(x1,y0,z0),(x1,y0,z1),(x0,y0,z1),col)
    def cyl(s, p0, p1, r0, r1, n, col, cap=True, capcol=None):
        p0, p1 = np.array(p0, float), np.array(p1, float); d = (p1-p0)/np.linalg.norm(p1-p0)
        u = np.cross(d, [0,0,1] if abs(d[2]) < .9 else [1,0,0]); u /= np.linalg.norm(u); v = np.cross(d, u)
        A = [p0 + r0*(math.cos(2*math.pi*i/n)*u + math.sin(2*math.pi*i/n)*v) for i in range(n)]
        B = [p1 + r1*(math.cos(2*math.pi*i/n)*u + math.sin(2*math.pi*i/n)*v) for i in range(n)]
        for i in range(n):
            j = (i+1) % n; s.quad(A[j], A[i], B[i], B[j], col)
            if cap: s.tri(p1, B[i], B[(i+1)%n], capcol or col)
    def ntris(s): return len(s.P)//3 + len(s.tex)//3

def kirjoita(polku, nimi, m, tyhjat=(), tex_uri=None):
    P = np.array(m.P, 'f4'); C = np.array(m.C, 'f4'); N = np.zeros_like(P)
    for k in range(0, len(P), 3):
        n = np.cross(P[k+1]-P[k], P[k+2]-P[k]); l = np.linalg.norm(n); N[k:k+3] = n/l if l > 1e-9 else (0,1,0)
    bufs = [P, N, C]; acc = []; bv = []; off = 0; bin_ = b''
    def add(arr, typ, mm=False):
        nonlocal off, bin_
        b = arr.tobytes(); bv.append({"buffer":0,"byteOffset":off,"byteLength":len(b)}); bin_ += b; off += len(b)
        a = {"bufferView":len(bv)-1,"componentType":5126,"count":len(arr),"type":typ}
        if mm: a["min"] = arr.min(0).tolist(); a["max"] = arr.max(0).tolist()
        acc.append(a); return len(acc)-1
    prim = [{"attributes":{"POSITION":add(P,'VEC3',True),"NORMAL":add(N,'VEC3'),"COLOR_0":add(C,'VEC3')},"material":0}]
    mats = [{"name":nimi,"pbrMetallicRoughness":{"baseColorFactor":[1,1,1,1],"metallicFactor":0,"roughnessFactor":1}}]
    g = {}
    if m.tex:
        TP = np.array([p for p,_ in m.tex], 'f4'); TU = np.array([u for _,u in m.tex], 'f4'); TN = np.zeros_like(TP)
        for k in range(0, len(TP), 3):
            n = np.cross(TP[k+1]-TP[k], TP[k+2]-TP[k]); TN[k:k+3] = n/np.linalg.norm(n)
        prim.append({"attributes":{"POSITION":add(TP,'VEC3',True),"NORMAL":add(TN,'VEC3'),"TEXCOORD_0":add(TU,'VEC2')},"material":1})
        mats.append({"name":nimi+"_teksti","pbrMetallicRoughness":{"baseColorTexture":{"index":0},"metallicFactor":0,"roughnessFactor":1}})
        g.update(textures=[{"source":0,"sampler":0}], images=[{"uri":tex_uri}],
                 samplers=[{"magFilter":9728,"minFilter":9728,"wrapS":33071,"wrapT":33071}])
    nodes = [{"name":nimi,"mesh":0,"children":list(range(1, len(tyhjat)+1))}] + [{"name":n,"translation":list(map(float,t))} for n,t in tyhjat]
    g.update({"asset":{"version":"2.0","generator":"generoi_tienvarsi.py"},"scene":0,"scenes":[{"nodes":[0]}],"nodes":nodes,
        "meshes":[{"name":nimi,"primitives":prim}],"materials":mats,"accessors":acc,"bufferViews":bv,"buffers":[{"byteLength":len(bin_)}]})
    j = json.dumps(g).encode(); j += b' '*(-len(j)%4); bin_ += b'\0'*(-len(bin_)%4)
    with open(polku, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, 28+len(j)+len(bin_)))
        f.write(struct.pack('<II', len(j), 0x4E4F534A)+j); f.write(struct.pack('<II', len(bin_), 0x004E4942)+bin_)
    return m.ntris()

TULOS = {}; MALLIT = {}
def tallenna(polku, nimi, m, tyhjat=(), tex_uri=None):
    TULOS[polku] = (kirjoita(polku, nimi, m, tyhjat, tex_uri), tyhjat); MALLIT[polku] = m

# ---------- katuvalo ----------
m = M()
m.cyl((0,0,0), (0,7.6,0), .09, .06, 8, HARMAA)
m.cyl((0,7.4,0), (0,7.85,1.0), .045, .04, 6, HARMAA)          # kaareva puomi 2 osana
m.cyl((0,7.85,1.0), (0,7.95,1.7), .04, .04, 6, HARMAA)
m.box((-.16,7.82,1.6), (.16,8.0,2.25), HARMAA_T, top=LUMI)       # valaisinkotelo, lumi päällä
m.quad((-.13,7.81,1.65), (.13,7.81,1.65), (.13,7.81,2.2), (-.13,7.81,2.2), c('#F4ECD0'))  # lasi alapinnassa
m.box((-.12,8.0,1.68), (.12,8.05,2.15), LUMI)
tallenna(TV+'katuvalo.glb', 'katuvalo', m, [('valo', (0, 7.78, 1.92))])

# ---------- sähköpylväs ----------
m = M()
m.cyl((0,0,0), (0,9.0,0), .14, .11, 8, PUUP, capcol=LUMI)
m.box((-1.0,8.35,-.06), (1.0,8.5,.06), PUUP_T, top=LUMI)        # poikkiorsi X-suunnassa
m.cyl((-.5,8.42,0), (0,8.0,0), .03, .03, 4, PUUP_T, cap=False)  # vinotuki
JOHTO = []
for k, x in enumerate((-.85, .85)):
    m.cyl((x,8.5,0), (x,8.72,0), .05, .035, 6, POSL); JOHTO.append((f'johto_{2*k+1}', (x, 8.72, 0)))
m.cyl((0,9.0,0), (0,9.22,0), .05, .035, 6, POSL)
JOHTO.insert(1, ('johto_2', (0, 9.22, 0))); JOHTO = [(f'johto_{i+1}', p) for i, (_, p) in enumerate(JOHTO)]
tallenna(TV+'sahkopylvas.glb', 'sahkopylvas', m, JOHTO)

# ---------- väistämismerkki (kärki alas) ----------
def kolmio(y, s, z):  # yläreuna vaakasuora, kärki alas; s = sivu
    h = s*math.sqrt(3)/2; return [(-s/2, y+h, z), (s/2, y+h, z), (0, y, z)]
m = M()
m.cyl((0,0,-.05), (0,2.05,-.05), .03, .03, 6, HARMAA, capcol=LUMI)
S, Y0 = .9, 1.35; H = S*math.sqrt(3)/2
f, b = kolmio(Y0, S, .0), kolmio(Y0, S, -.02)
m.tri(f[0], f[2], f[1], RED); m.tri(b[0], b[1], b[2], HARMAA)
for i in range(3):
    j = (i+1) % 3; m.quad(f[i], b[i], b[j], f[j], HARMAA)
cx, cy = 0, Y0 + H/3; inn = [(cx+(p[0]-cx)*.62, cy+(p[1]-cy)*.62, .004) for p in f]
m.tri(inn[0], inn[1], inn[2], WHITE) if np.cross(np.subtract(inn[1],inn[0]),np.subtract(inn[2],inn[0]))[2] > 0 else m.tri(inn[0], inn[2], inn[1], WHITE)
m.box((-S/2+.02, Y0+H, -.05), (S/2-.02, Y0+H+.05, .03), LUMI)  # lumihattu
tallenna(TV+'vaistamismerkki.glb', 'vaistamismerkki', m)

# ---------- opaste Mäntykoski ----------
FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
BL = (0,87,168,255); W = (255,255,255,255)
im = Image.new('RGBA', (256,64), BL); d = ImageDraw.Draw(im); d.fontmode = '1'
d.rectangle([2,2,253,61], outline=W, width=2)
s = 30
while d.textlength('Mäntykoski', font=ImageFont.truetype(FB, s)) > 180: s -= 1
d.text((12,33), 'Mäntykoski', font=ImageFont.truetype(FB, s), fill=W, anchor='lm')
d.polygon([(204,26),(226,26),(226,16),(246,32),(226,48),(226,38),(204,38)], fill=W)   # nuoli oikealle
im.save('tekstuurit/kyltit/kyltti_mantykoski.png')
m = M(); KW, KH, KY = 1.6, .4, 1.6
for x in (-.6, .6): m.cyl((x,0,-.04), (x,2.05,-.04), .03, .03, 6, HARMAA, capcol=LUMI)
m.box((-KW/2,KY,-.03), (KW/2,KY+KH,0), SININEN, top=LUMI)
m.box((-KW/2+.02,KY+KH,-.04), (KW/2-.02,KY+KH+.04,.01), LUMI)
q = [(-KW/2,KY,.002),(KW/2,KY,.002),(KW/2,KY+KH,.002),(-KW/2,KY+KH,.002)]; uv = [(0,1),(1,1),(1,0),(0,0)]
for i in (0,1,2,0,2,3): m.tex.append((q[i], uv[i]))
tallenna(TV+'opaste_mantykoski.glb', 'opaste_mantykoski', m, tex_uri='../../tekstuurit/kyltit/kyltti_mantykoski.png')

# ---------- aurausviitta ----------
m = M()
m.box((-.012,0,-.012), (.012,1.6,.012), c('#C8B060'))            # keltainen lasikuitukeppi
for k in range(4): m.box((-.016,1.6+k*.1,-.016), (.016,1.7+k*.1,.016), RED if k%2==0 else WHITE)
m.box((-.03,1.75,.012), (.03,1.95,.02), ORANSSI)               # heijastin tien puolelle (+Z)
tallenna(TV+'aurausviitta.glb', 'aurausviitta', m)

# ---------- rakennukset ----------
def harjakatto(m, w, d, yr, hr, ov, pelti=PELTI, lumi=True):
    """Harja X-suunnassa? Ei: harja Z-suunnassa (pitkä sivu Z). w=leveys X, d=pituus Z, yr=räystäskorkeus, hr=harjan korkeus."""
    x0 = w/2+ov; z0 = d/2+ov; yo = yr - ov*(hr-yr)/(w/2); t = .08
    for sg in (1, -1):
        A, B = (sg*x0, yo, -z0), (sg*x0, yo, z0); Cc, D = (0, hr, z0), (0, hr, -z0)
        if sg < 0: A, B, Cc, D = B, A, D, Cc
        m.quad(A, B, Cc, D, pelti)
        m.quad(*(tuple(np.array(p)-(0,t,0)) for p in (D, Cc, B, A)), PELTI_T)
        m.quad(tuple(np.array(A)-(0,t,0)), tuple(np.array(B)-(0,t,0)), B, A, PELTI_T)
        if lumi:  # lumikuorma: paksu laatta, reunalla jäävä pelti näkyviin
            nrm = np.array((sg*(hr-yo), x0, 0)); nrm /= np.linalg.norm(nrm); L = .18
            a = np.array(A)*.92 + np.array(D)*.08 + (0,0,.0); bb = np.array(B)*.92 + np.array(Cc)*.08
            cc, dd = np.array(Cc), np.array(D)
            if sg < 0: a, bb = np.array(A)*.92+np.array(D)*.08, np.array(B)*.92+np.array(Cc)*.08
            a[2] *= .97; bb[2] *= .97; cc[2] *= .97; dd[2] *= .97
            ta, tb, tc, td = (p + nrm*L for p in (a, bb, cc, dd))
            m.quad_o(ta, tb, tc, td, LUMI, nrm); m.quad_o(a, bb, tb, ta, LUMI_V, (sg,-.3,0))
            m.quad_o(bb, cc, tc, tb, LUMI_V, (0,0,1)); m.quad_o(dd, a, ta, td, LUMI_V, (0,0,-1))
    # päädyt
    for sz in (1, -1):
        zz = sz*d/2; p = [(-w/2, yr, zz), (w/2, yr, zz), (0, hr - .05, zz)]
        if sz > 0: m.tri(*p, PUNA)
        else: m.tri(p[1], p[0], p[2], PUNA)

def ikkuna(m, keski, leveys, korkeus, normaali):
    """Valkoinen puite + tumma lasi seinässä; normaali '+x','-x','+z','-z'."""
    x, y, z = keski; e = .05; hw, hh = leveys/2, korkeus/2
    ax = 0 if normaali[1] == 'x' else 2; sg = 1 if normaali[0] == '+' else -1
    def p(u, v, n):  # u vaakasuunta seinällä
        q = [0, y+v, 0]; q[ax] = keski[ax] + sg*n; q[2-ax] = keski[2-ax] + u; return q
    lo, hi = p(-hw-e, -hh-e, 0), p(hw+e, hh+e, .04)
    m.box(tuple(np.minimum(lo, hi)), tuple(np.maximum(lo, hi)), VALK, bottom=False)
    a, b, cc, d = p(-hw, -hh, .045), p(hw, -hh, .045), p(hw, hh, .045), p(-hw, hh, .045)
    o = [0, 0, 0]; o[ax] = sg; m.quad_o(a, b, cc, d, LASI, o)
    a, b = p(-.025, -hh, .05), p(.025, hh, .05)          # välipuite
    m.box(tuple(np.minimum(a, b)), tuple(np.maximum(a, b)), VALK, bottom=False)

def rakennus(w, d, yr, hr, ov, sokkeli=.4, ikkunat=(), ovet=()):
    m = M()
    m.box((-w/2-.05, 0, -d/2-.05), (w/2+.05, sokkeli, d/2+.05), KIVI, top=LUMI)
    m.box((-w/2, sokkeli, -d/2), (w/2, yr, d/2), PUNA, bottom=False)
    for sx in (1, -1):
        for sz in (1, -1):   # nurkkalaudat
            x, z = sx*w/2, sz*d/2
            m.box((min(x, x+sx*.06)-.06*(sx<0)*0, sokkeli, min(z, z+sz*.06)), (max(x, x+sx*.06), yr, max(z, z+sz*.06)), VALK, bottom=False)
    m.box((-w/2-.02, yr-.18, -d/2-.02), (w/2+.02, yr, d/2+.02), VALK, bottom=False)  # räystäslauta
    harjakatto(m, w, d, yr, hr, ov)
    for ik in ikkunat: ikkuna(m, *ik)
    for (x, z, ow, oh, n) in ovet:  # ovet +z/-z/+x seinään
        if n == '+z': m.box((x-ow/2-.06, sokkeli, z), (x+ow/2+.06, sokkeli+oh+.06, z+.05), VALK, bottom=False); m.box((x-ow/2, sokkeli, z+.05), (x+ow/2, sokkeli+oh, z+.07), OVI, bottom=False)
        if n == '+x': m.box((x, sokkeli, z-ow/2-.06), (x+.05, sokkeli+oh+.06, z+ow/2+.06), VALK, bottom=False); m.box((x+.05, sokkeli, z-ow/2), (x+.07, sokkeli+oh, z+ow/2), OVI, bottom=False)
    return m

# navetta: 10 x 24 m, räystäs 4.2, harja 7.6
W_, D_ = 10, 24
ik = [((W_/2, 2.2, z), .9, .7, '+x') for z in (-9, -5, -1, 3, 7)] + [((-W_/2, 2.2, z), .9, .7, '-x') for z in (-9, -3, 3, 9)]
ik += [((0, 5.6, D_/2), .8, .8, '+z')]
m = rakennus(W_, D_, 4.2, 7.6, .5, sokkeli=1.0, ikkunat=ik, ovet=[(-2, D_/2, 2.8, 2.8, '+z'), (W_/2, 9.6, 1.0, 2.0, '+x')])
m.box((-.5, 7.2, 4), (.5, 8.6, 5), VALK, top=LUMI)   # ilmanvaihtohattu
tallenna(RK+'maatalous_navetta.glb', 'maatalous_navetta', m)

ik = [((3, 1.7, -2), .7, .6, '+x'), ((0, 4.0, 5), .6, .6, '+z')]
m = rakennus(6, 10, 3.2, 5.6, .4, sokkeli=.3, ikkunat=ik, ovet=[(0, 5, 2.4, 2.4, '+z')])
tallenna(RK+'maatalous_varasto.glb', 'maatalous_varasto', m)

m = rakennus(3.2, 4, 2.3, 3.6, .35, sokkeli=.35, ovet=[(0, 2, .8, 1.6, '+z')])
for sx in (-1, 1):
    for sz in (-1, 1): m.box((sx*1.4-.15, 0, sz*1.8-.15), (sx*1.4+.15, .35, sz*1.8+.15), KIVI, top=LUMI)  # kulmakivet
m.box((-.6, .1, 2.0), (.6, .35, 2.5), KIVI, top=LUMI)  # porraskivi
tallenna(RK+'aitta.glb', 'aitta', m)

# katos: avoin konekatos 6 x 12 m, pulpetti-/harjakatto
m = M(); W_, D_, YR, HR = 6, 12, 3.6, 5.0
for x in (-W_/2, W_/2):
    for z in (-6, -2, 2, 6): m.box((x-.1, 0, z-.1), (x+.1, YR, z+.1), PILARI, bottom=False)
    m.box((x-.12, YR-.25, -D_/2-.1), (x+.12, YR, D_/2+.1), PILARI)   # palkki
m.box((-W_/2, 0, -D_/2-.1), (W_/2, YR, -D_/2), PUNA, bottom=False)  # takaseinä
harjakatto(m, W_, D_, YR, HR, .4)
m.P = m.P; # päädyt punaisina laudoitettuina kolmioina: ok
tallenna(RK+'katos.glb', 'katos', m)

# ---------- esikatselu ----------
def proj(m, ax, sc, ox, oy, d):
    P = np.array(m.P + [p for p,_ in m.tex]); C = list(m.C) + [SININEN]*len(m.tex)
    ya, pa = math.radians(35), math.radians(22)
    R1 = np.array([[math.cos(ya),0,math.sin(ya)],[0,1,0],[-math.sin(ya),0,math.cos(ya)]])
    R2 = np.array([[1,0,0],[0,math.cos(pa),-math.sin(pa)],[0,math.sin(pa),math.cos(pa)]])
    Q = P @ R1.T @ R2.T   # kamera katsoo -Z:n suuntaan, eli +z = lähellä
    for k in sorted(range(0, len(P), 3), key=lambda k: Q[k:k+3, 2].mean() + (2 if C[k] == LUMI else 0)):
        n = np.cross(Q[k+1]-Q[k], Q[k+2]-Q[k]); nl = np.linalg.norm(n)
        if nl < 1e-9 or n[2] <= 0: continue
        nw = np.cross(P[k+1]-P[k], P[k+2]-P[k]); nw /= np.linalg.norm(nw)
        L = .55 + .45*max(0, nw @ np.array((.4, .7, .6)) / np.linalg.norm((.4,.7,.6)))
        col = tuple(int(min(255, v*255*L)) for v in C[k])
        d.polygon([(ox + Q[k+i, 0]*sc, oy - Q[k+i, 1]*sc) for i in range(3)], fill=col)
pv = Image.new('RGB', (1600, 1000), (176, 190, 210)); d = ImageDraw.Draw(pv)
paikat = [(TV+'katuvalo.glb', 30, 120, 420), (TV+'sahkopylvas.glb', 30, 300, 420), (TV+'vaistamismerkki.glb', 90, 450, 420),
          (TV+'opaste_mantykoski.glb', 90, 640, 420), (TV+'aurausviitta.glb', 120, 820, 420),
          (RK+'maatalous_navetta.glb', 22, 1250, 480), (RK+'maatalous_varasto.glb', 30, 300, 950), (RK+'aitta.glb', 60, 700, 950), (RK+'katos.glb', 30, 1200, 950)]
for pth, sc, x, y in paikat:
    proj(MALLIT[pth], 2, sc, x, y, d); d.text((x-60, y+10), os.path.basename(pth) + f' {TULOS[pth][0]}', fill=(0,0,0))
kt = Image.open('tekstuurit/kyltit/kyltti_mantykoski.png').resize((512,128), Image.NEAREST); pv.paste(kt, (560, 20), kt)
pv.save('/workspace/jahti_varmuus/esikatselu_tienvarsi.png')
for k, (t, ty) in TULOS.items(): print(k, t, ty)
