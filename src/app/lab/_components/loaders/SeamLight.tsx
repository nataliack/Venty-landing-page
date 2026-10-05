"use client";

import { useState, type CSSProperties } from "react";
import { Wordmark } from "@/components/Logo";
import { Crown, Decode, SrProgress, easeInOutQuart, easeOutExpo, pad3, tween, useExit, useShown, type LoaderProps } from "./shared";

/* Seam, light and horizontal. A pattern sheet on Crown: the running
   stitch sews left to right along the middle while the rest of the
   pattern draws in around it (cut lines either side at the seam
   allowance, fold lines, outer edges), and marks land as the needle
   passes: balance ticks, notches, grainlines, registration marks, labels.
   The pattern's details decode in the corners. At 100 the thread pulls
   tight, then the sheet splits along the seam, top half up, bottom half
   down, and the page is underneath.

   The scene is drawn twice, once per half, each half clipped to its side
   of the seam, so the split opens exactly on the stitch. */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const TL: [string, number][] = [
  ["Venty · Pattern Nº 0001", 0.02],
  ["Bodice · side seam", 0.1],
  ["Size · yours", 0.18],
  ["Scale 1:1", 0.26],
];
const TR: [string, number][] = [
  ["Seam allowance 1.5 cm", 0.06],
  ["Stitch length 2.5 mm", 0.14],
  ["Thread · cotton 50", 0.22],
  ["Needle 80/12", 0.3],
];
const BL: [string, number][] = [
  ["Bust 92.0", 0.3],
  ["Waist 74.0", 0.42],
  ["Hip 98.0", 0.54],
  ["Shoulder 39.0", 0.66],
  ["Back 42.0", 0.78],
];
// marks along the seam: x is the share of the width, side -1 above, 1 below
const MARKS = [
  { x: 0.14, t: "Cut line", side: -1, notch: 0, phone: true },
  { x: 0.3, t: "Notch A", side: 1, notch: 1, phone: true },
  { x: 0.47, t: "Stitch 1.5 cm", side: -1, notch: 0, phone: false },
  { x: 0.64, t: "Notch B", side: 1, notch: 2, phone: true },
  { x: 0.82, t: "Side seam", side: -1, notch: 0, phone: false },
];
const REGS = [
  { x: 5, y: 28, at: 0.05, ink: true },
  { x: 95, y: 28, at: 0.3, ink: true },
  { x: 95, y: 72, at: 0.7, ink: false },
];

function Lines({ p, pull }: { p: number; pull: number }) {
  const q = (v: number) => ({ "--q": clamp01(v) }) as CSSProperties;
  const on = (v: boolean) => (v && pull < 0.5 ? "is-on" : "");
  return (
    <div className="sl-field">
      {/* outer edges of the piece */}
      <div className="sl-line sl-outer--ink" style={{ ...q((p - 0.18) / 0.82), top: "28%" }} />
      <div className="sl-line sl-outer--cloud" style={{ ...q((p - 0.18) / 0.82), top: "72%" }} />
      {/* fold lines, dash-dot */}
      <div className="sl-line sl-fold" style={{ ...q((p - 0.08) / 0.92), top: "36%" }} />
      <div className="sl-line sl-fold" style={{ ...q((p - 0.08) / 0.92), top: "64%" }} />
      {/* cut lines run a little ahead of the needle */}
      <div className="sl-line sl-cut" style={{ ...q(p * 1.12), top: "calc(50% - var(--sa))" }} />
      <div className="sl-line sl-cut" style={{ ...q(p * 1.12), top: "calc(50% + var(--sa))" }} />
      {/* a fine ruler along the outer edges */}
      <div className="sl-line sl-hair text-[var(--ink)]" style={{ ...q((p - 0.25) / 0.75), top: "calc(28% + 4px)" }} />
      <div className="sl-line sl-hair text-[var(--cloud)]" style={{ ...q((p - 0.25) / 0.75), top: "calc(72% - 10px)" }} />
      {/* the stitch; pulling closes the gaps into one line */}
      <div
        className="sl-line sl-stitch"
        style={{ ...q(p), "--on": `${14 + pull * 8}px`, "--glow": `${pull * 10}px` } as CSSProperties}
      />

      {/* balance ticks, notches and labels where the needle has passed */}
      {MARKS.map((m) => {
        const passed = p >= m.x;
        const left = `${m.x * 100}%`;
        return (
          <div key={m.t} className={m.phone ? "" : "hidden sm:block"}>
            <span className={`sl-mark sl-tick ${on(passed)}`} style={{ left }} />
            {m.notch > 0 &&
              Array.from({ length: m.notch }, (_, k) => (
                <span key={k} className="contents">
                  <span className={`sl-mark sl-notch sl-notch--top ${on(passed)}`} style={{ left: `calc(${left} + ${(k - (m.notch - 1) / 2) * 12}px)` }} />
                  <span className={`sl-mark sl-notch sl-notch--bot ${on(passed)}`} style={{ left: `calc(${left} + ${(k - (m.notch - 1) / 2) * 12}px)` }} />
                </span>
              ))}
            <span
              className={`sl-mark sl-label ld-mono ${on(passed)}`}
              style={{ left, top: m.side < 0 ? "calc(50% - var(--sa) - 34px)" : "calc(50% + var(--sa) + 30px)" }}
            >
              {m.t}
            </span>
          </div>
        );
      })}

      {/* fold labels */}
      <span className={`sl-mark sl-label ld-mono ${on(p > 0.2)}`} style={{ left: "20%", top: "calc(36% - 30px)" }}>
        Place on fold
      </span>
      <span className={`sl-mark sl-label ld-mono hidden sm:block ${on(p > 0.85)}`} style={{ left: "80%", top: "calc(64% + 10px)" }}>
        Fold
      </span>

      {/* grainlines, between the folds and the cut lines, clear of the labels */}
      <span className={`sl-mark sl-grain ${on(p > 0.6)}`} style={{ left: "55%", width: "18%", top: "43%" }} />
      <span className={`sl-mark sl-grain ${on(p > 0.45)}`} style={{ left: "39%", width: "18%", top: "57%" }} />
    </div>
  );
}

