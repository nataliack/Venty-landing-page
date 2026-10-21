"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import "./wy.css";

/* 5. What you can make: "Same idea. A different body every time." (Jose's
   concept, copy option 1.) Four women in a row, four different bodies, all
   in the same outfit, each cut to her. Change the outfit and all four are
   dressed again: the new one pulls on from the top, one after another,
   a cornflower hem line running down ahead of it.

   PLACEHOLDERS: the figures are drawn from each body's own measures (so
   every outfit follows every body); Jose's photographs replace them. Each
   column is a stack of layers, one per outfit, so photos drop into the same
   slots: <img> per body per outfit, the transition unchanged.

   Controls: the outfit bar (a chip per outfit, its sketch and name, the
   one on shows a fill while it plays), arrows, keys (left, right), a swipe
   on the row. It plays by itself while on screen until you choose one. */

type Body = { id: string; name: string; h: number; m: [number, number, number] };
const BODIES: Body[] = [
  { id: "mei", name: "Mei", h: 152, m: [82, 64, 88] },
  { id: "natalia", name: "Natalia", h: 168, m: [92, 74, 98] },
  { id: "amara", name: "Amara", h: 170, m: [112, 96, 118] },
  { id: "ines", name: "Ines", h: 182, m: [86, 70, 94] },
];

type OutfitKey = "gown" | "slip" | "wrap" | "puffer";
const OUTFITS: { k: OutfitKey; name: string; short: string; line: string; icon: string }[] = [
  { k: "gown", name: "Halter gown", short: "Gown", line: "Organdy, floor length", icon: "M10 3h4l2 6-1 1 4 11H5l4-11-1-1z" },
  { k: "slip", name: "Slip dress", short: "Slip", line: "Bias-cut silk, midi", icon: "M9 3l-1 5 1 1-2 12h10L15 9l1-1-1-5" },
  { k: "wrap", name: "Wrap top, wide-leg trousers", short: "Wrap", line: "Linen and wool", icon: "M7 4l5 3 5-3 1 6H6zM8 11h8l1 10h-4l-1-6-1 6H7z" },
  { k: "puffer", name: "Cropped puffer, A-line skirt", short: "Puffer", line: "Quilted nylon, cotton twill", icon: "M6 4h12l1 7H5zM8 12h8l3 9H5z" },
];

