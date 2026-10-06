"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { PrimaryButton } from "../PrimaryButton";
import { APP_URL, CTA_LABEL } from "@/lib/site";
import { EASE } from "@/lib/motion";
import { HIDDEN } from "@/lib/reveal";
import "./closing.css";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

/* 9. The closing scene (dark): the table. A pinned scroll scene, drawn in
   code. A pattern piece, printed on paper, lies on a length of cloth.

     Beat 1  Fig. 09 / The table: the cloth comes in, the paper settles on it
     Beat 2  Printed at 1:1: a rule runs down its edge, the stamp, the pins
     Beat 3  One body. One pattern. Yours: the scissors cut round it, the
             cloth falls away and the paper lifts off the cut piece
     Final   The dress in your head. On the body you have. And the button.

   The caption counts 001 to 150 as you go (the frames of the Workbench).
   After the last beat it holds a screen, still, while the footer rises over
   it with its light edge. */

const COUNT = 150;
const RUN = 4; // screens of scroll for the scene
const PIECE = "M112 34 Q150 42 188 34 L262 392 Q150 412 38 392 Z"; // the skirt front, 300 x 424
const PINS = [
  [150, 70],
  [222, 160],
  [84, 250],
  [240, 340],
  [150, 386],
];

function Beat({ k, lines, cls }: { k?: string; lines: string[]; cls: string }) {
  return (
    <div className={`cl-beat ${cls}`}>
      {k && (
        <p className="cl-beat__k">
          <span className="line-mask inline-block">
            <span data-l className="inline-block">
              {k}
            </span>
          </span>
        </p>
      )}
      <p className="cl-beat__h">
        {lines.map((l) => (
          <span key={l} className="line-mask">
            <span data-l className="block">
              {l}
            </span>
          </span>
        ))}
      </p>
    </div>
  );
}

