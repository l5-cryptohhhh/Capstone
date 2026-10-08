"""Tre animazioni: "juggle" (palleggi alternati, loop), "kick_p" e "kick_n" (tiro col piede destro/sinistro, una volta).
Il tiro parte dalla stessa posa del tocco di palleggio, cosi' si puo' passare dal palleggio al tiro senza scatti."""
import bpy, math, sys
import numpy as np
from mathutils import Vector, Matrix, Euler

S = r"C:\Users\nunzi\AppData\Local\Temp\claude\c--Users-nunzi-OneDrive-Desktop-Corso-Epicode-Capstone\80851bdc-c5d2-492e-a20f-14c1215ce1e6\scratchpad"
ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
PREVIEW = '--preview' in ARGS
EXPORT = ARGS[ARGS.index('--export') + 1] if '--export' in ARGS else None
SRC = ARGS[ARGS.index('--src') + 1] if '--src' in ARGS else "stage1.blend"

bpy.ops.wm.open_mainfile(filepath=S + "\\" + SRC)
scene = bpy.context.scene
arm = bpy.data.objects["Rig"]; ball = bpy.data.objects["Ball"]; body = bpy.data.objects["Boy"]
BALL_R = 0.14

FPS = 30; N = 40                       # palleggio: un ciclo = un tocco col destro + uno col sinistro = 1,33 s
KN = 40                                # tiro: 40 fotogrammi
scene.render.fps = FPS

bpy.context.view_layer.objects.active = arm
for o in scene.objects: o.select_set(False)
arm.select_set(True)
arm.data.pose_position = 'POSE'
bpy.ops.object.mode_set(mode='POSE')
PB = arm.pose.bones
for pb in PB: pb.rotation_mode = 'QUATERNION'
if not arm.animation_data: arm.animation_data_create()
if not ball.animation_data: ball.animation_data_create()

def upd(): bpy.context.view_layer.update()

def world_rot(pb, axis, deg):
    rest = pb.bone.matrix_local.to_3x3()
    Rw = Matrix.Rotation(math.radians(deg), 3, axis)
    return (rest.inverted() @ Rw @ rest).to_quaternion()

def fk(name, frame, rx=0.0, ry=0.0, rz=0.0, loc=None):
    pb = PB[name]
    pb.rotation_quaternion = world_rot(pb, 'X', rx) @ world_rot(pb, 'Y', ry) @ world_rot(pb, 'Z', rz)
    pb.keyframe_insert('rotation_quaternion', frame=frame)
    if loc is not None:
        pb.location = pb.bone.matrix_local.to_3x3().inverted() @ Vector(loc)
        pb.keyframe_insert('location', frame=frame)
    upd()

def aim(name, frame, direction):
    pb = PB[name]
    rest = pb.bone.matrix_local.to_3x3()
    d_r = (rest @ Vector((0, 1, 0))).normalized()
    q = d_r.rotation_difference(Vector(direction).normalized())
    R = q.to_matrix() @ rest
    head = pb.matrix.translation.copy()
    pb.matrix = Matrix.Translation(head) @ R.to_4x4()
    upd()
    pb.keyframe_insert('rotation_quaternion', frame=frame)
    pb.keyframe_insert('location', frame=frame)

ANKLE_Z = 0.18

def bump(d):
    d = (d + 0.5) % 1.0 - 0.5
    return 0.5 + 0.5 * math.cos(2 * math.pi * d / 0.5) if abs(d) < 0.25 else 0.0

def smoothstep(x):
    x = max(0.0, min(1.0, x)); return x * x * (3 - 2 * x)

def lerp(a, b, t): return a + (b - a) * t

# ---- gambe -------------------------------------------------------------------------------------------------
TH_K, SH_K, PSI_K = 60.0, 24.0, -8.0     # posa di "tocco" (gradi): coscia, stinco (angolo assoluto), piede

def stand_solution(side, hip, u):
    pth, psh = PB['thigh_' + side], PB['shin_' + side]
    L1, L2 = pth.bone.length, psh.bone.length
    drop = max(0.05, hip.z - ANKLE_Z)
    th_s = math.radians(20 + 6 * (1 - u))
    c = (drop - L1 * math.cos(th_s)) / L2
    sh_s = -math.acos(max(-1.0, min(1.0, c)))
    ank_x = {'p': 0.20, 'n': -0.05}[side]
    ab_s = math.asin(max(-0.5, min(0.5, (ank_x - hip.x) / (L1 + L2))))
    return th_s, sh_s, ab_s

