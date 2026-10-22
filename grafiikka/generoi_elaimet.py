#!/usr/bin/env python3
"""Riistaeläimet nodeiksi (sama sopimus kuin generoi_mallit_v08.py): kettu, peura, orava, teeri, korppi.
Metrit, +Y ylös, edessä +Z, origo maassa, COLOR_0, tasasävytys, ei luurankoa/animaatioita.
Jokainen node = oma mesh, geometria noden pivotin suhteen; nodeilla vain translation.
Aja: python3 generoi_elaimet.py -> mallit/elaimet/*.glb + /workspace/jahti_varmuus/esikatselu_elaimet.png"""
import os, math, json, struct
import numpy as np
R=os.path.dirname(os.path.abspath(__file__)); OUT=os.path.join(R,"mallit","elaimet")
PREV="/workspace/jahti_varmuus/esikatselu_elaimet.png"

def rot(v,c,rx=0,ry=0,rz=0):
    v=np.array(v,float)-c; rx,ry,rz=map(math.radians,(rx,ry,rz))
    X=np.array([[1,0,0],[0,math.cos(rx),-math.sin(rx)],[0,math.sin(rx),math.cos(rx)]])
    Y=np.array([[math.cos(ry),0,math.sin(ry)],[0,1,0],[-math.sin(ry),0,math.cos(ry)]])
    Z=np.array([[math.cos(rz),-math.sin(rz),0],[math.sin(rz),math.cos(rz),0],[0,0,1]])
    return v@(Z@Y@X).T+c
def ell(c,r,col,seg=6,ring=4,**rk):
    """ellipsoidi -> kolmiolista (n,3,3); rx/ry/rz = kierto keskipisteen ympäri (astetta)"""
    V=[]
    for i in range(ring+1):
        t=math.pi*i/ring
        for j in range(seg):
            p=2*math.pi*j/seg; V.append((r[0]*math.sin(t)*math.cos(p),r[1]*math.cos(t),r[2]*math.sin(t)*math.sin(p)))
    F=[]
    for i in range(ring):
        for j in range(seg):
            a=i*seg+j;b=i*seg+(j+1)%seg;c2=a+seg;d2=b+seg
            if i>0: F.append((a,b,c2))
            if i<ring-1: F.append((b,d2,c2))
    c=np.array(c,float); V=rot(np.array(V)+c,c,**rk)
    return (V[np.array(F)],c,col)
def box(lo,hi,col,**rk):
    x0,y0,z0=lo;x1,y1,z1=hi
    V=np.array([(x,y,z) for x in (x0,x1) for y in (y0,y1) for z in (z0,z1)],float)
    F=[(0,1,3),(0,3,2),(4,6,7),(4,7,5),(0,4,5),(0,5,1),(2,3,7),(2,7,6),(0,2,6),(0,6,4),(1,5,7),(1,7,3)]
    c=V.mean(0); V=rot(V,c,**rk); return (V[np.array(F)],c,col)

def C(h): return tuple(int(h[i:i+2],16) for i in (1,3,5))
# --- värit (viileä talvisävy kuten v0.4) ---
OR=C("#C0562A");ORD=C("#9A4424");WH=C("#E8EAEE");BK=C("#1A1818")
PG=C("#7A6E66");PGD=C("#5E544E");PGL=C("#9C9088");AN=C("#B8AA92")
SQ=C("#7C7470");SQD=C("#5A5250");SQL=C("#B4AEAA")
TB=C("#1C2030");TBB=C("#283048");RED=C("#C82A20");GRB=C("#3A3A3A")
RV=C("#141418");RVB=C("#22222A")

def legs4(L,sx,zf,zb,ytop,col,foot=None,rx=.02,rz=.02,yb=0.0,seg=5,ring=3):
    for s,sv in ((1,"v"),(-1,"o")):
        for z,e in ((zf,"e"),(zb,"t")):
            h=(ytop-yb)/2; L.append((ell((s*sx,yb+h,z),(rx,h,rz),col,seg,ring),f"jalka_{e}{sv}"))
            if foot: L.append((box((s*sx-rx,yb,z-rz),(s*sx+rx,yb+.02*(ytop/.3),z+rz*1.6),foot),f"jalka_{e}{sv}"))

