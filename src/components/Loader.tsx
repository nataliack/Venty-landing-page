"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Sky } from "./Sky";
import { HERO, preloadHero } from "@/lib/heroSequence";
import { ZIP, holePolygon, type Orient } from "@/lib/zipper";

/* The loader, two phases.

   1. Loading. The page is fully covered: the dark sky as cloth, the zipper
      closed over it (frame 1), the progress line and percentage in front
      with a soft shade behind them. Every frame of the sequence and the
      hero image are fetched and decoded; the bar tracks that.
   2. Unzip. The bar and its shade dissolve. The zipper plays from closed
      to open in one smooth take from memory, and the matching V is cut out
      of the cloth each frame so the page shows through. When the cloth has
      swept off, the overlay is removed.

   Layers, back to front: cloth (Sky with clip-path hole), canvas with the
   rendered hardware frame, shade, progress line, percentage.
   `loop` (the /loader page) replays instead of finishing. */

const UNZIP_SECONDS = 3.4;

export function Loader({ loop = false, onDone }: { loop?: boolean; onDone?: () => void }) {
  const [pct, setPct] = useState(0);
  const [gone, setGone] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const cloth = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const hud = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const cv = canvas.current;
    const clothEl = cloth.current;
    const hudEl = hud.current;
    if (!el || !cv || !clothEl || !hudEl) return;

    // viewport measured once; height changes from browser bars are ignored
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

    const frames: (ImageBitmap | HTMLImageElement | null)[] = new Array(ZIP.frames).fill(null);
    let shown = 0;
    const show = (f: number) => {
      // nearest loaded frame at or below f
      let k = f;
      while (k > 1 && !frames[k - 1]) k--;
      const img = frames[k - 1];
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
    const onResize = () => {
      if (Math.abs(window.innerWidth - vw) < 2) return;
      vw = window.innerWidth;
      vh = window.innerHeight;
      size();
      show(shown || 1);
    };
    window.addEventListener("resize", onResize);

    // bar motion
    const ctxG = gsap.context(() => {
      gsap.to("[data-head]", { opacity: 0.55, duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.fromTo("[data-pulse]", { xPercent: -100, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 1.6, ease: "power2.in", repeat: -1, repeatDelay: 0.5 });
    }, el);

    let cancelled = false;
    const decode = async (blob: Blob) =>
      "createImageBitmap" in window
        ? createImageBitmap(blob)
        : new Promise<HTMLImageElement>((ok) => {
            const im = new Image();
            im.onload = () => ok(im);
            im.src = URL.createObjectURL(blob);
          });
    const loadFrame = async (i: number) => {
      const res = await fetch(`/loader/zip/${orient}/zip_${String(i).padStart(3, "0")}.webp`);
      if (!res.ok) throw new Error(String(res.status));
      frames[i - 1] = await decode(await res.blob());
    };

    const setProgress = (p: number) => {
      setPct(p);
      if (fill.current) gsap.to(fill.current, { width: `${p}%`, duration: 0.5, ease: "power3.out", overwrite: true });
    };

    const unzip = () =>
      new Promise<void>((ok) => {
        const st = { f: 1 };
        gsap.to(st, {
          f: ZIP.frames,
          duration: UNZIP_SECONDS,
          ease: "power2.inOut",
          onUpdate: () => {
            const f = Math.round(st.f);
            if (f !== shown) show(f);
          },
          onComplete: ok,
        });
      });

    const run = async () => {
      // phase 1: load. frame 1 first so the closed zipper is on screen early
      const total = ZIP.frames + HERO.frames;
      let done = 0;
      const bump = () => setProgress(Math.round((++done / total) * 100));
      try {
        await loadFrame(1);
      } catch {
        /* no first frame yet; the cloth alone covers the page */
      }
      show(1);
      bump();
      // the hero video frames download behind the loader, one step per frame
      const hero = preloadHero(() => bump());
      const queue = Array.from({ length: ZIP.frames - 1 }, (_, k) => k + 2);
      const worker = async () => {
        while (queue.length && !cancelled) {
          const i = queue.shift()!;
          try {
            await loadFrame(i);
          } catch {
            /* missing frame: the nearest loaded one is shown in its place */
          }
          bump();
        }
      };
      await Promise.all([worker(), worker(), worker(), worker(), hero]);
      if (cancelled) return;
      setProgress(100);

      const cycle = async () => {
        // phase 2: the bar and shade dissolve, then the zipper opens
        await gsap.to(hudEl, { opacity: 0, y: -6, duration: 0.7, ease: "power2.inOut" }).then();
        await new Promise((r) => setTimeout(r, 150));
        if (cancelled) return;
        await unzip();
        if (cancelled) return;
        if (loop) {
          await new Promise((r) => setTimeout(r, 1200));
          if (cancelled) return;
          show(1);
          gsap.set(hudEl, { opacity: 1, y: 0 });
          await new Promise((r) => setTimeout(r, 700));
          if (cancelled) return;
          return cycle();
        }
        gsap.to(el, {
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
          onComplete: () => {
            setGone(true);
            onDone?.();
          },
        });
      };
      await new Promise((r) => setTimeout(r, 350));
      if (!cancelled) cycle();
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
      <div ref={cloth} className="absolute inset-0">
        <Sky variant="loader" />
      </div>
      <canvas ref={canvas} className="loader__canvas" aria-hidden="true" />

      {/* the HUD: shade, line and number. Dissolves before the unzip. */}
      <div ref={hud} className="absolute inset-0 z-[3]">
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
    </div>
  );
}
