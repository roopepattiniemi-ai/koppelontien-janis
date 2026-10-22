#!/usr/bin/env python3
"""Koppelontien jänis – proseduraalinen grafiikkageneraattori (PIL + numpy, GLB käsin)."""
import os, math, json, struct, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont
R = os.path.dirname(os.path.abspath(__file__))
for d in ("tekstuurit","mallit","jaljet","hud"): os.makedirs(os.path.join(R,d),exist_ok=True)
P = lambda *a: os.path.join(R,*a)
rng = np.random.default_rng(7); random.seed(7)

def tnoise(n, cells, seed):
    """Seamless value noise n x n."""
    g = np.random.default_rng(seed).random((cells, cells))
    x = np.arange(n)*cells/n; i0 = x.astype(int); f = x-i0; f = f*f*(3-2*f); i1 = (i0+1)%cells
    a = g[np.ix_(i0,i0)]; b = g[np.ix_(i0,i1)]; c = g[np.ix_(i1,i0)]; d = g[np.ix_(i1,i1)]
    fy = f[:,None]; fx = f[None,:]
    return (a*(1-fx)+b*fx)*(1-fy)+(c*(1-fx)+d*fx)*fy
def fbm(n, seed, oct=((4,.5),(8,.3),(16,.2))):
    return sum(w*tnoise(n,c,seed+i) for i,(c,w) in enumerate(oct))
def quant(v, pal):
    v = np.clip(v,0,.999); idx = (v*len(pal)).astype(int)
    return Image.fromarray(np.array(pal,dtype=np.uint8)[idx])
SNOW = [(168,180,196),(190,200,214),(208,216,228),(222,228,238),(236,240,246),(248,250,252)]

# --- maastotekstuurit ---
n = fbm(64,1); quant((n-n.min())/(np.ptp(n))*.8+.15+rng.random((64,64))*.08, SNOW).save(P("tekstuurit","lumi_64.png"))
n = fbm(64,2); v = (n-n.min())/np.ptp(n)*.5+.4
x = np.arange(64); wob = 1.5*np.sin(np.arange(64)[:,None]*2*np.pi/64*2)
for c in (18,46):  # urat pystysuunnassa (tie kulkee V-suunnassa)
    dist = np.abs(x[None,:]-c-wob); v -= np.clip(1-dist/4,0,1)*.45
v += rng.random((64,64))*.08
img = quant(np.clip(v,0,1), [(120,118,116),(150,148,150)]+SNOW[1:]); img.save(P("tekstuurit","metsatie_64.png"))
n = fbm(64,3); v = (n-n.min())/np.ptp(n)*.5+.45
a = np.array(quant(v,SNOW))
r = np.random.default_rng(4)
for row in range(2,64,6):
    for col in range(0,64,3):
        if r.random()<.6:
            cx=(col+r.integers(0,2))%64; h=r.integers(1,4)
            for k in range(h): a[(row-k)%64,cx]=[(150,128,84),(178,152,98),(120,100,66)][r.integers(0,3)]
Image.fromarray(a).save(P("tekstuurit","pelto_64.png"))

# --- taivas ---
W,H=256,128; y=np.linspace(0,1,H)[:,None]
top=np.array([118,146,182]); bot=np.array([214,222,230])
sky = top*(1-y[...,None])+bot*y[...,None]; sky = np.repeat(sky,W,1)
cl = np.zeros((H,W))
for i,(c,w) in enumerate(((4,.5),(8,.3),(16,.2))):
    g=np.random.default_rng(20+i).random((c,c*2)); ys=np.arange(H)*c/H; xs=np.arange(W)*c*2/W
    y0=ys.astype(int); x0=xs.astype(int); fy=(ys-y0)[:,None]; fx=(xs-x0)[None,:]
    y1=np.minimum(y0+1,c-1); x1=(x0+1)%(c*2)
    cl+=w*((g[np.ix_(y0,x0)]*(1-fx)+g[np.ix_(y0,x1)]*fx)*(1-fy)+(g[np.ix_(y1,x0)]*(1-fx)+g[np.ix_(y1,x1)]*fx)*fy)
cl = np.clip((cl-.55)*3,0,1)*np.clip(1-np.abs(y-.45)*2.2,0,1)*.5
sky = sky*(1-cl[...,None])+np.array([238,240,244])*cl[...,None]
sky = (np.round(sky/6)*6).clip(0,255).astype(np.uint8); Image.fromarray(sky).save(P("tekstuurit","taivas_256x128.png"))

# --- puut ---
im = Image.new("RGBA",(64,128),(0,0,0,0)); d = ImageDraw.Draw(im)
d.rectangle((30,112,33,127),fill=(72,52,38,255))
for i in range(9):
    yb = 116-i*12; hw = 30-i*3.2; yt = yb-20
    d.polygon([(32-hw,yb),(32+hw,yb),(32,yt)],fill=(34,58,40,255))
    d.polygon([(32-hw,yb),(32-hw*.2,yb-3),(32,yt)],fill=(24,44,32,255))
    for k in range(int(hw)): 
        sx = 32-hw+random.random()*hw*2; d.point((sx,yb-1-random.random()*3),fill=(232,238,244,255))
    d.line((32-hw+2,yb-2,32-hw*.3,yb-6),fill=(226,232,240,255),width=2)
    d.line((32+hw*.3,yb-6,32+hw-2,yb-2),fill=(210,220,232,255),width=2)
d.polygon([(30,8),(34,8),(32,0)],fill=(236,240,246,255)); im.save(P("tekstuurit","kuusi_billboard.png"))
im = Image.new("RGBA",(48,128),(0,0,0,0)); d = ImageDraw.Draw(im)
def br(x,y,a,l,w):
    if l<4: return
    x2=x+math.cos(a)*l; y2=y-math.sin(a)*l; d.line((x,y,x2,y2),fill=(70,56,52,255),width=max(1,int(w)))
    br(x2,y2,a+.45+random.uniform(-.2,.2),l*.68,w*.6); br(x2,y2,a-.45+random.uniform(-.2,.2),l*.68,w*.6)
