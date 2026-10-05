/* Made to measure: the references, the bodies you draft for, and the ease. */

export type Kind = "photo" | "sketch";
export type Pin = { x: number; y: number; note: string }; // x, y: 0..1 of the image
export type Att = { id: number; kind: Kind; src: string; marked?: boolean; pins?: Pin[] };

// the people you draft for: a name and their measurements, nothing else
export const BODIES = [
  { id: "natalia", name: "Natalia", m: "Bust 92 · Waist 74 · Hip 98" },
  { id: "mei", name: "Mei", m: "Bust 86 · Waist 68 · Hip 92" },
  { id: "amara", name: "Amara", m: "Bust 101 · Waist 86 · Hip 106" },
];
export type Body = (typeof BODIES)[number];
export const FITS = ["Close", "Easy", "Loose"] as const;
export type Fit = (typeof FITS)[number];
