"""
Venty workbench. A sewing table in a dark room, lit by one low window. Printed
paper patterns pinned to linen, a satin gown laid out, offcuts, the machine
at the back. The light drifts through a sheer curtain while the camera comes
down from straight overhead to a low front view. Every frame maps to a scroll
position.

Build the prints first (system Python), then render (Blender):
  python tools/workbench/patterns.py
  blender -b -P tools/workbench/workbench.py -- --mode preview --frames 1,80,160,240
  blender -b -P tools/workbench/workbench.py -- --mode draft
  blender -b -P tools/workbench/workbench.py -- --mode web --frames 1,3,5,...,239   (see the page)
  blender -b -P tools/workbench/workbench.py -- --mode final

Axes: metres. Table top at z=0, front edge at y=FRONT, x runs left to right
as the camera sees it. The window is in the left wall, out of shot; the sun
comes through it low, so the shaft rakes across the table from the left.
"""
import bpy, bmesh, json, math, sys, os
import numpy
from mathutils import Vector

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
PIECES = os.path.join(HERE, "build", "pieces.json")          # from patterns.py

def find_machine():
    """First .glb/.gltf under assets/, so a downloaded model is picked up as is."""
    for root, _, files in os.walk(os.path.join(HERE, "assets")):
        for f in sorted(files):
            if f.lower().endswith((".glb", ".gltf")):
                return os.path.join(root, f)
    return ""
MACHINE = arg("--machine", "") or find_machine()             # blockout if none
os.makedirs(OUT, exist_ok=True)

N_FRAMES = 300
MOVE_END = 240                          # the orbit ends here; the rest is the descent
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

def mesh_uv(name, verts, faces, uvs, mat=None, smooth_shade=True):
    """mesh_from, plus one UV per vertex."""
    ob = mesh_from(name, verts, faces, mat, smooth_shade)
    me = ob.data
    layer = me.uv_layers.new(name="UVMap")
    for poly in me.polygons:
        for li in poly.loop_indices:
            layer.data[li].uv = uvs[me.loops[li].vertex_index]
    return ob

def mat_print(name, path):
    """Paper with its print: the rasterised sheet as base colour, plus paper tooth."""
    m = mat_principled(name, MIST, 0.78, 0.0, 0.3)
    nt = m.node_tree
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(path, check_existing=True)
    tex.interpolation = "Cubic"
    nt.links.new(tex.outputs["Color"], nt.nodes["Principled BSDF"].inputs["Base Color"])
    return add_bump(m, scale=300.0, strength=0.06, distance=0.0004)

def mat_satin(name, color):
    """Satin: a soft directional sheen, glossy without looking wet."""
    m = mat_principled(name, color, 0.3, 0.0, 0.7)
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Anisotropic"].default_value = 0.55
    bsdf.inputs["Sheen Weight"].default_value = 0.5
    bsdf.inputs["Sheen Roughness"].default_value = 0.3
    bsdf.inputs["Sheen Tint"].default_value = CLOUD
    return m

def mat_velvet(name, color):
    m = mat_principled(name, color, 0.85, 0.0, 0.2)
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Sheen Weight"].default_value = 1.0
    bsdf.inputs["Sheen Roughness"].default_value = 0.35
    bsdf.inputs["Sheen Tint"].default_value = PERI
    return m

def local(at, rot_deg, x_cm, y_cm, z=0.0):
    """Piece-local centimetres to world metres."""
    a = math.radians(rot_deg)
    x, y = x_cm * 0.01, y_cm * 0.01
    return (at[0] + x * math.cos(a) - y * math.sin(a), at[1] + x * math.sin(a) + y * math.cos(a), z)

