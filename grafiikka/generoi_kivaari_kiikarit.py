#!/usr/bin/env python3
"""Pulttilukkokivääri + kiikarit FP-käsineen -> mallit/kivaari.glb, mallit/kiikarit.glb, hud-overlayt. Piippu -Z, +Y ylös, +X oikea."""
import json, struct, math, random
import numpy as np
from PIL import Image, ImageDraw
R = random.Random(8)
def c(h): return tuple(int(h[i:i+2], 16)/255 for i in (1, 3, 5))
WOOD=[c('#3a1f0e'),c('#48280f'),c('#562f14'),c('#422410')]; STEEL=[c('#181c28'),c('#1e2333'),c('#151925')]
SILVER=[c('#b8bcc4'),c('#c8ccd2')]; ENGR=c('#5a5e66'); BRASS=c('#d8a842'); GLOVE=[c('#24271f'),c('#2c3026')]
ORANGE=[c('#ff6a00'),c('#f06200')]; REFL=c('#a8aaae'); BLACK=c('#101010')
def T(p): return np.array(p,float)   # suunnitellaan suoraan lopullisissa koordinaateissa
class M:
    def __init__(s): s.t=[]
    def tri(s,a,b,d,col,mat): s.t.append((T(a),T(b),T(d),col,mat))
    def quad(s,a,b,d,e,col,mat): s.tri(a,b,d,col,mat); s.tri(a,d,e,col,mat)
def pick(p): return p[R.randrange(len(p))] if isinstance(p,list) else p
def loft(m, secs, pal, mat, n=8, caps=True, engr=0):
    """secs: [(cx,cy,cz,rx,ry)] poikkileikkaukset z-suunnassa (tai mielivaltainen keskipiste)."""
    rings=[]
    for cx,cy,cz,rx,ry in secs:
        rings.append([np.array((cx+rx*math.cos(2*math.pi*(i+.5)/n), cy+ry*math.sin(2*math.pi*(i+.5)/n), cz)) for i in range(n)])
    for a,b in zip(rings,rings[1:]):
        for i in range(n):
            j=(i+1)%n; col=pick(pal)
            if engr and R.random()<engr: col=ENGR
            m.quad(a[i],a[j],b[j],b[i],col,mat)
    if caps:
        for r,sg in ((rings[0],1),(rings[-1],-1)):
            ctr=sum(r)/n
            for i in range(n):
                j=(i+1)%n; (m.tri(ctr,r[j],r[i],pick(pal),mat) if sg>0 else m.tri(ctr,r[i],r[j],pick(pal),mat))
def cylz(m,x,y,z0,z1,r,n,pal,mat,seg=1,caps=True):
    loft(m,[(x,y,z0+(z1-z0)*k/seg,r,r) for k in range(seg+1)],pal,mat,n,caps)
def tube(m,pts,r,n,pal,mat):
    """putki pisteiden läpi (yleinen suunta)."""
    pts=[np.array(p,float) for p in pts]; rings=[]
    for k,p in enumerate(pts):
        d=pts[min(k+1,len(pts)-1)]-pts[max(k-1,0)]; d/=np.linalg.norm(d)
        u=np.cross(d,(0,1,0)) if abs(d[1])<.9 else np.cross(d,(1,0,0)); u/=np.linalg.norm(u); v=np.cross(d,u)
        rr=r[k] if isinstance(r,list) else r
        rings.append([p+rr*(math.cos(2*math.pi*i/n)*u+math.sin(2*math.pi*i/n)*v) for i in range(n)])
    for a,b in zip(rings,rings[1:]):
        for i in range(n):
            j=(i+1)%n; m.quad(a[i],b[i],b[j],a[j],pick(pal),mat)
    for r_,s in ((rings[0],0),(rings[-1],1)):
        ctr=sum(r_)/n
        for i in range(n):
            j=(i+1)%n; m.tri(ctr,r_[i],r_[j],pick(pal),mat) if s else m.tri(ctr,r_[j],r_[i],pick(pal),mat)