# ===== KETTU (säkä ~0.40 m, pituus ~0.65 m + häntä) =====
def kettu():
    L=[(ell((0,.32,0),(.085,.085,.23),OR,8,4),"runko"),(ell((0,.29,.15),(.06,.07,.08),WH,6,3),"runko"),(ell((0,.37,.2),(.045,.06,.05),OR,5,3,rx=35),"paa"),
       (ell((0,.42,.27),(.06,.055,.065),OR,7,4),"paa"),(ell((0,.40,.34),(.026,.022,.055),WH,5,3),"paa"),
       (box((-.009,.405,.39),(.009,.42,.4),BK),"paa"),
       (box((.022,.43,.315),(.032,.44,.32),BK),"paa"),(box((-.032,.43,.315),(-.022,.44,.32),BK),"paa")]
    for s,sv in ((1,"v"),(-1,"o")):
        L.append((ell((s*.035,.49,.27),(.02,.04,.01),OR,4,3,rz=-s*12),"korva_"+sv))
        L.append((ell((s*.04,.525,.27),(.011,.014,.008),BK,4,2,rz=-s*12),"korva_"+sv))
    legs4(L,.045,.17,-.16,.30,BK,rx=.018,rz=.02)
    L+= [(ell((0,.29,-.37),(.055,.055,.15),OR,6,4,rx=-12),"hanta"),(ell((0,.25,-.53),(.038,.038,.045),WH,5,3),"hanta")]
    N={"runko":(None,(0,0,0)),"paa":("runko",(0,.39,.21)),"korva_v":("paa",(.035,.46,.27)),"korva_o":("paa",(-.035,.46,.27)),
       "jalka_ev":("runko",(.045,.30,.17)),"jalka_eo":("runko",(-.045,.30,.17)),"jalka_tv":("runko",(.045,.30,-.16)),"jalka_to":("runko",(-.045,.30,-.16)),
       "hanta":("runko",(0,.31,-.22))}
    return L,N

# ===== PEURA (valkohäntäpeura, säkä ~0.95 m) =====
def peura():
    L=[(ell((0,.85,0),(.17,.19,.45),PG,8,4),"runko"),(ell((0,.74,0),(.12,.08,.36),PGL,5,2),"runko"),
       (ell((0,1.07,.42),(.075,.19,.085),PG,6,3,rx=30),"kaula"),(ell((0,1.0,.48),(.05,.08,.03),WH,5,2,rx=30),"kaula"),
       (ell((0,1.26,.58),(.07,.075,.13),PG,6,3,rx=15),"paa"),(ell((0,1.21,.69),(.035,.035,.04),PGD,5,3),"paa"),
       (box((-.015,1.215,.72),(.015,1.235,.735),BK),"paa")]
    for s,sv in ((1,"v"),(-1,"o")):
        L.append((ell((s*.1,1.36,.53),(.06,.025,.012),PG,4,3,rz=s*25),"korva_"+sv))
        # sarvet: tyvi + eteen kaartuva runko + 2 piikkiä (osa paa-nodea)
        L.append((box((s*.04-.01,1.31,.535),(s*.04+.01,1.42,.555),AN,rz=-s*25),"paa"))
        L.append((box((s*.09-.009,1.43,.48),(s*.09+.009,1.45,.66),AN,ry=-s*10),"paa"))
        L.append((box((s*.09-.008,1.44,.55),(s*.09+.008,1.54,.565),AN),"paa"))
    legs4(L,.09,.33,-.33,.72,PGD,rx=.03,rz=.035,seg=4,ring=3)
    for s,sv in ((1,"v"),(-1,"o")):
        for z,e in ((.33,"e"),(-.33,"t")): L.append((box((s*.09-.022,0,z-.02),(s*.09+.022,.05,z+.035),BK),f"jalka_{e}{sv}"))
    L+= [(ell((0,.93,-.47),(.05,.08,.025),PG,4,3,rx=-25),"hanta"),(ell((0,.9,-.485),(.045,.07,.02),WH,4,3,rx=-25),"hanta")]
    N={"runko":(None,(0,0,0)),"kaula":("runko",(0,.95,.33)),"paa":("kaula",(0,1.22,.5)),
       "korva_v":("paa",(.06,1.34,.53)),"korva_o":("paa",(-.06,1.34,.53)),
       "jalka_ev":("runko",(.09,.80,.33)),"jalka_eo":("runko",(-.09,.80,.33)),"jalka_tv":("runko",(.09,.82,-.33)),"jalka_to":("runko",(-.09,.82,-.33)),
       "hanta":("runko",(0,.97,-.44))}
    return L,N

