"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { DitherEdge } from "../DitherEdge";
import { PrimaryButton } from "../PrimaryButton";
import { QutMark } from "../VoteTab";
import { Halftone } from "../maker/Halftone";
import { scrollToElement } from "../SmoothScroll";
import { APP_URL, CTA_LABEL, FESTIVAL_AT, MAKER_URL, SOCIAL_LINKS, VOTE_LINKS } from "@/lib/site";
import { FOOTER_IN, FOOTER_IN_NARROW, FOOTER_OUT, FOOTER_OUT_NARROW, MARK, MARK_BOUNDS, MARK_CENTRE, flightRoute, type Place } from "@/lib/markFlight";
import { LOCKUP, WORD } from "@/lib/lockup";
import { useCountdown } from "@/lib/useCountdown";
import { useReveals } from "@/lib/useReveals";
import "./footer.css";

/* The footer (light). A sky that ends in a meadow: Jose's field of
   cornflowers under misty hills, the grass moving in the wind (a video, on
   a seamless loop; Meadow below), its top fading into the cloud above, and
   banks of fog drifting slowly over the hills. It rises over the held end
   of the closing scene with the site's edge.

   In the sky, one centred column: the line, the page's sections, Natalia's
   socials (each with its icon), then the button.
   On the horizon, level, two panels of frosted glass (the Made to measure
   composer's): Made by Natalia (her portrait in dots in a night arch, as in
   The designer) and Vote for Venty (the QUT mark, its bars coming down from
   the panel's top edge; the People's Choice Award, the days to the
   festival, a link to vote per discipline).
   Over the flowers: the Venty lockup in white. Its bird comes and goes,
   left to right (useBird), cornflower while it flies and white like the
   wordmark while it rests in it. */

type L = { label: string; href: string };
const SECTIONS: L[] = [
  { label: "Made to measure", href: "#measure" },
  { label: "How it works", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "What you can make", href: "#make" },
  { label: "On the line", href: "#made" },
  { label: "FAQ", href: "#faq" },
];

const pad = (n: number) => String(n).padStart(2, "0");

