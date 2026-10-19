"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import * as THREE from "three";
import { End, Shell, useBox } from "../hc/parts";
import "./orbit.css";

/* How it works · Orbit. A structure and motion test (low fidelity on
   purpose): a plinth at the bottom (an image, still), a figure standing on
   it (an image, behind the cards), and around them a loop of tape measure
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

const LOOP_CM = 100; // the loop is a metre of tape
const TAPE_W = 0.3; // the tape's width (16 mm), scene units
const R = (LOOP_CM * TAPE_W) / (1.6 * 2 * Math.PI); // the loop's radius: a metre round, at that width
/* where each card rides: step 1 at the front, the next a quarter round to
   its right, and so on (the loop turns clockwise to bring each forward) */
const cardAngle = (i: number) => Math.PI / 2 - i * (Math.PI / 2);
/* where the print starts: turned so every step's band falls on a whole
   centimetre (50, 75, 0, 25) */
const PHASE = Math.PI / 2;
const mod1 = (x: number) => x - Math.floor(x);
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
    const y = Math.sin(t * 2) * 0.16;
    const c = new THREE.Vector3(Math.cos(t) * R, y, Math.sin(t) * R);
    const out = new THREE.Vector3(Math.cos(t), 0, Math.sin(t));
    // the tape stands up, leaning a little out at the top
    const up = new THREE.Vector3(0, 1, 0)
      .addScaledVector(out, 0.22)
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
      camera.position.set(0, w < 700 ? 3.4 : 2.6, w < 700 ? 30 : 13);
      camera.updateProjectionMatrix();
      // aim the camera so the loop's floor lands on the plinth's top surface
      // (the plinth: 90vw wide, its whole height on screen, near the bottom)
      const plinthH = w * 0.9 * 0.26; // the placeholder plinth: 90vw by 26% of that
      const floorAt = h - h * 0.03 - plinthH * 0.84;
      let lookY = 1;
      for (let k = 0; k < 4; k++) {
        camera.lookAt(0, lookY, 0);
        camera.updateMatrixWorld();
        const y = toScreen(new THREE.Vector3(0, -0.9, 0)).y;
        const perUnit =
          h / (2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360));
        lookY -= (y - floorAt) / perUnit; // looking higher moves the scene down the screen
      }
      camera.lookAt(0, lookY, 0);
      camera.updateMatrixWorld();
      rBack.setSize(w, h, false);
      rFront.setSize(w, h, false);
      // where the plinth's top and the loop's centre fall, for the images
      const c = toScreen(new THREE.Vector3(0, 0, 0));
      const base = toScreen(new THREE.Vector3(0, -0.9, 0));
      const edge = toScreen(new THREE.Vector3(R, -0.9, 0));
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
      const cardW = w < 700 ? 3.6 : 1.95; // scene units, at the front (phones: big enough to read)
      cards.current.forEach((el, i) => {
        if (!el) return;
        const a = cardAngle(i) + rot; // its angle in the world; the front is +90 deg
        const y = Math.sin(cardAngle(i) * 2) * 0.16 + TAPE_W * 0.5 + 0.3; // floating above the tape
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
        el.style.opacity = String(0.25 + 0.75 * near ** 1.6);
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

    // the scroll turns the loop a quarter at a time, holding on each step
    const onScroll = () => {
      const pin = s.querySelector<HTMLElement>(".or-pin")!;
      const top =
        pin.getBoundingClientRect().top -
        box.getBoundingClientRect().top +
        box.scrollTop;
      const run = pin.offsetHeight - box.clientHeight;
      const p = Math.min(
        1,
        Math.max(0, (box.scrollTop - top) / Math.max(1, run)),
      );
      const k = p * (STEPS.length - 1);
      const base = Math.floor(k);
      const f = k - base;
      const hold =
        f < 0.3
          ? 0
          : f > 0.7
            ? 1
            : ((f - 0.3) / 0.4) ** 2 * (3 - 2 * ((f - 0.3) / 0.4));
      const turns = Math.min(STEPS.length - 1, base + hold);
      target = turns * (Math.PI / 2);
      setOn(Math.round(turns));
      kick();
    };

    size();
    onScroll();
    rot = target;
    draw();
    const ro = new ResizeObserver(() => {
      size();
      kick();
    });
    ro.observe(st);
    box.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      box.removeEventListener("scroll", onScroll);
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

            {/* placeholders: the plinth (an image, still) and the figure standing on it */}
            <div className="or-plinth" aria-hidden="true">
              <span>Plinth · your image</span>
            </div>
            <div className="or-figure" aria-hidden="true">
              <span>
                Figure · your image, standing on the plinth, behind the cards
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

            <ol className="or-steps" aria-hidden="true">
              {STEPS.map((s, i) => (
                <li
                  key={s.n}
                  className={i === on ? "is-on" : ""}
                  style={{ "--i": i } as CSSProperties}
                >
                  {s.n}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
      <section className="hc-sec">
        <End />
      </section>
    </>
  );
}