# ===== ORAVA (vartalo ~0.20 m, häntä ~0.17 m) =====
def orava():
    L=[(ell((0,.075,0),(.04,.042,.08),SQ,6,4,rx=-10),"runko"),(ell((0,.065,.04),(.03,.03,.04),SQL,5,3),"runko"),
       (ell((0,.105,.085),(.03,.03,.035),SQ,6,4),"paa"),(box((-.004,.1,.118),(.004,.107,.123),BK),"paa"),
       (box((.017,.112,.105),(.024,.12,.11),BK),"paa"),(box((-.024,.112,.105),(-.017,.12,.11),BK),"paa")]
    for s,sv in ((1,"v"),(-1,"o")):
        L.append((ell((s*.017,.14,.08),(.007,.017,.004),SQ,4,2),"korva_"+sv))
        L.append((ell((s*.018,.162,.08),(.006,.01,.004),SQD,4,2),"korva_"+sv))  # tupsu
    legs4(L,.025,.055,-.05,.06,SQD,rx=.009,rz=.011,seg=4,ring=2)
    L+= [(ell((0,.08,-.1),(.03,.035,.035),SQ,6,3),"hanta"),(ell((0,.14,-.125),(.038,.05,.035),SQ,6,3,rx=15),"hanta"),
         (ell((0,.2,-.1),(.034,.035,.035),SQD,6,3),"hanta")]
    N={"runko":(None,(0,0,0)),"paa":("runko",(0,.09,.06)),"korva_v":("paa",(.017,.125,.08)),"korva_o":("paa",(-.017,.125,.08)),
       "jalka_ev":("runko",(.025,.055,.055)),"jalka_eo":("runko",(-.025,.055,.055)),"jalka_tv":("runko",(.025,.06,-.05)),"jalka_to":("runko",(-.025,.06,-.05)),
       "hanta":("runko",(0,.07,-.075))}
    return L,N

# ===== LINNUT =====
def lintu(body,bc,head,hc,beak,bkc,wing,wc,legtop,legc,tail,extra=()):
    """siipi mallinnettu kokoon taitettuna selän sivulle (litteä y:ssä), olkapää = pivot."""
    L=[(ell(*body,bc,8,4),"runko"),(ell(*head,hc,6,4),"paa"),(ell(*beak,bkc,4,2),"paa")]
    (wx,wy,wz),(rx,ry,rz)=wing
    for s,sv in ((1,"v"),(-1,"o")):
        L.append((ell((s*wx,wy,wz),(rx,ry,rz),wc,6,3),"siipi_"+sv))
        L.append((box((s*.008-.003,0,.0),(s*.008+.003,legtop,.006),legc),"jalka_"+sv))
        L.append((box((s*.008-.012,0,-.008),(s*.008+.012,.005,.03),legc),"jalka_"+sv))
    for p in extra: L.append(p)
    L+=tail
    return L
