# Kylttitekstuurit + postilaatikko.glb. Aja: python3 generoi_kyltit.py
import json,struct,os,numpy as np
from PIL import Image,ImageDraw,ImageFont,ImageOps
os.chdir(os.path.dirname(os.path.abspath(__file__)))
T='tekstuurit/kyltit/'; FB='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
BL=(0,87,168,255); W=(255,255,255,255); BK=(16,16,18,255)
def font(s): return ImageFont.truetype(FB,s)
def txt(d,xy,s,f,c,anchor='lm'): d.fontmode='1'; d.text(xy,s,font=f,fill=c,anchor=anchor)
def viitta(teksti,nimi,numero=None):
    w,h=256,64; tip=26
    def tee(vasen):
        im=Image.new('RGBA',(w,h),(0,0,0,0)); d=ImageDraw.Draw(im)
        poly=lambda o:[(o,o),(w-1-tip-o//2,o),(w-1-o,h//2-0.5),(w-1-tip-o//2,h-1-o),(o,h-1-o)]
        d.polygon(poly(0),fill=W); d.polygon(poly(3),fill=BL)
        if vasen: im=ImageOps.mirror(im); d=ImageDraw.Draw(im)
        x=12+(tip if vasen else 0)
        if numero:
            f=font(16); tw=d.textlength(numero,font=f)+8
            d.rectangle([x,h//2-11,x+tw,h//2+10],fill=W); d.rectangle([x+2,h//2-9,x+tw-2,h//2+8],outline=BL)
            txt(d,(x+tw/2,h//2),numero,f,BL,'mm'); x+=tw+8
        lim=(w-8 if vasen else w-tip-8)-x; s=30
        while d.textlength(teksti,font=font(s))>lim: s-=1
        txt(d,(x,h//2+1),teksti,font(s),W); return im
    tee(False).save(T+nimi+'.png'); tee(True).save(T+nimi+'_vasen.png')
out=[viitta('Koppelontie','kyltti_koppelontie'),viitta('Löyhingintie','kyltti_loyhingintie'),viitta('Yli-Vallintie','kyltti_ylivallintie','6921')]
im=Image.new('RGBA',(64,32),BK); d=ImageDraw.Draw(im); d.rectangle([1,1,62,30],outline=(200,200,200,255))
txt(d,(32,16),'30',font(26),(250,250,240,255),'mm'); im.save(T+'kyltti_osoite_30.png')
im=Image.new('RGBA',(128,32),(0,0,0,0)); d=ImageDraw.Draw(im); d.rectangle([0,0,127,31],fill=(238,234,220,255),outline=(60,60,60,255))
txt(d,(64,16),'Koppelontie 30',font(13),BK,'mm'); im.save(T+'postilaatikko_teksti.png')
# --- postilaatikko.glb ---
P=[];N=[];C=[]
def quad(a,b,c,d_,col):
    n=np.cross(np.subtract(b,a),np.subtract(c,a)); n=n/np.linalg.norm(n)
    for v in (a,b,c,a,c,d_): P.append(v);N.append(n);C.append(col)
def box(lo,hi,col):
    x0,y0,z0=lo;x1,y1,z1=hi
    quad((x0,y0,z1),(x1,y0,z1),(x1,y1,z1),(x0,y1,z1),col);quad((x1,y0,z0),(x0,y0,z0),(x0,y1,z0),(x1,y1,z0),col)
    quad((x1,y0,z1),(x1,y0,z0),(x1,y1,z0),(x1,y1,z1),col);quad((x0,y0,z0),(x0,y0,z1),(x0,y1,z1),(x0,y1,z0),col)
    quad((x0,y1,z1),(x1,y1,z1),(x1,y1,z0),(x0,y1,z0),col);quad((x0,y0,z0),(x1,y0,z0),(x1,y0,z1),(x0,y0,z1),col)
WOOD=(.42,.30,.18);MET=(.55,.60,.58);DK=(.30,.33,.32);SN=(.92,.94,.98)
box((-.05,0,-.05),(.05,1.0,.05),WOOD)             # puutolppa
box((-.22,1.0,-.06),(.22,1.04,.06),WOOD)           # poikkilauta
box((-.16,1.04,-.25),(.16,1.30,.25),MET)           # laatikon runko
# kaareva katto (puolisylinteri, akseli Z)
import math
for i in range(6):
    a0,a1=math.pi*i/6,math.pi*(i+1)/6
    p=lambda a,z:(.16*math.cos(a),1.30+.12*math.sin(a),z)
    quad(p(a0,.25),p(a0,-.25),p(a1,-.25),p(a1,.25),MET)
    quad((0,1.30,.25),p(a0,.25),p(a1,.25),(0,1.30,.25),MET)  # degeneroitu -> etupääty
    quad((0,1.30,-.25),p(a1,-.25),p(a0,-.25),(0,1.30,-.25),MET)
box((-.14,1.36,-.15),(.14,1.37,.20),SN)            # lumi kannella (matala)
box((.16,1.18,-.02),(.18,1.36,.02),(.75,.12,.10))  # punainen lippu sivulla
box((-.03,1.24,.25),(.03,1.27,.27),DK)             # luukun kahva
n0=len(P)
# nimilappu-quad etupäädyssä (0.20 x 0.05 m), z=0.252
q=[(-.10,1.07,.252),(.10,1.07,.252),(.10,1.12,.252),(-.10,1.12,.252)]
for v in (q[0],q[1],q[2],q[0],q[2],q[3]): P.append(v);N.append((0,0,1));C.append((1,1,1))
UV=[(0,0)]*n0+[(0,1),(1,1),(1,0),(0,1),(1,0),(0,0)]
P=np.array(P,'f4');N=np.array(N,'f4');C=np.array(C,'f4');UV=np.array(UV,'f4')
bufs=[P.tobytes(),N.tobytes(),C.tobytes(),UV.tobytes()]; bin_=b''.join(bufs); off=np.cumsum([0]+[len(b) for b in bufs])
bv=[{"buffer":0,"byteOffset":int(off[i]),"byteLength":len(bufs[i])} for i in range(4)]
def acc(i,first,cnt,t):
    a={"bufferView":i,"byteOffset":first*(12 if t=='VEC3' else 8),"componentType":5126,"count":cnt,"type":t}
    if i==0: s=P[first:first+cnt]; a["min"]=s.min(0).tolist(); a["max"]=s.max(0).tolist()
    return a
n1=len(P)-n0; A=[acc(0,0,n0,'VEC3'),acc(1,0,n0,'VEC3'),acc(2,0,n0,'VEC3'),acc(0,n0,n1,'VEC3'),acc(1,n0,n1,'VEC3'),acc(2,n0,n1,'VEC3'),acc(3,n0,n1,'VEC2')]
g={"asset":{"version":"2.0","generator":"generoi_kyltit.py"},"scene":0,"scenes":[{"nodes":[0]}],
 "nodes":[{"name":"postilaatikko","mesh":0}],
 "meshes":[{"primitives":[{"attributes":{"POSITION":0,"NORMAL":1,"COLOR_0":2},"material":0},
   {"attributes":{"POSITION":3,"NORMAL":4,"COLOR_0":5,"TEXCOORD_0":6},"material":1}]}],
 "materials":[{"name":"postilaatikko","pbrMetallicRoughness":{"baseColorFactor":[1,1,1,1],"metallicFactor":0,"roughnessFactor":1}},
   {"name":"nimilappu","pbrMetallicRoughness":{"baseColorFactor":[1,1,1,1],"metallicFactor":0,"roughnessFactor":1}}],
 "accessors":A,"bufferViews":bv,"buffers":[{"byteLength":len(bin_)}]}
j=json.dumps(g).encode(); j+=b' '*(-len(j)%4); bin_+=b'\0'*(-len(bin_)%4)
with open('mallit/kyltit/postilaatikko.glb','wb') as f:
    f.write(struct.pack('<III',0x46546C67,2,12+8+len(j)+8+len(bin_)));f.write(struct.pack('<II',len(j),0x4E4F534A)+j);f.write(struct.pack('<II',len(bin_),0x004E4942)+bin_)
print('tris',len(P)//3)
# --- esikatselu ---
files=['kyltti_koppelontie','kyltti_koppelontie_vasen','kyltti_loyhingintie','kyltti_loyhingintie_vasen','kyltti_ylivallintie','kyltti_ylivallintie_vasen','kyltti_osoite_30','postilaatikko_teksti']
pv=Image.new('RGBA',(1100,1000),(176,190,210,255)); y=10
for i,fn in enumerate(files):
    t=Image.open(T+fn+'.png'); s=2 if t.width==256 else 4
    t=t.resize((t.width*s,t.height*s),Image.NEAREST); x=10+(i%2)*540
    pv.alpha_composite(t,(x,y));
    if i%2: y+=t.height+16
# postilaatikko sivukuva (z-y) projektio
d=ImageDraw.Draw(pv); sc=300; ox,oy=600,980
for k in range(0,len(P),3):
    pts=[(ox+P[k+m][2]*sc,oy-P[k+m][1]*sc) for m in range(3)]
    d.polygon(pts,fill=tuple(int(c*255) for c in C[k]))
pv.save('/workspace/jahti_varmuus/esikatselu_kyltit.png')
