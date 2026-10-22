#!/usr/bin/env python3
"""v0.4: mokki.glb ja vitara.glb (käsin kirjoitettu GLB, verteksivärit, metrit, +Y ylös, edessä +Z)."""
import os, math, json, struct
import numpy as np
from PIL import Image, ImageDraw
R=os.path.dirname(os.path.abspath(__file__)); P=lambda *a: os.path.join(R,*a)
CUBE=[(0,1,3),(0,3,2),(4,6,7),(4,7,5),(0,4,5),(0,5,1),(2,3,7),(2,7,6),(0,2,6),(0,6,4),(1,5,7),(1,7,3)]
def prism(v8,col): return list(v8),CUBE,col   # v8 järjestys: x0/x1 × y0/y1 × z0/z1 (kuten box)
def box(lo,hi,col):
    return prism([(x,y,z) for x in (lo[0],hi[0]) for y in (lo[1],hi[1]) for z in (lo[2],hi[2])],col)
def tri2(a,b,c,col): return [a,b,c],[(0,1,2),(0,2,1)],col
def cyl(c,r,w,col,seg=12,hub=None):  # akseli X
    V=[];F=[];x0=c[0]-w/2;x1=c[0]+w/2
    for x in (x0,x1):
        for j in range(seg): a=2*math.pi*j/seg; V.append((x,c[1]+r*math.cos(a),c[2]+r*math.sin(a)))
    V+= [(x0,c[1],c[2]),(x1,c[1],c[2])]
    for j in range(seg):
        k=(j+1)%seg; F+=[(j,k,seg+k),(j,seg+k,seg+j),(2*seg,k,j),(2*seg+1,seg+j,seg+k)]
    return V,F,col
def mesh(parts):
    tv=[];tc=[]
    for v,f,col in parts:
        v=np.array(v,np.float32)
        for t in f: tv+=list(v[list(t)]); tc+=[col]*3
    tv=np.array(tv,np.float32); tc=np.clip(np.array(tc,np.float32)/255*np.array([.94,.97,1.04]),0,1)
    n=np.cross(tv[1::3]-tv[0::3],tv[2::3]-tv[0::3]); n/=np.linalg.norm(n,axis=1,keepdims=True)+1e-9
    return tv,np.repeat(n,3,0).astype(np.float32),np.hstack([tc,np.ones((len(tc),1))]).astype(np.float32)
def write_glb(path,root,nodes):
    """nodes: [(name, translation, parts or None)]"""
    bins=[];views=[];acc=[];meshes=[];gnodes=[{"name":root,"children":list(range(1,len(nodes)+1))}];off=0
    for name,tr,parts in nodes:
        nd={"name":name,"translation":list(tr)}
        if parts:
            tv,nn,cc=mesh(parts); ai=len(acc)
            for arr,typ in ((tv,"VEC3"),(nn,"VEC3"),(cc,"VEC4")):
                b=arr.tobytes(); views.append({"buffer":0,"byteOffset":off,"byteLength":len(b)}); off+=len(b); bins.append(b)
                a={"bufferView":len(views)-1,"componentType":5126,"count":len(arr),"type":typ}
                if arr is tv: a["min"]=tv.min(0).tolist(); a["max"]=tv.max(0).tolist()
                acc.append(a)
            meshes.append({"name":name,"primitives":[{"attributes":{"POSITION":ai,"NORMAL":ai+1,"COLOR_0":ai+2},"material":0}]}); nd["mesh"]=len(meshes)-1
        gnodes.append(nd)
    gl={"asset":{"version":"2.0","generator":"generoi_mallit_v04.py"},"scene":0,"scenes":[{"nodes":[0]}],"nodes":gnodes,"meshes":meshes,
        "materials":[{"pbrMetallicRoughness":{"baseColorFactor":[1,1,1,1],"metallicFactor":0,"roughnessFactor":1}}],
        "accessors":acc,"bufferViews":views,"buffers":[{"byteLength":off}]}
    js=json.dumps(gl).encode(); js+=b" "*((4-len(js)%4)%4); bn=b"".join(bins)
    with open(path,"wb") as f:
        f.write(struct.pack("<III",0x46546C67,2,28+len(js)+len(bn)))
        f.write(struct.pack("<II",len(js),0x4E4F534A)+js+struct.pack("<II",len(bn),0x004E4942)+bn)
    out=[]  # maailmakoordinaatit esikatseluun
    for name,tr,parts in nodes:
        if parts: tv,_,cc=mesh(parts); out.append((tv+np.array(tr,np.float32),cc))
    tv=np.vstack([o[0] for o in out]); cc=np.vstack([o[1] for o in out]); return tv,cc,len(tv)//3

