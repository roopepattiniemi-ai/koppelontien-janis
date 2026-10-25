#!/usr/bin/env python3
"""Pidentää kuusi_billboard.png:n paljasta runkoa: latvus puristetaan alhaalta ylös, runkoa jatketaan.
Lähde: /workspace/jahti_varmuus/kuuset_vanhat/kuusi_billboard.png. Runko ~15 % korkeudesta (≈1,3–1,8 m / 9–13 m)."""
import numpy as np, os
from PIL import Image
SRC = '/workspace/jahti_varmuus/kuuset_vanhat/kuusi_billboard.png'
DST = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tekstuurit', 'kuusi_billboard.png')
a = np.array(Image.open(SRC).convert('RGBA')); H, W = a.shape[:2]
wid = [(r[:, 3] > 128).sum() for r in a]
b = max(y for y in range(H) if wid[y] > 12) + 1          # latvuksen alareuna
trunk_row = a[H-4]                                         # rungon pikselirivi
T = int(round(H*.15)); nb = H - T
can = np.array(Image.fromarray(a[:b]).resize((W, nb), Image.NEAREST))
out = np.zeros_like(a); out[:nb] = can; out[nb:] = trunk_row
Image.fromarray(out).save(DST); print('latvus', b, '->', nb, 'runko', H-b, '->', T, 'px')
