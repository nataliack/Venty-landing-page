"use client";

import { useEffect, useRef, useState } from "react";
import { createSequence } from "@/lib/sequence";
import islandFilm from "../../../../../../public/lab/orbit/island/manifest.json";
import { End, Shell, useBox } from "../hc/parts";
import "./orbit.css";

/* How it works · Orbit. A structure and motion test (low fidelity on
   purpose): a floating meadow at the bottom (an image, still; only its top
   on screen, the earth under it running off the bottom), a figure standing
   on it (a placeholder), and round the figure the four steps as glass cards
   (the Made to measure composer's glass) on an invisible cylinder. The
   scroll turns the cylinder a step at a time.

   The cards are stuck to the cylinder like stickers: each one bends round
   it. CSS can't bend an element, so each card's words are drawn as thin
   upright strips, every strip the whole card clipped to its own slice and
   set at its own angle round the cylinder; side by side they read as one
   curved card. The glass and the edge under them are drawn flat on the
   screen to the card's exact outline on the cylinder (worked out here with
   the same turns), so the blur is smooth and the edge stays stuck to the
   card. A mask at the cylinder's sides hides the cards as they turn away.
   The strips are decoration (aria-hidden); the steps are read from a plain
   list for screen readers. */

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

const STEP = 58; // degrees between cards round the cylinder: the next one turned well round at the side
const SLICES = 12; // strips per card: enough that the bend reads smooth
/* the meadow: the turning film, every one of its frames from the first step
   to the cards' full turn (public/lab/orbit/island/: AVIF, keyed with a
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
/* the valley behind (1493 x 2000): the full width, its sky behind the
   meadow while the cards turn, the rest of it seen as the page scrolls on */
const VALLEY = { ratio: 2000 / 1493 };

