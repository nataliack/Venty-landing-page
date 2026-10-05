"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { PrimaryButton } from "@/components/PrimaryButton";
import { APP_URL, CTA_LABEL } from "@/lib/site";
import { textIn } from "@/lib/motion";
import "./hiw.css";

/* 3. How it works, light. A study for the section after Made to measure,
   in the same light world: cloud page, ink type, glass cards.

   The head says what it is, plainly. Below it, three cards side by side
   (stacked on phones), joined by a stitched thread that draws in. Each card
   has its step, a short title, one line of copy, and a small working piece
   of the app:
   01 Measure   a tape you can drag (or move with the arrow keys)
   02 Describe  a photo and a sketch (placeholders), a prompt that types,
                fit and fabric
   03 Print     the pattern tiled across A4 pages, or one A0 sheet

   Own styles in hiw.css, own icons below: nothing shared with the Made to
   measure files, so the two studies can change independently. */

const STEPS = [
  {
    n: "01",
    k: "Measure",
    h: "Four measures to start.",
    p: "Add more when you want a closer fit. Every measure shows where the tape goes, and your body is saved for every pattern after.",
  },
  {
    n: "02",
    k: "Describe",
    h: "Show it. Say it.",
    p: "Upload the photo, or describe it in a sentence. Choose how close it should sit and the fabric you have in mind.",
  },
  {
    n: "03",
    k: "Print",
    h: "Print it at home.",
    p: "Print on A4 at home, or A0 at a print shop. Grainlines, notches and labels on every piece, with a page map to tape the A4 pages together.",
  },
];

const PROMPT = "A slip dress, bias cut, midi length, in silk.";
const FITS = ["Close", "Easy", "Loose"] as const;
type Fit = (typeof FITS)[number];

// the skirt front, drawn over the pages in a 400 x 566 box (4 x 4 A4)
const SKIRT = "M150 40 Q200 50 250 40 L340 520 Q200 545 60 520 Z";

const ICON = {
  image: "M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5zM4 15l4.5-4.5L13 15l2.5-2.5L20 17M15.5 8.5h.01",
  brush: "M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z",
  tape: "M3 9h18v6H3zM7 9v3M11 9v2M15 9v3M19 9v2",
  print: "M7 9V4h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v6H7z",
};

function Icon({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/* ---- 01: the tape ---------------------------------------------------- */
function Tape() {
  const [cm, setCm] = useState(92);
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const drag = useRef<{ x: number; v: number } | null>(null);
  const clamp = (v: number) => Math.min(140, Math.max(60, v));

  const shown = unit === "cm" ? cm.toFixed(1) : (cm / 2.54).toFixed(1);

  return (
    <div className="hiw-vis hiw-tape">
      <div className="hiw-vis__row">
        <div>
          <p className="hiw-vis__name">Bust</p>
          <p className="hiw-vis__note">Fullest point, tape level</p>
        </div>
        <div className="hiw-seg" role="group" aria-label="Units">
          {(["cm", "in"] as const).map((u) => (
            <button key={u} type="button" aria-pressed={unit === u} onClick={() => setUnit(u)}>
              {u}
            </button>
          ))}
        </div>
      </div>
      <p className="hiw-tape__read">
        <span className="tabular-nums">{shown}</span>
        <span className="hiw-tape__unit">{unit}</span>
      </p>
      <div
        className="hiw-tape__track"
        role="slider"
        tabIndex={0}
        aria-label="Bust measurement"
        aria-valuemin={60}
        aria-valuemax={140}
        aria-valuenow={cm}
        aria-valuetext={`${shown} ${unit}`}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, v: cm };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          setCm(Math.round(clamp(drag.current.v - (e.clientX - drag.current.x) * 0.1) * 10) / 10);
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setCm((v) => clamp(v + 0.5));
          if (e.key === "ArrowLeft") setCm((v) => clamp(v - 0.5));
        }}
      >
        <div className="hiw-tape__ticks" style={{ transform: `translateX(${-(cm - 60) * 10}px)` }}>
          {Array.from({ length: 81 }).map((_, i) => {
            const v = 60 + i;
            const big = v % 5 === 0;
            return (
              <span key={v} className={`hiw-tick ${big ? "is-big" : ""}`} style={{ left: i * 10 }}>
                {big && <span className="hiw-tick__n">{v}</span>}
              </span>
            );
          })}
        </div>
        <span className="hiw-tape__needle" aria-hidden="true" />
        <span className="hiw-tape__hint" aria-hidden="true">
          Drag
        </span>
      </div>
    </div>
  );
}

