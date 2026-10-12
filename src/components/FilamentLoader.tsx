"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { LogoMark, Wordmark } from "./Logo";
import { HERO, preloadHero } from "@/lib/heroSequence";
import { EASE } from "@/lib/motion";

/* The loading screen: the night of the first loader (the zipper's sky, held
   still) with its glowing cornflower filament, everything on one line across
   the middle of the screen:

     left    a word for what it is doing (Loading, Measuring, Drafting,
             Fitting, then Ready), rising from its mask as it changes
     centre  the Venty logo, and under it the filament bar, dead centre
     right   the percentage

   Progress is real: the hero's opening frames and the fonts.

   The way out is the page's own section hand-off (DitherEdge), as a burst:
   the words and the logo clear, the filament draws in to a bright point at
   the centre, and from that point a ring of dithered squares opens out to
   the corners. Behind the ring the hero is already there; at its front the
   squares thin out in a Bayer order, and a band of glitter (cornflower,
   periwinkle and a few cloud-white sparks) rides the edge. The night itself
   is CSS, cut by a round mask that keeps pace with the ring; the squares are
   one WebGL shader, painted in the night's own colours, so the cut is never
   seen. With no WebGL the night simply opens with a soft edge.

   The hero's opening waits for this screen to leave (afterLoader). */

const WORDS = ["Loading", "Measuring", "Drafting", "Fitting", "Ready"];
const HOLD_MS = 550; // the beat at 100% before it clears
const BURST_S = 1.7; // the ring, from the centre to past the corners

const still = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Real progress: the hero's opening frames, then the fonts. 0..1 */
function useLoad(on: boolean) {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!on) return;
    let hero = 0;
    let heroTotal = HERO.frames;
    let fonts = 0;
    let off = false;
    const update = () => !off && setP(Math.min(1, (hero + fonts) / (heroTotal + 1)));
    preloadHero((done, total) => {
      hero = done;
      heroTotal = total;
      update();
    }).then(() => {
      hero = heroTotal;
      update();
    });
    document.fonts.ready.then(() => {
      fonts = 1;
      update();
    });
    return () => {
      off = true;
    };
  }, [on]);
  return p;
}

/** The lab's stand-in: an even load over `seconds` (0: off). 0..1 */
function useSim(seconds: number) {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!seconds) return;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / (seconds * 1000));
      setP(k);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [seconds]);
  return p;
}

/** The number chases the real progress at a capped speed, so a fast load still
    reads and a stall never jumps. 0..1 */
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

/* The rolling word: every word in one grid cell; the current one is in, the
   last one leaves upward, the rest wait below */
function Roll({ i }: { i: number }) {
  const [prev, setPrev] = useState(-1);
  const [cur, setCur] = useState(i);
  if (i !== cur) {
    setPrev(cur);
    setCur(i);
  }
  return (
    <p className="fl-roll">
      <span className="sr-only">{WORDS[i]}</span>
      {WORDS.map((t, k) => (
        <span key={t} aria-hidden="true" data-state={k === i ? "in" : k === prev ? "out" : "wait"}>
          {t}
        </span>
      ))}
    </p>
  );
}

/* ------------------------------------------------------------- the burst */

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

/* One pixel of the ring. Outside the round cut it is clear (the CSS night
   shows). Inside, the visible edge wobbles a little inward of the cut; from
   that edge the night's squares thin out towards the centre in a Bayer order
   (2px squares on an 8px grid, as the section edges), and a band of glitter
   rides just inside the solid rim. The night is painted with the same stops
   as .fl-night, so the squares and the CSS meet without a seam. */
