"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { Sky } from "./Sky";
import { HERO, preloadHero } from "@/lib/heroSequence";
import { EASE } from "@/lib/motion";
import { ENTER_PATH, EXIT_PATH, MARK, MARK_BOUNDS, MARK_CENTRE, flightRoute } from "@/lib/markFlight";
import { LOCKUP, WORD } from "@/lib/lockup";

/* The loading screen: Edge, the locked dark sky (a cornflower glow roaming the
   lower two thirds), with the cornflower filament, its growing tip the one that
   glows. One line across the middle of the screen:

     left    a word for what it is doing (Loading, Measuring, Drafting,
             Fitting, then Ready), rising from its mask as it changes
     centre  the Venty logo (the vertical lockup), and under it the
             filament, dead centre
     right   the percentage, in the same type as the word

   Progress is real: the hero's opening frames and the fonts.

   On the way in, the word, the number, the filament and the wordmark reveal
   themselves (the wordmark rises, the filament draws out from the middle,
   the word and the number slide in from their sides), and the mark flies in
   (markFlight, ENTER_PATH): in from the right edge, high along the top,
   facing left, then down in a loop round its place, turning head first to
   face right as it curls back up into it. It settles there while the
   filament fills.

   The way out is simple, in the spirit of a page change: the words, the
   number, the filament and the wordmark clear; the night settles to one flat
   colour; then the screen breaks into squares that clear row by row from the
   top (each with a little jitter), uncovering the hero. Meanwhile the mark
   alone flies to the top left (EXIT_PATH): it lifts and curls left over its
   place, turning head first to face the way, swoops down through the middle,
   rises to the top left and hooks round, turning back to face right as it
   comes in, to touch down exactly on the site's own logo, wings still, as
   the logo, which takes over from it.

   The hero's opening waits for this screen to leave (afterLoader). */

const WORDS = ["Loading", "Measuring", "Drafting", "Fitting", "Ready"];
const HOLD_MS = 500; // the beat on Ready before it clears
const CLEAR_S = 0.4; // words, number, filament and wordmark leave
const TILES_S = 0.6; // the squares clear from the top row to the bottom
const JITTER_S = 0.16; // each square's own scatter within its row
const ENTER_S = 2.3; // the mark's flight in, to its place over the wordmark
const EXIT_S = 1.9; // its flight out, to the logo at the top left
const REVEAL_S = 1.1; // the word, number, filament and wordmark reveal themselves
const SETTLE_MS = 1200; // the longest the way in waits for the page to settle before it starts
const TINT_S = 0.4; // the mark turns from cloud to cornflower before it leaves

const still = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Real progress: the hero's opening frames, then the fonts. 0..1 */
function useLoad(on: boolean) {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!on) return;
    let hero = 0;
    let heroTotal = HERO.frames;
    let fonts = 0;
    let off = false;
    const update = () => !off && setP(Math.min(1, (hero + fonts) / (heroTotal + 1)));
    preloadHero((done, total) => {
      hero = done;
      heroTotal = total;
      update();
    }).then(() => {
      hero = heroTotal;
      update();
    });
    document.fonts.ready.then(() => {
      fonts = 1;
      update();
    });
    return () => {
      off = true;
    };
  }, [on]);
  return p;
}

/** The lab's stand-in: an even load over `seconds` (0: off). 0..1 */
function useSim(seconds: number) {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!seconds) return;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / (seconds * 1000));
      setP(k);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [seconds]);
  return p;
}

/** The number chases the real progress at a capped speed, so a fast load still
    reads and a stall never jumps. 0..1 */
