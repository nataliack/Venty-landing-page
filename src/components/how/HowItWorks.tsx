"use client";

import { memo, useEffect, useRef, useState, type CSSProperties } from "react";
import { createSequence } from "@/lib/sequence";
import { useReveals } from "@/lib/useReveals";
import { SCROLLER_ID, scrollToY } from "../SmoothScroll";
import islandFilm from "../../../public/how/orbit/island/manifest.json";
import "./how.css";

/* 3. How it works, the orbit. Ported from the lab
   (src/app/lab/_components/sections/orbit/Orbit.tsx), with the class prefix
   hw in place of the lab's or, so the lab's styles can never leak in.

   A floating meadow turns in the sky over a valley (Jose's film of it, as a
   scroll-played image sequence), and round it the four steps are glass
   cards stuck to an invisible cylinder. The scroll holds the scene and turns
   the cylinder a step at a time, the meadow turning with it; behind each
   card floats its step's object, fading in as the card comes to the front.
   A pill at the top names the step and takes you to any other.

   The cards are stuck to the cylinder like stickers: each one bends round
   it. CSS can't bend an element, so each card's words are drawn as thin
   upright strips, every strip the whole card clipped to its own slice and
   set at its own angle round the cylinder; side by side they read as one
   curved card. The glass under them is drawn flat on the screen to the
   card's exact outline on the cylinder (worked out here with the same
   turns), so the blur is smooth; the edges are drawn on a canvas. A mask at
   the meadow's sides hides the cards as they turn away. The strips are
   decoration (aria-hidden); the steps are read from a plain list.

   Settling: on wheels and trackpads, when the scroll stops between two
   steps it goes on to the next one in the way you were going (if you
   scrolled at all on purpose), through Lenis. On touch screens, the phone's
   own snapping, on only within the steps.

   The hand-off (docs/motion.md): after the last step the scene holds for
   1.3 more screens. Inside it the layers part at their own speeds: the
   meadow, the cards and the objects fly up and away, and the valley rises
   more slowly, so its peaks come up into view; a third of a screen in,
   Features (night) starts rising over it all 1:1 with its dithered edge.

   The meadow's frames only start downloading as the section comes near. */

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

const BASE = "/how/orbit";
const STEP = 58; // degrees between cards round the cylinder: the next one turned well round at the side
const SLICES = 12; // strips per card: enough that the bend reads smooth
/* the meadow: the turning film, every one of its frames from the first step
   to the cards' full turn (public/how/orbit/island/: AVIF, keyed with a
   loose soft mask round it, 1400px and 900px for phones). Played by the
   site's sequence engine (src/lib/sequence.ts): downloaded once, the frames
   just ahead of the turn first, only a few decoded at a time, always one
   real frame on screen (no blending). The manifest has how far the meadow
   has turned at each frame (the film eases in), so it turns exactly with
   the cards. How tall for its width, and where the middle of its grass is */
const ISLAND = { ratio: islandFilm.height / islandFilm.width, top: 0.28 };
/** the film's exact (fractional) frame for a turn of so many degrees */
const filmAt = (deg: number) => {
  const a = islandFilm.angles;
  if (deg <= a[0]) return 0;
  for (let k = 1; k < a.length; k++) if (a[k] >= deg) return k - 1 + (deg - a[k - 1]) / (a[k] - a[k - 1]);
  return a.length - 1;
};
/* what floats behind the cards, one per step (1000px tall, transparent):
   s, its size in the band; y, how far it sits up (-) or down from the
   band's middle, as a share of the band. Tuned by eye: the dress form high
   enough that its tape doesn't peek out under the card, the collage well up
   so its photos show over the card */
const OBJECTS = [
  { src: `${BASE}/objects/1-measure.webp`, w: 900, h: 1000, s: 0.84, y: -0.085 },
  { src: `${BASE}/objects/2-describe.webp`, w: 1312, h: 1000, s: 0.7, y: -0.17 },
  { src: `${BASE}/objects/3-draft.webp`, w: 842, h: 1000, s: 0.86, y: -0.05 },
  { src: `${BASE}/objects/4-print.webp`, w: 968, h: 1000, s: 0.8, y: -0.06 },
];
/* the valley behind (1792 x 1943, its sky cleared to the page's own pale) */
const VALLEY = { ratio: 1943 / 1792 };
/* the hand-off: how many screens it holds (Features rises over the last of
   them), and how far each layer rises for each px scrolled */
