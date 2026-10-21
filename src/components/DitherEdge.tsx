"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { afterLoader } from "@/lib/motion";

/* A dithered edge for a section rising over the one before it (the hand-off
   in docs/motion.md). Above the section's top edge, a band of the section's
   colour builds up, sparse far from the edge and solid at it, in one of four
   patterns, all on a grid fixed to the screen (so as the edge rises the
   marks change in place rather than travel with it):

     squares  an 8px grid, each cell 4 x 4 squares of 2px switching on in a
              Bayer order
     dots     round dots on the section's own 18px dot grid, growing from
              specks until they merge
     stitch   rows of running stitch: dashes lengthen, then thicken, until
              the rows close up
     weave    horizontal threads thicken first, then vertical ones cross them
     cross    cross-stitch: an X in each 8px cell, the cells stitched in a
              Bayer order, the threads thickening until the cells fill

   The edge itself either wobbles in soft lumps ("noise", still) or drifts as
   a slow wave ("wave", like a hem moving).

   The site uses one edge everywhere, for consistency: squares on a moving
   wave (the defaults), in the colour of the section rising (cloud for light
   sections, night for dark ones). The other patterns stay for the lab's
   Dither rise comparison.

   The strip is part of the section (absolute, just above its top edge), so
   the browser scrolls the two together and they can never come apart; the
   shader is told where the strip is on screen each frame, so the pattern
   still sits on the screen's grid.

   Cost: one WebGL context and one compiled shader for the whole page, shared
   by every edge (getRenderer), set up after the loader in idle time. Each
   edge draws only its strip (not the whole screen), at up to 2 canvas px per
   CSS px, only while its strip is on screen, and copies the frame into its
   own 2D canvas.

   Put it inside the rising section (position: relative, above the section
   before it). */

export type DitherPattern = "squares" | "dots" | "stitch" | "weave" | "cross";
export type DitherEdgeMode = "noise" | "wave";

const PATTERNS: Record<DitherPattern, number> = { squares: 0, dots: 1, stitch: 2, weave: 3, cross: 4 };
/** px of the strip that sit inside the section (see .dither-edge) */
const OVERLAP = 2;

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 u_res;      // canvas, device px
uniform float u_scale;   // device px per CSS px
uniform float u_offset;  // screen y of the canvas's top edge, CSS px
uniform vec2 u_view;     // the screen, CSS px
uniform float u_edge;    // the section's top edge, screen CSS px
uniform float u_band;    // how far above the edge the pattern reaches, CSS px
uniform float u_pattern; // 0 squares, 1 dots, 2 stitch, 3 weave, 4 cross
uniform float u_wave;    // 0 noise, 1 wave
uniform float u_time;
uniform vec3 u_color;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }

