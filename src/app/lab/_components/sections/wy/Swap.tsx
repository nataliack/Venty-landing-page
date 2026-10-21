"use client";

import { useEffect, useRef, useState } from "react";

/* The outfit swap, in the page's own dither: the squares the sections rise
   with (DitherEdge's Bayer order) and the loading screen's way out (rows
   from the top, a little scatter). Two colours only. The pixels gather only
   over her, in a loose halo that hugs her (its edge broken by noise, never a
   clean shape), never the whole room:

     cover   pixels switch on in dither order, top to bottom, until she is
             covered (the old outfit and the new, every edge)
     swap    under them her cutout changes
     open    they switch off in the same order, uncovering the new one

   One canvas per girl, drawn only while a swap runs (under a second), all
   four at once; two fills a frame. */

export type Pair = "night-corn" | "night-cloud" | "corn-peri";
export const PAIRS: Record<Pair, [string, string]> = {
  "night-corn": ["#0b0c15", "#687ef5"],
  "night-cloud": ["#0b0c15", "#eff4ff"],
  "corn-peri": ["#687ef5", "#9daccd"],
};

const COVER_S = 0.38;
const GAP_S = 0.08;
const OPEN_S = 0.46;

const load = (src: string) =>
  new Promise<HTMLImageElement>((ok) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = () => ok(im);
    im.src = src;
  });

function alphaOf(im: HTMLImageElement, cols: number, rows: number) {
  try {
    const c = document.createElement("canvas");
    c.width = cols;
    c.height = rows;
    const x = c.getContext("2d", { willReadFrequently: true })!;
    x.drawImage(im, 0, 0, cols, rows);
    const d = x.getImageData(0, 0, cols, rows).data;
    const a = new Uint8Array(cols * rows);
    for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3];
    return a;
  } catch {
    return null;
  }
}
// the 4 x 4 Bayer order (0..15), as DitherEdge
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const hash = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
/** smooth noise, about `k` cells across a blob */
const noise = (x: number, y: number, k: number) => {
  const u = x / k;
  const v = y / k;
  const i = Math.floor(u);
  const j = Math.floor(v);
  const fu = u - i;
  const fv = v - j;
  const su = fu * fu * (3 - 2 * fu);
  const sv = fv * fv * (3 - 2 * fv);
  const a = hash(i, j) + (hash(i + 1, j) - hash(i, j)) * su;
  const b = hash(i, j + 1) + (hash(i + 1, j + 1) - hash(i, j + 1)) * su;
  return a + (b - a) * sv;
};

export function SwapImage({ src, alt, pair, onSwap }: { src: string; alt: string; pair: Pair; onSwap?: () => void }) {
  const [shown, setShown] = useState(src);
  const shownRef = useRef(src);
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const opts = useRef({ pair, onSwap });
  useEffect(() => {
    opts.current = { pair, onSwap };
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
    opts.current.onSwap?.();
    Promise.all([load(from), load(src)]).then(([a, b]) => {
      if (dead) return;
      const [c0, c1] = PAIRS[opts.current.pair];
      const W = el.clientWidth;
      const H = el.clientHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      const cell = W < 220 ? 11 : 15; // css px
      const cols = Math.ceil(W / cell);
      const rows = Math.ceil(H / cell);
      const A = alphaOf(a, cols, rows);
      const B = alphaOf(b, cols, rows);
      // how far each cell is from her (old or new), in cells
      const far = new Float32Array(cols * rows).fill(1e9);
      const q: number[] = [];
      for (let k = 0; k < far.length; k++)
        if ((A ? A[k] : 0) > 24 || (B ? B[k] : 0) > 24 || (!A && !B)) {
          far[k] = 0;
          q.push(k);
        }
      for (let h = 0; h < q.length; h++) {
        const k = q[h];
        const i = k % cols;
        const j = (k - i) / cols;
        const d = far[k] + 1;
        if (d > 6) continue;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const ni = i + di;
          const nj = j + dj;
          if (ni < 0 || nj < 0 || ni >= cols || nj >= rows) continue;
          const nk = nj * cols + ni;
          if (far[nk] > d) {
            far[nk] = d;
            q.push(nk);
          }
        }
      }
      let seed = 5;
      const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
      const ox = Math.random() * 50; // a different halo each time
      const on0: number[] = []; // [x, y, threshold] for each colour
      const on1: number[] = [];
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++) {
          const k = j * cols + i;
          // the halo: up to four cells out, its reach broken by noise
          const reach = 0.6 + noise(i + ox, j, 3.2) * 3.4;
          if (far[k] > reach) continue;
          const bayer = BAYER[(j % 4) * 4 + (i % 4)] / 16;
          const thr = bayer * 0.5 + (j / rows) * 0.38 + rand() * 0.12;
          // the second colour falls in soft clusters, not a checker
          (noise(i * 1.3 + ox * 2, j * 1.3, 2.4) + bayer * 0.18 > 0.66 ? on1 : on0).push(i * cell * dpr, j * cell * dpr, thr);
        }
      const size = cell * dpr + 0.5; // a hair over, so no seams show
      const t0 = performance.now();
      let swapped = false;
      const draw = (list: number[], colour: string, cover: number, open: number) => {
        ctx.fillStyle = colour;
        ctx.beginPath();
        for (let n = 0; n < list.length; n += 3) {
          const thr = list[n + 2];
          if (cover >= thr && open < thr) ctx.rect(list[n], list[n + 1], size, size);
        }
        ctx.fill();
      };
      const frame = (now: number) => {
        if (dead) return;
        const t = (now - t0) / 1000;
        const cover = t / COVER_S;
        const open = (t - COVER_S - GAP_S) / OPEN_S;
        if (!swapped && t > COVER_S + GAP_S / 2) {
          swapped = true;
          swap();
        }
        ctx.clearRect(0, 0, cv.width, cv.height);
        draw(on0, c0, cover, open);
        draw(on1, c1, cover, open);
        if (open < 1.01) raf = requestAnimationFrame(frame);
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
      {/* the light falls on her only: a highlight masked by her own cutout */}
      <span className="wy-onher" style={{ WebkitMaskImage: `url(${shown})`, maskImage: `url(${shown})` }} aria-hidden="true" />
      <canvas ref={canvas} aria-hidden="true" />
    </div>
  );
}
