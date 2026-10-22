#!/usr/bin/env python3
"""Saksanmetsästysterrieri (Deutscher Jagdterrier), toisen pelaajan koira -> mallit/koira_jagdterrier.glb.
Samat nodet, hierarkia ja (suhteelliset) pivotit kuin ajokoira.glb:ssä (generoi_mallit_v08.py DOG_N), joten
V8.bindNodes/animDog toimii sellaisenaan. Suunniteltu ajokoiran koordinaatistossa ja skaalattu K:lla (säkä ~0.35 m).
Käsin kirjoitettu GLB, vertex-värit, metrit, +Y ylös, eteen +Z, origo maassa. Ei GLB-animaatioita (kuten ajokoira)."""
import os, json, struct, math, numpy as np
from generoi_mallit_v08 import ellipsoid, box, P
K=0.565  # ajokoiran säkä ~.62 -> ~.35
BK=(24,22,22);BK2=(38,34,32);TN=(160,92,40);TN2=(140,78,34);NS=(12,10,10);EY=(8,8,8)
S=[]  # (V,F,col)-osa, node
def e(c,r,col,nd,seg=8,ring=5): S.append((ellipsoid(c,r,col,seg,ring),nd))
# runko: tiivis, lihaksikas, lyhyt; musta satula, ruskea rinta
e((0,.47,0),(.135,.145,.27),BK,"runko",12,8)
e((0,.56,-.02),(.125,.075,.23),BK2,"runko",10,4)          # karhea selkäkarva
e((0,.42,.17),(.09,.11,.1),TN,"runko",8,5)                # rinta
e((0,.6,.27),(.075,.11,.08),BK,"runko",8,4)               # kaula
e((0,.37,.02),(.1,.05,.2),BK2,"runko",8,4)                # vatsa
# pää: musta kallo, ruskea kuono + kulmamerkit
e((0,.7,.37),(.082,.075,.085),BK,"paa",10,6)
e((0,.665,.47),(.04,.036,.08),TN,"KUONO",8,4)
e((0,.64,.47),(.042,.018,.06),TN2,"KUONO",6,3)           # parta (karhea)
e((0,.685,.548),(.018,.015,.013),NS,"paa",6,3)            # kirsu
for sx in (1,-1):
    e((sx*.036,.722,.435),(.011,.011,.009),EY,"paa",6,3)  # silmä
    e((sx*.04,.745,.43),(.016,.009,.012),TN,"paa",6,3)    # kulmamerkki
for sx,s in ((1,"v"),(-1,"o")):
    # taittunut V-korva: kärki eteen-alas
    e((sx*.07,.725,.38),(.014,.045,.038),BK2,"korva_"+s,6,4)
    e((sx*.075,.735,.395),(.01,.018,.02),BK,"korva_"+s,6,3)
    for z,en in ((.18,"e"),(-.18,"t")):
        nd=f"jalka_{en}{s}"
        e((sx*.075,.34,z),(.038,.1,.045),BK,nd,6,3)       # reisi/olka musta
        e((sx*.075,.15,z),(.026,.12,.028),TN,nd,6,3)      # ruskea sääri
        e((sx*.075,.015,z+.02),(.03,.015,.038),TN2,nd,6,2)
# häntä: lyhyehkö, pystyssä, typistämätön
for y,z,c in ((.6,-.27,BK),(.68,-.29,BK),(.76,-.29,BK2)):
    e((0,y,z),(.024,.052,.024),c,"hanta",6,3)
JAW_Y=.665
N={"runko":(None,(0,0,0)),"paa":("runko",(0,.66,.30)),"leuka":("paa",(0,.655,.41)),
 "korva_v":("paa",(.07,.76,.37)),"korva_o":("paa",(-.07,.76,.37)),
 "jalka_ev":("runko",(.075,.43,.18)),"jalka_eo":("runko",(-.075,.43,.18)),"jalka_tv":("runko",(.075,.43,-.18)),"jalka_to":("runko",(-.075,.43,-.18)),
 "hanta":("runko",(0,.58,-.26))}
