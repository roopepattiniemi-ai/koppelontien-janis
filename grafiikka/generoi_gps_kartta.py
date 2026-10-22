#!/usr/bin/env python3
"""Viimeistelee Koodaribotin GPS-pohjan retro-GPS-tyyliin. Aja uudelleen milloin vain:
lukee hud/gps_kartta_pohja.png (kopioidaan kerran gps_kartta.png:stä) -> kirjoittaa hud/gps_kartta.png.
Jos hud/gps_korkeus.png on olemassa, lisää rinnevarjostuksen (valo luoteesta, 20 %)."""
import os, json, shutil
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
H=os.path.join(os.path.dirname(os.path.abspath(__file__)),"hud"); P=lambda f: os.path.join(H,f)
if not os.path.exists(P("gps_kartta_pohja.png")): shutil.copy2(P("gps_kartta.png"),P("gps_kartta_pohja.png"))
meta=json.load(open(P("gps_kartta.json"))); nimet=json.load(open(P("gps_kartta_nimet.json")))
hx=lambda h: np.array([int(h[i:i+2],16) for i in (1,3,5)])
V={k:hx(v) for k,v in meta["varit"].items()}
a=np.array(Image.open(P("gps_kartta_pohja.png")).convert("RGB")).astype(int); N=a.shape[0]
is_=lambda c: np.all(a==c,axis=-1)
# 1) dither metsään ja peltoon (kevyt 2x2-shakki)
yy,xx=np.mgrid[0:N,0:N]; chk=((xx+yy)%2==0)&(((xx//2+yy//2)%2)==0)
for k,d in (("metsa",np.array([12,18,10])),("pelto",np.array([-12,-10,-14]))):
    m=is_(V[k])&chk; a[m]+=d
# 2) tiet levemmiksi: kirkas tie ja metsätie laajennetaan 1 px (vain jos ohuita, MaxFilter 3 lisää ±1 px)
out=a.copy()
for k in ("metsatie","tie"):
    m=is_(V[k]); dil=np.array(Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)))>0
    keep=~(is_(V["mokki"])|is_(V["rak"])|is_(V["vesi"]))
    out[dil&keep]=V[k]
a=out
# 3) rinnevarjostus
hill=False
if os.path.exists(P("gps_korkeus.png")):
    km=json.load(open(P("gps_korkeus.json"))) if os.path.exists(P("gps_korkeus.json")) else {"min_m":0,"max_m":40}
    zi=Image.open(P("gps_korkeus.png")); zi.load()
    z=np.array(zi.convert("I"),dtype=float)/65535*(km["max_m"]-km["min_m"])
    z=np.array(Image.fromarray(z.astype(np.float32),"F").resize((N,N),Image.BILINEAR))
    zp=np.pad(z,2,mode="edge"); z=sum(zp[i:i+N,j:j+N] for i in range(5) for j in range(5))/25  # 5x5-pehmennys
    gy,gx=np.gradient(z*3/meta["m_per_px"]); az,alt=np.radians(315),np.radians(45)  # 3x korostus
    slope=np.arctan(np.hypot(gx,gy)); aspect=np.arctan2(-gx,gy)
    hs=np.sin(alt)*np.cos(slope)+np.cos(alt)*np.sin(slope)*np.cos(az-aspect)
    a=a*(1+np.clip((hs-np.sin(alt))*.6,-.2,.2))[...,None]; hill=True  # max ±20 %  # ~±20 %
# 4) hila 100 m välein origon kautta
step=100/meta["m_per_px"]; ox,oy=meta["maailma_origo_px"]
img=Image.fromarray(np.clip(a,0,255).astype(np.uint8)).convert("RGBA")
g=Image.new("RGBA",img.size,(0,0,0,0)); gd=ImageDraw.Draw(g)
k0=-int(ox//step)-1
for k in range(k0,int((N-ox)//step)+2):
    p=round(ox+k*step); gd.line((p,0,p,N),fill=(220,230,200,28)); q=round(oy+k*step); gd.line((0,q,N,q),fill=(220,230,200,28))
img.alpha_composite(g)
# 5) pikselifontti tummalla reunuksella
F=ImageFont.load_default()
def label(txt,x,y,col,scale=2,anchor="l"):
    w=int(F.getlength(txt))+2; t=Image.new("L",(w,16),0); ImageDraw.Draw(t).text((1,3),txt,fill=255,font=F)
    t=t.point(lambda v:255 if v>100 else 0).resize((w*scale,16*scale),Image.NEAREST)
    o=t.filter(ImageFilter.MaxFilter(3)); W,Hh=t.size
    if anchor=="c": x-=W//2
    if anchor=="r": x-=W
    img.paste(Image.new("RGBA",t.size,(10,14,10,255)),(int(x),int(y)),o); img.paste(Image.new("RGBA",t.size,col),(int(x),int(y)),t)
YEL=(240,192,48,255);GRN=(120,208,96,255)
ax,ay=nimet["koppelontie_ankkuri_px"]; label("Koppelontie",ax,ay-26,YEL,anchor="c")
mx,my=nimet["mokki_px"]; label("Mökki",mx+8,my-10,GRN)
label("© OpenStreetMap",N-4,N-16,(200,200,190,255),scale=1,anchor="r")
img.convert("RGB").save(P("gps_kartta.png"))
# 6) esikatselu: kehys + kartta mökin kohdalla
sx,sy,sw,sh=56,92,208,176
kehys=Image.open(P("gps_kehys.png")).convert("RGBA"); prev=Image.new("RGBA",kehys.size,(40,46,56,255))
crop=img.crop((int(mx-sw/2),int(my-sh/2),int(mx-sw/2)+sw,int(my-sh/2)+sh)); prev.paste(crop,(sx,sy)); prev.alpha_composite(kehys)
pl=Image.open(P("gps_pelaaja.png")).convert("RGBA"); prev.alpha_composite(pl,(sx+sw//2-8,sy+sh//2-8))
prev=prev.resize((prev.width*2,prev.height*2),Image.NEAREST); prev.convert("RGB").save(P("gps_kartta_esikatselu.png"))
print("rinnevarjostus:", "tehty" if hill else "EI (gps_korkeus.png puuttuu) – aja skripti uudelleen kun tiedosto on olemassa")
