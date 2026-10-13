"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { DitherEdge } from "../DitherEdge";
import { PrimaryButton } from "../PrimaryButton";
import { QutMark } from "../VoteTab";
import { Halftone } from "../maker/Halftone";
import { scrollToElement } from "../SmoothScroll";
import { APP_URL, CTA_LABEL, FESTIVAL_AT, MAKER_URL, VOTE_LINKS } from "@/lib/site";
import { ENTER_PATH, LEAVE_PATH, MARK, MARK_BOUNDS, MARK_CENTRE, flightRoute } from "@/lib/markFlight";
import { LOCKUP, WORD } from "@/lib/lockup";
import { useCountdown } from "@/lib/useCountdown";
import { useReveals } from "@/lib/useReveals";
import "./footer.css";

/* The footer (light). A sky that ends in a meadow: Jose's field of
   cornflowers under misty hills, the grass moving in the wind (a video, on
   a seamless loop; Meadow below), its top fading into the cloud above. It rises over the held end of the closing scene with
   the site's edge.

   In the sky: the line and the button, the page's sections, and a line of
   Venty's own phrases running along a curve over the hills (the way type
   runs round Natalia's portrait).
   On the horizon, half in the sky and half over the hills, two things on
   paper, in the language of the pieces and the table:
     Vote for Venty   a ticket taped on: the QUT mark building in, the
                      People's Choice Award, the days to the festival, a
                      link to vote per discipline
     Made by Natalia  a woven label sewn on (stitched at both ends): her
                      portrait in dots in a night arch, as in Meet the
                      maker, and her name
   Over the flowers: the Venty lockup in white. Its bird is not there at
   first: when the lockup comes into view, it flies in from beyond the right
   edge along the loading screen's way in (ENTER_PATH) and lands in its
   place, the end of the journey it started at the top of the page; then it
   keeps coming and going (useBird). */

