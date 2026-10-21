"use client";

import { useEffect, useRef, useState } from "react";

/* The outfit swap, after the loading screen's way out (FilamentLoader: the
   screen breaks into squares that clear row by row). Here the pieces are
   small diamonds and they only gather over the girl, never the room behind
   her:

     cover   diamonds grow in from her middle outwards, in a diamond wave,
             until she is covered (a diamond round her, its edge a little
             ragged, and always every part of her, the old outfit and the new)
     swap    under them her cutout changes
     open    they shrink away from her middle outwards, so the new outfit
             opens from the centre

   One canvas per girl, drawn only while a swap runs (about a second), all
   four at once. Cover colour, for the test: the night, cornflower, or her
   own colours (the old outfit's going in, the new one's coming out). */

export type Cover = "night" | "corn" | "her";
export type Shape = "diamond" | "silhouette";

const COVER_S = 0.42; // diamonds growing in until she is covered
const GAP_S = 0.08; // covered: the swap happens in here
const OPEN_S = 0.55; // diamonds shrinking away
const EDGE = 0.24; // how much of a phase each diamond takes (the rest is its wait)

const load = (src: string) =>
  new Promise<HTMLImageElement>((ok) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = () => ok(im);
    im.src = src;
  });
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = (v: number) => 1 - (1 - v) * (1 - v);

/** the image at grid resolution: [r, g, b, a] per cell, or null if it can't be read */
function sample(im: HTMLImageElement, cols: number, rows: number) {
  try {
    const c = document.createElement("canvas");
    c.width = cols;
    c.height = rows;
    const x = c.getContext("2d", { willReadFrequently: true })!;
    x.drawImage(im, 0, 0, cols, rows);
    return x.getImageData(0, 0, cols, rows).data;
  } catch {
    return null;
  }
}

export function SwapImage({ src, alt, cover, shape }: { src: string; alt: string; cover: Cover; shape: Shape }) {
  const [shown, setShown] = useState(src);
  const shownRef = useRef(src);
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const opts = useRef({ cover, shape });
  useEffect(() => {
    opts.current = { cover, shape };
  });

  useEffect(() => {
    const from = shownRef.current;
    if (src === from) return;
    const cv = canvas.current;
    const el = box.current;
    const swap = () => {
      shownRef.current = src;
      setShown(src);
    };
    if (!cv || !el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      swap();
      return;
    }
    let dead = false;
    let raf = 0;
    const ctx = cv.getContext("2d")!;
    Promise.all([load(from), load(src)]).then(([a, b]) => {
      if (dead) return;
      const { cover: mode, shape: form } = opts.current;
      const W = el.clientWidth;
      const H = el.clientHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      const cell = W < 220 ? 7 : 9; // css px: small
      const cols = Math.ceil(W / cell);
      const rows = Math.ceil(H / cell);
      const A = sample(a, cols, rows);
      const B = sample(b, cols, rows);
      const alphaAt = (i: number, j: number) => {
        if (i < 0 || j < 0 || i >= cols || j >= rows) return 0;
        const k = (j * cols + i) * 4 + 3;
        return Math.max(A ? A[k] : 0, B ? B[k] : 0);
      };
      // her, a cell wider all round, so the cover never misses an edge
      const onHer = (i: number, j: number) => {
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) if (alphaAt(i + di, j + dj) > 24) return true;
        return false;
      };
      let seed = 11;
      const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
      const night = (v: number) => `rgb(${11 + v * 10} ${12 + v * 11} ${21 + v * 18})`;
      const corn = (v: number) => `rgb(${104 - v * 18} ${126 - v * 14} ${245 - v * 12})`;
      const colourOf = (S: Uint8ClampedArray | null, k: number, v: number) => {
        if (mode === "corn") return corn(v);
        if (mode === "night") return night(v);
        if (!S) return corn(v); // her colours, where the image can't be read
        return S[k + 3] > 24 ? `rgb(${S[k]} ${S[k + 1]} ${S[k + 2]})` : night(v);
      };
      type T = { x: number; y: number; o: number; ca: string; cb: string };
      const tiles: T[] = [];
      let dmax = 0;
      const pending: { i: number; j: number; d: number; v: number }[] = [];
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++) {
          const u = (i + 0.5) / cols;
          const v = (j + 0.5) / rows;
          // the diamond round her: its corners on the middles of the sides
          const d = Math.abs(u - 0.5) * 2 + Math.abs(v - 0.52) * 2;
          const jit = rand();
          const inDiamond = form === "diamond" && d <= 1 + (jit - 0.5) * 0.14;
          if (!inDiamond && !onHer(i, j)) continue;
          pending.push({ i, j, d, v: jit });
          dmax = Math.max(dmax, d);
        }
      for (const p of pending) {
        const k = (p.j * cols + p.i) * 4;
        tiles.push({
          x: (p.i + 0.5) * cell * dpr,
          y: (p.j + 0.5) * cell * dpr,
          o: (p.d / (dmax || 1)) * 0.8 + p.v * 0.2,
          ca: colourOf(A, k, p.v),
          cb: colourOf(B, k, p.v),
        });
      }
      const half = cell * dpr; // a diamond this size covers its cell
      const t0 = performance.now();
      let swapped = false;
      const frame = (now: number) => {
        if (dead) return;
        const t = (now - t0) / 1000;
        ctx.clearRect(0, 0, cv.width, cv.height);
        const late = t > COVER_S + GAP_S / 2;
        if (late && !swapped) {
          swapped = true;
          swap();
        }
        for (const p of tiles) {
          const inn = ease(clamp((t - p.o * COVER_S * (1 - EDGE)) / (COVER_S * EDGE)));
          const out = ease(clamp((t - COVER_S - GAP_S - p.o * OPEN_S * (1 - EDGE)) / (OPEN_S * EDGE)));
          const s = inn * (1 - out);
          if (s <= 0.01) continue;
          const h = half * s;
          ctx.fillStyle = late ? p.cb : p.ca;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - h);
          ctx.lineTo(p.x + h, p.y);
          ctx.lineTo(p.x, p.y + h);
          ctx.lineTo(p.x - h, p.y);
          ctx.fill();
        }
        if (t < COVER_S + GAP_S + OPEN_S) raf = requestAnimationFrame(frame);
        else ctx.clearRect(0, 0, cv.width, cv.height);
      };
      raf = requestAnimationFrame(frame);
    });
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, cv.width, cv.height);
    };
  }, [src]);

  return (
    <div ref={box} className="wy-swap">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={shown} alt={alt} draggable={false} />
      <canvas ref={canvas} aria-hidden="true" />
    </div>
  );
}
