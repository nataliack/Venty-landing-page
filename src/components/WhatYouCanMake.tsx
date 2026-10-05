"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

/* What you can make. The page turns light. Four giant words drift across
   the screen in alternate directions; as each one crosses the middle it
   fills with cornflower and its technical flat draws itself beside it. */

const GARMENTS = [
  {
    w: "Dresses",
    d: [
      "M78 20 L82 72 M122 20 L118 72",
      "M70 74 Q85 64 100 82 Q115 64 130 74 L134 112 L160 240 Q100 252 40 240 L66 112 Z",
      "M66 112 Q100 118 134 112",
      "M100 120 L100 240",
    ],
  },
  {
    w: "Tops",
    d: [
      "M70 30 Q100 52 130 30 L160 44 L174 82 L150 88 L146 74 L146 172 L54 172 L54 74 L50 88 L26 82 L40 44 Z",
      "M78 36 Q100 56 122 36",
      "M100 44 L100 172",
    ],
  },
  {
    w: "Trousers",
    d: [
      "M58 20 L142 20 L146 42 L170 240 L112 240 L100 84 L88 240 L30 240 L54 42 Z",
      "M54 42 L146 42",
      "M100 42 L100 84",
      "M68 42 L70 60 M132 42 L130 60",
    ],
  },
  {
    w: "Skirts",
    d: [
      "M64 40 L136 40 L138 58 L172 222 Q100 234 28 222 L62 58 Z",
      "M62 58 L138 58",
      "M84 58 L74 140 M116 58 L126 140",
    ],
  },
];

export function WhatYouCanMake() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      gsap.from("[data-make-head] > *", {
        y: 40,
        opacity: 0,
        stagger: 0.08,
        duration: 1.2,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 70%" },
      });
      gsap.utils.toArray<HTMLElement>("[data-row]", el).forEach((row, i) => {
        const dir = i % 2 ? -1 : 1;
        if (!reduce) {
          gsap.fromTo(
            row.querySelector("[data-drift]"),
            // a gentle drift inside the row's padding, so no word leaves the screen
            { xPercent: -4 * dir },
            { xPercent: 4 * dir, ease: "none", scrollTrigger: { trigger: row, start: "top bottom", end: "bottom top", scrub: 0.6 } },
          );
        }
        gsap.fromTo(
          row.querySelector("[data-fill]"),
          { clipPath: "inset(0 100% 0 0)" },
          { clipPath: "inset(0 0% 0 0)", ease: "none", scrollTrigger: { trigger: row, start: "top 75%", end: "center 45%", scrub: 0.6 } },
        );
        gsap.fromTo(
          row.querySelectorAll("[data-sketch] [data-draw]"),
          { drawSVG: "0%" },
          { drawSVG: "100%", ease: "none", scrollTrigger: { trigger: row, start: "top 80%", end: "center 45%", scrub: 0.6 } },
        );
        // seams and topstitching are dashed, so they fade in rather than draw
        gsap.fromTo(
          row.querySelectorAll("[data-sketch] [data-seam]"),
          { opacity: 0 },
          { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: row, start: "top 55%", end: "center 45%", scrub: 0.6 } },
        );
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} id="make" data-wing="story" data-nav="What you can make" data-theme-zone="light" className="relative overflow-hidden py-[16vh]">
      <div data-make-head className="px-5 md:px-10">
        <p className="eyebrow text-faint">What you can make</p>
        <h2 className="headline mt-4 max-w-[18ch] text-[clamp(2.2rem,4.5vw,4.5rem)]">Four kinds of garment, every one drafted from your body.</h2>
      </div>

      <ul className="mt-[10vh] flex flex-col gap-[4vh]">
        {GARMENTS.map((g, i) => (
          <li key={g.w} data-row className="relative">
            <div data-drift className={`flex items-center gap-[3vw] whitespace-nowrap px-[8vw] ${i % 2 ? "flex-row-reverse justify-start" : ""}`}>
              <span className="eyebrow shrink-0 self-start pt-[2vw] text-faint">0{i + 1}</span>
              <span className="relative block font-display text-[clamp(3rem,15vw,17rem)] leading-[0.85]">
                <span className="make-outline block">{g.w}</span>
                <span data-fill aria-hidden className="absolute inset-0 block text-cornflower">{g.w}</span>
              </span>
              <svg data-sketch viewBox="0 0 200 260" className="h-[clamp(3rem,15vw,16rem)] w-auto shrink-0 overflow-visible" aria-hidden>
                {g.d.map((d, k) => (
                  <path key={k} {...(k === 0 ? { "data-draw": "" } : { "data-seam": "" })} d={d} fill="none" stroke="currentColor" strokeWidth={k === 0 ? 2 : 1.25} strokeDasharray={k === 0 ? undefined : "4 4"} strokeLinejoin="round" strokeLinecap="round" />
                ))}
              </svg>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
