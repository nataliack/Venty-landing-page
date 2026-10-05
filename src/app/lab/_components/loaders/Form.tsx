"use client";

import { useEffect, useRef, useState } from "react";
import { Crown, SrProgress, easeInOutQuart, pad3, tween, useExit, useShown, type LoaderProps } from "./shared";

/* Form (light). After the dot-matrix map on unitedcarriers.com: a dress
   form drawn in a matrix of dots on Crown. The dots light from the hem up
   as the page loads, and a measurement tag pops out as each line is
   reached, like the city tags on their globe. At 100 the dots float up
   and away and the Crown fades. One canvas, no images. */

// dress form in a 200 x 320 box: neck, shoulders, bust, waist, hip, stand
const FORM =
  "M86 8 L114 8 L113 40 Q150 48 160 70 Q166 92 162 112 Q156 140 144 170 Q140 196 164 226 Q168 246 150 262 L104 266 L104 300 L140 306 Q144 314 100 314 Q56 314 60 306 L96 300 L96 266 L50 262 Q32 246 36 226 Q60 196 56 170 Q44 140 38 112 Q34 92 40 70 Q50 48 87 40 Z";
const W = 200;
const H = 320;
const STEP = 5.2;

const TAGS = [
  { label: "Hip 98", x: 164, y: 226, side: 1 },
  { label: "Waist 74", x: 56, y: 170, side: -1 },
  { label: "Bust 92", x: 162, y: 112, side: 1 },
  { label: "Neck 36", x: 87, y: 40, side: -1 },
];
// a tag shows once the light has climbed past its line
const reached = (y: number, p: number) => p >= 1 - y / H + 0.04;

type Dot = { x: number; y: number; t: number; v: number; hot: boolean };

export function Form({ progress, onExit, onDone }: LoaderProps) {
  const shown = useShown(progress, 1.5);
  const cv = useRef<HTMLCanvasElement>(null);
  const dots = useRef<Dot[]>([]);
  const [float, setFloat] = useState(0);

  // build the matrix once: every grid point inside the form
  useEffect(() => {
    const ctx = document.createElement("canvas").getContext("2d")!;
    const path = new Path2D(FORM);
    const list: Dot[] = [];
    let seed = 7;
    const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let y = STEP / 2; y < H; y += STEP)
      for (let x = STEP / 2; x < W; x += STEP)
        if (ctx.isPointInPath(path, x, y)) {
          // lights from the hem up, with a little noise so the edge shimmers
          list.push({ x, y, t: (1 - y / H) * 0.9 + rand() * 0.1, v: 0.4 + rand() * 0.9, hot: rand() < 0.06 });
        }
    dots.current = list;
  }, []);

  // draw on every change of progress or float
  useEffect(() => {
    const c = cv.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = c.getBoundingClientRect();
    if (c.width !== Math.round(r.width * dpr)) {
      c.width = Math.round(r.width * dpr);
      c.height = Math.round(r.height * dpr);
    }
    const ctx = c.getContext("2d")!;
    const s = (r.width / W) * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.setTransform(s, 0, 0, s, 0, 0);
    const rad = STEP * 0.26;
    for (const d of dots.current) {
      const lit = shown >= d.t;
      const fy = d.y - float * float * 260 * d.v;
      const a = (lit ? 0.9 : 0.16) * (1 - float);
      if (a <= 0.01) continue;
      ctx.globalAlpha = a;
      ctx.fillStyle = lit && d.hot ? "#687ef5" : "#121524";
      ctx.beginPath();
      ctx.arc(d.x, fy, lit ? rad * 1.15 : rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, [shown, float]);

  const phase = useExit(shown >= 1, 700, { onExit, onDone }, (end) => tween(1300, easeInOutQuart, setFloat, end));

  return (
    <div className="ld">
      <SrProgress value={shown} />
      <Crown style={{ opacity: 1 - Math.max(0, float * 1.4 - 0.4) }} />

      <div className="absolute inset-0" style={{ opacity: 1 - Math.max(0, float * 1.4 - 0.4) }}>
        <p className="ld-mono ld-ink absolute inset-x-0 top-[max(76px,11svh)] text-center">{phase === "load" ? "Mapping your form" : "Mapped"}</p>

        <div className="absolute left-1/2 top-[53%] aspect-[200/320] h-[min(58svh,560px)] -translate-x-1/2 -translate-y-1/2">
          <canvas ref={cv} className="absolute inset-0 h-full w-full" aria-hidden="true" />
          {TAGS.map((t) => {
            const on = reached(t.y, shown) && float < 0.2;
            return (
              <span
                key={t.label}
                className="ld-tag ld-mono"
                style={{
                  left: `${(t.x / W) * 100}%`,
                  top: `${(t.y / H) * 100}%`,
                  flexDirection: t.side < 0 ? "row-reverse" : "row",
                  transform: t.side < 0 ? "translateX(-100%)" : undefined,
                  opacity: on ? 1 : 0,
                  translate: on ? "0 -50%" : "0 -10%",
                }}
              >
                <span className="ld-tag__dot" />
                <span className="ld-tag__pill">{t.label}</span>
              </span>
            );
          })}
        </div>

        <div className="ld-mono absolute inset-x-5 bottom-[max(88px,12svh)] flex items-end justify-between text-[var(--mist)] md:inset-x-10">
          <span>Measurements · cm</span>
          <span className="lab-display text-[clamp(2rem,5vw,3.2rem)] leading-none tracking-normal text-[var(--cloud)] normal-case">{pad3(shown * 100)}</span>
        </div>
      </div>
    </div>
  );
}