# ---------- mökki ----------
RED=(142,42,30);RED2=(110,30,22);WHT=(236,236,230);DK=(28,34,44);SNOW=(238,242,248);ROOF=(54,50,48);GREY=(110,106,104);WOOD=(120,86,56)
W,D,H,RH=3.0,2.5,2.6,4.5  # puolileveys x, puolisyvyys z, seinä, harja
m=[box((-W,0,-D),(W,H,D),RED)]
for y in np.arange(0.25,H,0.3):  # hirsiraidat
    m.append(box((-W-.02,y,D),(W+.02,y+.05,D+.02),RED2)); m.append(box((-W-.02,y,-D-.02),(W+.02,y+.05,-D),RED2))
    m.append(box((W,y,-D),(W+.02,y+.05,D),RED2)); m.append(box((-W-.02,y,-D),(-W,y+.05,D),RED2))
for sx in (-1,1):
    for sz in (-1,1): m.append(box((sx*W-.08,0,sz*D-.08),(sx*W+.08,H,sz*D+.08),WHT))
    m.append(tri2((sx*W,H,-D),(sx*W,H,D),(sx*W,RH-.1,0),RED))  # päätykolmiot
    m.append(box((sx*W-.01*sx,1.0,-.5),(sx*W+.05*sx,1.9,.5),WHT)) if False else None
m=[p for p in m if p]
def window(cx,cz,face):  # face: 'z+' 'z-' 'x+' 'x-'
    out=[]
    if face[0]=='z':
        s=1 if face[1]=='+' else -1; z=s*D
        out.append(box((cx-.45,1.0,min(z,z+s*.06)),(cx+.45,1.9,max(z,z+s*.06)),WHT))
        out.append(box((cx-.36,1.08,min(z,z+s*.08)),(cx+.36,1.82,max(z,z+s*.08)),DK))
        out.append(box((cx-.03,1.08,min(z,z+s*.1)),(cx+.03,1.82,max(z,z+s*.1)),WHT))
    else:
        s=1 if face[1]=='+' else -1; x=s*W
        out.append(box((min(x,x+s*.06),1.0,cz-.45),(max(x,x+s*.06),1.9,cz+.45),WHT))
        out.append(box((min(x,x+s*.08),1.08,cz-.36),(max(x,x+s*.08),1.82,cz+.36),DK))
        out.append(box((min(x,x+s*.1),1.08,cz-.03),(max(x,x+s*.1),1.82,cz+.03),WHT))
    return out
for w in ((-1.6,0,'z+'),(1.7,0,'z+'),(-1.2,0,'z-'),(1.2,0,'z-'),(0,0,'x+'),(0,0,'x-')): m+=window(*w)
m.append(box((-.05-.5,0.3,D),(.55,2.15,D+.08),WHT)); m.append(box((-.45,0.35,D),(.45,2.08,D+.11),(70,48,32)))  # ovi
m.append(box((.3,1.15,D+.11),(.38,1.22,D+.16),(200,190,120)))
m.append(box((-.9,0,D),(.9,.3,D+1.2),WOOD)); m.append(box((-.7,0,D+1.2),(.7,.15,D+1.55),WOOD))  # kuisti+porras
m.append(box((-.9,.3,D+1.1),(-.82,2.2,D+1.18),WHT)); m.append(box((.82,.3,D+1.1),(.9,2.2,D+1.18),WHT))
m.append(prism([(x,y,z) for x in (-1.05,1.05) for y,z in (((2.25,D),(2.35,D)) if False else ())] ,ROOF)) if False else None
m.append(box((-1.05,2.2,D),(1.05,2.3,D+1.35),ROOF)); m.append(box((-1.05,2.3,D),(1.05,2.36,D+1.35),SNOW))
OX,EY,OZ,T=3.35,2.35,2.95,.14
for s in (-1,1):  # katto + lumi
    for y0,th,col in ((0,T,ROOF),(T,.12,SNOW)):
        x0,x1=-OX,OX; a=(0,RH+y0); b=(s*OZ,EY+y0)
        v=[]
        for x in (x0,x1):
            for dy in (0,th):
                for (zz,yy) in (a,b) if s<0 else (b,a): v.append((x,yy+dy,zz))
        m.append(prism(v,col))
