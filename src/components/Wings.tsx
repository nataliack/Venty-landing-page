"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MOTIF } from "./motif";

gsap.registerPlugin(ScrollTrigger);

/* A pair of wings built from the logo motif, fixed behind the page. Each
   section carries a data-wing key; as you scroll the rig eases between the
   presets below (position in vw/vh, scale, flap = rotateY, spread = rotateZ,
   rig rotation, opacity), with a slow idle flap on top. */
type Pose = { x: number; y: number; s: number; a: number; sp: number; r: number; o: number };

const POSES: Record<string, Pose> = {
  hero:   { x: 0,   y: 4,   s: 1,    a: 8,  sp: 10,  r: 0,   o: 0.95 },
  fold:   { x: 0,   y: -6,  s: 0.5,  a: 62, sp: -4,  r: 0,   o: 0.9 },
  frame:  { x: 0,   y: 0,   s: 1.75, a: 18, sp: 20,  r: 0,   o: 0.16 },
  drift:  { x: 26,  y: -12, s: 0.62, a: 40, sp: 6,   r: -14, o: 0.55 },
  story:  { x: -26, y: 6,   s: 0.62, a: 14, sp: 12,  r: 10,  o: 0.38 },
  perch:  { x: -28, y: 20,  s: 0.4,  a: 66, sp: -10, r: 0,   o: 0.55 },
  spread: { x: 0,   y: 0,   s: 1.9,  a: 0,  sp: 24,  r: 0,   o: 0.1 },
  close:  { x: 0,   y: -2,  s: 0.95, a: 22, sp: 4,   r: 0,   o: 1 },
};
const KEYS = Object.keys(POSES.hero) as (keyof Pose)[];
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function WingSvg() {
  return (
    <svg viewBox="0 0 1000 593" className="block h-full w-full overflow-visible">
      <g clipPath="url(#wing-clip)">
        <rect width="1000" height="593" fill="url(#wing-grad)" />
        <rect width="1000" height="593" fill="url(#wing-core)" />
        <rect width="1000" height="593" fill="url(#wing-dots)" />
      </g>
      <use href="#wing-motif" fill="none" stroke="var(--color-cloud)" strokeOpacity="0.55" strokeWidth="2" />
    </svg>
  );
}