for yy in range(30,100,9): br(24,yy,math.pi/2+random.choice((-.7,.7)),12,1.5)
d.rectangle((22,10,26,127),fill=(228,226,218,255))
for yy in range(12,127,5): d.line((22+random.randint(0,2),yy,22+random.randint(2,4),yy),fill=(30,30,30,255))
d.rectangle((22,112,26,127),fill=(60,56,52,255)); d.line((22,100,26,108),fill=(40,40,40,255))
im.save(P("tekstuurit","koivu_billboard.png"))

# --- GLB-mallit ---
def ellipsoid(c,r,col,seg=8,ring=5):
    V=[];F=[]
    for i in range(ring+1):
        t=math.pi*i/ring
        for j in range(seg):
            p=2*math.pi*j/seg; V.append((c[0]+r[0]*math.sin(t)*math.cos(p),c[1]+r[1]*math.cos(t),c[2]+r[2]*math.sin(t)*math.sin(p)))
    for i in range(ring):
        for j in range(seg):
            a=i*seg+j;b=i*seg+(j+1)%seg;c2=a+seg;d2=b+seg
            if i>0: F.append((a,b,c2))
            if i<ring-1: F.append((b,d2,c2))
    return V,F,[col]*len(V)
def box(lo,hi,col):
    x0,y0,z0=lo;x1,y1,z1=hi
    V=[(x,y,z) for x in (x0,x1) for y in (y0,y1) for z in (z0,z1)]
    F=[(0,1,3),(0,3,2),(4,6,7),(4,7,5),(0,4,5),(0,5,1),(2,3,7),(2,7,6),(0,2,6),(0,6,4),(1,5,7),(1,7,3)]
    return V,F,[col]*8
def write_glb(path,parts):
    V=[];F=[];C=[]
    for v,f,c in parts:
        o=len(V);V+=v;F+=[(a+o,b+o,cc+o) for a,b,cc in f];C+=c
    V=np.array(V,np.float32);C=np.clip(np.array(C,np.float32)/255*np.array([.94,.97,1.04]),0,1);F=np.array(F,np.uint16)
    # tasainen sävytys: duplikoi kärjet per kolmio, ylhäältä valo vertex-väriin
    tv=V[F].reshape(-1,3); tc=C[F].reshape(-1,3)
    nrm=np.cross(tv[1::3]-tv[0::3],tv[2::3]-tv[0::3]); nrm/=np.linalg.norm(nrm,axis=1,keepdims=True)+1e-9
    nn=np.repeat(nrm,3,0).astype(np.float32); C4=np.hstack([tc,np.ones((len(tc),1))]).astype(np.float32)
    bins=[tv.tobytes(),nn.tobytes(),C4.tobytes()]; off=0;views=[]
    for b in bins: views.append({"buffer":0,"byteOffset":off,"byteLength":len(b)}); off+=len(b)
    gl={"asset":{"version":"2.0","generator":"generoi.py"},"scene":0,"scenes":[{"nodes":[0]}],"nodes":[{"mesh":0,"name":os.path.basename(path)[:-4]}],
        "meshes":[{"primitives":[{"attributes":{"POSITION":0,"NORMAL":1,"COLOR_0":2},"material":0}]}],
        "materials":[{"pbrMetallicRoughness":{"baseColorFactor":[1,1,1,1],"metallicFactor":0,"roughnessFactor":1}}],
        "accessors":[{"bufferView":0,"componentType":5126,"count":len(tv),"type":"VEC3","min":tv.min(0).tolist(),"max":tv.max(0).tolist()},
                     {"bufferView":1,"componentType":5126,"count":len(tv),"type":"VEC3"},
                     {"bufferView":2,"componentType":5126,"count":len(tv),"type":"VEC4"}],
        "bufferViews":views,"buffers":[{"byteLength":off}]}
    js=json.dumps(gl).encode(); js+=b" "*((4-len(js)%4)%4); bn=b"".join(bins)
    with open(path,"wb") as f:
        f.write(struct.pack("<III",0x46546C67,2,12+8+len(js)+8+len(bn)))
        f.write(struct.pack("<II",len(js),0x4E4F534A)+js+struct.pack("<II",len(bn),0x004E4942)+bn)
    return tv,tc,len(tv)//3
WH=(238,240,244);WG=(214,218,226);BK=(24,22,22);EY=(40,30,25)
hare=[ellipsoid((0,.16,-.04),(.11,.12,.2),WH),ellipsoid((0,.24,.17),(.065,.07,.09),WH,6,4),
 ellipsoid((.03,.36,.15),(.018,.09,.03),WG,5,3),ellipsoid((-.03,.36,.15),(.018,.09,.03),WG,5,3),
 box((.025,.37,.135),(.045,.44,.155),BK),box((-.045,.37,.135),(-.025,.44,.155),BK),
 ellipsoid((.07,.07,-.12),(.04,.07,.11),WG,6,4),ellipsoid((-.07,.07,-.12),(.04,.07,.11),WG,6,4),
 box((.055,0,-.06),(.095,.03,.10),WG),box((-.095,0,-.06),(-.055,.03,.10),WG),
 box((.03,0,.08),(.05,.12,.11),WH),box((-.05,0,.08),(-.03,.12,.11),WH),
 box((.055,.25,.22),(.07,.27,.24),EY),box((-.07,.25,.22),(-.055,.27,.24),EY),
 ellipsoid((0,.17,-.25),(.035,.035,.03),WH,5,3)]