def flat(name, pts_cm, at, rot_deg, z, mat, thick, sheet=None):
    """A flat cut shape (paper or cloth) from a centimetre outline, top face at z.
    With `sheet` (the pieces.json entry) it is UV mapped onto its print."""
    bm = bmesh.new()
    vs = [bm.verts.new(local(at, rot_deg, x, y, z)) for x, y in pts_cm]
    es = [bm.edges.new((vs[i], vs[(i + 1) % len(vs)])) for i in range(len(vs))]
    bmesh.ops.triangle_fill(bm, use_beauty=True, use_dissolve=False, edges=es)
    bm.normal_update()
    for f in bm.faces:
        if f.normal.z < 0:
            f.normal_flip()
    bm.verts.index_update()
    if sheet:
        uv = bm.loops.layers.uv.new("UVMap")
        for f in bm.faces:
            for l in f.loops:
                x, y = pts_cm[l.vert.index]
                l[uv].uv = ((x - sheet["x0"]) / sheet["w"], (y - sheet["y0"]) / sheet["h"])
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = link(bpy.data.objects.new(name, me))
    ob.data.materials.append(mat)
    sol = ob.modifiers.new("Thick", "SOLIDIFY")
    sol.thickness = thick
    sol.offset = -1
    return ob

def ribbon(name, pts, width, mat, sheet=None):
    """Flat strip along a path. With `sheet`, the print runs along its length (the tape)."""
    verts, faces, uvs = [], [], []
    run = 0.0
    for i, p in enumerate(pts):
        if i:
            run += (Vector(p) - Vector(pts[i - 1])).length
        a = Vector(pts[max(0, i - 1)])
        b = Vector(pts[min(len(pts) - 1, i + 1)])
        t = (b - a).normalized()
        side = Vector((-t.y, t.x, 0)).normalized() * width / 2
        verts += [(Vector(p) + side)[:], (Vector(p) - side)[:]]
        if sheet:
            u = (run * 100 - sheet["x0"]) / sheet["w"]
            uvs += [(u, (sheet["width"] - sheet["y0"]) / sheet["h"]), (u, (0 - sheet["y0"]) / sheet["h"])]
    for i in range(len(pts) - 1):
        faces.append((2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2))
    ob = mesh_uv(name, verts, faces, uvs, mat) if sheet else mesh_from(name, verts, faces, mat)
    s = ob.modifiers.new("Thick", "SOLIDIFY")
    s.thickness = 0.0005
    return ob

# ---------------------------------------------------------------- cloth
# Cloth is simulated once, falling and settling onto the table, and the settled
# shape is cached in build/cloth/<name>.npy. Later runs load the cache, so
# renders never re-simulate. Pass --resim to throw the caches away.
CLOTH_DIR = os.path.join(HERE, "build", "cloth")
RESIM = "--resim" in argv
SIM_FRAMES = 100
pending = []

def group(ob, name, weights):
    vg = ob.vertex_groups.new(name=name)
    for i, w in enumerate(weights):
        if w > 0:
            vg.add([i], min(1.0, w), "REPLACE")
    return name

def cloth(ob, mass, tension, bending, shrink=0.0, shrink_w=None, pin_w=None, self_collide=False, damping=2.0):
    """Restore the cached settle, or queue the object for simulation."""
    path = os.path.join(CLOTH_DIR, ob.name + ".npy")
    me = ob.data
    if os.path.exists(path) and not RESIM:
        co = numpy.load(path)
        if len(co) == len(me.vertices) * 3:
            me.vertices.foreach_set("co", co)
            me.update()
            return
    mod = ob.modifiers.new("Cloth", "CLOTH")
    ob.modifiers.move(len(ob.modifiers) - 1, 0)
    cs = mod.settings
    cs.quality = 10
    cs.mass = mass
    cs.tension_stiffness = cs.compression_stiffness = tension
    cs.shear_stiffness = tension * 0.4
    cs.bending_stiffness = bending
    cs.air_damping = damping
    # Blender blends shrink from shrink_min (weight 0) to shrink_max (weight 1),
    # so `shrink_w` (1 = full growth) goes in inverted
    cs.shrink_min = shrink
    if shrink_w:
        cs.shrink_max = 0.0
        cs.vertex_group_shrink = group(ob, "Shrink", [1.0 - w if w < 1 else 0.0 for w in shrink_w])
        # the group must cover every vertex, or the rest default to weight 0 (full growth)
        vg = ob.vertex_groups["Shrink"]
        vg.add([i for i, w in enumerate(shrink_w) if w >= 1], 0.0, "REPLACE")
    if pin_w:
        cs.vertex_group_mass = group(ob, "Pin", pin_w)
        cs.pin_stiffness = 1.0
    cc = mod.collision_settings
    cc.collision_quality = 3
    cc.distance_min = 0.0012
    cc.use_self_collision = self_collide
    cc.self_distance_min = 0.0012
    cc.self_friction = 8.0
    mod.point_cache.frame_start = 1
    mod.point_cache.frame_end = SIM_FRAMES
    pending.append((ob, path))

