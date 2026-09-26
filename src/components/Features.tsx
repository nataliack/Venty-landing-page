"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const features = [
  { n: "01", t: "Body library", d: "Every body you build, with its history. Measure again next spring and keep both.", tag: "24 measures" },
  { n: "02", t: "Realistic and pattern view", d: "Rotate the garment on your body, then flip to see every piece and what it does.", tag: "3D" },
  { n: "03", t: "Fit in plain words", d: "Close, easy or loose. Technical terms are a setting, never a wall.", tag: "Ease" },
  { n: "04", t: "Fabric that suits the shape", d: "Venty suggests fabrics that will hang the way you imagined, and flags the ones that will fight you.", tag: "Silk · Linen · Wool" },
  { n: "05", t: "Print at true size", d: "A4, A0 or projector. Seam allowance in or out. Page maps for taping. Every piece labelled.", tag: "1:1" },
  { n: "06", t: "Pattern library", d: "Versions, notes, the body it was drafted on, and print again whenever you want.", tag: "History" },
];

/* Typographic list. No cards. Hover a row and a small gradient tile follows the
   cursor, the number turns cornflower, the description slides open. */
export function Features() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-row]", {
        y: 40,
        opacity: 0,
        stagger: 0.08,
        duration: 1.2,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 70%" },
      });
      const tile = el.querySelector<HTMLElement>("[data-tile]")!;
      const tx = gsap.quickTo(tile, "x", { duration: 0.5, ease: "power3" });
      const ty = gsap.quickTo(tile, "y", { duration: 0.5, ease: "power3" });
      const list = el.querySelector<HTMLElement>("[data-list]")!;
      const onMove = (e: PointerEvent) => {
        const r = list.getBoundingClientRect();
        tx(e.clientX - r.left - 90);
        ty(e.clientY - r.top - 110);
      };
      list.addEventListener("pointermove", onMove);
      list.addEventListener("pointerenter", () => gsap.to(tile, { opacity: 1, scale: 1, duration: 0.5, ease: "expo.out" }));
      list.addEventListener("pointerleave", () => gsap.to(tile, { opacity: 0, scale: 0.8, duration: 0.5, ease: "expo.out" }));
      el.querySelectorAll<HTMLElement>("[data-row]").forEach((row) => {
        const label = tile.querySelector<HTMLElement>("[data-tile-label]")!;
        row.addEventListener("pointerenter", () => (label.textContent = row.dataset.tag ?? ""));
      });
      return () => list.removeEventListener("pointermove", onMove);
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} id="features" data-wing="perch" className="relative px-5 py-[16vh] md:px-10">
      <div className="grid gap-8 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <p className="eyebrow text-faint">Inside</p>
          <h2 className="headline mt-4 max-w-[12ch] text-[clamp(2.4rem,6vw,6.5rem)]">Everything a pattern needs. Nothing it doesn&apos;t.</h2>
        </div>
      </div>

      <div data-list className="relative mt-16 border-t border-line">
        <div
          data-tile
          className="card-grad pointer-events-none absolute left-0 top-0 z-10 hidden h-[220px] w-[180px] scale-75 items-end p-4 text-cloud opacity-0 md:flex"
        >
          <span data-tile-label className="font-display text-2xl leading-none" />
        </div>
        {features.map((f) => (
          <div
            key={f.n}
            data-row
            data-tag={f.tag}
            className="group grid cursor-default grid-cols-[3rem_1fr] items-baseline gap-4 border-b border-line py-7 transition-colors md:grid-cols-[6rem_1fr_1fr] md:py-9"
          >
            <span className="font-display text-xl text-faint transition-colors duration-500 group-hover:text-cornflower md:text-3xl">{f.n}</span>
            <h3 className="text-[clamp(1.6rem,3.4vw,3.4rem)] font-normal leading-none tracking-[-0.03em] transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:translate-x-3">
              {f.t}
            </h3>
            <p className="col-start-2 max-w-md text-muted md:col-start-3 md:max-w-sm md:justify-self-end md:text-right md:opacity-60 md:transition-opacity md:duration-500 md:group-hover:opacity-100">
              {f.d}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
