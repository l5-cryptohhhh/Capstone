import bpy, bmesh, math, pickle
import numpy as np
from mathutils import Vector

S = r"C:\Users\nunzi\AppData\Local\Temp\claude\c--Users-nunzi-OneDrive-Desktop-Corso-Epicode-Capstone\80851bdc-c5d2-492e-a20f-14c1215ce1e6\scratchpad"
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=S + r"\model\base_basic_pbr.glb")
o = [x for x in bpy.context.scene.objects if x.type == 'MESH'][0]
me = o.data
n = len(me.vertices)
co = np.empty(n * 3, dtype=np.float32); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)

# componenti connesse con union-find sugli spigoli
parent = np.arange(n)
def find(a):
    while parent[a] != a:
        parent[a] = parent[parent[a]]; a = parent[a]
    return a
ed = np.empty(len(me.edges) * 2, dtype=np.int64); me.edges.foreach_get('vertices', ed); ed = ed.reshape(-1, 2)
for a, b in ed:
    ra, rb = find(a), find(b)
    if ra != rb: parent[ra] = rb
roots = np.array([find(i) for i in range(n)])
uniq, comp = np.unique(roots, return_inverse=True)
print("COMPS", len(uniq))
np.save(S + r"\comp.npy", comp)
np.save(S + r"\co.npy", co)

ball_guess = np.array([0.375, -0.19, 0.92])
cands = []
for c in range(len(uniq)):
    idx = np.where(comp == c)[0]
    p = co[idx]
    ctr = (p.min(0) + p.max(0)) / 2
    size = p.max(0) - p.min(0)
    d = np.linalg.norm(ctr - ball_guess)
    if d < 0.2:
        cands.append((d, c, len(idx), ctr.round(3).tolist(), size.round(3).tolist()))
cands.sort()
for x in cands[:8]: print("CAND", x)
