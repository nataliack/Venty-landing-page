"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Sky } from "./Sky";

/* Loading screen, design stage.
   Layers back to front: the loader sky (dark fog down the centre, glow at
   the edges), the zipper hardware at full height, a soft shade band, the
   progress line with its travelling light, the percentage.
   `demo` fakes 0 to 100 so the motion can be judged. */
export function Loader({ demo = true }: { demo?: boolean }) {
  const [pct, setPct] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      // the lit head breathes
      gsap.to("[data-head]", { scale: 1.35, opacity: 0.75, duration: 1.1, ease: "sine.inOut", yoyo: true, repeat: -1 });
      // a pulse of light runs from the start of the line to the head, over and over
      gsap.fromTo(
        "[data-pulse]",
        { xPercent: -100, opacity: 0 },
        { xPercent: 0, opacity: 1, duration: 1.6, ease: "power2.in", repeat: -1, repeatDelay: 0.5 },
      );
      // the bloom behind the head drifts a little, so it never reads as a stamp
      gsap.to("[data-bloom]", { x: 6, scaleX: 1.15, duration: 2.2, ease: "sine.inOut", yoyo: true, repeat: -1 });
    }, el);

    if (!demo) return () => ctx.revert();
    const o = { v: 0 };
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.2 });
    const upd = () => setPct(Math.round(o.v));
    tl.to(o, { v: 62, duration: 2.6, ease: "power2.out", onUpdate: upd })
      .to(o, { v: 78, duration: 1.4, ease: "power1.inOut", onUpdate: upd })
      .to(o, { v: 100, duration: 1.2, ease: "expo.inOut", onUpdate: upd })
      .to({}, { duration: 0.9 })
      .set(o, { v: 0, onUpdate: upd });
    return () => {
      tl.kill();
      ctx.revert();
    };
  }, [demo]);

  // the fill width eases toward the value rather than stepping
  useEffect(() => {
    if (fillRef.current) gsap.to(fillRef.current, { width: `${pct}%`, duration: 0.5, ease: "power3.out", overwrite: true });
  }, [pct]);

  return (
    <div ref={ref} className="loader fixed inset-0 z-[100] overflow-hidden">
      <Sky variant="loader" />

      {/* zipper hardware, full height, behind everything else */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/loader/zipper.webp" alt="" className="loader__zip select-none" draggable={false} />

      {/* soft shade so the zipper falls away behind the line */}
      <div className="loader__shade" aria-hidden="true" />

      <div className="loader__bar">
        <div className="loader__track">
          <div ref={fillRef} className="loader__fill" style={{ width: 0 }}>
            <span data-pulse className="loader__pulse" />
            <span data-bloom className="loader__bloom" />
            <span data-head className="loader__head" />
          </div>
        </div>
        <p className="loader__pct font-display tabular-nums">
          {pct}
          <span className="loader__pctsign">%</span>
        </p>
      </div>
    </div>
  );
}
