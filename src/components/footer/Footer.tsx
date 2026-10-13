"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { DitherEdge } from "../DitherEdge";
import { PrimaryButton } from "../PrimaryButton";
import { QutMark } from "../VoteTab";
import { Halftone } from "../maker/Halftone";
import { scrollToElement } from "../SmoothScroll";
import { APP_URL, CONTACT_URL, CTA_LABEL, FESTIVAL_AT, FOOTER_MEDIA, LEGAL_LINKS, MAKER_URL, VOTE_LINKS } from "@/lib/site";
import { ENTER_PATH, MARK, MARK_BOUNDS, MARK_CENTRE, flightRoute } from "@/lib/markFlight";
import { LOCKUP, WORD } from "@/lib/lockup";
import { useCountdown } from "@/lib/useCountdown";
import { useReveals } from "@/lib/useReveals";
import "./footer.css";

/* The footer (light). A sky that ends in a meadow: Jose's field of
   cornflowers under misty hills (FOOTER_MEDIA, or the still), its top fading
   into the cloud above. It rises over the held end of the closing scene with
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
   place, the end of the journey it started at the top of the page. */

type L = { label: string; href: string };
const COLS: { h: string; items: L[] }[] = [
  {
    h: "The page",
    items: [
      { label: "Made to measure", href: "#measure" },
      { label: "How it works", href: "#how" },
      { label: "Features", href: "#features" },
      { label: "What you can make", href: "#make" },
      { label: "Made with Venty", href: "#made" },
    ],
  },
  {
    h: "More",
    items: [
      { label: "FAQ", href: "#faq" },
      { label: "Meet the maker", href: "#maker" },
      { label: "Contact", href: CONTACT_URL },
    ],
  },
  { h: "Legal", items: LEGAL_LINKS },
];

/* along the curve over the hills: the announcement bar's lines */
const DRIFT = "Your body is the pattern · No sizes, just measurements · Sketch it. Say it. Sew it. · From screen to scissors · Pin it. Cut it. Wear it. · ";

const isVideo = (s: string) => /\.(mp4|webm|mov)$/i.test(s);
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

/* ---- the lockup, and the bird landing in it ------------------------------ */
function useLanding(box: React.RefObject<HTMLDivElement | null>, mark: React.RefObject<SVGSVGElement | null>) {
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
    let tween: gsap.core.Tween | null = null;
    const fly = () => {
      // where it lands: its place in the lockup (the mark's svg fills the
      // lockup's box exactly); the way in is the loading screen's, on this screen
      const r = b.getBoundingClientRect();
      const u = r.width / 2132;
      const rest = { x: 0, y: 0, scale: 1 };
      const route = flightRoute({
        origin: [r.left, r.top],
        centre: [MARK_CENTRE[0] * u, MARK_CENTRE[1] * u],
        width: MARK_BOUNDS.width * u,
        frame: { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight },
        from: rest,
        to: rest,
        start: ENTER_PATH[0],
        via: ENTER_PATH.slice(1),
        duration: 2.6,
        ease: "out",
        facing: 180,
      });
      gsap.set(m, { transformOrigin: "0 0" });
      const draw = (t: number) => {
        const at = route.at(t);
        gsap.set(m, { x: at.x, y: at.y, scale: at.scale });
        body.setAttribute("d", at.pose.body);
        far.setAttribute("d", at.pose.far);
        near.setAttribute("d", at.pose.near);
        pieces(!at.done);
      };
      draw(0);
      b.classList.remove("is-waiting");
      const clock = { t: 0 };
      tween = gsap.to(clock, { t: route.total, duration: route.total, ease: "none", onUpdate: () => draw(clock.t), onComplete: () => pieces(false) });
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        fly();
      },
      { threshold: 0.55 },
    );
    io.observe(b);
    return () => {
      io.disconnect();
      tween?.kill();
    };
  }, [box, mark]);
}

export function Footer() {
  const root = useRef<HTMLElement>(null);
  const lockup = useRef<HTMLDivElement>(null);
  const mark = useRef<SVGSVGElement>(null);
  useReveals(root);
  useLanding(lockup, mark);

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
        <div className="fo-media" aria-hidden="true">
          {FOOTER_MEDIA && isVideo(FOOTER_MEDIA) ? (
            <video src={FOOTER_MEDIA} autoPlay muted loop playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={FOOTER_MEDIA || "/footer/meadow.webp"}
              srcSet={FOOTER_MEDIA ? undefined : "/footer/meadow-1200.webp 1200w, /footer/meadow.webp 2000w"}
              sizes="100vw"
              alt=""
              loading="lazy"
              decoding="async"
            />
          )}
        </div>

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
          <p>Brisbane, Australia. A QUT capstone project.</p>
          <p>© 2026 Venty</p>
        </div>
      </div>
    </footer>
  );
}
