"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

export function Manifesto() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const p = el.querySelector<HTMLElement>("[data-statement]")!;
      const split = new SplitText(p, { type: "words" });
      gsap.set(split.words, { opacity: 0.16 });
      gsap.to(split.words, {
        opacity: 1,
        stagger: 0.08,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top 70%",
          end: "bottom 60%",
          scrub: 0.6,
        },
      });
      gsap.from("[data-aside]", {
        y: 30,
        opacity: 0,
        duration: 1.2,
        ease: "expo.out",
        scrollTrigger: { trigger: "[data-aside]", start: "top 85%" },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} data-wing="fold" className="relative px-5 py-[18vh] md:px-10">
      <p className="eyebrow text-faint">Why Venty</p>
      <p
        data-statement
        className="headline mt-8 max-w-[18ch] text-[clamp(2.4rem,6.5vw,6.8rem)]"
      >
        Shop patterns are drafted for an average body almost nobody has. So you
        hunt, you redraft, you compromise. The body is never the problem. The
        pattern is.
      </p>
      <div data-aside className="mt-16 grid gap-8 md:grid-cols-12">
        <p className="font-display text-[clamp(4rem,10vw,10rem)] leading-none text-cornflower md:col-span-5">
          1<span className="text-faint">/</span>1
        </p>
        <p className="body-lg max-w-md text-muted md:col-span-7 md:pt-4">
          One pattern for one body. Venty starts from your measurements, not a
          size chart, and every piece it draws already fits.
        </p>
      </div>
    </section>
  );
}
