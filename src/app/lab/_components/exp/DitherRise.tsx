"use client";

import { useState } from "react";
import { DitherEdge, type DitherEdgeMode, type DitherPattern } from "@/components/DitherEdge";
import { HERO } from "@/lib/heroSequence";

/* The hero to Made to measure hand-off, on its own: the hero's last frame
   pinned, the light page rising over it, and the dithered edge in each of
   its patterns and edge shapes. Scroll to run it; pick above. */

const PATTERNS: { key: DitherPattern; label: string }[] = [
  { key: "squares", label: "Squares" },
  { key: "dots", label: "Dots" },
  { key: "stitch", label: "Stitch" },
  { key: "weave", label: "Weave" },
  { key: "cross", label: "Cross-stitch" },
];
const EDGES: { key: DitherEdgeMode; label: string }[] = [
  { key: "noise", label: "Lumps" },
  { key: "wave", label: "Wave" },
];
const FRAME = `/hero/sequence/frames/0575.webp?v=${HERO.version}`;

export function DitherRise() {
  const [pattern, setPattern] = useState<DitherPattern>("dots");
  const [edge, setEdge] = useState<DitherEdgeMode>("wave");

  return (
    <div className="absolute inset-0 overflow-y-auto overscroll-contain">
      {/* the hero's last screen, pinned */}
      <div className="relative h-[260svh]">
        <div className="sticky top-0 h-[100svh] overflow-hidden bg-night">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={FRAME} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="hero-fit-wrap absolute inset-0 flex items-start text-cloud md:items-center">
            <div className="relative">
              <h2 className="hero-fit">A perfect fit. On a body that isn&apos;t real.</h2>
              <p className="hero-fit__sub">Shop patterns are drafted for the average body. Venty drafts for yours.</p>
            </div>
          </div>
          <p className="absolute bottom-[96px] left-1/2 -translate-x-1/2 text-[12px] uppercase tracking-[0.18em] text-cloud/60">Scroll</p>
        </div>
      </div>

      {/* Made to measure, rising over it */}
      <section className="measure">
        <DitherEdge key={`${pattern}-${edge}`} color="#eff4ff" pattern={pattern} edge={edge} />
        <div className="measure__sheet">
          <div aria-hidden className="measure__dots" />
          <div className="measure__copy">
            <p className="measure__eyebrow">Made to measure</p>
            <h2 className="measure__title">Venty turns any idea into a pattern drafted for you.</h2>
          </div>
        </div>
      </section>

      {/* pick a pattern and an edge */}
      <div className="lab-glass fixed left-1/2 top-[max(16px,env(safe-area-inset-top))] z-[80] flex max-w-[calc(100vw-24px)] -translate-x-1/2 flex-wrap items-center justify-center gap-1 rounded-[22px] p-1 text-[13px]">
        {PATTERNS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPattern(p.key)}
            aria-pressed={pattern === p.key}
            className={`rounded-full px-3 py-1.5 transition-colors ${pattern === p.key ? "bg-cloud text-ink" : "text-cloud hover:bg-cloud/10"}`}
          >
            {p.label}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-cloud/20" aria-hidden />
        {EDGES.map((e) => (
          <button
            key={e.key}
            type="button"
            onClick={() => setEdge(e.key)}
            aria-pressed={edge === e.key}
            className={`rounded-full px-3 py-1.5 transition-colors ${edge === e.key ? "bg-cornflower text-cloud" : "text-cloud hover:bg-cloud/10"}`}
          >
            {e.label}
          </button>
        ))}
      </div>
    </div>
  );
}
