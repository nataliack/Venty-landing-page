"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Sky } from "./Sky";
import { ZIP, holePolygon, type Orient } from "@/lib/zipper";

/* The loader. The page starts fully covered by cloth (the dark sky) with
   the zipper closed over it. Frames of the rendered zipper load in order;
   each loaded frame moves the slider down and the matching V is cut out
   of the cloth, so the page behind is revealed as the zipper opens.
   At 100% the last frames sweep the cloth off and the overlay fades.

   Layers, back to front: cloth (Sky with clip-path hole), canvas with the
   rendered hardware frame, shade band, progress line, percentage.

   `loop` (the /loader page) replays forever instead of finishing. */
export function Loader({ loop = false, onDone }: { loop?: boolean; onDone?: () => void }) {
  const [pct, setPct] = useState(0);
  const [gone, setGone] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const cloth = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const fill = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const cv = canvas.current;
    const clothEl = cloth.current;
    if (!el || !cv || !clothEl) return;

    // viewport is measured once; height changes from browser bars are ignored
    let vw = window.innerWidth;
    let vh = window.innerHeight;
    const orient: Orient = vw / vh > 0.75 ? "landscape" : "portrait";
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const ctx = cv.getContext("2d")!;
    const size = () => {
      cv.width = Math.round(vw * dpr);
      cv.height = Math.round(vh * dpr);
      cv.style.width = vw + "px";
      cv.style.height = vh + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const onResize = () => {
      // only react to width changes (orientation, window), not bar collapse
      if (Math.abs(window.innerWidth - vw) < 2) return;
      vw = window.innerWidth;
      vh = window.innerHeight;
      size();
      show(current);
    };
    window.addEventListener("resize", onResize);

    const frames: (ImageBitmap | HTMLImageElement | null)[] = new Array(ZIP.frames).fill(null);
    let current = 1;
    let shown = 0;

    const show = (f: number) => {
      const img = frames[f - 1];
      if (!img) return;
      const fr = ZIP[orient];
      const scale = Math.max(vw / fr.w, vh / fr.h);
      const dw = fr.w * scale;
      const dh = fr.h * scale;
      ctx.clearRect(0, 0, vw, vh);
      ctx.drawImage(img, (vw - dw) / 2, (vh - dh) / 2, dw, dh);
      clothEl.style.clipPath = holePolygon(f, orient, vw, vh);
      shown = f;
    };

    // ease the displayed frame toward the latest loaded one
    const state = { f: 1 };
    const seek = (target: number, dur = 0.6) =>
      gsap.to(state, {
        f: target,
        duration: dur,
        ease: "power2.out",
        overwrite: true,
        onUpdate: () => {
          const f = Math.round(state.f);
          if (f !== shown && frames[f - 1]) show(f);
        },
      });

    // bar animations
    const ctxG = gsap.context(() => {
      gsap.to("[data-head]", { opacity: 0.55, duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.fromTo("[data-pulse]", { xPercent: -100, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 1.6, ease: "power2.in", repeat: -1, repeatDelay: 0.5 });
    }, el);

    // load frames in order, four at a time. progress = frames decoded.
    let cancelled = false;
    const load = async (i: number) => {
      const url = `/loader/zip/${orient}/zip_${String(i).padStart(3, "0")}.webp`;
      const res = await fetch(url);
      const blob = await res.blob();
      const bmp = "createImageBitmap" in window ? await createImageBitmap(blob) : await new Promise<HTMLImageElement>((ok) => {
        const im = new Image();
        im.onload = () => ok(im);
        im.src = URL.createObjectURL(blob);
      });
      frames[i - 1] = bmp;
    };

    const run = async () => {
      // the hero image is part of the load too
      const extras = [fetch("/hero/maniki.webp").then((r) => r.blob())];
      const total = ZIP.frames + extras.length;
      let done = 0;
      const bump = () => {
        done++;
        const p = Math.round((done / total) * 100);
        setPct(p);
        if (fill.current) gsap.to(fill.current, { width: `${p}%`, duration: 0.5, ease: "power3.out", overwrite: true });
        // advance to the latest contiguous frame, but hold the final sweep
        // (last 14%) for the finish
        let latest = 0;
        while (latest < ZIP.frames && frames[latest]) latest++;
        const cap = Math.floor(ZIP.frames * 0.86);
        const target = Math.max(1, Math.min(latest, cap));
        if (target !== current) {
          current = target;
          seek(current);
        }
      };
      extras.forEach((p) => p.then(bump));
      const queue = Array.from({ length: ZIP.frames }, (_, k) => k + 1);
      const worker = async () => {
        while (queue.length && !cancelled) {
          const i = queue.shift()!;
          try {
            await load(i);
          } catch {
            /* a missing frame is skipped; the nearest loaded one shows */
          }
          bump();
        }
      };
      await Promise.all([worker(), worker(), worker(), worker()]);
      await Promise.all(extras);
      if (cancelled) return;

      // finish: play out to the last frame, then fade the whole overlay
      await new Promise<void>((ok) => {
        gsap.to(state, {
          f: ZIP.frames,
          duration: 1.4,
          ease: "power2.inOut",
          overwrite: true,
          onUpdate: () => {
            const f = Math.round(state.f);
            if (f !== shown && frames[f - 1]) show(f);
          },
          onComplete: ok,
        });
      });
      if (loop) {
        await new Promise((r) => setTimeout(r, 900));
        if (cancelled) return;
        state.f = 1;
        current = 1;
        setPct(0);
        if (fill.current) gsap.set(fill.current, { width: 0 });
        show(1);
        // replay: step through the loaded frames on a timeline
        let k = 1;
        const tick = () => {
          if (cancelled) return;
          k++;
          const cap = Math.floor(ZIP.frames * 0.86);
          if (k <= cap) {
            setPct(Math.round((k / ZIP.frames) * 100));
            if (fill.current) gsap.to(fill.current, { width: `${Math.round((k / ZIP.frames) * 100)}%`, duration: 0.3, overwrite: true });
            show(k);
            setTimeout(tick, 90);
          } else {
            setPct(100);
            if (fill.current) gsap.to(fill.current, { width: "100%", duration: 0.4, overwrite: true });
            gsap.to(state, { f: ZIP.frames, duration: 1.4, ease: "power2.inOut", onUpdate: () => show(Math.round(state.f)), onComplete: () => setTimeout(() => { state.f = 1; show(1); setPct(0); if (fill.current) gsap.set(fill.current, { width: 0 }); k = 1; setTimeout(tick, 400); }, 900) });
          }
        };
        setTimeout(tick, 400);
        return;
      }
      gsap.to(el, {
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => {
          setGone(true);
          onDone?.();
        },
      });
    };
    run();

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      ctxG.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone) return null;

  return (
    <div ref={root} className="loader fixed inset-0 z-[100] overflow-hidden">
      {/* the cloth: the dark sky, with the opening clipped out */}
      <div ref={cloth} className="absolute inset-0">
        <Sky variant="loader" />
      </div>

      {/* the rendered hardware */}
      <canvas ref={canvas} className="loader__canvas" aria-hidden="true" />

      <div className="loader__shade" aria-hidden="true" />

      <div className="loader__bar">
        <div className="loader__track">
          <div ref={fill} className="loader__fill" style={{ width: 0 }}>
            <span data-pulse className="loader__pulse" />
            <span data-head className="loader__head" />
          </div>
        </div>
        <p className="loader__pct font-display tabular-nums">
          {pct}
          <span className="loader__pctsign">%</span>
        </p>
      </div>
    </div>
  );
}
