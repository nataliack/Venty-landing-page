"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { LogoMark } from "./Logo";
import { PrimaryButton } from "./PrimaryButton";
import { APP_URL, CTA_LABEL } from "@/lib/site";
import { HERO, cameraTrack, createHeroPlayer, heroFrame, heroPoster } from "@/lib/heroSequence";

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

/* Hero, the video on one pinned scroll (frames from src/lib/heroSequence).
   1.1 Opening   she lies on the liquid. Headline, line, button.
   ...           scrolling plays her rising and the liquid dress forming.
   1.2 Problem   she stands, dressed. "This body doesn't exist." A standard
                 size spec runs across her.
   1.3 Hand-off  "Yours does." The spec is struck out and rewritten as yours,
                 then the scene dissolves into pattern paper, which is where
                 Photo to pattern begins.

   Scroll positions are fractions of the section. The video plays between
   PLAY_START and PLAY_END and holds its last frame after that. The frame is
   never scaled by the timeline, so it stays as sharp as the source. */

const PLAY_START = 0.04;
const PLAY_END = 0.74;
const DRESSED = 560; // master frame where the dress has formed (1.2 appears)
const at = (master: number) => PLAY_START + (PLAY_END - PLAY_START) * (heroFrame(master) / (HERO.frames - 1));

/* The camera, for screens narrower than the video (phones, mostly): which
   part of the frame sits in the middle of the screen, 0 the left edge, 1 the
   right, by master frame (as numbered in After Effects). Centred; then it
   glides left so her fingers and the drop are the main point of the close-up,
   and glides back to centre for the rest. Wide screens see the whole frame,
   so the track does nothing there. */
const CAMERA = [
  [0, 0.5],
  [225, 0.5],
  [255, 0.36], // her hand reaches out
  [300, 0.34], // the drop lands on her fingers
  [320, 0.32], // the finger close-up
  [335, 0.42],
  [355, 0.5], // back to centre
] as const;

// top on phones (upper half, the text sits at the bottom), then on desktop
const SPEC = [
  { k: "Bust", v: "92 cm", top: "22%", mdTop: "30%" },
  { k: "Waist", v: "74 cm", top: "31%", mdTop: "52%" },
  { k: "Hip", v: "99 cm", top: "40%", mdTop: "68%" },
];

