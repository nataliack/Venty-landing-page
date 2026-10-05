"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { APP_URL, CTA_LABEL } from "@/lib/site";
import "./hiwdesk.css";

/* 3. How it works · Desk. Jose's idea: a cutting desk seen from above, the
   steps as paper cards lying on it, real things beside each card.

   Built in layers, so one set of assets works everywhere:
   1  the surface: a tiling mat (CSS for now; drop a tiling photo in
      ASSETS.surface and it takes over)
   2  the objects: cut-outs on transparent backgrounds. Until the real ones
      exist each is a labelled placeholder of the right size; set its src in
      ASSETS and the photo replaces it
   3  the cards, the phone, the pages, the sketch: drawn in code
   4  one light, top left, so every shadow falls the same way

   Desktop: the section pins and the desk slides sideways as you scroll, the
   objects at slightly different speeds for depth. Each step's things drop
   onto the desk as it arrives. Phones: no sideways scroll. The desk runs
   downwards and the steps stack, card then things. */

/* Drop files in public/lab/desk/ and set them here. Shoot everything from
   straight above, soft daylight from the top left. */
const ASSETS: Record<string, string | null> = {
  surface: null, // a tiling top-down mat or desk texture
  tape: null, // tape-measure.png: a cloth tape measure, loosely coiled
  fabric: null, // fabric.png: a piece of fabric with chalk marks
  scissors: null, // scissors.png: dressmaking shears, open a little
  pins: null, // pins.png: a few pins and a pin cushion
  dress: null, // slip-dress.png: the finished slip dress, folded
};

const PROMPT = "A slip dress, bias cut, midi length, in silk.";

type Spot = { x: string; y: string; w: string; r: number; d: number; z?: number; m: string }; // m: width on phones

/* where things lie in each step's stretch of desk (desktop), in vw/vh */
const LAYOUT = {
  measure: {
    card: { x: "7vw", y: "17vh", w: "min(380px, 27vw)", r: -2.5, d: 0, m: "100%" },
    tape: { x: "38vw", y: "12vh", w: "min(330px, 23vw)", r: 8, d: 0.06, m: "58%" },
    fabric: { x: "60vw", y: "40vh", w: "min(420px, 30vw)", r: -6, d: 0.03, z: 0, m: "78%" },
    note: { x: "40vw", y: "60vh", w: "min(220px, 16vw)", r: 4, d: 0.09, m: "56%" },
  },
  describe: {
    card: { x: "6vw", y: "20vh", w: "min(380px, 27vw)", r: 1.8, d: 0, m: "100%" },
    phone: { x: "40vw", y: "10vh", w: "min(250px, 17vw)", r: -4, d: 0.05, m: "60%" },
    photo: { x: "63vw", y: "14vh", w: "min(250px, 18vw)", r: 6, d: 0.08, m: "62%" },
    sketch: { x: "60vw", y: "45vh", w: "min(260px, 18vw)", r: -3, d: 0.04, m: "66%" },
  },
  print: {
    card: { x: "6vw", y: "16vh", w: "min(380px, 27vw)", r: -1.5, d: 0, m: "100%" },
    pages: { x: "34vw", y: "10vh", w: "min(380px, 26vw)", r: 2, d: 0.03, z: 0, m: "84%" },
    scissors: { x: "67vw", y: "7vh", w: "min(140px, 10vw)", r: -18, d: 0.08, m: "30%" },
    dress: { x: "76vw", y: "36vh", w: "min(320px, 21vw)", r: 5, d: 0.05, m: "70%" },
    pins: { x: "24vw", y: "68vh", w: "min(120px, 8vw)", r: 0, d: 0.1, m: "30%" },
  },
} satisfies Record<string, Record<string, Spot>>;

const spot = (s: Spot, i: number) =>
  ({ "--x": s.x, "--y": s.y, "--w": s.w, "--m": s.m, "--r": `${s.r}deg`, "--d": s.d, "--i": i, zIndex: s.z ?? 2 + i }) as CSSProperties;

/* ---- things on the desk -------------------------------------------- */

