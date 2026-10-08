import bpy, bmesh, math, sys
import numpy as np
from mathutils import Vector

S = r"C:\Users\nunzi\AppData\Local\Temp\claude\c--Users-nunzi-OneDrive-Desktop-Corso-Epicode-Capstone\80851bdc-c5d2-492e-a20f-14c1215ce1e6\scratchpad"
DEBUG = '--debug' in sys.argv

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=S + r"\model\base_basic_pbr.glb")
body = [x for x in bpy.context.scene.objects if x.type == 'MESH'][0]
body.name = "Boy"
me = body.data
n = len(me.vertices)
co = np.load(S + r"\co.npy")
comp = np.load(S + r"\comp.npy")
ncomp = comp.max() + 1

# ---------- classe dei vertici dal colore della texture: 0 pelle/altro, 1 maglia, 2 pantaloncini ----------
img = [i for i in bpy.data.images if 'diffuse' in i.name][0]
iw, ih = img.size
pix = np.empty(iw * ih * 4, dtype=np.float32); img.pixels.foreach_get(pix); pix = pix.reshape(ih, iw, 4)
uvl = np.empty(len(me.loops) * 2, dtype=np.float32); me.uv_layers.active.data.foreach_get('uv', uvl); uvl = uvl.reshape(-1, 2)
lvi = np.empty(len(me.loops), dtype=np.int32); me.loops.foreach_get('vertex_index', lvi)
uv_v = np.zeros((n, 2), dtype=np.float64); np.add.at(uv_v, lvi, uvl)
uv_v /= np.maximum(np.bincount(lvi, minlength=n), 1)[:, None]
xi = np.clip((uv_v[:, 0] * (iw - 1)).astype(int), 0, iw - 1); yi = np.clip((uv_v[:, 1] * (ih - 1)).astype(int), 0, ih - 1)
vcol = pix[yi, xi, :3]
zc = co[:, 2]
dark = vcol.max(1) < 0.08
shirt = (vcol[:, 2] > 1.25 * vcol[:, 0]) & (vcol[:, 2] > vcol[:, 1]) & (vcol[:, 2] > 0.15) & (zc > 0.85) & (np.abs(co[:, 0] - 0.05) < 0.42) & (co[:, 1] > -0.1)   # solo busto e maniche: i polpastrelli azzurrini non contano
shorts = dark & (zc > 0.68) & (zc < 1.12) & (np.abs(co[:, 0] - 0.05) < 0.28)   # solo la zona del bacino: le dita scure restano pelle
cls = np.zeros(n, dtype=np.int8); cls[shirt] = 1; cls[shorts] = 2
print("CLASSES skin/other", int((cls == 0).sum()), "shirt", int(shirt.sum()), "shorts", int(shorts.sum()))

# ---------- pallone: componenti interamente dentro la sfera ----------
BALL_C = np.array([0.379, -0.186, 0.912])
counts = np.bincount(comp)
ball_comps = []
for c in range(ncomp):
    if not (600 <= counts[c] <= 1000): continue
    p = co[comp == c]
    ctr = (p.min(0) + p.max(0)) / 2
    if np.linalg.norm(ctr - BALL_C) < 0.14 and (p.max(0) - p.min(0)).max() < 0.26:
        ball_comps.append(c)
is_ball = np.isin(comp, ball_comps)
pts = co[is_ball]
BALL_C = (pts.min(0) + pts.max(0)) / 2
BALL_R = np.linalg.norm(pts - BALL_C, axis=1).max()
print("BALL center", BALL_C.round(3).tolist(), "radius", round(float(BALL_R), 3), "bbox", (pts.max(0) - pts.min(0)).round(3).tolist())
# aggiungi anche i frammenti minuscoli (cuciture) interamente dentro la sfera
for c in range(ncomp):
    if c in ball_comps or counts[c] >= 600: continue
    if np.linalg.norm(co[comp == c] - BALL_C, axis=1).max() < BALL_R * 1.02:
        ball_comps.append(c)
is_ball = np.isin(comp, ball_comps)
print("BALL comps", len(ball_comps), "verts", int(is_ball.sum()))

