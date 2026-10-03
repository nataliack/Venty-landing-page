"""
Venty workbench. A sewing table in a dark room, lit by one low window. The
light drifts through a sheer curtain, the pattern lines draw themselves in
cornflower, and the camera eases in. Every frame maps to a scroll position.

Run headless:
  blender -b -P tools/workbench/workbench.py -- --mode preview --frames 1,75,150
  blender -b -P tools/workbench/workbench.py -- --mode draft
  blender -b -P tools/workbench/workbench.py -- --mode final

Axes: metres. Table top at z=0, front edge at y=FRONT, x runs left to right
as the camera sees it. The window is in the left wall, the sun comes from
behind it, low and to the back, so shadows fall toward the camera.
"""
import bpy, bmesh, math, sys, os
from mathutils import Vector, Matrix

# ---------------------------------------------------------------- args
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
def arg(name, default):
    if name in argv:
        return argv[argv.index(name) + 1]
    return default
ORIENT = arg("--orient", "landscape")
MODE = arg("--mode", "preview")
FRAMES = [int(f) for f in arg("--frames", "").split(",") if f] or None
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = arg("--out", os.path.join(HERE, "render", ORIENT, MODE))
MACHINE = arg("--machine", "")  # path to a .glb/.gltf/.fbx/.obj sewing machine, blockout if empty
FONT = os.path.join(HERE, "..", "..", "public", "fonts", "FamiljenGrotesk-Variable.ttf")
os.makedirs(OUT, exist_ok=True)

N_FRAMES = 150
FRONT = -0.45                          # table front edge
BACK = 0.70
LEFT, RIGHT = -1.15, 1.15

# palette, linear
NIGHT = (0.0034, 0.0037, 0.0080, 1)    # #0B0C15
INK = (0.0062, 0.0075, 0.0176, 1)      # #121524
NAVY = (0.0395, 0.0723, 0.1301, 1)     # #384C65
STEEL = (0.0648, 0.1144, 0.2462, 1)    # #485F88
PERI = (0.3372, 0.4072, 0.6105, 1)     # #9DACCD
MIST = (0.5271, 0.5776, 0.7084, 1)     # #C0C8DB
CLOUD = (0.8632, 0.9047, 1.0, 1)       # #EFF4FF
CORNFLOWER = (0.1413, 0.2051, 0.9131, 1)  # #687EF5

# ---------------------------------------------------------------- helpers
def clean():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def smooth(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)

def link(ob):
    bpy.context.collection.objects.link(ob)
    return ob

def mat_principled(name, color, rough, metal=0.0, spec=0.5):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = spec
    return m