export function Hero() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const player = createHeroPlayer(el.querySelector<HTMLCanvasElement>("[data-seq]")!, cameraTrack(CAMERA));

    const ctx = gsap.context(() => {
      // 1.1 arrives on load
      const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
      intro
        .from("[data-scene]", { scale: 1.08, opacity: 0, duration: 2.4, clearProps: "transform" }, 0)
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
          onUpdate: (self) => player.set((self.progress - PLAY_START) / (PLAY_END - PLAY_START)),
        },
      });

      const move = reduce ? 0 : 1;
      const t2 = at(DRESSED);
      const t3 = PLAY_END + 0.06;
      const out = PLAY_END + 0.14;
      tl
        // 1.1 out as she starts to rise; the dots and glow clear off the video
        .to("[data-cue]", { opacity: 0, duration: 0.02 }, 0.01)
        .to("[data-f1-head]", { y: -80 * move, opacity: 0, filter: reduce ? "none" : "blur(10px)", duration: 0.06 }, 0.03)
        .to("[data-f1-side]", { opacity: 0, y: -30 * move, duration: 0.05, stagger: 0.01 }, 0.03)
        .to("[data-dots]", { opacity: 0, duration: 0.06 }, 0.04)
        .to("[data-glow]", { opacity: 0, yPercent: 30 * move, duration: 0.08 }, 0.04)

        // 1.2 in, once she stands in the dress
        .to("[data-rule]", { scaleX: 1, duration: 0.06, stagger: 0.015, ease: "power3.out" }, t2)
        .to("[data-row]", { opacity: 1, y: 0, duration: 0.04, stagger: 0.015 }, t2 + 0.02)
        .to(split2.words, { yPercent: 0, duration: 0.05, stagger: 0.008, ease: "power3.out" }, t2 + 0.02)
        .to("[data-f2] [data-sub]", { opacity: 1, y: 0, duration: 0.04 }, t2 + 0.06)

        // 1.2 out: struck through
        .to("[data-strike]", { scaleX: 1, duration: 0.04, stagger: 0.015, ease: "power2.in" }, PLAY_END)
        .to(split2.words, { yPercent: -110, duration: 0.04, stagger: 0.006, ease: "power3.in" }, PLAY_END + 0.03)
        .to("[data-f2] [data-sub]", { opacity: 0, duration: 0.03 }, PLAY_END + 0.03)

        // 1.3 in: the spec is rewritten as yours
        .to("[data-dim]", { opacity: 0.4, duration: 0.05 }, t3)
        .to("[data-strike]", { opacity: 0, duration: 0.03 }, t3)
        .to("[data-spec-title]", { scrambleText: { text: "Your measurements", chars: "lowerCase", speed: 0.6 }, duration: 0.05, ease: "none" }, t3)
        .to("[data-val]", { scrambleText: { text: "Yours", chars: "0123456789.", speed: 0.6 }, duration: 0.05, stagger: 0.015, ease: "none" }, t3)
        .to("[data-val]", { color: "var(--color-cornflower)", duration: 0.03 }, t3 + 0.04)
        .to(split3.chars, { yPercent: 0, duration: 0.05, stagger: 0.008, ease: "power3.out" }, t3 + 0.01)
        .to("[data-f3] [data-sub]", { opacity: 1, y: 0, duration: 0.04 }, t3 + 0.05)

        // hand-off: the scene dissolves into pattern paper
        .to("[data-paper]", { "--r": "140%", duration: 0.12, ease: "power2.in" }, out)
        .to("[data-scene]", { opacity: 0, duration: 0.1, ease: "power1.in" }, out + 0.02)
        .to("[data-rule], [data-row]", { opacity: 0, duration: 0.04 }, out)
        .to("[data-f3] [data-sub]", { opacity: 0, duration: 0.03 }, out + 0.03)
        .to(split3.chars, { yPercent: -110, duration: 0.04, stagger: 0.006, ease: "power3.in" }, out + 0.06)
        .set({}, {}, 1);
    }, el);

    return () => {
      player.destroy();
      ctx.revert();
    };
  }, []);

  return (
    <section ref={ref} id="top" data-wing="hero" data-nav="Introduction" data-theme-zone="dark" className="relative h-[760vh]">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-night">
        {/* scene: the poster (first frame) until the canvas has drawn */}
        <div data-scene className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroPoster} alt="" draggable={false} fetchPriority="high" className="absolute inset-0 h-full w-full select-none object-cover" />
          <canvas data-seq aria-hidden className="absolute inset-0 h-full w-full opacity-0" />
          <div
            data-dots
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

        {/* the spec that runs across her in 1.2 and 1.3: the right side of the
            frame on desktop, where she stands; the upper half on phones */}
        <div data-spec aria-hidden className="invisible absolute inset-y-0 left-5 right-5 z-20 text-cloud [text-shadow:0_1px_14px_rgba(11,12,21,0.95)] md:left-[44%] md:right-10">
          <p data-row className="eyebrow absolute left-0 top-[14%] text-periwinkle md:top-[22%]">
            <span data-spec-title>Standard size 12</span>
          </p>
          {SPEC.map((s) => (
            <div
              key={s.k}
              className="absolute inset-x-0 top-[var(--t)] flex items-center gap-4 md:top-[var(--tm)]"
              style={{ "--t": s.top, "--tm": s.mdTop } as React.CSSProperties}
            >
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

        {/* 1.2, in the dark space she leaves on the left (at the bottom on phones) */}
        <div data-f2 className="invisible absolute inset-0 z-30 flex items-end px-5 pb-[12svh] text-cloud md:items-center md:px-10 md:pb-0">
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-night via-night/70 to-transparent md:inset-y-0 md:left-0 md:h-auto md:w-[60%] md:bg-gradient-to-r md:from-night/80 md:via-night/40" />
          <div className="relative">
            <h2 data-h2 className="headline max-w-[9ch] text-[clamp(2.8rem,6.4vw,7rem)]">
              This body doesn&apos;t exist.
            </h2>
            <p data-sub className="body-lg mt-6 max-w-[26ch] text-periwinkle">
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