/* ---- the placeholder figure: drawn from the body ------------------------ */
const VW = 100;
const GROUND = 232;
function geo(b: Body) {
  const fh = 214 * (b.h / 182);
  const y0 = GROUND - fh;
  const y = (f: number) => +(y0 + f * fh).toFixed(2);
  const k = 0.15;
  const [bu, wa, hi] = b.m;
  const B = bu * k;
  const W = wa * k;
  const H = hi * k;
  return { fh, y, B, W, H, S: B * 1.02, N: fh * 0.02, c: VW / 2 };
}
type G = ReturnType<typeof geo>;
const f = (n: number) => n.toFixed(2);
/** a path mirrored about the centre line: pts are the left side, top to bottom */
const mirror = (g: G, pts: [number, number][], close = true) => {
  const L = pts.map(([dx, yy]) => `${f(g.c - dx)} ${f(yy)}`);
  const R = [...pts].reverse().map(([dx, yy]) => `${f(g.c + dx)} ${f(yy)}`);
  return `M${[...L, ...R].join(" L")}${close ? " Z" : ""}`;
};
function bodyPaths(g: G) {
  const { y, B, W, H, S, N, c } = g;
  const torso = `M${f(c - N)} ${y(0.165)} L${f(c - S)} ${y(0.19)} Q${f(c - B - 1)} ${y(0.24)} ${f(c - B)} ${y(0.28)} Q${f(c - W - 1)} ${y(0.34)} ${f(c - W)} ${y(0.385)} Q${f(c - H)} ${y(0.43)} ${f(c - H)} ${y(0.5)} L${f(c - H * 0.9)} ${y(0.57)} L${f(c - H * 0.55)} ${y(0.76)} L${f(c - H * 0.36)} ${y(0.965)} L${f(c - H * 0.12)} ${y(0.965)} L${f(c - 1.1)} ${y(0.6)} L${f(c + 1.1)} ${y(0.6)} L${f(c + H * 0.12)} ${y(0.965)} L${f(c + H * 0.36)} ${y(0.965)} L${f(c + H * 0.55)} ${y(0.76)} L${f(c + H * 0.9)} ${y(0.57)} L${f(c + H)} ${y(0.5)} Q${f(c + H)} ${y(0.43)} ${f(c + W)} ${y(0.385)} Q${f(c + W + 1)} ${y(0.34)} ${f(c + B)} ${y(0.28)} Q${f(c + B + 1)} ${y(0.24)} ${f(c + S)} ${y(0.19)} L${f(c + N)} ${y(0.165)} Z`;
  const arm = (s: 1 | -1) => `M${f(c + s * S * 0.94)} ${y(0.2)} Q${f(c + s * (H + 3.2))} ${y(0.33)} ${f(c + s * (H + 2.2))} ${y(0.5)}`;
  return { torso, arms: [arm(-1), arm(1)], head: { cx: c, cy: y(0.065), rx: g.fh * 0.046, ry: g.fh * 0.062 }, neck: `M${f(c - N)} ${y(0.115)} H${f(c + N)} V${y(0.175)} H${f(c - N)} Z` };
}
/** the outfit, cut to this body */
function outfitPaths(k: OutfitKey, g: G): { d: string; cls: string }[] {
  const { y, B, W, H, S, N, c } = g;
  const sleeve = (s: 1 | -1, to: number) => `M${f(c + s * S * 0.94)} ${y(0.2)} Q${f(c + s * (H + 3.4))} ${y(0.31)} ${f(c + s * (H + 2.7))} ${y(to)}`;
  switch (k) {
    case "gown":
      return [
        { d: `M${f(c - 1.5)} ${y(0.165)} L${f(c - B * 0.92)} ${y(0.25)} Q${f(c - B - 0.6)} ${y(0.3)} ${f(c - W - 0.4)} ${y(0.385)} Q${f(c - H - 1)} ${y(0.5)} ${f(c - H * 1.9)} ${y(0.985)} Q${f(c)} ${y(1.005)} ${f(c + H * 1.9)} ${y(0.985)} Q${f(c + H + 1)} ${y(0.5)} ${f(c + W + 0.4)} ${y(0.385)} Q${f(c + B + 0.6)} ${y(0.3)} ${f(c + B * 0.92)} ${y(0.25)} L${f(c + 1.5)} ${y(0.165)} Z`, cls: "is-gown" },
        { d: `M${f(c - W)} ${y(0.385)} Q${f(c)} ${y(0.4)} ${f(c + W)} ${y(0.385)}`, cls: "is-seamline" },
      ];
    case "slip":
      return [
        { d: `M${f(c - B * 0.78)} ${y(0.235)} L${f(c + B * 0.78)} ${y(0.235)} L${f(c + B + 0.4)} ${y(0.285)} Q${f(c + W + 0.7)} ${y(0.34)} ${f(c + W + 0.6)} ${y(0.385)} Q${f(c + H + 0.9)} ${y(0.47)} ${f(c + H * 1.28)} ${y(0.79)} Q${f(c)} ${y(0.805)} ${f(c - H * 1.28)} ${y(0.79)} Q${f(c - H - 0.9)} ${y(0.47)} ${f(c - W - 0.6)} ${y(0.385)} Q${f(c - W - 0.7)} ${y(0.34)} ${f(c - B - 0.4)} ${y(0.285)} Z`, cls: "is-slip" },
        { d: `M${f(c - B * 0.7)} ${y(0.24)} L${f(c - S * 0.62)} ${y(0.185)} M${f(c + B * 0.7)} ${y(0.24)} L${f(c + S * 0.62)} ${y(0.185)}`, cls: "is-strap" },
      ];
    case "wrap":
      return [
        { d: `M${f(c - W - 0.7)} ${y(0.385)} Q${f(c - H - 0.9)} ${y(0.45)} ${f(c - H - 0.9)} ${y(0.53)} L${f(c - H * 1.05)} ${y(0.975)} L${f(c - H * 0.08)} ${y(0.975)} L${f(c)} ${y(0.62)} L${f(c + H * 0.08)} ${y(0.975)} L${f(c + H * 1.05)} ${y(0.975)} L${f(c + H + 0.9)} ${y(0.53)} Q${f(c + H + 0.9)} ${y(0.45)} ${f(c + W + 0.7)} ${y(0.385)} Z`, cls: "is-trousers" },
        { d: sleeve(-1, 0.4), cls: "is-sleeve is-top" },
        { d: sleeve(1, 0.4), cls: "is-sleeve is-top" },
        { d: `M${f(c - N - 1)} ${y(0.168)} L${f(c - S - 1)} ${y(0.19)} Q${f(c - B - 1.6)} ${y(0.25)} ${f(c - B - 0.6)} ${y(0.29)} Q${f(c - W - 0.3)} ${y(0.35)} ${f(c - W - 0.9)} ${y(0.405)} L${f(c + W + 0.9)} ${y(0.405)} Q${f(c + W + 0.3)} ${y(0.35)} ${f(c + B + 0.6)} ${y(0.29)} Q${f(c + B + 1.6)} ${y(0.25)} ${f(c + S + 1)} ${y(0.19)} L${f(c + N + 1)} ${y(0.168)} L${f(c)} ${y(0.27)} Z`, cls: "is-top" },
        { d: `M${f(c - N - 0.5)} ${y(0.17)} L${f(c + W * 0.7)} ${y(0.4)}`, cls: "is-seamline" },
      ];
    case "puffer":
      return [
        { d: `M${f(c - W - 0.6)} ${y(0.385)} L${f(c + W + 0.6)} ${y(0.385)} L${f(c + H * 1.6)} ${y(0.84)} Q${f(c)} ${y(0.86)} ${f(c - H * 1.6)} ${y(0.84)} Z`, cls: "is-skirt" },
        { d: sleeve(-1, 0.47), cls: "is-sleeve is-puffer" },
        { d: sleeve(1, 0.47), cls: "is-sleeve is-puffer" },
        { d: mirror(g, [[N + 2, y(0.152)], [S + 3.2, y(0.19)], [B + 3.6, y(0.27)], [B + 3, y(0.405)]]), cls: "is-puffer" },
        { d: [0.25, 0.31, 0.37].map((t) => `M${f(c - B - 3)} ${y(t)} Q${f(c)} ${y(t + 0.012)} ${f(c + B + 3)} ${y(t)}`).join(" "), cls: "is-quilt" },
      ];
  }
}

