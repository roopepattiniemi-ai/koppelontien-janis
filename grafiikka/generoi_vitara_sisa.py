#!/usr/bin/env python3
"""vitara_sisa.glb: 3-ovisen Vitaran sisätila, sama koordinaatisto kuin vitara.glb (m, +Y ylös, edessä +Z, auton vasen = +X)."""
import os, math, json, struct
import numpy as np
from PIL import Image, ImageDraw
R=os.path.dirname(os.path.abspath(__file__)); P=lambda *a: os.path.join(R,*a)
CUBE=[(0,1,3),(0,3,2),(4,6,7),(4,7,5),(0,4,5),(0,5,1),(2,3,7),(2,7,6),(0,2,6),(0,6,4),(1,5,7),(1,7,3)]
def box(lo,hi,col): return [(x,y,z) for x in (lo[0],hi[0]) for y in (lo[1],hi[1]) for z in (lo[2],hi[2])],CUBE,col
def disc(c,r,col,seg=12,nz=-1):  # kiekko XY-tasossa, normaali -Z
    V=[c]+[(c[0]+r*math.cos(2*math.pi*j/seg),c[1]+r*math.sin(2*math.pi*j/seg),c[2]) for j in range(seg)]
    return V,[(0,1+(j+1)%seg,1+j) for j in range(seg)],col
def torus(R_,r,col,seg=16,ss=4):
    V=[];F=[]
    for i in range(seg):
        a=2*math.pi*i/seg
        for j in range(ss):
            b=2*math.pi*j/ss; V.append(((R_+r*math.cos(b))*math.cos(a),(R_+r*math.cos(b))*math.sin(a),r*math.sin(b)))
    for i in range(seg):
        for j in range(ss):
            a=i*ss+j;b=((i+1)%seg)*ss+j;c=((i+1)%seg)*ss+(j+1)%ss;d=i*ss+(j+1)%ss; F+=[(a,b,c),(a,c,d)]
    return V,F,col
DASH=(52,54,58);DASH2=(38,40,44);GAUGE=(16,16,18);WH=(235,235,235);CLOTH=(44,46,54);CLOTH2=(34,36,42)
ROOF=(150,148,140);DOOR=(70,72,76);FLOOR=(30,30,32);BLK=(20,20,22);RED=(200,50,30)
def mesh(parts):
    tv=[];tc=[]
    for v,f,col in parts:
        v=np.array(v,np.float32)
        for t in f: tv+=list(v[list(t)]); tc+=[col]*3
    tv=np.array(tv,np.float32); tc=np.array(tc,np.float32)/255
    n=np.cross(tv[1::3]-tv[0::3],tv[2::3]-tv[0::3]); n/=np.linalg.norm(n,axis=1,keepdims=True)+1e-9
    return tv,np.repeat(n,3,0).astype(np.float32),np.hstack([tc,np.ones((len(tc),1))]).astype(np.float32)
# ---- kori sisältä ----
X0,X1,Y0,Y1,Z0,Z1=-.80,.80,.45,1.66,-1.62,.40   # sisätilan rajat; tuulilasi alareuna z~0.55 y1.10 -> yläreuna z0.10 y1.62
k=[box((X0,Y0-.03,Z0),(X1,Y0,Z1+.2),FLOOR),           # lattia
   box((X0,Y1,Z0),(X1,Y1+.02,.12),ROOF)]                # sisäkatto
for s in (-1,1):
    xi,xo=(s*.78,s*.82)
    lo,hi=min(xi,xo),max(xi,xo)
    k+=[box((lo,Y0,Z0),(hi,1.12,.55),DOOR),             # verhoilu ikkunan alle
        box((lo,1.60,Z0),(hi,Y1,.12),ROOF),             # ikkunan yläpuoli
        box((lo,1.12,-.25),(hi,1.60,-.15),DOOR),        # B-pilari
        box((lo,1.12,-1.62),(hi,1.60,-1.55),DOOR),      # C-pilari
        box((s*.6-.1,.95,-.9),(s*.6+.1,1.05,-.25),DASH2),# käsinoja/takalokasuoja
        box((lo,.75,-.15),(hi,.98,.40),DASH2)]          # ovitasku/käsinoja
    # A-pilari: tuulilasin sivu (vino)
    a=[(x,y,z) for x in (lo,hi) for y,z in ((1.10,.55),(1.66,.10)) for z in (z,z)]
    a=[(x,y,zz+dz) for x in (lo,hi) for (y,zz) in ((1.10,.55),(1.66,.10)) for dz in (-.06,0)]
    k.append((a,CUBE,DOOR))
k+=[box((X0,Y0,Z0-.02),(X1,1.12,Z0),DOOR), box((X0,1.60,Z0-.02),(X1,Y1,Z0),ROOF)]  # takaluukku (takalasi aukkona)
# kojelauta
k+=[box((X0,.75,.40),(X1,1.06,.60),DASH), box((X0,1.06,.32),(X1,1.10,.58),DASH2),   # päälevy + yläpinta
    box((.18,.95,.30),(.62,1.12,.40),DASH2),            # mittariston kotelo kuljettajan edessä
    box((-.12,.45,.0),(.12,.70,.45),DASH),              # keskikonsoli
    box((-.14,.70,.36),(.14,.98,.40),DASH2),            # radion kehys
    box((-.6,.80,.38),(-.2,.92,.40),DASH2)]             # hansikaslokero
