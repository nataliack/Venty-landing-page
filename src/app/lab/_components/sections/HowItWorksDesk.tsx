"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { APP_URL, CTA_LABEL } from "@/lib/site";
import "./hiwdesk.css";

/* 3. How it works · Desk. Jose's table: a long linen-covered worktable
   seen from above (public/lab/desk/table.webp, a cut-out), with the
   measuring things on the left, the sketchbook in the middle and the
   cutting things on the right.

   On it, drawn in code: the three step cards, a measurements note, a phone
   lying face up on the sketchbook's blank page, and the A4 pages taped
   together in the bare linen by the shears. Everything is placed in
   fractions of the table, so it stays put at any size; type inside the
   table is sized to the table (container units).

   The light in the photo comes from the top right: every shadow, the
   table's own included, falls down and to the left.

   Desktop: the section pins and you travel along the table as you scroll:
   the title on the floor, the table, the button on the floor beyond it.
   Each thing drops onto the table as it comes into view.
   Phones: no sideways travel. Each step is its card, then a close crop of
   its stretch of the table with that step's things on it. */

const TABLE = { src: "/lab/desk/table.webp", w: 2483, h: 921 };
const ASPECT = TABLE.w / TABLE.h;

const PROMPT = "A slip dress, bias cut, midi length, in silk.";

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
    k: "Print",
    h: "Print it at home.",
    p: "Print on A4 at home, or A0 at a print shop. Grainlines, notches and labels on every piece, with a page map to tape the A4 pages together.",
  },
];

/* where things lie, in fractions of the table: x, y of the top left, w of
   the table's width, r in degrees */
type Spot = { x: number; y: number; w: number; r: number };
const CARDS: Spot[] = [
  { x: 0.035, y: 0.06, w: 0.19, r: -2.5 }, // above the tape and fabric
  { x: 0.33, y: 0.07, w: 0.19, r: 1.6 }, // between the fabric and the sketchbook
  { x: 0.56, y: 0.06, w: 0.19, r: -1.5 }, // above the pencil and the bare linen
];
const NOTE: Spot = { x: 0.318, y: 0.54, w: 0.082, r: 4 };
const PHONE: Spot = { x: 0.432, y: 0.42, w: 0.07, r: -6 };
const PAGES: Spot = { x: 0.624, y: 0.45, w: 0.094, r: 3 };

/* phones: the stretch of table each step shows, as fractions of its width */
const CROPS = [
  { x0: 0, x1: 0.41 },
  { x0: 0.4, x1: 0.63 },
  { x0: 0.6, x1: 1 },
];

const at = (s: Spot, i = 0) =>
  ({ left: `${s.x * 100}%`, top: `${s.y * 100}%`, width: `${s.w * 100}%`, "--r": `${s.r}deg`, "--i": i }) as CSSProperties;

/* ---- the things drawn in code ---------------------------------------- */

function StepCard({ n, k, h, p }: (typeof STEPS)[number]) {
  return (
    <article className="dk-card">
      <span className="dk-tape" aria-hidden="true" />
      <div className="dk-card__top">
        <span className="dk-card__n">{n}</span>
        <span className="dk-card__k">{k}</span>
      </div>
      <h3 className="dk-card__h">{h}</h3>
      <p className="dk-card__p">{p}</p>
    </article>
  );
}

