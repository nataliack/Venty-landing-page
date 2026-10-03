/* Zipper geometry shared with tools/zipper/zipper.py. The page uses it to
   cut the opening out of the CSS cloth so the hole matches the render
   exactly. Keep these numbers in step with the Python script. */

export const ZIP = {
  frames: 60,
  zTop: 95,
  zBot: -95,
  zStart: 70,
  zEnd: -74,
  maxOpen: 34,
  tapeW: 2.3,
  // camera: lens 50mm, sensor 24mm vertical, so half height = D * 0.24
  portrait: { w: 1080, h: 2340, d: 318 },
  landscape: { w: 1920, h: 1080, d: 150 },
} as const;

export type Orient = "portrait" | "landscape";

const smooth = (t: number) => {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
};

export const sliderZ = (t: number) => ZIP.zStart + (ZIP.zEnd - ZIP.zStart) * smooth(t);

/* per-side X separation of the fabric edge at height z for progress t */
export function openAmount(z: number, t: number) {
  const zs = sliderZ(t);
  if (z <= zs) return 0;
  const s = (z - zs) / Math.max(0.001, ZIP.zTop - zs);
  const base = ZIP.maxOpen * Math.pow(s, 1.55);
  const sweep = smooth((t - 0.86) / 0.14) * 120;
  return base + sweep * (0.35 + 0.65 * s);
}

/* fabric curls toward the camera as it opens (negative Y is toward camera) */
export const depthAmount = (z: number, t: number) => -0.22 * openAmount(z, t);

export function frameT(frame: number) {
  return (frame - 1) / (ZIP.frames - 1);
}

/* How a frame of a given orientation sits on a viewport when scaled to
   cover it: returns the scale (px per frame px) and the offset of the frame
   origin, plus px-per-scene-unit at depth 0. */
export function fit(orient: Orient, vw: number, vh: number) {
  const f = ZIP[orient];
  const scale = Math.max(vw / f.w, vh / f.h);
  const dw = f.w * scale;
  const dh = f.h * scale;
  const ox = (vw - dw) / 2;
  const oy = (vh - dh) / 2;
  const halfH = f.d * 0.24;
  const ppu = (f.h / 2) / halfH; // frame px per unit at depth 0
  return { scale, dw, dh, ox, oy, ppu, d: f.d };
}

/* The V-shaped hole for a frame, as a CSS polygon() that keeps everything
   EXCEPT the hole. Points are in viewport px. */
export function holePolygon(frame: number, orient: Orient, vw: number, vh: number) {
  const t = frameT(frame);
  const zs = sliderZ(t);
  const { scale, ox, oy, ppu, d, dh } = fit(orient, vw, vh);
  const cx = ox + (ZIP[orient].w * scale) / 2;
  const cy = oy + dh / 2;
  const toY = (z: number) => cy - z * ppu * scale;
  const halfX = (z: number) => {
    const o = openAmount(z, t);
    // tape inner edge is at x = o; pull the hole in a little so no cloth
    // ever shows inside the gap. perspective: points nearer the camera
    // project larger
    const inner = Math.max(0, o - 0.5);
    const y = depthAmount(z, t);
    const persp = d / (d - y);
    return inner * ppu * scale * persp;
  };

  const zTopEdge = ZIP.zTop;
  if (openAmount(zTopEdge, t) <= 0.5) {
    return "none"; // fully closed, nothing to cut
  }
  const steps = 28;
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const z = zTopEdge - (zTopEdge - zs) * (i / steps);
    const hx = halfX(z);
    const y = toY(z);
    left.push(`${(cx - hx).toFixed(1)}px ${y.toFixed(1)}px`);
    right.unshift(`${(cx + hx).toFixed(1)}px ${y.toFixed(1)}px`);
  }
  // polygon: top-left corner, across to hole left edge at the top, down the
  // left side of the V to the slider, up the right side, across to the
  // top-right corner, then down and around the viewport.
  const topY = toY(zTopEdge);
  const pts = [
    `0px ${Math.min(0, topY).toFixed(1)}px`,
    `${(cx - halfX(zTopEdge)).toFixed(1)}px ${Math.min(0, topY).toFixed(1)}px`,
    ...left,
    ...right,
    `${(cx + halfX(zTopEdge)).toFixed(1)}px ${Math.min(0, topY).toFixed(1)}px`,
    `${vw}px ${Math.min(0, topY).toFixed(1)}px`,
    `${vw}px ${vh}px`,
    `0px ${vh}px`,
  ];
  return `polygon(${pts.join(", ")})`;
}
