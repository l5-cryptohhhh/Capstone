"""Stadio 1: pallone nuovo (procedurale) + occhi e bocca con geometria vera, agganciati alla testa."""
import bpy, bmesh, math, sys
from mathutils import Vector, Matrix

S = r"C:\Users\nunzi\AppData\Local\Temp\claude\c--Users-nunzi-OneDrive-Desktop-Corso-Epicode-Capstone\80851bdc-c5d2-492e-a20f-14c1215ce1e6\scratchpad"
bpy.ops.wm.open_mainfile(filepath=S + r"\rigged.blend")
scene = bpy.context.scene
arm = bpy.data.objects["Rig"]; body = bpy.data.objects["Boy"]
BALL_R = 0.14

# ---------- materiale helper ----------
def mat(name, color, rough=0.5, metal=0.0, coat=0.0, emit=None):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if coat and 'Coat Weight' in b.inputs: b.inputs['Coat Weight'].default_value = coat
    if emit is not None:
        b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = 1.0
    return m

# ---------- vecchio pallone via ----------
old = bpy.data.objects.get("Ball")
if old: bpy.data.objects.remove(old, do_unlink=True)

# ---------- pallone: icosaedro troncato, pannelli con cucitura, arrotondato ----------
bm = bmesh.new()
bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0)
bmesh.ops.bevel(bm, geom=list(bm.verts), offset=33.3333, offset_type='PERCENT', segments=1, affect='VERTICES')
res = bmesh.ops.inset_individual(bm, faces=list(bm.faces), thickness=0.03, use_even_offset=True)
ring = set(res['faces'])  # (inset_individual restituisce le facce ring? in alcune versioni le interne) -> classifica dopo
bm.faces.ensure_lookup_table()
# le facce interne sono quelle a 5 o 6 lati; le "ring" sono quadrilateri
for f in bm.faces:
    n = len(f.verts)
    f.material_index = 0 if n == 6 else (1 if n == 5 else 2)   # 0 bianco, 1 nero, 2 cucitura
bmesh.ops.subdivide_edges(bm, edges=list(bm.edges), cuts=6, use_grid_fill=True)
me = bpy.data.meshes.new("BallMesh"); bm.to_mesh(me); bm.free()
ball = bpy.data.objects.new("Ball", me); scene.collection.objects.link(ball)
for m in (mat("BallWhite", (0.93, 0.93, 0.91), 0.38, 0.0, 0.25), mat("BallBlack", (0.025, 0.025, 0.03), 0.42, 0.0, 0.2),
          mat("BallSeam", (0.07, 0.07, 0.08), 0.6)):
    me.materials.append(m)
bpy.context.view_layer.objects.active = ball
for o in scene.objects: o.select_set(False)
ball.select_set(True)
for v in ball.data.vertices:            # tutta la superficie sulla sfera
    v.co = v.co.normalized() * BALL_R
for p in ball.data.polygons: p.use_smooth = True
print("BALL tris", len(ball.data.polygons))

# ---------- occhi e bocca ----------
# posizione degli occhi dipinti nel modello (misurata dall'immagine frontale): (x, z)
EYES = {'L': (-0.011, 1.638), 'R': (0.077, 1.625)}
arm.data.pose_position = 'REST'
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()

def surface_hit(x, z):
    origin = Vector((x, -3.0, z)); direction = Vector((0, 1, 0))
    ok, loc, nor, idx = body.evaluated_get(dg).ray_cast(origin, direction)
    return (loc, nor) if ok else (None, None)

head = arm.pose.bones['head']
parts = []
def to_head(obj, groupname=None):
    """Aggancia l'oggetto all'osso 'head' (segue la testa)."""
    obj.parent = arm; obj.parent_type = 'BONE'; obj.parent_bone = 'head'
    # parent_type BONE mette l'origine alla *coda* dell'osso: compensa con la matrice inversa
    obj.matrix_parent_inverse = (arm.matrix_world @ head.matrix @ Matrix.Translation((0, head.length, 0))).inverted()
    parts.append(obj)

