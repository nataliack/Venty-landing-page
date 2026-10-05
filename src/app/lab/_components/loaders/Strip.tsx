"use client";

import { useEffect, useRef, useState } from "react";
import { heroPoster } from "@/lib/heroSequence";
import { Crown, SrProgress, useExit, useShown, tween, type LoaderProps } from "./shared";

/* Strip (from Jose's Figma frame, 1440 x 810).

   Top: a strip of images of different sizes and shapes (no two alike, as
   no two bodies are) glides left along the top edge while the page loads.
   Near the end it eases to a stop with one image centred, the hero's first
   frame, carrying its speed into the stop so nothing jolts.
   Centre: the percentage in Bigilla, and a line that rolls between the
   steps of making a pattern (the announcement bar's roll).
   Bottom: a ruler of ticks across the full width, fading out at both
   sides. It runs as it measures: the measured side bright, the side still
   to measure dim, ticks swelling round a cornflower index under the number,
   a glow that builds with the load, and a pulse that ripples out at 100.

   Then the centred image grows to fill the screen. Its neighbours slide
   aside exactly as far as it widens (they never fade or overlap), and its
   bottom edge pushes the number, the line and the ruler down and away. It
   lands on the hero's first frame (same file, same centred cover crop).

   Placeholder images until the real set arrives. */

const THUMBS = Array.from({ length: 17 }, (_, i) => `/lab/reel/${String(i + 1).padStart(2, "0")}.webp`);

// sizes from the Figma frame (px at 1440 wide); the hero frame is the 400 x 223
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
const STEPS = ["Measuring", "Drafting the pattern", "Adding seam allowance", "Truing the seams", "Marking the notches", "Placing the pieces"];
const DONE = "Ready to sew";
const STEP_MS = 1500;

const SPEED = 70; // px per second at 1440 wide, while loading
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

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

/* The rolling line: every phrase sits in one grid cell; the current one is
   in, the last one leaves upward, the next waits below (.announce__roll) */
function Roll({ i, lines }: { i: number; lines: string[] }) {
  // the one that just left rolls out above; everything else waits below,
  // so the roll always runs upward, even as it loops round
  const [prev, setPrev] = useState(-1);
  const [cur, setCur] = useState(i);
  if (i !== cur) {
    setPrev(cur);
    setCur(i);
  }
  return (
    <p className="ld-roll2">
      <span className="sr-only">{lines[i]}</span>
      {lines.map((t, k) => (
        <span key={t} aria-hidden="true" data-state={k === i ? "in" : k === prev ? "out" : "wait"}>
          {t}
        </span>
      ))}
    </p>
  );
}