def box(m,x0,x1,y0,y1,z0,z1,pal,mat):
    loft(m,[((x0+x1)/2,(y0+y1)/2,z,(x1-x0)/2*1.414,(y1-y0)/2*1.414) for z in (z0,z1)],pal,mat,4)


GREEN=[c('#1f2a1e'),c('#243022'),c('#1a2419')]; GLASS=c('#28384a')
def sph(m,ctr,r,pal,mat,n=6):
    x,y,z=ctr; loft(m,[(x,y,z+r*math.cos(math.pi*k/4),r*math.sin(math.pi*k/4)+1e-4,r*math.sin(math.pi*k/4)+1e-4) for k in range(5)],pal,mat,n)
def kasi(m,palm,fingers,sleeve,thumb):
    tube(m,palm[0],palm[1],8,GLOVE,'kangas')
    for f in fingers: tube(m,f,.0085,6,GLOVE,'kangas')
    tube(m,thumb,.009,6,GLOVE,'kangas')
    a,b=np.array(sleeve[0]),np.array(sleeve[1])
    tube(m,[a,a+(b-a)*.42],[.040,.045],10,ORANGE,'kangas'); tube(m,[a+(b-a)*.42,a+(b-a)*.52],.046,10,[REFL],'kangas')
    tube(m,[a+(b-a)*.52,b],[.046,.05],10,ORANGE,'kangas')
# ================= KIVÄÄRI (lopulliset koordinaatit: piippu -Z, +X oikea, origo liipaisimen yläpää)
runko,lukko,liip,kiik,ko,kv=M(),M(),M(),M(),M(),M()
# perätukki z=+0.40 -> ranne z=+0.06, monte carlo -kampa
loft(runko,[(0,-.045,.40,.021,.068),(0,-.040,.34,.021,.064),(0,-.030,.26,.020,.054),(0,-.018,.18,.018,.040),(0,-.008,.10,.016,.028),(0,-.004,.06,.017,.026)],WOOD,'puu',10)
cylz(runko,0,-.045,.40,.41,.0215,10,[BLACK],'kangas')                       # kumiperälevy
tube(runko,[(0,-.012,.075),(0,-.05,.085),(0,-.09,.095),(0,-.115,.10)],[.016,.017,.018,.019],8,WOOD,'puu')   # pistoolikahva
loft(runko,[(0,-.006,.06,.019,.026),(0,-.008,-.10,.020,.026),(0,-.008,-.30,.019,.022),(0,-.004,-.44,.016,.018)],WOOD,'puu',10)  # etutukki
cylz(runko,0,.018,.075,-.165,.0165,10,STEEL,'teras',seg=2)                  # lukkokehys
cylz(runko,0,.018,.10,.075,.012,8,STEEL,'teras')                            # lukon takakappale
box(runko,-.0035,.0035,.0045,.009,-.05,-.03,STEEL,'teras')                   # lipas/pohjarauta
box(runko,-.012,.012,-.03,-.018,.03,-.07,STEEL,'teras')
cylz(runko,0,.018,-.165,-.76,.0095,10,STEEL,'teras',seg=3)                  # piippu 0.6 m (z -0.16..-0.76)
cylz(runko,0,.018,-.7605,-.7595,.004,8,[BLACK],'teras')
tube(runko,[(0,-.022,.012),(0,-.045,.010),(0,-.052,-.015),(0,-.045,-.040),(0,-.022,-.045)],.003,5,STEEL,'teras')  # liipaisinkaari
# kiikarijalustat (renkaat)
for z in (.02,-.11):
    box(runko,-.008,.008,.032,.05,z+.008,z-.008,STEEL,'teras')
    loft(runko,[(0,.065,z+.007,.0155,.0155),(0,.065,z-.007,.0155,.0155)],STEEL,'teras',10)
