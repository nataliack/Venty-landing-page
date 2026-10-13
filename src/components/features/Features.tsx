"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { DitherEdge } from "../DitherEdge";
import { useReveals } from "@/lib/useReveals";
import { turn, turnPosition } from "@/lib/turnSequence";
import "./features.css";

/* 4. Features (dark). "Everything a pattern needs." Six cards of backlit
   glass in a bento (after the reference Jose shared). Each card holds a
   small working piece of the app:

     Mark up your references   Jose's model in a cropped jersey, the
                               neckline ringed and the hem marked "longer
                               than this"; a second reference behind her
     Refine in plain words     a change asked for in a sentence, and the
                               redraft it gets
     Print options             a dial: A4 at home or A0 at a print shop
                               (press +), seam allowance on or off
     Body library              the bodies you've measured, dated
     See it on your body       Jose's model turning a full 360°, played by a
                               slider (or by dragging her); or the flat pieces
     Pattern library           a pattern with its versions and notes

   The light: a card lights where the pointer is over it, and only that
   card (useCardLight). Nothing runs while the pointer is elsewhere, and
   phones get no light.

   It rises over the held last screen of How it works with a dark dithered
   edge (the site's one edge: squares on a moving wave), the reverse of the
   light that rose over the hero.

   IMAGES (replace the files, keep the names):
     /features/ref-jersey.webp   Mark up: the model, a cut-out (transparent),
                                 cropped at the skirt; master in media/features
     /features/turn/             See it on your body: the turn's frames, from
                                 tools/turn/build.cjs (src/lib/turnSequence)
   PENDING: the second reference photo (SECOND_REF). */

/** The second reference in Mark up: a photo with its background, to come.
    Until then the card shows an empty slot in its place. */
const SECOND_REF: string | null = null;


const BODIES = [
  { who: "Me", when: "Oct 2026", m: "Bust 92 · Waist 74 · Hip 98" },
  { who: "Me", when: "Mar 2026", m: "Bust 93 · Waist 75 · Hip 99" },
  { who: "Mum", when: "Jun 2026", m: "Bust 98 · Waist 84 · Hip 104" },
];

const VERSIONS = [
  { v: "v1", note: "Midi, easy fit" },
  { v: "v2", note: "5 cm longer" },
  { v: "v3", note: "Lower back, wider strap" },
];

/* The light on a card, in pieces the GPU moves and fades: a soft disc
   inside, a glow along the inner edge, the rim lit on the side facing the
   light, and (from the cell) a halo outside the card. */
function Fx() {
  return (
    <span className="ft-fx" aria-hidden="true">
      <span className="ft-fx__light" data-fx="light" />
      <span className="ft-fx__glow" />
      <span className="ft-fx__rim">
        <span className="ft-fx__rimlight" data-fx="rim" />
      </span>
    </span>
  );
}

/** Lights the card under the pointer: its light pieces follow the pointer
    (a transform, written at most once a frame) and fade in while it is
    there (a class on the cell; the fades are CSS). Only with a mouse; only
    the card the pointer is over; nothing at all otherwise. */
function useCardLight(grid: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = grid.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const offs = Array.from(el.querySelectorAll<HTMLElement>("[data-glow]"), (card) => {
      const cell = card.closest<HTMLElement>(".ft-cell") ?? card;
      const moving = Array.from(card.querySelectorAll<HTMLElement>("[data-fx]"));
      let raf = 0;
      let x = 0;
      let y = 0;
      const move = (e: PointerEvent) => {
        const r = card.getBoundingClientRect();
        x = e.clientX - r.left;
        y = e.clientY - r.top;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          for (const m of moving) m.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        });
      };
      const enter = (e: PointerEvent) => {
        move(e);
        cell.classList.add("is-lit");
      };
      const leave = () => cell.classList.remove("is-lit");
      card.addEventListener("pointerenter", enter);
      card.addEventListener("pointermove", move);
      card.addEventListener("pointerleave", leave);
      return () => {
        cancelAnimationFrame(raf);
        card.removeEventListener("pointerenter", enter);
        card.removeEventListener("pointermove", move);
        card.removeEventListener("pointerleave", leave);
      };
    });
    return () => offs.forEach((off) => off());
  }, [grid]);
}

