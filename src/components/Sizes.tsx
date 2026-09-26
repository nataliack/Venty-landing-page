"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

/* This section is where the page turns light. Entering it sets
   data-theme="light" on <html>; scrolling back above it restores dark. */
export function Sizes() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 55%",
        onEnter: () => document.documentElement.setAttribute("data-theme", "light"),
        onLeaveBack: () => document.documentElement.removeAttribute("data-theme"),
      });
      const rows = gsap.utils.toArray<HTMLElement>("[data-size]", el);
      rows.forEach((r) => {
        gsap.to(r.querySelector("[data-strike]"), {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { trigger: r, start: "top 60%", end: "top 40%", scrub: true },
        });
        gsap.to(r, {
          opacity: 0.25,
          ease: "none",
          scrollTrigger: { trigger: r, start: "top 55%", end: "top 40%", scrub: true },
        });
      });
      gsap.from("[data-you]", {
        yPercent: 30,
        opacity: 0,
        duration: 1.4,
        ease: "expo.out",
        scrollTrigger: { trigger: "[data-you]", start: "top 80%" },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} data-wing="story" className="relative px-5 py-[18vh] md:px-10">
      <p className="eyebrow text-faint">No sizes</p>
      <div className="mt-6 flex flex-wrap items-baseline gap-x-[0.35em] font-display text-[clamp(4rem,14vw,15rem)] leading-[0.9]">
        {sizes.map((s) => (
          <span key={s} data-size className="relative inline-block">
            {s}
            <span
              data-strike
              className="absolute left-0 top-1/2 h-[0.06em] w-full origin-left scale-x-0 bg-cornflower"
            />
          </span>
        ))}
        <span data-you className="text-cornflower">
          You.
        </span>
      </div>
      <div className="mt-14 grid gap-8 md:grid-cols-12">
        <p className="body-lg max-w-md text-muted md:col-span-6 md:col-start-7">
          A size is a compromise between thousands of bodies. Venty never asks
          which one you are. It asks how long, how wide, how close, and draws
          from there.
        </p>
      </div>
    </section>
  );
}