TN=(186,120,58);TD=(150,92,44)
dog=[ellipsoid((0,.48,0),(.13,.14,.33),TN),ellipsoid((0,.565,-.02),(.115,.07,.26),BK,8,3),
 ellipsoid((0,.44,.2),(.09,.1,.12),WH,6,4),
 ellipsoid((0,.7,.37),(.075,.08,.1),TN,6,4),box((-.035,.63,.44),(.035,.69,.56),TN),box((-.02,.665,.555),(.02,.69,.575),BK),
 box((.06,.58,.36),(.08,.71,.4),TD),box((-.08,.58,.36),(-.06,.71,.4),TD),
 box((.03,.72,.45),(.05,.74,.47),EY),box((-.05,.72,.45),(-.03,.74,.47),EY),
 ellipsoid((0,.6,.3),(.06,.11,.07),TN,6,3),
 box((.04,.58,-.36),(.06,.6,-.22),BK),box((.04,.62,-.5),(.06,.64,-.35),TN)]
for sx in (-1,1):
    for z in (.22,-.22):
        dog.append(box((sx*.07-.025,.25,z-.03),(sx*.07+.025,.42,z+.03),TN))
        dog.append(box((sx*.07-.022,0,z-.028),(sx*.07+.022,.26,z+.032),WH))
models={}
for nm,parts in (("janis",hare),("ajokoira",dog)):
    models[nm]=write_glb(P("mallit",nm+".glb"),parts)

# --- haulikko ---
def gun(flash):
    im=Image.new("RGBA",(256,128),(0,0,0,0)); d=ImageDraw.Draw(im); ox,oy=(10,8) if flash else (0,0)
    W1=(110,66,34,255);W2=(80,46,24,255);W3=(140,88,46,255);M1=(46,48,54,255);M2=(80,84,92,255);M3=(20,20,24,255)
    if flash:
        cx,cy=135+ox,40+oy
        for r,c in ((30,(255,200,80,140)),(20,(255,230,140,220)),(10,(255,255,220,255))):
            pts=[(cx+math.cos(a)*r*(1 if i%2 else .45),cy+math.sin(a)*r*(1 if i%2 else .45)*.8) for i,a in enumerate(np.linspace(0,2*math.pi,17)[:-1])]
            d.polygon(pts,fill=c)
    # piiput (kaksi rinnakkain), perspektiivi oikeasta alakulmasta kohti keskustaa
    for k,(dx,col,hi) in enumerate(((0,M1,M2),(14,M1,M2))):
        d.polygon([(122+dx+ox,46+oy),(134+dx+ox,46+oy),(186+dx+ox,128+oy),(160+dx+ox,128+oy)],fill=col)
        d.line((124+dx+ox,47+oy,164+dx+ox,128+oy),fill=hi,width=2)
        d.ellipse((121+dx+ox,42+oy,135+dx+ox,50+oy),fill=M3)
    d.line((136+ox,46+oy,180+ox,128+oy),fill=M3,width=2)  # piippujen väli/tähtäinkisko
    d.ellipse((126+ox,43+oy,130+ox,47+oy),fill=(200,200,190,255))
    d.polygon([(150+ox,92+oy),(196+ox,92+oy),(224+ox,128+oy),(166+ox,128+oy)],fill=W1)  # etutukki
    d.line((152+ox,94+oy,170+ox,128+oy),fill=W3,width=2)
    for i in range(5): d.line((160+i*8+ox,96+oy,176+i*9+ox,128+oy),fill=W2)
    d.polygon([(196+ox,108+oy),(256,100+oy),(256,128),(214+ox,128)],fill=W2)  # perä/kädensija
    return im
gun(False).save(P("haulikko_fp.png")); gun(True).save(P("haulikko_laukaus.png"))

# --- jäljet ---
SH=(128,146,170)
def print_(d,box_,a):
    d.ellipse(box_,fill=SH+(a,))
def track(kind):
    im=Image.new("RGBA",(32,32),(0,0,0,0)); d=ImageDraw.Draw(im)
    if kind=="janis":
        print_(d,(5,2,13,15),150);print_(d,(19,2,27,15),150)   # takakäpälät edessä
        print_(d,(14,18,18,24),170);print_(d,(13,25,17,31),170) # etukäpälät takana peräkkäin
    else:
        for cx,cy in ((10,9),(22,21)):
            print_(d,(cx-4,cy-1,cx+4,cy+6),165)
            for tx,ty in ((-4,-3),(-1.5,-5),(1.5,-5),(4,-3)):
                print_(d,(cx+tx-1.5,cy+ty-1.5,cx+tx+1.5,cy+ty+1.5),165)
                d.point((cx+tx*1.3,cy+ty-2.5),fill=(90,104,128,200))
    im.save(P("jaljet",kind+"_jalki_32.png"))
track("janis");track("koira")

# --- HUD ---
im=Image.new("RGBA",(256,32),(0,0,0,0)); d=ImageDraw.Draw(im); F=ImageFont.load_default()
for i in range(32):
    x=i*8; h=10 if i%2==0 else 5; d.line((x,0,x,h),fill=(230,232,236,230))
for i,ch in enumerate("PIEL"):
    x=i*64; d.line((x,0,x,14),fill=(255,255,255,255),width=2)
    d.text((x+1 if x==0 else x-2,16),ch,fill=(255,220,120,255) if ch=="P" else (240,240,240,255),font=F)
d.text((253,16),"P",fill=(255,220,120,255),font=F); im.save(P("hud","kompassi_256x32.png"))
im=Image.new("RGBA",(32,32),(0,0,0,0)); d=ImageDraw.Draw(im)
d.polygon([(16,2),(26,14),(19,14),(19,29),(13,29),(13,14),(6,14)],fill=(240,240,244,230),outline=(30,40,60,255))
im.save(P("hud","tuuli_nuoli_32.png"))
im=Image.new("RGBA",(24,24),(0,0,0,0)); d=ImageDraw.Draw(im)
d.ellipse((3,10,17,20),fill=(240,242,246,255),outline=(60,70,90,255)); d.ellipse((13,7,21,14),fill=(240,242,246,255),outline=(60,70,90,255))
d.polygon([(15,8),(14,1),(17,1),(18,7)],fill=(240,242,246,255),outline=(60,70,90,255)); d.line((14,1,16,1),fill=(0,0,0,255))
d.rectangle((4,19,8,21),fill=(240,242,246,255)); d.point((19,10),fill=(0,0,0,255))
im.save(P("hud","saalis_janis_24.png"))
im=Image.new("RGBA",(16,16),(0,0,0,0)); d=ImageDraw.Draw(im)
for a,b in (((7,1),(7,5)),((7,10),(7,14)),((1,7),(5,7)),((10,7),(14,7))): d.line(a+b,fill=(255,255,255,220))
d.point((7,7),fill=(255,80,60,255)); im.save(P("hud","tahtain_16.png"))


