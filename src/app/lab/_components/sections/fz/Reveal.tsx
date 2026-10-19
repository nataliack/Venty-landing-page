"use client";

import { useEffect, useRef } from "react";
import { MARK_BOUNDS, MARK_CENTRE, flightPose, smooth } from "@/lib/markFlight";
import { FIRST_FRAME, Shell, clamp, useScrub, useTurn } from "./parts";
import { FzSplit } from "./Pinned";
import "./pinned.css";

/* The bird reveal: the hand-off from the section before into Features.

   The section before holds. The Venty bird flies in from the left over it,
   wings beating, and as it comes it grows; through its shape you see the
   next section, dark, already there behind. Over the last stretch it dives
   at the camera: the wings spread and still (it glides, the mark at rest),
   and it grows past the edges of the screen until Features is all there
   is. Then Features carries on as a pinned scroll (Split).

   The scroll sets where the bird is and how big; the wings beat on their
   own clock while it is on screen, so it flies even when you stop. The
   shape is the mark's own (src/lib/markFlight), used as a clip path. */

const [CX, CY] = MARK_CENTRE;
/** the share of the scroll it spends crossing; the rest is the dive */
const CROSS = 0.62;

export function FzBirdReveal() {
  const wrap = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const through = useRef<HTMLDivElement>(null);
  const clipG = useRef<SVGClipPathElement>(null);
  const lineG = useRef<SVGGElement>(null);
  const prog = useRef(0);
  const [turnImg, setTurn] = useTurn();

  useEffect(() => {
    const st = stage.current;
    const th = through.current;
    const cg = clipG.current;
    const lg = lineG.current;
    if (!st || !th || !cg || !lg) return;
    const clipPaths = Array.from(cg.querySelectorAll("path"));
    const linePaths = Array.from(lg.querySelectorAll("path"));
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let beats = 0;
    let last = performance.now();
    let raf = 0;
    let on = false;

    const draw = () => {
      const t = prog.current;
      const vw = st.clientWidth;
      const vh = st.clientHeight;
      const a = clamp(t / CROSS); // crossing
      const d = smooth(clamp((t - CROSS) / (1 - CROSS))); // diving
      // the crossing: a curve from beyond the left edge, up and over, down to the middle
      const p0 = [-0.15 * vw, 0.62 * vh];
      const p1 = [0.32 * vw, 0.08 * vh];
      const p2 = [0.5 * vw, 0.5 * vh];
      const u = 1 - a;
      const x = u * u * p0[0] + 2 * u * a * p1[0] + a * a * p2[0];
      const y = u * u * p0[1] + 2 * u * a * p1[1] + a * a * p2[1];
      const dx = 2 * u * (p1[0] - p0[0]) + 2 * a * (p2[0] - p1[0]);
      const dy = 2 * u * (p1[1] - p0[1]) + 2 * a * (p2[1] - p1[1]);
      // it points along its way, levelling out for the dive
      const heading = ((Math.atan2(dy, dx) * 180) / Math.PI) * 0.7 * (1 - d);
      // its width: small to a third of the screen across, then past the edges
      const small = Math.min(vw, vh * 1.4);
      const w = small * (0.1 + 0.22 * a) * Math.pow(70, d);
      const s = w / MARK_BOUNDS.width;
      const pose = flightPose(beats, (1 - d) * (t > 0 ? 1 : 0), { heading });
      const tf = `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s.toFixed(5)}) translate(${-CX} ${-CY})`;
      cg.setAttribute("transform", tf);
      lg.setAttribute("transform", tf);
      [pose.body, pose.near, pose.far].forEach((dd, i) => {
        clipPaths[i].setAttribute("d", dd);
        linePaths[i].setAttribute("d", dd);
      });
      lg.style.opacity = String(clamp(1 - d * 2.5));
      // fully open once it has passed the edges
      th.classList.toggle("is-open", t >= 0.995);
    };

    const loop = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!still) beats += dt * 2.2;
      draw();
      if (on && !still) raf = requestAnimationFrame(loop);
    };
    // the wings beat only while the stage is on screen
    const io = new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      if (on && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    });
    io.observe(st);
    draw();
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  useScrub(wrap, (p) => {
    prog.current = p;
    setTurn(p * 120);
  });

  return (
    <Shell head={false}>
      <section ref={wrap} className="fz-reveal" style={{ height: "320svh" }}>
        <div ref={stage} className="fz-reveal__stage">
          <div className="fz-before">
            <p className="fz-eyebrow">How it works</p>
            <h2 className="fz-title">The section before.</h2>
            <p className="fz-before__note">A stand-in for the end of How it works. Scroll.</p>
          </div>
          <div ref={through} className="fz-through">
            <p className="fz-eyebrow">Features</p>
            <h2 className="fz-title">Everything a pattern needs.</h2>
            <div className="fz-through__turn">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img ref={turnImg} src={FIRST_FRAME} alt="" draggable={false} />
            </div>
          </div>
          <svg className="fz-birdline" aria-hidden="true">
            <defs>
              {/* the transform sits on the clip path itself: a clip path can't hold a group */}
              <clipPath ref={clipG} id="fz-bird-clip" clipPathUnits="userSpaceOnUse">
                <path />
                <path />
                <path />
              </clipPath>
            </defs>
            <g ref={lineG}>
              <path />
              <path />
              <path />
            </g>
          </svg>
        </div>
      </section>
      <FzSplit inShell={false} />
    </Shell>
  );
}
