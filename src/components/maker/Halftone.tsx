"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* A portrait redrawn as a halftone of dots, the same dots as the button and
   the wings. They gather from a scatter when it comes into view and lean
   away from the pointer. A small photo is enough: it is sampled at one dot
   every few px. (From the earlier Meet the maker section.) */

const COLOURS = ["#eff4ff", "#9daccd", "#687ef5"]; // light, mid, dark
const STEP = 5; // px between dot centres
const RADIUS = 60; // pointer influence
const PUSH = 18;

type Dot = { hx: number; hy: number; x: number; y: number; vx: number; vy: number; r: number; c: string };

export function Halftone({ src, label }: { src: string; label: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = wrap.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const g = canvas.getContext("2d")!;
    const img = new Image();
    let dots: Dot[] = [];
    let w = 0;
    let h = 0;
    let raf = 0;
    let px = -1e4;
    let py = -1e4;
    let gathered = false;

    const build = () => {
      if (!img.complete || !img.naturalWidth) return;
      w = el.clientWidth;
      h = el.clientHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cols = Math.floor(w / STEP);
      const rows = Math.floor(h / STEP);
      if (cols < 1 || rows < 1) return; // not laid out yet; the observer calls again
      const off = document.createElement("canvas");
      off.width = cols;
      off.height = rows;
      const o = off.getContext("2d", { willReadFrequently: true })!;
      // cover-fit the photo into the sample grid
      const s = Math.max(cols / img.naturalWidth, rows / img.naturalHeight);
      o.drawImage(img, (cols - img.naturalWidth * s) / 2, (rows - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
      const data = o.getImageData(0, 0, cols, rows).data;
      // the photo is dark, so stretch its levels to the full range first
      const lums = new Float32Array(cols * rows);
      let lo = 1;
      let hi = 0;
      for (let k = 0; k < lums.length; k++) {
        const l = (0.299 * data[k * 4] + 0.587 * data[k * 4 + 1] + 0.114 * data[k * 4 + 2]) / 255;
        lums[k] = l;
        lo = Math.min(lo, l);
        hi = Math.max(hi, l);
      }
      const prev = dots;
      dots = [];
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const lum = (lums[j * cols + i] - lo) / Math.max(0.01, hi - lo);
          const r = Math.pow(lum, 0.8) * STEP * 0.6;
          if (r < 0.6) continue;
          const hx = i * STEP + STEP / 2;
          const hy = j * STEP + STEP / 2;
          const c = lum > 0.6 ? COLOURS[0] : lum > 0.35 ? COLOURS[1] : COLOURS[2];
          const p = prev[dots.length];
          dots.push({ hx, hy, x: p ? p.x : hx, y: p ? p.y : hy, vx: 0, vy: 0, r, c });
        }
      }
      if (!gathered) for (const d of dots) {
        d.x = gsap.utils.random(-w * 0.3, w * 1.3);
        d.y = gsap.utils.random(-h * 0.3, h * 1.3);
      }
      draw();
    };

    // one path per colour (three fills a frame, not one per dot)
    const draw = () => {
      g.clearRect(0, 0, w, h);
      for (const c of COLOURS) {
        g.fillStyle = c;
        g.beginPath();
        for (const d of dots) {
          if (d.c !== c) continue;
          g.moveTo(d.x + d.r, d.y);
          g.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        }
        g.fill();
      }
    };

    const step = () => {
      let moving = false;
      const spring = gathered ? 0.08 : 0;
      for (const d of dots) {
        let tx = d.hx;
        let ty = d.hy;
        const dx = d.hx - px;
        const dy = d.hy - py;
        const dist = Math.hypot(dx, dy);
        if (dist < RADIUS && dist > 0.01) {
          const f = (1 - dist / RADIUS) * PUSH;
          tx += (dx / dist) * f;
          ty += (dy / dist) * f;
        }
        d.vx = (d.vx + (tx - d.x) * spring) * 0.82;
        d.vy = (d.vy + (ty - d.y) * spring) * 0.82;
        d.x += d.vx;
        d.y += d.vy;
        if (Math.abs(tx - d.x) > 0.1 || Math.abs(ty - d.y) > 0.1) moving = true;
      }
      draw();
      raf = moving ? requestAnimationFrame(step) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(step);
    };

    const gather = () => {
      if (gathered) return;
      gathered = true;
      if (reduce) {
        for (const d of dots) {
          d.x = d.hx;
          d.y = d.hy;
        }
        draw();
      } else kick();
    };

    const onMove = (e: PointerEvent) => {
      if (reduce || !gathered) return;
      const r = el.getBoundingClientRect();
      px = e.clientX - r.left;
      py = e.clientY - r.top;
      kick();
    };
    const onLeave = () => {
      if (!gathered) return;
      px = py = -1e4;
      kick();
    };

    img.onload = build;
    img.src = src;
    const ro = new ResizeObserver(build);
    ro.observe(el);
    const st = ScrollTrigger.create({ trigger: el, start: "top 75%", onEnter: gather, onEnterBack: gather });
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      st.kill();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [src]);

  return (
    <div ref={wrap} className="mk-tone">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" role="img" aria-label={label} />
    </div>
  );
}