def teeri():
    hd=(0,.40,.15)
    ex=[(ell((s*.026,.415,.155),(.014,.009,.016),RED,4,2),"paa") for s in (1,-1)]
    ex+=[(ell((s*.095,.345,-.0),(.014,.009,.04),WH,4,2),"siipi_"+v) for s,v in ((1,"v"),(-1,"o"))]
    ex+=[(ell((0,.26,-.14),(.04,.03,.04),WH,5,2),"pyrsto")]
    tail=[(ell((s*.04,.31,-.25),(.025,.012,.09),TB,4,3,ry=-s*15,rx=-15),"pyrsto") for s in (1,-1)]
    tail+=[(ell((s*.09,.35,-.33),(.035,.01,.025),TB,4,2,ry=-s*60),"pyrsto") for s in (1,-1)]
    L=lintu(((0,.29,0),(.085,.085,.17)),TB,(hd,(.038,.042,.05)),TB,((0,.39,.21),(.01,.01,.025)),GRB,
            ((.075,.33,-.04),(.035,.012,.13)),TBB,.10,GRB,tail,ex)
    for i,(t,n) in enumerate(L):
        if n.startswith("jalka"): L[i]=((t[0]*np.array([1,1,1])+np.array([0,0,.0]),t[1],t[2]),n)
    N={"runko":(None,(0,0,0)),"paa":("runko",(0,.34,.12)),"siipi_v":("runko",(.065,.34,.07)),"siipi_o":("runko",(-.065,.34,.07)),
       "pyrsto":("runko",(0,.29,-.15)),"jalka_v":("runko",(.04,.22,0)),"jalka_o":("runko",(-.04,.22,0))}
    return lower(fixlegs(L,.04),N,.12)
def korppi():
    tail=[(ell((0,.25,-.25),(.055,.012,.1),RV,5,3,rx=8),"pyrsto")]
    L=lintu(((0,.24,0),(.075,.075,.18)),RV,((0,.34,.17),(.042,.045,.055)),RV,((0,.33,.25),(.014,.02,.05)),RVB,
            ((.065,.29,-.04),(.035,.012,.15)),RVB,.08,RVB,tail)
    N={"runko":(None,(0,0,0)),"paa":("runko",(0,.29,.14)),"siipi_v":("runko",(.055,.29,.09)),"siipi_o":("runko",(-.055,.29,.09)),
       "pyrsto":("runko",(0,.24,-.15)),"jalka_v":("runko",(.035,.18,0)),"jalka_o":("runko",(-.035,.18,0))}
    return lower(fixlegs(L,.035),N,.10)
def lower(L,N,dy):
    """laskee kaiken paitsi jalat dy alas (lyhyet linnunjalat)"""
    L=[((t-np.array([0,dy,0]),c-np.array([0,dy,0]),col),n) if not n.startswith("jalka") else ((t,c,col),n) for (t,c,col),n in L]
    N={k:(p,(v[0],v[1]-dy,v[2])) for k,(p,v) in N.items()}; N["runko"]=(None,(0,0,0)); return L,N
def fixlegs(L,dx):
    out=[]
    for (t,c,col),n in L:
        if n.startswith("jalka"):
            s=1 if n.endswith("v") else -1; t=t+np.array([s*(dx-.008),0,0]); c=c+np.array([s*(dx-.008),0,0])
        out.append(((t,c,col),n))
    return out