def set_leg(side, f, u=0.0, explicit=None):
    """u: 0 = appoggio a terra, 1 = posa di tocco. explicit=(coscia, stinco, piede) in gradi forza l'angolo."""
    th, sh, ft = 'thigh_' + side, 'shin_' + side, 'foot_' + side
    sign = +1 if side == 'p' else -1
    hip = PB[th].matrix.translation.copy()
    th_s, sh_s, ab_s = stand_solution(side, hip, u if explicit is None else 0.0)
    if explicit is None:
        e = smoothstep(u)
        th_a = lerp(th_s, math.radians(TH_K), e); sh_a = lerp(sh_s, math.radians(SH_K), e)
        ab = lerp(ab_s, math.radians(sign * 5), e); psi = lerp(math.radians(-33), math.radians(PSI_K), e)
    else:
        th_a, sh_a, psi = (math.radians(v) for v in explicit)
        e = smoothstep(max(0.0, min(1.0, (math.degrees(th_a) - 10) / 50)))
        ab = lerp(ab_s, math.radians(sign * 5), e)
    aim(th, f, (math.sin(ab), -math.sin(th_a), -math.cos(th_a)))
    aim(sh, f, (math.sin(ab) * 0.6, -math.sin(sh_a), -math.cos(sh_a)))
    aim(ft, f, (0.0, -math.cos(psi), math.sin(psi)))

def dval(ph): return bump(ph) - bump(ph - 0.5)                 # +1 destro in alto, -1 sinistro in alto
def cval(ph): return 0.5 + 0.5 * math.cos(4 * math.pi * ph)    # 1 ai tocchi, 0 all'apice del pallone
def hips_z_of(contact): return -0.045 * contact - 0.018        # il corpo ammortizza al tocco (assetto con ginocchia flesse)

def torso(f, d, contact, hips_z, extra=None, ph=0.0):
    ex = extra or {}
    d_lag = dval(ph - 0.07)                  # braccia e spalle arrivano un po' dopo le gambe
    c_lag = cval(ph - 0.08)                  # la testa insegue il pallone con un leggero ritardo
    d_lag2 = dval(ph - 0.14)
    fk('hips', f, rz=-6.5 * d + ex.get('hips_rz', 0), ry=5.0 * d, rx=1.5 * contact, loc=(-0.032 * d, 0.0, hips_z))
    fk('spine', f, rx=1.5 + 2.0 * contact + ex.get('spine_rx', 0), rz=4.5 * d_lag, ry=-3.0 * d_lag)
    fk('chest', f, rx=1.5 * contact + ex.get('chest_rx', 0), rz=8.0 * d_lag2 + ex.get('chest_rz', 0), ry=-3.5 * d_lag2)
    fk('neck', f, rx=-2 + 6 * c_lag + ex.get('neck_rx', 0), rz=-5 * d_lag2)
    fk('head', f, rx=-7 + 14 * c_lag + ex.get('head_rx', 0), rz=-7 * d_lag2, ry=3 * d_lag2)
    fk('arm_p', f, rx=22 * d_lag + 5 * (1 - contact) + ex.get('arm_p_rx', 0), rz=-20 - 6 * (1 - contact) - 5 * d_lag + ex.get('arm_p_rz', 0))
    fk('fore_p', f, rx=-12 - 8 * (1 - contact) + 9 * d_lag + ex.get('fore_p_rx', 0))
    fk('hand_p', f, rx=-6 * d_lag2)
    fk('arm_n', f, rx=-22 * d_lag + 5 * (1 - contact) + ex.get('arm_n_rx', 0), rz=20 + 6 * (1 - contact) - 5 * d_lag + ex.get('arm_n_rz', 0))
    fk('fore_n', f, rx=-12 - 8 * (1 - contact) - 9 * d_lag + ex.get('fore_n_rx', 0))
    fk('hand_n', f, rx=6 * d_lag2)
    fk('root', f)

# ============================ 1) PALLEGGIO ==================================================================
def juggle_pose(f):
    ph = f / N
    up_, un_ = bump(ph), bump(ph - 0.5)
    d = up_ - un_
    contact = 0.5 + 0.5 * math.cos(4 * math.pi * ph)
    torso(f, d, contact, hips_z_of(contact), None, ph)
    set_leg('p', f, up_); set_leg('n', f, un_)

