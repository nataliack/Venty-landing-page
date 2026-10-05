"use client";

import { useState } from "react";
import { Crown, SrProgress, easeInOutQuart, tween, useExit, useShown, type LoaderProps } from "./shared";

/* Sizes (light). An odometer rolls through standard dress sizes while the
   page loads; each one is struck through as it passes. It lands on
   "Yours." (after the hero's "This body doesn't exist. Yours does.").
   Then the Crown closes in on the word and the page is underneath. */

const ROWS = ["4", "6", "8", "10", "12", "14", "16", "18", "20", "Yours."];

export function Sizes({ progress, onExit, onDone }: LoaderProps) {
  const shown = useShown(progress, 1.8);
  const [close, setClose] = useState(0);

  const phase = useExit(shown >= 1, 900, { onExit, onDone }, (end) => tween(1000, easeInOutQuart, setClose, end));
  const landed = phase !== "load";

  // the roll eases between rows so each size sits for a moment
  const pos = shown * (ROWS.length - 1);
  const i = Math.floor(pos);
  const f = pos - i;
  const settle = i + (f < 0.55 ? 0 : easeInOutQuart((f - 0.55) / 0.45));
  const clip = close > 0 ? `circle(${(1 - close) * 120}% at 50% 50%)` : undefined;

  return (
    <div className="ld">
      <SrProgress value={shown} />
      <div className="absolute inset-0" style={{ clipPath: clip, WebkitClipPath: clip }}>
        <Crown />
        <p className="ld-mono ld-ink absolute inset-x-0 top-[max(76px,11svh)] text-center">{landed ? "Your size" : "Standard size"}</p>

        <div className="ld-roll absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
          <div style={{ transform: `translateY(calc(var(--row) * ${1 - settle}))` }}>
            {ROWS.map((r, k) => {
              const last = k === ROWS.length - 1;
              const struck = !last && settle > k + 0.35;
              return (
                <div
                  key={r}
                  className="ld-roll__row lab-display text-[var(--cloud)]"
                  style={{ fontSize: "calc(var(--row) * 0.82)", opacity: last ? 1 : struck ? 0.38 : 1, fontStyle: last ? "italic" : undefined }}
                >
                  <span className="relative inline-block">
                    {r}
                    {!last && <span className="ld-roll__strike" style={{ transform: `scaleX(${Math.min(1, Math.max(0, (settle - k - 0.1) * 3))})` }} />}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="ld-mono absolute inset-x-0 bottom-[max(88px,12svh)] text-center text-[var(--mist)]">
          {landed ? "Drafted to your exact measurements" : `${Math.round(shown * 100)}% · no standard sizes`}
        </p>
      </div>
    </div>
  );
}