# ================= v0.2: korkeampi resoluutio (samat tiedostonimet) =================
N=128
n=fbm(N,1,((4,.45),(8,.3),(16,.15),(32,.1))); quant((n-n.min())/np.ptp(n)*.8+.15+rng.random((N,N))*.06,SNOW).save(P("tekstuurit","lumi_64.png"))
n=fbm(N,2,((4,.45),(8,.3),(16,.15),(32,.1))); v=(n-n.min())/np.ptp(n)*.5+.4
x=np.arange(N); wob=3*np.sin(np.arange(N)[:,None]*2*np.pi/N*2)
for c in (36,92):
    dist=np.abs(x[None,:]-c-wob); v-=np.clip(1-dist/8,0,1)*.45; v-=np.clip(1-np.abs(dist-9)/2,0,1)*-.08
v+=rng.random((N,N))*.06; quant(np.clip(v,0,1),[(120,118,116),(150,148,150)]+SNOW[1:]).save(P("tekstuurit","metsatie_64.png"))
n=fbm(N,3,((4,.45),(8,.3),(16,.15),(32,.1))); a=np.array(quant((n-n.min())/np.ptp(n)*.5+.45,SNOW)); r=np.random.default_rng(4)
for row in range(4,N,8):
    for col in range(0,N,3):
        if r.random()<.6:
            cx=(col+r.integers(0,2))%N
            for k in range(r.integers(2,6)): a[(row-k)%N,cx]=[(150,128,84),(178,152,98),(120,100,66)][r.integers(0,3)]
        if r.random()<.3: a[(row+1)%N,col%N]=(170,180,196)
Image.fromarray(a).save(P("tekstuurit","pelto_64.png"))
random.seed(11)
im=Image.new("RGBA",(128,256),(0,0,0,0)); d=ImageDraw.Draw(im)
d.rectangle((60,222,67,255),fill=(72,52,38,255)); d.line((61,222,61,255),fill=(96,72,52,255))
for i in range(11):
    yb=234-i*19; hw=60-i*5.2; yt=yb-34
    d.polygon([(64-hw,yb),(64+hw,yb),(64,yt)],fill=(34,58,40,255))
    d.polygon([(64-hw,yb),(64-hw*.2,yb-5),(64,yt)],fill=(24,44,32,255))
    for k in range(int(hw*1.5)):
        sx=64-hw+random.random()*hw*2; d.point((sx,yb-1-random.random()*8),fill=(28+random.randint(0,20),66,44,255))
    d.line((64-hw+3,yb-3,64-hw*.3,yb-11),fill=(226,232,240,255),width=3)
    d.line((64+hw*.3,yb-11,64+hw-3,yb-3),fill=(206,216,230,255),width=3)
    for k in range(int(hw*.6)): d.point((64-hw+random.random()*hw*2,yb-2-random.random()*10),fill=(240,244,250,255))
d.polygon([(60,12),(68,12),(64,0)],fill=(236,240,246,255)); im.save(P("tekstuurit","kuusi_billboard.png"))
im=Image.new("RGBA",(96,256),(0,0,0,0)); d=ImageDraw.Draw(im)
def br2(x,y,a,l,w):
    if l<5: return
    x2=x+math.cos(a)*l; y2=y-math.sin(a)*l; d.line((x,y,x2,y2),fill=(70,56,52,255),width=max(1,int(w)))
    br2(x2,y2,a+.4+random.uniform(-.2,.2),l*.7,w*.65); br2(x2,y2,a-.4+random.uniform(-.2,.2),l*.7,w*.65)
for yy in range(40,200,12): br2(48,yy,math.pi/2+random.choice((-.75,.75))+random.uniform(-.1,.1),22,2.5)
br2(48,20,math.pi/2,16,2)
d.polygon([(44,16),(52,16),(54,255),(42,255)],fill=(228,226,218,255)); d.line((51,16,53,255),fill=(196,194,188,255),width=2)
for yy in range(18,255,6): xx=43+random.randint(0,4); d.line((xx,yy,xx+random.randint(2,6),yy),fill=(30,30,30,255))
d.polygon([(42,215),(54,215),(55,255),(41,255)],fill=(60,56,52,255))
for yy in range(215,255,4): d.line((42,yy,54,yy+random.randint(-1,1)),fill=(40,38,36,255))
im.save(P("tekstuurit","koivu_billboard.png"))

