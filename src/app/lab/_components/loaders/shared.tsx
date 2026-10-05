"use client";

import { useEffect, useRef, useState } from "react";

/* Shared parts for the loader concepts.

   Every concept takes the same props, so any of them can be wired to the
   real page later by swapping the simulated progress for real asset
   progress (fonts, hero video, first images):
     progress  0..1, raw load progress
     onExit    called when the reveal starts (the page can begin its intro)
     onDone    called when the loader is fully gone (unmount it) */

export type LoaderProps = { progress: number; onExit: () => void; onDone: () => void };

export const easeInOutQuart = (t: number) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2);
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));
export const easeInCubic = (t: number) => t ** 3;

export const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* A tween on rAF. Returns a cancel function. */
export function tween(ms: number, ease: (t: number) => number, fn: (v: number) => void, done?: () => void) {
  const t0 = performance.now();
  let raf = 0;
  const step = (t: number) => {
    const k = Math.min(1, (t - t0) / ms);
    fn(ease(k));
    if (k < 1) raf = requestAnimationFrame(step);
    else done?.();
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

/* The number on screen chases the real progress at a capped speed, so a
   fast load still reads (about one second minimum) and a stall never
   jumps. Returns the displayed value, 0..1. */
export function useShown(progress: number, minSeconds = 1.1) {
  const [shown, setShown] = useState(0);
  const target = useRef(progress);
  useEffect(() => {
    target.current = progress;
  }, [progress]);
  useEffect(() => {
    if (reducedMotion()) {
      const id = setInterval(() => setShown(target.current), 100);
      return () => clearInterval(id);
    }
    let raf = 0;
    let last = performance.now();
    let v = 0;
    const step = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const cap = dt / minSeconds;
      v = Math.min(target.current, v + Math.min(cap, (target.current - v) * 0.12 + cap * 0.15));
      setShown(v);
      if (v < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [minSeconds]);
  return shown;
}

/* The end of every loader: when the shown value reaches 1, hold for a
   beat ("hold"), then start the reveal ("exit"): onExit fires, `animate`
   runs the concept's own exit and calls back when it's finished, then
   onDone. Reduced motion skips straight to done. */
export type Phase = "load" | "hold" | "exit";
export function useExit(
  finished: boolean,
  holdMs: number,
  { onExit, onDone }: Pick<LoaderProps, "onExit" | "onDone">,
  animate: (done: () => void) => (() => void) | void,
) {
  const [phase, setPhase] = useState<Phase>("load");
  const cbs = useRef({ onExit, onDone, animate });
  useEffect(() => {
    cbs.current = { onExit, onDone, animate };
  });
  useEffect(() => {
    if (!finished) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase("hold");
    let cancel: (() => void) | void;
    const t = setTimeout(() => {
      setPhase("exit");
      cbs.current.onExit();
      if (reducedMotion()) return cbs.current.onDone();
      cancel = cbs.current.animate(() => cbs.current.onDone());
    }, holdMs);
    return () => {
      clearTimeout(t);
      cancel?.();
    };
  }, [finished, holdMs]);
  return phase;
}

/* Text that decodes in: random glyphs settle into the real characters,
   left to right, when `on` turns true. */
const GLYPHS = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789·/+-";
export function Decode({ text, on, ms = 520, className = "" }: { text: string; on: boolean; ms?: number; className?: string }) {
  const [out, setOut] = useState("");
  useEffect(() => {
    if (!on) return;
    if (reducedMotion()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOut(text);
      return;
    }
    return tween(ms, (t) => t, (k) => {
      const fixed = Math.floor(k * text.length);
      let s = text.slice(0, fixed);
      for (let i = fixed; i < text.length; i++) s += text[i] === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      setOut(s);
    });
  }, [on, text, ms]);
  return (
    <span className={className} aria-hidden="true">
      {on ? out : ""}
    </span>
  );
}

/* What a screen reader hears: one progress bar, no decoration. */
export function SrProgress({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div role="progressbar" aria-label="Loading Venty" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="sr-only">
      {pct}%
    </div>
  );
}

export const pad3 = (n: number) => String(Math.round(n)).padStart(3, "0");
