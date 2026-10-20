"use client";

import { useState, type CSSProperties } from "react";
import { FEATS, FIRST_FRAME, Shell, Visual, useTurn, type Feat, type FeatKey } from "./parts";
import "./bento.css";

/* Features, the bento (locked: Heading above). Structure and tone only (no
   glow, no hovers).

   The head: the title large over two lines on the left, a short body on the
   right (one centred column on a phone).

   The grid: three tall rows on 12 columns. See it on your body two rows
   tall on the left; Mark up wide beside it; Refine and Body library under
   that; Print wide and Pattern library along the bottom. Below 1100px the
   cards keep how wide and tall they are, roughly (six columns on a tablet,
   two on a phone), and pack themselves.

   The tone (after Linear's dark sections): the cards are only a breath
   lighter than the night behind them, a faint rim on top, and the whole
   grid runs a little wider than the text and fades out at its sides, so
   the outer cards dissolve into the background. Copy and visuals are
   stand-ins: each card is a slot. */

/** c: columns (start / span), r: rows; tall: two rows */
type Place = { c: string; r: string; tall?: boolean };

const AT: Record<FeatKey, Place> = {
  body: { c: "1 / span 5", r: "1 / span 2", tall: true },
  mark: { c: "6 / span 7", r: "1" },
  refine: { c: "6 / span 3", r: "2" },
  bodies: { c: "9 / span 4", r: "2" },
  print: { c: "1 / span 7", r: "3" },
  lib: { c: "8 / span 5", r: "3" },
};

/** how many of the 12 columns a place spans */
const spanOf = (p: Place) => +(p.c.split("span")[1] ?? 1);

export function FzBento() {
  return (
    <Shell head={false}>
      <section className="fzb">
        <header className="fzb-head">
          <h2 className="fzb-title">
            <span>Everything a</span> <span>pattern needs.</span>
          </h2>
          <p className="fzb-lede">
            Mark up a reference, change it in plain words, see it turn on your body, then print it the way you sew. Every pattern and every body you measure stays in your library.
          </p>
        </header>
        <div className="fzb-bleed">
          <div className="fzb-grid">
            {FEATS.map((f) => {
              const p = AT[f.k];
              const w = spanOf(p);
              const start = +p.c.split("/")[0];
              // the cards on the grid's outer edges reach into the bleed and fade there
              const edge = `${start === 1 ? "is-l" : ""} ${start + w - 1 === 12 ? "is-r" : ""}`;
              const cls = `fzb-cell ${w >= 7 ? "is-wide" : w >= 5 ? "is-mid" : ""} ${p.tall ? "is-tall" : ""} ${edge}`;
              return <Card key={f.k} f={f} roomy={w >= 5 || !!p.tall} className={cls} style={{ "--gc": p.c, "--gr": p.r } as CSSProperties} />;
            })}
          </div>
        </div>
      </section>
    </Shell>
  );
}

function Card({ f, roomy, className, style }: { f: Feat; roomy: boolean; className: string; style: CSSProperties }) {
  return (
    <article className={`${className} fzb-card fzb-card--${f.k}`} style={style}>
      <p className="fzb-copy">
        <b>{f.t}.</b> {f.s}
      </p>
      <div className="fzb-vis">{f.k === "print" ? <Print roomy={roomy} /> : f.k === "body" ? <Turn /> : <Visual k={f.k} />}</div>
    </article>
  );
}

/* See it on your body: her turn, on a slider */
function Turn() {
  const [img, set] = useTurn();
  return (
    <div className="fzb-turn">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={img} src={FIRST_FRAME} alt="The model in the garment, turned by the slider" draggable={false} />
      <label className="fzb-turn__slider">
        <span className="sr-only">Turn her</span>
        <input type="range" min={0} max={360} defaultValue={0} onChange={(e) => set(+e.target.value)} />
      </label>
    </div>
  );
}

/* Print options, without the dial: the pattern as it prints. A4 shows the
   piece over the grid of home pages it tiles across (numbered, to tape
   together); A0 is one sheet for a print shop. Seam allowance adds the
   cutting line outside the sewing line. */
function Print({ roomy }: { roomy: boolean }) {
  const [a0, setA0] = useState(false);
  const [seam, setSeam] = useState(true);
  const piece = "M34 10 L58 8 L66 24 Q84 30 92 44 L88 82 L22 82 L18 44 Q26 30 34 24 Z";
  return (
    <div className="fzb-print">
      <svg viewBox="0 0 110 92" className="fzb-print__sheet" aria-hidden="true">
        <rect x="1" y="1" width="108" height="90" rx="2" className="fzb-print__paper" />
        {!a0 &&
          [0, 1, 2].map((r) =>
            [0, 1, 2, 3].map((c) => (
              <g key={`${r}${c}`}>
                <rect x={1 + c * 27} y={1 + r * 30} width="27" height="30" className="fzb-print__page" />
                <text x={3 + c * 27} y={6 + r * 30} className="fzb-print__no">
                  {r * 4 + c + 1}
                </text>
              </g>
            )),
          )}
        {seam && <path d={piece} className="fzb-print__cut" transform="translate(55 46) scale(1.08) translate(-55 -46)" />}
        <path d={piece} className="fzb-print__sew" />
        <text x="55" y="52" className="fzb-print__label">
          FRONT · CUT 1
        </text>
        {a0 && (
          <text x="105" y="88" className="fzb-print__size">
            A0
          </text>
        )}
      </svg>
      <div className="fzb-print__ctl">
        <div className="fzb-seg" role="group" aria-label="Paper">
          <button type="button" aria-pressed={!a0} onClick={() => setA0(false)}>
            A4{roomy && " at home"}
          </button>
          <button type="button" aria-pressed={a0} onClick={() => setA0(true)}>
            A0{roomy && " at a print shop"}
          </button>
        </div>
        <button type="button" className="fzb-chip" aria-pressed={seam} onClick={() => setSeam((s) => !s)}>
          Seam allowance
        </button>
      </div>
    </div>
  );
}