def simulate():
    """Run every queued cloth together, then bake the settled shapes into the meshes."""
    if not pending:
        return
    others = []
    for ob, _ in pending:
        for m in ob.modifiers:
            if m.type != "CLOTH" and m.show_viewport:
                m.show_viewport = False
                others.append(m)
    for f in range(1, SIM_FRAMES + 1):
        scene.frame_set(f)
        if f % 10 == 0:
            print(f"SIM {f}/{SIM_FRAMES}")
    dg = bpy.context.evaluated_depsgraph_get()
    os.makedirs(CLOTH_DIR, exist_ok=True)
    for ob, path in pending:
        ev = ob.evaluated_get(dg)
        co = numpy.empty(len(ev.data.vertices) * 3)
        ev.data.vertices.foreach_get("co", co)
        numpy.save(path, co)
        ob.modifiers.remove(ob.modifiers["Cloth"])
        ob.data.vertices.foreach_set("co", co)
        ob.data.update()
    for m in others:
        m.show_viewport = True
    scene.frame_set(1)

def grid_mesh(name, nu, nv, at, mat):
    """Quad grid from a function at(i, j) -> (x, y, z), normals up."""
    verts = [at(i, j) for j in range(nv + 1) for i in range(nu + 1)]
    w = nu + 1
    faces = [(j * w + i, j * w + i + 1, (j + 1) * w + i + 1, (j + 1) * w + i)
             for j in range(nv) for i in range(nu)]
    ob = mesh_from(name, verts, faces, mat)
    me = ob.data
    if sum(p.normal.z for p in me.polygons) < 0:
        me.flip_normals()
    return ob

def finish(ob, thick, subd=1):
    if subd:
        sub = ob.modifiers.new("Sub", "SUBSURF")
        sub.levels = sub.render_levels = subd
    sol = ob.modifiers.new("Thick", "SOLIDIFY")
    sol.thickness = thick
    sol.offset = -1
    return ob

def gown(name, origin, heading_deg, L, hem_r, mat, seed=0.0):
    """A strapless satin gown, built the way it is sewn: one tube of cloth,
    fitted through the bodice and flaring into a full skirt. It starts on its
    side above the table and collapses under its own weight, so front and back
    land on each other and the spare hem folds the way real satin does."""
    D = Vector((math.cos(math.radians(heading_deg)), math.sin(math.radians(heading_deg)), 0))
    S = Vector((D.y, -D.x, 0))
    Z = Vector((0, 0, 1))
    O = Vector((origin[0], origin[1], 0.0))
    WAIST = 0.30
    AXIS_Z = hem_r + 0.015
    nr, nv = 72, 88                        # around, along; subdivided after

    def radius(u):
        if u < WAIST:                       # bust to waist
            return 0.128 + 0.008 * math.sin(min(1, u / 0.14) * math.pi) - 0.018 * smooth((u - 0.08) / (WAIST - 0.08))
        k = (u - WAIST) / (L - WAIST)
        return 0.11 + (hem_r - 0.11) * k ** 0.85

    verts, faces, ts = [], [], []
    for j in range(nv + 1):
        u = L * j / nv
        r = radius(u)
        t = max(0.0, (u - WAIST) / (L - WAIST))
        for i in range(nr):
            a = math.tau * i / nr
            # a touch of irregularity so it does not fold symmetrically
            rr = r * (1 + 0.04 * t * math.sin(a * 3 + seed + u * 6))
            p = O + D * u + S * (rr * math.cos(a)) + Z * (AXIS_Z + rr * math.sin(a))
            verts.append(p[:])
            ts.append(t)
    for j in range(nv):
        for i in range(nr):
            i2 = (i + 1) % nr
            faces.append((j * nr + i, j * nr + i2, (j + 1) * nr + i2, (j + 1) * nr + i))
    ob = mesh_from(name, verts, faces, mat)
    cloth(ob, mass=0.3, tension=40, bending=2.5, self_collide=True, damping=6.0)
    finish(ob, 0.0015, subd=2)
    return ob

