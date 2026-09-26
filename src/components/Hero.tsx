"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Orbs } from "./Orbs";
import { LogoMark } from "./Logo";

gsap.registerPlugin(ScrollTrigger, SplitText);

export function Hero() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const h1 = el.querySelector("h1")!;
      const split = new SplitText(h1, { type: "lines,words", linesClass: "overflow-hidden pb-[0.08em]" });
      gsap.set(el.querySelectorAll(".reveal"), { opacity: 1 });
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.from(split.words, { yPercent: 110, rotate: 3, duration: 1.4, stagger: 0.04 }, 0.2)
        .from("[data-eyebrow]", { y: 12, opacity: 0, duration: 1 }, 0.3)
        .from("[data-sub]", { y: 20, opacity: 0, duration: 1.2 }, 0.7)
        .from("[data-cta] > *", { y: 20, opacity: 0, duration: 1, stagger: 0.08 }, 0.9)
        .from("[data-mark]", { scale: 0.85, opacity: 0, duration: 2, ease: "expo.out" }, 0.1)
        .from("[data-readout]", { opacity: 0, duration: 1 }, 1.1);

      // Bust readout counts up from 0 to 88.0
      const num = { v: 0 };
      const out = el.querySelector<HTMLElement>("[data-num]")!;
      gsap.to(num, {
        v: 88,
        duration: 2.2,
        delay: 1.1,
        ease: "expo.out",
        onUpdate: () => (out.textContent = num.v.toFixed(1)),
      });

      // Parallax out on scroll
      gsap.to("[data-content]", {
        yPercent: -18,
        opacity: 0,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to("[data-mark]", {
        yPercent: 30,
        scale: 1.2,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} id="top" className="relative flex min-h-[100svh] flex-col overflow-hidden">
      <Orbs />
      <LogoMark
        data-mark
        className="pointer-events-none absolute left-1/2 top-[8%] w-[120vw] max-w-none -translate-x-1/2 text-cloud opacity-[0.045] md:w-[70vw]"
      />

      <div data-content className="relative z-10 flex flex-1 flex-col justify-end px-5 pb-10 pt-40 md:px-10 md:pb-14">
        <p data-eyebrow className="eyebrow reveal text-muted">
          AI pattern studio
        </p>
        <h1 className="headline reveal mt-5 max-w-[12ch] text-[clamp(3.2rem,9.5vw,9.5rem)]">
          See a dress you love. Wear it, made for you.
        </h1>
        <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <p data-sub className="body-lg reveal max-w-md text-muted">
            Upload any photo from Pinterest or a magazine. Venty drafts a sewing
            pattern to your exact measurements, shows it on a body that is yours,
            and prints it ready to cut.
          </p>
          <div data-cta className="reveal flex items-center gap-3">
            <a
              href="#cta"
              className="rounded-full bg-cornflower px-7 py-4 text-base font-medium text-cloud transition-transform duration-500 ease-[var(--ease-out-expo)] hover:scale-[1.04]"
            >
              Get started
            </a>
            <a
              href="#how"
              className="glass rounded-full px-7 py-4 text-base font-normal text-fg transition-colors hover:text-cornflower"
            >
              How it works
            </a>
          </div>
        </div>
      </div>

      {/* Live readout strip */}
      <div data-readout className="reveal relative z-10 border-t border-line px-5 md:px-10">
        <div className="flex items-end justify-between gap-6 py-5">
          <div className="flex items-baseline gap-3">
            <span data-num className="font-display text-[clamp(2.4rem,5vw,4.5rem)] leading-none tabular-nums">
              0.0
            </span>
            <span className="eyebrow text-faint">Bust · cm</span>
          </div>
          <div className="ticks hidden w-1/2 text-cloud md:block" />
          <p className="eyebrow hidden text-faint lg:block">Scroll</p>
        </div>
      </div>
    </section>
  );
}
