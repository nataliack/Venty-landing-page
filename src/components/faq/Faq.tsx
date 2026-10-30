"use client";

import { useId, useRef, useState } from "react";
import { useReveals } from "@/lib/useReveals";
import "./faq.css";

/* 7. FAQ (light). "Before you cut." Ported from the lab's Pattern lines
   (src/app/lab/_components/sections/faq/FaqConcepts.tsx), React Bits' FAQ 4
   open, in Venty's colours: no cards, the questions float between guide
   lines, every one a dash and a dot (as a pattern is marked), the guides
   fading out top and bottom. Behind it all the app's graph paper (its light
   hero's grid, venty-app globals.css .light-mat), at half strength, mostly
   low down.

   At the end, empty room for the dark edge of Meet the maker to rise
   through (docs/motion.md, hand-offs).

   Every answer is something the page already says (How it works,
   Features); nothing new is promised. */

const QA = [
  {
    q: "How accurate is the fit?",
    a: "As accurate as the measurements you give it. Venty drafts every piece from your numbers, and each measure shows where the tape goes. For anything close-fitting, sew a quick test version first, adjust your body in Venty and draft again.",
  },
  {
    q: "Which measurements do I need?",
    a: "Four to start: bust, waist, hips and back length. Venty shows you where the tape goes for each one. Add more whenever you want a closer fit.",
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
    q: "Can I start from a photo?",
    a: "Yes. Upload a photo of a garment you love, or describe it in a sentence. Circle what you like on the photo and pin a note, and Venty reads your marks.",
  },
  {
    q: "Can I change the design once it's drafted?",
    a: "Yes. Say what to change the way you'd say it, like longer sleeves, and Venty redrafts the pieces. Every version is kept with its notes.",
  },
  {
    q: "How do I print my pattern?",
    a: "On A4 at home, or A0 at a print shop. Move the pieces round the sheet to use less paper. The A4 pages come with a map for taping them together.",
  },
  {
    // TO CONFIRM against how the app actually handles data before launch
    q: "What happens to my photos and measurements?",
    a: "They're used to draft your patterns and are kept in your account. You can delete a photo or a body whenever you like.",
  },
];

function Row({ n, q, a, open, onToggle }: { n: number; q: string; a: string; open: boolean; onToggle: () => void }) {
  const id = useId();
  return (
    <div data-up className={`fq-row ${open ? "is-open" : ""}`}>
      <h3>
        <button type="button" className="fq-q" aria-expanded={open} aria-controls={id} onClick={onToggle}>
          <span className="fq-n">Q{n}</span>
          <span className="fq-t">{q}</span>
          <span className="fq-btn" aria-hidden="true" />
        </button>
      </h3>
      <div id={id} className="fq-a" role="region" aria-label={q}>
        <div className="fq-a__in">
          <p>{a}</p>
        </div>
      </div>
    </div>
  );
}

export function Faq() {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(0);
  useReveals(root);

  return (
    <section ref={root} id="faq" data-nav="FAQ" data-wing="perch" data-theme-zone="light" className="fq" aria-labelledby="fq-title">
      <div className="fq-paper" aria-hidden="true" />
      <div className="fq-frame">
        {/* the guides, fading out top and bottom */}
        <div className="fq-guides" aria-hidden="true">
          <span className="fq-guide is-l" />
          <span className="fq-guide is-m" />
          <span className="fq-guide is-r" />
        </div>

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
                you cut.
              </span>
            </span>
          </h2>
          <p data-up className="fq-body">
            The questions people ask before their first pattern.
          </p>
        </header>

        <div className="fq-list" data-reveal="top 82%">
          {QA.map((x, i) => (
            <Row key={x.q} n={i + 1} q={x.q} a={x.a} open={open === i} onToggle={() => setOpen((o) => (o === i ? -1 : i))} />
          ))}
        </div>
      </div>
    </section>
  );
}
