"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MAKES } from "./MadeWith";
import { scrollToElement } from "./SmoothScroll";

gsap.registerPlugin(ScrollTrigger);

/* Top-right section label (178 x 44 in the frame). Shows the name of the
   section in view. Click opens a list of every section; pick one to scroll
   there. Sections opt in with data-nav="Label". It sits under the hero's
   announcement bar while that shows (.section-nav in globals.css). */
const SECTIONS = [
  { id: "top", label: "Introduction" },
  { id: "photo", label: "Photo to pattern" },
  { id: "how", label: "How it works" },
  { id: "features", label: "Features" },
  { id: "make", label: "What you can make" },
  ...(MAKES.length ? [{ id: "made", label: "Made with Venty" }] : []),
  { id: "faq", label: "FAQ" },
  { id: "maker", label: "Meet the maker" },
  { id: "table", label: "The table" },
];

export function SectionNav() {
  const sections = SECTIONS;
  const [current, setCurrent] = useState(SECTIONS[0].label);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = gsap.utils.toArray<HTMLElement>("[data-nav]");
    const triggers = els.map((e) =>
      ScrollTrigger.create({
        trigger: e,
        start: "top 50%",
        end: "bottom 50%",
        onToggle: (self) => {
          if (self.isActive) setCurrent(e.dataset.nav!);
        },
      }),
    );
    const onDoc = (ev: PointerEvent) => {
      if (ref.current && !ref.current.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => {
      triggers.forEach((t) => t.kill());
      document.removeEventListener("pointerdown", onDoc);
    };
  }, []);

  const go = (id: string) => {
    setOpen(false);
    const target = document.getElementById(id);
    if (target) scrollToElement(target);
  };

  return (
    <div ref={ref} className="section-nav fixed z-[70]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="hero-glass flex items-center"
        style={{ height: 44, minWidth: 178, padding: "11px 32px", gap: 16 }}
      >
        <span className="hero-t16 relative block h-[20px] shrink-0 overflow-hidden whitespace-nowrap py-[2px] text-periwinkle">
          <span key={current} className="section-nav__label block">{current}</span>
        </span>
        <span className="ml-auto flex flex-col items-center" style={{ width: 12, gap: 8 }} aria-hidden="true">
          <svg width="12" height="6" viewBox="0 0 12 6" fill="none" className={`transition-transform duration-500 ease-[var(--ease-out-expo)] ${open ? "translate-y-[2px]" : ""}`}>
            <path d="M1 5.5 6 .5l5 5" stroke="var(--color-periwinkle)" strokeWidth="1" />
          </svg>
          <svg width="12" height="6" viewBox="0 0 12 6" fill="none" className={`transition-transform duration-500 ease-[var(--ease-out-expo)] ${open ? "-translate-y-[2px]" : ""}`}>
            <path d="M1 .5 6 5.5l5-5" stroke="var(--color-periwinkle)" strokeWidth="1" />
          </svg>
        </span>
      </button>

      <div
        role="listbox"
        aria-label="Sections"
        className={`hero-glass section-nav__panel absolute right-0 top-[52px] flex min-w-[220px] flex-col overflow-hidden transition-all duration-500 ease-[var(--ease-out-expo)] ${
          open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        }`}
        style={{ padding: 6 }}
      >
        {sections.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="option"
            aria-selected={s.label === current}
            onClick={() => go(s.id)}
            className={`hero-t16 flex items-center justify-between gap-8 whitespace-nowrap rounded-[2px] px-[26px] py-[11px] text-left transition-colors hover:bg-cloud/10 ${
              s.label === current ? "text-cloud" : "text-periwinkle hover:text-cloud"
            }`}
          >
            <span>{s.label}</span>
            <span className="font-display text-[13px] text-steel">{String(i + 1).padStart(2, "0")}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