# ---------- scheletro (coordinate mondo, Z su, il ragazzo guarda -Y) ----------
J = {
    'root':   ((0.0, 0.1, 0.0),   (0.0, 0.1, 0.1)),
    'hips':   ((0.05, 0.15, 0.97), (0.05, 0.15, 1.12)),
    'spine':  ((0.05, 0.15, 1.12), (0.05, 0.14, 1.30)),
    'chest':  ((0.05, 0.14, 1.30), (0.05, 0.11, 1.45)),
    'neck':   ((0.05, 0.11, 1.45), (0.05, 0.06, 1.52)),
    'head':   ((0.05, 0.06, 1.52), (0.05, -0.03, 1.90)),
    'arm_p':  ((0.29, 0.15, 1.38), (0.41, 0.02, 1.20)),
    'fore_p': ((0.41, 0.02, 1.20), (0.50, -0.14, 1.09)),
    'hand_p': ((0.50, -0.14, 1.09), (0.52, -0.19, 1.04)),
    'arm_n':  ((-0.23, 0.15, 1.38), (-0.34, 0.20, 1.10)),
    'fore_n': ((-0.34, 0.20, 1.10), (-0.46, 0.25, 0.88)),
    'hand_n': ((-0.46, 0.25, 0.88), (-0.48, 0.26, 0.80)),
    'thigh_p': ((0.17, 0.12, 0.97), (0.18, -0.26, 0.78)),   # gamba alzata (+X)
    'shin_p':  ((0.18, -0.26, 0.78), (0.20, -0.19, 0.42)),
    'foot_p':  ((0.20, -0.19, 0.42), (0.20, -0.36, 0.34)),
    'thigh_n': ((-0.07, 0.12, 0.97), (-0.05, 0.11, 0.55)),  # gamba d'appoggio (-X)
    'shin_n':  ((-0.05, 0.11, 0.55), (-0.05, 0.12, 0.18)),
    'foot_n':  ((-0.05, 0.12, 0.18), (-0.06, -0.08, 0.05)),
}
PARENT = {'hips': 'root', 'spine': 'hips', 'chest': 'spine', 'neck': 'chest', 'head': 'neck',
          'arm_p': 'chest', 'fore_p': 'arm_p', 'hand_p': 'fore_p',
          'arm_n': 'chest', 'fore_n': 'arm_n', 'hand_n': 'fore_n',
          'thigh_p': 'hips', 'shin_p': 'thigh_p', 'foot_p': 'shin_p',
          'thigh_n': 'hips', 'shin_n': 'thigh_n', 'foot_n': 'shin_n'}

# ---------- pesi: distanza dai segmenti, a livello di vertice per i pezzi grandi, di pezzo per quelli piccoli ----------
names = list(J.keys())
skin_names = [k for k in names if k != 'root']
seg_a = np.array([J[k][0] for k in skin_names]); seg_b = np.array([J[k][1] for k in skin_names])

def dist_to_segments(p):
    ab = seg_b - seg_a
    ap = p[:, None, :] - seg_a[None, :, :]
    t = np.clip((ap * ab).sum(-1) / (ab * ab).sum(-1), 0, 1)
    proj = seg_a[None] + t[..., None] * ab[None]
    return np.linalg.norm(p[:, None, :] - proj, axis=-1)

FORBID = {   # ossa vietate per classe: ogni indumento segue solo le ossa del proprio strato
    1: [i for i, k in enumerate(skin_names) if k.startswith(('thigh', 'shin', 'foot'))],
    2: [i for i, k in enumerate(skin_names) if not k.startswith(('hips', 'thigh', 'shin'))],
}

def weights_from_d(d, power=3.0, keep=3, classes=None):
    if classes is not None:
        d = d.copy()
        for c, cols in FORBID.items():
            rows = np.where(classes == c)[0]
            if len(rows): d[np.ix_(rows, cols)] = 1e3
    w = 1.0 / (d + 0.015) ** power
    # tieni solo i `keep` maggiori
    order = np.argsort(-w, axis=1)
    mask = np.zeros_like(w, dtype=bool)
    rows = np.arange(w.shape[0])[:, None]
    mask[rows, order[:, :keep]] = True
    w = np.where(mask, w, 0)
    return w / w.sum(1, keepdims=True)

SMALL = 1500
counts_c = np.bincount(comp)
W = np.zeros((n, len(skin_names)), dtype=np.float32)
# 1) i pezzi grandi: pesi per vertice dalla distanza dai segmenti dello scheletro
is_big = (counts_c[comp] >= SMALL) & ~is_ball
big = np.where(is_big)[0]
W[big] = weights_from_d(dist_to_segments(co[big]), classes=cls[big])
# 2) i pezzi piccoli (pieghe, rifiniture, ciocche): copiano i pesi del vertice grande più vicino al loro centro,
#    così seguono la superficie a cui sono attaccati invece di staccarsi
small_comps = [c for c in range(ncomp) if c not in ball_comps and counts_c[c] < SMALL]
big_co = co[big]
for c in small_comps:
    idx = np.where(comp == c)[0]
    ctr = co[idx].mean(0)
    d2 = ((big_co - ctr) ** 2).sum(1)
    ccls = int(np.bincount(cls[idx]).argmax())
    d2[cls[big] != ccls] = 1e6          # copia solo da vertici dello stesso strato (maglia / pantaloncini / pelle)
    j = int(d2.argmin())
    if d2[j] < 0.045 ** 2:
        W[idx] = W[big[j]]            # attaccato a una superficie grande: ne segue i pesi
    else:                              # zona fatta solo di pezzi piccoli (es. stinco e piede): pesi dal centro del pezzo
        W[idx] = weights_from_d(dist_to_segments(ctr[None]), classes=np.array([np.bincount(cls[idx]).argmax()]))[0]

