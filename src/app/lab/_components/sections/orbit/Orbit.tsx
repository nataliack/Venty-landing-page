"use client";

import { useEffect, useRef, useState } from "react";
import { End, Shell, useBox } from "../hc/parts";
import "./orbit.css";

/* How it works · Orbit. A structure and motion test (low fidelity on
   purpose): a floating meadow at the bottom (an image, still; only its top
   on screen, the earth under it running off the bottom), a figure standing
   on it (a placeholder), and round the figure the four steps as glass cards
   (the Made to measure composer's glass) on an invisible cylinder. The
   scroll turns the cylinder a step at a time.

   The cards are stuck to the cylinder like stickers: each one bends round
   it. CSS can't bend an element, so each card is drawn as thin upright
   strips, every strip the whole card clipped to its own slice and set at
   its own angle round the cylinder; side by side they make one curved card.
   The strips are decoration (aria-hidden); the steps are read from a plain
   list for screen readers. */

const STEPS = [
  {
    n: "1",
    k: "Measure",
    h: "Take your measurements.",
    p: "Grab a soft tape measure and enter your bust, waist, hips and back length. Venty shows you where the tape goes for each one. Your measurements are saved, so you only do this once.",
  },
  {
    n: "2",
    k: "Describe",
    h: "Show Venty what you want to make.",
    p: "Upload a photo of a garment you love, or describe it in a sentence. Then choose how fitted you want it and the fabric you plan to sew with.",
  },
  {
    n: "3",
    k: "Draft",
    h: "Venty drafts the pattern to your body.",
    p: "Every pattern piece is drawn from your measurements. Preview the garment on your body in 3D, and ask for changes in plain words, like longer sleeves.",
  },
  {
    n: "4",
    k: "Print",
    h: "Print your pattern and start sewing.",
    p: "Print on A4 at home, or A0 at a print shop. Every piece has grainlines, notches and labels, and the A4 pages come with a map for taping them together.",
  },
];

const STEP = 58; // degrees between cards round the cylinder: the next one turned well round at the side
const SLICES = 12; // strips per card: enough that the bend reads smooth
/* the meadow image (2000 x 1168): how tall for its width, how much of it is
   on screen from the top, and where the middle of the grass is (from the top) */
const ISLAND = { ratio: 1168 / 2000, show: 0.62, top: 0.29 };

function Card({ s }: { s: (typeof STEPS)[number] }) {
  return (
    <>
      <p className="or-card__top">
        <b>{s.n}</b>
        <span>{s.k}</span>
      </p>
      <h3 className="or-card__h">{s.h}</h3>
      <p className="or-card__p">{s.p}</p>
    </>
  );
}

export function HcOrbit() {
  return (
    <Shell>
      <Orbit />
    </Shell>
  );
}