# kiikari: okulaari z .04..+.115, putki, objektiivi z -.17..-.25
loft(kiik,[(0,.065,.115,.019,.019),(0,.065,.07,.019,.019),(0,.065,.045,.0125,.0125),(0,.065,-.15,.0125,.0125),(0,.065,-.19,.022,.022),(0,.065,-.25,.022,.022)],STEEL,'teras',12)
cylz(kiik,0,.065,.1155,.1145,.016,12,[GLASS],'teras'); cylz(kiik,0,.065,-.2505,-.2495,.019,12,[GLASS],'teras')
cylz(kiik,0,.081,-.03,-.06,.008,8,STEEL,'teras'); tube(kiik,[(.012,.065,-.045),(.024,.065,-.045)],.008,8,STEEL,'teras')  # säätötornit
# lukon vipu: pivot lukon akselilla (0,.018,.05)
tube(lukko,[(0,.018,.05),(.03,.008,.055),(.05,-.004,.062)],.0045,6,STEEL,'teras'); sph(lukko,(.055,-.007,.064),.009,STEEL,'teras',8)
# liipaisin
tube(liip,[(0,0,0),(0,-.012,.003),(0,-.022,.010)],[.0035,.003,.0025],5,STEEL,'teras')
# kädet (oikea +X)
kasi(ko,([(.012,-.01,.10),(.02,-.05,.09),(.02,-.09,.10)],[.026,.03,.028]),
     [[(.01,-.045+dy,.085),(-.008,-.046+dy,.063),(-.022,-.05+dy,.075)] for dy in (-.012,-.032,-.050)]
     +[[(.012,-.027,.06),(.006,-.010,.010),(0,-.012,-.002)]],
     [(.03,-.07,.13),(.10,-.26,.32)],[(.015,.008,.08),(-.012,.02,.06)])
kasi(kv,([(-.004,-.045,-.28),(0,-.042,-.32)],[.03,.03]),
     [[(-.02,-.04,-.28-dz),(-.026,-.015,-.285-dz),(-.018,.002,-.29-dz)] for dz in (0,.02,.04)],
     [(-.01,-.07,-.26),(-.12,-.30,.0)],[(.02,-.03,-.30),(.022,-.005,-.33)])
SILMA=(0,.065,.115+.08)
KIV=[('runko',runko,(0,0,0)),('lukko',lukko,(0,.018,.05)),('liipaisin',liip,(0,0,0)),('kiikaritahtain',kiik,(0,.065,0)),('kasi_oikea',ko,(0,0,0)),('kasi_vasen',kv,(0,0,0))]
# ================= KIIKARIT (origo okulaarien keskellä, linssit -Z)
kk,ko2,kv2=M(),M(),M()
for sx in (1,-1):
    x=.033*sx
    loft(kk,[(x,0,.012,.017,.017),(x,0,-.005,.019,.019),(x,0,-.02,.021,.021),(x,-.002,-.09,.024,.024),(x,-.004,-.15,.027,.027),(x,-.004,-.165,.027,.027)],GREEN,'kangas',10)
    cylz(kk,x,0,.0125,.0115,.011,10,[GLASS],'teras'); cylz(kk,x,-.004,-.1655,-.1645,.022,10,[GLASS],'teras')
    cylz(kk,x,0,.014,.012,.0175,10,[BLACK],'kangas')
box(kk,-.02,.02,.004,.016,-.03,-.12,[BLACK],'kangas'); cylz(kk,0,.012,-.04,-.06,.009,8,[BLACK],'kangas')   # silta + tarkennuspyörä
kasi(ko2,([(.06,-.01,-.05),(.062,-.012,-.11)],[.027,.027]),
     [[(.05,.022,-.06-dz),(.03,.032,-.065-dz),(.012,.022,-.07-dz)] for dz in (0,.022,.044)],
     [(.075,-.04,-.03),(.15,-.30,.20)],[(.04,-.03,-.08),(.03,-.03,-.13)])
