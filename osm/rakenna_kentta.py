# v0.8: Koppelontie 30 -keskeinen kenttä OSM:stä (+ satelliittikuvasta lisätyt pihatie, ura, oja).
# Tuottaa: ../koodi/logic/kartta_data.js, ../grafiikka/hud/gps_kartta_pohja.png, gps_kartta.json, gps_kartta_nimet.json
import xml.etree.ElementTree as ET, math, json
from PIL import Image, ImageDraw
CLAT,CLON=62.3759391,22.9240875   # mökki = Koppelontie 30 = maailman origo
SIZE=1200;PX=1024;MPP=SIZE/PX;H=SIZE/2
MLAT=111320.0;MLON=111320.0*math.cos(math.radians(CLAT))
r=ET.parse('raaka_osm_api.osm').getroot()
N={n.get('id'):(float(n.get('lat')),float(n.get('lon'))) for n in r.iter('node')}
def w(p):return (round((p[1]-CLON)*MLON,1),round(-(p[0]-CLAT)*MLAT,1))
W={}
for wy in r.iter('way'):
  W[wy.get('id')]=({x.get('k'):x.get('v') for x in wy.iter('tag')},[w(N[n.get('ref')]) for n in wy.iter('nd') if n.get('ref') in N])
inside=lambda g,m=80:any(abs(x)<H+m and abs(z)<H+m for x,z in g)
CABIN_WAY='1555565441'
roads=[];fields=[];water=[];buildings=[];forests=[];wet=[]
for i,(t,g) in W.items():
  if len(g)<2 or not inside(g):continue
  h=t.get('highway')
  if h:
    c='tie' if h in('tertiary','secondary','primary','unclassified','residential') else 'ura'
    roads.append({'c':c,'w':7 if h=='tertiary' else 5 if c=='tie' else 3,'n':t.get('name',''),'pts':g})
  elif t.get('landuse') in('farmland','meadow','grass'):fields.append(g)
  elif t.get('landuse')=='forest' or t.get('natural')=='wood':forests.append(g)
  elif t.get('natural')=='wetland':wet.append(g)
  elif 'waterway' in t:water.append({'w':2.5 if t['waterway']=='stream' else 1.5,'pts':g})
  elif 'building' in t and i!=CABIN_WAY:buildings.append(g)
# satelliittikuvasta: pihatie Koppelontieltä etelään mökille, ura kaakkoon peltojen yli, puurivillinen oja Koppelontien eteläpuolella
roads.append({'c':'piha','w':3,'n':'pihatie','pts':[(14,-103),(16,-60),(14,-20),(10,-2)]})
roads.append({'c':'ura','w':2.5,'n':'ura','pts':[(14,4),(80,40),(160,85),(250,140)]})
kop=[r_ for r_ in roads if r_['n']=='Koppelontie'][0]['pts']
water.append({'w':1.5,'pts':[(x,z+7) for x,z in kop],'oja':'koppelontie'})
# satelliittikuvasta arvioidut pellot, joita OSM:ssä ei ole (L/LO kynnetyt), tarkkuus ~±30 m
fields+= [[(-450,-400),(-240,-400),(-240,-200),(-450,-200)],[(-200,190),(30,190),(30,340),(-200,340)],[(-600,-40),(-390,-40),(-390,110),(-600,110)]]
CABIN={'x':0,'z':0,'rot':math.pi/2}   # kuisti (+Z) itään pihalle
YARD={'x':14,'z':2,'r':13}
# aloitus: Vitaran ratissa Yli-Vallintiellä ~70 m ennen Löyhingintien risteystä (317.5,-32.6), ajosuunta risteystä kohti (koilliseen)
JYV=(317.5,-32.6); JKOP=(302.7,-87.3)
yv=[o for o in roads if o['n']=='Yli-Vallintie'][0]['pts']
k=min(range(len(yv)),key=lambda i:math.hypot(yv[i][0]-JYV[0],yv[i][1]-JYV[1]))
step=1 if yv[min(k+1,len(yv)-1)][1]>yv[k][1] else -1   # kohti lounasta (z kasvaa)
acc=0;i=k
while acc<70 and 0<=i+step<len(yv):acc+=math.hypot(yv[i+step][0]-yv[i][0],yv[i+step][1]-yv[i][1]);i+=step
sx,sz=yv[i];hd=math.atan2(JYV[0]-sx,-(JYV[1]-sz))   # heading: 0 = pohjoinen (-z), pi/2 = itä
START={'x':sx,'z':sz,'heading':round(hd,3),'autossa':True}
def face(x,z,tx,tz):return round(math.atan2(tx-x,-(tz-z)),3)
signs=[
 {'tyyppi':'tienviitta','teksti':'Löyhingintie','x':JYV[0]-9,'z':JYV[1]+6,'suunta':face(JYV[0]-9,JYV[1]+6,sx,sz),'huom':'Yli-Vallintien varressa, näkyy aloitussuunnasta'},
 {'tyyppi':'tienviitta','teksti':'Yli-Vallintie 6921','x':JYV[0]+8,'z':JYV[1]-8,'suunta':face(JYV[0]+8,JYV[1]-8,JKOP[0],JKOP[1])},
 {'tyyppi':'tienviitta','teksti':'Koppelontie','nuoli':'vasen (länteen)','x':JKOP[0]+6,'z':JKOP[1]+5,'suunta':face(JKOP[0]+6,JKOP[1]+5,JYV[0],JYV[1])},
 {'tyyppi':'postilaatikko','teksti':'','x':19,'z':-97,'suunta':face(19,-97,19,-110)},
 {'tyyppi':'osoitekilpi','teksti':'Koppelontie 30','x':20.5,'z':-97,'suunta':face(20.5,-97,20.5,-110)}]
