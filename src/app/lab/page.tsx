import Link from "next/link";
import { EXPERIMENTS } from "./experiments";

/* The lab: plain, quick cards, one per experiment. No effects, no
   client script, so they respond the moment you tap. */

const pad = (n: number) => String(n).padStart(2, "0");

export default function Lab() {
  return (
    <main className="mx-auto max-w-[1100px] px-4 pb-20 pt-10 sm:px-8 md:pt-14">
      <p className="lab-eyebrow text-[var(--periwinkle)]">Venty · Laboratory</p>
      <h1 className="lab-display mt-2 text-[clamp(2.5rem,7vw,4.5rem)] leading-[0.9]">The lab</h1>

      <ul className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {EXPERIMENTS.map((e) => (
          <li key={e.slug}>
            <Link href={`/lab/${e.slug}`} className="lab-card lab-focus">
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-[17px]">{e.title}</span>
                <span className="shrink-0 text-[11px] tabular-nums text-[var(--steel)]">Nº {pad(e.no)}</span>
              </span>
              <span className="mt-1 block text-[13px] leading-snug text-[var(--periwinkle)]">{e.note}</span>
              <span className="mt-3 flex gap-2 text-[10px] uppercase tracking-[0.16em] text-[var(--steel)]">
                <span>{e.tag}</span>
                <span>·</span>
                <span>{e.date}</span>
                {e.kind === "frame" && (
                  <>
                    <span>·</span>
                    <span>Site page</span>
                  </>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
