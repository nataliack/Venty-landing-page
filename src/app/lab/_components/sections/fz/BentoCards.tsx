"use client";

import { useRef, useState } from "react";
import { MARK, MARK_BOUNDS } from "@/lib/markFlight";
import { Icon, I } from "../mtm/icons";
import { FIRST_FRAME, useTurn } from "./parts";
import "./bento-cards.css";

/* The bento's six cards, each a small working piece of the app, drawn for
   the dark (bc-). Content is a stand-in for the final copy and images, but
   the UI is meant to read as the app's. */

const CIRCLE = "M12 4a8 8 0 1 0 0 16a8 8 0 0 0 0-16z";
const SEND = "M12 19V5M5.5 11.5L12 5l6.5 6.5";

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
   A small editor: the reference with its marks (a ring round the neckline,
   a dashed line where the hem should fall), numbered pins, the tools
   floating at its side; the notes the pins make, and the references
   underneath. */
const PINS = [
  { n: 1, x: 0.63, y: 0.29, note: "Keep this neckline, a touch deeper" },
  { n: 2, x: 0.8, y: 0.66, note: "5 cm longer, straight hem" },
];
export function MarkCard() {
  const [tool, setTool] = useState("pen");
  const [on, setOn] = useState(1);
  return (
    <div className="bc-mark">
      <div className="bc-mark__frame">
        <div className="bc-mark__fig">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/features/ref-jersey.webp" alt="The reference: a cropped jersey, marked up" draggable={false} />
          <svg viewBox="0 0 896 1339" aria-hidden="true">
            <path className="bc-ink" d="M318 420 C330 352 560 344 588 418 C606 470 540 520 452 522 C366 524 304 482 322 410" />
            <path className="bc-ink is-dash" d="M70 1000 L840 1000" />
          </svg>
          {PINS.map((p) => (
            <button
              key={p.n}
              type="button"
              className={`bc-pin ${on === p.n ? "is-on" : ""}`}
              style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
              onClick={() => setOn(p.n)}
              aria-label={`Note ${p.n}: ${p.note}`}
            >
              {p.n}
            </button>
          ))}
        </div>
        <div className="bc-tools" role="toolbar" aria-label="Mark-up tools">
          {[
            ["pen", I.pen, "Draw"],
            ["ring", CIRCLE, "Ring"],
            ["pin", I.pin, "Pin a note"],
            ["erase", I.erase, "Erase"],
          ].map(([k, d, label]) => (
            <button key={k} type="button" aria-pressed={tool === k} onClick={() => setTool(k)} aria-label={label} title={label}>
              <Icon d={d} size={15} />
            </button>
          ))}
        </div>
      </div>
      <div className="bc-mark__side">
        <p className="bc-label">
          Notes <span>{PINS.length}</span>
        </p>
        <ol className="bc-notes">
          {PINS.map((p) => (
            <li key={p.n} className={on === p.n ? "is-on" : ""} onClick={() => setOn(p.n)}>
              <span className="bc-notes__n">{p.n}</span>
              {p.note}
            </li>
          ))}
        </ol>
        <p className="bc-label">References</p>
        <div className="bc-refs">
          <span className="bc-refs__thumb is-on">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/features/ref-jersey.webp" alt="" draggable={false} />
          </span>
          <span className="bc-refs__add" aria-hidden="true">
            <Icon d={I.plus} size={14} />
          </span>
        </div>
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
   Her turn, feathered into the card (no frame edge shows), turned by
   dragging her or by the dial underneath: a ruled track in degrees with
   the four views marked, and a readout of where she faces. */
const VIEWS = [
  { d: 0, k: "Front" },
  { d: 90, k: "Side" },
  { d: 180, k: "Back" },
  { d: 270, k: "Side" },
];
const facing = (deg: number) => VIEWS.reduce((a, v) => (Math.abs(((deg - v.d + 540) % 360) - 180) < Math.abs(((deg - a.d + 540) % 360) - 180) ? v : a)).k;
export function TurnCard() {
  const [img, set] = useTurn();
  const [deg, setDeg] = useState(0);
  const drag = useRef<{ x: number; d: number } | null>(null);
  const to = (d: number) => {
    const v = Math.round(((d % 360) + 360) % 360);
    setDeg(v);
    set(v);
  };
  return (
    <div className="bc-turn">
      <div
        className="bc-turn__stage"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, d: deg };
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {}
        }}
        onPointerMove={(e) => drag.current && to(drag.current.d + (e.clientX - drag.current.x) * 0.6)}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={img} src={FIRST_FRAME} alt="The model in the garment; drag or use the dial to turn her" draggable={false} />
        <span className="bc-turn__hint" aria-hidden="true">
          Drag to turn
        </span>
      </div>
      <div className="bc-dial">
        <div className="bc-dial__read">
          <b>{facing(deg)}</b>
          <span>{deg}°</span>
        </div>
        <div className="bc-dial__track">
          <span className="bc-dial__ticks" aria-hidden="true" />
          <span className="bc-dial__fill" style={{ width: `${(deg / 360) * 100}%` }} aria-hidden="true" />
          <span className="bc-dial__knob" style={{ left: `${(deg / 360) * 100}%` }} aria-hidden="true" />
          <input type="range" min={0} max={359} value={deg} onChange={(e) => to(+e.target.value)} aria-label="Turn her" />
        </div>
        <div className="bc-dial__views">
          {VIEWS.map((v) => (
            <button key={v.d} type="button" aria-pressed={deg === v.d} onClick={() => to(v.d)}>
              {v.d === 0 ? "Front" : v.d === 180 ? "Back" : `${v.d}°`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---- Body library -------------------------------------------------------------
   The person you're drafting for on a dress form, her three measurements
   drawn on it and listed beside it, the date they were taken; the others
   saved, as avatars to switch to. */
const BODIES = [
  { id: "natalia", name: "Natalia", when: "Measured 12 Oct", m: [92, 74, 98] },
  { id: "mei", name: "Mei", when: "Measured 3 Sep", m: [86, 68, 92] },
  { id: "amara", name: "Amara", when: "Measured 28 Aug", m: [101, 86, 106] },
];
const FORM = "M42 8 h16 v8 Q72 19 81 32 Q87 48 81 64 Q73 79 71 92 Q80 107 83 124 Q73 135 50 135 Q27 135 17 124 Q20 107 29 92 Q27 79 19 64 Q13 48 19 32 Q28 19 42 16 Z";
export function BodiesCard() {
  const [at, setAt] = useState(0);
  const b = BODIES[at];
  const rows: [string, number, number, number, number][] = [
    ["Bust", b.m[0], 50, 15, 85],
    ["Waist", b.m[1], 88, 27, 73],
    ["Hip", b.m[2], 120, 18, 82],
  ];
  return (
    <div className="bc-bodies">
      <svg viewBox="0 0 100 160" className="bc-form" aria-hidden="true">
        <path d={FORM} className="bc-form__body" />
        <path d="M50 135 V152 M36 154 H64" className="bc-form__stand" />
        {rows.map(([k, , y, x0, x1]) => (
          <g key={k} className="bc-form__m">
            <path d={`M${x0} ${y} H${x1}`} />
            <path d={`M${x0} ${y - 3} V${y + 3} M${x1} ${y - 3} V${y + 3}`} />
          </g>
        ))}
      </svg>
      <div className="bc-bodies__side">
        <p className="bc-person">
          {b.name}
          <span>{b.when}</span>
        </p>
        <dl className="bc-measures">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>
                {v}
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

/* ---- Print options ------------------------------------------------------------
   A print panel. The preview: the pieces laid out as they print, over the
   grid of A4 pages they tile across (numbered, with the crosses you line
   up to tape them), or on one A0 sheet. The settings: paper, seam
   allowance (a switch; it adds the cutting line outside the sewing line),
   what that comes to, and Print. */
const PIECES = [
  { d: "M14 10 L34 8 L40 22 Q54 27 60 38 L57 74 L8 74 L5 38 Q10 27 14 22 Z", label: "FRONT" },
  { d: "M70 12 Q84 18 100 12 L104 74 L66 74 Z", label: "BACK" },
];
export function PrintCard() {
  const [a0, setA0] = useState(false);
  const [seam, setSeam] = useState(true);
  const cols = 4;
  const rows = 3;
  return (
    <div className="bc-print">
      <div className="bc-print__preview">
        <svg viewBox="-2 -2 116 86" aria-hidden="true">
          <rect x="0" y="0" width="112" height="82" rx="1.5" className="bc-sheet" />
          {!a0 &&
            Array.from({ length: rows * cols }, (_, i) => {
              const x = (i % cols) * 28;
              const y = Math.floor(i / cols) * 27.33;
              return (
                <g key={i}>
                  <rect x={x} y={y} width="28" height="27.33" className="bc-page" />
                  <text x={x + 1.6} y={y + 4} className="bc-page__no">
                    {i + 1}
                  </text>
                </g>
              );
            })}
          {!a0 &&
            Array.from({ length: (rows - 1) * (cols - 1) }, (_, i) => {
              const x = ((i % (cols - 1)) + 1) * 28;
              const y = (Math.floor(i / (cols - 1)) + 1) * 27.33;
              return <path key={i} d={`M${x - 2} ${y} H${x + 2} M${x} ${y - 2} V${y + 2}`} className="bc-cross" />;
            })}
          {PIECES.map((p) => (
            <g key={p.label}>
              {seam && <path d={p.d} className="bc-cut" />}
              <path d={p.d} className="bc-sew" transform={seam ? "translate(56 41) scale(0.94) translate(-56 -41)" : undefined} />
            </g>
          ))}
          <text x="32" y="50" className="bc-piece__t">
            FRONT
          </text>
          <text x="85" y="46" className="bc-piece__t">
            BACK
          </text>
        </svg>
      </div>
      <div className="bc-print__panel">
        <p className="bc-label">Paper</p>
        <div className="bc-seg" role="group" aria-label="Paper">
          <button type="button" aria-pressed={!a0} onClick={() => setA0(false)}>
            <b>A4</b> At home
          </button>
          <button type="button" aria-pressed={a0} onClick={() => setA0(true)}>
            <b>A0</b> Print shop
          </button>
        </div>
        <div className="bc-row">
          <span>Seam allowance</span>
          <button type="button" role="switch" aria-checked={seam} className="bc-switch" onClick={() => setSeam((s) => !s)} aria-label="Seam allowance">
            <span />
          </button>
        </div>
        <div className="bc-row">
          <span>Prints on</span>
          <b>{a0 ? "1 sheet" : `${rows * cols} pages`}</b>
        </div>
        <span className="bc-print__go">
          <Icon d={I.print} size={15} /> Print pattern
        </span>
      </div>
    </div>
  );
}

/* ---- Pattern library ------------------------------------------------------------
   Your patterns as files (a sketch of the pieces, the name, the version
   it's on); pick one and its versions run down underneath, newest first,
   each with the change it made. */
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
