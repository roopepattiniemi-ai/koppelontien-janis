#!/usr/bin/env python3
"""v0.8: janis.glb ja ajokoira.glb jaettuna nodeiksi proseduraalista animaatiota varten.
Lähde: v0.7-GLB:t (/workspace/jahti_varmuus/*_v07.glb, yksi mesh). Osien kolmiomäärät lasketaan samoista
osamäärittelyistä kuin generoi.py (hare2/dog2), joten kolmiot, värit ja normaalit kopioidaan sellaisinaan;
kunkin noden geometriasta vähennetään noden maailmapivot (ei rotaatioita), joten levossa malli on identtinen."""
import os, math, json, struct
import numpy as np
R=os.path.dirname(os.path.abspath(__file__)); P=lambda *a: os.path.join(R,*a)
SRC="/workspace/jahti_varmuus"
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
WH=(238,240,244);WG=(214,218,226);BKT=(20,18,18);PK=(200,150,150);TN=(186,120,58);TD=(150,92,44);TN2=(196,128,62)
# --- jänis (sama järjestys kuin generoi.py hare2), osa -> node ---
hare=[(ellipsoid((0,.16,-.04),(.11,.12,.2),WH,12,8),"runko"),(ellipsoid((0,.25,.17),(.06,.068,.09),WH,10,6),"paa"),
 (ellipsoid((0,.235,.245),(.035,.035,.03),WG,6,3),"paa"),(box((-.008,.235,.27),(.008,.248,.278),PK),"paa"),
 (ellipsoid((.055,.27,.215),(.012,.014,.012),BKT,6,3),"paa"),(ellipsoid((-.055,.27,.215),(.012,.014,.012),BKT,6,3),"paa"),
 (ellipsoid((.07,.07,-.11),(.045,.075,.11),WG,8,5),"jalka_tv"),(ellipsoid((-.07,.07,-.11),(.045,.075,.11),WG,8,5),"jalka_to"),
 (ellipsoid((.06,.025,.0),(.022,.02,.11),WG,6,4),"jalka_tv"),(ellipsoid((-.06,.025,.0),(.022,.02,.11),WG,6,4),"jalka_to"),
 (ellipsoid((.035,.07,.1),(.016,.07,.018),WH,6,4),"jalka_ev"),(ellipsoid((-.035,.07,.1),(.016,.07,.018),WH,6,4),"jalka_eo"),
 (ellipsoid((0,.17,-.25),(.035,.035,.03),WH,6,3),"hanta")]
for sx,s in ((1,"v"),(-1,"o")):
    hare.append((ellipsoid((sx*.03,.37,.14),(.02,.085,.012),WG,8,5),"korva_"+s))
    hare.append((ellipsoid((sx*.03,.435,.14),(.016,.022,.01),BKT,6,3),"korva_"+s))
# hierarkia: node -> (vanhempi, maailmapivot)
HARE_N={"runko":(None,(0,0,0)),"paa":("runko",(0,.21,.10)),"korva_v":("paa",(.03,.29,.14)),"korva_o":("paa",(-.03,.29,.14)),
 "jalka_ev":("runko",(.035,.14,.10)),"jalka_eo":("runko",(-.035,.14,.10)),"jalka_tv":("runko",(.07,.13,-.11)),"jalka_to":("runko",(-.07,.13,-.11)),
 "hanta":("runko",(0,.17,-.22))}
# --- koira (dog2) ---
dog=[(ellipsoid((0,.48,0),(.13,.14,.33),TN2,12,8),"runko"),(ellipsoid((0,.56,-.03),(.122,.08,.27),BKT,12,4),"runko"),
 (ellipsoid((0,.43,.2),(.085,.11,.12),WH,8,5),"runko"),(ellipsoid((0,.6,.3),(.065,.12,.075),TN2,8,4),"runko"),
 (ellipsoid((0,.7,.38),(.075,.075,.09),TN2,10,6),"paa"),(ellipsoid((0,.665,.48),(.036,.034,.075),TN,8,4),"KUONO"),
 (ellipsoid((0,.7,.42),(.012,.05,.04),WH,6,3),"paa"),(ellipsoid((0,.685,.555),(.016,.014,.012),BKT,6,3),"paa"),
 (ellipsoid((.035,.72,.44),(.01,.01,.008),BKT,6,3),"paa"),(ellipsoid((-.035,.72,.44),(.01,.01,.008),BKT,6,3),"paa")]
