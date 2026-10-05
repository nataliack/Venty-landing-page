"use client";

import { useEffect, useRef } from "react";

/* One light for a field of tiles. Every frame it reads the tile rects,
   eases the light toward its target and writes per-tile variables:
     --lx, --ly  light position relative to the tile, in px
     --g         0..1, how lit the tile is (1 when the light is over it)
   and --px, --py on the field itself for the background bloom.
   The light follows the pointer; with no pointer for a while (or on a
   phone after you lift your finger) it drifts on its own.

   From the lab (src/app/lab/_components/useGlow.ts). On the page it only
   runs while the field is on screen. */

export type GlowOptions = {
  // px falloff distance from a tile's edge, or a function of the tile width
  reach: number | ((tileWidth: number) => number);
  follow: boolean; // false: always drift
  speed?: number; // drift speed multiplier
};

export function useGlow<T extends HTMLElement>(opts: GlowOptions) {
  const ref = useRef<T>(null);
  const live = useRef(opts);
  useEffect(() => {
    live.current = opts;
  });

  useEffect(() => {
    const field = ref.current;
    if (!field) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const light = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let lastPointer = -1e9;
    let started = false;

    const onMove = (e: PointerEvent) => {
      const r = field.getBoundingClientRect();
      target.x = e.clientX - r.left;
      target.y = e.clientY - r.top;
      lastPointer = performance.now();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });

    let raf = 0;
    let onScreen = false;
    const tick = (t: number) => {
      if (!onScreen) {
        raf = 0;
        return;
      }
      const o = live.current;
      const fr = field.getBoundingClientRect();
      const w = fr.width;
      const h = Math.min(fr.height, window.innerHeight);

      // drift: a slow figure of eight over the visible part of the field
      const idle = !o.follow || t - lastPointer > 2600;
      if (idle) {
        const s = (o.speed ?? 1) * 0.00018;
        const top = Math.max(0, -fr.top);
        target.x = w * (0.5 + 0.34 * Math.sin(t * s * 1.3));
        target.y = top + h * (0.5 + 0.3 * Math.sin(t * s * 2.1 + 0.6));
      }
      if (!started) {
        light.x = target.x;
        light.y = target.y;
        started = true;
      }
      const k = reduce ? 1 : idle ? 0.04 : 0.14;
      light.x += (target.x - light.x) * k;
      light.y += (target.y - light.y) * k;

      // read every rect first, then write, so layout runs once a frame
      const tiles = field.querySelectorAll<HTMLElement>("[data-glow]");
      const rects = Array.from(tiles, (el) => el.getBoundingClientRect());
      const lx = fr.left + light.x;
      const ly = fr.top + light.y;
      const reach = typeof o.reach === "number" ? o.reach : o.reach(rects[0]?.width ?? 200);
      rects.forEach((r, i) => {
        const dx = Math.max(r.left - lx, 0, lx - r.right);
        const dy = Math.max(r.top - ly, 0, ly - r.bottom);
        const d = Math.hypot(dx, dy) / reach;
        const g = Math.exp(-d * d * 2.2);
        const s = tiles[i].style;
        s.setProperty("--lx", (lx - r.left).toFixed(1) + "px");
        s.setProperty("--ly", (ly - r.top).toFixed(1) + "px");
        s.setProperty("--g", g.toFixed(3));
      });
      field.style.setProperty("--px", light.x.toFixed(1) + "px");
      field.style.setProperty("--py", light.y.toFixed(1) + "px");
      field.style.setProperty("--reach", reach.toFixed(0) + "px");

      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((e) => {
      onScreen = e[0].isIntersecting;
      if (onScreen && !raf) raf = requestAnimationFrame(tick);
    });
    io.observe(field);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
    };
  }, []);

  return ref;
}