m.append(box((1.2,3.4,-1.2),(1.75,5.1,-.65),GREY)); m.append(box((1.15,5.1,-1.25),(1.8,5.2,-.6),SNOW))
mok=write_glb(P("mallit","mokki.glb"),"mokki",[("mokki_runko",(0,0,0),m)])

# ---------- Vitara ----------
GR=(34,72,48);GR2=(26,56,38);BLK=(22,22,24);GLS=(40,52,66);LT=(230,226,200);RL=(180,40,30);TY=(26,26,28);RIM=(150,154,160)
L,HW=1.8,.85  # puolipituus, puolileveys
b=[box((-HW,.38,-L+.1),(HW,1.05,L-.15),GR)]
b.append(prism([(x,y,z) for x in (-HW,HW) for y,z in () ] ,GR)) if False else None
# ohjaamo: kapeneva prisma
cz0,cz1=-L+.15,.55; cv=[]
for x in (-HW+.03,HW-.03):
    for y in (1.05,1.7):
        xi=x*(1 if y<1.5 else .9)
        for z in (cz0,cz1 if y<1.5 else cz1-.45): cv.append((xi,y,z))
b.append(prism(cv,GR))
b.append(prism([(x*(.98 if y<1.5 else .89),y,z) for x in (-HW+.03,HW-.03) for y in (1.1,1.62) for z in ((cz1+.012,) if False else (cz1-.05,cz1+.01))] if False else
  [(x,y,z) for x in (-.74,.74) for y,z in ()],GLS)) if False else None
# lasit (ohuet laatat)
b.append(prism([(x,y,z) for x in (-.72,.72) for (y,z0) in ((1.1,cz1+.005),(1.62,cz1-.395)) for z in (z0,z0+.02)],GLS))  # tuulilasi
for s in (-1,1):
    x=s*(HW-.02); b.append(box((min(x,x+s*.02)-0.0,1.12,-.15),(max(x,x+s*.02)+.0,1.6,.45),GLS))
    b.append(box((min(x,x+s*.02),1.12,-1.55),(max(x,x+s*.02),1.6,-.25),GLS))
    b.append(box((min(x,x+s*.01),.45,-.3),(max(x,x+s*.01),1.04,-.29),GR2))  # oven sauma
    b.append(box((s*HW-(.04 if s>0 else -.04)*0-.03*(s<0),.38,-1.25),(s*HW+.03*(s>0),.5,1.1),BLK) if True else None)  # kynnys
    for z in (1.15,-1.15): b.append(box((s*HW-.06*(s<0)-.0,.62 if True else 0,z-.42),(s*HW+.06*(s>0),.7,z+.42),BLK))  # lokasuojan reunat
b.append(box((-.72,1.12,-L+.13),(.72,1.6,-L+.15),GLS))  # takalasi
b.append(box((-.9,.3,L-.15),(.9,.55,L+.02),BLK)); b.append(box((-.9,.3,-L-.02),(.9,.55,-L+.1),BLK))  # puskurit
b.append(box((-.7,.6,L-.15),(.7,.95,L-.13),BLK))  # säleikkö
for s in (-1,1):
    b.append(box((s*.78-.1,.7,L-.15),(s*.78+.1,.85,L-.12),LT)); b.append(box((s*.8-.06,.7,-L+.08),(s*.8+.06,.95,-L+.1),RL))
