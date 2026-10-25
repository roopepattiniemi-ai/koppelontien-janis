#!/usr/bin/env python3
"""Kirjoittaa vain kuusi_1-4.glb generoi_kasvit.py:n MALLIT-listasta (muut kasvit koskematta)."""
import os, generoi_kasvit as g
for name, m in g.MALLIT:
    if name.startswith('kuusi_'):
        n, mn, mx = g.write_glb(m, os.path.join(g.OUT, name + '.glb'), name)
        lo = min(p[1] for t in m.t for p in t[:3] if abs(p[0])+abs(p[2]) > .4)
        print(f"{name}: {n} tris, korkeus {mx[1]:.2f}, alin oksa {lo:.2f} m")
