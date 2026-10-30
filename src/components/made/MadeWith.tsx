"use client";

import { useEffect, useRef } from "react";
import { DitherEdge } from "../DitherEdge";
import { PrimaryButton } from "../PrimaryButton";
import { APP_URL, CTA_LABEL } from "@/lib/site";
import { useReveals } from "@/lib/useReveals";
import "./made.css";

/* 6. On the line (light; it was Made with Venty). "Sewn by real people, on their own bodies."
   The makes hang on a washing line that sags under the title, its ends
   rising either side of it, so the line hugs the title. Each card is pegged
   to the line at two points, so it sits on the curve and tilts with it
   (placed every frame from the curve's own shape: both pegs always on the
   line). The cards drift along it, right to left; drag the line to look
   along it, and let go: it carries on with the speed of the drag, then eases
   back to its drift (it never stops for a hover). Each card says what was sewn,
   by whom, and the body it was drafted on. The cards are the site's glass
   (the composer's and How it works'): white glass, a 20px blur, a hairline,
   28px corners.

   It rises over the end of What you can make with a stitched edge.

   PLACEHOLDERS. Every entry below is a stand-in: swap in real makes (with
   the maker's permission) before this goes in front of people. Real makes
   only: invented makers or quotes would mislead (Australian Consumer Law).
   IMAGES: /made/make-01.webp to make-06.webp (4:5 portrait, the maker
   wearing it). For now, the looks from the app's editorial shoot (Higgsfield
   and Gemini) not used elsewhere on the site, the garment names matched to
   them; swap in photos of real makes. */

export type Make = { img: string; garment: string; maker: string; body: string; quote: string };

export const MAKES: Make[] = [
  { img: "/made/make-01.webp", garment: "Bias slip dress", maker: "Maker's name · City", body: "Bust 88 · Waist 70 · Hip 96", quote: "A line from the maker, in their own words." },
  { img: "/made/make-02.webp", garment: "Crop top and maxi skirt", maker: "Maker's name · City", body: "Bust 101 · Waist 86 · Hip 108", quote: "What they made, and how it fits." },
  { img: "/made/make-03.webp", garment: "Tweed jacket and skirt", maker: "Maker's name · City", body: "Waist 78 · Hip 104 · Inseam 79", quote: "A line from the maker, in their own words." },
  { img: "/made/make-04.webp", garment: "Lace-up corset dress", maker: "Maker's name · City", body: "Waist 72 · Hip 99", quote: "What they made, and how it fits." },
  { img: "/made/make-05.webp", garment: "Bow-cuff shirt", maker: "Maker's name · City", body: "Bust 94 · Waist 80 · Hip 102", quote: "A line from the maker, in their own words." },
  { img: "/made/make-06.webp", garment: "Zip-front top", maker: "Maker's name · City", body: "Bust 86 · Waist 68", quote: "What they made, and how it fits." },
];

const SPEED = 55; // px per second along the line, right to left
/* the line: how far it sags from its ends to its middle (a share of the
   screen's width), and how far under the title's foot its
   middle hangs (px) */
const SAG = 0.13;
const UNDER = 150; // phones: UNDER_PHONE
const UNDER_PHONE = 84;
/* room under the cards inside the line's box for their soft shadows (the box
   clips; pulled back up after, so the page below doesn't move) */
const SHADOW_ROOM = 130;