for sx,s in ((1,"v"),(-1,"o")):
    dog.append((ellipsoid((sx*.075,.68,.36),(.012,.065,.04),TD,6,4),"korva_"+s))
    for z,e in ((.22,"e"),(-.22,"t")):
        dog.append((ellipsoid((sx*.07,.33,z),(.03,.1,.035),TN2,6,3),f"jalka_{e}{s}"))
        dog.append((ellipsoid((sx*.07,.13,z),(.02,.13,.022),WH,6,3),f"jalka_{e}{s}"))
        dog.append((ellipsoid((sx*.07,.012,z+.02),(.025,.012,.035),WH,6,2),f"jalka_{e}{s}"))
for k,(y,z) in enumerate(((.58,-.33),(.6,-.42),(.6,-.5))):
    dog.append((ellipsoid((0,y,z),(.022,.022,.05),BKT if k<2 else TN2,6,3),"hanta"))
JAW_Y=.665  # kuonon ellipsoidin keskitaso: alapuoliskon kolmiot (painopiste y<JAW_Y) -> leuka
DOG_N={"runko":(None,(0,0,0)),"paa":("runko",(0,.66,.31)),"leuka":("paa",(0,.655,.41)),
 "korva_v":("paa",(.075,.74,.36)),"korva_o":("paa",(-.075,.74,.36)),
 "jalka_ev":("runko",(.07,.43,.22)),"jalka_eo":("runko",(-.07,.43,.22)),"jalka_tv":("runko",(.07,.43,-.22)),"jalka_to":("runko",(-.07,.43,-.22)),
 "hanta":("runko",(0,.58,-.29))}

def read_glb(path):
    b=open(path,"rb").read(); jl=struct.unpack_from("<I",b,12)[0]; js=json.loads(b[20:20+jl]); bo=20+jl+8; bn=b[bo:]
    out=[]
    for i in range(3):
        acc=js["accessors"][i]; bv=js["bufferViews"][acc["bufferView"]]; n=4 if acc["type"]=="VEC4" else 3
        out.append(np.frombuffer(bn,np.float32,acc["count"]*n,bv["byteOffset"]+acc.get("byteOffset",0)).reshape(-1,n).copy())
    return out

def is_single_mesh(path):
    b=open(path,"rb").read(); jl=struct.unpack_from("<I",b,12)[0]; js=json.loads(b[20:20+jl])
    return len(js["nodes"])==1 and len(js["meshes"])==1
def source_path(name):
    """Lähde: generoi.py:n juuri kirjoittama yhden meshin mallit/<name>.glb; jos se on jo nodetettu, varmuuskopio *_v07.glb."""
    cur=P("mallit",name+".glb")
    if os.path.exists(cur) and is_single_mesh(cur): return cur
    bk=os.path.join(SRC,name+"_v07.glb")
    if os.path.exists(bk) and is_single_mesh(bk): return bk
    raise SystemExit(f"{name}: ei yhden meshin lähdettä (aja ensin generoi.py)")
MOUTH=(0x3A/255,0x1A/255,0x1A/255,1.0); TONGUE=(0x7A/255,0x2A/255,0x2A/255,1.0)
def mouth_extra():
    """Koiran suun sisäpinta: kuonon ellipsoidin (0,.665,.48), r=(.036,.034,.075), 8 seg) päiväntasaajan kiekko.
    paa: kiekko alaspäin (#3A1A1A), leuka: kiekko ylöspäin (#7A2A2A, kieli). Levossa kiekot ovat suljetun kuonon sisällä."""
    c=np.array([0,.665,.48]); ring=[c+np.array([.036*math.cos(2*math.pi*j/8),0,.075*math.sin(2*math.pi*j/8)]) for j in range(8)]
    dn=[];up=[]
    for j in range(8):
        a,b=ring[j],ring[(j+1)%8]
        up+= [c,b,a]; dn+=[c,a,b]
    def tri(v,col):
        v=np.array(v,np.float32); n=np.cross(v[1::3]-v[0::3],v[2::3]-v[0::3]); n/=np.linalg.norm(n,axis=1,keepdims=True)
        return v,np.repeat(n,3,0).astype(np.float32),np.tile(np.array(col,np.float32),(len(v),1))
    return {"paa":tri(dn,MOUTH),"leuka":tri(up,TONGUE)}

