"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { PrimaryButton } from "./PrimaryButton";
import { APP_URL, CTA_LABEL } from "@/lib/site";

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

/* Photo to pattern. One pinned scroll, three states of the same six pieces:
   A  a saved photo of a slip dress. A scan reads it, tags pop up.
   B  the dress comes apart into flat pieces on pattern paper, with seam
      allowance, grainlines, notches and labels.
   C  the pieces fly back together on a dress form, with measurements.
   The dress is drawn as its own pieces, so the same shapes do all three. */

type Piece = {
  id: string;
  d: string;
  flat: { x: number; y: number; r: number };
  label?: [string, string];
  lx?: number;
  ly?: number;
  grain?: [number, number, number]; // x, y1, y2
  notches?: string;
  back?: boolean;
};

const PIECES: Piece[] = [
  { id: "skirt-back", back: true, d: "M308 380 Q400 392 492 380 L578 820 Q400 850 222 820 Z", flat: { x: 196, y: 30, r: 0 }, label: ["Skirt back", "Cut 1 on the bias"], lx: 400, ly: 560, grain: [400, 600, 780], notches: "M282 500 h10 M518 500 h-10" },
  { id: "bodice-back", back: true, d: "M318 262 L482 262 L492 380 Q400 392 308 380 Z", flat: { x: 182, y: -74, r: 0 }, label: ["Bodice back", "Cut 1"], lx: 400, ly: 312, grain: [400, 336, 370], notches: "M309 322 h10 M491 322 h-10" },
  { id: "skirt-front", d: "M308 380 Q400 392 492 380 L578 820 Q400 850 222 820 Z", flat: { x: -196, y: 30, r: 0 }, label: ["Skirt front", "Cut 1 on the bias"], lx: 400, ly: 560, grain: [400, 600, 780], notches: "M282 500 h10 M518 500 h-10 M400 384 v10" },
  { id: "bodice-front", d: "M318 250 Q352 236 400 286 Q448 236 482 250 L492 380 Q400 392 308 380 Z", flat: { x: -182, y: -74, r: 0 }, label: ["Bodice front", "Cut 1"], lx: 400, ly: 322, grain: [400, 340, 372], notches: "M309 318 h10 M491 318 h-10" },
  { id: "strap-l", d: "M333 120 h6 l10 130 h-6 Z", flat: { x: 59, y: 18, r: 90 } },
  { id: "strap-r", d: "M467 120 h-6 l-10 130 h6 Z", flat: { x: -59, y: 58, r: -90 } },
];

const TAGS = [
  { t: "Neckline · sweetheart", x: "56%", y: "26%" },
  { t: "Straps · 6 mm", x: "8%", y: "15%" },
  { t: "Cut · bias", x: "62%", y: "52%" },
  { t: "Length · midi", x: "10%", y: "74%" },
];

const MEASURES = [
  { k: "Bust", v: "88 cm", y: 300 },
  { k: "Waist", v: "71 cm", y: 385 },
  { k: "Hip", v: "97 cm", y: 480 },
];

const FORM =
  "M380 100 L420 100 L422 140 Q470 146 508 160 Q520 170 512 200 L502 232 Q512 270 506 305 Q498 345 484 385 Q500 430 510 480 Q512 520 500 545 L300 545 Q288 520 290 480 Q300 430 316 385 Q302 345 294 305 Q288 270 298 232 L288 200 Q280 170 292 160 Q330 146 378 140 Z";

const BEATS = [
  { k: "a", word: "Photo", h: "Start with any photo.", p: "A screenshot, a Pinterest save, a page from a magazine. If you can see the garment, it's enough to start." },
  { k: "b", word: "Pieces", h: "Venty drafts the pieces.", p: "Necklines, seams, length and cut become flat pattern pieces, with seam allowance, grainlines and notches." },
  { k: "c", word: "Yours", h: "Drafted on your body.", p: "Every piece is drawn from your measurements. See it on your body before you cut a thing." },
];