def add_bump(m, scale, strength, distance=0.002, detail=4.0, wave=None):
    """Noise bump, optionally crossed with a wave for wood grain or weave."""
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    coord = nt.nodes.new("ShaderNodeTexCoord")
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = scale
    noise.inputs["Detail"].default_value = detail
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = strength
    bump.inputs["Distance"].default_value = distance
    nt.links.new(coord.outputs["Object"], noise.inputs["Vector"])
    height = noise.outputs["Fac"]
    if wave:
        w = nt.nodes.new("ShaderNodeTexWave")
        w.bands_direction = wave[0]
        w.inputs["Scale"].default_value = wave[1]
        w.inputs["Distortion"].default_value = wave[2]
        nt.links.new(coord.outputs["Object"], w.inputs["Vector"])
        mul = nt.nodes.new("ShaderNodeMath")
        mul.operation = "ADD"
        nt.links.new(w.outputs["Fac"], mul.inputs[0])
        nt.links.new(noise.outputs["Fac"], mul.inputs[1])
        height = mul.outputs["Value"]
    nt.links.new(height, bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return m

def mat_weave(name, color, scale=900.0):
    """Close weave for the fabric: two crossed sine bands into a bump."""
    m = mat_principled(name, color, 0.9, 0.0, 0.25)
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    if "Sheen Weight" in bsdf.inputs:
        bsdf.inputs["Sheen Weight"].default_value = 0.6
        bsdf.inputs["Sheen Tint"].default_value = MIST
    coord = nt.nodes.new("ShaderNodeTexCoord")
    warp = nt.nodes.new("ShaderNodeTexWave")
    warp.bands_direction = "X"
    warp.inputs["Scale"].default_value = scale
    weft = nt.nodes.new("ShaderNodeTexWave")
    weft.bands_direction = "Y"
    weft.inputs["Scale"].default_value = scale
    mul = nt.nodes.new("ShaderNodeMath")
    mul.operation = "MULTIPLY"
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.25
    bump.inputs["Distance"].default_value = 0.0004
    l = nt.links
    l.new(coord.outputs["Object"], warp.inputs["Vector"])
    l.new(coord.outputs["Object"], weft.inputs["Vector"])
    l.new(warp.outputs["Fac"], mul.inputs[0])
    l.new(weft.outputs["Fac"], mul.inputs[1])
    l.new(mul.outputs["Value"], bump.inputs["Height"])
    l.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return m

def mat_ink(name, strength):
    """Cornflower ink. A little emission so it reads in the shadows."""
    m = mat_principled(name, CORNFLOWER, 0.6)
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Emission Color"].default_value = CORNFLOWER
    bsdf.inputs["Emission Strength"].default_value = strength
    return m

def mat_sheer():
    """Voile curtain: mostly transparent, part translucent, casts a soft shadow."""
    m = bpy.data.materials.new("Sheer")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    tl = nt.nodes.new("ShaderNodeBsdfTranslucent")
    tl.inputs["Color"].default_value = CLOUD
    mix = nt.nodes.new("ShaderNodeMixShader")
    mix.inputs["Fac"].default_value = 0.45
    nt.links.new(tr.outputs[0], mix.inputs[1])
    nt.links.new(tl.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs["Surface"])
    return m

def mesh_from(name, verts, faces, mat=None, smooth_shade=True):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    if smooth_shade:
        for p in me.polygons:
            p.use_smooth = True
    ob = link(bpy.data.objects.new(name, me))
    if mat:
        ob.data.materials.append(mat)
    return ob

def box(name, size, loc, mat, bevel=0.0, segments=3, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        mod = ob.modifiers.new("Bevel", "BEVEL")
        mod.width = bevel
        mod.segments = segments
        mod.limit_method = "NONE"
        bpy.ops.object.shade_smooth()
    ob.data.materials.append(mat)
    return ob

def cyl(name, r, h, loc, mat, rot=(0, 0, 0), verts=48, bevel=0.0):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, vertices=verts, location=loc, rotation=rot)
    ob = bpy.context.active_object
    ob.name = name
    if bevel:
        mod = ob.modifiers.new("Bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 3
        mod.limit_method = "ANGLE"
    bpy.ops.object.shade_smooth()
    ob.data.materials.append(mat)
    return ob

def poly_curve(name, pts, mat, depth, closed=False):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = depth
    cu.bevel_resolution = 2
    cu.use_fill_caps = True
    cu.bevel_factor_mapping_start = "SPLINE"
    cu.bevel_factor_mapping_end = "SPLINE"
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for p, co in zip(sp.points, pts):
        p.co = (co[0], co[1], co[2], 1)
    sp.use_cyclic_u = closed
    ob = link(bpy.data.objects.new(name, cu))
    ob.data.materials.append(mat)
    return ob

# ---------------------------------------------------------------- pattern geometry
class Path2D:
    """Tiny path builder: straight lines and quadratic curves, sampled to points."""
    def __init__(self, x, y):
        self.pts = [(x, y)]
    def line(self, x, y, steps=1):
        x0, y0 = self.pts[-1]
        for i in range(1, steps + 1):
            t = i / steps
            self.pts.append((x0 + (x - x0) * t, y0 + (y - y0) * t))
        return self
    def quad(self, cx, cy, x, y, steps=18):
        x0, y0 = self.pts[-1]
        for i in range(1, steps + 1):
            t = i / steps
            a, b, c = (1 - t) ** 2, 2 * (1 - t) * t, t * t
            self.pts.append((a * x0 + b * cx + c * x, a * y0 + b * cy + c * y))
        return self

def piece_bodice_front():
    p = Path2D(0.0, 0.0)
    p.line(0.085, 0.0).line(0.105, 0.11).line(0.125, 0.0)   # waist dart
    p.line(0.215, 0.0)
    p.line(0.235, 0.24)                                      # side seam
    p.quad(0.17, 0.25, 0.165, 0.33)                          # armhole
    p.quad(0.17, 0.39, 0.205, 0.42)
    p.line(0.085, 0.455)                                     # shoulder
    p.quad(0.075, 0.375, 0.0, 0.37)                          # neckline
    p.line(0.0, 0.0)                                         # centre front, fold
    return p.pts[:-1], {
        "grain": [(0.06, 0.07), (0.06, 0.32)],
        "dart": [(0.085, 0.0), (0.105, 0.11), (0.125, 0.0)],
        "notches": [0.18, 0.31, 0.47],
        "label": ("FRONT BODICE\nCUT 1 ON FOLD", (0.03, 0.18), 0.011),
    }

def piece_sleeve():
    p = Path2D(0.0, 0.0)
    p.line(0.24, 0.0)
    p.line(0.29, 0.30)
    p.quad(0.25, 0.34, 0.215, 0.40)
    p.quad(0.145, 0.50, 0.075, 0.40)                         # sleeve cap
    p.quad(0.04, 0.34, -0.05, 0.30)
    p.line(0.0, 0.0)
    return p.pts[:-1], {
        "grain": [(0.12, 0.05), (0.12, 0.40)],
        "dart": None,
        "notches": [0.33, 0.52, 0.71],
        "label": ("SLEEVE\nCUT 2", (0.04, 0.16), 0.011),
    }

def piece_bodice_back():
    p = Path2D(0.0, 0.0)
    p.line(0.07, 0.0).line(0.09, 0.13).line(0.11, 0.0)
    p.line(0.21, 0.0)
    p.line(0.23, 0.24)
    p.quad(0.185, 0.26, 0.18, 0.34)
    p.quad(0.185, 0.41, 0.215, 0.43)
    p.line(0.075, 0.46)
    p.quad(0.06, 0.43, 0.0, 0.43)
    p.line(0.0, 0.0)
    return p.pts[:-1], {
        "grain": [(0.05, 0.07), (0.05, 0.36)],
        "dart": [(0.07, 0.0), (0.09, 0.13), (0.11, 0.0)],
        "notches": [0.2, 0.33],
        "label": ("BACK BODICE\nCUT 2", (0.12, 0.30), 0.011),
    }

def place(pts2d, at, rot_deg, z):
    a = math.radians(rot_deg)
    ca, sa = math.cos(a), math.sin(a)
    return [(at[0] + u * ca - v * sa, at[1] + u * sa + v * ca, z) for u, v in pts2d]

def along(pts, frac):
    """Point and outward-ish normal at a fraction of a closed polyline's length."""
    segs = [(Vector(pts[i]), Vector(pts[(i + 1) % len(pts)])) for i in range(len(pts))]
    total = sum((b - a).length for a, b in segs)
    d = frac * total
    for a, b in segs:
        L = (b - a).length
        if d <= L:
            t = d / L
            p = a.lerp(b, t)
            tang = (b - a).normalized()
            return p, Vector((tang.y, -tang.x, 0))
        d -= L
    return Vector(pts[0]), Vector((0, -1, 0))

def build_piece(name, spec, at, rot_deg, z, paper_m, ink_m, print_m, window):
    """Paper cut-out, then its ink: outline, dart, grainline, notches, label.
    `window` is (start_frame, end_frame) for the draw."""
    outline2d, extra = spec
    pts = place(outline2d, at, rot_deg, z)

    bm = bmesh.new()
    vs = [bm.verts.new(p) for p in pts]
    es = [bm.edges.new((vs[i], vs[(i + 1) % len(vs)])) for i in range(len(vs))]
    bmesh.ops.triangle_fill(bm, use_beauty=True, use_dissolve=False, edges=es)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    paper = link(bpy.data.objects.new(name, me))
    paper.data.materials.append(paper_m)
    sol = paper.modifiers.new("Thick", "SOLIDIFY")
    sol.thickness = 0.0004
    sol.offset = -1

    zi = z + 0.0006
    f0, f1 = window
    span = f1 - f0
    inks = []
    # open loop back to the start: bevel factor is ignored on cyclic splines
    loop = [(x, y, zi) for x, y, _ in pts] + [(pts[0][0], pts[0][1], zi)]
    outline = poly_curve(name + "_Cut", loop, ink_m, 0.0007)
    inks.append((outline, f0, f0 + span * 0.6))

    if extra["dart"]:
        d = place(extra["dart"], at, rot_deg, zi + 0.0002)
        inks.append((poly_curve(name + "_Dart", d, ink_m, 0.0006), f0 + span * 0.55, f0 + span * 0.7))

    g = place(extra["grain"], at, rot_deg, zi + 0.0002)
    a, b = Vector(g[0]), Vector(g[1])
    dirv = (b - a).normalized()
    side = Vector((-dirv.y, dirv.x, 0))
    head = [b - dirv * 0.014 + side * 0.006, b, b - dirv * 0.014 - side * 0.006]
    tail = [a + dirv * 0.014 + side * 0.006, a, a + dirv * 0.014 - side * 0.006]
    inks.append((poly_curve(name + "_Grain", [a[:], b[:]], ink_m, 0.0006), f0 + span * 0.6, f0 + span * 0.85))
    inks.append((poly_curve(name + "_GrainH", [p[:] for p in head], ink_m, 0.0006), f0 + span * 0.82, f0 + span * 0.9))
    inks.append((poly_curve(name + "_GrainT", [p[:] for p in tail], ink_m, 0.0006), f0 + span * 0.82, f0 + span * 0.9))

    for k, fr in enumerate(extra["notches"]):
        p, n = along(pts, fr)
        seg = [(p + n * 0.004)[:], (p - n * 0.012)[:]]
        seg = [(s[0], s[1], zi + 0.0002) for s in seg]
        t0 = f0 + span * fr * 0.6
        inks.append((poly_curve(f"{name}_Notch{k}", seg, ink_m, 0.0006), t0, t0 + 4))

    for ob, s, e in inks:
        cu = ob.data
        cu.bevel_factor_end = 0.0
        cu.keyframe_insert("bevel_factor_end", frame=1)
        cu.keyframe_insert("bevel_factor_end", frame=int(s))
        cu.bevel_factor_end = 1.0
        cu.keyframe_insert("bevel_factor_end", frame=int(e))

    text, (lu, lv), size = extra["label"]
    td = bpy.data.curves.new(name + "_Label", "FONT")
    td.body = text
    td.size = size
    td.space_line = 1.25
    if os.path.exists(FONT):
        td.font = bpy.data.fonts.load(FONT, check_existing=True)
    lab = link(bpy.data.objects.new(name + "_Label", td))
    lab.data.materials.append(print_m)
    lx, ly, _ = place([(lu, lv)], at, rot_deg, zi)[0]
    lab.location = (lx, ly, zi)
    lab.rotation_euler = (0, 0, math.radians(rot_deg))
    return paper, lab

# ---------------------------------------------------------------- build
clean()
scene = bpy.context.scene
scene.render.fps = 30

wood_m = add_bump(mat_principled("Table", (0.012, 0.013, 0.026, 1), 0.55, 0.0, 0.45),
                  scale=6.0, strength=0.15, wave=("X", 3.0, 18.0))
wall_m = add_bump(mat_principled("Wall", INK, 0.95), scale=40.0, strength=0.2)
fabric_m = mat_weave("Fabric", NAVY)
paper_m = add_bump(mat_principled("Paper", MIST, 0.8, 0.0, 0.3), scale=300.0, strength=0.08, distance=0.0005)
ink_m = mat_ink("Ink", 0.9)
print_m = mat_principled("Print", STEEL, 0.7)
metal_m = mat_principled("Steel", (0.62, 0.64, 0.7, 1), 0.25, 1.0)
black_m = mat_principled("Enamel", (0.01, 0.01, 0.012, 1), 0.18, 0.0, 0.6)
thread_ms = [add_bump(mat_principled(f"Thread{i}", c, 0.6), 800, 0.3, 0.0003, wave=("Z", 1200, 0))
             for i, c in enumerate((MIST, STEEL, CORNFLOWER))]
tape_m = mat_principled("Tape", PERI, 0.6)
chalk_m = mat_principled("Chalk", CLOUD, 0.95)
cushion_m = mat_weave("Cushion", STEEL, 1400)

# room
box("TableTop", (LEFT * -2, BACK - FRONT, 0.045), (0, (BACK + FRONT) / 2, -0.0225), wood_m, bevel=0.004)
box("Floor", (4.2, 3.2, 0.02), (-0.5, 0, -0.76), wall_m)    # inside the room only
box("BackWall", (5.0, 0.05, 4), (-0.08, 1.6, 1.2), wall_m)   # stops at the window wall
# left wall with a window: four slabs around the opening, then mullion and transom
WX = -2.58                                # far enough left to stay out of frame
WIN_Y, WIN_Z, WIN_W, WIN_H = 0.20, 0.85, 0.42, 0.62
y0, y1 = WIN_Y - WIN_W / 2, WIN_Y + WIN_H * 0 + WIN_W / 2
z0, z1 = WIN_Z - WIN_H / 2, WIN_Z + WIN_H / 2
box("WallA", (0.08, 4, z0 + 1.0), (WX, 0, (z0 - 1.0) / 2), wall_m)
box("WallB", (0.08, 4, 2.6 - z1), (WX, 0, (z1 + 2.6) / 2), wall_m)
box("WallC", (0.08, y0 + 2.0, z1 - z0), (WX, (y0 - 2.0) / 2, WIN_Z), wall_m)
box("WallD", (0.08, 2.0 - y1, z1 - z0), (WX, (y1 + 2.0) / 2, WIN_Z), wall_m)
box("Mullion", (0.05, 0.022, WIN_H), (WX, WIN_Y, WIN_Z), wall_m)
box("Transom", (0.05, WIN_W, 0.022), (WX, WIN_Y, WIN_Z + WIN_H * 0.12), wall_m)

# fabric: flat on the table, rolling over the front edge and hanging
def fabric_mesh():
    x0, x1 = -0.95, 0.62
    yb = 0.42
    nx, ny = 160, 110
    R = 0.012                      # wrap radius over the edge
    hang = 0.32
    verts, faces = [], []
    # parametric s runs from the back (on table) over the edge and down
    flat = yb - FRONT
    total = flat + math.pi / 2 * R + hang
    for j in range(ny + 1):
        s = total * j / ny
        for i in range(nx + 1):
            x = x0 + (x1 - x0) * i / nx
            # soft ripples, bigger on the hanging part
            if s <= flat:
                y, z = yb - s, 0.0015
                rip = 0.0
            elif s <= flat + math.pi / 2 * R:
                a = (s - flat) / R
                y, z = FRONT - R * math.sin(a), 0.0015 - R * (1 - math.cos(a))
                rip = 0.0
            else:
                d = s - flat - math.pi / 2 * R
                y, z = FRONT - R, 0.0015 - R - d
                rip = smooth(d / 0.12)
            # hanging folds, a few broad waves across x
            fold = (0.018 * math.sin(x * 21.0 + 0.6) + 0.009 * math.sin(x * 47.0 + 1.9)) * rip
            # the back edge lifts a touch where it gathers
            gather = 0.004 * smooth((s - 0.0) / 0.0001) * max(0.0, 1 - s / 0.06) * (0.5 + 0.5 * math.sin(x * 30))
            verts.append((x, y - fold, z + gather))
    w = nx + 1
    for j in range(ny):
        for i in range(nx):
            faces.append((j * w + i, j * w + i + 1, (j + 1) * w + i + 1, (j + 1) * w + i))
    return verts, faces

fv, ff = fabric_mesh()
fabric = mesh_from("Fabric", fv, ff, fabric_m)
fsol = fabric.modifiers.new("Thick", "SOLIDIFY")
fsol.thickness = 0.0012
fsol.offset = -1

# pattern pieces, drawn one after another as the section scrolls
Z_PAPER = 0.0024
pieces = [
    ("BodiceFront", piece_bodice_front(), (-0.70, -0.36), -4, (18, 70)),
    ("Sleeve", piece_sleeve(), (-0.30, -0.38), 7, (40, 92)),
    ("BodiceBack", piece_bodice_back(), (0.42, -0.36), 84, (62, 112)),
]
labels = []
for name, spec, at, rot, win in pieces:
    _, lab = build_piece(name, spec, at, rot, Z_PAPER, paper_m, ink_m, print_m, win)
    labels.append(lab)

# pins, a pin cushion, chalk
def pin(name, at, angle, lift):
    a = math.radians(angle)
    d = Vector((math.cos(a), math.sin(a), lift)).normalized()
    p0 = Vector(at)
    p1 = p0 + d * 0.032
    sh = poly_curve(name, [p0[:], p1[:]], metal_m, 0.00035)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.0028, location=p1[:], segments=16, ring_count=8)
    hd = bpy.context.active_object
    hd.name = name + "_Head"
    bpy.ops.object.shade_smooth()
    hd.data.materials.append(chalk_m)

pin("Pin0", (-0.60, -0.10, 0.003), 40, 0.12)
pin("Pin1", (-0.52, -0.27, 0.003), 160, 0.1)
pin("Pin2", (-0.12, -0.12, 0.003), 75, 0.15)
pin("Pin3", (-0.05, -0.27, 0.003), 200, 0.1)

bpy.ops.mesh.primitive_uv_sphere_add(radius=0.045, location=(0.86, -0.22, 0.022), segments=48, ring_count=24)
cushion = bpy.context.active_object
cushion.name = "Cushion"
cushion.scale = (1, 1, 0.55)
bpy.ops.object.shade_smooth()
cushion.data.materials.append(cushion_m)
for k in range(7):
    a = k * 2.4
    base = Vector((0.86 + 0.026 * math.cos(a), -0.22 + 0.026 * math.sin(a), 0.036))
    pin(f"CPin{k}", base[:], math.degrees(a), 1.4)

chalk = box("Chalk", (0.045, 0.045, 0.006), (-0.32, -0.36, 0.0045), chalk_m, bevel=0.0015, rot=(0, 0, math.radians(28)))

# tape measure: a loose ribbon across the back of the table, rolling over the front edge on the right
def ribbon(name, pts, width, mat):
    verts, faces = [], []
    for i, p in enumerate(pts):
        a = Vector(pts[max(0, i - 1)])
        b = Vector(pts[min(len(pts) - 1, i + 1)])
        t = (b - a).normalized()
        side = Vector((-t.y, t.x, 0)).normalized() * width / 2
        verts += [(Vector(p) + side)[:], (Vector(p) - side)[:]]
    for i in range(len(pts) - 1):
        faces.append((2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2))
    ob = mesh_from(name, verts, faces, mat)
    s = ob.modifiers.new("Thick", "SOLIDIFY")
    s.thickness = 0.0005
    return ob

tape_pts = []
for i in range(220):
    t = i / 219
    x = -0.85 + 1.25 * t
    y = 0.28 + 0.07 * math.sin(t * 5.2) - 0.05 * t
    tape_pts.append((x, y, 0.0035 if x < 0.62 else 0.0008))
ribbon("Tape", tape_pts, 0.016, tape_m)
cyl("TapeCase", 0.03, 0.016, (0.46, 0.20, 0.008), mat_principled("TapeCase", INK, 0.35), verts=64, bevel=0.003)

# shears, blockout: two blades and two rings, lying open
shears = bpy.data.objects.new("Shears", None)
link(shears)
for k, a in enumerate((-9, 9)):
    blade = box(f"Blade{k}", (0.17, 0.012, 0.003), (0.085, 0, 0.004 + k * 0.0032), metal_m, bevel=0.002,
                rot=(0, 0, math.radians(a)))
    blade.parent = shears
    bpy.ops.mesh.primitive_torus_add(major_radius=0.02, minor_radius=0.0045,
                                     location=(-0.035, (-1 if k else 1) * 0.022, 0.006 + k * 0.003))
    ring = bpy.context.active_object
    ring.name = f"Ring{k}"
    ring.scale = (1.2, 0.85, 1)
    bpy.ops.object.shade_smooth()
    ring.data.materials.append(black_m)
    ring.parent = shears
shears.location = (0.66, -0.06, 0.0)
shears.rotation_euler = (0, 0, math.radians(152))

# thread spools on the right, near the machine
for k, (x, y) in enumerate(((0.80, 0.08), (0.86, 0.16), (0.76, 0.20))):
    core = cyl(f"Spool{k}", 0.016, 0.05, (x, y, 0.027), thread_ms[k], verts=48)
    for zz in (0.0015, 0.0525):
        cyl(f"Flange{k}_{zz}", 0.019, 0.003, (x, y, zz), wood_m, verts=48, bevel=0.0008)

# sewing machine: imported model if given, otherwise a blockout of a vintage cast iron machine
MACHINE_AT = (0.38, 0.38, 0.0)
MACHINE_ROT = -22
def machine_blockout():
    root = bpy.data.objects.new("Machine", None)
    link(root)
    parts = [
        box("M_Bed", (0.40, 0.19, 0.035), (0, 0, 0.0175), black_m, bevel=0.008),
        box("M_Pillar", (0.085, 0.13, 0.22), (0.13, 0.0, 0.145), black_m, bevel=0.025),
        box("M_Arm", (0.30, 0.10, 0.075), (0.0, 0.0, 0.25), black_m, bevel=0.03),
        box("M_Head", (0.07, 0.10, 0.12), (-0.155, 0.0, 0.215), black_m, bevel=0.018),
        cyl("M_Needlebar", 0.004, 0.08, (-0.16, -0.045, 0.12), metal_m, verts=16),
        cyl("M_Wheel", 0.055, 0.025, (0.19, 0.0, 0.21), metal_m, rot=(0, math.radians(90), 0), verts=64, bevel=0.003),
        cyl("M_Spindle", 0.004, 0.035, (0.04, 0.0, 0.305), metal_m, verts=16),
    ]
    for p in parts:
        p.parent = root
    return root

def machine_import(path):
    before = set(bpy.data.objects)
    ext = os.path.splitext(path)[1].lower()
    if ext in (".glb", ".gltf"):
        bpy.ops.import_scene.gltf(filepath=path)
    elif ext == ".fbx":
        bpy.ops.import_scene.fbx(filepath=path)
    elif ext == ".obj":
        bpy.ops.wm.obj_import(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    root = bpy.data.objects.new("Machine", None)
    link(root)
    for o in new:
        if o.parent is None:
            o.parent = root
    # fit: longest horizontal side to 0.42 m, sat on z=0
    bpy.context.view_layer.update()
    mins = Vector((1e9, 1e9, 1e9))
    maxs = Vector((-1e9, -1e9, -1e9))
    for o in new:
        if o.type != "MESH":
            continue
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            mins = Vector(map(min, mins, w))
            maxs = Vector(map(max, maxs, w))
    size = maxs - mins
    s = 0.42 / max(size.x, size.y)
    root.scale = (s, s, s)
    centre = (mins + maxs) / 2
    root.location = (-centre.x * s, -centre.y * s, -mins.z * s)
    bpy.context.view_layer.update()
    holder = bpy.data.objects.new("MachineHolder", None)
    link(holder)
    root.parent = holder
    return holder

machine = machine_import(MACHINE) if MACHINE and os.path.exists(MACHINE) else machine_blockout()
machine.location = MACHINE_AT
machine.rotation_euler = (0, 0, math.radians(MACHINE_ROT))

# ---------------------------------------------------------------- curtain
CUR_X = WX + 0.09
CUR_Y0, CUR_Y1 = WIN_Y - 0.36, WIN_Y + 0.05
CUR_Z0, CUR_Z1 = WIN_Z - 0.55, WIN_Z + 0.55
cnx, cnz = 40, 60
cverts, cfaces = [], []
for j in range(cnz + 1):
    for i in range(cnx + 1):
        cverts.append((CUR_X, CUR_Y0 + (CUR_Y1 - CUR_Y0) * i / cnx, CUR_Z0 + (CUR_Z1 - CUR_Z0) * j / cnz))
for j in range(cnz):
    for i in range(cnx):
        w = cnx + 1
        cfaces.append((j * w + i, j * w + i + 1, (j + 1) * w + i + 1, (j + 1) * w + i))
curtain = mesh_from("Curtain", cverts, cfaces, mat_sheer())
curtain["base"] = cverts

def curtain_shape(t):
    """Pleats plus a slow breathing sway; the hem moves most. t in 0..1 over the scroll."""
    ph = t * math.tau * 2.0
    me = curtain.data
    for v, (x, y, z) in zip(me.vertices, curtain["base"]):
        u = (y - CUR_Y0) / (CUR_Y1 - CUR_Y0)
        h = 1 - (z - CUR_Z0) / (CUR_Z1 - CUR_Z0)       # 0 at the rail, 1 at the hem
        pleat = 0.025 * math.sin(u * 22.0)
        sway = h * h * (0.10 * math.sin(ph + u * 1.5) + 0.04 * math.sin(ph * 2.3 + u * 4 + 1.0))
        drift = h * 0.07 * math.sin(ph * 0.5 + 0.8)      # the free edge swings into the light
        v.co = (x + pleat + sway, y + drift * u, z)
    me.update()

# ---------------------------------------------------------------- lights
SUN_EL, SUN_AZ = 20.0, -12.0                            # heading into the room, degrees
def sun_dir(el, az):
    e, a = math.radians(el), math.radians(az)
    return Vector((math.cos(e) * math.cos(a), math.cos(e) * math.sin(a), -math.sin(e)))

sun_data = bpy.data.lights.new("Sun", "SUN")
sun_data.energy = 5.0
sun_data.color = CLOUD[:3]
sun_data.angle = math.radians(0.6)
sun = link(bpy.data.objects.new("Sun", sun_data))
def aim_sun(el, az):
    sun.rotation_euler = sun_dir(el, az).to_track_quat("-Z", "Y").to_euler()

def area(name, loc, target, power, color, size):
    light = bpy.data.lights.new(name, "AREA")
    light.energy = power
    light.color = color[:3]
    light.size = size
    ob = link(bpy.data.objects.new(name, light))
    ob.location = loc
    ob.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    return ob

# rim on the machine from behind, so the black enamel keeps a silhouette
area("Rim", (0.85, 1.15, 0.55), (0.38, 0.38, 0.15), 6.0, PERI, 0.6)
# breath of fill from the camera side so the shadows are not dead black
area("Fill", (0.4, -2.2, 0.9), (0, 0, 0), 3.0, STEEL, 2.0)

world = bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = NIGHT
bg.inputs["Strength"].default_value = 1.0

# haze, so the shaft reads in the air
bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.5, 0.0, 0.6))
haze = bpy.context.active_object
haze.name = "Haze"
haze.scale = (4.1, 3.1, 1.4)
hm = bpy.data.materials.new("Haze")
hm.use_nodes = True
hm.node_tree.nodes.clear()
hout = hm.node_tree.nodes.new("ShaderNodeOutputMaterial")
hvol = hm.node_tree.nodes.new("ShaderNodeVolumePrincipled")
hvol.inputs["Density"].default_value = 0.035
hvol.inputs["Color"].default_value = CLOUD
hvol.inputs["Anisotropy"].default_value = 0.45
hm.node_tree.links.new(hvol.outputs["Volume"], hout.inputs["Volume"])
haze.data.materials.append(hm)
haze.visible_shadow = False

