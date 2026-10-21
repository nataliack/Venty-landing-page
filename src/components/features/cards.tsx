"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent, type ReactNode } from "react";
import { MARK, MARK_BOUNDS } from "@/lib/markFlight";
import { TURN, turnPosition } from "@/lib/turnSequence";

/* Features: the bento's cards, each a small working piece of the app
   (ported from the lab, src/app/lab/_components/sections/fz). Content is
   a stand-in for the final copy and images; the UI reads as the app's.
   Classes: ftc- (the cards), ftp- (the phones). */

/* ---- icons (24 x 24, currentColor) ---- */
const I = {
  plus: "M12 5v14M5 12h14",
  pen: "M4 20l4-1L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4zM14 6l3 3",
  erase: "M7 20h10M5.5 13.5l7-7a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L12 17H8z",
  pin: "M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  print: "M7 9V4h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v6H7z",
};
function Icon({ d, size = 18, weight = 1.6 }: { d: string; size?: number; weight?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/* ---- her turn, as plain frames: fetched once, when the card comes near ---- */
const frameSrc = (i: number) => `/features/turn/frames/${String(i + 1).padStart(4, "0")}.webp`;
const FIRST_FRAME = frameSrc(0);
let warmed = false;
function warmTurn() {
  if (warmed) return;
  warmed = true;
  for (let i = 0; i < TURN.frames; i++) {
    const im = new Image();
    im.src = frameSrc(i);
  }
}
/** an <img> of the turn; set(deg) shows her at that angle. The frames load
    when `near` (the card) comes within a screen of view */
function useTurn(near: React.RefObject<HTMLElement | null>) {
  const img = useRef<HTMLImageElement>(null);
  const last = useRef(-1);
  useEffect(() => {
    const el = near.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        warmTurn();
        io.disconnect();
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);
  const set = (deg: number) => {
    const f = Math.round(turnPosition(deg));
    if (f === last.current || !img.current) return;
    last.current = f;
    img.current.src = frameSrc(f);
  };
  return [img, set] as const;
}

const CIRCLE = "M12 4a8 8 0 1 0 0 16a8 8 0 0 0 0-16z";
const SEND = "M12 19V5M5.5 11.5L12 5l6.5 6.5";
// turning a piece: a sheet with an arrow round its corner, each way
const TURN_L = "M12 5h6a2 2 0 0 1 2 2v3M15 8l-3-3 3-3M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2";
const TURN_R = "M12 5H6a2 2 0 0 0-2 2v3M9 8l3-3-3-3M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2";
const SPARK = "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6";

/** the Venty bird, small, as an avatar */
function Bird({ size = 14 }: { size?: number }) {
  const b = MARK_BOUNDS;
  return (
    <svg width={size} height={size} viewBox={`${b.x} ${b.y - (b.width - b.height) / 2} ${b.width} ${b.width}`} fill="currentColor" aria-hidden="true">
      <path d={MARK} />
    </svg>
  );
}

/* ---- Mark up your references -------------------------------------------
   A prototype of Jose's idea: the reference sits whole; tap a note (or its
   pin) and the picture pushes in to that detail, macro, and a selection is
   drawn round it. Tap another and it pulls back out first, then pushes in
   to the next; tap the same again, or "Whole look", to pull out.

   Here the push-in is the still photo scaled (a stand-in). The real thing
   is one short clip per detail, each starting on this exact still and
   ending on its macro; going back out plays it in reverse. See DETAILS for
   what each clip ends on. The selections stay drawn in code so they're
   always sharp. The photo's units: 880 x 1339. */
const DETAILS = [
  { n: 1, note: "Keep this neckline, a touch deeper", pin: [0.67, 0.3], at: [0.473, 0.336], z: 2.6, sel: <ellipse cx="416" cy="452" rx="150" ry="98" /> },
  { n: 2, note: "This mesh and print, same weight", pin: [0.72, 0.52], at: [0.47, 0.53], z: 2.3, sel: <rect x="252" y="570" width="326" height="276" rx="34" /> },
  { n: 3, note: "5 cm longer, straight hem", pin: [0.2, 0.655], at: [0.5, 0.69], z: 2.2, sel: null },
];
const OUT_MS = 560; // the pull-out before pushing in to another detail
const SEL_FADE_MS = 300; // a selection's fade out (.ftc-sel): its ants march until it's gone
export function MarkCard() {
  const [tool, setTool] = useState("pen");
  const [on, setOn] = useState<number | null>(null);
  const [aim, setAim] = useState<number | null>(null); // where the zoom is centred (kept while pulling out)
  const [fading, setFading] = useState<number | null>(null); // the detail whose selection is fading out
  const t = useRef(0);
  const fadeT = useRef(0);
  useEffect(
    () => () => {
      window.clearTimeout(t.current);
      window.clearTimeout(fadeT.current);
    },
    [],
  );
  // pull out of the detail in hand, if any
  const out = () => {
    if (on === null) return;
    setFading(on);
    window.clearTimeout(fadeT.current);
    fadeT.current = window.setTimeout(() => setFading(null), SEL_FADE_MS);
    setOn(null);
  };
  const pick = (n: number | null) => {
    window.clearTimeout(t.current);
    if (n === on || n === null) return out();
    if (on === null) {
      setAim(n);
      return setOn(n);
    }
    // out of this detail, then in to the next
    out();
    t.current = window.setTimeout(() => {
      setAim(n);
      setOn(n);
    }, OUT_MS);
  };
  const a = DETAILS.find((x) => x.n === (on ?? aim)) ?? DETAILS[0];
  return (
    <div className="ftc-mark">
      <div className={`ftc-mark__frame ${on ? "is-in" : ""}`}>
        <div
          className="ftc-mark__fig"
          style={{ "--ftc-z": on ? a.z : 1, transformOrigin: `${a.at[0] * 100}% ${a.at[1] * 100}%` } as CSSProperties}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/features/ref-jersey.webp" alt="The reference: a cropped jersey, marked up" draggable={false} loading="lazy" decoding="async" />
          <svg viewBox="0 0 880 1339" aria-hidden="true">
            {DETAILS.map((x) => x.sel && <g key={x.n} className={`ftc-sel ${on === x.n ? "is-on" : fading === x.n ? "is-fading" : ""}`}>{x.sel}</g>)}
            <g className={`ftc-hem ${on === 3 ? "is-on" : ""}`}>
              <path className="ftc-hem__now" d="M60 878 H820" />
              <path className="ftc-hem__new" d="M60 978 H820" />
              <path className="ftc-hem__arrow" d="M720 892 V962 M700 942 L720 964 L740 942" />
            </g>
          </svg>
          <span className={`ftc-chip ${on === 3 ? "is-on" : ""}`} style={{ left: "82%", top: "73%" }}>
            +5 cm
          </span>
          {DETAILS.map((x) => (
            <button
              key={x.n}
              type="button"
              className={`ftc-pin ${on === x.n ? "is-on" : ""} ${on && on !== x.n ? "is-away" : ""}`}
              style={{ left: `${x.pin[0] * 100}%`, top: `${x.pin[1] * 100}%` }}
              onClick={() => pick(x.n)}
              aria-label={`Note ${x.n}: ${x.note}`}
              aria-pressed={on === x.n}
            >
              {x.n}
            </button>
          ))}
        </div>
        <div className="ftc-tools" role="toolbar" aria-label="Mark-up tools">
          {[
            ["pen", I.pen, "Draw"],
            ["ring", CIRCLE, "Ring"],
            ["pin", I.pin, "Pin a note"],
            ["erase", I.erase, "Erase"],
          ].map(([k, dd, label]) => (
            <button key={k} type="button" aria-pressed={tool === k} onClick={() => setTool(k)} aria-label={label} title={label}>
              <Icon d={dd} size={15} />
            </button>
          ))}
        </div>
        <button type="button" className="ftc-mark__out" onClick={() => pick(null)} tabIndex={on ? 0 : -1}>
          Whole look
        </button>
      </div>
      <div className="ftc-mark__side">
        <p className="ftc-label">
          Notes <span>{DETAILS.length}</span>
        </p>
        <ol className="ftc-notes">
          {DETAILS.map((x) => (
            <li key={x.n}>
              <button type="button" className={on === x.n ? "is-on" : ""} onClick={() => pick(x.n)} aria-pressed={on === x.n}>
                <span className="ftc-notes__n">{x.n}</span>
                {x.note}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ---- Refine in plain words ------------------------------------------------
   A chat: the pattern it's about at the top, your message, Venty's answer
   with what it changed, and the composer. */
export function RefineCard() {
  return (
    <div className="ftc-chat">
      <header className="ftc-chat__head">
        <span className="ftc-chat__file">Slip dress</span>
        <span className="ftc-tag">v2 → v3</span>
      </header>
      <div className="ftc-chat__log">
        <p className="ftc-bubble is-me">5 cm longer, wider straps.</p>
        <div className="ftc-reply">
          <span className="ftc-avatar">
            <Bird size={12} />
          </span>
          <div className="ftc-reply__body">
            <p className="ftc-bubble">Done. Four pieces redrafted.</p>
            <p className="ftc-diff">
              <span>Hem +5 cm</span>
              <span>Straps 3 cm</span>
            </p>
          </div>
        </div>
      </div>
      <div className="ftc-compose">
        <span>Ask for a change…</span>
        <span className="ftc-compose__send" aria-hidden="true">
          <Icon d={SEND} size={14} weight={2} />
        </span>
      </div>
    </div>
  );
}

/* ---- See it on your body ---------------------------------------------------
   Her turn, feathered into the card; drag her, or the slider under her (a
   plain track, filled cornflower up to where she is). "Drag to turn" sits
   there until you do, and keeps out of the way while you are. */
export function TurnCard() {
  const box = useRef<HTMLDivElement>(null);
  const [img, set] = useTurn(box);
  const [deg, setDeg] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; d: number } | null>(null);
  const to = (d: number) => {
    const v = Math.round(((d % 360) + 360) % 360);
    setDeg(v);
    set(v);
  };
  const end = () => {
    drag.current = null;
    setDragging(false);
  };
  return (
    <div ref={box} className={`ftc-turn ${dragging ? "is-dragging" : ""}`}>
      <div
        className="ftc-turn__stage"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, d: deg };
          setDragging(true);
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {}
        }}
        onPointerMove={(e) => drag.current && to(drag.current.d + (e.clientX - drag.current.x) * 0.7)}
        onPointerUp={end}
        onPointerCancel={end}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={img} src={FIRST_FRAME} alt="The model in the garment; drag or use the slider to turn her" draggable={false} loading="lazy" decoding="async" />
        <span className="ftc-turn__hint" aria-hidden="true">
          Drag to turn
        </span>
      </div>
      <input
        type="range"
        className="ftc-slider"
        min={0}
        max={359}
        value={deg}
        onChange={(e) => to(+e.target.value)}
        onPointerDown={() => setDragging(true)}
        onPointerUp={() => setDragging(false)}
        style={{ "--v": `${(deg / 359) * 100}%` } as CSSProperties}
        aria-label="Turn her"
        aria-valuetext={`${deg} degrees`}
      />
    </div>
  );
}

/* ---- Body library -------------------------------------------------------------
   The person you're drafting for on a dress form drawn from her own
   measurements (switch person and the form reshapes to them), her three
   measurements drawn across it and listed beside it, the date they were
   taken; the others saved, as avatars to switch to. A photo can take the
   form's place later. */
const BODIES = [
  { id: "natalia", name: "Natalia", when: "Measured 12 Oct", m: [92, 74, 98] },
  { id: "mei", name: "Mei", when: "Measured 3 Sep", m: [86, 68, 92] },
  { id: "amara", name: "Amara", when: "Measured 28 Aug", m: [101, 86, 106] },
];
/** a dress form, 100 x 160, from bust, waist and hip in cm. Half-widths
    grow from Natalia's (92, 74, 98) at a little more than true scale, so
    the difference between people reads at this size */
function formOf([bust, waist, hip]: number[]) {
  const c = 50;
  const B = 33 + (bust - 92) * 0.9;
  const W = 26.6 + (waist - 74) * 0.9;
  const H = 35.3 + (hip - 98) * 0.9;
  const S = B * 0.9;
  const p = (n: number) => n.toFixed(1);
  return {
    d: `M${p(c - 6)} 8 H${p(c + 6)} V15 Q${p(c + S * 0.55)} 17 ${p(c + S)} 30 Q${p(c + B + 2)} 42 ${p(c + B)} 52 Q${p(c + B - 1)} 72 ${p(c + W)} 88 Q${p(c + W)} 102 ${p(c + H)} 118 Q${p(c + H + 1)} 129 ${p(c + H - 5)} 135 H${p(c - H + 5)} Q${p(c - H - 1)} 129 ${p(c - H)} 118 Q${p(c - W)} 102 ${p(c - W)} 88 Q${p(c - B + 1)} 72 ${p(c - B)} 52 Q${p(c - B - 2)} 42 ${p(c - S)} 30 Q${p(c - S * 0.55)} 17 ${p(c - 6)} 15 Z`,
    lines: [
      { y: 52, r: B + 4 },
      { y: 88, r: W + 4 },
      { y: 118, r: H + 4 },
    ].map(({ y, r }) => `M${p(c - r)} ${y} H${p(c + r)} M${p(c - r)} ${y - 3} V${y + 3} M${p(c + r)} ${y - 3} V${y + 3}`),
  };
}
export function BodiesCard() {
  const [at, setAt] = useState(0);
  const b = BODIES[at];
  const form = formOf(b.m);
  // the path in CSS too, so the form reshapes smoothly where the browser can
  const d = (s: string) => ({ d: `path("${s}")` }) as CSSProperties;
  return (
    <div className="ftc-bodies">
      <svg viewBox="0 0 100 160" className="ftc-form" aria-hidden="true">
        <path d={form.d} style={d(form.d)} className="ftc-form__body" />
        <path d="M50 135 V152 M36 154 H64" className="ftc-form__stand" />
        {form.lines.map((l, i) => (
          <path key={i} d={l} style={d(l)} className="ftc-form__m" />
        ))}
      </svg>
      <div className="ftc-bodies__side">
        <p className="ftc-person">
          {b.name}
          <span>{b.when}</span>
        </p>
        <dl className="ftc-measures">
          {["Bust", "Waist", "Hip"].map((k, i) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>
                {b.m[i]}
                <small> cm</small>
              </dd>
            </div>
          ))}
        </dl>
        <div className="ftc-people" role="group" aria-label="Saved bodies">
          {BODIES.map((p, i) => (
            <button key={p.id} type="button" aria-pressed={i === at} onClick={() => setAt(i)} title={p.name}>
              {p.name[0]}
            </button>
          ))}
          <span className="ftc-people__add" aria-hidden="true">
            <Icon d={I.plus} size={13} />
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---- Arrange and print ----------------------------------------------------------
   The pieces on the sheet, as printed tissue: drag them about, turn the one
   you've picked 15° either way, or let Venty pack them. On A4 the sheet is
   the grid of home pages it tiles across, and the count says how many
   pages the pieces touch (pack them and it drops); on A0 it is one sheet. */
type Piece = { id: string; label: string; d: string; w: number; h: number; x: number; y: number; r: number };
const SHEET = { w: 112, h: 82, cols: 4, rows: 3 };
const TILE = { w: SHEET.w / SHEET.cols, h: SHEET.h / SHEET.rows };
const START: Piece[] = [
  { id: "front", label: "FRONT", d: "M6 0 L15 0 L17 6 Q21 8 24 11 L22.5 30 L1.5 30 L0 11 Q3 8 6 6 Z", w: 24, h: 30, x: 4, y: 5, r: -15 },
  { id: "back", label: "BACK", d: "M3 0 Q11 2.6 19 0 L22 30 L0 30 Z", w: 22, h: 30, x: 62, y: 9, r: 10 },
  { id: "skirt", label: "SKIRT", d: "M6 0 L18 0 L24 40 L0 40 Z", w: 24, h: 40, x: 34, y: 37, r: 0 },
  { id: "sleeve", label: "SLEEVE", d: "M0 18 Q3.5 5 15 0 Q26.5 5 30 18 Z", w: 30, h: 18, x: 77, y: 56, r: -30 },
  { id: "facing", label: "FACING", d: "M0 3 Q9 -1 18 3 L18 7 Q9 3 0 7 Z", w: 18, h: 7, x: 88, y: 4, r: 0 },
];
// packed: on the six home pages top left (three across, two down), none touching
const PACKED: Record<string, Pick<Piece, "x" | "y" | "r">> = {
  front: { x: 1, y: 1, r: 0 },
  back: { x: 27, y: 1, r: 0 },
  skirt: { x: 51, y: 1, r: 0 },
  sleeve: { x: 1, y: 33, r: 0 },
  facing: { x: 33, y: 40, r: 0 },
};
/** a piece's box on the sheet at any angle (it turns about its middle) */
const box = (p: Piece) => {
  const a = (p.r * Math.PI) / 180;
  const c = Math.abs(Math.cos(a));
  const sn = Math.abs(Math.sin(a));
  const w = p.w * c + p.h * sn;
  const h = p.w * sn + p.h * c;
  return { x: p.x + p.w / 2 - w / 2, y: p.y + p.h / 2 - h / 2, w, h };
};
const clampTo = (p: Piece): Piece => {
  const b = box(p);
  const dx = Math.max(0, -b.x) - Math.max(0, b.x + b.w - SHEET.w);
  const dy = Math.max(0, -b.y) - Math.max(0, b.y + b.h - SHEET.h);
  return { ...p, x: p.x + dx, y: p.y + dy };
};
const pagesOf = (ps: Piece[]) => {
  let n = 0;
  for (let r = 0; r < SHEET.rows; r++)
    for (let c = 0; c < SHEET.cols; c++) {
      const tx = c * TILE.w;
      const ty = r * TILE.h;
      if (ps.some((p) => ((b) => b.x < tx + TILE.w && b.x + b.w > tx && b.y < ty + TILE.h && b.y + b.h > ty)(box(p)))) n++;
    }
  return n;
};
const norm = (r: number) => ((((r + 180) % 360) + 360) % 360) - 180;
export function PrintCard() {
  const [a0, setA0] = useState(false);
  const [pieces, setPieces] = useState<Piece[]>(START);
  const [sel, setSel] = useState("skirt");
  const [dragging, setDragging] = useState(false);
  const svg = useRef<SVGSVGElement>(null);
  const grab = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const at = (e: RPointerEvent) => {
    const m = svg.current!.getScreenCTM()!.inverse();
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m);
    return { x: pt.x, y: pt.y };
  };
  const turn = (by: number) => setPieces((l) => l.map((p) => (p.id === sel ? clampTo({ ...p, r: norm(p.r + by) }) : p)));
  const picked = pieces.find((p) => p.id === sel)!;
  const pages = pagesOf(pieces);
  const stop = () => {
    grab.current = null;
    setDragging(false);
  };
  return (
    <div className="ftc-arrange">
      <div className="ftc-arrange__canvas">
        <svg
          ref={svg}
          viewBox={`-2 -2 ${SHEET.w + 4} ${SHEET.h + 4}`}
          className={dragging ? "is-dragging" : ""}
          onPointerMove={(e) => {
            const g = grab.current;
            if (!g) return;
            const { x, y } = at(e);
            setPieces((l) => l.map((p) => (p.id === g.id ? clampTo({ ...p, x: x - g.dx, y: y - g.dy }) : p)));
          }}
          onPointerUp={stop}
          onPointerCancel={stop}
        >
          <rect x="0" y="0" width={SHEET.w} height={SHEET.h} rx="1.2" className="ftc-sheet" />
          {!a0 &&
            Array.from({ length: SHEET.rows * SHEET.cols }, (_, i) => {
              const x = (i % SHEET.cols) * TILE.w;
              const y = Math.floor(i / SHEET.cols) * TILE.h;
              return (
                <g key={i}>
                  <rect x={x} y={y} width={TILE.w} height={TILE.h} className="ftc-page" />
                  <text x={x + 1.4} y={y + 3.6} className="ftc-page__no">
                    {i + 1}
                  </text>
                </g>
              );
            })}
          {pieces.map((p) => (
            <g
              key={p.id}
              className={`ftc-pc ${sel === p.id ? "is-sel" : ""}`}
              style={{ transform: `translate(${p.x}px, ${p.y}px) rotate(${p.r}deg)`, transformOrigin: `${p.w / 2}px ${p.h / 2}px` }}
              onPointerDown={(e) => {
                e.stopPropagation();
                const { x, y } = at(e);
                grab.current = { id: p.id, dx: x - p.x, dy: y - p.y };
                setSel(p.id);
                setDragging(true);
                try {
                  svg.current!.setPointerCapture(e.pointerId);
                } catch {}
              }}
            >
              <path d={p.d} className="ftc-pc__paper" />
              <path d={p.d} className="ftc-pc__seam" transform={`translate(${p.w / 2} ${p.h / 2}) scale(0.86) translate(${-p.w / 2} ${-p.h / 2})`} />
              <path d={`M${p.w / 2} ${p.h * 0.25} V${p.h * 0.75} M${p.w / 2 - 1.2} ${p.h * 0.25 + 1.6} L${p.w / 2} ${p.h * 0.25} L${p.w / 2 + 1.2} ${p.h * 0.25 + 1.6}`} className="ftc-pc__grain" />
              <text x={p.w / 2 + 1.6} y={p.h / 2} className="ftc-pc__t">
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="ftc-arrange__panel">
        <div className="ftc-seg" role="group" aria-label="Paper">
          <button type="button" aria-pressed={!a0} onClick={() => setA0(false)}>
            <b>A4</b> At home
          </button>
          <button type="button" aria-pressed={a0} onClick={() => setA0(true)}>
            <b>A0</b> Print shop
          </button>
        </div>
        <div className="ftc-count">
          <b>{a0 ? "1" : pages}</b>
          <span>{a0 ? "sheet" : `of ${SHEET.rows * SHEET.cols} pages`}</span>
        </div>
        <div className="ftc-picked">
          <span className="ftc-picked__name">
            {picked.label.toLowerCase()}
            <small>{Math.round(picked.r)}°</small>
          </span>
          <button type="button" className="ftc-iconbtn" onClick={() => turn(-15)} aria-label="Turn the piece 15 degrees left" title="Turn left">
            <Icon d={TURN_L} size={15} />
          </button>
          <button type="button" className="ftc-iconbtn" onClick={() => turn(15)} aria-label="Turn the piece 15 degrees right" title="Turn right">
            <Icon d={TURN_R} size={15} />
          </button>
        </div>
        <button type="button" className="ftc-ghost is-primary" onClick={() => setPieces((l) => l.map((p) => clampTo({ ...p, ...PACKED[p.id] })))}>
          <Icon d={SPARK} size={14} /> Pack the pieces
        </button>
      </div>
    </div>
  );
}


/* ---- Pattern library, on the phone ------------------------------------------- */
type Row = { id: number; name: string; who: string; status: "Printed" | "Fitting" | "Draft"; g: string; drafting?: boolean };

// the garments, flat (24 x 24 sketches)
const G: Record<string, string> = {
  dress: "M9 3h6l1 5-2 1 3 12H7l3-12-2-1z",
  skirt: "M7 4h10l3 16H4z",
  shirt: "M8 3l4 2 4-2 4 3-2 4-2-1v11H8V9L6 10 4 6z",
  trousers: "M7 3h10l1 18h-4l-2-11-2 11H6z",
  top: "M8 4l4 1 4-1 3 4-3 2v10H8V10L5 8z",
  jacket: "M8 3l4 3 4-3 4 4-2 3v11H6V10L4 7z",
};
const SEED: Row[] = [
  { id: 1, name: "Flutter midi dress", who: "Natalia", status: "Printed", g: "dress" },
  { id: 2, name: "Bias slip skirt", who: "Natalia", status: "Fitting", g: "skirt" },
  { id: 3, name: "Camp collar shirt", who: "Mei", status: "Draft", g: "shirt" },
  { id: 4, name: "Wide-leg trousers", who: "Amara", status: "Printed", g: "trousers" },
  { id: 5, name: "Wrap top", who: "Mei", status: "Fitting", g: "top" },
];
// what drafts in, in turn
const NEXT = [
  { name: "Cropped puffer", who: "Natalia", g: "jacket" },
  { name: "Halter gown", who: "Amara", g: "dress" },
  { name: "Pleated midi skirt", who: "Mei", g: "skirt" },
];

function PhoneBird({ size = 16 }: { size?: number }) {
  const b = MARK_BOUNDS;
  return (
    <svg width={size} height={size} viewBox={`${b.x} ${b.y - (b.width - b.height) / 2} ${b.width} ${b.width}`} fill="currentColor" aria-hidden="true">
      <path d={MARK} />
    </svg>
  );
}

/** the device: a titanium frame (its antenna bands, the buttons on its
    sides), the black border round the glass, the island, a sheen across
    the glass; the screen is its child */
function Device({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`ftp ${className}`} aria-hidden={className.includes("is-back") || undefined}>
      <span className="ftp__btn is-l1" />
      <span className="ftp__btn is-l2" />
      <span className="ftp__btn is-l3" />
      <span className="ftp__btn is-r1" />
      <span className="ftp__band is-tl" />
      <span className="ftp__band is-tr" />
      <span className="ftp__band is-bl" />
      <span className="ftp__band is-br" />
      <div className="ftp__glass">
        <div className="ftp__screen">
          <span className="ftp__island" />
          {children}
        </div>
        <span className="ftp__sheen" />
      </div>
    </div>
  );
}

/** a phone behind: the same screen in blocks */
function Ghost({ side }: { side: "l" | "r" }) {
  return (
    <Device className={`is-back is-${side}`}>
      <div className="ftp__ghost">
        <div className="ftp__ghost-head">
          <span className="is-dot" />
          <span className="is-bar" />
          <span className="is-dot" />
        </div>
        <span className="ftp__ghost-search" />
        <ul>
          {[52, 69, 56, 73, 60].map((w, i) => (
            <li key={i}>
              <span className="is-thumb" />
              <span className="is-lines">
                <span style={{ width: `${w}%` }} />
                <span style={{ width: `${w + 14}%` }} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Device>
  );
}

export function PhoneCard() {
  const root = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<Row[]>(SEED);
  const [step, setStep] = useState(0);
  const next = useRef(0);
  const uid = useRef(100);

  // while on screen: a new pattern drafts in every few seconds
  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let iv = 0;
    const timers: number[] = [];
    const tick = () => {
      const n = NEXT[next.current++ % NEXT.length];
      const id = uid.current++;
      // the ones before move along: the last new one goes to fitting, the one fitting gets printed
      const along = (r: Row, i: number): Row => (i === 0 ? { ...r, status: "Fitting" } : i === 1 && r.status === "Fitting" ? { ...r, status: "Printed" } : r);
      setRows((l) => [{ id, ...n, status: "Draft" as const, drafting: true }, ...l.map(along)].slice(0, 6));
      setStep((s) => s + 1);
      timers.push(window.setTimeout(() => setRows((l) => l.map((r) => (r.id === id ? { ...r, drafting: false } : r))), 2200));
    };
    const io = new IntersectionObserver(([e]) => {
      window.clearInterval(iv);
      if (e.isIntersecting) iv = window.setInterval(tick, 4200);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(iv);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div ref={root} className="ftp-stage">
      <span className="ftp-dots" aria-hidden="true" />
      <span className="ftp-glow" aria-hidden="true" />
      <Ghost side="l" />
      <Ghost side="r" />
      <Device className="is-front">
        <div className="ftp__status">
          <span>9:41</span>
          <span className="ftp__status-icons" aria-hidden="true">
            <svg width="15" height="11" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M2 6.8a15 15 0 0 1 20 0M5 10.9a10 10 0 0 1 14 0M8.5 14.4a5 5 0 0 1 7 0M12 17.5h.01" />
            </svg>
            <span className="ftp__battery">
              <span />
            </span>
          </span>
        </div>
        <div className="ftp__head">
          <span className="ftp__logo">
            <PhoneBird size={15} />
          </span>
          <span className="ftp__title">Patterns</span>
          <span className="ftp__plus" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
        </div>
        <div className="ftp__search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          Search patterns
        </div>
        <div className="ftp__sub">
          <span>Recent</span>
          <span className="is-muted">Sort by · Latest</span>
        </div>
        <ul key={step} className={`ftp__list ${step ? "is-shifting" : ""}`}>
          {rows.map((r, i) => (
            <li key={r.id} className={`ftp__row ${r.drafting ? "is-drafting" : ""} ${i === 0 && step ? "is-new" : ""}`}>
              <span className="ftp__thumb">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true">
                  <path d={G[r.g]} />
                </svg>
              </span>
              <span className="ftp__text">
                <span className="ftp__name">{r.name}</span>
                <span className="ftp__who">{r.drafting ? "Drafting for " + r.who + "…" : r.who}</span>
                {r.drafting && <span className="ftp__bar" />}
              </span>
              <span className="ftp__state">
                <span className={`ftp__dot is-${r.status.toLowerCase()}`} />
                {r.drafting ? "" : r.status}
              </span>
            </li>
          ))}
        </ul>
        <span className="ftp__home" aria-hidden="true" />
      </Device>
    </div>
  );
}
