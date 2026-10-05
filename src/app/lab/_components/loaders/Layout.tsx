"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap } from "gsap";
import { LogoMark } from "@/components/Logo";
import { heroPoster } from "@/lib/heroSequence";
import { DUR, EASE, textIn } from "@/lib/motion";
import { HIDDEN } from "@/lib/reveal";
import { Crown, SrProgress, easeInCubic, tween, useExit, useShown, type LoaderProps } from "./shared";

/* Layout. A pattern laid out on paper while the page loads: images arrive
   cut into the pieces of a sewing pattern (bodice front and back, sleeve,
   skirt panel, collar, cuff, pocket), each with its seam line, a dashed
   seam allowance, a grainline and a label, placed one by one on the
   cutting grid. A ruler along the bottom measures the progress.

   At 100 the other pieces leave, and the bodice front, which carries the
   hero's first frame, unfolds from its pattern shape into the full frame:
   its outline's points travel out to the screen's edges while it grows,
   landing exactly on the hero's opening frame underneath.

   Built only from the hero's own parts: the logo where the site logo sits,
   the hero's type (Familjen, a Bigilla word, 12px caps labels, 16px lines
   at 60%), the pattern-paper grid, text rising from masks (motion.ts),
   the hero's eases. Placeholder images until the real set arrives. */

const THUMBS = Array.from({ length: 17 }, (_, i) => `/lab/reel/${String(i + 1).padStart(2, "0")}.webp`);
const CM = 24; // one square of the pattern paper

/* A piece: name, cutting note, image, and its outline as [x, y] in its own
   box (0..1). The hero piece also gives each point a target on the box
   edge ([x, y, tx, ty]); doubled points open the corners as it unfolds. */
type Pt = [number, number] | [number, number, number, number];
type Piece = { key: string; name: string; note: string; src: string; hero?: boolean; pts: Pt[]; grain: "v" | "h" };

const PIECES: Piece[] = [
  {
    key: "back",
    name: "Bodice back",
    note: "Cut 1 on fold",
    src: THUMBS[2],
    grain: "v",
    pts: [[0.68, 0], [1, 0.12], [1, 1], [0.05, 1], [0, 0.48], [0.14, 0.42], [0.18, 0.3], [0.14, 0.1]],
  },
  {
    key: "sleeve",
    name: "Sleeve",
    note: "Cut 2",
    src: THUMBS[6],
    grain: "v",
    pts: [[0, 0.36], [0.14, 0.16], [0.33, 0.04], [0.5, 0], [0.67, 0.04], [0.86, 0.16], [1, 0.36], [0.86, 1], [0.14, 1]],
  },
  {
    key: "collar",
    name: "Collar",
    note: "Cut 2",
    src: THUMBS[9],
    grain: "h",
    pts: [[0, 0.38], [0.25, 0.12], [0.5, 0], [0.75, 0.12], [1, 0.38], [1, 0.78], [0.75, 0.56], [0.5, 0.46], [0.25, 0.56], [0, 0.78]],
  },
  {
    key: "front",
    name: "Bodice front",
    note: "Cut 1 on fold",
    src: heroPoster,
    hero: true,
    grain: "v",
    pts: [
      [0, 0.16, 0, 0],
      [0.15, 0.14, 0.15, 0],
      [0.26, 0.09, 0.26, 0],
      [0.32, 0, 0.32, 0],
      [0.86, 0.1, 0.86, 0],
      [0.86, 0.1, 1, 0],
      [0.82, 0.3, 1, 0.3],
      [0.86, 0.42, 1, 0.42],
      [1, 0.48, 1, 0.48],
      [0.95, 1, 1, 1],
      [0.6, 0.98, 0.6, 1],
      [0.52, 0.62, 0.52, 1],
      [0.44, 0.98, 0.44, 1],
      [0, 1, 0, 1],
    ],
  },
  {
    key: "skirt",
    name: "Skirt panel",
    note: "Cut 2",
    src: THUMBS[12],
    grain: "v",
    pts: [[0.28, 0], [0.72, 0], [1, 0.92], [0.5, 1], [0, 0.92]],
  },
  {
    key: "cuff",
    name: "Cuff",
    note: "Cut 2",
    src: THUMBS[14],
    grain: "h",
    pts: [[0, 0], [1, 0], [1, 1], [0, 1]],
  },
  {
    key: "pocket",
    name: "Pocket",
    note: "Cut 1",
    src: THUMBS[16],
    grain: "v",
    pts: [[0, 0], [1, 0], [1, 0.74], [0.5, 1], [0, 0.74]],
  },
];

