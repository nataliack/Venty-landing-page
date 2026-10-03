"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* Interactive tape. Drag anywhere on the ruler, the value follows.
   One px of drag is 0.1 cm. */
export function Measure() {
  const ref = useRef<HTMLElement>(null);
  const tapeRef = useRef<HTMLDivElement>(null);
  const [cm, setCm] = useState(88);
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const drag = useRef<{ x: number; v: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-in]", {
        y: 40,
        opacity: 0,
        stagger: 0.08,
        duration: 1.3,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 70%" },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  const onDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, v: cm };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const next = gsap.utils.clamp(60, 140, drag.current.v - (e.clientX - drag.current.x) * 0.1);
    setCm(Math.round(next * 10) / 10);
  };
  const onUp = () => (drag.current = null);

  const shown = unit === "cm" ? cm.toFixed(1) : (cm / 2.54).toFixed(1);
  const offset = -(cm - 60) * 10; // 10px per cm, track origin sits at the centre line

  return (
    <section ref={ref} id="measure" data-wing="drift" data-nav="Try the tape" className="relative overflow-hidden px-5 py-[16vh] md:px-10">
      <div className="grid gap-10 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <p data-in className="eyebrow text-faint">Try the tape</p>
          <h2 data-in className="headline mt-4 max-w-[12ch] text-[clamp(2.4rem,6vw,6.5rem)]">
            Snug, not tight, over light clothing.
          </h2>
        </div>
        <p data-in className="body-lg max-w-sm text-muted md:col-span-5">
          Every measure in Venty comes with a picture of where and how. Drag the
          tape below to see how the number moves.
        </p>
      </div>

      <div data-in className="mt-16 grid gap-6 md:grid-cols-12 md:items-center">
        <div className="md:col-span-4">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-[clamp(5rem,12vw,12rem)] leading-none tabular-nums">{shown}</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            {(["cm", "in"] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  unit === u ? "bg-cornflower text-cloud" : "glass text-muted hover:text-fg"
                }`}
              >
                {u === "cm" ? "Centimetres" : "Inches"}
              </button>
            ))}
            <span className="eyebrow ml-3 text-faint">Bust</span>
          </div>
        </div>

        <div
          ref={tapeRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className="card-dark relative h-[180px] cursor-ew-resize touch-pan-y select-none md:col-span-8 md:h-[260px]"
          role="slider"
          aria-label="Bust measurement"
          aria-valuemin={60}
          aria-valuemax={140}
          aria-valuenow={cm}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") setCm((v) => Math.min(140, v + 0.5));
            if (e.key === "ArrowLeft") setCm((v) => Math.max(60, v - 0.5));
          }}
        >
          <div className="absolute inset-x-0 top-1/2 h-16 -translate-y-1/2 overflow-hidden">
            <div
              className="absolute left-1/2 top-0 h-16 w-max transition-transform duration-150 ease-out will-change-transform"
              style={{ transform: `translateX(${offset}px)` }}
            >
              {Array.from({ length: 81 }).map((_, i) => {
                const v = 60 + i;
                const big = v % 5 === 0;
                return (
                  <div key={v} className="absolute bottom-0 flex flex-col items-center" style={{ left: i * 10 }}>
                    {big && <span className="mb-2 font-display text-sm text-cloud/60">{v}</span>}
                    <span className={`w-px bg-cloud ${big ? "h-8 opacity-90" : "h-4 opacity-40"}`} />
                  </div>
                );
              })}
            </div>
          </div>
          <span className="absolute left-1/2 top-1/2 h-24 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-cornflower shadow-[0_0_24px_var(--color-cornflower)]" />
          <p className="eyebrow absolute bottom-5 left-6 text-cloud/50">Drag</p>
        </div>
      </div>
    </section>
  );
}
