"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { LogoMark } from "./Logo";
import { PrimaryButton } from "./PrimaryButton";
import { APP_URL, CTA_LABEL } from "@/lib/site";
import { HERO, cameraTrack, createHeroPlayer, heroPosition, heroPoster } from "@/lib/heroSequence";
import { HIDDEN, padMasks } from "@/lib/reveal";

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

/* Hero: the video on one pinned scroll (frames from src/lib/heroSequence),
   with the copy and a set of drawn objects placed on the footage.

   master frame   on screen                       on top
   0 to 55        she lies on the liquid          1.1: headline, line, button
   60 to 185      she rises out of the ripples    a scan beam reads her body
   186 to 236     she stands, measured            dimension lines on bust, waist,
                                                  hip, stuck to her; Standard size 12
   272 to 316     the drop falls onto her hand    a focus ring follows it
   330 to 520     the liquid becomes the dress    nothing: the footage carries it
   546 to 606     the dress fits, perfectly       the lines return; "Yet every shop
                                                  pattern is drafted for it." The lines
                                                  grade through sizes 8 to 16
   606 to 635     the final pose                  values struck out; "Yours does.";
                                                  the labels rewrite as yours
   then           the last frame holds            it dissolves into pattern paper

   All frame numbers are master frames, as numbered in After Effects. The
   objects are placed in video pixels and projected through the same scale
   and camera as the frame, so they stay on her on every screen. */

const LAST = HERO.masterFrames - 1;

/* Pacing: scroll fraction of the section, to master frame. The video slows
   where there is something to read and runs through the close-ups. */
const PACE = [
  [0, 0],
  [0.04, 0], // 1.1 holds
  [0.09, 55],
  [0.18, 185], // the rise
  [0.27, 236], // measured
  [0.34, 318], // the drop
  [0.44, 520], // the dress forms
  [0.62, 606], // it fits, graded
  [0.68, LAST], // the final pose, then held
] as const;
const PLAY_END = PACE[PACE.length - 1][0];

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
   right, by master frame. Centred; a touch right while she stands measured;
   then it glides left so her fingers and the drop are the main point of
   the close-up, and back to centre. Wide
   screens see the whole frame, so the track does nothing there. */
const CAMERA = [
  [0, 0.5],
  [175, 0.5],
  [200, 0.55], // she stands right of centre: the lines on her stay in view
  [228, 0.53],
  [255, 0.36], // her hand reaches out
  [300, 0.34], // the drop lands on her fingers
  [320, 0.32], // the finger close-up
  [335, 0.42],
  [355, 0.5], // back to centre
] as const;

/* Her body, measured from the frames: [master frame, left x, right x, y] in
   video px (1920 x 1080), standing and then dressed. Between keys it is
   interpolated, so the lines move with her. */
type Key = readonly [number, number, number, number];
const BODY: { k: string; keys: readonly Key[] }[] = [
  {
    k: "Bust",
    keys: [
      [190, 840, 1180, 540], [215, 880, 1245, 540], [228, 1000, 1380, 590], [236, 1074, 1463, 621],
      [548, 630, 1200, 540], [575, 820, 1160, 400], [605, 960, 1120, 320], [635, 1000, 1200, 360],
    ],
  },
  {
    k: "Waist",
    keys: [
      [190, 890, 1160, 700], [215, 930, 1210, 700], [228, 1040, 1360, 800], [236, 1108, 1452, 862],
      [548, 680, 1180, 720], [575, 840, 1200, 660], [605, 920, 1130, 520], [635, 980, 1200, 560],
    ],
  },
  {
    k: "Hip",
    keys: [
      [190, 870, 1200, 860], [215, 880, 1290, 860], [228, 1000, 1440, 980], [236, 1074, 1532, 1054],
      [548, 660, 1260, 940], [575, 760, 1280, 860], [605, 840, 1180, 720], [635, 880, 1280, 760],
    ],
  },
];
// the drop, [master frame, x, y]
const DROP = [
  [272, 250, -30], [276, 315, 75], [286, 645, 255], [296, 816, 375], [306, 870, 375], [316, 885, 385],
] as const;
// standard sizes, bust / waist / hip in cm: graded in 5 cm steps
const SIZES: Record<number, readonly [number, number, number]> = {
  8: [82, 64, 89],
  10: [87, 69, 94],
  12: [92, 74, 99],
  14: [97, 79, 104],
  16: [102, 84, 109],
};
const NEST = [0.88, 0.94, 1.06, 1.12]; // ghost lines of the graded nest, sizes 8, 10, 14, 16

