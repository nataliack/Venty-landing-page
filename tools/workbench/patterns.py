"""
Venty workbench, printed paper. Builds every printed surface on the table as
SVG (pattern pieces, cards, the tape measure), rasterises each one with
headless Chrome so dashes, arrows and type are crisp, and writes
build/pieces.json with the outlines Blender needs for the paper and fabric.

Run with system Python (needs shapely):
  python tools/workbench/patterns.py

Units are centimetres, y up. The SVG flips y.
"""
import json, math, os, subprocess
from shapely.geometry import Polygon, Point

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, "build")
FONTS = os.path.abspath(os.path.join(HERE, "..", "..", "public", "fonts")).replace("\\", "/")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
os.makedirs(BUILD, exist_ok=True)

PX = 48                       # pixels per centimetre
MARGIN = 0.6                  # cm of paper beyond the outline in the image

# Venty palette, sRGB
INK = "#121524"
NAVY = "#384c65"
STEEL = "#485f88"
MIST = "#c0c8db"
CLOUD = "#eff4ff"
CORNFLOWER = "#687ef5"

# ---------------------------------------------------------------- geometry
class Path2D:
    """Straight lines and quadratic curves, sampled to points."""
    def __init__(self, x, y):
        self.pts = [(x, y)]
    def line(self, x, y):
        self.pts.append((x, y))
        return self
    def quad(self, cx, cy, x, y, steps=24):
        x0, y0 = self.pts[-1]
        for i in range(1, steps + 1):
            t = i / steps
            a, b, c = (1 - t) ** 2, 2 * (1 - t) * t, t * t
            self.pts.append((a * x0 + b * cx + c * x, a * y0 + b * cy + c * y))
        return self
    def done(self):
        return self.pts[:-1] if self.pts[0] == self.pts[-1] else self.pts

def rect(w, h):
    return [(0, 0), (w, 0), (w, h), (0, h)]

# ---------------------------------------------------------------- pieces
# Each piece: outline, then printed marks. Dimensions are measured from the
# geometry, so every label is true to the drawing.
def front():
    p = (Path2D(0, 0).quad(15, -1.2, 30, 1.6).line(22, 24).line(23.5, 44)
         .quad(18, 45, 17.6, 50).quad(17.2, 55.5, 18.2, 58.5).line(8, 61)
         .quad(7.4, 53.2, 0, 53).line(0, 0)).done()
    return dict(
        name="FRONT", sub="cut 1 on fold", outline=p, fold="left",
        label_at=(9.5, 38), grain=((6, 6), (6, 34)),
        lines=[[(0, 24), (22, 24)], [(9, 24), (11.5, 3)], [(14, 24), (11.5, 3)]],
        dims=[((3.5, 26.4), (21.4, 26.4), None), ((20.2, 27), (20.2, 43), None, -1), ((3.5, 4.2), (26.6, 5.2), None)],
        notches=[(22.8, 34), (17.6, 50), (0, 24)],
    )

def back():
    p = (Path2D(0, 0).quad(14, -1.2, 28, 1.6).line(22, 24).line(23.5, 44)
         .quad(19, 45.5, 18.8, 50).quad(18.6, 55.5, 19.5, 58.8).line(7.5, 62)
         .quad(6.5, 60.6, 0, 60.4).line(0, 0)).done()
    return dict(
        name="BACK", sub="cut 2", outline=p, fold=None,
        label_at=(10, 38), grain=((6, 6), (6, 34)),
        lines=[[(0, 24), (22, 24)], [(10, 24), (12, 3)], [(15, 24), (12, 3)]],
        dims=[((3.5, 26.4), (21.4, 26.4), None), ((20.2, 27), (20.2, 43), None, -1), ((3.5, 4.2), (24.8, 5.0), None)],
        notches=[(22.8, 34), (18.8, 50), (0, 24), (0, 40)],
    )

def sleeve():
    p = (Path2D(3.5, 0).line(21.5, 0).line(22, 6).quad(26, 14, 26, 30).line(25, 52)
         .quad(22, 66.5, 12.5, 68).quad(3, 66.5, 0, 52).line(-1, 30)
         .quad(-1, 14, 3, 6).line(3.5, 0)).done()
    return dict(
        name="SLEEVE", sub="cut 2", outline=p, fold=None,
        label_at=(12.5, 40), grain=((8.5, 12), (8.5, 56)), sheet=True,
        lines=[[(3, 6), (22, 6)]],
        dims=[((0, 70.2), (25, 70.2), None), ((29, 0), (29, 68), "68 cm"), ((3.5, -2.4), (21.5, -2.4), None)],
        notches=[(25.6, 40), (2.6, 58), (22.4, 58)],
    )

