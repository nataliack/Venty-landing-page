"use client";

import { useEffect, useRef, useState } from "react";
import { DitherEdge } from "../DitherEdge";
import { useGlow } from "@/lib/useGlow";
import { useReveals } from "@/lib/useReveals";
import "./features.css";

/* 4. Features (dark). "Everything a pattern needs." Six cards of backlit
   glass in a bento (after the reference Jose shared), lit by one light that
   follows the pointer and drifts on its own on phones (useGlow, from the
   lab's glow cards). Each card holds a small working piece of the app:

     Mark up your references   a photo with a ring drawn round the neckline
                               and two notes pinned to it
     Refine in plain words     a change asked for in a sentence, and the
                               redraft it gets
     Print options             a dial: A4 at home or A0 at a print shop
                               (press +), seam allowance on or off
     Body library              the bodies you've measured, dated
     See it on your body       3D and flat pieces, in turn (or pick one)
     Pattern library           a pattern with its versions and notes

   It rises over the end of How it works with a dark dithered edge (weave),
   the reverse of the light that rose over the hero.

   IMAGES (replace the files, keep the names):
     /features/on-body.webp    See it on your body: the garment on a body, 4:5
     /features/reference.webp  Mark up: a reference photo of a garment, 4:5 */

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

/* The light on a card, in pieces the GPU moves and fades (useGlow writes
   only their transform and opacity, so nothing is repainted as it moves):
   a soft disc inside, a glow along the inner edge, the rim lit on the side
   facing the light, and (from the cell) a halo outside the card. */
function Fx() {
  return (
    <span className="ft-fx" aria-hidden="true">
      <span className="ft-fx__light" data-fx="light" />
      <span className="ft-fx__glow" data-fx="glow" />
      <span className="ft-fx__rim">
        <span className="ft-fx__rimlight" data-fx="rim" />
      </span>
    </span>
  );
}

