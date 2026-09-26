"use client";

import { useEffect, useId, useRef } from "react";

/* Primary pill from the Figma Button/Pill component.
   Layers, back to front:
   1. cornflower fill with the inset cloud glow (CSS)
   2. dots on a canvas. Each has a home on a 5px grid, fades toward the rim
      like the Figma mask, and is nudged away from the pointer while
      hovering, springing back afterwards
   3. a 1.6px stroke exactly on the edge, drawn as an SVG rect in pixels.
      Its stroke is a gradient: cloud at the top-left and bottom-right,
      transparent between, so it reads as two highlights. On hover the
      gradient rotates half a turn so the highlights trade places
   4. the label, one span per letter for the hover ripple */

const GRID = 5;
const RADIUS = 26; // px, pointer influence
const PUSH = 5; // px, max nudge
const SPRING = 0.12;
const DAMP = 0.78;
const STROKE = 1.6;

type Dot = { hx: number; hy: number; x: number; y: number; vx: number; vy: number; a: number };

export function PrimaryButton({
  href,
  children,
  size = "md",
  className = "",
  trailing,
}: {
  href: string;
  children: string;
  size?: "md" | "sm";
  className?: string;
  trailing?: React.ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gradId = useId();

  useEffect(() => {
    const el = ref.current;
    const canvas = canvasRef.current;
    const svg = svgRef.current;
    if (!el || !canvas || !svg) return;
    const ctx = canvas.getContext("2d")!;
    const rect = svg.querySelector("rect")!;
    const grad = svg.querySelector("linearGradient")!;
    const cloud = getComputedStyle(el).getPropertyValue("--color-cloud").trim() || "#eff4ff";

    let dots: Dot[] = [];
    let w = 0;
    let h = 0;
    let raf = 0;
    let hovering = false;
    let px = -1000;
    let py = -1000;
    let strength = 0; // eased 0..1 hover amount
    let angle = 0; // eased gradient rotation, 0 or 180

    const build = () => {
      // unscaled size: the pill scales on hover, so use offset dimensions
      w = el.offsetWidth;
      h = el.offsetHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // stroke exactly on the edge: inset by half the stroke width
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      rect.setAttribute("x", String(STROKE / 2));
      rect.setAttribute("y", String(STROKE / 2));
      rect.setAttribute("width", String(w - STROKE));
      rect.setAttribute("height", String(h - STROKE));
      rect.setAttribute("rx", String((h - STROKE) / 2));

      dots = [];
      const cx = w / 2;
      const cy = h / 2;
      for (let y = GRID / 2; y < h; y += GRID) {
        for (let x = GRID / 2; x < w; x += GRID) {
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
      const base = 0.28 + 0.47 * strength;
      for (const d of dots) {
        ctx.globalAlpha = base * d.a;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      grad.setAttribute("gradientTransform", `rotate(${angle} 0.5 0.5)`);
    };

    const step = () => {
      let moving = false;
      const target = hovering ? 1 : 0;
      strength += (target - strength) * 0.12;
      if (Math.abs(target - strength) > 0.005) moving = true;
      const targetAngle = hovering ? 180 : 0;
      angle += (targetAngle - angle) * 0.08;
      if (Math.abs(targetAngle - angle) > 0.1) moving = true;
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
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      px = ((e.clientX - r.left) / r.width) * w;
      py = ((e.clientY - r.top) / r.height) * h;
      kick();
    };
    const onEnter = (e: PointerEvent) => {
      hovering = true;
      onMove(e);
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

  const letters = Array.from(children);

  return (
    <a ref={ref} href={href} className={`btn-primary ${size === "sm" ? "is-small" : ""} ${className}`}>
      <canvas ref={canvasRef} className="btn-primary__dots" aria-hidden="true" />
      <svg ref={svgRef} className="btn-primary__edge" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(0 0.5 0.5)">
            <stop offset="0" stopColor="var(--color-cloud)" />
            <stop offset="0.32" stopColor="var(--color-cloud)" stopOpacity="0" />
            <stop offset="0.68" stopColor="var(--color-cloud)" stopOpacity="0" />
            <stop offset="1" stopColor="var(--color-cloud)" />
          </linearGradient>
        </defs>
        <rect fill="none" stroke={`url(#${gradId})`} strokeWidth={STROKE} />
      </svg>
      <span className="btn-primary__label" aria-label={children}>
        {letters.map((ch, i) => (
          <span key={i} className="btn-primary__ch" style={{ "--i": i } as React.CSSProperties} aria-hidden="true">
            {ch === " " ? " " : ch}
          </span>
        ))}
      </span>
      {trailing}
    </a>
  );
}