# ---------- levigatura spaziale dei pesi, separata per strato (pelle / maglia / pantaloncini) ----------
def blur_layer(idx, cell=0.02, iters=1, mix=0.5):
    P = co[idx]; mn = P.min(0) - cell
    ijk = np.floor((P - mn) / cell).astype(int)
    dims = ijk.max(0) + 3
    S = np.zeros((*dims, W.shape[1]), dtype=np.float64); C = np.zeros(dims, dtype=np.float64)
    np.add.at(S, (ijk[:, 0] + 1, ijk[:, 1] + 1, ijk[:, 2] + 1), W[idx].astype(np.float64))
    np.add.at(C, (ijk[:, 0] + 1, ijk[:, 1] + 1, ijk[:, 2] + 1), 1.0)
    for _ in range(iters):
        S2 = np.zeros_like(S); C2 = np.zeros_like(C)
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for dz in (-1, 0, 1):
                    S2 += np.roll(S, (dx, dy, dz), axis=(0, 1, 2)); C2 += np.roll(C, (dx, dy, dz), axis=(0, 1, 2))
        S, C = S2, C2
    avg = S[ijk[:, 0] + 1, ijk[:, 1] + 1, ijk[:, 2] + 1] / np.maximum(C[ijk[:, 0] + 1, ijk[:, 1] + 1, ijk[:, 2] + 1], 1e-9)[:, None]
    out = (1 - mix) * W[idx] + mix * avg
    # i divieti di classe restano validi dopo la media
    for c, cols in FORBID.items():
        if cls[idx[0]] == c: out[:, cols] = 0
    # al massimo 4 influenze per vertice (limite di glTF), poi normalizza
    order = np.argsort(-out, axis=1)
    mask = np.zeros_like(out, dtype=bool); mask[np.arange(len(out))[:, None], order[:, :4]] = True
    out = np.where(mask, out, 0)
    s = out.sum(1, keepdims=True)
    return (out / np.maximum(s, 1e-9)).astype(np.float32)

for c in (0, 1, 2):
    idx = np.where((cls == c) & ~is_ball)[0]
    if len(idx): W[idx] = blur_layer(idx)

# ginocchia e polpacci: levigatura più ampia (solo pelle e calze), così la piega è morbida e non a blocchi
knee = np.where((cls == 0) & ~is_ball & (co[:, 2] > 0.35) & (co[:, 2] < 0.92))[0]
W[knee] = blur_layer(knee, cell=0.04, iters=1, mix=0.85)

# pantaloncini: pesi molto levigati, cosi' la stoffa scorre all'anca invece di accumularsi in un rigonfiamento
shorts_idx = np.where((cls == 2) & ~is_ball)[0]
W[shorts_idx] = blur_layer(shorts_idx, cell=0.05, iters=2, mix=0.85)

# vita: maglia e pantaloncini si sovrappongono, quindi nella fascia dell'orlo seguono SOLO il bacino, insieme
hips_col = skin_names.index('hips')
shell = np.where(((cls == 1) | (cls == 2)) & ~is_ball)[0]
zz = co[shell, 2]
lock = np.clip(np.minimum((zz - 0.74) / 0.24, (1.16 - zz) / 0.08), 0.0, 1.0).astype(np.float32)
lock = np.where(cls[shell] == 1, np.clip(np.minimum((zz - 0.88) / 0.07, (1.16 - zz) / 0.08), 0.0, 1.0), lock).astype(np.float32)  # maglia: fascia stretta come prima
onehot = np.zeros((len(shell), W.shape[1]), dtype=np.float32); onehot[:, hips_col] = 1.0
W[shell] = lock[:, None] * onehot + (1.0 - lock[:, None]) * W[shell]
print("WEIGHTED verts", int((W.sum(1) > 0).sum()))
print("DOM", dict(zip(skin_names, np.bincount(W[~is_ball].argmax(1), minlength=len(skin_names)).tolist())))
sel_dbg = np.where((co[:,0] > -0.12) & (co[:,0] < 0.0) & (co[:,1] > 0.05) & (co[:,1] < 0.2) & (co[:,2] > 0.25) & (co[:,2] < 0.5))[0]
print("SHINREGION n", len(sel_dbg), "dom", dict(zip(skin_names, np.bincount(W[sel_dbg].argmax(1), minlength=len(skin_names)).tolist())), "is_big", int(is_big[sel_dbg].sum()))

