"use client";

import { useEffect, useId, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReveals } from "@/lib/useReveals";
import "./faq.css";

gsap.registerPlugin(ScrollTrigger);

/* 7. FAQ (light). "Before you cut." The title holds on the left with a
   cutting line down beside the questions: a pair of scissors travels down
   it as you read. Each question is a pattern piece, notched on its edge;
   open one and its answer unfolds, its stitching line drawn along the top. */

const QA = [
  {
    q: "How accurate is the fit?",
    a: "As accurate as the measurements you give it. Venty drafts every piece from your numbers, and each measure shows where the tape goes. For anything close-fitting, sew a quick test version first, adjust your body in Venty and draft again.",
  },
  {
    q: "What can I make?",
    a: "Dresses, tops, trousers and skirts. Start from a photo or a few words, choose how close it should sit, and Venty drafts the pieces.",
  },
  {
    q: "Do I need to be an experienced sewist?",
    a: "No. If you can cut along a line and sew a straight seam, you can start. Fit is described in plain words, and every piece is labelled with grainlines and notches.",
  },
  {
    // TO CONFIRM against how the app actually handles data before launch
    q: "What happens to my photos and measurements?",
    a: "They're used to draft your patterns and are kept in your account. You can delete a photo or a body whenever you like.",
  },
];

function Item({ n, q, a, open, onToggle }: { n: number; q: string; a: string; open: boolean; onToggle: () => void }) {
  const id = useId();
  return (
    <li data-up className={`fq-item ${open ? "is-open" : ""}`}>
      <span className="fq-notch is-a" aria-hidden="true" />
      <span className="fq-notch is-b" aria-hidden="true" />
      <h3>
        <button type="button" className="fq-q" aria-expanded={open} aria-controls={id} onClick={onToggle}>
          <span className="fq-n">{String(n).padStart(2, "0")}</span>
          <span className="fq-q__t">{q}</span>
          <span className="fq-icon" aria-hidden="true" />
        </button>
      </h3>
      <div id={id} className="fq-a" role="region" aria-label={q}>
        <div className="fq-a__in">
          <span className="fq-stitch" aria-hidden="true" />
          <p>{a}</p>
        </div>
      </div>
    </li>
  );
}

export function Faq() {
  const root = useRef<HTMLElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const [open, setOpen] = useState(0);
  useReveals(root);

  // the scissors cut down the line as you read
  useEffect(() => {
    const el = list.current;
    const sc = root.current?.querySelector<HTMLElement>(".fq-cut");
    if (!el || !sc) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        sc,
        { "--cut": 0 },
        { "--cut": 1, ease: "none", scrollTrigger: { trigger: el, start: "top 70%", end: "bottom 60%", scrub: true } },
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="faq" data-nav="FAQ" data-wing="perch" data-theme-zone="light" className="fq" aria-labelledby="fq-title">
      <div className="fq-grid">
        <header className="fq-head" data-reveal>
          <p className="fq-eyebrow">
            <span className="line-mask inline-block">
              <span data-rise className="inline-block">
                FAQ
              </span>
            </span>
          </p>
          <h2 id="fq-title" className="fq-title">
            <span className="line-mask">
              <span data-rise className="block">
                Before
              </span>
            </span>
            <span className="line-mask">
              <span data-rise className="block">
                <em>you cut.</em>
              </span>
            </span>
          </h2>
        </header>

        <div className="fq-body">
          <div className="fq-cut" aria-hidden="true">
            <span className="fq-cut__done" />
            <svg viewBox="0 0 24 24" className="fq-cut__sc" fill="none">
              <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8.6 7.6 20 16M8.6 16.4 20 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <ol ref={list} className="fq-list" data-reveal="top 80%">
            {QA.map((x, i) => (
              <Item key={x.q} n={i + 1} q={x.q} a={x.a} open={open === i} onToggle={() => setOpen((o) => (o === i ? -1 : i))} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
