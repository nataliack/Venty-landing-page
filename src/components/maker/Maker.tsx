"use client";

import { useRef } from "react";
import { DitherEdge } from "../DitherEdge";
import { Halftone } from "./Halftone";
import { MAKER_URL } from "@/lib/site";
import { useReveals } from "@/lib/useReveals";
import "./maker.css";

/* 8. Meet the maker (dark). Natalia's portrait in dots, in an arch, a line
   of type turning round it like a tape round a dress form; her name large,
   then the story.

   It rises over the end of the FAQ with a dark cross-stitched edge.

   IMAGE: /maker/natalia.webp (her photo, any size: it is drawn in dots;
   a head-and-shoulders crop, face lit, reads best).
   DRAFT copy: Natalia to confirm her story before launch. */

const STORY = [
  "Natalia built Venty as her capstone project at QUT, in Brisbane.",
  "It starts from a problem anyone who sews knows well. Shop patterns are drafted for a standard body, so most makes begin with redrafting. Venty starts from your measurements instead, and drafts the pattern around them.",
];

const RING = "Natalia Chamon · Designer of Venty · QUT · Brisbane · ";

export function Maker() {
  const root = useRef<HTMLElement>(null);
  useReveals(root);

  return (
    <section ref={root} id="maker" data-nav="Meet the maker" data-wing="spread" data-theme-zone="dark" data-theme-at="top 35%" className="mk" aria-labelledby="mk-title">
      <DitherEdge color="#0b0c15" pattern="cross" />
      <div className="mk-glow" aria-hidden="true" />
      <div className="mk-grid">
        <div className="mk-portrait" data-reveal="top 75%">
          <div data-up className="mk-arch">
            <Halftone src="/maker/natalia.webp" label="Portrait of Natalia Chamon, drawn in dots" />
          </div>
          <svg viewBox="0 0 200 200" className="mk-ring" aria-hidden="true">
            <defs>
              <path id="mk-ring-path" d="M100 100 m-92 0 a92 92 0 1 1 184 0 a92 92 0 1 1 -184 0" />
            </defs>
            <text>
              {/* spaced to close the circle exactly (r 92) */}
              <textPath href="#mk-ring-path" textLength={2 * Math.PI * 92 - 4} lengthAdjust="spacing">
                {RING.repeat(2)}
              </textPath>
            </text>
          </svg>
        </div>

        <div className="mk-text" data-reveal>
          <p className="mk-eyebrow">
            <span className="line-mask inline-block">
              <span data-rise className="inline-block">
                Meet the maker
              </span>
            </span>
          </p>
          <h2 id="mk-title" className="mk-name">
            <span className="line-mask">
              <span data-rise className="block">
                Natalia
              </span>
            </span>
            <span className="line-mask">
              <span data-rise className="block">
                Chamon
              </span>
            </span>
          </h2>
          <p className="mk-role">
            <span className="line-mask inline-block">
              <span data-rise className="inline-block">
                Natalia Chamon · Designer of Venty
              </span>
            </span>
          </p>
          <p data-lines className="mk-lead">
            {STORY[0]}
          </p>
          <p data-lines className="mk-story">
            {STORY[1]}
          </p>
          <a data-up href={MAKER_URL} target="_blank" rel="noopener noreferrer" className="mk-link">
            <span>nataliachamon.com</span>
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M5 11 11 5M6 5h5v5" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </div>
    </section>
  );
}
