"use client";

import Link from "next/link";
import { EXPERIMENTS } from "./experiments";
import { useGlow } from "./_components/useGlow";

/* The lab: every experiment is a backlit tile. The light follows your
   pointer (or drifts on its own on a phone). Tap a tile to open it. */

const pad = (n: number) => String(n).padStart(2, "0");

export default function Lab() {
  const field = useGlow<HTMLDivElement>({ reach: (w) => w * 0.75, follow: true });

  return (
    <main className="mx-auto max-w-[1200px] px-4 pb-24 pt-10 sm:px-8 md:pt-16">
      <header className="lab-in flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="lab-eyebrow text-[var(--periwinkle)]">Venty · Laboratory</p>
          <h1 className="lab-display mt-3 text-[clamp(3rem,10vw,6.5rem)] leading-[0.85]">The lab</h1>
        </div>
        <p className="max-w-[34ch] text-[15px] leading-snug text-[var(--periwinkle)]">
          Every test and study for the page in one place. Open one, then use the arrows to move between them.
        </p>
      </header>

      <div ref={field} className="glow-field relative mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:mt-14 md:grid-cols-3">
        {EXPERIMENTS.map((e, i) => (
          <Link
            key={e.slug}
            href={`/lab/${e.slug}`}
            data-glow
            className="glow-tile lab-in lab-focus block aspect-square hover:scale-[0.985] active:scale-[0.97]"
            style={{ animationDelay: `${80 + i * 60}ms` }}
          >
            <span className="glow-label glow-label--v">
              Nº {pad(e.no)} · {e.date}
            </span>
            <span className="glow-label absolute right-[10%] top-[10%] text-[10px] uppercase tracking-[0.18em]">{e.tag}</span>
            <span className="lab-display pointer-events-none absolute bottom-[22%] right-[10%] z-[2] text-[clamp(2.5rem,9vw,5.5rem)] leading-none opacity-[calc(0.08+var(--g)*0.22)]">
              {pad(e.no)}
            </span>
            <span className="glow-label glow-label--b text-[clamp(13px,1.6vw,17px)]">
              <i>{e.kind === "native" ? "▲" : "▼"}</i>
              {e.title}
            </span>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-[13px] text-[var(--steel)]">
        ▲ built in the lab · ▼ a page from the site, shown in a frame
      </p>
    </main>
  );
}
