"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Orbs } from "./Orbs";
import { Wordmark } from "./Logo";
import { PrimaryButton } from "./PrimaryButton";

gsap.registerPlugin(ScrollTrigger);

/* Back to dark here, and the wordmark fills the width. */
export function Cta() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 60%",
        onEnter: () => document.documentElement.removeAttribute("data-theme"),
        onLeaveBack: () => document.documentElement.setAttribute("data-theme", "light"),
      });
      gsap.from("[data-word]", {
        yPercent: 40,
        opacity: 0,
        duration: 1.6,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 60%" },
      });
      gsap.from("[data-in]", {
        y: 30,
        opacity: 0,
        stagger: 0.1,
        duration: 1.2,
        ease: "expo.out",
        clearProps: "transform,opacity",
        scrollTrigger: { trigger: el, start: "top 50%" },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} id="cta" data-wing="close" className="relative overflow-hidden px-5 pb-10 pt-[20vh] md:px-10">
      <Orbs intensity={0.6} />
      <div className="relative z-10 grid gap-10 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <p data-in className="eyebrow text-faint">Start here</p>
          <h2 data-in className="headline mt-4 max-w-[12ch] text-[clamp(2.4rem,6vw,6.5rem)]">
            The dress in your head. On the body you have.
          </h2>
        </div>
        <div data-in className="flex flex-col gap-4 md:col-span-5 md:items-end">
          <PrimaryButton
            href="#"
            className="gap-4 pr-6"
            trailing={<span className="grid h-8 w-8 place-items-center rounded-full bg-cloud/20 text-base">→</span>}
          >
            Get started
          </PrimaryButton>
          <p className="max-w-xs text-sm text-muted md:text-right">
            Works in your browser. Add it to your home screen and it opens like an app.
          </p>
        </div>
      </div>
      <div data-word className="relative z-10 mt-[12vh] overflow-hidden">
        <Wordmark className="w-full text-fg" />
      </div>
    </section>
  );
}
