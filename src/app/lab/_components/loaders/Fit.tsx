"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "@/components/Logo";
import { SrProgress, easeInOutQuart, easeOutExpo, pad3, tween, useExit, useShown, type LoaderProps } from "./shared";

/* Fit. After the hairline rings on unitedcarriers.com: three rings are
   three measurements, starting loose and wide off screen. As the page
   loads they tighten until they fit the Venty mark exactly. Then the fit
   opens: a hole grows from the centre and the page shows through. */

const RINGS = [
  { tag: "Bust 92", w: 1.0, h: 0.86, dash: false, lag: 0, at: -90 },
  { tag: "Waist 74", w: 0.78, h: 0.66, dash: true, lag: 0.08, at: 180 },
  { tag: "Hip 98", w: 1.18, h: 1.02, dash: false, lag: 0.16, at: 40 },
];

export function Fit({ progress, onExit, onDone }: LoaderProps) {
  const shown = useShown(progress, 1.3);
  const [hole, setHole] = useState(0);
  const [pulse, setPulse] = useState(0);

  const phase = useExit(shown >= 1, 700, { onExit, onDone }, (end) => tween(1150, easeInOutQuart, setHole, end));
  // a single soft pulse when the rings snap to fit
  const fitted = phase !== "load";
  useEffect(() => {
    if (fitted) return tween(700, easeOutExpo, setPulse);
  }, [fitted]);

  const base = "min(46vw, 34svh)";
  const r = `calc(${hole * 150}vmax)`;
  const mask = hole > 0 ? `radial-gradient(circle at 50% 50%, transparent ${r}, #000 calc(${r} + 1px))` : undefined;

  return (
    <div className="ld">
      <SrProgress value={shown} />
      <div className="absolute inset-0 bg-[var(--night)]" style={{ maskImage: mask, WebkitMaskImage: mask }}>
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(40% 40% at 50% 50%, color-mix(in oklab, var(--cornflower) 18%, transparent), transparent 70%)", opacity: 0.4 + pulse * 0.6 }}
        />
        {RINGS.map((g) => {
          // each ring tightens on its own curve, the later ones lag a little
          const k = Math.min(1, Math.max(0, (shown - g.lag) / (1 - g.lag)));
          const loose = 1 + (1 - easeOutExpo(k)) * 3.2;
          return (
            <div
              key={g.tag}
              className={`ld-ring ${g.dash ? "is-dash" : ""}`}
              style={{
                width: `calc(${base} * ${g.w * loose})`,
                height: `calc(${base} * ${g.h * loose})`,
                borderColor: fitted ? "color-mix(in oklab, var(--cornflower) 70%, transparent)" : undefined,
                transition: "border-color .5s",
              }}
            >
              <span
                className="ld-ring__tag ld-mono text-[var(--periwinkle)]"
                style={{ left: `${50 + 50 * Math.cos((g.at * Math.PI) / 180)}%`, top: `${50 + 50 * Math.sin((g.at * Math.PI) / 180)}%` }}
              >
                {g.tag}
              </span>
            </div>
          );
        })}
        <LogoMark
          className="absolute left-1/2 top-1/2 h-[min(9vw,7svh)] w-auto -translate-x-1/2 -translate-y-1/2 text-[var(--cloud)]"
          style={{ filter: `drop-shadow(0 0 ${8 + pulse * 22}px color-mix(in oklab, var(--cornflower) 70%, transparent))` }}
        />

        <div className="ld-mono absolute right-5 top-[max(70px,9svh)] text-right md:right-10">
          <span className="lab-display block text-[clamp(1.8rem,4vw,2.6rem)] leading-none tracking-normal text-[var(--cloud)] normal-case">{pad3(shown * 100)}</span>
          <span className="text-[var(--periwinkle)]">{fitted ? "Fitted" : "Fitting"}</span>
        </div>
        <p className="ld-mono absolute inset-x-0 bottom-[max(88px,12svh)] text-center text-[var(--periwinkle)]">Drafted to your exact measurements</p>
      </div>
    </div>
  );
}