function Card({ s }: { s: (typeof STEPS)[number] }) {
  return (
    <>
      <p className="or-card__top">
        <b>{s.n}</b>
        <span>{s.k}</span>
      </p>
      <h3 className="or-card__h">{s.h}</h3>
      <p className="or-card__p">{s.p}</p>
    </>
  );
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
  const ring = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(0);

  useEffect(() => {
    const s = sec.current;
    const st = stage.current;
    const rg = ring.current;
    if (!box || !s || !st || !rg) return;
    const groups = [...rg.querySelectorAll<HTMLElement>(".or-sticker")];
    const view = st.querySelector<HTMLElement>(".or-view")!;
    const panes = [...st.querySelectorAll<HTMLElement>(".or-pane")];
    const lines = [...st.querySelectorAll<SVGPathElement>(".or-lines path")];

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
    const P = 2400; // the perspective (matches .or-view)
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
      const N = 28;
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
      // with its grass a little below the screen's middle
      const iw = phone ? w * 1.3 : w * 0.78;
      const ih = iw * ISLAND.ratio;
      const itop = h * 0.62 - ih * ISLAND.top;
      st.style.setProperty("--ih", `${ih}px`);
      // the valley: the full width (wider on phones, so it is tall enough)
      const vw = Math.max(w, (h * 1.9) / VALLEY.ratio);
      const vh = vw * VALLEY.ratio;
      st.style.setProperty("--vw", `${vw}px`);
      st.style.setProperty("--vh", `${vh}px`);
      // the cards: their width, and the cylinder they are stuck round
      cw = phone ? Math.min(290, w * 0.74) : 340;
      R = phone ? cw * 1.35 : Math.max(cw * 1.75, w * 0.36);
      const card = groups[0]?.querySelector<HTMLElement>(".or-card");
      ch = card?.offsetHeight || 300;
      // the cylinder's middle: a little below the screen's middle
      ry = Math.max(h * 0.53, ch / 2 + h * 0.16);
      st.style.setProperty("--iw", `${iw}px`);
      st.style.setProperty("--itop", `${itop}px`);
      st.style.setProperty("--grass", `${itop + ih * ISLAND.top}px`);
      st.style.setProperty("--ry", `${ry}px`);
      st.style.setProperty("--cw", `${cw}px`);
      // the figure: standing on the grass, its head well above the front card
      st.style.setProperty("--fig-top", `${ry - ch / 2 - h * 0.17}px`);
      // room under the scene for what runs below the screen (the rest of the
      // valley, the meadow's underside), so once the cards are done the page
      // scrolls on through the valley
      const below = Math.max(vh - h, itop + ih - h, 0);
      s.querySelector<HTMLElement>(".or-pin")!.style.marginBottom = `${below}px`;
      // the mask the cards turn into: clear across the middle, softly hiding
      // them towards the cylinder's sides, gone before they go round the back
      const side = (R * P) / (P + BACK * R); // the cylinder's side, on screen, from the middle
      mask = `linear-gradient(90deg, transparent ${w / 2 - side * 0.98}px, #000 ${w / 2 - side * 0.5}px, #000 ${w / 2 + side * 0.5}px, transparent ${w / 2 + side * 0.98}px)`;
      view.style.maskImage = mask;
      view.style.setProperty("-webkit-mask-image", mask);
      const svg = st.querySelector<SVGSVGElement>(".or-lines")!;
      svg.style.maskImage = mask;
      svg.style.setProperty("-webkit-mask-image", mask);
      // each strip: its slice of the card's words and its angle round the cylinder
      const sw = cw / SLICES;
      groups.forEach((g) => {
        g.querySelectorAll<HTMLElement>(".or-card").forEach((el, k) => {
          const x = (k + 0.5) * sw - cw / 2; // the strip's middle, from the card's
          const phi = (x / R) * (180 / Math.PI);
          const l = k * sw;
          const r = cw - (k + 1) * sw;
          el.style.clipPath = `inset(-2px ${Math.max(0, r)}px -2px ${Math.max(0, l)}px)`;
          el.style.transform = `rotateY(${phi}deg) translateZ(${R}px) translateX(${-x}px)`;
        });
      });
    };

    // the meadow's film
    const film = st.querySelector<HTMLCanvasElement>(".or-island")!;
    const seq = createSequence(islandFilm, `/lab/orbit/island/${st.clientWidth < 700 ? 900 : 1400}`, { opening: 24, ext: "avif" });
    // one real frame at a time, never two laid over each other: with every
    // frame of the film here, the steps between them are too small to see
    const player = seq.createPlayer(film, undefined, { alpha: true, fit: "contain", blend: false });

    const draw = () => {
      raf = 0;
      rot += (target - rot) * 0.12;
      if (Math.abs(target - rot) < 0.01) rot = target;
      rg.style.transform = `translateZ(${-BACK * R}px) rotateX(4deg) rotateY(${-rot}deg)`;
      player.setPosition(filmAt(rot));
      groups.forEach((g, i) => {
        g.style.transform = `rotateY(${i * STEP}deg)`;
        // the card's glass and its edge: drawn flat on the screen, to the
        // card's exact outline on the cylinder (so they stay stuck to it),
        // hidden once its face turns away
        const facing = Math.cos(((i * STEP - rot) * Math.PI) / 180) > 0;
        const pane = panes[i];
        const line = lines[i];
        if (!facing) {
          pane.style.display = "none";
          line.setAttribute("d", "");
          return;
        }
        const pts = outline(i);
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const [x, y] of pts) {
          x0 = Math.min(x0, x);
          y0 = Math.min(y0, y);
          x1 = Math.max(x1, x);
          y1 = Math.max(y1, y);
        }
        x0 = Math.floor(x0);
        y0 = Math.floor(y0);
        const d = (dx: number, dy: number) =>
          "M" + pts.map(([x, y]) => `${(x - dx).toFixed(1)} ${(y - dy).toFixed(1)}`).join("L") + "Z";
        pane.style.display = "";
        pane.style.left = `${x0}px`;
        pane.style.top = `${y0}px`;
        pane.style.width = `${Math.ceil(x1 - x0) + 1}px`;
        pane.style.height = `${Math.ceil(y1 - y0) + 1}px`;
        pane.style.clipPath = `path("${d(x0, y0)}")`;
        // the same mask as the cards, lined up with the screen
        pane.style.maskImage = mask;
        pane.style.setProperty("-webkit-mask-image", mask);
        pane.style.maskSize = `${w}px 100%`;
        pane.style.maskPosition = `${-x0}px 0`;
        line.setAttribute("d", d(0, 0));
      });
      if (rot !== target) raf = requestAnimationFrame(draw);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };

    // the scroll turns the cylinder with it. When it stops between two steps
    // it settles on one: the next one in the way you were going if you
    // scrolled at all on purpose (a sixth of a step), back where you were if not
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
      target = k * STEP;
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
    at = Math.round(target / STEP);
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
      player.destroy();
      ro.disconnect();
      box.removeEventListener("scroll", onScroll);
      for (const e of ["wheel", "touchstart", "keydown", "pointerdown"] as const)
        box.removeEventListener(e, yours);
    };
  }, [box]);

  return (
    <>
      <section ref={sec} className="or">
        {/* the title scrolls by as usual; the scene below holds while the cylinder turns */}
        <header data-in className="or-intro">
          <p className="hc-eyebrow">How it works</p>
          <h2 className="or-title">From your body to the cutting table.</h2>
        </header>
        <div className="or-pin">
          <div ref={stage} className="or-stage">
            <p className="or-count" aria-live="polite">
              Step <b>{STEPS[on].n}</b> of 4 · {STEPS[on].k}
            </p>

            {/* the meadow, turning with the cards, and a placeholder figure standing on it */}
            {/* the valley behind it all (a first placement, not final) */}
            <div className="or-valley" aria-hidden="true">
              <img src="/lab/orbit/valley.jpg" width={1493} height={2000} alt="" decoding="async" />
            </div>
            {/* the meadow, turning with the cards */}
            <canvas className="or-island" aria-hidden="true" />
            <div className="or-figure" aria-hidden="true">
              <span>Figure · your image, standing on the meadow, behind the cards</span>
            </div>

            {/* the steps, for screen readers */}
            <ol className="sr-only">
              {STEPS.map((s) => (
                <li key={s.n} aria-current={on === STEPS.indexOf(s) ? "step" : undefined}>
                  Step {s.n}, {s.k}: {s.h} {s.p}
                </li>
              ))}
            </ol>

            {/* each card's glass and edge, drawn to its outline on the cylinder */}
            {STEPS.map((s) => (
              <div key={s.n} className="or-pane" aria-hidden="true" />
            ))}
            <svg className="or-lines" aria-hidden="true">
              {STEPS.map((s) => (
                <path key={s.n} />
              ))}
            </svg>

            {/* the cylinder, and on it each card's words as strips */}
            <div className="or-view" aria-hidden="true">
              <div ref={ring} className="or-ring">
                {STEPS.map((s) => (
                  <div key={s.n} className="or-sticker">
                    {Array.from({ length: SLICES }, (_, k) => (
                      <article key={k} className="or-card">
                        <Card s={s} />
                      </article>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="hc-sec">
        <End />
      </section>
    </>
  );
}