const HAND = 1.3;
const FLY = { fore: 0.9, valley: 0.55 };

/* the cards' glass, edges and words: built once and never rendered again
   (the turn moves them directly), so a change of step only re-renders the
   step pill, not the 48 strips */
const Scene = memo(function Scene() {
  return (
    <>
      {/* each card's glass, drawn to its outline on the cylinder */}
      {STEPS.map((s) => (
        <div key={s.n} className="hw-pane" aria-hidden="true" />
      ))}
      {/* the cards' edges, drawn on a canvas: cheap to draw again every frame of a turn */}
      <canvas className="hw-lines" aria-hidden="true" />

      {/* the cylinder, and on it each card's words as strips */}
      <div className="hw-view" aria-hidden="true">
        <div className="hw-ring">
          {STEPS.map((s) => (
            <div key={s.n} className="hw-sticker">
              {Array.from({ length: SLICES }, (_, k) => (
                <article key={k} className="hw-card">
                  <h3 className="hw-card__h">{s.h}</h3>
                  <p className="hw-card__p">{s.p}</p>
                </article>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
});

export function HowItWorks() {
  const sec = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(0);
  const goTo = useRef<(i: number) => void>(() => {});
  useReveals(sec);

  useEffect(() => {
    const s = sec.current;
    const st = stage.current;
    const box = document.getElementById(SCROLLER_ID);
    const rg = st?.querySelector<HTMLElement>(".hw-ring");
    if (!box || !s || !st || !rg) return;
    const groups = [...rg.querySelectorAll<HTMLElement>(".hw-sticker")];
    const view = st.querySelector<HTMLElement>(".hw-view")!;
    const panes = [...st.querySelectorAll<HTMLElement>(".hw-pane")];
    const edges = st.querySelector<HTMLCanvasElement>(".hw-lines")!;
    const eg = edges.getContext("2d")!;
    const valley = st.querySelector<HTMLElement>(".hw-valley")!;
    const fore = st.querySelector<HTMLElement>(".hw-fore")!;
    let edgeDpr = 1;
    let edgeFade: CanvasGradient | null = null;
    let paneW = 0;
    let paneH = 0;
    const btns = [...st.querySelectorAll<HTMLElement>(".hw-steps button")];
    const objects = [...st.querySelectorAll<HTMLElement>(".hw-object")];
    const glow = st.querySelector<HTMLElement>(".hw-steps__glow")!;
    let slots: [number, number][] = btns.map((b) => [b.offsetLeft, b.offsetWidth]); // each button's left and width
    const touch = window.matchMedia("(pointer: coarse)").matches;

    let rot = 0; // degrees the cylinder has turned
    let target = 0;
    let raf = 0;
    // this screen's numbers, from size()
    let w = 0;
    let cw = 0;
    let ch = 0;
    let R = 0;
    let ry = 0;
    let mask = "";
    let maskEdge = Infinity; // past this, from the middle, the mask hides everything
    const P = 2400; // the perspective (matches .hw-view)
    const TILT = (4 * Math.PI) / 180; // seen from a touch below
    const BACK = 0.6; // the cylinder set back by this much of its radius

    /* a point on a card (x across it, y down it, from its middle) to the
       screen, with the same turns the CSS gives the strips: round the
       cylinder, the cylinder turned and tilted, then the perspective */
    const project = (i: number, x: number, y: number) => {
      const a = ((i * STEP - rot) * Math.PI) / 180 + x / R;
      const X = R * Math.sin(a);
      let Z = R * Math.cos(a);
      const Y = y * Math.cos(TILT) - Z * Math.sin(TILT);
      Z = y * Math.sin(TILT) + Z * Math.cos(TILT) - BACK * R;
      const k = P / (P - Z);
      return [w / 2 + X * k, ry + Y * k];
    };
    /* a card's outline, its 28px corners and all, as screen points: the long
       edges sampled finely, so they follow the curve */
    const outline = (i: number) => {
      const r = 28;
      const hx = cw / 2;
      const hy = ch / 2;
      const pts: number[][] = [];
      const arc = (cx: number, cy: number, from: number) => {
        for (let k = 0; k <= 6; k++) {
          const t = from + (k / 6) * (Math.PI / 2);
          pts.push(project(i, cx + Math.cos(t) * r, cy + Math.sin(t) * r));
        }
      };
      const N = 18;
      arc(-hx + r, -hy + r, Math.PI);
      for (let k = 1; k < N; k++) pts.push(project(i, -hx + r + ((cw - 2 * r) * k) / N, -hy));
      arc(hx - r, -hy + r, -Math.PI / 2);
      arc(hx - r, hy - r, 0);
      for (let k = 1; k < N; k++) pts.push(project(i, hx - r - ((cw - 2 * r) * k) / N, hy));
      arc(-hx + r, hy - r, Math.PI / 2);
      return pts;
    };

    // the scene's place and the cylinder's size, for this screen
    const size = () => {
      w = st.clientWidth;
      const h = st.clientHeight;
      const phone = w < 700;
      // the meadow: 78vw wide (wider on phones), all of it there, floating
      // with its grass a little below the screen's middle (lower on phones)
      const iw = phone ? w * 1.3 : w * 0.78;
      const ih = iw * ISLAND.ratio;
      const itop = h * (phone ? 0.72 : 0.62) - ih * ISLAND.top;
      st.style.setProperty("--ih", `${ih}px`);
      // the valley: the full width (phones: about two thirds of its width on
      // screen, so its mountains frame the meadow either side as on desktop),
      // lowered so its sky is behind the meadow: the line where its peaks
      // begin (an eighth of the way down the photo) at the meadow's middle
      const vw = phone ? w * 1.5 : Math.max(w, (h * 1.9) / VALLEY.ratio);
      const vh = vw * VALLEY.ratio;
      st.style.setProperty("--vw", `${vw}px`);
      st.style.setProperty("--vh", `${vh}px`);
      st.style.setProperty("--vtop", `${itop + ih * 0.5 - vh * 0.12}px`);
      // the cards: their width, and the cylinder they are stuck round
      cw = phone ? Math.min(290, w * 0.74) : 340;
      R = phone ? cw * 1.35 : Math.max(cw * 1.75, w * 0.36);
      const card = groups[0]?.querySelector<HTMLElement>(".hw-card");
      ch = card?.offsetHeight || 300;
      // the cylinder's middle: a little below the screen's middle (lower still on phones)
      ry = Math.max(h * (phone ? 0.6 : 0.53), ch / 2 + h * 0.16);
      st.style.setProperty("--iw", `${iw}px`);
      st.style.setProperty("--itop", `${itop}px`);
      st.style.setProperty("--ry", `${ry}px`);
      st.style.setProperty("--cw", `${cw}px`);
      // the objects: from just under the step pill down to the grass, so they
      // show round the front card and through its glass
      const objTop = Math.max(h * 0.1, ry - ch / 2 - h * 0.3);
      st.style.setProperty("--obj-top", `${objTop}px`);
      st.style.setProperty("--obj-h", `${itop + ih * ISLAND.top + h * 0.02 - objTop}px`);
      // where the scroll can settle on touch screens: one per step
      const pin = s.querySelector<HTMLElement>(".hw-pin")!;
      const run = pin.offsetHeight - (1 + HAND) * box.clientHeight; // the end is the hand-off's
      pin.querySelectorAll<HTMLElement>(".hw-snap").forEach((m, i) => {
        m.style.top = `${(i / (STEPS.length - 1)) * run}px`;
      });
      // the mask the cards turn into: clear over the meadow, the cards hidden
      // past its sides behind a short soft edge (glass, words and edge alike)
      const edge = iw * 0.42; // the meadow's side, from the middle (its film has a soft margin)
      const soft = 30;
      maskEdge = edge + soft;
      mask = `linear-gradient(90deg, transparent ${w / 2 - edge - soft}px, #000 ${w / 2 - edge}px, #000 ${w / 2 + edge}px, transparent ${w / 2 + edge + soft}px)`;
      view.style.maskImage = mask;
      view.style.setProperty("-webkit-mask-image", mask);
      // the edges' canvas: the stage's size, its fade the same as the mask's
      edgeDpr = Math.min(2, window.devicePixelRatio || 1);
      edges.width = Math.round(w * edgeDpr);
      edges.height = Math.round(h * edgeDpr);
      edgeFade = eg.createLinearGradient(0, 0, w, 0);
      const at = (x: number) => Math.min(1, Math.max(0, x / w));
      edgeFade.addColorStop(at(w / 2 - edge - soft), "rgba(0,0,0,0)");
      edgeFade.addColorStop(at(w / 2 - edge), "rgba(0,0,0,1)");
      edgeFade.addColorStop(at(w / 2 + edge), "rgba(0,0,0,1)");
      edgeFade.addColorStop(at(w / 2 + edge + soft), "rgba(0,0,0,0)");
      // each card's glass pane: one size for this screen, a little bigger
      // than the card ever is on screen
      paneW = Math.ceil(cw * 1.3 + 24);
      paneH = Math.ceil(ch * 1.3 + 24);
      panes.forEach((pn) => {
        pn.style.width = `${paneW}px`;
        pn.style.height = `${paneH}px`;
      });
      // each strip: its slice of the card's words and its angle round the cylinder
      const sw = cw / SLICES;
      groups.forEach((g) => {
        g.querySelectorAll<HTMLElement>(".hw-card").forEach((el, k) => {
          const x = (k + 0.5) * sw - cw / 2; // the strip's middle, from the card's
          const phi = (x / R) * (180 / Math.PI);
          const l = k * sw;
          const r = cw - (k + 1) * sw;
          el.style.clipPath = `inset(-2px ${Math.max(0, r)}px -2px ${Math.max(0, l)}px)`;
          el.style.transform = `rotateY(${phi}deg) translateZ(${R}px) translateX(${-x}px)`;
        });
      });
    };

    // the meadow's film: made (and so downloaded) once the section is near
    const film = st.querySelector<HTMLCanvasElement>(".hw-island")!;
    let player: ReturnType<ReturnType<typeof createSequence>["createPlayer"]> | null = null;
    const start = () => {
      if (player) return;
      const seq = createSequence(islandFilm, `${BASE}/island/${st.clientWidth < 700 ? 900 : 1400}`, {
        opening: 24,
        ext: "avif",
      });
      // one real frame at a time, never two laid over each other (with every
      // frame of the film here, the steps between them are too small to see);
      // skim: a fast scroll decodes only the frames it can show
      player = seq.createPlayer(film, undefined, { alpha: true, fit: "contain", blend: false, skim: true });
      pinnedAt = -1;
      kick();
    };
    const near = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          start();
          near.disconnect();
        }
      },
      { root: box, rootMargin: "150% 0px" },
    );
    near.observe(s);
    // resting on a step, the turns to the steps either side kept ready: every
    // 4th frame along them (5th on phones), so a turn's fast start never
    // waits for frames to decode; the slow end gets every frame
    const stride = st.clientWidth < 700 ? 5 : 4;
    let pinnedAt = -1;
    const ready = (step: number) => {
      if (!player || step === pinnedAt) return;
      pinnedAt = step;
      const from = Math.floor(filmAt(Math.max(0, step - 1) * STEP));
      const to = Math.ceil(filmAt(Math.min(STEPS.length - 1, step + 1) * STEP));
      const list: number[] = [];
      for (let f = from; f <= to; f += stride) list.push(f);
      list.push(to);
      player.pin(list);
    };

    const draw = () => {
      raf = 0;
      rot += (target - rot) * 0.12;
      if (Math.abs(target - rot) < 0.01) rot = target;
      rg.style.transform = `translateZ(${-BACK * R}px) rotateX(4deg) rotateY(${-rot}deg)`;
      player?.setPosition(filmAt(rot));
      // landed on a step: get the turns either side of it ready (not while
      // turning, when the turn's own frames come first)
      if (rot === target && Math.abs(rot / STEP - Math.round(rot / STEP)) < 0.001) ready(Math.round(rot / STEP));

      // the step pill's highlight: between the steps' buttons, as far as the
      // cards have turned, so it moves with them
      if (slots.length) {
        const kf = Math.min(STEPS.length - 1, Math.max(0, rot / STEP));
        const i0 = Math.floor(kf);
        const i1 = Math.min(STEPS.length - 1, i0 + 1);
        const f = kf - i0;
        const [ax, aw] = slots[i0];
        const [bx, bw] = slots[i1];
        glow.style.transform = `translateX(${ax + (bx - ax) * f}px)`;
        glow.style.width = `${aw + (bw - aw) * f}px`;
      }

      // the objects: each as clear as its card is close to the front
      const kf = rot / STEP;
      objects.forEach((el, i) => {
        const v = Math.min(1, Math.max(0, 1 - Math.abs(kf - i) * 1.6));
        el.style.opacity = String(v);
        el.style.scale = String(0.96 + 0.04 * v);
      });
      const tintsNow: number[][][] = [];
      const edgesNow: number[][][] = [];
      groups.forEach((g, i) => {
        g.style.transform = `rotateY(${i * STEP}deg)`;
        // the card's glass and its edge: drawn flat on the screen, to the
        // card's exact outline on the cylinder (so they stay stuck to it),
        // only while it faces out enough to read (nearly edge-on, its glass
        // would show as a bare sliver with no words on it)
        const facing = Math.cos(((i * STEP - rot) * Math.PI) / 180) > 0.3;
        const pane = panes[i];
        // (hidden, never removed: making a blurred layer afresh costs a long frame)
        const off = () => {
          if (pane.style.visibility !== "hidden") pane.style.visibility = "hidden";
        };
        if (!facing) return off();
        const pts = outline(i);
        let x0 = Infinity,
          y0 = Infinity,
          x1 = -Infinity,
          y1 = -Infinity;
        for (const [x, y] of pts) {
          x0 = Math.min(x0, x);
          y0 = Math.min(y0, y);
          x1 = Math.max(x1, x);
          y1 = Math.max(y1, y);
        }
        // wholly behind the mask: nothing to draw
        if (x1 < w / 2 - maskEdge || x0 > w / 2 + maskEdge) return off();
        x0 = Math.floor(x0);
        y0 = Math.floor(y0);
        edgesNow.push(pts);
        // every card on show gets its glass, the real blur: a pane of a fixed
        // size that only moves (so a turn never lays the page out again),
        // clipped to the outline. One cut by the mask (turning in or out at
        // the sides) carries the mask's soft edge too, in its own coordinates
        if (x1 - x0 <= paneW && y1 - y0 <= paneH) {
          if (pane.style.visibility !== "visible") pane.style.visibility = "visible";
          pane.style.transform = `translate3d(${x0}px, ${y0}px, 0)`;
          pane.style.clipPath = `path("M${pts.map(([x, y]) => `${(x - x0).toFixed(1)} ${(y - y0).toFixed(1)}`).join("L")}Z")`;
          const clear = x0 >= w / 2 - (maskEdge - 30) && x1 <= w / 2 + (maskEdge - 30);
          const m = clear
            ? "none"
            : `linear-gradient(90deg, transparent ${w / 2 - maskEdge - x0}px, #000 ${w / 2 - maskEdge + 30 - x0}px, #000 ${w / 2 + maskEdge - 30 - x0}px, transparent ${w / 2 + maskEdge - x0}px)`;
          if (pane.dataset.mask !== m) {
            pane.dataset.mask = m;
            pane.style.maskImage = m;
            pane.style.setProperty("-webkit-mask-image", m);
          }
        } else {
          off();
          tintsNow.push(pts);
        }
      });
      // the edges (and any card too big for its pane, as a plain tint), then
      // the mask's fade over them
      eg.setTransform(edgeDpr, 0, 0, edgeDpr, 0, 0);
      eg.globalCompositeOperation = "source-over";
      eg.clearRect(0, 0, w, edges.height / edgeDpr);
      const trace = (pts: number[][]) => {
        eg.beginPath();
        pts.forEach(([x, y], k) => (k ? eg.lineTo(x, y) : eg.moveTo(x, y)));
        eg.closePath();
      };
      eg.fillStyle = "rgba(255,255,255,0.62)";
      for (const pts of tintsNow) {
        trace(pts);
        eg.fill();
      }
      eg.strokeStyle = "rgba(18,21,36,0.12)";
      eg.lineWidth = 1;
      for (const pts of edgesNow) {
        trace(pts);
        eg.stroke();
      }
      if (edgeFade && (tintsNow.length || edgesNow.length)) {
        eg.globalCompositeOperation = "destination-in";
        eg.fillStyle = edgeFade;
        eg.fillRect(0, 0, w, edges.height / edgeDpr);
        eg.globalCompositeOperation = "source-over";
      }
      // keep drawing while the turn or the pill is still moving
      if (rot !== target || performance.now() < settleUntil) raf = requestAnimationFrame(draw);
    };
    let settleUntil = 0; // the pill's buttons resize for a moment after the step changes
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };

    // the scroll turns the cylinder with it. When it stops between two steps
    // it settles on one: the next one in the way you were going if you
    // scrolled at all on purpose (a sixth of a step), back where you were if not
    let at = 0; // the step it last settled on
    let shownStep = -1;
    let going = -1; // the step it is gliding to (-1: none); your own scroll cancels it
    let idle = 0;
    let snapOn = false; // touch screens: the snapping is on within the steps
    let flown = -1; // how far into the hand-off, in px (last drawn)
    const yours = () => void (going = -1);
    // where the held stretch starts in the scroll, and how long it runs:
    // measured when the page lays out again, not on every scroll
    let spanned: { top: number; run: number } | null = null;
    const span = () => {
      if (spanned) return spanned;
      const pin = s.querySelector<HTMLElement>(".hw-pin")!;
      const top = pin.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
      // (the pin's end holds the scene for the hand-off)
      return (spanned = { top, run: pin.offsetHeight - (1 + HAND) * box.clientHeight });
    };
    const onScroll = () => {
      const { top, run } = span();
      const y = box.scrollTop;
      // past the last step, the hand-off: the layers part as Features rises
      const d = Math.round(Math.min(HAND * box.clientHeight, Math.max(0, y - top - run)));
      if (d !== flown) {
        flown = d;
        fore.style.translate = `0 ${-d * FLY.fore}px`;
        valley.style.translate = `-50% ${-d * FLY.valley}px`;
      }
      if (y < top - box.clientHeight || y > top + run + box.clientHeight) return; // well away: nothing to turn
      const p = Math.min(1, Math.max(0, (y - top) / Math.max(1, run)));
      const k = p * (STEPS.length - 1);
      target = k * STEP;
      if (Math.round(k) !== shownStep) {
        shownStep = Math.round(k);
        setOn(shownStep);
        settleUntil = performance.now() + 600;
      }
      kick();
      clearTimeout(idle);
      if (touch) {
        // phones and tablets: their own snapping does the settling, but only
        // within the steps; past the last (or before the first) it lets go,
        // so the page scrolls on freely
        const snapping = y >= top - 4 && y <= top + run + 4;
        if (snapping !== snapOn) {
          snapOn = snapping;
          if (snapping) box.style.setProperty("scroll-snap-type", "y proximity");
          else box.style.removeProperty("scroll-snap-type");
        }
        return;
      }
      if (y <= top + 1 || y >= top + run - 1) {
        at = Math.round(k);
        return;
      }
      idle = window.setTimeout(() => {
        if (going >= 0) {
          // still gliding (a slow frame paused it): carry on to the same step
          const to = top + (going / (STEPS.length - 1)) * run;
          if (Math.abs(to - box.scrollTop) > 2) scrollToY(to);
          else going = -1;
          return;
        }
        const dk = k - at;
        let to = at;
        if (dk > 1 / 6) to = Math.ceil(k - 1 / 6);
        else if (dk < -1 / 6) to = Math.floor(k + 1 / 6);
        to = Math.min(STEPS.length - 1, Math.max(0, to));
        at = to;
        const ty = top + (to / (STEPS.length - 1)) * run;
        if (Math.abs(ty - box.scrollTop) > 2) {
          going = to;
          scrollToY(ty);
        }
      }, 140);
    };

    // the step pill: tap a step to go to it
    goTo.current = (i: number) => {
      const { top, run } = span();
      at = i;
      going = touch ? -1 : i;
      scrollToY(top + (i / (STEPS.length - 1)) * run);
    };

    size();
    onScroll();
    at = Math.round(target / STEP);
    rot = target;
    draw();
    const ro = new ResizeObserver(() => {
      spanned = null;
      size();
      onScroll();
      kick();
    });
    ro.observe(s);
    ro.observe(st);
    // the pill's buttons resize as a step's name opens (and when the font
    // arrives): the highlight follows them
    const rb = new ResizeObserver(() => {
      slots = btns.map((b) => [b.offsetLeft, b.offsetWidth]); // measured here, not every frame
      settleUntil = Math.max(settleUntil, performance.now() + 50);
      kick();
    });
    btns.forEach((b) => rb.observe(b));
    box.addEventListener("scroll", onScroll, { passive: true });
    for (const e of ["wheel", "touchstart", "keydown", "pointerdown"] as const)
      box.addEventListener(e, yours, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(idle);
      near.disconnect();
      player?.destroy();
      box.style.removeProperty("scroll-snap-type");
      goTo.current = () => {};
      ro.disconnect();
      rb.disconnect();
      box.removeEventListener("scroll", onScroll);
      for (const e of ["wheel", "touchstart", "keydown", "pointerdown"] as const)
        box.removeEventListener(e, yours);
    };
  }, []);

  return (
    <section
      ref={sec}
      id="how"
      data-nav="How it works"
      data-theme-zone="light"
      className="hw"
      aria-labelledby="hw-title"
    >
      {/* the title scrolls by as usual; the scene below holds while the cylinder turns */}
      <header className="hw-intro" data-reveal>
        <p className="hw-eyebrow">
          <span className="line-mask inline-block">
            <span data-rise className="inline-block">
              How it works
            </span>
          </span>
        </p>
        <h2 id="hw-title" className="hw-title">
          <span className="line-mask">
            <span data-rise className="block">
              From your body
            </span>
          </span>
          <span className="line-mask">
            <span data-rise className="block">
              to the cutting table.
            </span>
          </span>
        </h2>
      </header>

      <div className="hw-pin">
        {/* where the scroll can settle on touch screens: one per step */}
        {STEPS.map((s) => (
          <span key={s.n} className="hw-snap" aria-hidden="true" />
        ))}
        <div ref={stage} className="hw-stage">
          {/* the valley behind it all */}
          <div className="hw-valley" aria-hidden="true">
            <img src={`${BASE}/valley.webp`} width={1792} height={1943} alt="" decoding="async" loading="lazy" />
          </div>

          {/* everything in front of the valley, as one layer for the hand-off */}
          <div className="hw-fore">
          {/* the steps: the current one named, the others as numbers to tap;
              the highlight slides along with the turn */}
          <nav className="hw-steps" aria-label="How it works, steps">
            <span className="hw-steps__glow" aria-hidden="true" />
            {STEPS.map((s, i) => (
              <button
                key={s.n}
                type="button"
                className={on === i ? "is-on" : undefined}
                aria-current={on === i ? "step" : undefined}
                aria-label={`Step ${s.n}: ${s.k}`}
                onClick={() => goTo.current(i)}
              >
                <b>{s.n}</b>
                <span className="hw-steps__name" aria-hidden="true">
                  <span>{s.k}</span>
                </span>
              </button>
            ))}
          </nav>

          {/* the meadow, turning with the cards */}
          <canvas className="hw-island" aria-hidden="true" />
          {/* what floats behind the cards: one object per step, each fading in
              as its card turns to the front */}
          {OBJECTS.map((o, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              className="hw-object"
              src={o.src}
              width={o.w}
              height={o.h}
              style={{ "--s": o.s, "--y": o.y } as CSSProperties}
              alt=""
              decoding="async"
              loading="lazy"
            />
          ))}

          {/* the steps, for screen readers */}
          <ol className="sr-only">
            {STEPS.map((s, i) => (
              <li key={s.n} aria-current={on === i ? "step" : undefined}>
                Step {s.n}, {s.k}: {s.h} {s.p}
              </li>
            ))}
          </ol>

          <Scene />
          </div>
        </div>
      </div>
    </section>
  );
}
