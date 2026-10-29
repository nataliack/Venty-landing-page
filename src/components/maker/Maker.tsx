"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DitherEdge } from "../DitherEdge";
import { LogoMark, Wordmark } from "../Logo";
import { LINKEDIN_URL, MAKER_EMAIL, MAKER_URL } from "@/lib/site";
import { useReveals } from "@/lib/useReveals";
import "./maker.css";

gsap.registerPlugin(ScrollTrigger);

/* 8. The designer (dark). The heading first, in one line, then her things
   laid out on the table as a flat lay: in the middle a Venty pattern
   envelope with her on the front (a printed photograph, her name, the
   pattern's details), its tissue pattern sheet behind it, her two business
   cards (her own cream "nck" card and the dark Venty card) and the tailor's
   chalk (the brand board's objects: pattern paper, the chalk, the cards).
   They lie in a tray built as the app's pattern tray, in the dark: a rim
   raised round a surface pressed into it, with the grid.

   As the section comes up, the things slide onto the table, and stay there.
   The cards turn over only when she wants: tap a card, or its Turn button
   under the tray (the app's dark secondary, with its turn icon); each tap
   spins it over, and the next back.

   Then her profile, built as the app's About Venty in the dark: a raised
   card; a pressed label (Founder of Venty, the bird on a raised knob), her
   name and her words; and Reach her, rows pressed into the card (an inset
   icon tile, the words, a chevron). Her photograph is on the envelope only.

   The objects are paper: the grain is /texture/paper.webp, the shadows are
   layered as on a table under a soft light. (No 3D lean towards the
   pointer: in Safari it moved the cards out from under a click.)

   IMAGES: /maker/natalia-portrait.webp (her, cut out, graded cool, printed
   on the envelope over a cornflower backdrop);
   /maker/cards/*.webp (the cards' faces, saved from the app's cards screen).
   DRAFT copy: Natalia to confirm her words before launch. */

const DETAILS = [
  ["Designer", "Natalia Chamon"],
  ["Studies", "Interaction Design, QUT"],
  ["Based in", "Brisbane"],
  ["Fit", "Made to measure"],
];

const REACH: {
  label: string;
  value: string;
  href: string;
  icon: React.ReactNode;
}[] = [
  {
    label: "Portfolio",
    value: "nataliachamon.com",
    href: MAKER_URL,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="8.5" />
        <path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5M12 3.5C9.6 5.9 8.4 8.7 8.4 12s1.2 6.1 3.6 8.5" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    value: "linkedin.com/in/natalia-c",
    href: LINKEDIN_URL,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm6.5 0h3.84v1.5h.05c.53-1 1.84-1.75 3.4-1.75 3.63 0 4.21 2.27 4.21 5.22v6.03h-4v-5.35c0-1.28-.02-2.92-1.78-2.92-1.79 0-2.06 1.39-2.06 2.83v5.44H9.5v-11Z" />
      </svg>
    ),
  },
  {
    label: "Email",
    value: MAKER_EMAIL,
    href: `mailto:${MAKER_EMAIL}`,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <rect x="3" y="5.5" width="18" height="13" rx="2" />
        <path d="m4 7 8 6 8-6" strokeLinejoin="round" />
      </svg>
    ),
  },
];

type Side = "venty" | "natalia";
const CARDS: Record<Side, { label: string; turn: string }> = {
  venty: {
    label: "Natalia's Venty business card: Natalia Chamon, Founder, Venty",
    turn: "Turn the Venty card",
  },
  natalia: {
    label:
      "Natalia's own business card: Natalia Chamon, UI/UX design and front-end",
    turn: "Turn her card",
  },
};

/* a card: lies face up; each tap spins it over, and back. GSAP turns it
   with its own perspective (so no browser flattens it): up off the table
   and edge on, the other face swapped in there, then down on its new side
   with a small settle. No backface-visibility, which some browsers drop */
