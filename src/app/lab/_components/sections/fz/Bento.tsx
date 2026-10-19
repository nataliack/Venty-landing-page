"use client";

import { useState, type CSSProperties } from "react";
import { FEATS, FIRST_FRAME, Shell, Visual, useTurn, type Feat, type FeatKey } from "./parts";
import "./bento.css";

/* Features, back to the bento: structure only (no glow, no hovers). Three
   rows on desktop on a 12-column grid, rows tall enough that the smallest
   card is still about square; cards of different widths, and one in each
   arrangement two rows tall. Three arrangements to compare (the switch, top
   centre). Below 1100px the cards keep how wide and tall they are, roughly
   (six columns on a tablet, two on a phone), and pack themselves. Copy and
   visuals are stand-ins: each card is a slot. */

type Slot = FeatKey | "head";
/** c: columns (start / span), r: rows; tall: two rows */
type Place = { c: string; r: string; tall?: boolean };
type Layout = { key: string; name: string; head: "above" | "tile"; at: Partial<Record<Slot, Place>> };

const LAYOUTS: Layout[] = [
  {
    key: "turn",
    name: "Tall turn",
    head: "tile",
    at: {
      head: { c: "1 / span 3", r: "1" },
      body: { c: "4 / span 5", r: "1 / span 2", tall: true },
      mark: { c: "9 / span 4", r: "1" },
      refine: { c: "1 / span 3", r: "2" },
      bodies: { c: "9 / span 4", r: "2" },
      print: { c: "1 / span 7", r: "3" },
      lib: { c: "8 / span 5", r: "3" },
    },
  },
  {
    key: "ref",
    name: "Tall reference",
    head: "tile",
    at: {
      mark: { c: "1 / span 4", r: "1 / span 2", tall: true },
      head: { c: "5 / span 5", r: "1" },
      refine: { c: "10 / span 3", r: "1" },
      body: { c: "5 / span 5", r: "2" },
      bodies: { c: "10 / span 3", r: "2" },
      lib: { c: "1 / span 5", r: "3" },
      print: { c: "6 / span 7", r: "3" },
    },
  },
  {
    key: "above",
    name: "Heading above",
    head: "above",
    at: {
      body: { c: "1 / span 5", r: "1 / span 2", tall: true },
      mark: { c: "6 / span 7", r: "1" },
      refine: { c: "6 / span 3", r: "2" },
      bodies: { c: "9 / span 4", r: "2" },
      print: { c: "1 / span 7", r: "3" },
      lib: { c: "8 / span 5", r: "3" },
    },
  },
];

/** how many of the 12 columns a place spans */
const spanOf = (p: Place) => +(p.c.split("span")[1] ?? 1);

export function FzBento() {
  const [lay, setLay] = useState(0);
  const L = LAYOUTS[lay];
  const slots = Object.keys(L.at) as Slot[];
  return (
    <Shell head={false}>
      <div className="fzb-switch" role="group" aria-label="Arrangement">
        {LAYOUTS.map((l, i) => (
          <button key={l.key} type="button" aria-pressed={i === lay} onClick={() => setLay(i)}>
            {l.name}
          </button>
        ))}
      </div>
      <section className="fzb">
        <div className="fzb-in">
        {L.head === "above" && <Head />}
        <div className={`fzb-grid is-${L.key}`}>
          {slots.map((s) => {
            const p = L.at[s]!;
            const style = { "--gc": p.c, "--gr": p.r } as CSSProperties;
            const w = spanOf(p);
            const cls = `fzb-cell ${w >= 7 ? "is-wide" : w >= 5 ? "is-mid" : ""} ${p.tall ? "is-tall" : ""}`;
            if (s === "head")
              return (
                <div key={s} className={`${cls} fzb-head-tile`} style={style}>
                  <Head />
                </div>
              );
            const f = FEATS.find((x) => x.k === s)!;
            return <Card key={s} f={f} roomy={w >= 5 || !!p.tall} className={cls} style={style} />;
          })}
        </div>
        </div>
      </section>
    </Shell>
  );
}

function Head() {
  return (
    <header className="fzb-head">
      <p className="fz-eyebrow">Features</p>
      <h2 className="fzb-title">Everything a pattern needs.</h2>
    </header>
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
