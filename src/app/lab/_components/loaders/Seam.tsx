"use client";

import { useState } from "react";
import { Wordmark } from "@/components/Logo";
import { SrProgress, easeInOutQuart, easeOutExpo, pad3, tween, useExit, useShown, type LoaderProps } from "./shared";

/* Seam. The zipper idea, without the image sequence: the page is under
   night cloth, a running stitch sews a seam down the middle as it loads.
   At 100 the thread pulls tight (the stitches close up), then the two
   halves of the cloth part and slide away. Pure CSS shapes. */

export function Seam({ progress, onExit, onDone }: LoaderProps) {
  const shown = useShown(progress, 1.3);
  const [pull, setPull] = useState(0);
  const [part, setPart] = useState(0);

  useExit(shown >= 1, 200, { onExit, onDone }, (end) => {
    let stop2: (() => void) | undefined;
    const stop1 = tween(420, easeOutExpo, setPull, () => {
      stop2 = tween(1150, easeInOutQuart, setPart, end);
    });
    return () => {
      stop1();
      stop2?.();
    };
  });

  const sewn = Math.min(1, shown);
  // stitches 12px on, 8px off; pulling closes them to a solid line
  const on = 12 + pull * 8;
  const lean = part * 3;

  return (
    <div className="ld">
      <SrProgress value={shown} />
      <div className="ld-cloth left-0" style={{ "--gx": "100%", transform: `translateX(${-part * 102}%) rotate(${-lean}deg)`, transformOrigin: "0% 50%" } as React.CSSProperties} />
      <div className="ld-cloth right-0" style={{ "--gx": "0%", transform: `translateX(${part * 102}%) rotate(${lean}deg)`, transformOrigin: "100% 50%" } as React.CSSProperties} />

      <div className="absolute inset-0" style={{ opacity: 1 - part * 2.2 }}>
        <div className="ld-stitch" style={{ height: `${sewn * 100}%`, "--on": `${on}px` } as React.CSSProperties} />
        {pull === 0 && <div className="ld-needle" style={{ top: `${sewn * 100}%` }} />}

        <div className="absolute left-[calc(50%+22px)] top-[max(70px,9svh)] md:left-[calc(50%+32px)]">
          <Wordmark className="h-[clamp(20px,2.4vw,28px)] w-auto text-[var(--cloud)]" />
        </div>
        <div className="ld-mono absolute right-[calc(50%+22px)] text-right text-[var(--periwinkle)] md:right-[calc(50%+32px)]" style={{ top: `calc(${sewn * 100}% - 0.85em)`, opacity: pull ? 0 : 1 }}>
          Sewing {pad3(shown * 100)}
        </div>
        <p className="ld-mono absolute inset-x-0 bottom-[max(88px,12svh)] text-center text-[var(--periwinkle)]" style={{ opacity: pull }}>
          Sewn to measure
        </p>
      </div>
    </div>
  );
}
