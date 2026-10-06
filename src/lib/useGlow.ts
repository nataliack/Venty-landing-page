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
   runs while the field is on screen, and keeps its writes few:
   - a tile's values are written only when they change by a visible amount
   - a tile built from light pieces ([data-fx]) gets their transform and
     opacity, which the GPU applies without repainting anything; otherwise
     --lx, --ly, --g (custom properties inherit, so those restyle the tile)
   - drifting on its own, it updates every other frame (the light moves a
     pixel or two a frame; nobody sees the difference)
   - the bloom behind the tiles, if the field has a [data-glow-bloom]
     element, is moved with a transform (no repaint) instead of --px/--py */

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
    let frame = 0;
    let lastReach = -1;
    const written = new WeakMap<HTMLElement, { lx: number; ly: number; g: number }>();
    const bloom = field.querySelector<HTMLElement>("[data-glow-bloom]");
    // a tile's light pieces ([data-fx]: light, rim, glow, halo), if it has them;
    // the halo may sit beside the tile, in its cell
    type Fx = Partial<Record<"light" | "rim" | "glow" | "halo", HTMLElement>>;
    const fxCache = new WeakMap<HTMLElement, Fx | null>();
    const pieces = (tile: HTMLElement) => {
      if (fxCache.has(tile)) return fxCache.get(tile)!;
      const fx: Fx = {};
      tile.querySelectorAll<HTMLElement>("[data-fx]").forEach((el) => (fx[el.dataset.fx as keyof Fx] = el));
      if (!fx.halo) {
        const h = tile.parentElement?.querySelector<HTMLElement>(":scope > [data-fx=halo]");
        if (h) fx.halo = h;
      }
      const any = Object.keys(fx).length ? fx : null;
      fxCache.set(tile, any);
      return any;
    };
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
      frame++;
      if (idle && started && !reduce && frame % 2) {
        raf = requestAnimationFrame(tick);
        return;
      }
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
        const tx = Math.round(lx - r.left);
        const ty = Math.round(ly - r.top);
        const tg = Math.round(g * 100) / 100;
        const was = written.get(tiles[i]);
        // under a pixel and a hundredth of light: not worth a write
        if (was && Math.abs(was.lx - tx) < 1.5 && Math.abs(was.ly - ty) < 1.5 && was.g === tg) return;
        written.set(tiles[i], { lx: tx, ly: ty, g: tg });
        const fx = pieces(tiles[i]);
        if (fx) {
          // a tile built from pieces: move and fade them (no repaint)
          const at = `translate3d(${tx}px, ${ty}px, 0)`;
          if (fx.light) {
            fx.light.style.transform = at;
            fx.light.style.opacity = String(tg);
          }
          if (fx.rim) fx.rim.style.transform = at;
          if (fx.glow) fx.glow.style.opacity = String(tg);
          if (fx.halo) fx.halo.style.opacity = String(tg);
          return;
        }
        const s = tiles[i].style;
        s.setProperty("--lx", tx + "px");
        s.setProperty("--ly", ty + "px");
        s.setProperty("--g", String(tg));
      });
      if (bloom) bloom.style.transform = `translate3d(${light.x.toFixed(1)}px, ${light.y.toFixed(1)}px, 0)`;
      else {
        field.style.setProperty("--px", light.x.toFixed(1) + "px");
        field.style.setProperty("--py", light.y.toFixed(1) + "px");
      }
      if (Math.round(reach) !== lastReach) {
        lastReach = Math.round(reach);
        field.style.setProperty("--reach", lastReach + "px");
      }

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
