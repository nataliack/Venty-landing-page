"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { TURN, turnPosition } from "@/lib/turnSequence";
import "./fz.css";

/* Features as scroll pieces: shared parts. Low fidelity on purpose (a
   brainstorm): the page's six features, the real model turn and the real
   reference photo, and quick stand-ins for the rest of the cards' visuals.
   Every concept scrolls inside its own shell (the lab viewer has no page
   scroll) and reads its progress from useScrub. Prefix fz-. */

export type FeatKey = "mark" | "refine" | "body" | "bodies" | "print" | "lib";
export type Feat = { k: FeatKey; n: string; t: string; s: string; w: string };

export const FEATS: Feat[] = [
  { k: "mark", n: "01", w: "Mark up", t: "Mark up your references", s: "Circle what you like, pin a note. Venty reads your marks." },
  { k: "refine", n: "02", w: "Refine", t: "Refine in plain words", s: "Say what to change, the way you'd say it. Venty redrafts the pieces." },
  { k: "body", n: "03", w: "See it", t: "See it on your body", s: "Turn it on your body, then see the flat pieces it is cut from." },
  { k: "bodies", n: "04", w: "Bodies", t: "Body library", s: "Every body you measure, saved and dated. Keep one for anyone you sew for." },
  { k: "print", n: "05", w: "Print", t: "Print options", s: "A4 at home or A0 at a print shop, seam allowance on or off." },
  { k: "lib", n: "06", w: "Library", t: "Pattern library", s: "Every pattern with its versions and notes. Print it again any time." },
];

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
/** 0..1 with a hold at both ends: the move happens in the middle of a step */
export const hold = (f: number, a = 0.18) => {
  const t = clamp((f - a) / (1 - 2 * a));
  return t * t * (3 - 2 * t);
};

/** The concept's own scroller, with the section's heading before it and
    some air after it, so the pinned part scrolls in and out like on the page */
export function Shell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div data-fz-scroll data-lenis-prevent className={`fz absolute inset-0 overflow-y-auto overflow-x-hidden ${className}`}>
      <header className="fz-head">
        <p className="fz-eyebrow">Features</p>
        <h2 className="fz-title">Everything a pattern needs.</h2>
        <p className="fz-scrollcue">Scroll</p>
      </header>
      {children}
      <footer className="fz-end">
        <p className="fz-eyebrow">Next section</p>
      </footer>
    </div>
  );
}

/** Calls fn with how far through `ref` the scroller is (0 when its top
    meets the top of the screen, 1 when its bottom meets the bottom), once a
    frame at most, only while scrolling */
export function useScrub(ref: RefObject<HTMLElement | null>, fn: (p: number) => void) {
  const cb = useRef(fn);
  useEffect(() => {
    cb.current = fn;
  });
  useEffect(() => {
    const el = ref.current;
    const sc = el?.closest<HTMLElement>("[data-fz-scroll]");
    if (!el || !sc) return;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const s = sc.getBoundingClientRect();
      const span = r.height - s.height;
      cb.current(span > 0 ? clamp((s.top - r.top) / span) : 0);
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick();
    sc.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(raf);
      sc.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, [ref]);
}

/* ---- the model's turn, as plain frames ---------------------------------- */
const frameSrc = (i: number) => `/features/turn/frames/${String(i + 1).padStart(4, "0")}.webp`;
/** the front, before any scroll */
export const FIRST_FRAME = frameSrc(0);
let warmed = false;
/** fetch every frame once, so scrubbing never waits */
export function warmTurn() {
  if (warmed || typeof window === "undefined") return;
  warmed = true;
  for (let i = 0; i < TURN.frames; i++) {
    const im = new Image();
    im.src = frameSrc(i);
  }
}
/** an <img> of the turn; set(deg) shows her at that angle */
export function useTurn() {
  const img = useRef<HTMLImageElement>(null);
  const last = useRef(-1);
  useEffect(() => warmTurn(), []);
  const set = (deg: number) => {
    const f = Math.round(turnPosition(deg));
    if (f === last.current || !img.current) return;
    last.current = f;
    img.current.src = frameSrc(f);
  };
  return [img, set] as const;
}

/* ---- quick stand-ins for each card's visual ------------------------------ */
export function Visual({ k, turnRef, className = "" }: { k: FeatKey; turnRef?: RefObject<HTMLImageElement | null>; className?: string }) {
  return <div className={`fz-v fz-v--${k} ${className}`}>{VIS[k](turnRef)}</div>;
}

const VIS: Record<FeatKey, (r?: RefObject<HTMLImageElement | null>) => ReactNode> = {
  mark: () => (
    <div className="fz-mark">
      <div className="fz-mark__fig">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/features/ref-jersey.webp" alt="" draggable={false} />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path className="fz-ink" d="M36 29 C38 24 62 24 64 29 C66 36 57 40 50 40 C42 40 34 36 37 28.5" />
          <path className="fz-ink is-dash" d="M8 66 L92 66" />
        </svg>
        <span className="fz-pin" style={{ left: "62%", top: "22%" }}>
          Neckline
        </span>
        <span className="fz-pin" style={{ left: "52%", top: "69%" }}>
          Longer than this
        </span>
      </div>
    </div>
  ),
  refine: () => (
    <div className="fz-chat">
      <p className="fz-msg is-me">Five centimetres longer, and a wider strap.</p>
      <p className="fz-msg">Done. Hem +5 cm, strap 3 cm. Four pieces redrafted.</p>
      <p className="fz-input">Say what to change…</p>
    </div>
  ),
  body: (r) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img ref={r} className="fz-turn" src={frameSrc(0)} alt="The model turning to show the garment all the way round" draggable={false} />
  ),
  bodies: () => (
    <ul className="fz-rows">
      {[
        ["Natalia", "Bust 92 · Waist 74 · Hip 98"],
        ["Mei", "Bust 86 · Waist 68 · Hip 92"],
        ["Amara", "Bust 101 · Waist 86 · Hip 106"],
      ].map(([n, m]) => (
        <li key={n}>
          <b>{n}</b>
          <span>{m}</span>
        </li>
      ))}
    </ul>
  ),
  print: () => (
    <div className="fz-print">
      <div className="fz-sheet is-a4">
        <span>A4</span>
        <small>At home</small>
      </div>
      <div className="fz-sheet is-a0">
        <span>A0</span>
        <small>At a print shop</small>
      </div>
    </div>
  ),
  lib: () => (
    <ul className="fz-rows">
      {[
        ["v1", "Midi, easy fit"],
        ["v2", "5 cm longer"],
        ["v3", "Lower back, wider strap"],
      ].map(([v, n]) => (
        <li key={v}>
          <b>{v}</b>
          <span>{n}</span>
        </li>
      ))}
    </ul>
  ),
};