def collar():
    p = Path2D(0, 0).line(45, 0).line(44.4, 7.4).quad(22.5, 12.2, 0.6, 7.4).line(0, 0).done()
    return dict(
        name="COLLAR", sub="cut 2", outline=p, fold=None,
        label_at=(22.5, 4.6), grain=None, lines=[],
        dims=[((0, -2.4), (45, -2.4), None)],
        notches=[(22.5, 0)],
    )

def cuff():
    return dict(
        name="CUFF", sub="cut 2", outline=rect(20, 6.5), fold=None,
        label_at=(10, 3.4), grain=None, lines=[[(10, 0.6), (10, 5.9)]],
        dims=[((0, -2.4), (20, -2.4), None)], notches=[(10, 6.5)],
    )

def size_label():
    return dict(name="SIZE: YOURS", sub=None, outline=rect(19, 5.2), card="label")

def quote_card():
    return dict(name="One pattern\nfor one body.", sub="VENTY", outline=rect(14.8, 10.5), card="quote")

def note_card():
    return dict(name="The body is never\nthe problem.\nThe pattern is.", sub="WHY VENTY",
                outline=rect(12, 16), card="note")

def allowance_strip():
    return dict(name="1 cm seam allowance", sub=None, outline=rect(32, 3.2), card="strip")

PIECES = {
    "front": front, "back": back, "sleeve": sleeve, "collar": collar, "cuff": cuff,
    "size": size_label, "quote": quote_card, "note": note_card, "allowance": allowance_strip,
}

# ---------------------------------------------------------------- svg
FONT_CSS = f"""
@font-face {{ font-family: Familjen; src: url('file:///{FONTS}/FamiljenGrotesk-Variable.ttf'); font-weight: 300 700; }}
@font-face {{ font-family: Bigilla; src: url('file:///{FONTS}/Bigilla.otf'); }}
"""

def bbox(pts):
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)

class Sheet:
    def __init__(self, pts, extra=(), margin=MARGIN):
        allp = list(pts) + list(extra)
        x0, y0, x1, y1 = bbox(allp)
        self.x0, self.y0 = x0 - margin, y0 - margin
        self.w, self.h = (x1 - x0) + 2 * margin, (y1 - y0) + 2 * margin
        self.body = []
    def P(self, x, y):
        return ((x - self.x0) * PX, (self.y0 + self.h - y) * PX)
    def path(self, pts, closed=False, **attrs):
        d = "M" + " L".join(f"{a:.2f},{b:.2f}" for a, b in (self.P(*p) for p in pts))
        if closed:
            d += " Z"
        a = " ".join(f'{k.replace("_", "-")}="{v}"' for k, v in attrs.items())
        self.body.append(f'<path d="{d}" {a}/>')
    def text(self, x, y, s, size_cm, fill, anchor="middle", weight=500, family="Familjen",
             spacing=0.0, rotate=0, upper=False):
        px, py = self.P(x, y)
        tr = f' transform="rotate({rotate} {px:.1f} {py:.1f})"' if rotate else ""
        st = f"font-family:{family};font-size:{size_cm * PX:.1f}px;font-weight:{weight};letter-spacing:{spacing}em"
        lines = s.split("\n")
        for i, line in enumerate(lines):
            dy = (i - (len(lines) - 1) / 2) * size_cm * PX * 1.12
            self.body.append(
                f'<text x="{px:.1f}" y="{py + dy:.1f}" text-anchor="{anchor}" dominant-baseline="middle" '
                f'fill="{fill}" style="{st}"{tr}>{line.upper() if upper else line}</text>')
    def svg(self, bg_pts=None, bg=MIST):
        W, H = round(self.w * PX), round(self.h * PX)
        fill = ""
        if bg_pts:
            d = "M" + " L".join(f"{a:.2f},{b:.2f}" for a, b in (self.P(*p) for p in bg_pts)) + " Z"
            fill = f'<rect width="{W}" height="{H}" fill="{bg}"/>'
        return W, H, (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
                      f'<style>{FONT_CSS}</style>{fill}{"".join(self.body)}</svg>')

STROKE = PX * 0.11            # print line weight
THIN = PX * 0.07