act_juggle_rig = bpy.data.actions.new("juggle_Rig"); arm.animation_data.action = act_juggle_rig
for f in range(N): juggle_pose(f)
bpy.ops.object.mode_set(mode='OBJECT')

dg = bpy.context.evaluated_depsgraph_get()
vg = {k: body.vertex_groups[k].index for k in ('foot_p', 'foot_n')}
foot_idx = {k: np.array([v.index for v in body.data.vertices if any(g.group == i and g.weight > 0.4 for g in v.groups)], dtype=np.int64)
            for k, i in vg.items()}

def eval_verts():
    me = body.evaluated_get(bpy.context.evaluated_depsgraph_get()).data
    a = np.empty(len(me.vertices) * 3, dtype=np.float32); me.vertices.foreach_get('co', a)
    return a.reshape(-1, 3)

def contact_center(foot):
    Vall = eval_verts()
    mask = np.ones(len(Vall), dtype=bool); mask[foot_idx[foot]] = False
    Vo = Vall[mask]
    Vf = Vall[foot_idx[foot]]
    ankle = PB[foot].matrix.translation
    cand = Vf[Vf[:, 1] < ankle.y - 0.02]
    top = cand[cand[:, 2] >= np.quantile(cand[:, 2], 0.9)]
    cx, cy = float(top[:, 0].mean()), float(top[:, 1].mean())
    for _ in range(40):
        dx, dy = cand[:, 0] - cx, cand[:, 1] - cy
        h = dx * dx + dy * dy
        ok = h < BALL_R ** 2
        cz = float((cand[ok, 2] + np.sqrt(BALL_R ** 2 - h[ok])).max())
        gap = float(np.linalg.norm(Vo - np.array([cx, cy, cz]), axis=1).min() - BALL_R)
        if gap >= 0.012: break
        cy -= 0.01
    return np.array([cx, cy, cz])

