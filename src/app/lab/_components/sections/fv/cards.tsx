"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent, type ReactNode } from "react";
import { MARK, MARK_BOUNDS } from "@/lib/markFlight";
import { TURN, turnPosition } from "@/lib/turnSequence";

/* Features: the bento's cards, each a small working piece of the app
   (ported from the lab, src/app/lab/_components/sections/fz). Content is
   a stand-in for the final copy and images; the UI reads as the app's.
   Classes: fvc- (the cards), ftp- (the phones). */

/* ---- icons (24 x 24, currentColor) ---- */
const I = {
  plus: "M12 5v14M5 12h14",
  print: "M7 9V4h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v6H7z",
};
function Icon({ d, size = 18, weight = 1.6 }: { d: string; size?: number; weight?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/* ---- her turn, as plain frames: fetched once, when the card comes near ---- */
const frameSrc = (i: number) => `/features/turn/frames/${String(i + 1).padStart(4, "0")}.webp`;
const FIRST_FRAME = frameSrc(0);
let warmed = false;
function warmTurn() {
  if (warmed) return;
  warmed = true;
  for (let i = 0; i < TURN.frames; i++) {
    const im = new Image();
    im.src = frameSrc(i);
  }
}
/** an <img> of the turn; set(deg) shows her at that angle. The frames load
    when `near` (the card) comes within a screen of view */
function useTurn(near: React.RefObject<HTMLElement | null>) {
  const img = useRef<HTMLImageElement>(null);
  const last = useRef(-1);
  useEffect(() => {
    const el = near.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        warmTurn();
        io.disconnect();
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);
  const set = (deg: number) => {
    const f = Math.round(turnPosition(deg));
    if (f === last.current || !img.current) return;
    last.current = f;
    img.current.src = frameSrc(f);
  };
  return [img, set] as const;
}

const SEND = "M12 19V5M5.5 11.5L12 5l6.5 6.5";
// turning a piece: a sheet with an arrow round its corner, each way
const TURN_L = "M12 5h6a2 2 0 0 1 2 2v3M15 8l-3-3 3-3M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2";
const TURN_R = "M12 5H6a2 2 0 0 0-2 2v3M9 8l3-3-3-3M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2";
const SPARK = "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6";

/** the Venty bird, small, as an avatar */
function Bird({ size = 14 }: { size?: number }) {
  const b = MARK_BOUNDS;
  return (
    <svg width={size} height={size} viewBox={`${b.x} ${b.y - (b.width - b.height) / 2} ${b.width} ${b.width}`} fill="currentColor" aria-hidden="true">
      <path d={MARK} />
    </svg>
  );
}

/* ---- Mark up your references -------------------------------------------
   A prototype of Jose's idea: the reference fills the card, its notes
   pinned on it. Tap a pin (or its tab under the picture) and the picture
   pushes in to that detail, macro, and the note is typed out in a comment
   over the picture, as it was written. Tap another and it pulls back out
   first, then pushes in to the next; tap the same again, or the arrow, to
   pull out.

   A detail with a clip (public/lab/features/clips/<clip>-in.mp4) pushes in
   with it: the clip starts on this exact still and ends on the macro;
   <clip>-out.mp4 is the same reversed, for pulling out, and <clip>-end.webp
   its last frame, sharp, shown once it lands. A detail without one yet
   pushes in on the still, scaled (a stand-in), with its selection drawn in
   code (in the photo's units, 1493 x 2000, the cream tweed suit). tab: the
   note's name on its tab; note: the comment, typed out once it lands. */
const DETAILS = [
  {
    n: 1,
    tab: "Collar",
    note: "Keep this round collar exactly as it is: the soft rounded points, sitting flat. Same tweed as the jacket.",
    pin: [0.69, 0.27],
    at: [0.55, 0.285],
    z: 2.8,
    clip: "collar",
    // the stand-in, only if the clip can't play
    sel: <ellipse pathLength={1} cx="830" cy="575" rx="165" ry="82" />,
  },
  {
    n: 2,
    tab: "Buttons",
    note: "Covered buttons in the same tweed, spaced just like these, all the way down the front.",
    pin: [0.63, 0.42],
    at: [0.555, 0.41],
    z: 2.5,
    sel: <rect pathLength={1} x="752" y="660" width="156" height="330" rx="62" />,
  },
  {
    n: 3,
    tab: "Pockets",
    note: "Both flap pockets as they are, the flaps sitting just above the hip.",
    pin: [0.35, 0.47],
    at: [0.555, 0.485],
    z: 2.3,
    sel: (
      <>
        <rect pathLength={1} x="588" y="886" width="186" height="144" rx="24" />
        <rect pathLength={1} x="898" y="886" width="186" height="144" rx="24" />
      </>
    ),
  },
  { n: 4, tab: "Hem", note: "Make the skirt 5 cm longer, so it sits just above the knee. Keep the same A-line.", pin: [0.26, 0.66], at: [0.48, 0.67], z: 1.7, sel: null },
];
const HEM = 4; // the detail drawn as a hem, not a selection
const OUT_MS = 560; // the pull-out on the still, before pushing in to another detail
const TYPE_AFTER_MS = 750; // on the still, the comment starts typing once the push-in has landed
const TYPE_MS = 24; // a character
const clipSrc = (clip: string, part: string) => `/lab/features/clips/${clip}-${part}`;

/* One detail's clip: in and out, two <video>s stacked. Either way starts
   from wherever the other has got to, so a change of mind mid-way turns
   straight round. Fetched when the card comes near (in first, then out).
   run() resolves "ok" at the end it's heading for, "lost" if overtaken by
   another run, "error" if the clip can't play (the detail then falls back
   to the still). */
class ClipPlayer {
  in: HTMLVideoElement | null = null;
  out: HTMLVideoElement | null = null;
  box: HTMLDivElement | null = null;
  failed = false;
  private token = 0;
  private on: HTMLVideoElement | null = null; // the one showing
  warm() {
    const a = this.in;
    const b = this.out;
    if (!a || !b || a.preload === "auto") return;
    a.preload = "auto";
    a.load();
    a.addEventListener("canplaythrough", () => b.preload !== "auto" && ((b.preload = "auto"), b.load()), { once: true });
  }
  // how far in it is, in seconds of the way in
  private at() {
    if (this.on && this.on === this.in) return this.on.currentTime;
    if (this.on && this.on === this.out) return this.on.duration - this.on.currentTime;
    return 0;
  }
  private ready(v: HTMLVideoElement) {
    if (v.readyState >= 2) return Promise.resolve(true);
    if (v.preload !== "auto") {
      v.preload = "auto";
      v.load();
    }
    return new Promise<boolean>((res) => {
      v.addEventListener("loadeddata", () => res(true), { once: true });
      v.addEventListener("error", () => res(false), { once: true });
    });
  }
  hide() {
    this.on = null;
    if (this.box) delete this.box.dataset.show;
    this.in?.removeAttribute("data-show");
    this.out?.removeAttribute("data-show");
  }
  async run(dir: 1 | -1): Promise<"ok" | "lost" | "error"> {
    const token = ++this.token;
    const v = dir === 1 ? this.in : this.out;
    const other = dir === 1 ? this.out : this.in;
    if (!v || !other || !this.box) return "error";
    if (dir === -1 && !this.on) return "ok"; // already out
    const from = this.at();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (dir === -1) return this.hide(), "ok";
    }
    if (!(await this.ready(v))) return (this.failed = true), "error";
    if (token !== this.token) return "lost";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = reduce ? v.duration : dir === 1 ? from : v.duration - from;
    if (Math.abs(v.currentTime - t) > 0.01) {
      v.currentTime = t;
      await new Promise((res) => v.addEventListener("seeked", res, { once: true }));
      if (token !== this.token) return "lost";
    }
    v.dataset.show = "";
    other.pause();
    other.removeAttribute("data-show");
    this.on = v;
    this.box.dataset.show = "";
    if (v.duration - v.currentTime < 0.02) return "ok";
    const end = new Promise<void>((res) => {
      const done = () => {
        v.removeEventListener("ended", done);
        v.removeEventListener("pause", done);
        res();
      };
      v.addEventListener("ended", done);
      v.addEventListener("pause", done);
    });
    try {
      await v.play();
    } catch {
      return token === this.token ? ((this.failed = true), this.hide(), "error") : "lost";
    }
    await end;
    return token === this.token && v.ended ? "ok" : "lost";
  }
}

export function MarkCard() {
  const [on, setOn] = useState<number | null>(null);
  const [aim, setAim] = useState<number | null>(null); // where the zoom is centred (kept while pulling out)
  const [landed, setLanded] = useState<number | null>(null); // a clip that has reached its macro
  const [typed, setTyped] = useState(0); // how much of the comment is typed
  const [players] = useState(() => new Map<number, ClipPlayer>());
  const frame = useRef<HTMLDivElement>(null);
  const typeT = useRef(0);
  const seq = useRef(0); // each pick; anything still waiting on an older one gives up
  const leaving = useRef<{ n: number; done: Promise<void> } | null>(null); // the detail pulling out
  const player = (n: number) => {
    let p = players.get(n);
    if (!p) players.set(n, (p = new ClipPlayer()));
    return p;
  };
  const byN = (n: number) => DETAILS.find((x) => x.n === n) ?? DETAILS[0];
  // the detail's clip, if it has one that plays
  const clipOf = (n: number | null) => (n !== null && byN(n).clip && !player(n).failed ? player(n) : null);
  useEffect(() => () => window.clearTimeout(typeT.current), []);
  // the clips load when the card comes within a screen of view
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        players.forEach((p) => p.warm());
        io.disconnect();
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [players]);
  // type a detail's comment out, a character at a time (all at once, reduced motion)
  const type = (n: number, after: number) => {
    window.clearTimeout(typeT.current);
    const len = byN(n).note.length;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setTyped(len);
    setTyped(0);
    const step = (i: number) => {
      setTyped(i);
      if (i < len) typeT.current = window.setTimeout(() => step(i + 1), TYPE_MS);
    };
    typeT.current = window.setTimeout(() => step(1), after);
  };
  const go = async (n: number) => {
    const my = seq.current;
    const p = clipOf(n);
    // wait for the one pulling out, unless it's this one: then turn round
    const l = leaving.current;
    if (l && !(p && l.n === n)) {
      await l.done;
      if (my !== seq.current) return;
    }
    setAim(n);
    setOn(n);
    setLanded(null);
    if (!p) return type(n, TYPE_AFTER_MS);
    const r = await p.run(1);
    if (my !== seq.current) return;
    if (r === "ok") {
      setLanded(n);
      type(n, 0);
    } else if (r === "error") type(n, TYPE_AFTER_MS); // on the still instead
  };
  // pull out of the detail in hand, if any
  const out = () => {
    const m = on;
    if (m === null) return;
    window.clearTimeout(typeT.current);
    setOn(null);
    setLanded(null);
    const p = clipOf(m);
    const done: Promise<void> = p
      ? p.run(-1).then((r) => {
          if (r === "ok") p.hide();
        })
      : new Promise((res) => window.setTimeout(res, OUT_MS));
    leaving.current = { n: m, done };
    done.then(() => {
      if (leaving.current?.done === done) leaving.current = null;
    });
  };
  const pick = (n: number | null) => {
    seq.current++;
    if (n === null || n === on) return out();
    out();
    void go(n);
  };
  const a = byN(on ?? aim ?? 1);
  const film = clipOf(on) !== null; // pushed in on a clip, not the still
  const still = on !== null && !film; // pushed in on the still
  const said = on !== null && (!film || landed === on); // the comment shows
  const done = typed >= a.note.length;
  return (
    <div className="fvc-mark">
      <div ref={frame} className={`fvc-mark__frame ${on ? "is-in" : ""}`}>
        <div
          className="fvc-mark__fig"
          style={{ "--fvc-z": still ? a.z : 1, "--fvc-on": still ? 1 : 0, "--ax": a.at[0], "--ay": a.at[1], "--cy": 0.4, transformOrigin: `${a.at[0] * 100}% ${a.at[1] * 100}%` } as CSSProperties}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lab/features/ref-tweed.webp" alt="The reference: a cream tweed suit, marked up" draggable={false} loading="lazy" decoding="async" />
          <svg viewBox="0 0 1493 2000" aria-hidden="true">
            {DETAILS.map((x) => x.sel && <g key={x.n} className={`fvc-sel ${still && on === x.n ? "is-on" : ""}`}>{x.sel}</g>)}
            <g className={`fvc-hem ${on === HEM ? "is-on" : ""}`}>
              <path className="fvc-hem__now" d="M520 1362 L1052 1338" />
              <path className="fvc-hem__new" d="M520 1442 L1052 1418" />
              <path className="fvc-hem__arrow" d="M972 1346 V1414 M952 1394 L972 1416 L992 1394" />
            </g>
          </svg>
          <span className={`fvc-chip ${on === HEM ? "is-on" : ""}`} style={{ left: "65%", top: "74.5%" }}>
            +5 cm
          </span>
          {DETAILS.map((x) => (
            <button
              key={x.n}
              type="button"
              className={`fvc-pin ${on === x.n && still ? "is-on" : ""} ${on && (film || on !== x.n) ? "is-away" : ""}`}
              style={{ left: `${x.pin[0] * 100}%`, top: `${x.pin[1] * 100}%` }}
              onClick={() => pick(x.n)}
              aria-label={`Note ${x.n}, ${x.tab}: ${x.note}`}
              aria-pressed={on === x.n}
            >
              {x.n}
            </button>
          ))}
        </div>
        {/* the clips, over the still, framed as it is; each shows only while it plays or has landed */}
        {DETAILS.map(
          (x) =>
            x.clip && (
              <div
                key={x.n}
                ref={(el) => {
                  player(x.n).box = el;
                }}
                className={`fvc-clip ${landed === x.n ? "is-landed" : ""}`}
                aria-hidden="true"
              >
                <video
                  ref={(el) => {
                    player(x.n).in = el;
                  }}
                  src={clipSrc(x.clip, "in.mp4")}
                  muted
                  playsInline
                  preload="none"
                  disablePictureInPicture
                />
                <video
                  ref={(el) => {
                    player(x.n).out = el;
                  }}
                  src={clipSrc(x.clip, "out.mp4")}
                  muted
                  playsInline
                  preload="none"
                  disablePictureInPicture
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="fvc-clip__end" src={clipSrc(x.clip, "end.webp")} alt="" loading="lazy" decoding="async" />
                {/* the outline goes here, traced on the last frame */}
              </div>
            ),
        )}
        {/* back out to the whole photo */}
        <button type="button" className="fvc-mark__out" onClick={() => pick(null)} tabIndex={on ? 0 : -1} aria-label="Back to the whole photo" title="Back to the whole photo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
        </button>
        {/* the note, typed out over the picture once it has pushed in */}
        <div className={`fvc-comment ${said ? "is-on" : ""} ${film ? "is-now" : ""}`}>
          {/* the whole comment holds the room; the typed part sits over it */}
          <p className="fvc-comment__text" aria-hidden="true">
            <span className="fvc-comment__ghost">{a.note}</span>
            <span className="fvc-comment__typed">
              {a.note.slice(0, typed)}
              <span className={`fvc-comment__caret ${done ? "is-done" : ""}`} />
            </span>
          </p>
        </div>
      </div>
      {/* the notes, by name: each pushes in to its detail */}
      <div className="fvc-tabs" role="group" aria-label="Notes">
        {DETAILS.map((x) => (
          <button key={x.n} type="button" className={on === x.n ? "is-on" : ""} onClick={() => pick(x.n)} aria-pressed={on === x.n} aria-label={`${x.tab}: ${x.note}`}>
            <span className="fvc-tabs__n" aria-hidden="true">
              {x.n}
            </span>
            {x.tab}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---- Refine in plain words ------------------------------------------------
   A chat: the pattern it's about at the top, your message, Venty's answer
   with what it changed, and the composer. */
export function RefineCard() {
  return (
    <div className="fvc-chat">
      <header className="fvc-chat__head">
        <span className="fvc-chat__file">Slip dress</span>
        <span className="fvc-tag">v2 → v3</span>
      </header>
      <div className="fvc-chat__log">
        <p className="fvc-bubble is-me">5 cm longer, wider straps.</p>
        <div className="fvc-reply">
          <span className="fvc-avatar">
            <Bird size={12} />
          </span>
          <div className="fvc-reply__body">
            <p className="fvc-bubble">Done. Four pieces redrafted.</p>
            <p className="fvc-diff">
              <span>Hem +5 cm</span>
              <span>Straps 3 cm</span>
            </p>
          </div>
        </div>
      </div>
      <div className="fvc-compose">
        <span>Ask for a change…</span>
        <span className="fvc-compose__send" aria-hidden="true">
          <Icon d={SEND} size={14} weight={2} />
        </span>
      </div>
    </div>
  );
}

/* ---- See it on your body ---------------------------------------------------
   Her turn, feathered into the card; drag her, or the slider under her (a
   plain track, filled cornflower up to where she is). "Drag to turn" sits
   there until you do, and keeps out of the way while you are. */
export function TurnCard() {
  const box = useRef<HTMLDivElement>(null);
  const [img, set] = useTurn(box);
  const [deg, setDeg] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; d: number } | null>(null);
  const to = (d: number) => {
    const v = Math.round(((d % 360) + 360) % 360);
    setDeg(v);
    set(v);
  };
  const end = () => {
    drag.current = null;
    setDragging(false);
  };
  // the three views to jump to, and which one she is nearest
  const VIEWS: [string, number][] = [
    ["Front", 0],
    ["Side", 90],
    ["Back", 180],
  ];
  const near = (v: number) => Math.min(Math.abs(deg - v), 360 - Math.abs(deg - v)) < 12;
  return (
    <div ref={box} className={`fvc-turn ${dragging ? "is-dragging" : ""}`}>
      <div
        className="fvc-turn__stage"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, d: deg };
          setDragging(true);
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {}
        }}
        onPointerMove={(e) => drag.current && to(drag.current.d + (e.clientX - drag.current.x) * 0.7)}
        onPointerUp={end}
        onPointerCancel={end}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={img} src={FIRST_FRAME} alt="The model in the garment; drag or use the slider to turn her" draggable={false} loading="lazy" decoding="async" />
        <span className="fvc-turn__hint" aria-hidden="true">
          Drag to turn
        </span>
      </div>
      <div className="fvc-turn__panel">
        <p className="fvc-label">View</p>
        <div className="fvc-turn__views" role="group" aria-label="Views">
          {VIEWS.map(([k, v]) => (
            <button key={k} type="button" aria-pressed={near(v)} onClick={() => to(v)}>
              {k}
            </button>
          ))}
        </div>
        <p className="fvc-turn__deg" aria-hidden="true">
          {deg}
          <span>°</span>
        </p>
        <input
          type="range"
          className="fvc-slider"
          min={0}
          max={359}
          value={deg}
          onChange={(e) => to(+e.target.value)}
          onPointerDown={() => setDragging(true)}
          onPointerUp={() => setDragging(false)}
          style={{ "--v": `${(deg / 359) * 100}%` } as CSSProperties}
          aria-label="Turn her"
          aria-valuetext={`${deg} degrees`}
        />
      </div>
    </div>
  );
}

/* ---- Body library -------------------------------------------------------------
   The person you're drafting for on a dress form drawn from her own
   measurements (switch person and the form reshapes to them), her three
   measurements drawn across it and listed beside it, the date they were
   taken; the others saved, as avatars to switch to. A photo can take the
   form's place later. */
const BODIES = [
  { id: "natalia", name: "Natalia", when: "Measured 12 Oct", m: [92, 74, 98] },
  { id: "mei", name: "Mei", when: "Measured 3 Sep", m: [86, 68, 92] },
  { id: "amara", name: "Amara", when: "Measured 28 Aug", m: [101, 86, 106] },
];
/** a dress form, 100 x 160, from bust, waist and hip in cm. Half-widths
    grow from Natalia's (92, 74, 98) at a little more than true scale, so
    the difference between people reads at this size */
function formOf([bust, waist, hip]: number[]) {
  const c = 50;
  const B = 33 + (bust - 92) * 0.9;
  const W = 26.6 + (waist - 74) * 0.9;
  const H = 35.3 + (hip - 98) * 0.9;
  const S = B * 0.9;
  const p = (n: number) => n.toFixed(1);
  return {
    d: `M${p(c - 6)} 8 H${p(c + 6)} V15 Q${p(c + S * 0.55)} 17 ${p(c + S)} 30 Q${p(c + B + 2)} 42 ${p(c + B)} 52 Q${p(c + B - 1)} 72 ${p(c + W)} 88 Q${p(c + W)} 102 ${p(c + H)} 118 Q${p(c + H + 1)} 129 ${p(c + H - 5)} 135 H${p(c - H + 5)} Q${p(c - H - 1)} 129 ${p(c - H)} 118 Q${p(c - W)} 102 ${p(c - W)} 88 Q${p(c - B + 1)} 72 ${p(c - B)} 52 Q${p(c - B - 2)} 42 ${p(c - S)} 30 Q${p(c - S * 0.55)} 17 ${p(c - 6)} 15 Z`,
    lines: [
      { y: 52, r: B + 4 },
      { y: 88, r: W + 4 },
      { y: 118, r: H + 4 },
    ].map(({ y, r }) => `M${p(c - r)} ${y} H${p(c + r)} M${p(c - r)} ${y - 3} V${y + 3} M${p(c + r)} ${y - 3} V${y + 3}`),
  };
}
export function BodiesCard() {
  const [at, setAt] = useState(0);
  const b = BODIES[at];
  const form = formOf(b.m);
  // the path in CSS too, so the form reshapes smoothly where the browser can
  const d = (s: string) => ({ d: `path("${s}")` }) as CSSProperties;
  return (
    <div className="fvc-bodies">
      <svg viewBox="0 0 100 160" className="fvc-form" aria-hidden="true">
        <path d={form.d} style={d(form.d)} className="fvc-form__body" />
        <path d="M50 135 V152 M36 154 H64" className="fvc-form__stand" />
        {form.lines.map((l, i) => (
          <path key={i} d={l} style={d(l)} className="fvc-form__m" />
        ))}
      </svg>
      <div className="fvc-bodies__side">
        <p className="fvc-person">
          {b.name}
          <span>{b.when}</span>
        </p>
        <dl className="fvc-measures">
          {["Bust", "Waist", "Hip"].map((k, i) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>
                {b.m[i]}
                <small> cm</small>
              </dd>
            </div>
          ))}
        </dl>
        <div className="fvc-people" role="group" aria-label="Saved bodies">
          {BODIES.map((p, i) => (
            <button key={p.id} type="button" aria-pressed={i === at} onClick={() => setAt(i)} title={p.name}>
              {p.name[0]}
            </button>
          ))}
          <span className="fvc-people__add" aria-hidden="true">
            <Icon d={I.plus} size={13} />
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---- Arrange and print ----------------------------------------------------------
   The pieces on the sheet, as printed tissue: drag them about, turn the one
   you've picked 15° either way, or let Venty pack them. On A4 the sheet is
   the grid of home pages it tiles across, and the count says how many
   pages the pieces touch (pack them and it drops); on A0 it is one sheet. */
type Piece = { id: string; label: string; d: string; w: number; h: number; x: number; y: number; r: number };
const SHEET = { w: 112, h: 82, cols: 4, rows: 3 };
const TILE = { w: SHEET.w / SHEET.cols, h: SHEET.h / SHEET.rows };
const START: Piece[] = [
  { id: "front", label: "FRONT", d: "M6 0 L15 0 L17 6 Q21 8 24 11 L22.5 30 L1.5 30 L0 11 Q3 8 6 6 Z", w: 24, h: 30, x: 4, y: 5, r: -15 },
  { id: "back", label: "BACK", d: "M3 0 Q11 2.6 19 0 L22 30 L0 30 Z", w: 22, h: 30, x: 62, y: 9, r: 10 },
  { id: "skirt", label: "SKIRT", d: "M6 0 L18 0 L24 40 L0 40 Z", w: 24, h: 40, x: 34, y: 37, r: 0 },
  { id: "sleeve", label: "SLEEVE", d: "M0 18 Q3.5 5 15 0 Q26.5 5 30 18 Z", w: 30, h: 18, x: 77, y: 56, r: -30 },
  { id: "facing", label: "FACING", d: "M0 3 Q9 -1 18 3 L18 7 Q9 3 0 7 Z", w: 18, h: 7, x: 88, y: 4, r: 0 },
];
// packed: on the six home pages top left (three across, two down), none touching
const PACKED: Record<string, Pick<Piece, "x" | "y" | "r">> = {
  front: { x: 1, y: 1, r: 0 },
  back: { x: 27, y: 1, r: 0 },
  skirt: { x: 51, y: 1, r: 0 },
  sleeve: { x: 1, y: 33, r: 0 },
  facing: { x: 33, y: 40, r: 0 },
};
/** a piece's box on the sheet at any angle (it turns about its middle) */
const box = (p: Piece) => {
  const a = (p.r * Math.PI) / 180;
  const c = Math.abs(Math.cos(a));
  const sn = Math.abs(Math.sin(a));
  const w = p.w * c + p.h * sn;
  const h = p.w * sn + p.h * c;
  return { x: p.x + p.w / 2 - w / 2, y: p.y + p.h / 2 - h / 2, w, h };
};
const clampTo = (p: Piece): Piece => {
  const b = box(p);
  const dx = Math.max(0, -b.x) - Math.max(0, b.x + b.w - SHEET.w);
  const dy = Math.max(0, -b.y) - Math.max(0, b.y + b.h - SHEET.h);
  return { ...p, x: p.x + dx, y: p.y + dy };
};
const pagesOf = (ps: Piece[]) => {
  let n = 0;
  for (let r = 0; r < SHEET.rows; r++)
    for (let c = 0; c < SHEET.cols; c++) {
      const tx = c * TILE.w;
      const ty = r * TILE.h;
      if (ps.some((p) => ((b) => b.x < tx + TILE.w && b.x + b.w > tx && b.y < ty + TILE.h && b.y + b.h > ty)(box(p)))) n++;
    }
  return n;
};
const norm = (r: number) => ((((r + 180) % 360) + 360) % 360) - 180;
export function PrintCard() {
  const [a0, setA0] = useState(false);
  const [pieces, setPieces] = useState<Piece[]>(START);
  const [sel, setSel] = useState("skirt");
  const [dragging, setDragging] = useState(false);
  const svg = useRef<SVGSVGElement>(null);
  const grab = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const at = (e: RPointerEvent) => {
    const m = svg.current!.getScreenCTM()!.inverse();
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m);
    return { x: pt.x, y: pt.y };
  };
  const turn = (by: number) => setPieces((l) => l.map((p) => (p.id === sel ? clampTo({ ...p, r: norm(p.r + by) }) : p)));
  const picked = pieces.find((p) => p.id === sel)!;
  const pages = pagesOf(pieces);
  const stop = () => {
    grab.current = null;
    setDragging(false);
  };
  return (
    <div className="fvc-arrange">
      <div className="fvc-arrange__canvas">
        <svg
          ref={svg}
          viewBox={`-2 -2 ${SHEET.w + 4} ${SHEET.h + 4}`}
          className={dragging ? "is-dragging" : ""}
          onPointerMove={(e) => {
            const g = grab.current;
            if (!g) return;
            const { x, y } = at(e);
            setPieces((l) => l.map((p) => (p.id === g.id ? clampTo({ ...p, x: x - g.dx, y: y - g.dy }) : p)));
          }}
          onPointerUp={stop}
          onPointerCancel={stop}
        >
          <rect x="0" y="0" width={SHEET.w} height={SHEET.h} rx="1.2" className="fvc-sheet" />
          {!a0 &&
            Array.from({ length: SHEET.rows * SHEET.cols }, (_, i) => {
              const x = (i % SHEET.cols) * TILE.w;
              const y = Math.floor(i / SHEET.cols) * TILE.h;
              return (
                <g key={i}>
                  <rect x={x} y={y} width={TILE.w} height={TILE.h} className="fvc-page" />
                  <text x={x + 1.4} y={y + 3.6} className="fvc-page__no">
                    {i + 1}
                  </text>
                </g>
              );
            })}
          {pieces.map((p) => (
            <g
              key={p.id}
              className={`fvc-pc ${sel === p.id ? "is-sel" : ""}`}
              style={{ transform: `translate(${p.x}px, ${p.y}px) rotate(${p.r}deg)`, transformOrigin: `${p.w / 2}px ${p.h / 2}px` }}
              onPointerDown={(e) => {
                e.stopPropagation();
                const { x, y } = at(e);
                grab.current = { id: p.id, dx: x - p.x, dy: y - p.y };
                setSel(p.id);
                setDragging(true);
                try {
                  svg.current!.setPointerCapture(e.pointerId);
                } catch {}
              }}
            >
              <path d={p.d} className="fvc-pc__paper" />
              <path d={p.d} className="fvc-pc__seam" transform={`translate(${p.w / 2} ${p.h / 2}) scale(0.86) translate(${-p.w / 2} ${-p.h / 2})`} />
              <path d={`M${p.w / 2} ${p.h * 0.25} V${p.h * 0.75} M${p.w / 2 - 1.2} ${p.h * 0.25 + 1.6} L${p.w / 2} ${p.h * 0.25} L${p.w / 2 + 1.2} ${p.h * 0.25 + 1.6}`} className="fvc-pc__grain" />
              <text x={p.w / 2 + 1.6} y={p.h / 2} className="fvc-pc__t">
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="fvc-arrange__panel">
        <div className="fvc-seg" role="group" aria-label="Paper">
          <button type="button" aria-pressed={!a0} onClick={() => setA0(false)}>
            <b>A4</b> At home
          </button>
          <button type="button" aria-pressed={a0} onClick={() => setA0(true)}>
            <b>A0</b> Print shop
          </button>
        </div>
        <div className="fvc-count">
          <b>{a0 ? "1" : pages}</b>
          <span>{a0 ? "sheet" : `of ${SHEET.rows * SHEET.cols} pages`}</span>
        </div>
        <div className="fvc-picked">
          <span className="fvc-picked__name">
            {picked.label.toLowerCase()}
            <small>{Math.round(picked.r)}°</small>
          </span>
          <button type="button" className="fvc-iconbtn" onClick={() => turn(-15)} aria-label="Turn the piece 15 degrees left" title="Turn left">
            <Icon d={TURN_L} size={15} />
          </button>
          <button type="button" className="fvc-iconbtn" onClick={() => turn(15)} aria-label="Turn the piece 15 degrees right" title="Turn right">
            <Icon d={TURN_R} size={15} />
          </button>
        </div>
        <button type="button" className="fvc-ghost is-primary" onClick={() => setPieces((l) => l.map((p) => clampTo({ ...p, ...PACKED[p.id] })))}>
          <Icon d={SPARK} size={14} /> Pack the pieces
        </button>
      </div>
    </div>
  );
}


/* ---- Pattern library, on the phone ------------------------------------------- */
type Row = { id: number; name: string; who: string; status: "Printed" | "Fitting" | "Draft"; g: string; drafting?: boolean };

// the garments, flat (24 x 24 sketches)
const G: Record<string, string> = {
  dress: "M9 3h6l1 5-2 1 3 12H7l3-12-2-1z",
  skirt: "M7 4h10l3 16H4z",
  shirt: "M8 3l4 2 4-2 4 3-2 4-2-1v11H8V9L6 10 4 6z",
  trousers: "M7 3h10l1 18h-4l-2-11-2 11H6z",
  top: "M8 4l4 1 4-1 3 4-3 2v10H8V10L5 8z",
  jacket: "M8 3l4 3 4-3 4 4-2 3v11H6V10L4 7z",
};
const SEED: Row[] = [
  { id: 1, name: "Flutter midi dress", who: "Natalia", status: "Printed", g: "dress" },
  { id: 2, name: "Bias slip skirt", who: "Natalia", status: "Fitting", g: "skirt" },
  { id: 3, name: "Camp collar shirt", who: "Mei", status: "Draft", g: "shirt" },
  { id: 4, name: "Wide-leg trousers", who: "Amara", status: "Printed", g: "trousers" },
  { id: 5, name: "Wrap top", who: "Mei", status: "Fitting", g: "top" },
];
// what drafts in, in turn
const NEXT = [
  { name: "Cropped puffer", who: "Natalia", g: "jacket" },
  { name: "Halter gown", who: "Amara", g: "dress" },
  { name: "Pleated midi skirt", who: "Mei", g: "skirt" },
];

function PhoneBird({ size = 16 }: { size?: number }) {
  const b = MARK_BOUNDS;
  return (
    <svg width={size} height={size} viewBox={`${b.x} ${b.y - (b.width - b.height) / 2} ${b.width} ${b.width}`} fill="currentColor" aria-hidden="true">
      <path d={MARK} />
    </svg>
  );
}

/** the device: a titanium frame (its antenna bands, the buttons on its
    sides), the black border round the glass, the island, a sheen across
    the glass; the screen is its child */
function Device({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`ftp ${className}`} aria-hidden={className.includes("is-back") || undefined}>
      <span className="ftp__btn is-l1" />
      <span className="ftp__btn is-l2" />
      <span className="ftp__btn is-l3" />
      <span className="ftp__btn is-r1" />
      <span className="ftp__band is-tl" />
      <span className="ftp__band is-tr" />
      <span className="ftp__band is-bl" />
      <span className="ftp__band is-br" />
      <div className="ftp__glass">
        <div className="ftp__screen">
          <span className="ftp__island" />
          {children}
        </div>
        <span className="ftp__sheen" />
      </div>
    </div>
  );
}

/** a phone behind: the same screen in blocks */
function Ghost({ side }: { side: "l" | "r" }) {
  return (
    <Device className={`is-back is-${side}`}>
      <div className="ftp__ghost">
        <div className="ftp__ghost-head">
          <span className="is-dot" />
          <span className="is-bar" />
          <span className="is-dot" />
        </div>
        <span className="ftp__ghost-search" />
        <ul>
          {[52, 69, 56, 73, 60].map((w, i) => (
            <li key={i}>
              <span className="is-thumb" />
              <span className="is-lines">
                <span style={{ width: `${w}%` }} />
                <span style={{ width: `${w + 14}%` }} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Device>
  );
}

export function PhoneCard() {
  const root = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<Row[]>(SEED);
  const [step, setStep] = useState(0);
  const next = useRef(0);
  const uid = useRef(100);

  // while on screen: a new pattern drafts in every few seconds
  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let iv = 0;
    const timers: number[] = [];
    const tick = () => {
      const n = NEXT[next.current++ % NEXT.length];
      const id = uid.current++;
      // the ones before move along: the last new one goes to fitting, the one fitting gets printed
      const along = (r: Row, i: number): Row => (i === 0 ? { ...r, status: "Fitting" } : i === 1 && r.status === "Fitting" ? { ...r, status: "Printed" } : r);
      setRows((l) => [{ id, ...n, status: "Draft" as const, drafting: true }, ...l.map(along)].slice(0, 6));
      setStep((s) => s + 1);
      timers.push(window.setTimeout(() => setRows((l) => l.map((r) => (r.id === id ? { ...r, drafting: false } : r))), 2200));
    };
    const io = new IntersectionObserver(([e]) => {
      window.clearInterval(iv);
      if (e.isIntersecting) iv = window.setInterval(tick, 4200);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(iv);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div ref={root} className="ftp-stage">
      <span className="ftp-dots" aria-hidden="true" />
      <span className="ftp-glow" aria-hidden="true" />
      <Ghost side="l" />
      <Ghost side="r" />
      <Device className="is-front">
        <div className="ftp__status">
          <span>9:41</span>
          <span className="ftp__status-icons" aria-hidden="true">
            <svg width="15" height="11" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M2 6.8a15 15 0 0 1 20 0M5 10.9a10 10 0 0 1 14 0M8.5 14.4a5 5 0 0 1 7 0M12 17.5h.01" />
            </svg>
            <span className="ftp__battery">
              <span />
            </span>
          </span>
        </div>
        <div className="ftp__head">
          <span className="ftp__logo">
            <PhoneBird size={15} />
          </span>
          <span className="ftp__title">Patterns</span>
          <span className="ftp__plus" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
        </div>
        <div className="ftp__search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          Search patterns
        </div>
        <div className="ftp__sub">
          <span>Recent</span>
          <span className="is-muted">Sort by · Latest</span>
        </div>
        <ul key={step} className={`ftp__list ${step ? "is-shifting" : ""}`}>
          {rows.map((r, i) => (
            <li key={r.id} className={`ftp__row ${r.drafting ? "is-drafting" : ""} ${i === 0 && step ? "is-new" : ""}`}>
              <span className="ftp__thumb">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true">
                  <path d={G[r.g]} />
                </svg>
              </span>
              <span className="ftp__text">
                <span className="ftp__name">{r.name}</span>
                <span className="ftp__who">{r.drafting ? "Drafting for " + r.who + "…" : r.who}</span>
                {r.drafting && <span className="ftp__bar" />}
              </span>
              <span className="ftp__state">
                <span className={`ftp__dot is-${r.status.toLowerCase()}`} />
                {r.drafting ? "" : r.status}
              </span>
            </li>
          ))}
        </ul>
        <span className="ftp__home" aria-hidden="true" />
      </Device>
    </div>
  );
}
