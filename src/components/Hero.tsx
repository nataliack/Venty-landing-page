"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { LogoMark } from "./Logo";
import { PrimaryButton } from "./PrimaryButton";

/* Hero, replicated from the Figma frame (1440 x 810).
   Everything inside .hero-stage uses the Figma pixel values as written.
   The stage is scaled to the viewport width, so the layout is identical at
   every size, and the wrapper takes the scaled height. */

const W = 1440;
const H = 810;

export function Hero() {
  const wrap = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const fit = () => {
      const s = el.clientWidth / W;
      el.style.setProperty("--s", String(s));
      el.style.height = `${H * s}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.from("[data-bg]", { scale: 1.06, opacity: 0, duration: 2.2 }, 0)
        .from("[data-glow]", { yPercent: 40, opacity: 0, duration: 2 }, 0.2)
        .from("[data-logo]", { y: -10, opacity: 0, duration: 1.2 }, 0.6)
        .from("[data-h] > *", { y: 30, opacity: 0, duration: 1.4, stagger: 0.08, clearProps: "transform,opacity" }, 0.7)
        .from("[data-copy], [data-card], [data-cta]", { y: 16, opacity: 0, duration: 1.2, stagger: 0.1, clearProps: "transform,opacity" }, 1);
    }, el);
    return () => {
      ro.disconnect();
      ctx.revert();
    };
  }, []);

  return (
    <section ref={wrap} id="top" data-wing="hero" data-nav="Introduction" className="hero-wrap relative w-full overflow-hidden">
      <div className="hero-stage" style={{ width: W, height: H }}>
        {/* Gemini render, 1452 x 811 at -6, 0 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-bg
          src="/hero/maniki.webp"
          alt=""
          className="absolute select-none"
          style={{ width: 1452, height: 811, left: -6, top: 0, objectFit: "cover" }}
          draggable={false}
        />

        {/* Dots, masked to the 1194 x 666 ellipse at 123, 72 */}
        <div
          className="hero-dots absolute inset-0"
          style={{
            WebkitMaskImage: "radial-gradient(597px 333px at 720px 405px, #000 35%, transparent 100%)",
            maskImage: "radial-gradient(597px 333px at 720px 405px, #000 35%, transparent 100%)",
          }}
        />

        {/* Cornflower ellipse, 1566 x 638, bottom -548, blur 85, 95% */}
        <div
          data-glow
          className="absolute rounded-[50%] bg-cornflower"
          style={{ width: 1566, height: 638, left: (W - 1566) / 2, bottom: -548, opacity: 0.95, filter: "blur(85px)" }}
        />

        {/* Logo mark, 48.9 wide, top 4.07% */}
        <LogoMark
          data-logo
          className="absolute text-cornflower"
          style={{ width: 48.9, left: W / 2 - 48.9 / 2 + 0.45, top: H * 0.0407 }}
        />

        {/* Made by card, 183 x 76 at 26, 300 */}
        <a
          data-card
          href="#"
          className="hero-glass absolute flex items-center"
          style={{ width: 183, height: 76, left: 26, top: 300, padding: "4px 16px 4px 4px", gap: 8 }}
        >
          <span className="relative block shrink-0 overflow-hidden rounded-[4px]" style={{ width: 47, height: 66 }}>
            <span
              className="absolute rounded-[8px] bg-cornflower"
              style={{
                width: 75,
                height: 128,
                left: -14,
                top: -58,
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "inset 0 1.5px 2px rgba(255,255,255,0.22)",
              }}
            >
              <span className="absolute rounded-[50%]" style={{ inset: "7.33% 0 7.67% 0", background: "var(--color-night)", opacity: 0.95, filter: "blur(15px)" }} />
              <span className="absolute rounded-[50%]" style={{ left: "-10%", right: "60%", top: "-10%", bottom: "82%", background: "rgba(255,255,255,0.35)", filter: "blur(15px)" }} />
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hero/natalia.png" alt="Natalia Chamon" className="absolute" style={{ width: 63.03, height: 66, left: -8, top: 0, objectFit: "cover" }} />
          </span>
          <span className="flex flex-col items-end justify-center" style={{ width: 106, height: 66, gap: 16 }}>
            <span className="flex w-full flex-col items-start" style={{ gap: 4 }}>
              <span className="hero-t12 uppercase text-periwinkle">Made by</span>
              <span className="hero-t16 text-periwinkle">Natalia Chamon</span>
            </span>
            <span className="hero-t16 text-cloud">View more</span>
          </span>
        </a>

        {/* Right copy, 210 wide at 1200, 314 */}
        <p data-copy className="hero-t16 absolute" style={{ width: 210, left: 1200, top: 314, color: "rgba(255,255,255,0.6)" }}>
          Upload any photo from Pinterest or a magazine. Venty drafts a sewing pattern to your exact measurements, ready to print.
        </p>

        {/* Headline */}
        <div data-h>
          <span className="hero-h absolute" style={{ left: 26, top: 653 }}>The average body</span>
          <span className="hero-h hero-h--display absolute text-center" style={{ left: 26, top: 719.71, width: 184 }}>doesn&apos;t</span>
          <span className="hero-h absolute" style={{ left: 226, top: 719.71 }}>exist</span>
        </div>

        {/* Button, 179 x 56 at 1233, 713 */}
        <div data-cta className="absolute" style={{ left: W / 2 - 179 / 2 + 602.5, top: 713 }}>
          <PrimaryButton href="#cta" className="w-[179px]">Create a pattern</PrimaryButton>
        </div>
      </div>
    </section>
  );
}