scene.frame_set(0); upd(); cR = contact_center('foot_p')
scene.frame_set(N // 2); upd(); cL = contact_center('foot_n')
print("CONTACT R", cR.round(3).tolist(), "L", cL.round(3).tolist())

H = 0.62
def juggle_ball(ph):
    ph = ph % 1.0
    if ph < 0.5: a, b, s = cR, cL, ph / 0.5
    else:        a, b, s = cL, cR, (ph - 0.5) / 0.5
    p = a + (b - a) * s
    p[2] = a[2] + (b[2] - a[2]) * s + 4 * H * s * (1 - s)
    return p

ball.rotation_mode = 'XYZ'
act_juggle_ball = bpy.data.actions.new("juggle_Ball"); ball.animation_data.action = act_juggle_ball
for f in range(N):
    ph = f / N
    ball.location = Vector(juggle_ball(ph).tolist())
    ball.rotation_euler = Euler((2 * math.pi * ph, 0.0, 2 * math.pi * ph * 0.5))
    ball.keyframe_insert('location', frame=f); ball.keyframe_insert('rotation_euler', frame=f)

def linearize(act):
    for fc in (act.fcurves if hasattr(act, 'fcurves') else []):
        for kp in fc.keyframe_points: kp.interpolation = 'LINEAR'
linearize(act_juggle_rig); linearize(act_juggle_ball)

# verifica collisioni del palleggio
worst = 9.9
for f in range(N):
    scene.frame_set(f); upd()
    V = eval_verts(); c = np.array(ball.location)
    dist = np.linalg.norm(V - c, axis=1)
    cf = 'foot_p' if f == 0 else ('foot_n' if f == N // 2 else None)
    mask = np.ones(len(V), dtype=bool)
    if cf: mask[foot_idx[cf]] = False
    worst = min(worst, dist[mask].min() - BALL_R)
print("JUGGLE worst gap", round(float(worst), 4))

def stash(obj, action, name):
    tr = obj.animation_data.nla_tracks.new(); tr.name = name
    tr.strips.new(name, 0, action)
    obj.animation_data.action = None

def preview_frames(frames, tag, scene_frames_action=None):
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = 800; scene.render.resolution_y = 500
    if 'PrevSun' not in bpy.data.objects:
        bpy.ops.object.light_add(type='SUN', location=(2, -4, 4)); bpy.context.object.name = 'PrevSun'; bpy.context.object.data.energy = 3
        scene.world = bpy.data.worlds.new("w"); scene.world.use_nodes = True
        scene.world.node_tree.nodes['Background'].inputs[1].default_value = 1.0
        bpy.ops.object.camera_add(); bpy.context.object.name = 'PrevCam'
    cam = bpy.data.objects['PrevCam']; scene.camera = cam
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = 4.2
    for f in frames:
        scene.frame_set(f)
        cam.rotation_euler = (math.radians(90), 0, math.radians(90)); cam.location = (6, -1.5, 0.95)     # laterale: segue il tiro in avanti
        scene.render.filepath = S + "\\%s_s_%02d.png" % (tag, f)
        bpy.ops.render.render(write_still=True)

if PREVIEW:
    bpy.ops.object.mode_set(mode='OBJECT')
    arm.animation_data.action = act_juggle_rig; ball.animation_data.action = act_juggle_ball
    preview_frames((0, 10, 20, 30), 'jg')
    arm.animation_data.action = None; ball.animation_data.action = None
else:
    pass
stash(arm, act_juggle_rig, 'juggle'); stash(ball, act_juggle_ball, 'juggle')

# ============================ 2) TIRO ========================================================================
def interp_table(tab, f):
    """tab = [(frame, valori...)] -> interpolazione morbida (cosinusoidale) tra i punti."""
    if f <= tab[0][0]: return tab[0][1:]
    for (f0, *v0), (f1, *v1) in zip(tab, tab[1:]):
        if f <= f1:
            s = smoothstep((f - f0) / (f1 - f0))
            return tuple(lerp(a, b, s) for a, b in zip(v0, v1))
    return tab[-1][1:]

KICK_LEG = [(0, 60, 24, -8), (5, 32, 2, -26), (10, 10, -22, -34), (14, -14, -66, -40), (18, 38, 14, -20), (20, 60, 24, -8),
            (24, 78, 46, 4), (30, 88, 62, 12), (KN, 88, 62, 12)]

def kick_pose(f, kside):
    sgn = +1 if kside == 'p' else -1            # +1: tira il destro (+X), l'appoggio e' il sinistro
    d = sgn
    strike = smoothstep((f - 14) / 6.0)          # 0 -> 1 mentre la gamba arriva sul pallone
    follow = smoothstep((f - 20) / 10.0)
    windup = smoothstep((f - 5) / 9.0) * (1 - strike)
    c0 = 1.0 - 0.5 * smoothstep(f / 6.0)
    contact = max(c0 * (1 - strike), 0.9 * strike * (1 - follow))
    ex = {
        'hips_rz': -sgn * 5 * (strike + 0.4 * follow),
        'spine_rx': 4 * windup - 9 * follow,
        'chest_rx': 3 * windup - 6 * follow,
        'chest_rz': -sgn * 5 * strike,
        'head_rx': -14 * follow + 4 * (1 - follow) * strike,
        'neck_rx': -6 * follow,
        'arm_p_rx': sgn * (-26 * strike) , 'arm_p_rz': -10 * strike,
        'arm_n_rx': -sgn * (-26 * strike), 'arm_n_rz': 10 * strike,
        'fore_p_rx': -10 * strike, 'fore_n_rx': -10 * strike,
    }
    # il lato che tira porta il braccio opposto in avanti: i segni sopra sono scambiati per kside = 'n'
    hz = lerp(hips_z_of(1.0), hips_z_of(0.2), smoothstep(f / 6.0)) - 0.03 * strike * (1 - follow) - 0.01 * follow
    torso(f, d, contact, hz, ex, 0.0 if kside == 'p' else 0.5)
    stand_side = 'n' if kside == 'p' else 'p'
    set_leg(stand_side, f, 0.0)
    th, sh, psi = interp_table(KICK_LEG, f)
    set_leg(kside, f, explicit=(th, sh, psi))

STRIKE = 20
LAUNCH_DIR = Vector((0.0, -0.97, 0.22)).normalized()
LAUNCH_SPEED = 17.0
HK = 0.55

def kick_ball(f, c0, c_strike):
    if f <= STRIKE:
        s = f / STRIKE
        p = c0 + (c_strike - c0) * s
        p[2] = c0[2] + (c_strike[2] - c0[2]) * s + 4 * HK * s * (1 - s)
        return p, False
    tau = (f - STRIKE) / FPS
    p = c_strike + np.array(LAUNCH_DIR) * LAUNCH_SPEED * tau
    p[2] -= 0.5 * 9.8 * tau * tau
    return p, True

for kside in ('p', 'n'):
    for o in scene.objects: o.select_set(False)
    arm.select_set(True); bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    act_r = bpy.data.actions.new("kick_%s_Rig" % kside); arm.animation_data.action = act_r
    for f in range(KN + 1): kick_pose(f, kside)
    bpy.ops.object.mode_set(mode='OBJECT')
    # contatto della scarpa che tira, misurato sul fotogramma del colpo e su quello iniziale
    foot = 'foot_' + kside
    scene.frame_set(0); upd(); c0 = contact_center(foot)
    scene.frame_set(STRIKE); upd(); c_strike = contact_center(foot)
    print("KICK", kside, "c0", c0.round(3).tolist(), "strike", c_strike.round(3).tolist())
    act_b = bpy.data.actions.new("kick_%s_Ball" % kside); ball.animation_data.action = act_b
    for f in range(KN + 1):
        p, flying = kick_ball(f, c0, c_strike)
        ball.location = Vector(p.tolist())
        spin = 2 * math.pi * (f / N) * (4.0 if flying else 1.0)
        ball.rotation_euler = Euler((spin, 0.0, spin * 0.3))
        ball.keyframe_insert('location', frame=f); ball.keyframe_insert('rotation_euler', frame=f)
    linearize(act_r); linearize(act_b)
    # collisioni prima del colpo
    worst = 9.9
    for f in range(0, STRIKE):
        scene.frame_set(f); upd()
        V = eval_verts(); c = np.array(ball.location)
        dist = np.linalg.norm(V - c, axis=1)
        mask = np.ones(len(V), dtype=bool)
        if f == 0: mask[foot_idx[foot]] = False
        worst = min(worst, dist[mask].min() - BALL_R)
    scene.frame_set(STRIKE); upd()
    V = eval_verts()
    print("KICK", kside, "pre-strike worst gap", round(float(worst), 4), "gap(scarpa) at strike", round(float(np.linalg.norm(V[foot_idx[foot]] - np.array(ball.location), axis=1).min() - BALL_R), 4))
    if PREVIEW and kside == 'p':
        preview_frames((0, 6, 12, 15, 18, 20, 23, 28, 34), 'kk')
    stash(arm, act_r, 'kick_' + kside); stash(ball, act_b, 'kick_' + kside)

scene.frame_set(0)
bpy.ops.wm.save_as_mainfile(filepath=S + r"\animated3.blend")

if EXPORT:
    ratio = float(ARGS[ARGS.index('--ratio') + 1]) if '--ratio' in ARGS else 0.4
    bpy.context.view_layer.objects.active = body
    for o in scene.objects: o.select_set(False)
    body.select_set(True)
    prot = body.vertex_groups.new(name='protect')
    gid = {k: body.vertex_groups[k].index for k in ('head', 'neck', 'hand_p', 'hand_n')}
    for v in body.data.vertices:
        w = 0.0
        for g in v.groups:
            if g.group in gid.values(): w = max(w, g.weight)
        if w > 0.0: prot.add([v.index], w, 'REPLACE')
    dec = body.modifiers.new('Dec', 'DECIMATE'); dec.ratio = ratio
    dec.vertex_group = 'protect'; dec.invert_vertex_group = True
    bpy.ops.object.modifier_move_to_index(modifier='Dec', index=0)
    bpy.ops.object.modifier_apply(modifier='Dec')
    print('BODY verts after decimate', len(body.data.vertices), 'tris', len(body.data.polygons))
    for img in bpy.data.images:
        size = 2048 if 'diffuse' in img.name else 1024
        if img.size[0] > size: img.scale(size, size)
    scene.frame_start = 0; scene.frame_end = KN
    bpy.ops.export_scene.gltf(filepath=EXPORT, export_format='GLB', export_image_format='JPEG', export_jpeg_quality=85,
                              export_animations=True, export_animation_mode='NLA_TRACKS', export_skins=True,
                              export_apply=False)
