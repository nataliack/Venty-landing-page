"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Sky } from "./Sky";
import { HERO, heroPoster, preloadHero } from "@/lib/heroSequence";

/* The loading screen: Strip and Tape from the lab, together.

   Behind: the Crown sky, and a cornflower glow along the bottom that builds
   with the load.
   Top: a strip of images of different sizes (no two alike, as no two
   bodies are) glides left along the top edge while the page loads. Near the
   end it eases to a stop with one image centred, the hero's first frame,
   carrying its speed into the stop so nothing jolts.
   Bottom: the measuring tape runs under a cornflower reading line, and the
   reading above it is the load in centimetres, 0.0 to 100.0 cm. Over the
   reading, a line rolls through the steps of making a pattern, then says
   "Measured".

   Then the centred image grows to fill the screen. Its neighbours slide
   aside exactly as far as it widens (they never fade or overlap), and its
   bottom edge pushes the reading and the tape down and away. It lands on
   the hero's first frame (same file, same centred cover crop), so when the
   loader is removed nothing on screen changes: the hero is already there,
   frame for frame, and its opening builds on top (Hero.tsx).

   Progress is real: every frame of the hero sequence, the strip's images
   and the fonts. The previous loader (the zipper) is kept in the lab. */

const THUMBS = Array.from({ length: 17 }, (_, i) => `/loader/reel/${String(i + 1).padStart(2, "0")}.webp`);

// sizes from Jose's frame (px at 1440 wide); the hero frame is the 400 x 223
const SET = [
  { w: 330, h: 184, src: THUMBS[16] },
  { w: 400, h: 223, src: heroPoster, hero: true },
  { w: 242, h: 197, src: THUMBS[11] },
  { w: 257, h: 223, src: THUMBS[5] },
  { w: 354, h: 197, src: THUMBS[7] },
  { w: 300, h: 210, src: THUMBS[13] },
];
const GAP = 10;

// what the line says while it works, then once it is done
const STEPS = ["Taking your measure", "Drafting the pattern", "Adding seam allowance", "Truing the seams", "Marking the notches", "Placing the pieces"];
const DONE = "Measured";
const STEP_MS = 1500;

