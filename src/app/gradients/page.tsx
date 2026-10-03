"use client";

import { useCallback, useEffect, useState } from "react";
import { Sky, LIGHT, PURPLE, DARK, type SkyConcept } from "@/components/Sky";

/* Gradient concepts in three families. Click a tile to view it full
   screen. In the viewer: back arrow top-left, previous and next arrows at
   the sides, keyboard arrows and Escape work too. */

const FAMILIES: { key: string; title: string; eyebrow: string; items: SkyConcept[] }[] = [
  { key: "light", title: "Crown", eyebrow: "Light, locked", items: LIGHT },
  { key: "purple", title: "Haze", eyebrow: "Purple, locked", items: PURPLE },
  { key: "dark", title: "Five dark concepts", eyebrow: "Dark", items: DARK },
];

function Tile({ c, label, onOpen }: { c: SkyConcept; label: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative aspect-[9/16] overflow-hidden rounded-2xl text-left ring-1 ring-cloud/10 transition-transform duration-500 ease-[var(--ease-out-expo)] hover:scale-[1.02]"
    >
      <Sky variant={c.v} />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="font-display text-2xl leading-none text-cloud">{label}</p>
        <p className="hero-t16 mt-2 text-cloud">{c.name}</p>
        <p className="hero-t12 mt-1 text-cloud/70">{c.note}</p>
      </div>
    </button>
  );
}

function Arrow({ dir, onClick, label }: { dir: "left" | "right" | "back"; onClick: () => void; label: string }) {
  const path = dir === "right" ? "M9 5l7 7-7 7" : "M15 5l-7 7 7 7";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      className="hero-glass grid h-12 w-12 place-items-center rounded-full text-cloud transition-transform duration-300 hover:scale-105"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
        {dir === "back" && <path d="M8 12h12" />}
      </svg>
    </button>
  );
}

export default function Gradients() {
  const [open, setOpen] = useState<{ fam: number; idx: number } | null>(null);

  const step = useCallback(
    (d: number) => {
      setOpen((o) => {
        if (!o) return o;
        const n = FAMILIES[o.fam].items.length;
        return { fam: o.fam, idx: (o.idx + d + n) % n };
      });
    },
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  const current = open ? FAMILIES[open.fam].items[open.idx] : null;

  return (
    <main className="min-h-screen bg-night px-5 py-10 text-cloud md:px-10">
      {FAMILIES.map((f, fi) => (
        <section key={f.key} className={fi > 0 ? "mt-16" : ""}>
          <p className="hero-t12 uppercase text-periwinkle">{f.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-normal tracking-[-0.03em]">{f.title}</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
            {f.items.map((c, i) => (
              <Tile key={c.v} c={c} label={f.items.length === 1 ? (f.key === "light" ? "L" : "P") : `0${i + 1}`} onOpen={() => setOpen({ fam: fi, idx: i })} />
            ))}
          </div>
        </section>
      ))}

      {open && current && (
        <div className="fixed inset-0 z-[100]">
          <Sky variant={current.v} />
          <div className="absolute left-5 top-5 flex items-center gap-4 md:left-8 md:top-8">
            <Arrow dir="back" label="Back to all gradients" onClick={() => setOpen(null)} />
            <div>
              <p className="hero-t12 uppercase text-cloud/70">{FAMILIES[open.fam].eyebrow}</p>
              <p className="hero-t16 text-cloud">
                {current.name}
                {FAMILIES[open.fam].items.length > 1 && (
                  <span className="font-display ml-3 text-cloud/70">
                    0{open.idx + 1} / 0{FAMILIES[open.fam].items.length}
                  </span>
                )}
              </p>
            </div>
          </div>
          {FAMILIES[open.fam].items.length > 1 && (
            <>
              <div className="absolute left-5 top-1/2 -translate-y-1/2 md:left-8">
                <Arrow dir="left" label="Previous gradient" onClick={() => step(-1)} />
              </div>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 md:right-8">
                <Arrow dir="right" label="Next gradient" onClick={() => step(1)} />
              </div>
            </>
          )}
          <p className="hero-t12 absolute bottom-6 left-1/2 max-w-md -translate-x-1/2 text-center text-cloud/70">{current.note}</p>
        </div>
      )}
    </main>
  );
}
