"""
Venty zipper loader. Builds and renders a zipper opening over a dark void with
a transparent background, so the page can show through the gap.

Run headless:
  blender -b -P tools/zipper/zipper.py -- --orient portrait --mode preview --frames 1,35,70,100
  blender -b -P tools/zipper/zipper.py -- --orient landscape --mode final

Axes: zipper runs along +Z (up). Fabric lies in the XZ plane at y=0. The
camera sits at -Y looking toward +Y. The slider starts at the top (closed)
and travels down; fabric and teeth above it open outward.
"""
import bpy, bmesh, math, sys, os
from mathutils import Vector

# ---------------------------------------------------------------- args
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
def arg(name, default):
    if name in argv:
        return argv[argv.index(name) + 1]
    return default
ORIENT = arg("--orient", "portrait")
MODE = arg("--mode", "preview")
FRAMES = [int(f) for f in arg("--frames", "").split(",") if f] or None
NO_FABRIC = "--no-fabric" in argv   # hardware only: tape, teeth, slider. The page supplies the textile.
FADE = float(arg("--fade", "0"))     # >0: the fabric fades to transparent this many units out from the tape
OUT = arg("--out", os.path.join(os.path.dirname(os.path.abspath(__file__)), "render", ORIENT, MODE))
os.makedirs(OUT, exist_ok=True)

N_FRAMES = 100
Z_TOP, Z_BOT = 95.0, -95.0            # long zipper, runs past the frame top and bottom on every camera
Z_START, Z_END = 70.0, -74.0          # slider travel
PITCH = 1.25                          # tooth spacing per side
TOOTH_W, TOOTH_H, TOOTH_D = 1.35, 1.0, 0.7
TAPE_W = 2.3
MAX_OPEN = 34.0                       # per-side separation at the top when fully open
PANEL_W = 160.0

# palette
NIGHT = (0.0027, 0.0030, 0.0070, 1)
INK = (0.0046, 0.0056, 0.0176, 1)
MIST = (0.531, 0.584, 0.701, 1)       # #C0C8DB linear
CLOUD = (0.863, 0.913, 1.0, 1)
CORNFLOWER = (0.138, 0.212, 0.913, 1) # #687EF5 linear
STEEL = (0.064, 0.112, 0.246, 1)
GUNMETAL = (0.05, 0.055, 0.075, 1)    # black chrome

# ---------------------------------------------------------------- helpers
def clean():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def smooth(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)

def slider_z(t):
    return Z_START + (Z_END - Z_START) * smooth(t)

def open_amount(z, t):
    """Per-side X separation of the fabric edge at height z for progress t."""
    zs = slider_z(t)
    if z <= zs:
        return 0.0
    s = (z - zs) / max(0.001, (Z_TOP - zs))
    base = MAX_OPEN * (s ** 1.55)
    # final sweep: once nearly open, the panels slide fully away
    sweep = smooth((t - 0.86) / 0.14) * 120.0
    return base + sweep * (0.35 + 0.65 * s)

def depth_amount(z, t):
    """Fabric curls toward the camera (-Y) as it opens."""
    return -0.22 * open_amount(z, t)

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