kasi(kv2,([(-.06,-.01,-.05),(-.062,-.012,-.11)],[.027,.027]),
     [[(-.05,.022,-.06-dz),(-.03,.032,-.065-dz),(-.012,.022,-.07-dz)] for dz in (0,.022,.044)],
     [(-.075,-.04,-.03),(-.15,-.30,.20)],[(-.04,-.03,-.08),(-.03,-.03,-.13)])
KK=[('kiikarit_runko',kk,(0,0,0)),('kasi_oikea',ko2,(0,0,0)),('kasi_vasen',kv2,(0,0,0))]
MATS={'puu':(0,.75),'teras':(.8,.35),'messinki':(.9,.3),'kangas':(0,.95)}
def write(path,root,parts,empties,meshroot=False):
    bins=b''; views=[]; acc=[]; meshes=[]; nodes=[{'name':root,'children':[]}]
    matn=list(MATS); materials=[{'name':k,'pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],'metallicFactor':v[0],'roughnessFactor':v[1]}} for k,v in MATS.items()]
    def add(arr,minmax=False):
        nonlocal bins
        b=arr.astype(np.float32).tobytes(); views.append({'buffer':0,'byteOffset':len(bins),'byteLength':len(b),'target':34962}); bins+=b
        a={'bufferView':len(views)-1,'componentType':5126,'count':len(arr),'type':'VEC3'}
        if minmax: a['min']=arr.min(0).tolist(); a['max']=arr.max(0).tolist()
        acc.append(a); return len(acc)-1
    for name,m,piv in parts:
        wpos=np.array(piv,float); prims=[]
        for mat in matn:
            P,N,C=[],[],[]
            for a,b,d,col,mm in m.t:
                if mm!=mat: continue
                n_=np.cross(b-a,d-a); l=np.linalg.norm(n_); n_=n_/l if l else np.array((0,1,0))
                for p in (a,b,d): P.append(p-wpos); N.append(n_); C.append(col)
            if P: prims.append({'attributes':{'POSITION':add(np.array(P),True),'NORMAL':add(np.array(N)),'COLOR_0':add(np.array(C))},'material':matn.index(mat)})
        meshes.append({'name':name,'primitives':prims})
        if meshroot and name==parts[0][0]: nodes[0]['mesh']=len(meshes)-1; continue
        nd={'name':name,'mesh':len(meshes)-1}
        if wpos.any(): nd['translation']=wpos.tolist()
        nodes.append(nd); nodes[0]['children'].append(len(nodes)-1)
    for n,p in empties: nodes.append({'name':n,'translation':list(p)}); nodes[0]['children'].append(len(nodes)-1)
    g={'asset':{'version':'2.0','generator':'generoi_kivaari_kiikarit.py'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':nodes,'meshes':meshes,
       'materials':materials,'accessors':acc,'bufferViews':views,'buffers':[{'byteLength':len(bins)}]}
    js=json.dumps(g,separators=(',',':')).encode(); js+=b' '*((4-len(js)%4)%4); bins+=b'\0'*((4-len(bins)%4)%4)
    with open(path,'wb') as f:
        f.write(struct.pack('<III',0x46546C67,2,28+len(js)+len(bins))); f.write(struct.pack('<II',len(js),0x4E4F534A)+js+struct.pack('<II',len(bins),0x004E4942)+bins)
write('mallit/kivaari.glb','kivaari',KIV,[('suu',(0,.018,-.76)),('silma',SILMA)])
write('mallit/kiikarit.glb','kiikarit',KK,[],meshroot=True)
for nm,P in (('kivaari',KIV),('kiikarit',KK)):
    A=[t for _,m,_ in P for t in m.t]; Q=np.array([p for t in A for p in t[:3]])
    print(nm,'tris',len(A),{n:len(m.t) for n,m,_ in P},'bbox',Q.min(0).round(3),Q.max(0).round(3))
# ================= HUD
S=1024; yy,xx=np.mgrid[0:S,0:S]+.5
def overlay(dist,path,reticle=False):
    # dist: etäisyys aukon reunaan (neg sisällä); alfa 0 sisällä -> 255 ulkona, pehmeä vinjetti ~70 px
    a=np.clip((dist+70)/80,0,1)**1.6
    if reticle:
        dx,dy=np.abs(xx-S/2),np.abs(yy-S/2); r=np.hypot(xx-S/2,yy-S/2)
        thin=((dx<1.2)|(dy<1.2)); thick=(((dx<6)&(dy>150))|((dy<6)&(dx>150)))
        a=np.maximum(a,np.where((thin|thick)&(r<480),.95,0))
    img=np.zeros((S,S,4),np.uint8); img[...,3]=(a*255).astype(np.uint8); Image.fromarray(img,'RGBA').save(path)
overlay(np.hypot(xx-S/2,yy-S/2)-440,'hud/tahtain_kiikari.png',True)
overlay(np.minimum(np.hypot(xx-S/2-165,yy-S/2),np.hypot(xx-S/2+165,yy-S/2))-330,'hud/kiikarit_naakyma.png')
# ================= ESIKATSELU
L=np.array((.4,.8,.5)); L/=np.linalg.norm(L)
def view(ALL,W,H,proj,bg=(150,170,190)):
    im=Image.new('RGB',(W,H),bg); d=ImageDraw.Draw(im); polys=[]
    for a,b,e,col,_ in ALL:
        q=[proj(p) for p in (a,b,e)]
        if any(x is None for x in q): continue
        n_=np.cross(b-a,e-a); l=np.linalg.norm(n_); s=.45+.55*abs(np.dot(n_/l if l else n_,L))
        polys.append((sum(x[2] for x in q)/3,[(x[0],x[1]) for x in q],tuple(int(255*min(1,v*s)) for v in col)))
    for _,q,col in sorted(polys,key=lambda t:-t[0]): d.polygon(q,fill=col)
    return im
def persp(eye,look,f,W,H):
    eye=np.array(eye); fw=np.array(look)-eye; fw/=np.linalg.norm(fw); r=np.cross(fw,(0,1,0)); r/=np.linalg.norm(r); u=np.cross(r,fw)
    def pr(p):
        v=p-eye; z=v@fw
        return None if z<.01 else (W/2+f*(v@r)/z,H/2-f*(v@u)/z,z)
    return pr
KA=[t for _,m,_ in KIV for t in m.t]; BA=[t for _,m,_ in KK for t in m.t]
side=view(KA,1000,330,lambda p:(560+p[2]*700,140-p[1]*700,-p[0]))
fp=view(KA,500,330,persp((.06,.13,.42),(0,.03,-.6),330,500,330))
bs=view(BA,500,330,persp((.35,.15,.25),(0,-.05,-.08),500,500,330))
bf=view(BA,500,330,persp((0,.03,.30),(0,-.06,-.1),330,500,330))
def hudprev(p):
    bg=Image.new('RGBA',(330,330),(120,150,110,255)); o=Image.open(p).resize((330,330)); bg.alpha_composite(o); return bg.convert('RGB')
out=Image.new('RGB',(1000,1000),(60,60,60)); out.paste(side,(0,0)); out.paste(fp,(0,330)); out.paste(bs,(500,330)); out.paste(bf,(0,660))
h2=hudprev('hud/kiikarit_naakyma.png').resize((160,160)); h1=hudprev('hud/tahtain_kiikari.png').resize((160,160))
out.paste(h1,(500,665)); out.paste(h2,(670,665))
out.save('/workspace/jahti_varmuus/esikatselu_kivaari_kiikarit.png')
