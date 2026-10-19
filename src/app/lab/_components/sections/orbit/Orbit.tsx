"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { End, Shell, useBox } from "../hc/parts";
import "./orbit.css";

/* How it works · Orbit. A structure and motion test (low fidelity on
   purpose): a floating meadow at the bottom (an image, still; only its top
   on screen, the earth under it running off the bottom), a figure standing
   on it (a placeholder, behind the cards), and around them a loop of tape measure
   in 3D (WebGL, three.js), the four steps riding on it as glass cards (the
   Made to measure composer's glass). The scroll turns the loop a quarter at
   a time, holding on each step as it comes to the front.

   The loop is drawn twice: its far half on a canvas behind the cards and
   the figure, its near half on a canvas in front of them, so it really goes
   round. The cards are HTML (crisp, readable, their glass blurring what is
   behind them), placed each frame where their point on the loop falls on
   screen, turned with the loop, smaller and fainter as they go round the
   back. */

const STEPS = [
  {
    n: "1",
    k: "Measure",
    h: "Take your measurements.",
    p: "Grab a soft tape measure and enter your bust, waist, hips and back length. Venty shows you where the tape goes for each one. Your measurements are saved, so you only do this once.",
  },
  {
    n: "2",
    k: "Describe",
    h: "Show Venty what you want to make.",
    p: "Upload a photo of a garment you love, or describe it in a sentence. Then choose how fitted you want it and the fabric you plan to sew with.",
  },
  {
    n: "3",
    k: "Draft",
    h: "Venty drafts the pattern to your body.",
    p: "Every pattern piece is drawn from your measurements. Preview the garment on your body in 3D, and ask for changes in plain words, like longer sleeves.",
  },
  {
    n: "4",
    k: "Print",
    h: "Print your pattern and start sewing.",
    p: "Print on A4 at home, or A0 at a print shop. Every piece has grainlines, notches and labels, and the A4 pages come with a map for taping them together.",
  },
];

const LOOP_CM = 100; // the loop is a metre of tape
const TAPE_W = 0.4; // the tape's width (16 mm), scene units: wide, so its print reads
const R = (LOOP_CM * TAPE_W) / (1.6 * 2 * Math.PI); // the loop's radius, at that width
const R0 = (100 * 0.3) / (1.6 * 2 * Math.PI); // the first test's loop, for the phone framing
/* where each card rides: step 1 at the front, the next a quarter round to
   its right, and so on (the loop turns clockwise to bring each forward) */
const cardAngle = (i: number) => Math.PI / 2 - i * (Math.PI / 2);
/* where the print starts: turned so every step's band falls on a whole
   centimetre (50, 75, 0, 25) */
const PHASE = Math.PI / 2;
const mod1 = (x: number) => x - Math.floor(x);
/* the grass, this far under the loop's middle (scene units): the tape held a
   little above it */
const FLOOR = -1.1;
/* the meadow image (2000 x 1168): how tall for its width, how much of it is
   on screen from the top, and where the middle of the grass is (from the top) */
const ISLAND = { ratio: 1168 / 2000, show: 0.62, top: 0.29 };
const WAVE = 0.06; // how much the loop rises and falls as it goes round
const cmAt = (angle: number) =>
  LOOP_CM * mod1(1 - (angle + PHASE) / (2 * Math.PI));

/* the tape's printed face, drawn once onto a canvas, as a tailor's tape is
   printed: a bound edge each side, millimetre ticks from both edges, the
   count in the middle. The steps are printed in the tape's own type, in
   cornflower: STEP 1 where step 1's stretch begins, and from there the tape
   counts again, 2, 3, 4... up to the next step. */
