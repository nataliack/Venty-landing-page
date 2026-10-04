"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { LogoMark } from "./Logo";
import { PrimaryButton } from "./PrimaryButton";
import { APP_URL, CTA_LABEL } from "@/lib/site";
import { createSequence } from "@/lib/sequence";

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

/* Hero, three frames on one pinned scroll.
   1.1 Opening   she lies on the liquid. Headline, line, button.
   1.2 Problem   she stands, dressed. "This body doesn't exist." A standard
                 size spec runs across her.
   1.3 Hand-off  "Yours does." The spec is struck out and rewritten as yours,
                 then the scene dissolves into pattern paper, which is where
                 Photo to pattern begins.

   The scene is an image sequence. Until the frames are rendered it is the
   still. Drop frames in public/hero/seq/f_001.webp ... and set FRAMES. */

const FRAMES = 0;
const FRAME_W = 1920;
const FRAME_H = 1080;
const SEQ_END = 0.74; // the sequence plays over this much of the scroll, then the hand-off
const frameSrc = (i: number) => `/hero/seq/f_${String(i + 1).padStart(3, "0")}.webp`;

const SPEC = [
  { k: "Bust", v: "92 cm", top: "29%" },
  { k: "Waist", v: "74 cm", top: "70%" },
  { k: "Hip", v: "99 cm", top: "83%" },
];