def arrow_line(sh, a, b, label=None, side=1, both=True, size=0.7):
    ax, ay = a
    bx, by = b
    L = math.hypot(bx - ax, by - ay)
    ux, uy = (bx - ax) / L, (by - ay) / L
    nx, ny = -uy, ux
    sh.path([a, b], stroke=CORNFLOWER, stroke_width=f"{THIN:.1f}", fill="none")
    heads = [(b, (ux, uy))] + ([(a, (-ux, -uy))] if both else [])
    for (px, py), (dx, dy) in heads:
        tip = (px, py)
        l = (px - dx * size + nx * size * 0.35 * (1 if dx == ux else -1), py - dy * size + ny * size * 0.35 * (1 if dx == ux else -1))
        r = (px - dx * size - nx * size * 0.35 * (1 if dx == ux else -1), py - dy * size - ny * size * 0.35 * (1 if dx == ux else -1))
        sh.path([l, tip, r], closed=True, fill=CORNFLOWER)
    if label is None:
        label = f"{round(L * 2) / 2:g} cm"
    mx, my = (ax + bx) / 2, (ay + by) / 2
    ang = -math.degrees(math.atan2(by - ay, bx - ax))
    if ang < -90 or ang > 90:
        ang += 180
    off = 0.9 * side
    sh.text(mx + nx * off, my + ny * off, label, 1.15, CORNFLOWER, weight=500, rotate=ang)

def build_piece(key, spec):
    pts = spec["outline"]
    poly = Polygon(pts)
    extra = []
    for a, b, *_ in spec.get("dims", []):
        extra += [a, b]
    if spec.get("card"):
        sh = Sheet(pts)
        w, h = bbox(pts)[2], bbox(pts)[3]
        kind = spec["card"]
        if kind == "quote":
            sh.text(1.2, h - 1.4, spec["sub"], 0.62, STEEL, anchor="start", weight=600, spacing=0.22)
            sh.text(1.2, h * 0.42, spec["name"], 1.9, INK, anchor="start", weight=400, family="Bigilla")
            sh.path([(1.2, 1.2), (w - 1.2, 1.2)], stroke=CORNFLOWER, stroke_width=f"{THIN:.1f}", stroke_dasharray=f"{PX*0.4:.0f} {PX*0.28:.0f}")
        elif kind == "note":
            sh.text(1.2, h - 1.4, spec["sub"], 0.6, STEEL, anchor="start", weight=600, spacing=0.22)
            sh.text(1.2, h * 0.55, spec["name"], 1.25, INK, anchor="start", weight=400)
            sh.path([(1.2, 1.4), (w - 1.2, 1.4)], stroke=CORNFLOWER, stroke_width=f"{THIN:.1f}", stroke_dasharray=f"{PX*0.4:.0f} {PX*0.28:.0f}")
        elif kind == "label":
            sh.text(w / 2, h / 2, spec["name"], 2.2, INK, weight=400, spacing=0.08)
        elif kind == "strip":
            sh.path([(0.8, h / 2 - 0.1), (5, h / 2 - 0.1)], stroke=CORNFLOWER, stroke_width=f"{STROKE:.1f}", stroke_dasharray=f"{PX*0.45:.0f} {PX*0.3:.0f}")
            sh.path([(w - 5, h / 2 - 0.1), (w - 0.8, h / 2 - 0.1)], stroke=CORNFLOWER, stroke_width=f"{STROKE:.1f}", stroke_dasharray=f"{PX*0.45:.0f} {PX*0.3:.0f}")
            sh.text(w / 2, h / 2, spec["name"], 1.15, CORNFLOWER, weight=500, spacing=0.12, upper=True)
        bg = CLOUD if kind in ("quote", "note") else MIST
        return sh, pts, bg

    sh = Sheet(pts, extra, margin=3.0 if spec.get("sheet") else MARGIN)
    # cut line on the edge, seam line 1 cm in, dashed
    sh.path(pts, closed=True, stroke=CORNFLOWER, stroke_width=f"{STROKE:.1f}", fill="none")
    seam = poly.buffer(-1.0, join_style="mitre", mitre_limit=3)
    sp = list(seam.exterior.coords)
    sh.path(sp, closed=True, stroke=CORNFLOWER, stroke_width=f"{THIN:.1f}", fill="none",
            stroke_dasharray=f"{PX*0.42:.0f} {PX*0.26:.0f}")
    for ln in spec.get("lines", []):
        sh.path(ln, stroke=CORNFLOWER, stroke_width=f"{THIN:.1f}", fill="none",
                stroke_dasharray=f"{PX*0.42:.0f} {PX*0.26:.0f}")
    if spec.get("grain"):
        arrow_line(sh, *spec["grain"], label="grain", side=-1)
    for a, b, lab, *side in spec.get("dims", []):
        arrow_line(sh, a, b, lab, side=side[0] if side else 1)
    for nx_, ny_ in spec.get("notches", []):
        # a short tick into the piece, perpendicular to the nearest edge
        edge = poly.exterior
        d = edge.project(Point(nx_, ny_))
        p0 = edge.interpolate(d)
        p1 = edge.interpolate(d + 0.2)
        tx, ty = p1.x - p0.x, p1.y - p0.y
        L = math.hypot(tx, ty) or 1
        nx2, ny2 = -ty / L, tx / L
        s = 1 if poly.contains(Point(p0.x + nx2 * 0.3, p0.y + ny2 * 0.3)) else -1
        sh.path([(p0.x, p0.y), (p0.x + nx2 * 0.9 * s, p0.y + ny2 * 0.9 * s)], stroke=CORNFLOWER, stroke_width=f"{STROKE:.1f}")
    if spec.get("fold") == "left":
        ys = [p[1] for p in pts if abs(p[0]) < 0.01]
        y0, y1 = min(ys) + 8, max(ys) - 10
        sh.path([(2.2, y0), (0.6, y0)], stroke=CORNFLOWER, stroke_width=f"{THIN:.1f}")
        sh.path([(2.2, y1), (0.6, y1)], stroke=CORNFLOWER, stroke_width=f"{THIN:.1f}")
        arrow_line(sh, (2.2, y0), (2.2, y1), label="place on fold", side=-1)
    lx, ly = spec["label_at"]
    sh.text(lx, ly, spec["name"], 2.4, INK, weight=400, spacing=0.06)
    sh.text(lx, ly - 2.6, spec["sub"], 1.3, NAVY, weight=400)
    return sh, pts, MIST

