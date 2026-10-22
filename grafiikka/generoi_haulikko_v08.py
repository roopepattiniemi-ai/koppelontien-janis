#!/usr/bin/env python3
"""v0.8: realistisempi päällekkäispiippuinen haulikko (FP). Rajattu paletti, ei antialiasointia, valo ylävasemmalta.
Tuottaa haulikko_fp.png, haulikko_laukaus.png (rekyyli +18/+14), haulikko_tahtays.png (helmi (256,58)).
Esikatselu: /workspace/jahti_varmuus/haulikko_esikatselu_v08.png"""
import os, math
import numpy as np
from PIL import Image, ImageDraw
R=os.path.dirname(os.path.abspath(__file__)); P=lambda *a: os.path.join(R,*a)
W,H=512,256
WOOD=[(46,26,14),(72,42,22),(98,58,30),(124,76,40),(152,98,54),(180,124,72)]
STEEL=[(12,13,20),(24,27,38),(38,43,60),(60,68,92),(100,112,142),(150,162,190)]
GRAY=[(46,48,52),(80,82,88),(116,118,124),(156,158,164),(198,198,202)]
BRASS=[(120,84,30),(196,154,70),(246,222,146)]
GLOVE=[(30,33,26),(42,46,36),(58,62,50),(76,80,66),(96,100,84)]
YY,XX=np.mgrid[0:H,0:W].astype(float)
rng=np.random.default_rng(8)
NOISE=np.kron(rng.random((H//4+1,W//4+1)),np.ones((4,4)))[:H,:W]
NOISE2=np.kron(rng.random((H//2+1,W//2+1)),np.ones((2,2)))[:H,:W]

class Canvas:
    def __init__(s,ox=0,oy=0):
        s.a=np.zeros((H,W,4),np.uint8); s.ox,s.oy=ox,oy
    def put(s,mask,col):
        s.a[mask,:3]=col; s.a[mask,3]=255
    def polymask(s,pts):
        m=Image.new("L",(W,H),0); ImageDraw.Draw(m).polygon([(x+s.ox,y+s.oy) for x,y in pts],fill=1)
        return np.array(m).astype(bool)
    def ellmask(s,box):
        m=Image.new("L",(W,H),0); x0,y0,x1,y1=box; ImageDraw.Draw(m).ellipse((x0+s.ox,y0+s.oy,x1+s.ox,y1+s.oy),fill=1)
        return np.array(m).astype(bool)
    def axis(s,A,B):
        A=np.array(A,float)+(s.ox,s.oy); B=np.array(B,float)+(s.ox,s.oy); d=B-A; L=np.linalg.norm(d); u=d/L; n=np.array([-u[1],u[0]])
        t=((XX-A[0])*u[0]+(YY-A[1])*u[1])/L; l=(XX-A[0])*n[0]+(YY-A[1])*n[1]
        return t,l
    def tube(s,A,B,w0,w1,pal=STEEL,lightside=1):
        """sinistetty putki; s=-1..1 poikkisuunnassa, valo ylävasemmalta -> korostus valoisalla reunalla"""
        t,l=s.axis(A,B); hw=w0+(w1-w0)*np.clip(t,0,1); sv=l/hw*lightside
        m=(t>=0)&(t<=1)&(np.abs(sv)<=1)
        idx=np.full((H,W),2)
        idx[sv<-.1]=2; idx[(sv>=-.72)&(sv<-.42)]=4; idx[(sv>=-.86)&(sv<-.72)]=3; idx[(sv>=-.42)&(sv<-.22)]=3
        idx[sv>.25]=1; idx[np.abs(sv)>.9]=0; idx[(sv>.62)&(sv<=.8)]=2  # heijastus varjopuolella
        idx[(sv>=-.6)&(sv<-.52)&(NOISE2>.82)]=5  # kiiltopilkut
        for k in range(6): s.put(m&(idx==k),pal[k])
        return t,l,hw,m
    def wood(s,mask,A,B,checker=None,dark=0):
        t,l=s.axis(A,B)
        g=np.sin(l*0.55+np.sin(t*9)*2.2+NOISE*2.6)+0.35*np.sin(l*1.7+t*20)
        idx=np.where(g>0.55,4,np.where(g>-0.2,3,2))-dark
        # valo ylävasemmalta: vasen/ylä reuna vaaleampi
        ys,xs=np.where(mask)
        if len(xs):
            x0,y0=xs.min(),ys.min()
            rel=(XX-x0)+(YY-y0)*1.4
            span=max(1,np.percentile(rel[mask],95))
            idx=idx+np.where(rel<span*.18,1,0)-np.where(rel>span*.75,1,0)
        idx=np.clip(idx,0,5)
        for k in range(6): s.put(mask&(idx==k),WOOD[k])
        if checker is not None:
            cm=mask&checker; xx=(XX+YY).astype(int); yy=(XX-YY).astype(int)
            s.put(cm&((xx%4==0)|(yy%4==0)),WOOD[1])
            s.put(cm&((xx%4==2)&(yy%4==2)),WOOD[4])
    def outline(s,mask,col):
        e=mask&~(np.roll(mask,1,0)&np.roll(mask,-1,0)&np.roll(mask,1,1)&np.roll(mask,-1,1))
        s.put(e,col)
    def line(s,pts,col,w=1):
        im=Image.fromarray(s.a); ImageDraw.Draw(im).line([(x+s.ox,y+s.oy) for x,y in pts],fill=col+(255,),width=w); s.a=np.array(im)
    def ell(s,box,col):
        s.put(s.ellmask(box),col)
    def img(s): return Image.fromarray(s.a,"RGBA")

def engrave(c,mask,seed):
    r=np.random.default_rng(seed); ys,xs=np.where(mask)
    if not len(xs): return
    for _ in range(14):
        i=r.integers(len(xs)); cx,cy=xs[i],ys[i]; rr=r.integers(3,7); a0=r.random()*6
        for k in range(10):
            a=a0+k*0.55; x=int(cx+math.cos(a)*rr*(1-k*.06)); y=int(cy+math.sin(a)*rr*(1-k*.06))
            if 0<=x<W and 0<=y<H and mask[y,x]: c.a[y,x,:3]=GRAY[3] if k%3 else GRAY[0]; c.a[y,x,3]=255

def flash(c,cx,cy):
    cx+=c.ox; cy+=c.oy
    cols=[(255,150,50),(255,200,90),(255,236,160),(255,255,232)]
    for rr,col in zip((60,44,26,12),cols):
        pts=[(cx+math.cos(a)*rr*(1 if i%2 else .38),cy+math.sin(a)*rr*(1 if i%2 else .38)*.8) for i,a in enumerate(np.linspace(0,2*math.pi,19)[:-1]+.2)]
        m=Image.new("L",(W,H),0); ImageDraw.Draw(m).polygon(pts,fill=1); c.put(np.array(m).astype(bool),col)
    r=np.random.default_rng(3)
    for _ in range(18):  # kipinät
        a=r.random()*6.28; d=r.integers(30,70); x=int(cx+math.cos(a)*d); y=int(cy+math.sin(a)*d*.8)
        if 0<=x<W and 0<=y<H: c.a[y,x]=(255,230,140,255)

def glove(c,box,fingers):
    m=c.ellmask(box); c.put(m,GLOVE[2])
    x0,y0,x1,y1=box; t,l=c.axis((x0,y0),(x1,y1))
    c.put(m&(t<.3),GLOVE[3]); c.put(m&(t<.12),GLOVE[4]); c.put(m&(t>.78),GLOVE[1])
    for f in fingers: c.line(f,GLOVE[0],2)
    c.outline(m,GLOVE[0])

def hip(fl):
    ox,oy=(18,14) if fl else (0,0); c=Canvas(ox,oy)
    if fl: flash(c,252,80)
    # alempi piippu (piirretään ensin), sitten ylempi
    for A,B,w0,w1 in (((260,110),(374,256),11,27),((254,86),(364,256),12,28)):
        c.tube(A,B,w0,w1)
    # suut (ylempi päällimmäisenä)
    c.ell((248,100,272,118),STEEL[3]); c.ell((252,103,268,115),STEEL[0])
    c.ell((242,76,268,96),STEEL[4]); c.ell((245,78,265,94),STEEL[2]); c.ell((249,81,263,92),STEEL[0])
    # tuuletettu kisko ylemmän piipun valoisalla puolella
    for i in range(0,150,2):
        t=i/150; x=246+(330-246)*t; y=80+(232-80)*t
        c.a[int(y)+oy,int(x)+ox,:3]=STEEL[4] if (i//4)%2==0 else STEEL[1]; c.a[int(y)+oy,int(x)+ox,3]=255
        c.a[int(y)+oy,int(x)+1+ox,:3]=STEEL[3]; c.a[int(y)+oy,int(x)+1+ox,3]=255
    c.line([(244,78),(328,232)],STEEL[5]) ; 
    for i in range(10,150,8):  # kiskon tolpat
        t=i/150; x=246+(330-246)*t; y=80+(232-80)*t; c.line([(x+2,y),(x+5,y-1)],STEEL[1])
    c.ell((249,72,257,80),BRASS[0]); c.ell((250,73,256,78),BRASS[1]); c.a[74+oy,251+ox]=BRASS[2]+(255,)  # messinkihelmi
    # etutukki pähkinää, shakeeraus
    fm=c.polymask([(300,182),(388,176),(448,256),(330,256)])
    ch=c.polymask([(318,200),(392,196),(422,246),(342,248)])
    c.wood(fm,(300,182),(390,256),checker=ch); c.outline(fm,WOOD[0])
    c.put(c.polymask([(300,182),(388,176),(390,180),(302,186)]),WOOD[5])
    # lukkokehys harmaa kaiverrettu
    rm=c.polymask([(342,174),(394,166),(410,226),(358,238)]); c.put(rm,GRAY[2])
    c.put(rm&c.polymask([(342,174),(394,166),(396,176),(345,184)]),GRAY[4])
    c.put(rm&c.polymask([(395,166),(410,226),(402,228),(388,172)]),GRAY[1])
    engrave(c,rm&c.polymask([(348,186),(394,178),(404,222),(360,232)]),5); c.outline(rm,GRAY[0])
    for px,py in ((362,204),(388,198)): c.ell((px-3,py-3,px+3,py+3),GRAY[0]); c.a[py-1+oy,px-1+ox]=GRAY[4]+(255,)
    # avauskeli lukon päällä
    lm=c.polymask([(372,160),(398,156),(402,166),(380,170)]); c.put(lm,STEEL[2]); c.put(lm&c.polymask([(372,160),(398,156),(399,159),(373,163)]),STEEL[4]); c.outline(lm,STEEL[0])
    # liipaisinkaari + liipaisin
    c.line([(360,236),(366,248),(380,252),(394,246),(400,232)],STEEL[1],3); c.line([(361,236),(367,247)],STEEL[3])
    c.line([(380,230),(378,242)],STEEL[0],3); c.line([(379,231),(378,236)],STEEL[3])
    # tukki + pistoolikahva
    sm=c.polymask([(396,200),(432,184),(512,192),(512,256),(440,256),(404,236)])
    gm=c.polymask([(398,220),(424,214),(442,256),(410,256)])
    c.wood(sm,(396,190),(512,250),checker=gm); c.outline(sm,WOOD[0])
    c.put(c.polymask([(396,200),(432,184),(512,192),(512,197),(432,190),(400,204)]),WOOD[5])
    # oikea hanskakäsi kahvalla
    glove(c,(412,206,476,256),[[(430,222),(424,250)],[(442,220),(438,254)],[(454,220),(452,254)]])
    return c.img()

def ads():
    c=Canvas()
    c.ell((243,88,269,110),STEEL[3]); c.ell((248,92,264,106),STEEL[0])  # alempi suu ylemmän alla
    c.tube((256,70),(256,256),15,94)
    c.ell((240,60,272,84),STEEL[4]); c.ell((243,62,269,82),STEEL[2]); c.ell((248,66,264,79),STEEL[0])
    # tuuletettu kisko keskellä
    for y in range(64,256):
        hw=2+int((y-64)*.06)
        col=STEEL[3] if (y//5)%2==0 else STEEL[1]
        c.put((YY==y)&(np.abs(XX-256)<=hw),col)
        c.put((YY==y)&(XX==256-hw),STEEL[5]); c.put((YY==y)&(XX==256+hw),STEEL[0])
    # messinkihelmi, keskipiste (256,58)
    c.ell((253,55,259,61),BRASS[0]); c.ell((254,56,258,60),BRASS[1]); c.a[58,256]=BRASS[2]+(255,); c.a[57,255]=BRASS[2]+(255,)
    # etutukki
    fm=c.polymask([(148,192),(256,180),(364,192),(402,256),(110,256)])
    ch=c.polymask([(170,204),(240,198),(232,250),(150,252)])|c.polymask([(272,198),(342,204),(362,252),(280,250)])
    c.wood(fm,(110,190),(402,256),checker=ch); c.outline(fm,WOOD[0])
    c.put(c.polymask([(148,192),(256,180),(364,192),(366,196),(256,185),(146,196)]),WOOD[5])
    # lukkokehys + avauskeli alhaalla
    rm=c.polymask([(212,230),(300,230),(320,256),(192,256)]); c.put(rm,GRAY[2]); c.put(rm&(YY<234),GRAY[4])
    engrave(c,rm&(YY>235),9); c.outline(rm,GRAY[0])
    lm=c.polymask([(244,236),(268,236),(272,248),(240,248)]); c.put(lm,STEEL[2]); c.put(lm&(YY<239),STEEL[4]); c.outline(lm,STEEL[0])
    for sx in (-1,1):
        cx=256+sx*150
        glove(c,(cx-38,200,cx+38,256),[[(256+sx*(120+k*14),204),(256+sx*(112+k*14),228)] for k in range(3)])
    return c.img()

if __name__=="__main__":
    fp,la,ta=hip(False),hip(True),ads()
    fp.save(P("haulikko_fp.png")); la.save(P("haulikko_laukaus.png")); ta.save(P("haulikko_tahtays.png"))
    snow=Image.new("RGBA",(W*3+40,H+20),(222,228,236,255))
    for i,im in enumerate((fp,la,ta)): snow.alpha_composite(im,(10+i*(W+10),10))
    snow=snow.resize((snow.width*2,snow.height*2),Image.NEAREST)
    out="/workspace/jahti_varmuus/haulikko_esikatselu_v08.png"; os.makedirs(os.path.dirname(out),exist_ok=True); snow.save(out)
    print("helmi tahtays:",ta.getpixel((256,58)))
