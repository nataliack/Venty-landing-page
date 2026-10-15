"use client";

import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { APP_URL, CTA_LABEL } from "@/lib/site";
import "./hc.css";

/* Shared parts for the How it works concepts (hc): the copy, an image slot
   (a labelled placeholder: no drawings), the page's reveals (text rising
   from masks, objects fading up; the motion system's eases and timings), and
   the scroll box each concept runs in. */

export const HEAD = { eyebrow: "Three steps", title: "How it works", sub: "From your body to the cutting table." };

export const STEPS = [
  {
    n: "01",
    k: "Measure",
    h: "Four measures to start.",
    p: "Add more when you want a closer fit. Every measure shows where the tape goes, and your body is saved for every pattern after.",
    img: "Hands holding a tape measure round a waist, soft daylight",
  },
  {
    n: "02",
    k: "Describe",
    h: "Show it. Say it.",
    p: "Upload the photo, or describe it in a sentence. Choose how close it should sit and the fabric you have in mind.",
    img: "A phone in hand: a reference photo and the prompt in the app",
  },
  {
    n: "03",
    k: "Print",
    h: "Print it at home.",
    p: "Print on A4 at home, or A0 at a print shop. Grainlines, notches and labels on every piece, with a page map to tape the A4 pages together.",
    img: "Printed pattern pages taped together on a table, ready to cut",
  },
];

export type Step = (typeof STEPS)[number];

/* ---- the scroll box ------------------------------------------------------ */

const Box = createContext<HTMLDivElement | null>(null);
/** the concept's own scroll box (for scroll-driven layouts) */
export const useBox = () => useContext(Box);

/** Each concept scrolls in its own box (the lab's viewer is fixed). Every
    [data-in] inside it gets .is-in once a quarter of it is in view, which
    starts its reveals. */
export function Shell({ className = "", children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setBox(el);
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }),
      { root: el, threshold: 0.2 },
    );
    const watch = () => el.querySelectorAll("[data-in]:not(.is-in)").forEach((n) => io.observe(n));
    watch();
    const mo = new MutationObserver(watch);
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return (
    <div ref={ref} data-lenis-prevent className={`hc absolute inset-0 overflow-y-auto overflow-x-hidden ${className}`}>
      <Box.Provider value={box}>{children}</Box.Provider>
    </div>
  );
}

/* ---- reveals ------------------------------------------------------------- */

/** Lines of type rising from their masks, one after another, when the
    nearest [data-in] above them comes into view */
export function Lines({ lines, d = 0, className = "" }: { lines: ReactNode[]; d?: number; className?: string }) {
  return (
    <span className={`hc-lines ${className}`}>
      {lines.map((l, i) => (
        <span key={i} className="hc-mask">
          <span style={{ "--d": d + i * 0.08 } as CSSProperties}>{l}</span>
        </span>
      ))}
    </span>
  );
}

/** An object fading up into place (delay in seconds) */
export function Up({ d = 0, className = "", children, as: Tag = "div" }: { d?: number; className?: string; children: ReactNode; as?: "div" | "p" | "span" | "li" }) {
  return (
    <Tag className={`hc-up ${className}`} style={{ "--d": d } as CSSProperties}>
      {children}
    </Tag>
  );
}

/* ---- an image slot --------------------------------------------------------- */

/** A placeholder for a photograph: a soft panel saying which step it is and
    what it should show. Swap for an <img> later. */
export function Slot({ step, ratio = "4 / 5", className = "", style }: { step: Step; ratio?: string; className?: string; style?: CSSProperties }) {
  return (
    <figure className={`hc-slot ${className}`} style={{ aspectRatio: ratio, ...style }}>
      <span className="hc-slot__k">
        Image · {step.n} {step.k}
      </span>
      <figcaption className="hc-slot__hint">{step.img}</figcaption>
    </figure>
  );
}

/* ---- the end: the button ------------------------------------------------- */

export function End({ align = "center" }: { align?: "center" | "start" }) {
  return (
    <div data-in className={`hc-end is-${align}`}>
      <Up as="p" className="hc-end__k">
        Your turn
      </Up>
      <Up d={0.1}>
        <PrimaryButton href={APP_URL}>{CTA_LABEL}</PrimaryButton>
      </Up>
    </div>
  );
}

/** The section's head: eyebrow, title and the line under it */
export function Head({ align = "start", big = false }: { align?: "start" | "center"; big?: boolean }) {
  return (
    <header data-in className={`hc-head is-${align} ${big ? "is-big" : ""}`}>
      <p className="hc-eyebrow">
        <Lines lines={[HEAD.eyebrow]} />
      </p>
      <h2 className="hc-title">
        <Lines lines={[HEAD.title]} d={0.06} />
      </h2>
      <Up as="p" d={0.25} className="hc-sub">
        {HEAD.sub}
      </Up>
    </header>
  );
}
