#!/usr/bin/env python3
"""Metsäkauris (pukki + naaras) nodeiksi, sama sopimus ja solmut kuin peura.glb (generoi_elaimet.py).
Aja: python3 generoi_kauris.py -> mallit/elaimet/kauris.glb, kauris_naaras.glb + /workspace/jahti_varmuus/kauris_esikatselu.png"""
import os, math, json, struct
import numpy as np
from generoi_elaimet import ell, box, C, legs4, write, peura, OUT, BK, WH
RG=C("#7E7266");RGD=C("#5F564E");RGL=C("#A0968A");MZ=C("#2A2624");AN=C("#B49E7A");EAR=C("#6A6058")
PREV="/workspace/jahti_varmuus/kauris_esikatselu.png"

def kauris(pukki=True):
    L=[(ell((0,.58,0),(.12,.13,.33),RG,8,4),"runko"),(ell((0,.5,0),(.08,.05,.26),RGL,5,2),"runko"),
       (ell((0,.6,-.29),(.1,.1,.06),WH,6,3),"runko"),            # iso peili
       (ell((0,.79,.3),(.05,.14,.06),RG,6,3,rx=30),"kaula"),
       (ell((0,.93,.43),(.05,.055,.1),RG,6,3,rx=15),"paa"),(ell((0,.905,.52),(.03,.03,.035),MZ,5,3),"paa"),
       (ell((0,.875,.49),(.028,.018,.03),WH,4,2),"paa"),          # valkoinen leukaläiskä
       (box((-.012,.905,.55),(.012,.92,.56),BK),"paa")]
    for s,sv in ((1,"v"),(-1,"o")):
        L.append((ell((s*.065,1.0,.38),(.05,.025,.01),EAR,4,3,rz=s*40),"korva_"+sv))
        L.append((box((s*.045-.006,.94,.46),(s*.045+.006,.95,.47),BK),"paa"))  # silmä
        if pukki:  # lyhyet 3-haaraiset sarvet
            L.append((box((s*.03-.008,.97,.4),(s*.03+.008,1.15,.416),AN,rz=-s*8),"paa"))
            L.append((box((s*.034-.006,1.04,.41),(s*.034+.006,1.05,.47),AN,rx=-30),"paa"))
            L.append((box((s*.04-.006,1.10,.36),(s*.04+.006,1.11,.4),AN,rx=20),"paa"))
    legs4(L,.065,.24,-.24,.52,RGD,rx=.02,rz=.024,seg=4,ring=3)
    for s,sv in ((1,"v"),(-1,"o")):
        for z,e in ((.24,"e"),(-.24,"t")): L.append((box((s*.065-.015,0,z-.015),(s*.065+.015,.035,z+.025),BK),f"jalka_{e}{sv}"))
    L.append((ell((0,.65,-.335),(.025,.025,.012),WH,4,2),"hanta"))  # lähes näkymätön
    N={"runko":(None,(0,0,0)),"kaula":("runko",(0,.68,.24)),"paa":("kaula",(0,.88,.38)),
       "korva_v":("paa",(.04,.97,.38)),"korva_o":("paa",(-.04,.97,.38)),
       "jalka_ev":("runko",(.065,.55,.24)),"jalka_eo":("runko",(-.065,.55,.24)),"jalka_tv":("runko",(.065,.56,-.24)),"jalka_to":("runko",(-.065,.56,-.24)),
       "hanta":("runko",(0,.67,-.32))}
    assert list(N)==list(peura()[1]), "solmujärjestys poikkeaa peurasta"
    return L,N

def render(t,c,yaw,s,W,H):
    from PIL import Image, ImageDraw
    a=math.radians(yaw); R=np.array([[math.cos(a),0,-math.sin(a)],[0,1,0],[math.sin(a),0,math.cos(a)]])
    p=t@R.T; im=Image.new("RGB",(W,H),(236,236,230)); d=ImageDraw.Draw(im)
    n=np.cross(p[:,1]-p[:,0],p[:,2]-p[:,0]); n/=np.linalg.norm(n,axis=1,keepdims=True)+1e-12
    lv=np.array([.5,.7,.5]); lv/=np.linalg.norm(lv)
    for i in np.argsort(-p[...,2].mean(1)):  # kauimmat ensin (katsoja -Z:ssa... ks. alla)
        k=.5+.5*abs(n[i]@lv); col=tuple(int(min(255,v*k)) for v in c[i])
        d.polygon([(W/2+q[0]*s,H-15-q[1]*s) for q in p[i]],fill=col)
    d.line([(0,H-15),(W,H-15)],fill=(160,160,150)); return im

if __name__=="__main__":
    from PIL import Image, ImageDraw
    res=[]
    for nm,pk in (("kauris",True),("kauris_naaras",False)):
        L,N=kauris(pk); res.append((nm,write(nm,L,N)))
    res.append(("peura (vrt.)",write("_tmp_peura",*peura()))); os.remove(os.path.join(OUT,"_tmp_peura.glb"))
    s=300; W,H=520,500; out=Image.new("RGB",(W*3,H*2+20),(236,236,230)); d=ImageDraw.Draw(out)
    for j,(nm,(t,c)) in enumerate(res):
        c=np.array(c)
        for r,yaw in enumerate((-90,-45)):  # sivu (+X:stä) ja 3/4 edestä
            out.paste(render(t,c,yaw,s,W,H),(j*W,20+r*H))
        d.text((j*W+10,5),nm,fill=(0,0,0))
    os.makedirs(os.path.dirname(PREV),exist_ok=True); out.save(PREV); print(PREV)
