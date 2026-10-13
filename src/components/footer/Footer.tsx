"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { DitherEdge } from "../DitherEdge";
import { PrimaryButton } from "../PrimaryButton";
import { QutMark } from "../VoteTab";
import { Halftone } from "../maker/Halftone";
import { scrollToElement } from "../SmoothScroll";
import { APP_URL, CTA_LABEL, FESTIVAL_AT, MAKER_URL, SOCIAL_LINKS, VOTE_LINKS } from "@/lib/site";
import { FOOTER_IN, FOOTER_OUT, MARK, MARK_BOUNDS, MARK_CENTRE, flightRoute, type Place } from "@/lib/markFlight";
import { LOCKUP, WORD } from "@/lib/lockup";
import { useCountdown } from "@/lib/useCountdown";
import { useReveals } from "@/lib/useReveals";
import "./footer.css";

/* The footer (light). A sky that ends in a meadow: Jose's field of
   cornflowers under misty hills, the grass moving in the wind (a video, on
   a seamless loop; Meadow below), its top fading into the cloud above. It
   rises over the held end of the closing scene with the site's edge.

   In the sky, one centred column: the line, the button, the page's sections
   in a row and Natalia's socials under them; and a line of Venty's own
   phrases running along a curve over the hills.
   On the horizon, level, two panels of frosted glass (the Made to measure
   composer's): Made by Natalia (her portrait in dots in a night arch, as in
   The designer) and Vote for Venty (the QUT mark building in, the People's
   Choice Award, the days to the festival, a link to vote per discipline).
   Over the flowers: the Venty lockup in white, its bird in cornflower. The
   bird comes and goes, flying over the sky's words and behind the panels;
   tap it while it rests and it bursts into a flock that scatters into the
   distance (useBird). */

type L = { label: string; href: string };
const SECTIONS: L[] = [
  { label: "Made to measure", href: "#measure" },
  { label: "How it works", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "What you can make", href: "#make" },
  { label: "On the line", href: "#made" },
  { label: "FAQ", href: "#faq" },
];

/* along the curve over the hills: the announcement bar's lines */
const DRIFT = "Your body is the pattern · No sizes, just measurements · Sketch it. Say it. Sew it. · From screen to scissors · Pin it. Cut it. Wear it. · ";

const pad = (n: number) => String(n).padStart(2, "0");

function FLink({ label, href }: L) {
  if (!href)
    return (
      <a role="link" aria-disabled="true" title="Coming soon" className="fo-link is-off">
        <span>{label}</span>
      </a>
    );
  const inPage = href.startsWith("#");
  const mail = href.startsWith("mailto:");
  return (
    <a
      href={href}
      className="fo-link"
      onClick={(e) => {
        if (!inPage) return;
        const t = document.getElementById(href.slice(1));
        if (!t) return;
        e.preventDefault();
        scrollToElement(t);
      }}
      {...(inPage || mail ? {} : { target: "_blank", rel: "noopener noreferrer" })}
    >
      <span>{label}</span>
    </a>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M5 11 11 5M6 5h5v5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

/* ---- the meadow -------------------------------------------------------- */
/* Jose's video of the meadow in the wind (media/footer/: the master, and
   the loop made from it, its end cross-faded into its start so it never
   jumps). Over it, the shape of the hills' mist: the still's own
   transparency, laid where the still sits in the video's frame
   (/footer/meadow-mask.png), positioned exactly as the video is (cover,
   from the bottom), so the sky melts into the page above.
   The first frame shows at once (an image, sized to the screen); the
   video loads only when the footer is near (full HD on desktop, 1280 on
   smaller screens), fades in over it once it is really playing, and pauses
   when it is off screen. With reduced motion, the first frame stays. */
function Meadow() {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let loaded = false;
    const shown = () => v.classList.add("is-playing");
    v.addEventListener("playing", shown);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (!loaded) {
            loaded = true;
            v.preload = "auto";
            v.load();
          }
          v.play().catch(() => {});
        } else if (loaded) v.pause();
      },
      { rootMargin: "50% 0px 50% 0px" },
    );
    io.observe(v);
    return () => {
      io.disconnect();
      v.removeEventListener("playing", shown);
      v.pause();
    };
  }, []);
  return (
    <div className="fo-media" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/footer/meadow-poster.webp" srcSet="/footer/meadow-poster-1280.webp 1280w, /footer/meadow-poster.webp 1920w" sizes="100vw" alt="" loading="lazy" decoding="async" />
      <video ref={ref} muted loop playsInline preload="none" disablePictureInPicture>
        <source media="(min-width: 1024px)" src="/footer/meadow.mp4" type="video/mp4" />
        <source src="/footer/meadow-1280.mp4" type="video/mp4" />
      </video>
    </div>
  );
}

