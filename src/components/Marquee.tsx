"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const items = [
  ["Your body.", "display"],
  ["Drafted to you", "sans"],
  ["Your pattern.", "display"],
  ["A4 · A0 · Projector", "sans"],
  ["No average.", "display"],
  ["Grainlines · Notches · Labels", "sans"],
] as const;

export function Marquee() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const track = el.querySelector<HTMLElement>("[data-track]")!;
      const loop = gsap.to(track, { xPercent: -50, duration: 40, ease: "none", repeat: -1 });
      // Scroll direction nudges the speed
      ScrollTrigger.create({
        onUpdate: (self) => {
          const v = gsap.utils.clamp(-6, 6, self.getVelocity() / 200);
          gsap.to(loop, { timeScale: 1 + v, duration: 0.6, overwrite: true });
        },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-baseline gap-10 pr-10">
      {items.map(([t, f], i) => (
        <span key={i} className="flex items-baseline gap-10">
          <span
            className={
              f === "display"
                ? "font-display text-[clamp(2.6rem,6vw,6rem)] leading-none"
                : "eyebrow text-[clamp(0.8rem,1.2vw,1rem)] text-muted"
            }
          >
            {t}
          </span>
          <span className="h-2 w-2 rounded-full bg-cornflower" />
        </span>
      ))}
    </div>
  );

  return (
    <div ref={ref} className="relative overflow-hidden border-y border-line py-6" aria-hidden="true">
      <div data-track className="flex w-max will-change-transform">
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}