function tapeTexture(maxSize: number) {
  const W = Math.min(8192, maxSize);
  const H = 256;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d")!;
  g.fillStyle = "#f6f7fa";
  g.fillRect(0, 0, W, H);
  // the weave, faintly
  g.fillStyle = "rgba(56,76,101,0.035)";
  for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
  const pxmm = W / (LOOP_CM * 10);
  const mmH = H / 16;
  // the bound edges
  g.fillStyle = "rgba(56,76,101,0.45)";
  g.fillRect(0, mmH * 0.35, W, Math.max(1, mmH * 0.22));
  g.fillRect(0, H - mmH * 0.57, W, Math.max(1, mmH * 0.22));
  const marks = STEPS.map((_, i) => Math.round(cmAt(cardAngle(i)))); // whole cm
  g.fillStyle = "rgba(26,30,48,0.78)";
  for (let mm = 0; mm < LOOP_CM * 10; mm++) {
    const x = Math.round(mm * pxmm);
    const h = (mm % 10 === 0 ? 3.6 : mm % 5 === 0 ? 2.5 : 1.6) * mmH;
    const tw = Math.max(1, pxmm * (mm % 10 === 0 ? 0.22 : 0.14));
    g.fillRect(x, mmH * 0.8, tw, h);
    g.fillRect(x, H - mmH * 0.8 - h, tw, h);
  }
  g.textAlign = "center";
  g.textBaseline = "middle";
  const sans = "Familjen Grotesk, system-ui, sans-serif";
  // type drawn at its true width: the canvas has fewer pixels per mm along
  // the tape than across it
  const text = (s: string, x: number, y: number) => {
    g.save();
    g.translate(x, y);
    g.scale(pxmm / mmH, 1);
    g.fillText(s, 0, 0);
    g.restore();
  };
  g.font = `500 ${Math.round(4.6 * mmH)}px ${sans}`;
  g.fillStyle = "rgba(26,30,48,0.78)";
  for (let cm = 0; cm < LOOP_CM; cm++) {
    // how far past the last step this centimetre is
    const since = Math.min(...marks.map((m) => (cm - m + LOOP_CM) % LOOP_CM));
    if (since < 3 || since > LOOP_CM / STEPS.length - 1) continue; // the step's own room
    text(String(since), cm * 10 * pxmm, H / 2 + mmH * 0.3);
  }
  // the steps (printed past both ends too, so one on the join is whole)
  g.font = `600 ${Math.round(4.6 * mmH)}px ${sans}`;
  marks.forEach((m, i) => {
    for (const shift of [-LOOP_CM, 0, LOOP_CM]) {
      const c = (m + shift) * 10 * pxmm;
      g.fillStyle = "#4a5fd8";
      g.fillRect(c - pxmm * 0.25, mmH * 0.8, pxmm * 0.5, mmH * 3.6);
      g.fillRect(c - pxmm * 0.25, H - mmH * 4.4, pxmm * 0.5, mmH * 3.6);
      g.save();
      g.translate(c + 13 * pxmm, H / 2 + mmH * 0.3);
      g.scale(pxmm / mmH, 1);
      g.letterSpacing = `${Math.round(mmH * 0.5)}px`;
      g.fillText(`STEP ${STEPS[i].n}`, 0, 0);
      g.restore();
    }
  });
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

/* the loop as a ribbon: round, rising and falling a little as it goes, its
   face turned slightly up to the light */
function loopGeometry() {
  const N = 480;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * Math.PI * 2;
    const y = Math.sin(t * 2) * WAVE;
    const c = new THREE.Vector3(Math.cos(t) * R, y, Math.sin(t) * R);
    const out = new THREE.Vector3(Math.cos(t), 0, Math.sin(t));
    // the tape stands up, leaning a little out at the top
    const up = new THREE.Vector3(0, 1, 0)
      .addScaledVector(out, 0.1)
      .normalize();
    const a = c.clone().addScaledVector(up, -TAPE_W / 2);
    const b = c.clone().addScaledVector(up, TAPE_W / 2);
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
    // read from outside: the numbers run left to right across the front, upright
    const u = 1 - (t + PHASE) / (2 * Math.PI);
    uv.push(u, 0, u, 1);
    if (i < N) {
      const k = i * 2;
      idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

export function HcOrbit() {
  return (
    <Shell>
      <Orbit />
    </Shell>
  );
}

function Orbit() {
  const box = useBox();
  const sec = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLCanvasElement>(null);
  const front = useRef<HTMLCanvasElement>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const [on, setOn] = useState(0);

  useEffect(() => {
    const s = sec.current;
    const st = stage.current;
    const cb = back.current;
    const cf = front.current;
    if (!box || !s || !st || !cb || !cf) return;

    const make = (canvas: HTMLCanvasElement) => {
      const r = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
      });
      r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      r.outputColorSpace = THREE.SRGBColorSpace;
      r.localClippingEnabled = true;
      return r;
    };
    const rBack = make(cb);
    const rFront = make(cf);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 200);
    camera.position.set(0, 2.6, 13);
    const centre = new THREE.Vector3(0, 0.2, 0);
    camera.lookAt(centre);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd6dcf0, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(-4, 6, 5);
    scene.add(key);

    const loop = new THREE.Group();
    scene.add(loop);
    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.7,
      side: THREE.DoubleSide,
    });
    const tape = new THREE.Mesh(loopGeometry(), mat);
    loop.add(tape);
    document.fonts.ready.finally(() => {
      mat.map = tapeTexture(rBack.capabilities.maxTextureSize);
      mat.emissiveMap = mat.map; // lit from within a little: white, not grey
      mat.emissive.set(0xffffff);
      mat.emissiveIntensity = 0.45;
      mat.needsUpdate = true;
      kick();
    });

    // the far half and the near half: split by a plane through the loop's
    // centre, square to the camera
    const toCam = new THREE.Vector3()
      .subVectors(camera.position, centre)
      .setY(0)
      .normalize();
    const farHalf = new THREE.Plane(toCam.clone().negate(), 0);
    const nearHalf = new THREE.Plane(toCam.clone(), 0);

    let w = 0;
    let h = 0;
    let rot = 0;
    let sideY = 0; // where the side cards stand on screen
    let target = 0;
    let raf = 0;
    const v = new THREE.Vector3();
    const v2 = new THREE.Vector3();
    const toScreen = (p: THREE.Vector3) => {
      v.copy(p).project(camera);
      return { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h };
    };

    const size = () => {
      w = st.clientWidth;
      h = st.clientHeight;
      camera.aspect = w / h;
      // phones: back off so the whole loop fits
      const camZ = w < 700 ? (30 * R) / R0 : 13 * (R / R0) ** 0.5;
      camera.position.set(0, camZ * 0.27, camZ);
      camera.updateProjectionMatrix();
      // the meadow: 78vw wide (wider on phones, running off both sides), only
      // its top on screen, the earth under it running off the bottom
      const iw = w < 700 ? w * 1.3 : w * 0.78;
      const ih = iw * ISLAND.ratio;
      const show = w < 700 ? 0.85 : ISLAND.show; // phones: more of it, the scene higher in the tall screen
      const itop = h - ih * show;
      st.style.setProperty("--iw", `${iw}px`);
      st.style.setProperty("--itop", `${itop}px`);
      // what of it runs below the screen: room left under the scene for it,
      // so it is seen whole as the page scrolls on
      s.querySelector<HTMLElement>(".or-pin")!.style.marginBottom = `${ih * (1 - show)}px`;
      // aim the camera so the loop's floor lands in the middle of the grass
      const floorAt = itop + ih * ISLAND.top;
      let lookY = 1;
      for (let k = 0; k < 4; k++) {
        camera.lookAt(0, lookY, 0);
        camera.updateMatrixWorld();
        const y = toScreen(new THREE.Vector3(0, FLOOR, 0)).y;
        const perUnit =
          h / (2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360));
        lookY -= (y - floorAt) / perUnit; // looking higher moves the scene down the screen
      }
      camera.lookAt(0, lookY, 0);
      camera.updateMatrixWorld();
      rBack.setSize(w, h, false);
      rFront.setSize(w, h, false);
      // where the grass and the loop's centre fall, for the figure
      const c = toScreen(new THREE.Vector3(0, 0, 0));
      const base = toScreen(new THREE.Vector3(0, FLOOR, 0));
      const edge = toScreen(new THREE.Vector3(R, FLOOR, 0));
      st.style.setProperty("--cx", `${c.x}px`);
      st.style.setProperty("--cy", `${c.y}px`);
      st.style.setProperty("--base", `${base.y}px`);
      st.style.setProperty("--span", `${(edge.x - base.x) * 2}px`);
      // the loop's shadow on the grass: an ellipse through its four points there
      const sf = toScreen(new THREE.Vector3(0, FLOOR, R));
      const sb = toScreen(new THREE.Vector3(0, FLOOR, -R));
      st.style.setProperty("--sh", `${sf.y - sb.y}px`);
      st.style.setProperty("--sy", `${(sf.y + sb.y) / 2}px`);
      sideY = 0; // worked out again on the next frame
    };

    const draw = () => {
      raf = 0;
      rot += (target - rot) * 0.12;
      if (Math.abs(target - rot) < 0.0005) rot = target;
      loop.rotation.y = -rot; // clockwise, seen from above
      rBack.clippingPlanes = [farHalf];
      rBack.render(scene, camera);
      rFront.clippingPlanes = [nearHalf];
      rFront.render(scene, camera);
      // the cards: each where its point on the loop falls across the screen,
      // flat to us (never turned). Those at the sides sit on one line; the
      // one coming to the front rises above them, and is the clearest
      const cardW = w < 700 ? (3.6 * R) / R0 : 1.95; // scene units, at the front (phones: big enough to read)
      const yAt = (i: number) => Math.sin(cardAngle(i) * 2) * WAVE + TAPE_W * 0.5 + 0.12; // just above the tape
      if (!sideY) sideY = toScreen(v2.set(R, yAt(1), 0)).y;
      const lift = h * 0.06;
      cards.current.forEach((el, i) => {
        if (!el) return;
        const a = cardAngle(i) + rot; // its angle in the world; the front is +90 deg
        const p = new THREE.Vector3(Math.cos(a) * R, yAt(i), Math.sin(a) * R);
        const sp = toScreen(p);
        // its size on screen, from how wide it would be where it stands
        v2.copy(p).add(new THREE.Vector3(cardW, 0, 0));
        const px = Math.abs(toScreen(v2).x - sp.x);
        const depth = Math.sin(a); // 1 at the front, -1 at the back
        const front = Math.max(0, depth) ** 1.5;
        const y = depth > 0 ? sideY - lift * front : sp.y; // round the back: as it falls
        el.style.transform = `translate3d(${sp.x}px, ${y}px, 0) translate(-50%, -100%) scale(${px / el.offsetWidth})`;
        // clear at the front, faint at the sides, gone (shadow and all) before
        // it goes round the back
        // (phones: the sides run off the screen, so they only show coming in)
        const edge = w < 700 ? -0.06 : 0.22;
        el.style.opacity = String(Math.min(1, Math.max(0, (depth + edge) / (0.4 + edge))));
        el.style.zIndex = String(depth > 0 ? 30 + Math.round(depth * 10) : 3);
        el.dataset.front = String(depth > 0.92);
      });
      if (rot !== target) raf = requestAnimationFrame(draw);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };

    // the scroll turns the loop with it. When it stops between two steps it
    // settles on one: the next one in the way you were going if you scrolled
    // at all on purpose (a sixth of a step), back where you were if not
    let at = 0; // the step it last settled on
    let going = -1; // the step it is gliding to (-1: none); your own scroll cancels it
    let idle = 0;
    const yours = () => void (going = -1);
    const span = () => {
      const pin = s.querySelector<HTMLElement>(".or-pin")!;
      const top =
        pin.getBoundingClientRect().top -
        box.getBoundingClientRect().top +
        box.scrollTop;
      return { top, run: pin.offsetHeight - box.clientHeight };
    };
    const onScroll = () => {
      const { top, run } = span();
      const p = Math.min(1, Math.max(0, (box.scrollTop - top) / Math.max(1, run)));
      const k = p * (STEPS.length - 1);
      target = k * (Math.PI / 2);
      setOn(Math.round(k));
      kick();
      clearTimeout(idle);
      const inside = box.scrollTop > top + 1 && box.scrollTop < top + run - 1;
      if (!inside) {
        at = Math.round(k);
        return;
      }
      idle = window.setTimeout(() => {
        if (going >= 0) {
          // still gliding (a slow frame paused it): carry on to the same step
          const y = top + (going / (STEPS.length - 1)) * run;
          if (Math.abs(y - box.scrollTop) > 2) box.scrollTo({ top: y, behavior: "smooth" });
          else going = -1;
          return;
        }
        const d = k - at;
        let to = at;
        if (d > 1 / 6) to = Math.ceil(k - 1 / 6);
        else if (d < -1 / 6) to = Math.floor(k + 1 / 6);
        to = Math.min(STEPS.length - 1, Math.max(0, to));
        at = to;
        const y = top + (to / (STEPS.length - 1)) * run;
        if (Math.abs(y - box.scrollTop) > 2) {
          going = to;
          box.scrollTo({ top: y, behavior: "smooth" });
        }
      }, 120);
    };

    size();
    onScroll();
    at = Math.round(target / (Math.PI / 2));
    rot = target;
    draw();
    const ro = new ResizeObserver(() => {
      size();
      kick();
    });
    ro.observe(st);
    box.addEventListener("scroll", onScroll, { passive: true });
    for (const e of ["wheel", "touchstart", "keydown", "pointerdown"] as const)
      box.addEventListener(e, yours, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(idle);
      ro.disconnect();
      box.removeEventListener("scroll", onScroll);
      for (const e of ["wheel", "touchstart", "keydown", "pointerdown"] as const)
        box.removeEventListener(e, yours);
      tape.geometry.dispose();
      (tape.material as THREE.MeshStandardMaterial).map?.dispose();
      (tape.material as THREE.Material).dispose();
      rBack.dispose();
      rFront.dispose();
    };
  }, [box]);

  return (
    <>
      <section ref={sec} className="or">
        {/* the title scrolls by as usual; the scene below holds while the loop turns */}
        <header data-in className="or-intro">
          <p className="hc-eyebrow">How it works</p>
          <h2 className="or-title">From your body to the cutting table.</h2>
        </header>
        <div className="or-pin">
          <div ref={stage} className="or-stage">
            <p className="or-count" aria-live="polite">
              Step <b>{STEPS[on].n}</b> of 4 · {STEPS[on].k}
            </p>

            {/* the meadow (still, for now), and a placeholder figure standing on it */}
            <img
              className="or-island"
              src="/lab/orbit/island-2000.webp"
              srcSet="/lab/orbit/island-1200.webp 1200w, /lab/orbit/island-2000.webp 2000w"
              sizes="(max-width: 699px) 150vw, 90vw"
              width={2000}
              height={1168}
              alt=""
              decoding="async"
            />
            <div className="or-figure" aria-hidden="true">
              <span>
                Figure · your image, standing on the meadow, behind the cards
              </span>
            </div>

            <div className="or-shadow" aria-hidden="true" />
            <canvas
              ref={back}
              className="or-canvas is-back"
              aria-hidden="true"
            />
            {STEPS.map((s, i) => (
              <article
                key={s.n}
                ref={(el) => void (cards.current[i] = el)}
                className="or-card"
                aria-current={on === i ? "step" : undefined}
              >
                <p className="or-card__top">
                  <b aria-hidden="true">{s.n}</b>
                  <span>
                    <span className="sr-only">Step {s.n}: </span>
                    {s.k}
                  </span>
                </p>
                <h3 className="or-card__h">{s.h}</h3>
                <p className="or-card__p">{s.p}</p>
              </article>
            ))}
            <canvas
              ref={front}
              className="or-canvas is-front"
              aria-hidden="true"
            />

          </div>
        </div>
      </section>
      <section className="hc-sec">
        <End />
      </section>
    </>
  );
}
