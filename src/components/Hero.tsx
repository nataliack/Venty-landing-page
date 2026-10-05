"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { AnnounceBar } from "./AnnounceBar";
import { PrimaryButton } from "./PrimaryButton";
import { APP_URL, CTA_LABEL } from "@/lib/site";
import { HERO, cameraTrack, createHeroPlayer, heroPosition, heroPoster } from "@/lib/heroSequence";
import { HIDDEN, padMasks } from "@/lib/reveal";

gsap.registerPlugin(ScrollTrigger, SplitText);

/* Hero: the video on one pinned scroll (frames from src/lib/heroSequence),
   with the copy placed on the footage.

   master frame   on screen                          on top
   0 to 55        she lies on the liquid             1.1: announcement bar, title,
                                                     line, button, Scroll
   60 to 520      she rises, the drop, the dress     nothing: the footage carries it
   546 to 635     the dress fits; the final pose     "A perfect fit. On a body that
                                                     isn't real." comes in and stays;
                                                     the glow rises back along the
                                                     bottom edge
   then           the hand-off                       pattern paper rises from the
                                                     bottom edge, covers the line and
                                                     lifts the video away

   All frame numbers are master frames, as numbered in After Effects. */

const LAST = HERO.masterFrames - 1;

/* Pacing: scroll fraction of the section, to master frame. The video slows
   where there is something to read and runs through the close-ups. It never
   holds still at the end: the last frames play out slowly into the hand-off. */
const PACE = [
  [0, 0],
  [0.04, 0], // 1.1 holds
  [0.09, 55],
  [0.18, 185], // the rise
  [0.27, 236], // she stands
  [0.34, 318], // the drop
  [0.44, 520], // the dress forms
  [0.62, 606], // it fits: the line reads
  [0.84, LAST], // the final pose, slowly, into the hand-off
] as const;
const PLAY_END = PACE[PACE.length - 1][0];
/** where the hand-off starts: just before the last frame, so nothing holds */
const OUT = PLAY_END - 0.02;

const frameAt = (p: number) => {
  for (let k = 1; k < PACE.length; k++) {
    const [p0, f0] = PACE[k - 1];
    const [p1, f1] = PACE[k];
    if (p <= p1) return f0 + (f1 - f0) * ((p - p0) / (p1 - p0));
  }
  return LAST;
};
/** Scroll fraction at which a master frame is on screen */
const at = (frame: number) => {
  for (let k = 1; k < PACE.length; k++) {
    const [p0, f0] = PACE[k - 1];
    const [p1, f1] = PACE[k];
    if (frame <= f1 && f1 > f0) return p0 + (p1 - p0) * ((frame - f0) / (f1 - f0));
  }
  return PLAY_END;
};

/* The camera, for screens narrower than the video (phones, mostly): which
   part of the frame sits in the middle of the screen, 0 the left edge, 1 the
   right, by master frame. Centred; a touch right while she stands; then it
   glides left so her fingers and the drop are the main point of the
   close-up, and back to centre. Wide screens see the whole frame, so the
   track does nothing there. */
const CAMERA = [
  [0, 0.5],
  [175, 0.5],
  [200, 0.55], // she stands right of centre
  [228, 0.53],
  [255, 0.36], // her hand reaches out
  [300, 0.34], // the drop lands on her fingers
  [320, 0.32], // the finger close-up
  [335, 0.42],
  [355, 0.5], // back to centre
] as const;