const MAX_CM = 100; // the reading at 100%
const SPEED = 70; // px per second at 1440 wide, while loading
const HOLD_MS = 650; // the beat at 100 before the frame grows
const GROW_MS = 1500;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const still = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A tween on rAF. Returns a cancel function. */
function tween(ms: number, ease: (t: number) => number, fn: (v: number) => void, done?: () => void) {
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

/** The reading chases the real progress at a capped speed, so a fast load
    still reads and a stall never jumps. 0..1 */
function useShown(progress: number, minSeconds: number) {
  const [shown, setShown] = useState(0);
  const target = useRef(progress);
  useEffect(() => {
    target.current = progress;
  }, [progress]);
  useEffect(() => {
    if (still()) {
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

/** Real progress: the hero's frames, the strip's images and the fonts */
function useLoad() {
  const [p, setP] = useState(0);
  useEffect(() => {
    let hero = 0;
    let heroTotal = HERO.frames;
    let rest = 0;
    const restTotal = THUMBS.length + 1; // the images, and the fonts
    let off = false;
    const update = () => !off && setP(Math.min(1, (hero + rest) / (heroTotal + restTotal)));
    preloadHero((done, total) => {
      hero = done;
      heroTotal = total;
      update();
    }).then(() => {
      hero = heroTotal;
      update();
    });
    for (const src of THUMBS) {
      const im = new Image();
      im.onload = im.onerror = () => {
        rest++;
        update();
      };
      im.src = src;
    }
    document.fonts.ready.then(() => {
      rest++;
      update();
    });
    return () => {
      off = true;
    };
  }, []);
  return p;
}

function useViewport() {
  const [vp, setVp] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return vp;
}

/* The rolling line: every phrase in one grid cell; the current one is in,
   the last one leaves upward, the rest wait below (.announce__roll) */
function Roll({ i, lines }: { i: number; lines: string[] }) {
  const [prev, setPrev] = useState(-1);
  const [cur, setCur] = useState(i);
  if (i !== cur) {
    setPrev(cur);
    setCur(i);
  }
  return (
    <p className="ml-roll">
      <span className="sr-only">{lines[i]}</span>
      {lines.map((t, k) => (
        <span key={t} aria-hidden="true" data-state={k === i ? "in" : k === prev ? "out" : "wait"}>
          {t}
        </span>
      ))}
    </p>
  );
}

export function MeasureLoader() {
  const progress = useLoad();
  const shown = useShown(progress, 2.4);
  const vp = useViewport();
  const [offset, setOffset] = useState(0);
  const [landed, setLanded] = useState(false);
  const [grow, setGrow] = useState(0);
  const [step, setStep] = useState(0);
  const [gone, setGone] = useState(false);
  const [readH, setReadH] = useState(0);
  const read = useRef<HTMLDivElement>(null);
  // the strip drops in once, on arrival; tiles that wrap in later just slide
  const [intro, setIntro] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setIntro(false), 1800);
    return () => clearTimeout(id);
  }, []);
  const motion = useRef({ offset: 0, landing: null as null | { from: number; to: number; v0: number; t0: number; T: number } });
  const shownRef = useRef(shown);
  useEffect(() => {
    shownRef.current = shown;
  });

  const vw = vp?.w ?? 1440;
  const vh = vp?.h ?? 810;
  const k = Math.max(vw / 1440, vw < 768 ? 0.5 : 0.62);
  const items = SET.map((s) => ({ ...s, w: s.w * k, h: s.h * k }));
  const gap = GAP * k;
  const xs: number[] = [];
  let S = 0;
  for (const it of items) {
    xs.push(S);
    S += it.w + gap;
  }
  const heroI = items.findIndex((it) => it.hero);
  const heroC = xs[heroI] + items[heroI].w / 2;

  // the strip: steady while loading; near the end it eases to a stop with
  // the hero frame centred, starting at its current speed (a Hermite curve,
  // so the speed carries into the stop without a jolt)
  useEffect(() => {
    if (!vp) return;
    const v0 = SPEED * k;
    let last = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const m = motion.current;
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (!m.landing) {
        m.offset += v0 * dt;
        if (shownRef.current >= 0.84) {
          const min = m.offset + v0 * 0.8;
          const j = Math.ceil((min - heroC + vw / 2) / S);
          const to = j * S + heroC - vw / 2;
          const T = Math.min(2.4, Math.max(1.3, ((to - m.offset) / v0) * 0.7));
          m.landing = { from: m.offset, to, v0, t0: t, T };
        }
      } else {
        const L = m.landing;
        const s = Math.min(1, (t - L.t0) / 1000 / L.T);
        const D = L.to - L.from;
        const m0 = Math.min(3, (L.v0 * L.T) / D);
        const h = (s ** 3 - 2 * s ** 2 + s) * m0 + (-2 * s ** 3 + 3 * s ** 2);
        m.offset = L.from + D * h;
        if (s >= 1) {
          setOffset(m.offset);
          setLanded(true);
          return;
        }
      }
      setOffset(m.offset);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // the strip's geometry only changes with the screen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vp]);

  // the line rolls through the steps while it works
  const loaded = shown >= 1;
  useEffect(() => {
    if (loaded) return;
    const id = setInterval(() => setStep((n) => (n + 1) % STEPS.length), STEP_MS);
    return () => clearInterval(id);
  }, [loaded]);

  // landed and loaded: a beat, then the frame grows to fill the screen
  const finished = landed && loaded;
  useEffect(() => {
    if (!finished) return;
    let cancel = () => {};
    const t = setTimeout(() => {
      if (still()) return setGone(true);
      cancel = tween(GROW_MS, easeInOutCubic, setGrow, () => setGone(true));
    }, HOLD_MS);
    return () => {
      clearTimeout(t);
      cancel();
    };
  }, [finished]);

  // the reading's height, for how far the growing frame pushes it
  useLayoutEffect(() => {
    if (read.current) setReadH(read.current.offsetHeight);
  }, [vp]);

  if (gone) return null;

  // the tape, near the bottom with room under it
  const tapeH = Math.min(64, Math.max(46, vw * 0.07));
  const lineH = Math.min(120, Math.max(90, vw * 0.12));
  const tapeBottom = Math.max(32, vh * 0.07);
  const above = (lineH - tapeH) / 2 + 9; // the reading line and its marker, above the tape
  const tapeTop = vh - tapeBottom - tapeH - above;
  const readBottom = tapeBottom + tapeH + above + 14;
  const readTop = vh - readBottom - readH;

  // the centred hero frame and how far it has grown
  const hw = items[heroI].w;
  const hh = items[heroI].h;
  const fw = hw + (vw - hw) * grow;
  const fh = hh + (vh - hh) * grow;
  const spread = (fw - hw) / 2; // how far the neighbours step aside
  // its bottom edge pushes the reading and the tape down and away
  const pushRead = Math.max(0, fh + 32 - readTop);
  const pushTape = Math.max(0, fh - tapeTop);

  // copies of the set to cover the screen as it slides
  const tiles: { key: string; x: number; it: (typeof items)[number]; chosen: boolean }[] = [];
  if (vp) {
    const j0 = Math.floor(offset / S) - 1;
    const j1 = Math.ceil((offset + vw) / S) + 1;
    for (let j = j0; j <= j1; j++) {
      items.forEach((it, i) => {
        const x = j * S + xs[i] - offset;
        if (x > vw + 40 || x + it.w < -40) return;
        const chosen = landed && !!it.hero && Math.abs(x + it.w / 2 - vw / 2) < 2;
        tiles.push({ key: `${j}-${i}`, x, it, chosen });
      });
    }
  }

  const cm = Math.min(1, shown) * MAX_CM;
  const lines = [...STEPS, DONE];
  const lineI = loaded ? lines.length - 1 : step;
  const pct = Math.round(Math.min(1, shown) * 100);

  return (
    <div className="loader ml fixed inset-0 z-[100] overflow-hidden">
      <div role="progressbar" aria-label="Loading Venty" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="sr-only">
        {pct}%
      </div>
      <Sky variant="light" />
      {/* a cornflower glow along the bottom that builds with the load */}
      <div className="ml-glow" style={{ opacity: 0.25 + 0.75 * Math.min(1, shown), transform: `translateY(${pushTape}px)` }} aria-hidden="true" />

      {/* the strip */}
      {tiles.map(({ key, x, it, chosen }, idx) => {
        if (chosen) {
          return (
            <div key={key} className="ml-tile" style={{ left: vw / 2 - fw / 2, top: 0, width: fw, height: fh, zIndex: 5 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.src} alt="" draggable={false} />
            </div>
          );
        }
        const side = x + it.w / 2 < vw / 2 ? -1 : 1;
        return (
          <div
            key={key}
            className={`ml-tile ${intro ? "is-in" : ""}`}
            style={{ left: x + side * spread, top: 0, width: it.w, height: it.h, animationDelay: `${idx * 70}ms` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.src} alt="" draggable={false} decoding="async" />
          </div>
        );
      })}

      {/* the reading: the rolling line over the centimetres */}
      <div ref={read} className="ml-read" style={{ bottom: readBottom, transform: `translateY(${pushRead}px)` }}>
        <Roll i={lineI} lines={lines} />
        <p className="ml-cm">
          {cm.toFixed(1)}
          <span>cm</span>
        </p>
      </div>

      {/* the tape: 0 sits under the line at the start, the reading moves left */}
      <div className="ml-tape-wrap" style={{ bottom: tapeBottom, height: tapeH, transform: `translateY(${pushTape}px)` }} aria-hidden="true">
        <div className="ml-tape" style={{ width: `calc(var(--cm) * ${MAX_CM + 30})`, transform: `translateX(calc(var(--cm) * ${-cm}))` }}>
          {Array.from({ length: MAX_CM + 21 }, (_, i) => (
            <span key={i} className={`ml-tape__n ${i % 10 === 0 ? "is-ten" : ""}`} style={{ left: `calc(var(--cm) * ${i})` }}>
              {i === 0 ? "" : i}
            </span>
          ))}
          {/* the hook at 0 */}
          <span className="ml-tape__hook" />
        </div>
        {/* the reading line, with its marker on top */}
        <span className="ml-tape__line" style={{ height: lineH }} />
        <span className="ml-tape__mark" style={{ top: `calc(50% - ${lineH / 2 + 8}px)` }} />
      </div>
    </div>
  );
}