function Orbit() {
  const box = useBox();
  const sec = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(0);

  useEffect(() => {
    const s = sec.current;
    const st = stage.current;
    const rg = ring.current;
    if (!box || !s || !st || !rg) return;
    const groups = [...rg.querySelectorAll<HTMLElement>(".or-sticker")];

    let rot = 0; // degrees the cylinder has turned
    let target = 0;
    let raf = 0;

    // the scene's place and the cylinder's size, for this screen
    const size = () => {
      const w = st.clientWidth;
      const h = st.clientHeight;
      const phone = w < 700;
      // the meadow: 78vw wide (wider on phones, running off both sides), only
      // its top on screen, the earth under it running off the bottom
      const iw = phone ? w * 1.3 : w * 0.78;
      const ih = iw * ISLAND.ratio;
      const show = phone ? 0.85 : ISLAND.show;
      const itop = h - ih * show;
      // the cards: their width, and the cylinder they are stuck round
      const cw = phone ? Math.min(290, w * 0.74) : 330;
      const R = phone ? cw * 1.15 : Math.max(cw * 1.45, w * 0.3);
      const card = groups[0]?.querySelector<HTMLElement>(".or-card");
      const ch = card?.offsetHeight || 300;
      // the cylinder's middle: the front card's top well clear of the count
      const ry = Math.max(h * 0.47, ch / 2 + h * 0.14);
      st.style.setProperty("--iw", `${iw}px`);
      st.style.setProperty("--itop", `${itop}px`);
      st.style.setProperty("--grass", `${itop + ih * ISLAND.top}px`);
      st.style.setProperty("--ry", `${ry}px`);
      st.style.setProperty("--cw", `${cw}px`);
      st.style.setProperty("--R", `${R}px`);
      // the figure: standing on the grass, its head well above the front card
      st.style.setProperty("--fig-top", `${ry - ch / 2 - h * 0.17}px`);
      // what of the meadow runs below the screen: room left under the scene
      // for it, so it is seen whole as the page scrolls on
      s.querySelector<HTMLElement>(".or-pin")!.style.marginBottom = `${ih * (1 - show)}px`;
      // the blur behind each card: one smooth pane across the card's chord
      // (blurring strip by strip would band), the strips' glass over it
      const half = cw / (2 * R);
      groups.forEach((g) => {
        const pane = g.querySelector<HTMLElement>(".or-pane")!;
        pane.style.width = `${2 * R * Math.sin(half)}px`;
        pane.style.height = `${ch}px`;
        pane.style.transform = `translateZ(${R * Math.cos(half)}px)`;
      });
      // each strip: its slice of the card and its angle round the cylinder
      const sw = cw / SLICES;
      groups.forEach((g) => {
        g.querySelectorAll<HTMLElement>(".or-card").forEach((el, k) => {
          const x = (k + 0.5) * sw - cw / 2; // the strip's middle, from the card's
          const phi = (x / R) * (180 / Math.PI);
          const l = k * sw - 0.15; // a hair of overlap, so no gaps between strips
          const r = cw - (k + 1) * sw - 0.15;
          el.style.clipPath = `inset(-1px ${Math.max(0, r)}px -1px ${Math.max(0, l)}px)`;
          el.style.transform = `rotateY(${phi}deg) translateZ(${R}px) translateX(${-x}px)`;
        });
      });
    };

    const draw = () => {
      raf = 0;
      rot += (target - rot) * 0.12;
      if (Math.abs(target - rot) < 0.01) rot = target;
      // seen from a touch below, so the card in front stands a little higher
      // than those turning away at the sides
      rg.style.transform = `translateZ(calc(var(--R) * -0.6)) rotateX(4deg) rotateY(${-rot}deg)`; // set back, so the front card is near its own size
      groups.forEach((g, i) => {
        const a = i * STEP - rot; // its angle from the front
        g.style.transform = `rotateY(${i * STEP}deg)`;
        const depth = Math.cos((a * Math.PI) / 180);
        // clear at the front, softer at the sides, gone before the back
        g.style.setProperty("--o", String(Math.min(1, Math.max(0, (depth - 0.1) / 0.75))));
        // the blur only on the card coming to the front (its pane matches the
        // curve closely there; at the sides the glass alone is enough)
        g.style.setProperty("--g", String(Math.max(0, (depth - 0.8) / 0.2) ** 2));
      });
      if (rot !== target) raf = requestAnimationFrame(draw);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };

    // the scroll turns the cylinder with it. When it stops between two steps
    // it settles on one: the next one in the way you were going if you
    // scrolled at all on purpose (a sixth of a step), back where you were if not
    let at = 0; // the step it last settled on
    let going = -1; // the step it is gliding to (-1: none); your own scroll cancels it
    let idle = 0;
    const yours = () => void (going = -1);
    const span = () => {
      const pin = s.querySelector<HTMLElement>(".or-pin")!;
      const top =
        pin.getBoundingClientRect().top -
        box.getBoundingClientRect().top +
        box.scrollTop;
      return { top, run: pin.offsetHeight - box.clientHeight };
    };
    const onScroll = () => {
      const { top, run } = span();
      const p = Math.min(1, Math.max(0, (box.scrollTop - top) / Math.max(1, run)));
      const k = p * (STEPS.length - 1);
      target = k * STEP;
      setOn(Math.round(k));
      kick();
      clearTimeout(idle);
      const inside = box.scrollTop > top + 1 && box.scrollTop < top + run - 1;
      if (!inside) {
        at = Math.round(k);
        return;
      }
      idle = window.setTimeout(() => {
        if (going >= 0) {
          // still gliding (a slow frame paused it): carry on to the same step
          const y = top + (going / (STEPS.length - 1)) * run;
          if (Math.abs(y - box.scrollTop) > 2) box.scrollTo({ top: y, behavior: "smooth" });
          else going = -1;
          return;
        }
        const d = k - at;
        let to = at;
        if (d > 1 / 6) to = Math.ceil(k - 1 / 6);
        else if (d < -1 / 6) to = Math.floor(k + 1 / 6);
        to = Math.min(STEPS.length - 1, Math.max(0, to));
        at = to;
        const y = top + (to / (STEPS.length - 1)) * run;
        if (Math.abs(y - box.scrollTop) > 2) {
          going = to;
          box.scrollTo({ top: y, behavior: "smooth" });
        }
      }, 120);
    };

    size();
    onScroll();
    at = Math.round(target / STEP);
    rot = target;
    draw();
    const ro = new ResizeObserver(() => {
      size();
      kick();
    });
    ro.observe(st);
    box.addEventListener("scroll", onScroll, { passive: true });
    for (const e of ["wheel", "touchstart", "keydown", "pointerdown"] as const)
      box.addEventListener(e, yours, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(idle);
      ro.disconnect();
      box.removeEventListener("scroll", onScroll);
      for (const e of ["wheel", "touchstart", "keydown", "pointerdown"] as const)
        box.removeEventListener(e, yours);
    };
  }, [box]);

  return (
    <>
      <section ref={sec} className="or">
        {/* the title scrolls by as usual; the scene below holds while the cylinder turns */}
        <header data-in className="or-intro">
          <p className="hc-eyebrow">How it works</p>
          <h2 className="or-title">From your body to the cutting table.</h2>
        </header>
        <div className="or-pin">
          <div ref={stage} className="or-stage">
            <p className="or-count" aria-live="polite">
              Step <b>{STEPS[on].n}</b> of 4 · {STEPS[on].k}
            </p>

            {/* the meadow (still, for now), and a placeholder figure standing on it */}
            <img
              className="or-island"
              src="/lab/orbit/island-2000.webp"
              srcSet="/lab/orbit/island-1200.webp 1200w, /lab/orbit/island-2000.webp 2000w"
              sizes="(max-width: 699px) 130vw, 78vw"
              width={2000}
              height={1168}
              alt=""
              decoding="async"
            />
            <div className="or-figure" aria-hidden="true">
              <span>Figure · your image, standing on the meadow, behind the cards</span>
            </div>

            {/* the steps, for screen readers */}
            <ol className="sr-only">
              {STEPS.map((s) => (
                <li key={s.n} aria-current={on === STEPS.indexOf(s) ? "step" : undefined}>
                  Step {s.n}, {s.k}: {s.h} {s.p}
                </li>
              ))}
            </ol>

            {/* the cylinder, and on it each card as strips */}
            <div className="or-view" aria-hidden="true">
              <div ref={ring} className="or-ring">
                {STEPS.map((s) => (
                  <div key={s.n} className="or-sticker">
                    <div className="or-pane" />
                    {Array.from({ length: SLICES }, (_, k) => (
                      <article key={k} className="or-card">
                        <Card s={s} />
                      </article>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="hc-sec">
        <End />
      </section>
    </>
  );
}