function Thing({ s, i, cls = "", children }: { s: Spot; i: number; cls?: string; children: ReactNode }) {
  return (
    <div className={`desk-thing ${cls}`} style={spot(s, i)}>
      <div className="desk-thing__depth">
        <div className="desk-thing__lay">{children}</div>
      </div>
    </div>
  );
}

/* a cut-out photo, or until it exists, a placeholder of the same footprint */
function CutOut({ k, label, ratio, shape = "rect" }: { k: string; label: string; ratio: string; shape?: "rect" | "round" | "soft" }) {
  const src = ASSETS[k];
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" draggable={false} className="desk-cut" style={{ aspectRatio: ratio }} />;
  }
  return (
    <div className={`desk-ph is-${shape}`} style={{ aspectRatio: ratio }}>
      <span>{label}</span>
      <small>public/lab/desk/{k}.png</small>
    </div>
  );
}

function StepCard({ n, k, h, p }: { n: string; k: string; h: string; p: string }) {
  return (
    <article className="desk-card">
      <span className="desk-tape" aria-hidden="true" />
      <div className="desk-card__top">
        <span className="desk-card__n">{n}</span>
        <span className="desk-card__k">{k}</span>
      </div>
      <h3 className="desk-card__h">{h}</h3>
      <p className="desk-card__p">{p}</p>
    </article>
  );
}

