"use client";

import { useEffect, useRef, useState } from "react";
import { Decode, SrProgress, easeInOutQuart, pad3, tween, useExit, useShown, type LoaderProps } from "./shared";

/* Draft. Pattern paper; a bodice front is drafted line by line as the
   page loads, with the measurements it is drafted from decoding in on
   the left and the pattern's details on the right (after the data lists
   on unitedcarriers.com). At 100% the piece gets its grainline and
   notches, then the sheet lifts away like paper off the table. */

const OUTLINE =
  "M24 52 Q60 50 74 16 L150 34 C142 70 150 110 182 122 Q176 170 172 210 L118 214 L100 160 L86 216 L24 222 Z";

const LEFT: [string, number][] = [
  ["Bust 92.0", 0.08],
  ["Waist 74.0", 0.2],
  ["Hip 98.0", 0.32],
  ["Shoulder 39.0", 0.44],
  ["Back 42.0", 0.56],
  ["Neck 36.0", 0.68],
];
const RIGHT: [string, number][] = [
  ["Pattern Nº 0001", 0.05],
  ["Bodice front", 0.18],
  ["Ease +4.0 cm", 0.3],
  ["Seam 1.5 cm", 0.42],
  ["Scale 1:1", 0.54],
  ["Cut 1 on fold", 0.66],
];

export function Draft({ progress, onExit, onDone }: LoaderProps) {
  const shown = useShown(progress);
  const path = useRef<SVGPathElement>(null);
  const [len, setLen] = useState(0);
  const [head, setHead] = useState({ x: 24, y: 52 });
  const [lift, setLift] = useState(0);

  useEffect(() => {
     
    if (path.current) setLen(path.current.getTotalLength());
  }, []);
  useEffect(() => {
    if (!path.current || !len) return;
    const p = path.current.getPointAtLength(len * Math.min(1, shown));
     
    setHead({ x: p.x, y: p.y });
  }, [shown, len]);

  const phase = useExit(shown >= 1, 650, { onExit, onDone }, (end) => tween(1100, easeInOutQuart, setLift, end));

  const done = phase !== "load";

  return (
    <div className="ld" aria-live="off">
      <SrProgress value={shown} />
      <div
        className="ld-paper absolute inset-0"
        style={{ transform: `translateY(${-lift * 105}%) rotate(${-lift * 2}deg)`, transformOrigin: "50% 100%", opacity: 1 - lift * 0.15 }}
      >
        {/* the piece */}
        <svg viewBox="0 0 206 240" className="ld-piece absolute left-1/2 top-[56%] h-[min(46svh,520px)] w-auto -translate-x-1/2 -translate-y-1/2 overflow-visible md:top-1/2 md:h-[min(56svh,520px)]" aria-hidden="true">
          <path d={OUTLINE} fill={done ? "color-mix(in oklab, var(--cornflower) 14%, transparent)" : "transparent"} stroke="none" style={{ transition: "fill .6s" }} />
          <path
            ref={path}
            d={OUTLINE}
            fill="none"
            stroke="var(--cloud)"
            strokeWidth="0.9"
            strokeLinejoin="round"
            pathLength={len || 1}
            strokeDasharray={len || 1}
            strokeDashoffset={(len || 1) * (1 - Math.min(1, shown))}
          />
          {/* centre front fold, dashed */}
          <line x1="24" y1="52" x2="24" y2="222" stroke="var(--periwinkle)" strokeWidth="0.6" strokeDasharray="3 3" opacity={shown > 0.95 ? 1 : 0} className="ld-fade" />
          {/* grainline and notches appear when the draft closes */}
          <g opacity={done ? 1 : 0} className="ld-fade" stroke="var(--cornflower)" strokeWidth="0.8" fill="none">
            <line x1="62" y1="88" x2="62" y2="190" />
            <path d="M57 96 L62 88 L67 96 M57 182 L62 190 L67 182" />
            <path d="M148 92 l7 -3 M176 168 l7 0 M108 212 l0 7" />
          </g>
          <g opacity={done ? 1 : 0} className="ld-fade" fill="var(--cloud)" style={{ fontSize: 7, letterSpacing: "0.14em" }}>
            <text x="78" y="128">BODICE FRONT</text>
            <text x="78" y="140" fill="var(--periwinkle)">CUT 1 ON FOLD</text>
          </g>
          {/* the pencil */}
          {!done && <circle cx={head.x} cy={head.y} r="2.2" fill="var(--cloud)" style={{ filter: "drop-shadow(0 0 6px var(--cornflower))" }} />}
        </svg>

        {/* data columns */}
        <div className="ld-mono absolute left-5 top-[76px] text-[var(--periwinkle)] md:left-10 md:top-1/2 md:-translate-y-1/2">
          <p className="mb-2 text-[var(--steel)]">Measurements · cm</p>
          {LEFT.map(([t, at]) => (
            <p key={t} className="h-[1.7em]">
              <Decode text={t} on={shown >= at} />
            </p>
          ))}
        </div>
        <div className="ld-mono absolute right-5 top-[76px] text-right text-[var(--periwinkle)] md:right-10 md:top-1/2 md:-translate-y-1/2">
          <p className="mb-2 text-[var(--steel)]">Draft</p>
          {RIGHT.map(([t, at]) => (
            <p key={t} className="h-[1.7em]">
              <Decode text={t} on={shown >= at} />
            </p>
          ))}
        </div>

        {/* footer readout */}
        <div className="ld-mono absolute inset-x-5 bottom-[max(88px,12svh)] flex items-end justify-between md:inset-x-10">
          <span className="text-[var(--periwinkle)]">{done ? "Pattern ready" : "Drafting your pattern"}</span>
          <span className="lab-display text-[clamp(2rem,5vw,3.4rem)] leading-none tracking-normal text-[var(--cloud)] normal-case">
            {pad3(shown * 100)}
          </span>
        </div>
      </div>
    </div>
  );
}
