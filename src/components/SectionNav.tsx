"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* Top-left section label from the Figma frame (178 x 44 at 26, 34).
   Shows the name of the section in view. Click opens a list of every
   section; pick one to scroll there. Sections opt in with data-nav="Label". */
const SECTIONS = [
  { id: "top", label: "Introduction" },
  { id: "why", label: "Why Venty" },
  { id: "how", label: "How it works" },
  { id: "measure", label: "Try the tape" },
  { id: "sizes", label: "No sizes" },
  { id: "features", label: "Inside" },
  { id: "cta", label: "Start" },
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
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div ref={ref} className="section-nav fixed z-50" style={{ left: "clamp(16px, 1.806vw, 26px)", top: "clamp(16px, 2.36vw, 34px)" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="hero-glass flex items-center"
        style={{ height: 44, minWidth: 178, padding: "11px 32px", gap: 16 }}
      >
        <span className="hero-t16 relative block h-[16px] overflow-hidden text-periwinkle">
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
        className={`hero-glass section-nav__panel absolute left-0 top-[52px] flex min-w-[220px] flex-col overflow-hidden transition-all duration-500 ease-[var(--ease-out-expo)] ${
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
