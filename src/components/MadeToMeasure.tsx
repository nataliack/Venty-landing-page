"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { fadeUp, linesIn } from "@/lib/motion";
import { DitherEdge } from "./DitherEdge";

gsap.registerPlugin(ScrollTrigger);

/* Made to measure: the first light screen, one static screen.

   The hand-off from the hero: this page is pulled up over the last screen
   of the hero (-100svh), so it rises from the bottom edge while the video
   stays pinned, perfectly still, behind it. Above its top edge the cloud
   colour dithers in, square by square on a fixed screen grid (DitherEdge),
   so the video dissolves into the page rather than being wiped.

   Once it has arrived, the eyebrow and the line reveal (src/lib/motion). */
export function MadeToMeasure() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      // the line waits hidden, so it never shows before its reveal
      const line = el.querySelector("[data-line]");
      gsap.set(line, { autoAlpha: 0 });
      const reveal = gsap.timeline({ paused: true });
      fadeUp(reveal, "[data-eyebrow]", 0);
      ScrollTrigger.create({
        trigger: el,
        start: "top 20%",
        once: true,
        onEnter: () => {
          gsap.set(line, { autoAlpha: 1 });
          linesIn(reveal, line, 0.08);
          reveal.play();
        },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} id="measure" data-nav="Made to measure" data-wing="spread" data-theme-zone="light" data-theme-at="top 35%" className="measure">
      <DitherEdge color="#eff4ff" />
      <div className="measure__sheet">
        <div aria-hidden className="measure__dots" />
        <div className="measure__copy">
          <p data-eyebrow className="measure__eyebrow">
            Made to measure
          </p>
          <h2 data-line className="measure__title">
            Venty turns any idea into a pattern drafted for you.
          </h2>
        </div>
      </div>
    </section>
  );
}
