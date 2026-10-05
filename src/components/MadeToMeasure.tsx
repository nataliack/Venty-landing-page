"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { fadeUp, linesIn } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

/* Made to measure: the first light section, one static screen.

   The hand-off from the hero: this page is pulled up over the last screen
   of the hero (-100svh), so it rises from the bottom edge while the video
   stays pinned behind it. It comes up out of the hero's bottom glow: its top
   edge is a dome the shape of that glow, with a cornflower halo around it,
   and the dome flattens as the page reaches the top. No fades.

   Once it has arrived, the eyebrow and the line reveal (src/lib/motion). */
export function MadeToMeasure() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      // the dome flattens and the halo burns off as the page rises
      if (!still) {
        gsap
          .timeline({ scrollTrigger: { trigger: el, start: "top bottom", end: "top top", scrub: true } })
          // over the whole rise (the timeline is 1 long: 0 = entering, 1 = at the top)
          .fromTo(el, { "--curve": 1 }, { "--curve": 0, duration: 1, ease: "power2.in" }, 0)
          .fromTo("[data-halo]", { opacity: 1 }, { opacity: 0, duration: 0.5, ease: "power1.in" }, 0.5);
      } else {
        gsap.set(el, { "--curve": 0 });
      }

      // the copy, once the page has (nearly) arrived; the line waits
      // hidden, so it never shows before its reveal
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
    <section ref={ref} id="measure" data-nav="Made to measure" data-wing="spread" data-theme-zone="light" data-theme-at="top 12%" className="measure">
      {/* the cornflower light around the rising edge, behind the page */}
      <div data-halo aria-hidden className="measure__halo" />
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
