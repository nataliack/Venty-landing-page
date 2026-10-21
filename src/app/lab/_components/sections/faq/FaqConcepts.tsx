"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type RefObject } from "react";
import { End, Shell, useBox } from "../hc/parts";
import "./faq-lab.css";

/* FAQ, three concepts (lab). All three on the app's graph paper (its light
   hero's grid, venty-app globals.css .light-mat: cornflower lines every 96px
   at 12%, every 24px at 6%) on the page's own cloud, with the questions as the site's
   glass cards (white glass, a 20px blur, a hairline, 28px corners), and a
   pair of scissors that cuts as you scroll: its blades close and open, snip
   by snip, as it goes.

   1. Cut line: the React Bits FAQ 4 layout. The title holds on the left;
      down between it and the questions runs a cutting line, and the
      scissors cut down it as you read.
   2. Cut out: each question is cut out of the paper as it comes into view
      (the scissors run round its edge), then lifts off it.
   3. Pattern piece: the questions sit inside one pattern piece, its outline
      dashed on the paper; the scissors cut all the way round it as you
      scroll, and once round, the piece lifts free. */

/* Every answer here is something the landing page already says (How it
   works, Features); nothing new is promised. Anything about the app's
   handling of data, pricing or units needs the app's facts first. */
const QA = [
  {
    q: "How accurate is the fit?",
    a: "As accurate as the measurements you give it. Venty drafts every piece from your numbers, and each measure shows where the tape goes. For anything close-fitting, sew a quick test version first, adjust your body in Venty and draft again.",
  },
  {
    q: "Which measurements do I need?",
    a: "Four to start: bust, waist, hips and back length. Venty shows you where the tape goes for each one. Add more whenever you want a closer fit.",
  },
  {
    q: "What can I make?",
    a: "Dresses, tops, trousers and skirts. Start from a photo or a few words, choose how close it should sit, and Venty drafts the pieces.",
  },
  {
    q: "Do I need to be an experienced sewist?",
    a: "No. If you can cut along a line and sew a straight seam, you can start. Fit is described in plain words, and every piece is labelled with grainlines and notches.",
  },
  {
    q: "Can I start from a photo?",
    a: "Yes. Upload a photo of a garment you love, or describe it in a sentence. Circle what you like on the photo and pin a note, and Venty reads your marks.",
  },
  {
    q: "Can I change the design once it's drafted?",
    a: "Yes. Say what to change the way you'd say it, like longer sleeves, and Venty redrafts the pieces. Every version is kept with its notes.",
  },
  {
    q: "Can I see it before I print?",
    a: "Yes. Venty shows the garment on your body in 3D. Turn it round, then see the flat pieces it's cut from.",
  },
  {
    q: "How do I print my pattern?",
    a: "On A4 at home, or A0 at a print shop. Move the pieces round the sheet to use less paper. The A4 pages come with a map for taping them together.",
  },
  {
    q: "What's marked on each piece?",
    a: "Grainlines, notches and labels on every piece, so you know which way it goes on the fabric and how the pieces meet.",
  },
  {
    q: "Can I make patterns for someone else?",
    a: "Yes. Measure anyone you sew for and keep their body in your library, saved and dated, next to your own.",
  },
  {
    q: "Can I print a pattern again later?",
    a: "Any time. Every pattern stays in your library with its versions and notes.",
  },
  {
    // TO CONFIRM against how the app actually handles data before launch
    q: "What happens to my photos and measurements?",
    a: "They're used to draft your patterns and are kept in your account. You can delete a photo or a body whenever you like.",
  },
];

/* ---- shared pieces ------------------------------------------------------- */

/** The scissors: the line icon (two rings, two blades), pointing right with
    the pivot in the middle. Its two halves turn about the pivot, so it snips:
    open, 0 shut, 1 wide. */
function Scissors({ open, className = "", style }: { open: number; className?: string; style?: CSSProperties }) {
  const a = 3 + open * 19; // each half's turn off the line, in degrees
  // one half: its ring behind the pivot, its blade through it to the point
  const half = (flip: boolean) => (
    <g transform={`${flip ? "scale(1 -1) " : ""}rotate(${a})`}>
      <circle cx="-10" cy="-5" r="3.6" />
      <path d="M-7 -3.4 L 0 0 L 13 1.2" />
    </g>
  );
  return (
    <svg viewBox="-16 -12 32 24" className={`qx-sc ${className}`} style={style} aria-hidden="true" fill="none">
      {half(false)}
      {half(true)}
      <circle r="0.9" className="qx-sc__pin" />
    </svg>
  );
}

