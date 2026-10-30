"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { DitherEdge } from "../DitherEdge";
import { useReveals } from "@/lib/useReveals";
import { MarkCard, PhoneCard, PrintCard, RefineCard, TurnCard, BodiesCard } from "./cards";
import "./features.css";

/* 4. Features (dark). "Everything a pattern needs." Refined in the lab
   (src/app/lab/_components/sections/fv, "Features · Mark up first") and
   ported here whole.

   The head: the title over two lines on the left, a short body on the far
   right on the title's last line (one centred column on a phone).

   The grid: three rows on 12 columns (desktop), every card in the app's
   skeuomorphic builds (a dark tray, what's in it pressed in, controls
   raised).
     Mark up               two rows tall, left: the cream tweed suit; tap a
                           note and Jose's clip pushes in to that detail, his
                           outline drawn round it, the note typed out
     See it on your body   wide, right: her turn in a pressed frame (a
                           canvas of frames), the views and the slider
     Refine                a chat that plays, as sent messages
     Body library          choose a body by name; its card comes to the front
     Pattern library       wide, left: three phones, each the app's own
                           Pattern library; on hover the front one rises
     Arrange and print     drag, turn and pack the pieces; the page count
   The grid runs past the text column; the night is laid over its sides, so
   the outer cards dissolve into it. A tablet has its own arrangement; a
   phone, one column.

   It rises over the held last screen of How it works with the dark
   dithered edge. Off screen, everything in it that loops is paused. */

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

export function Features() {
  const root = useRef<HTMLElement>(null);
  useReveals(root);
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
