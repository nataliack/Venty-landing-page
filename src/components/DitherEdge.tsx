"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/* A dithered edge for a section rising over the one before it (the hand-off
   in docs/motion.md). Above the section's top edge, a band of the section's
   colour fills in as an ordered dither: the screen is an 8px grid, each cell
   split into 4 x 4 squares of 2px that switch on one by one (a Bayer order)
   as the colour gets denser toward the edge. The grid is fixed to the
   screen, so as the edge rises the squares flip on in place rather than
   travelling with it, and a soft noise lets the edge wobble.

   Drawn by one fragment shader on a screen-sized canvas, only while the
   edge is on screen. Put it inside the rising section (position: relative,
   above the section before it); it reads that section's top each frame. */

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 u_res;    // canvas size, device px
uniform float u_edge;  // the section's top edge, device px from the top
uniform float u_band;  // how far above the edge the dither reaches, device px
uniform float u_cell;  // grid cell, device px (four squares a side)
uniform vec3 u_color;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
// ordered dither thresholds, 0 to 1, for a 4 x 4 block
float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }

void main() {
  vec2 p = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y); // from the top left
  float sq = u_cell / 4.0;
  vec2 square = floor(p / sq);
  float y = (square.y + 0.5) * sq;
  // the edge wobbles a little, in soft lumps about 20 cells (160px) across,
  // the same on every screen
  float wobble = (noise(p / (u_cell * 20.0)) - 0.5) * 0.5 * u_band;
  float above = u_edge - y + wobble;
  float density = 1.0 - clamp(above / u_band, 0.0, 1.0);
  float on = step(bayer4(mod(square, 4.0)) + 0.0001, density);
  gl_FragColor = vec4(u_color * on, on);
}
`;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function DitherEdge({ color, band = 0.32, cell = 8 }: { color: string; band?: number; cell?: number }) {
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
    const uEdge = u("u_edge");
    const uBand = u("u_band");
    const uCell = u("u_cell");
    gl.uniform3fv(u("u_color"), hexToRgb(color));

    let dpr = 1;
    let shown = false;
    let last = NaN;
    const size = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      // whole device px per square, so the 2px squares stay crisp
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uCell, Math.round(cell * dpr));
      last = NaN;
    };

    const draw = () => {
      const top = section.getBoundingClientRect().top;
      const vh = canvas.clientHeight;
      const reach = band * vh;
      // only while the band is on screen: once the section reaches the top it
      // covers everything, and the canvas must not sit over what follows
      const visible = top > 0 && top < vh + reach * 1.4;
      if (visible !== shown) {
        shown = visible;
        canvas.style.visibility = visible ? "visible" : "hidden";
      }
      if (!visible || top === last) return;
      last = top;
      gl.uniform1f(uEdge, top * dpr);
      gl.uniform1f(uBand, reach * dpr);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    size();
    const ro = new ResizeObserver(size);
    ro.observe(canvas);
    gsap.ticker.add(draw);
    return () => {
      gsap.ticker.remove(draw);
      ro.disconnect();
      // the program and buffer go; the context stays with the canvas (losing
      // it here would leave a remount, as in React's dev double run, without one)
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, [color, band, cell]);

  return <canvas ref={ref} aria-hidden="true" className="dither-edge" />;
}
