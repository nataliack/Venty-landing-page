"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { DitherEdge } from "../DitherEdge";
import { useReveals } from "@/lib/useReveals";
import { MarkCard, PhoneCard, PrintCard, RefineCard, TurnCard, BodiesCard } from "./cards";
import "./features.css";

/* 4. Features (dark). "Everything a pattern needs." Ported from the lab's
   bento (src/app/lab/_components/sections/fz, still being refined there and
   here).

   The head: the title over two lines on the left, a short body on the far
   right on the title's last line (one centred column on a phone).

   The grid: three tall rows on 12 columns (desktop).
     See it on your body   two rows tall, left: her turn on a slider
     Mark up               wide, right: tap a note, the picture pushes in
                           to that detail (a stand-in for the macro clips)
     Refine                a chat
     Body library          a dress form drawn from each body's measures
     Pattern library       wide, left: the app's Patterns screen on a phone,
                           two behind; on hover the front one rises out
     Arrange and print     drag, turn and pack the pieces; the page count
   The grid runs past the text column and fades out there, so the outer
   cards dissolve into the night. Below 1100px the cards keep how wide and
   tall they are, roughly (six columns on a tablet), and pack themselves;
   on a phone, one column.

   It rises over the held last screen of How it works with the dark
   dithered edge. Content is a stand-in for the final copy and images. */

type Key = "body" | "mark" | "refine" | "bodies" | "lib" | "print";
type Place = { c: string; r: string; tall?: boolean };

const CARDS: { k: Key; t: string; s: string; at: Place; ui: () => ReactNode }[] = [
  { k: "body", t: "See it on your body", s: "Turn it on your body, then see the flat pieces it is cut from.", at: { c: "1 / span 5", r: "1 / span 2", tall: true }, ui: TurnCard },
  { k: "mark", t: "Mark up your references", s: "Circle what you like, pin a note. Venty reads your marks.", at: { c: "6 / span 7", r: "1" }, ui: MarkCard },
  { k: "refine", t: "Refine in plain words", s: "Say what to change, the way you'd say it. Venty redrafts the pieces.", at: { c: "6 / span 3", r: "2" }, ui: RefineCard },
  { k: "bodies", t: "Body library", s: "Every body you measure, saved and dated. Keep one for anyone you sew for.", at: { c: "9 / span 4", r: "2" }, ui: BodiesCard },
  { k: "lib", t: "Pattern library", s: "Every pattern with its versions and notes. Print it again any time.", at: { c: "1 / span 7", r: "3" }, ui: PhoneCard },
  { k: "print", t: "Arrange and print", s: "Move the pieces round the sheet to use less paper, then print on A4 at home or A0 at a print shop.", at: { c: "8 / span 5", r: "3" }, ui: PrintCard },
];

/** how many of the 12 columns a place spans */
const spanOf = (p: Place) => +(p.c.split("span")[1] ?? 1);

export function Features() {
  const root = useRef<HTMLElement>(null);
  useReveals(root);

  return (
    <section
      ref={root}
      id="features"
      data-nav="Features"
      data-wing="frame"
      data-theme-zone="dark"
      data-theme-at="top 35%"
      className="ft"
      aria-labelledby="ft-title"
    >
      <DitherEdge color="#0b0c15" />
      <div className="ft-inner">
        <header className="ft-head" data-reveal>
          <div>
            <p className="ft-eyebrow">
              <span className="line-mask inline-block">
                <span data-rise className="inline-block">
                  Features
                </span>
              </span>
            </p>
            <h2 id="ft-title" className="ft-title">
              <span className="line-mask">
                <span data-rise className="block">
                  Everything a
                </span>
              </span>
              <span className="line-mask">
                <span data-rise className="block">
                  pattern <em>needs.</em>
                </span>
              </span>
            </h2>
          </div>
          <p className="ft-lede" data-lines>
            Mark up a reference, change it in plain words, see it turn on your body, then print it the way you sew. Every pattern and every body you measure stays in your library.
          </p>
        </header>

        <div className="ftb-bleed" data-reveal="top 82%">
          <div className="ftb-grid">
            {CARDS.map((c) => {
              const w = spanOf(c.at);
              const start = +c.at.c.split("/")[0];
              // the cards on the grid's outer edges reach into the bleed and fade there
              const edge = `${start === 1 ? "is-l" : ""} ${start + w - 1 === 12 ? "is-r" : ""}`;
              const cls = `ftb-cell ${w >= 7 ? "is-wide" : w >= 5 ? "is-mid" : ""} ${c.at.tall ? "is-tall" : ""} ${edge}`;
              const Ui = c.ui;
              return (
                <article key={c.k} data-up className={`${cls} ftb-card ftb-card--${c.k}`} style={{ "--gc": c.at.c, "--gr": c.at.r } as CSSProperties}>
                  <p className="ftb-copy">
                    <b>{c.t}.</b> {c.s}
                  </p>
                  <div className="ftb-vis">
                    <Ui />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