# ---------------------------------------------------------------- camera
cam_data = bpy.data.cameras.new("Camera")
cam = link(bpy.data.objects.new("Camera", cam_data))
scene.camera = cam
cam_data.lens = 38
cam_data.sensor_fit = "HORIZONTAL"
cam_data.sensor_width = 36
cam_data.dof.use_dof = True
cam_data.dof.aperture_fstop = 2.4
if ORIENT == "portrait":
    scene.render.resolution_x, scene.render.resolution_y = 1080, 1920
    cam_data.lens = 24
else:
    scene.render.resolution_x, scene.render.resolution_y = 1920, 1080

CAM_A, CAM_B = Vector((0.80, -1.60, 0.38)), Vector((0.66, -1.40, 0.31))
AIM_A, AIM_B = Vector((-0.08, 0.02, 0.0)), Vector((-0.14, -0.04, 0.01))
focus = link(bpy.data.objects.new("Focus", None))
cam_data.dof.focus_object = focus

# ---------------------------------------------------------------- animation
def apply_frame(scn):
    t = (scn.frame_current - 1) / (N_FRAMES - 1)
    e = smooth(t) * 0.6 + t * 0.4                        # mostly linear, soft ends
    c = CAM_A.lerp(CAM_B, e)
    aim = AIM_A.lerp(AIM_B, e)
    # small arc so the push is not a straight dolly
    c.x += 0.05 * math.sin(e * math.pi)
    cam.location = c
    cam.rotation_euler = (aim - c).to_track_quat("-Z", "Y").to_euler()
    focus.location = aim.lerp(Vector((-0.35, -0.22, 0.0)), 0.5)
    aim_sun(SUN_EL - 2.0 * t, SUN_AZ + 5.0 * t)        # the sun slides a few degrees
    curtain_shape(t)