/* The ruler, drawn on one canvas each frame */
function Ruler({ shown, push, pulseAt, vw }: { shown: number; push: number; pulseAt: number | null; vw: number }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const live = useRef({ shown, pulseAt });
  useEffect(() => {
    live.current = { shown, pulseAt };
  });

  useEffect(() => {
    const c = cv.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const H = 96;
    c.width = Math.round(vw * dpr);
    c.height = Math.round(H * dpr);
    const pitch = vw < 768 ? 11 : 13; // 12px gap + the 1px line, as the frame
    const t0 = performance.now();
    let raf = 0;
    const draw = (t: number) => {
      const { shown: p, pulseAt: pa } = live.current;
      const secs = (t - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, vw, H);
      const cx = vw / 2;
      // the tape runs as it measures, with a slow drift so it never sits dead
      const run = p * 120 * pitch + secs * 6;
      const first = Math.floor((run - cx) / pitch) - 1;
      const last = Math.ceil((run + cx) / pitch) + 1;
      for (let n = first; n <= last; n++) {
        const x = cx + n * pitch - run;
        const long = n % 5 === 0;
        const d = (x - cx) / (vw * 0.11);
        const swell = Math.exp(-d * d);
        let lift = 1 + 0.6 * swell;
        if (pa !== null) {
          // the 100 pulse: a ripple travelling out from the index
          const age = (t - pa) / 1000;
          const r = age * vw * 0.9;
          const k = (Math.abs(x - cx) - r) / 40;
          lift += 0.7 * Math.exp(-k * k) * Math.max(0, 1 - age / 1.4);
        }
        const h = (long ? 44 : 26) * lift;
        const measured = x < cx;
        ctx.fillStyle = measured
          ? `rgba(239, 244, 255, ${0.75 + 0.25 * swell})`
          : `rgba(192, 200, 219, ${0.3 + 0.35 * swell})`;
        ctx.fillRect(Math.round(x), H - h, 1, h);
      }
      // the index under the number
      ctx.shadowColor = "#687ef5";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#687ef5";
      ctx.fillRect(Math.round(cx) - 1, H - 74, 2, 74);
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [vw]);

  return (
    <div className="ld-ruler2" style={{ transform: `translateY(${push}px)` }} aria-hidden="true">
      <canvas ref={cv} style={{ width: vw, height: 96 }} />
    </div>
  );
}

export function Strip({ progress, onExit, onDone }: LoaderProps) {
  const shown = useShown(progress, 2.4);
  const vp = useViewport();
  const [offset, setOffset] = useState(0);
  const [landed, setLanded] = useState(false);
  const [grow, setGrow] = useState(0);
  const [step, setStep] = useState(0);
  const [pulseAt, setPulseAt] = useState<number | null>(null);
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
        // h(s): start slope m0, end slope 0
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

  const finished = landed && shown >= 1;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (finished) setPulseAt(performance.now());
  }, [finished]);

  useExit(finished, 650, { onExit, onDone }, (end) => tween(1500, easeInOutCubic, setGrow, end));

  if (!vp)
    return (
      <div className="ld">
        <SrProgress value={shown} />
        <Crown />
      </div>
    );

  // the centred hero frame and how far it has grown
  const hw = items[heroI].w;
  const hh = items[heroI].h;
  const fw = hw + (vw - hw) * grow;
  const fh = hh + (vh - hh) * grow;
  const spread = (fw - hw) / 2; // how far the neighbours step aside

  // copies of the set to cover the screen as it slides
  const j0 = Math.floor(offset / S) - 1;
  const j1 = Math.ceil((offset + vw) / S) + 1;
  const tiles: { key: string; x: number; it: (typeof items)[number]; chosen: boolean }[] = [];
  for (let j = j0; j <= j1; j++) {
    items.forEach((it, i) => {
      const x = j * S + xs[i] - offset;
      if (x > vw + 40 || x + it.w < -40) return;
      const chosen = landed && !!it.hero && Math.abs(x + it.w / 2 - vw / 2) < 2;
      tiles.push({ key: `${j}-${i}`, x, it, chosen });
    });
  }

  // the readout and the line sit under the strip; the frame's bottom edge pushes them
  const phone = vw < 768;
  const numTop = vh * (phone ? 0.66 : 0.72);
  const pushNum = Math.max(0, fh + 32 - numTop);
  const rulerTop = vh - 96;
  const pushRuler = Math.max(0, fh - rulerTop);
  const pct = Math.round(Math.min(1, shown) * 100);
  const lines = [...STEPS, DONE];
  const lineI = loaded ? lines.length - 1 : step;

  return (
    <div className="ld">
      <SrProgress value={shown} />
      <Crown style={{ opacity: 1 - Math.max(0, (grow - 0.8) / 0.2) }} />
      {/* a cornflower glow along the bottom that builds with the load */}
      <div className="ld-glow2" style={{ opacity: 0.25 + 0.75 * Math.min(1, shown), transform: `translateY(${pushRuler}px)` }} aria-hidden="true" />

      {/* the strip */}
      {tiles.map(({ key, x, it, chosen }, idx) => {
        if (chosen) {
          return (
            <div key={key} className="ld-tile" style={{ left: vw / 2 - fw / 2, top: 0, width: fw, height: fh, zIndex: 5 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.src} alt="" draggable={false} />
            </div>
          );
        }
        const side = x + it.w / 2 < vw / 2 ? -1 : 1;
        return (
          <div
            key={key}
            className={`ld-tile ${intro ? "is-in" : ""}`}
            style={{ left: x + side * spread, top: 0, width: it.w, height: it.h, animationDelay: `${idx * 70}ms` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.src} alt="" draggable={false} decoding="async" />
          </div>
        );
      })}

      {/* the readout */}
      <div className="absolute inset-x-0 text-center text-[var(--cloud)]" style={{ top: numTop, transform: `translateY(${pushNum}px)` }}>
        <p className="ld-pct">
          {pct}
          <span>%</span>
        </p>
        <Roll i={lineI} lines={lines} />
      </div>

      <Ruler shown={Math.min(1, shown)} push={pushRuler} pulseAt={pulseAt} vw={vw} />
    </div>
  );
}