for cx in (.30,.50):                                    # nopeus (.30) ja kierrokset (.50)
    k.append(disc((cx,1.03,.299),.075,GAUGE))
    for j in range(9):
        a=math.radians(-135+j*33.75)+math.pi/2; c,s_=math.cos(a),math.sin(a)
        p=[(cx+c*r+dx,1.03+s_*r+dy,.297) for r in (.055,.07) for dx,dy in ((-s_*.004,c*.004),(s_*.004,-c*.004))]
        k.append((p,[(0,1,3),(0,3,2)],WH))
    k.append(([(cx,1.03,.296),(cx-.05,1.0,.296),(cx-.048,.996,.296)],[(0,1,2)],RED))  # neula
for x in (-.5,-.2,.65): k.append(box((x-.06,1.07,.40),(x+.06,1.10,.42),BLK))  # tuuletusritilät
# istuimet
for sx in (.40,-.40):
    k+=[box((sx-.24,.60,-.70),(sx+.24,.74,-.20),CLOTH),     # istuinosa
        box((sx-.24,.74,-.78),(sx+.24,1.30,-.62),CLOTH),    # selkä
        box((sx-.13,1.32,-.80),(sx+.13,1.48,-.68),CLOTH2),  # niskatuki
        box((sx-.18,Y0,-.62),(sx+.18,.60,-.28),BLK)]        # jalka/kisko
k+=[box((-.70,.58,-1.30),(.70,.72,-.85),CLOTH), box((-.70,.72,-1.40),(.70,1.18,-1.25),CLOTH),  # takapenkki
    box((-.78,.55,-1.62),(.78,.58,-1.40),FLOOR)]        # tavaratilan pohja
k+=[box((.36,1.58,.0),(.52,1.64,.04),DASH2), box((-.04,1.56,.05),(.04,1.64,.08),BLK)]  # aurinkolippa, peilin jalka
# ratti: paikallisissa koordinaateissa, akseli = paikallinen Z
ratti=[torus(.19,.018,BLK,16,4), box((-.05,-.04,-.03),(.05,.04,.03),DASH2),
       box((-.18,-.015,-.012),(-.04,.015,.012),BLK), box((.04,-.015,-.012),(.18,.015,.012),BLK),
       box((-.015,-.18,-.012),(.015,-.04,.012),BLK), box((-.025,-.025,.03),(.025,.025,.22),DASH2)]  # akselin pätkä kohti kojelautaa
TILT=math.radians(25); RAT=(.40,.98,.18)
vaihde=[box((-.008,0,-.008),(.008,.22,.008),BLK), box((-.025,.22,-.025),(.025,.27,.025),BLK), box((-.06,-.01,-.06),(.06,.02,.06),BLK)]
w,h=.20,.05   # radio 4:1
radio_q=[(w/2,h/2,0),(-w/2,h/2,0),(-w/2,-h/2,0),(w/2,-h/2,0)]   # normaali -Z (matkustamoon päin)
RADIO=(0,.84,.355)
nodes=[("sisa_kori",(0,0,0),None,k),("ratti",RAT,[math.sin(TILT/2),0,0,math.cos(TILT/2)],ratti),
       ("vaihdekeppi",(0,.70,.22),None,vaihde),("radio_naytto",RADIO,None,"RADIO"),
       ("kamera_kuljettaja",(.40,1.15,-.55),None,None),("koira_paikka",(0,.58,-1.50),None,None)]
# ---- GLB ----
bins=[];views=[];acc=[];meshes=[];gn=[{"name":"vitara_sisa","children":list(range(1,len(nodes)+1))}];off=0;ntri=0
def add(arr,typ,mm=False):
    global off
    b=arr.tobytes(); views.append({"buffer":0,"byteOffset":off,"byteLength":len(b)}); off+=len(b); bins.append(b)
    a={"bufferView":len(views)-1,"componentType":5126,"count":len(arr),"type":typ}
    if mm: a["min"]=arr.min(0).tolist(); a["max"]=arr.max(0).tolist()
    acc.append(a); return len(acc)-1