m_sclera = mat("EyeWhite", (0.97, 0.96, 0.94), 0.25)
m_iris = mat("EyeIris", (0.16, 0.09, 0.05), 0.2)
m_pupil = mat("EyePupil", (0.005, 0.005, 0.008), 0.15)
m_shine = mat("EyeShine", (1, 1, 1), 0.1, emit=(1, 1, 1))
m_mouth = mat("Mouth", (0.42, 0.10, 0.10), 0.5)
m_lash = mat("Lash", (0.05, 0.03, 0.02), 0.5)

def sphere(name, center, scale, material, rot=None, radius=1.0, seg=24):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, segments=seg, ring_count=seg // 2, location=center)
    o = bpy.context.object; o.name = name; o.scale = scale
    if rot is not None: o.rotation_euler = rot
    o.data.materials.append(material)
    for p in o.data.polygons: p.use_smooth = True
    return o

for side, (ex, ez) in EYES.items():
    loc, nor = surface_hit(ex, ez)
    if loc is None:
        print("NOHIT eye", side); continue
    n = nor.normalized()
    if n.y > 0: n = -n                 # verso l'esterno (-Y)
    print("EYE", side, [round(c, 3) for c in loc], "normal", [round(c, 2) for c in n])
    # base ortonormale: asse "fuori" = n, "su" = Z proiettato
    out = n
    up = (Vector((0, 0, 1)) - out * out.z).normalized()
    right = up.cross(out)
    rot = Matrix((right, up, out)).transposed().to_euler()
    c = loc + out * 0.004             # il bulbo sporge appena dalla pelle
    sclera = sphere("Sclera" + side, c, (0.029, 0.0165, 0.014), m_sclera, rot)
    iris = sphere("Iris" + side, c + out * 0.0105 + up * 0.0005, (0.0118, 0.0118, 0.0035), m_iris, rot)
    pupil = sphere("Pupil" + side, c + out * 0.0135, (0.0064, 0.0064, 0.0028), m_pupil, rot)
    shine = sphere("Shine" + side, c + out * 0.0155 + up * 0.0045 + right * 0.0045, (0.0028, 0.0028, 0.0018), m_shine, rot, seg=12)
    for o in (sclera, iris, pupil, shine): to_head(o)

# bocca: piccolo sorriso (arco sottile) sotto il naso
mx, mz = 0.040, 1.553
loc, nor = surface_hit(mx, mz)
if loc is not None:
    n = nor.normalized()
    if n.y > 0: n = -n
    out = n; up = (Vector((0, 0, 1)) - out * out.z).normalized(); right = up.cross(out)
    pts = []
    for i in range(13):
        t = (i / 12 - 0.5) * 2          # -1..1
        pts.append(loc + right * (t * 0.026) + up * (0.006 * t * t - 0.003) + out * 0.0015)
    cu = bpy.data.curves.new("MouthCurve", 'CURVE'); cu.dimensions = '3D'
    sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts): sp.points[i].co = (*p, 1)
    cu.bevel_depth = 0.0022; cu.bevel_resolution = 3; cu.use_fill_caps = True
    mo = bpy.data.objects.new("Mouth", cu); scene.collection.objects.link(mo)
    bpy.context.view_layer.objects.active = mo
    for o in scene.objects: o.select_set(False)
    mo.select_set(True)
    bpy.ops.object.convert(target='MESH')
    mo = bpy.context.object
    mo.data.materials.append(m_mouth)
    to_head(mo)

arm.data.pose_position = 'POSE'
bpy.ops.wm.save_as_mainfile(filepath=S + r"\stage1.blend")

# anteprima ravvicinata del viso e del pallone
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 700; scene.render.resolution_y = 500
bpy.ops.object.light_add(type='SUN', location=(2, -4, 4)); bpy.context.object.data.energy = 3
scene.world = bpy.data.worlds.new("w"); scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[1].default_value = 1.0
bpy.ops.object.camera_add(); cam = bpy.context.object; scene.camera = cam
cam.data.type = 'ORTHO'; cam.rotation_euler = (math.radians(90), 0, 0)
cam.data.ortho_scale = 0.5; cam.location = (0.04, -6, 1.64)
scene.render.filepath = S + r"\s1_face.png"; bpy.ops.render.render(write_still=True)
ball.location = (0.04, -0.5, 1.4)
cam.data.ortho_scale = 0.45; cam.location = (0.04, -6, 1.4)
scene.render.filepath = S + r"\s1_ball.png"; bpy.ops.render.render(write_still=True)