const FRAG = `
precision highp float;
uniform vec2 u_res;     // the screen, CSS px (drawn at 1:1)
uniform vec2 u_c;       // the centre, CSS px from the top left
uniform float u_r;      // the round cut's radius
uniform float u_band;   // how far the squares reach in from the edge
uniform float u_wob;    // how far the edge wobbles in from the cut
uniform float u_time;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }

const vec3 NIGHT = vec3(11.0, 12.0, 21.0) / 255.0;
const vec3 CORN = vec3(104.0, 126.0, 245.0) / 255.0;
const vec3 PERI = vec3(157.0, 172.0, 205.0) / 255.0;
const vec3 CLOUD = vec3(239.0, 244.0, 255.0) / 255.0;

// .fl-night, stop for stop
vec3 night(vec2 q) {
  vec2 uv = q / u_res;
  vec3 base = mix(vec3(12.0, 13.0, 24.0) / 255.0, NIGHT, uv.y);
  float x = min(uv.x, 1.0 - uv.x);
  vec3 c;
  if (x < 0.22) c = mix(mix(base, vec3(18.0, 21.0, 36.0) / 255.0, 0.9), mix(base, vec3(13.0, 15.0, 26.0) / 255.0, 0.6), x / 0.22);
  else if (x < 0.4) c = mix(mix(base, vec3(13.0, 15.0, 26.0) / 255.0, 0.6), NIGHT, (x - 0.22) / 0.18);
  else c = NIGHT;
  // the two glows in the bottom corners
  float gl = 1.0 - clamp(length((uv - vec2(-0.04, 1.04)) / vec2(0.26, 0.40)) / 0.7, 0.0, 1.0);
  float gr = 1.0 - clamp(length((uv - vec2(1.04, 1.04)) / vec2(0.26, 0.40)) / 0.7, 0.0, 1.0);
  c = mix(c, CORN, 0.16 * gl);
  c = mix(c, CORN, 0.16 * gr);
  return c;
}

void main() {
  vec2 q = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
  vec2 v = q - u_c;
  float d = length(v);
  // 2px past the cut, so the cut's own anti-aliased pixel is always covered
  if (d >= u_r + 2.0) { gl_FragColor = vec4(0.0); return; }

  // the visible edge: soft lumps that drift round as it opens
  float ang = atan(v.y, v.x);
  float n = noise(vec2(ang * 2.6 + u_time * 0.5, u_time * 0.35)) * 0.65 + noise(vec2(ang * 8.0 - u_time, 7.0)) * 0.35;
  float edge = u_r - u_wob * n;
  float inside = edge - d;
  float dens = inside <= 0.0 ? 1.0 : 1.0 - clamp(inside / u_band, 0.0, 1.0);

  vec2 cell = floor(q / 2.0);
  if (dens <= bayer4(mod(cell, 4.0)) + 0.0001) { gl_FragColor = vec4(0.0); return; }

  vec3 col = night(q);
  // glitter: a band just inside the solid rim, twinkling
  float zone = smoothstep(0.45, 0.78, dens) * (1.0 - smoothstep(0.9, 0.99, dens));
  if (hash(cell) < 0.42 * zone) {
    float tw = hash(cell + floor(u_time * 14.0));
    col = tw > 0.88 ? CLOUD : tw > 0.4 ? CORN : mix(CORN, PERI, 0.6);
  }
  gl_FragColor = vec4(col, 1.0);
}
`;

type Burst = { draw: (r: number, t: number) => void; drop: () => void };

/** Sets the shader up off the critical path (the compile can take 100ms+).
    Resolves with a drawer, or null with no WebGL. */
type Geo = { w: number; h: number; c: { x: number; y: number }; band: number; wob: number; far: number };

function makeBurst(canvas: HTMLCanvasElement, { w, h, band, wob, c }: Geo): Promise<Burst | null> {
  return new Promise((ok) => {
    const gl = canvas.getContext("webgl", { premultipliedAlpha: false, alpha: true, antialias: false });
    if (!gl) return ok(null);
    const shader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    const parallel = gl.getExtension("KHR_parallel_shader_compile");
    const ready = () => {
      if (parallel && !gl.getProgramParameter(prog, parallel.COMPLETION_STATUS_KHR)) return requestAnimationFrame(ready);
      if (gl.isContextLost() || !gl.getProgramParameter(prog, gl.LINK_STATUS)) return ok(null);
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "a_pos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const u = (name: string) => gl.getUniformLocation(prog, name);
      // drawn at 1 canvas px per CSS px: the squares are 2px, and stretched
      // with no smoothing they stay crisp at any pixel ratio
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(u("u_res"), w, h);
      gl.uniform2f(u("u_c"), c.x, c.y);
      gl.uniform1f(u("u_band"), band);
      gl.uniform1f(u("u_wob"), wob);
      const uR = u("u_r");
      const uT = u("u_time");
      ok({
        draw: (r, t) => {
          gl.uniform1f(uR, r);
          gl.uniform1f(uT, t);
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        },
        drop: () => {
          gl.deleteBuffer(buf);
          gl.deleteProgram(prog);
        },
      });
    };
    ready();
  });
}

