"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Composer } from "./mtm/Composer";
import { Outcome } from "./mtm/Outcome";
import { BODIES, type Body, type Fit } from "./mtm/data";
import "./sections.css";

/* 2. Made to measure (lab draft, after Jose's Figma frame).

   Two columns on desktop: the composer on the left (any idea in: photos,
   sketches, words, plus the body and the fit), the outcome on the right
   (the finished garment with its pattern pieces round it). Phones stack
   them.

   The story plays once as the section comes into view: references drop
   in, the prompt types itself, Draft presses, a running stitch leaves the
   button and crosses to the outcome, the pieces fly along it to their
   places, the garment rises, its leader lines draw. After that it is all
   live: edit, draw, re-draft, replay. */

export function MadeToMeasure() {
  const section = useRef<HTMLElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const draftBtn = useRef<HTMLButtonElement>(null);
  const outcome = useRef<HTMLDivElement>(null);
  const [play, setPlay] = useState(false);
  const [run, setRun] = useState(0);
  const [drafting, setDrafting] = useState(false);
  const [body, setBody] = useState<Body>(BODIES[0]);
  const [fit, setFit] = useState<Fit>("Easy");
  const [stitch, setStitch] = useState<{ d: string; w: number; h: number; key: number } | null>(null);

  // start the story when the section is properly in view
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setPlay(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const from = useCallback(() => draftBtn.current?.getBoundingClientRect() ?? null, []);

  // the stitch: from the Draft button to the outcome, in the grid's space
  const sew = () => {
    const g = grid.current?.getBoundingClientRect();
    const b = draftBtn.current?.getBoundingClientRect();
    const o = outcome.current?.querySelector(".mtm-garment")?.getBoundingClientRect();
    if (!g || !b || !o) return;
    const x1 = b.left + b.width / 2 - g.left;
    const y1 = b.top + b.height / 2 - g.top;
    const x2 = o.left + o.width / 2 - g.left;
    const y2 = o.top + o.height * 0.45 - g.top;
    // across on wide screens, down on stacked ones
    const across = Math.abs(x2 - x1) > Math.abs(y2 - y1);
    const d = across
      ? `M${x1} ${y1} C ${x1 + (x2 - x1) * 0.45} ${y1}, ${x1 + (x2 - x1) * 0.55} ${y2}, ${x2} ${y2}`
      : `M${x1} ${y1} C ${x1} ${y1 + (y2 - y1) * 0.5}, ${x2} ${y1 + (y2 - y1) * 0.5}, ${x2} ${y2}`;
    setStitch({ d, w: g.width, h: g.height, key: Date.now() });
  };

  const draft = () => {
    if (drafting) return;
    setDrafting(true);
    sew();
    setRun((r) => r + 1);
    window.setTimeout(() => setDrafting(false), 2300);
    window.setTimeout(() => setStitch(null), 2600);
  };

  return (
    <div data-lenis-prevent className="absolute inset-0 overflow-y-auto">
      <section ref={section} className="mtm" aria-labelledby="mtm-title">
        <div className="mtm-dots" aria-hidden="true" />
        <div className="mtm-head">
          <p className="mtm-eyebrow">Made to measure</p>
          <h2 id="mtm-title" className="mtm-title">
            Venty turns any idea into a pattern drafted for you.
          </h2>
        </div>

        <div ref={grid} className="mtm-grid">
          <div className="mtm-col-in">
            <Composer ref={draftBtn} play={play} drafting={drafting} body={body} fit={fit} onBody={setBody} onFit={setFit} onDraft={draft} />
          </div>
          <div ref={outcome} className="mtm-col-out">
            <Outcome
              run={run}
              from={from}
              body={body}
              fit={fit}
              onReplay={() => {
                draftBtn.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
                draft();
              }}
            />
          </div>

          {stitch && (
            <svg key={stitch.key} className="mtm-stitch" width={stitch.w} height={stitch.h} viewBox={`0 0 ${stitch.w} ${stitch.h}`} aria-hidden="true">
              <defs>
                <mask id={`mtm-sew-${stitch.key}`}>
                  <path d={stitch.d} className="mtm-stitch__reveal" pathLength={1} />
                </mask>
              </defs>
              <path d={stitch.d} className="mtm-stitch__glow" mask={`url(#mtm-sew-${stitch.key})`} />
              <path d={stitch.d} className="mtm-stitch__thread" mask={`url(#mtm-sew-${stitch.key})`} />
            </svg>
          )}
        </div>
      </section>
    </div>
  );
}