function Figure({ b }: { b: Body }) {
  const g = geo(b);
  const p = bodyPaths(g);
  return (
    <svg viewBox={`0 0 ${VW} 240`} className="wy-fig" aria-hidden="true">
      <ellipse cx={g.c} cy={GROUND + 1} rx={g.H * 2.3} ry={3.2} className="wy-fig__pool" />
      {p.arms.map((d, i) => (
        <path key={i} d={d} className="wy-fig__arm" style={{ strokeWidth: g.fh * 0.032 }} />
      ))}
      <path d={p.neck} className="wy-fig__skin" />
      <path d={p.torso} className="wy-fig__skin" />
      <ellipse {...p.head} className="wy-fig__skin" />
    </svg>
  );
}
function Outfit({ b, k }: { b: Body; k: OutfitKey }) {
  const g = geo(b);
  return (
    <svg viewBox={`0 0 ${VW} 240`} className="wy-fig" aria-hidden="true">
      {outfitPaths(k, g).map((o, i) => (
        <path key={i} d={o.d} className={`wy-wear ${o.cls}`} style={o.cls.includes("is-sleeve") ? { strokeWidth: g.fh * (o.cls.includes("is-puffer") ? 0.062 : 0.04) } : undefined} />
      ))}
    </svg>
  );
}