/* ------------------------------------------------------------ the screen */

export function FilamentLoader({
  sim = 0,
  scrub = null,
  contained = false,
  onDone,
}: {
  /** the lab: a simulated load of this many seconds instead of the real one */
  sim?: number;
  /** the lab: hold the burst at this point (0..1) to look at it */
  scrub?: number | null;
  /** the lab: fill the parent instead of the screen */
  contained?: boolean;
  onDone?: () => void;
} = {}) {
  const real = useLoad(!sim);
  const fake = useSim(sim);
  const progress = sim ? fake : real;
  const shown = useShown(progress, sim ? 0.01 : 2.2);
  const [gone, setGone] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const nightEl = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const hud = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const spark = useRef<HTMLSpanElement>(null);
  const burst = useRef<Promise<Burst | null> | null>(null);

  const pct = Math.round(Math.min(1, shown) * 100);
  const loaded = shown >= 1;
  const word = loaded ? WORDS.length - 1 : Math.min(WORDS.length - 2, Math.floor(shown * (WORDS.length - 1)));

  // geometry of the burst, fixed for this load (browser bars coming and going
  // don't matter): the screen (or, in the lab, the box it fills)
  const geo = useRef<Geo | null>(null);
  const measure = () => {
    if (geo.current) return geo.current;
    const r = root.current!.getBoundingClientRect();
    const w = Math.round(r.width);
    const h = Math.round(r.height);
    const m = Math.min(w, h);
    const band = Math.max(140, m * 0.34);
    const wob = m * 0.07;
    geo.current = { w, h, c: { x: w / 2, y: h / 2 }, band, wob, far: Math.hypot(w / 2, h / 2) + band + wob + 8 };
    return geo.current;
  };
  const getBurst = () => (burst.current ??= makeBurst(canvas.current!, measure()));
  // the night's round cut (hard under the shader's squares, soft without them)
  const cut = (r: number, soft: number) => {
    const g = measure();
    const m = `radial-gradient(circle at ${g.c.x}px ${g.c.y}px, transparent ${r}px, #000 ${r + soft}px)`;
    nightEl.current!.style.maskImage = m;
    nightEl.current!.style.setProperty("-webkit-mask-image", m);
  };
  const finish = () => {
    setGone(true);
    onDone?.();
  };

  // the shader is set up once the load is under way, in idle time, so the
  // compile never stalls the bar
  const halfway = shown >= 0.35;
  useEffect(() => {
    if (!halfway || burst.current || still() || !canvas.current) return;
    const begin = () => void getBurst();
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(begin, { timeout: 800 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(begin, 60);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [halfway]);

  // the lab: hold the burst still at one point, to look at it
  useEffect(() => {
    if (scrub === null || !canvas.current) return;
    let dead = false;
    const g = measure();
    getBurst().then((d) => {
      if (dead) return;
      const r = scrub * g.far;
      if (d) {
        canvas.current!.style.visibility = "visible";
        cut(r, 1);
        d.draw(r, scrub * BURST_S);
      } else cut(r, g.band * 0.6);
    });
    return () => {
      dead = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrub]);

  // the filament's head breathes, and a sweep of light runs along the lit part
  useEffect(() => {
    if (still() || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.to("[data-head]", { opacity: 0.55, duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.fromTo("[data-pulse]", { xPercent: -100, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 1.6, ease: "power2.in", repeat: -1, repeatDelay: 0.5 });
    }, root);
    return () => ctx.revert();
  }, []);

  // loaded: a beat on Ready, then out
  useEffect(() => {
    if (!loaded || scrub !== null) return;
    let dead = false;
    const timers: number[] = [];
    const tweens: (gsap.core.Tween | gsap.core.Timeline)[] = [];
    const wait = (ms: number) => new Promise<void>((r) => timers.push(window.setTimeout(r, ms)));
    const leave = async () => {
      await wait(HOLD_MS);
      if (dead) return;
      if (still()) {
        await gsap.to(root.current, { opacity: 0, duration: 0.5, ease: EASE.soft }).then();
        if (!dead) finish();
        return;
      }
      const g = measure();
      const q = gsap.utils.selector(root);

      // 1. the words and the logo clear; the filament draws in to a bright point
      const out = gsap.timeline();
      tweens.push(out);
      out
        .to(q("[data-side='left']"), { x: -16, opacity: 0, duration: 0.45, ease: EASE.in }, 0)
        .to(q("[data-side='right']"), { x: 16, opacity: 0, duration: 0.45, ease: EASE.in }, 0)
        .to(q("[data-side='logo']"), { y: -12, opacity: 0, duration: 0.45, ease: EASE.in }, 0.05)
        .to(bar.current, { scaleX: 0, duration: 0.55, ease: EASE.in }, 0.1)
        .fromTo(spark.current, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: EASE.out }, 0.5);
      await out.then();
      if (dead) return;

      // 2. the ring opens out from the point (the shader if it is ready in
      //    time, else the night opens with a soft edge)
      const drawer = burst.current ? await Promise.race([burst.current, wait(350).then(() => null)]) : null;
      if (dead) return;
      const cv = canvas.current!;
      if (drawer) cv.style.visibility = "visible";
      tweens.push(gsap.to(spark.current, { scale: 2.4, opacity: 0, duration: 0.5, ease: EASE.out }));
      const st = { r: 0 };
      const t0 = performance.now();
      const ring = gsap.to(st, {
          r: g.far,
          duration: BURST_S,
          ease: "power2.inOut",
          onUpdate: () => {
            if (drawer) {
              cut(st.r, 1);
              drawer.draw(st.r, (performance.now() - t0) / 1000);
            } else cut(st.r, g.band * 0.6);
          },
        });
      tweens.push(ring);
      await ring.then();
      drawer?.drop();
      if (!dead) finish();
    };
    leave();
    return () => {
      dead = true;
      timers.forEach(clearTimeout);
      tweens.forEach((t) => t.kill());
    };
    // runs once, when the load completes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  if (gone) return null;

  return (
    // .loader is what the page's openings wait for (afterLoader); the lab's copy has no part in that
    <div ref={root} className={`fl inset-0 overflow-hidden ${contained ? "absolute z-[40]" : "loader fixed z-[100]"}`}>
      <div role="progressbar" aria-label="Loading Venty" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="sr-only">
        {pct}%
      </div>
      <div ref={nightEl} className="fl-night" aria-hidden="true" />
      <canvas ref={canvas} className="fl-burst" aria-hidden="true" />

      <div ref={hud} className="fl-hud" style={scrub !== null ? { visibility: "hidden" } : undefined}>
        <div data-side="left" className="fl-side fl-left">
          <span className="fl-dot" aria-hidden="true" />
          <Roll i={word} />
        </div>

        <div className="fl-centre">
          <div data-side="logo" className="fl-logo">
            <LogoMark className="fl-logo__mark" />
            <Wordmark className="fl-logo__word" />
          </div>
          <div ref={bar} className="fl-bar" aria-hidden="true">
            <div className="fl-fill" style={{ width: `${Math.min(1, shown) * 100}%` }}>
              <span data-pulse className="fl-pulse" />
              <span data-head className="fl-head" />
            </div>
          </div>
          <span ref={spark} className="fl-spark" aria-hidden="true" />
        </div>

        <p data-side="right" className="fl-side fl-right font-display tabular-nums" aria-hidden="true">
          {pct}
          <span className="fl-pctsign">%</span>
        </p>
      </div>
    </div>
  );
}
