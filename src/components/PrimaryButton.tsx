"use client";

import { useEffect, useRef } from "react";

/* Primary pill from the Figma Button/Pill component.
   Layers, back to front:
   1. cornflower fill with the inset cloud glow (CSS)
   2. dots on a canvas. Each dot has a home on a 5px grid, fades toward the
      rim like the Figma mask, and is physically pushed away from the pointer
      while hovering, springing back afterwards
   3. a 1.6px steel outline ring drawn as a conic gradient, so it reads as
      two highlights at top-left and bottom-right. On hover the gradient
      angle turns so the highlights trade places
   4. the label */

const GRID = 5;
const RADIUS = 34; // px, pointer influence
const PUSH = 14; // px, max displacement
const SPRING = 0.12;
const DAMP = 0.78;

type Dot = { hx: number; hy: number; x: number; y: number; vx: number; vy: number; a: number };

export function PrimaryButton({
  href,
  children,
  size = "md",
  className = "",
  trailing,
}: {
  href: string;
  children: React.ReactNode;
  size?: "md" | "sm";
  className?: string;
  trailing?: React.ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = ref.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const ctx = canvas.getContext("2d")!;
    const cloud = getComputedStyle(el).getPropertyValue("--color-cloud").trim() || "#eff4ff";

    let dots: Dot[] = [];
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let hovering = false;
    let px = -1000;
    let py = -1000;
    let strength = 0; // 0 at rest, 1 while hovered, eased

    const build = () => {
      const r = el.getBoundingClientRect();
      w = Math.round(r.width);
      h = Math.round(r.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      const cx = w / 2;
      const cy = h / 2;
      for (let y = GRID / 2; y < h; y += GRID) {
        for (let x = GRID / 2; x < w; x += GRID) {
          // radial fade, 1 at centre to 0 at the rim, like the Figma mask
          const d = Math.hypot((x - cx) / (w / 2), (y - cy) / (h / 2));
          const a = Math.max(0, 1 - d);
          if (a > 0.02) dots.push({ hx: x, hy: y, x, y, vx: 0, vy: 0, a });
        }
      }
      draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = cloud;
      const base = 0.28 + 0.47 * strength; // 0.28 at rest, 0.75 hovered
      for (const d of dots) {
        ctx.globalAlpha = base * d.a;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const step = () => {
      let moving = false;
      strength += ((hovering ? 1 : 0) - strength) * 0.12;
      if (Math.abs((hovering ? 1 : 0) - strength) > 0.005) moving = true;
      for (const d of dots) {
        let fx = 0;
        let fy = 0;
        if (hovering) {
          const dx = d.hx - px;
          const dy = d.hy - py;
          const dist = Math.hypot(dx, dy);
          if (dist < RADIUS && dist > 0.01) {
            const f = (1 - dist / RADIUS) * PUSH;
            fx = (dx / dist) * f;
            fy = (dy / dist) * f;
          }
        }
        // spring toward home plus push
        const tx = d.hx + fx;
        const ty = d.hy + fy;
        d.vx = (d.vx + (tx - d.x) * SPRING) * DAMP;
        d.vy = (d.vy + (ty - d.y) * SPRING) * DAMP;
        d.x += d.vx;
        d.y += d.vy;
        if (Math.abs(d.vx) > 0.02 || Math.abs(d.vy) > 0.02 || Math.abs(tx - d.x) > 0.05) moving = true;
      }
      draw();
      if (moving || hovering) raf = requestAnimationFrame(step);
      else raf = 0;
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(step);
    };
    const onEnter = (e: PointerEvent) => {
      hovering = true;
      onMove(e);
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      // the pill is scaled on hover, map pointer into unscaled canvas space
      px = ((e.clientX - r.left) / r.width) * w;
      py = ((e.clientY - r.top) / r.height) * h;
      kick();
    };
    const onLeave = () => {
      hovering = false;
      px = -1000;
      py = -1000;
      kick();
    };

    build();
    const ro = new ResizeObserver(build);
    ro.observe(el);
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <a ref={ref} href={href} className={`btn-primary ${size === "sm" ? "is-small" : ""} ${className}`}>
      <canvas ref={canvasRef} className="btn-primary__dots" aria-hidden="true" />
      <span className="btn-primary__ring" aria-hidden="true" />
      <span className="btn-primary__label">{children}</span>
      {trailing}
    </a>
  );
}
