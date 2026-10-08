"""Materiali veri per maglia e pantaloncini: colore uniforme + occlusione (AO) nei vertici, tessuto opaco con sheen / satin."""
import bpy, math, random
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

S = r"C:\Users\nunzi\AppData\Local\Temp\claude\c--Users-nunzi-OneDrive-Desktop-Corso-Epicode-Capstone\80851bdc-c5d2-492e-a20f-14c1215ce1e6\scratchpad"
bpy.ops.wm.open_mainfile(filepath=S + r"\stage1.blend")
arm = bpy.data.objects["Rig"]; body = bpy.data.objects["Boy"]
arm.data.pose_position = 'REST'
bpy.context.view_layer.update()
me = body.data
n = len(me.vertices)
co = np.empty(n * 3, dtype=np.float32); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)

# ---------- classe dei vertici dal colore della texture (stessa regola del rig) ----------
img = [i for i in bpy.data.images if 'diffuse' in i.name][0]
iw, ih = img.size
pix = np.empty(iw * ih * 4, dtype=np.float32); img.pixels.foreach_get(pix); pix = pix.reshape(ih, iw, 4)
uvl = np.empty(len(me.loops) * 2, dtype=np.float32); me.uv_layers.active.data.foreach_get('uv', uvl); uvl = uvl.reshape(-1, 2)
lvi = np.empty(len(me.loops), dtype=np.int32); me.loops.foreach_get('vertex_index', lvi)
uv_v = np.zeros((n, 2)); np.add.at(uv_v, lvi, uvl); uv_v /= np.maximum(np.bincount(lvi, minlength=n), 1)[:, None]
xi = np.clip((uv_v[:, 0] * (iw - 1)).astype(int), 0, iw - 1); yi = np.clip((uv_v[:, 1] * (ih - 1)).astype(int), 0, ih - 1)
vcol = pix[yi, xi, :3]
zc = co[:, 2]
dark = vcol.max(1) < 0.08
shirt = (vcol[:, 2] > 1.25 * vcol[:, 0]) & (vcol[:, 2] > vcol[:, 1]) & (vcol[:, 2] > 0.15) & (zc > 0.85) & (np.abs(co[:, 0] - 0.05) < 0.42) & (co[:, 1] > -0.1)
shorts = dark & (zc > 0.68) & (zc < 1.12) & (np.abs(co[:, 0] - 0.05) < 0.28)
cls = np.zeros(n, dtype=np.int8); cls[shirt] = 1; cls[shorts] = 2
print("LOOK classes", int((cls == 0).sum()), int(shirt.sum()), int(shorts.sum()))

# colore uniforme = mediana dei pixel della classe (toglie le macchie "cotte" nella texture)
shirt_rgb = np.median(vcol[shirt], axis=0)
shorts_rgb = np.median(vcol[shorts], axis=0)
print("LOOK shirt rgb(lin)", shirt_rgb.round(3).tolist(), "shorts", shorts_rgb.round(3).tolist())
# la maglia leggermente piu' ricca, i pantaloncini un nero caldo (non piatto)
shirt_rgb = np.clip(shirt_rgb * np.array([0.62, 0.74, 0.90]), 0, 1)      # un po' piu' profonda: i chiari non si bruciano
shorts_rgb = np.array([0.026, 0.027, 0.034])                              # nero con una punta di blu, non piatto

# ---------- classe per faccia (maggioranza dei vertici) ----------
npoly = len(me.polygons)
pc = np.empty(npoly, dtype=np.int8)
for k, pgn in enumerate(me.polygons):
    cs = [int(cls[v]) for v in pgn.vertices]
    pc[k] = max(set(cs), key=cs.count)
poly_start = np.empty(npoly, dtype=np.int64); poly_tot = np.empty(npoly, dtype=np.int64)
me.polygons.foreach_get('loop_start', poly_start); me.polygons.foreach_get('loop_total', poly_tot)
loop_poly = np.repeat(np.arange(npoly), poly_tot)
loop_cls = pc[loop_poly]                       # classe di ogni angolo di faccia
garment_verts = np.unique(lvi[loop_cls > 0])