/* ---- the section ------------------------------------------------------------ */
const PLAY_MS = 5200;
export function SameOutfit() {
  const root = useRef<HTMLElement>(null);
  const [at, setAt] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [n, setN] = useState(0); // counts changes, so each pull plays afresh
  const [auto, setAuto] = useState(true);
  const [seen, setSeen] = useState(false);
  const clear = useRef(0);
  const swipe = useRef<number | null>(null);

  const atRef = useRef(0);
  const go = useCallback((i: number, byHand = true) => {
    const next = ((i % OUTFITS.length) + OUTFITS.length) % OUTFITS.length;
    if (byHand) setAuto(false);
    const cur = atRef.current;
    if (cur === next) return;
    atRef.current = next;
    setPrev(cur);
    setAt(next);
    setN((x) => x + 1);
    window.clearTimeout(clear.current);
    // the old outfit goes once the last column has its new one on
    clear.current = window.setTimeout(() => setPrev(null), 1500);
  }, []);

  // it plays by itself while on screen, until you choose
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!auto || !seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => go(at + 1, false), PLAY_MS);
    return () => window.clearTimeout(t);
  }, [auto, seen, at, go]);
  useEffect(() => () => window.clearTimeout(clear.current), []);

  const o = OUTFITS[at];
  return (
    <div data-lenis-prevent className="absolute inset-0 overflow-y-auto overflow-x-hidden">
      <section
        ref={root}
        className="wy"
        aria-labelledby="wy-title"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(at + 1);
          if (e.key === "ArrowLeft") go(at - 1);
        }}
      >
        <header className="wy-head">
          <div>
            <p className="wy-eyebrow">What you can make</p>
            <h2 id="wy-title" className="wy-title">
              <span>Same idea.</span> <span>A different body every time.</span>
            </h2>
          </div>
          <p className="wy-lede">Start from one of our patterns or from anything you&apos;ve saved: a photo, a sketch, a few words. Whatever you choose is drafted to the body you measured, not to a size.</p>
        </header>

        {/* the outfit bar */}
        <div className="wy-bar">
          <button type="button" className="wy-arrow" onClick={() => go(at - 1)} aria-label="Previous outfit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <div className="wy-chips" role="tablist" aria-label="Outfit">
            {OUTFITS.map((x, i) => (
              <button
                key={x.k}
                type="button"
                role="tab"
                aria-selected={i === at}
                className={`wy-chip ${i === at ? "is-on" : ""} ${i === at && auto && seen ? "is-playing" : ""}`}
                onClick={() => go(i)}
                style={{ "--play": `${PLAY_MS}ms` } as CSSProperties}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
                  <path d={x.icon} />
                </svg>
                <span className="wy-chip__name">
                  <span className="is-full">{x.name}</span>
                  <span className="is-short">{x.short}</span>
                </span>
                <span key={`${at}-${n}`} className="wy-chip__fill" aria-hidden="true" />
              </button>
            ))}
          </div>
          <button type="button" className="wy-arrow" onClick={() => go(at + 1)} aria-label="Next outfit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* the line-up */}
        <div
          className="wy-stage"
          onPointerDown={(e) => (swipe.current = e.clientX)}
          onPointerUp={(e) => {
            if (swipe.current === null) return;
            const dx = e.clientX - swipe.current;
            swipe.current = null;
            if (Math.abs(dx) > 40) go(at + (dx < 0 ? 1 : -1));
          }}
        >
          {/* the outfit's name, huge, behind them */}
          <p className="wy-behind" aria-hidden="true">
            <span key={n}>{o.name.split(",")[0]}</span>
          </p>
          <ol className="wy-row">
            {BODIES.map((b, i) => (
              <li key={b.id} className="wy-col" style={{ "--i": i } as CSSProperties}>
                <span className="wy-light" aria-hidden="true" />
                <div className="wy-person">
                  <Figure b={b} />
                  {prev !== null && (
                    <div className="wy-layer is-prev">
                      <Outfit b={b} k={OUTFITS[prev].k} />
                    </div>
                  )}
                  <div key={n} className={`wy-layer ${n ? "is-in" : ""}`}>
                    <Outfit b={b} k={o.k} />
                  </div>
                  {n > 0 && <span key={`hem-${n}`} className="wy-hem" aria-hidden="true" />}
                </div>
                <p className="wy-label">
                  <b>{b.name}</b>
                  <span>
                    {b.h} cm · {b.m[0]} · {b.m[1]} · {b.m[2]}
                  </span>
                </p>
              </li>
            ))}
          </ol>
          <p className="wy-now" aria-live="polite">
            <span key={n} className="wy-now__in">
              <b>{o.name}</b> {o.line}. One pattern, drafted four ways.
            </span>
          </p>
          <p className="wy-legend">Height · bust · waist · hip, in cm</p>
        </div>
      </section>
    </div>
  );
}
