# look.py -- the look of the arrays-as-cubes stills, read by the scripts
# stills.xtl writes (after Bpy.xtl's head, inside Blender, so bpy, math,
# scene, link and material are already there). Nothing here places a
# cube or a number: the places come from X_eTaL. This file says how
# things look: the navy background of the slides (remotion/src/theme.ts),
# the light, the fonts, the camera.

import os

# the slides' background, #0d1117, linear
NAVY = (0.0040, 0.0056, 0.0080)
# the numbers on the cubes: dark navy, flat (they ignore the light)
INK = (0.004, 0.006, 0.012)


def font(names):
    """The first font found among names (TrueType), else Blender's own."""
    dirs = [os.path.expanduser("~/Library/Fonts"), "/Library/Fonts",
            "/System/Library/Fonts/Supplemental", "/System/Library/Fonts",
            "/usr/share/fonts/truetype", os.path.expanduser("~/.local/share/fonts")]
    for n in names:
        for d in dirs:
            p = os.path.join(d, n)
            if os.path.exists(p):
                return bpy.data.fonts.load(p)
    return None


NUMBER_FONT = font(["Arial Bold.ttf", "DejaVuSans-Bold.ttf"])
LABEL_FONT = font(["JuliaMono-Regular.ttf", "DejaVuSansMono.ttf"])


def flat(name, rgb):
    """A material that shows its color as it is, whatever the light."""
    m = material(name, rgb, 1.0)
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = (0.0, 0.0, 0.0, 1.0)
    p.inputs["Specular IOR Level"].default_value = 0.0
    p.inputs["Roughness"].default_value = 1.0
    return m


def numbers(places, values, face, size):
    """Each value as text centered at its place: on a front face (facing
    -y) or a top face (facing up, reading from the front)."""
    ink = flat("number ink", INK)
    for at, (v,) in zip(places, values):
        body = str(int(v)) if v == int(v) else str(v)
        c = bpy.data.curves.new("number " + face + " " + body, type="FONT")
        c.body = body
        c.size = size
        c.align_x = "CENTER"
        c.align_y = "CENTER"
        if NUMBER_FONT:
            c.font = NUMBER_FONT
        o = link(bpy.data.objects.new("number " + face + " " + body, c), ink)
        o.location = at
        o.visible_shadow = False
        o.rotation_euler = (math.pi / 2, 0.0, 0.0) if face == "front" else (0.0, 0.0, 0.0)


# how far each array of the ladder is turned about its middle (degrees,
# clockwise seen from above), so its right side shows: the row of arrays
# stays level, as a turned camera would not keep it
TURN = -28.0
turned = set()


def turn(pivots, angle=TURN):
    """Turn the cubes and numbers made since the last turn (not the
    labels) about vertical axes at y 0: each piece about the nearest of
    the pivots (x, as text), so each pile of a rank 4 array turns about
    its own middle and the piles stay side by side."""
    xs = [float(t) for t in pivots.split()]
    a = math.radians(angle)
    c, s = math.cos(a), math.sin(a)

    def about(x, y):
        p = min(xs, key=lambda q: abs(q - x))
        return p + c * (x - p) - s * y, s * (x - p) + c * y

    for o in list(scene.objects):
        if o.name in turned or o.name.startswith("label ") or o.type not in ("MESH", "FONT"):
            continue
        turned.add(o.name)
        if o.type == "MESH":
            for v in o.data.vertices:
                v.co.x, v.co.y = about(v.co.x, v.co.y)
        else:
            o.location.x, o.location.y = about(o.location.x, o.location.y)
            o.rotation_euler.z += a


def world():
    w = bpy.data.worlds.new("navy")
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs["Color"].default_value = NAVY + (1.0,)
    w.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0
    scene.world = w


def light(name, energy, rot, angle=0.3):
    s = bpy.data.objects.new(name, bpy.data.lights.new(name, type="SUN"))
    s.data.energy = energy
    s.data.angle = angle
    s.rotation_euler = tuple(math.radians(a) for a in rot)
    scene.collection.objects.link(s)


def camera(target, elevation, yaw, width):
    """An orthographic camera looking at target from the front (-y),
    raised by elevation degrees and turned by yaw, width units across."""
    e, y = math.radians(elevation), math.radians(yaw)
    d = 60.0
    cam = bpy.data.objects.new("camera", bpy.data.cameras.new("camera"))
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = width
    cam.data.clip_end = 500.0
    cam.location = (target[0] + d * math.cos(e) * math.sin(y),
                    target[1] - d * math.cos(e) * math.cos(y),
                    target[2] + d * math.sin(e))
    cam.rotation_euler = (math.pi / 2 - e, 0.0, y)
    # a number lying on a top face is seen foreshortened: stretched back
    # by as much, it reads as tall as one on a front face
    for o in scene.objects:
        if o.name.startswith("number top ") and e > 0.1:
            o.scale = (1.0, 1.0 / math.sin(e), 1.0)
        # a label stands tilted back to face the camera square on
        if o.name.startswith("label "):
            o.rotation_euler = (math.pi / 2 - e, 0.0, 0.0)
    scene.collection.objects.link(cam)
    scene.camera = cam


def look_ladder(width):
    """The rank ladder: seen from the front and a little above, each array
    turned (turn), so a block shows its top, its side and so its depth."""
    world()
    light("key", 3.6, (62, 0, -25))
    light("top", 2.2, (12, 0, 20))
    camera((0.35, 0.5, 1.1), 28.0, 0.0, width)


def look_broadcast(width):
    """Broadcasting: straight from the front, every array on one plane."""
    world()
    light("key", 2.8, (72, 0, -15))
    light("top", 1.5, (12, 0, 20))
    camera((0.0, 0.0, 1.2), 0.0, 0.0, width)


def finish():
    """The labels (bp:l_abel) flat in their color and in JuliaMono; the
    outlines a little heavier at full HD."""
    for o in scene.objects:
        if o.type == "FONT" and o.name.startswith("label "):
            o.data.extrude = 0.0
            if LABEL_FONT and len(o.data.body) > 2:
                o.data.font = LABEL_FONT
            elif NUMBER_FONT:
                o.data.font = NUMBER_FONT
            m = o.data.materials[0] if o.data.materials else None
            if m:
                p = m.node_tree.nodes["Principled BSDF"]
                rgb = tuple(p.inputs["Base Color"].default_value)[:3]
                p.inputs["Emission Color"].default_value = rgb + (1.0,)
                p.inputs["Emission Strength"].default_value = 1.0
                p.inputs["Base Color"].default_value = (0.0, 0.0, 0.0, 1.0)
    scene.render.line_thickness = 1.4
    scene.eevee.taa_render_samples = 64
