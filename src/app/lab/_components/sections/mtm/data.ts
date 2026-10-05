/* Made to measure: the data the composer and the outcome share. */

export type Kind = "photo" | "sketch";
export type Pin = { x: number; y: number; note: string }; // x, y: 0..1 of the image
export type Att = { id: number; kind: Kind; src: string; marked?: boolean; pins?: Pin[] };

export const SAMPLE_A = "/lab/reel/17.webp";
export const SAMPLE_B = "/lab/reel/13.webp";

// a slip of a dress, drawn as a quick line sketch (the pre-filled sketch)
export const SKETCH_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 380'><rect width='300' height='380' fill='#eff4ff'/><g fill='none' stroke='#121524' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><path d='M138 36 L150 30 L162 36 L170 118 M138 36 L130 118'/><path d='M130 118 Q112 190 118 214 Q96 290 70 352 Q150 368 230 352 Q204 290 182 214 Q188 190 170 118'/><path d='M118 214 Q150 226 182 214' stroke-dasharray='2 7'/><path d='M130 118 Q150 132 170 118'/></g></svg>`,
)}`;

export const PROMPT = "An organdy halter gown like photo 1, floor length, sheer sleeves, with the neckline from my sketch.";

export const BODIES = [
  { id: "me-oct", name: "Me", date: "Oct 2026", m: "Bust 92 · Waist 74 · Hip 98" },
  { id: "me-mar", name: "Me", date: "Mar 2026", m: "Bust 90 · Waist 73 · Hip 97" },
  { id: "mum", name: "Mum", date: "Jun 2026", m: "Bust 101 · Waist 86 · Hip 106" },
];
export type Body = (typeof BODIES)[number];
export const FITS = ["Close", "Easy", "Loose"] as const;
export type Fit = (typeof FITS)[number];

/* The finished garment (placeholder until the real photo arrives: a 4:5
   crop of the hero film's last frame, public/lab/mtm/garment.webp) */
export const GARMENT = "/lab/mtm/garment.webp";

/* The pieces of the gown. d: outline in a 100 x 100 box. at: where the
   piece sits on the garment, 0..1 of the garment image. depth: parallax. */
export type Piece = { key: string; name: string; note: string; d: string; at: [number, number]; depth: number };
export const PIECES: Piece[] = [
  { key: "front", name: "Bodice front", note: "Cut 1 on fold", d: "M44 6 L56 6 L62 30 Q78 38 90 46 L84 94 L16 94 L10 46 Q22 38 38 30 Z", at: [0.45, 0.4], depth: 1 },
  { key: "sleeve", name: "Sleeve", note: "Cut 2, organdy", d: "M6 30 Q28 6 50 4 Q72 6 94 30 L80 96 L20 96 Z", at: [0.3, 0.45], depth: 0.6 },
  { key: "skirtF", name: "Skirt front", note: "Cut 1 on fold", d: "M30 4 L70 4 L96 96 L4 96 Z", at: [0.4, 0.8], depth: 1.2 },
  { key: "neck", name: "Neckband", note: "Cut 2", d: "M4 40 Q50 10 96 40 L96 60 Q50 30 4 60 Z", at: [0.5, 0.23], depth: 0.8 },
  { key: "back", name: "Bodice back", note: "Cut 2", d: "M14 30 Q50 22 86 30 L90 94 L10 94 Z", at: [0.68, 0.43], depth: 1.1 },
  { key: "skirtB", name: "Skirt back", note: "Cut 2", d: "M26 4 L74 4 L98 96 L50 92 L2 96 Z", at: [0.72, 0.82], depth: 0.7 },
  { key: "waist", name: "Waistband", note: "Cut 1", d: "M4 34 L96 34 L96 66 L4 66 Z", at: [0.52, 0.56], depth: 0.9 },
];

/* Two arrangements in a design space, fitted to the column by aspect
   ratio: wide (desktop column) and narrow (phones). side: which edge of
   the card the leader line leaves from. */
type Box = { x: number; y: number; w: number; h: number; side: "l" | "r" | "t" };
export type Plan = { w: number; h: number; garment: { x: number; y: number; w: number; h: number }; at: Record<string, Box>; spec: number };
export const WIDE: Plan = {
  w: 700,
  h: 600,
  garment: { x: 220, y: 20, w: 260, h: 325 },
  at: {
    front: { x: 20, y: 20, w: 150, h: 140, side: "r" },
    sleeve: { x: 20, y: 190, w: 150, h: 150, side: "r" },
    skirtF: { x: 20, y: 370, w: 150, h: 200, side: "r" },
    neck: { x: 530, y: 20, w: 150, h: 76, side: "l" },
    back: { x: 530, y: 120, w: 150, h: 140, side: "l" },
    skirtB: { x: 530, y: 290, w: 150, h: 200, side: "l" },
    waist: { x: 240, y: 380, w: 220, h: 72, side: "t" },
  },
  spec: 486,
};
export const NARROW: Plan = {
  w: 360,
  h: 470,
  garment: { x: 95, y: 0, w: 170, h: 212 },
  at: {
    front: { x: 0, y: 0, w: 84, h: 92, side: "r" },
    sleeve: { x: 0, y: 108, w: 84, h: 100, side: "r" },
    neck: { x: 276, y: 0, w: 84, h: 52, side: "l" },
    back: { x: 276, y: 66, w: 84, h: 92, side: "l" },
    skirtF: { x: 0, y: 236, w: 112, h: 150, side: "t" },
    waist: { x: 124, y: 250, w: 112, h: 56, side: "t" },
    skirtB: { x: 248, y: 236, w: 112, h: 150, side: "t" },
  },
  spec: 410,
};