/* ---- 02: describe ---------------------------------------------------- */
function Describe({ play }: { play: boolean }) {
  const [typed, setTyped] = useState(0);
  const [fit, setFit] = useState<Fit | null>(null);
  const touched = useRef(false);

  useEffect(() => {
    if (!play) return;
    // with reduced motion the whole prompt arrives on the first tick
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let i = 0;
    const t = window.setInterval(() => {
      i = reduce ? PROMPT.length : i + 1;
      setTyped(i);
      if (i >= PROMPT.length) {
        window.clearInterval(t);
        window.setTimeout(() => !touched.current && setFit("Easy"), reduce ? 0 : 450);
      }
    }, reduce ? 0 : 42);
    return () => window.clearInterval(t);
  }, [play]);

  return (
    <div className="hiw-vis hiw-desc">
      <div className="hiw-desc__refs">
        {/* placeholders until the real reference images are chosen */}
        <span className="hiw-ph">
          <Icon d={ICON.image} size={18} />
          <span>Photo</span>
        </span>
        <span className="hiw-ph">
          <Icon d={ICON.brush} size={18} />
          <span>Sketch</span>
        </span>
      </div>
      <p className="hiw-desc__prompt" aria-label={PROMPT}>
        <span aria-hidden="true">{PROMPT.slice(0, typed)}</span>
        <span className={`hiw-caret ${typed >= PROMPT.length ? "is-done" : ""}`} aria-hidden="true" />
      </p>
      <div className="hiw-vis__row hiw-desc__tools">
        <div className="hiw-seg" role="group" aria-label="Fit">
          {FITS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={fit === f}
              onClick={() => {
                touched.current = true;
                setFit(f);
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <p className="hiw-desc__fabric">
          <span>Fabric</span> Silk crepe de chine
        </p>
      </div>
    </div>
  );
}

/* ---- 03: print ------------------------------------------------------- */
function Print() {
  const [paper, setPaper] = useState<"A4" | "A0">("A4");
  const a4 = paper === "A4";

  return (
    <div className="hiw-vis hiw-print">
      <div className="hiw-vis__row">
        <div>
          <p className="hiw-vis__name">Skirt front</p>
          <p className="hiw-vis__note">Cut 1 on the bias · 1:1</p>
        </div>
        <div className="hiw-seg" role="group" aria-label="Paper">
          {(["A4", "A0"] as const).map((p) => (
            <button key={p} type="button" aria-pressed={paper === p} onClick={() => setPaper(p)}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <div key={paper} className={`hiw-sheet ${a4 ? "is-a4" : "is-a0"}`}>
        {a4 ? (
          Array.from({ length: 16 }).map((_, k) => (
            <span key={k} className="hiw-page" style={{ "--k": k } as React.CSSProperties}>
              {String.fromCharCode(65 + Math.floor(k / 4))}
              {(k % 4) + 1}
            </span>
          ))
        ) : (
          <span className="hiw-page is-one">A0</span>
        )}
        <svg viewBox="0 0 400 566" preserveAspectRatio="none" className="hiw-sheet__piece" aria-hidden="true">
          <path d={SKIRT} className="hiw-sheet__cut" pathLength={1} />
          <path d={SKIRT} className="hiw-sheet__stitch" transform="translate(200 300) scale(0.92) translate(-200 -300)" />
          <path d="M200 160 V420 M193 172 L200 160 L207 172 M193 408 L200 420 L207 408" className="hiw-sheet__grain" />
        </svg>
      </div>
      <p className="hiw-vis__note hiw-print__foot">{a4 ? "16 A4 pages · page map included" : "1 A0 sheet · for a print shop"}</p>
    </div>
  );
}

export function HowItWorksLight() {
  const root = useRef<HTMLElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setPlay(true);
        io.disconnect();
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!play || !head.current) return;
    const ctx = gsap.context(() => {
      textIn(gsap.timeline(), head.current!.querySelectorAll("[data-rise]"), 0);
    }, head);
    return () => ctx.revert();
  }, [play]);

  return (
    <div data-lenis-prevent className="absolute inset-0 overflow-y-auto overflow-x-hidden">
      <section ref={root} className={`hiw ${play ? "is-in" : ""}`} aria-labelledby="hiw-title">
        <div className="hiw-dots" aria-hidden="true" />

        <div ref={head} className="hiw-head">
          <p className="hiw-eyebrow">
            <span className="line-mask inline-block">
              <span data-rise className="inline-block">
                Three steps
              </span>
            </span>
          </p>
          <h2 id="hiw-title" className="hiw-title">
            <span className="line-mask">
              <span data-rise className="block">
                How it works
              </span>
            </span>
          </h2>
          <p className="hiw-sub">
            <span className="line-mask">
              <span data-rise className="block">
                From your body to the cutting table.
              </span>
            </span>
          </p>
        </div>

        {/* the thread that joins the three steps, with a marker on each */}
        <div className="hiw-thread" aria-hidden="true">
          <span className="hiw-thread__line" />
          {STEPS.map((s) => (
            <span key={s.n} className="hiw-thread__dot" />
          ))}
        </div>

        <ol className="hiw-steps">
          {STEPS.map((s, i) => {
            return (
              <li key={s.n} className="hiw-card" style={{ "--i": i } as React.CSSProperties}>
                <div className="hiw-card__top">
                  <span className="hiw-card__n">{s.n}</span>
                  <span className="hiw-card__k">
                    <Icon d={[ICON.tape, ICON.image, ICON.print][i]} size={14} />
                    {s.k}
                  </span>
                </div>
                <h3 className="hiw-card__h">{s.h}</h3>
                <p className="hiw-card__p">{s.p}</p>
                {i === 0 ? <Tape /> : i === 1 ? <Describe play={play} /> : <Print />}
              </li>
            );
          })}
        </ol>

        <div className="hiw-cta">
          <PrimaryButton href={APP_URL}>{CTA_LABEL}</PrimaryButton>
        </div>
      </section>
    </div>
  );
}