def inside(pt, poly):
    x, y = pt
    c = False
    for i in range(len(poly)):
        x1, y1 = poly[i]
        x2, y2 = poly[i - 1]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            c = not c
    return c

def spread(name, x0, x1, yb, mat, keep_flat, overhang=0.32):
    """A length of linen off the bolt. Starts flat, sticking out past the front
    edge; the overhang falls and drapes. Under the papers it stays pinned flat
    (`keep_flat` are world polygons), everywhere else it rucks a little."""
    nu, nv = 110, 95
    y_end = FRONT - overhang
    def at(i, j):
        return (x0 + (x1 - x0) * i / nu, yb + (y_end - yb) * j / nv, 0.0015)
    ob = grid_mesh(name, nu, nv, at, mat)
    pins, grow = [], []
    for v in ob.data.vertices:
        x, y = v.co.x, v.co.y
        under = any(inside((x, y), p) for p in keep_flat)
        pins.append(1.0 if under else 0.0)
        back = max(0.0, 1 - (yb - y) / 0.10)                             # rucked where it left the bolt
        grow.append(0.0 if under else 0.35 + 0.65 * back)
    cloth(ob, mass=0.12, tension=25, bending=0.6, shrink=-0.06, shrink_w=grow, pin_w=pins)
    return finish(ob, 0.0012)

def scrap(name, centre, r, rot_deg, mat, seed, stiff=0.05):
    """An offcut dropped from a few centimetres, so it lands crumpled."""
    n = 36
    a0 = math.radians(rot_deg)
    edge = []
    for i in range(16):
        a = i / 16 * math.tau
        k = 1 + 0.35 * math.sin(a * 3 + seed) + 0.2 * math.sin(a * 5 + seed * 2)
        x, y = math.cos(a) * r * k, math.sin(a) * r * 0.6 * k
        edge.append((centre[0] + x * math.cos(a0) - y * math.sin(a0), centre[1] + x * math.sin(a0) + y * math.cos(a0)))
    R = r * 1.6
    def at(i, j):
        x = centre[0] - R + 2 * R * i / n
        y = centre[1] - R + 2 * R * j / n
        return (x, y, 0.03 + 0.012 * math.sin(x * 90 + seed) * math.sin(y * 70 - seed))
    ob = grid_mesh(name, n, n, at, mat)
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    gone = [f for f in bm.faces if not inside(tuple(f.calc_center_median())[:2], edge)]
    bmesh.ops.delete(bm, geom=gone, context="FACES")
    bm.to_mesh(ob.data)
    bm.free()
    cloth(ob, mass=0.05, tension=10, bending=stiff, shrink=-0.22, self_collide=True)
    return finish(ob, 0.001)

def pin(name, at, angle, lift):
    a = math.radians(angle)
    d = Vector((math.cos(a), math.sin(a), lift)).normalized()
    p0 = Vector(at)
    p1 = p0 + d * 0.032
    poly_curve(name, [p0[:], p1[:]], metal_m, 0.00035)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.0028, location=p1[:], segments=16, ring_count=8)
    hd = bpy.context.active_object
    hd.name = name + "_Head"
    bpy.ops.object.shade_smooth()
    hd.data.materials.append(chalk_m)

# ---------------------------------------------------------------- build
clean()
scene = bpy.context.scene
scene.render.fps = 30
with open(PIECES) as f:
    SHEETS = json.load(f)

wood_m = add_bump(mat_principled("Table", (0.006, 0.0068, 0.014, 1), 0.38, 0.0, 0.5),
                  scale=6.0, strength=0.08, wave=("X", 3.0, 18.0))
lacquer = wood_m.node_tree.nodes["Principled BSDF"]
lacquer.inputs["Coat Weight"].default_value = 1.0         # black lacquer, holds the light like the dropper shot
lacquer.inputs["Coat Roughness"].default_value = 0.04
wall_m = add_bump(mat_principled("Wall", INK, 0.95), scale=40.0, strength=0.2)
linen_m = mat_weave("Linen", NAVY)
wool_m = mat_weave("Wool", NAVY, 1300)
silk_m = mat_satin("Silk", PERI)
gown_m = mat_satin("Gown", NAVY)
velvet_m = mat_velvet("Velvet", NAVY)
metal_m = mat_principled("Steel", (0.62, 0.64, 0.7, 1), 0.25, 1.0)
black_m = mat_principled("Enamel", (0.01, 0.01, 0.012, 1), 0.18, 0.0, 0.6)
thread_ms = [add_bump(mat_principled(f"Thread{i}", c, 0.6), 800, 0.3, 0.0003, wave=("Z", 1200, 0))
             for i, c in enumerate((MIST, STEEL, CORNFLOWER))]
