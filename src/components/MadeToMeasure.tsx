"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { APP_URL, CTA_LABEL } from "@/lib/site";
import { textIn } from "@/lib/motion";
import { DitherEdge } from "./DitherEdge";
import { PrimaryButton } from "./PrimaryButton";
import { Composer } from "./measure/Composer";
import { BODIES, type Body, type Fit } from "./measure/data";
import { Icon, I } from "./measure/icons";
import { PUFFER_PROMPT, PUFFER_REFS, RIG, RIG_PIECES, bust, easeOf } from "./measure/rig";
import "./measure/measure.css";

gsap.registerPlugin(ScrollTrigger);

/* 2. Made to measure: the rig (Jose's frame, 1440 x 1011), ported from the
   lab section (src/app/lab/_components/sections/MadeToMeasure.tsx).

   The hand-off from the hero: the section is pulled up over the hero's last
   screen (.measure, -100svh), so it rises over the still video, its cloud
   colour dithering in above its edge (DitherEdge). Once it has arrived
   (its top at 20% of the screen) the entrance plays, once.

   The puffer hangs on its cables above the composer. The composer's top
   edge cuts the jacket where only the right sleeve keeps going, and that
   sleeve is drawn again above the card (the same image, clipped), so it
   alone falls over the field. Pattern pieces float round the rig, on top
   of everything.

   Everything is placed in jacket widths (--jw) from the composer's top
   centre, so the composition holds at any size.

   Entrance: the headline rises from its masks, the cables shoot out from
   the jacket to the edges as it appears, the composer rises, its
   references drop in and the prompt types, the pieces drift in from the
   edges. Then it breathes: each piece bobbing at its own pace, a little
   depth with the pointer.

   Draft pattern drafts: a scan of light runs down the jacket, and every
   floating piece squares up and takes its measure from the chosen body and
   fit (change either and the numbers follow). The Draft button becomes the
   CTA. */

