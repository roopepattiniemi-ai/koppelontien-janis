#!/usr/bin/env python3
"""Over-under-haulikko + FP-kädet -> mallit/haulikko.glb. Piiput -Z, +Y ylös, origo liipaisimen yläpää."""
import json, struct, math, random
import numpy as np
from PIL import Image, ImageDraw
R = random.Random(8)
def c(h): return tuple(int(h[i:i+2], 16)/255 for i in (1, 3, 5))
WOOD=[c('#3a1f0e'),c('#48280f'),c('#562f14'),c('#422410')]; STEEL=[c('#181c28'),c('#1e2333'),c('#151925')]
SILVER=[c('#b8bcc4'),c('#c8ccd2')]; ENGR=c('#5a5e66'); BRASS=c('#d8a842'); GLOVE=[c('#24271f'),c('#2c3026')]
ORANGE=[c('#ff6a00'),c('#f06200')]; REFL=c('#a8aaae'); BLACK=c('#101010')
ZO, YO = 0.41, -0.04          # suunnittelukehyksen liipaisimen yläpää -> origo
def T(p): return np.array((-p[0], p[1]-YO, -(p[2]-ZO)))   # 180° Y-kierto: piippu -Z, oikea +X
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

runko,piiput,helmi,liip,ko,kv=M(),M(),M(),M(),M(),M()
# tukki: perälevy z=0 -> ranne z=.32
st=[(0,-.035,0,.021,.070),(0,-.032,.06,.021,.066),(0,-.025,.14,.020,.056),(0,-.016,.22,.018,.044),(0,-.008,.29,.016,.030),(0,-.010,.33,.016,.030),(0,-.012,.365,.020,.032)]
loft(runko,st,WOOD,'puu',10)
cylz(runko,0,-.035,-.008,0,.0215,10,[BLACK],'kangas')             # kumiperälevy
tube(runko,[(0,-.02,.33),(0,-.06,.315),(0,-.10,.30),(0,-.125,.292)],[.017,.018,.019,.020],8,WOOD,'puu')  # pistoolikahva
# lukkokehys z .365-.48
loft(runko,[(0,-.012,.365+.115*k/6,.024,.036) for k in range(7)],SILVER,'hopea',8,engr=.35)
# liipaisinkaari
tube(runko,[(0,-.042,.375),(0,-.068,.385),(0,-.074,.415),(0,-.066,.445),(0,-.042,.455)],.003,5,STEEL,'teras')
# liipaisin (pivot yläpää = origo)
tube(liip,[(0,-.040,.410),(0,-.052,.407),(0,-.062,.400)],[.0035,.003,.0025],5,STEEL,'teras')
# piiput (pivot sarana z=.48,y=-.035)
for y in (0.0,-.022):
    cylz(piiput,0,y,.48,1.15,.0105,12,STEEL,'teras',seg=3)
    cylz(piiput,0,y,1.1495,1.1505,.0072,12,[BLACK],'teras',caps=True)  # suuaukko
for z in np.arange(.50,1.14,.06): box(piiput,-.002,.002,.0095,.0145,z,z+.008,STEEL,'teras')  # kiskon tukipalat
box(piiput,-.0042,.0042,.0145,.0165,.485,1.15,STEEL,'teras')                                   # kisko
loft(piiput,[(0,-.040,.50,.019,.016),(0,-.042,.56,.021,.018),(0,-.042,.70,.020,.017),(0,-.038,.76,.016,.013)],WOOD,'puu',10)  # etutukki
cylz(helmi,0,.0185,1.140,1.146,.0022,8,[BRASS],'messinki')
# kädet (oikea = -X suunnittelukehyksessä)
def kasi(m,palm,fingers,sleeve,thumb):
    tube(m,palm[0],palm[1],8,GLOVE,'kangas')
    for f in fingers: tube(m,f,.0085,6,GLOVE,'kangas')
    tube(m,thumb,.009,6,GLOVE,'kangas')
    a,b=np.array(sleeve[0]),np.array(sleeve[1])
    tube(m,[a,a+(b-a)*.42],[.040,.045],10,ORANGE,'kangas'); tube(m,[a+(b-a)*.42,a+(b-a)*.52],.046,10,[REFL],'kangas')
    tube(m,[a+(b-a)*.52,b],[.046,.05],10,ORANGE,'kangas')
kasi(ko,([(-.012,-.03,.27),(-.02,-.07,.29),(-.02,-.105,.285)],[.026,.03,.028]),
     [[(-.01,-.065+dy,.29),(.008,-.066+dy,.312),(.022,-.07+dy,.30)] for dy in (-.012,-.032,-.050)]
     +[[(-.012,-.047,.318),(-.006,-.050,.395),(0,-.050,.405)]],
     [(-.03,-.09,.24),(-.10,-.28,.05)],[(-.015,-.012,.30),(.010,.005,.325)])
kasi(kv,([(.004,-.075,.63),(.0,-.072,.67)],[.03,.03]),
     [[(.02,-.07,.63+dz),(.026,-.045,.635+dz),(.016,-.028,.64+dz)] for dz in (0,.02,.04)],
     [(.01,-.10,.61),(.12,-.32,.36)],[(-.02,-.06,.65),(-.024,-.035,.68)])