world=[]
def rotx(v,a): c,s=math.cos(a),math.sin(a); return np.stack([v[:,0],v[:,1]*c-v[:,2]*s,v[:,1]*s+v[:,2]*c],1)
for name,tr,rot,parts in nodes:
    nd={"name":name,"translation":list(tr)}
    if rot: nd["rotation"]=rot
    if parts=="RADIO":
        pv=np.array([radio_q[i] for i in (0,1,2,0,2,3)],np.float32)   # CCW -Z:sta katsottuna? tarkistetaan normaali
        nrm=np.cross(pv[1]-pv[0],pv[2]-pv[0]); 
        if nrm[2]>0: pv=pv[[0,2,1,3,5,4]]
        uv=np.array([[0,0],[1,0],[1,1],[1,1],[0,1],[0,0]],np.float32)
        uvmap={(w/2,h/2):(0,0),(-w/2,h/2):(1,0),(-w/2,-h/2):(1,1),(w/2,-h/2):(0,1)}  # u kasvaa kuljettajan oikealle (−X), v alas
        uv=np.array([uvmap[(round(float(p[0]),3),round(float(p[1]),3))] for p in pv],np.float32)
        nn=np.tile([0,0,-1],(6,1)).astype(np.float32)
        a=add(pv,"VEC3",True); add(nn,"VEC3"); add(uv,"VEC2")
        meshes.append({"name":name,"primitives":[{"attributes":{"POSITION":a,"NORMAL":a+1,"TEXCOORD_0":a+2},"material":1}]}); ntri+=2
        world.append((pv+np.array(tr),np.tile([.3,.6,.35,1],(6,1)),None))
    elif parts:
        tv,nn,cc=mesh(parts); a=add(tv,"VEC3",True); add(nn,"VEC3"); add(cc,"VEC4")
        meshes.append({"name":name,"primitives":[{"attributes":{"POSITION":a,"NORMAL":a+1,"COLOR_0":a+2},"material":0}]}); ntri+=len(tv)//3
        wv=rotx(tv,TILT) if rot else tv; world.append((wv+np.array(tr),cc,None))
    if parts: nd["mesh"]=len(meshes)-1
    gn.append(nd)
gl={"asset":{"version":"2.0","generator":"generoi_vitara_sisa.py"},"scene":0,"scenes":[{"nodes":[0]}],"nodes":gn,"meshes":meshes,
    "materials":[{"name":"sisa","doubleSided":True,"pbrMetallicRoughness":{"baseColorFactor":[1,1,1,1],"metallicFactor":0,"roughnessFactor":1}},
                 {"name":"radio_paneeli","pbrMetallicRoughness":{"baseColorTexture":{"index":0},"metallicFactor":0,"roughnessFactor":1}}],
    "textures":[{"source":0,"sampler":0}],"images":[{"uri":"../hud/radio_paneeli.png"}],
    "samplers":[{"magFilter":9728,"minFilter":9728,"wrapS":33071,"wrapT":33071}],
    "accessors":acc,"bufferViews":views,"buffers":[{"byteLength":off}]}
js=json.dumps(gl).encode(); js+=b" "*((4-len(js)%4)%4); bn=b"".join(bins)
with open(P("mallit","vitara_sisa.glb"),"wb") as f:
    f.write(struct.pack("<III",0x46546C67,2,28+len(js)+len(bn))); f.write(struct.pack("<II",len(js),0x4E4F534A)+js+struct.pack("<II",len(bn),0x004E4942)+bn)
print("tris",ntri)
# ---- esikatselu ----
tv=np.vstack([w_[0] for w_ in world]).astype(np.float32); tc=np.vstack([w_[1] for w_ in world])
tri=np.arange(len(tv)).reshape(-1,3); n=np.cross(tv[1::3]-tv[0::3],tv[2::3]-tv[0::3]); n/=np.linalg.norm(n,axis=1,keepdims=True)+1e-9
Lv=np.array([.3,.8,-.5]);Lv/=np.linalg.norm(Lv)
rp=Image.open(P("hud","radio_paneeli.png")).convert("RGB")
def draw(proj,sz=(480,360),bg=(176,190,210)):
    im=Image.new("RGB",sz,bg); d=ImageDraw.Draw(im); u,v,dp,ok=proj(tv)
    for t in np.argsort(-dp[tri].mean(1)):
        if not ok[tri[t]].all(): continue
        sh=.6+.4*abs(n[t]@Lv); d.polygon([(u[i],v[i]) for i in tri[t]],fill=tuple(int(x*255*sh) for x in tc[tri[t][0]][:3]))
    return im
E=np.array([.40,1.15,-.55])
def fp(p):
    q=p-E; z=q[:,2]; f=330/np.maximum(z,1e-3); return 240-q[:,0]*f,175-q[:,1]*f,z,z>.05
def side(p,k_=150): return 240-p[:,2]*k_+ -0*p[:,0], 330-(p[:,1])*k_*1.3+60, -p[:,0], np.ones(len(p),bool)
def sidev(p): return 250+p[:,2]*190, 360-p[:,1]*190, p[:,0], (p[:,0]<.0)|True
a=draw(fp); b=draw(lambda p:(140-p[:,2]*150,320-p[:,1]*150,-p[:,0],p[:,0]<.75))
sheet=Image.new("RGB",(980,400),(40,46,56)); sheet.paste(a,(10,10)); sheet.paste(b,(500,10)); d=ImageDraw.Draw(sheet)
d.text((10,375),f"kuljettajan silmat (.40,1.15,-.55) -> +Z  | {ntri} tris",fill=(255,255,255)); d.text((500,375),"sivukuva +X:sta, sisakori X<0.6 (vasemmalla = edessa +Z)",fill=(255,255,255))
os.makedirs("/workspace/jahti_varmuus",exist_ok=True); sheet.save("/workspace/jahti_varmuus/vitara_sisa_esikatselu.png")