function Note() {
  return (
    <div className="desk-note">
      <p className="desk-note__h">Me · Oct 2026</p>
      <dl>
        {[
          ["Bust", "92"],
          ["Waist", "74"],
          ["Hip", "98"],
          ["Back length", "41"],
        ].map(([a, b]) => (
          <div key={a}>
            <dt>{a}</dt>
            <dd>{b} cm</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Phone({ on }: { on: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!on) return;
    let i = 0;
    const t = window.setInterval(() => {
      i += 1;
      setN(i);
      if (i >= PROMPT.length) window.clearInterval(t);
    }, 45);
    return () => window.clearInterval(t);
  }, [on]);
  return (
    <div className="desk-phone">
      <div className="desk-phone__screen">
        <p className="desk-phone__bar">Venty</p>
        <div className="desk-phone__refs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lab/reel/17.webp" alt="" />
          <span className="desk-phone__sk" />
        </div>
        <p className="desk-phone__prompt" aria-label={PROMPT}>
          <span aria-hidden="true">{PROMPT.slice(0, n)}</span>
          <i aria-hidden="true" />
        </p>
        <div className="desk-phone__seg" aria-hidden="true">
          <span>Close</span>
          <span className={n >= PROMPT.length ? "is-on" : ""}>Easy</span>
          <span>Loose</span>
        </div>
        <span className="desk-phone__go">Draft pattern</span>
      </div>
    </div>
  );
}

function Photo() {
  return (
    <figure className="desk-photo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/lab/reel/13.webp" alt="" draggable={false} />
      <span className="desk-pin" aria-hidden="true" />
    </figure>
  );
}

function Sketch() {
  return (
    <div className="desk-sketch">
      <svg viewBox="0 0 300 380" aria-hidden="true">
        <g fill="none" stroke="#2a2f3f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.82">
          <path d="M138 36 L150 30 L162 36 L170 118 M138 36 L130 118" />
          <path d="M130 118 Q112 190 118 214 Q96 290 70 352 Q150 368 230 352 Q204 290 182 214 Q188 190 170 118" />
          <path d="M118 214 Q150 226 182 214" strokeDasharray="2 7" />
          <path d="M130 118 Q150 132 170 118" />
          <path d="M196 150 l40 -18 M200 262 l44 6" strokeWidth="1.4" />
        </g>
        <g fill="#2a2f3f" opacity="0.7" fontFamily="var(--font-familjen)" fontSize="13">
          <text x="240" y="130">bias</text>
          <text x="248" y="272">midi</text>
        </g>
      </svg>
    </div>
  );
}

/* the pattern, printed on A4 and taped together, a page or two slightly out */
function Pages() {
  const off = [
    [0, 0, 0], [1, -2, 0.6], [-1, 1, -0.4],
    [2, 1, -0.5], [0, 0, 0], [-2, 2, 0.8],
    [1, -1, 0.3], [-1, 0, -0.6], [2, 2, 0.4],
  ];
  return (
    <div className="desk-pages">
      {off.map(([x, y, r], k) => (
        <span key={k} className="desk-page" style={{ translate: `${x}px ${y}px`, rotate: `${r}deg` }}>
          {String.fromCharCode(65 + Math.floor(k / 3))}
          {(k % 3) + 1}
        </span>
      ))}
      <svg viewBox="0 0 300 424" className="desk-pages__piece" aria-hidden="true">
        <path d="M112 34 Q150 42 188 34 L262 392 Q150 412 38 392 Z" className="desk-pages__cut" />
        <path d="M112 34 Q150 42 188 34 L262 392 Q150 412 38 392 Z" className="desk-pages__stitch" transform="translate(150 220) scale(0.92) translate(-150 -220)" />
        <path d="M150 120 V330 M144 130 L150 120 L156 130 M144 320 L150 330 L156 320" className="desk-pages__grain" />
        <text x="150" y="232" textAnchor="middle" className="desk-pages__label">SKIRT FRONT</text>
        <text x="150" y="246" textAnchor="middle" className="desk-pages__label is-sm">CUT 1 ON THE BIAS</text>
      </svg>
      {/* tape where the pages join */}
      <span className="desk-strip" style={{ left: "30%", top: "30%", rotate: "8deg" }} />
      <span className="desk-strip" style={{ left: "62%", top: "64%", rotate: "-6deg" }} />
      <span className="desk-strip" style={{ left: "28%", top: "66%", rotate: "84deg" }} />
    </div>
  );
}

/* ---- the section ---------------------------------------------------- */

const STEPS = {
  measure: {
    n: "01",
    k: "Measure",
    h: "Four measures to start.",
    p: "Add more when you want a closer fit. Every measure shows where the tape goes, and your body is saved for every pattern after.",
  },
  describe: {
    n: "02",
    k: "Describe",
    h: "Show it. Say it.",
    p: "Upload the photo, or describe it in a sentence. Choose how close it should sit and the fabric you have in mind.",
  },
  print: {
    n: "03",
    k: "Print",
    h: "Print it at home.",
    p: "Print on A4 at home, or A0 at a print shop. Grainlines, notches and labels on every piece, with a page map to tape the A4 pages together.",
  },
};
const KEYS = ["measure", "describe", "print"] as const;

export function HowItWorksDesk() {
  const scroller = useRef<HTMLDivElement>(null);
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [placed, setPlaced] = useState<Record<string, boolean>>({});
  const [active, setActive] = useState(0);

  // desktop: vertical scroll drives the desk sideways
  useEffect(() => {
    const sc = scroller.current;
    const sec = section.current;
    const tr = track.current;
    if (!sc || !sec || !tr) return;
    const wide = window.matchMedia("(min-width: 1024px)");
    let raf = 0;
    let run = 0; // how far the track travels, px

    const size = () => {
      if (!wide.matches) {
        sec.style.height = "";
        tr.style.transform = "";
        tr.style.setProperty("--tx", "0");
        return;
      }
      run = Math.max(0, tr.scrollWidth - window.innerWidth);
      // each stretch of desk knows where it starts, so its depth is
      // measured from the moment it sits square in the window
      tr.querySelectorAll<HTMLElement>(".desk-panel").forEach((pn) => pn.style.setProperty("--pl", String(pn.offsetLeft)));
      sec.style.height = `${run + window.innerHeight}px`;
      update();
    };
    const update = () => {
      raf = 0;
      if (!wide.matches) return;
      const top = sec.offsetTop;
      const p = Math.min(1, Math.max(0, (sc.scrollTop - top) / Math.max(1, run)));
      const x = -p * run;
      tr.style.transform = `translate3d(${x}px, 0, 0)`;
      tr.style.setProperty("--tx", String(x));
      setActive(p < 0.3 ? 0 : p < 0.68 ? 1 : 2);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    size();
    sc.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", size);
    wide.addEventListener("change", size);
    return () => {
      cancelAnimationFrame(raf);
      sc.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", size);
      wide.removeEventListener("change", size);
    };
  }, []);

  // each step's things drop onto the desk as its stretch comes into view
  useEffect(() => {
    const sc = scroller.current;
    if (!sc) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setPlaced((s) => ({ ...s, [(e.target as HTMLElement).dataset.step!]: true }));
        });
      },
      { root: sc, threshold: 0.12 },
    );
    sc.querySelectorAll("[data-step]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const surface = ASSETS.surface ? ({ backgroundImage: `url(${ASSETS.surface})` } as CSSProperties) : undefined;

  return (
    <div ref={scroller} data-lenis-prevent className="absolute inset-0 overflow-y-auto overflow-x-hidden">
      <section ref={section} className="desk" aria-labelledby="desk-title">
        <div className="desk-stage">
          <div ref={track} className={`desk-track ${ASSETS.surface ? "has-photo" : ""}`} style={surface}>
            {/* the head, printed on the mat */}
            <div className="desk-panel desk-intro" data-step="intro">
              <p className={`desk-eyebrow ${placed.intro ? "is-on" : ""}`}>Three steps</p>
              <h2 id="desk-title" className={`desk-title ${placed.intro ? "is-on" : ""}`}>
                How it works
              </h2>
              <p className={`desk-sub ${placed.intro ? "is-on" : ""}`}>From your body to the cutting table.</p>
              <p className="desk-hint" aria-hidden="true">
                Scroll <span>→</span>
              </p>
            </div>

            <div className={`desk-panel ${placed.measure ? "is-placed" : ""}`} data-step="measure">
              <Thing s={LAYOUT.measure.fabric} i={0} cls="is-cut">
                <CutOut k="fabric" label="Fabric with chalk marks" ratio="4 / 3" shape="soft" />
              </Thing>
              <Thing s={LAYOUT.measure.card} i={1} cls="is-card">
                <StepCard {...STEPS.measure} />
              </Thing>
              <Thing s={LAYOUT.measure.tape} i={2} cls="is-cut">
                <CutOut k="tape" label="Tape measure, coiled" ratio="1 / 1" shape="round" />
              </Thing>
              <Thing s={LAYOUT.measure.note} i={3}>
                <Note />
              </Thing>
            </div>

            <div className={`desk-panel ${placed.describe ? "is-placed" : ""}`} data-step="describe">
              <Thing s={LAYOUT.describe.card} i={0} cls="is-card">
                <StepCard {...STEPS.describe} />
              </Thing>
              <Thing s={LAYOUT.describe.sketch} i={1}>
                <Sketch />
              </Thing>
              <Thing s={LAYOUT.describe.photo} i={2}>
                <Photo />
              </Thing>
              <Thing s={LAYOUT.describe.phone} i={3}>
                <Phone on={!!placed.describe} />
              </Thing>
            </div>

            <div className={`desk-panel ${placed.print ? "is-placed" : ""}`} data-step="print">
              <Thing s={LAYOUT.print.pages} i={0}>
                <Pages />
              </Thing>
              <Thing s={LAYOUT.print.card} i={1} cls="is-card">
                <StepCard {...STEPS.print} />
              </Thing>
              <Thing s={LAYOUT.print.dress} i={2} cls="is-cut">
                <CutOut k="dress" label="The slip dress, folded" ratio="4 / 5" shape="soft" />
              </Thing>
              <Thing s={LAYOUT.print.scissors} i={3} cls="is-cut">
                <CutOut k="scissors" label="Fabric shears" ratio="2 / 5" />
              </Thing>
              <Thing s={LAYOUT.print.pins} i={4} cls="is-cut">
                <CutOut k="pins" label="Pins" ratio="1 / 1" shape="round" />
              </Thing>
            </div>

            <div className={`desk-panel desk-end ${placed.end ? "is-placed" : ""}`} data-step="end">
              <div className="desk-tag">
                <span className="desk-tag__hole" aria-hidden="true" />
                <p className="desk-tag__k">Your turn</p>
                <PrimaryButton href={APP_URL}>{CTA_LABEL}</PrimaryButton>
              </div>
            </div>
          </div>

          {/* desktop: where you are along the desk */}
          <ol className="desk-steps" aria-hidden="true">
            {KEYS.map((k, i) => (
              <li key={k} className={i === active ? "is-on" : ""}>
                <span>{STEPS[k].n}</span>
                {STEPS[k].k}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
