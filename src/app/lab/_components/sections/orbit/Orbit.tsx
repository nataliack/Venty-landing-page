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
    n: "01",
    k: "Measure",
    h: "Four measures to start.",
    p: "Add more when you want a closer fit. Every measure shows where the tape goes, and your body is saved for every pattern after.",
  },
  {
    n: "02",
    k: "Describe",
    h: "Show it. Say it.",
    p: "Upload the photo, or describe it in a sentence. Choose how close it should sit and the fabric you have in mind.",
  },
  {
    n: "03",
    k: "Draft",
    h: "See it on you.",
    p: "Venty drafts the pieces and shows the garment on your body in 3D. Ask for changes in plain words.",
  },
  {
    n: "04",
    k: "Print",
    h: "Print it at home.",
    p: "Print on A4 at home, or A0 at a print shop. Grainlines, notches and labels on every piece, with a page map to tape the A4 pages together.",
  },
];

const LOOP_CM = 140; // the loop is 1.4 m of tape, wide over the meadow
const TAPE_W = 0.22; // the tape's width (16 mm), scene units
const R = (LOOP_CM * TAPE_W) / (1.6 * 2 * Math.PI); // the loop's radius, at that width
const R0 = (100 * 0.3) / (1.6 * 2 * Math.PI); // the first test's loop, for the phone framing
/* where each card rides: step 1 at the front, the next a quarter round to
   its right, and so on (the loop turns clockwise to bring each forward) */
const cardAngle = (i: number) => Math.PI / 2 - i * (Math.PI / 2);
/* where the print starts: turned so every step's band falls on a whole
   centimetre (70, 105, 0, 35) */
const PHASE = Math.PI / 2;
const mod1 = (x: number) => x - Math.floor(x);
/* the grass, this far under the loop's middle (scene units): the tape on it */
const FLOOR = -0.24;
/* the meadow image (2000 x 1168): how tall for its width, how much of it is
   on screen from the top, and where the middle of the grass is (from the top) */
const ISLAND = { ratio: 1168 / 2000, show: 0.62, top: 0.29 };
const WAVE = 0.06; // how much the loop rises and falls as it goes round
const cmAt = (angle: number) =>
  LOOP_CM * mod1(1 - (angle + PHASE) / (2 * Math.PI));

/* the tape's printed face, drawn once onto a canvas. Ticks from both edges;
   the only cornflower marks the steps: a band with the step's number where
   its stretch of tape begins. From each band the tape counts again, 1, 2,
   3... up to the next step's band, so a step and the numbers after it
   belong together. */