/* Where each piece sits on the paper, in a layout space; landscape and
   portrait arrangements, fitted into the free area of the screen. */
type Box = { x: number; y: number; w: number; h: number };
const WIDE: { w: number; h: number; at: Record<string, Box> } = {
  w: 1000,
  h: 560,
  at: {
    back: { x: 120, y: 30, w: 200, h: 330 },
    front: { x: 400, y: 10, w: 205, h: 345 },
    sleeve: { x: 690, y: 20, w: 220, h: 210 },
    skirt: { x: 680, y: 262, w: 250, h: 280 },
    collar: { x: 95, y: 405, w: 240, h: 105 },
    cuff: { x: 385, y: 405, w: 150, h: 110 },
    pocket: { x: 565, y: 405, w: 82, h: 110 },
  },
};
const TALL: typeof WIDE = {
  w: 600,
  h: 1000,
  at: {
    front: { x: 170, y: 0, w: 260, h: 430 },
    back: { x: 0, y: 470, w: 185, h: 300 },
    skirt: { x: 205, y: 470, w: 185, h: 270 },
    sleeve: { x: 410, y: 470, w: 190, h: 185 },
    cuff: { x: 410, y: 680, w: 190, h: 100 },
    collar: { x: 0, y: 805, w: 270, h: 115 },
    pocket: { x: 300, y: 790, w: 95, h: 125 },
  },
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2); // power3.inOut
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t)); // expo.out

function useViewport() {
  const [vp, setVp] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return vp;
}

/* The outline in px, and the seam allowance: the same outline pushed out
   from the piece's centre */
const outline = (pts: Pt[], w: number, h: number, grow = 0) => {
  const cx = w / 2;
  const cy = h / 2;
  return pts
    .map(([x, y]) => {
      const px = x * w;
      const py = y * h;
      const len = Math.hypot(px - cx, py - cy) || 1;
      return `${(px + ((px - cx) / len) * grow).toFixed(1)},${(py + ((py - cy) / len) * grow).toFixed(1)}`;
    })
    .join(" ");
};

function Grain({ dir, w, h }: { dir: "v" | "h"; w: number; h: number }) {
  const v = dir === "v";
  const len = (v ? h : w) * 0.42;
  const x1 = v ? w * 0.5 : w * 0.5 - len / 2;
  const y1 = v ? h * 0.52 - len / 2 : h * 0.5;
  const x2 = v ? x1 : x1 + len;
  const y2 = v ? y1 + len : y1;
  const a = 5;
  return (
    <g stroke="var(--cloud)" strokeOpacity="0.7" strokeWidth="1" fill="none">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      {v ? (
        <path d={`M${x1 - a} ${y1 + a * 1.4} L${x1} ${y1} L${x1 + a} ${y1 + a * 1.4} M${x2 - a} ${y2 - a * 1.4} L${x2} ${y2} L${x2 + a} ${y2 - a * 1.4}`} />
      ) : (
        <path d={`M${x1 + a * 1.4} ${y1 - a} L${x1} ${y1} L${x1 + a * 1.4} ${y1 + a} M${x2 - a * 1.4} ${y2 - a} L${x2} ${y2} L${x2 - a * 1.4} ${y2 + a}`} />
      )}
    </g>
  );
}