def write(name,L,N):
    order=list(N); bins=b"";views=[];accs=[];meshes=[];gn=[]; tris={}
    def add(arr,typ,mm=False):
        nonlocal bins
        d=arr.astype(np.float32).tobytes(); views.append({"buffer":0,"byteOffset":len(bins),"byteLength":len(d),"target":34962}); bins+=d
        a={"bufferView":len(views)-1,"componentType":5126,"count":len(arr),"type":typ}
        if mm: a["min"]=arr.min(0).tolist(); a["max"]=arr.max(0).tolist()
        accs.append(a); return len(accs)-1
    world={}
    for nd in order:
        T=[];Cc=[]
        for (t,c,col),n in L:
            if n!=nd: continue
            t=t.copy(); nr=np.cross(t[:,1]-t[:,0],t[:,2]-t[:,0])
            flip=(nr*(t.mean(1)-c)).sum(1)<0; t[flip]=t[flip][:,[0,2,1]]
            T.append(t); Cc+= [col]*len(t)
        assert T, nd
        t=np.concatenate(T); tris[nd]=len(t); world[nd]=(t,Cc)
        n=np.cross(t[:,1]-t[:,0],t[:,2]-t[:,0]); n/=np.linalg.norm(n,axis=1,keepdims=True)+1e-12
        piv=np.array(N[nd][1]); pos=(t-piv).reshape(-1,3)
        col=np.repeat(np.array([list(np.array(c)/255)+[1] for c in Cc]),3,0)
        ip=add(pos,"VEC3",True); inn=add(np.repeat(n,3,0),"VEC3"); ic=add(col,"VEC4")
        meshes.append({"name":nd,"primitives":[{"attributes":{"POSITION":ip,"NORMAL":inn,"COLOR_0":ic},"material":0}]})
        par=N[nd][0]; pp=np.array(N[par][1]) if par else np.zeros(3)
        gn.append({"name":nd,"mesh":len(meshes)-1,"translation":[round(float(v),6) for v in piv-pp]})
    for i,nd in enumerate(order):
        ch=[order.index(c) for c in order if N[c][0]==nd]
        if ch: gn[i]["children"]=ch
    gl={"asset":{"version":"2.0","generator":"generoi_elaimet.py"},"scene":0,"scenes":[{"name":name,"nodes":[0]}],
        "nodes":gn,"meshes":meshes,"materials":[{"pbrMetallicRoughness":{"baseColorFactor":[1,1,1,1],"metallicFactor":0,"roughnessFactor":1}}],
        "accessors":accs,"bufferViews":views,"buffers":[{"byteLength":len(bins)}]}
    js=json.dumps(gl).encode(); js+=b" "*((4-len(js)%4)%4)
    with open(os.path.join(OUT,name+".glb"),"wb") as f:
        f.write(struct.pack("<III",0x46546C67,2,12+8+len(js)+8+len(bins)))
        f.write(struct.pack("<II",len(js),0x4E4F534A)+js+struct.pack("<II",len(bins),0x004E4942)+bins)
    allt=np.concatenate([w[0] for w in world.values()]); allc=sum([w[1] for w in world.values()],[])
    print(f"{name}: {sum(tris.values())} tris, mitat x{np.ptp(allt[...,0]):.2f} y{allt[...,1].max():.2f} z{np.ptp(allt[...,2]):.2f}",tris)
    return allt,allc

def preview(models):
    from PIL import Image, ImageDraw
    sc=[700,700,700,700,700]; W=0; tiles=[]
    for name,(t,c) in models:
        s=400 if name=="peura" else (1600 if name=="orava" else 800)
        zmin,zmax=t[...,2].min(),t[...,2].max(); ymax=t[...,1].max()
        w=int((zmax-zmin)*s)+40; h=int(ymax*s)+60
        im=Image.new("RGB",(w,h),(176,190,210)); d=ImageDraw.Draw(im)
        order=np.argsort(t[...,0].mean(1))  # sivukuva +X:stä: pienin x ensin
        n=np.cross(t[:,1]-t[:,0],t[:,2]-t[:,0]); n/=np.linalg.norm(n,axis=1,keepdims=True)+1e-12
        lv=np.array([.6,.6,.3]); lv/=np.linalg.norm(lv)
        for i in order:
            k=.45+.55*max(0,n[i]@lv); col=tuple(int(min(255,v*k)) for v in c[i])
            d.polygon([(20+(p[2]-zmin)*s,h-20-p[1]*s) for p in t[i]],fill=col)
        d.line([(0,h-20),(w,h-20)],fill=(90,90,110)); d.text((5,5),f"{name} (1 m = {s}px)",fill=(0,0,0))
        tiles.append(im)
    W=sum(i.width for i in tiles)+10*len(tiles); H=max(i.height for i in tiles)
    out=Image.new("RGB",(W,H),(150,160,175)); x=0
    for i in tiles: out.paste(i,(x,H-i.height)); x+=i.width+10
    os.makedirs(os.path.dirname(PREV),exist_ok=True); out.save(PREV)

if __name__=="__main__":
    os.makedirs(OUT,exist_ok=True); res=[]
    for nm,fn in (("kettu",kettu),("peura",peura),("orava",orava),("teeri",teeri),("korppi",korppi)):
        L,N=fn(); res.append((nm,write(nm,L,N)))
    preview(res)
