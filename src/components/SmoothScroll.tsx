"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* The page scrolls inside #scroller (see layout.tsx), never the window.
   A window that never scrolls is what keeps Safari's and Chrome's toolbars
   from collapsing and growing back while you scroll, so the viewport, and
   every pinned scene, keeps one height. Every ScrollTrigger uses #scroller.
   It is set when this module loads in the browser, which is after the
   server HTML (and so #scroller) is in the page and before any section
   creates a trigger. It has to be the element: a selector string would be
   looked up inside each section's gsap.context and not found. */
export const SCROLLER_ID = "scroller";
const scroller = typeof document === "undefined" ? null : document.getElementById(SCROLLER_ID);
if (scroller) ScrollTrigger.defaults({ scroller });

let lenis: Lenis | null = null;

/** Scrolls the page to an element: through Lenis when it runs, which would
    otherwise cancel a native smooth scroll, and natively when it does not. */
export function scrollToElement(el: HTMLElement) {
  if (lenis) lenis.scrollTo(el, { duration: 1.6 });
  else el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Scrolls the page to a position in px: smoothly, or at once (dragging) */
export function scrollToY(y: number, immediate = false) {
  if (lenis) lenis.scrollTo(y, immediate ? { immediate: true } : { duration: 1.2 });
  else document.getElementById(SCROLLER_ID)?.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" });
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const content = useRef<HTMLDivElement>(null);

  // When the page's height changes after the triggers were placed (an image
  // or a section that sizes itself late), every trigger below it would fire
  // in the wrong place: measure them again, once it settles.
  useEffect(() => {
    const el = content.current;
    if (!el) return;
    let h = el.offsetHeight;
    let t = 0;
    const ro = new ResizeObserver(() => {
      if (el.offsetHeight === h) return;
      h = el.offsetHeight;
      window.clearTimeout(t);
      t = window.setTimeout(() => ScrollTrigger.refresh(), 250);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wrapper = scroller ?? document.getElementById(SCROLLER_ID);
    if (reduce || !wrapper || !content.current) return;

    lenis = new Lenis({
      wrapper,
      content: content.current,
      lerp: 0.09,
      wheelMultiplier: 0.9,
      smoothWheel: true,
    });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis?.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  return (
    <div ref={content} className="relative z-[1]">
      {children}
    </div>
  );
}