# ---------- occlusione ambientale per vertice (pose di riposo) ----------
verts = [Vector(v.tolist()) for v in co]
polys = [tuple(p.vertices) for p in me.polygons]
bvh = BVHTree.FromPolygons(verts, polys, epsilon=0.0)
nor = np.empty(n * 3, dtype=np.float32); me.vertices.foreach_get('normal', nor); nor = nor.reshape(-1, 3)
rng = random.Random(7)
SAMPLES, MAXD = 14, 0.10
ao = np.ones(n, dtype=np.float32)
targets = garment_verts
for i in targets:
    nv = Vector(nor[i].tolist())
    if nv.length < 1e-6: continue
    nv.normalize()
    t1 = nv.cross(Vector((0.0, 0.0, 1.0)) if abs(nv.z) < 0.9 else Vector((1.0, 0.0, 0.0))).normalized()
    t2 = nv.cross(t1)
    hits = 0.0
    o = verts[i] + nv * 0.003
    for _ in range(SAMPLES):
        u, v = rng.random(), rng.random()
        r = math.sqrt(u); ph = 2 * math.pi * v
        d = t1 * (r * math.cos(ph)) + t2 * (r * math.sin(ph)) + nv * math.sqrt(max(0.0, 1 - u))
        loc, nrm, idx, dist = bvh.ray_cast(o, d, MAXD)
        if loc is not None: hits += 1.0 - dist / MAXD
    ao[i] = 1.0 - 0.9 * hits / SAMPLES
print("LOOK AO mean", float(ao[targets].mean()), "min", float(ao[targets].min()))
# colori per ANGOLO di faccia: una faccia di maglia o pantaloncini non prende mai colore dai vertici condivisi con la pelle
col = np.ones((len(me.loops), 4), dtype=np.float32)
ao_loop = ao[lvi]
sel1 = loop_cls == 1; sel2 = loop_cls == 2
col[sel1, :3] = shirt_rgb[None, :] * ao_loop[sel1][:, None]
col[sel2, :3] = shorts_rgb[None, :] * ao_loop[sel2][:, None]
attr = me.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
attr.data.foreach_set('color', col.reshape(-1))

# ---------- materiali ----------
normal_img = [i for i in bpy.data.images if 'normal' in i.name][0]

def cloth(name, rough, sheen, sheen_rough, clearcoat=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Metallic'].default_value = 0.0
    b.inputs['Roughness'].default_value = rough
    b.inputs['Sheen Weight'].default_value = sheen
    b.inputs['Sheen Roughness'].default_value = sheen_rough
    b.inputs['Sheen Tint'].default_value = (1, 1, 1, 1)
    b.inputs['Coat Weight'].default_value = clearcoat
    vc = nt.nodes.new('ShaderNodeVertexColor'); vc.layer_name = 'Col'
    nt.links.new(vc.outputs['Color'], b.inputs['Base Color'])
    tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = normal_img; tex.image.colorspace_settings.name = 'Non-Color'
    nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = 1.0
    nt.links.new(tex.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    return m

m_shirt = cloth("Shirt", 0.88, 0.4, 0.5)
m_shorts = cloth("Shorts", 0.68, 0.0, 0.5, clearcoat=0.0)   # opachi: le forme si leggono morbide, senza riflessi che evidenziano i rigonfiamenti
me.materials.append(m_shirt); me.materials.append(m_shorts)     # indici 1 e 2

me.polygons.foreach_set('material_index', pc.tolist())
me.update()
print("LOOK faces skin/shirt/shorts", int((pc == 0).sum()), int((pc == 1).sum()), int((pc == 2).sum()))

arm.data.pose_position = 'POSE'
bpy.ops.wm.save_as_mainfile(filepath=S + r"\stage2.blend")