bpy.app.handlers.frame_change_pre.clear()
bpy.app.handlers.frame_change_pre.append(apply_frame)
scene.frame_start, scene.frame_end = 1, N_FRAMES

# ---------------------------------------------------------------- render
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.render.image_settings.file_format = "WEBP"
scene.render.image_settings.color_mode = "RGB"
scene.render.image_settings.quality = 92
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = 0.0
scene.cycles.volume_step_rate = 4.0
scene.cycles.max_bounces = 6
scene.cycles.transparent_max_bounces = 8
if MODE == "draft":                                     # quick motion check, all frames
    scene.render.resolution_percentage = 33
    scene.cycles.samples = 12
elif MODE == "preview":
    scene.render.resolution_percentage = 50
    scene.cycles.samples = 48
else:
    scene.render.resolution_percentage = 100
    scene.cycles.samples = 256
scene.cycles.use_denoising = True
scene.cycles.use_adaptive_sampling = True

frames = FRAMES or list(range(1, N_FRAMES + 1))
for f in frames:
    scene.frame_set(f)
    apply_frame(scene)
    scene.render.filepath = os.path.join(OUT, f"bench_{f:03d}.webp")
    bpy.ops.render.render(write_still=True)
    print(f"RENDERED {scene.render.filepath}")

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "..", f"workbench_{ORIENT}.blend"))
print("DONE")
