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
    V=np.array(V,np.float32);C=np.array(C,np.float32)/255;F=np.array(F,np.uint16)
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
 ("haulikko",P("haulikko_fp.png")),("laukaus",P("haulikko_laukaus.png")),("janis_jalki",P("jaljet","janis_jalki_32.png")),
 ("koira_jalki",P("jaljet","koira_jalki_32.png")),("kompassi",P("hud","kompassi_256x32.png")),("tuuli",P("hud","tuuli_nuoli_32.png")),
 ("saalis",P("hud","saalis_janis_24.png")),("tahtain",P("hud","tahtain_16.png"))]
sheet=Image.new("RGB",(1100,1400),(40,46,56)); d=ImageDraw.Draw(sheet); x=y=10; rowh=0
for nm,p in items:
    im=Image.open(p).convert("RGBA"); k=2 if im.width>=128 else 3
    if nm in("lumi","metsatie","pelto"): t=Image.new("RGBA",(128,128)); [t.paste(im,(i*64,j*64)) for i in (0,1) for j in (0,1)]; im=t; k=2
    im=im.resize((im.width*k,im.height*k),Image.NEAREST)
    if x+im.width>1090: x=10; y+=rowh+20; rowh=0
    bg=Image.new("RGBA",im.size,(110,124,140,255)); bg.alpha_composite(im); sheet.paste(bg.convert("RGB"),(x,y))
    d.text((x,y+im.height+2),nm,fill=(255,255,255)); x+=im.width+12; rowh=max(rowh,im.height)
y+=rowh+20; x=10
for nm,(tv,tc,nt) in models.items():
    for vw in ("side","front"):
        sheet.paste(render(tv,tc,vw),(x,y)); d.text((x,y+202),f"{nm}.glb {vw} ({nt} tris)",fill=(255,255,255)); x+=215
sheet.save(P("esikatselu.png"))
for nm,(tv,tc,nt) in models.items(): print(nm,nt,"tris, bbox",tv.min(0).round(2),tv.max(0).round(2))