def split(name,parts,nodes,extra=None):
    src_used=source_path(name); pos,nrm,col=read_glb(src_used)
    assign=[]; ref=[]
    for (V,F,_),nd in parts:
        V=np.array(V,np.float32); tri=V[np.array(F)]
        for t in tri:
            ref.append(t)
            assign.append(("leuka" if t[:,1].mean()<JAW_Y else "paa") if nd=="KUONO" else nd)
    ref=np.array(ref).reshape(-1,3)
    assert len(ref)==len(pos), (name,len(ref),len(pos))
    assert np.abs(ref-pos).max()<1e-5, "osamäärittelyt eivät vastaa v0.7-GLB:tä"
    assign=np.array(assign); order=list(nodes)
    bins=b"";views=[];accs=[];meshes=[];gnodes=[]
    def add(arr,typ,mm=False):
        nonlocal bins
        d=arr.astype(np.float32).tobytes(); views.append({"buffer":0,"byteOffset":len(bins),"byteLength":len(d),"target":34962}); bins+=d
        a={"bufferView":len(views)-1,"componentType":5126,"count":len(arr),"type":typ}
        if mm: a["min"]=arr.min(0).tolist(); a["max"]=arr.max(0).tolist()
        accs.append(a); return len(accs)-1
    for nd in order:
        par,piv=nodes[nd]; sel=np.repeat(assign==nd,3)
        assert sel.any(), nd
        wp,wn,wc=pos[sel],nrm[sel],col[sel]
        if extra and nd in extra:
            ev,en,ec=extra[nd]; wp=np.vstack([wp,ev]); wn=np.vstack([wn,en]); wc=np.vstack([wc,ec])
        lp=wp-np.array(piv,np.float32)
        ip=add(lp,"VEC3",True); inn=add(wn,"VEC3"); ic=add(wc,"VEC4")
        meshes.append({"name":nd,"primitives":[{"attributes":{"POSITION":ip,"NORMAL":inn,"COLOR_0":ic},"material":0}]})
        pp=np.array(nodes[par][1]) if par else np.zeros(3)
        gnodes.append({"name":nd,"mesh":len(meshes)-1,"translation":[round(float(v),6) for v in np.array(piv)-pp]})
    for i,nd in enumerate(order):
        ch=[order.index(c) for c in order if nodes[c][0]==nd]
        if ch: gnodes[i]["children"]=ch
    gl={"asset":{"version":"2.0","generator":"generoi_mallit_v08.py"},"scene":0,"scenes":[{"name":name,"nodes":[order.index("runko")]}],
        "nodes":gnodes,"meshes":meshes,"materials":[{"pbrMetallicRoughness":{"baseColorFactor":[1,1,1,1],"metallicFactor":0,"roughnessFactor":1}}],
        "accessors":accs,"bufferViews":views,"buffers":[{"byteLength":len(bins)}]}
    js=json.dumps(gl).encode(); js+=b" "*((4-len(js)%4)%4)
    with open(P("mallit",name+".glb"),"wb") as f:
        f.write(struct.pack("<III",0x46546C67,2,12+8+len(js)+8+len(bins)))
        f.write(struct.pack("<II",len(js),0x4E4F534A)+js+struct.pack("<II",len(bins),0x004E4942)+bins)
    print(name,"lähde",src_used,{nd:int((assign==nd).sum())+(len(extra[nd][0])//3 if extra and nd in extra else 0) for nd in order})

if __name__=="__main__":
    split("janis",hare,HARE_N); split("ajokoira",dog,DOG_N,mouth_extra())
