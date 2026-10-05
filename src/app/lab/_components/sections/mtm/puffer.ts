/* Made to measure, the rig version: the puffer suspended on its cables.
   Geometry is in fractions of the web image (public/lab/mtm/rig-*.webp:
   Jose's render cropped to what his radial fade shows, the fade baked into
   its alpha), so the layout can pin it to the composer exactly. */

import type { Att, Body, Fit } from "./data";

export const RIG = {
  srcSet: "/lab/mtm/rig-1400.webp 1400w, /lab/mtm/rig-2400.webp 2400w, /lab/mtm/rig-3600.webp 3600w",
  src: "/lab/mtm/rig-2400.webp",
  /** image height / width */
  ratio: 3323 / 7580,
  /** the jacket's box in the image, 0..1 */
  jacket: { x0: 0.3997, x1: 0.5969, y0: 0.3508, y1: 0.7467 },
  /** where the composer's top edge cuts the jacket: below it only the sleeve hangs */
  cardLine: 0.649,
  /** the hanging sleeve, drawn again above the card */
  sleeve: { x0: 0.566, x1: 0.605 },
  /** from Jose's frame: the jacket's left edge sits 0.567 jacket widths left of centre */
  offset: 0.567,
};

// a quick line sketch of the puffer (the pre-filled sketch)
const SKETCH = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'><rect width='300' height='300' fill='#eff4ff'/><g fill='none' stroke='#121524' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><path d='M128 70 Q150 30 176 62 Q190 84 178 104'/><path d='M120 96 Q96 104 74 150 L56 214 L80 222 L100 168 L104 236 Q150 250 196 236 L200 168 L220 222 L244 214 L226 150 Q204 104 180 96'/><path d='M150 104 L150 238'/></g><g fill='none' stroke='#687ef5' stroke-width='2' stroke-dasharray='2 7'><path d='M104 140 Q150 150 196 140'/><path d='M104 176 Q150 186 198 176'/><path d='M104 210 Q150 220 198 210'/></g></svg>`,
)}`;

export const PUFFER_REFS: Att[] = [
  { id: 1, kind: "photo", src: "/lab/mtm/ref-jacket.webp", pins: [{ x: 0.62, y: 0.2, note: "Deep hood" }] },
  { id: 2, kind: "sketch", src: SKETCH },
  { id: 3, kind: "photo", src: "/lab/mtm/ref-quilt.webp" },
];
export const PUFFER_PROMPT = "A cropped puffer like photo 1, an oversized hood, wide quilted channels and elastic cuffs. Quilting like photo 2.";

/* The pattern pieces floating round the rig. Placed in jacket widths from
   the composer's top centre (x right, y down), w in jacket widths, r in
   degrees. phone: shown on small screens too. len: the drafted measure,
   from the body and the fit's ease. */
const EASE: Record<Fit, number> = { Close: 1, Easy: 4, Loose: 8 };
export const bust = (b: Body) => Number(b.m.match(/Bust (\d+)/)?.[1] ?? 92);

export type RigPiece = {
  key: string;
  name: string;
  d: string;
  quilt: boolean;
  x: number;
  y: number;
  w: number;
  r: number;
  phone?: { x: number; y: number; w: number };
  len: (b: number, ease: number) => string;
};
export const RIG_PIECES: RigPiece[] = [
  {
    key: "hood",
    name: "Hood",
    d: "M18 92 Q6 44 36 14 Q64 -2 86 26 Q98 58 84 92 Z",
    quilt: false,
    x: -1.3,
    y: -1.0,
    w: 0.36,
    r: -12,
    phone: { x: -0.84, y: -0.6, w: 0.42 },
    len: (b, e) => `Depth ${((b + e) * 0.38).toFixed(1)} cm`,
  },
  {
    key: "sleeve",
    name: "Sleeve",
    d: "M8 22 Q50 2 92 22 L80 96 L20 96 Z",
    quilt: true,
    x: 1.12,
    y: -0.92,
    w: 0.4,
    r: 13,
    phone: { x: 0.86, y: -0.46, w: 0.44 },
    len: (b, e) => `Length ${(57 + (b - 92) * 0.12 + e * 0.3).toFixed(1)} cm`,
  },
  {
    key: "front",
    name: "Front",
    d: "M18 6 L58 6 Q60 20 74 24 L92 30 L86 96 L18 96 Z",
    quilt: true,
    x: -1.52,
    y: -0.1,
    w: 0.4,
    r: 7,
    len: (b, e) => `½ chest ${((b + e) / 4).toFixed(1)} cm`,
  },
  {
    key: "back",
    name: "Back",
    d: "M8 12 Q50 2 92 12 L94 96 L6 96 Z",
    quilt: true,
    x: 1.48,
    y: 0.04,
    w: 0.42,
    r: -8,
    len: (b, e) => `½ back ${((b + e) / 4 + 0.5).toFixed(1)} cm`,
  },
  {
    key: "cuff",
    name: "Cuff",
    d: "M4 32 L96 32 L96 68 L4 68 Z",
    quilt: false,
    x: -1.3,
    y: 0.98,
    w: 0.3,
    r: -16,
    phone: { x: -0.7, y: 2.75, w: 0.46 },
    len: (b, e) => `Wrist ${(16 + (b - 92) * 0.05 + e * 0.25).toFixed(1)} cm`,
  },
  {
    key: "pocket",
    name: "Pocket",
    d: "M10 10 L90 10 L90 78 Q50 96 10 78 Z",
    quilt: false,
    x: 1.28,
    y: 1.04,
    w: 0.24,
    r: 19,
    phone: { x: 0.78, y: 2.8, w: 0.38 },
    len: () => `Opening 16.0 cm`,
  },
];

export const easeOf = (f: Fit) => EASE[f];