# haulikko 512x256
def gun2(flash):
    im=Image.new("RGBA",(512,256),(0,0,0,0)); d=ImageDraw.Draw(im); ox,oy=(18,14) if flash else (0,0)
    W1=(112,66,34,255);W2=(78,44,22,255);W3=(146,92,48,255);M1=(44,46,52,255);M2=(92,96,106,255);M3=(18,18,22,255);M4=(64,66,74,255)
    T=lambda pts:[(x+ox,y+oy) for x,y in pts]
    if flash:
        cx,cy=258+ox,98+oy
        for rr,c in ((56,(255,190,70,120)),(38,(255,226,130,210)),(18,(255,255,226,255))):
            pts=[(cx+math.cos(a)*rr*(1 if i%2 else .4),cy+math.sin(a)*rr*(1 if i%2 else .4)*.75) for i,a in enumerate(np.linspace(0,2*math.pi,21)[:-1])]
            d.polygon(pts,fill=c)
    # perä + kädensija (oikea alakulma)
    d.polygon(T([(380,200),(430,186),(512,196),(512,256),(440,256),(400,238)]),fill=W1)
    d.polygon(T([(380,200),(430,186),(512,196),(512,206),(430,198),(390,210)]),fill=W3)
    d.polygon(T([(392,226),(420,222),(436,256),(404,256)]),fill=W2)  # pistoolikahva
    for k in range(6): d.line(T([(398+k*4,230),(410+k*4,256)]),fill=(92,54,28,255))  # kuviointi
    for k in range(5): d.arc(T([(420+k*14,200),(520+k*10,300)])[0]+T([(420+k*14,200),(520+k*10,300)])[1],200,250,fill=W2)
    # lukko
    d.polygon(T([(340,176),(392,168),(406,224),(356,236)]),fill=M4)
    d.polygon(T([(344,180),(390,172),(394,186),(348,194)]),fill=M2)
    for (px,py) in ((360,200),(384,196)): d.ellipse(T([(px-3,py-3),(px+3,py+3)]),fill=M3)
    d.arc(T([(356,222),(392,252)])[0]+T([(356,222),(392,252)])[1],0,180,fill=M3,width=3)  # liipaisinkaari
    d.line(T([(374,226),(372,240)]),fill=M3,width=3)
    # piiput päällekkäin (over-under): alempi ensin, ylempi päälle
    for dy,dx in ((26,6),(0,0)):
        d.polygon(T([(244+dx,86+dy),(268+dx,86+dy),(392+dx,256),(336+dx,256)]),fill=M1)
        d.line(T([(248+dx,88+dy),(344+dx,256)]),fill=M2,width=4)
        d.line(T([(266+dx,88+dy),(388+dx,256)]),fill=M3,width=2)
        d.ellipse(T([(243+dx,78+dy),(269+dx,96+dy)]),fill=M4); d.ellipse(T([(248+dx,82+dy),(264+dx,92+dy)]),fill=M3)
    d.line(T([(252,80),(338,240)]),fill=M2,width=3)  # tähtäinkisko ylemmän päällä
    d.ellipse(T([(250,74),(258,82)]),fill=(220,214,190,255))  # jyvä
    # etutukki
    d.polygon(T([(298,180),(388,178),(446,256),(330,256)]),fill=W1)
    d.polygon(T([(298,180),(388,178),(394,188),(304,190)]),fill=W3)
    for k in range(9): d.line(T([(310+k*10,192),(340+k*12,256)]),fill=W2)
    return im
gun2(False).save(P("haulikko_fp.png")); gun2(True).save(P("haulikko_laukaus.png"))

# jäljet 64x64
def track2(kind):
    im=Image.new("RGBA",(64,64),(0,0,0,0)); d=ImageDraw.Draw(im)
    if kind=="janis":
        for x0 in (10,38):
            d.ellipse((x0,4,x0+16,30),fill=SH+(150,)); d.ellipse((x0+3,8,x0+13,26),fill=(108,126,152,170))
            for t in range(4): d.ellipse((x0+1+t*4,3,x0+4+t*4,7),fill=(100,118,146,170))
        for y0 in (36,50):
            d.ellipse((27,y0,37,y0+12),fill=SH+(165,)); d.ellipse((29,y0+2,35,y0+10),fill=(108,126,152,180))
    else:
        for cx,cy in ((20,18),(44,42)):
            d.ellipse((cx-8,cy-2,cx+8,cy+12),fill=SH+(165,)); d.ellipse((cx-5,cy+1,cx+5,cy+9),fill=(104,122,150,185))
            for tx,ty in ((-8,-6),(-3,-10),(3,-10),(8,-6)):
                d.ellipse((cx+tx-3,cy+ty-3,cx+tx+3,cy+ty+3),fill=(110,128,156,180))
                d.line((cx+tx*1.2,cy+ty-4,cx+tx*1.3,cy+ty-7),fill=(80,94,120,210),width=1)
    im.save(P("jaljet",kind+"_jalki_32.png"))
track2("janis"); track2("koira")

# mallit, tarkempi
BKT=(20,18,18);PK=(200,150,150)
hare2=[ellipsoid((0,.16,-.04),(.11,.12,.2),WH,12,8),ellipsoid((0,.25,.17),(.06,.068,.09),WH,10,6),
 ellipsoid((0,.235,.245),(.035,.035,.03),WG,6,3),box((-.008,.235,.27),(.008,.248,.278),PK),
 ellipsoid((.055,.27,.215),(.012,.014,.012),BKT,6,3),ellipsoid((-.055,.27,.215),(.012,.014,.012),BKT,6,3),
 ellipsoid((.07,.07,-.11),(.045,.075,.11),WG,8,5),ellipsoid((-.07,.07,-.11),(.045,.075,.11),WG,8,5),
 ellipsoid((.06,.025,.0),(.022,.02,.11),WG,6,4),ellipsoid((-.06,.025,.0),(.022,.02,.11),WG,6,4),
 ellipsoid((.035,.07,.1),(.016,.07,.018),WH,6,4),ellipsoid((-.035,.07,.1),(.016,.07,.018),WH,6,4),
 ellipsoid((0,.17,-.25),(.035,.035,.03),WH,6,3)]
for sx in (1,-1):
    hare2.append(ellipsoid((sx*.03,.37,.14),(.02,.085,.012),WG,8,5))
    hare2.append(ellipsoid((sx*.03,.435,.14),(.016,.022,.01),BKT,6,3))