function Cell({ className, halo = true, children }: { className: string; halo?: boolean; children: React.ReactNode }) {
  return (
    <div data-up className={`ft-cell ${className}`}>
      {halo && <span className="ft-halo" aria-hidden="true" />}
      {children}
    </div>
  );
}

function Card({ title, body, className = "", children }: { title: string; body: string; className?: string; children: React.ReactNode }) {
  return (
    <Cell className={className}>
      <article data-glow className="ft-card">
        <Fx />
        <p className="ft-card__copy">
          <b>{title}</b> {body}
        </p>
        {children}
      </article>
    </Cell>
  );
}

/* ---- Mark up your references ----------------------------------------- */
/* The model stands on the card's bottom edge, so her photo's crop (at the
   skirt) is the card's own edge. The marks are drawn in the photo's own
   units (its master is 1314 x 2000), so they stay on her at any size: a
   ring round the V neckline, and below the cropped hem a dashed line and an
   arrow down, "longer than this". */
function MarkUp() {
  return (
    <figure className="ft-mark" aria-hidden="true">
      <div className={`ft-mark__second ${SECOND_REF ? "" : "is-empty"}`}>
        {SECOND_REF ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={SECOND_REF} alt="" loading="lazy" decoding="async" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="3.5" y="5" width="17" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="m3.5 16 5-5 4 4 2.5-2.5 5 5" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="15.5" cy="9.5" r="1.4" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        )}
      </div>
      <div className="ft-mark__model">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/features/ref-jersey.webp" alt="" loading="lazy" decoding="async" />
        <svg viewBox="0 0 1314 2000" className="ft-mark__ink">
          <path className="ft-ink" pathLength={1} d="M408 600 C430 520 880 500 905 590 C930 690 770 850 640 845 C500 840 380 720 420 585" />
          <path className="ft-ink is-late is-dash" pathLength={1} d="M250 1345 C450 1336 860 1336 1060 1345" />
          <path className="ft-ink is-later" pathLength={1} d="M655 1370 L655 1560 M600 1505 L655 1560 L710 1505" />
        </svg>
        <span className="ft-pin" style={{ left: "70%", top: "26%" }}>
          This neckline
        </span>
        <span className="ft-pin is-late" style={{ left: "6%", top: "76%" }}>
          Longer than this
        </span>
      </div>
    </figure>
  );
}

/* ---- Refine in plain words ------------------------------------------- */
function Refine() {
  return (
    <div className="ft-chat" aria-hidden="true">
      <p className="ft-msg is-me">Five centimetres longer, and a wider strap.</p>
      <p className="ft-msg is-venty">
        <span className="ft-msg__who">Venty</span>
        Redrafted. Skirt front +5 cm, strap 3 cm.
      </p>
      <p className="ft-input">
        <span>A lower back…</span>
        <i className="ft-send">
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </i>
      </p>
    </div>
  );
}

