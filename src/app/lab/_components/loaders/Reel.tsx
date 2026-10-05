"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { heroPoster } from "@/lib/heroSequence";
import { Crown, Decode, SrProgress, easeInOutQuart, easeOutExpo, pad3, tween, useExit, useShown, type LoaderProps } from "./shared";

/* Reel: a film of frames moves around a viewfinder on Crown while the
   page loads; at 100 the viewfinder has "selected" one frame, the hero's
   first frame. The brackets lock onto it, the rest fade away, and it grows
   to fill the screen, landing exactly on the hero's own first frame (same
   file, same centred cover crop), so the hand-off is invisible.

   Three ways for the frames to move, none of them a vertical column:
     orbit   frames ride a tilted 3D ring around the viewfinder; the spin
             slows as the load completes and lands on the hero frame
     drift   a lightboard of scattered frames at different depths pans with
             parallax; the hero frame drifts in from a corner and the
             others part around it
     tunnel  frames fly toward you past the viewfinder; the hero frame
             travels down the middle until it fills the brackets

   Placeholders: frames from the current hero sequence (public/lab/reel).
   Swap THUMBS for the final set. */

export type ReelMode = "orbit" | "drift" | "tunnel";

const THUMBS = Array.from({ length: 17 }, (_, i) => `/lab/reel/${String(i + 1).padStart(2, "0")}.webp`);
const FRAMES = 588; // the hero sequence the real loader downloads
const FPS = 25;
const SHOTS: [string, number][] = [
  ["01 Lying in liquid", 0.25],
  ["02 Rising", 0.5],
  ["03 Close-up", 0.75],
  ["04 The dress", 1],
];

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const wrap = (v: number, span: number) => ((((v + span / 2) % span) + span) % span) - span / 2;
// a fixed pseudo-random sequence, the same on every render
const rnd = (i: number, k: number) => {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/* null until mounted: the film is laid out from the real screen, on the
   client only, so server and client never disagree about positions */
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

type Card = { src: string; hero: boolean; style: CSSProperties };

/* Where every card is, for a given mode, viewport and eased progress e.
   Cards are slot-sized boxes centred on the slot; transforms do the rest. */
function layout(mode: ReelMode, e: number, vw: number, vh: number, sw: number, sh: number, lock: number): Card[] {
  const cx = vw / 2;
  const cy = vh * 0.48;
  const fadeOthers = 1 - lock;
  const base = (x: number, y: number) => `translate3d(${x - sw / 2}px, ${y - sh / 2}px, 0)`;

  if (mode === "orbit") {
    const N = 12;
    const R = (N * sw * 1.12) / (2 * Math.PI);
    const rot = (1 - easeOutCubic(e)) * 720;
    const tilt = 9 * (1 - e);
    return Array.from({ length: N }, (_, i) => {
      const a = (i * 360) / N - rot;
      const front = Math.cos((a * Math.PI) / 180);
      const hero = i === 0;
      return {
        src: hero ? heroPoster : THUMBS[i],
        hero,
        style: {
          // tilted about the front card, so the front stays in the viewfinder and the back rises
          transform: `${base(cx, cy)} rotateX(${-tilt}deg) translateZ(${-R}px) rotateY(${a}deg) translateZ(${R}px)`,
          opacity: (0.3 + 0.7 * Math.max(0, front)) * (hero ? 1 : fadeOthers) * Math.min(1, e * 8 + 0.2),
          backfaceVisibility: "hidden",
          zIndex: Math.round(500 + front * 400),
        },
      };
    });
  }

  if (mode === "drift") {
    const M = 24;
    // the board drifts steadily all the way; the hero frame wanders in
    // among the others and only settles by ~95%; the board parts at the end
    const kb = e;
    const kh = easeInOutQuart(Math.min(1, e / 0.95));
    const part = Math.min(1, Math.max(0, (e - 0.82) / 0.18)) ** 2 * Math.max(vw, vh) * 0.4;
    const hx = (1 - kh) * vw * 0.9 + Math.sin(kh * Math.PI) * vw * 0.12;
    const hy = (1 - kh) * vh * 0.75 - Math.sin(kh * Math.PI) * vh * 0.18;
    const px = (1 - kb) * vw * 1.6;
    const py = (1 - kb) * vh * 1.2;
    const spanX = vw * 1.8;
    const spanY = vh * 1.8;
    return Array.from({ length: M }, (_, i) => {
      const hero = i === 0;
      if (hero) {
        return {
          src: heroPoster,
          hero,
          style: { transform: `${base(cx + hx, cy + hy)} scale(${0.72 + 0.28 * kh}) rotate(${(1 - kh) * 7}deg)`, zIndex: 900, opacity: 1 },
        };
      }
      const d = 0.35 + rnd(i, 1) * 0.55; // depth: small and far, or big and near
      const bx = (rnd(i, 2) - 0.5) * spanX;
      const by = (rnd(i, 3) - 0.5) * spanY;
      // pans with parallax, wrapping so the board stays full
      let x = wrap(bx + px * d, spanX);
      let y = wrap(by + py * d, spanY);
      const len = Math.hypot(x, y) || 1;
      x += (x / len) * part;
      y += (y / len) * part;
      return {
        src: THUMBS[i % THUMBS.length],
        hero,
        style: {
          transform: `${base(cx + x, cy + y)} scale(${d * 0.72}) rotate(${(rnd(i, 4) - 0.5) * 12}deg)`,
          opacity: (0.35 + 0.65 * d) * fadeOthers,
          zIndex: Math.round(d * 100),
        },
      };
    });
  }

  // tunnel
  const K = 14;
  const Z = 6.5;
  const travel = easeOutCubic(e) * Z * 2.2;
  return Array.from({ length: K }, (_, i) => {
    const hero = i === 0;
    const z = hero ? Z * (1 - easeOutCubic(e)) : ((((i * Z) / (K - 1) - travel) % Z) + Z) % Z;
    const s = 1 / (1 + z);
    const ang = i * 2.39996; // golden angle: an even spread round the axis
    const rad = hero ? 0 : (0.55 + rnd(i, 5) * 0.4) * Math.max(vw, vh * 1.2);
    const x = Math.cos(ang) * rad * s;
    const y = Math.sin(ang) * rad * s * 0.7;
    const far = Math.min(1, (Z - z) / 1.2); // fades in from the far end
    const near = hero ? 1 : Math.min(1, z / 0.45); // and out as it passes you
    return {
      src: hero ? heroPoster : THUMBS[i],
      hero,
      style: {
        transform: `${base(cx + x, cy + y)} scale(${s})`,
        opacity: far * near * (hero ? 1 : fadeOthers),
        zIndex: Math.round(1000 - z * 100),
      },
    };
  });
}

function Brackets({ x, y, w, h, color }: { x: number; y: number; w: number; h: number; color: string }) {
  const arm = 14;
  const c = (l: number, t: number, r: string) => (
    <span className="absolute h-[14px] w-[14px]" style={{ left: l, top: t, borderColor: color, borderStyle: "solid", borderWidth: r }} />
  );
  return (
    <div className="pointer-events-none absolute" style={{ left: x, top: y, width: w, height: h }} aria-hidden="true">
      {c(0, 0, "1.5px 0 0 1.5px")}
      {c(w - arm, 0, "1.5px 1.5px 0 0")}
      {c(0, h - arm, "0 0 1.5px 1.5px")}
      {c(w - arm, h - arm, "0 1.5px 1.5px 0")}
    </div>
  );
}

export function Reel({ mode, progress, onExit, onDone }: LoaderProps & { mode: ReelMode }) {
  const shown = useShown(progress, 2);
  const vp = useViewport();
  const vw = vp?.w ?? 0;
  const vh = vp?.h ?? 0;
  const [lock, setLock] = useState(0);
  const [grow, setGrow] = useState(0);

  const phase = useExit(shown >= 1, 700, { onExit, onDone }, (end) => tween(1150, easeInOutQuart, setGrow, end));
  useEffect(() => {
    if (phase === "hold") return tween(600, easeOutExpo, setLock);
  }, [phase]);

  // before mount: just the sky, so nothing is placed from a guessed screen
  if (!vp)
    return (
      <div className="ld">
        <SrProgress value={shown} />
        <Crown />
      </div>
    );

  const phone = vw < 768;
  const sw = phone ? vw * 0.66 : Math.min(vw * 0.36, 560); // phones: clear of the Vote tab
  const sh = (sw * 9) / 16;
  const sx = vw / 2 - sw / 2;
  const sy = vh * 0.48 - sh / 2;
  const e = Math.min(1, shown);
  const cards = layout(mode, e, vw, vh, sw, sh, lock);
  const pct = Math.round(e * 100);
  const hud = Math.max(0, 1 - grow * 1.6);

  // the chosen frame: the slot, inset a touch when it locks, then the screen
  const inset = lock * 0.035 * (1 - grow);
  const hx = sx + sw * inset;
  const hy = sy + sh * inset;
  const hw = sw * (1 - 2 * inset);
  const hh = sh * (1 - 2 * inset);
  const fx = hx * (1 - grow);
  const fy = hy * (1 - grow);
  const fw = hw + (vw - hw) * grow;
  const fh = hh + (vh - hh) * grow;

  // brackets: loose round the slot, tight when locked, out to the corners
  const pad = 18 - lock * 10;
  const bx = (sx - pad) * (1 - grow) + 14 * grow;
  const by = (sy - pad) * (1 - grow) + 14 * grow;
  const bw = (sw + pad * 2) * (1 - grow) + (vw - 28) * grow;
  const bh = (sh + pad * 2) * (1 - grow) + (vh - 28) * grow;

  const tc = e * (FRAMES / FPS);
  const tcs = `00:00:${String(Math.floor(tc)).padStart(2, "0")}:${String(Math.floor((tc % 1) * FPS)).padStart(2, "0")}`;
  const cells = 40;
  const lit = Math.round(e * cells);

  return (
    <div className="ld">
      <SrProgress value={shown} />
      <Crown style={{ opacity: 1 - grow }} />

      {/* the film */}
      <div className="absolute inset-0 isolate" style={{ perspective: mode === "orbit" ? "1500px" : undefined }}>
        {cards.map((c, i) =>
          c.hero && phase !== "load" ? null : (
            <div key={i} className="ld-reel-card" style={{ width: sw, height: sh, ...c.style }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.src} alt="" draggable={false} decoding="async" />
            </div>
          ),
        )}
      </div>

      {/* the chosen frame takes over from its card once the load completes */}
      {phase !== "load" && (
        <div className="ld-reel-card is-chosen" style={{ left: fx, top: fy, width: fw, height: fh, borderRadius: 4 * (1 - grow), zIndex: 1000 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroPoster} alt="" draggable={false} />
        </div>
      )}

      {/* viewfinder */}
      <div style={{ opacity: 1 - Math.max(0, grow - 0.7) / 0.3 }}>
        <Brackets x={bx} y={by} w={bw} h={bh} color={grow > 0.5 ? "var(--cloud)" : "var(--ink)"} />
      </div>
      <span className="ld-reel-cross" style={{ left: vw / 2, top: vh * 0.48, opacity: hud }} aria-hidden="true" />

      {/* HUD */}
      <div className="ld-mono ld-ink ld-halo" style={{ opacity: hud }}>
        <span
          className="absolute whitespace-nowrap"
          style={phone ? { left: "50%", top: sy - pad - 34, translate: "-50% 0" } : { left: 40, top: vh * 0.48, translate: "0 -50%" }}
        >
          [ Venty · made to measure ]
        </span>
        <span
          className="absolute whitespace-nowrap tabular-nums"
          style={phone ? { left: "50%", top: sy + sh + pad + 18, translate: "-50% 0" } : { right: 82, top: vh * 0.48, translate: "0 -50%" }}
        >
          [ {pad3(pct)} percent ]
        </span>

        <div className="absolute left-5 top-[max(72px,9svh)] md:left-10">
          <p className="h-[1.7em]"><Decode text="Reel 01 · Venty" on={e > 0.01} /></p>
          <p className="h-[1.7em]"><Decode text={lock ? "Opening frame selected" : "Selecting your opening frame"} on={e > 0.04} /></p>
          <p className="h-[1.7em] tabular-nums">Frames {String(Math.round(e * FRAMES)).padStart(3, "0")} / {FRAMES}</p>
          <p className="h-[1.7em] tabular-nums sm:hidden">TC {tcs}</p>
        </div>
        <div className="absolute right-5 top-[max(72px,9svh)] hidden text-right tabular-nums sm:block md:right-10">
          <p className="h-[1.7em]">TC {tcs}</p>
          <p className="h-[1.7em]"><Decode text={`${FPS} fps · 1920 × 1080`} on={e > 0.08} /></p>
          <p className="h-[1.7em]"><Decode text={mode === "orbit" ? "Orbit" : mode === "drift" ? "Lightboard" : "Tunnel"} on={e > 0.12} /></p>
        </div>

        {/* shot list, ticked off as the film arrives */}
        <div className="absolute bottom-[max(96px,13svh)] left-5 hidden text-[var(--mist)] [text-shadow:none] md:left-10 md:block">
          <p className="mb-1 text-[var(--periwinkle)]">Shot list</p>
          {SHOTS.map(([t, at]) => (
            <p key={t} className="h-[1.7em]" style={{ color: e >= at ? "var(--cloud)" : undefined }}>
              <span className="mr-2 inline-block w-3">{e >= at ? "✓" : "·"}</span>
              <Decode text={t} on={e >= at - 0.2} />
            </p>
          ))}
        </div>

        {/* film strip progress: one cell per stretch of frames */}
        <div className="absolute bottom-[max(96px,13svh)] left-1/2 w-[min(520px,82vw)] -translate-x-1/2 [text-shadow:none] md:w-[min(440px,40vw)]">
          <div className="flex gap-[3px]">
            {Array.from({ length: cells }, (_, k) => (
              <span
                key={k}
                className="h-[10px] flex-1 rounded-[2px]"
                style={{
                  background: k < lit ? "var(--cloud)" : "color-mix(in oklab, var(--cloud) 22%, transparent)",
                  boxShadow: k === lit - 1 && e < 1 ? "0 0 10px var(--cornflower), 0 0 2px var(--cloud)" : undefined,
                  transition: "background-color .25s",
                }}
              />
            ))}
          </div>
          <p className="mt-2 flex justify-between text-[var(--mist)]">
            <span>{e < 1 ? "Loading the film" : "Ready"}</span>
            <span className="tabular-nums">{pct}%</span>
          </p>
        </div>

        <span className="lab-display absolute bottom-[max(96px,13svh)] right-5 hidden [text-shadow:none] text-[clamp(2.4rem,5vw,3.6rem)] leading-none tracking-normal text-[var(--cloud)] normal-case md:right-10 md:block">
          {pad3(pct)}
        </span>
      </div>
    </div>
  );
}

export const Orbit = (p: LoaderProps) => <Reel mode="orbit" {...p} />;
export const Drift = (p: LoaderProps) => <Reel mode="drift" {...p} />;
export const Tunnel = (p: LoaderProps) => <Reel mode="tunnel" {...p} />;