def mat_fabric():
    """Mist canvas: two crossed wave textures make a regular weave, a light
    noise breaks the regularity, both feed a bump. No large-scale noise, so
    nothing swims between frames."""
    m = mat_principled("Fabric", (0.0032, 0.0038, 0.0095, 1), 0.55, 0.0, 0.4)  # night-dark cloth, texture as shadow not light
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    if "Sheen Weight" in bsdf.inputs:
        bsdf.inputs["Sheen Weight"].default_value = 0.12
    coord = nt.nodes.new("ShaderNodeTexCoord")
    mapping = nt.nodes.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (1.0, 1.0, 1.0)
    mapping.inputs["Rotation"].default_value = (0.0, math.radians(45.0), 0.0)  # twill runs diagonally
    warp = nt.nodes.new("ShaderNodeTexWave")
    warp.wave_type = "BANDS"
    warp.bands_direction = "X"
    warp.wave_profile = "SIN"
    warp.inputs["Scale"].default_value = 11.0
    weft = nt.nodes.new("ShaderNodeTexWave")
    weft.wave_type = "BANDS"
    weft.bands_direction = "Z"
    weft.wave_profile = "SIN"
    weft.inputs["Scale"].default_value = 11.0
    weave = nt.nodes.new("ShaderNodeMath")
    weave.operation = "MULTIPLY_ADD"   # warp dominant, weft adds: reads as twill ribs
    weave.inputs[2].default_value = 0.0
    grain = nt.nodes.new("ShaderNodeTexNoise")
    grain.inputs["Scale"].default_value = 90.0
    grain.inputs["Detail"].default_value = 2.0
    grain.inputs["Roughness"].default_value = 0.4
    mix = nt.nodes.new("ShaderNodeMath")
    mix.operation = "ADD"
    scale = nt.nodes.new("ShaderNodeMath")
    scale.operation = "MULTIPLY"
    scale.inputs[1].default_value = 0.35
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 1.0
    bump.inputs["Distance"].default_value = 0.09
    tone = nt.nodes.new("ShaderNodeMixRGB")
    tone.blend_type = "MULTIPLY"
    tone.inputs["Fac"].default_value = 0.55
    tone.inputs["Color1"].default_value = (0.0032, 0.0038, 0.0095, 1)
    l = nt.links
    l.new(coord.outputs["Object"], mapping.inputs["Vector"])
    l.new(mapping.outputs["Vector"], warp.inputs["Vector"])
    l.new(mapping.outputs["Vector"], weft.inputs["Vector"])
    l.new(mapping.outputs["Vector"], grain.inputs["Vector"])
    l.new(warp.outputs["Fac"], weave.inputs[0])
    l.new(weft.outputs["Fac"], weave.inputs[1])
    weave.inputs[1].default_value = 0.6
    l.new(grain.outputs["Fac"], scale.inputs[0])
    l.new(weave.outputs["Value"], mix.inputs[0])
    l.new(scale.outputs["Value"], mix.inputs[1])
    l.new(mix.outputs["Value"], bump.inputs["Height"])
    l.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    l.new(weave.outputs["Value"], tone.inputs["Color2"])
    l.new(tone.outputs["Color"], bsdf.inputs["Base Color"])
    if FADE > 0:
        # alpha = 1 at the tape edge, easing to 0 at FADE units out, so the
        # rendered cloth dissolves into the page background
        sep = nt.nodes.new("ShaderNodeSeparateXYZ")
        ab = nt.nodes.new("ShaderNodeMath"); ab.operation = "ABSOLUTE"
        sub = nt.nodes.new("ShaderNodeMath"); sub.operation = "SUBTRACT"; sub.inputs[1].default_value = TAPE_W
        div = nt.nodes.new("ShaderNodeMath"); div.operation = "DIVIDE"; div.inputs[1].default_value = FADE
        clamp = nt.nodes.new("ShaderNodeClamp")
        inv = nt.nodes.new("ShaderNodeMath"); inv.operation = "SUBTRACT"; inv.inputs[0].default_value = 1.0
        ease = nt.nodes.new("ShaderNodeMath"); ease.operation = "POWER"; ease.inputs[1].default_value = 1.8
        l.new(coord.outputs["Object"], sep.inputs["Vector"])
        l.new(sep.outputs["X"], ab.inputs[0])
        l.new(ab.outputs["Value"], sub.inputs[0])
        l.new(sub.outputs["Value"], div.inputs[0])
        l.new(div.outputs["Value"], clamp.inputs["Value"])
        l.new(clamp.outputs["Result"], inv.inputs[1])
        l.new(inv.outputs["Value"], ease.inputs[0])
        l.new(ease.outputs["Value"], bsdf.inputs["Alpha"])
        m.blend_method = "BLEND"
        if hasattr(m, "surface_render_method"):
            m.surface_render_method = "BLENDED"
    return m

def grid(name, x0, x1, z0, z1, nx, nz, mat):
    bm = bmesh.new()
    verts = {}
    for i in range(nx + 1):
        for j in range(nz + 1):
            x = x0 + (x1 - x0) * i / nx
            z = z0 + (z1 - z0) * j / nz
            verts[(i, j)] = bm.verts.new((x, 0.0, z))
    for i in range(nx):
        for j in range(nz):
            bm.faces.new((verts[(i, j)], verts[(i + 1, j)], verts[(i + 1, j + 1)], verts[(i, j + 1)]))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(mat)
    ob["base"] = [v.co[:] for v in me.vertices]
    return ob

def box(name, sx, sy, sz, bevel, mat, segments=5):
    bpy.ops.mesh.primitive_cube_add(size=1)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = (sx, sy, sz)
    bpy.ops.object.transform_apply(scale=True)
    mod = ob.modifiers.new("Bevel", "BEVEL")
    mod.width = bevel
    mod.segments = segments
    mod.limit_method = "NONE"
    bpy.ops.object.shade_smooth()
    ob.data.materials.append(mat)
    return ob

# ---------------------------------------------------------------- build
clean()
scene = bpy.context.scene