export function Layout({ progress, onExit, onDone }: LoaderProps) {
  const shown = useShown(progress, 2.2);
  const vp = useViewport();
  const root = useRef<HTMLDivElement>(null);
  const [leave, setLeave] = useState(0);
  const [unfold, setUnfold] = useState(0);

  // the copy rises from its masks, as the hero's opening does
  useEffect(() => {
    const el = root.current;
    if (!el || !vp) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.15 });
      textIn(tl, el.querySelectorAll("[data-rise]"), 0);
    }, el);
    return () => ctx.revert();
  }, [vp]);

  const phase = useExit(shown >= 1, 500, { onExit, onDone }, (end) => {
    // the rest leave quickly (EASE.in), the copy drops back into its masks,
    // then the bodice front unfolds into the frame (EASE.inOut)
    const el = root.current;
    if (el) gsap.to(el.querySelectorAll("[data-rise]"), { yPercent: -HIDDEN, duration: DUR.base, ease: EASE.in, stagger: 0.05 });
    let stop2: (() => void) | undefined;
    const stop1 = tween(600, easeInCubic, setLeave);
    const t = setTimeout(() => {
      stop2 = tween(DUR.reveal * 1000, easeInOutCubic, setUnfold, end);
    }, 380);
    return () => {
      stop1();
      stop2?.();
      clearTimeout(t);
    };
  });

  if (!vp)
    return (
      <div className="ld">
        <SrProgress value={shown} />
        <Crown />
      </div>
    );

  const { w: vw, h: vh } = vp;
  const phone = vw < 768;
  const plan = phone ? TALL : WIDE;
  // the free area: under the logo, over the copy, clear of the Vote tab
  const area = phone
    ? { x: 16, y: vh * 0.12, w: vw - 16 - 58, h: vh * 0.5 }
    : { x: vw * 0.07, y: vh * 0.13, w: vw * 0.86 - 50, h: vh * 0.55 };
  const s = Math.min(area.w / plan.w, area.h / plan.h);
  const ox = area.x + (area.w - plan.w * s) / 2;
  const oy = area.y + (area.h - plan.h * s) / 2;

  const e = Math.min(1, shown);
  const n = PIECES.length;
  const placed = PIECES.filter((_, i) => e >= (i / n) * 0.85 + 0.12).length;
  const fade = 1 - leave;

  // the ruler: one centimetre per paper square, filled to the progress
  const rulerW = phone ? vw - 32 - 50 : Math.min(vw * 0.5, 720);
  const cms = Math.floor(rulerW / CM);
  const measured = e * cms;

  return (
    <div ref={root} className="ld">
      <SrProgress value={shown} />
      {/* Crown stays until the frame has nearly filled the screen, so the
          unfolding outline only ever opens onto sky */}
      <Crown style={{ opacity: 1 - Math.max(0, (unfold - 0.75) / 0.25) }} />
      {/* the pattern paper, as the hero's hand-off, in light lines */}
      <div className="ld-paper-light absolute inset-0" style={{ opacity: fade }} aria-hidden="true" />

      {/* the logo, where the site logo sits */}
      <LogoMark className="absolute left-[var(--gutter)] top-[calc(var(--head-gap)+60px)] w-[clamp(32px,3.4vw,49px)] text-[var(--cornflower)] md:top-[var(--head-gap)]" style={{ opacity: fade }} />

      <p className="ld-label absolute right-[var(--gutter)] top-[calc(var(--head-gap)+70px)] text-[var(--navy)] md:top-[calc(var(--head-gap)+10px)]" style={{ opacity: fade }}>
        <span className="line-mask inline-block"><span data-rise className="inline-block">Pieces {placed} / {n}</span></span>
      </p>

      {/* the pieces */}
      {PIECES.map((p, i) => {
        const b = plan.at[p.key];
        const w = b.w * s;
        const h = b.h * s;
        const x = ox + b.x * s;
        const y = oy + b.y * s;
        const t0 = (i / n) * 0.85;
        const kLine = easeInOutCubic(clamp01((e - t0) / 0.14));
        const kImg = easeOutExpo(clamp01((e - t0 - 0.08) / 0.18));
        // pieces in the light upper part of Crown draw in ink, the lower in cloud
        const ink = y + h / 2 < vh * 0.42;
        const line = ink ? "var(--ink)" : "var(--cloud)";

        if (p.hero && unfold > 0) {
          // unfolding: the box grows to the screen while the outline's
          // points travel to the box edges
          const k = unfold;
          const fx = x * (1 - k);
          const fy = y * (1 - k);
          const fw = w + (vw - w) * k;
          const fh = h + (vh - h) * k;
          const poly = p.pts
            .map((pt) => {
              const [px, py, tx = px, ty = py] = pt as [number, number, number?, number?];
              return `${((px + (tx - px) * k) * 100).toFixed(2)}% ${((py + (ty - py) * k) * 100).toFixed(2)}%`;
            })
            .join(", ");
          return (
            <div key={p.key} className="ld-piece is-unfolding" style={{ left: fx, top: fy, width: fw, height: fh, clipPath: `polygon(${poly})`, zIndex: 50 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} alt="" draggable={false} />
            </div>
          );
        }

        const poly = p.pts.map(([px, py]) => `${(px * 100).toFixed(2)}% ${(py * 100).toFixed(2)}%`).join(", ");
        const away = p.hero ? 1 : fade;
        return (
          <div key={p.key} className="absolute" style={{ left: x, top: y, width: w, height: h, opacity: away, translate: `0 ${(1 - kImg) * 14 + (p.hero ? 0 : leave * 14)}px` }}>
            <div className="ld-piece" style={{ inset: 0, clipPath: `polygon(${poly})`, opacity: kImg }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} alt="" draggable={false} decoding="async" />
            </div>
            <svg className="absolute inset-0 overflow-visible" width={w} height={h} aria-hidden="true" style={{ opacity: fade }}>
              {/* seam allowance, dashed, then the seam line drawing round */}
              <polygon points={outline(p.pts, w, h, 9)} fill="none" stroke={line} strokeOpacity={0.35 * kLine} strokeWidth="1" strokeDasharray="4 4" />
              <polygon points={outline(p.pts, w, h)} fill="none" stroke={line} strokeOpacity="0.8" strokeWidth="1" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - kLine} />
              <g opacity={kImg}>
                <Grain dir={p.grain} w={w} h={h} />
              </g>
            </svg>
            {/* labels only where they fit: name from 90px wide, the cutting note from 130px */}
            {w >= 90 && (
              <p className="ld-label absolute left-[10%] top-[12%] text-[var(--cloud)]" style={{ opacity: kImg * fade }}>
                {p.name}
                {w >= 130 && <span className="block opacity-60">{p.note}</span>}
              </p>
            )}
          </div>
        );
      })}

      {/* the copy, in the hero's type */}
      <div className="absolute inset-x-[var(--gutter)] bottom-[max(168px,21svh)] grid gap-4 text-[var(--cloud)] md:bottom-[max(196px,24svh)] md:grid-cols-[1fr_auto] md:items-end">
        <h2 className="ld-title">
          <span className="line-mask"><span data-rise className="block">Laying out</span></span>
          <span className="line-mask">
            <span data-rise className="block">
              <span className="hero-title__serif">your</span> pattern
            </span>
          </span>
        </h2>
        <p className="ld-line md:max-w-[230px]">
          <span className="line-mask"><span data-rise className="block">Seven pieces, drafted to your measurements, placed on the paper.</span></span>
        </p>
      </div>

      {/* the ruler measures the load */}
      <div className="absolute bottom-[max(92px,12svh)] left-[var(--gutter)] text-[var(--cloud)]" style={{ width: rulerW, opacity: fade }}>
        <div className="ld-ruler" style={{ "--cm": `${CM}px`, "--fill": `${measured * CM}px` } as CSSProperties}>
          {Array.from({ length: Math.floor(cms / 5) + 1 }, (_, k) => (
            <span key={k} className="ld-ruler__n" style={{ left: k * 5 * CM }}>
              {k * 5}
            </span>
          ))}
          <span className="ld-ruler__head" style={{ left: measured * CM }} />
        </div>
        <p className="ld-label mt-2 flex justify-between">
          <span>{phase === "load" ? "Measuring" : "Measured"}</span>
          <span className="tabular-nums">
            {measured.toFixed(1)} / {cms} cm
          </span>
        </p>
      </div>
    </div>
  );
}
