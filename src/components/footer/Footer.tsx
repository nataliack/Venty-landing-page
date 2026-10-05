"use client";

import { useRef } from "react";
import { DitherEdge } from "../DitherEdge";
import { Sky } from "../Sky";
import { Wordmark } from "../Logo";
import { scrollToElement } from "../SmoothScroll";
import { CONTACT_URL, FOOTER_MEDIA, LEGAL_LINKS } from "@/lib/site";
import { useReveals } from "@/lib/useReveals";
import "./footer.css";

/* The footer (light, with a band of media). It rises over the held end of
   the closing scene with a light, wavering edge. On cloud: the line, and
   the links. Below, a band for a video or image (FOOTER_MEDIA in
   lib/site.ts; the light sky stands in until it exists), the wordmark
   across it and the bottom line. */

type L = { label: string; href: string };
const COLS: { h: string; items: L[] }[] = [
  {
    h: "Venty",
    items: [
      { label: "Made to measure", href: "#measure" },
      { label: "How it works", href: "#how" },
      { label: "Features", href: "#features" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    h: "About",
    items: [
      { label: "Meet the maker", href: "#maker" },
      { label: "Contact", href: CONTACT_URL },
    ],
  },
  { h: "Legal", items: LEGAL_LINKS },
];

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

const isVideo = (s: string) => /\.(mp4|webm|mov)$/i.test(s);

export function Footer() {
  const root = useRef<HTMLElement>(null);
  useReveals(root);

  return (
    <footer ref={root} id="footer" data-theme-zone="light" data-theme-at="top 35%" className="fo">
      <DitherEdge color="#eff4ff" pattern="squares" edge="wave" />
      <div className="fo-top" data-reveal>
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
        <div className="fo-cols">
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

      <div className="fo-band" data-reveal="top 90%">
        <div className="fo-media" aria-hidden="true">
          {FOOTER_MEDIA ? (
            isVideo(FOOTER_MEDIA) ? (
              <video src={FOOTER_MEDIA} autoPlay muted loop playsInline />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={FOOTER_MEDIA} alt="" loading="lazy" />
            )
          ) : (
            <Sky variant="light" />
          )}
          <span className="fo-media__dots" />
        </div>
        <div data-up className="fo-mark">
          <Wordmark className="fo-mark__svg" />
        </div>
        <div className="fo-bottom">
          <p>Brisbane, Australia. A QUT capstone project.</p>
          <p>© 2026 Venty</p>
        </div>
      </div>
    </footer>
  );
}