fabric_m = mat_fabric()
tape_m = mat_principled("Tape", (0.004, 0.0045, 0.012, 1), 0.55, 0.0, 0.45)
_tn = tape_m.node_tree
_tc = _tn.nodes.new("ShaderNodeTexCoord"); _tw = _tn.nodes.new("ShaderNodeTexWave")
_tw.wave_type = "BANDS"; _tw.bands_direction = "Z"; _tw.inputs["Scale"].default_value = 18.0
_tb = _tn.nodes.new("ShaderNodeBump"); _tb.inputs["Strength"].default_value = 0.6; _tb.inputs["Distance"].default_value = 0.06
_tn.links.new(_tc.outputs["Object"], _tw.inputs["Vector"]); _tn.links.new(_tw.outputs["Fac"], _tb.inputs["Height"])
_tn.links.new(_tb.outputs["Normal"], _tn.nodes["Principled BSDF"].inputs["Normal"])
thread_m = mat_principled("Thread", (0.014, 0.017, 0.035, 1), 0.65, 0.0, 0.3)   # dark cotton topstitch, a shade lighter than the cloth
metal_m = mat_principled("Metal", GUNMETAL, 0.14, 1.0, 0.5)
slider_m = mat_principled("Slider", (0.06, 0.065, 0.085, 1), 0.12, 1.0, 0.5)

# fabric panels and tapes (edge strips), finely subdivided near the zipper
panels = []
for side in (1, -1):
    tape = grid(f"Tape_{'R' if side > 0 else 'L'}", 0.0, TAPE_W * side, Z_BOT, Z_TOP, 4, 400, tape_m)
    panel = grid(f"Fabric_{'R' if side > 0 else 'L'}", TAPE_W * side, PANEL_W * side, Z_BOT, Z_TOP, 48, 400, fabric_m)
    if NO_FABRIC:
        panel.hide_render = True
        panel.hide_viewport = True
    for ob in (tape, panel):
        ob["side"] = side
        sub = ob.modifiers.new("Subd", "SUBSURF")
        sub.levels = 1
        sub.render_levels = 1
        panels.append(ob)

# teeth, interlocking: right at z_i, left offset half a pitch
teeth = []
n_teeth = int((Z_TOP - Z_BOT) / PITCH) + 2
for side in (1, -1):
    for i in range(n_teeth):
        z = Z_BOT + i * PITCH + (PITCH / 2 if side < 0 else 0.0)
        if z > Z_TOP:
            continue
        t = box(f"Tooth_{'R' if side > 0 else 'L'}_{i}", TOOTH_W, TOOTH_D, TOOTH_H * 0.92, 0.18, metal_m, 3)
        t["side"] = side
        t["z0"] = z
        teeth.append(t)

# topstitching: two rows of short thread segments along each tape edge
stitches = []
STITCH_ROWS = (TAPE_W + 0.45, TAPE_W + 1.6)
STITCH_PITCH = 1.3
if not NO_FABRIC:
    for side in (1, -1):
        for row_x in STITCH_ROWS:
            n = int((Z_TOP - Z_BOT) / STITCH_PITCH)
            for i in range(n):
                z = Z_BOT + 0.6 + i * STITCH_PITCH
                st = box(f"Stitch_{side}_{row_x:.1f}_{i}", 0.2, 0.18, 0.7, 0.08, thread_m, 2)
                st["side"] = side
                st["z0"] = z
                st["x0"] = row_x
                stitches.append(st)

# slider: body, cap, pull tab with a hole
slider = bpy.data.objects.new("Slider", None)
bpy.context.collection.objects.link(slider)
body = box("SliderBody", 4.6, 2.4, 5.2, 0.7, slider_m, 8)
body.location = (0, -0.7, 0)
cap = box("SliderCap", 5.2, 2.9, 1.6, 0.55, slider_m, 8)
cap.location = (0, -0.95, 3.0)
hinge = box("SliderHinge", 1.6, 1.2, 1.5, 0.4, slider_m, 5)
hinge.location = (0, -2.5, 2.7)
tab = box("SliderTab", 3.6, 0.55, 9.0, 0.7, slider_m, 8)
tab.location = (0, -2.9, -2.4)
hole = box("SliderHole", 1.7, 1.6, 2.3, 0.6, slider_m, 8)
hole.location = (0, -2.9, -4.6)
bool_mod = tab.modifiers.new("Hole", "BOOLEAN")
bool_mod.operation = "DIFFERENCE"
bool_mod.object = hole
hole.hide_render = True
hole.hide_viewport = True
for part in (body, cap, hinge, tab, hole):
    part.parent = slider

# lights, Maniki recipe: soft white key, cornflower rim, faint fill
def area(name, loc, target, power, color, size):
    light = bpy.data.lights.new(name, "AREA")
    light.energy = power
    light.color = color[:3]
    light.size = size
    ob = bpy.data.objects.new(name, light)
    bpy.context.collection.objects.link(ob)
    ob.location = loc
    d = Vector(target) - Vector(loc)
    ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    return ob