void main() {
  // this pixel on the screen, CSS px from the top left
  vec2 q = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y) / u_scale + vec2(0.0, u_offset);

  // how far above the edge, with the edge's shape; the shape fades out right
  // at the edge so the band always meets the section solid
  float above = u_edge - q.y;
  float shape;
  if (u_wave > 0.5) {
    float x = q.x / u_view.x * 6.2832;
    shape = (sin(x * 1.3 + u_time * 0.55) * 0.6 + sin(x * 3.1 - u_time * 0.9) * 0.4) * 0.22 * u_band;
  } else {
    shape = (noise(q / 160.0) - 0.5) * 0.5 * u_band;
  }
  above += shape * smoothstep(0.0, 0.3 * u_band, above);
  float d = 1.0 - clamp(above / u_band, 0.0, 1.0);

  float a = 0.0;
  if (u_pattern < 0.5) {
    // squares: 2px squares in 8px cells, Bayer order
    a = step(bayer4(mod(floor(q / 2.0), 4.0)) + 0.0001, d);
  } else if (u_pattern < 1.5) {
    // dots on the section's 18px grid (centred on the screen, as its own)
    float g = 18.0;
    vec2 c = u_view * 0.5;
    vec2 centre = c + floor((q - c) / g + 0.5) * g;
    float r = g * 0.74 * d;
    a = clamp((r - length(q - centre)) * u_scale + 0.5, 0.0, 1.0);
  } else if (u_pattern < 2.5) {
    // running stitch: rows every 6px, bricked; dashes lengthen, then thicken
    float row = floor(q.y / 6.0);
    float fx = mod(q.x + mod(row, 2.0) * 7.0, 14.0);
    float len = d * 14.0;
    float th = mix(1.5, 6.0, smoothstep(0.5, 1.0, d));
    a = step(abs(fx - 7.0), len * 0.5) * step(abs(mod(q.y, 6.0) - 3.0), th * 0.5) * step(0.02, d);
  } else if (u_pattern < 3.5) {
    // weave: horizontal threads first, then the vertical ones
    float fx = abs(mod(q.x, 8.0) - 4.0);
    float fy = abs(mod(q.y, 8.0) - 4.0);
    float wh = smoothstep(0.0, 0.75, d) * 4.0;
    float wv = smoothstep(0.3, 1.0, d) * 4.0;
    a = max(step(fy, wh), step(fx, wv)) * step(0.02, d);
  } else {
    // cross-stitch: each 8px cell gets its X in a Bayer order, the threads
    // thicken, and near the edge the cells fill in from their centres
    vec2 cell = floor(q / 8.0);
    vec2 l = mod(q, 8.0) - 4.0;
    float k = clamp((d - bayer4(mod(cell, 4.0)) * 0.7) / 0.3, 0.0, 1.0);
    float arm = min(abs(l.x - l.y), abs(l.x + l.y)) * 0.7071;
    float box = max(abs(l.x), abs(l.y));
    a = step(arm, mix(0.45, 1.6, k)) * step(box, 3.4) * step(0.001, k);
    a = max(a, step(box, smoothstep(0.78, 1.0, d) * 4.2));
  }
  gl_FragColor = vec4(u_color * a, a);
}
`;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/* One renderer for every edge on the page: a single WebGL context and a single
   compiled shader, on a canvas that is never shown. Each edge draws its frame
   there and copies it into its own strip (a plain 2D canvas). Only one edge or
   two are ever on screen at once, so this costs one setup instead of one per
   section. Made lazily, the first time an edge needs it. */
type Renderer = {
  gl: WebGLRenderingContext;
  canvas: HTMLCanvasElement;
  u: Record<"res" | "scale" | "offset" | "view" | "edge" | "band" | "pattern" | "wave" | "time" | "color", WebGLUniformLocation | null>;
};
let renderer: Promise<Renderer | null> | null = null;
function getRenderer(): Promise<Renderer | null> {
  renderer ??= new Promise((ok) => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return ok(null); // no WebGL: the sections simply rise with a clean edge
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
    // the compile runs in the background where the browser can
    // (KHR_parallel_shader_compile); the renderer is ready the frame it is done
    const parallel = gl.getExtension("KHR_parallel_shader_compile");
    const ready = () => {
      if (parallel && !gl.getProgramParameter(prog, parallel.COMPLETION_STATUS_KHR)) return void requestAnimationFrame(ready);
      if (gl.isContextLost() || !gl.getProgramParameter(prog, gl.LINK_STATUS)) return ok(null);
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "a_pos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const at = (name: string) => gl.getUniformLocation(prog, name);
      ok({
        gl,
        canvas,
        u: {
          res: at("u_res"),
          scale: at("u_scale"),
          offset: at("u_offset"),
          view: at("u_view"),
          edge: at("u_edge"),
          band: at("u_band"),
          pattern: at("u_pattern"),
          wave: at("u_wave"),
          time: at("u_time"),
          color: at("u_color"),
        },
      });
    };
    ready();
  });
  return renderer;
}

export function DitherEdge({
  color,
  pattern = "squares",
  edge = "wave",
  band = 0.32,
}: {
  color: string;
  /** the site uses squares everywhere; the lab compares the others */
  pattern?: DitherPattern;
  /** the site uses the moving wave everywhere */
  edge?: DitherEdgeMode;
  /** the band's reach above the edge, as a share of the screen's height */
  band?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const section = canvas?.parentElement;
    if (!canvas || !section) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;
    let dead = false;
    let started = false;
    let teardown = () => {};
    const rgb = hexToRgb(color);
    const moving = edge === "wave";

    // Setting up the renderer costs a WebGL context and a shader compile (well
    // over 100ms): never at load, where it would stall the loading screen. It
    // happens in idle time once the loader has gone, or at once if a section
    // with an edge comes near first. Every edge shares it.
    const start = () => {
      if (started || dead) return;
      started = true;
      getRenderer().then((r) => {
        if (!r || dead) return;
        const { gl, u } = r;

        let scale = 1;
        let vw = 0;
        let vh = 0;
        let stripH = 0;
        let shown = false;
        let lastTop = NaN;

        const size = () => {
          scale = Math.min(2, window.devicePixelRatio || 1);
          vw = window.innerWidth;
          vh = window.innerHeight;
          // the strip: the band, plus room for the edge's shape above it, plus
          // OVERLAP px tucked into the section (solid) so no hairline shows at
          // the seam when the edge lands between pixels
          stripH = Math.ceil(band * vh * 1.3) + OVERLAP;
          canvas.style.height = `${stripH}px`;
          const w = Math.round(vw * scale);
          const h = Math.round(stripH * scale);
          if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
          }
          // the shared canvas takes the size here too (set-up or a resize), not
          // in the first frame a strip shows: resizing a WebGL canvas waits on
          // the GPU (tens of ms). Every edge is this size, so it stays put
          if (r.canvas.width !== w || r.canvas.height !== h) {
            r.canvas.width = w;
            r.canvas.height = h;
          }
          lastTop = NaN;
        };

        const draw = (time: number) => {
          const top = section.getBoundingClientRect().top;
          const at = top - stripH + OVERLAP; // the strip's top on screen
          // only while the strip is on screen
          const visible = top > 0 && at < vh;
          if (visible !== shown) {
            shown = visible;
            canvas.style.visibility = visible ? "visible" : "hidden";
          }
          if (!visible || (top === lastTop && !moving) || gl.isContextLost()) return;
          lastTop = top;
          // the shared renderer takes this edge's size and settings, draws, and
          // the frame is copied straight into this edge's strip
          const w = canvas.width;
          const h = canvas.height;
          if (r.canvas.width !== w || r.canvas.height !== h) {
            r.canvas.width = w;
            r.canvas.height = h;
          }
          gl.viewport(0, 0, w, h);
          gl.uniform2f(u.res, w, h);
          gl.uniform1f(u.scale, scale);
          gl.uniform2f(u.view, vw, vh);
          gl.uniform1f(u.band, band * vh);
          gl.uniform3fv(u.color, rgb);
          gl.uniform1f(u.pattern, PATTERNS[pattern]);
          gl.uniform1f(u.wave, moving ? 1 : 0);
          gl.uniform1f(u.offset, at);
          gl.uniform1f(u.edge, top);
          gl.uniform1f(u.time, time);
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          ctx2d.clearRect(0, 0, w, h);
          ctx2d.drawImage(r.canvas, 0, 0);
        };

        size();
        window.addEventListener("resize", size);
        // it only runs while its section's top is within a screen of the view;
        // the rest of the time it costs nothing (not even a measurement a frame)
        let ticking = false;
        const io = new IntersectionObserver(
          (entries) => {
            const near = entries[entries.length - 1].isIntersecting;
            if (near && !ticking) gsap.ticker.add(draw);
            if (!near && ticking) {
              gsap.ticker.remove(draw);
              shown = false;
              canvas.style.visibility = "hidden";
            }
            ticking = near;
          },
          { rootMargin: "100% 0px 100% 0px" },
        );
        io.observe(canvas);

        teardown = () => {
          io.disconnect();
          gsap.ticker.remove(draw);
          window.removeEventListener("resize", size);
        };
      });
    };

    const near = new IntersectionObserver((e) => e[e.length - 1].isIntersecting && start(), {
      rootMargin: "150% 0px 150% 0px",
    });
    near.observe(section);
    let idle = 0;
    const idleCb = (fn: () => void) =>
      "requestIdleCallback" in window ? window.requestIdleCallback(fn, { timeout: 4000 }) : (globalThis.setTimeout(fn, 400) as unknown as number);
    const cancelLoader = afterLoader(() => (idle = idleCb(start)));
    return () => {
      dead = true;
      near.disconnect();
      cancelLoader();
      if ("cancelIdleCallback" in window) window.cancelIdleCallback(idle);
      else clearTimeout(idle);
      teardown();
    };
  }, [color, pattern, edge, band]);

  return <canvas ref={ref} aria-hidden="true" className="dither-edge" />;
}