function Note() {
  return (
    <div className="dk-note">
      <p className="dk-note__h">Me · Oct 2026</p>
      <dl>
        {[
          ["Bust", "92"],
          ["Waist", "74"],
          ["Hip", "98"],
          ["Back", "41"],
        ].map(([a, b]) => (
          <div key={a}>
            <dt>{a}</dt>
            <dd>{b}</dd>
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
    <div className="dk-phone">
      <div className="dk-phone__screen">
        <p className="dk-phone__bar">Venty</p>
        <div className="dk-phone__refs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lab/reel/17.webp" alt="" />
          <span className="dk-phone__sk" />
        </div>
        <p className="dk-phone__prompt" aria-label={PROMPT}>
          <span aria-hidden="true">{PROMPT.slice(0, n)}</span>
          <i aria-hidden="true" />
        </p>
        <div className="dk-phone__seg" aria-hidden="true">
          <span>Close</span>
          <span className={n >= PROMPT.length ? "is-on" : ""}>Easy</span>
          <span>Loose</span>
        </div>
        <span className="dk-phone__go">Draft pattern</span>
      </div>
    </div>
  );
}

/* the pattern printed on A4, taped together, a page or two slightly out */
function Pages() {
  const off = [
    [0, 0, 0], [1, -1, 0.5], [0, 1, -0.4],
    [1, 1, -0.5], [0, 0, 0], [-1, 1, 0.7],
    [1, -1, 0.3], [-1, 0, -0.5], [1, 1, 0.4],
  ];
  return (
    <div className="dk-pages">
      {off.map(([x, y, r], k) => (
        <span key={k} className="dk-page" style={{ translate: `${x}px ${y}px`, rotate: `${r}deg` }}>
          {String.fromCharCode(65 + Math.floor(k / 3))}
          {(k % 3) + 1}
        </span>
      ))}
      <svg viewBox="0 0 300 424" className="dk-pages__piece" aria-hidden="true">
        <path d="M112 34 Q150 42 188 34 L262 392 Q150 412 38 392 Z" className="dk-pages__cut" />
        <path d="M112 34 Q150 42 188 34 L262 392 Q150 412 38 392 Z" className="dk-pages__stitch" transform="translate(150 220) scale(0.92) translate(-150 -220)" />
        <path d="M150 120 V330 M144 130 L150 120 L156 130 M144 320 L150 330 L156 320" className="dk-pages__grain" />
        <text x="150" y="232" textAnchor="middle" className="dk-pages__label">SKIRT FRONT</text>
        <text x="150" y="248" textAnchor="middle" className="dk-pages__label is-sm">CUT 1 ON THE BIAS</text>
      </svg>
      <span className="dk-strip" style={{ left: "33%", top: "33%", rotate: "8deg" }} />
      <span className="dk-strip" style={{ left: "66%", top: "66%", rotate: "-6deg" }} />
      <span className="dk-strip" style={{ left: "33%", top: "66%", rotate: "84deg" }} />
    </div>
  );
}

/* the table with what lies on it. With a crop, it is shown through a
   window onto one stretch of it (phones), and the cards stay off it. */
function Table({ crop, phoneOn, cards }: { crop?: (typeof CROPS)[number]; phoneOn: boolean; cards: boolean }) {
  const span = crop ? crop.x1 - crop.x0 : 1;
  const inner = crop
    ? ({ position: "absolute", top: 0, height: "100%", width: `${100 / span}%`, left: `${(-crop.x0 / span) * 100}%` } as CSSProperties)
    : undefined;
  const table = (
    <div className="dk-table" style={inner}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={TABLE.src} alt="" draggable={false} className="dk-table__img" />
      <div className="dk-on" data-drop style={at(NOTE, 1)}>
        <Note />
      </div>
      <div className="dk-on" data-drop data-phone style={at(PHONE, 2)}>
        <Phone on={phoneOn} />
      </div>
      <div className="dk-on" data-drop style={at(PAGES, 1)}>
        <Pages />
      </div>
      {cards &&
        CARDS.map((c, i) => (
          <div key={i} className="dk-on dk-on--card" data-drop style={at(c, 0)}>
            <StepCard {...STEPS[i]} />
          </div>
        ))}
    </div>
  );
  if (!crop) return table;
  return (
    <div className="dk-crop" style={{ aspectRatio: `${span * ASPECT}` }}>
      {table}
    </div>
  );
}

/* ---- the section ------------------------------------------------------ */

export function HowItWorksDesk() {
  const scroller = useRef<HTMLDivElement>(null);
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(true);
  const [phoneOn, setPhoneOn] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // desktop: the vertical scroll carries you along the table
  useEffect(() => {
    const sc = scroller.current;
    const sec = section.current;
    const tr = track.current;
    if (!sc || !sec || !tr) return;
    if (!wide) {
      sec.style.height = "";
      tr.style.transform = "";
      return;
    }
    let raf = 0;
    let run = 0;
    let marks: number[] = [];
    const update = () => {
      raf = 0;
      const p = Math.min(1, Math.max(0, (sc.scrollTop - sec.offsetTop) / Math.max(1, run)));
      const x = p * run;
      tr.style.transform = `translate3d(${-x}px, 0, 0)`;
      const look = x + window.innerWidth * 0.55;
      let a = 0;
      marks.forEach((m, i) => look > m && (a = i));
      setActive(a);
    };
    const size = () => {
      run = Math.max(0, tr.scrollWidth - window.innerWidth);
      sec.style.height = `${run + window.innerHeight}px`;
      const place = tr.querySelector<HTMLElement>(".dk-place");
      const t = place?.querySelector<HTMLElement>(".dk-table");
      if (place && t) marks = CARDS.map((c) => place.offsetLeft + c.x * t.offsetWidth);
      update();
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    size();
    sc.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", size);
    return () => {
      cancelAnimationFrame(raf);
      sc.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", size);
    };
  }, [wide]);

  // things drop onto the table as they come into view
  useEffect(() => {
    const sc = scroller.current;
    if (!sc) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          el.classList.add("is-placed");
          if (el.dataset.phone !== undefined) setPhoneOn(true);
          io.unobserve(el);
        });
      },
      { root: sc, threshold: 0.3 },
    );
    sc.querySelectorAll("[data-drop]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [wide]);

  return (
    <div ref={scroller} data-lenis-prevent className="absolute inset-0 overflow-y-auto overflow-x-hidden">
      <section ref={section} className="dk" aria-labelledby="dk-title">
        <div className="dk-stage">
          <div ref={track} className="dk-track">
            <header className="dk-intro" data-drop>
              <p className="dk-eyebrow">Three steps</p>
              <h2 id="dk-title" className="dk-title">
                How it works
              </h2>
              <p className="dk-sub">From your body to the cutting table.</p>
              <p className="dk-hint" aria-hidden="true">
                Scroll <span>→</span>
              </p>
            </header>

            {wide ? (
              <div className="dk-place">
                <Table phoneOn={phoneOn} cards />
              </div>
            ) : (
              STEPS.map((s, i) => (
                <div key={s.n} className="dk-step">
                  <div className="dk-step__card" data-drop>
                    <StepCard {...s} />
                  </div>
                  <Table crop={CROPS[i]} phoneOn={phoneOn} cards={false} />
                </div>
              ))
            )}

            <div className="dk-end" data-drop>
              <div className="dk-tag">
                <span className="dk-tag__hole" aria-hidden="true" />
                <p className="dk-tag__k">Your turn</p>
                <PrimaryButton href={APP_URL}>{CTA_LABEL}</PrimaryButton>
              </div>
            </div>
          </div>

          {wide && (
            <ol className="dk-steps" aria-hidden="true">
              {STEPS.map((s, i) => (
                <li key={s.n} className={i === active ? "is-on" : ""}>
                  <span>{s.n}</span>
                  {s.k}
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}
