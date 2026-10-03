"use client";

import { useEffect, useState } from "react";
import { Sky, SKY_VARIANTS, type SkyVariant } from "@/components/Sky";

/* Gradient concepts side by side. Click a tile to see it full screen,
   press Escape or click again to come back. */
export default function Gradients() {
  const [full, setFull] = useState<SkyVariant | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFull(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="min-h-screen bg-night px-5 py-10 text-cloud md:px-10">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="hero-t12 uppercase text-periwinkle">Light sky</p>
          <h1 className="mt-2 text-3xl font-normal tracking-[-0.03em]">Five gradient concepts</h1>
        </div>
        <p className="hero-t16 max-w-sm text-right text-periwinkle">
          Same colour family as the app. Motion slowed to 30 to 45 second cycles with smaller travel. Click one to view it full screen.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-5">
        {SKY_VARIANTS.map((s) => (
          <button
            key={s.v}
            type="button"
            onClick={() => setFull(s.v)}
            className="group relative aspect-[9/16] overflow-hidden rounded-2xl text-left ring-1 ring-cloud/10 transition-transform duration-500 ease-[var(--ease-out-expo)] hover:scale-[1.02]"
          >
            <Sky variant={s.v} />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="font-display text-2xl leading-none text-cloud">0{s.v}</p>
              <p className="hero-t16 mt-2 text-cloud">{s.name}</p>
              <p className="hero-t12 mt-1 text-cloud/70">{s.note}</p>
            </div>
          </button>
        ))}
      </div>

      {full && (
        <button
          type="button"
          onClick={() => setFull(null)}
          className="fixed inset-0 z-[100] cursor-zoom-out"
          aria-label="Close full screen preview"
        >
          <Sky variant={full} />
          <span className="absolute left-6 top-6 flex items-baseline gap-3">
            <span className="font-display text-3xl text-cloud">0{full}</span>
            <span className="hero-t16 text-cloud/80">{SKY_VARIANTS[full - 1].name}</span>
          </span>
        </button>
      )}
    </main>
  );
}