function tapeTexture(maxSize: number) {
  const W = Math.min(8192, maxSize);
  const H = 160;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d")!;
  g.fillStyle = "#f3f5fa";
  g.fillRect(0, 0, W, H);
  g.fillStyle = "rgba(56,76,101,0.05)";
  for (let y = 0; y < H; y += 2) g.fillRect(0, y, W, 1);
  const pxmm = W / (LOOP_CM * 10);
  const mmH = H / 16;
  const marks = STEPS.map((_, i) => Math.round(cmAt(cardAngle(i)))); // whole cm
  g.fillStyle = "rgba(26,30,48,0.8)";
  for (let mm = 0; mm < LOOP_CM * 10; mm++) {
    const x = Math.round(mm * pxmm);
    const h = (mm % 10 === 0 ? 4 : mm % 5 === 0 ? 2.6 : 1.6) * mmH;
    g.fillRect(x, 0, Math.max(1, pxmm * 0.15), h);
    g.fillRect(x, H - h, Math.max(1, pxmm * 0.15), h);
  }
  g.textAlign = "center";
  g.textBaseline = "middle";
  const sans = "Familjen Grotesk, system-ui, sans-serif";
  for (let cm = 0; cm < LOOP_CM; cm++) {
    // how far past the last step's band this centimetre is
    const since = Math.min(...marks.map((m) => (cm - m + LOOP_CM) % LOOP_CM));
    if (since < 2 || since > LOOP_CM / STEPS.length - 2) continue; // the bands' own room
    g.font = `500 ${Math.round(3.2 * mmH)}px ${sans}`;
    g.fillStyle = "rgba(26,30,48,0.62)";
    g.fillText(String(since), cm * 10 * pxmm, H / 2 + mmH * 0.2);
  }
  // the steps: a cornflower band, 36 mm long, the number in it (drawn past
  // both ends too, so a band on the join is whole)
  marks.forEach((m, i) => {
    for (const shift of [-LOOP_CM, 0, LOOP_CM]) {
      const c = (m + shift) * 10 * pxmm;
      g.fillStyle = "#687ef5";
      g.beginPath();
      g.roundRect(
        c - 18 * pxmm,
        mmH * 1.1,
        36 * pxmm,
        H - mmH * 2.2,
        mmH * 0.8,
      );
      g.fill();
      g.fillStyle = "#eff4ff";
      g.font = `600 ${Math.round(6 * mmH)}px ${sans}`;
      g.fillText(STEPS[i].n, c, H / 2 + mmH * 0.3);
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
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
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
      camera.position.set(0, w < 700 ? 3.4 : 2.6, w < 700 ? (30 * R) / R0 : 13);
      camera.updateProjectionMatrix();
      // the meadow: 78vw wide (wider on phones, running off both sides), only
      // its top on screen, the earth under it running off the bottom
      const iw = w < 700 ? w * 1.3 : w * 0.78;
      const ih = iw * ISLAND.ratio;
      const itop = h - ih * ISLAND.show;
      st.style.setProperty("--iw", `${iw}px`);
      st.style.setProperty("--itop", `${itop}px`);
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
      // the cards: each at its point on the loop, just above the tape
      const cardW = w < 700 ? (3.6 * R) / R0 : 1.95; // scene units, at the front (phones: big enough to read)
      cards.current.forEach((el, i) => {
        if (!el) return;
        const a = cardAngle(i) + rot; // its angle in the world; the front is +90 deg
        const y = Math.sin(cardAngle(i) * 2) * WAVE + TAPE_W * 0.5 + 0.12; // just above the tape
        const p = new THREE.Vector3(Math.cos(a) * R, y, Math.sin(a) * R);
        const sp = toScreen(p);
        // its size on screen, from how wide it would be where it stands
        v2.copy(p).add(new THREE.Vector3(cardW, 0, 0));
        const sp2 = toScreen(v2);
        const px = Math.abs(sp2.x - sp.x);
        const depth = Math.sin(a); // 1 at the front, -1 at the back
        const near = (depth + 1) / 2;
        // turned as the face of a cylinder is: square on at the front, its
        // face turning away to the right on the right (its far edge going
        // back), to the left on the left, its back to us at the back; a
        // little short of edge-on at the sides, so they still read
        let turn = ((Math.PI / 2 - a) * 180) / Math.PI;
        turn = ((((turn + 180) % 360) + 360) % 360) - 180;
        el.dataset.back = String(Math.abs(turn) > 90);
        turn *= 0.78;
        el.style.transform = `translate3d(${sp.x}px, ${sp.y}px, 0) translate(-50%, -100%) scale(${px / el.offsetWidth}) perspective(1100px) rotateY(${turn}deg)`;
        el.style.opacity = String(Math.max(0, (near - 0.2) / 0.8) ** 1.4);
        el.style.zIndex = String(
          depth > 0 ? 30 + Math.round(depth * 10) : 2 + Math.round(near * 2),
        );
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
              <b>{STEPS[on].n}</b> / 04 · {STEPS[on].k}
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
                <div className="or-card__img" aria-hidden="true">
                  Image · {s.n} {s.k}
                </div>
                <p className="or-card__top">
                  <b>{s.n}</b> {s.k}
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