export function Hero() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const player = createHeroPlayer(el.querySelector<HTMLCanvasElement>("[data-seq]")!, cameraTrack(CAMERA));
    const logo = document.querySelector<HTMLElement>("[data-logo]"); // fixed, outside the hero (SiteLogo)

    // the announcement bar shows only at the very top of the page; the logo
    // and the section menu sit under it while it does (globals.css)
    const root = document.documentElement;
    const bar = el.querySelector<HTMLElement>("[data-bar]");
    const barSize = new ResizeObserver(() => root.style.setProperty("--announce-bar", `${bar?.offsetHeight ?? 0}px`));
    if (bar) barSize.observe(bar);
    const announce = (p: number) => {
      const on = p < 0.012 ? "on" : "off";
      if (root.dataset.announce !== on) root.dataset.announce = on;
    };

    const ctx = gsap.context(() => {
      // 1.1 arrives on load
      const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
      intro
        .from("[data-scene]", { scale: 1.08, opacity: 0, duration: 2.4, clearProps: "transform" }, 0)
        .from("[data-glow]", { yPercent: 40, opacity: 0, duration: 2 }, 0.2)
        .from("[data-bar]", { yPercent: -100, opacity: 0, duration: 1.2, clearProps: "transform,opacity" }, 0.5)
        .from("[data-h1] [data-w]", { yPercent: HIDDEN, duration: 1.4, stagger: 0.06 }, 0.7)
        .from("[data-intro]", { y: 16, opacity: 0, duration: 1.2, stagger: 0.1, clearProps: "transform,opacity" }, 1);
      if (logo) intro.from(logo, { y: -10, opacity: 0, duration: 1.2, clearProps: "transform,opacity" }, 0.6);

      const split = SplitText.create("[data-h2]", { type: "words", mask: "words" });
      padMasks(split.masks);

      gsap.set("[data-f2]", { autoAlpha: 1 });
      gsap.set(split.words, { yPercent: HIDDEN });
      gsap.set("[data-f2] [data-sub]", { opacity: 0, y: reduce ? 0 : 14 });
      gsap.set("[data-shade]", { opacity: 0 });
      gsap.set("[data-handoff]", { "--r": "0%" });

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
          onUpdate: (self) => {
            announce(self.progress);
            player.setPosition(heroPosition(frameAt(self.progress)));
          },
        },
      });

      const move = reduce ? 0 : 1;
      const tFit = at(552);
      const tGlow = at(585);
      tl
        // 1.1 out as she starts to rise; the dots and glow clear off the video
        .to("[data-cue]", { opacity: 0, duration: 0.02 }, 0.01)
        .to("[data-f1-head]", { y: -80 * move, autoAlpha: 0, filter: reduce ? "none" : "blur(10px)", duration: 0.05 }, 0.04)
        // autoAlpha: hidden once faded, so its button stops taking clicks
        .to("[data-f1-side]", { autoAlpha: 0, y: -30 * move, duration: 0.04 }, 0.04)
        .to("[data-dots]", { opacity: 0, duration: 0.05 }, 0.04)
        .to("[data-glow]", { opacity: 0, yPercent: 30 * move, duration: 0.06 }, 0.04)

        // the dress fits her perfectly: the line comes in and stays until the
        // paper covers it (the shade behind it is for phones only)
        .to("[data-f2] [data-shade]", { opacity: 1, duration: 0.04, ease: "none" }, tFit - 0.01)
        .to(split.words, { yPercent: 0, duration: 0.04, stagger: 0.006, ease: "power3.out" }, tFit)
        .to("[data-f2] [data-sub]", { opacity: 1, y: 0, duration: 0.03 }, tFit + 0.03)

        // the glow rises back along the bottom edge as she settles
        .to("[data-glow]", { opacity: 0.95, yPercent: 0, duration: OUT - tGlow, ease: "power1.inOut" }, tGlow)

        // hand-off: pattern paper rises from the bottom edge, covers the line
        // and lifts the video up and away
        .to("[data-handoff]", { "--r": "124%", duration: 0.12, ease: "power1.inOut" }, OUT)
        .to("[data-lift]", { yPercent: -26 * move, scale: reduce ? 1 : 0.94, duration: 0.12, ease: "power1.in" }, OUT)
        .to("[data-dim]", { opacity: 0.7, duration: 0.1, ease: "none" }, OUT)
        .set({}, {}, 1);
      announce(tl.scrollTrigger?.progress ?? 0);
    }, el);

    return () => {
      barSize.disconnect();
      delete root.dataset.announce;
      root.style.removeProperty("--announce-bar");
      player.destroy();
      ctx.revert();
    };
  }, []);

  return (
    <section ref={ref} id="top" data-wing="hero" data-nav="Introduction" data-theme-zone="dark" className="relative h-[900vh]">
      {/* where the sequence ends and the hand-off begins: the Vote for Venty
          tab tucks away on phones from here (VoteTab). Placed where the
          middle of the screen is when the hand-off starts. */}
      <div id="hero-end" aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0" style={{ top: `${OUT * 800 + 50}vh` }} />

      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* the night behind the scene lives on a child: a sticky element with a
            background at the top edge is what Safari would tint its status bar from */}
        <div aria-hidden className="absolute inset-0 bg-night" />
        {/* lifts away at the hand-off */}
        <div data-lift className="absolute inset-0 origin-top">
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
        </div>
        {/* dims the video as it lifts away at the hand-off only */}
        <div data-dim aria-hidden className="pointer-events-none absolute inset-0 bg-night opacity-0" />

        {/* cornflower ellipse rising from the bottom edge: at the start, and
            again as the sequence ends */}
        <div
          data-glow
          aria-hidden
          className="pointer-events-none absolute rounded-[50%] bg-cornflower"
          // centred by position, not translate: GSAP moves it with transforms
          // and would clear a CSS translate
          style={{ width: "109vw", height: "79vh", left: "-4.5vw", bottom: "-68vh", opacity: 0.95, filter: "blur(85px)" }}
        />

        {/* 1.1: the announcement bar (the logo and the section menu sit under
            it, see SiteLogo and SectionNav), and the opening along the bottom */}
        <AnnounceBar />

        <div className="hero-open absolute inset-x-0 bottom-0 z-30 text-cloud">
          <div data-f1-head className="hero-open__main">
            <div data-intro>
              <PrimaryButton href={APP_URL}>{CTA_LABEL}</PrimaryButton>
            </div>
            <h1 data-h1 className="hero-title">
              <span className="line-mask"><span data-w className="inline-block">The average body</span></span>
              <span className="line-mask">
                <span data-w className="inline-block">
                  <span className="hero-title__serif">doesn&apos;t</span> exist
                </span>
              </span>
            </h1>
          </div>

          <div data-cue aria-hidden className="hero-open__cue">
            <span>Scroll</span>
            <span className="scroll-cue block h-10 w-px overflow-hidden bg-cloud/15" />
          </div>

          <p data-f1-side className="hero-open__line">
            <span data-intro className="block">
              Start from a photo, a sketch or a few words. Venty turns it into a sewing pattern drafted from your measurements, ready to print.
            </span>
          </p>
        </div>

        {/* the fit: left of her final pose, where the frame is empty (at the
            top on phones, over a shade, clear of her) */}
        <div data-f2 className="hero-fit-wrap pointer-events-none invisible absolute inset-0 z-30 flex items-start text-cloud md:items-center">
          <div data-shade aria-hidden className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-night via-night/70 to-transparent md:hidden" />
          <div className="relative">
            <h2 data-h2 className="hero-fit">A perfect fit. On a body that isn&apos;t real.</h2>
            <p data-sub className="hero-fit__sub">Shop patterns are drafted for the average body. Venty drafts for yours.</p>
          </div>
        </div>

        {/* the hand-off: pattern paper rising from the bottom edge, over the
            line above (see .handoff) */}
        <div data-handoff aria-hidden className="handoff pointer-events-none absolute inset-0 z-[35]">
          <div className="handoff__paper paper-grid absolute inset-0" />
        </div>
      </div>
    </section>
  );
}