# ---------- crea pallone come oggetto separato ----------
bpy.context.view_layer.objects.active = body
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='DESELECT'); bpy.ops.object.mode_set(mode='OBJECT')
sel = np.zeros(n, dtype=bool); sel[is_ball] = True
me.vertices.foreach_set('select', sel.tolist()); me.update()
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_mode(type='VERT')
bpy.ops.mesh.separate(type='SELECTED')
bpy.ops.object.mode_set(mode='OBJECT')
ball = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o != body][0]
ball.name = "Ball"
# origine al centro del pallone
bpy.context.view_layer.objects.active = ball
for o in bpy.context.scene.objects: o.select_set(False)
ball.select_set(True)
bpy.context.scene.cursor.location = Vector(BALL_C.tolist())
bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
print("BODY verts", len(body.data.vertices), "BALL verts", len(ball.data.vertices))

# i pesi vanno rimappati sull'ordine dei vertici rimasti nel corpo: separate mantiene l'ordine relativo
keep_idx = np.where(~is_ball)[0]
Wb = W[keep_idx]
assert len(body.data.vertices) == len(keep_idx)
cur = np.empty(len(body.data.vertices) * 3, dtype=np.float32); body.data.vertices.foreach_get('co', cur); cur = cur.reshape(-1, 3)
same = np.abs(cur - co[keep_idx]).max()
print("ORDER CHECK max diff", float(same))
if same > 1e-5:
    # l'ordine dei vertici e' cambiato dopo separate(): ricostruisce la corrispondenza per posizione
    from collections import defaultdict
    key = lambda p: (round(float(p[0]), 5), round(float(p[1]), 5), round(float(p[2]), 5))
    lut = defaultdict(list)
    for i, p in zip(keep_idx, co[keep_idx]): lut[key(p)].append(i)
    order = []
    for p in cur:
        order.append(lut[key(p)].pop())
    keep_idx = np.array(order)
    print("REMAPPED by position")


# ---------- armatura ----------
bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
arm = bpy.context.object; arm.name = "Rig"; arm.data.name = "RigData"
eb = arm.data.edit_bones
eb.remove(eb[0])
for k in names:
    b = eb.new(k); b.head = Vector(J[k][0]); b.tail = Vector(J[k][1])
for k, p in PARENT.items():
    eb[k].parent = eb[p]
    eb[k].use_connect = False
bpy.ops.object.mode_set(mode='OBJECT')

# gruppi di vertici + modificatore
for k in skin_names:
    body.vertex_groups.new(name=k)
for j, k in enumerate(skin_names):
    vg = body.vertex_groups[k]
    nz = np.where(Wb[:, j] > 0.001)[0]
    for i in nz:
        vg.add([int(i)], float(Wb[i, j]), 'REPLACE')
mod = body.modifiers.new("Armature", 'ARMATURE'); mod.object = arm
body.parent = arm
ball.parent = None

bpy.ops.wm.save_as_mainfile(filepath=S + r"\rigged.blend")

if DEBUG:
    scene = bpy.context.scene
    mat = bpy.data.materials.new("dbg"); mat.diffuse_color = (1, 0, 0, 1)
    for k in names:
        for pos in J[k]:
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.018, location=pos)
            bpy.context.object.data.materials.append(mat)
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.display.shading.light = 'STUDIO'; scene.display.shading.color_type = 'MATERIAL'; scene.display.shading.show_xray = True; scene.display.shading.xray_alpha = 0.35
    scene.render.resolution_x = 700; scene.render.resolution_y = 700
    bpy.ops.object.camera_add(); cam = bpy.context.object; scene.camera = cam
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = 2.2
    for name, rot, pos in [("front", (math.radians(90), 0, 0), (0, -6, 0.95)),
                           ("side", (math.radians(90), 0, math.radians(90)), (6, 0, 0.95))]:
        cam.rotation_euler = rot; cam.location = pos
        scene.render.filepath = S + "\\dbg_" + name + ".png"
        bpy.ops.render.render(write_still=True)