# --- nodet (maailma) ---
HELMI=tuple(T((0,.0185,1.143)))
PIV={'runko':(0,0,0),'liipaisin':tuple(T((0,-.04,.41))),'piiput':tuple(T((0,-.035,.48)))}
MESH=[('runko',runko,None),('liipaisin',liip,None),('kasi_oikea',ko,None),('piiput',piiput,None),('helmi',helmi,'piiput'),('kasi_vasen',kv,'piiput')]
MATS={'puu':(0,.75),'teras':(.8,.35),'hopea':(.9,.3),'messinki':(.9,.3),'kangas':(0,.95)}
def write(path):
    bins=b''; views=[]; acc=[]; meshes=[]; nodes=[{'name':'haulikko','children':[]}]
    matn=list(MATS); materials=[{'name':k,'pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],'metallicFactor':v[0],'roughnessFactor':v[1]}} for k,v in MATS.items()]
    idx={}; world={'piiput':np.array(PIV['piiput'])}
    def add(arr,minmax=False):
        nonlocal bins
        b=arr.astype(np.float32).tobytes(); views.append({'buffer':0,'byteOffset':len(bins),'byteLength':len(b),'target':34962}); bins+=b
        a={'bufferView':len(views)-1,'componentType':5126,'count':len(arr),'type':'VEC3'}
        if minmax: a['min']=arr.min(0).tolist(); a['max']=arr.max(0).tolist()
        acc.append(a); return len(acc)-1
    for name,m,par in MESH:
        wpos=np.array(HELMI if name=='helmi' else PIV.get(name,(0,0,0)),float)   # noden maailmapivot
        base=world[par] if par else np.zeros(3); off=wpos-base if name!='kasi_vasen' else np.zeros(3)
        if name=='kasi_vasen': wpos=base
        prims=[]
        for mat in matn:
            P,N,C=[],[],[]
            for a,b,d,col,mm in m.t:
                if mm!=mat: continue
                n_=np.cross(b-a,d-a); l=np.linalg.norm(n_); n_=n_/l if l else np.array((0,1,0))
                for p in (a,b,d): P.append(p-wpos); N.append(n_); C.append(col)
            if P: prims.append({'attributes':{'POSITION':add(np.array(P),True),'NORMAL':add(np.array(N)),'COLOR_0':add(np.array(C))},'material':matn.index(mat)})
        meshes.append({'name':name,'primitives':prims})
        nd={'name':name,'mesh':len(meshes)-1}
        if off.any(): nd['translation']=off.tolist()
        nodes.append(nd); idx[name]=len(nodes)-1
        (nodes[idx[par]].setdefault('children',[]) if par else nodes[0]['children']).append(len(nodes)-1)
    pz=world['piiput']; suu=np.array(T((0,0,1.15)))-pz
    nodes.append({'name':'suu','translation':suu.tolist()}); nodes[idx['piiput']]['children'].append(len(nodes)-1)
    g={'asset':{'version':'2.0','generator':'generoi_haulikko_3d.py'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':nodes,'meshes':meshes,
       'materials':materials,'accessors':acc,'bufferViews':views,'buffers':[{'byteLength':len(bins)}]}
    js=json.dumps(g,separators=(',',':')).encode(); js+=b' '*((4-len(js)%4)%4); bins+=b'\0'*((4-len(bins)%4)%4)
    with open(path,'wb') as f:
        f.write(struct.pack('<III',0x46546C67,2,28+len(js)+len(bins))); f.write(struct.pack('<II',len(js),0x4E4F534A)+js+struct.pack('<II',len(bins),0x004E4942)+bins)
write('mallit/haulikko.glb')
ALL=[t for _,m,_ in MESH for t in m.t]; print('tris',len(ALL),{n:len(m.t) for n,m,_ in MESH})
P=np.array([p for t in ALL for p in t[:3]]); print('bbox',P.min(0).round(3),P.max(0).round(3))
for k,v in {'helmi':T((0,.0207,1.143)),'suu_yla':T((0,0,1.15)),'suu_ala':T((0,-.022,1.15)),'patruuna_yla':T((0,0,.48)),'patruuna_ala':T((0,-.022,.48)),'silma':T((0,.040,.18)),'sarana':T((0,-.035,.48))}.items(): print(k,np.round(v,3))
# --- esikatselu ---
L=np.array((.4,.8,.5)); L/=np.linalg.norm(L)
def view(W,H,proj):
    im=Image.new('RGB',(W,H),(150,170,190)); d=ImageDraw.Draw(im); polys=[]
    for a,b,e,col,_ in ALL:
        q=[proj(p) for p in (a,b,e)]
        if any(x is None for x in q): continue
        n_=np.cross(b-a,e-a); l=np.linalg.norm(n_); s=.45+.55*abs(np.dot(n_/l if l else n_,L))
        polys.append((sum(x[2] for x in q)/3,[(x[0],x[1]) for x in q],tuple(int(255*min(1,v*s)) for v in col)))
    for _,q,col in sorted(polys,key=lambda t:-t[0]): d.polygon(q,fill=col)
    return im
side=view(900,300,lambda p:(450-(p[2]+.30)*1000*.75+250,170-p[1]*1000*.75,p[0]))
def persp(eye,look,f,W,H):
    eye=np.array(eye); fw=np.array(look)-eye; fw/=np.linalg.norm(fw); r=np.cross(fw,(0,1,0)); r/=np.linalg.norm(r); u=np.cross(r,fw)
    def pr(p):
        v=p-eye; z=v@fw
        return None if z<.01 else (W/2+f*(v@r)/z,H/2-f*(v@u)/z,z)
    return pr
fp=view(450,300,persp((-.12,.17,.42),(-.04,.06,-.8),330,450,300))
sight=view(450,300,persp(tuple(T((0,.040,.18))),tuple(T((0,.0207,1.143))),1100,450,300))
ImageDraw.Draw(sight).ellipse((222,147,228,153),outline=(255,0,0))
out=Image.new('RGB',(900,600)); out.paste(side,(0,0)); out.paste(fp,(0,300)); out.paste(sight,(450,300)); out.save('/workspace/jahti_varmuus/haulikko_3d_esikatselu.png')