export function Hero() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = el.querySelector<HTMLCanvasElement>("[data-seq]");
    const seq = canvas && FRAMES > 0 ? createSequence({ canvas, count: FRAMES, width: FRAME_W, height: FRAME_H, src: frameSrc }) : null;
    seq?.load();

    const ctx = gsap.context(() => {
      // 1.1 arrives on load
      const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
      intro
        .from("[data-scene]", { scale: 1.08, opacity: 0, duration: 2.4 }, 0)
        .from("[data-glow]", { yPercent: 40, opacity: 0, duration: 2 }, 0.2)
        .from("[data-logo]", { y: -10, opacity: 0, duration: 1.2 }, 0.6)
        .from("[data-h1] [data-w]", { yPercent: 110, duration: 1.4, stagger: 0.06 }, 0.7)
        .from("[data-intro]", { y: 16, opacity: 0, duration: 1.2, stagger: 0.1, clearProps: "transform,opacity" }, 1);

      const split2 = SplitText.create("[data-h2]", { type: "words", mask: "words" });
      const split3 = SplitText.create("[data-h3]", { type: "chars", mask: "chars" });

      gsap.set("[data-f2], [data-f3], [data-spec]", { autoAlpha: 1 });
      gsap.set([split2.words, split3.chars], { yPercent: 110 });
      gsap.set("[data-f2] [data-sub], [data-f3] [data-sub], [data-row]", { opacity: 0, y: reduce ? 0 : 14 });
      gsap.set("[data-rule]", { scaleX: 0 });
      gsap.set("[data-strike]", { scaleX: 0 });
      gsap.set("[data-paper]", { "--r": "0%" });

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
          onUpdate: (self) => seq?.set(self.progress / SEQ_END),
        },
      });

      const move = reduce ? 0 : 1;
      tl
        // the camera leans in while she rises
        .to("[data-scene]", { scale: 1 + 0.16 * move, yPercent: -5 * move, ease: "none", duration: SEQ_END }, 0)
        .to("[data-glow]", { yPercent: -18 * move, ease: "none", duration: SEQ_END }, 0)

        // 1.1 out
        .to("[data-f1-head]", { y: -80 * move, opacity: 0, filter: reduce ? "none" : "blur(10px)", duration: 0.09 }, 0.05)
        .to("[data-f1-side]", { opacity: 0, y: -30 * move, duration: 0.07, stagger: 0.01 }, 0.05)
        .to("[data-cue]", { opacity: 0, duration: 0.03 }, 0.02)

        // 1.2 in: the standard body
        .to("[data-dim]", { opacity: 0.45, duration: 0.1 }, 0.14)
        .to("[data-rule]", { scaleX: 1, duration: 0.1, stagger: 0.025, ease: "power3.out" }, 0.16)
        .to("[data-row]", { opacity: 1, y: 0, duration: 0.06, stagger: 0.025 }, 0.19)
        .to(split2.words, { yPercent: 0, duration: 0.07, stagger: 0.012, ease: "power3.out" }, 0.2)
        .to("[data-f2] [data-sub]", { opacity: 1, y: 0, duration: 0.06 }, 0.27)

        // 1.2 out: struck through
        .to("[data-strike]", { scaleX: 1, duration: 0.06, stagger: 0.02, ease: "power2.in" }, 0.38)
        .to(split2.words, { yPercent: -110, duration: 0.06, stagger: 0.008, ease: "power3.in" }, 0.44)
        .to("[data-f2] [data-sub]", { opacity: 0, duration: 0.04 }, 0.44)

        // 1.3 in: the spec is rewritten as yours
        .to("[data-dim]", { opacity: 0, duration: 0.08 }, 0.48)
        .to("[data-strike]", { opacity: 0, duration: 0.04 }, 0.5)
        .to("[data-spec-title]", { scrambleText: { text: "Your measurements", chars: "lowerCase", speed: 0.6 }, duration: 0.08, ease: "none" }, 0.5)
        .to("[data-val]", { scrambleText: { text: "Yours", chars: "0123456789.", speed: 0.6 }, duration: 0.08, stagger: 0.02, ease: "none" }, 0.5)
        .to("[data-val]", { color: "var(--color-cornflower)", duration: 0.04 }, 0.56)
        .to(split3.chars, { yPercent: 0, duration: 0.08, stagger: 0.012, ease: "power3.out" }, 0.52)
        .to("[data-f3] [data-sub]", { opacity: 1, y: 0, duration: 0.06 }, 0.6)
        .to("[data-glow]", { scale: 1.1, duration: 0.15 }, 0.52)

        // hand-off: the scene dissolves into pattern paper
        .to("[data-paper]", { "--r": "140%", duration: 0.2, ease: "power2.in" }, SEQ_END)
        .to("[data-scene]", { opacity: 0, scale: `+=${0.12 * move}`, duration: 0.18, ease: "power1.in" }, SEQ_END + 0.04)
        .to("[data-rule]", { opacity: 0, duration: 0.08 }, SEQ_END + 0.02)
        .to("[data-row]", { opacity: 0, duration: 0.06 }, SEQ_END + 0.02)
        .to("[data-f3] [data-sub]", { opacity: 0, duration: 0.04 }, SEQ_END + 0.06)
        .to(split3.chars, { yPercent: -110, duration: 0.06, stagger: 0.008, ease: "power3.in" }, SEQ_END + 0.1)
        .to("[data-glow]", { opacity: 0, duration: 0.1 }, SEQ_END + 0.08)
        .set({}, {}, 1);
    }, el);

    return () => {
      seq?.destroy();
      ctx.revert();
    };
  }, []);

  return (
    <section ref={ref} id="top" data-wing="hero" data-nav="Introduction" data-theme-zone="dark" className="relative h-[420vh]">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-night">
        {/* scene: the sequence when it exists, the still until then */}
        <div data-scene className="absolute inset-0 will-change-transform">
          {FRAMES > 0 ? (
            <canvas data-seq aria-hidden className="absolute inset-0 h-full w-full" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/hero/maniki.webp" alt="" draggable={false} className="absolute inset-0 h-full w-full select-none object-cover" />
          )}
          <div
            className="hero-dots absolute inset-0"
            style={{
              WebkitMaskImage: "radial-gradient(42% 41% at 50% 50%, #000 35%, transparent 100%)",
              maskImage: "radial-gradient(42% 41% at 50% 50%, #000 35%, transparent 100%)",
            }}
          />
        </div>
        <div data-dim aria-hidden className="pointer-events-none absolute inset-0 bg-night opacity-0" />

        {/* cornflower ellipse rising from the bottom edge */}
        <div
          data-glow
          aria-hidden
          className="pointer-events-none absolute left-1/2 rounded-[50%] bg-cornflower"
          style={{ width: "109vw", height: "79vh", bottom: "-68vh", translate: "-50% 0", opacity: 0.95, filter: "blur(85px)" }}
        />

        {/* pattern paper, revealed from the centre at the hand-off */}
        <div data-paper aria-hidden className="paper-grid paper-reveal absolute inset-0 z-10" />

        {/* the spec that runs across her in 1.2 and 1.3 */}
        <div data-spec aria-hidden className="invisible absolute inset-0 z-20 px-5 text-cloud md:px-10">
          <p data-row className="eyebrow absolute left-5 top-[22%] text-periwinkle md:left-10">
            <span data-spec-title>Standard size 12</span>
          </p>
          {SPEC.map((s) => (
            <div key={s.k} className="absolute inset-x-5 flex items-center gap-4 md:inset-x-10" style={{ top: s.top }}>
              <span data-row className="eyebrow w-14 shrink-0 text-periwinkle">{s.k}</span>
              <span data-rule className="h-px flex-1 origin-left bg-[repeating-linear-gradient(90deg,var(--color-cloud)_0_6px,transparent_6px_12px)] opacity-50" />
              <span data-row className="relative shrink-0 font-display text-[clamp(1.1rem,2vw,1.75rem)] tabular-nums">
                <span data-val>{s.v}</span>
                <span data-strike className="absolute -inset-x-1 top-1/2 h-[2px] origin-left bg-cornflower" />
              </span>
            </div>
          ))}
        </div>

        {/* 1.1 */}
        <LogoMark data-logo className="absolute right-5 top-[26px] z-30 w-[clamp(36px,3.4vw,49px)] text-cornflower md:left-1/2 md:right-auto md:top-[4%] md:-translate-x-1/2" />

        <a
          data-f1-side
          href="#maker"
          className="hero-glass absolute left-5 top-[37%] z-30 hidden items-center md:left-[26px] md:flex"
          style={{ width: 183, height: 76, padding: "4px 16px 4px 4px", gap: 8 }}
        >
          <span data-intro className="relative block shrink-0 overflow-hidden rounded-[4px] bg-cornflower" style={{ width: 47, height: 66 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hero/natalia.png" alt="Natalia Chamon" className="absolute" style={{ width: 63, height: 66, left: -8, top: 0, objectFit: "cover" }} />
          </span>
          <span data-intro className="flex flex-col justify-center" style={{ height: 66, gap: 14 }}>
            <span className="flex flex-col" style={{ gap: 4 }}>
              <span className="hero-t12 uppercase text-periwinkle">Made by</span>
              <span className="hero-t16 text-periwinkle">Natalia Chamon</span>
            </span>
            <span className="hero-t16 text-cloud">Meet the maker</span>
          </span>
        </a>

        <div data-f1-head className="absolute inset-x-5 bottom-[calc(7svh+150px)] z-30 text-cloud md:inset-x-10 md:bottom-[9vh]">
          <h1 data-h1 className="headline max-w-[16ch] text-[clamp(2.5rem,6.4vw,7rem)]">
            <span className="block overflow-hidden pb-[0.06em]"><span data-w className="inline-block">Sewing patterns</span></span>
            <span className="block overflow-hidden pb-[0.08em]">
              <span data-w className="inline-block">drafted to </span>{" "}
              <span data-w className="font-display inline-block text-[1.06em] text-cornflower">your body.</span>
            </span>
          </h1>
        </div>

        <div data-f1-side className="absolute inset-x-5 bottom-[7svh] z-30 flex flex-col gap-5 md:inset-x-auto md:bottom-auto md:right-10 md:top-[37%] md:w-[260px] md:gap-6">
          <p data-intro className="hero-t16 leading-[1.35] text-cloud/70">
            Upload any photo from Pinterest or a magazine. Venty drafts the pattern from your measurements, ready to print.
          </p>
          <div data-intro>
            <PrimaryButton href={APP_URL}>{CTA_LABEL}</PrimaryButton>
          </div>
        </div>

        <div data-cue aria-hidden className="absolute bottom-5 left-1/2 z-30 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex">
          <span className="eyebrow text-periwinkle/70">Scroll</span>
          <span className="scroll-cue block h-10 w-px overflow-hidden bg-cloud/15" />
        </div>

        {/* 1.2 */}
        <div data-f2 className="invisible absolute inset-0 z-30 grid place-items-center px-5 text-center text-cloud">
          <div style={{ background: "radial-gradient(closest-side, rgba(11,12,21,0.6), transparent)" }} className="px-6 py-14">
            <h2 data-h2 className="headline text-[clamp(2.6rem,8vw,8.5rem)]">
              This body doesn&apos;t exist.
            </h2>
            <p data-sub className="body-lg mx-auto mt-6 max-w-[34ch] text-periwinkle">
              Neither does the standard body shop patterns are drafted for.
            </p>
          </div>
        </div>

        {/* 1.3 */}
        <div data-f3 className="invisible absolute inset-0 z-30 grid place-items-center px-5 text-center text-cloud">
          <div>
            <h2 data-h3 className="font-display text-[clamp(4.5rem,17vw,17rem)] leading-[0.9]">Yours does.</h2>
            <p data-sub className="body-lg mx-auto mt-6 max-w-[30ch] text-periwinkle">
              Venty drafts every pattern from your measurements.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