const lerpKeys = <T extends readonly number[]>(keys: readonly T[], f: number): T => {
  if (f <= keys[0][0]) return keys[0];
  for (let k = 1; k < keys.length; k++) {
    if (f <= keys[k][0]) {
      const a = keys[k - 1];
      const b = keys[k];
      const t = (f - a[0]) / (b[0] - a[0]);
      return a.map((v, i) => v + (b[i] - v) * t) as unknown as T;
    }
  }
  return keys[keys.length - 1];
};
// 0 to 1 and back: in over a to b, out over c to d
const ramp = (f: number, a: number, b: number, c?: number, d?: number) =>
  Math.max(0, Math.min(1, (f - a) / (b - a), c === undefined || d === undefined ? 1 : (d - f) / (d - c)));

export function Hero() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const player = createHeroPlayer(el.querySelector<HTMLCanvasElement>("[data-seq]")!, cameraTrack(CAMERA));
    const rows = gsap.utils.toArray<HTMLElement>("[data-mline]", el);
    const vals = gsap.utils.toArray<HTMLElement>("[data-val]", el);
    const tag = el.querySelector<HTMLElement>("[data-spec-title]")!;
    const tagBox = el.querySelector<HTMLElement>("[data-tag]")!;
    const reticle = el.querySelector<HTMLElement>("[data-reticle]")!;
    const scan = el.querySelector<HTMLElement>("[data-scan]")!;
    const phone = window.matchMedia("(max-width: 767px)");
    let size = 12;
    let scroll: ScrollTrigger | undefined;

    // the objects on her, placed for master frame f
    const track = (f: number) => {
      const stand = ramp(f, 186, 194, 226, 236);
      const dress = ramp(f, 546, 556);
      const on = Math.max(stand, dress);
      // grading: 12 down to 8, up to 16, back to 12, while the problem line reads
      const g = f < 560 || f > 598 ? 0 : f < 570 ? (f - 560) / 10 : f < 588 ? 1 - 2 * ((f - 570) / 18) : -1 + (f - 588) / 10;
      const graded = Math.round((12 - 4 * g) / 2) * 2;
      const nest = ramp(f, 562, 568, 592, 598);
      const scale = 1 + (graded - 12) * 0.03;
      let first: { x: number; y: number } | null = null;
      let last: { x: number; y: number } | null = null;
      BODY.forEach((b, i) => {
        const [, x0, x1, y] = lerpKeys(b.keys, f);
        const a = player.project(x0, y);
        const z = player.project(x1, y);
        const w = (z.x - a.x) * scale;
        const cx = (a.x + z.x) / 2;
        const row = rows[i];
        row.style.transform = `translate3d(${cx - w / 2}px, ${a.y}px, 0)`;
        row.style.width = `${w}px`;
        row.style.opacity = String(on);
        row.style.setProperty("--nest", String(nest));
        if (i === 0) first = { x: cx - w / 2, y: a.y };
        last = { x: cx - w / 2, y: a.y };
      });
      if (graded !== size && f < 602) {
        size = graded;
        vals.forEach((v, i) => (v.textContent = `${SIZES[size][i]} cm`));
        tag.textContent = `Standard size ${size}`;
      }
      // the tag sits above the bust line; on phones, below the hip line,
      // clear of the text at the top
      const anchor = phone.matches ? last : first;
      if (anchor) {
        const { x, y } = anchor as { x: number; y: number };
        tagBox.style.transform = `translate3d(${x}px, ${y + (phone.matches ? 26 : -48)}px, 0)`;
      }
      tagBox.style.opacity = String(on);

      const drop = ramp(f, 272, 277, 308, 316);
      const [, dx, dy] = lerpKeys(DROP, f);
      const d = player.project(dx, dy);
      reticle.style.transform = `translate3d(${d.x}px, ${d.y}px, 0) scale(${0.8 + 0.2 * drop})`;
      reticle.style.opacity = String(drop);

      const beam = ramp(f, 126, 134, 178, 190);
      const s0 = player.project(700, 60 + 980 * Math.max(0, Math.min(1, (f - 128) / 56)));
      const s1 = player.project(1260, 0);
      scan.style.transform = `translate3d(${s0.x}px, ${s0.y}px, 0)`;
      scan.style.width = `${s1.x - s0.x}px`;
      scan.style.opacity = String(beam);
    };

    const ctx = gsap.context(() => {
      // 1.1 arrives on load
      const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
      intro
        .from("[data-scene]", { scale: 1.08, opacity: 0, duration: 2.4, clearProps: "transform" }, 0)
        .from("[data-glow]", { yPercent: 40, opacity: 0, duration: 2 }, 0.2)
        .from("[data-logo]", { y: -10, opacity: 0, duration: 1.2 }, 0.6)
        .from("[data-h1] [data-w]", { yPercent: HIDDEN, duration: 1.4, stagger: 0.06 }, 0.7)
        .from("[data-intro]", { y: 16, opacity: 0, duration: 1.2, stagger: 0.1, clearProps: "transform,opacity" }, 1);

      const split2 = SplitText.create("[data-h2]", { type: "words", mask: "words" });
      const split3 = SplitText.create("[data-h3]", { type: "chars", mask: "chars" });
      padMasks([...split2.masks, ...split3.masks]);

      gsap.set("[data-f2], [data-f3]", { autoAlpha: 1 });
      gsap.set([split2.words, split3.chars], { yPercent: HIDDEN });
      gsap.set("[data-f2] [data-sub], [data-f3] [data-sub]", { opacity: 0, y: reduce ? 0 : 14 });
      gsap.set("[data-strike]", { scaleX: 0 });
      gsap.set("[data-paper]", { "--r": "0%" });
      track(0);

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
          onUpdate: (self) => {
            const f = frameAt(self.progress);
            player.setPosition(heroPosition(f));
            track(f);
          },
        },
      });

      const move = reduce ? 0 : 1;
      const tProblem = at(552);
      const tStrike = at(604);
      const tYours = at(626);
      const out = 0.86;
      tl
        // 1.1 out as she starts to rise; the dots and glow clear off the video
        .to("[data-cue]", { opacity: 0, duration: 0.02 }, 0.01)
        .to("[data-f1-head]", { y: -80 * move, autoAlpha: 0, filter: reduce ? "none" : "blur(10px)", duration: 0.05 }, 0.04)
        // autoAlpha: hidden once faded, so its button and link stop taking clicks
        .to("[data-f1-side]", { autoAlpha: 0, y: -30 * move, duration: 0.04, stagger: 0.01 }, 0.04)
        .to("[data-dots]", { opacity: 0, duration: 0.05 }, 0.04)
        .to("[data-glow]", { opacity: 0, yPercent: 30 * move, duration: 0.06 }, 0.04)

        // the problem, as the dress fits her perfectly
        .to(split2.words, { yPercent: 0, duration: 0.04, stagger: 0.006, ease: "power3.out" }, tProblem)
        .to("[data-f2] [data-sub]", { opacity: 1, y: 0, duration: 0.03 }, tProblem + 0.03)
        .to(split2.words, { yPercent: -HIDDEN, duration: 0.03, stagger: 0.004, ease: "power3.in" }, tStrike)
        .to("[data-f2] [data-sub]", { opacity: 0, duration: 0.02 }, tStrike)

        // the standard values are struck out, then rewritten as yours
        .to("[data-strike]", { scaleX: 1, duration: 0.03, stagger: 0.01, ease: "power2.in" }, tStrike + 0.01)
        .to("[data-dim]", { opacity: 0.35, duration: 0.04 }, tYours - 0.02)
        .to("[data-strike]", { opacity: 0, duration: 0.02 }, tYours)
        .to(tag, { scrambleText: { text: "Your measurements", chars: "lowerCase", speed: 0.6 }, duration: 0.04, ease: "none" }, tYours)
        .to(vals, { scrambleText: { text: "Yours", chars: "0123456789", speed: 0.6 }, duration: 0.04, stagger: 0.01, ease: "none" }, tYours)
        .to(vals, { color: "var(--color-cornflower)", duration: 0.02 }, tYours + 0.03)
        .to(split3.chars, { yPercent: 0, duration: 0.04, stagger: 0.006, ease: "power3.out" }, tYours + 0.01)
        .to("[data-f3] [data-sub]", { opacity: 1, y: 0, duration: 0.03 }, tYours + 0.04)

        // hand-off: the scene dissolves into pattern paper
        .to("[data-paper]", { "--r": "140%", duration: 0.11, ease: "power2.in" }, out)
        .to("[data-scene]", { opacity: 0, duration: 0.09, ease: "power1.in" }, out + 0.02)
        .to("[data-track]", { opacity: 0, duration: 0.03 }, out)
        .to("[data-f3] [data-sub]", { opacity: 0, duration: 0.02 }, out + 0.03)
        .to(split3.chars, { yPercent: -HIDDEN, duration: 0.03, stagger: 0.005, ease: "power3.in" }, out + 0.06)
        .set({}, {}, 1);
      scroll = tl.scrollTrigger;
    }, el);

    // the overlay is in screen px, so it is re-placed when the screen changes
    // (from the hero's own trigger: other sections watch this element too)
    const ro = new ResizeObserver(() => track(frameAt(scroll?.progress ?? 0)));
    ro.observe(el);

    return () => {
      ro.disconnect();
      player.destroy();
      ctx.revert();
    };
  }, []);

  return (
    <section ref={ref} id="top" data-wing="hero" data-nav="Introduction" data-theme-zone="dark" className="relative h-[900vh]">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* the night behind the scene lives on a child: a sticky element with a
            background at the top edge is what Safari would tint its status bar from */}
        <div aria-hidden className="absolute inset-0 bg-night" />
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
        <div data-paper aria-hidden className="paper-grid paper-reveal pointer-events-none absolute inset-0 z-10" />

        {/* objects on her, placed every frame in screen px (see track) */}
        <div data-track aria-hidden className="pointer-events-none absolute inset-0 z-20 text-cloud">
          <div data-scan className="hero-scan absolute left-0 top-0 opacity-0" />
          <div data-reticle className="hero-reticle absolute left-0 top-0 opacity-0">
            <span />
          </div>
          <p data-tag className="eyebrow absolute left-0 top-0 whitespace-nowrap text-periwinkle opacity-0">
            <span data-spec-title>Standard size 12</span>
          </p>
          {BODY.map((b, i) => (
            <div key={b.k} data-mline className="hero-dim absolute left-0 top-0 opacity-0">
              {NEST.map((n) => (
                <span key={n} className="hero-dim__nest" style={{ "--n": n } as React.CSSProperties} />
              ))}
              <span className="hero-dim__line" />
              <span className="hero-dim__label">
                <span className="eyebrow text-periwinkle">{b.k}</span>
                <span className="relative font-display text-[clamp(1rem,1.6vw,1.5rem)] tabular-nums">
                  <span data-val>{SIZES[12][i]} cm</span>
                  <span data-strike className="absolute -inset-x-1 top-1/2 h-[2px] origin-left bg-cornflower" />
                </span>
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
            <span className="line-mask"><span data-w className="inline-block">The average body</span></span>
            <span className="line-mask">
              <span data-w className="font-display inline-block text-[1.06em] text-cornflower">doesn&apos;t exist.</span>
            </span>
          </h1>
        </div>

        <div data-f1-side className="absolute inset-x-5 bottom-[7svh] z-30 flex flex-col gap-5 md:inset-x-auto md:bottom-auto md:right-10 md:top-[37%] md:w-[280px] md:gap-6">
          <p data-intro className="hero-t16 leading-[1.35] text-cloud/70">
            Start from a photo, a sketch or a few words. Venty turns it into a sewing pattern drafted from your measurements, ready to print.
          </p>
          <div data-intro>
            <PrimaryButton href={APP_URL}>{CTA_LABEL}</PrimaryButton>
          </div>
        </div>

        <div data-cue aria-hidden className="absolute bottom-5 left-1/2 z-30 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex">
          <span className="eyebrow text-periwinkle/70">Scroll</span>
          <span className="scroll-cue block h-10 w-px overflow-hidden bg-cloud/15" />
        </div>

        {/* the problem: bottom left, where the dress leaves the frame empty
            (at the top on phones, clear of the lines on her) */}
        <div data-f2 className="pointer-events-none invisible absolute inset-0 z-30 flex items-start px-5 pt-[96px] text-cloud md:items-end md:px-10 md:pb-[9vh] md:pt-0">
          <div aria-hidden className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-night via-night/70 to-transparent md:inset-y-0 md:left-0 md:top-auto md:h-auto md:w-[55%] md:bg-gradient-to-r md:from-night/85 md:via-night/40" />
          <div className="relative">
            <h2 data-h2 className="headline max-w-[13ch] text-[clamp(2.2rem,5vw,5.6rem)]">
              Yet every shop pattern is drafted for it.
            </h2>
            <p data-sub className="body-lg mt-5 max-w-[30ch] text-periwinkle">
              One standard body, graded up and down to make the sizes.
            </p>
          </div>
        </div>

        {/* the hand-off: left of her final pose (at the top on phones) */}
        <div data-f3 className="pointer-events-none invisible absolute inset-0 z-30 flex items-start px-5 pt-[96px] text-cloud md:items-center md:px-10 md:pt-0">
          <div aria-hidden className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-night via-night/70 to-transparent md:hidden" />
          <div className="relative">
            <h2 data-h3 className="font-display text-[clamp(4.2rem,9vw,10rem)] leading-[0.9]">Yours does.</h2>
            <p data-sub className="body-lg mt-5 max-w-[26ch] text-periwinkle">
              Venty drafts every pattern from your measurements.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
