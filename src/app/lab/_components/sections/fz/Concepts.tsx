"use client";

import { useRef, useState, type CSSProperties } from "react";
import { FEATS, FIRST_FRAME, Shell, Visual, clamp, hold, useScrub, useTurn } from "./parts";

/* Features as scroll pieces: four concepts. Each pins a stage and lets the
   scroll play it; low fidelity, for the idea and the motion only. */

const N = FEATS.length;

/* ---- Turn ------------------------------------------------------------------
   She holds the stage. One scroll turns her a full 360°, and the six
   features come to her one at a time, left and right of her in turn, each
   with its card. A rail along the bottom keeps the count. */
export function FzTurn() {
  const wrap = useRef<HTMLElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const [turnImg, setTurn] = useTurn();
  const [at, setAt] = useState(0);
  useScrub(wrap, (p) => {
    setTurn(p * 360);
    fill.current?.style.setProperty("--p", String(p));
    const i = Math.min(N - 1, Math.floor(p * N));
    setAt((o) => (o === i ? o : i));
  });
  const f = FEATS[at];
  return (
    <Shell>
      <section ref={wrap} className="fz-pin-wrap" style={{ height: `${N * 90 + 100}svh` }}>
        <div className="fz-stage fz-turnst">
          <div className="fz-turnst__model">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={turnImg} src={FIRST_FRAME} alt="The model turning to show the garment all the way round" draggable={false} />
            <span className="fz-turnst__deg" aria-hidden="true">
              {Math.round((at / N) * 360)}°
            </span>
          </div>
          <div key={f.k} className={`fz-turnst__panel ${at % 2 ? "is-right" : ""}`}>
            <p className="fz-n">{f.n}</p>
            <h3 className="fz-h">{f.t}</h3>
            <p className="fz-p">{f.s}</p>
            {f.k !== "body" && <Visual k={f.k} className="fz-turnst__card" />}
          </div>
          <ol className="fz-rail" aria-label="Features">
            <span ref={fill} className="fz-rail__fill" aria-hidden="true" />
            {FEATS.map((x, i) => (
              <li key={x.k} className={i === at ? "is-on" : i < at ? "is-past" : ""}>
                {x.w}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </Shell>
  );
}

/* ---- Flip pad -----------------------------------------------------------------
   A pad of pattern sheets bound along the top. Each feature is one sheet;
   the scroll lifts the top sheet up and over its binding, like a flip
   calendar, and the stack underneath steps forward. Sheets alternate
   cloud, cornflower and ink. */
export function FzFlip() {
  const wrap = useRef<HTMLElement>(null);
  const sheets = useRef<(HTMLDivElement | null)[]>([]);
  const [turnImg, setTurn] = useTurn();
  useScrub(wrap, (p) => {
    const t = p * (N - 1);
    setTurn(p * 360);
    sheets.current.forEach((el, i) => {
      if (!el) return;
      const q = hold(clamp(t - i)); // how far this sheet has flipped
      const depth = clamp(i - t, 0, 4); // sheets still above it
      el.style.setProperty("--q", q.toFixed(4));
      el.style.setProperty("--depth", depth.toFixed(4));
    });
  });
  return (
    <Shell>
      <section ref={wrap} className="fz-pin-wrap" style={{ height: `${N * 90 + 100}svh` }}>
        <div className="fz-stage fz-flip">
          <div className="fz-flip__pad">
            {FEATS.map((f, i) => (
              <div
                key={f.k}
                ref={(el) => {
                  sheets.current[i] = el;
                }}
                className={`fz-sheetp is-c${i % 3}`}
                style={{ zIndex: N - i } as CSSProperties}
              >
                <div className="fz-sheetp__copy">
                  <p className="fz-n">{f.n}</p>
                  <h3 className="fz-h is-xl">{f.t}</h3>
                  <p className="fz-p">{f.s}</p>
                </div>
                <Visual k={f.k} turnRef={f.k === "body" ? turnImg : undefined} className="fz-sheetp__vis" />
              </div>
            ))}
            <div className="fz-flip__rings" aria-hidden="true">
              {Array.from({ length: 14 }, (_, i) => (
                <span key={i} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}

/* ---- Zoom through ------------------------------------------------------------
   Every feature is a full screen with a window in its centre, and through
   the window is the next feature. The scroll flies you into the window:
   the screen grows past you and the next one fills the view, its own
   window already showing the one after. */
export function FzZoom() {
  const wrap = useRef<HTMLElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const [turnImg, setTurn] = useTurn();
  useScrub(wrap, (p) => {
    const raw = p * (N - 1);
    const t = Math.floor(raw) + hold(raw - Math.floor(raw), 0.12);
    setTurn(p * 360);
    layers.current.forEach((el, i) => {
      if (!el) return;
      const z = t - i; // 0: this one fills the screen; -1: it sits in the window
      const show = z > -2.2 && z < 1;
      el.style.visibility = show ? "visible" : "hidden";
      if (!show) return;
      el.style.transform = `scale(${Math.pow(3, z).toFixed(4)})`;
      el.style.opacity = String(z > 0.55 ? clamp(1 - (z - 0.55) / 0.35) : 1);
    });
  });
  return (
    <Shell>
      <section ref={wrap} className="fz-pin-wrap" style={{ height: `${N * 100 + 100}svh` }}>
        <div className="fz-stage fz-zoom">
          {FEATS.map((f, i) => (
            <div
              key={f.k}
              ref={(el) => {
                layers.current[i] = el;
              }}
              className={`fz-layer is-c${i % 3}`}
              style={{ zIndex: i + 1 }}
            >
              <div className="fz-layer__copy">
                <p className="fz-n is-big">{f.n}</p>
                <h3 className="fz-h is-xl">{f.t}</h3>
              </div>
              <p className="fz-p fz-layer__body">{f.s}</p>
              <span className="fz-layer__window" aria-hidden="true">
                {i === N - 1 && <span className="fz-layer__last">Start your first pattern</span>}
              </span>
              <Visual k={f.k} turnRef={f.k === "body" ? turnImg : undefined} className="fz-layer__vis" />
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}

/* ---- Cutting table ------------------------------------------------------------
   The six features are pattern pieces laid out on a cutting mat, each at
   its own angle, a cutting line running piece to piece. The screen is a
   camera over the table: the scroll lifts it off one piece (the table
   shows), carries it along the line and sets it down square on the next. */
const PIECES = [
  { x: 640, y: 560, w: 600, h: 720, r: -7, d: "M6 4 L94 0 L100 96 L52 100 L0 94 Z" },
  { x: 1520, y: 420, w: 660, h: 520, r: 5, d: "M0 8 Q50 0 100 8 L96 100 L4 100 Z" },
  { x: 2420, y: 700, w: 640, h: 780, r: -4, d: "M14 0 L86 0 L100 30 L94 100 L6 100 L0 30 Z" },
  { x: 2160, y: 1580, w: 640, h: 500, r: 9, d: "M0 0 L100 6 L96 94 L4 100 Z" },
  { x: 1300, y: 1440, w: 660, h: 560, r: -5, d: "M4 6 L48 0 L96 4 L100 100 L0 96 Z" },
  { x: 460, y: 1560, w: 600, h: 540, r: 4, d: "M0 0 L100 0 L100 80 L80 100 L0 100 Z" },
];
const WORLD = { w: 2960, h: 2100 };
export function FzTable() {
  const wrap = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const line = useRef<SVGPathElement>(null);
  const [turnImg, setTurn] = useTurn();
  useScrub(wrap, (p) => {
    const st = stage.current;
    const w = world.current;
    if (!st || !w) return;
    const vw = st.clientWidth;
    const vh = st.clientHeight;
    const raw = p * (N - 1);
    const i = Math.min(N - 2, Math.floor(raw));
    const f = raw - i;
    const e = hold(f, 0.16);
    const a = PIECES[i];
    const b = PIECES[i + 1];
    // the camera: between two pieces, lifted off the table in the middle
    const x = a.x + (b.x - a.x) * e;
    const y = a.y + (b.y - a.y) * e;
    const r = a.r + (b.r - a.r) * e;
    const fit = Math.min((vh * 0.82) / 800, (vw * 0.92) / 680);
    const z = fit * (1 - 0.5 * Math.sin(Math.PI * e));
    w.style.transform = `translate(${vw / 2}px, ${vh / 2}px) scale(${z.toFixed(4)}) rotate(${-r}deg) translate(${-x}px, ${-y}px)`;
    line.current?.style.setProperty("stroke-dashoffset", String(1 - p));
    setTurn(p * 360);
  });
  const path = PIECES.map((c, i) => `${i ? "L" : "M"}${c.x} ${c.y}`).join(" ");
  return (
    <Shell>
      <section ref={wrap} className="fz-pin-wrap" style={{ height: `${N * 100 + 100}svh` }}>
        <div ref={stage} className="fz-stage fz-table">
          <div ref={world} className="fz-world" style={{ width: WORLD.w, height: WORLD.h }}>
            <svg className="fz-world__line" width={WORLD.w} height={WORLD.h} aria-hidden="true">
              <path d={path} className="fz-world__ghost" />
              <path ref={line} d={path} pathLength={1} className="fz-world__cut" />
            </svg>
            {/* the mat's rulers */}
            <div className="fz-world__ruler" aria-hidden="true">
              {Array.from({ length: 29 }, (_, i) => (
                <span key={i}>{i * 10}</span>
              ))}
            </div>
            {PIECES.map((c, i) => {
              const f = FEATS[i];
              return (
                <div key={f.k} className="fz-piece" style={{ left: c.x - c.w / 2, top: c.y - c.h / 2, width: c.w, height: c.h, rotate: `${c.r}deg` }}>
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    <path d={c.d} className="fz-piece__paper" />
                    <path d={c.d} className="fz-piece__seam" transform="translate(50 50) scale(0.94) translate(-50 -50)" />
                  </svg>
                  <div className="fz-piece__in">
                    <p className="fz-n">
                      {f.n} · Cut 1
                    </p>
                    <h3 className="fz-h">{f.t}</h3>
                    <p className="fz-p">{f.s}</p>
                    <Visual k={f.k} turnRef={f.k === "body" ? turnImg : undefined} className="fz-piece__vis" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </Shell>
  );
}
