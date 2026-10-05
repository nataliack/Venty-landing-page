"use client";

import { useEffect, useId, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { VOTE_LINKS } from "@/lib/site";
import { DUR, EASE, afterLoader } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

/* Vote for Venty: a tab on the right edge of the screen. Click it and a
   panel slides out with the QUT Design Festival People's Choice Award and a
   link per discipline (IxD, VisCom). Click again, click anywhere else or
   press Escape to tuck it away.

   Tab and panel are one strip; closed, the strip is pushed right by the
   panel's width so only the tab shows (.vote in globals.css).

   Entrance, once the loader has gone: the strip slides in from off screen,
   the label writes itself in, and the QUT mark builds: the four bars drop
   in from the top, left to right; halfway through, the square fades in;
   then Q, U and T rise into place. Hovering the tab replays the bars (they
   pull up, then drop again). */

/* Where the tab tucks away off the right edge, by element (any selector)
   and screen: "phone" (under 768px), "desktop" (768px and up) or "all".
   While one of these is across the middle of the screen, the tab hides on
   that screen. Add, remove or change a line to show or hide it per
   section. */
const HIDE: [selector: string, on: "phone" | "desktop" | "all"][] = [
  ["#hero-end", "phone"], // phones: from the end of the hero sequence
  ["#photo", "phone"],
  ["#how", "phone"],
  ["#features", "phone"],
  ["#make", "phone"],
  ["#made", "phone"],
  ["#faq", "phone"],
  ["#maker", "phone"],
  ["#table", "phone"],
  ["footer", "phone"],
];

/* The QUT mark, in parts so it can build: four bars, the square, and the
   letters Q, U and T (the original artwork, with Q and T split apart) */
function QutMark() {
  return (
    <svg
      width="26"
      height="37"
      viewBox="0 0 26 37"
      fill="none"
      aria-hidden="true"
      className="vote__mark"
    >
      <path data-qut-bar d="M0 0H5V9H0V0Z" fill="#121524" />
      <path data-qut-bar d="M7 0H12V9H7V0Z" fill="#121524" />
      <path data-qut-bar d="M14 0H19V9H14V0Z" fill="#121524" />
      <path data-qut-bar d="M21 0H26V9H21V0Z" fill="#121524" />
      <path data-square d="M26 11H0V37H26V11Z" fill="#121524" />
      <path
        data-letter
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.1214 21.0366L12.1541 23.1073H9.41703L4.94896 18.4433H7.58699L8.29184 19.1672C8.39318 18.9312 8.45953 18.6624 8.45953 18.2579C8.45953 16.8268 7.2498 15.7324 5.87329 15.7324C4.49588 15.7324 3.38704 16.9111 3.38704 18.2911C3.38704 19.6725 4.51269 20.8174 5.92374 20.8174C6.0737 20.8174 6.21231 20.8165 6.37636 20.7673C6.40045 20.7596 8.22185 22.7273 8.20731 22.7369C7.68788 23.1069 6.69674 23.2927 5.92374 23.2927C3.20254 23.2927 1.0862 20.9683 1.0862 18.3248C1.0862 15.6814 3.23662 13.459 5.99008 13.459C8.74491 13.459 10.9117 15.6978 10.9117 18.426C10.9271 19.5208 10.3909 20.6489 10.1214 21.0366Z"
        fill="#9DACCD"
      />
      <path
        data-letter
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.3875 13.5292L11.3912 20.5114C11.3912 21.0025 11.991 23.26 15.1022 23.26C18.2133 23.26 18.7086 21.0094 18.7086 20.5291V16.5371L16.3237 14.0313V20.2699C16.3237 20.3957 16.3319 21.0294 15.0935 21.0294C13.8084 21.0294 13.8084 20.4048 13.8084 20.2535V13.5338L11.3875 13.5292Z"
        fill="#9DACCD"
      />
      <path
        data-letter
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.5554 13.5114L18.8276 15.8705H20.4723V23.0941H22.954V15.8705H24.8717V13.5105L16.5554 13.5114Z"
        fill="#9DACCD"
      />
    </svg>
  );
}

function Arrow() {
  return (
    <span className="vote__arrow" aria-hidden="true">
      {/* two arrows: on hover the first flies out right, the second follows in */}
      <svg viewBox="0 0 10 9" fill="none">
        <path
          d="M0 4.5h8.5M5 1l3.5 3.5L5 8"
          stroke="currentColor"
          strokeWidth="1.1"
        />
      </svg>
      <svg viewBox="0 0 10 9" fill="none">
        <path
          d="M0 4.5h8.5M5 1l3.5 3.5L5 8"
          stroke="currentColor"
          strokeWidth="1.1"
        />
      </svg>
    </span>
  );
}

export function VoteTab() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const tabRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  // close on a click elsewhere or Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // tucked away while a section in HIDE is across the middle of the screen
  useEffect(() => {
    const phone = window.matchMedia("(max-width: 767px)");
    const active = new Set<number>();
    const update = () => {
      const screen = phone.matches ? "phone" : "desktop";
      const hide = [...active].some(
        (i) => HIDE[i][1] === "all" || HIDE[i][1] === screen,
      );
      setHidden(hide);
      if (hide) setOpen(false);
    };
    const triggers = HIDE.flatMap(([selector], i) => {
      const target = document.querySelector(selector);
      if (!target) return [];
      return [
        ScrollTrigger.create({
          trigger: target,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => {
            if (self.isActive) active.add(i);
            else active.delete(i);
            update();
          },
        }),
      ];
    });
    phone.addEventListener("change", update);
    return () => {
      triggers.forEach((t) => t.kill());
      phone.removeEventListener("change", update);
    };
  }, []);

  // entrance, then the hover replay
  useEffect(() => {
    const el = ref.current;
    const tab = tabRef.current;
    if (!el || !tab) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let ready = false; // hover replays only once the entrance is done
    let replay: gsap.core.Timeline | null = null;
    let stop = () => {};

    const ctx = gsap.context(() => {
      const bars = gsap.utils.toArray<SVGPathElement>("[data-qut-bar]", tab);
      const letters = gsap.utils.toArray<SVGPathElement>("[data-letter]", tab);
      // each bar grows from its own top edge
      gsap.set(bars, { transformOrigin: "50% 0%" });

      if (still) {
        el.dataset.ready = "true";
        ready = true;
        return;
      }

      // the entrance moves the inner strip, so the outer one keeps its CSS
      // positions (closed, open, tucked away) untouched by GSAP
      gsap.set(".vote__strip", { x: () => el.offsetWidth + 24 });
      gsap.set(".vote__label", { clipPath: "inset(0% 0% 100% 0%)" });
      gsap.set(bars, { scaleY: 0 });
      gsap.set("[data-square]", { opacity: 0 });
      gsap.set(letters, { opacity: 0, y: 4 });
      el.dataset.ready = "true";

      const BAR = 0.5; // one bar's drop
      const STAGGER = 0.1;
      const barsEnd = BAR + STAGGER * (bars.length - 1);
      const mark = gsap
        .timeline()
        .to(
          bars,
          { scaleY: 1, duration: BAR, stagger: STAGGER, ease: "power3.out" },
          0,
        )
        // halfway through the bars, the square fades in
        .to(
          "[data-square]",
          { opacity: 1, duration: 0.5, ease: "power1.out" },
          barsEnd / 2,
        )
        // then Q, U, T rise into place
        .to(
          letters,
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.09,
            ease: "power3.out",
          },
          barsEnd / 2 + 0.35,
        );

      const entrance = gsap
        .timeline({ paused: true, onComplete: () => (ready = true) })
        .to(".vote__strip", { x: 0, duration: DUR.reveal, ease: EASE.out }, 0)
        .to(
          ".vote__label",
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 0.9,
            ease: "power3.inOut",
          },
          0.35,
        )
        .add(mark, 0.45);

      // joins the hero's opening once its title is up (Hero.tsx)
      stop = afterLoader(() => entrance.delay(0.6).restart(true));
    }, el);

    // Hover: the bars pull up into the top edge, then drop again, in the
    // same left to right stagger. A replay always runs to the end (bars
    // fully down); hovering again while one runs is ignored, so fast
    // in-and-out never leaves a bar half grown.
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !ready || still) return;
      if (replay?.isActive()) return;
      const bars = tab.querySelectorAll("[data-qut-bar]");
      replay?.kill();
      replay = gsap
        .timeline()
        .to(bars, {
          scaleY: 0,
          duration: 0.24,
          stagger: 0.06,
          ease: "power2.in",
        })
        .to(
          bars,
          { scaleY: 1, duration: 0.45, stagger: 0.08, ease: "power3.out" },
          ">-0.08",
        );
    };
    tab.addEventListener("pointerenter", onEnter);

    return () => {
      stop();
      tab.removeEventListener("pointerenter", onEnter);
      replay?.kill();
      ctx.revert();
    };
  }, []);

  return (
    <aside
      ref={ref}
      className="vote"
      data-open={open}
      data-hidden={hidden}
      aria-label="Vote for Venty"
      inert={hidden}
    >
      <div className="vote__strip">
        <button
          ref={tabRef}
          type="button"
          className="vote__tab"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
        >
          <QutMark />
          <span className="vote__label">Vote for Venty</span>
        </button>

        <div id={panelId} className="vote__panel" inert={!open}>
          <p className="vote__head">
            <span className="vote__title">QUT Design Festival</span>
            <span className="vote__sub">People&apos;s Choice Award</span>
          </p>
          <ul className="vote__links">
            {VOTE_LINKS.map((l) => (
              <li key={l.label}>
                {l.href ? (
                  <a
                    className="vote__link"
                    href={l.href}
                    target="_blank"
                    rel="noopener"
                  >
                    <span className="vote__text">{l.label}</span>
                    <Arrow />
                  </a>
                ) : (
                  // no voting page yet: looks and moves like the link, goes nowhere
                  <a
                    className="vote__link"
                    role="link"
                    aria-disabled="true"
                    tabIndex={0}
                    title="Link coming soon"
                  >
                    <span className="vote__text">{l.label}</span>
                    <Arrow />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