area("Key", (-18, -70, 45), (0, 0, 0), 4500, (0.6, 0.66, 0.8, 1), 45)      # dim cool key
area("Top", (0, -25, 80), (0, 0, 0), 3500, CLOUD, 70)                       # faint overhead, just enough for weave relief
area("Rim", (14, 40, 40), (0, 0, 5), 22000, CORNFLOWER, 30)                 # cornflower edge light from behind
area("Blue", (55, -45, -15), (0, 0, 0), 9000, CORNFLOWER, 35)              # cornflower from front right, tints the highlights
area("Spec", (0, -30, 60), (0, 0, 0), 8000, CLOUD, 6)                       # small hard light, thin highlights

world = bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0, 0, 0, 1)
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.35, 0.42, 0.6, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.1

# camera
cam_data = bpy.data.cameras.new("Camera")
cam = bpy.data.objects.new("Camera", cam_data)
bpy.context.collection.objects.link(cam)
scene.camera = cam
cam_data.lens = 50
cam_data.sensor_fit = "VERTICAL"
cam_data.sensor_height = 24
if ORIENT == "portrait":
    # tall phone frame; the whole 150-unit zipper fits the height
    scene.render.resolution_x, scene.render.resolution_y = 1080, 2340
    cam.location = (0, -318, -2)
else:
    # desktop: the zipper runs past the top and bottom of the frame
    scene.render.resolution_x, scene.render.resolution_y = 1920, 1080
    cam.location = (0, -150, -2)
cam.rotation_euler = (math.radians(90), 0, 0)
cam_data.dof.use_dof = True
cam_data.dof.focus_distance = abs(cam.location.y)
cam_data.dof.aperture_fstop = 5.6

# ---------------------------------------------------------------- animation
def apply_frame(scn):
    t = (scn.frame_current - 1) / (N_FRAMES - 1)
    zs = slider_z(t)
    for ob in panels:
        side = ob["side"]
        base = ob["base"]
        me = ob.data
        for v, b in zip(me.vertices, base):
            x, _, z = b
            o = open_amount(z, t)
            # fabric further from the edge opens a little less, so it folds back
            falloff = 1.0 - min(1.0, (abs(x) - TAPE_W) / 50.0) * 0.35 if abs(x) > TAPE_W else 1.0
            ox = o * falloff * side
            y = depth_amount(z, t) * falloff + 0.35 * math.sin(z * 0.28 + x * 0.17)
            v.co = (x + ox, y, z)
        me.update()
    for tooth in teeth:
        side = tooth["side"]
        z = tooth["z0"]
        o = open_amount(z, t)
        y = depth_amount(z, t) + 0.35 * math.sin(z * 0.28)
        tooth.location = (side * (TOOTH_W / 2 + 0.05 + o), y - 0.1, z)
        # tilt outward with the local slope of the opening
        dz = 0.5
        slope = (open_amount(z + dz, t) - open_amount(z - dz, t)) / (2 * dz)
        tooth.rotation_euler = (0, 0, -side * math.atan(slope) * 0.6)
    for st in stitches:
        side = st["side"]
        z = st["z0"]
        o = open_amount(z, t)
        falloff = 1.0 - min(1.0, (st["x0"] - TAPE_W) / 50.0) * 0.35
        y = depth_amount(z, t) * falloff + 0.35 * math.sin(z * 0.28 + st["x0"] * side * 0.17)
        st.location = (side * (st["x0"] + o * falloff), y - 0.12, z)
    slider.location = (0, 0.35 * math.sin(zs * 0.28), zs)

bpy.app.handlers.frame_change_pre.clear()
bpy.app.handlers.frame_change_pre.append(apply_frame)
scene.frame_start, scene.frame_end = 1, N_FRAMES

# ---------------------------------------------------------------- render
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.render.film_transparent = True
scene.render.image_settings.file_format = "WEBP"
scene.render.image_settings.color_mode = "RGBA"
scene.render.image_settings.quality = 90
scene.view_settings.view_transform = "AgX"
scene.view_settings.exposure = 0.35
if MODE == "preview":
    scene.render.resolution_percentage = 45
    scene.cycles.samples = 24
else:
    scene.render.resolution_percentage = 100
    scene.cycles.samples = 96
scene.cycles.use_denoising = True
scene.cycles.use_adaptive_sampling = True

frames = FRAMES or list(range(1, N_FRAMES + 1))
for f in frames:
    scene.frame_set(f)
    apply_frame(scene)
    scene.render.filepath = os.path.join(OUT, f"zip_{f:03d}.webp")
    bpy.ops.render.render(write_still=True)
    print(f"RENDERED {scene.render.filepath}")

# keep a .blend for manual tweaking
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "..", f"zipper_{ORIENT}.blend"))
print("DONE")