TN2=(196,128,62)
dog2=[ellipsoid((0,.48,0),(.13,.14,.33),TN2,12,8),ellipsoid((0,.56,-.03),(.122,.08,.27),BKT,12,4),
 ellipsoid((0,.43,.2),(.085,.11,.12),WH,8,5),ellipsoid((0,.6,.3),(.065,.12,.075),TN2,8,4),
 ellipsoid((0,.7,.38),(.075,.075,.09),TN2,10,6),ellipsoid((0,.665,.48),(.036,.034,.075),TN,8,4),
 ellipsoid((0,.7,.42),(.012,.05,.04),WH,6,3),ellipsoid((0,.685,.555),(.016,.014,.012),BKT,6,3),
 ellipsoid((.035,.72,.44),(.01,.01,.008),BKT,6,3),ellipsoid((-.035,.72,.44),(.01,.01,.008),BKT,6,3)]
for sx in (1,-1):
    dog2.append(ellipsoid((sx*.075,.68,.36),(.012,.065,.04),TD,6,4))
    for z in (.22,-.22):
        dog2.append(ellipsoid((sx*.07,.33,z),(.03,.1,.035),TN2,6,3))
        dog2.append(ellipsoid((sx*.07,.13,z),(.02,.13,.022),WH,6,3))
        dog2.append(ellipsoid((sx*.07,.012,z+.02),(.025,.012,.035),WH,6,2))
for k,(y,z) in enumerate(((.58,-.33),(.6,-.42),(.6,-.5))):
    dog2.append(ellipsoid((0,y,z),(.022,.022,.05),BKT if k<2 else TN2,6,3))
models={}
for nm,parts in (("janis",hare2),("ajokoira",dog2)): models[nm]=write_glb(P("mallit",nm+".glb"),parts)

# GPS
GX,GY,GW,GH=56,92,208,176
im=Image.new("RGBA",(320,400),(0,0,0,0)); d=ImageDraw.Draw(im)
d.rounded_rectangle((44,0,72,60),6,fill=(30,32,30,255)); d.rounded_rectangle((48,4,68,56),4,fill=(48,50,48,255))
d.rounded_rectangle((16,40,304,396),28,fill=(26,28,26,255))
d.rounded_rectangle((24,48,296,388),24,fill=(52,56,50,255))
d.rounded_rectangle((30,54,290,382),20,fill=(40,43,39,255))
for yy in (120,180,240): d.rounded_rectangle((16,yy,26,yy+40),4,fill=(200,96,30,255))
for yy in (120,180,240): d.rounded_rectangle((294,yy,304,yy+40),4,fill=(200,96,30,255))
d.rounded_rectangle((GX-10,GY-10,GX+GW+9,GY+GH+9),8,fill=(14,14,14,255))
d.text((60,66),"GPS 2000",fill=(170,176,170,255),font=F)
d.ellipse((246,64,256,74),fill=(40,160,60,255))
cx,cy=160,330; d.ellipse((cx-34,cy-34,cx+34,cy+34),fill=(30,32,30,255)); d.ellipse((cx-26,cy-26,cx+26,cy+26),fill=(70,74,68,255))
for dx,dy in ((0,-17),(0,17),(-17,0),(17,0)): d.polygon([(cx+dx+(4 if dy else 0)*0,cy+dy)]*1+[(cx+dx-4,cy+dy+(3 if dy<0 else -3 if dy>0 else 0)),(cx+dx+4,cy+dy+(3 if dy<0 else -3 if dy>0 else 0))] if dy else [(cx+dx,cy),(cx+dx-(3 if dx<0 else -3),cy-4),(cx+dx-(3 if dx<0 else -3),cy+4)],fill=(200,204,196,255))
d.ellipse((cx-8,cy-8,cx+8,cy+8),fill=(110,116,108,255))
for bx,lab in ((70,"-"),(250,"+")):
    d.ellipse((bx-16,314,bx+16,346),fill=(30,32,30,255)); d.ellipse((bx-12,318,bx+12,342),fill=(84,88,82,255)); d.text((bx-3,323),lab,fill=(230,230,230,255),font=F)
d.rounded_rectangle((60,360,104,372),4,fill=(84,88,82,255)); d.rounded_rectangle((216,360,260,372),4,fill=(84,88,82,255))
for k in range(5): d.line((130+k*14,376,140+k*14,376),fill=(20,20,20,255),width=2)
d.rectangle((GX,GY,GX+GW-1,GY+GH-1),fill=(0,0,0,0)); im.save(P("hud","gps_kehys.png"))
def ic(): i=Image.new("RGBA",(16,16),(0,0,0,0)); return i,ImageDraw.Draw(i)
i,d=ic(); d.polygon([(8,1),(14,14),(8,10),(2,14)],fill=(255,230,60,255),outline=(20,20,20,255)); i.save(P("hud","gps_pelaaja.png"))
def dogic(col,ol=(20,20,20,255)):
    i,d=ic(); d.rectangle((2,7,10,10),fill=col,outline=ol); d.rectangle((9,4,13,8),fill=col,outline=ol)
    d.line((13,6,14,6),fill=ol); d.line((3,11,3,13),fill=ol); d.line((9,11,9,13),fill=ol); d.line((2,7,1,4),fill=ol)
    d.point((10,4),fill=ol); return i,d
i,d=dogic((214,140,60,255)); i.save(P("hud","gps_koira.png"))
i,d=dogic((230,90,40,255)); d.arc((10,1,18,11),-60,60,fill=(255,255,255,255)); d.arc((8,-1,20,13),-50,50,fill=(255,255,255,255)); i.save(P("hud","gps_koira_ajo.png"))
i,d=dogic((214,170,60,255)); d.text((10,-2),"?",fill=(255,255,255,255),font=F); d.point((15,7),fill=(255,255,255,255)); d.point((15,9),fill=(255,255,255,255)); i.save(P("hud","gps_koira_haku.png"))
i,d=dogic((130,130,130,255),(70,70,70,255)); d.text((11,-2),"?",fill=(180,180,180,255),font=F); i.save(P("hud","gps_koira_hukka.png"))