function Card({
  name,
  over,
  onTurn,
}: {
  name: Side;
  over: boolean;
  onTurn: () => void;
}) {
  const flip = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(over); // the face showing
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = flip.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(over);
      return;
    }
    const tl = gsap
      .timeline()
      .to(el, {
        rotationY: 90,
        scale: 1.08,
        y: -10,
        transformPerspective: 900,
        duration: 0.24,
        ease: "power2.in",
      })
      .call(() => setShown(over))
      .fromTo(
        el,
        { rotationY: -90 },
        {
          rotationY: 0,
          scale: 1,
          y: 0,
          transformPerspective: 900,
          duration: 0.42,
          ease: "back.out(1.7)",
        },
      );
    return () => {
      tl.kill();
    };
  }, [over]);
  return (
    <button
      type="button"
      className={`mk-card is-${name}`}
      aria-label={`${CARDS[name].label}. Turn it over`}
      aria-pressed={over}
      onClick={onTurn}
    >
      <span ref={flip} className={`mk-card__flip${shown ? " is-back" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/maker/cards/${name}-front.webp`}
          alt=""
          className="mk-card__face is-front"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/maker/cards/${name}-back.webp`}
          alt=""
          className="mk-card__face is-back"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      </span>
    </button>
  );
}

/* the app's turn icon: two arcs, each ending in a chevron that follows its curve */
function TurnIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.5 10a8 8 0 0 1 14.3-3.5M19.5 14a8 8 0 0 1-14.3 3.5" />
      <path d="M19 3v3.8h-3.8M5 21v-3.8h3.8" />
    </svg>
  );
}

export function Maker() {
  const root = useRef<HTMLElement>(null);
  const desk = useRef<HTMLDivElement>(null);
  const [over, setOver] = useState<Record<Side, boolean>>({
    venty: false,
    natalia: false,
  });
  const turn = (c: Side) => setOver((o) => ({ ...o, [c]: !o[c] }));
  useReveals(root);

  useEffect(() => {
    const el = desk.current;
    const sec = root.current;
    if (
      !el ||
      !sec ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const q = gsap.utils.selector(el);

    // onto the table: the envelope settles, the tissue slides out from under
    // it, the cards come in from either side, the chalk last
    const lay = (tl: gsap.core.Timeline) =>
      tl
        .fromTo(
          q(".mk-env"),
          { y: 160, rotate: -10 },
          { y: 0, rotate: -3, duration: 0.5 },
          0,
        )
        .fromTo(
          q(".mk-tissue"),
          { xPercent: -24, yPercent: 14, rotate: -4 },
          { xPercent: 0, yPercent: 0, rotate: 6, duration: 0.5 },
          0.25,
        )
        .fromTo(
          q(".mk-card.is-natalia"),
          { x: -320, y: 120, rotate: -24 },
          { x: 0, y: 0, rotate: -9, duration: 0.55 },
          0.15,
        )
        .fromTo(
          q(".mk-card.is-venty"),
          { x: 320, y: -60, rotate: 26 },
          { x: 0, y: 0, rotate: 8, duration: 0.55 },
          0.2,
        )
        .fromTo(
          q(".mk-chalk"),
          { x: 120, rotate: 50, opacity: 0 },
          { x: 0, rotate: 14, opacity: 1, duration: 0.4 },
          0.45,
        );
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      lay(
        gsap.timeline({
          defaults: { ease: "power2.inOut" },
          scrollTrigger: {
            trigger: el,
            start: "top 95%",
            end: "top 30%",
            scrub: 0.8,
          },
        }),
      );
    });
    mm.add("(max-width: 1023px)", () => {
      lay(
        gsap.timeline({
          defaults: { ease: "power2.inOut" },
          scrollTrigger: {
            trigger: el,
            start: "top 95%",
            end: "center 60%",
            scrub: 0.8,
          },
        }),
      );
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={root}
      id="maker"
      data-nav="The designer"
      data-wing="spread"
      data-theme-zone="dark"
      data-theme-at="top 35%"
      className="mk"
      aria-labelledby="mk-title"
    >
      <DitherEdge color="#0b0c15" />
      <div className="mk-paper" aria-hidden="true" />
      <div className="mk-glow" aria-hidden="true" />

      <div className="mk-stage">
        <h2 id="mk-title" className="mk-title" data-reveal="top 92%">
          <span className="line-mask">
            <span data-rise className="block">
              The person <em>behind Venty.</em>
            </span>
          </span>
        </h2>

        <div className="mk-tray">
          <div className="mk-table">
            <div className="mk-fit">
              <div ref={desk} className="mk-desk">
                {/* the tissue pattern sheet, printed with a bodice front */}
                <div className="mk-tissue" aria-hidden="true">
                  <svg viewBox="0 0 300 380" className="mk-tissue__print">
                    <path
                      className="is-cut"
                      d="M70 34 Q118 52 150 50 L214 30 L236 104 Q222 150 232 196 L246 346 L58 346 L70 196 Q52 150 66 104 Z"
                    />
                    <path
                      className="is-seam"
                      d="M82 50 Q120 66 150 64 L206 46 L222 106 Q210 150 220 196 L232 332 L72 332 L84 196 Q68 150 80 104 Z"
                    />
                    <path
                      className="is-grain"
                      d="M150 120 V290 M144 120 H156 M144 290 H156"
                    />
                    <path
                      className="is-notch"
                      d="M66 160 l-8 0 M232 160 l8 0 M150 346 l0 8"
                    />
                  </svg>
                  <span className="mk-tissue__label">
                    <b>Bodice front</b>
                    Cut 2 · Venty
                  </span>
                </div>

                {/* the envelope, her on the front */}
                <figure className="mk-env">
                  <div className="mk-env__top">
                    <Wordmark className="mk-env__word" />
                    <span className="mk-env__no">
                      Pattern <b>01</b>
                    </span>
                  </div>
                  <div className="mk-env__photo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/maker/natalia-portrait.webp"
                      alt="Natalia Chamon"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <figcaption className="mk-env__name">
                    Natalia <em>Chamon</em>
                  </figcaption>
                  <dl className="mk-env__details">
                    {DETAILS.map(([k, v]) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                </figure>

                <Card
                  name="venty"
                  over={over.venty}
                  onTurn={() => turn("venty")}
                />
                <Card
                  name="natalia"
                  over={over.natalia}
                  onTurn={() => turn("natalia")}
                />

                {/* tailor's chalk */}
                <svg
                  viewBox="0 0 80 74"
                  className="mk-chalk"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="mk-chalk-g" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#ffffff" />
                      <stop offset="0.55" stopColor="#e9edf7" />
                      <stop offset="1" stopColor="#c9d1e6" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M40 6 C44 6 46 8 48 11 L74 58 C77 64 74 68 67 68 L13 68 C6 68 3 64 6 58 L32 11 C34 8 36 6 40 6 Z"
                    fill="url(#mk-chalk-g)"
                  />
                  <path
                    d="M40 14 L66 60 L14 60 Z"
                    fill="none"
                    stroke="#ffffff"
                    strokeOpacity="0.7"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* turn either card over: the app's dark secondary in a track pressed into the page */}
        <div className="mk-turns" role="group" aria-label="Her business cards">
          {(["venty", "natalia"] as const).map((c) => (
            <button
              key={c}
              type="button"
              className="mk-turn"
              aria-pressed={over[c]}
              onClick={() => turn(c)}
            >
              <TurnIcon />
              {CARDS[c].turn}
            </button>
          ))}
        </div>
      </div>

      {/* her profile, as the app's About Venty: a raised card */}
      <article className="mk-profile" data-reveal>
        <div className="mk-profile__main">
          <div className="mk-profile__who">
            <span data-up className="mk-label">
              <span className="mk-label__knob" aria-hidden="true">
                <LogoMark />
              </span>
              Founder of Venty
            </span>
            <h3 data-up className="mk-profile__name">
              Natalia Chamon
            </h3>
            <p data-up className="mk-profile__where">
              Interaction Design, QUT · Brisbane, Australia
            </p>
          </div>
          <div className="mk-profile__cols">
            <div className="mk-profile__words">
              <p data-lines className="mk-lead">
                Hi, I&apos;m Natalia. I designed and built Venty for my final
                year at QUT.
              </p>
              <p data-lines className="mk-story">
                Sewing patterns are drafted for a standard body, so most makes
                start with redrafting. Venty starts with your measurements
                instead, and drafts every piece around them.
              </p>
              <p data-lines className="mk-story">
                The name comes from the Italian venti, twenty. We wear about 20%
                of our clothes 80% of the time, so Venty is for making fewer
                pieces that fit, and that you will actually wear.
              </p>
            </div>
            <div className="mk-reach">
              <h3 data-up className="mk-reach__t">
                Reach her
              </h3>
              <ul data-up className="mk-reach__list">
                {REACH.map((r) => (
                  <li key={r.label}>
                    <a
                      href={r.href}
                      className="mk-row"
                      {...(r.href.startsWith("http")
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      <span className="mk-row__tile">{r.icon}</span>
                      <span className="mk-row__text">
                        <span className="mk-row__k">{r.label}</span>
                        <span className="mk-row__v">{r.value}</span>
                      </span>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="mk-row__chev"
                        aria-hidden="true"
                      >
                        <path
                          d="m9 6 6 6-6 6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {r.href.startsWith("http") && (
                        <span className="sr-only">(opens in a new tab)</span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