export function PhotoToPattern() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const m = reduce ? 0 : 1;

    const ctx = gsap.context(() => {
      gsap.set("[data-beat]:not([data-beat='a'])", { autoAlpha: 0, y: 30 * m });
      gsap.set("[data-word]:not([data-word='a'])", { yPercent: 100, opacity: 0 });
      gsap.set("[data-outline]", { drawSVG: "0%" });
      gsap.set("[data-paper], [data-pattern], [data-form], [data-measure], [data-cta2], [data-tag]", { opacity: 0 });
      gsap.set("[data-measure-line]", { drawSVG: "0%" });
      gsap.set("[data-tag]", { scale: 0.8 });
      gsap.set("[data-scan]", { attr: { y: 40 } });

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 0.8 },
      });

      const swap = (from: string, to: string, at: number) => {
        tl.to(`[data-beat='${from}']`, { autoAlpha: 0, y: -30 * m, duration: 0.04 }, at)
          .to(`[data-beat='${to}']`, { autoAlpha: 1, y: 0, duration: 0.05 }, at + 0.03)
          .to(`[data-word='${from}']`, { yPercent: -100, opacity: 0, duration: 0.06 }, at)
          .to(`[data-word='${to}']`, { yPercent: 0, opacity: 1, duration: 0.06 }, at + 0.03);
      };

      // A: the scan reads the photo
      tl.to("[data-scan]", { attr: { y: 900 }, duration: 0.2, ease: "none" }, 0.08)
        .to("[data-scan-g]", { opacity: 1, duration: 0.02 }, 0.08)
        .to("[data-scan-g]", { opacity: 0, duration: 0.02 }, 0.27)
        .to("[data-outline]", { drawSVG: "100%", duration: 0.18, stagger: 0.015, ease: "none" }, 0.1)
        .to("[data-tag]", { opacity: 1, scale: 1, duration: 0.03, stagger: 0.035, ease: "back.out(2)" }, 0.12)
        .to("[data-fabric]", { opacity: 0, duration: 0.08 }, 0.24)
        .to("[data-tag]", { opacity: 0, duration: 0.03 }, 0.3)
        .to("[data-photo]", { opacity: 0, scale: 0.96, duration: 0.06, transformOrigin: "50% 50%" }, 0.29);
      swap("a", "b", 0.3);

      // B: apart, flat on the paper
      tl.to("[data-mat]", { opacity: 1, duration: 0.08 }, 0.32)
        .to("[data-paper]", { opacity: 1, duration: 0.06 }, 0.32);
      PIECES.forEach((p, i) => {
        tl.to(`[data-piece='${p.id}']`, { x: p.flat.x, y: p.flat.y, rotation: p.flat.r, transformOrigin: "50% 50%", duration: 0.16, ease: "power3.inOut" }, 0.33 + i * 0.012);
      });
      tl.to("[data-pattern]", { opacity: 1, duration: 0.06, stagger: 0.01 }, 0.48);
      swap("b", "c", 0.62);

      // C: back together on the form
      tl.to("[data-pattern]", { opacity: 0, duration: 0.04 }, 0.62)
        .to("[data-mat]", { opacity: 0.25, duration: 0.08 }, 0.64);
      PIECES.forEach((p, i) => {
        tl.to(`[data-piece='${p.id}']`, { x: 0, y: 0, rotation: 0, duration: 0.15, ease: "power3.inOut" }, 0.64 + (PIECES.length - i) * 0.01);
      });
      tl.to("[data-form]", { opacity: 1, duration: 0.08 }, 0.66)
        .to("[data-paper]", { opacity: 0, duration: 0.06 }, 0.76)
        .to("[data-worn]", { opacity: 1, duration: 0.08 }, 0.76)
        .to("[data-measure]", { opacity: 1, duration: 0.03, stagger: 0.02 }, 0.8)
        .to("[data-measure-line]", { drawSVG: "100%", duration: 0.06, stagger: 0.02, ease: "power2.out" }, 0.8)
        .to("[data-cta2]", { opacity: 1, duration: 0.04 }, 0.84)
        .set({}, {}, 1);
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} id="photo" data-wing="spread" data-nav="Photo to pattern" data-theme-zone="dark" className="relative h-[520vh] bg-night">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* the same paper the hero dissolved into */}
        <div className="paper-grid absolute inset-0" aria-hidden />
        <div data-mat className="paper-grid paper-grid--strong absolute inset-0 opacity-0" aria-hidden />

        {/* giant word behind everything */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[-2vw] overflow-hidden text-center md:bottom-[-3vw]">
          {BEATS.map((b) => (
            <span
              key={b.k}
              data-word={b.k}
              className="outline-word font-display absolute inset-x-0 bottom-0 block text-[clamp(7rem,30vw,30rem)] leading-[0.8]"
            >
              {b.word}
            </span>
          ))}
          <span className="font-display invisible block text-[clamp(7rem,30vw,30rem)] leading-[0.8]">Pieces</span>
        </div>

        <div className="relative z-10 grid h-full grid-rows-[1fr_auto] md:grid-cols-12 md:grid-rows-1">
          {/* copy */}
          <div className="relative order-2 min-h-[34svh] px-5 pb-8 md:order-1 md:col-span-5 md:min-h-0 md:px-10 md:pb-0">
            <p className="eyebrow absolute left-5 top-0 text-periwinkle md:left-10 md:top-[14vh]">Photo to pattern</p>
            {BEATS.map((b, i) => (
              <div key={b.k} data-beat={b.k} className="absolute inset-x-5 top-8 md:inset-x-10 md:top-1/2 md:-translate-y-1/2">
                <p className="eyebrow text-cornflower">0{i + 1} / 03</p>
                <h2 className="headline mt-3 max-w-[12ch] text-[clamp(2.1rem,4.6vw,5rem)] text-cloud">{b.h}</h2>
                <p className="body-lg mt-5 max-w-[34ch] text-periwinkle">{b.p}</p>
                {b.k === "c" && (
                  <div data-cta2 className="mt-8">
                    <PrimaryButton href={APP_URL}>{CTA_LABEL}</PrimaryButton>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* stage */}
          <div className="relative order-1 md:order-2 md:col-span-7">
            <svg viewBox="0 0 800 1000" className="absolute inset-0 m-auto h-[92%] w-full overflow-visible md:h-[88%]" aria-label="A slip dress becoming pattern pieces, then worn on a dress form" role="img">
              <defs>
                <linearGradient id="ptp-silk" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#c0c8db" />
                  <stop offset="0.35" stopColor="#687ef5" />
                  <stop offset="0.7" stopColor="#485f88" />
                  <stop offset="1" stopColor="#1b2035" />
                </linearGradient>
                <linearGradient id="ptp-sheen" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0.3" stopColor="#eff4ff" stopOpacity="0" />
                  <stop offset="0.5" stopColor="#eff4ff" stopOpacity="0.35" />
                  <stop offset="0.7" stopColor="#eff4ff" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="ptp-photo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#9daccd" />
                  <stop offset="0.6" stopColor="#5a6c99" />
                  <stop offset="1" stopColor="#262d4a" />
                </linearGradient>
                <linearGradient id="ptp-scan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#687ef5" stopOpacity="0" />
                  <stop offset="0.85" stopColor="#687ef5" stopOpacity="0.45" />
                  <stop offset="1" stopColor="#eff4ff" />
                </linearGradient>
                <pattern id="ptp-dots" width="9" height="9" patternUnits="userSpaceOnUse">
                  <circle cx="4.5" cy="4.5" r="1.4" fill="#eff4ff" fillOpacity="0.32" />
                </pattern>
                <clipPath id="ptp-card">
                  <rect x="130" y="50" width="540" height="860" rx="28" />
                </clipPath>
              </defs>

              {/* A: the photo card */}
              <g data-photo>
                <rect x="130" y="50" width="540" height="860" rx="28" fill="url(#ptp-photo)" />
                <rect x="130" y="50" width="540" height="860" rx="28" fill="url(#ptp-dots)" opacity="0.5" />
                <path d="M400 70 q14 0 14 14 q0 12 -14 16 L400 112 M286 128 L400 106 L514 128" fill="none" stroke="#1b2035" strokeWidth="5" strokeLinecap="round" />
                <rect x="150" y="70" width="150" height="34" rx="17" fill="#0b0c15" fillOpacity="0.45" />
                <text x="225" y="92" textAnchor="middle" className="ptp-ui">inspo_0412.jpg</text>
              </g>

              {/* C: the dress form, under the pieces */}
              <g data-form>
                <path d={FORM} fill="url(#ptp-dots)" stroke="#9daccd" strokeOpacity="0.6" strokeWidth="2" />
                <rect x="394" y="545" width="12" height="330" fill="#485f88" />
                <ellipse cx="400" cy="885" rx="92" ry="14" fill="none" stroke="#9daccd" strokeOpacity="0.6" strokeWidth="2" />
              </g>

              {/* the pieces */}
              {PIECES.map((p) => (
                <g key={p.id} data-piece={p.id}>
                  <path data-fabric d={p.d} fill={p.back ? "#262d4a" : "url(#ptp-silk)"} />
                  {!p.back && <path data-fabric d={p.d} fill="url(#ptp-sheen)" />}
                  <path data-worn d={p.d} fill={p.back ? "none" : "url(#ptp-silk)"} opacity="0" />
                  <path data-paper d={p.d} fill="#eff4ff" fillOpacity="0.07" />
                  <path data-outline d={p.d} fill="none" stroke="#eff4ff" strokeWidth="2" strokeLinejoin="round" />
                  <g data-pattern>
                    <path d={p.d} fill="none" stroke="#687ef5" strokeWidth="1.5" strokeDasharray="6 6" transform={`translate(400 ${p.ly ?? 500}) scale(1.05) translate(-400 ${-(p.ly ?? 500)})`} />
                    {p.notches && <path d={p.notches} stroke="#eff4ff" strokeWidth="2.5" />}
                    {p.grain && (
                      <path
                        d={`M${p.grain[0]} ${p.grain[1]} V${p.grain[2]} M${p.grain[0] - 6} ${p.grain[1] + 10} L${p.grain[0]} ${p.grain[1]} L${p.grain[0] + 6} ${p.grain[1] + 10} M${p.grain[0] - 6} ${p.grain[2] - 10} L${p.grain[0]} ${p.grain[2]} L${p.grain[0] + 6} ${p.grain[2] - 10}`}
                        fill="none"
                        stroke="#9daccd"
                        strokeWidth="1.5"
                      />
                    )}
                    {p.label && (
                      <>
                        <text x={p.lx} y={p.ly} textAnchor="middle" className="ptp-label">{p.label[0]}</text>
                        <text x={p.lx} y={(p.ly ?? 0) + 16} textAnchor="middle" className="ptp-ui">{p.label[1]}</text>
                      </>
                    )}
                  </g>
                </g>
              ))}

              {/* A: the scan */}
              <g data-scan-g opacity="0" clipPath="url(#ptp-card)">
                <rect data-scan x="130" y="40" width="540" height="90" fill="url(#ptp-scan)" transform="translate(0 -90)" />
              </g>

              {/* C: measurements */}
              {MEASURES.map((mm) => (
                <g key={mm.k} data-measure>
                  <path data-measure-line d={`M300 ${mm.y} H770`} stroke="#687ef5" strokeWidth="1.5" strokeDasharray="4 5" />
                  <circle cx="300" cy={mm.y} r="4" fill="#687ef5" />
                  <text x="770" y={mm.y - 10} textAnchor="end" className="ptp-measure">
                    {mm.k} <tspan className="ptp-measure-v">{mm.v}</tspan>
                  </text>
                </g>
              ))}
            </svg>

            {/* A: what the scan reads */}
            <div aria-hidden className="pointer-events-none absolute inset-0 m-auto h-[92%] max-w-[min(100%,74vh)] md:h-[88%]">
              {TAGS.map((t) => (
                <span
                  key={t.t}
                  data-tag
                  className="hero-glass absolute flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-[clamp(0.65rem,1vw,0.85rem)] text-cloud"
                  style={{ left: t.x, top: t.y }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-cornflower shadow-[0_0_10px_var(--color-cornflower)]" />
                  {t.t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