function Scene({ p, pull }: { p: number; pull: number }) {
  const fade = 1 - pull;
  const sewn = (p * 100).toFixed(1);
  return (
    <div className="sl absolute inset-0">
      <Crown />
      <Lines p={p} pull={pull} />

      {/* registration marks sit outside the edge fade */}
      {REGS.map((r) => (
        <span
          key={`${r.x}-${r.y}`}
          className={`sl-mark sl-reg ${p >= r.at ? "is-on" : ""}`}
          style={{ left: `${r.x}%`, top: `${r.y}%`, color: r.ink ? "color-mix(in oklab, var(--ink) 45%, transparent)" : "color-mix(in oklab, var(--cloud) 45%, transparent)" }}
        />
      ))}

      {/* the needle, fading in and out at the edges */}
      <span className="sl-needle" style={{ left: `${p * 100}%`, opacity: Math.min(1, p / 0.05, (1 - p) / 0.05) * fade }} />
      <span
        className="sl-label ld-mono absolute"
        style={{ left: `${p * 100}%`, top: "calc(50% + var(--sa) + 6px)", opacity: Math.min(1, p / 0.05, (1 - p) / 0.06) * fade }}
      >
        {pad3(p * 100)}
      </span>

      {/* title, top centre of the piece */}
      <div className="ld-ink absolute left-1/2 top-[23%] flex sm:top-[19%] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 text-center" style={{ opacity: 0.4 + 0.6 * fade }}>
        <Wordmark className="h-[clamp(22px,3vw,34px)] w-auto" />
        <span className="ld-mono">{p >= 1 ? "Sewn to measure" : "Sewing your pattern"}</span>
      </div>

      {/* corners */}
      <div className="ld-mono ld-ink absolute left-5 top-[max(72px,9svh)] md:left-10" style={{ opacity: fade }}>
        {TL.map(([t, at]) => (
          <p key={t} className="h-[1.7em]">
            <Decode text={t} on={p >= at} />
          </p>
        ))}
      </div>
      <div className="ld-mono ld-ink absolute right-5 top-[max(72px,9svh)] hidden text-right sm:block md:right-10" style={{ opacity: fade }}>
        {TR.map(([t, at]) => (
          <p key={t} className="h-[1.7em]">
            <Decode text={t} on={p >= at} />
          </p>
        ))}
      </div>
      <div className="ld-mono absolute bottom-[max(88px,12svh)] left-5 text-[var(--mist)] md:left-10" style={{ opacity: fade }}>
        <p className="mb-1 text-[var(--periwinkle)]">Measurements · cm</p>
        {BL.map(([t, at]) => (
          <p key={t} className="h-[1.7em]">
            <Decode text={t} on={p >= at} />
          </p>
        ))}
      </div>
      <div className="ld-mono absolute bottom-[max(88px,12svh)] right-5 text-right text-[var(--mist)] md:right-10" style={{ opacity: fade }}>
        <span className="lab-display block text-[clamp(2.2rem,5vw,3.4rem)] leading-none tracking-normal text-[var(--cloud)] normal-case">{pad3(p * 100)}</span>
        <span>Sewn {sewn} / 100 cm</span>
      </div>
    </div>
  );
}

export function SeamLight({ progress, onExit, onDone }: LoaderProps) {
  const shown = useShown(progress, 1.6);
  const [pull, setPull] = useState(0);
  const [split, setSplit] = useState(0);

  useExit(shown >= 1, 250, { onExit, onDone }, (end) => {
    let stop2: (() => void) | undefined;
    const stop1 = tween(450, easeOutExpo, setPull, () => {
      stop2 = tween(1200, easeInOutQuart, setSplit, end);
    });
    return () => {
      stop1();
      stop2?.();
    };
  });

  const p = Math.min(1, shown);
  const edge = split > 0 ? "0 0 60px rgb(11 12 21 / 0.35)" : undefined;

  return (
    <div className="ld">
      <SrProgress value={shown} />
      <div className="sl-half top-0" style={{ transform: `translateY(${-split * 101}%)`, boxShadow: edge }}>
        <div className="sl-half__inner top-0">
          <Scene p={p} pull={pull} />
        </div>
      </div>
      <div className="sl-half bottom-0" style={{ transform: `translateY(${split * 101}%)`, boxShadow: edge }}>
        <div className="sl-half__inner top-[-100%]">
          <Scene p={p} pull={pull} />
        </div>
      </div>
    </div>
  );
}