type L = { label: string; href: string };
const COLS: { h: string; items: L[] }[] = [
  {
    h: "Explore",
    items: [
      { label: "Made to measure", href: "#measure" },
      { label: "How it works", href: "#how" },
      { label: "Features", href: "#features" },
      { label: "What you can make", href: "#make" },
      { label: "On the line", href: "#made" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    // who made it, and how to reach her (her site is the way in)
    h: "Natalia Chamon",
    items: [
      { label: "The designer", href: "#maker" },
      { label: "nataliachamon.com", href: MAKER_URL },
    ],
  },
];

/* along the curve over the hills: the announcement bar's lines */
const DRIFT = "Your body is the pattern · No sizes, just measurements · Sketch it. Say it. Sew it. · From screen to scissors · Pin it. Cut it. Wear it. · ";

const pad = (n: number) => String(n).padStart(2, "0");

function FLink({ label, href }: L) {
  if (!href)
    return (
      <a role="link" aria-disabled="true" className="fo-link is-off">
        {label}
      </a>
    );
  const inPage = href.startsWith("#");
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
      {...(inPage ? {} : { target: "_blank", rel: "noopener noreferrer" })}
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

/* ---- Vote for Venty: a ticket, taped on -------------------------------- */
function Vote() {
  const left = useCountdown();
  const parts: [string, number | undefined][] = [
    ["days", left?.d],
    ["hours", left?.h],
    ["min", left?.m],
    ["sec", left?.s],
  ];
  return (
    <section data-up className="fo-vote" aria-labelledby="fo-vote-title">
      <span className="fo-tape" aria-hidden="true" />
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

/* ---- Made by Natalia: a woven label, sewn on ----------------------------- */
function Label() {
  return (
    <a data-up href={MAKER_URL} target="_blank" rel="noopener noreferrer" className="fo-label">
      <span className="fo-label__stitch is-l" aria-hidden="true" />
      <span className="fo-label__stitch is-r" aria-hidden="true" />
      <span className="fo-label__face">
        <Halftone src="/maker/natalia.webp" label="Portrait of Natalia Chamon, drawn in dots" />
      </span>
      <span className="fo-label__text">
        <span className="fo-label__k">Made by</span>
        <span className="fo-label__name">
          Natalia <em>Chamon</em>
        </span>
        <span className="fo-label__role">Designer of Venty · QUT, Brisbane</span>
        <span className="fo-label__url">
          nataliachamon.com
          <Arrow />
        </span>
      </span>
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

/* ---- the lockup, and its bird coming and going --------------------------- */
/* While the lockup is on screen, the bird keeps coming home: it flies in
   from beyond the right edge (the loading screen's way in) and lands in its
   place; rests a while; takes off, curls up over the lockup and flies out
   beyond the left edge; and a little later comes in from the right again.
   Each flight is planned from where everything is as it starts. It flies in
   steel, so it shows against the light sky, and settles to the lockup's
   cloud as it lands (and back to steel as it takes off). */
const REST_S = 3.5; // resting in the lockup
const AWAY_S = 1.4; // gone, before it comes back
const STEEL = "#485f88";
const CLOUD = "#eff4ff";

function useBird(box: React.RefObject<HTMLDivElement | null>, mark: React.RefObject<SVGSVGElement | null>) {
  useEffect(() => {
    const b = box.current;
    const m = mark.current;
    if (!b || !m) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      b.classList.remove("is-waiting");
      return;
    }
    const whole = m.querySelector<SVGPathElement>("[data-whole]")!;
    const [body, far, near] = ["body", "far", "near"].map((k) => m.querySelector<SVGPathElement>(`[data-piece="${k}"]`)!);
    const pieces = (on: boolean) => {
      whole.style.display = on ? "none" : "";
      for (const p of [body, far, near]) p.style.display = on ? "" : "none";
    };
    gsap.set(m, { transformOrigin: "0 0", color: STEEL });

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
    const rest = { x: 0, y: 0, scale: 1 };
    const flyIn = () => {
      const { g } = geometry();
      return flightRoute({ ...g, from: rest, to: rest, start: ENTER_PATH[0], via: ENTER_PATH.slice(1), duration: 2.6, ease: "out", facing: 180 });
    };
    const flyOut = () => {
      const { r, g } = geometry();
      // away: beyond the left edge, high in the sky
      const end: [number, number] = [-g.width, window.innerHeight * 0.14];
      const to = { x: end[0] - r.left - g.centre[0], y: end[1] - r.top - g.centre[1], scale: 1 };
      return flightRoute({ ...g, from: rest, to, via: LEAVE_PATH, duration: 2.4 });
    };

    let dead = false;
    let tween: gsap.core.Tween | null = null;
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
    const wait = (s: number) => new Promise<void>((ok) => (tween = gsap.delayedCall(s, ok) as unknown as gsap.core.Tween));
    const play = (route: ReturnType<typeof flightRoute>) =>
      new Promise<void>((ok) => {
        const draw = (t: number) => {
          const at = route.at(t);
          gsap.set(m, { x: at.x, y: at.y, scale: at.scale });
          body.setAttribute("d", at.pose.body);
          far.setAttribute("d", at.pose.far);
          near.setAttribute("d", at.pose.near);
          pieces(!at.done);
        };
        draw(0);
        const clock = { t: 0 };
        tween = gsap.to(clock, {
          t: route.total,
          duration: route.total,
          ease: "none",
          onUpdate: () => draw(clock.t),
          onComplete: () => {
            pieces(false);
            ok();
          },
        });
      });

    (async () => {
      await onScreen();
      if (dead) return;
      b.classList.remove("is-waiting");
      while (!dead) {
        const inn = flyIn();
        gsap.set(m, { color: STEEL });
        gsap.to(m, { color: CLOUD, duration: 0.7, delay: Math.max(0, inn.total - 0.8), ease: "sine.inOut" });
        await play(inn);
        await wait(REST_S);
        await onScreen();
        if (dead) return;
        gsap.to(m, { color: STEEL, duration: 0.5, ease: "sine.inOut" });
        await play(flyOut());
        await wait(AWAY_S);
        await onScreen();
      }
    })();

    return () => {
      dead = true;
      io.disconnect();
      tween?.kill();
      gsap.killTweensOf(m);
    };
  }, [box, mark]);
}

export function Footer() {
  const root = useRef<HTMLElement>(null);
  const lockup = useRef<HTMLDivElement>(null);
  const mark = useRef<SVGSVGElement>(null);
  useReveals(root);
  useBird(lockup, mark);

  return (
    <footer ref={root} id="footer" data-theme-zone="light" data-theme-at="top 35%" className="fo">
      <DitherEdge color="#eff4ff" />
      <span className="fo-dots" aria-hidden="true" />

      {/* the sky */}
      <div className="fo-sky">
        <div className="fo-say" data-reveal>
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
        </div>
        <div className="fo-cols" data-reveal>
          {COLS.map((c) => (
            <nav key={c.h} aria-label={c.h} data-up>
              <p className="fo-h">{c.h}</p>
              <ul>
                {c.items.map((it) => (
                  <li key={it.label}>
                    <FLink {...it} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
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
          <Label />
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
        </div>

        <div className="fo-bottom">
          {/* DRAFT: Natalia to confirm the wording */}
          <p>Venty is a design concept by Natalia Chamon for the QUT Design Festival 2026. The app is a demo, and the patterns it shows are examples.</p>
          <p>© 2026 Natalia Chamon</p>
        </div>
      </div>
    </footer>
  );
}
