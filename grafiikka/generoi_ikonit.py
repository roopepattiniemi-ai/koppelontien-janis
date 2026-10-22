# HUD-pikatoimintokuvakkeet 128x128 RGBA. Piirretään 4x (512) ja skaalataan LANCZOS.
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
S=4; N=128*S; OUT='/workspace/jahti/hud/ikonit'
CREAM=(240,236,222,255); ICE=(176,214,236,255); DARK=(22,28,36,255); ORA=(240,138,36,255)
OL=10*S  # ääriviiva
def new(): im=Image.new('RGBA',(N,N),(0,0,0,0)); return im,ImageDraw.Draw(im)
def p(v): return [c*S for c in v]
def shape(d,kind,xy,fill,**k):
    # tumma ääriviiva ensin paksumpana, sitten täyttö
    getattr(d,kind)(p(xy),fill=DARK,outline=DARK,width=OL,**k)
    getattr(d,kind)(p(xy),fill=fill,**k)
def line(d,xy,w,col):
    d.line(p(xy),fill=DARK,width=(w+10)*S,joint='curve'); d.line(p(xy),fill=col,width=w*S,joint='curve')
def kiikarit(d):
    shape(d,'rounded_rectangle',[22,40,58,96],CREAM,radius=10*S)
    shape(d,'rounded_rectangle',[70,40,106,96],CREAM,radius=10*S)
    shape(d,'rectangle',[54,52,74,72],ICE)
    shape(d,'ellipse',[26,78,54,104],ICE); shape(d,'ellipse',[74,78,102,104],ICE)
    d.ellipse(p([33,84,43,94]),fill=ORA); d.ellipse(p([81,84,91,94]),fill=ORA)
def ase(d,kivaari):
    shape(d,'polygon',[12,70,40,62,48,84,18,96],(150,98,58,255))   # tukki
    shape(d,'rectangle',[38,60,70,74],ICE)
    shape(d,'rectangle',[66,62,118,68] if kivaari else [66,58,118,72],CREAM)
    if kivaari: shape(d,'rounded_rectangle',[48,44,92,54],ICE,radius=4*S); d.rectangle(p([86,46,90,52]),fill=ORA)
    else: d.line(p([66,65,118,65]),fill=DARK,width=3*S); d.rectangle(p([112,58,118,62]),fill=ORA)
def auto(d):
    shape(d,'polygon',[30,58,44,34,90,34,100,58],ICE)
    shape(d,'rounded_rectangle',[14,56,114,88],CREAM,radius=10*S)
    shape(d,'ellipse',[24,76,50,102],ICE); shape(d,'ellipse',[78,76,104,102],ICE)
    d.rectangle(p([100,64,110,72]),fill=ORA)
def radio(d):
    line(d,[40,40,92,18],5,ICE)
    shape(d,'rounded_rectangle',[14,40,114,104],CREAM,radius=12*S)
    shape(d,'ellipse',[26,54,64,92],ICE)
    for y in (60,72,84): d.line(p([74,y,104,y]),fill=DARK,width=4*S)
    d.ellipse(p([39,67,51,79]),fill=ORA)
def kanava(d):
    shape(d,'rounded_rectangle',[14,44,114,96],CREAM,radius=10*S)
    d.line(p([24,80,104,80]),fill=DARK,width=4*S)
    for x in range(30,104,12): d.line(p([x,72,x,80]),fill=DARK,width=3*S)
    d.line(p([66,54,66,88]),fill=ORA,width=6*S)
    shape(d,'polygon',[84,14,112,30,84,46],ICE)  # seuraava-nuoli
    shape(d,'rectangle',[50,24,86,36],ICE)
def naru(d,kiinni):
    shape(d,'ellipse',[16,20,58,62],ICE); d.ellipse(p([28,32,46,50]),fill=(0,0,0,0))  # kahva-lenkki
    d.ellipse(p([28,32,46,50]),outline=DARK,width=3*S)
    if kiinni:
        line(d,[52,58,74,74,92,90],6,CREAM)
    else:
        line(d,[52,58,64,68],6,CREAM); line(d,[82,82,92,90],6,CREAM)
        for a in ([70,58,76,52],[66,80,58,86],[76,66,84,62]): d.line(p(a),fill=ORA,width=5*S)
    shape(d,'ellipse',[86,84,112,110],(150,98,58,255))  # kaulapanta
    d.ellipse(p([95,93,103,101]),fill=ORA)
def gps(d):
    line(d,[84,30,92,10],5,ICE)  # antenni
    shape(d,'rounded_rectangle',[30,24,98,112],CREAM,radius=12*S)
    shape(d,'rectangle',[40,36,88,84],ICE)
    d.line(p([44,74,58,58,70,66,84,44]),fill=DARK,width=3*S)  # reitti
    d.polygon(p([78,40,90,40,84,52]),fill=ORA); d.ellipse(p([79,36,89,46]),fill=ORA)
    for x in (48,64,80): d.ellipse(p([x-4,94,x+4,102]),fill=DARK)
def kyykky(d):
    shape(d,'ellipse',[58,14,82,38],CREAM)                      # pää
    shape(d,'polygon',[50,22,90,22,86,14,54,14],ICE)            # lakki
    d.rectangle(p([62,10,78,15]),fill=ORA)
    shape(d,'polygon',[50,40,84,40,92,76,46,80],ICE)            # takki, etukumara
    line(d,[84,48,104,66],9,ICE)                               # käsivarsi
    line(d,[50,78,40,98,66,104],12,CREAM)                      # takajalka polvella
    line(d,[84,76,96,94,92,112],12,CREAM)                      # etujalka
    shape(d,'rectangle',[30,98,70,108],DARK)
ICONS=[('kiikarit','B',kiikarit),('haulikko','Tab',lambda d:ase(d,False)),('kivaari','Tab',lambda d:ase(d,True)),
 ('auto','E',auto),('radio','R (autossa)',radio),('kanava','Q/Tab (autossa)',kanava),
 ('naru_kiinni','F',lambda d:naru(d,True)),('naru_irti','F',lambda d:naru(d,False)),('gps','G/M',gps),('kyykky','C',kyykky)]
os.makedirs(OUT,exist_ok=True); ims=[]
for n,k,f in ICONS:
    im,d=new(); f(d)
    # yhtenäinen paksu tumma ääriviiva koko siluetin ympäri (alfa-dilataatio)
    a=im.getchannel('A').point(lambda v:255 if v>0 else 0).filter(ImageFilter.MaxFilter(25)).filter(ImageFilter.MaxFilter(13))
    base=Image.new('RGBA',(N,N),DARK); base.putalpha(a); base.alpha_composite(im); im=base
    im=im.resize((128,128),Image.LANCZOS); im.save(f'{OUT}/ikoni_{n}.png'); ims.append((n,k,im))
W=40+len(ims)*160; pv=Image.new('RGBA',(W,230),(34,44,58,255)); dd=ImageDraw.Draw(pv)
for y in range(230): dd.line([0,y,W,y],fill=(30+y//12,40+y//10,56+y//8,255))
try: fo=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',14)
except: fo=ImageFont.load_default()
for i,(n,k,im) in enumerate(ims):
    x=36+i*160; pv.alpha_composite(im,(x,20)); dd.text((x+64,165),n,fill=CREAM,font=fo,anchor='mm'); dd.text((x+64,188),k,fill=ORA,font=fo,anchor='mm')
pv.convert('RGB').save('/workspace/jahti_varmuus/ikonit_esikatselu.png')
