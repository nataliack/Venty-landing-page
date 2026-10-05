"use client";

import { useState } from "react";
import { LogoMark } from "@/components/Logo";
import { SrProgress, easeInCubic, easeInOutQuart, tween, useExit, useShown, type LoaderProps } from "./shared";

/* Tape. A measuring tape runs under a fixed reading line; the reading is
   the progress, in centimetres, 0 to 100. At 100 the tape whips back into
   its case and the night splits open along the line it ran on. */

const MAX = 100;

export function Tape({ progress, onExit, onDone }: LoaderProps) {
  const shown = useShown(progress, 1.4);
  const [retract, setRetract] = useState(0);
  const [split, setSplit] = useState(0);

  const phase = useExit(shown >= 1, 500, { onExit, onDone }, (end) => {
    let stop2: (() => void) | undefined;
    const stop1 = tween(520, easeInCubic, setRetract, () => {
      stop2 = tween(1000, easeInOutQuart, setSplit, end);
    });
    return () => {
      stop1();
      stop2?.();
    };
  });

  const cm = shown * MAX;
  const half = (side: -1 | 1) => ({ transform: `translateY(${side * split * 101}%)` });

  return (
    <div className="ld">
      <SrProgress value={shown} />
      {/* the night, in two halves that part along the tape */}
      <div className="absolute inset-x-0 top-0 h-1/2 bg-[var(--night)]" style={half(-1)} />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[var(--night)]" style={half(1)} />

      <div className="absolute inset-0" style={{ opacity: 1 - split * 1.6 }}>
        {/* reading */}
        <div className="absolute inset-x-0 top-[calc(50%-150px)] text-center md:top-[calc(50%-200px)]">
          <p className="ld-mono text-[var(--periwinkle)]">{phase === "load" ? "Taking your measure" : "Measured"}</p>
          <p className="lab-display mt-1 text-[clamp(3.5rem,12vw,8rem)] leading-none tabular-nums">
            {cm.toFixed(1)}
            <span className="ml-2 align-top font-[family-name:var(--font-familjen)] text-[0.22em] font-normal text-[var(--periwinkle)]">cm</span>
          </p>
        </div>

        {/* the tape: 0 sits under the line at the start, the reading moves left */}
        <div className="absolute inset-x-0 top-1/2 h-[clamp(46px,7vw,64px)] -translate-y-1/2 overflow-visible">
          <div
            className="ld-tape"
            style={{
              width: `calc(var(--cm) * ${MAX + 30})`,
              transform: `translateX(calc(var(--cm) * ${-cm} + ${retract * 140}vw))`,
            }}
          >
            {Array.from({ length: MAX + 21 }, (_, i) => (
              <span key={i} className={`ld-tape__n ${i % 10 === 0 ? "is-ten" : ""}`} style={{ left: `calc(var(--cm) * ${i})` }}>
                {i === 0 ? "" : i}
              </span>
            ))}
            {/* the brass hook at 0 */}
            <span className="absolute -left-[10px] top-[-4px] h-[calc(100%+8px)] w-[10px] rounded-l-[3px] bg-[var(--steel)]" />
          </div>
        </div>

        {/* reading line */}
        <div className="absolute left-1/2 top-1/2 h-[clamp(90px,12vw,120px)] w-px -translate-x-1/2 -translate-y-1/2 bg-[var(--cornflower)] shadow-[0_0_12px_var(--cornflower)]" />
        <div className="absolute left-1/2 top-[calc(50%-clamp(45px,6vw,60px)-8px)] h-0 w-0 -translate-x-1/2 border-x-[6px] border-t-[8px] border-x-transparent border-t-[var(--cornflower)]" />

        <div className="ld-mono absolute inset-x-5 bottom-[max(88px,12svh)] flex items-center justify-between text-[var(--periwinkle)] md:inset-x-10">
          <LogoMark className="h-6 w-auto text-[var(--cloud)]" />
          <span>Made to measure</span>
        </div>
      </div>
    </div>
  );
}