export function Wings() {
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const st = stage.current;
    if (!st) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rig = st.querySelector<HTMLElement>("[data-rig]")!;
    const wl = st.querySelector<HTMLElement>("[data-wing-l]")!;
    const wr = st.querySelector<HTMLElement>("[data-wing-r]")!;
    const stamp = st.querySelector<HTMLElement>("[data-stamp]")!;
    const aura = st.querySelector<HTMLElement>("[data-aura]")!;

    const cur: Pose = { ...POSES.hero };
    const target: Pose = { ...POSES.hero };

    const secs = gsap.utils.toArray<HTMLElement>("[data-wing]");
    const triggers = secs.map((sec, i) => {
      const a = POSES[sec.dataset.wing!] ?? POSES.hero;
      const next = secs[i + 1];
      const b = next ? POSES[next.dataset.wing!] ?? a : a;
      return ScrollTrigger.create({
        trigger: sec,
        start: "top 50%",
        end: "bottom 50%",
        onUpdate: (self) => {
          if (!self.isActive) return;
          const e = easeInOut(gsap.utils.clamp(0, 1, (self.progress - 0.45) / 0.55));
          KEYS.forEach((k) => (target[k] = a[k] + (b[k] - a[k]) * e));
        },
      });
    });

    const scroller = document.getElementById("scroller");
    let raf = 0;
    const render = (time: number) => {
      KEYS.forEach((k) => (cur[k] += (target[k] - cur[k]) * (reduce ? 1 : 0.085)));
      const flap = reduce ? 0 : Math.sin(time / 900) * 6;
      const w = Math.min(window.innerWidth * 0.46, 640);
      rig.style.setProperty("--w", w + "px");
      rig.style.transform = `translate3d(${cur.x}vw, ${cur.y}vh, 0) rotate(${cur.r}deg) scale(${cur.s})`;
      wr.style.transform = `rotateY(${cur.a + flap}deg) rotateZ(${-cur.sp}deg)`;
      wl.style.transform = `rotateY(${-(cur.a + flap)}deg) rotateZ(${cur.sp}deg)`;
      rig.style.opacity = String(cur.o * (window.innerWidth < 760 ? 0.55 : 1));
      stamp.style.transform = `rotate(${(scroller?.scrollTop ?? 0) * 0.12}deg)`;
      aura.style.opacity = String(0.35 + cur.o * 0.65);
      aura.style.transform = `translate(calc(-50% + ${cur.x * 0.6}vw), calc(-50% + ${cur.y}vh)) scale(${0.7 + cur.s * 0.3})`;
      if (!reduce) raf = requestAnimationFrame(render);
    };
    if (reduce) render(0);
    else raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      triggers.forEach((t) => t.kill());
    };
  }, []);

  return (
    <div
      ref={stage}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden [perspective:1600px]"
      aria-hidden="true"
    >
      <svg width="0" height="0" className="absolute">
        <defs>
          <path id="wing-motif" d={MOTIF} />
          <linearGradient id="wing-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--color-mist)" />
            <stop offset="0.35" stopColor="var(--color-cornflower)" />
            <stop offset="0.75" stopColor="var(--color-cornflower)" />
            <stop offset="1" stopColor="var(--color-steel)" />
          </linearGradient>
          <radialGradient id="wing-core" cx="0.42" cy="0.62" r="0.5">
            <stop offset="0" stopColor="var(--color-night)" stopOpacity="0.75" />
            <stop offset="1" stopColor="var(--color-night)" stopOpacity="0" />
          </radialGradient>
          <pattern id="wing-dots" width="9" height="9" patternUnits="userSpaceOnUse">
            <circle cx="4.5" cy="4.5" r="1.5" fill="var(--color-cloud)" fillOpacity="0.38" />
          </pattern>
          <clipPath id="wing-clip">
            <use href="#wing-motif" />
          </clipPath>
        </defs>
      </svg>

      <div
        data-aura
        className="absolute left-1/2 top-1/2 h-[70vmax] w-[70vmax] -translate-x-1/2 -translate-y-1/2 rounded-full will-change-transform"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--color-cornflower) 40%, transparent) 0%, color-mix(in srgb, var(--color-cornflower) 16%, transparent) 36%, transparent 64%)",
        }}
      />

      <div data-rig className="absolute left-1/2 top-1/2 h-0 w-0 [transform-style:preserve-3d] will-change-transform">
        <div
          data-wing-l
          className="absolute [transform-style:preserve-3d] will-change-transform"
          style={{
            width: "var(--w)",
            height: "calc(var(--w) * 0.593)",
            top: "calc(var(--w) * -0.703)",
            left: "calc(var(--w) * -1)",
            transformOrigin: "100% 70.3%",
          }}
        >
          <div className="h-full w-full [transform:scaleX(-1)]">
            <WingSvg />
          </div>
        </div>
        <div
          data-wing-r
          className="absolute [transform-style:preserve-3d] will-change-transform"
          style={{
            width: "var(--w)",
            height: "calc(var(--w) * 0.593)",
            top: "calc(var(--w) * -0.703)",
            left: 0,
            transformOrigin: "0 70.3%",
          }}
        >
          <WingSvg />
        </div>

        <svg
          data-stamp
          viewBox="0 0 200 200"
          className="absolute will-change-transform"
          style={{
            width: "calc(var(--w) * 0.42)",
            height: "calc(var(--w) * 0.42)",
            left: "calc(var(--w) * -0.21)",
            top: "calc(var(--w) * -0.21)",
          }}
        >
          <defs>
            <path id="wing-ring" d="M100 100 m-78 0 a78 78 0 1 1 156 0 a78 78 0 1 1 -156 0" />
          </defs>
          <text className="eyebrow" style={{ fontSize: 11, fill: "var(--fg)" }}>
            <textPath href="#wing-ring">Venty · made to measure · AI pattern studio · Nº 01 ·</textPath>
          </text>
        </svg>
        <div
          className="absolute -left-[5px] -top-[5px] h-2.5 w-2.5 rounded-full bg-cloud"
          style={{ boxShadow: "0 0 24px 6px color-mix(in srgb, var(--color-cornflower) 90%, transparent)" }}
        />
      </div>
    </div>
  );
}
