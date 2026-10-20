"use client";

import { useEffect, useRef, useState } from "react";
import { MARK, MARK_BOUNDS } from "@/lib/markFlight";
import "./phone.css";

/* Pattern library, on the phone (after the "Ship from your pocket" tile Jose
   shared). One phone in front running the app's Patterns screen (the
   app's own list: a sketch of the garment, its name, who it's for, its
   status dot: Printed, Fitting, Draft); two phones behind, dimmed, their
   screens only blocks; a dot grid fading round them; the card's words
   along the bottom.

   It works, a little: while it's on screen, every few seconds a new
   pattern drafts in at the top (a bar fills under it), settles as a Draft,
   and the list moves down to make room. Still with reduced motion. */

type Row = { id: number; name: string; who: string; status: "Printed" | "Fitting" | "Draft"; g: string; drafting?: boolean };

// the garments, flat (24 x 24 sketches)
const G: Record<string, string> = {
  dress: "M9 3h6l1 5-2 1 3 12H7l3-12-2-1z",
  skirt: "M7 4h10l3 16H4z",
  shirt: "M8 3l4 2 4-2 4 3-2 4-2-1v11H8V9L6 10 4 6z",
  trousers: "M7 3h10l1 18h-4l-2-11-2 11H6z",
  top: "M8 4l4 1 4-1 3 4-3 2v10H8V10L5 8z",
  jacket: "M8 3l4 3 4-3 4 4-2 3v11H6V10L4 7z",
};
const SEED: Row[] = [
  { id: 1, name: "Flutter midi dress", who: "Natalia", status: "Printed", g: "dress" },
  { id: 2, name: "Bias slip skirt", who: "Natalia", status: "Fitting", g: "skirt" },
  { id: 3, name: "Camp collar shirt", who: "Mei", status: "Draft", g: "shirt" },
  { id: 4, name: "Wide-leg trousers", who: "Amara", status: "Printed", g: "trousers" },
  { id: 5, name: "Wrap top", who: "Mei", status: "Fitting", g: "top" },
];
// what drafts in, in turn
const NEXT = [
  { name: "Cropped puffer", who: "Natalia", g: "jacket" },
  { name: "Halter gown", who: "Amara", g: "dress" },
  { name: "Pleated midi skirt", who: "Mei", g: "skirt" },
];

function Bird({ size = 16 }: { size?: number }) {
  const b = MARK_BOUNDS;
  return (
    <svg width={size} height={size} viewBox={`${b.x} ${b.y - (b.width - b.height) / 2} ${b.width} ${b.width}`} fill="currentColor" aria-hidden="true">
      <path d={MARK} />
    </svg>
  );
}

/** the device: a titanium frame (its antenna bands, the buttons on its
    sides), the black border round the glass, the island, a sheen across
    the glass; the screen is its child */
function Device({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`ph ${className}`} aria-hidden={className.includes("is-back") || undefined}>
      <span className="ph__btn is-l1" />
      <span className="ph__btn is-l2" />
      <span className="ph__btn is-l3" />
      <span className="ph__btn is-r1" />
      <span className="ph__band is-tl" />
      <span className="ph__band is-tr" />
      <span className="ph__band is-bl" />
      <span className="ph__band is-br" />
      <div className="ph__glass">
        <div className="ph__screen">
          <span className="ph__island" />
          {children}
        </div>
        <span className="ph__sheen" />
      </div>
    </div>
  );
}

/** a phone behind: the same screen in blocks */
function Ghost({ side }: { side: "l" | "r" }) {
  return (
    <Device className={`is-back is-${side}`}>
      <div className="ph__ghost">
        <div className="ph__ghost-head">
          <span className="is-dot" />
          <span className="is-bar" />
          <span className="is-dot" />
        </div>
        <span className="ph__ghost-search" />
        <ul>
          {[52, 69, 56, 73, 60].map((w, i) => (
            <li key={i}>
              <span className="is-thumb" />
              <span className="is-lines">
                <span style={{ width: `${w}%` }} />
                <span style={{ width: `${w + 14}%` }} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Device>
  );
}

export function PhoneCard() {
  const root = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<Row[]>(SEED);
  const [step, setStep] = useState(0);
  const next = useRef(0);
  const uid = useRef(100);

  // while on screen: a new pattern drafts in every few seconds
  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let iv = 0;
    const timers: number[] = [];
    const tick = () => {
      const n = NEXT[next.current++ % NEXT.length];
      const id = uid.current++;
      // the ones before move along: the last new one goes to fitting, the one fitting gets printed
      const along = (r: Row, i: number): Row => (i === 0 ? { ...r, status: "Fitting" } : i === 1 && r.status === "Fitting" ? { ...r, status: "Printed" } : r);
      setRows((l) => [{ id, ...n, status: "Draft" as const, drafting: true }, ...l.map(along)].slice(0, 6));
      setStep((s) => s + 1);
      timers.push(window.setTimeout(() => setRows((l) => l.map((r) => (r.id === id ? { ...r, drafting: false } : r))), 2200));
    };
    const io = new IntersectionObserver(([e]) => {
      window.clearInterval(iv);
      if (e.isIntersecting) iv = window.setInterval(tick, 4200);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(iv);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div ref={root} className="ph-stage">
      <span className="ph-dots" aria-hidden="true" />
      <span className="ph-glow" aria-hidden="true" />
      <Ghost side="l" />
      <Ghost side="r" />
      <Device className="is-front">
        <div className="ph__status">
          <span>9:41</span>
          <span className="ph__status-icons" aria-hidden="true">
            <svg width="15" height="11" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M2 6.8a15 15 0 0 1 20 0M5 10.9a10 10 0 0 1 14 0M8.5 14.4a5 5 0 0 1 7 0M12 17.5h.01" />
            </svg>
            <span className="ph__battery">
              <span />
            </span>
          </span>
        </div>
        <div className="ph__head">
          <span className="ph__logo">
            <Bird size={15} />
          </span>
          <span className="ph__title">Patterns</span>
          <span className="ph__plus" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
        </div>
        <div className="ph__search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          Search patterns
        </div>
        <div className="ph__sub">
          <span>Recent</span>
          <span className="is-muted">Sort by · Latest</span>
        </div>
        <ul key={step} className={`ph__list ${step ? "is-shifting" : ""}`}>
          {rows.map((r, i) => (
            <li key={r.id} className={`ph__row ${r.drafting ? "is-drafting" : ""} ${i === 0 && step ? "is-new" : ""}`}>
              <span className="ph__thumb">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true">
                  <path d={G[r.g]} />
                </svg>
              </span>
              <span className="ph__text">
                <span className="ph__name">{r.name}</span>
                <span className="ph__who">{r.drafting ? "Drafting for " + r.who + "…" : r.who}</span>
                {r.drafting && <span className="ph__bar" />}
              </span>
              <span className="ph__state">
                <span className={`ph__dot is-${r.status.toLowerCase()}`} />
                {r.drafting ? "" : r.status}
              </span>
            </li>
          ))}
        </ul>
        <span className="ph__home" aria-hidden="true" />
      </Device>
    </div>
  );
}
