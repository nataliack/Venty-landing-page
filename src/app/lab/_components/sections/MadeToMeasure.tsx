"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap } from "gsap";
import { PrimaryButton } from "@/components/PrimaryButton";
import { APP_URL, CTA_LABEL } from "@/lib/site";
import { textIn } from "@/lib/motion";
import { Composer } from "./mtm/Composer";
import { BODIES, type Body, type Fit } from "./mtm/data";
import { Icon, I } from "./mtm/icons";
import { PUFFER_PROMPT, PUFFER_REFS, RIG, RIG_PIECES, bust, easeOf } from "./mtm/puffer";
import "./sections.css";
import "./rig.css";

/* 2. Made to measure: the rig (Jose's frame, 1440 x 1011).

   The puffer hangs on its cables above the composer. The composer's top
   edge cuts the jacket where only the right sleeve keeps going, and that
   sleeve is drawn again above the card (the same image, clipped), so it
   alone falls over the field. Pattern pieces float round the rig, on top
   of everything.

   Everything is placed in jacket widths (--jw) from the composer's top
   centre, so the composition holds at any size.

   Entrance, once in view: the headline rises from its masks, the cables
   shoot out from the jacket to the edges as it drops in and settles, the
   composer rises, its references drop in and the prompt types, the pieces
   drift in from the edges. Then it breathes: a slow sway on the rig, each
   piece bobbing at its own pace, a little depth with the pointer.

   Draft pattern drafts: a scan of light runs down the jacket, the cables
   pull taut, and every floating piece squares up and takes its measure
   from the chosen body and fit (change either and the numbers follow).
   The Draft button becomes the CTA. */

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

  // the entrance starts when the section is properly in view
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setPlay(true);
        io.disconnect();
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // the headline rises from its masks (the hero's text reveal)
  useEffect(() => {
    if (!play || !head.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      textIn(tl, head.current!.querySelectorAll("[data-rise]"), 0);
    }, head);
    return () => ctx.revert();
  }, [play]);

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
    <div data-lenis-prevent className="absolute inset-0 overflow-y-auto overflow-x-hidden">
      <section
        ref={root}
        className={`mtm mtm2 ${play ? "is-in" : ""} ${drafted ? "is-drafted" : ""}`}
        aria-labelledby="mtm-title"
        onPointerMove={onMove}
      >
        <div className="mtm-dots" aria-hidden="true" />

        <div ref={head} className="mtm-head mtm2-head">
          <p className="mtm-eyebrow">
            <span className="line-mask inline-block">
              <span data-rise className="inline-block">
                Made to measure
              </span>
            </span>
          </p>
          <h2 id="mtm-title" className="mtm-title mtm2-title">
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
        <div className="mtm2-anchor">
          {/* the rig: behind everything */}
          <div className="mtm2-rig" style={rigStyle} aria-hidden="true">
            <div className="mtm2-sway">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={RIG.src} srcSet={RIG.srcSet} sizes="(max-width: 639px) 284vw, 137vw" alt="" draggable={false} fetchPriority="high" />
              {/* the drafting scan, kept to the jacket's own silhouette */}
              {scan > 0 && <span key={scan} className="mtm2-scan" style={{ WebkitMaskImage: `url(${RIG.src})`, maskImage: `url(${RIG.src})` }} />}
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
                  <span className="mtm-small mtm2-spec">{RIG_PIECES.length} pieces · A4, 16 pages</span>
                  <button type="button" className="mtm-icon" onClick={() => setDrafted(false)} aria-label="Edit and draft again" title="Edit">
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
          <div className="mtm2-rig mtm2-rig--over" style={rigStyle} aria-hidden="true">
            <div className="mtm2-sway">
              <div className="mtm2-sleeve">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={RIG.src} srcSet={RIG.srcSet} sizes="(max-width: 639px) 284vw, 137vw" alt="" draggable={false} style={{ clipPath: sleeveClip }} />
              </div>
            </div>
          </div>

          {/* the pattern pieces, floating on top of everything */}
          {RIG_PIECES.map((p, i) => (
            <div
              key={p.key}
              className={`mtm2-pc ${p.phone ? "" : "is-wide-only"}`}
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
              <div className="mtm2-pc__bob" style={{ animationDuration: `${6 + (i % 4) * 1.3}s`, animationDelay: `${-i * 0.9}s` }}>
                <svg viewBox="-6 -6 112 112" className="mtm2-pc__svg">
                  <defs>
                    <clipPath id={`mtm2-c-${p.key}`}>
                      <path d={p.d} />
                    </clipPath>
                  </defs>
                  <path d={p.d} className="mtm2-pc__allow" transform="translate(50 50) scale(1.08) translate(-50 -50)" />
                  <path d={p.d} className="mtm2-pc__paper" />
                  {p.quilt && (
                    <g clipPath={`url(#mtm2-c-${p.key})`} className="mtm2-pc__quilt">
                      {[28, 44, 60, 76].map((y) => (
                        <line key={y} x1="0" x2="100" y1={y} y2={y + 3} />
                      ))}
                    </g>
                  )}
                  <path d={p.d} className="mtm2-pc__line" pathLength={1} />
                  <path d="M50 30 L50 74 M46 35 L50 30 L54 35 M46 69 L50 74 L54 69" className="mtm2-pc__grain" />
                </svg>
                <p className="mtm2-pc__name">{p.name}</p>
                <p className="mtm2-pc__len">{p.len(b, ease)}</p>
              </div>
            </div>
          ))}
        </div>

        <ul className="mtm-cues mtm2-cues" aria-label="How it adds up">
          <li>
            <Icon d={I.image} />
            Photo, sketch or words
          </li>
          <li aria-hidden="true" className="mtm-cues__plus">
            +
          </li>
          <li>
            <Icon d={I.tape} />
            Your measurements
          </li>
          <li aria-hidden="true" className="mtm-cues__plus">
            =
          </li>
          <li>
            <Icon d={I.print} />
            A pattern to print
          </li>
        </ul>
      </section>
    </div>
  );
}