/** snips: open, shut, open... as t runs 0 to 1, n times */
const snip = (t: number, n: number) => 0.5 - 0.5 * Math.cos(t * n * Math.PI * 2);

/** how far through an element the scroll is: 0 as its top reaches `from`
    of the box's height, 1 as its bottom reaches `to` */
function useProgress(ref: RefObject<HTMLElement | null>, from = 0.75, to = 0.5) {
  const box = useBox();
  const [p, setP] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!box || !el) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      const start = b.top + b.height * from; // the element's top here: 0
      const end = b.top + b.height * to; // its bottom here: 1
      const total = r.height + (start - end);
      setP(Math.min(1, Math.max(0, (start - r.top) / Math.max(1, total))));
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    box.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(raf);
      box.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, [box, ref, from, to]);
  return p;
}

/** an element's size, kept up to date */
function useSize(ref: RefObject<HTMLElement | null>) {
  const [s, setS] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setS({ w: el.offsetWidth, h: el.offsetHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return s;
}

/** a rounded rectangle's outline (x, y from its box's corner, `inset` in),
    as SVG draws a rect: from the top edge's start, clockwise. Its length,
    and the point (and the way the outline runs there) at a share `p` of it */
function along(w: number, h: number, r: number, inset: number, p: number) {
  const W = Math.max(0, w - inset * 2);
  const H = Math.max(0, h - inset * 2);
  const rr = Math.min(r, W / 2, H / 2);
  const arc = (Math.PI * rr) / 2;
  const segs = [W - 2 * rr, arc, H - 2 * rr, arc, W - 2 * rr, arc, H - 2 * rr, arc];
  const len = segs.reduce((s, x) => s + x, 0);
  let d = Math.min(len, Math.max(0, p * len));
  const o = inset;
  // corners' centres, clockwise from the top right
  const C = [
    [o + W - rr, o + rr],
    [o + W - rr, o + H - rr],
    [o + rr, o + H - rr],
    [o + rr, o + rr],
  ];
  for (let k = 0; k < 8; k++) {
    const s = segs[k];
    if (d <= s || k === 7) {
      const f = s ? d / s : 0;
      if (k % 2 === 0) {
        // a straight edge: top (right), right (down), bottom (left), left (up)
        const e = k / 2;
        if (e === 0) return { len, x: o + rr + f * s, y: o, a: 0 };
        if (e === 1) return { len, x: o + W, y: o + rr + f * s, a: 90 };
        if (e === 2) return { len, x: o + W - rr - f * s, y: o + H, a: 180 };
        return { len, x: o, y: o + H - rr - f * s, a: 270 };
      }
      // a corner: turning a quarter
      const c = (k - 1) / 2;
      const start = -90 + c * 90; // the angle round its centre where it begins
      const th = ((start + f * 90) * Math.PI) / 180;
      const [cx, cy] = C[c];
      return { len, x: cx + rr * Math.cos(th), y: cy + rr * Math.sin(th), a: start + f * 90 + 90 };
    }
    d -= s;
  }
  return { len, x: o + rr, y: o, a: 0 };
}

function Head({ center = false }: { center?: boolean }) {
  return (
    <header data-in className={`qx-head ${center ? "is-center" : ""}`}>
      <p className="qx-eyebrow">FAQ</p>
      <h2 className="qx-title">Before you cut.</h2>
      <p className="qx-lede">The questions people ask before their first pattern.</p>
    </header>
  );
}

function Item({ n, q, a, open, onToggle }: { n: number; q: string; a: string; open: boolean; onToggle: () => void }) {
  const id = useId();
  return (
    <div className={`qx-item ${open ? "is-open" : ""}`}>
      <h3>
        <button type="button" className="qx-q" aria-expanded={open} aria-controls={id} onClick={onToggle}>
          <span className="qx-q__n">Q{n}</span>
          <span className="qx-q__t">{q}</span>
          <span className="qx-q__icon" aria-hidden="true" />
        </button>
      </h3>
      <div id={id} className="qx-a" role="region" aria-label={q}>
        <div className="qx-a__in">
          <p>{a}</p>
        </div>
      </div>
    </div>
  );
}

function Paper({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`qx ${className}`}>
      <div className="qx-paper" aria-hidden="true" />
      {children}
    </section>
  );
}

/* ---- 1. Cut line ------------------------------------------------------- */

function CutLine() {
  const list = useRef<HTMLDivElement>(null);
  const p = useProgress(list, 0.7, 0.45);
  const [open, setOpen] = useState(0);
  return (
    <Paper className="qx-1">
      <div className="qx-1__grid">
        <div className="qx-1__side">
          <Head />
        </div>
        <div ref={list} className="qx-1__list">
          {/* the cutting line, cut behind the scissors, dashed ahead of them */}
          <div className="qx-1__line" aria-hidden="true" style={{ "--p": p } as CSSProperties}>
            <span className="qx-1__cut" />
            <Scissors open={snip(p, QA.length * 2)} className="qx-1__sc" />
          </div>
          <div data-in className="qx-items">
            {QA.map((x, i) => (
              <Item key={x.q} n={i + 1} q={x.q} a={x.a} open={open === i} onToggle={() => setOpen((o) => (o === i ? -1 : i))} />
            ))}
          </div>
        </div>
      </div>
    </Paper>
  );
}

/* ---- 2. Cut out ---------------------------------------------------------- */

function CutCard({ n, x, open, onToggle }: { n: number; x: (typeof QA)[number]; open: boolean; onToggle: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const p = useProgress(ref, 0.92, 0.72);
  const size = useSize(ref);
  const pt = along(size.w, size.h, 28, 1, p);
  const len = pt.len;
  const done = p >= 1;
  return (
    <div ref={ref} className={`qx-2__slot ${done ? "is-cut" : ""}`}>
      {/* the outline on the paper: cut behind the scissors, dashed ahead */}
      <svg className="qx-2__outline" aria-hidden="true">
        <rect x="1" y="1" rx="28" className="qx-2__dash" width={Math.max(0, size.w - 2)} height={Math.max(0, size.h - 2)} />
        <rect
          x="1"
          y="1"
          rx="28"
          className="qx-2__cutpath"
          width={Math.max(0, size.w - 2)}
          height={Math.max(0, size.h - 2)}
          style={{ strokeDasharray: `${len * p} ${len}` }}
        />
      </svg>
      {!done && p > 0 && (
        <Scissors
          open={snip(p, 10)}
          className="qx-2__sc"
          style={{ transform: `translate(${pt.x}px, ${pt.y}px) translate(-50%, -50%) rotate(${pt.a}deg)` }}
        />
      )}
      <div className="qx-2__card">
        <Item n={n} q={x.q} a={x.a} open={open} onToggle={onToggle} />
      </div>
    </div>
  );
}

function CutOut() {
  const [open, setOpen] = useState(-1);
  return (
    <Paper className="qx-2">
      <div className="qx-2__in">
        <Head center />
        <div className="qx-2__list">
          {QA.map((x, i) => (
            <CutCard key={x.q} n={i + 1} x={x} open={open === i} onToggle={() => setOpen((o) => (o === i ? -1 : i))} />
          ))}
        </div>
      </div>
    </Paper>
  );
}

/* ---- 3. Pattern piece ------------------------------------------------------- */

function PatternPiece() {
  const piece = useRef<HTMLDivElement>(null);
  const p = useProgress(piece, 0.8, 0.55);
  const size = useSize(piece);
  const pt = along(size.w, size.h, 40, 2, p);
  const len = pt.len;
  const [open, setOpen] = useState(0);
  const done = p >= 1;
  return (
    <Paper className="qx-3">
      <div className="qx-3__in">
        <Head center />
        <div ref={piece} className={`qx-3__piece ${done ? "is-cut" : ""}`}>
          <svg className="qx-3__outline" aria-hidden="true">
            <rect x="2" y="2" rx="40" className="qx-3__dash" width={Math.max(0, size.w - 4)} height={Math.max(0, size.h - 4)} />
            <rect
                  x="2"
              y="2"
              rx="40"
              className="qx-3__cutpath"
              width={Math.max(0, size.w - 4)}
              height={Math.max(0, size.h - 4)}
              style={{ strokeDasharray: `${len * p} ${len}` }}
            />
          </svg>
          {/* notches along the edge, as a printed pattern piece has */}
          <span className="qx-3__notch is-a" aria-hidden="true" />
          <span className="qx-3__notch is-b" aria-hidden="true" />
          <span className="qx-3__grain" aria-hidden="true">
            Grainline
          </span>
          {!done && p > 0 && (
            <Scissors
              open={snip(p, 24)}
              className="qx-3__sc"
              style={{ transform: `translate(${pt.x}px, ${pt.y}px) translate(-50%, -50%) rotate(${pt.a}deg)` }}
            />
          )}
          <div className="qx-3__sheet">
            {QA.map((x, i) => (
              <Item key={x.q} n={i + 1} q={x.q} a={x.a} open={open === i} onToggle={() => setOpen((o) => (o === i ? -1 : i))} />
            ))}
          </div>
        </div>
      </div>
    </Paper>
  );
}

/* ---- 4. Pattern lines --------------------------------------------------------
   React Bits' FAQ 4, open: no cards, the questions float between dashed
   guide lines (stitching lines), a small mark on the guide at each one. The
   guides fade out top and bottom, as the graph paper does. Six questions,
   the ones asked first. */

const QA_SHORT = [0, 1, 2, 3, 7, 11].map((i) => QA[i]);

function LinesRow({ n, q, a, open, onToggle }: { n: number; q: string; a: string; open: boolean; onToggle: () => void }) {
  const id = useId();
  return (
    <div className={`qp-row ${open ? "is-open" : ""}`}>
      <span className="qp-mark" aria-hidden="true" />
      <h3>
        <button type="button" className="qp-q" aria-expanded={open} aria-controls={id} onClick={onToggle}>
          <span className="qp-n">Q{n}</span>
          <span className="qp-t">{q}</span>
          <span className="qp-btn" aria-hidden="true" />
        </button>
      </h3>
      <div id={id} className="qp-a" role="region" aria-label={q}>
        <div className="qp-a__in">
          <p>{a}</p>
        </div>
      </div>
      {/* the stitching line under it */}
      <span className="qp-stitch" aria-hidden="true" />
    </div>
  );
}

function PatternLines() {
  const [open, setOpen] = useState(0);
  return (
    <Paper className="qp">
      <div className="qp-frame">
        {/* the guides: stitching lines, fading out top and bottom */}
        <div className="qp-guides" aria-hidden="true">
          <span className="qp-guide is-l" />
          <span className="qp-guide is-m" />
          <span className="qp-guide is-r" />
        </div>
        <div className="qp-side">
          <header data-in className="qp-head">
            <span className="qp-mark is-head" aria-hidden="true" />
            <p className="qx-eyebrow">FAQ</p>
            <h2 className="qx-title">Before you cut.</h2>
            <p className="qp-body">The questions people ask before their first pattern.</p>
          </header>
        </div>
        <div className="qp-list">
          {QA_SHORT.map((x, i) => (
            <LinesRow key={x.q} n={i + 1} q={x.q} a={x.a} open={open === i} onToggle={() => setOpen((o) => (o === i ? -1 : i))} />
          ))}
        </div>
      </div>
    </Paper>
  );
}

/* ---- the lab's pages ------------------------------------------------------- */

const Lead = () => <div className="qx-lead" aria-hidden="true" />;

export function FaqCutLine() {
  return (
    <Shell>
      <Lead />
      <CutLine />
      <section className="hc-sec">
        <End />
      </section>
    </Shell>
  );
}
export function FaqCutOut() {
  return (
    <Shell>
      <Lead />
      <CutOut />
      <section className="hc-sec">
        <End />
      </section>
    </Shell>
  );
}
export function FaqPatternPiece() {
  return (
    <Shell>
      <Lead />
      <PatternPiece />
      <section className="hc-sec">
        <End />
      </section>
    </Shell>
  );
}

export function FaqPatternLines() {
  return (
    <Shell>
      <Lead />
      <PatternLines />
      <section className="hc-sec">
        <End />
      </section>
    </Shell>
  );
}
