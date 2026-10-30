"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { Shell } from "../hc/parts";
import { MarkCard, PhoneCard, PrintCard, RefineCard, TurnCard, BodiesCard } from "./cards";
import "./features.css";

/* Features, a new arrangement (lab): the live section's code, cards and
   styles (src/components/features), copied with the prefix fv so the two
   never meet. Two cards swap: Mark up is now the big one (two rows tall, on
   the left), with a new reference, the cream tweed suit: tap a note and the
   picture pushes in to that detail (collar, buttons, pockets, hem). See it
   on your body takes the wide place on the right: her on the left, and
   beside her the views to jump to, how far round she is, and the slider.

   Shown still (no reveals: the lab scrolls in its own box, the page's
   reveals follow the page's scroller), and without the dithered edge. */

type Key = "body" | "mark" | "refine" | "bodies" | "lib" | "print";
type Place = { c: string; r: string; tall?: boolean };

const CARDS: { k: Key; t: string; s: string; at: Place; ui: () => ReactNode }[] = [
  { k: "mark", t: "Mark up your references", s: "Circle what you like, pin a note. Venty reads your marks.", at: { c: "1 / span 5", r: "1 / span 2", tall: true }, ui: MarkCard },
  { k: "body", t: "See it on your body", s: "Turn it on your body, then see the flat pieces it is cut from.", at: { c: "6 / span 7", r: "1" }, ui: TurnCard },
  { k: "refine", t: "Refine in plain words", s: "Say what to change, the way you'd say it. Venty redrafts the pieces.", at: { c: "6 / span 3", r: "2" }, ui: RefineCard },
  { k: "bodies", t: "Body library", s: "Every body you measure, saved and dated. Keep one for anyone you sew for.", at: { c: "9 / span 4", r: "2" }, ui: BodiesCard },
  { k: "lib", t: "Pattern library", s: "Every pattern with its versions and notes. Print it again any time.", at: { c: "1 / span 7", r: "3" }, ui: PhoneCard },
  { k: "print", t: "Arrange and print", s: "Move the pieces round the sheet to use less paper, then print on A4 at home or A0 at a print shop.", at: { c: "8 / span 5", r: "3" }, ui: PrintCard },
];

/** how many of the 12 columns a place spans */
const spanOf = (p: Place) => +(p.c.split("span")[1] ?? 1);

export function FeaturesSwap() {
  return (
    <Shell>
      <Section />
    </Shell>
  );
}

function Section() {
  const root = useRef<HTMLElement>(null);
  // off screen, everything in it that loops is paused (data-away, features.css);
  // the cards' own loops stop themselves the same way
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => el.toggleAttribute("data-away", !e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={root}
      id="features-swap"
      data-nav="Features"
      data-wing="frame"
      data-theme-zone="dark"
      data-theme-at="top 35%"
      className="fv"
      aria-labelledby="fv-title"
    >
      <div className="fv-inner">
        <header className="fv-head">
          <div>
            <p className="fv-eyebrow">
              <span className="line-mask inline-block">
                <span className="inline-block">
                  Features
                </span>
              </span>
            </p>
            <h2 id="fv-title" className="fv-title">
              <span className="line-mask">
                <span className="block">
                  Everything a
                </span>
              </span>
              <span className="line-mask">
                <span className="block">
                  pattern <em>needs.</em>
                </span>
              </span>
            </h2>
          </div>
          <p className="fv-lede">
            Mark up a reference, change it in plain words, see it turn on your body, then print it the way you sew. Every pattern and every body you measure stays in your library.
          </p>
        </header>

        <div className="fvb-bleed">
          <div className="fvb-grid">
            {CARDS.map((c) => {
              const w = spanOf(c.at);
              const start = +c.at.c.split("/")[0];
              // the cards on the grid's outer edges reach into the bleed and fade there
              const edge = `${start === 1 ? "is-l" : ""} ${start + w - 1 === 12 ? "is-r" : ""}`;
              const cls = `fvb-cell ${w >= 7 ? "is-wide" : w >= 5 ? "is-mid" : ""} ${c.at.tall ? "is-tall" : ""} ${edge}`;
              const Ui = c.ui;
              return (
                <article key={c.k} className={`${cls} fvb-card fvb-card--${c.k}`} style={{ "--gc": c.at.c, "--gr": c.at.r } as CSSProperties}>
                  <p className="fvb-copy">
                    <b>{c.t}.</b> {c.s}
                  </p>
                  <div className="fvb-vis">
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
