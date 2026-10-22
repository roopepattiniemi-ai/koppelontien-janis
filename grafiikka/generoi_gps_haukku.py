#!/usr/bin/env python3
"""Tutkapannan HUD-ikonit (haukkutyypit, suuntanuoli, reittipiste). Pikselikartat: o=oranssi, k=musta ääriviiva, w=aalto, d=himmeä."""
import os
from PIL import Image
R=os.path.dirname(os.path.abspath(__file__))
PAL={'o':(230,90,40,255),'k':(20,20,20,255),'w':(236,238,242,255),'d':(150,110,90,150),'e':(60,60,60,150),'.':(0,0,0,0)}
def save(n,rows,sz):
    im=Image.new("RGBA",(sz,sz),(0,0,0,0))
    for y,r in enumerate(rows):
        for x,c in enumerate(r[:sz]): im.putpixel((x,y),PAL[c])
    im.save(os.path.join(R,"hud",n))
def pad(rows,sz=24): return [r.ljust(sz,'.') for r in rows]+['.'*sz]*(sz-len(rows))
AJO=pad(["","","","","","",
"...................k.w..",
"..................kok.w.",
"..k...............kook.w",
"...k.kkkkkkkkkk..kook..w",
"....kooooooooookkoook.w.",
"....koooooooooooooook.w.",
".....kooooooooookkkk.w..",
"......koookkkkook.......",
".....kook.....kook......",
"....kok........kok......",
"...kk...........kk......"])
SEIS=pad(["","","","",
".................k.k....",
"................kokok.w.",
"................kooook.w",
"................koook..w",
"...k.........kkkoook..w.",
"...ok.kkkkkkkooooook.w..",
"....kooooooooooooook....",
"....koooooooooooook.....",
"....kooooooooooook......",
"....kokkkkkkkkkok.......",
"....kok........kok......",
"....kok........kok......",
"....kok........kok......",
"....kk.........kk......."])
HH=pad(["","","",
".............k.k........",
"............kokok.......",
"............koook...w...",
"............kooook...w..",
"...........koook.....w..",
"..........koook.....w...",
".........koooook........",
"........kooooook........",
".......koooooook........",
"......kooooooook........",
".....koooooooook........",
".k..kooooooookok........",
"..kkoooooooookok........",
"...kkkkkkkkkkkkk........"])
HIL=[r.replace('o','d').replace('k','e').replace('w','.') for r in AJO]
save("gps_haukku_ajo.png",AJO,24); save("gps_haukku_seisonta.png",SEIS,24)
save("gps_haukku_haukku.png",HH,24); save("gps_haukku_hiljaa.png",HIL,24)
save("gps_suunta_nuoli.png",pad([".......kk.......","......kook......",".....kooook.....","....koooooook...","...koooooooook..","..kooookkooook..",".kkkkkokkokkkkk.","......kook......","......kook......","......kook......","......kook......","......kook......","......kkkk......"],16),16)
im=Image.new("RGBA",(4,4),(0,0,0,0))
for x,y in [(1,0),(2,0),(0,1),(1,1),(2,1),(3,1),(0,2),(1,2),(2,2),(3,2),(1,3),(2,3)]: im.putpixel((x,y),(255,140,26,255))
im.save(os.path.join(R,"hud","gps_reitti_piste.png"))