function useShown(progress: number, minSeconds: number) {
  const [shown, setShown] = useState(0);
  const target = useRef(progress);
  useEffect(() => {
    target.current = progress;
  }, [progress]);
  useEffect(() => {
    if (still()) {
      const id = setInterval(() => setShown(target.current), 100);
      return () => clearInterval(id);
    }
    let raf = 0;
    let last = performance.now();
    let v = 0;
    const step = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const cap = dt / minSeconds;
      v = Math.min(target.current, v + Math.min(cap, (target.current - v) * 0.12 + cap * 0.15));
      setShown(v);
      if (v < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [minSeconds]);
  return shown;
}

/* The rolling word: every word in one grid cell; the current one is in, the
   last one leaves upward, the rest wait below */
function Roll({ i }: { i: number }) {
  const [prev, setPrev] = useState(-1);
  const [cur, setCur] = useState(i);
  if (i !== cur) {
    setPrev(cur);
    setCur(i);
  }
  return (
    <p className="fl-roll">
      <span className="sr-only">{WORDS[i]}</span>
      {WORDS.map((t, k) => (
        <span key={t} aria-hidden="true" data-state={k === i ? "in" : k === prev ? "out" : "wait"}>
          {t}
        </span>
      ))}
    </p>
  );
}

/* The squares the screen breaks into: whole columns across, rows to cover
   the height. Each clears at its row's moment plus a little scatter of its
   own (seeded, so it is the same every visit). */
type Tiles = { cols: number; rows: number; size: number; delays: number[] };
function makeTiles(w: number, h: number, pace: number): Tiles {
  const cols = w < 768 ? 12 : 20;
  const size = w / cols;
  const rows = Math.ceil(h / size);
  let seed = 7;
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const delays: number[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) delays.push(((rows > 1 ? r / (rows - 1) : 0) * (TILES_S - JITTER_S) + rand() * JITTER_S) * pace);
  return { cols, rows, size, delays };
}

export function FilamentLoader({
  sim = 0,
  contained = false,
  pace = 1,
  sky: skyVariant = "dark",
  target,
  onDone,
}: {
  /** the lab: a simulated load of this many seconds instead of the real one */
  sim?: number;
  /** the lab: fill the parent instead of the screen */
  contained?: boolean;
  /** the lab: slow motion (2: half speed) */
  pace?: number;
  /** the night behind: the zipper loader's ("loader") or the locked dark sky, Edge ("dark") */
  sky?: "loader" | "dark";
  /** where the mark lands (default: the site's logo, top left) */
  target?: () => Element | null;
  onDone?: () => void;
} = {}) {
  const real = useLoad(!sim);
  const fake = useSim(sim);
  const progress = sim ? fake : real;
  const shown = useShown(progress, sim ? 0.01 : 2.2);
  const [gone, setGone] = useState(false);
  const [tiles, setTiles] = useState<Tiles | null>(null);
  const [out, setOut] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const sky = useRef<HTMLDivElement>(null);
  const mark = useRef<SVGSVGElement>(null);

  const pct = Math.round(Math.min(1, shown) * 100);
  // the number re-renders this every frame while it counts; the squares (a
  // few hundred) and the sky stay as they are
  const tileGrid = useMemo(
    () =>
      tiles && (
        <div className={`fl-tiles ${out ? "is-out" : ""}`} style={{ gridTemplateColumns: `repeat(${tiles.cols}, 1fr)`, gridTemplateRows: `repeat(${tiles.rows}, ${tiles.size}px)` }} aria-hidden="true">
          {tiles.delays.map((d, i) => (
            <span key={i} style={{ transitionDelay: `${d.toFixed(3)}s` }} />
          ))}
        </div>
      ),
    [tiles, out],
  );
  const night = useMemo(() => <Sky variant={skyVariant} />, [skyVariant]);
  const loaded = shown >= 1;
  const word = loaded ? WORDS.length - 1 : Math.min(WORDS.length - 2, Math.floor(shown * (WORDS.length - 1)));
  const landing = () => (target ? target() : document.querySelector("[data-logo] svg"));

  // the squares, sized to this screen (or the lab's box)
  useLayoutEffect(() => {
    const r = root.current?.getBoundingClientRect();
    if (r) setTiles(makeTiles(r.width, r.height, pace));
  }, [pace]);

  /** Where the mark sits at rest, worked out from the logo's box (which
      the mark's svg fills exactly, untransformed) rather than from the mark,
      which may be anywhere in flight; and the frame it flies in. Cheap: read
      every frame, so a layout that settles late (styles or fonts still
      arriving on a first load) moves the path with it. */
  const restGeometry = () => {
    const box = root.current!.querySelector(".fl-logo")!.getBoundingClientRect();
    const r = root.current!.getBoundingClientRect();
    const u = box.width / 2132; // the lockup's viewBox width
    return {
      key: [box.left, box.top, box.width, r.left, r.top, r.width, r.height].map((v) => Math.round(v * 2)).join(),
      u,
      origin: [box.left, box.top] as [number, number],
      centre: [MARK_CENTRE[0] * u, MARK_CENTRE[1] * u] as [number, number],
      width: MARK_BOUNDS.width * u,
      frame: { left: r.left, top: r.top, width: r.width, height: r.height },
    };
  };
  type Geometry = ReturnType<typeof restGeometry>;

  // the mark flies its paths in pieces (body, wing, head), drawn here; at
  // rest it is the one outline again. The route is made from where things
  // are, and made again if the layout moves under it.
  const fly = (make: (g: Geometry) => ReturnType<typeof flightRoute>, delay: number) => {
    const m = mark.current!;
    const path = m.querySelector<SVGPathElement>("path")!;
    const [body, far, near] = ["body", "far", "near"].map((k) => m.querySelector<SVGPathElement>(`[data-piece="${k}"]`)!);
    const pieces = (on: boolean) => {
      path.style.display = on ? "none" : "";
      for (const p of [body, far, near]) p.style.display = on ? "" : "none";
    };
    let g = restGeometry();
    let route = make(g);
    const draw = (t: number) => {
      const now = restGeometry();
      if (now.key !== g.key) {
        g = now;
        route = make(g);
      }
      const at = route.at(Math.min(t, route.total));
      gsap.set(m, { x: at.x, y: at.y, scale: at.scale });
      body.setAttribute("d", at.pose.body);
      far.setAttribute("d", at.pose.far);
      near.setAttribute("d", at.pose.near);
      pieces(!at.done);
    };
    draw(0);
    const clock = { t: 0 };
    return gsap.to(clock, {
      t: route.total,
      duration: route.total * pace,
      ease: "none",
      delay,
      onUpdate: () => draw(clock.t),
      onComplete: () => {
        draw(route.total);
        pieces(false);
      },
    });
  };

  /** The wordmark's letters, left to right (V, e, n, and the ty ligature) */
  const letters = () =>
    [...(root.current?.querySelectorAll<SVGPathElement>("[data-letter]") ?? [])].sort((a, b) => a.getBBox().x - b.getBBox().x);

  // on the way in: everything reveals itself, and the mark flies in
  const entered = useRef<Promise<unknown>>(Promise.resolve());
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || !mark.current) return;
    // until it starts (and as served) all of it waits hidden (.is-pre), so
    // nothing shows at rest before it can reveal itself
    if (still()) {
      el.classList.remove("is-pre");
      return;
    }
    const m = mark.current;
    const q = gsap.utils.selector(root);
    const column = window.matchMedia("(max-width: 767px)").matches;
    let flight: gsap.core.Tween | null = null;
    let reveal: gsap.core.Timeline | null = null;
    let done: (v?: unknown) => void = () => {};
    entered.current = new Promise((ok) => (done = ok));
    const begin = () => {
      el.classList.remove("is-pre");
      gsap.set(m, { transformOrigin: "0 0" });
      const rest = { x: 0, y: 0, scale: 1 };
      // off the screen (its first frame) until it flies in
      flight = fly((g) => flightRoute({ ...g, from: rest, to: rest, start: ENTER_PATH[0], via: ENTER_PATH.slice(1), duration: ENTER_S, ease: "out", facing: 180 }), 0.1 * pace);
      flight.then(() => {
        done();
        // it touches down over the wordmark: a small ripple runs out through
        // the letters from under it
        gsap.to(letters(), { yPercent: 7, duration: 0.2 * pace, ease: "sine.out", yoyo: true, repeat: 1, stagger: { each: 0.05 * pace, from: 1 } });
      });
      reveal = gsap
        .timeline({ defaults: { ease: EASE.out } })
        // the letters rise and lean into place one after another, from the
        // right, under the bird as it comes in over them along the top
        .from(letters(), { opacity: 0, yPercent: 36, rotation: 9, transformOrigin: "50% 100%", duration: REVEAL_S, stagger: { each: 0.08, from: "end" } }, 0)
        .from(q("[data-clear='bar']"), { scaleX: 0, duration: REVEAL_S * 1.1 }, 0.1)
        .from(q("[data-clear='left']"), { opacity: 0, [column ? "y" : "x"]: -24, duration: REVEAL_S * 0.8 }, 0.25)
        .from(q("[data-clear='right']"), { opacity: 0, [column ? "y" : "x"]: 24, duration: REVEAL_S * 0.8 }, 0.25)
        .timeScale(1 / pace);
    };
    // The page does its heaviest work as it starts (the rest of it mounting:
    // its scroll scenes, the section edges, the hero's player), in long
    // blocks of a few hundred ms. A flight started then would stutter, so it
    // waits for the browser to draw a few smooth frames in a row (at most
    // SETTLE_MS), then begins.
    let raf = 0;
    let calm = 0;
    let prev = performance.now();
    const t0 = prev;
    const watch = (now: number) => {
      calm = now - prev < 24 ? calm + 1 : 0;
      prev = now;
      if (calm >= 6 || now - t0 > SETTLE_MS) return begin();
      raf = requestAnimationFrame(watch);
    };
    raf = requestAnimationFrame(watch);
    return () => {
      cancelAnimationFrame(raf);
      flight?.kill();
      reveal?.revert();
    };
    // the way in runs once, on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // the site's logo waits under the screen, hidden, until the mark lands on it
  useEffect(() => {
    if (contained) return;
    const logo = document.querySelector<HTMLElement>("[data-logo]");
    if (logo) logo.style.visibility = "hidden";
    return () => {
      if (logo) logo.style.visibility = "";
    };
  }, [contained]);

  // the filament's head breathes, and a sweep of light runs along the lit part
  useEffect(() => {
    if (still() || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.to("[data-head]", { opacity: 0.55, duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.fromTo("[data-pulse]", { xPercent: -100, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 1.6, ease: "power2.in", repeat: -1, repeatDelay: 0.5 });
    }, root);
    return () => ctx.revert();
  }, []);

  // loaded: a beat on Ready, then out
  useEffect(() => {
    if (!loaded) return;
    let dead = false;
    const timers: number[] = [];
    const tweens: (gsap.core.Tween | gsap.core.Timeline)[] = [];
    const wait = (ms: number) => new Promise<void>((r) => timers.push(window.setTimeout(r, ms)));
    const land = () => {
      if (dead) return;
      const logo = contained ? null : document.querySelector<HTMLElement>("[data-logo]");
      if (logo) logo.style.visibility = "";
      setGone(true);
      onDone?.();
    };
    const leave = async () => {
      await entered.current; // it has flown in and settled
      await wait(HOLD_MS * pace);
      if (dead) return;
      if (still()) {
        await gsap.to(root.current, { opacity: 0, duration: 0.5, ease: EASE.soft }).then();
        land();
        return;
      }
      const q = gsap.utils.selector(root);
      // phones lay the line out as a column (word on top, number at the foot), so those leave up and down
      const column = window.matchMedia("(max-width: 767px)").matches;

      // the mark: cloud while it loads; on Ready it turns cornflower (the site
      // logo's colour), then flies to exactly over the site's logo
      const m = mark.current!;
      const corn = getComputedStyle(document.documentElement).getPropertyValue("--color-cornflower").trim() || "#687ef5";
      tweens.push(gsap.to(m, { color: corn, duration: TINT_S * pace, ease: EASE.soft }));
      const to = landing()?.querySelector("path") ?? landing();
      let flight: gsap.core.Tween | null = null;
      if (to) {
        const target = to;
        flight = fly((g) => {
          // the site's logo, and the mark's own outline at rest, on screen
          const b = target.getBoundingClientRect();
          const s = b.width / g.width;
          const ax = g.origin[0] + MARK_BOUNDS.x * g.u;
          const ay = g.origin[1] + MARK_BOUNDS.y * g.u;
          return flightRoute({
            ...g,
            from: { x: 0, y: 0, scale: 1 },
            to: { x: b.left - g.origin[0] - (ax - g.origin[0]) * s, y: b.top - g.origin[1] - (ay - g.origin[1]) * s, scale: s },
            via: EXIT_PATH,
            duration: EXIT_S,
          });
        }, (TINT_S - 0.05) * pace); // once it has turned
        tweens.push(flight);
      }

      // the rest clears, and the night settles to one flat colour
      tweens.push(
        gsap
          .timeline()
          .to(q("[data-clear]:not([data-clear='word'])"), { opacity: 0, duration: CLEAR_S, ease: EASE.in }, 0)
          // the letters go one after another, from the right, as the bird
          // curls away over them
          .to(letters(), { opacity: 0, yPercent: 30, rotation: -7, transformOrigin: "50% 100%", duration: CLEAR_S, ease: EASE.in, stagger: { each: 0.04, from: "end" } }, 0)
          .to(q("[data-clear='left']"), { [column ? "y" : "x"]: -14, duration: CLEAR_S, ease: EASE.in }, 0)
          .to(q("[data-clear='right']"), { [column ? "y" : "x"]: 14, duration: CLEAR_S, ease: EASE.in }, 0)
          .to(q("[data-clear='bar']"), { scaleX: 0, duration: CLEAR_S, ease: EASE.in }, 0)
          .to(sky.current, { opacity: 0, duration: CLEAR_S + 0.1, ease: EASE.soft }, 0)
          .timeScale(1 / pace),
      );
      await wait((CLEAR_S + 0.05) * 1000 * pace);
      if (dead) return;

      // the squares clear from the top, row by row, uncovering the hero
      setOut(true);
      await Promise.all([wait((TILES_S + 0.08) * 1000 * pace), flight ? flight.then() : Promise.resolve()]);
      land();
    };
    leave();
    return () => {
      dead = true;
      timers.forEach(clearTimeout);
      tweens.forEach((t) => t.kill());
    };
    // runs once, when the load completes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  if (gone) return null;

  return (
    // .loader is what the page's openings wait for (afterLoader); the lab's copy has no part in that
    <div ref={root} className={`fl is-pre inset-0 overflow-hidden ${contained ? "absolute z-[40]" : "loader fixed z-[100]"}`}>
      <div role="progressbar" aria-label="Loading Venty" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="sr-only">
        {pct}%
      </div>

      {/* the flat night, in squares, under the moving one */}
      {tileGrid}
      <div ref={sky} className="fl-sky" aria-hidden="true">
        {night}
      </div>

      <div className="fl-hud">
        <div data-clear="left" className="fl-side fl-left">
          <Roll i={word} />
        </div>

        <div className="fl-centre">
          <div className="fl-logo" role="img" aria-label="Venty">
            <svg data-clear="word" viewBox={LOCKUP} className="fl-logo__word" aria-hidden="true" fill="currentColor">
              {WORD.map((d) => (
                <path key={d.slice(0, 12)} data-letter="" d={d} />
              ))}
            </svg>
            <svg ref={mark} viewBox={LOCKUP} className="fl-logo__mark" aria-hidden="true" fill="currentColor" overflow="visible">
              <path d={MARK} />
              {/* the mark cut into its body and wings, shown only while it flies */}
              <path data-piece="body" style={{ display: "none" }} />
              <path data-piece="far" style={{ display: "none" }} />
              <path data-piece="near" style={{ display: "none" }} />
            </svg>
          </div>
          <div data-clear="bar" className="fl-bar" aria-hidden="true">
            <div className="fl-fill" style={{ width: `${Math.min(1, shown) * 100}%` }}>
              {/* the sweep of light runs inside the lit part only: clipped, so it never shows past the line's start */}
              <span className="fl-sweep">
                <span data-pulse className="fl-pulse" />
              </span>
              <span data-head className="fl-head" />
            </div>
          </div>
        </div>

        <p data-clear="right" className="fl-side fl-right fl-roll" aria-hidden="true">
          {pct}%
        </p>
      </div>
    </div>
  );
}
