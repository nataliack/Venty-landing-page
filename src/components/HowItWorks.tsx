"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

/* How it works. A pinned horizontal track: the title, then Measure,
   Describe, Print. Along the bottom a pair of scissors cuts a dashed line
   as you scroll, so the progress bar is the last step. */

const STEPS = [
  {
    k: "Measure",
    h: "Four measures to start.",
    p: "Add more when you want a closer fit. Every measure shows where the tape goes, and your body is saved for every pattern after.",
  },
  {
    k: "Describe",
    h: "Show it. Say it.",
    p: "Upload the photo, or describe it in a sentence. Choose how close it should sit and the fabric you have in mind.",
  },
  {
    k: "Print",
    h: "Print it at home.",
    p: "A4, A0 or projector. Grainlines, notches and labels on every piece, with a page map to tape it together.",
  },
];

const PROMPT = "A slip dress, bias cut, midi length, in silk.";

/* Drag anywhere on the ruler and the value follows. One px of drag is 0.1 cm. */
function Tape() {
  const [cm, setCm] = useState(88);
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const drag = useRef<{ x: number; v: number } | null>(null);

  const onDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, v: cm };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const next = gsap.utils.clamp(60, 140, drag.current.v - (e.clientX - drag.current.x) * 0.1);
    setCm(Math.round(next * 10) / 10);
  };
  const onUp = () => (drag.current = null);
  const shown = unit === "cm" ? cm.toFixed(1) : (cm / 2.54).toFixed(1);

  return (
    <div className="card-dark w-full max-w-[520px] p-6 text-cloud md:p-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg">Bust</p>
          <p className="eyebrow mt-1 text-cloud/50">Fullest point, tape level</p>
        </div>
        <div className="flex gap-1.5">
          {(["cm", "in"] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnit(u)}
              aria-pressed={unit === u}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${unit === u ? "bg-cornflower text-cloud" : "glass text-cloud/70 hover:text-cloud"}`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-6 flex items-baseline gap-2 md:mt-10">
        <span className="font-display text-[clamp(4rem,9vw,7.5rem)] leading-none tabular-nums">{shown}</span>
        <span className="eyebrow text-cloud/60">{unit}</span>
      </p>
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        role="slider"
        aria-label="Bust measurement"
        aria-valuemin={60}
        aria-valuemax={140}
        aria-valuenow={cm}
        aria-valuetext={`${shown} ${unit}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setCm((v) => Math.min(140, v + 0.5));
          if (e.key === "ArrowLeft") setCm((v) => Math.max(60, v - 0.5));
        }}
        className="tape relative mt-6 h-24 cursor-ew-resize touch-pan-y select-none overflow-hidden rounded-2xl md:mt-10"
      >
        <div
          className="absolute left-1/2 top-0 h-full w-max transition-transform duration-150 ease-out will-change-transform"
          style={{ transform: `translateX(${-(cm - 60) * 10}px)` }}
        >
          {Array.from({ length: 81 }).map((_, i) => {
            const v = 60 + i;
            const big = v % 5 === 0;
            return (
              <div key={v} className="absolute top-0 flex flex-col items-center" style={{ left: i * 10 }}>
                <span className={`w-px bg-ink ${big ? "h-7" : "h-3.5 opacity-60"}`} />
                {big && <span className="mt-1.5 font-display text-sm text-ink/80">{v}</span>}
              </div>
            );
          })}
        </div>
        <span className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-cornflower shadow-[0_0_18px_var(--color-cornflower)]" />
        <span className="eyebrow absolute bottom-2 right-3 text-ink/50">Drag</span>
      </div>
    </div>
  );
}