/* ---- Print options: the dial ----------------------------------------- */
function Dial() {
  const [big, setBig] = useState(true);
  const [seam, setSeam] = useState(true);
  const ticks = Array.from({ length: 72 }, (_, i) => i);
  return (
    <Cell className="ft-cell--dial" halo={false}>
      <article data-glow className="ft-card ft-dial">
        {/* round, so its halo sits inside it (it draws outside its own edge) */}
        <span className="ft-halo" aria-hidden="true" />
        <Fx />
        <p className="sr-only">Print options. A4 at home or A0 at a print shop, seam allowance on or off, a page map for taping and a label on every piece.</p>
        <svg viewBox="0 0 200 200" className="ft-dial__ring" aria-hidden="true">
          {ticks.map((i) => (
            <line key={i} x1="100" y1="6" x2="100" y2={i % 6 ? 11 : 16} transform={`rotate(${i * 5} 100 100)`} />
          ))}
        </svg>
        <div className="ft-dial__face" aria-hidden="true">
          <p className="ft-dial__k">
            <b>Print options.</b>
          </p>
          <p className="ft-dial__size">
            <span key={big ? "a0" : "a4"}>{big ? "A0" : "A4"}</span>
          </p>
          <p className="ft-dial__where">{big ? "At a print shop" : "At home"}</p>
        </div>
        <div className="ft-dial__opts">
          <button type="button" className="ft-chip" aria-pressed={seam} onClick={() => setSeam((s) => !s)}>
            Seam allowance <b>{seam ? "on" : "off"}</b>
          </button>
          <span className="ft-chip is-still" aria-hidden="true">
            {big ? "Labels" : "Page map"}
          </span>
        </div>
        <button type="button" className="ft-dial__btn" onClick={() => setBig((b) => !b)} aria-label={big ? "Print on A4 at home" : "Print on A0 at a print shop"}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>
      </article>
    </Cell>
  );
}

