import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { HIDDEN, padMasks } from "./reveal";

gsap.registerPlugin(SplitText);

/* Venty's motion system: the one set of eases, durations, staggers and
   reveals every section uses. Reach for these before writing a new value;
   if something truly needs a new one, add it here (and to docs/motion.md),
   never inline. CSS mirrors the same values as custom properties
   (--ease-*, --dur-* in globals.css) for hovers and state changes.

   The rules of thumb:
   - things arrive with EASE.out (fast start, long soft landing)
   - things leave with EASE.in, quicker than they came
   - things move between two states with EASE.inOut
   - presses and pills spring (CSS --ease-spring)
   - text never fades in on its own: it rises from behind a mask */

export const EASE = {
  /** arriving: reveals, entrances, panels opening */
  out: "expo.out",
  /** leaving: exits, things clearing the stage */
  in: "power3.in",
  /** moving between two states, drawn lines, wipes */
  inOut: "power3.inOut",
  /** small settles: opacity, nudges */
  soft: "power2.out",
} as const;

export const DUR = {
  /** hovers, presses, small state changes */
  quick: 0.35,
  /** panels, menus, things sliding a short way */
  base: 0.7,
  /** text and object reveals */
  reveal: 1.2,
  /** the big opening moves (the hero scene) */
  long: 2.4,
} as const;

export const STAGGER = {
  chars: 0.03,
  words: 0.05,
  lines: 0.08,
  /** separate objects in one group */
  items: 0.1,
} as const;

/** How far a fade-up travels, px */
export const RISE = 14;

type TL = gsap.core.Timeline;
type Targets = gsap.TweenTarget;

/* ---------------------------------------------------------------- text */

/** Lines (or words) of text rise into view from behind their masks.
    Targets are the inner spans, already wrapped in masks (.line-mask, or
    SplitText's mask). */
export function textIn(tl: TL, targets: Targets, at: gsap.Position, stagger: number = STAGGER.lines) {
  return tl.from(targets, { yPercent: HIDDEN, duration: DUR.reveal, ease: EASE.out, stagger }, at);
}

/** Splits a block of running text into masked lines and reveals them.
    The split is undone once the reveal ends, so the text reflows freely
    on resize. While split, the block is a flex column: the masks' padding
    is taken back with negative margins, and in normal flow neighbouring
    margins would collapse into each other and push the lines apart (the
    text would jump taller, then snap back). */
export function linesIn(tl: TL, el: Element | null, at: gsap.Position, stagger: number = STAGGER.lines) {
  if (!(el instanceof HTMLElement)) return tl;
  const split = SplitText.create(el, { type: "lines", mask: "lines" });
  padMasks(split.masks);
  gsap.set(el, { display: "flex", flexDirection: "column" });
  return tl.from(
    split.lines,
    {
      yPercent: HIDDEN,
      duration: DUR.reveal,
      ease: EASE.out,
      stagger,
      onComplete: () => {
        split.revert();
        gsap.set(el, { clearProps: "display,flexDirection" });
      },
    },
    at,
  );
}

/* ------------------------------------------------------------- objects */

/** An object fades in as it rises a little into place */
export function fadeUp(tl: TL, targets: Targets, at: gsap.Position, stagger: number = STAGGER.items) {
  return tl.from(
    targets,
    { y: RISE, opacity: 0, duration: DUR.reveal, ease: EASE.out, stagger, clearProps: "transform,opacity" },
    at,
  );
}

/** The same, coming down from above (things at the top edge) */
export function fadeDown(tl: TL, targets: Targets, at: gsap.Position, stagger: number = STAGGER.items) {
  return tl.from(
    targets,
    { y: -RISE, opacity: 0, duration: DUR.reveal, ease: EASE.out, stagger, clearProps: "transform,opacity" },
    at,
  );
}

/** A hairline draws out from its origin (default: across, from the centre) */
export function drawLine(tl: TL, targets: Targets, at: gsap.Position, origin = "50% 50%", axis: "x" | "y" = "x") {
  const scale = axis === "x" ? { scaleX: 0 } : { scaleY: 0 };
  return tl.from(targets, { ...scale, transformOrigin: origin, duration: DUR.reveal, ease: EASE.inOut, clearProps: "transform" }, at);
}

/** A pill or panel opens out from its left edge (a clip wipe; rounding kept) */
export function wipeIn(tl: TL, targets: Targets, at: gsap.Position, radius = "999px") {
  return tl.fromTo(
    targets,
    { clipPath: `inset(0% 100% 0% 0% round ${radius})` },
    { clipPath: `inset(0% 0% 0% 0% round ${radius})`, duration: DUR.reveal, ease: EASE.inOut, clearProps: "clipPath" },
    at,
  );
}

/* -------------------------------------------------------------- timing */

/** Calls back once the loading screen has left the page (at once if there
    is none). Openings wait for it, so they play where people can see them.
    Returns a cancel function. */
export function afterLoader(cb: () => void) {
  if (!document.querySelector(".loader")) {
    cb();
    return () => {};
  }
  const mo = new MutationObserver(() => {
    if (document.querySelector(".loader")) return;
    mo.disconnect();
    cb();
  });
  mo.observe(document.body, { childList: true, subtree: true });
  return () => mo.disconnect();
}
