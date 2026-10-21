"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { BACKDROPS, BODIES, OUTFITS, cutout } from "./figures";
import LightRays from "./LightRays";
import { SwapImage, type Pair } from "./Swap";
import "./wy.css";

/* 5. What you can make: "Same idea. A different body every time." (Jose's
   concept, copy option 1.) Four women, four different bodies, all in the
   same outfit, each cut to her. Change the outfit and all four are dressed
   again at once, through a cover of small diamonds (Swap.tsx, after the
   loading screen's squares).

   The line-up is full bleed: four across on desktop, three on a tablet,
   two on a phone (the rest a swipe away). Each column is two images, a
   background (the room, the light) and a cutout of her in the outfit
   (transparent, on the same canvas); the title runs across all of them
   between the two, high, round their heads, so they stand in front of it.
   Her name and height sit on the image under her feet.

   Under the line-up: the outfit bar (one pill sliding between the chips,
   the icon it lands on hopping; while it plays by itself a fill runs along
   the pill's foot), arrows, keys, then one short line. It plays by itself
   while on screen until you choose one.

   The light: rays from above on each girl (React Bits' LightRays, in the
   cloud of the palette), a pool at her feet and a highlight on her alone,
   masked by her own cutout, drifting slowly. As she changes, a wave of light
   runs down her rays.

   PLACEHOLDERS (figures.ts): the backgrounds are gradients and the cutouts
   are figures drawn from each body's measures; Jose's images replace them. */

const PLAY_MS = 5200;
// each light sways at its own pace, so the four never move together
const SWAY = [
  { "--sway": "8.5s", "--sway-at": "-1.2s" },
  { "--sway": "10s", "--sway-at": "-4.6s" },
  { "--sway": "9.2s", "--sway-at": "-2.8s" },
  { "--sway": "11s", "--sway-at": "-6.4s" },
];

export function SameOutfit() {
  const root = useRef<HTMLElement>(null);
  const [at, setAt] = useState(0);
  const [auto, setAuto] = useState(true);
  const [seen, setSeen] = useState(false);
  const [n, setN] = useState(0);
  // the lab's test: the swap's two colours
  const [pair, setPair] = useState<Pair>("night");
  const atRef = useRef(0);

  const go = useCallback((i: number, byHand = true) => {
    const next = ((i % OUTFITS.length) + OUTFITS.length) % OUTFITS.length;
    if (byHand) setAuto(false);
    if (atRef.current === next) return;
    atRef.current = next;
    setAt(next);
    setN((x) => x + 1);
  }, []);

  // it plays by itself while on screen, until you choose
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!auto || !seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => go(atRef.current + 1, false), PLAY_MS);
    return () => window.clearTimeout(t);
  }, [auto, seen, at, go]);

  // the pill: measured off the chip it's on; it stretches the way it's going
  const chips = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ l: number; r: number; fwd: boolean } | null>(null);
  const was = useRef(0);
  useLayoutEffect(() => {
    const box = chips.current;
    const el = box?.querySelectorAll<HTMLElement>(".wy-chip")[at];
    if (!box || !el) return;
    const place = () => setPill({ l: el.offsetLeft, r: el.offsetLeft + el.offsetWidth, fwd: at >= was.current });
    place();
    was.current = at;
    box.scrollTo({ left: el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2, behavior: "smooth" });
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [at]);

  // the cutouts are made in the browser (blob URLs), so they wait for it
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
  }, []);

  const o = OUTFITS[at];
  return (
    <div data-lenis-prevent className="absolute inset-0 overflow-y-auto overflow-x-hidden">
      <section
        ref={root}
        className="wy"
        aria-labelledby="wy-title"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(at + 1);
          if (e.key === "ArrowLeft") go(at - 1);
        }}
      >
        <p className="wy-eyebrow">What you can make</p>

        {/* the line-up: full bleed; a swipe on smaller screens */}
        <div className="wy-track">
          <div className="wy-strip">
            <div className="wy-bgs" aria-hidden="true">
              {BODIES.map((b, i) => (
                <div key={b.id} className="wy-bg" style={{ background: BACKDROPS[i], ...SWAY[i] } as CSSProperties}>
                  {/* the light from above (React Bits' LightRays, in Venty's cloud): as
                      she changes, a wave of light runs down it */}
                  <LightRays
                    className="wy-rays"
                    raysOrigin="top-center"
                    raysColor="#dfe6ff"
                    raysSpeed={0.7}
                    lightSpread={0.42}
                    rayLength={1.7}
                    rayDensity={1.1}
                    glow={0.5}
                    haze={0.35}
                    atmosphere={0.55}
                    intensity={0.95}
                    fadeDistance={1.1}
                    followMouse={false}
                    cursorShadow={false}
                    clickPulse={false}
                    maxDevicePixelRatio={1.5}
                    pulse={n}
                  />
                  <span className="wy-pool" />
                </div>
              ))}
            </div>
            <h2 id="wy-title" className="wy-title">
              <span>Same idea.</span> <span>A different body every time.</span>
            </h2>
            <ol className="wy-girls">
              {BODIES.map((b, i) => (
                <li key={b.id} className="wy-cell" style={SWAY[i] as CSSProperties}>
                  {ready && <SwapImage src={cutout(b, o.k)} alt={`${b.name} in the ${o.name.toLowerCase()}`} pair={pair} />}
                  <p className="wy-label">
                    {b.name} <span>{b.h} cm</span>
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* the outfit bar */}
        <div className="wy-bar">
          <button type="button" className="wy-arrow" onClick={() => go(at - 1)} aria-label="Previous outfit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <div ref={chips} className="wy-chips" role="tablist" aria-label="Outfit">
            {pill && (
              <span className={`wy-pill ${pill.fwd ? "is-fwd" : "is-back"}`} style={{ "--wy-l": `${pill.l}px`, "--wy-r": `${pill.r}px` } as CSSProperties} aria-hidden="true">
                {auto && seen && <span key={`${at}-${n}`} className="wy-pill__fill" style={{ "--play": `${PLAY_MS}ms` } as CSSProperties} />}
              </span>
            )}
            {OUTFITS.map((x, i) => (
              <button key={x.k} type="button" role="tab" aria-selected={i === at} className={`wy-chip ${i === at ? "is-on" : ""}`} onClick={() => go(i)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
                  <path d={x.icon} />
                </svg>
                <span className="wy-chip__name">
                  <span className="is-full">{x.name}</span>
                  <span className="is-short">{x.short}</span>
                </span>
              </button>
            ))}
          </div>
          <button type="button" className="wy-arrow" onClick={() => go(at + 1)} aria-label="Next outfit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <p className="wy-lede">Start from our patterns or anything you&apos;ve saved. Every one is drafted to the body you measured.</p>
        <p className="sr-only" aria-live="polite">
          {o.name}
        </p>

        {/* the lab's test panel: not part of the section */}
        <div className="wy-test" aria-label="Test the swap">
          <span>Swap colours</span>
          {(
            [
              ["night", "Night only"],
              ["night-corn", "Night, cornflower"],
              ["night-cloud", "Night, cloud"],
            ] as const
          ).map(([k, label]) => (
            <button key={k} type="button" aria-pressed={pair === k} onClick={() => setPair(k)}>
              {label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
