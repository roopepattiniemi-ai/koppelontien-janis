# AWS Terrarium z15 -> 16-bit korkeuskuva 1024x1024 samalla kohdistuksella kuin gps_kartta.json, + pelin heightmap-data
import math,json,os,urllib.request,io
from PIL import Image
import numpy as np
K=json.load(open('../grafiikka/hud/gps_kartta.json'))
CLAT,CLON=K['mokki_geo'];CW=K['mokki_maailma'];MPP=K['m_per_px'];PX=1024;Z=15
MLAT=111320.0;MLON=111320.0*math.cos(math.radians(CLAT))
def geo(x,z):return (CLAT-(z-CW[1])/MLAT, CLON+(x-CW[0])/MLON)
def tilexy(lat,lon):n=2**Z;return ((lon+180)/360*n,(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*n)
la0,lo0=geo(-600,-600);la1,lo1=geo(600,600)
tx0,ty0=tilexy(la0,lo0);tx1,ty1=tilexy(la1,lo1)
tiles={}
for tx in range(int(tx0),int(tx1)+1):
  for ty in range(int(ty0),int(ty1)+1):
    f=f'terrarium_{Z}_{tx}_{ty}.png'
    if not os.path.exists(f):urllib.request.urlretrieve(f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{Z}/{tx}/{ty}.png',f)
    a=np.asarray(Image.open(f).convert('RGB')).astype(np.float64);tiles[(tx,ty)]=a[:,:,0]*256+a[:,:,1]+a[:,:,2]/256-32768
def h(lat,lon):
  fx,fy=tilexy(lat,lon);px,py=fx*256-0.5,fy*256-0.5;x0,y0=int(math.floor(px)),int(math.floor(py));ax,ay=px-x0,py-y0
  def s(X,Y):return tiles[(X//256,Y//256)][Y%256,X%256]
  return (s(x0,y0)*(1-ax)+s(x0+1,y0)*ax)*(1-ay)+(s(x0,y0+1)*(1-ax)+s(x0+1,y0+1)*ax)*ay
H=np.zeros((PX,PX))
for j in range(PX):
  for i in range(PX):
    x=(i+0.5)*MPP-600;z=(j+0.5)*MPP-600;H[j,i]=h(*geo(x,z))
mn,mx=float(H.min()),float(H.max())
img=np.round((H-mn)/(mx-mn)*65535).astype(np.uint16)
Image.fromarray(img).save('../grafiikka/hud/gps_korkeus.png')
cab=h(CLAT,CLON)
json.dump({'koko_px':[PX,PX],'min_m':round(mn,2),'max_m':round(mx,2),'mokki_m':round(cab,2),'kaava':'h_m = min_m + arvo/65535*(max_m-min_m)','kohdistus':'sama kuin gps_kartta.json',
 'lahde':'AWS Terrain Tiles (Terrarium, z15; Suomessa pohjana mm. MML-korkeusmalli), h = R*256+G+B/256-32768, haettu 22.10.2026'},open('../grafiikka/hud/gps_korkeus.json','w'),indent=1,ensure_ascii=False)
# pelin heightmap: 121x121 ruudukko 10 m välein, 15x15 px (~17 m) laatikkosuodatus, suhteellinen mökkiin, korkeuskerroin 0.75
r=7;P=np.pad(H,r,mode='edge');S=P.cumsum(0).cumsum(1);S=np.pad(S,((1,0),(1,0)));k=2*r+1;B=(S[k:,k:]-S[:-k,k:]-S[k:,:-k]+S[:-k,:-k])/(k*k);SC=0.75
bcab=B[int((CW[1]+600)/MPP),int((CW[0]+600)/MPP)]
G=121;hm=[]
for j in range(G):
  for i in range(G):
    x=-600+i*10;z=-600+j*10;hm.append(round(float(B[min(1023,int((z+600)/MPP)),min(1023,int((x+600)/MPP))]-bcab)*SC,2))
open('../koodi/logic/korkeus_data.js','w').write('// Generoitu: ../../korkeus/hae_ja_tee.py (AWS Terrarium, suhteessa mökkiin, kerroin 0.75, 17 m suodatus)\nexport const HM_N=%d, HM_STEP=10, HM_MIN=-600;\nexport const HM=%s;\n'%(G,json.dumps(hm,separators=(',',':'))))
# Kollinmäki: korkein kohta alueella
j,i=np.unravel_index(H.argmax(),H.shape);print('min',mn,'max',mx,'mokki',cab,'huippu px',i,j,'maailma',(i+.5)*MPP-600,(j+.5)*MPP-600,'geo',geo((i+.5)*MPP-600,(j+.5)*MPP-600))
np.save('korkeus_1024.npy',H)
