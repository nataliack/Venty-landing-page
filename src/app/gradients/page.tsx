"use client";

import { useEffect, useState } from "react";
import { Sky, DARK_VARIANTS, type SkyVariant } from "@/components/Sky";

/* Gradient concepts. The light sky is locked. The dark row is being
   chosen. Click a tile to see it full screen, Escape or click to return. */
function Tile({ v, name, note, label, onOpen }: { v: SkyVariant; name: string; note: string; label: string; onOpen: (v: SkyVariant, name: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(v, name)}
      className="group relative aspect-[9/16] overflow-hidden rounded-2xl text-left ring-1 ring-cloud/10 transition-transform duration-500 ease-[var(--ease-out-expo)] hover:scale-[1.02]"
    >
      <Sky variant={v} />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="font-display text-2xl leading-none text-cloud">{label}</p>
        <p className="hero-t16 mt-2 text-cloud">{name}</p>
        <p className="hero-t12 mt-1 text-cloud/70">{note}</p>
      </div>
    </button>
  );
}

export default function Gradients() {
  const [full, setFull] = useState<{ v: SkyVariant; name: string } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFull(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="min-h-screen bg-night px-5 py-10 text-cloud md:px-10">
      <section>
        <p className="hero-t12 uppercase text-periwinkle">Light sky, locked</p>
        <h1 className="mt-2 text-3xl font-normal tracking-[-0.03em]">Crown</h1>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
          <Tile v="light" label="L" name="Crown" note="Light from the top centre, blue halo rising from below. Used by the app Welcome screen." onOpen={(v, name) => setFull({ v, name })} />
        </div>
      </section>

      <section className="mt-16">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="hero-t12 uppercase text-periwinkle">Dark sky</p>
            <h2 className="mt-2 text-3xl font-normal tracking-[-0.03em]">Five concepts for the landing page</h2>
          </div>
          <p className="hero-t16 max-w-sm text-right text-periwinkle">
            Same four-light structure and timing as Crown. Night is the base everywhere.
          </p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
          {DARK_VARIANTS.map((s, i) => (
            <Tile key={s.v} v={s.v} label={`0${i + 1}`} name={s.name} note={s.note} onOpen={(v, name) => setFull({ v, name })} />
          ))}
        </div>
      </section>

      {full && (
        <button
          type="button"
          onClick={() => setFull(null)}
          className="fixed inset-0 z-[100] cursor-zoom-out"
          aria-label="Close full screen preview"
        >
          <Sky variant={full.v} />
          <span className="absolute left-6 top-6 hero-t16 text-cloud/80">{full.name}</span>
        </button>
      )}
    </main>
  );
}