chalk_m = mat_principled("Chalk", CLOUD, 0.95)
cushion_m = mat_weave("Cushion", STEEL, 1400)
prints = {k: mat_print("Print_" + k, v["image"]) for k, v in SHEETS.items()}

# room
table = box("TableTop", (RIGHT - LEFT, BACK - FRONT, 0.045), (0, (BACK + FRONT) / 2, -0.0225), wood_m, bevel=0.004)
table.modifiers.new("Collision", "COLLISION")
table.collision.thickness_outer = 0.001
table.collision.cloth_friction = 25.0
box("Floor", (4.2, 3.2, 0.02), (-0.5, 0, -0.76), wall_m)    # inside the room only
box("BackWall", (5.0, 0.05, 4), (-0.08, 1.6, 1.2), wall_m)   # stops at the window wall
# left wall with a window: four slabs around the opening, then mullion and transom
WX = -2.58                                # far enough left to stay out of frame
WIN_Y, WIN_Z, WIN_W, WIN_H = 0.20, 0.85, 0.42, 0.62
y0, y1 = WIN_Y - WIN_W / 2, WIN_Y + WIN_W / 2
z0, z1 = WIN_Z - WIN_H / 2, WIN_Z + WIN_H / 2
box("WallA", (0.08, 4, z0 + 1.0), (WX, 0, (z0 - 1.0) / 2), wall_m)
box("WallB", (0.08, 4, 2.6 - z1), (WX, 0, (z1 + 2.6) / 2), wall_m)
box("WallC", (0.08, y0 + 2.0, z1 - z0), (WX, (y0 - 2.0) / 2, WIN_Z), wall_m)
box("WallD", (0.08, 2.0 - y1, z1 - z0), (WX, (y1 + 2.0) / 2, WIN_Z), wall_m)
box("Mullion", (0.05, 0.022, WIN_H), (WX, WIN_Y, WIN_Z), wall_m)
box("Transom", (0.05, WIN_W, 0.022), (WX, WIN_Y, WIN_Z + WIN_H * 0.12), wall_m)

# Layout, seen from above with the front edge at the bottom:
#   back row      machine, spools, folded stack, cushion, collar
#   left, front   linen spread off the bolt, front and back pinned on it, over the edge
#   right         the gown laid out on the diagonal, a wool front already cut
Z_SPREAD = 0.0015
Z_ON_SPREAD = Z_SPREAD + 0.0010

def paper(key, at, rot, z):
    sh = SHEETS[key]
    return flat("Paper_" + key, sh["outline"], at, rot, z, prints[key], 0.0004, sheet=sh)

FRONT_AT, FRONT_ROT = (-0.80, -0.38), 3
BACK_AT, BACK_ROT = (-0.44, -0.36), -4
PAPERS_ON_SPREAD = [
    ("front", FRONT_AT, FRONT_ROT), ("back", BACK_AT, BACK_ROT), ("cuff", (-0.905, 0.03), 90),
    ("size", (-0.70, 0.235), 2), ("note", (-0.10, -0.15), -6), ("allowance", (-0.38, -0.445), 0),
]
for k, (key, at, rot) in enumerate(PAPERS_ON_SPREAD):
    paper(key, at, rot, Z_ON_SPREAD + 0.0002 * k)             # later papers lie over earlier ones

for k, (xc, yc, ang) in enumerate(((4, 50, 40), (20, 30, 160), (6, 10, 75), (24, 8, 200))):
    pin(f"PinF{k}", local(FRONT_AT, FRONT_ROT, xc, yc, Z_ON_SPREAD + 0.0006), ang, 0.12)
for k, (xc, yc, ang) in enumerate(((5, 52, 20), (18, 32, 140), (8, 12, 300))):
    pin(f"PinB{k}", local(BACK_AT, BACK_ROT, xc, yc, Z_ON_SPREAD + 0.0006), ang, 0.12)

