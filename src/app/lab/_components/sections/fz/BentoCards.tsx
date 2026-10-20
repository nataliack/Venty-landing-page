"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from "react";
import { MARK, MARK_BOUNDS } from "@/lib/markFlight";
import { Icon, I } from "../mtm/icons";
import { FIRST_FRAME, useTurn } from "./parts";
import "./bento-cards.css";

/* The bento's cards, each a small working piece of the app, drawn for
   the dark (bc-). Content is a stand-in for the final copy and images, but
   the UI is meant to read as the app's. */

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
export function MarkCard() {
  const [tool, setTool] = useState("pen");
  const [on, setOn] = useState<number | null>(null);
  const [aim, setAim] = useState<number | null>(null); // where the zoom is centred (kept while pulling out)
  const t = useRef(0);
  useEffect(() => () => window.clearTimeout(t.current), []);
  const pick = (n: number | null) => {
    window.clearTimeout(t.current);
    if (n === on || n === null) return setOn(null);
    if (on === null) {
      setAim(n);
      return setOn(n);
    }
    // out of this detail, then in to the next
    setOn(null);
    t.current = window.setTimeout(() => {
      setAim(n);
      setOn(n);
    }, OUT_MS);
  };
  const a = DETAILS.find((x) => x.n === (on ?? aim)) ?? DETAILS[0];
  return (
    <div className="bc-mark">
      <div className={`bc-mark__frame ${on ? "is-in" : ""}`}>
        <div
          className="bc-mark__fig"
          style={{ "--z": on ? a.z : 1, transformOrigin: `${a.at[0] * 100}% ${a.at[1] * 100}%` } as CSSProperties}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/features/ref-jersey.webp" alt="The reference: a cropped jersey, marked up" draggable={false} />
          <svg viewBox="0 0 880 1339" aria-hidden="true">
            {DETAILS.map((x) => x.sel && <g key={x.n} className={`bc-sel ${on === x.n ? "is-on" : ""}`}>{x.sel}</g>)}
            <g className={`bc-hem ${on === 3 ? "is-on" : ""}`}>
              <path className="bc-hem__now" d="M60 878 H820" />
              <path className="bc-hem__new" d="M60 978 H820" />
              <path className="bc-hem__arrow" d="M720 892 V962 M700 942 L720 964 L740 942" />
            </g>
          </svg>
          <span className={`bc-chip ${on === 3 ? "is-on" : ""}`} style={{ left: "82%", top: "73%" }}>
            +5 cm
          </span>
          {DETAILS.map((x) => (
            <button
              key={x.n}
              type="button"
              className={`bc-pin ${on === x.n ? "is-on" : ""} ${on && on !== x.n ? "is-away" : ""}`}
              style={{ left: `${x.pin[0] * 100}%`, top: `${x.pin[1] * 100}%` }}
              onClick={() => pick(x.n)}
              aria-label={`Note ${x.n}: ${x.note}`}
              aria-pressed={on === x.n}
            >
              {x.n}
            </button>
          ))}
        </div>
        <div className="bc-tools" role="toolbar" aria-label="Mark-up tools">
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
        <button type="button" className="bc-mark__out" onClick={() => pick(null)} tabIndex={on ? 0 : -1}>
          Whole look
        </button>
      </div>
      <div className="bc-mark__side">
        <p className="bc-label">
          Notes <span>{DETAILS.length}</span>
        </p>
        <ol className="bc-notes">
          {DETAILS.map((x) => (
            <li key={x.n}>
              <button type="button" className={on === x.n ? "is-on" : ""} onClick={() => pick(x.n)} aria-pressed={on === x.n}>
                <span className="bc-notes__n">{x.n}</span>
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
    <div className="bc-chat">
      <header className="bc-chat__head">
        <span className="bc-chat__file">Slip dress</span>
        <span className="bc-tag">v2 → v3</span>
      </header>
      <div className="bc-chat__log">
        <p className="bc-bubble is-me">5 cm longer, wider straps.</p>
        <div className="bc-reply">
          <span className="bc-avatar">
            <Bird size={12} />
          </span>
          <div className="bc-reply__body">
            <p className="bc-bubble">Done. Four pieces redrafted.</p>
            <p className="bc-diff">
              <span>Hem +5 cm</span>
              <span>Straps 3 cm</span>
            </p>
          </div>
        </div>
      </div>
      <div className="bc-compose">
        <span>Ask for a change…</span>
        <span className="bc-compose__send" aria-hidden="true">
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
  const [img, set] = useTurn();
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
    <div className={`bc-turn ${dragging ? "is-dragging" : ""}`}>
      <div
        className="bc-turn__stage"
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
        <img ref={img} src={FIRST_FRAME} alt="The model in the garment; drag or use the slider to turn her" draggable={false} />
        <span className="bc-turn__hint" aria-hidden="true">
          Drag to turn
        </span>
      </div>
      <input
        type="range"
        className="bc-slider"
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
    <div className="bc-bodies">
      <svg viewBox="0 0 100 160" className="bc-form" aria-hidden="true">
        <path d={form.d} style={d(form.d)} className="bc-form__body" />
        <path d="M50 135 V152 M36 154 H64" className="bc-form__stand" />
        {form.lines.map((l, i) => (
          <path key={i} d={l} style={d(l)} className="bc-form__m" />
        ))}
      </svg>
      <div className="bc-bodies__side">
        <p className="bc-person">
          {b.name}
          <span>{b.when}</span>
        </p>
        <dl className="bc-measures">
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
        <div className="bc-people" role="group" aria-label="Saved bodies">
          {BODIES.map((p, i) => (
            <button key={p.id} type="button" aria-pressed={i === at} onClick={() => setAt(i)} title={p.name}>
              {p.name[0]}
            </button>
          ))}
          <span className="bc-people__add" aria-hidden="true">
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
    <div className="bc-arrange">
      <div className="bc-arrange__canvas">
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
          <rect x="0" y="0" width={SHEET.w} height={SHEET.h} rx="1.2" className="bc-sheet" />
          {!a0 &&
            Array.from({ length: SHEET.rows * SHEET.cols }, (_, i) => {
              const x = (i % SHEET.cols) * TILE.w;
              const y = Math.floor(i / SHEET.cols) * TILE.h;
              return (
                <g key={i}>
                  <rect x={x} y={y} width={TILE.w} height={TILE.h} className="bc-page" />
                  <text x={x + 1.4} y={y + 3.6} className="bc-page__no">
                    {i + 1}
                  </text>
                </g>
              );
            })}
          {pieces.map((p) => (
            <g
              key={p.id}
              className={`bc-pc ${sel === p.id ? "is-sel" : ""}`}
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
              <path d={p.d} className="bc-pc__paper" />
              <path d={p.d} className="bc-pc__seam" transform={`translate(${p.w / 2} ${p.h / 2}) scale(0.86) translate(${-p.w / 2} ${-p.h / 2})`} />
              <path d={`M${p.w / 2} ${p.h * 0.25} V${p.h * 0.75} M${p.w / 2 - 1.2} ${p.h * 0.25 + 1.6} L${p.w / 2} ${p.h * 0.25} L${p.w / 2 + 1.2} ${p.h * 0.25 + 1.6}`} className="bc-pc__grain" />
              <text x={p.w / 2 + 1.6} y={p.h / 2} className="bc-pc__t">
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="bc-arrange__panel">
        <div className="bc-seg" role="group" aria-label="Paper">
          <button type="button" aria-pressed={!a0} onClick={() => setA0(false)}>
            <b>A4</b> At home
          </button>
          <button type="button" aria-pressed={a0} onClick={() => setA0(true)}>
            <b>A0</b> Print shop
          </button>
        </div>
        <div className="bc-count">
          <b>{a0 ? "1" : pages}</b>
          <span>{a0 ? "sheet" : `of ${SHEET.rows * SHEET.cols} pages`}</span>
        </div>
        <div className="bc-picked">
          <span className="bc-picked__name">
            {picked.label.toLowerCase()}
            <small>{Math.round(picked.r)}°</small>
          </span>
          <button type="button" className="bc-iconbtn" onClick={() => turn(-15)} aria-label="Turn the piece 15 degrees left" title="Turn left">
            <Icon d={TURN_L} size={15} />
          </button>
          <button type="button" className="bc-iconbtn" onClick={() => turn(15)} aria-label="Turn the piece 15 degrees right" title="Turn right">
            <Icon d={TURN_R} size={15} />
          </button>
        </div>
        <button type="button" className="bc-ghost is-primary" onClick={() => setPieces((l) => l.map((p) => clampTo({ ...p, ...PACKED[p.id] })))}>
          <Icon d={SPARK} size={14} /> Pack the pieces
        </button>
      </div>
    </div>
  );
}

/* ---- Pattern library (the versions view; the bento shows the phone now) -- */
const LIB = [
  {
    name: "Slip dress",
    d: "M22 6 L30 6 L36 30 L44 70 L8 70 L16 30 Z M50 6 L58 6 L62 30 L70 70 L40 70 Z",
    v: [
      ["v3", "Lower back, wider straps"],
      ["v2", "5 cm longer"],
      ["v1", "Midi, easy fit"],
    ],
  },
  {
    name: "Wrap top",
    d: "M8 14 Q24 6 40 14 L42 48 L6 48 Z M48 18 Q60 12 72 18 L70 40 L50 40 Z",
    v: [
      ["v2", "Deeper wrap"],
      ["v1", "Cropped, long sleeves"],
    ],
  },
  {
    name: "Wide trousers",
    d: "M10 6 L34 6 L38 70 L22 70 L20 30 L14 70 L2 70 Z M44 6 L68 6 L74 70 L60 70 L56 30 L52 70 L40 70 Z",
    v: [["v1", "High waist, full length"]],
  },
];
export function LibCard() {
  const [at, setAt] = useState(0);
  const p = LIB[at];
  return (
    <div className="bc-lib">
      <ul className="bc-files">
        {LIB.map((f, i) => (
          <li key={f.name}>
            <button type="button" aria-pressed={i === at} onClick={() => setAt(i)}>
              <svg viewBox="-4 0 84 76" aria-hidden="true">
                <path d={f.d} />
              </svg>
              <span className="bc-files__name">{f.name}</span>
              <span className="bc-tag">{f.v[0][0]}</span>
            </button>
          </li>
        ))}
      </ul>
      <ol className="bc-versions" aria-label={`${p.name}: versions`}>
        {p.v.map(([v, note], i) => (
          <li key={v} className={i === 0 ? "is-now" : ""}>
            <span className="bc-versions__v">{v}</span>
            <span className="bc-versions__note">{note}</span>
            {i === 0 && <span className="bc-versions__now">Current</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}
