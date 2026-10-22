# OSM -> GPS-pohjakartta 1024x1024, kohdistettu pelimaailmaan (ks. ../grafiikka/hud/gps_kartta.json)
import xml.etree.ElementTree as ET, math, json
from PIL import Image, ImageDraw
r=ET.parse('raaka_osm_api.osm').getroot()
N={n.get('id'):(float(n.get('lat')),float(n.get('lon'))) for n in r.iter('node')}
W={}
for w in r.iter('way'):
  W[w.get('id')]=({x.get('k'):x.get('v') for x in w.iter('tag')},[N[n.get('ref')] for n in w.iter('nd') if n.get('ref') in N])
CAB_WAY='1555565343'  # oletettu Koppelontie 30 (OSM:ssä ei osoitteita): Koppelontien itäpään rakennus
g=W[CAB_WAY][1]; CLAT=sum(p[0] for p in g)/len(g); CLON=sum(p[1] for p in g)/len(g)
CAB_WORLD=(-200,160); SIZE=1200; PX=1024; MPP=SIZE/PX
MLAT=111320.0; MLON=111320.0*math.cos(math.radians(CLAT))
def world(p): return (CAB_WORLD[0]+(p[1]-CLON)*MLON, CAB_WORLD[1]-(p[0]-CLAT)*MLAT)   # x=itä, z=etelä
def px(p): x,z=world(p); return ((x+SIZE/2)/MPP,(z+SIZE/2)/MPP)
C=dict(bg='#7A8070',metsa='#1E3A24',pelto='#A8B890',suo='#4E5E3A',vesi='#2E4E6E',tie='#F0E8C0',metsatie='#C8B880',rak='#6A6A6A',mokki='#C0392B')
im=Image.new('RGB',(PX,PX),C['bg']); d=ImageDraw.Draw(im)   # PIL ilman antialiasointia
def chain(ws):
  segs=[list(s) for s in ws if len(s)>1]; out=[]
  while segs:
    cur=segs.pop(0); changed=True
    while changed and cur[0]!=cur[-1]:
      changed=False
      for s in segs:
        if s[0]==cur[-1]: cur+=s[1:]
        elif s[-1]==cur[-1]: cur+=s[::-1][1:]
        elif s[-1]==cur[0]: cur=s+cur[1:]
        elif s[0]==cur[0]: cur=s[::-1]+cur[1:]
        else: continue
        segs.remove(s); changed=True; break
    out.append(cur)
  return out
areas=[]  # (luokka, polygoni)
def cls(t):
  if t.get('landuse')=='forest' or t.get('natural')=='wood': return 'metsa'
  if t.get('landuse') in ('farmland','meadow','grass'): return 'pelto'
  if t.get('natural')=='wetland': return 'suo'
  if t.get('natural')=='water' or t.get('landuse')=='reservoir': return 'vesi'
for i,(t,g) in W.items():
  k=cls(t)
  if k and len(g)>2: areas.append((k,g))
for rel in r.iter('relation'):
  t={x.get('k'):x.get('v') for x in rel.iter('tag')}; k=cls(t)
  if not k: continue
  outers=[W[m.get('ref')][1] for m in rel.iter('member') if m.get('type')=='way' and m.get('role')!='inner' and m.get('ref') in W]
  for ring in chain(outers):
    if len(ring)>2: areas.append((k,ring))
for k in ['metsa','pelto','suo','vesi']:
  for kk,g in areas:
    if kk==k: d.polygon([px(p) for p in g],fill=C[k])
for i,(t,g) in W.items():
  if 'waterway' in t and len(g)>1: d.line([px(p) for p in g],fill=C['vesi'],width=5 if t['waterway']=='river' else 3)
roads=[]
for i,(t,g) in W.items():
  h=t.get('highway')
  if h and len(g)>1:
    minor=h in ('track','service','path','footway','cycleway')
    roads.append((minor,t,g))
for minor,t,g in sorted(roads,key=lambda r:not r[0]):
  d.line([px(p) for p in g],fill=C['metsatie' if minor else 'tie'],width=3 if minor else 6)
for i,(t,g) in W.items():
  if 'building' in t and len(g)>2: d.polygon([px(p) for p in g],fill=C['mokki'] if i==CAB_WAY else C['rak'])
im.save('../grafiikka/hud/gps_kartta_pohja.png')
cp=px((CLAT,CLON))
json.dump({'koko_px':[PX,PX],'m_per_px':MPP,'maailma_origo_px':[PX/2,PX/2],'mokki_maailma':CAB_WORLD,'mokki_px':[round(cp[0],1),round(cp[1],1)],
  'mokki_geo':[CLAT,CLON],'suunnat':'+x = itä = oikealle, +z = etelä = alas, pohjoinen ylös','muunnos':'px = (x + 600)/m_per_px, py = (z + 600)/m_per_px',
  'varit':C,'lahde':'© OpenStreetMap contributors (ODbL), OSM API map-kysely 22.10.2026'},open('../grafiikka/hud/gps_kartta.json','w'),indent=1,ensure_ascii=False)
k=[g for i,(t,g) in W.items() if t.get('name')=='Koppelontie']
poly=[[round(c,1) for c in px(p)] for p in k[0]]
named={}
for i,(t,g) in W.items():
  if t.get('highway') and t.get('name') and t['name']!='Koppelontie':
    pts=[px(p) for p in g]; ins=[p for p in pts if 0<=p[0]<PX and 0<=p[1]<PX]
    if ins: named.setdefault(t['name'],[round(c,1) for c in ins[len(ins)//2]])
json.dump({'mokki_px':[round(cp[0],1),round(cp[1],1)],'koppelontie_polyline_px':poly,'koppelontie_ankkuri_px':poly[len(poly)//2],'muut_tiet_ankkuri_px':named},open('../grafiikka/hud/gps_kartta_nimet.json','w'),indent=1,ensure_ascii=False)
print('ok',cp,poly,named)