function Cell({ className, halo = true, children }: { className: string; halo?: boolean; children: React.ReactNode }) {
  return (
    <div data-up className={`ft-cell ${className}`}>
      {halo && <span className="ft-halo" data-fx="halo" aria-hidden="true" />}
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
function MarkUp() {
  return (
    <figure className="ft-mark" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/features/reference.webp" alt="" loading="lazy" decoding="async" />
      <svg viewBox="0 0 200 250" preserveAspectRatio="none" className="ft-mark__ink">
        <path className="ft-ink" pathLength={1} d="M78 64 C86 50 128 50 134 66 C140 84 110 98 88 92 C70 87 66 76 80 62" />
        <path className="ft-ink is-late" pathLength={1} d="M34 214 C70 210 120 208 168 211" />
      </svg>
      <span className="ft-pin" style={{ left: "64%", top: "22%" }}>
        This neckline
      </span>
      <span className="ft-pin is-late" style={{ left: "12%", top: "74%" }}>
        Shorter than this
      </span>
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
      <span className="ft-halo" data-fx="halo" aria-hidden="true" />
      <Fx />
      <p className="sr-only">
        Print options. A4 at home or A0 at a print shop. Seam allowance on or off, a page map for taping, and a label on every piece.
      </p>
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

/* ---- See it on your body: 3D and the flat pieces --------------------- */
function OnBody() {
  const ref = useRef<HTMLDivElement>(null);
  const [flat, setFlat] = useState(false);
  const [held, setHeld] = useState(false); // once you pick, it stops turning over

  useEffect(() => {
    if (held) return;
    const el = ref.current;
    if (!el) return;
    let t = 0;
    const io = new IntersectionObserver((e) => {
      window.clearInterval(t);
      if (e[0].isIntersecting) t = window.setInterval(() => setFlat((f) => !f), 3800);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(t);
    };
  }, [held]);

  const pick = (f: boolean) => {
    setHeld(true);
    setFlat(f);
  };

  return (
    <div ref={ref} className="ft-view">
      <div className="ft-seg" role="group" aria-label="View">
        <button type="button" aria-pressed={!flat} onClick={() => pick(false)}>
          3D
        </button>
        <button type="button" aria-pressed={flat} onClick={() => pick(true)}>
          Flat pieces
        </button>
        <span className="ft-seg__thumb" data-flat={flat} aria-hidden="true" />
      </div>
      <div className="ft-stage" data-flat={flat} aria-hidden="true">
        <figure className="ft-stage__3d">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/features/on-body.webp" alt="" loading="lazy" decoding="async" />
          <span className="ft-orbit" />
          <span className="ft-turn">360°</span>
        </figure>
        <svg viewBox="0 0 420 320" className="ft-stage__flat">
          {/* a slip dress, flat: front and back on the bias, two straps */}
          <g transform="translate(40 18) rotate(-8 80 140)">
            <path className="ft-pc" d="M52 20 Q80 30 108 20 L150 270 Q80 286 10 270 Z" />
            <path className="ft-pc__seam" d="M52 20 Q80 30 108 20 L150 270 Q80 286 10 270 Z" transform="translate(80 150) scale(0.9) translate(-80 -150)" />
            <path className="ft-pc__grain" d="M80 80 L80 220 M75 88 L80 80 L85 88 M75 212 L80 220 L85 212" transform="rotate(45 80 150)" />
            <text x="80" y="150" className="ft-pc__t">FRONT</text>
            <text x="80" y="162" className="ft-pc__t is-sm">CUT 1 ON THE BIAS</text>
          </g>
          <g transform="translate(206 30) rotate(6 80 140)">
            <path className="ft-pc" d="M44 30 Q80 40 116 30 L152 262 Q80 278 8 262 Z" />
            <path className="ft-pc__seam" d="M44 30 Q80 40 116 30 L152 262 Q80 278 8 262 Z" transform="translate(80 150) scale(0.9) translate(-80 -150)" />
            <path className="ft-pc__grain" d="M80 80 L80 220 M75 88 L80 80 L85 88 M75 212 L80 220 L85 212" transform="rotate(45 80 150)" />
            <text x="80" y="150" className="ft-pc__t">BACK</text>
            <text x="80" y="162" className="ft-pc__t is-sm">CUT 1 ON THE BIAS</text>
          </g>
          <g transform="translate(372 40)">
            <rect className="ft-pc" x="0" y="0" width="12" height="120" rx="2" />
            <rect className="ft-pc" x="20" y="10" width="12" height="120" rx="2" />
            <text x="16" y="150" className="ft-pc__t is-sm">STRAP ×2</text>
          </g>
        </svg>
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
  const field = useGlow<HTMLDivElement>({ reach: (w) => w * 0.8, follow: true });
  useReveals(root);

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
      <DitherEdge color="#0b0c15" pattern="weave" />
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

        <div ref={field} className="ft-grid" data-reveal="top 82%">
          <span className="ft-bloom" data-glow-bloom aria-hidden="true" />
          <Card className="ft-c--mark" title="Mark up your references." body="Draw on a photo or pin a note to it: this neckline, shorter than this. Venty reads your marks along with the rest of your brief.">
            <MarkUp />
          </Card>
          <Card className="ft-c--refine" title="Refine in plain words." body="Ask for changes the way you'd say them: five centimetres longer, a wider strap, a lower back. Venty redrafts the pieces.">
            <Refine />
          </Card>
          <Dial />
          <Card className="ft-c--bodies" title="Body library." body="Every body you measure, saved and dated. Measure again next season and keep both, or keep a body for someone you sew for.">
            <Bodies />
          </Card>
          <Card className="ft-c--body" title="See it on your body." body="Turn the garment on your body in 3D, then switch to the flat pieces to see what each one does.">
            <OnBody />
          </Card>
          <Card className="ft-c--lib" title="Pattern library." body="Every pattern you draft, with its versions, your notes and the body it was drafted on. Print it again any time.">
            <Library />
          </Card>
        </div>
      </div>
    </section>
  );
}