/* ---- Made by Natalia --------------------------------------------------- */
function Maker() {
  return (
    <a data-up href={MAKER_URL} target="_blank" rel="noopener noreferrer" className="fo-panel fo-maker">
      <span className="fo-maker__face">
        <Halftone src="/maker/natalia.webp" label="Portrait of Natalia Chamon, drawn in dots" />
      </span>
      <span className="fo-maker__text">
        <span className="fo-k">Made by</span>
        <span className="fo-maker__name">
          Natalia <em>Chamon</em>
        </span>
        <span className="fo-maker__role">Designer of Venty · QUT, Brisbane</span>
        <span className="fo-maker__url">
          nataliachamon.com
          <Arrow />
        </span>
      </span>
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

/* ---- Vote for Venty ---------------------------------------------------- */
function Vote() {
  const left = useCountdown();
  const parts: [string, number | undefined][] = [
    ["days", left?.d],
    ["hours", left?.h],
    ["min", left?.m],
    ["sec", left?.s],
  ];
  return (
    <section data-up className="fo-panel fo-vote" aria-labelledby="fo-vote-title">
      <div className="fo-vote__head">
        <QutMark />
        <p>
          QUT Design Festival
          <span>People&apos;s Choice Award</span>
        </p>
      </div>
      <h2 id="fo-vote-title" className="fo-vote__title">
        Vote for <em>Venty.</em>
      </h2>
      {left?.over ? (
        <p className="fo-vote__when">Voting is open now, at the festival.</p>
      ) : (
        <>
          <time className="fo-count" dateTime={FESTIVAL_AT}>
            {parts.map(([u, v]) => (
              <span key={u}>
                <b>{v === undefined ? "--" : pad(v)}</b>
                <small>{u}</small>
              </span>
            ))}
          </time>
          <p className="fo-vote__when">Wednesday 11 November, 6pm · Brisbane</p>
        </>
      )}
      <ul className="fo-vote__go">
        {VOTE_LINKS.map((l) => (
          <li key={l.label}>
            {l.href ? (
              <a href={l.href} target="_blank" rel="noopener" className="fo-go">
                Vote · {l.label}
                <Arrow />
              </a>
            ) : (
              // no voting page yet: looks like the link, goes nowhere
              <a role="link" aria-disabled="true" tabIndex={0} title="Link coming soon" className="fo-go">
                Vote · {l.label}
                <Arrow />
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---- the bird -------------------------------------------------------------- */
/* While the lockup is on screen the bird comes and goes: it glides in from
   beyond the right edge (FOOTER_IN) onto its place in the lockup, rests,
   lifts away beyond the left edge (FOOTER_OUT), and after a while comes in
   again. It flies over the sky's words and behind the panels. Each flight is
   planned from where everything is as it starts.
   Tap it while it rests and it bursts into a flock: it and FLOCK more birds
   scatter from its place across the sky, each shrinking into the distance
   and fading as it goes; then, as always, it comes home. */
const REST_S = 7; // resting in the lockup
const AWAY_S = 4; // gone, before it comes back
const FLOCK = 9;

type Route = ReturnType<typeof flightRoute>;
type Bird = { svg: SVGSVGElement; whole: SVGPathElement; parts: SVGPathElement[] };

/** a bird's svg: the whole mark at rest, its pieces in flight */
function bird(svg: SVGSVGElement): Bird {
  return {
    svg,
    whole: svg.querySelector<SVGPathElement>("[data-whole]")!,
    parts: ["body", "far", "near"].map((k) => svg.querySelector<SVGPathElement>(`[data-piece="${k}"]`)!),
  };
}
/** draws a bird at a moment of its route */
function drawBird(b: Bird, at: ReturnType<Route["at"]>) {
  gsap.set(b.svg, { x: at.x, y: at.y, scale: at.scale });
  b.parts[0].setAttribute("d", at.pose.body);
  b.parts[1].setAttribute("d", at.pose.far);
  b.parts[2].setAttribute("d", at.pose.near);
  b.whole.style.display = at.done ? "" : "none";
  for (const p of b.parts) p.style.display = at.done ? "none" : "";
}
/** flies a bird along a route; resolves when it is there */
function fly(b: Bird, route: Route, track: (t: gsap.core.Tween) => void, onFrame?: (time: number) => void) {
  return new Promise<void>((ok) => {
    drawBird(b, route.at(0));
    const clock = { t: 0 };
    track(
      gsap.to(clock, {
        t: route.total,
        duration: route.total,
        ease: "none",
        onUpdate: () => {
          drawBird(b, route.at(clock.t));
          onFrame?.(clock.t);
        },
        onComplete: () => {
          drawBird(b, route.at(route.total));
          ok();
        },
      }),
    );
  });
}

function useBird(box: React.RefObject<HTMLDivElement | null>, mark: React.RefObject<SVGSVGElement | null>, flock: React.RefObject<HTMLDivElement | null>) {
  const [resting, setResting] = useState(false);
  const release = useRef<() => void>(() => {});

  useEffect(() => {
    const b = box.current;
    const m = mark.current;
    const nest = flock.current;
    if (!b || !m || !nest) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      b.classList.remove("is-waiting");
      return;
    }
    const home = bird(m);
    gsap.set(m, { transformOrigin: "0 0" });

    // its place in the lockup (the mark's svg fills the lockup's box exactly)
    const geometry = () => {
      const r = b.getBoundingClientRect();
      const u = r.width / 2132;
      return {
        r,
        g: {
          origin: [r.left, r.top] as [number, number],
          centre: [MARK_CENTRE[0] * u, MARK_CENTRE[1] * u] as [number, number],
          width: MARK_BOUNDS.width * u,
          frame: { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight },
        },
      };
    };
    const rest: Place = { x: 0, y: 0, scale: 1 };
    /** a place on the screen (px), as a place for the svg at a scale */
    const at = (r: DOMRect, centre: [number, number], px: number, py: number, scale: number): Place => ({ x: px - r.left - centre[0] * scale, y: py - r.top - centre[1] * scale, scale });
    const flyIn = () => {
      const { g } = geometry();
      return flightRoute({ ...g, from: rest, to: rest, start: FOOTER_IN[0], via: FOOTER_IN.slice(1), duration: 2.8, ease: "out", facing: 180 });
    };
    const flyOut = () => {
      const { r, g } = geometry();
      return flightRoute({ ...g, from: rest, to: at(r, g.centre, -g.width, window.innerHeight * 0.1, 1), via: FOOTER_OUT, duration: 2.6 });
    };

    let dead = false;
    const tweens = new Set<gsap.core.Tween>();
    const track = (t: gsap.core.Tween) => {
      tweens.add(t);
      t.eventCallback("onInterrupt", () => tweens.delete(t));
    };
    let visible = false;
    let wake: (() => void) | null = null;
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible && wake) {
          wake();
          wake = null;
        }
      },
      { threshold: 0.55 },
    );
    io.observe(b);
    const onScreen = () => (visible ? Promise.resolve() : new Promise<void>((ok) => (wake = ok)));
    /** a pause, which a tap can cut short */
    let cut: (() => void) | null = null;
    const pause = (s: number) =>
      new Promise<void>((ok) => {
        const call = gsap.delayedCall(s, () => {
          cut = null;
          ok();
        });
        cut = () => {
          call.kill();
          cut = null;
          ok();
        };
      });

    // the flock: birds made on the spot, each from its place in the lockup
    // out into the distance, and gone
    const scatter = () => {
      const { r, g } = geometry();
      const W = window.innerWidth;
      const H = window.innerHeight;
      for (let i = 0; i < FLOCK; i++) {
        const svg = m.cloneNode(true) as SVGSVGElement;
        svg.removeAttribute("id");
        svg.classList.add("fo-flock__bird");
        if (i % 3 === 2) svg.classList.add("is-far");
        nest.appendChild(svg);
        gsap.set(svg, { transformOrigin: "0 0" });
        const side = i % 2 ? 1 : -1;
        const scale = gsap.utils.random(0.12, 0.32);
        const end = at(r, g.centre, W * (0.5 + side * gsap.utils.random(0.15, 0.62)), H * gsap.utils.random(0.02, 0.3), scale);
        const route = flightRoute({
          ...g,
          from: rest,
          to: end,
          via: [{ space: "from", x: side * gsap.utils.random(0.2, 1.4), y: -gsap.utils.random(0.5, 1.6) }],
          duration: gsap.utils.random(2.2, 3.4),
          rate: gsap.utils.random(2.4, 3.4),
        });
        const one = bird(svg);
        // each fades as it reaches the distance
        const fade = (t: number) => (svg.style.opacity = String(1 - gsap.utils.clamp(0, 1, (t / route.total - 0.7) / 0.3)));
        fly(one, route, track, fade).then(() => svg.remove());
      }
    };
    release.current = () => {
      if (!cut) return; // only while it rests
      scatter();
      cut();
    };

    (async () => {
      await onScreen();
      if (dead) return;
      b.classList.remove("is-waiting");
      while (!dead) {
        await fly(home, flyIn(), track);
        if (dead) return;
        setResting(true);
        await pause(REST_S);
        setResting(false);
        await onScreen();
        if (dead) return;
        await fly(home, flyOut(), track);
        await pause(AWAY_S);
        await onScreen();
      }
    })();

    return () => {
      dead = true;
      io.disconnect();
      tweens.forEach((t) => t.kill());
      nest.replaceChildren();
      release.current = () => {};
    };
  }, [box, mark, flock]);

  return { resting, release: () => release.current() };
}

/* ---- the footer -------------------------------------------------------- */

export function Footer() {
  const root = useRef<HTMLElement>(null);
  const lockup = useRef<HTMLDivElement>(null);
  const mark = useRef<SVGSVGElement>(null);
  const flock = useRef<HTMLDivElement>(null);
  useReveals(root);
  const { resting, release } = useBird(lockup, mark, flock);

  return (
    <footer ref={root} id="footer" data-theme-zone="light" data-theme-at="top 35%" className="fo">
      <DitherEdge color="#eff4ff" />
      <span className="fo-dots" aria-hidden="true" />

      {/* the sky: one centred column */}
      <div className="fo-sky" data-reveal>
        <p className="fo-line">
          <span className="line-mask">
            <span data-rise className="block">
              Sewing patterns
            </span>
          </span>
          <span className="line-mask">
            <span data-rise className="block">
              drafted <em>to your body.</em>
            </span>
          </span>
        </p>
        <div data-up className="fo-cta">
          <PrimaryButton href={APP_URL}>{CTA_LABEL}</PrimaryButton>
        </div>
        <nav data-up aria-label="Sections" className="fo-row">
          <ul>
            {SECTIONS.map((it) => (
              <li key={it.label}>
                <FLink {...it} />
              </li>
            ))}
          </ul>
        </nav>
        <nav data-up aria-label="Natalia's socials" className="fo-row is-social">
          <ul>
            {SOCIAL_LINKS.map((it) => (
              <li key={it.label}>
                <FLink {...it} />
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* the land: the meadow, and what is on the horizon and over it */}
      <div className="fo-land">
        <Meadow />

        {/* Venty's phrases, drifting along a curve over the hills */}
        <svg viewBox="0 0 1440 220" className="fo-drift" aria-hidden="true">
          <defs>
            <path id="fo-drift-path" d="M-40 170 C 240 70, 520 60, 720 120 S 1180 190, 1480 60" />
          </defs>
          <text>
            <textPath href="#fo-drift-path">
              {DRIFT.repeat(3)}
              <animate attributeName="startOffset" from="0" to="-1240" dur="60s" repeatCount="indefinite" />
            </textPath>
          </text>
        </svg>

        <div className="fo-horizon" data-reveal="top 85%">
          <Maker />
          <Vote />
        </div>

        <div ref={lockup} className="fo-lockup is-waiting" role="img" aria-label="Venty">
          <svg viewBox={LOCKUP} className="fo-lockup__word" aria-hidden="true" fill="currentColor">
            {WORD.map((d) => (
              <path key={d.slice(0, 12)} d={d} />
            ))}
          </svg>
          <svg ref={mark} viewBox={LOCKUP} className="fo-lockup__mark" aria-hidden="true" fill="currentColor" overflow="visible">
            <path data-whole d={MARK} />
            <path data-piece="body" style={{ display: "none" }} />
            <path data-piece="far" style={{ display: "none" }} />
            <path data-piece="near" style={{ display: "none" }} />
          </svg>
          {/* the flock, when the bird is tapped */}
          <div ref={flock} className="fo-flock" aria-hidden="true" />
          {/* tap the bird while it rests */}
          <button type="button" className="fo-tap" data-on={resting} disabled={!resting} onClick={release} aria-label="Let the bird fly">
            <span className="fo-tap__hint" aria-hidden="true">
              Tap the bird
            </span>
          </button>
        </div>

        <div className="fo-bottom">
          <p>Venty is a concept for the QUT Design Festival 2026.</p>
          <p>
            Made by{" "}
            <a href={MAKER_URL} target="_blank" rel="noopener noreferrer">
              Natalia
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
