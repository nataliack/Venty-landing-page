"use client";

import { useEffect, useRef, useState } from "react";
import { LogoMark, Wordmark } from "@/components/Logo";
import { Crown, SrProgress, easeInOutQuart, pad3, tween, useExit, useShown, type LoaderProps } from "./shared";

/* Thread (light). On Crown, the Venty mark and wordmark are traced in one
   continuous thread, path after path, in the order they are written. At
   100 the letters fill in, then the Crown lifts like a blind and the page
   is underneath. */

export function Thread({ progress, onExit, onDone }: LoaderProps) {
  const shown = useShown(progress, 1.5);
  const box = useRef<HTMLDivElement>(null);
  const lens = useRef<{ idx: number; len: number; start: number; end: number }[]>([]);
  const [lift, setLift] = useState(0);

  // measure every path once; each one owns its share of the total length
  useEffect(() => {
    // mark first, then the letters left to right (their source order is not V-e-n-t-y)
    const all = Array.from(box.current?.querySelectorAll<SVGPathElement>("path") ?? []);
    const svgs = Array.from(box.current?.querySelectorAll("svg") ?? []);
    const order = all
      .map((el, idx) => ({ el, idx, svg: svgs.indexOf(el.ownerSVGElement!), x: el.getBBox().x }))
      .sort((a, b) => a.svg - b.svg || a.x - b.x);
    const els = order.map((o) => o.el);
    const sizes = els.map((el) => el.getTotalLength());
    const total = sizes.reduce((x, y) => x + y, 0) || 1;
    let acc = 0;
    lens.current = els.map((el, i) => {
      const len = sizes[i];
      el.style.strokeDasharray = `${len}`;
      el.style.strokeDashoffset = `${len}`;
      const item = { idx: order[i].idx, len, start: acc / total, end: (acc + len) / total };
      acc += len;
      return item;
    });
  }, []);

  useEffect(() => {
    const els = box.current?.querySelectorAll<SVGPathElement>("path");
    lens.current.forEach((p) => {
      const el = els?.[p.idx];
      if (!el) return;
      const k = Math.min(1, Math.max(0, (shown - p.start) / Math.max(1e-6, p.end - p.start)));
      el.style.strokeDashoffset = `${p.len * (1 - k)}`;
    });
  }, [shown]);

  const phase = useExit(shown >= 1, 800, { onExit, onDone }, (end) => tween(1100, easeInOutQuart, setLift, end));
  const filled = phase !== "load";

  return (
    <div className="ld">
      <SrProgress value={shown} />
      <div className="absolute inset-0" style={{ transform: `translateY(${-lift * 102}%)` }}>
        <Crown />
        <p className="ld-mono ld-ink absolute inset-x-0 top-[max(76px,11svh)] text-center">{filled ? "Ready" : "Threading the needle"}</p>

        <div
          ref={box}
          className="ld-thread absolute left-1/2 top-[46%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-[2.5vh]"
          style={{ "--fill": filled ? 1 : 0, filter: "drop-shadow(0 0 18px color-mix(in oklab, var(--cloud) 55%, transparent))" } as React.CSSProperties}
        >
          <LogoMark className="h-[clamp(56px,11vw,110px)] w-auto" />
          <Wordmark className="h-[clamp(52px,10vw,104px)] w-auto" />
        </div>

        <div className="ld-mono absolute inset-x-5 bottom-[max(88px,12svh)] flex items-end justify-between text-[var(--mist)] md:inset-x-10">
          <span>Made to measure</span>
          <span className="lab-display text-[clamp(2rem,5vw,3.2rem)] leading-none tracking-normal text-[var(--cloud)] normal-case">{pad3(shown * 100)}</span>
        </div>
      </div>
    </div>
  );
}