# tähtäysasento 512x256, jyvä kohdassa (256,58)
def gun_ads():
    im=Image.new("RGBA",(512,256),(0,0,0,0)); d=ImageDraw.Draw(im)
    W1=(112,66,34,255);W2=(78,44,22,255);W3=(146,92,48,255);M1=(44,46,52,255);M2=(92,96,106,255);M3=(18,18,22,255);M4=(64,66,74,255)
    GL=(58,62,50,255);GL2=(42,46,36,255)
    # over-under: alempi piippu näkyy ylemmän alla, jyvä ylemmän päällä (256,58)
    d.polygon([(242,96),(270,96),(330,256),(182,256)],fill=M4)
    d.ellipse((243,84,269,108),fill=M4); d.ellipse((248,89,264,103),fill=M3)
    d.polygon([(240,72),(272,72),(352,256),(160,256)],fill=M1)
    d.line((242,74,166,256),fill=M2,width=3); d.line((270,74,346,256),fill=M2,width=3)
    d.ellipse((241,60,271,84),fill=M4); d.ellipse((246,64,266,80),fill=M3)
    d.polygon([(253,60),(259,60),(268,256),(244,256)],fill=M4)  # kisko
    for y in range(70,256,8): d.line((256-3-(y-60)*.05,y,256+3+(y-60)*.05,y),fill=M2)
    d.ellipse((252,54,260,62),fill=(225,218,192,255)); d.point((256,58),fill=(255,255,240,255))  # jyvä
    d.polygon([(150,190),(256,180),(362,190),(400,256),(112,256)],fill=W1)  # etutukki
    d.polygon([(150,190),(256,180),(362,190),(366,198),(256,190),(146,198)],fill=W3)
    for k in range(10): d.line((170+k*19,196,140+k*25,256),fill=W2)
    d.polygon([(214,232),(298,232),(318,256),(194,256)],fill=W2)  # perä/lukko alhaalla
    for sx in (-1,1):  # käsineet
        d.ellipse((256+sx*150-38,200,256+sx*150+38,256),fill=GL)
        for k in range(3): d.line((256+sx*(120+k*14),204,256+sx*(112+k*14),228),fill=GL2,width=3)
    return im
gun_ads().save(P("haulikko_tahtays.png"))


# ===== v0.4: viileä retro-paletti (ei referenssikuvaa löytynyt; oma tulkinta) =====
FOG=np.array([176,190,210])
def cool(path,amt,step=12):
    im=Image.open(path).convert("RGBA"); a=np.array(im).astype(float); rgb=a[...,:3]
    lum=rgb@[.3,.59,.11]; rgb=rgb*.6+lum[...,None]*.4  # vähemmän saturaatiota
    rgb=rgb*[.88,.95,1.08]; rgb=rgb*(1-amt)+FOG*amt
    rgb=np.round(rgb/step)*step; a[...,:3]=np.clip(rgb,0,255); Image.fromarray(a.astype(np.uint8)).save(path)
for f,amt in (("lumi_64.png",.12),("metsatie_64.png",.12),("pelto_64.png",.1),("taivas_256x128.png",.15),("kuusi_billboard.png",.32),("koivu_billboard.png",.28)):
    cool(P("tekstuurit",f),amt)
# ===== v0.3: talutushihna =====
im=Image.new("RGBA",(16,64),(0,0,0,0)); d=ImageDraw.Draw(im)
d.rectangle((3,0,12,63),fill=(220,96,28,255)); d.line((3,0,3,63),fill=(150,60,18,255)); d.line((12,0,12,63),fill=(150,60,18,255))
d.line((5,0,5,63),fill=(244,136,60,255))
for y in range(0,64,4): d.line((4,y,11,y+2),fill=(196,82,24,255))
im.save(P("tekstuurit","hihna.png"))
im=Image.new("RGBA",(512,256),(0,0,0,0)); d=ImageDraw.Draw(im)
pts=[(150+t*(256-150),200+t*(256-200)-math.sin(t*math.pi)*30) for t in np.linspace(0,1,24)]
d.line(pts,fill=(150,60,18,255),width=9); d.line(pts,fill=(220,96,28,255),width=6)
d.line([(x-1,y-1) for x,y in pts],fill=(244,136,60,255),width=1)
GL=(58,62,50,255);GL2=(42,46,36,255);GL3=(76,80,66,255)
d.polygon([(0,256),(40,190),(110,170),(170,184),(180,226),(140,256)],fill=GL)  # käsi/hiha
d.polygon([(0,256),(30,206),(0,200)],fill=(40,52,70,255))  # takinhiha
for k in range(4):
    y=172+k*14; d.rounded_rectangle((120,y,180,y+14),6,fill=GL,outline=GL2)
d.ellipse((96,160,134,186),fill=GL3,outline=GL2)  # peukalo
d.line((60,200,110,186),fill=GL2,width=2)
d.rounded_rectangle((176,192,190,212),4,fill=(220,96,28,255),outline=(150,60,18,255))  # hihnan lenkki kädestä
im.save(P("haulikko_hihna.png"))
def kic():
    i=Image.new("RGBA",(32,32),(0,0,0,0)); dd=ImageDraw.Draw(i)
    dd.rounded_rectangle((0,0,31,31),6,fill=(20,24,30,170),outline=(200,206,214,220)); return i,dd
WC=(236,238,242,255);OR=(230,110,40,255)
def dog(dd,x,y,c=(214,140,60,255),s=1):
    o=(20,20,20,255); dd.rectangle((x,y+3*s,x+9*s,y+7*s),fill=c,outline=o); dd.rectangle((x+8*s,y,x+12*s,y+5*s),fill=c,outline=o)
    dd.line((x+1,y+8*s,x+1,y+11*s),fill=o,width=2); dd.line((x+8*s,y+8*s,x+8*s,y+11*s),fill=o,width=2); dd.line((x,y+3*s,x-2,y),fill=o,width=2)
