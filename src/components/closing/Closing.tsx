"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PrimaryButton } from "../PrimaryButton";
import { APP_URL, CTA_LABEL } from "@/lib/site";
import { EASE, afterLoader } from "@/lib/motion";
import { HIDDEN } from "@/lib/reveal";
import { table, TABLE } from "@/lib/tableSequence";
import "./closing.css";

gsap.registerPlugin(ScrollTrigger);

/* 9. The closing scene (dark): the table, on film. A pinned scroll scene: the
   table film (an image sequence, tableSequence.ts) fills the screen and plays
   as you scroll: from above, over the pattern pieces and the dress, then
   turning to the window and down past the table's edge into the dark.

     Bars     cinematic focus bars slide in from the top and bottom as the
              scene starts, and leave as the film goes dark
     Beat 1   Fig. 09 / Get started: Paper on top. Cloth underneath.
     Beat 2   Printed at 1:1: true size, pinned, drawn for one body
     Beat 3   One body. One pattern. Yours.
     Final    The dress in your head. On the body you have. And the button,
              on the dark the film ends in.

   The beats sit low on the left like captions, over a soft shade; the bottom
   bar carries the scene's caption and the film's frame count. After the
   final line it holds a screen, still, while the footer rises over it with
   its edge. */

const RUN = 4; // screens of scroll for the scene
const T = 10; // the timeline's length, in its own units
const FILM_END = 8; // the film runs from 0 to here; the final line follows
// where a phone's narrow slice of the frame looks (master frame, focus 0..1 across)
const CAMERA = [
  [0, 0.42],
  [60, 0.46],
  [110, 0.52],
  [144, 0.5],
] as const;

function Beat({ k, lines, cls }: { k?: string; lines: string[]; cls: string }) {
  return (
    <div className={`cl-beat ${cls}`}>
      {k && (
        <p className="cl-beat__k">
          <span className="line-mask inline-block">
            <span data-l className="inline-block">
              {k}
            </span>
          </span>
        </p>
      )}
      <p className="cl-beat__h">
        {lines.map((l) => (
          <span key={l} className="line-mask">
            <span data-l className="block">
              {l}
            </span>
          </span>
        ))}
      </p>
    </div>
  );
}

