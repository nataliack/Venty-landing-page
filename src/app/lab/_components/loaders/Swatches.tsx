"use client";

import { useState } from "react";
import { Crown, SrProgress, easeInCubic, easeInOutQuart, easeOutExpo, pad3, tween, useExit, useShown, type LoaderProps } from "./shared";

/* Swatches (light). A swatch book in the Venty palette: one fabric card
   drops onto the stack for each step of the load, each a little askew.
   At 100 the book fans open like a hand of cards, then the cards fly out
   past the edges and the Crown fades, leaving the page. */

const CARDS = [
  { fabric: "Organdy", colour: "Cloud", bg: "#eff4ff", ink: true },
  { fabric: "Silk", colour: "Mist", bg: "#c0c8db", ink: true },
  { fabric: "Linen", colour: "Periwinkle", bg: "#9daccd", ink: true },
  { fabric: "Cotton", colour: "Cornflower", bg: "#687ef5", ink: false },
  { fabric: "Twill", colour: "Steel", bg: "#485f88", ink: false },
  { fabric: "Wool", colour: "Navy", bg: "#384c65", ink: false },
  { fabric: "Satin", colour: "Ink", bg: "#121524", ink: false },
];
const TILT = [-7, 5, -3, 8, -5, 3, 0];

export function Swatches({ progress, onExit, onDone }: LoaderProps) {
  const shown = useShown(progress, 1.6);
  const [fan, setFan] = useState(0);
  const [fly, setFly] = useState(0);

  useExit(shown >= 1, 250, { onExit, onDone }, (end) => {
    let stop2: (() => void) | undefined;
    const stop1 = tween(650, easeOutExpo, setFan, () => {
      stop2 = tween(900, easeInCubic, setFly, end);
    });
    return () => {
      stop1();
      stop2?.();
    };
  });

  const n = CARDS.length;

  return (
    <div className="ld">
      <SrProgress value={shown} />
      <Crown style={{ opacity: 1 - easeInOutQuart(fly) }} />

      <div className="absolute inset-0" style={{ opacity: fly > 0.85 ? (1 - fly) / 0.15 : 1 }}>
        <p className="ld-mono ld-ink absolute inset-x-0 top-[max(76px,11svh)] text-center">{fan ? "Your fabrics" : "Choosing fabrics"}</p>

        {CARDS.map((c, i) => {
          // each card owns a slice of the load and drops in over it
          const k = easeOutExpo(Math.min(1, Math.max(0, (shown * n - i) / 1)));
          const spread = i - (n - 1) / 2;
          const rot = TILT[i] * (1 - fan) + spread * 11 * fan;
          const x = spread * 52 * fan;
          const y = -60 * (1 - k) + Math.abs(spread) * 10 * fan;
          // flying: each card leaves along its own fan direction
          const away = fly * 120;
          const fx = spread * away * 1.4;
          const fy = -away * (1.2 - Math.abs(spread) * 0.15);
          return (
            <div
              key={c.fabric}
              className="ld-swatch"
              style={{
                background: c.bg,
                color: c.ink ? "var(--ink)" : "var(--cloud)",
                opacity: k,
                transform: `translate(-50%, -50%) translate(calc(${x}% + ${fx}vw), calc(${y}% + ${fy}vh)) rotate(${rot + spread * fly * 25}deg)`,
                transformOrigin: "50% 120%",
                zIndex: i,
              }}
            >
              <span className="ld-mono flex justify-between opacity-80">
                <span>Nº {String(i + 1).padStart(2, "0")}</span>
                <span>{c.colour}</span>
              </span>
              <span className="lab-display text-[clamp(1.6rem,3.6vw,2.4rem)] leading-none">{c.fabric}</span>
            </div>
          );
        })}

        <div className="ld-mono absolute inset-x-5 bottom-[max(88px,12svh)] flex items-end justify-between text-[var(--mist)] md:inset-x-10">
          <span>Swatch book</span>
          <span className="lab-display text-[clamp(2rem,5vw,3.2rem)] leading-none tracking-normal text-[var(--cloud)] normal-case">{pad3(shown * 100)}</span>
        </div>
      </div>
    </div>
  );
}
