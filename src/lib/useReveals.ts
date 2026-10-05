"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { STAGGER, fadeUp, linesIn, textIn } from "./motion";

gsap.registerPlugin(ScrollTrigger);

/* Scroll reveals for a section, from the motion system (docs/motion.md).
   Every [data-reveal] group inside the root plays once, when its top
   reaches 78% of the screen (or its own data-reveal value, a ScrollTrigger
   start). Inside a group:

     [data-rise]   a span already in a .line-mask: rises from its mask
     [data-lines]  running text: split into masked lines, which rise
     [data-up]     an object: fades up into place

   The groups are built once the fonts are in, so lines split where they
   will really break. Everything waits hidden from then on (the sections
   that use this are far below the first screen). */
export function useReveals(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let ctx: gsap.Context | null = null;
    let dead = false;
    document.fonts.ready.then(() => {
      if (dead) return;
      ctx = gsap.context(() => {
        el.querySelectorAll<HTMLElement>("[data-reveal]").forEach((group) => {
          const tl = gsap.timeline({ paused: true });
          const rise = group.querySelectorAll("[data-rise]");
          if (rise.length) textIn(tl, rise, 0);
          group.querySelectorAll("[data-lines]").forEach((p, i) => linesIn(tl, p, 0.12 + i * STAGGER.items));
          const up = group.querySelectorAll("[data-up]");
          if (up.length) fadeUp(tl, up, 0.18);
          // a bare data-reveal comes through from JSX as "true"
          const at = group.dataset.reveal;
          ScrollTrigger.create({
            trigger: group,
            start: at && at !== "true" ? at : "top 78%",
            once: true,
            onEnter: () => {
              tl.play();
              group.classList.add("is-in");
            },
          });
        });
      }, el);
    });
    return () => {
      dead = true;
      ctx?.revert();
    };
  }, [root]);
}
