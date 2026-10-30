"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent, type ReactNode } from "react";
import { MARK, MARK_BOUNDS } from "@/lib/markFlight";
import { TURN, turn, turnPosition } from "@/lib/turnSequence";
import { FRAME, OUTLINES, type Outline as OutlineData } from "./outlines";

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

/* ---- her turn: drawn on a canvas by the site's image-sequence engine
   (src/lib/sequence.ts, as the hero and How it works), not by swapping an
   <img>'s src: swapping showed nothing for a moment whenever a frame wasn't
   decoded yet (a dark flicker as you dragged). The engine decodes the
   frames ahead of where you're going and always shows the nearest one it
   has. ---- */
const FIRST_FRAME = `/features/turn/frames/0001.webp?v=${TURN.version}`;
const PIN_EVERY = 6; // frames kept decoded right round, so a fast drag always has her close by
/** a canvas of the turn; set(deg) shows her at that angle. It starts (and
    the frames load) when `near` (the card) comes within a screen of view */
function useTurn(near: React.RefObject<HTMLElement | null>) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const player = useRef<ReturnType<typeof turn.createPlayer> | null>(null);
  const at = useRef(0);
  // the film is drawing: the first frame under it can go (seen through the
  // mask's soft edge, it was a ghost of her first pose behind her)
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const el = near.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || player.current) return;
        // one frame at a time, never two laid over each other (blending left a
        // ghost of her last pose); her frames are close enough not to need it
        const p = turn.createPlayer(cv, undefined, { alpha: true, fit: "cover", blend: false, skim: true });
        const pins: number[] = [];
        for (let i = 0; i < TURN.frames; i += PIN_EVERY) pins.push(i);
        p.pin(pins);
        p.setPosition(turnPosition(at.current));
        player.current = p;
        turn.preload().then(() => window.setTimeout(() => setReady(true), 300));
        io.disconnect();
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      player.current?.destroy();
      player.current = null;
    };
  }, [near]);
  const set = (deg: number) => {
    at.current = deg;
    player.current?.setPosition(turnPosition(deg));
  };
  return [canvas, set, ready] as const;
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
   <clip>-out.mp4 is the same reversed at twice the speed (every other
   frame), so moving on to another note is quick, and <clip>-end.webp
   its last frame, sharp, shown once it lands, with the detail's outline
   (Jose's, drawn on that last frame: see OUTLINES) traced round it. A
   detail without one yet
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
    clip: "buttons",
    // the stand-in, only if the clip can't play
    sel: <rect pathLength={1} x="752" y="660" width="156" height="330" rx="62" />,
  },
  {
    n: 3,
    tab: "Pockets",
    note: "Both flap pockets as they are, the flaps sitting just above the hip.",
    // on the flap pocket the clip pushes in to
    pin: [0.425, 0.468],
    at: [0.555, 0.485],
    z: 2.3,
    clip: "pockets",
    sel: (
      <>
        <rect pathLength={1} x="588" y="886" width="186" height="144" rx="24" />
        <rect pathLength={1} x="898" y="886" width="186" height="144" rx="24" />
      </>
    ),
  },
  {
    n: 4,
    tab: "Texture",
    note: "This exact tweed: the soft cream bouclé with its loose, looped weave. Same fabric for the jacket and the skirt.",
    // on the skirt front, where the clip's push-in is centred
    pin: [0.46, 0.585],
    at: [0.45, 0.59],
    z: 3,
    clip: "texture",
    // the stand-in, only if the clip can't play
    sel: <ellipse pathLength={1} cx="672" cy="1180" rx="130" ry="95" />,
  },
];
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
  // how far in it is, as a share of the way in (0 out, 1 in)
  private at() {
    if (this.on && this.on === this.in) return this.on.currentTime / this.on.duration;
    if (this.on && this.on === this.out) return 1 - this.on.currentTime / this.on.duration;
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
    if (!(await this.ready(v))) return (this.failed = true), "error";
    if (token !== this.token) return "lost";
    const t = (dir === 1 ? from : 1 - from) * v.duration;
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

/** a clip's outline on its last frame (outlines.ts): the lines revealed
    along their shapes (a mask, each line's own path drawn on), the frame
    dimmed round the fills, then the wash. Open lines fade out at both ends. */
function Outline({ id, o, on }: { id: string; o: OutlineData; on: boolean }) {
  const [x, y, s] = o.at;
  const place = `translate(${x} ${y}) scale(${s})`;
  return (
    <svg className={`fvc-outline ${on ? "is-on" : ""}`} viewBox={`0 0 ${FRAME[0]} ${FRAME[1]}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        {/* the shade: everywhere but the shapes */}
        <mask id={`${id}-shade`} maskUnits="userSpaceOnUse" x={0} y={0} width={FRAME[0]} height={FRAME[1]}>
          <rect width={FRAME[0]} height={FRAME[1]} fill="#fff" />
          <g transform={place} fill="#000">
            {o.fills.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        </mask>
        <mask id={`${id}-trim`} maskUnits="userSpaceOnUse" x={-200} y={-200} width={3000} height={3000}>
          {o.lines.map((l, i) => (
            <path key={i} className="fvc-outline__trim" d={l.d} pathLength={1} />
          ))}
        </mask>
        {/* an open line's colour, faded out at its two ends */}
        {o.lines.map(
          (l, i) =>
            l.from &&
            l.to && (
              <linearGradient key={i} id={`${id}-g${i}`} gradientUnits="userSpaceOnUse" x1={l.from[0]} y1={l.from[1]} x2={l.to[0]} y2={l.to[1]}>
                <stop offset="0" stopColor="#687ef5" stopOpacity="0" />
                <stop offset="0.18" stopColor="#687ef5" />
                <stop offset="0.82" stopColor="#687ef5" />
                <stop offset="1" stopColor="#687ef5" stopOpacity="0" />
              </linearGradient>
            ),
        )}
      </defs>
      <rect className="fvc-outline__shade" width={FRAME[0]} height={FRAME[1]} mask={`url(#${id}-shade)`} />
      <g transform={place}>
        {o.fills.map((d, i) => (
          <path key={i} className="fvc-outline__fill" d={d} />
        ))}
        <g mask={`url(#${id}-trim)`}>
          {o.lines.map((l, i) => (
            <path key={i} className="fvc-outline__line" d={l.d} style={l.from ? { stroke: `url(#${id}-g${i})` } : undefined} />
          ))}
        </g>
      </g>
    </svg>
  );
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
  // type a detail's comment out, a character at a time
  const type = (n: number, after: number) => {
    window.clearTimeout(typeT.current);
    const len = byN(n).note.length;
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
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
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
          </svg>
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
                {OUTLINES[x.clip] && <Outline id={`${uid}-o${x.n}`} o={OUTLINES[x.clip]} on={landed === x.n} />}
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
      <div className="fvc-tabs fvk" role="group" aria-label="Notes" style={{ "--i": DETAILS.findIndex((x) => x.n === on), "--n": DETAILS.length } as CSSProperties}>
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
   A chat that plays while it's on screen, round and round: your change
   types into the composer and goes (the bubble springs up out of it, as a
   message sent in iMessage); Venty's dots, then its answer pops in with
   what it changed, one tag after another, and the version ticks on. A
   moment to read it, then it all floats away and the next one starts.
   Before it plays (and between loops) the first one shows, whole. */
const CHATS = [
  { file: "Slip dress", v: 2, me: "5 cm longer, wider straps.", reply: "Done. Four pieces redrafted.", diff: ["Hem +5 cm", "Straps 3 cm"] },
  { file: "Wrap dress", v: 1, me: "Can the sleeves be a little fuller?", reply: "Done. Both sleeves redrafted.", diff: ["Sleeve cap +2 cm", "Gathered"] },
  { file: "Wide-leg trouser", v: 3, me: "Raise the waist, and add pockets.", reply: "Done. Five pieces redrafted.", diff: ["Rise +3 cm", "Side pockets"] },
];
// where a chat is: 0 typing in the composer, 1 sent, 2 Venty's dots, 3 its answer, 4 floating away
type ChatAt = { c: number; stage: 0 | 1 | 2 | 3 | 4; typed: number };
const CHAR_MS = 42;
const HOLD: Record<number, number> = { 1: 900, 2: 1400, 3: 3400, 4: 1000 };
export function RefineCard() {
  const root = useRef<HTMLDivElement>(null);
  const [s, setS] = useState<ChatAt>({ c: 0, stage: 3, typed: CHATS[0].me.length });
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let t = 0;
    let on = false;
    // where the loop is (its own copy, so it can pick up where it left off)
    let cur: ChatAt = { c: 0, stage: 3, typed: CHATS[0].me.length };
    // one step of the loop, then the next after its hold
    const step = (now: ChatAt) => {
      if (!on) return;
      let next: ChatAt;
      let wait: number;
      if (now.stage === 0 && now.typed < CHATS[now.c].me.length) {
        next = { ...now, typed: now.typed + 1 };
        wait = CHAR_MS;
      } else if (now.stage === 4) {
        next = { c: (now.c + 1) % CHATS.length, stage: 0, typed: 0 };
        wait = 500;
      } else {
        next = { ...now, stage: (now.stage + 1) as ChatAt["stage"] };
        wait = HOLD[next.stage] ?? 400;
      }
      cur = next;
      setS(next);
      t = window.setTimeout(() => step(next), wait);
    };
    const io = new IntersectionObserver(([e]) => {
      window.clearTimeout(t);
      on = e.isIntersecting;
      if (!on) return;
      // pick up from a whole chat: let it be read a moment, then float away
      cur = { ...cur, stage: 3, typed: CHATS[cur.c].me.length };
      setS(cur);
      const from = cur;
      t = window.setTimeout(() => step(from), 2200);
    });
    io.observe(el);
    return () => {
      on = false;
      io.disconnect();
      window.clearTimeout(t);
    };
  }, []);
  const chat = CHATS[s.c];
  const typing = s.stage === 0;
  const done = s.stage >= 3;
  return (
    <div ref={root} className={`fvc-chat ${s.stage === 4 ? "is-out" : ""}`}>
      <header className="fvc-chat__head">
        <span key={chat.file} className="fvc-chat__file">
          {chat.file}
        </span>
        <span key={`${s.c}${done}`} className="fvc-tag is-ticking">
          {done ? `v${chat.v} → v${chat.v + 1}` : `v${chat.v}`}
        </span>
      </header>
      <div className="fvc-chat__log">
        {s.stage >= 1 && (
          <p key={`me${s.c}`} className="fvc-bubble is-me">
            {chat.me}
          </p>
        )}
        {s.stage >= 2 && (
          <div key={`re${s.c}`} className="fvc-reply">
            <span className="fvc-avatar">
              <Bird size={12} />
            </span>
            <div className="fvc-reply__body">
              {done ? (
                <>
                  <p className="fvc-bubble is-reply">{chat.reply}</p>
                  <p className="fvc-diff">
                    {chat.diff.map((d) => (
                      <span key={d}>{d}</span>
                    ))}
                  </p>
                </>
              ) : (
                <p className="fvc-bubble fvc-dots" aria-label="Venty is typing">
                  <i />
                  <i />
                  <i />
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      <div className={`fvc-compose ${typing && s.typed ? "is-typing" : ""}`}>
        <span className="fvc-compose__text">
          {typing && s.typed ? (
            <>
              {chat.me.slice(0, s.typed)}
              <i className="fvc-compose__caret" />
            </>
          ) : (
            "Ask for a change…"
          )}
        </span>
        <span key={s.stage === 1 ? `sent${s.c}` : "idle"} className={`fvc-compose__send ${s.stage === 1 ? "is-sent" : ""}`} aria-hidden="true">
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
  const [film, set, ready] = useTurn(box);
  const [deg, setDeg] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; d: number } | null>(null);
  // the exact angle to the film (so it glides between frames), whole degrees to the readout
  const to = (d: number) => {
    const v = ((d % 360) + 360) % 360;
    setDeg(Math.round(v) % 360);
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
        {/* her first frame until the film has its own, then the film over it */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={`fvc-turn__film ${ready ? "is-gone" : ""}`} src={FIRST_FRAME} alt="" draggable={false} loading="lazy" decoding="async" />
        <canvas ref={film} className="fvc-turn__film" role="img" aria-label="The model in the garment; drag or use the slider to turn her" />
        <span className="fvc-turn__hint" aria-hidden="true">
          Drag to turn
        </span>
      </div>
      <div className="fvc-turn__panel">
        <p className="fvc-label">View</p>
        <div className="fvc-turn__views fvk" role="group" aria-label="Views" style={{ "--i": VIEWS.findIndex(([, v]) => near(v)), "--n": VIEWS.length } as CSSProperties}>
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
   You choose a body, not a measure: the names beside a small deck of the
   app's own body cards (venty-app main, src/screens/bodies.tsx BodyCard: the
   dark tray's rim, Jose's mannequin picture pressed into a 4:5 stage, the
   height on it, then the name and bust, waist, hips). Choose a name and
   that body's card springs to the front, the others fanning out behind it.
   The bodies are the app's own starting ones (Mum and Tom) and Natalia.
   It goes round by itself while on screen, until you choose. */
const BODY_SET = [
  { id: "natalia", name: "Natalia", pic: "/lab/features/app/female-1.webp", h: 168, m: [92, 74, 98], when: "Measured 12 Oct" },
  { id: "mum", name: "Mum", pic: "/lab/features/app/female-2.webp", h: 162, m: [96, 82, 104], when: "Measured 3 Oct" },
  { id: "tom", name: "Tom", pic: "/lab/features/app/male-1.webp", h: 181, m: [98, 84, 100], when: "Measured 28 Sep" },
];
const BODY_EVERY = 3600;
// the deck with body i brought to the front, the rest in the order they were
const toFront = (i: number) => (o: number[]) => [i, ...o.filter((x) => x !== i)];
export function BodiesCard() {
  const root = useRef<HTMLDivElement>(null);
  const [auto, setAuto] = useState(true);
  // the deck, front first: the chosen body is the one in front; the one that
  // was there steps back behind it (to the right), the other behind that
  const [order, setOrder] = useState([0, 1, 2]);
  const at = order[0];
  const pick = (i: number) => {
    setAuto(false);
    setOrder(toFront(i));
  };
  useEffect(() => {
    const el = root.current;
    if (!el || !auto) return;
    let t = 0;
    const io = new IntersectionObserver(([e]) => {
      window.clearInterval(t);
      if (e.isIntersecting) t = window.setInterval(() => setOrder((o) => toFront((o[0] + 1) % BODY_SET.length)(o)), BODY_EVERY);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(t);
    };
  }, [auto]);
  return (
    <div ref={root} className="fvbd">
      <div className="fvbd-deck" aria-hidden="true">
        {BODY_SET.map((b, i) => (
          <span key={b.id} className="fvbd-card" data-pos={order.indexOf(i)}>
            <span className="fvbd-card__stage">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.pic} alt="" draggable={false} loading="lazy" decoding="async" />
              <span className="fvbd-card__h">
                <b>{b.h}</b> cm
              </span>
            </span>
            <span className="fvbd-card__name">{b.name}</span>
            <span className="fvbd-card__m">
              {["Bust", "Waist", "Hips"].map((k, j) => (
                <span key={k}>
                  <small>{k}</small>
                  <b>{b.m[j]}</b>
                </span>
              ))}
            </span>
          </span>
        ))}
      </div>
      <div className="fvbd-names" role="group" aria-label="Your bodies">
        {BODY_SET.map((b, i) => (
          <button key={b.id} type="button" className={i === at ? "is-on" : ""} aria-pressed={i === at} onClick={() => pick(i)}>
            <span className="fvbd-names__pic">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.pic} alt="" draggable={false} loading="lazy" decoding="async" />
            </span>
            <span className="fvbd-names__words">
              <b>{b.name}</b>
              <small>
                {b.h} cm · {b.when}
              </small>
            </span>
          </button>
        ))}
        <span className="fvbd-names__new" aria-hidden="true">
          <span className="fvbd-names__plus">
            <Icon d={I.plus} size={14} />
          </span>
          New body
        </span>
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
        <div className="fvc-seg fvk" role="group" aria-label="Paper" style={{ "--i": a0 ? 1 : 0, "--n": 2 } as CSSProperties}>
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


/* ---- Pattern library, on the phone -------------------------------------------
   Three phones, each showing the app's own Pattern library as it is now
   (venty-app main, src/screens/library.tsx), drawn at the app's size: a
   402px-wide screen, every measure in its px (the --u unit, a 402th of the
   screen), so it scales into each phone exactly.
   - left: Your patterns with none yet: the snow card, three looks rising
     over it, "If you can imagine it, you can wear it."
   - front: Your patterns with some, as a grid by month (the app's other
     view); click the phone and it switches to the tall trays in a carousel
     and back, the knob in its view switch sliding over. Every few seconds a
     new one drafts: the island says so, then it arrives at the front.
   - right: Patterns to make: the kinds as pressed photo tiles, the chosen
     one moving along, the row under them that kind's patterns.
   Photos: the app's stand-ins, as it uses them (LOOK, KIND_PIC). */
type Made = { id: number; key: string; name: string; status: "Printed" | "Fitting" | "Draft" };
type Up = { key: string; name: string; who: string };

// the garments, flat (24 x 24 sketches)
const G: Record<string, string> = {
  dress: "M9 3h6l1 5-2 1 3 12H7l3-12-2-1z",
  skirt: "M7 4h10l3 16H4z",
  shirt: "M8 3l4 2 4-2 4 3-2 4-2-1v11H8V9L6 10 4 6z",
  trousers: "M7 3h10l1 18h-4l-2-11-2 11H6z",
  top: "M8 4l4 1 4-1 3 4-3 2v10H8V10L5 8z",
};
const APP = "/lab/features/app";
const PIC = {
  green: `${APP}/look-street-green.webp`,
  mauve: `${APP}/look-limo-mauve.webp`,
  rust: `${APP}/look-cliff-rust.webp`,
  burgundy: `${APP}/look-street-burgundy.webp`,
  zip: `${APP}/detail-zip.webp`,
  corset: `${APP}/detail-corset.webp`,
  hems: `${APP}/detail-hems.webp`,
  bows: `${APP}/detail-bows.webp`,
  meadow: `${APP}/meadow-640.webp`,
};
// the app's patterns to make (src/lib/data.ts TEMPLATES), with their photo, sketch and level
const TPL: Record<string, { name: string; kind: string; pic: string; flat: string; level: 1 | 2 | 3 }> = {
  slip: { name: "Slip dress", kind: "Dresses", pic: PIC.mauve, flat: G.dress, level: 1 },
  wrap: { name: "Wrap dress", kind: "Dresses", pic: PIC.green, flat: G.dress, level: 2 },
  aline: { name: "A-line midi", kind: "Dresses", pic: PIC.rust, flat: G.dress, level: 1 },
  cami: { name: "Cami", kind: "Tops", pic: PIC.corset, flat: G.top, level: 1 },
  tee: { name: "Boxy tee", kind: "Tops", pic: PIC.burgundy, flat: G.top, level: 1 },
  shirt: { name: "Shirt", kind: "Tops", pic: PIC.bows, flat: G.shirt, level: 3 },
  wideleg: { name: "Wide-leg trouser", kind: "Trousers", pic: PIC.hems, flat: G.trousers, level: 2 },
  straight: { name: "Straight pant", kind: "Trousers", pic: PIC.zip, flat: G.trousers, level: 2 },
  biasskirt: { name: "Bias midi skirt", kind: "Skirts", pic: PIC.rust, flat: G.skirt, level: 1 },
  mini: { name: "A-line mini", kind: "Skirts", pic: PIC.burgundy, flat: G.skirt, level: 1 },
};
const LEVEL = ["", "Easy", "Intermediate", "Hard"];
const KINDS = ["All", "Dresses", "Tops", "Trousers", "Skirts"];
const KIND_PIC: Record<string, string> = { All: PIC.meadow, Dresses: PIC.green, Tops: PIC.corset, Trousers: PIC.hems, Skirts: PIC.rust };
const ofKind = (k: string) => Object.keys(TPL).filter((t) => k === "All" || TPL[t].kind === k);
const LINE: Record<Made["status"], string> = { Printed: "Printed on 9 A4 sheets", Fitting: "Ready to print", Draft: "Draft, not finished yet" };
// the short line, on the small cards of the grid
const SHORT: Record<Made["status"], string> = { Printed: "Printed", Fitting: "Ready to print", Draft: "Draft" };
const MINE: Made[] = [
  { id: 1, key: "wrap", name: "Wrap dress", status: "Printed" },
  { id: 2, key: "aline", name: "A-line midi", status: "Fitting" },
  { id: 3, key: "slip", name: "Slip dress", status: "Draft" },
];
// what drafts in, in turn (for the app's starting bodies)
const UP: Up[] = [
  { key: "tee", name: "Boxy tee", who: "Mum" },
  { key: "wideleg", name: "Wide-leg trouser", who: "Natalia" },
  { key: "shirt", name: "Shirt", who: "Tom" },
  { key: "biasskirt", name: "Bias midi skirt", who: "Natalia" },
  { key: "cami", name: "Cami", who: "Mum" },
];
const DRAFT_EVERY = 5200;
const DRAFT_MS = 2300; // the island's live activity, then the tray slides in
const KIND_EVERY = 2600;

function PhoneBird({ size = 16 }: { size?: number }) {
  const b = MARK_BOUNDS;
  return (
    <svg width={size} height={size} viewBox={`${b.x} ${b.y - (b.width - b.height) / 2} ${b.width} ${b.width}`} fill="currentColor" aria-hidden="true">
      <path d={MARK} />
    </svg>
  );
}

/** the device (features.css, .ftp): the titanium band with its antenna
    bands and buttons, the black border round the screen, the island with
    the camera in it (open into a live activity when `live` is given), a
    sheen across the glass; the screen is its child */
function Device({ children, className = "", live, onPress, label }: { children: ReactNode; className?: string; live?: ReactNode; onPress?: () => void; label?: string }) {
  return (
    <div
      className={`ftp ${className}`}
      aria-hidden={className.includes("is-back") || undefined}
      role={onPress ? "button" : undefined}
      tabIndex={onPress ? 0 : undefined}
      aria-label={label}
      onClick={onPress}
      onKeyDown={
        onPress &&
        ((e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPress();
          }
        })
      }
    >
      <span className="ftp__btns">
        <span className="ftp__btn is-l1" />
        <span className="ftp__btn is-l2" />
        <span className="ftp__btn is-l3" />
        <span className="ftp__btn is-r1" />
      </span>
      <div className="ftp__glass">
        <div className="ftp__screen is-app">{children}</div>
        <span className="ftp__sheen" />
        <span className={`ftp__island ${live ? "is-live" : ""}`}>{live}</span>
        <span className="ftp__camera" />
      </div>
    </div>
  );
}

/* ---- the app's pieces, at its own size (fva-, features.css) ---- */
const AppIcon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const IC = {
  search: "M11 4a7 7 0 1 0 0 14a7 7 0 0 0 0-14zM20 20l-4-4",
  filter: "M4 7h10M18 7h2M4 17h4M12 17h8M14 4v6M8 14v6",
  select: "M5 4h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM7 10l2 2 4-4M20 8v11a1 1 0 0 1-1 1H8",
  columns: "M4 6h4v12H4zM10 6h4v12h-4zM16 6h4v12h-4z",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  plus: "M12 5v14M5 12h14",
};
function AppStatus() {
  return (
    <div className="fva-status">
      <span>9:41</span>
      <span className="fva-status__icons">
        <svg viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <path d="M2 6.8a15 15 0 0 1 20 0M5 10.9a10 10 0 0 1 14 0M8.5 14.4a5 5 0 0 1 7 0M12 17.5h.01" />
        </svg>
        <span className="fva-battery">
          <span />
        </span>
      </span>
    </div>
  );
}
function AppHead({ side }: { side: ReactNode }) {
  return (
    <div className="fva-head">
      <span className="fva-h1">Pattern library</span>
      <span className="fva-head__side">{side}</span>
    </div>
  );
}
const Tabs = ({ at }: { at: 0 | 1 }) => (
  <div className="fva-tabs" style={{ "--t": at } as CSSProperties}>
    {["Your patterns", "Patterns to make"].map((t, i) => (
      <span key={t} className={i === at ? "is-on" : ""}>
        {t}
      </span>
    ))}
  </div>
);
const Rb = ({ d }: { d: string }) => (
  <span className="fva-rb">
    <AppIcon d={d} />
  </span>
);
const Level = ({ n }: { n: number }) => (
  <span className="fva-line">
    <span className="fva-bars">
      {[1, 2, 3].map((k) => (
        <i key={k} className={k <= n ? "is-on" : ""} style={{ height: `calc(${4 + k * 3} * var(--u))` }} />
      ))}
    </span>
    {LEVEL[n]}
  </span>
);
function Tall({ p }: { p: Made }) {
  const t = TPL[p.key];
  return (
    <span className="fva-tall">
      <span className="fva-tall__pic">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={t.pic} alt="" draggable={false} loading="lazy" decoding="async" />
      </span>
      <span className="fva-tall__band">
        <span className="fva-tile">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true">
            <path d={t.flat} />
          </svg>
        </span>
        <span className="fva-tall__words">
          <span className="fva-name">{p.name}</span>
          <span className="fva-line">
            <i className={`fva-dot is-${p.status.toLowerCase()}`} />
            {LINE[p.status]}
          </span>
        </span>
      </span>
    </span>
  );
}
function Frame({ k }: { k: string }) {
  const t = TPL[k];
  return (
    <span className="fva-frame">
      <span className="fva-frame__pic">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={t.pic} alt="" draggable={false} loading="lazy" decoding="async" />
      </span>
      <span className="fva-frame__name">{t.name}</span>
      <Level n={t.level} />
    </span>
  );
}

/* ---- the three screens ---- */
function EmptyScreen() {
  return (
    <div className="fva">
      <AppStatus />
      <div className="fva-page">
        <AppHead side={null} />
        <Tabs at={0} />
        {/* the snow card, three looks rising over its top and sides */}
        <div className="fva-first">
          <div className="fva-fan">
            {[PIC.rust, PIC.green, PIC.mauve].map((src, i) => (
              <span key={src} className="fva-fan__look" style={{ "--i": i - 1 } as CSSProperties}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" draggable={false} loading="lazy" decoding="async" />
              </span>
            ))}
          </div>
          <div className="fva-first__words">
            <p className="fva-first__title">
              If you can imagine it,
              <br />
              you can wear it.
            </p>
            <p className="fva-first__lead">
              A photo, a sketch or a few words,
              <br />
              drafted to your measurements.
            </p>
            <span className="fva-pill">Create a pattern</span>
          </div>
        </div>
      </div>
    </div>
  );
}
function GridCard({ p }: { p: Made }) {
  const t = TPL[p.key];
  return (
    <span className="fva-frame">
      <span className="fva-frame__pic is-grid">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={t.pic} alt="" draggable={false} loading="lazy" decoding="async" />
      </span>
      <span className="fva-frame__name">{p.name}</span>
      <span className="fva-line">
        <i className={`fva-dot is-${p.status.toLowerCase()}`} />
        {SHORT[p.status]}
      </span>
    </span>
  );
}
function MineScreen({ mine, step, grid }: { mine: Made[]; step: number; grid: boolean }) {
  return (
    <div className="fva">
      <AppStatus />
      <div className="fva-page">
        <AppHead
          side={
            <span className="fva-create">
              <AppIcon d={IC.plus} />
              Create
            </span>
          }
        />
        <Tabs at={0} />
        <div className="fva-tools">
          <span>
            <Rb d={IC.search} />
            <Rb d={IC.filter} />
          </span>
          <span>
            <Rb d={IC.select} />
            <span className="fva-view" style={{ "--g": grid ? 1 : 0 } as CSSProperties}>
              <span className={grid ? "" : "is-on"}>
                <AppIcon d={IC.columns} />
              </span>
              <span className={grid ? "is-on" : ""}>
                <AppIcon d={IC.grid} />
              </span>
            </span>
          </span>
        </div>
      </div>
      {grid ? (
        // the grid by month; a new one pops in first
        <div key={`g${step}`} className={`fva-bymonth ${step ? "is-new" : ""}`}>
          <p className="fva-month">October</p>
          <div className="fva-grid">
            {mine.map((p) => (
              <GridCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      ) : (
        // the tall trays; a new one slides in at the front
        <div key={`c${step}`} className={`fva-track ${step ? "is-shifting" : ""}`}>
          {mine.map((p) => (
            <Tall key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
function MakeScreen({ kind }: { kind: number }) {
  const k = KINDS[kind];
  return (
    <div className="fva">
      <AppStatus />
      <div className="fva-page">
        <AppHead
          side={
            <>
              <Rb d={IC.search} />
              <Rb d={IC.filter} />
            </>
          }
        />
        <Tabs at={1} />
        <div className="fva-kinds" style={{ "--k": kind } as CSSProperties}>
          <span className="fva-kinds__on" />
          {KINDS.map((x, i) => (
            <span key={x} className={`fva-kind ${i === kind ? "is-on" : ""}`}>
              <span className="fva-kind__pic">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={KIND_PIC[x]} alt="" draggable={false} loading="lazy" decoding="async" />
              </span>
              {x}
            </span>
          ))}
        </div>
        <div className="fva-sec">
          <span className="fva-sec__title">{k === "All" ? "All patterns" : k}</span>
          <span className="fva-sec__n">{ofKind(k).length}</span>
          <span className="fva-sec__all">See all</span>
        </div>
      </div>
      <div key={k} className="fva-row">
        {ofKind(k)
          .slice(0, 3)
          .map((t) => (
            <Frame key={t} k={t} />
          ))}
      </div>
    </div>
  );
}

export function PhoneCard() {
  const root = useRef<HTMLDivElement>(null);
  const [mine, setMine] = useState<Made[]>(MINE);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Up | null>(null);
  const [kind, setKind] = useState(0);
  const [grid, setGrid] = useState(true);
  const next = useRef(0);
  const uid = useRef(100);

  // while on screen: a pattern drafts every few seconds (the island, then its
  // tray), and the kinds on the right move along
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let a = 0;
    let b = 0;
    const timers: number[] = [];
    const tick = () => {
      const n = UP[next.current++ % UP.length];
      setDraft(n);
      timers.push(
        window.setTimeout(() => {
          const id = uid.current++;
          // the ones before move along: the newest goes to ready to print, the one ready gets printed
          const along = (r: Made, i: number): Made => (i === 0 && r.status === "Draft" ? { ...r, status: "Fitting" } : i === 1 && r.status === "Fitting" ? { ...r, status: "Printed" } : r);
          setDraft(null);
          setMine((l) => [{ id, key: n.key, name: n.name, status: "Draft" as const }, ...l.map(along)].slice(0, 4));
          setStep((s) => s + 1);
        }, DRAFT_MS),
      );
    };
    const io = new IntersectionObserver(([e]) => {
      window.clearInterval(a);
      window.clearInterval(b);
      if (!e.isIntersecting) return;
      a = window.setInterval(tick, DRAFT_EVERY);
      b = window.setInterval(() => setKind((k) => (k + 1) % KINDS.length), KIND_EVERY);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(a);
      window.clearInterval(b);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div ref={root} className="ftp-stage">
      <span className="ftp-dots" aria-hidden="true" />
      <span className="ftp-glow" aria-hidden="true" />
      <Device className="is-back is-l">
        <EmptyScreen />
      </Device>
      <Device className="is-back is-r">
        <MakeScreen kind={kind} />
      </Device>
      <Device
        className="is-front"
        onPress={() => setGrid((g) => !g)}
        label={grid ? "Show your patterns as a carousel" : "Show your patterns as a grid"}
        live={
          draft && (
            // what's drafting, in the island, for as long as it drafts
            <span key={draft.name} className="ftp__live">
              <span className="ftp__live-tile">
                <PhoneBird size={13} />
              </span>
              <span className="ftp__live-text">
                <b>Drafting</b>
                <span>
                  {draft.name} · for {draft.who}
                </span>
              </span>
              <span className="ftp__live-bar" />
            </span>
          )
        }
      >
        <MineScreen mine={mine} step={step} grid={grid} />
      </Device>
    </div>
  );
}