/* ---- Body library ---------------------------------------------------- */
function Bodies() {
  const [on, setOn] = useState(0);
  return (
    <ul className="ft-bodies">
      {BODIES.map((b, i) => (
        <li key={i}>
          <button type="button" className="ft-body" aria-pressed={on === i} onClick={() => setOn(i)}>
            <span className="ft-av" aria-hidden="true">
              {b.who === "Mum" ? "M" : "Me"}
            </span>
            <span className="ft-body__t">
              <span>
                {b.who} <i>·</i> {b.when}
              </span>
              <small>{b.m}</small>
            </span>
            <svg viewBox="0 0 16 16" fill="none" className="ft-body__go" aria-hidden="true">
              <path d="m6 3.5 4.5 4.5L6 12.5" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ---- See it on your body: turn it, or see the flat pieces ------------ */
/* She turns a full 360°: an image sequence (src/lib/turnSequence) drawn on
   a canvas, the first frame as a poster until it has drawn. The frames load
   when the card comes near, and the player (with its few decoded frames)
   lives only while it is near.
   The turn is a slider (a native range underneath, so keys and screen
   readers work; drawn over it, a track with a tick every 30 degrees, the
   turned part lit, a thumb with the turn's arrows, the angle above, and
   Front, Back, Front under it). Dragging her turns her too, round and round.
   The first time it comes into view it turns a little and back, so you can
   see it does. */
function Turn({ deg, onDeg }: { deg: number; onDeg: (d: number) => void }) {
  const p = deg / 359;
  return (
    <div className="ft-turnbar">
      <div className="ft-turnbar__top" aria-hidden="true">
        <span>Drag to turn</span>
        <b>{Math.round(deg)}°</b>
      </div>
      <div className="ft-turnbar__track" style={{ "--p": p } as React.CSSProperties}>
        <span className="ft-turnbar__ticks" aria-hidden="true">
          {Array.from({ length: 13 }, (_, i) => (
            <i key={i} />
          ))}
        </span>
        <span className="ft-turnbar__fill" aria-hidden="true" />
        <span className="ft-turnbar__thumb" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M6.5 6.5 3.5 10l3 3.5M13.5 6.5l3 3.5-3 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <input type="range" min={0} max={359} step={1} value={Math.round(deg)} onChange={(e) => onDeg(+e.target.value)} aria-label="Turn her round" aria-valuetext={`${Math.round(deg)} degrees`} />
      </div>
      <div className="ft-turnbar__marks" aria-hidden="true">
        <span>Front</span>
        <span>Back</span>
        <span>Front</span>
      </div>
    </div>
  );
}

function OnBody() {
  // the stage (the view itself is display: contents, with no box to watch)
  const ref = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const player = useRef<ReturnType<typeof turn.createPlayer> | null>(null);
  const [flat, setFlat] = useState(false);
  const [deg, setDeg] = useState(0);
  const at = useRef(0); // the angle, for a player made later
  const drag = useRef<{ x: number; d: number } | null>(null);
  const hinted = useRef(false);

  // the frames load, and the player lives, while the card is near
  useEffect(() => {
    const el = ref.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const near = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !player.current) {
          turn.preload();
          player.current = turn.createPlayer(cv);
          player.current.setPosition(turnPosition(at.current));
        } else if (!e.isIntersecting && player.current) {
          player.current.destroy();
          player.current = null;
          cv.style.opacity = "0";
        }
      },
      { rootMargin: "100% 0px 100% 0px" },
    );
    near.observe(el);
    return () => {
      near.disconnect();
      player.current?.destroy();
      player.current = null;
    };
  }, []);

  useEffect(() => {
    at.current = deg;
    player.current?.setPosition(turnPosition(deg));
  }, [deg]);

  // the first time it is on screen: a little turn and back, to show it turns
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || hinted.current) return;
        hinted.current = true;
        io.disconnect();
        const t0 = performance.now() + 900;
        const step = (t: number) => {
          const k = Math.min(1, Math.max(0, (t - t0) / 2200));
          if (drag.current) return; // they took it over
          setDeg(48 * Math.sin(Math.PI * k) ** 2);
          if (k < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="ft-view">
      <div className="ft-seg" role="group" aria-label="View">
        <button type="button" aria-pressed={!flat} onClick={() => setFlat(false)}>
          On the body
        </button>
        <button type="button" aria-pressed={flat} onClick={() => setFlat(true)}>
          Flat pieces
        </button>
        <span className="ft-seg__thumb" data-flat={flat} aria-hidden="true" />
      </div>
      <div ref={ref} className="ft-stage" data-flat={flat}>
        <figure
          className="ft-stage__3d"
          aria-hidden="true"
          onPointerDown={(e) => {
            drag.current = { x: e.clientX, d: deg };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            setDeg((((drag.current.d + (e.clientX - drag.current.x) * 0.6) % 360) + 360) % 360);
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={turn.poster} alt="" loading="lazy" decoding="async" draggable={false} />
          <canvas ref={canvas} />
        </figure>
        <svg viewBox="0 0 420 320" className="ft-stage__flat" aria-hidden="true">
          {/* the jacket, flat: front, back and a sleeve */}
          <g transform="translate(26 26) rotate(-6 80 130)">
            <path className="ft-pc" d="M40 20 Q70 34 96 26 L118 40 L132 230 Q80 244 18 232 L10 60 Z" />
            <path className="ft-pc__seam" d="M40 20 Q70 34 96 26 L118 40 L132 230 Q80 244 18 232 L10 60 Z" transform="translate(70 130) scale(0.9) translate(-70 -130)" />
            <path className="ft-pc__grain" d="M70 80 L70 200 M65 88 L70 80 L75 88 M65 192 L70 200 L75 192" />
            <text x="70" y="140" className="ft-pc__t">FRONT</text>
            <text x="70" y="152" className="ft-pc__t is-sm">CUT 2</text>
          </g>
          <g transform="translate(168 34) rotate(4 80 130)">
            <path className="ft-pc" d="M20 24 Q80 40 140 24 L150 234 Q80 248 10 234 Z" />
            <path className="ft-pc__seam" d="M20 24 Q80 40 140 24 L150 234 Q80 248 10 234 Z" transform="translate(80 130) scale(0.9) translate(-80 -130)" />
            <path className="ft-pc__grain" d="M80 80 L80 200 M75 88 L80 80 L85 88 M75 192 L80 200 L85 192" />
            <text x="80" y="140" className="ft-pc__t">BACK</text>
            <text x="80" y="152" className="ft-pc__t is-sm">CUT 1 ON THE FOLD</text>
          </g>
          <g transform="translate(330 40) rotate(8 40 120)">
            <path className="ft-pc" d="M10 10 Q40 0 70 10 L80 230 L0 230 Z" />
            <text x="40" y="130" className="ft-pc__t">SLEEVE</text>
            <text x="40" y="142" className="ft-pc__t is-sm">CUT 2</text>
          </g>
        </svg>
      </div>
      <div className="ft-turnwrap" data-flat={flat}>
        <Turn deg={deg} onDeg={setDeg} />
      </div>
    </div>
  );
}

/* ---- Pattern library ------------------------------------------------- */
function Library() {
  const [v, setV] = useState(2);
  return (
    <div className="ft-lib">
      <div className="ft-lib__ghost is-l" aria-hidden="true">
        <p>Wrap top</p>
        <span>2 versions</span>
      </div>
      <div className="ft-lib__ghost is-r" aria-hidden="true">
        <p>Wide trousers</p>
        <span>1 version</span>
      </div>
      <div className="ft-lib__main">
        <div className="ft-lib__head">
          <p>Slip dress</p>
          <span className="ft-lib__stamp">Midi · Silk</span>
        </div>
        <div className="ft-vers" role="group" aria-label="Versions">
          {VERSIONS.map((x, i) => (
            <button key={x.v} type="button" aria-pressed={v === i} onClick={() => setV(i)}>
              {x.v}
            </button>
          ))}
        </div>
        <dl className="ft-lib__rows">
          <div>
            <dt>Drafted on</dt>
            <dd>Me · Oct 2026</dd>
          </div>
          <div>
            <dt>Note</dt>
            <dd key={v} className="ft-lib__note">
              {VERSIONS[v].note}
            </dd>
          </div>
          <div>
            <dt>Pieces</dt>
            <dd>4</dd>
          </div>
        </dl>
        <span className="ft-lib__print" aria-hidden="true">
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M4.5 6V2.5h7V6M4.5 11.5h-2v-5h11v5h-2M4.5 9.5h7v4h-7z" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          Print again
        </span>
      </div>
    </div>
  );
}

/* ---- the section ----------------------------------------------------- */

export function Features() {
  const root = useRef<HTMLElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  useReveals(root);
  useCardLight(grid);

  return (
    <section
      ref={root}
      id="features"
      data-nav="Features"
      data-wing="frame"
      data-theme-zone="dark"
      data-theme-at="top 35%"
      className="ft"
      aria-labelledby="ft-title"
    >
      <DitherEdge color="#0b0c15" />
      <div className="ft-inner">
        <header className="ft-head" data-reveal>
          <p className="ft-eyebrow">
            <span className="line-mask inline-block">
              <span data-rise className="inline-block">
                Features
              </span>
            </span>
          </p>
          <h2 id="ft-title" className="ft-title">
            <span className="line-mask">
              <span data-rise className="block">
                Everything a
              </span>
            </span>
            <span className="line-mask">
              <span data-rise className="block">
                pattern <em>needs.</em>
              </span>
            </span>
          </h2>
        </header>

        <div ref={grid} className="ft-grid" data-reveal="top 82%">
          <Card className="ft-c--mark" title="Mark up your references." body="Circle what you like, pin a note. Venty reads your marks.">
            <MarkUp />
          </Card>
          <Card className="ft-c--refine" title="Refine in plain words." body="Say what to change, the way you'd say it. Venty redrafts the pieces.">
            <Refine />
          </Card>
          <Dial />
          <Card className="ft-c--bodies" title="Body library." body="Every body you measure, saved and dated. Keep one for anyone you sew for.">
            <Bodies />
          </Card>
          <Card className="ft-c--body" title="See it on your body." body="Turn it on your body, then see the flat pieces it is cut from.">
            <OnBody />
          </Card>
          <Card className="ft-c--lib" title="Pattern library." body="Every pattern with its versions and notes. Print it again any time.">
            <Library />
          </Card>
        </div>
      </div>
    </section>
  );
}