export function Closing() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const count = el.querySelector<HTMLElement>("[data-count]")!;
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(el);
      const lines = (s: string) => q(`${s} [data-l]`);
      const cut = el.querySelector<SVGPathElement>(".cl-cut")!;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: () => `+=${window.innerHeight * RUN}`,
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            count.textContent = `${String(Math.max(1, Math.round(self.progress * COUNT))).padStart(3, "0")} / ${COUNT}`;
          },
        },
      });
      const IN = { yPercent: 0, duration: 0.5, ease: EASE.out, stagger: 0.06 };
      const OUT = { yPercent: -HIDDEN, duration: 0.4, ease: EASE.in, stagger: 0.04 };
      // below their (padded) masks, so no swash or descender peeks out
      gsap.set(q("[data-l]"), { yPercent: HIDDEN });
      // staggered tweens only render the first target's start at once, so
      // the pins are set up here
      gsap.set(q(".cl-pin"), { y: -26, scale: 1.6, opacity: 0, transformOrigin: "50% 100%" });

      // beat 1: the cloth, then the paper laid on it
      tl.fromTo(q(".cl-cloth"), { y: 80, rotate: -9, opacity: 0 }, { y: 0, rotate: -4, opacity: 1, duration: 1, ease: EASE.out }, 0)
        .fromTo(q(".cl-paper"), { y: -120, rotate: -10, opacity: 0, scale: 1.08 }, { y: 0, rotate: 0, opacity: 1, scale: 1, duration: 1, ease: EASE.out }, 0.35)
        .to(lines(".is-1"), IN, 0.2)
        .to(lines(".is-1"), OUT, 2.2)
        // beat 2: true size, pinned
        .to(lines(".is-2"), IN, 2.55)
        .fromTo(q(".cl-rule"), { scaleY: 0 }, { scaleY: 1, duration: 0.9, ease: EASE.inOut, transformOrigin: "50% 0%" }, 2.6)
        .fromTo(q(".cl-stamp"), { scale: 1.6, opacity: 0, rotate: -18 }, { scale: 1, opacity: 1, rotate: -8, duration: 0.4, ease: EASE.out, transformOrigin: "50% 50%" }, 3.2)
        .to(q(".cl-pin"), { y: 0, scale: 1, opacity: 1, duration: 0.35, ease: EASE.out, stagger: 0.14 }, 3.4)
        .to(lines(".is-2"), OUT, 4.4)
        // beat 3: the cut
        .to(lines(".is-3"), IN, 4.75)
        .fromTo(q("[data-cut]"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2 }, 4.8)
        .fromTo(q(".cl-sc"), { opacity: 0 }, { opacity: 1, duration: 0.1 }, 4.8)
        .to(
          q(".cl-sc"),
          { motionPath: { path: cut, align: cut, alignOrigin: [0.5, 0.5], autoRotate: true }, duration: 2 },
          4.8,
        )
        .to(q(".cl-sc"), { opacity: 0, duration: 0.15 }, 6.8)
        .to(q(".cl-pin"), { y: -20, opacity: 0, duration: 0.3, stagger: 0.05, ease: EASE.in }, 6.85)
        .to(q(".cl-cloth-full"), { opacity: 0, y: 60, duration: 0.6, ease: EASE.in }, 7)
        .fromTo(q(".cl-cloth-cut"), { opacity: 0 }, { opacity: 1, duration: 0.2 }, 6.95)
        .to(q(".cl-paper"), { y: -90, x: 30, rotate: 7, opacity: 0, duration: 0.7, ease: EASE.in }, 7.25)
        .fromTo(q(".cl-glow"), { opacity: 0 }, { opacity: 1, duration: 0.6 }, 7.3)
        .to(lines(".is-3"), OUT, 8)
        // the final line
        .to(q(".cl-scene"), { scale: 0.82, opacity: 0.22, filter: "blur(6px)", duration: 0.8, ease: EASE.inOut }, 8.1)
        .to(lines(".cl-final"), { ...IN, duration: 0.6 }, 8.5)
        .fromTo(q(".cl-final__cta"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: EASE.out }, 8.9)
        .to({}, { duration: 0.6 }, 9.4);
    }, el);
    return () => ctx.revert();
  }, []);

  const s = 0.82; // the piece on the cloth
  const place = `translate(${200 - 150 * s} ${250 - 222 * s}) scale(${s})`;

  return (
    <section ref={root} id="table" data-nav="The table" data-wing="close" data-theme-zone="dark" className="cl" aria-labelledby="cl-title">
      <div className="cl-stage">
        <h2 id="cl-title" className="sr-only">
          The table
        </h2>
        {/* The scene is a stack of layers, one SVG each, sharing one 400 x 500
            frame. What moves as a whole (the cloth, the paper) moves its own
            layer with a CSS transform, so the GPU slides it without
            repainting; only a layer whose insides change (pins dropping, the
            cut being drawn) repaints, and only while it changes. */}
        <div className="cl-scene" aria-hidden="true">
          <span className="cl-glow" />
          <svg width="0" height="0" className="absolute">
            <defs>
              {/* twill: the cloth's diagonal weave */}
              <pattern id="cl-twill" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-32)">
                <rect width="5" height="5" fill="#1d2754" />
                <rect width="5" height="2.2" fill="#2a3876" />
                <rect y="2.2" width="5" height="0.5" fill="#3a4b94" opacity="0.5" />
              </pattern>
              <linearGradient id="cl-light" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#eff4ff" stopOpacity="0.22" />
                <stop offset="0.5" stopColor="#eff4ff" stopOpacity="0" />
                <stop offset="1" stopColor="#0b0c15" stopOpacity="0.45" />
              </linearGradient>
              <filter id="cl-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="-6" dy="10" stdDeviation="10" floodColor="#000" floodOpacity="0.55" />
              </filter>
            </defs>
          </svg>

          <div className="cl-layer cl-cloth">
            <svg viewBox="0 0 400 500" className="cl-layer cl-cloth-full">
              <g filter="url(#cl-shadow)">
                <rect x="24" y="36" width="352" height="428" rx="3" fill="url(#cl-twill)" />
                <rect x="24" y="36" width="352" height="428" rx="3" fill="url(#cl-light)" />
                {/* the selvedge */}
                <rect x="24" y="36" width="6" height="428" fill="#eff4ff" opacity="0.12" />
              </g>
            </svg>
            <svg viewBox="0 0 400 500" className="cl-layer cl-cloth-cut">
              <g transform={place} filter="url(#cl-shadow)">
                <path d={PIECE} fill="url(#cl-twill)" />
                <path d={PIECE} fill="url(#cl-light)" />
                <path d={PIECE} fill="none" stroke="#9daccd" strokeWidth="1.2" opacity="0.6" />
              </g>
            </svg>
          </div>

          <svg viewBox="0 0 400 500" className="cl-layer cl-paper">
            <g transform={place}>
              <path d={PIECE} className="cl-paper__sheet" />
              <path d={PIECE} className="cl-paper__seam" transform="translate(150 220) scale(0.92) translate(-150 -220)" />
              <path d="M150 120 V330 M144 130 L150 120 L156 130 M144 320 L150 330 L156 320" className="cl-paper__grain" />
              {/* notches */}
              <path d="M74 214 l8 -3 l0 6 Z M226 214 l-8 -3 l0 6 Z" className="cl-paper__notch" />
              <text x="150" y="232" className="cl-paper__t">SKIRT FRONT</text>
              <text x="150" y="248" className="cl-paper__t is-sm">CUT 1 ON THE BIAS</text>
              <text x="150" y="262" className="cl-paper__t is-sm">VENTY 001</text>
              {/* a tape laid along its long edge (the edge leans 11.7deg) */}
              <g transform="translate(200 30) rotate(-11.68)">
                <g className="cl-rule">
                  <rect x="0" y="0" width="16" height="366" rx="1.5" />
                  {Array.from({ length: 37 }, (_, i) => (
                    <line key={i} x1="0" x2={i % 5 ? 4 : 8} y1={3 + i * 10} y2={3 + i * 10} />
                  ))}
                  {[0, 10, 20, 30].map((n) => (
                    <text key={n} x="11.5" y={3 + n * 10 + 3}>
                      {n}
                    </text>
                  ))}
                </g>
              </g>
              <g className="cl-stamp">
                <circle cx="98" cy="96" r="22" />
                <text x="98" y="101">1:1</text>
              </g>
            </g>
          </svg>

          {/* each pin is placed by its outer group; GSAP moves the inner one
              (it would take over an SVG transform it animates) */}
          <svg viewBox="0 0 400 500" className="cl-layer cl-pins">
            {PINS.map(([x, y], i) => (
              <g key={i} transform={`translate(${200 - 150 * s + x * s} ${250 - 222 * s + y * s})`}>
                <g className="cl-pin">
                  <line x1="0" y1="0" x2="7" y2="9" />
                  <circle r="4.6" />
                  <circle r="1.6" cx="-1.4" cy="-1.4" className="cl-pin__hi" />
                </g>
              </g>
            ))}
          </svg>

          <svg viewBox="0 0 400 500" className="cl-layer cl-cuts">
            {/* the glow under the cut is a wider, fainter line (a filter here
                would be redrawn on every frame of the cut) */}
            <path d={PIECE} transform={`${place} translate(150 222) scale(1.035) translate(-150 -222)`} className="cl-cut-halo" pathLength={1} data-cut />
            <path d={PIECE} transform={`${place} translate(150 222) scale(1.035) translate(-150 -222)`} className="cl-cut" pathLength={1} data-cut />
            <g className="cl-sc">
              <g transform="translate(-12 -12)">
                <circle cx="6" cy="6" r="3.4" />
                <circle cx="6" cy="18" r="3.4" />
                <path d="M9 7.6 22 15.4M9 16.4 22 8.6" />
              </g>
            </g>
          </svg>
        </div>

        <Beat cls="is-1" k="Fig. 09 / The table" lines={["Paper on top.", "Cloth underneath."]} />
        <Beat cls="is-2" k="Printed at 1:1" lines={["Printed at true size.", "Pinned to the cloth.", "Every line drawn for one body."]} />
        <Beat cls="is-3" lines={["One body.", "One pattern.", "Yours."]} />

        <div className="cl-final">
          <p className="cl-final__h">
            <span className="line-mask">
              <span data-l className="block">
                The dress in your head.
              </span>
            </span>
            <span className="line-mask">
              <span data-l className="block">
                <em>On the body you have.</em>
              </span>
            </span>
          </p>
          <div className="cl-final__cta">
            <PrimaryButton href={APP_URL}>{CTA_LABEL}</PrimaryButton>
          </div>
        </div>

        <p className="cl-cap" aria-hidden="true">
          <span>Venty / Workbench</span>
          <span data-count>001 / {COUNT}</span>
        </p>
      </div>
    </section>
  );
}
