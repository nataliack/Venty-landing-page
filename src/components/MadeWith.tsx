"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* Made with Venty. Real garments sewn from Venty patterns, in the maker's
   own words. The section stays hidden until MAKES has real entries: add a
   photo to public/makes/ and the maker's permission before listing one.

   Example entry:
   { img: "/makes/slip-dress.webp", garment: "Slip dress", fabric: "Silk crepe de chine",
     maker: "First name", quote: "Their words, as they wrote them." } */

export type Make = { img: string; garment: string; fabric: string; maker: string; quote: string };

export const MAKES: Make[] = [];

export function MadeWith() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const track = el.querySelector<HTMLElement>("[data-track]")!;
      gsap.fromTo(
        track,
        { x: () => window.innerWidth * 0.15 },
        { x: () => -(track.scrollWidth - window.innerWidth * 0.85), ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.8, invalidateOnRefresh: true } },
      );
      gsap.utils.toArray<HTMLElement>("[data-make]", el).forEach((card, i) => {
        gsap.fromTo(card, { y: i % 2 ? 60 : -20 }, { y: i % 2 ? -20 : 60, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
      });
    }, el);
    return () => ctx.revert();
  }, []);

  if (MAKES.length === 0) return null;

  return (
    <section ref={ref} id="made" data-wing="perch" data-nav="Made with Venty" data-theme-zone="light" className="relative overflow-hidden py-[14vh]">
      <div className="px-5 md:px-10">
        <p className="eyebrow text-faint">Made with Venty</p>
        <h2 className="headline mt-4 max-w-[16ch] text-[clamp(2.2rem,4.5vw,4.5rem)]">Sewn by real people, on their own bodies.</h2>
      </div>
      <div data-track className="mt-[8vh] flex w-max gap-6 px-5 md:gap-10 md:px-10">
        {MAKES.map((m) => (
          <figure key={m.img} data-make className="w-[72vw] shrink-0 md:w-[28vw]">
            <div className="overflow-hidden rounded-[1.75rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.img} alt={`${m.garment} sewn by ${m.maker}`} className="aspect-[4/5] w-full object-cover" />
            </div>
            <figcaption className="mt-5">
              <blockquote className="body-lg text-fg">&ldquo;{m.quote}&rdquo;</blockquote>
              <p className="eyebrow mt-4 text-faint">
                {m.maker} · {m.garment} · {m.fabric}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