function Describe() {
  return (
    <div className="card-dark w-full max-w-[520px] p-6 text-cloud md:p-8">
      <div className="flex items-center gap-4">
        <span className="relative block h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-[linear-gradient(180deg,#9daccd,#262d4a)]">
          <svg viewBox="200 100 400 760" className="absolute inset-0 h-full w-full" aria-hidden>
            <path d="M318 250 Q352 236 400 286 Q448 236 482 250 L492 380 L578 820 Q400 850 222 820 L308 380 Z" fill="#687ef5" />
          </svg>
        </span>
        <div>
          <p className="eyebrow text-cloud/50">Photo</p>
          <p className="mt-1 text-sm text-cloud/80">inspo_0412.jpg</p>
        </div>
      </div>
      <p className="eyebrow mt-8 text-cloud/50">Describe it</p>
      <p className="mt-3 min-h-[3.2em] text-[clamp(1.25rem,2vw,1.6rem)] leading-tight">
        <span data-typed />
        <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-1 bg-cornflower [animation:blink_1s_steps(1)_infinite]" />
      </p>
      <p className="eyebrow mt-7 text-cloud/50">How close</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {["Close", "Easy", "Loose"].map((c) => (
          <span key={c} data-fit={c} className="glass rounded-full px-4 py-1.5 text-sm text-cloud/80 transition-colors duration-300">
            {c}
          </span>
        ))}
      </div>
      <div className="mt-7 flex items-center justify-between rounded-2xl bg-cloud/5 px-4 py-3 ring-1 ring-cloud/10">
        <span className="text-sm text-cloud/60">Fabric</span>
        <span className="text-sm">Silk crepe de chine</span>
      </div>
    </div>
  );
}

function Print() {
  return (
    <div className="card-grad w-full max-w-[520px] p-6 text-cloud md:p-8">
      <div className="flex items-start justify-between">
        <p className="text-lg">Skirt front</p>
        <span className="glass rounded-full px-3 py-1 text-xs">1:1</span>
      </div>
      <div className="relative mt-6 grid grid-cols-4 gap-1">
        {Array.from({ length: 16 }).map((_, k) => (
          <span key={k} data-page className="relative aspect-[1/1.41] rounded-[3px] bg-cloud/10 ring-1 ring-cloud/25">
            <span className="absolute left-1 top-0.5 font-display text-[10px] text-cloud/60">{String.fromCharCode(65 + Math.floor(k / 4))}{(k % 4) + 1}</span>
          </span>
        ))}
        <svg viewBox="0 0 400 564" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
          <path data-cutline d="M150 40 Q200 50 250 40 L340 520 Q200 545 60 520 Z" fill="none" stroke="#eff4ff" strokeWidth="2.5" strokeDasharray="1 0" />
        </svg>
      </div>
      <p className="eyebrow mt-5 text-cloud/70">16 pages · page map included</p>
    </div>
  );
}

const VISUALS = [Tape, Describe, Print];

