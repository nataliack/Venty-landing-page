"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* FAQ. One answer open at a time. The open answer gets a stitched thread
   down its left edge, drawn as it opens. */

// The privacy answer describes how the app handles data: confirm it with Natalia before launch.
const QA = [
  {
    q: "How accurate is the fit?",
    a: "As accurate as the measurements you give it. Venty drafts every piece from your numbers, and each measure shows where the tape goes. For anything close-fitting, sew a quick test version first, adjust your body in Venty and draft again.",
  },
  {
    q: "What can I make?",
    a: "Dresses, tops, trousers and skirts. Start from a photo or a few words, choose how close it should sit, and Venty drafts the pieces.",
  },
  {
    q: "Do I need to be an experienced sewist?",
    a: "No. If you can cut along a line and sew a straight seam, you can start. Fit is described in plain words, and every piece is labelled with grainlines and notches.",
  },
  {
    q: "What happens to my photos and measurements?",
    a: "They're used to draft your patterns and are kept in your account. You can delete a photo or a body whenever you like.",
  },
];

export function Faq() {
  const ref = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-faq-head] > *, [data-qa]", {
        y: 40,
        opacity: 0,
        stagger: 0.07,
        duration: 1.2,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 70%" },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.querySelectorAll<HTMLElement>("[data-qa]").forEach((item, i) => {
      const panel = item.querySelector<HTMLElement>("[data-panel]")!;
      const stitch = item.querySelector<HTMLElement>("[data-stitch]")!;
      const isOpen = i === open;
      gsap.to(panel, { height: isOpen ? "auto" : 0, duration: reduce ? 0 : 0.8, ease: "expo.out", overwrite: true });
      gsap.to(stitch, { scaleY: isOpen ? 1 : 0, duration: reduce ? 0 : isOpen ? 1.1 : 0.4, delay: isOpen ? 0.1 : 0, ease: isOpen ? "power2.out" : "power2.in", overwrite: true });
      gsap.to(panel.firstElementChild, { y: isOpen ? 0 : -16, opacity: isOpen ? 1 : 0, duration: reduce ? 0 : 0.7, ease: "expo.out", overwrite: true });
    });
  }, [open]);

  return (
    <section ref={ref} id="faq" data-wing="perch" data-nav="FAQ" data-theme-zone="light" className="relative px-5 py-[16vh] md:px-10">
      <div className="grid gap-12 md:grid-cols-12">
        <div data-faq-head className="md:col-span-4">
          <p className="eyebrow text-faint">FAQ</p>
          <h2 className="headline mt-4 max-w-[10ch] text-[clamp(2.4rem,5vw,5rem)]">Before you cut.</h2>
        </div>

        <ul className="border-t border-line-strong md:col-span-8">
          {QA.map((item, i) => {
            const isOpen = i === open;
            return (
              <li key={item.q} data-qa className="border-b border-line-strong">
                <h3>
                  <button
                    type="button"
                    id={`faq-q-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="group flex w-full items-baseline gap-5 py-7 text-left md:gap-8 md:py-9"
                  >
                    <span className={`font-display w-7 shrink-0 text-lg transition-colors duration-500 ${isOpen ? "text-cornflower" : "text-faint"}`}>0{i + 1}</span>
                    <span className="flex-1 text-[clamp(1.4rem,2.8vw,2.6rem)] font-normal leading-[1.05] tracking-[-0.035em] transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:translate-x-2">
                      {item.q}
                    </span>
                    <span aria-hidden className="relative h-5 w-5 shrink-0 self-center">
                      <span className="absolute left-0 top-1/2 h-px w-full bg-fg" />
                      <span className={`absolute left-1/2 top-0 h-full w-px bg-fg transition-transform duration-500 ease-[var(--ease-out-expo)] ${isOpen ? "scale-y-0" : ""}`} />
                    </span>
                  </button>
                </h3>
                <div id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} data-panel inert={!isOpen} className="h-0 overflow-hidden">
                  <div className="relative pb-9 pl-10 md:pl-[4.25rem]">
                    <span
                      data-stitch
                      aria-hidden
                      className="absolute bottom-9 left-[0.55rem] top-1 w-[2px] origin-top scale-y-0 bg-[repeating-linear-gradient(180deg,var(--color-cornflower)_0_7px,transparent_7px_12px)] md:left-[0.7rem]"
                    />
                    <p className="body-lg max-w-[52ch] text-muted">{item.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
