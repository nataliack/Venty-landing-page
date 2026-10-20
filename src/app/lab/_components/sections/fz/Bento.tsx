"use client";

import type { CSSProperties } from "react";
import { FEATS, Shell, type Feat, type FeatKey } from "./parts";
import { BodiesCard, MarkCard, PrintCard, RefineCard, TurnCard } from "./BentoCards";
import { PhoneCard } from "./Phone";
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
  lib: { c: "1 / span 7", r: "3" },
  print: { c: "8 / span 5", r: "3" },
};

/** how many of the 12 columns a place spans */
const spanOf = (p: Place) => +(p.c.split("span")[1] ?? 1);

export function FzBento() {
  return (
    <Shell head={false}>
      <section className="fzb">
        <header className="fzb-head">
          <div>
            <p className="fz-eyebrow">Features</p>
            <h2 className="fzb-title">
              <span>Everything a</span> <span>pattern needs.</span>
            </h2>
          </div>
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
              return <Card key={f.k} f={f} className={cls} style={{ "--gc": p.c, "--gr": p.r } as CSSProperties} />;
            })}
          </div>
        </div>
      </section>
    </Shell>
  );
}

const CARDS: Record<FeatKey, () => React.ReactNode> = {
  mark: MarkCard,
  refine: RefineCard,
  body: TurnCard,
  bodies: BodiesCard,
  print: PrintCard,
  lib: PhoneCard,
};

function Card({ f, className, style }: { f: Feat; className: string; style: CSSProperties }) {
  const Ui = CARDS[f.k];
  return (
    <article className={`${className} fzb-card fzb-card--${f.k}`} style={style}>
      <p className="fzb-copy">
        <b>{f.t}.</b> {f.s}
      </p>
      <div className="fzb-vis">
        <Ui />
      </div>
    </article>
  );
}
