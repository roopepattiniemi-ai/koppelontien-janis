#!/usr/bin/env python3
"""Lumen läpi pilkistävä kuiva heinikko: alpha-kortit + ristikkäis-quad GLB:t (InstancedMesh).
Aja: python3 generoi_heina.py. Metrit, +Y ylös, origo tyvessä maassa."""
import json, struct, math, os, random
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
TEX = os.path.join(HERE, 'tekstuurit'); OUT = os.path.join(HERE, 'mallit', 'heina')
PREV = '/workspace/jahti_varmuus/esikatselu_heina.png'
S = 128
PAL = {1: [(110, 92, 58), (150, 128, 78), (184, 162, 102), (208, 188, 128), (226, 208, 150)],   # kellertävä
       2: [(74, 56, 42), (104, 78, 54), (132, 100, 68), (160, 124, 84), (184, 150, 106)]}       # ruskea

def kortti(n, seed):
    rnd = random.Random(seed); a = np.zeros((S, S, 4), np.uint8); pal = PAL[n]
    def px(x, y, col):
        if 0 <= x < S and 0 <= y < S: a[y, x] = (*col, 255)
    for k in range(34):
        x0 = rnd.uniform(14, 114); h = rnd.uniform(40, 124); lean = rnd.uniform(-.35, .35) * (x0 - 64) / 50 + rnd.uniform(-.2, .2)
        bend = rnd.uniform(-.004, .004); w = 2 if rnd.random() < .4 else 1
        tone = rnd.randint(1, 4)
        for i in range(int(h)):
            t = i / h; x = x0 + lean * i + bend * i * i; y = S - 1 - i
            col = pal[max(0, tone - (1 if t < .15 else 0) + (1 if (t > .7 and tone < 4) else 0))]
            ww = w if t < .7 else 1
            for d in range(ww): px(int(round(x)) + d, y, pal[0] if d and t < .5 else col)
        if rnd.random() < .35:  # röyhy / tähkä latvassa
            tx = int(round(x0 + lean * h + bend * h * h)); ty = int(S - h)
            for j in range(rnd.randint(4, 9)):
                px(tx + rnd.choice((-1, 0, 1)), ty + j, pal[min(4, tone + 1)] if j % 2 else pal[2])
        if rnd.random() < .3:  # lehden rippa sivulle
            i0 = int(h * rnd.uniform(.2, .5)); dx = rnd.choice((-1, 1))
            for j in range(rnd.randint(8, 18)):
                px(int(round(x0 + lean * i0)) + dx * (j // 2 + 1), S - 1 - i0 - j // 3 + (j // 6), pal[tone - 1 if tone else 0])
    return Image.fromarray(a, 'RGBA')

def glb(path, name, H, n_quads, tex_uri, seed):
    rnd = random.Random(seed); P, N, U, I = [], [], [], []
    w = H; rot0 = rnd.uniform(0, math.pi)
    for q in range(n_quads):
        a = rot0 + math.pi * q / n_quads; dx, dz = math.cos(a) * w / 2, math.sin(a) * w / 2
        nx, nz = -math.sin(a), math.cos(a); b = len(P)
        P += [(-dx, 0, -dz), (dx, 0, dz), (dx, H, dz), (-dx, H, -dz)]
        N += [(nx, 0, nz)] * 4
        fl = q % 2  # joka toinen kortti peilattu U:ssa -> vähemmän toistoa
        U += [(fl, 1), (1 - fl, 1), (1 - fl, 0), (fl, 0)]
        I += [b, b + 1, b + 2, b, b + 2, b + 3]
    P = np.array(P, np.float32); N = np.array(N, np.float32); U = np.array(U, np.float32); I = np.array(I, np.uint16)
    bufs = [P.tobytes(), N.tobytes(), U.tobytes(), I.tobytes()]; views = []; off = 0
    for k, bb in enumerate(bufs):
        views.append({"buffer": 0, "byteOffset": off, "byteLength": len(bb), "target": 34963 if k == 3 else 34962})
        off += len(bb) + ((4 - len(bb) % 4) % 4)
    bin_ = b''.join(bb + b'\0' * ((4 - len(bb) % 4) % 4) for bb in bufs)
    acc = [{"bufferView": 0, "componentType": 5126, "count": len(P), "type": "VEC3", "min": P.min(0).tolist(), "max": P.max(0).tolist()},
           {"bufferView": 1, "componentType": 5126, "count": len(P), "type": "VEC3"},
           {"bufferView": 2, "componentType": 5126, "count": len(P), "type": "VEC2"},
           {"bufferView": 3, "componentType": 5123, "count": len(I), "type": "SCALAR"}]
    g = {"asset": {"version": "2.0", "generator": "generoi_heina.py"}, "scene": 0, "scenes": [{"nodes": [0]}],
         "nodes": [{"name": name, "mesh": 0}],
         "meshes": [{"name": name, "primitives": [{"attributes": {"POSITION": 0, "NORMAL": 1, "TEXCOORD_0": 2}, "indices": 3, "material": 0}]}],
         "materials": [{"name": "heina", "alphaMode": "MASK", "alphaCutoff": 0.5, "doubleSided": True,
                        "pbrMetallicRoughness": {"baseColorTexture": {"index": 0}, "metallicFactor": 0, "roughnessFactor": 1}}],
         "textures": [{"source": 0, "sampler": 0}], "images": [{"uri": tex_uri}],
         "samplers": [{"magFilter": 9728, "minFilter": 9728, "wrapS": 33071, "wrapT": 33071}],
         "accessors": acc, "bufferViews": views, "buffers": [{"byteLength": len(bin_)}]}
    js = json.dumps(g, separators=(',', ':')).encode(); js += b' ' * ((4 - len(js) % 4) % 4)
    with open(path, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(bin_)))
        f.write(struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(bin_), 0x004E4942) + bin_)
    return len(I) // 3

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True); os.makedirs(os.path.dirname(PREV), exist_ok=True)
    k = {n: kortti(n, 100 + n) for n in (1, 2)}
    for n, im in k.items(): im.save(os.path.join(TEX, f'heina_kortti_{n}.png'))
    for i, (H, nq, t) in enumerate([(0.2, 2, 2), (0.4, 3, 1), (0.6, 3, 2)], 1):
        tr = glb(os.path.join(OUT, f'heinatupas_{i}.glb'), f'heinatupas_{i}', H, nq, f'../../tekstuurit/heina_kortti_{t}.png', i)
        print(f'heinatupas_{i}.glb  {tr} tris  korkeus {H} m  kortti {t}')
    pv = Image.new('RGBA', (2 * S * 4 + 60, S * 4 + 40), (232, 238, 248, 255))
    for j, n in enumerate((1, 2)):
        pv.alpha_composite(k[n].resize((S * 4, S * 4), Image.NEAREST), (20 + j * (S * 4 + 20), 20))
    pv.convert('RGB').save(PREV); print(PREV)