json.dump({'selite':'maailman metrit, x = itä, z = etelä; suunta = kyltin etupinnan katsesuunta rad, 0 = pohjoinen (-z), pi/2 = itä','aloitus':START,'kyltit':signs},open('../koodi/logic/kyltit.json','w'),indent=1,ensure_ascii=False)
data=dict(START=START,SIGNS=signs,ROADS=roads,FIELDS=fields,WATER=water,BUILDINGS=buildings,CABIN=CABIN,YARD=YARD,GEO={'lat':CLAT,'lon':CLON})
open('../koodi/logic/kartta_data.js','w').write('// Generoitu: ../../osm/rakenna_kentta.py (© OpenStreetMap contributors, ODbL) – älä muokkaa käsin\n'+''.join(f'export const {k}={json.dumps(v,separators=(",",":"),ensure_ascii=False)};\n' for k,v in data.items()))
# ---- GPS-pohja (ei antialiasointia) ----
C=dict(bg='#7A8070',metsa='#1E3A24',pelto='#A8B890',suo='#4E5E3A',vesi='#2E4E6E',tie='#F0E8C0',metsatie='#C8B880',rak='#6A6A6A',mokki='#C0392B')
px=lambda p:((p[0]+H)/MPP,(p[1]+H)/MPP)
im=Image.new('RGB',(PX,PX),C['metsa']);d=ImageDraw.Draw(im)   # pelikentässä metsä on oletus (satelliittikuva)
for g in fields:d.polygon([px(p) for p in g],fill=C['pelto'])
for g in wet:d.polygon([px(p) for p in g],fill=C['suo'])
for o in water:d.line([px(p) for p in o['pts']],fill=C['vesi'],width=3)
for o in sorted(roads,key=lambda o:o['c']=='tie'):d.line([px(p) for p in o['pts']],fill=C['tie' if o['c']=='tie' else 'metsatie'],width=max(2,round(o['w']/MPP)))
for g in buildings:d.polygon([px(p) for p in g],fill=C['rak'])
cg=W[CABIN_WAY][1];d.polygon([px(p) for p in cg],fill=C['mokki'])
im.save('../grafiikka/hud/gps_kartta_pohja.png')
json.dump({'koko_px':[PX,PX],'m_per_px':MPP,'maailma_origo_px':[PX/2,PX/2],'mokki_maailma':[0,0],'mokki_px':[PX/2,PX/2],'mokki_geo':[CLAT,CLON],
 'suunnat':'+x = itä = oikealle, +z = etelä = alas, pohjoinen ylös','muunnos':'px = (x + 600)/m_per_px, py = (z + 600)/m_per_px',
 'varit':C,'huom':'pelikentässä metsä on oletusmaankäyttö (satelliittikuvan mukaan); pihatie, ura ja Koppelontien oja lisätty satelliittikuvasta',
 'lahde':'© OpenStreetMap contributors (ODbL), OSM API map-kysely 22.10.2026'},open('../grafiikka/hud/gps_kartta.json','w'),indent=1,ensure_ascii=False)
def clip(pts):return [[round(c,1) for c in px(p)] for p in pts if abs(p[0])<=H and abs(p[1])<=H]
nam={}
for o in roads:
  if o['n'] and o['n'] not in('pihatie','ura'):
    c=clip(o['pts'])
    if c:nam.setdefault(o['n'],[]).append(c)
json.dump({'mokki_px':[PX/2,PX/2],'koppelontie_polyline_px':nam.get('Koppelontie',[[]])[0],'koppelontie_ankkuri_px':(lambda a:a[len(a)//2])(nam['Koppelontie'][0]),
 'tiet_polyline_px':nam,'tiet_ankkuri_px':{k:v[0][len(v[0])//2] for k,v in nam.items()}},open('../grafiikka/hud/gps_kartta_nimet.json','w'),indent=1,ensure_ascii=False)
print(len(roads),'tietä',len(fields),'peltoa',len(water),'vesi/oja',len(buildings),'taloa',len(wet),'suota',list(nam))