function Card({ m, copy }: { m: Make; copy: boolean }) {
  return (
    <li className="mw-card" aria-hidden={copy || undefined}>
      <span className="mw-peg is-l" aria-hidden="true" />
      <span className="mw-peg is-r" aria-hidden="true" />
      <div className="mw-card__glass">
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
  const cord = useRef<SVGGElement>(null);
  const head = useRef<HTMLElement>(null);
  useReveals(root);

  // the line's curve, the drift, and the drag
  useEffect(() => {
    const ln = line.current;
    const pa = cord.current;
    const hd = head.current;
    if (!ln || !pa || !hd) return;
    const cards = [...ln.querySelectorAll<HTMLElement>(".mw-card")];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // this screen's numbers, from size()
    let W = 0; // the line's width
    let y0 = 0; // where the line's ends are (y, in the line's box)
    let sag = 0; // how far below its ends it hangs in the middle
    let cw = 0; // a card's width
    let pitch = 0; // from one card to the next along the line
    const at = (x: number) => {
      const u = (x - W / 2) / (W / 2);
      return y0 + sag * (1 - u * u); // the cord: lowest in the middle, rising to its ends
    };
    const slope = (x: number) => (-2 * sag * (x - W / 2)) / ((W / 2) * (W / 2));

    const size = () => {
      W = ln.clientWidth;
      cw = cards[0]?.offsetWidth || 260;
      pitch = cw + Math.max(W < 700 ? 10 : 18, Math.min(36, W * 0.024));
      sag = W * SAG;
      // the line's box starts at the title's top (it lies over the title):
      // its middle hangs just under the title, its ends rise beside it
      const foot = hd.offsetHeight;
      ln.style.marginTop = `${-foot}px`;
      y0 = Math.max(16, foot + (W < 700 ? UNDER_PHONE : UNDER) - sag);
      // the cord, drawn once for this width (a little past both edges)
      const pts: string[] = [];
      for (let k = 0; k <= 48; k++) {
        const x = -W * 0.05 + (W * 1.1 * k) / 48;
        pts.push(`${x.toFixed(1)} ${at(x).toFixed(1)}`);
      }
      const d = "M" + pts.join("L");
      pa.querySelectorAll("path").forEach((p) => p.setAttribute("d", d));
      // room for the cards hanging from the line's lowest point, and for their
      // shadows below them
      ln.style.height = `${y0 + sag + (cards[0]?.offsetHeight || 460) + 40 + SHADOW_ROOM}px`;
      ln.style.marginBottom = `${-SHADOW_ROOM}px`;
    };

    let x = 0; // how far the line has run
    let v = 0; // speed now, px a second (eased back to the drift after a drag)
    let held = false;
    let lastX = 0;
    let lastT = 0;
    let dragV = 0;
    let raf = 0;
    let onScreen = false;
    let last = 0;

    const place = () => {
      const run = pitch * cards.length;
      cards.forEach((el, i) => {
        // where along the line it hangs: wrapped round, so the line runs on
        const cx = ((((i * pitch - x) % run) + run) % run) - pitch + cw / 2;
        if (cx < -cw || cx > W + cw) {
          if (el.style.visibility !== "hidden") el.style.visibility = "hidden";
          return;
        }
        if (el.style.visibility !== "visible") el.style.visibility = "visible";
        // pegged at its middle-top, tilted with the cord, so both pegs sit on it
        const a = Math.atan(slope(cx));
        el.style.transform = `translate3d(${(cx - cw / 2).toFixed(1)}px, ${at(cx).toFixed(1)}px, 0) rotate(${a.toFixed(4)}rad)`;
      });
    };

    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - (last || t)) / 1000);
      last = t;
      if (!held) {
        // after a drag it runs on at the drag's speed, then eases back
        const target = reduce ? 0 : SPEED;
        v += (target - v) * Math.min(1, dt * 1.4);
        x += v * dt;
      }
      place();
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
      lastT = performance.now();
      dragV = 0;
      ln.setPointerCapture(e.pointerId);
      ln.dataset.held = "true";
    };
    const move = (e: PointerEvent) => {
      if (!held) return;
      const now = performance.now();
      const dx = e.clientX - lastX;
      x -= dx;
      // the drag's speed, smoothed over its last moves
      const dtm = Math.max(1, now - lastT) / 1000;
      dragV = dragV * 0.6 + (-dx / dtm) * 0.4;
      lastX = e.clientX;
      lastT = now;
    };
    const up = () => {
      if (!held) return;
      held = false;
      // a pause before letting go means no fling
      v = performance.now() - lastT > 80 ? 0 : Math.max(-4000, Math.min(4000, dragV));
      delete ln.dataset.held;
    };
    ln.addEventListener("pointerdown", down);
    ln.addEventListener("pointermove", move);
    ln.addEventListener("pointerup", up);
    ln.addEventListener("pointercancel", up);

    size();
    v = reduce ? 0 : SPEED;
    place();
    const ro = new ResizeObserver(() => {
      size();
      place();
    });
    ro.observe(ln);
    ro.observe(hd);
    // the cards size with the screen's height too (made.css), which need not change the line's width
    if (cards[0]) ro.observe(cards[0]);
    return () => {
      io.disconnect();
      ro.disconnect();
      cancelAnimationFrame(raf);
      ln.removeEventListener("pointerdown", down);
      ln.removeEventListener("pointermove", move);
      ln.removeEventListener("pointerup", up);
      ln.removeEventListener("pointercancel", up);
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
      <DitherEdge color="#eff4ff" />
      <div className="mw-dots" aria-hidden="true" />
      <div className="mw-scene">
        <header ref={head} className="mw-head" data-reveal>
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
                on their own bodies.
              </span>
            </span>
          </h2>
        </header>

        {/* the line, over the title's sides: its ends rise beside it */}
        <div ref={line} className="mw-line" data-reveal="top 85%" aria-label="Makes" role="region">
          <div data-up className="mw-line__in">
            {/* the cord, a twisted rope: its shadow on the wall behind, its
                shaded underside, the rope and its strands, and the light along
                its top (one curve, set by size()) */}
            <svg className="mw-cord" aria-hidden="true">
              <defs>
                {/* the twist: strands running round the rope, on the slant */}
                <pattern id="mw-twist" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(58)">
                  <rect width="4" height="4" fill="#8f9bb4" />
                  <rect width="1.7" height="4" fill="#5f6d89" />
                </pattern>
              </defs>
              <g ref={cord}>
                <path className="is-shadow" />
                <path className="is-under" />
                <path className="is-rope" />
                <path className="is-light" />
              </g>
            </svg>
            <ul className="mw-track">
              {/* twice over, so the line runs on without a gap (the copy is hidden from screen readers) */}
              {[...MAKES, ...MAKES].map((m, i) => (
                <Card key={i} m={m} copy={i >= MAKES.length} />
              ))}
            </ul>
          </div>
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