def clip(dd,x,y,open_):
    dd.rounded_rectangle((x,y,x+10,y+16),4,outline=WC,width=2); dd.ellipse((x+2,y+16,x+8,y+22),outline=WC,width=2)
    if open_: dd.line((x+9,y+3,x+15,y-1),fill=(30,30,30,255),width=3); dd.line((x+10,y+4,x+16,y),fill=WC,width=2)
i,dd=kic(); clip(dd,8,6,True); dd.line((4,28,10,22),fill=OR,width=3); i.save(P("hud","komento_irti.png"))
i,dd=kic(); clip(dd,10,6,False); dd.line((6,28,13,22),fill=OR,width=3); i.save(P("hud","komento_kiinni.png"))
i,dd=kic(); dog(dd,4,14); dd.rectangle((24,6,27,26),fill=WC); dd.ellipse((22,2,29,8),fill=WC)
dd.polygon([(17,12),(21,15),(17,18)],fill=OR); i.save(P("hud","komento_tanne.png"))
i,dd=kic(); dd.rectangle((22,4,25,22),fill=WC); dd.ellipse((20,0,27,6),fill=WC); dog(dd,10,16)
for k,(x,y) in enumerate(((4,26),(8,22),(4,18))): dd.ellipse((x,y,x+3,y+3),fill=(150,170,200,255))
i.save(P("hud","komento_seuraa.png"))
i,dd=kic(); dog(dd,3,12); dd.line((18,10,28,10),fill=OR,width=2); dd.polygon([(28,6),(31,10),(28,14)],fill=OR)
for x in (19,22,25): dd.point((x,16),fill=WC)
i.save(P("hud","komento_hae.png"))
# --- esikatselu ---
def render(tv,tc,view,sz=200):
    im=Image.new("RGB",(sz,sz),(70,80,96)); d=ImageDraw.Draw(im)
    if view=="side": proj=lambda p:(p[:,2],p[:,1],p[:,0])
    else: proj=lambda p:(p[:,0],p[:,1],p[:,2])
    u,v,dep=proj(tv); s=sz*.8/max(np.ptp(u),np.ptp(v)); cu=(u.max()+u.min())/2
    tri=np.arange(len(tv)).reshape(-1,3); order=np.argsort(dep[tri].mean(1))
    nrm=np.cross(tv[1::3]-tv[0::3],tv[2::3]-tv[0::3]); nrm/=np.linalg.norm(nrm,axis=1,keepdims=True)+1e-9
    L=np.array([.4,.8,.45]); L/=np.linalg.norm(L)
    for t in order:
        sh=.55+.45*abs(nrm[t]@L); col=tuple(int(c*255*sh) for c in tc[tri[t][0]])
        d.polygon([(sz/2+(u[i]-cu)*s,sz*.9-v[i]*s) for i in tri[t]],fill=col)
    return im
items=[("lumi",P("tekstuurit","lumi_64.png")),("metsatie",P("tekstuurit","metsatie_64.png")),("pelto",P("tekstuurit","pelto_64.png")),
 ("taivas",P("tekstuurit","taivas_256x128.png")),("kuusi",P("tekstuurit","kuusi_billboard.png")),("koivu",P("tekstuurit","koivu_billboard.png")),
 ("haulikko",P("haulikko_fp.png")),("laukaus",P("haulikko_laukaus.png")),("tahtays",P("haulikko_tahtays.png")),("hihna_fp",P("haulikko_hihna.png")),("hihna",P("tekstuurit","hihna.png")),("janis_jalki",P("jaljet","janis_jalki_32.png")),
 ("koira_jalki",P("jaljet","koira_jalki_32.png")),("kompassi",P("hud","kompassi_256x32.png")),("tuuli",P("hud","tuuli_nuoli_32.png")),
 ("saalis",P("hud","saalis_janis_24.png")),("tahtain",P("hud","tahtain_16.png")),("gps_kehys",P("hud","gps_kehys.png"))]+[(n,P("hud",n+".png")) for n in ("komento_irti","komento_kiinni","komento_tanne","komento_seuraa","komento_hae","gps_pelaaja","gps_koira","gps_koira_ajo","gps_koira_haku","gps_koira_hukka")]
sheet=Image.new("RGB",(1300,2000),(40,46,56)); d=ImageDraw.Draw(sheet); x=y=10; rowh=0
for nm,p in items:
    im=Image.open(p).convert("RGBA"); k=1 if im.width>=256 else (2 if im.width>=48 else 3)
    if nm in("lumi","metsatie","pelto"): t=Image.new("RGBA",(256,256)); [t.paste(im,(i*128,j*128)) for i in (0,1) for j in (0,1)]; im=t; k=1
    im=im.resize((im.width*k,im.height*k),Image.NEAREST)
    if x+im.width>1290: x=10; y+=rowh+20; rowh=0
    bg=Image.new("RGBA",im.size,(110,124,140,255)); bg.alpha_composite(im); sheet.paste(bg.convert("RGB"),(x,y))
    d.text((x,y+im.height+2),nm,fill=(255,255,255)); x+=im.width+12; rowh=max(rowh,im.height)
y+=rowh+20; x=10
for nm,(tv,tc,nt) in models.items():
    for vw in ("side","front"):
        sheet.paste(render(tv,tc,vw),(x,y)); d.text((x,y+202),f"{nm}.glb {vw} ({nt} tris)",fill=(255,255,255)); x+=215
sheet.save(P("esikatselu.png"))
for nm,(tv,tc,nt) in models.items(): print(nm,nt,"tris, bbox",tv.min(0).round(2),tv.max(0).round(2))

# ===== v0.8: ajetaan v0.8-skriptit lopuksi (haulikko v08 + nodetetut GLB:t yhden meshin malleista) =====
import subprocess, sys
for _s in ("generoi_haulikko_v08.py","generoi_mallit_v08.py"):
    subprocess.run([sys.executable,P(_s)],check=True)
