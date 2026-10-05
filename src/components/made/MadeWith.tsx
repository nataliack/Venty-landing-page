"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { DitherEdge } from "../DitherEdge";
import { PrimaryButton } from "../PrimaryButton";
import { APP_URL, CTA_LABEL } from "@/lib/site";
import { useReveals } from "@/lib/useReveals";
import "./made.css";

/* 6. Made with Venty (light). "Sewn by real people, on their own bodies."
   The makes hang on a line, pegged, swaying a little, drifting slowly past
   (drag the line to look along it; it pauses under the pointer). Each card
   says what was sewn, by whom, and the body it was drafted on.

   It rises over the end of What you can make with a stitched edge.

   PLACEHOLDERS. Every entry below is a stand-in: swap in real makes (with
   the maker's permission) before this goes in front of people. Real makes
   only: invented makers or quotes would mislead (Australian Consumer Law).
   IMAGES: /made/make-01.webp to make-06.webp (4:5 portrait, the maker
   wearing it). */

export type Make = { img: string; garment: string; maker: string; body: string; quote: string };

export const MAKES: Make[] = [
  { img: "/made/make-01.webp", garment: "Bias slip dress", maker: "Maker's name · City", body: "Bust 88 · Waist 70 · Hip 96", quote: "A line from the maker, in their own words." },
  { img: "/made/make-02.webp", garment: "Wrap top", maker: "Maker's name · City", body: "Bust 101 · Waist 86 · Hip 108", quote: "What they made, and how it fits." },
  { img: "/made/make-03.webp", garment: "Wide-leg trousers", maker: "Maker's name · City", body: "Waist 78 · Hip 104 · Inseam 79", quote: "A line from the maker, in their own words." },
  { img: "/made/make-04.webp", garment: "A-line skirt", maker: "Maker's name · City", body: "Waist 72 · Hip 99", quote: "What they made, and how it fits." },
  { img: "/made/make-05.webp", garment: "Shirt dress", maker: "Maker's name · City", body: "Bust 94 · Waist 80 · Hip 102", quote: "A line from the maker, in their own words." },
  { img: "/made/make-06.webp", garment: "Halter top", maker: "Maker's name · City", body: "Bust 86 · Waist 68", quote: "What they made, and how it fits." },
];

const SPEED = 28; // px per second along the line

function Card({ m, i, copy }: { m: Make; i: number; copy: boolean }) {
  return (
    <li className="mw-card" style={{ "--i": i } as CSSProperties} aria-hidden={copy || undefined}>
      <span className="mw-peg is-l" aria-hidden="true" />
      <span className="mw-peg is-r" aria-hidden="true" />
      <div className="mw-card__paper">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.img} alt="" loading="lazy" decoding="async" draggable={false} />
        <p className="mw-card__g">{m.garment}</p>
        <p className="mw-card__who">{m.maker}</p>
        <p className="mw-card__q">{m.quote}</p>
        <p className="mw-card__body">
          <span>Drafted on</span> {m.body}
        </p>
      </div>
    </li>
  );
}

export function MadeWith() {
  const root = useRef<HTMLElement>(null);
  const line = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  useReveals(root);

  // the drift, and the drag
  useEffect(() => {
    const ln = line.current;
    const tr = track.current;
    if (!ln || !tr) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let x = 0;
    let v = 0; // speed now, eased toward the drift (or 0 under the pointer)
    let held = false;
    let over = false;
    let lastX = 0;
    let raf = 0;
    let onScreen = false;
    let last = 0;
    const half = () => tr.scrollWidth / 2;
    const wrap = () => {
      const h = half();
      if (h > 0) x = ((x % h) + h) % h;
    };
    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - (last || t)) / 1000);
      last = t;
      if (!held) {
        const target = reduce || over ? 0 : SPEED;
        v += (target - v) * Math.min(1, dt * 3);
        x += v * dt;
      }
      wrap();
      tr.style.transform = `translate3d(${-x}px, 0, 0)`;
      raf = onScreen ? requestAnimationFrame(tick) : 0;
    };
    const io = new IntersectionObserver((e) => {
      onScreen = e[0].isIntersecting;
      if (onScreen && !raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    });
    io.observe(ln);

    const down = (e: PointerEvent) => {
      held = true;
      lastX = e.clientX;
      ln.setPointerCapture(e.pointerId);
      ln.dataset.held = "true";
    };
    const move = (e: PointerEvent) => {
      if (!held) return;
      x -= e.clientX - lastX;
      lastX = e.clientX;
    };
    const up = () => {
      held = false;
      delete ln.dataset.held;
    };
    const enter = (e: PointerEvent) => e.pointerType === "mouse" && (over = true);
    const leave = () => (over = false);
    ln.addEventListener("pointerdown", down);
    ln.addEventListener("pointermove", move);
    ln.addEventListener("pointerup", up);
    ln.addEventListener("pointercancel", up);
    ln.addEventListener("pointerenter", enter);
    ln.addEventListener("pointerleave", leave);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      ln.removeEventListener("pointerdown", down);
      ln.removeEventListener("pointermove", move);
      ln.removeEventListener("pointerup", up);
      ln.removeEventListener("pointercancel", up);
      ln.removeEventListener("pointerenter", enter);
      ln.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <section
      ref={root}
      id="made"
      data-nav="Made with Venty"
      data-wing="story"
      data-theme-zone="light"
      data-theme-at="top 35%"
      className="mw"
      aria-labelledby="mw-title"
    >
      <DitherEdge color="#eff4ff" pattern="stitch" />
      <div className="mw-dots" aria-hidden="true" />
      <header className="mw-head" data-reveal>
        <p className="mw-eyebrow">
          <span className="line-mask inline-block">
            <span data-rise className="inline-block">
              Made with Venty
            </span>
          </span>
        </p>
        <h2 id="mw-title" className="mw-title">
          <span className="line-mask">
            <span data-rise className="block">
              Sewn by real people,
            </span>
          </span>
          <span className="line-mask">
            <span data-rise className="block">
              on <em>their own bodies.</em>
            </span>
          </span>
        </h2>
      </header>

      <div ref={line} className="mw-line" data-reveal="top 85%" aria-label="Makes" role="region">
        <div data-up className="mw-line__in">
          <ul ref={track} className="mw-track">
            {/* twice over, so the line runs on without a gap (the copy is hidden from screen readers) */}
            {[...MAKES, ...MAKES].map((m, i) => (
              <Card key={i} m={m} i={i} copy={i >= MAKES.length} />
            ))}
          </ul>
        </div>
      </div>

      <div className="mw-end" data-reveal>
        <p className="mw-end__k">
          <span className="line-mask inline-block">
            <span data-rise className="inline-block">
              Your make could hang here.
            </span>
          </span>
        </p>
        <div data-up>
          <PrimaryButton href={APP_URL}>{CTA_LABEL}</PrimaryButton>
        </div>
      </div>
    </section>
  );
}