export function MadeToMeasure() {
  const root = useRef<HTMLElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const draftBtn = useRef<HTMLButtonElement>(null);
  const [play, setPlay] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [drafted, setDrafted] = useState(false);
  const [scan, setScan] = useState(0);
  const [body, setBody] = useState<Body>(BODIES[0]);
  const [fit, setFit] = useState<Fit>("Easy");

  // The entrance waits for the section to arrive, not just to show: it
  // rises over the hero first. The headline waits hidden in its masks (so it
  // never shows before it rises), then rises with the rest (the hero's text
  // reveal).
  useEffect(() => {
    const el = root.current;
    const h = head.current;
    if (!el || !h) return;
    const ctx = gsap.context(() => {
      const rise = gsap.timeline({ paused: true });
      textIn(rise, h.querySelectorAll("[data-rise]"), 0);
      ScrollTrigger.create({
        trigger: el,
        start: "top 20%",
        once: true,
        onEnter: () => {
          setPlay(true);
          rise.play();
        },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  // depth: the pieces drift a few px with the pointer
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--px", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    e.currentTarget.style.setProperty("--py", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  };

  const draft = () => {
    if (drafting || drafted) return;
    setDrafting(true);
    setScan((n) => n + 1);
    window.setTimeout(() => {
      setDrafting(false);
      setDrafted(true);
    }, 1700);
  };

  const b = bust(body);
  const ease = easeOf(fit);
  const scale = (b + ease) / 96; // pieces grow and shrink with the body

  const img = { width: `calc(var(--jw) / ${RIG.jacket.x1 - RIG.jacket.x0})` };
  const rigStyle = {
    ...img,
    left: `calc(50% - var(--jw) * ${RIG.offset} - var(--jw) / ${RIG.jacket.x1 - RIG.jacket.x0} * ${RIG.jacket.x0})`,
    top: `calc(var(--jw) / ${RIG.jacket.x1 - RIG.jacket.x0} * ${RIG.ratio} * -${RIG.cardLine})`,
    "--cx": `${((RIG.jacket.x0 + RIG.jacket.x1) / 2) * 100}%`,
    "--cy": `${((RIG.jacket.y0 + RIG.jacket.y1) / 2) * 100}%`,
  } as CSSProperties;
  const sleeveClip = `inset(${RIG.cardLine * 100}% ${(1 - RIG.sleeve.x1) * 100}% 0 ${RIG.sleeve.x0 * 100}%)`;

  return (
    <section
      ref={root}
      id="measure"
      data-nav="Made to measure"
      data-wing="spread"
      data-theme-zone="light"
      data-theme-at="top 35%"
      className={`measure mm mm2 ${play ? "is-in" : ""} ${drafted ? "is-drafted" : ""}`}
      aria-labelledby="mm-title"
      onPointerMove={onMove}
    >
      {/* the dithered edge it rises with, over the hero */}
      <DitherEdge color="#eff4ff" />
      <div className="mm-dots" aria-hidden="true" />
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          {/* paper grain: fine noise, kept inside each piece */}
          <filter id="mm2-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="4" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.22  0 0 0 0 0.3  0 0 0 0 0.4  0 0 0 0.09 0" result="g" />
            <feComposite in="g" in2="SourceGraphic" operator="in" result="gc" />
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="gc" />
            </feMerge>
          </filter>
          {/* a soft crease of light across the tissue */}
          <linearGradient id="mm2-crease" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
            <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.55" stopColor="#384c65" stopOpacity="0.05" />
            <stop offset="1" stopColor="#384c65" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <div ref={head} className="mm-head mm2-head">
        <p className="mm-eyebrow">
          <span className="line-mask inline-block">
            <span data-rise className="inline-block">
              Made to measure
            </span>
          </span>
        </p>
        <h2 id="mm-title" className="mm-title mm2-title">
          <span className="line-mask">
            <span data-rise className="block">
              Venty turns any idea into a
            </span>
          </span>
          <span className="line-mask">
            <span data-rise className="block">
              pattern drafted for you.
            </span>
          </span>
        </h2>
      </div>

      {/* everything below is placed from the composer's top centre */}
      <div className="mm2-anchor">
        {/* the rig: behind everything */}
        <div className="mm2-rig" style={rigStyle} aria-hidden="true">
          <div className="mm2-sway">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={RIG.src} srcSet={RIG.srcSet} sizes="(max-width: 639px) 284vw, 137vw" alt="" draggable={false} decoding="async" />
            {/* the drafting scan, kept to the jacket's own silhouette */}
            {scan > 0 && <span key={scan} className="mm2-scan" style={{ WebkitMaskImage: `url(${RIG.src})`, maskImage: `url(${RIG.src})` }} />}
          </div>
        </div>

        <Composer
          ref={draftBtn}
          refs={PUFFER_REFS}
          prompt={PUFFER_PROMPT}
          autoDraft={false}
          play={play}
          drafting={drafting}
          body={body}
          fit={fit}
          onBody={setBody}
          onFit={setFit}
          onDraft={draft}
          done={
            drafted ? (
              <>
                <button type="button" className="mm-icon" onClick={() => setDrafted(false)} aria-label="Edit and draft again" title="Edit">
                  <Icon d={I.replay} size={16} />
                </button>
                <PrimaryButton href={APP_URL} size="sm">
                  {CTA_LABEL}
                </PrimaryButton>
              </>
            ) : undefined
          }
        />

        {/* the sleeve that falls over the card: the same image, clipped below the card line */}
        <div className="mm2-rig mm2-rig--over" style={rigStyle} aria-hidden="true">
          <div className="mm2-sway">
            <div className="mm2-sleeve">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={RIG.src} srcSet={RIG.srcSet} sizes="(max-width: 639px) 284vw, 137vw" alt="" draggable={false} decoding="async" style={{ clipPath: sleeveClip }} />
            </div>
          </div>
        </div>

        {/* the pattern pieces, floating on top of everything */}
        {RIG_PIECES.map((p, i) => (
          <div
            key={p.key}
            className={`mm2-pc ${p.phone ? "" : "is-wide-only"}`}
            style={
              {
                "--x": p.x,
                "--y": p.y,
                "--w": p.w,
                "--r": `${p.r}deg`,
                "--qx": p.phone?.x ?? p.x,
                "--qy": p.phone?.y ?? p.y,
                "--qw": p.phone?.w ?? p.w,
                "--i": i,
                "--s": drafted ? scale : 1,
                "--d": 0.5 + (i % 3) * 0.35,
              } as CSSProperties
            }
            aria-hidden="true"
          >
            <div className="mm2-pc__bob" style={{ animationDuration: `${6 + (i % 4) * 1.3}s`, animationDelay: `${-i * 0.9}s` }}>
              {/* printed tissue: grain, a soft crease light, the cutting line, the
                  stitching line inside it, grainline, quilting, and the name printed on */}
              <svg viewBox="-4 -4 108 108" className="mm2-pc__svg">
                <defs>
                  <clipPath id={`mm2-c-${p.key}`}>
                    <path d={p.d} />
                  </clipPath>
                </defs>
                <path d={p.d} className="mm2-pc__paper" filter="url(#mm2-grain)" />
                <path d={p.d} fill="url(#mm2-crease)" />
                {p.quilt && (
                  <g clipPath={`url(#mm2-c-${p.key})`} className="mm2-pc__quilt">
                    {[30, 46, 62, 78].map((y) => (
                      <line key={y} x1="0" x2="100" y1={y} y2={y + 2} />
                    ))}
                  </g>
                )}
                <path d={p.d} className="mm2-pc__stitch" transform="translate(50 52) scale(0.88) translate(-50 -52)" />
                <path d={p.d} className="mm2-pc__line" pathLength={1} />
                <path d="M50 26 L50 72 M47 30 L50 26 L53 30 M47 68 L50 72 L53 68" className="mm2-pc__grain" />
                <text x="56" y="50" className="mm2-pc__print">
                  {p.name.toUpperCase()}
                </text>
                <text x="56" y="58" className="mm2-pc__print is-sm">
                  {p.note.toUpperCase()}
                </text>
                <text x="56" y="65" className="mm2-pc__print is-sm">
                  VENTY 001
                </text>
              </svg>
              <p className="mm2-pc__len">{p.len(b, ease)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* the idea in three words each: short enough to hold one line on a phone */}
      <ul className="mm-cues mm2-cues" aria-label="How it adds up">
        <li>
          <Icon d={I.image} />
          Any idea
        </li>
        <li aria-hidden="true" className="mm-cues__plus">
          +
        </li>
        <li>
          <Icon d={I.tape} />
          Your body
        </li>
        <li aria-hidden="true" className="mm-cues__plus">
          =
        </li>
        <li>
          <Icon d={I.print} />
          Your pattern
        </li>
      </ul>
    </section>
  );
}