def build():
    tris={k:[] for k in N}; cols={k:[] for k in N}
    for (V,F,C),nd in S:
        V=np.array(V,np.float32); c=np.array(V.mean(0))
        for f in F:
            t=V[list(f)]
            n=np.cross(t[1]-t[0],t[2]-t[0])
            if np.dot(n,t.mean(0)-c)<0: t=t[[0,2,1]]
            k=nd if nd!="KUONO" else ("leuka" if t[:,1].mean()<JAW_Y else "paa")
            tris[k].append(t); cols[k].append(C[0])
    # suun sisäpinta (kuten ajokoiralla)
    c=np.array([0,.665,.47]); ring=[c+np.array([.04*math.cos(2*math.pi*j/8),0,.08*math.sin(2*math.pi*j/8)]) for j in range(8)]
    for j in range(8):
        a,b=ring[j],ring[(j+1)%8]
        tris["paa"].append(np.array([c,a,b]));cols["paa"].append((0x3A,0x1A,0x1A))
        tris["leuka"].append(np.array([c,b,a]));cols["leuka"].append((0x7A,0x2A,0x2A))
    order=list(N); bins=b"";views=[];accs=[];meshes=[];nodes=[]
    def add(arr,typ,mm=False):
        nonlocal bins
        d=arr.astype(np.float32).tobytes(); views.append({"buffer":0,"byteOffset":len(bins),"byteLength":len(d),"target":34962}); bins+=d
        a={"bufferView":len(views)-1,"componentType":5126,"count":len(arr),"type":typ}
        if mm: a["min"]=arr.min(0).tolist(); a["max"]=arr.max(0).tolist()
        accs.append(a); return len(accs)-1
    counts={}
    for nd in order:
        T=np.array(tris[nd],np.float32)*K; counts[nd]=len(T)
        n=np.cross(T[:,1]-T[:,0],T[:,2]-T[:,0]); n/=np.linalg.norm(n,axis=1,keepdims=True)+1e-12
        piv=np.array(N[nd][1])*K
        col=np.repeat(np.hstack([np.array(cols[nd])/255.0,np.ones((len(T),1))]),3,0)
        ip=add(T.reshape(-1,3)-piv,"VEC3",True); inn=add(np.repeat(n,3,0),"VEC3"); ic=add(col,"VEC4")
        meshes.append({"name":nd,"primitives":[{"attributes":{"POSITION":ip,"NORMAL":inn,"COLOR_0":ic},"material":0}]})
        pp=np.array(N[N[nd][0]][1])*K if N[nd][0] else np.zeros(3)
        nodes.append({"name":nd,"mesh":len(meshes)-1,"translation":[round(float(v),6) for v in piv-pp]})
    for i,nd in enumerate(order):
        ch=[order.index(c) for c in order if N[c][0]==nd]
        if ch: nodes[i]["children"]=ch
    gl={"asset":{"version":"2.0","generator":"generoi_jagdterrier.py"},"scene":0,"scenes":[{"name":"koira_jagdterrier","nodes":[0]}],
        "nodes":nodes,"meshes":meshes,"materials":[{"pbrMetallicRoughness":{"baseColorFactor":[1,1,1,1],"metallicFactor":0,"roughnessFactor":1}}],
        "accessors":accs,"bufferViews":views,"buffers":[{"byteLength":len(bins)}]}
    js=json.dumps(gl).encode(); js+=b" "*((4-len(js)%4)%4)
    with open(P("mallit","koira_jagdterrier.glb"),"wb") as f:
        f.write(struct.pack("<III",0x46546C67,2,12+8+len(js)+8+len(bins)))
        f.write(struct.pack("<II",len(js),0x4E4F534A)+js+struct.pack("<II",len(bins),0x004E4942)+bins)
    print("koira_jagdterrier.glb kolmiot",sum(counts.values()),counts)
if __name__=="__main__": build()
