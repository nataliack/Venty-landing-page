"use client";

import type { CSSProperties } from "react";
import { LogoMark } from "@/components/Logo";

/* Objects drawn in code, flat with a fake depth (gradients, highlights and
   shadows), for the How it works concepts.

   Tape: a tailor's tape, 16 mm across. Every measure comes from one unit,
   --mm (whole pixels, so every tick lands on a pixel): millimetre ticks
   from both edges (longer at 5 mm and at each centimetre), the numbers in
   ink, every tenth in cornflower. `reverse` puts its steel tip on the right
   (a tape pulled out of a case on its left).

   TapeCase: a tape case in Venty cornflower, the mark on its hub. */

export function Tape({ cm, from = 0, reverse = false, className = "", style }: { cm: number; from?: number; reverse?: boolean; className?: string; style?: CSSProperties }) {
  const nums = Array.from({ length: cm + 1 }, (_, i) => from + i).filter((n) => n > 0);
  return (
    <div className={`tp ${reverse ? "is-rev" : ""} ${className}`} style={{ "--len": cm, ...style } as CSSProperties} aria-hidden="true">
      <span className="tp__ticks is-top" />
      <span className="tp__ticks is-bottom" />
      {nums.map((n) => (
        <span key={n} className={`tp__n ${n % 10 === 0 ? "is-ten" : ""}`} style={{ "--at": n - from } as CSSProperties}>
          {n}
        </span>
      ))}
      {from === 0 && (
        <span className="tp__tip">
          <i />
          <i />
        </span>
      )}
    </div>
  );
}

export function TapeCase({ className = "" }: { className?: string }) {
  return (
    <div className={`tc ${className}`} aria-hidden="true">
      <span className="tc__hub">
        <LogoMark className="tc__mark" />
      </span>
      <span className="tc__slot" />
      <span className="tc__lock" />
    </div>
  );
}
