"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Sky } from "./Sky";

/* Loading screen, visualisation stage.
   Background: the Welcome sky from the app (periwinkle beam falling into
   night, three drifting lights). Centre: the zipper as a still image.
   Below: a thin progress line with a cornflower glow and the percentage.
   `demo` runs a fake 0 to 100 so the motion can be judged. */
export function Loader({ demo = true }: { demo?: boolean }) {
  const [pct, setPct] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!demo) return;
    const o = { v: 0 };
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.2 });
    tl.to(o, { v: 62, duration: 2.4, ease: "power2.out", onUpdate: () => setPct(Math.round(o.v)) })
      .to(o, { v: 78, duration: 1.4, ease: "power1.inOut", onUpdate: () => setPct(Math.round(o.v)) })
      .to(o, { v: 100, duration: 1.1, ease: "expo.inOut", onUpdate: () => setPct(Math.round(o.v)) })
      .to({}, { duration: 0.8 })
      .set(o, { v: 0, onUpdate: () => setPct(0) });
    return () => {
      tl.kill();
    };
  }, [demo]);

  return (
    <div ref={ref} className="loader fixed inset-0 z-[100] overflow-hidden">
      <Sky variant="dark" />

      <div className="relative flex h-full flex-col items-center justify-center px-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/loader/zipper.webp"
          alt=""
          className="loader__zip select-none"
          draggable={false}
        />

        <div className="loader__bar mt-10 w-[min(360px,70vw)]">
          <div className="loader__track">
            <div className="loader__fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="loader__pct font-display mt-5 text-center tabular-nums">
            {pct}
            <span className="loader__pctsign">%</span>
          </p>
        </div>
      </div>
    </div>
  );
}