export function Closing() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = root.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const count = el.querySelector<HTMLElement>("[data-count]")!;
    const N = TABLE.frames;
    let position = 0; // where the scroll has the film, kept for a player made later
    let player: ReturnType<typeof table.createPlayer> | null = null;

    // The film loads only once the page is up (after the loader, in idle
    // time) or when the table comes near, whichever is first. The player (and
    // its window of decoded frames) lives only while the table is within a
    // screen or so of view, and is dropped again when it is far, to free memory.
    const startLoad = () => void table.preload();
    let idle = 0;
    const cancelLoader = afterLoader(() => {
      idle = "requestIdleCallback" in window ? window.requestIdleCallback(startLoad, { timeout: 6000 }) : (globalThis.setTimeout(startLoad, 1500) as unknown as number);
    });
    const near = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !player) {
          player = table.createPlayer(cv, table.cameraTrack(CAMERA));
          player.setPosition(position);
        } else if (!e.isIntersecting && player) {
          player.destroy();
          player = null;
          cv.style.opacity = "0";
        }
      },
      { rootMargin: "150% 0px 150% 0px" },
    );
    near.observe(el);

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(el);
      const lines = (s: string) => q(`${s} [data-l]`);
      const film = { f: 0 };
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: () => `+=${window.innerHeight * RUN}`,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
      const IN = { yPercent: 0, duration: 0.5, ease: EASE.out, stagger: 0.06 };
      const OUT = { yPercent: -HIDDEN, duration: 0.4, ease: EASE.in, stagger: 0.04 };
      // below their (padded) masks, so no swash or descender peeks out
      gsap.set(q("[data-l]"), { yPercent: HIDDEN });

      // the film, frame by frame with the scroll
      tl.to(
        film,
        {
          f: N - 1,
          duration: FILM_END,
          onUpdate: () => {
            position = film.f;
            player?.setPosition(film.f);
            count.textContent = `${String(Math.round(film.f) + 1).padStart(3, "0")} / ${N}`;
          },
        },
        0,
      )
        // the focus bars slide in from the edges
        .fromTo(q(".cl-bar"), { scaleY: 0 }, { scaleY: 1, duration: 0.8, ease: EASE.out }, 0)
        .fromTo(q(".cl-cap"), { opacity: 0 }, { opacity: 1, duration: 0.5, ease: EASE.soft }, 0.5)
        // beat 1: the table from above
        .to(lines(".is-1"), IN, 0.6)
        .to(lines(".is-1"), OUT, 2.3)
        // beat 2: the pieces, true size
        .to(lines(".is-2"), IN, 2.7)
        .to(lines(".is-2"), OUT, 4.6)
        // beat 3: the turn to the window
        .to(lines(".is-3"), IN, 5)
        .to(lines(".is-3"), OUT, 6.7)
        // the film goes dark; the bars leave and the night closes in
        .to(q(".cl-cap"), { opacity: 0, duration: 0.4, ease: EASE.soft }, 7)
        .to(q(".cl-bar"), { scaleY: 0, duration: 0.8, ease: EASE.in }, 7.2)
        .fromTo(q(".cl-dim"), { opacity: 0 }, { opacity: 1, duration: 0.9, ease: EASE.inOut }, 7.4)
        // the final line, on the dark
        .to(lines(".cl-final"), { ...IN, duration: 0.6 }, 8.2)
        .fromTo(q(".cl-final__cta"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: EASE.out }, 8.6)
        .to({}, { duration: T - 9.1 }, 9.1);
    }, el);

    return () => {
      ctx.revert();
      near.disconnect();
      cancelLoader();
      if ("cancelIdleCallback" in window) window.cancelIdleCallback(idle);
      else clearTimeout(idle);
      player?.destroy();
    };
  }, []);

  return (
    <section ref={root} id="table" data-nav="Get started" data-wing="close" data-theme-zone="dark" className="cl" aria-labelledby="cl-title">
      <div className="cl-stage">
        <h2 id="cl-title" className="sr-only">
          Get started
        </h2>

        {/* the film: the first frame as a poster until the player has drawn */}
        <div className="cl-film" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={table.poster} alt="" loading="lazy" decoding="async" draggable={false} className="cl-film__poster" />
          <canvas ref={canvas} className="cl-film__canvas" />
          <span className="cl-shade" />
          <span className="cl-dim" />
        </div>

        {/* the focus bars, top and bottom */}
        <span className="cl-bar is-top" aria-hidden="true" />
        <span className="cl-bar is-bottom" aria-hidden="true" />

        <Beat cls="is-1" k="Fig. 09 / Get started" lines={["Paper on top.", "Cloth underneath."]} />
        <Beat cls="is-2" k="Printed at 1:1" lines={["Printed at true size.", "Pinned to the cloth.", "Every line drawn for one body."]} />
        <Beat cls="is-3" lines={["One body.", "One pattern.", "Yours."]} />

        <div className="cl-final">
          <p className="cl-final__h">
            <span className="line-mask">
              <span data-l className="block">
                The dress in your head.
              </span>
            </span>
            <span className="line-mask">
              <span data-l className="block">
                <em>On the body you have.</em>
              </span>
            </span>
          </p>
          <div className="cl-final__cta">
            <PrimaryButton href={APP_URL}>{CTA_LABEL}</PrimaryButton>
          </div>
        </div>

        <p className="cl-cap" aria-hidden="true">
          <span>Venty / Get started</span>
          <span data-count>001 / {TABLE.frames}</span>
        </p>
      </div>
    </section>
  );
}