export function HowItWorks() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const track = el.querySelector<HTMLElement>("[data-track]")!;
      const panels = gsap.utils.toArray<HTMLElement>("[data-panel]", el);
      const typed = el.querySelector<HTMLElement>("[data-typed]")!;
      const fits = gsap.utils.toArray<HTMLElement>("[data-fit]", el);
      const pages = gsap.utils.toArray<HTMLElement>("[data-page]", el);
      const cut = el.querySelector<HTMLElement>("[data-cut]")!;
      const scissors = el.querySelector<HTMLElement>("[data-scissors]")!;
      const bladeA = el.querySelector<SVGGElement>("[data-blade-a]")!;
      const bladeB = el.querySelector<SVGGElement>("[data-blade-b]")!;
      gsap.set("[data-cutline]", { drawSVG: "0%" });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            cut.style.transform = `scaleX(${p})`;
            scissors.style.left = `${p * 100}%`;
            const snip = reduce ? 0 : Math.abs(Math.sin(p * Math.PI * 22)) * 16;
            bladeA.style.transform = `rotate(${-snip}deg)`;
            bladeB.style.transform = `rotate(${snip}deg)`;
            // Describe types as you scroll through it
            const d = gsap.utils.clamp(0, 1, (p - 0.46) / 0.2);
            typed.textContent = PROMPT.slice(0, Math.round(d * PROMPT.length));
            const f = d > 0.95 ? 1 : d > 0.6 ? 0 : -1;
            fits.forEach((c, i) => {
              c.style.background = i === f ? "var(--color-cornflower)" : "";
              c.style.color = i === f ? "var(--color-cloud)" : "";
            });
            // Print fills page by page
            const pr = gsap.utils.clamp(0, 1, (p - 0.72) / 0.22);
            pages.forEach((pg, i) => (pg.style.background = i < pr * pages.length ? "rgba(239,244,255,0.5)" : ""));
          },
        },
      });
      tl.to(track, { x: () => -(panels.length - 1) * window.innerWidth, ease: "none", duration: 1 }, 0)
        .to("[data-cutline]", { drawSVG: "100%", duration: 0.2, ease: "none" }, 0.78);

      // each big number slides in as its panel arrives
      if (!reduce) {
        panels.forEach((p, i) => {
          const num = p.querySelector("[data-num]");
          if (num) tl.from(num, { xPercent: 60, opacity: 0, duration: 0.7 / (panels.length - 1), ease: "power2.out" }, (i - 0.8) / (panels.length - 1));
        });
      }
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} id="how" data-wing="frame" data-nav="How it works" data-theme-zone="dark" className="relative h-[460vh]">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <div data-track className="flex h-full w-max will-change-transform">
          {/* title panel */}
          <div data-panel className="flex h-full w-screen shrink-0 flex-col justify-center px-5 md:px-10">
            <p className="eyebrow text-periwinkle">How it works</p>
            <h2 className="headline mt-6 text-[clamp(3.4rem,11vw,12rem)] text-fg">
              <span className="block">Three steps.</span>
              <span className="font-display block text-[1.08em] leading-[1] text-cornflower">Then scissors.</span>
            </h2>
            <p className="body-lg mt-8 max-w-[30ch] text-muted">Keep scrolling. The scissors are already moving.</p>
          </div>

          {STEPS.map((s, i) => {
            const V = VISUALS[i];
            return (
              <article
                key={s.k}
                data-panel
                className="grid h-full w-screen shrink-0 grid-rows-[auto_1fr] content-center items-center gap-6 px-5 pb-24 pt-20 md:grid-cols-12 md:grid-rows-1 md:gap-10 md:px-10 md:pb-0 md:pt-0"
              >
                <div className="md:col-span-6">
                  <p data-num className="font-display text-[clamp(4.5rem,15vw,15rem)] leading-[0.8] text-cornflower">0{i + 1}</p>
                  <p className="eyebrow mt-4 text-periwinkle md:mt-8">{s.k}</p>
                  <h3 className="headline mt-3 max-w-[14ch] text-[clamp(1.9rem,4vw,4.2rem)] text-fg">{s.h}</h3>
                  <p className="body-lg mt-4 max-w-md text-muted">{s.p}</p>
                </div>
                <div className="flex justify-center md:col-span-6 md:justify-end">
                  <V />
                </div>
              </article>
            );
          })}
        </div>

        {/* the cut line */}
        <div aria-hidden className="absolute inset-x-5 bottom-6 h-6 md:inset-x-10 md:bottom-8">
          <span className="absolute inset-x-0 top-1/2 h-px bg-[repeating-linear-gradient(90deg,var(--color-periwinkle)_0_8px,transparent_8px_14px)] opacity-60" />
          <span data-cut className="absolute inset-x-0 top-1/2 -mt-[3.5px] h-[7px] origin-left border-y border-cloud/80 bg-night" style={{ transform: "scaleX(0)" }} />
          <span data-scissors className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: 0 }}>
            <svg width="44" height="28" viewBox="0 0 44 28" fill="none" className="overflow-visible">
              <g data-blade-a style={{ transformOrigin: "22px 14px" }}>
                <path d="M22 14 L43 11" stroke="var(--color-cloud)" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="9" cy="7" r="6" stroke="var(--color-cornflower)" strokeWidth="2.5" />
                <path d="M14 9.5 L22 14" stroke="var(--color-cornflower)" strokeWidth="2.5" />
              </g>
              <g data-blade-b style={{ transformOrigin: "22px 14px" }}>
                <path d="M22 14 L43 17" stroke="var(--color-cloud)" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="9" cy="21" r="6" stroke="var(--color-cornflower)" strokeWidth="2.5" />
                <path d="M14 18.5 L22 14" stroke="var(--color-cornflower)" strokeWidth="2.5" />
              </g>
              <circle cx="22" cy="14" r="1.8" fill="var(--color-cloud)" />
            </svg>
          </span>
        </div>
      </div>
    </section>
  );
}
