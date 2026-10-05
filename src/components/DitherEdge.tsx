"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

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

   The edge itself either wobbles in soft lumps ("noise", still) or drifts as
   a slow wave ("wave", like a hem moving).

   Cost: one fragment shader, drawn only on a strip just above the edge (not
   the whole screen), at 1 canvas px per CSS px for the hard-edged patterns
   (scaled up crisp) and at most 1.5 for the round dots, and only on frames
   where the edge has moved (every frame while a wave is on screen).

   Put it inside the rising section (position: relative, above the section
   before it); it reads that section's top each frame. */

export type DitherPattern = "squares" | "dots" | "stitch" | "weave";
export type DitherEdgeMode = "noise" | "wave";

const PATTERNS: Record<DitherPattern, number> = { squares: 0, dots: 1, stitch: 2, weave: 3 };

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
uniform float u_pattern; // 0 squares, 1 dots, 2 stitch, 3 weave
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
  } else {
    // weave: horizontal threads first, then the vertical ones
    float fx = abs(mod(q.x, 8.0) - 4.0);
    float fy = abs(mod(q.y, 8.0) - 4.0);
    float wh = smoothstep(0.0, 0.75, d) * 4.0;
    float wv = smoothstep(0.3, 1.0, d) * 4.0;
    a = max(step(fy, wh), step(fx, wv)) * step(0.02, d);
  }
  gl_FragColor = vec4(u_color * a, a);
}
`;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function DitherEdge({
  color,
  pattern = "squares",
  edge = "noise",
  band = 0.32,
}: {
  color: string;
  pattern?: DitherPattern;
  edge?: DitherEdgeMode;
  /** the band's reach above the edge, as a share of the screen's height */
  band?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const section = canvas?.parentElement;
    if (!canvas || !section) return;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return; // no WebGL: the section simply rises with a clean edge

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
    if (gl.isContextLost() || !gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = (name: string) => gl.getUniformLocation(prog, name);
    const uRes = u("u_res");
    const uScale = u("u_scale");
    const uOffset = u("u_offset");
    const uView = u("u_view");
    const uEdge = u("u_edge");
    const uBand = u("u_band");
    const uTime = u("u_time");
    gl.uniform3fv(u("u_color"), hexToRgb(color));
    gl.uniform1f(u("u_pattern"), PATTERNS[pattern]);
    gl.uniform1f(u("u_wave"), edge === "wave" ? 1 : 0);

    // hard-edged patterns at 1 canvas px per CSS px, scaled up crisp; the
    // round dots a little finer so their curves stay smooth
    const round = pattern === "dots";
    canvas.style.imageRendering = round ? "auto" : "pixelated";
    const moving = edge === "wave";

    let scale = 1;
    let vw = 0;
    let vh = 0;
    let stripH = 0;
    let shown = false;
    let lastTop = NaN;

    const size = () => {
      scale = round ? Math.min(1.5, window.devicePixelRatio || 1) : 1;
      vw = window.innerWidth;
      vh = window.innerHeight;
      // the strip: the band, plus room for the edge's shape above it
      stripH = Math.ceil(band * vh * 1.3);
      canvas.style.height = `${stripH}px`;
      const w = Math.round(vw * scale);
      const h = Math.round(stripH * scale);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uScale, scale);
      gl.uniform2f(uView, vw, vh);
      gl.uniform1f(uBand, band * vh);
      lastTop = NaN;
    };

    const draw = (time: number) => {
      const top = section.getBoundingClientRect().top;
      // the strip sits just above the edge, on whole px so the grid holds
      const at = Math.round(top - stripH);
      // only while the strip is on screen: once the section reaches the top
      // it covers everything, and the canvas must not sit over what follows
      const visible = top > 0 && at < vh;
      if (visible !== shown) {
        shown = visible;
        canvas.style.visibility = visible ? "visible" : "hidden";
      }
      if (!visible || (top === lastTop && !moving)) return;
      lastTop = top;
      canvas.style.transform = `translate3d(0, ${at}px, 0)`;
      gl.uniform1f(uOffset, at);
      gl.uniform1f(uEdge, top);
      gl.uniform1f(uTime, time);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    size();
    window.addEventListener("resize", size);
    gsap.ticker.add(draw);
    return () => {
      gsap.ticker.remove(draw);
      window.removeEventListener("resize", size);
      // the program and buffer go; the context stays with the canvas (losing
      // it here would leave a remount, as in React's dev double run, without one)
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, [color, pattern, edge, band]);

  return <canvas ref={ref} aria-hidden="true" className="dither-edge" />;
}