# the gown, and a front already cut from wool with its card on top
gown("Gown", (0.93, 0.37), 230, 0.90, 0.25, gown_m)
wool_at = (1.13, -0.43)
flat("WoolFront", SHEETS["front"]["fabric"], wool_at, 90, 0.0016, wool_m, 0.0015)
paper("quote", (0.83, -0.39), 7, 0.0028)

# offcuts on the bare table between the spread and the hem
scrap("Scrap0", (0.20, -0.36), 0.05, 20, silk_m, 0.4, stiff=0.03)
scrap("Scrap1", (0.11, -0.22), 0.035, -35, velvet_m, 2.1, stiff=0.3)
scrap("Scrap2", (0.33, -0.40), 0.03, 70, wool_m, 4.0, stiff=0.5)

# back row
paper("collar", (0.18, 0.40), -5, 0.0008)
FOLDS = [(linen_m, 0.30), (velvet_m, 0.29), (silk_m, 0.285), (wool_m, 0.28)]
for k, (m, w) in enumerate(FOLDS):
    box(f"Fold{k}", (w, 0.21, 0.022), (-0.20 + 0.006 * k, 0.53 - 0.004 * k, 0.011 + k * 0.0225), m,
        bevel=0.0095, segments=5, rot=(0, 0, math.radians(-3 + 2.5 * k)))

bpy.ops.mesh.primitive_uv_sphere_add(radius=0.045, location=(0.07, 0.56, 0.022), segments=48, ring_count=24)
cushion = bpy.context.active_object
cushion.name = "Cushion"
cushion.scale = (1, 1, 0.55)
bpy.ops.object.shade_smooth()
cushion.data.materials.append(cushion_m)
for k in range(7):
    a = k * 2.4
    base = Vector((0.07 + 0.026 * math.cos(a), 0.56 + 0.026 * math.sin(a), 0.036))
    pin(f"CPin{k}", base[:], math.degrees(a), 1.4)

for k, (x, y) in enumerate(((-0.50, 0.60), (-0.44, 0.53), (-0.55, 0.52))):
    cyl(f"Spool{k}", 0.016, 0.05, (x, y, 0.027), thread_ms[k], verts=48)
    for zz in (0.0015, 0.0525):
        cyl(f"Flange{k}_{zz}", 0.019, 0.003, (x, y, zz), wood_m, verts=48, bevel=0.0008)

box("Chalk", (0.045, 0.045, 0.006), (-0.06, 0.12, Z_ON_SPREAD + 0.003), chalk_m, bevel=0.0015,
    rot=(0, 0, math.radians(28)))

# tape measure loose along the back of the spread, then curling off it
sh_tape = SHEETS["tape"]
tape_pts = []
for i in range(260):
    t = i / 259
    x = -0.98 + 1.02 * t
    y = 0.285 + 0.025 * math.sin(t * 7.0) - 0.04 * smooth((t - 0.75) / 0.25)
    tape_pts.append((x, y, Z_ON_SPREAD + 0.0012 if x < 0.09 else 0.0008))
ribbon("Tape", tape_pts, 0.016, prints["tape"], sheet=sh_tape)
cyl("TapeCase", 0.03, 0.016, (0.08, 0.20, 0.008), mat_principled("TapeCase", INK, 0.35), verts=64, bevel=0.003)

# shears, blockout: two blades and two rings, lying open on the spread
shears = link(bpy.data.objects.new("Shears", None))
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
shears.location = (-0.02, -0.33, Z_ON_SPREAD)
shears.rotation_euler = (0, 0, math.radians(118))

# sewing machine: imported model if found, otherwise a blockout of a vintage cast iron machine
MACHINE_AT = (-0.80, 0.46, 0.0)
MACHINE_ROT = 12
def machine_blockout():
    root = link(bpy.data.objects.new("Machine", None))
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
    root = link(bpy.data.objects.new("Machine", None))
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
    holder = link(bpy.data.objects.new("MachineHolder", None))
    root.parent = holder
    return holder