function FLink({ label, href }: L) {
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

/* ---- Natalia's socials, each with its icon -------------------------------- */
const ICONS: Record<(typeof SOCIAL_LINKS)[number]["icon"], React.ReactNode> = {
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm6.5 0h3.84v1.5h.05c.53-1 1.84-1.75 3.4-1.75 3.63 0 4.21 2.27 4.21 5.22v6.03h-4v-5.35c0-1.28-.02-2.92-1.78-2.92-1.79 0-2.06 1.39-2.06 2.83v5.44H9.5v-11Z" />
    </svg>
  ),
  email: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5.5" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.6 3.75h2.2l1.4 4.1-1.8 1.4a12 12 0 0 0 6.35 6.35l1.4-1.8 4.1 1.4v2.2a1.85 1.85 0 0 1-2 1.85C10.9 18.85 5.15 13.1 4.75 5.75a1.85 1.85 0 0 1 1.85-2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

function Socials() {
  return (
    <ul data-up className="fo-social" aria-label="Natalia's socials">
      {SOCIAL_LINKS.map((s) => (
        <li key={s.label}>
          {s.href ? (
            <a href={s.href} className="fo-icon" {...(/^(mailto|tel):/.test(s.href) ? {} : { target: "_blank", rel: "noopener noreferrer" })}>
              {ICONS[s.icon]}
              <span>{s.label}</span>
            </a>
          ) : (
            // not given yet: shows, goes nowhere
            <a role="link" aria-disabled="true" title="Coming soon" className="fo-icon">
              {ICONS[s.icon]}
              <span>{s.label}</span>
            </a>
          )}
        </li>
      ))}
    </ul>
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

/* the fog over the hills: three banks of mist (one texture, tools/footer/fog.cjs,
   seamless left to right), drifting at different heights, sizes and speeds,
   each band faded out above and below */
function Fog() {
  return (
    <div className="fo-fog" aria-hidden="true">
      <span className="fo-fog__bank is-far" />
      <span className="fo-fog__bank is-mid" />
      <span className="fo-fog__bank is-near" />
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
        {/* its four bars come down from the panel's top edge */}
        <QutMark reach={30} />
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
/* While the lockup is on screen the bird comes and goes, always left to
   right, the way it faces (so it never turns round): it glides in from
   beyond the left edge (FOOTER_IN) onto its place in the lockup, keeping
   its speed until a short flare at the end, as a bird lands; rests; lifts
   away beyond the right edge (FOOTER_OUT), slow off the ground and
   building speed, and after a while comes in
   from the left again. It flies over the sky's words and behind the panels.
   Cornflower in the air; as it settles it turns the wordmark's white, and
   back to cornflower as it lifts off. Each flight is planned from where
   everything is as it starts. */
const REST_S = 7; // resting in the lockup
const AWAY_S = 4; // gone, before it comes back
const CORN = "#687ef5";
const CLOUD = "#eff4ff";

type Route = ReturnType<typeof flightRoute>;

function useBird(box: React.RefObject<HTMLDivElement | null>, mark: React.RefObject<SVGSVGElement | null>) {
  useEffect(() => {
    const b = box.current;
    const m = mark.current;
    if (!b || !m) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      b.classList.remove("is-waiting");
      gsap.set(m, { color: CLOUD });
      return;
    }
    const whole = m.querySelector<SVGPathElement>("[data-whole]")!;
    const parts = ["body", "far", "near"].map((k) => m.querySelector<SVGPathElement>(`[data-piece="${k}"]`)!);
    gsap.set(m, { transformOrigin: "0 0", color: CORN });

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
    // phones and tablets: the lockup sits low on a short screen, so the
    // flights stay low and close to it
    const narrow = () => window.innerWidth < 1024;
    const flyIn = () => {
      const { g } = geometry();
      const path = narrow() ? FOOTER_IN_NARROW : FOOTER_IN;
      return flightRoute({ ...g, from: rest, to: rest, start: path[0], via: path.slice(1), duration: narrow() ? 1.7 : 2.1, ease: "land", facing: 0 });
    };
    const flyOut = () => {
      const { r, g } = geometry();
      // away beyond the right edge: high in the sky, or just above the
      // lockup on a narrow screen
      const y = narrow() ? r.top + g.centre[1] - g.width * 0.9 : window.innerHeight * 0.1;
      const to: Place = { x: window.innerWidth + g.width - r.left - g.centre[0], y: y - r.top - g.centre[1], scale: 1 };
      return flightRoute({ ...g, from: rest, to, via: narrow() ? FOOTER_OUT_NARROW : FOOTER_OUT, duration: narrow() ? 2 : 2.6, ease: "launch", facing: 0 });
    };

    let dead = false;
    let tween: gsap.core.Tween | null = null;
    const draw = (route: Route, t: number) => {
      const at = route.at(t);
      gsap.set(m, { x: at.x, y: at.y, scale: at.scale });
      parts[0].setAttribute("d", at.pose.body);
      parts[1].setAttribute("d", at.pose.far);
      parts[2].setAttribute("d", at.pose.near);
      whole.style.display = at.done ? "" : "none";
      for (const p of parts) p.style.display = at.done ? "none" : "";
    };
    const fly = (route: Route) =>
      new Promise<void>((ok) => {
        draw(route, 0);
        const clock = { t: 0 };
        tween = gsap.to(clock, { t: route.total, duration: route.total, ease: "none", onUpdate: () => draw(route, clock.t), onComplete: () => (draw(route, route.total), ok()) });
      });
    const pause = (s: number) => new Promise<void>((ok) => (tween = gsap.delayedCall(s, ok) as unknown as gsap.core.Tween));

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

    (async () => {
      await onScreen();
      if (dead) return;
      b.classList.remove("is-waiting");
      while (!dead) {
        const inn = flyIn();
        gsap.set(m, { color: CORN });
        // it takes the wordmark's white as it settles
        gsap.to(m, { color: CLOUD, duration: 0.7, delay: Math.max(0, inn.total - 0.75), ease: "sine.inOut" });
        await fly(inn);
        if (dead) return;
        await pause(REST_S);
        await onScreen();
        if (dead) return;
        gsap.to(m, { color: CORN, duration: 0.5, ease: "sine.inOut" });
        await fly(flyOut());
        await pause(AWAY_S);
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

/* ---- the footer -------------------------------------------------------- */

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

      {/* the sky: one centred column. The line; then, closer together, where
          to go (the sections, the socials); then the button */}
      <div className="fo-sky" data-reveal>
        <p className="fo-line">
          <span className="line-mask">
            <span data-rise className="block">
              Sewing patterns
            </span>
          </span>
          <span className="line-mask">
            <span data-rise className="block">
              drafted to your <em>body.</em>
            </span>
          </span>
        </p>
        <nav data-up aria-label="Sections" className="fo-sections">
          <ul>
            {SECTIONS.map((it) => (
              <li key={it.label}>
                <FLink {...it} />
              </li>
            ))}
          </ul>
        </nav>
        <Socials />
        <div data-up className="fo-cta">
          <PrimaryButton href={APP_URL}>{CTA_LABEL}</PrimaryButton>
        </div>
      </div>

      {/* the land: the meadow, and what is on the horizon and over it */}
      <div className="fo-land">
        <Meadow />
        <Fog />

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
