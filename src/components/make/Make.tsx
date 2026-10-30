"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollToY } from "../SmoothScroll";
import { useReveals } from "@/lib/useReveals";
import "./make.css";

gsap.registerPlugin(ScrollTrigger);

/* 5. What you can make (dark). "Four kinds of garment, every one drafted
   from your body." Four tall panels side by side, the one in hand opened
   wide: its photograph, its name and its pieces.

   Desktop: the section pins and the scroll opens each garment in turn
   (click one to go to it). It then holds a screen, still, while Made with
   Venty (light) rises over it with its stitched edge.
   Phones: a row of cards to swipe through, all open.

   IMAGES (replace the files, keep the names; 3:4 portrait, garment on a
   body): the app's editorial looks (its sign-up gallery, generated with
   Higgsfield, 896 x 1200), one per kind by what she wears: the rust halter
   dress, the green fitted top, the wide-leg trousers, the burgundy maxi
   skirt. Each has its own focus (pos), so the wide crop keeps her.
     /make/dresses.webp  /make/tops.webp  /make/trousers.webp  /make/skirts.webp */

const GARMENTS = [
  {
    name: "Dresses",
    img: "/make/dresses.webp",
    pos: "50% 45%",
    pieces: "Dress front · Dress back · Neck facing",
  },
  {
    name: "Tops",
    img: "/make/tops.webp",
    pos: "50% 30%",
    pieces: "Front · Back · Sleeve",
  },
  {
    name: "Trousers",
    img: "/make/trousers.webp",
    pos: "50% 50%",
    pieces: "Front leg · Back leg · Waistband",
  },
  {
    name: "Skirts",
    img: "/make/skirts.webp",
    pos: "50% 22%",
    pieces: "Front · Back · Waistband",
  },
];

const RUN = 2.4; // screens of scroll to open all four (desktop)

export function Make() {
  const root = useRef<HTMLElement>(null);
  const st = useRef<ScrollTrigger | null>(null);
  const [active, setActive] = useState(0);
  const [wide, setWide] = useState(true);
  useReveals(root);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el || !wide) return;
    const t = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: () => `+=${window.innerHeight * RUN}`,
      onUpdate: (self) => setActive(Math.min(GARMENTS.length - 1, Math.floor(self.progress * GARMENTS.length))),
    });
    st.current = t;
    return () => {
      t.kill();
      st.current = null;
    };
  }, [wide]);

  const go = (i: number) => {
    const t = st.current;
    if (!t) return setActive(i);
    scrollToY(t.start + ((i + 0.5) / GARMENTS.length) * (t.end - t.start));
  };

  return (
    <section
      ref={root}
      id="make"
      data-nav="What you can make"
      data-wing="drift"
      data-theme-zone="dark"
      className="wm"
      aria-labelledby="wm-title"
    >
      <div className="wm-stage">
        <span className="wm-seam" aria-hidden="true" />
        <header className="wm-head" data-reveal>
          <p className="wm-eyebrow">
            <span className="line-mask inline-block">
              <span data-rise className="inline-block">
                What you can make
              </span>
            </span>
          </p>
          <h2 id="wm-title" className="wm-title">
            <span className="line-mask">
              <span data-rise className="block">
                Four kinds of garment,
              </span>
            </span>
            <span className="line-mask">
              <span data-rise className="block">
                every one drafted from your body.
              </span>
            </span>
          </h2>
          <p className="wm-count" aria-hidden="true">
            <span key={active}>{String(active + 1).padStart(2, "0")}</span> / 04
          </p>
        </header>

        <ul className="wm-row" data-reveal="top 70%">
          {GARMENTS.map((g, i) => {
            const on = !wide || i === active;
            return (
              <li key={g.name} data-up className={`wm-panel ${on ? "is-on" : ""}`} style={{ "--i": i } as CSSProperties}>
                <button type="button" className="wm-panel__hit" onClick={() => go(i)} aria-label={g.name} aria-current={wide && i === active ? "true" : undefined} tabIndex={wide ? 0 : -1} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.img} alt="" loading="lazy" decoding="async" className="wm-panel__img" style={{ objectPosition: g.pos }} />
                <span className="wm-panel__shade" aria-hidden="true" />
                <span className="wm-panel__n" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="wm-panel__side" aria-hidden="true">
                  {g.name}
                </span>
                <div className="wm-panel__body">
                  <h3 className="wm-panel__name">{g.name}</h3>
                  <p className="wm-panel__pieces">{g.pieces}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