machine = machine_import(MACHINE) if MACHINE and os.path.exists(MACHINE) else machine_blockout()
machine.location = MACHINE_AT
machine.rotation_euler = (0, 0, math.radians(MACHINE_ROT))

# the linen goes last: it stays pinned flat wherever a paper lies on it
def footprint(key, at, rot, grow=1.06):
    pts = [local(at, rot, x, y)[:2] for x, y in SHEETS[key]["outline"]]
    cx = sum(p[0] for p in pts) / len(pts)
    cy = sum(p[1] for p in pts) / len(pts)
    return [(cx + (x - cx) * grow, cy + (y - cy) * grow) for x, y in pts]
tape_band = [(x, y + 0.02) for x, y, _ in tape_pts] + [(x, y - 0.02) for x, y, _ in reversed(tape_pts)]
spread("Spread", -1.02, 0.06, 0.32, linen_m, [footprint(*p) for p in PAPERS_ON_SPREAD] + [tape_band])
simulate()

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
area("Rim", (-0.45, 1.20, 0.60), (MACHINE_AT[0], MACHINE_AT[1], 0.15), 6.0, PERI, 0.6)
# breath of fill from the camera side so the shadows are not dead black
area("Fill", (0.4, -2.2, 0.9), (0, 0, 0), 0.25, STEEL, 2.0)
# a thin strip softbox high behind the table: long glossy streaks on lacquer, satin and enamel
strip = area("Strip", (0.0, 1.25, 1.35), (0.0, 0.05, 0.0), 5.0, MIST, 2.6)
strip.data.shape = "RECTANGLE"
strip.data.size_y = 0.07

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
hvol.inputs["Density"].default_value = 0.02
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

# Orbit from straight overhead down to a low, close front view. The overhead
# view turns as it starts to drop, then the camera swings round and pushes in
# toward the patterns. Near linear, so every bit of scroll moves the camera.
TGT_A, TGT_B = Vector((0.0, 0.10, 0.0)), Vector((-0.28, -0.10, 0.01))
EL_A, EL_B = 88.0, 12.0
AZ_A, AZ_B = -115.0, -45.0
D_A, D_B = 2.55, 1.25
focus = link(bpy.data.objects.new("Focus", None))
cam_data.dof.focus_object = focus

# ---------------------------------------------------------------- animation
DESCENT_CAM, DESCENT_AIM = 0.36, 0.24   # metres the camera and its aim sink after the orbit

def apply_frame(scn):
    f = scn.frame_current
    t = (f - 1) / (MOVE_END - 1)                          # past 1 during the descent; light keeps drifting
    tm = min(1.0, t)
    e = tm * 0.85 + smooth(tm) * 0.15                    # near linear, soft only at the ends
    el = math.radians(EL_A + (EL_B - EL_A) * e)
    az = math.radians(AZ_A + (AZ_B - AZ_A) * e)
    d = D_A + (D_B - D_A) * e
    aim = TGT_A.lerp(TGT_B, e)
    c = aim + d * Vector((math.cos(el) * math.cos(az), math.cos(el) * math.sin(az), math.sin(el)))
    # Descent: like a crane being lowered past the table edge. The aim sinks
    # less than the camera, so it tilts up a touch as the edge rises out of frame.
    k = max(0.0, (f - MOVE_END) / (N_FRAMES - MOVE_END))
    if k > 0:
        k = k * k * (3 - 2 * k) * 0.7 + k * 0.3
        c = c - Vector((0, 0, DESCENT_CAM * k))
        aim = aim - Vector((0, 0, DESCENT_AIM * k))
    cam.location = c
    cam.rotation_euler = (aim - c).to_track_quat("-Z", "Y").to_euler()
    focus.location = aim.lerp(Vector((-0.40, -0.12, 0.0)), 0.5 * e)
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
scene.view_settings.exposure = -0.35
scene.cycles.volume_step_rate = 4.0
scene.cycles.max_bounces = 6
scene.cycles.transparent_max_bounces = 8
if MODE == "web":                                       # the frames the page plays
    scene.render.resolution_x, scene.render.resolution_y = (720, 1280) if ORIENT == "portrait" else (1280, 720)
    scene.render.resolution_percentage = 100
    scene.cycles.samples = 16
    scene.render.image_settings.quality = 88
elif MODE == "draft":                                   # quick motion check, all frames
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