# ---------------------------------------------------------------- tape measure
def tape(length=152, width=1.6):
    sh = Sheet([(0, 0), (length, 0), (length, width), (0, width)])
    for mm in range(0, length * 10 + 1):
        x = mm / 10
        h = 0.55 if mm % 10 == 0 else (0.35 if mm % 5 == 0 else 0.2)
        for y0, sgn in ((0, 1), (width, -1)):
            sh.path([(x, y0), (x, y0 + sgn * h)], stroke=INK, stroke_width=f"{PX*0.03:.1f}")
        if mm % 10 == 0 and 0 < x < length:
            sh.text(x, width / 2, str(int(x)), 0.5 if x % 10 else 0.62,
                    CORNFLOWER if x % 10 == 0 else INK, weight=500)
    return sh

# ---------------------------------------------------------------- raster
def rasterise(name, W, H, svg):
    html = os.path.join(BUILD, f"{name}.html")
    png = os.path.join(BUILD, f"{name}.png")
    with open(html, "w", encoding="utf-8") as f:
        f.write(f"<!doctype html><html><head><meta charset='utf-8'><style>html,body{{margin:0;background:transparent}}"
                f"svg{{display:block}}</style></head><body>{svg}</body></html>")
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
                    "--default-background-color=00000000", "--force-device-scale-factor=1",
                    "--virtual-time-budget=3000", f"--window-size={W},{H}", f"--screenshot={png}",
                    "file:///" + html.replace("\\", "/")], check=True, capture_output=True)
    return png

def main():
    out = {}
    for key, fn in PIECES.items():
        spec = fn()
        sh, pts, bg = build_piece(key, spec)
        W, H, svg = sh.svg(bg_pts=pts, bg=bg)
        png = rasterise(key, W, H, svg)
        fabric = None
        if spec.get("sheet"):
            pts = [(sh.x0, sh.y0), (sh.x0 + sh.w, sh.y0), (sh.x0 + sh.w, sh.y0 + sh.h), (sh.x0, sh.y0 + sh.h)]
        elif not spec.get("card"):
            fabric = list(Polygon(pts).buffer(1.4, join_style="round", quad_segs=4).exterior.coords)[:-1]
        out[key] = dict(outline=pts, fabric=fabric, image=png, x0=sh.x0, y0=sh.y0, w=sh.w, h=sh.h,
                        card=spec.get("card") or ("sheet" if spec.get("sheet") else None))
        print("PIECE", key, W, H)
    t = tape()
    W, H, svg = t.svg(bg_pts=[(0, 0)], bg=MIST)
    out["tape"] = dict(image=rasterise("tape", W, H, svg), x0=t.x0, y0=t.y0, w=t.w, h=t.h, length=152, width=1.6)
    print("TAPE", W, H)
    with open(os.path.join(BUILD, "pieces.json"), "w") as f:
        json.dump(out, f)
    print("DONE")

if __name__ == "__main__":
    main()