b.append(box((-.95,1.0,.1),(-.85,1.08,.3),BLK)); b.append(box((.85,1.0,.1),(.95,1.08,.3),BLK))  # peilit
b.append(cyl((0,.8,-L-.08),.31,.2,TY)); b.append(cyl((0,.8,-L-.19),.18,.02,GR2))  # vararengas (akseli X->kierrä)
# kierrä vararengas Z-akselille: vaihda x<->z suhteessa keskipisteeseen
v,f,c=b[-2]; b[-2]=([(p[2]-(-L-.08),p[1],(-L-.08)+(p[0]-0)*1) if False else (p[0],p[1],p[2]) for p in v],f,c)
def spare(cz,r,w,col):
    V,F,C=cyl((0,0,0),r,w,col); return ([(p[1]*0+p[2],p[1]+.8,cz+p[0]) for p in V],F,C)
b=b[:-2]+[spare(-L-.12,.31,.2,TY),spare(-L-.23,.17,.02,RIM)]
b=[p for p in b if p]
WX,WZ,WR=.74,1.15,.33
def wheel(): return [cyl((0,0,0),WR,.22,TY,14),cyl((0,0,0),.18,.23,RIM,8)]
nodes=[("vitara_kori",(0,0,0),b)]+[(n,(sx*WX,WR,sz*WZ),wheel()) for n,sx,sz in (("pyora_ev",1,1),("pyora_eo",-1,1),("pyora_tv",1,-1),("pyora_to",-1,-1))]
nodes+=[("ovi_kuljettaja",(HW+.05,1.0,.1),None),("ovi_takaluukku",(0,1.0,-L-.3),None)]
vit=write_glb(P("mallit","vitara.glb"),"vitara",nodes)

# ---------- esikatselu ----------
def render(tv,tc,view,sz=300):
    im=Image.new("RGB",(sz,sz),(176,190,210)); d=ImageDraw.Draw(im)
    if view=="sivu": u,v,dp=tv[:,2],tv[:,1],tv[:,0]
    elif view=="edesta": u,v,dp=tv[:,0],tv[:,1],tv[:,2]
    else: c,s=math.cos(.7),math.sin(.7); u=tv[:,0]*c+tv[:,2]*s; dp=-tv[:,0]*s+tv[:,2]*c; v=tv[:,1]+dp*.35; dp=dp-tv[:,1]*.2
    k=sz*.85/max(np.ptp(u),np.ptp(v)); cu=(u.max()+u.min())/2; cv_=(v.max()+v.min())/2
    tri=np.arange(len(tv)).reshape(-1,3); n=np.cross(tv[1::3]-tv[0::3],tv[2::3]-tv[0::3]); n/=np.linalg.norm(n,axis=1,keepdims=True)+1e-9
    Lv=np.array([.4,.8,.45]); Lv/=np.linalg.norm(Lv)
    for t in np.argsort(dp[tri].mean(1)):
        sh=.55+.45*abs(n[t]@Lv); d.polygon([(sz/2+(u[i]-cu)*k,sz/2-(v[i]-cv_)*k) for i in tri[t]],fill=tuple(int(x*255*sh) for x in tc[tri[t][0]]))
    return im
sheet=Image.new("RGB",(940,660),(40,46,56)); d=ImageDraw.Draw(sheet)
for r,(nm,(tv,tc,nt)) in enumerate((("mokki.glb",mok),("vitara.glb",vit))):
    for c,vw in enumerate(("edesta","sivu","3/4")):
        sheet.paste(render(tv,tc,vw),(10+c*310,10+r*325)); d.text((10+c*310,312+r*325),f"{nm} {vw} - {nt} tris",fill=(255,255,255))
sheet.save(P("mallit_esikatselu_v04.png"))
for nm,(tv,tc,nt) in (("mokki",mok),("vitara",vit)): print(nm,nt,"tris bbox",tv.min(0).round(2),tv.max(0).round(2))
