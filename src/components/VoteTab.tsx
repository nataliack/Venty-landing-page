"use client";

import { useEffect, useId, useRef, useState } from "react";
import { VOTE_LINKS } from "@/lib/site";

/* Vote for Venty: a tab on the right edge of the screen, on every section.
   Click it and a panel slides out with the QUT Design Festival People's
   Choice Award and a link per discipline (IxD, VisCom). Click again, click
   anywhere else or press Escape to tuck it away.

   The tab and panel are one strip; closed, the strip is pushed right by the
   panel's width so only the tab shows. Hovering the closed tab draws it out
   a little, with the primary button's swirl inside. */

function QutMark() {
  return (
    <svg width="26" height="37" viewBox="0 0 26 37" fill="none" aria-hidden="true" className="vote__mark">
      <path d="M0 0H5V9H0V0Z" fill="#121524" />
      <path d="M21 0H26V9H21V0Z" fill="#121524" />
      <path d="M14 0H19V9H14V0Z" fill="#121524" />
      <path d="M7 0H12V9H7V0Z" fill="#121524" />
      <path d="M26 11H0V37H26V11Z" fill="#121524" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.3875 13.5292L11.3912 20.5114C11.3912 21.0025 11.991 23.26 15.1022 23.26C18.2133 23.26 18.7086 21.0094 18.7086 20.5291V16.5371L16.3237 14.0313V20.2699C16.3237 20.3957 16.3319 21.0294 15.0935 21.0294C13.8084 21.0294 13.8084 20.4048 13.8084 20.2535V13.5338L11.3875 13.5292Z"
        fill="#9DACCD"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.5554 13.5114L18.8276 15.8705H20.4723V23.0941H22.954V15.8705H24.8717V13.5105L16.5554 13.5114ZM10.1214 21.0366L12.1541 23.1073H9.41703L4.94896 18.4433H7.58699L8.29184 19.1672C8.39318 18.9312 8.45953 18.6624 8.45953 18.2579C8.45953 16.8268 7.2498 15.7324 5.87329 15.7324C4.49588 15.7324 3.38704 16.9111 3.38704 18.2911C3.38704 19.6725 4.51269 20.8174 5.92374 20.8174C6.0737 20.8174 6.21231 20.8165 6.37636 20.7673C6.40045 20.7596 8.22185 22.7273 8.20731 22.7369C7.68788 23.1069 6.69674 23.2927 5.92374 23.2927C3.20254 23.2927 1.0862 20.9683 1.0862 18.3248C1.0862 15.6814 3.23662 13.459 5.99008 13.459C8.74491 13.459 10.9117 15.6978 10.9117 18.426C10.9271 19.5208 10.3909 20.6489 10.1214 21.0366Z"
        fill="#9DACCD"
      />
    </svg>
  );
}

function Arrow() {
  return (
    <span className="vote__arrow" aria-hidden="true">
      {/* two arrows: on hover the first flies out up-right, the second follows in */}
      <svg viewBox="0 0 10 9" fill="none">
        <path d="M0 4.5h8.5M5 1l3.5 3.5L5 8" stroke="currentColor" strokeWidth="1.1" />
      </svg>
      <svg viewBox="0 0 10 9" fill="none">
        <path d="M0 4.5h8.5M5 1l3.5 3.5L5 8" stroke="currentColor" strokeWidth="1.1" />
      </svg>
    </span>
  );
}

export function VoteTab() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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

  return (
    <aside ref={ref} className="vote" data-open={open} aria-label="Vote for Venty">
      <button type="button" className="vote__tab" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((o) => !o)}>
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
                <a className="vote__link" href={l.href} target="_blank" rel="noreferrer">
                  <span className="vote__text">{l.label}</span>
                  <Arrow />
                </a>
              ) : (
                // no voting page yet: looks and moves like the link, goes nowhere
                <a className="vote__link" role="link" aria-disabled="true" tabIndex={0} title="Link coming soon">
                  <span className="vote__text">{l.label}</span>
                  <Arrow />
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
